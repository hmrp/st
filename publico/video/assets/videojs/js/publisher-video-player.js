(function () {
  var instances = new WeakMap();
  var blankContentSrc = 'assets/videojs/media/blank-content.mp4';

  function asBool(value, fallback) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    return String(value).toLowerCase() === 'true' || String(value) === '1';
  }

  function getMode(container) {
    if (asBool(container.getAttribute('data-ad-only'), false)) {
      return 'ad-only';
    }
    if (!container.getAttribute('data-video-src')) {
      return 'ad-only';
    }
    return 'content';
  }

  function getSource(container) {
    var mode = getMode(container);
    if (mode === 'ad-only') {
      return {
        src: container.getAttribute('data-ad-only-content-src') || blankContentSrc,
        type: container.getAttribute('data-ad-only-content-type') || 'video/mp4'
      };
    }
    return {
      src: container.getAttribute('data-video-src'),
      type: container.getAttribute('data-video-type') || 'application/x-mpegURL'
    };
  }

  function log(container, message, isError) {
    var target = container.querySelector('[data-video-status]');
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

  function normalizeDirectAdTag(url, container) {
    var descriptionUrl = container.getAttribute('data-description-url') || window.location.href;
    var normalized = url.replace('[placeholder]', encodeURIComponent(descriptionUrl));
    normalized = replaceOrAddParam(normalized, 'description_url', descriptionUrl);
    normalized = replaceOrAddParam(normalized, 'correlator', String(Date.now()));
    normalized = normalized.replace('__timestamp__', String(Date.now()));
    normalized = normalized.replace('[timestamp]', String(Date.now()));
    normalized = normalized.replace('__item-duration__', container.getAttribute('data-video-duration') || (getMode(container) === 'ad-only' ? '30' : '120'));
    return normalized;
  }

  function buildAdTagFromDataset(container) {
    var directTag = container.getAttribute('data-ad-tag-url');
    if (directTag) {
      return normalizeDirectAdTag(directTag, container);
    }
    var adUnitPath = container.getAttribute('data-gam-ad-unit');
    if (!adUnitPath || !window.PublisherGamAdTagBuilder) {
      return '';
    }
    return window.PublisherGamAdTagBuilder.build({
      adUnitPath: adUnitPath,
      descriptionUrl: container.getAttribute('data-description-url') || window.location.href,
      size: container.getAttribute('data-ad-size') || '1x1|1x1|300x1|300x250|640x360|640x360',
      output: container.getAttribute('data-ad-output') || 'vast'
    });
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

  function showFallback(container, player, reason) {
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
    container.setAttribute('data-fallback-reason', reason || 'no-ad');
    if (player && !player.isDisposed()) {
      player.pause();
      if (asBool(container.getAttribute('data-dispose-on-fallback'), true)) {
        player.dispose();
      }
    }
    container.replaceChildren(fallback);
    container.classList.remove('is-loading', 'is-ad-playing', 'is-collapsed');
    container.classList.add('has-fallback-content');
    return true;
  }

  function finishAdOnly(container, player, message, isError) {
    if (container.classList.contains('is-ad-only-finished')) {
      return;
    }
    container.classList.remove('is-ad-playing');
    container.classList.add('is-ad-only-finished');
    if (player && !player.isDisposed()) {
      player.pause();
      player.controls(false);
    }
    log(container, message, isError);
    if (asBool(container.getAttribute('data-collapse-on-ad-end'), true)) {
      window.setTimeout(function () {
        container.classList.add('is-collapsed');
        if (player && !player.isDisposed() && asBool(container.getAttribute('data-dispose-on-ad-end'), true)) {
          player.dispose();
        }
      }, Number(container.getAttribute('data-collapse-delay') || 800));
    }
  }

  function attachEvents(container, player, mode) {
    var adStarted = false;
    var noAdTimer = null;

    function clearNoAdTimer() {
      if (!noAdTimer) {
        return;
      }
      window.clearTimeout(noAdTimer);
      noAdTimer = null;
    }

    function startNoAdTimer() {
      clearNoAdTimer();
      if (!asBool(container.getAttribute('data-fallback-on-no-ad'), false)) {
        return;
      }
      noAdTimer = window.setTimeout(function () {
        if (!adStarted) {
          showFallback(container, player, 'timeout');
        }
      }, Number(container.getAttribute('data-no-ad-timeout') || 6500));
    }
    player.on('loadstart', function () {
      if (mode === 'ad-only') {
        log(container, 'Ad-only mode ready. Waiting for ad request.');
        return;
      }
      log(container, 'Content loading');
    });
    player.on('loadedmetadata', function () {
      if (mode === 'ad-only') {
        return;
      }
      log(container, 'Content ready');
    });
    player.on('ads-request', function () {
      log(container, 'Ad request sent');
      startNoAdTimer();
    });
    player.on('ads-ad-started', function () {
      adStarted = true;
      clearNoAdTimer();
      container.classList.add('is-ad-playing');
      log(container, 'Ad started');
    });
    player.on('adend', function () {
      clearNoAdTimer();
      container.classList.remove('is-ad-playing');
      if (mode === 'ad-only') {
        finishAdOnly(container, player, 'Ad ended. Slot stopped.', false);
        return;
      }
      log(container, 'Ad ended');
    });
    player.on('adserror', function () {
      clearNoAdTimer();
      container.classList.remove('is-ad-playing');
      if (!adStarted && showFallback(container, player, 'adserror')) {
        return;
      }
      if (mode === 'ad-only') {
        finishAdOnly(container, player, 'Ad error or no ad fill. Slot stopped.', true);
        return;
      }
      log(container, 'Ad error. Content playback can continue.', true);
    });
    player.on('contentresumed', function () {
      clearNoAdTimer();
      container.classList.remove('is-ad-playing');
      if (mode === 'ad-only') {
        if (!adStarted && showFallback(container, player, 'contentresumed-no-ad')) {
          return;
        }
        finishAdOnly(container, player, adStarted ? 'Ad completed. No content source configured.' : 'No ad was played. Slot stopped.', false);
        return;
      }
      log(container, 'Content resumed');
    });
    player.on('ended', function () {
      clearNoAdTimer();
      if (mode === 'ad-only') {
        finishAdOnly(container, player, adStarted ? 'Ad ended. Slot stopped.' : 'Slot stopped.', false);
      }
    });
    player.on('error', function () {
      clearNoAdTimer();
      var error = player.error();
      var message = error && error.message ? error.message : 'Unknown playback error';
      if (mode === 'ad-only') {
        finishAdOnly(container, player, message, true);
        return;
      }
      log(container, message, true);
    });
    player.on('dispose', function () {
      clearNoAdTimer();
      instances.delete(container);
    });
  }

  function setupSticky(container) {
    if (!asBool(container.getAttribute('data-sticky'), false) || !window.IntersectionObserver) {
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        container.classList.toggle('is-floating', !entry.isIntersecting && window.scrollY > container.offsetTop);
      });
    }, {
      threshold: 0.2
    });
    observer.observe(container);
  }

  function createPlayer(container) {
    if (instances.has(container)) {
      return instances.get(container);
    }
    var video = container.querySelector('video');
    var source = getSource(container);
    var mode = getMode(container);
    if (!video || !source.src || !window.videojs) {
      return null;
    }
    container.setAttribute('data-resolved-player-mode', mode);
    container.classList.add('is-loading');
    var player = window.videojs(video, {
      controls: true,
      fluid: true,
      responsive: true,
      preload: container.getAttribute('data-preload') || 'metadata',
      autoplay: mode === 'ad-only',
      muted: mode === 'ad-only',
      poster: container.getAttribute('data-poster') || '',
      html5: {
        vhs: {
          overrideNative: !window.videojs.browser.IS_SAFARI
        }
      },
      sources: [source]
    });
    var adTagUrl = buildAdTagFromDataset(container);
    if (adTagUrl && player.ima) {
      player.ima({
        adTagUrl: adTagUrl,
        showCountdown: true,
        preventLateAdStart: true,
        vastLoadTimeout: Number(container.getAttribute('data-vast-timeout') || 5000),
        autoPlayAdBreaks: !asBool(container.getAttribute('data-manual-ad-breaks'), false),
        contribAdsSettings: {
          timeout: Number(container.getAttribute('data-ads-timeout') || 5000)
        }
      });
      player.one('play', function () {
        if (player.ima && player.ima.initializeAdDisplayContainer) {
          player.ima.initializeAdDisplayContainer();
        }
      });
    }
    player.ready(function () {
      container.classList.remove('is-loading');
      if (mode === 'ad-only') {
        log(container, 'Ad-only mode loaded. Press play or enable autoplay muted.');
      }
    });
    attachEvents(container, player, mode);
    setupSticky(container);
    instances.set(container, player);
    return player;
  }

  function initAll(root) {
    var scope = root || document;
    var containers = Array.prototype.slice.call(scope.querySelectorAll('[data-publisher-video]'));
    if (!window.IntersectionObserver) {
      containers.forEach(createPlayer);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        createPlayer(entry.target);
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

  window.PublisherVideoPlayer = {
    init: initAll,
    create: createPlayer,
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
