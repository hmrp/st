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
    if (window.console && console.log) {
      console[isError ? 'warn' : 'log']('[PublisherIncontentIMA]', message);
    }
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
      .replaceAll('[PAGE_URL]', encodedPageUrl)
      .replaceAll('%5Bpage_url%5D', encodedPageUrl)
      .replaceAll('%5BPAGE_URL%5D', encodedPageUrl)
      .replaceAll('__timestamp__', timestamp)
      .replaceAll('[timestamp]', timestamp)
      .replaceAll('[TIMESTAMP]', timestamp);
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
    container.classList.remove('is-loading', 'is-ad-playing', 'is-ad-completed', 'has-ad-loaded');
    container.classList.add('has-fallback-content');
    container.setAttribute('data-fallback-reason', reason || 'no-ad');
    if (instance) {
      instance.destroy();
    }
    container.replaceChildren(fallback);
    return true;
  }

  function ensureVideoElement(media) {
    var video = media.querySelector('[data-incontent-video]');
    if (!video) {
      video = document.createElement('video');
      video.setAttribute('data-incontent-video', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('muted', '');
      video.muted = true;
      video.preload = 'none';
      media.appendChild(video);
    }
    video.classList.add('pub-incontent-ad__video');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    video.controls = false;
    video.preload = 'none';
    return video;
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
    var video = ensureVideoElement(media);
    var width = Number(container.getAttribute('data-ad-width') || media.clientWidth || container.clientWidth || 640);
    var height = Number(container.getAttribute('data-ad-height') || Math.round(width * 9 / 16) || 360);
    var timeoutMs = Number(container.getAttribute('data-no-ad-timeout') || 6500);
    var startTimeoutMs = Number(container.getAttribute('data-ad-start-timeout') || 10000);
    var vastLoadTimeoutMs = Number(container.getAttribute('data-vast-load-timeout') || 8000);
    var hasAdStarted = false;
    var hasFinished = false;
    var hasRequested = false;
    var requestTimeoutId = null;
    var startTimeoutId = null;
    var adsLoader = null;
    var adsManager = null;
    var adDisplayContainer = null;
    var normalizedAdTagUrl = normalizeAdTagUrl(adTagUrl, container);
    var clickToStart = asBool(container.getAttribute('data-click-to-start'), false);
    var willAutoPlay = asBool(container.getAttribute('data-ad-will-autoplay'), !clickToStart);
    var willPlayMuted = asBool(container.getAttribute('data-ad-will-play-muted'), true);
    var startButton = container.querySelector('[data-incontent-start]');
    var instance = {
      start: start,
      destroy: destroy,
      getAdTagUrl: function () {
        return normalizedAdTagUrl;
      }
    };

    function clearRequestTimer() {
      if (requestTimeoutId) {
        window.clearTimeout(requestTimeoutId);
        requestTimeoutId = null;
      }
    }

    function clearStartTimer() {
      if (startTimeoutId) {
        window.clearTimeout(startTimeoutId);
        startTimeoutId = null;
      }
    }

    function clearTimers() {
      clearRequestTimer();
      clearStartTimer();
    }

    function startRequestTimer() {
      clearRequestTimer();
      if (!asBool(container.getAttribute('data-fallback-on-no-ad'), false)) {
        return;
      }
      requestTimeoutId = window.setTimeout(function () {
        if (!hasAdStarted && !hasFinished) {
          log(container, 'Ad request timeout', true);
          showFallback(container, instance, 'request-timeout');
        }
      }, timeoutMs);
    }

    function startAdStartTimer() {
      clearStartTimer();
      if (!asBool(container.getAttribute('data-fallback-on-no-ad'), false)) {
        return;
      }
      startTimeoutId = window.setTimeout(function () {
        if (!hasAdStarted && !hasFinished) {
          log(container, 'Ad loaded but did not start', true);
          showFallback(container, instance, 'start-timeout');
        }
      }, startTimeoutMs);
    }

    function onAdError(event) {
      clearTimers();
      var message = 'IMA ad error';
      if (event && event.getError) {
        message = event.getError().toString();
      }
      log(container, message, true);
      showFallback(container, instance, 'ad-error');
    }

    function bindAdEvents() {
      adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
      adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, function () {
        container.classList.add('has-ad-loaded');
        log(container, 'Ad loaded');
      });
      adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, function () {
        log(container, 'Ad break starting');
      });
      adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, function () {
        hasAdStarted = true;
        clearTimers();
        container.classList.remove('is-loading');
        container.classList.add('is-ad-playing');
        log(container, 'Ad started');
      });
      adsManager.addEventListener(google.ima.AdEvent.Type.FIRST_QUARTILE, function () {
        log(container, 'Ad first quartile');
      });
      adsManager.addEventListener(google.ima.AdEvent.Type.MIDPOINT, function () {
        log(container, 'Ad midpoint');
      });
      adsManager.addEventListener(google.ima.AdEvent.Type.THIRD_QUARTILE, function () {
        log(container, 'Ad third quartile');
      });
      adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdFinished);
      adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdFinished);
      adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED, onAdFinished);
      adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, function () {
        if (!hasFinished) {
          onAdFinished();
        }
      });
    }

    function onAdsManagerLoaded(event) {
      clearRequestTimer();
      container.classList.add('has-ads-manager');
      log(container, 'Ads manager loaded');
      var settings = new google.ima.AdsRenderingSettings();
      settings.restoreCustomPlaybackStateOnAdBreakComplete = false;
      settings.enablePreloading = true;
      try {
        adsManager = event.getAdsManager(video, settings);
        bindAdEvents();
        adsManager.init(width, height, google.ima.ViewMode.NORMAL);
        startAdStartTimer();
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
      clearTimers();
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
      if (hasRequested) {
        return;
      }
      hasRequested = true;
      var request = new google.ima.AdsRequest();
      request.adTagUrl = normalizedAdTagUrl;
      request.linearAdSlotWidth = width;
      request.linearAdSlotHeight = height;
      request.nonLinearAdSlotWidth = width;
      request.nonLinearAdSlotHeight = Math.round(height / 3);
      if (typeof request.setAdWillAutoPlay === 'function') {
        request.setAdWillAutoPlay(willAutoPlay);
      }
      if (typeof request.setAdWillPlayMuted === 'function') {
        request.setAdWillPlayMuted(willPlayMuted);
      }
      if (google.ima.ImaSdkSettings && google.ima.ImaSdkSettings.VpaidMode) {
        google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.ENABLED);
      }
      if (google.ima.settings && typeof google.ima.settings.setVastLoadTimeout === 'function') {
        google.ima.settings.setVastLoadTimeout(vastLoadTimeoutMs);
      }
      container.classList.add('is-loading');
      log(container, 'Ad request sent');
      startRequestTimer();
      adsLoader.requestAds(request);
    }

    function start() {
      if (hasFinished || container.classList.contains('is-fallback-shown') || hasRequested) {
        return;
      }
      if (!adDisplayContainer) {
        adDisplayContainer = new google.ima.AdDisplayContainer(media, video);
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
      clearTimers();
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
    media.style.minHeight = height + 'px';
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
