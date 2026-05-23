(function () {
  var instances = new WeakMap();

  function asBool(value, fallback) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    return String(value).toLowerCase() === 'true' || String(value) === '1';
  }

  function log(container, message, isError) {
    var target = container.querySelector('[data-video-status], [data-incontent-status]');
    if (!target) {
      return;
    }
    target.classList.toggle('pub-video-error', Boolean(isError));
    target.textContent = message;
  }

  function replaceOrAddParam(url, name, value) {
    var encodedValue = encodeURIComponent(value);
    var pattern = new RegExp('([?&])' + name + '=([^&]*)');
    if (pattern.test(url)) {
      return url.replace(pattern, '$1' + name + '=' + encodedValue);
    }
    return url + (url.indexOf('?') === -1 ? '?' : '&') + name + '=' + encodedValue;
  }

  function normalizeAdTagUrl(url, container) {
    var pageUrl = container.getAttribute('data-description-url') || window.location.href;
    var encodedPageUrl = encodeURIComponent(pageUrl);
    var timestamp = String(Date.now() + Math.floor(Math.random() * 1000000));
    var normalized = url
      .replaceAll('[placeholder]', encodedPageUrl)
      .replaceAll('[page_url]', encodedPageUrl)
      .replaceAll('%5Bpage_url%5D', encodedPageUrl)
      .replaceAll('__timestamp__', timestamp)
      .replaceAll('[timestamp]', timestamp);
    normalized = replaceOrAddParam(normalized, 'description_url', pageUrl);
    normalized = replaceOrAddParam(normalized, 'url', pageUrl);
    normalized = replaceOrAddParam(normalized, 'correlator', timestamp);
    return normalized;
  }

  function getFallbackElement(container) {
    var selector = container.getAttribute('data-fallback-selector');
    if (!selector) {
      return null;
    }
    var source = document.querySelector(selector);
    if (!source) {
      return null;
    }
    if (source.tagName && source.tagName.toLowerCase() === 'template') {
      return document.importNode(source.content, true);
    }
    var clone = source.cloneNode(true);
    clone.removeAttribute('id');
    clone.hidden = false;
    clone.style.display = '';
    clone.removeAttribute('aria-hidden');
    return clone;
  }

  function showFallback(container, instance, reason) {
    if (container.classList.contains('is-fallback-shown')) {
      return true;
    }
    if (!asBool(container.getAttribute('data-fallback-on-no-ad'), false)) {
      return false;
    }
    var fallback = getFallbackElement(container);
    if (!fallback) {
      return false;
    }
    container.classList.add('is-fallback-shown');
    container.classList.remove('is-loading', 'is-ad-playing', 'is-ad-completed');
    container.classList.add('has-fallback-content');
    container.setAttribute('data-fallback-reason', reason || 'no-ad');
    if (instance) {
      instance.destroy();
    }
    container.replaceChildren(fallback);
    return true;
  }

  function makePlayhead(duration) {
    return {
      currentTime: 0,
      duration: duration || 30
    };
  }

  function create(container) {
    if (instances.has(container)) {
      return instances.get(container);
    }
    if (!window.google || !window.google.ima) {
      log(container, 'Google IMA SDK not available', true);
      return null;
    }
    var adTagUrl = container.getAttribute('data-ad-tag-url');
    if (!adTagUrl) {
      log(container, 'Missing data-ad-tag-url', true);
      return null;
    }
    var media = container.querySelector('[data-incontent-media]') || container.querySelector('.pub-incontent-ad__media') || container;
    var width = Number(container.getAttribute('data-ad-width') || media.clientWidth || container.clientWidth || 640);
    var height = Number(container.getAttribute('data-ad-height') || Math.round(width * 9 / 16) || 360);
    var timeoutMs = Number(container.getAttribute('data-no-ad-timeout') || 6500);
    var hasAdStarted = false;
    var hasFinished = false;
    var timeoutId = null;
    var adsLoader = null;
    var adsManager = null;
    var adDisplayContainer = null;
    var normalizedAdTagUrl = normalizeAdTagUrl(adTagUrl, container);
    var clickToStart = asBool(container.getAttribute('data-click-to-start'), false);
    var startButton = container.querySelector('[data-incontent-start]');
    var instance = {
      start: start,
      destroy: destroy,
      getAdTagUrl: function () {
        return normalizedAdTagUrl;
      }
    };

    function clearTimer() {
      if (!timeoutId) {
        return;
      }
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }

    function startTimer() {
      clearTimer();
      if (!asBool(container.getAttribute('data-fallback-on-no-ad'), false)) {
        return;
      }
      timeoutId = window.setTimeout(function () {
        if (!hasAdStarted && !hasFinished) {
          showFallback(container, instance, 'timeout');
        }
      }, timeoutMs);
    }

    function onAdError(event) {
      clearTimer();
      var message = 'IMA ad error';
      if (event && event.getError) {
        message = event.getError().toString();
      }
      log(container, message, true);
      showFallback(container, instance, 'ad-error');
    }

    function onAdsManagerLoaded(event) {
      clearTimer();
      var settings = new google.ima.AdsRenderingSettings();
      settings.restoreCustomPlaybackStateOnAdBreakComplete = false;
      adsManager = event.getAdsManager(makePlayhead(Number(container.getAttribute('data-video-duration') || 30)), settings);
      adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
      adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, function () {
        hasAdStarted = true;
        container.classList.remove('is-loading');
        container.classList.add('is-ad-playing');
        log(container, 'Ad started');
      });
      adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdFinished);
      adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdFinished);
      adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED, onAdFinished);
      try {
        adsManager.init(width, height, google.ima.ViewMode.NORMAL);
        adsManager.start();
      } catch (error) {
        log(container, error && error.message ? error.message : 'IMA start failed', true);
        showFallback(container, instance, 'start-error');
      }
    }

    function onAdFinished() {
      if (hasFinished) {
        return;
      }
      hasFinished = true;
      clearTimer();
      container.classList.remove('is-loading', 'is-ad-playing');
      container.classList.add('is-ad-completed');
      log(container, 'Ad completed. Incontent slot finished.');
      if (adsManager) {
        try {
          adsManager.destroy();
        } catch (error) {}
      }
      if (asBool(container.getAttribute('data-keep-slot-after-complete'), true)) {
        return;
      }
      if (asBool(container.getAttribute('data-fallback-after-complete'), false)) {
        showFallback(container, instance, 'complete');
      }
    }

    function requestAds() {
      var request = new google.ima.AdsRequest();
      request.adTagUrl = normalizedAdTagUrl;
      request.linearAdSlotWidth = width;
      request.linearAdSlotHeight = height;
      request.nonLinearAdSlotWidth = width;
      request.nonLinearAdSlotHeight = Math.round(height / 3);
      if (google.ima.ImaSdkSettings && google.ima.ImaSdkSettings.VpaidMode) {
        google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.ENABLED);
      }
      container.classList.add('is-loading');
      log(container, 'Ad request sent');
      startTimer();
      adsLoader.requestAds(request);
    }

    function start() {
      if (hasFinished || container.classList.contains('is-fallback-shown')) {
        return;
      }
      if (!adDisplayContainer) {
        adDisplayContainer = new google.ima.AdDisplayContainer(media);
        adsLoader = new google.ima.AdsLoader(adDisplayContainer);
        adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded, false);
        adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);
      }
      try {
        adDisplayContainer.initialize();
      } catch (error) {}
      requestAds();
    }

    function destroy() {
      clearTimer();
      if (adsManager) {
        try {
          adsManager.destroy();
        } catch (error) {}
      }
      if (adsLoader) {
        try {
          adsLoader.destroy();
        } catch (error) {}
      }
      instances.delete(container);
    }

    container.classList.add('is-incontent-ima-direct');
    log(container, clickToStart ? 'Ready. Press play to request ad.' : 'Waiting for viewport initialization');
    if (startButton) {
      startButton.addEventListener('click', start);
    }
    instances.set(container, instance);
    if (!clickToStart) {
      start();
    }
    return instance;
  }

  function initAll(root) {
    var scope = root || document;
    var containers = Array.prototype.slice.call(scope.querySelectorAll('[data-publisher-incontent-ad]'));
    if (!window.IntersectionObserver) {
      containers.forEach(create);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        create(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '600px 0px',
      threshold: 0.01
    });
    containers.forEach(function (container) {
      observer.observe(container);
    });
  }

  window.PublisherIncontentIma = {
    init: initAll,
    create: create,
    get: function (container) {
      return instances.get(container) || null;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAll(document);
    });
  } else {
    initAll(document);
  }
})();
