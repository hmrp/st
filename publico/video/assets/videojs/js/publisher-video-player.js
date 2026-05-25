(function () {
  var instances = new WeakMap();
  var instancesById = {};
  var playerSelector = '[data-vjs-player], [data-publisher-video]';
  var assetBaseUrl = 'https://hugopedroso.com/publico/video/';
  var blankContentSrc = assetBaseUrl + 'assets/videojs/media/blank-content.mp4';

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



  function getMaxVolume(container) {
    var raw = container.getAttribute('data-volume-max');
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

  function syncImaVolume(container, player) {
    if (!player || !player.ima || !player.ima.getAdsManager) {
      return;
    }
    try {
      var adsManager = player.ima.getAdsManager();
      if (adsManager && adsManager.setVolume) {
        adsManager.setVolume(player.muted() ? 0 : player.volume());
      }
    } catch (error) {}
  }

  function applyAudioState(container, player, muted, volume) {
    var normalizedVolume = Math.max(0, Math.min(1, Number(volume)));
    player.volume(normalizedVolume);
    player.muted(Boolean(muted));
    container.classList.toggle('is-audio-muted', Boolean(muted));
    container.setAttribute('data-current-volume', String(Math.round(normalizedVolume * 100)));
    syncImaVolume(container, player);
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
    if (!window.console) {
      return;
    }
    if (isError && console.warn) {
      console.warn('[VJSPlayer]', message);
      return;
    }
    if (console.log) {
      console.log('[VJSPlayer]', message);
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

  function ensureAdParam(url, name, value) {
    var pattern = new RegExp('([?&])' + name + '=([^&]*)');
    if (pattern.test(url)) {
      return url;
    }
    return replaceOrAddParam(url, name, value);
  }

  function normalizeDirectAdTag(url, container, item) {
    var descriptionUrl = container.getAttribute('data-description-url') || window.location.href;
    var pageUrl = window.location.href;
    var encodedDescriptionUrl = encodeURIComponent(descriptionUrl);
    var encodedPageUrl = encodeURIComponent(pageUrl);
    var timestamp = String(Date.now() + Math.floor(Math.random() * 1000000));
    var duration = item && item.duration ? item.duration : container.getAttribute('data-video-duration') || (getMode(container) === 'ad-only' ? '30' : '120');
    var normalized = String(url || '')
      .replaceAll('[placeholder]', encodedDescriptionUrl)
      .replaceAll('[page_url]', encodedPageUrl)
      .replaceAll('%5Bpage_url%5D', encodedPageUrl)
      .replaceAll('__timestamp__', timestamp)
      .replaceAll('[timestamp]', timestamp)
      .replaceAll('__item-duration__', duration);

    normalized = ensureAdParam(normalized, 'iu', '/4458504/Video/Ipsilon');
    normalized = ensureAdParam(normalized, 'hl', 'en');
    normalized = ensureAdParam(normalized, 'plcmt', '2');
    normalized = ensureAdParam(normalized, 'vpa', container.getAttribute('data-ad-vpa') || 'auto');
    normalized = ensureAdParam(normalized, 'vpmute', container.getAttribute('data-ad-vpmute') || '0');
    normalized = ensureAdParam(normalized, 'vpos', 'preroll');
    normalized = ensureAdParam(normalized, 'wta', '1');
    normalized = replaceOrAddParam(normalized, 'description_url', descriptionUrl);
    normalized = ensureAdParam(normalized, 'tfcd', '0');
    normalized = ensureAdParam(normalized, 'npa', '0');
    normalized = ensureAdParam(normalized, 'sz', '1x1|640x360');
    normalized = ensureAdParam(normalized, 'gdfp_req', '1');
    normalized = ensureAdParam(normalized, 'output', 'xml_vast4');
    normalized = ensureAdParam(normalized, 'unviewed_position_start', '1');
    normalized = ensureAdParam(normalized, 'env', 'vp');
    normalized = replaceOrAddParam(normalized, 'correlator', timestamp);
    normalized = replaceOrAddParam(normalized, 'url', pageUrl);
    normalized = ensureAdParam(normalized, 'cust_params', 'noticiatag%3Dundefined%26Seccao%3Dundefined%26assinante%3Dundefined%26pos%3Dincview%26end%3D' + encodeURIComponent(pageUrl));
    normalized = ensureAdParam(normalized, 'vconp', '1');
    normalized = replaceOrAddParam(normalized, 'cb', timestamp);
    normalized = replaceOrAddParam(normalized, 'cachebuster', timestamp);
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
    var clickUrl = item.clickUrl || item.click_url || item.href || item.link || item.destinationUrl || item.destination_url || '';
    if (!item.src && item.url) {
      item.src = item.url;
      clickUrl = clickUrl || '';
    } else if (item.url) {
      clickUrl = clickUrl || item.url;
    }
    if (!item.src) {
      return null;
    }
    return {
      src: item.src,
      type: item.type || 'video/mp4',
      poster: item.poster || '',
      title: item.title || '',
      duration: item.duration ? String(item.duration) : '',
      url: clickUrl
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
    if (item.url) {
      container.setAttribute('data-playlist-url', item.url);
    } else {
      container.removeAttribute('data-playlist-url');
    }
    updateContentClickOverlay(container, player, item);
    player.src({
      src: item.src,
      type: item.type || 'video/mp4'
    });
  }

  function getCurrentContentUrl(container) {
    return container.getAttribute('data-playlist-url') || container.getAttribute('data-content-click-url') || '';
  }

  function shouldIgnoreContentClick(container, target) {
    if (container.classList.contains('is-ad-playing') || container.classList.contains('is-ad-requesting')) {
      return true;
    }
    if (!target || !target.closest) {
      return false;
    }
    return Boolean(target.closest('.vjs-control-bar, .vjs-control, .ima-ad-container, .pub-video-custom-controls, .pub-video-custom-control'));
  }

  function openContentUrl(container) {
    var url = getCurrentContentUrl(container);
    if (!url) {
      return false;
    }
    window.open(url, '_blank', 'noopener');
    return true;
  }

  function ensureContentClickOverlay(container, player) {
    if (getMode(container) !== 'content' || !player || !player.el) {
      return null;
    }
    var playerElement = player.el();
    var existing = playerElement.querySelector('.pub-video-click-overlay');
    if (existing) {
      return existing;
    }
    var overlay = document.createElement('button');
    overlay.type = 'button';
    overlay.className = 'pub-video-click-overlay';
    overlay.setAttribute('aria-label', container.getAttribute('data-content-click-label') || 'Abrir conteúdo');
    function handleOverlayClick(event) {
      if (container.classList.contains('is-ad-playing') || container.classList.contains('is-ad-requesting')) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (!shouldIgnoreContentClick(container, event.target)) {
        openContentUrl(container);
      }
    }
    overlay.addEventListener('click', handleOverlayClick);
    playerElement.addEventListener('click', function (event) {
      if (!container.classList.contains('has-content-click-overlay') || container.classList.contains('is-ad-playing') || container.classList.contains('is-ad-requesting')) {
        return;
      }
      if (event.target === overlay || shouldIgnoreContentClick(container, event.target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      openContentUrl(container);
    }, true);
    playerElement.appendChild(overlay);
    return overlay;
  }

  function updateContentClickOverlay(container, player, item) {
    var overlay = ensureContentClickOverlay(container, player);
    if (!overlay) {
      return;
    }
    var url = item && item.url ? item.url : '';
    if (!url) {
      container.removeAttribute('data-playlist-url');
      container.classList.remove('has-content-click-overlay');
      return;
    }
    container.setAttribute('data-playlist-url', url);
    container.classList.add('has-content-click-overlay');
  }

  function getInlinePlaylistItems(container) {
    var raw = container.getAttribute('data-playlist-items') || '';
    if (!raw) {
      return [];
    }
    return raw.split('|').map(function (src) {
      return normalizePlaylistItem({
        src: src.trim(),
        type: 'video/mp4'
      });
    }).filter(Boolean);
  }

  function setPlaylistItems(container, items) {
    if (!items || !items.length) {
      return false;
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
    return true;
  }

  function loadPlaylistBeforeCreate(container) {
    var playlistSrc = container.getAttribute('data-playlist-src');
    var inlineItems = getInlinePlaylistItems(container);
    if (container._publisherPlaylistLoaded) {
      return false;
    }
    if (!playlistSrc) {
      setPlaylistItems(container, inlineItems);
      return false;
    }
    if (container._publisherPlaylistLoading) {
      return true;
    }
    container._publisherPlaylistLoading = true;
    container.classList.add('is-loading');
    log(container, 'A carregar playlist');
    window.fetch(playlistSrc, {
      credentials: 'omit',
      mode: 'cors'
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
      setPlaylistItems(container, items);
      log(container, 'Playlist carregada: ' + items.length + ' vídeos');
      createPlayer(container);
    }).catch(function (error) {
      container._publisherPlaylistLoading = false;
      container.classList.remove('is-loading');
      if (setPlaylistItems(container, inlineItems)) {
        log(container, 'Playlist inline carregada: ' + inlineItems.length + ' vídeos');
        createPlayer(container);
        return;
      }
      log(container, 'Erro ao carregar playlist: ' + error.message, true);
      if (container.getAttribute('data-video-src')) {
        container._publisherPlaylistLoaded = true;
        createPlayer(container);
      }
    });
    return true;
  }

  function isInAdMode(player) {
    return Boolean(player.ads && player.ads.isInAdMode && player.ads.isInAdMode());
  }

  function setAdUiState(container, isAdActive) {
    container.classList.toggle('is-ad-playing', Boolean(isAdActive));
    container.classList.toggle('is-content-ui-hidden', Boolean(isAdActive));
  }

  function requestFreshPreroll(container, player, item) {
    var adTagUrl = buildAdTagFromDataset(container, item);
    if (!adTagUrl || !player.ima) {
      return false;
    }
    try {
      container.setAttribute('data-last-ad-tag-url', adTagUrl);
      container.classList.add('is-ad-requesting');
      container.classList.add('is-content-ui-hidden');
      if (window.console && console.info) {
        console.info('VIDEOJS: fresh VAST request full=' + adTagUrl);
      }
      if (player.ima.changeAdTag) {
        player.ima.changeAdTag(adTagUrl);
      }
      syncImaVolume(container, player);
      if (player.ima.requestAds) {
        player.ima.requestAds();
      }
      log(container, 'Nova chamada de publicidade enviada');
      return true;
    } catch (error) {
      container.classList.remove('is-ad-requesting');
      container.classList.remove('is-content-ui-hidden');
      setAdUiState(container, false);
      log(container, 'Erro ao pedir preroll: ' + error.message + '. Conteúdo continua.', true);
      return false;
    }
  }

  function safePlay(player, container, onBlocked) {
    var playPromise = player.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function (error) {
        if (container) {
          log(container, 'Autoplay bloqueado pelo browser: ' + (error && error.message ? error.message : 'interação necessária'), true);
        }
        if (onBlocked) {
          onBlocked(error);
        }
      });
    }
    return playPromise;
  }

  function startAutoplay(container, player, shouldMute, initialVolume, requestAdsCallback) {
    function tryMutedFallback() {
      if (shouldMute || !asBool(container.getAttribute('data-autoplay-muted-fallback'), true)) {
        return;
      }
      applyAudioState(container, player, true, initialVolume);
      log(container, 'Autoplay com som bloqueado. A tentar autoplay muted com volume preparado para ' + Math.round(initialVolume * 100) + '/100.', true);
      if (requestAdsCallback) {
        requestAdsCallback();
      }
      safePlay(player, container);
    }
    if (requestAdsCallback) {
      requestAdsCallback();
    }
    safePlay(player, container, tryMutedFallback);
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
      container.classList.remove('is-ad-requesting');
      container.classList.remove('is-content-ui-hidden');
      setAdUiState(container, false);
      log(container, 'Content ready');
    });
    player.on('ads-request', function () {
      container.classList.add('is-ad-requesting');
      container.classList.add('is-content-ui-hidden');
      log(container, 'Ad request sent');
      startNoAdTimer();
    });
    player.on('ads-ad-started', function () {
      adStarted = true;
      clearNoAdTimer();
      container.classList.remove('is-ad-requesting');
      setAdUiState(container, true);
      syncImaVolume(container, player);
      log(container, 'Ad started');
    });
    player.on('adend', function () {
      clearNoAdTimer();
      container.classList.remove('is-ad-requesting');
      container.classList.remove('is-content-ui-hidden');
      setAdUiState(container, false);
      if (mode === 'ad-only') {
        finishAdOnly(container, player, 'Ad ended. Slot stopped.', false);
        return;
      }
      if (getCurrentContentUrl(container)) {
        container.classList.add('has-content-click-overlay');
      }
      log(container, 'Ad ended');
    });
    player.on('adserror', function () {
      clearNoAdTimer();
      container.classList.remove('is-ad-requesting');
      container.classList.remove('is-content-ui-hidden');
      setAdUiState(container, false);
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
      container.classList.remove('is-ad-requesting');
      container.classList.remove('is-ad-requesting');
      container.classList.remove('is-content-ui-hidden');
      setAdUiState(container, false);
      if (mode === 'ad-only') {
        if (!adStarted && showFallback(container, player, 'contentresumed-no-ad')) {
          return;
        }
        finishAdOnly(container, player, adStarted ? 'Ad completed. No content source configured.' : 'No ad was played. Slot stopped.', false);
        return;
      }
      if (getCurrentContentUrl(container)) {
        container.classList.add('has-content-click-overlay');
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
      var disposedPlayerId = container.getAttribute('data-player-id') || container.id;
      if (disposedPlayerId && instancesById[disposedPlayerId] === player) {
        delete instancesById[disposedPlayerId];
      }
    });
  }

  function polishControlButtons(player) {
    if (!player || !player.el) {
      return;
    }
    var root = player.el();
    var selectors = [
      '.vjs-play-control',
      '.vjs-mute-control',
      '.vjs-volume-panel',
      '.vjs-fullscreen-control',
      '.vjs-picture-in-picture-control'
    ];
    selectors.forEach(function (selector) {
      Array.prototype.slice.call(root.querySelectorAll(selector)).forEach(function (element) {
        element.removeAttribute('title');
        element.setAttribute('title', '');
        element.removeAttribute('data-title');
      });
    });
  }


  function setupAudioToggle(container, player, initialVolume) {
    var minimumVolume = Math.max(0, Math.min(1, initialVolume));
    var maximumVolume = getMaxVolume(container);
    applyAudioState(container, player, player.muted(), player.muted() ? minimumVolume : minimumVolume);
    player.el().addEventListener('click', function (event) {
      var control = event.target && event.target.closest ? event.target.closest('.vjs-mute-control, .vjs-volume-panel') : null;
      if (!control) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
      if (player.muted()) {
        applyAudioState(container, player, false, maximumVolume);
      } else {
        applyAudioState(container, player, true, minimumVolume);
      }
      polishControlButtons(player);
    }, true);
    player.on('volumechange', function () {
      container.classList.toggle('is-audio-muted', player.muted());
      container.setAttribute('data-current-volume', String(Math.round(player.volume() * 100)));
      syncImaVolume(container, player);
    });
    ['ads-manager', 'ads-ad-started', 'adstart', 'adsready', 'readyforpreroll'].forEach(function (eventName) {
      player.on(eventName, function () {
        syncImaVolume(container, player);
      });
    });
  }



  function setButtonSvg(button, name) {
    var icons = {
      play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8v12.4c0 .8.9 1.3 1.6.9l9.8-6.2c.6-.4.6-1.3 0-1.7L9.6 4.9c-.7-.4-1.6.1-1.6.9Z"></path></svg>',
      pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 5h4.1v14H6.7zM13.2 5h4.1v14h-4.1z"></path></svg>',
      volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.2v5.6h3.6l5.1 4.1c.7.5 1.7.1 1.7-.8V5.9c0-.9-1-1.3-1.7-.8L7.6 9.2H4Z"></path><path d="M17 8.2a5.6 5.6 0 0 1 0 7.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path d="M19.4 5.8a9 9 0 0 1 0 12.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".9"></path></svg>',
      muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.2v5.6h3.6l5.1 4.1c.7.5 1.7.1 1.7-.8V5.9c0-.9-1-1.3-1.7-.8L7.6 9.2H4Z"></path><path d="m18 9 3 3m0-3-3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path></svg>'
    };
    button.innerHTML = icons[name] || '';
  }

  function setupCustomControls(container, player, initialVolume) {
    if (asBool(container.getAttribute('data-native-controls'), false)) {
      return;
    }
    if (container.querySelector('.pub-video-custom-controls')) {
      return;
    }
    var controls = document.createElement('div');
    controls.className = 'pub-video-custom-controls';
    var audioButton = document.createElement('button');
    audioButton.type = 'button';
    audioButton.className = 'pub-video-custom-control pub-video-custom-audio';
    audioButton.setAttribute('aria-label', 'Som');
    audioButton.setAttribute('data-audio-toggle', 'true');
    var playButton = document.createElement('button');
    playButton.type = 'button';
    playButton.className = 'pub-video-custom-control pub-video-custom-play';
    playButton.setAttribute('aria-label', 'Play/Pause');
    playButton.setAttribute('data-play-toggle', 'true');
    controls.appendChild(audioButton);
    controls.appendChild(playButton);
    container.appendChild(controls);
    container.classList.add('has-custom-controls');

    function updatePlayButton() {
      var paused = true;
      try {
        paused = player.paused();
      } catch (error) {}
      setButtonSvg(playButton, paused ? 'play' : 'pause');
      playButton.setAttribute('aria-pressed', paused ? 'false' : 'true');
    }

    function updateAudioButton() {
      var muted = false;
      try {
        muted = player.muted() || player.volume() === 0;
      } catch (error) {}
      setButtonSvg(audioButton, muted ? 'muted' : 'volume');
      audioButton.setAttribute('aria-pressed', muted ? 'true' : 'false');
      container.classList.toggle('is-audio-muted', muted);
    }

    function stopEvent(event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
    }

    playButton.addEventListener('click', function (event) {
      stopEvent(event);
      try {
        if (player.paused()) {
          safePlay(player, container);
        } else {
          player.pause();
        }
      } catch (error) {}
      updatePlayButton();
    }, true);

    audioButton.addEventListener('click', function (event) {
      stopEvent(event);
      try {
        if (player.muted() || player.volume() === 0) {
          applyAudioState(container, player, false, getMaxVolume(container));
        } else {
          applyAudioState(container, player, true, Math.max(0, Math.min(1, initialVolume)));
        }
      } catch (error) {}
      updateAudioButton();
    }, true);

    ['play', 'pause', 'ended', 'loadedmetadata'].forEach(function (eventName) {
      player.on(eventName, updatePlayButton);
    });
    player.on('volumechange', updateAudioButton);
    player.on('dispose', function () {
      if (controls.parentNode) {
        controls.parentNode.removeChild(controls);
      }
    });
    updatePlayButton();
    updateAudioButton();
  }

  function setupAdFloating(container, player) {
    if (container.getAttribute('data-floating-mode') === 'frame') {
      return;
    }
    if (!asBool(container.getAttribute('data-ad-floating'), false)) {
      return;
    }
    var placeholder = document.createElement('div');
    placeholder.className = 'pub-video-floating-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    container.parentNode.insertBefore(placeholder, container);

    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'pub-video-floating-close';
    closeButton.setAttribute('aria-label', 'Fechar publicidade flutuante');
    closeButton.textContent = '×';
    container.appendChild(closeButton);

    var state = {
      adActive: false,
      dismissed: false,
      closeTimer: null,
      raf: null
    };

    function clearCloseTimer() {
      if (!state.closeTimer) {
        return;
      }
      window.clearTimeout(state.closeTimer);
      state.closeTimer = null;
    }

    function hideCloseButton() {
      clearCloseTimer();
      container.classList.remove('is-ad-floating-close-visible');
    }

    function showCloseButtonLater() {
      hideCloseButton();
      state.closeTimer = window.setTimeout(function () {
        if (state.adActive && container.classList.contains('is-ad-floating') && !state.dismissed) {
          container.classList.add('is-ad-floating-close-visible');
        }
      }, Number(container.getAttribute('data-ad-floating-close-delay') || 3000));
    }

    function getReferenceElement() {
      return container.classList.contains('is-ad-floating') ? placeholder : container;
    }

    function isOriginalPlacementVisible() {
      var element = getReferenceElement();
      if (!element || !element.getBoundingClientRect) {
        return true;
      }
      var rect = element.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      if (!viewportHeight || !viewportWidth) {
        return true;
      }
      return rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
    }

    function enterFloating() {
      if (container.classList.contains('is-ad-floating')) {
        return;
      }
      var rect = container.getBoundingClientRect();
      placeholder.style.height = Math.max(1, Math.round(rect.height || container.offsetHeight || 0)) + 'px';
      placeholder.style.display = 'block';
      container.classList.add('is-ad-floating');
      showCloseButtonLater();
    }

    function exitFloating() {
      if (!container.classList.contains('is-ad-floating')) {
        hideCloseButton();
        placeholder.style.height = '';
        placeholder.style.display = '';
        return;
      }
      container.classList.remove('is-ad-floating');
      hideCloseButton();
      placeholder.style.height = '';
      placeholder.style.display = '';
    }

    function updateFloatingState() {
      state.raf = null;
      if (!state.adActive || state.dismissed) {
        exitFloating();
        return;
      }
      if (isOriginalPlacementVisible()) {
        exitFloating();
        return;
      }
      enterFloating();
    }

    function requestUpdate() {
      if (state.raf) {
        return;
      }
      state.raf = window.requestAnimationFrame(updateFloatingState);
    }

    function activateFloatingMode() {
      state.adActive = true;
      state.dismissed = false;
      container.classList.remove('is-ad-floating-dismissed');
      requestUpdate();
    }

    function deactivateFloatingMode() {
      state.adActive = false;
      state.dismissed = false;
      container.classList.remove('is-ad-floating-dismissed');
      exitFloating();
    }

    function pauseAdAndContent() {
      try {
        if (player.ima && player.ima.getAdsManager) {
          var adsManager = player.ima.getAdsManager();
          if (adsManager && adsManager.pause) {
            adsManager.pause();
          }
        }
      } catch (error) {}
      try {
        player.pause();
      } catch (error) {}
    }

    closeButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
      state.dismissed = true;
      container.classList.add('is-ad-floating-dismissed');
      exitFloating();
      pauseAdAndContent();
      log(container, 'Publicidade em pausa. Carrega em play no player principal para retomar.');
    }, true);

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    ['ads-request', 'adsready', 'readyforpreroll', 'ads-manager', 'ads-ad-started', 'adstart', 'contentpause', 'contentpauserequested'].forEach(function (eventName) {
      player.on(eventName, activateFloatingMode);
    });
    ['adend', 'ads-ad-ended', 'adserror', 'contentresumed', 'contentresume', 'contentresumerequested', 'ended', 'dispose'].forEach(function (eventName) {
      player.on(eventName, deactivateFloatingMode);
    });
    player.on('dispose', function () {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
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
    video.removeAttribute('controls');
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
      controlBar: {
        children: ['playToggle', 'volumePanel'],
        fullscreenToggle: false,
        pictureInPictureToggle: false,
        progressControl: false,
        currentTimeDisplay: false,
        timeDivider: false,
        durationDisplay: false,
        remainingTimeDisplay: false,
        playbackRateMenuButton: false
      },
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
    setupAudioToggle(container, player, initialVolume);
    setupCustomControls(container, player, initialVolume);
    ['useractive', 'userinactive', 'volumechange', 'play', 'pause'].forEach(function (eventName) {
      player.on(eventName, function () {
        polishControlButtons(player);
      });
    });
    var firstItem = container._publisherPlaylistItems && container._publisherPlaylistItems.length ? container._publisherPlaylistItems[0] : null;
    if (mode === 'content') {
      updateContentClickOverlay(container, player, firstItem);
    }
    var adTagUrl = buildAdTagFromDataset(container, firstItem);
    if (adTagUrl && player.ima) {
      player.ima({
        adTagUrl: adTagUrl,
        showCountdown: false,
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
      polishControlButtons(player);
      window.setTimeout(function () {
        polishControlButtons(player);
      }, 250);
      container.classList.remove('is-loading');
      applyAudioState(container, player, shouldMute, initialVolume);
      if (mode === 'ad-only') {
        log(container, 'Ad-only mode loaded. Press play or enable autoplay muted.');
      } else if (shouldAutoplay) {
        log(container, 'Autoplay activo com volume ' + Math.round(initialVolume * 100) + '/100');
        startAutoplay(container, player, shouldMute, initialVolume, function () {
          requestFreshPreroll(container, player, firstItem);
        });
      }
    });
    attachEvents(container, player, mode);
    if (mode === 'content') {
      setupPlaylist(container, player);
    }
    setupAdFloating(container, player);
    setupSticky(container);
    instances.set(container, player);
    var playerId = container.getAttribute('data-player-id') || container.id;
    if (playerId) {
      instancesById[playerId] = player;
    }
    return player;
  }

  function collectContainers(root) {
    var scope = root || document;
    var containers = [];
    if (scope.nodeType === 1 && scope.matches && scope.matches(playerSelector)) {
      containers.push(scope);
    }
    if (scope.querySelectorAll) {
      containers = containers.concat(Array.prototype.slice.call(scope.querySelectorAll(playerSelector)));
    }
    return containers.filter(function (container, index, list) {
      return list.indexOf(container) === index;
    });
  }

  function findContainer(ref) {
    if (!ref) {
      return null;
    }
    if (typeof ref !== 'string') {
      return ref;
    }
    return document.getElementById(ref) || document.querySelector('[data-player-id="' + ref.replace(/"/g, '\"') + '"]');
  }

  function getPlayer(ref) {
    if (typeof ref === 'string' && instancesById[ref]) {
      return instancesById[ref];
    }
    var container = findContainer(ref);
    return container ? instances.get(container) || null : null;
  }

  function initAll(root) {
    var containers = collectContainers(root);
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

  var api = {
    init: initAll,
    create: createPlayer,
    get: getPlayer,
    setAdTag: function (ref, adTagUrl) {
      var container = findContainer(ref);
      if (!container) {
        return false;
      }
      container.setAttribute('data-ad-tag-url', adTagUrl || '');
      return true;
    },
    requestAd: function (ref) {
      var container = findContainer(ref);
      var player = getPlayer(ref);
      if (!container || !player) {
        return false;
      }
      var items = container._publisherPlaylistItems || [];
      var index = Number(container.getAttribute('data-playlist-index') || 0);
      return requestFreshPreroll(container, player, items[index] || null);
    },
    setPlaylist: function (ref, playlist) {
      var container = findContainer(ref);
      if (!container) {
        return false;
      }
      var items = normalizePlaylistPayload(playlist);
      if (!items.length) {
        return false;
      }
      setPlaylistItems(container, items);
      return true;
    },
    play: function (ref) {
      var player = getPlayer(ref);
      if (!player) {
        return false;
      }
      safePlay(player, findContainer(ref));
      return true;
    },
    pause: function (ref) {
      var player = getPlayer(ref);
      if (!player) {
        return false;
      }
      player.pause();
      return true;
    }
  };

  window.PublisherVideoPlayer = api;
  window.VJSPlayer = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAll(document);
    });
  } else {
    initAll(document);
  }
})();
