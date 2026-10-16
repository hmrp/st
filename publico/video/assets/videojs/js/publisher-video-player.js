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
    if (container.getAttribute('data-publico-vertcontent-video') !== '1') {
      normalized = ensureAdParam(normalized, 'npa', '0');
    }
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

  // Modo exclusivo do primeiro VertContent — contador de tentativas VAST sem fill.
  function ensureVertVideoMonitor(container, player) {
    if (container.getAttribute('data-publico-vertcontent-video') !== '1') return null;
    if (container._pubVertMonitor) return container._pubVertMonitor;
    var maxMisses = Math.max(1, Number(container.getAttribute('data-vast-max-misses') || 3));
    var timeoutMs = Math.max(3000, Number(container.getAttribute('data-vast-attempt-timeout') || 9000));
    var state = { attempts: 0, misses: 0, active: null, timer: null, closed: false };
    container._pubVertMonitor = state;
    function fire(name, detail) {
      container.dispatchEvent(new CustomEvent('publico:vertvideo-' + name, { detail: detail || {} }));
    }
    function clearTimer() {
      if (state.timer) window.clearTimeout(state.timer);
      state.timer = null;
    }
    function fail(reason) {
      if (state.closed || !state.active || state.active.resolved) return;
      state.active.resolved = true;
      clearTimer();
      state.misses++;
      log(container, 'Pedido VAST sem publicidade: ' + state.misses + '/' + maxMisses + ' (' + reason + ')', true);
      fire('attempt', { attempt: state.attempts, misses: state.misses, reason: reason });
      if (state.misses >= maxMisses) {
        state.closed = true;
        window.setTimeout(function () {
          fire('fallback', { reason: '3-no-vast-' + reason, attempts: state.attempts });
        }, 0);
      }
    }
    function started() {
      if (state.closed) return;
      if (!state.active) {
        // O VideoJS-IMA pode ter iniciado o anúncio automaticamente.
        state.active = { resolved: false, started: false };
        state.attempts++;
      }
      if (state.active.started) return;
      state.active.started = true;
      state.active.resolved = true;
      clearTimer();
      state.misses = 0;
      fire('ad-started', { attempts: state.attempts, misses: 0 });
      log(container, 'VAST iniciou reprodução. Contador de falhas reposto a zero.');
    }
    state.begin = function () {
      if (state.closed) return;
      if (state.active && !state.active.resolved) {
        // Não contar duplamente o mesmo pedido a decorrer.
        return;
      }
      clearTimer();
      state.attempts++;
      state.active = { resolved: false, started: false };
      fire('attempt', { attempt: state.attempts, misses: state.misses });
      state.timer = window.setTimeout(function () { fail('timeout'); }, timeoutMs);
      log(container, 'Pedido VAST #' + state.attempts + ' enviado; falhas seguidas=' + state.misses);
    };
    state.fail = fail;
    // Estes eventos vêm do IMA (não de um simples HTTP 200 da tag).
    player.on('ads-request', function () {
      if (!state.active || state.active.resolved) state.begin();
    });
    player.on('ads-ad-started', started);
    player.on('adserror', function () { fail('ima-error'); });
    player.on('contentresumed', function () {
      if (state.active && !state.active.started) fail('no-fill');
    });
    player.on('dispose', function () { state.closed = true; clearTimer(); });
    return state;
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
      var vertMonitor = ensureVertVideoMonitor(container, player);
      if (vertMonitor) vertMonitor.begin();
      if (player.ima.requestAds) {
        player.ima.requestAds();
      }
      log(container, 'Nova chamada de publicidade enviada');
      return true;
    } catch (error) {
      container.classList.remove('is-ad-requesting');
      container.classList.remove('is-content-ui-hidden');
      setAdUiState(container, false);
      if (container._pubVertMonitor) container._pubVertMonitor.fail('request-exception');
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
    var isVertContent = container.getAttribute('data-publico-vertcontent-video') === '1';
    var player = window.videojs(video, {
      controls: true,
      fluid: !isVertContent,
      fill: isVertContent,
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
    ensureVertVideoMonitor(container, player);
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

/* Base: 131026_teste2. Vídeo antes do primeiro VertContent de artigos. */
/* Controlador de vídeo do primeiro VertContent — módulo publisher-video-player.js.
 * Bibliotecas, CSS, player JS e playlist servidos por hugopedroso.com. */
(function (window, document) {
  'use strict';

  var loaderPromise = null;
  var instances = [];
  var defaults = {
    maxNoAd: 3,
    vastTimeoutMs: 9000,
    startupTimeoutMs: 30000, // protege apenas contra ausência TOTAL de chamadas VAST
    floating: false, // testar primeiro sem floating; pode ser ativado no override
    // Prepara a chamada antes de o leitor chegar ao slot; sem reservar na insercao.
    rootMargin: '600px 0px 600px 0px'
  };

  function config() {
    var provided = window.VertInContentRequest || {};
    return Object.assign({}, defaults, provided);
  }
  function log() {
    if (window.console && console.info) {
      console.info.apply(console, ['[PUB VertVideo]'].concat(Array.prototype.slice.call(arguments)));
    }
  }
  function eligible() {
    return Boolean(window.pub && window.pub.pageType === 'noticia' &&
      window.pub.showAds !== false && window.hasAds !== false &&
      document.querySelector('#story-body'));
  }
  // A reserva de altura mantém-se fixa por CSS enquanto o player estiver ativo.
  // O Video.js ocupa toda a área disponível; o elemento <video> utiliza
  // object-fit: contain para apresentar MP4 16:9, 4:3 ou vertical sem crop.
  // Nunca tentar redimensionar o contentor em função de loadedmetadata.
  function normaliseRatio(ratio) {
    ratio = Number(ratio);
    return isFinite(ratio) && ratio >= 0.15 && ratio <= 10 ? ratio : 16 / 9;
  }

  function resizeImaIfPlaying(instance, width, height) {
    if (!instance.inAd || !instance.player || !instance.player.ima ||
        typeof instance.player.ima.getAdsManager !== 'function') return;
    try {
      var manager = instance.player.ima.getAdsManager();
      if (manager && typeof manager.resize === 'function') {
        var mode = window.google && window.google.ima && window.google.ima.ViewMode
          ? window.google.ima.ViewMode.NORMAL : 'normal';
        manager.resize(width, height, mode);
      }
    } catch (error) { log('IMA resize não disponível', error); }
  }

  function activateVertContentHeight(instance) {
    if (!instance || !instance.wrapper.isConnected) return;
    instance.wrapper.setAttribute('data-publico-vcv-reserved', '1');
    if (window.PubAdLayout) window.PubAdLayout.videoRequested(instance.wrapper);
    fitVideoStage(instance, instance.activeRatio || 16 / 9);
  }

  function fitVideoStage(instance, ratio) {
    if (instance.state === 'display' || !instance.stage.isConnected) return;
    instance.activeRatio = normaliseRatio(ratio || instance.activeRatio || 16 / 9);
    instance.stage.setAttribute('data-video-ratio', instance.activeRatio.toFixed(4));

    if (instance.wrapper.getAttribute('data-publico-vcv-reserved') !== '1') return;
    var rect = instance.stage.getBoundingClientRect();
    var width = Math.max(0, Math.round(rect.width));
    var height = Math.max(0, Math.round(rect.height));
    if (!width || !height) return;

    // Não alterar a largura/altura do Video.js entre vídeos da playlist.
    // A proporção de cada MP4 é tratada pelo object-fit:contain no <video>.
    if (instance.imaLastWidth !== width || instance.imaLastHeight !== height) {
      instance.imaLastWidth = width;
      instance.imaLastHeight = height;
      resizeImaIfPlaying(instance, width, height);
    }
  }

  function bindVideoSizing(instance, shell, player) {
    if (!player || typeof player.on !== 'function') return;
    function updateContentRatio() {
      var width = typeof player.videoWidth === 'function' ? player.videoWidth() : 0;
      var height = typeof player.videoHeight === 'function' ? player.videoHeight() : 0;
      var video = shell.querySelector('video.vjs-tech, video');
      if (!(width > 0 && height > 0) && video) {
        width = video.videoWidth;
        height = video.videoHeight;
      }
      if (width > 0 && height > 0) instance.contentRatio = normaliseRatio(width / height);
      if (!instance.inAd) fitVideoStage(instance, instance.contentRatio || 16 / 9);
    }
    function startAd() {
      instance.inAd = true;
      // O gestor IMA pode ser novo embora a área continue igual.
      instance.imaLastWidth = 0;
      instance.imaLastHeight = 0;
      instance.hadVisibleContent = true;
      if (window.PubAdLayout) window.PubAdLayout.videoVisible(instance.wrapper);
      var ratio = 16 / 9;
      instance.currentAdInfo = null;
      try {
        var manager = player.ima && player.ima.getAdsManager && player.ima.getAdsManager();
        var current = manager && manager.getCurrentAd && manager.getCurrentAd();
        if (current) {
          // Em anúncios VAST lineares getWidth/getHeight costuma devolver 0.
          // getVastMediaWidth/Height expõe a resolução da media selecionada.
          var width = (current.getVastMediaWidth && current.getVastMediaWidth()) ||
                      (current.getWidth && current.getWidth()) || 0;
          var height = (current.getVastMediaHeight && current.getVastMediaHeight()) ||
                       (current.getHeight && current.getHeight()) || 0;
          if (width > 0 && height > 0) ratio = width / height;
          instance.currentAdInfo = {
            apiFramework: current.getApiFramework && current.getApiFramework() || '',
            mediaWidth: width,
            mediaHeight: height
          };
          log('Criatividade VAST:', instance.currentAdInfo);
        }
      } catch (error) { log('Dimensões VAST não disponíveis', error); }
      fitVideoStage(instance, ratio);
    }
    function endAd() {
      instance.inAd = false;
      updateContentRatio();
    }
    // loadedmetadata volta a disparar após cada mudança de MP4 na playlist.
    player.on('playing', function () { instance.hadVisibleContent = true; if (window.PubAdLayout) window.PubAdLayout.videoVisible(instance.wrapper); });
    player.on('loadedmetadata', updateContentRatio);
    player.on('loadeddata', updateContentRatio);
    player.on('ads-ad-started', startAd);
    player.on('adstart', startAd);
    player.on('adend', endAd);
    player.on('ads-ad-ended', endAd);
    player.on('contentresumed', endAd);
    player.on('adserror', endAd);
    var video = shell.querySelector('video.vjs-tech, video');
    if (video) video.addEventListener('loadedmetadata', updateContentRatio);
    // A largura é responsiva por CSS; para IMA basta escutar mudanças de janela.
    // Não há ResizeObserver nem medições contínuas deste player.
    var onResize = function () { fitVideoStage(instance, instance.activeRatio); };
    window.addEventListener('resize', onResize);
    instance.sizingCleanup = function () {
      window.removeEventListener('resize', onResize);
    };
    player.on('dispose', function () {
      if (instance.sizingCleanup) instance.sizingCleanup();
      instance.sizingCleanup = null;
    });
    updateContentRatio();
  }

  function appendCss(href) {
    if (document.querySelector('link[data-pub-vcv-css="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href;
    link.setAttribute('data-pub-vcv-css', href);
    document.head.appendChild(link);
  }
  function addScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src; script.async = false;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Falha no script: ' + src)); };
      document.head.appendChild(script);
    });
  }
  function ensureAssets() {
    if (loaderPromise) return loaderPromise;
    appendCss('https://hugopedroso.com/publico/video/assets/videojs/vendor/video-js.min.css');
    appendCss('https://hugopedroso.com/publico/video/assets/videojs/vendor/videojs.ads.css');
    appendCss('https://hugopedroso.com/publico/video/assets/videojs/vendor/videojs.ima.css');
    appendCss('https://hugopedroso.com/publico/video/assets/videojs/css/publisher-video-player.css');
    loaderPromise = Promise.resolve()
      .then(function () { return window.google && window.google.ima ? null : addScript('https://imasdk.googleapis.com/js/sdkloader/ima3.js'); })
      .then(function () { return window.videojs ? null : addScript('https://hugopedroso.com/publico/video/assets/videojs/vendor/video.min.js'); })
      .then(function () { return addScript('https://hugopedroso.com/publico/video/assets/videojs/vendor/videojs.ads.min.js'); })
      .then(function () { return addScript('https://hugopedroso.com/publico/video/assets/videojs/vendor/videojs.ima.min.js'); })
      .then(function () { return window.VJSPlayer && window.VJSPlayer.create ? null : addScript('https://hugopedroso.com/publico/video/assets/videojs/js/publisher-video-player.js'); })
      .then(function () {
        if (!window.VJSPlayer || !window.VJSPlayer.create || !window.google || !window.google.ima) {
          throw new Error('VideoJS/IMA não inicializaram corretamente');
        }
        if (window.VJSPlayer.init) window.VJSPlayer.init(document);
      });
    loaderPromise = loaderPromise.catch(function (error) { loaderPromise = null; throw error; });
    return loaderPromise;
  }
  function normalisePlaylist(payload) {
    var arr = Array.isArray(payload) ? payload : payload && payload.videos;
    if (!Array.isArray(arr)) return [];
    return arr.map(function (item) {
      return typeof item === 'string' ? { src: item, type: 'video/mp4' } : item;
    }).filter(function (item) {
      return Boolean(item && (item.src || item.url));
    });
  }
  // VAST: adunit Incontent separada da raiz Video (prerolls) e de Vert_Publico (display).
  // Obtém a secção e eventuais subníveis do ADUNIT DISPLAY, sem segunda fonte de configuração.
  // As subadunits correspondentes devem existir no GAM sob /4458504/Incontent.
  function getVideoAdUnitPath(placement) {
    var displayAdUnit = placement && placement.getAttribute('adunit') || '';
    var match = /^Vert_Publico\/[^/]+\/(.+)\/VertContent$/.exec(displayAdUnit);
    if (!match || !match[1]) {
      throw new Error('Adunit VertContent inválida para derivar a secção do vídeo: ' + displayAdUnit);
    }
    return '/4458504/Incontent/' + match[1];
  }

  // Fonte única: targeting criado UMA vez por getTagBundleConfig() e entregue ao TagBundle.
  // Sem key-values adicionais: não recriar user/noticiaTag/exclusivo, nem incluir pos.
  function getVideoCustParams(targeting) {
    if (!targeting || typeof targeting !== 'object') {
      throw new Error('Targeting do TagBundle indisponível para VAST');
    }
    var params = new URLSearchParams();
    Object.keys(targeting).forEach(function (key) {
      var value = targeting[key];
      if (Array.isArray(value)) {
        value = value.filter(function (item) {
          return item !== null && item !== undefined && String(item) !== '';
        }).join(',');
      }
      if (value !== null && value !== undefined && String(value) !== '') {
        params.set(key, String(value));
      }
    });
    return params.toString();
  }

  function createVastRequestUrl(placement, targeting) {
    var pageUrl = window.location.href;
    var ts = String(Date.now());
    var q = new URLSearchParams({
      iu: getVideoAdUnitPath(placement),
      plcmt: '2',
      vpa: 'auto',
      vpmute: '1',
      vpos: 'preroll',
      wta: '1',
      description_url: pageUrl,
      tfcd: '0',
      ad_type: 'video',
      vad_type: 'linear',
      // Tamanho do inventário VAST já definido na adunit: 640x360v ou 320x180v.
      sz: window.matchMedia && window.matchMedia('(max-width: 767px)').matches ? '320x180' : '640x360',
      gdfp_req: '1',
      output: 'vast',
      unviewed_position_start: '1',
      env: 'vp',
      impl: 's',
      correlator: ts,
      url: pageUrl,
      cust_params: getVideoCustParams(targeting)
    });
    return 'https://pubads.g.doubleclick.net/gampad/ads?' + q.toString();
  }
  function mount(wrapper, placement, options) {
    if (!wrapper || !placement || !eligible()) return false;
    if (wrapper.getAttribute('data-publico-vertcontent-video') === '1') return true;
    var opts = config();
    options = options || {};
    if (!options.targeting || typeof options.targeting !== 'object') {
      throw new Error('Targeting da inicialização indisponível para o VAST Incontent');
    }
    var stage = document.createElement('div');
    stage.className = 'pub-vcv-stage is-loading';
    var instance = { wrapper: wrapper, placement: placement, stage: stage, state: 'pending', player: null, observer: null, safetyTimer: null, hadVisibleContent: false };
    instances.push(instance);
    wrapper.setAttribute('data-publico-vertcontent-video', '1');
    // Nenhuma altura reservada ate existir pedido real de video ou display.
    wrapper.setAttribute('data-publico-vcv-reserved', '0');
    wrapper.appendChild(stage);
    instance.targeting = options.targeting;
    instance.activeRatio = 16 / 9;
    instance.inAd = false;
    fitVideoStage(instance, instance.activeRatio);

    function fallback(reason) {
      if (instance.state === 'display') return;
      // Preservar altura apenas se ja houve carregamento; a resposta no-fill
      // podera colapsar o slot se nunca houve anuncio/video reproduzido.
      instance.state = 'display';
      if (instance.observer) { instance.observer.disconnect(); instance.observer = null; }
      if (instance.safetyTimer) { window.clearTimeout(instance.safetyTimer); instance.safetyTimer = null; }
      if (instance.sizingCleanup) { instance.sizingCleanup(); instance.sizingCleanup = null; }
      if (instance.player && !instance.player.isDisposed()) {
        try { instance.player.dispose(); } catch (e) { log('Erro no dispose', e); }
      }
      // A colocação só é introduzida após o vídeo falhar.
      // O TagBundle do PÚBLICO deve observar os ad-placement dinâmicos, como já acontece com os artigos fechados.
      wrapper.replaceChildren(placement);
      // Voltar ao layout display, mantendo a altura reservada no wrapper.
      // data-publico-vcv-reserved mantem-se deliberadamente.
      wrapper.removeAttribute('data-publico-vertcontent-video');
      wrapper.setAttribute('data-publico-video-result', 'display');
      wrapper.setAttribute('data-publico-video-fallback-reason', String(reason || 'unknown'));
      log('Fallback para display', placement.id, reason);
      document.dispatchEvent(new CustomEvent('publico:vertcontent-display-ready', {
        detail: { placement: placement, wrapper: wrapper, reason: reason }
      }));
      window.setTimeout(function () {
        if (!window.googletag || !window.googletag.pubads) return;
        var known = window.googletag.pubads().getSlots().some(function (s) {
          return s.getSlotElementId() === placement.id;
        });
        if (!known) console.warn('[PUB VertVideo] TagBundle ainda não registou o slot display', placement.id);
      }, 3000);
    }
    instance.fallback = fallback;
    function start() {
      if (instance.state !== 'pending' || !wrapper.isConnected) return;
      instance.state = 'loading';
      activateVertContentHeight(instance);
      var timeout = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = window.setTimeout(function () { if (timeout) timeout.abort(); }, 6000);
      fetch('https://hugopedroso.com/publico/video/playlist.json', { credentials: 'omit', mode: 'cors', cache: 'no-store', signal: timeout ? timeout.signal : undefined })
        .then(function (resp) { if (!resp.ok) throw new Error('Playlist HTTP ' + resp.status); return resp.json(); })
        .then(function (json) {
          var list = normalisePlaylist(json);
          if (!list.length) throw new Error('Playlist JSON vazia');
          return ensureAssets().then(function () { return json; });
        })
        .then(function (json) {
          if (instance.state !== 'loading' || !wrapper.isConnected) return;
          var shell = document.createElement('div');
          shell.id = 'pub-vertcontent-video-' + placement.id;
          shell.className = 'pub-video-shell';
          shell.setAttribute('data-vjs-player', '');
          shell.setAttribute('data-player-mode', 'content');
          shell.setAttribute('data-publico-vertcontent-video', '1');
          shell.setAttribute('data-player-id', shell.id);
          shell.setAttribute('data-video-src', normalisePlaylist(json)[0].src || normalisePlaylist(json)[0].url || '');
          shell.setAttribute('data-video-type', normalisePlaylist(json)[0].type || 'video/mp4');
          shell.setAttribute('data-playlist-loop', 'true');
          shell.setAttribute('data-autoplay', 'true');
          shell.setAttribute('data-muted', 'true');
          shell.setAttribute('data-volume', '1');
          shell.setAttribute('data-autoplay-muted-fallback', 'true');
          shell.setAttribute('data-ad-floating', String(Boolean(opts.floating)));
          shell.setAttribute('data-sticky', 'false');
          shell.setAttribute('data-preload', 'metadata');
          shell.setAttribute('data-vast-timeout', '7000');
          shell.setAttribute('data-vast-attempt-timeout', String(opts.vastTimeoutMs));
          shell.setAttribute('data-vast-max-misses', String(opts.maxNoAd));
          shell.setAttribute('data-ad-tag-url', createVastRequestUrl(placement, instance.targeting));
          shell.setAttribute('data-description-url', window.location.href);
          shell.setAttribute('data-ad-vpa', 'auto');
          shell.setAttribute('data-ad-vpmute', '1');
          var video = document.createElement('video');
          video.className = 'video-js vjs-default-skin';
          video.playsInline = true;
          video.muted = true;
          video.preload = 'metadata';
          shell.appendChild(video);
          shell.addEventListener('publico:vertvideo-fallback', function (ev) { fallback(ev.detail && ev.detail.reason); });
          shell.addEventListener('publico:vertvideo-attempt', function (ev) {
            wrapper.setAttribute('data-publico-video-attempt', String(ev.detail.attempt));
            wrapper.setAttribute('data-publico-video-misses', String(ev.detail.misses));
          });
          shell.addEventListener('publico:vertvideo-ad-started', function () {
            instance.hadVisibleContent = true;
            if (window.PubAdLayout) window.PubAdLayout.videoVisible(instance.wrapper);
            if (instance.safetyTimer) { window.clearTimeout(instance.safetyTimer); instance.safetyTimer = null; }
            wrapper.setAttribute('data-publico-video-misses', '0');
            wrapper.setAttribute('data-publico-video-result', 'vast-started');
          });
          stage.classList.remove('is-loading');
          stage.appendChild(shell);
          fitVideoStage(instance, instance.activeRatio);
          if (!window.VJSPlayer.setPlaylist(shell, json)) throw new Error('Playlist inválida no VideoJS');
          instance.player = window.VJSPlayer.create(shell);
          if (!instance.player && !shell._publisherPlaylistLoading) throw new Error('O VideoJS não criou o player');
          if (instance.player) {
            // Se uma versão antiga da biblioteca ignorar o modo fill na criação,
            // desativar fluid e ativar fill no player desta instância.
            if (typeof instance.player.fluid === 'function') instance.player.fluid(false);
            if (typeof instance.player.fill === 'function') instance.player.fill(true);
            bindVideoSizing(instance, shell, instance.player);
          }
          instance.state = 'video';
          // O watchdog só é acionado se o player NÃO fizer qualquer pedido.
          // Os 3 pedidos sem VAST são contabilizados no próprio publisher-video-player.js.
          instance.safetyTimer = window.setTimeout(function () {
            if (instance.state !== 'video') return;
            var monitor = shell._pubVertMonitor;
            if (!monitor || monitor.attempts === 0) fallback('player-no-vast-request');
          }, opts.startupTimeoutMs);
          log('Player carregado no primeiro VertContent', placement.id, 'VAST:', shell.getAttribute('data-ad-tag-url'));
        })
        .catch(function (error) { fallback(error && error.message ? error.message : 'player-error'); })
        .finally(function () { window.clearTimeout(timer); });
    }
    if (!options.startImmediately && window.IntersectionObserver) {
      instance.observer = new IntersectionObserver(function (items) {
        if (!items.some(function (e) { return e.isIntersecting; })) return;
        instance.observer.disconnect(); instance.observer = null;
        start();
      }, { rootMargin: opts.rootMargin, threshold: 0.5 });
      instance.observer.observe(wrapper);
    } else {
      // O ads_publico.js já aguardou a proximidade do ecrã.
      window.setTimeout(start, 0);
    }
    log('Reservado primeiro VertContent para vídeo:', placement.id);
    return true;
  }
  window.VertInContentRequest = Object.assign(window.VertInContentRequest || {}, {
    mount: mount,
    eligible: eligible,
    instances: instances,
    inspect: function () {
      var result = instances.map(function (x) {
        var shell = x.stage.querySelector('.pub-video-shell');
        var request = shell && (shell.getAttribute('data-last-ad-tag-url') || shell.getAttribute('data-ad-tag-url'));
        var vastUrl = request ? new URL(request, window.location.href) : null;
        var kv = vastUrl ? Object.fromEntries(new URLSearchParams(vastUrl.searchParams.get('cust_params') || '')) : {};
        return {
          slot: x.placement.id,
          state: x.state,
          displayAdUnit: '/4458504/' + x.placement.getAttribute('adunit'),
          videoAdUnit: vastUrl ? vastUrl.searchParams.get('iu') : getVideoAdUnitPath(x.placement),
          playerWidthPx: Math.round(x.stage.getBoundingClientRect().width),
          playerHeightPx: Math.round(x.stage.getBoundingClientRect().height),
          wrapperHeightPx: Math.round(x.wrapper.getBoundingClientRect().height),
          hadVisibleContent: Boolean(x.hadVisibleContent),
          playerAspectRatio: Number((x.activeRatio || 16 / 9).toFixed(4)),
          currentAdInfo: x.currentAdInfo || null,
          keyValues: kv,
          attempts: x.wrapper.getAttribute('data-publico-video-attempt'),
          misses: x.wrapper.getAttribute('data-publico-video-misses'),
          fallbackReason: x.wrapper.getAttribute('data-publico-video-fallback-reason')
        };
      });
      console.info('[PUB VertVideo] Targeting recebido na montagem:', instances[0] && instances[0].targeting);
      console.table(result.map(function (x) {
        return { slot: x.slot, state: x.state, displayAdUnit: x.displayAdUnit,
          videoAdUnit: x.videoAdUnit, playerWidthPx: x.playerWidthPx, playerHeightPx: x.playerHeightPx,
          wrapperHeightPx: x.wrapperHeightPx,
          playerAspectRatio: x.playerAspectRatio,
          adApi: x.currentAdInfo && x.currentAdInfo.apiFramework || '',
          mediaDimensions: x.currentAdInfo ? x.currentAdInfo.mediaWidth + 'x' + x.currentAdInfo.mediaHeight : '',
          keyValues: JSON.stringify(x.keyValues), attempts: x.attempts, misses: x.misses };
      }));
      return result;
    },
    forceDisplay: function () { if (instances.length) instances[0].fallback('manual'); }
  });
})(window, document);
