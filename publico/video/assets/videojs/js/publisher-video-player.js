(function () {
  var instances = new WeakMap();
  var blankContentSrc = 'assets/videojs/media/blank-content.mp4';

  function asBool(value, fallback) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    return String(value).toLowerCase() === 'true' || String(value) === '1';
  }

  function getAutoplay(container, mode) {
    if (mode === 'ad-only') {
      return true;
    }
    return asBool(container.getAttribute('data-autoplay'), false);
  }

  function getMuted(container, mode) {
    if (mode === 'ad-only') {
      return true;
    }
    return asBool(container.getAttribute('data-muted'), false);
  }

  function getVolume(container) {
    var raw = container.getAttribute('data-volume');
    if (raw === undefined || raw === null || raw === '') {
      return 1;
    }
    var value = Number(String(raw).replace(',', '.'));
    if (!isFinite(value)) {
      return 1;
    }
    if (value > 1) {
      value = value / 100;
    }
    return Math.max(0, Math.min(1, value));
  }

  function getMode(container) {
    if (asBool(container.getAttribute('data-ad-only'), false)) {
      return 'ad-only';
    }
    if (!container.getAttribute('data-video-src') && !container.getAttribute('data-playlist-src')) {
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

  function normalizeDirectAdTag(url, container, item) {
    var descriptionUrl = container.getAttribute('data-description-url') || window.location.href;
    var encodedDescriptionUrl = encodeURIComponent(descriptionUrl);
    var timestamp = String(Date.now() + Math.floor(Math.random() * 1000000));
    var duration = item && item.duration ? item.duration : container.getAttribute('data-video-duration') || (getMode(container) === 'ad-only' ? '30' : '120');
    var normalized = url
      .replaceAll('[placeholder]', encodedDescriptionUrl)
      .replaceAll('[page_url]', encodedDescriptionUrl)
      .replaceAll('%5Bpage_url%5D', encodedDescriptionUrl)
      .replaceAll('__timestamp__', timestamp)
      .replaceAll('[timestamp]', timestamp)
      .replaceAll('__item-duration__', duration);
    normalized = replaceOrAddParam(normalized, 'description_url', descriptionUrl);
    normalized = replaceOrAddParam(normalized, 'url', window.location.href);
    normalized = replaceOrAddParam(normalized, 'correlator', timestamp);
    return normalized;
  }

  function buildAdTagFromDataset(container, item) {
    var directTag = container.getAttribute('data-ad-tag-url');
    if (directTag) {
      return normalizeDirectAdTag(directTag, container, item);
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

  function normalizePlaylistItem(item) {
    if (!item) {
      return null;
    }
    if (typeof item === 'string') {
      return {
        src: item,
        type: 'video/mp4',
        title: ''
      };
    }
    if (!item.src && item.url) {
      item.src = item.url;
    }
    if (!item.src) {
      return null;
    }
    return {
      src: item.src,
      type: item.type || 'video/mp4',
      poster: item.poster || '',
      title: item.title || '',
      duration: item.duration ? String(item.duration) : ''
    };
  }

  function normalizePlaylistPayload(payload) {
    var rawItems = Array.isArray(payload) ? payload : payload && Array.isArray(payload.videos) ? payload.videos : [];
    return rawItems.map(normalizePlaylistItem).filter(Boolean);
  }

  function applyPlaylistItem(container, player, item, index) {
    container.setAttribute('data-video-src', item.src);
    container.setAttribute('data-video-type', item.type || 'video/mp4');
    if (item.poster) {
      container.setAttribute('data-poster', item.poster);
      player.poster(item.poster);
    } else {
      container.removeAttribute('data-poster');
      player.poster('');
    }
    if (item.duration) {
      container.setAttribute('data-video-duration', item.duration);
    } else {
      container.removeAttribute('data-video-duration');
    }
    container.setAttribute('data-playlist-index', String(index));
    if (item.title) {
      container.setAttribute('data-playlist-title', item.title);
    } else {
      container.removeAttribute('data-playlist-title');
    }
    player.src({
      src: item.src,
      type: item.type || 'video/mp4'
    });
  }

  function loadPlaylistBeforeCreate(container) {
    var playlistSrc = container.getAttribute('data-playlist-src');
    if (!playlistSrc || container._publisherPlaylistLoaded) {
      return false;
    }
    if (container._publisherPlaylistLoading) {
      return true;
    }
    container._publisherPlaylistLoading = true;
    container.classList.add('is-loading');
    log(container, 'A carregar playlist');
    window.fetch(playlistSrc, {
      credentials: 'same-origin'
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    }).then(function (payload) {
      var items = normalizePlaylistPayload(payload);
      if (!items.length) {
        throw new Error('Playlist vazia');
      }
      container._publisherPlaylistItems = items;
      container._publisherPlaylistLoaded = true;
      container._publisherPlaylistLoading = false;
      container.setAttribute('data-video-src', items[0].src);
      container.setAttribute('data-video-type', items[0].type || 'video/mp4');
      if (items[0].poster) {
        container.setAttribute('data-poster', items[0].poster);
      }
      if (items[0].duration) {
        container.setAttribute('data-video-duration', items[0].duration);
      }
      log(container, 'Playlist carregada: ' + items.length + ' vídeos');
      createPlayer(container);
    }).catch(function (error) {
      container._publisherPlaylistLoaded = true;
      container._publisherPlaylistLoading = false;
      container.classList.remove('is-loading');
      log(container, 'Erro ao carregar playlist: ' + error.message, true);
      if (container.getAttribute('data-video-src')) {
        createPlayer(container);
      }
    });
    return true;
  }

  function isInAdMode(player) {
    return Boolean(player.ads && player.ads.isInAdMode && player.ads.isInAdMode());
  }

  function requestFreshPreroll(container, player, item) {
    var adTagUrl = buildAdTagFromDataset(container, item);
    if (!adTagUrl || !player.ima) {
      return false;
    }
    try {
      if (player.ima.changeAdTag) {
        player.ima.changeAdTag(adTagUrl);
      }
      if (player.ima.requestAds) {
        player.ima.requestAds();
      }
      log(container, 'Nova chamada de publicidade enviada');
      return true;
    } catch (error) {
      log(container, 'Erro ao pedir preroll: ' + error.message + '. Conteúdo continua.', true);
      return false;
    }
  }

  function safePlay(player, container) {
    var playPromise = player.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function (error) {
        if (container) {
          log(container, 'Autoplay bloqueado pelo browser: ' + (error && error.message ? error.message : 'interação necessária'), true);
        }
      });
    }
    return playPromise;
  }

  function setupPlaylist(container, player) {
    var items = container._publisherPlaylistItems || [];
    if (!items.length) {
      return;
    }
    var state = {
      index: Number(container.getAttribute('data-playlist-start-index') || 0),
      switching: false,
      advanceTimer: null
    };
    var loop = asBool(container.getAttribute('data-playlist-loop'), true);
    var total = items.length;
    if (state.index < 0 || state.index >= total) {
      state.index = 0;
    }
    container.setAttribute('data-playlist-count', String(total));
    container.setAttribute('data-playlist-index', String(state.index));

    function clearAdvanceTimer() {
      if (!state.advanceTimer) {
        return;
      }
      window.clearTimeout(state.advanceTimer);
      state.advanceTimer = null;
    }

    function unlockSwitching(delay) {
      window.setTimeout(function () {
        state.switching = false;
      }, delay || 500);
    }

    function playPlaylistItem(index) {
      var item = items[index];
      clearAdvanceTimer();
      state.switching = true;
      state.index = index;
      log(container, 'A preparar vídeo ' + (state.index + 1) + ' de ' + total + (item.title ? ': ' + item.title : ''));
      player.pause();
      applyPlaylistItem(container, player, item, state.index);
      if (player.ads) {
        player.trigger('contentchanged');
      }
      player.one('loadedmetadata', function () {
        var adRequested = requestFreshPreroll(container, player, item);
        if (!adRequested) {
          log(container, 'Sem preroll disponível. A iniciar conteúdo.');
        }
        safePlay(player, container);
        unlockSwitching(1200);
      });
      player.one('playing', function () {
        unlockSwitching(400);
      });
    }

    function advancePlaylist(reason) {
      clearAdvanceTimer();
      if (state.switching || container.classList.contains('is-ad-playing')) {
        return;
      }
      var nextIndex = state.index + 1;
      if (nextIndex >= total) {
        if (!loop) {
          log(container, 'Playlist terminada');
          return;
        }
        nextIndex = 0;
      }
      log(container, 'Vídeo terminado. A avançar para o próximo item (' + reason + ').');
      playPlaylistItem(nextIndex);
    }

    function scheduleAdvance(reason) {
      if (state.advanceTimer || state.switching || container.classList.contains('is-ad-playing')) {
        return;
      }
      state.advanceTimer = window.setTimeout(function () {
        advancePlaylist(reason);
      }, 80);
    }

    player.on('ended', function () {
      scheduleAdvance('ended');
    });

    player.on('timeupdate', function () {
      if (state.switching || container.classList.contains('is-ad-playing')) {
        return;
      }
      var duration = player.duration();
      var currentTime = player.currentTime();
      if (!duration || !isFinite(duration) || duration < 1) {
        return;
      }
      if (currentTime >= duration - 0.35) {
        scheduleAdvance('timeupdate');
      }
    });
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
      try {
        if (player.ima && player.ima.getAdsManager && player.ima.getAdsManager()) {
          player.ima.getAdsManager().setVolume(getVolume(container));
        }
      } catch (error) {}
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
    if (loadPlaylistBeforeCreate(container)) {
      return null;
    }
    var video = container.querySelector('video');
    var source = getSource(container);
    var mode = getMode(container);
    if (!video || !source.src || !window.videojs) {
      return null;
    }
    container.setAttribute('data-resolved-player-mode', mode);
    container.classList.add('is-loading');
    var shouldAutoplay = getAutoplay(container, mode);
    var shouldMute = getMuted(container, mode);
    var initialVolume = getVolume(container);
    if (shouldAutoplay) {
      video.setAttribute('autoplay', 'autoplay');
    } else {
      video.removeAttribute('autoplay');
    }
    video.muted = shouldMute;
    video.volume = initialVolume;
    var player = window.videojs(video, {
      controls: true,
      fluid: true,
      responsive: true,
      preload: container.getAttribute('data-preload') || (shouldAutoplay ? 'auto' : 'metadata'),
      autoplay: shouldAutoplay,
      muted: shouldMute,
      poster: container.getAttribute('data-poster') || '',
      html5: {
        vhs: {
          overrideNative: !window.videojs.browser.IS_SAFARI
        }
      },
      sources: [source]
    });
    player.volume(initialVolume);
    player.muted(shouldMute);
    var firstItem = container._publisherPlaylistItems && container._publisherPlaylistItems.length ? container._publisherPlaylistItems[0] : null;
    var adTagUrl = buildAdTagFromDataset(container, firstItem);
    if (adTagUrl && player.ima) {
      player.ima({
        adTagUrl: adTagUrl,
        showCountdown: true,
        preventLateAdStart: true,
        vastLoadTimeout: Number(container.getAttribute('data-vast-timeout') || 5000),
        adWillAutoPlay: shouldAutoplay,
        adWillPlayMuted: shouldMute,
        autoPlayAdBreaks: !asBool(container.getAttribute('data-manual-ad-breaks'), false),
        contribAdsSettings: {
          timeout: Number(container.getAttribute('data-ads-timeout') || 5000)
        }
      });
      function initializeImaOnce() {
        if (player.ima && player.ima.initializeAdDisplayContainer) {
          player.ima.initializeAdDisplayContainer();
        }
      }
      player.one('play', initializeImaOnce);
      if (shouldAutoplay) {
        player.ready(function () {
          initializeImaOnce();
        });
      }
    }
    player.ready(function () {
      container.classList.remove('is-loading');
      player.volume(initialVolume);
      player.muted(shouldMute);
      if (mode === 'ad-only') {
        log(container, 'Ad-only mode loaded. Press play or enable autoplay muted.');
      } else if (shouldAutoplay) {
        log(container, 'Autoplay activo com volume ' + Math.round(initialVolume * 100) + '/100');
        safePlay(player, container);
      }
    });
    attachEvents(container, player, mode);
    if (mode === 'content') {
      setupPlaylist(container, player);
    }
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
