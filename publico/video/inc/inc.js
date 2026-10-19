(function (window, document) {
  'use strict';

  var MODULE_SCRIPT_URL = document.currentScript && document.currentScript.src || null;
  if (!MODULE_SCRIPT_URL) throw new Error('Não foi possível identificar a localização do módulo HTML5 IMA');
  var PLAYLIST = new URL('../playlist.json', MODULE_SCRIPT_URL).href;
  var PLAYER_CSS = new URL('inc.css?v=20261019-mobile300-vastcontain', MODULE_SCRIPT_URL).href;
  var FALLBACK_MEDIA = new URL('fallback.mp4', MODULE_SCRIPT_URL).href;
  var LIMIT_LOOPS = 5;
  var VAST_TIMEOUT = 9000;
  var records = [];
  var imaPromise = null;

  function log() {
    if (window.console && console.info) console.info.apply(console, ['[PUB HTML5 IMA]'].concat(Array.prototype.slice.call(arguments)));
  }

  function loadIma() {
    if (window.google && window.google.ima) return Promise.resolve(window.google.ima);
    if (imaPromise) return imaPromise;
    imaPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
      script.async = true;
      script.onload = function () {
        if (window.google && window.google.ima) resolve(window.google.ima);
        else reject(new Error('Google IMA não inicializou'));
      };
      script.onerror = function () { reject(new Error('Não foi possível carregar Google IMA')); };
      document.head.appendChild(script);
    }).catch(function (error) { imaPromise = null; throw error; });
    return imaPromise;
  }

  function addCss() {
    var url = PLAYER_CSS;
    if (document.querySelector('link[data-inc="css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-inc', 'css');
    document.head.appendChild(link);
  }

  function validPlaylist(payload) {
    var list = Array.isArray(payload) ? payload : payload && payload.videos;
    if (!Array.isArray(list)) return [];
    return list.map(function (entry) {
      return typeof entry === 'string' ? { src: entry, type: 'video/mp4' } : entry;
    }).filter(function (entry) {
      if (!entry || typeof entry.src !== 'string' || !entry.src.trim()) return false;
      try {
        var u = new URL(entry.src, PLAYLIST);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
        if (entry.type) return /^video\/mp4(?:\s*;|$)/i.test(entry.type.trim());
        return /\.mp4$/i.test(u.pathname);
      } catch (e) { return false; }
    });
  }

  function pathFor(placement) {
    var parts = String(placement.getAttribute('adunit') || '').split('/');
    if (parts[0] !== 'Vert_Publico' || !/^(Anonymous|Registered|Subscriber)$/.test(parts[1]) || !parts[2] || parts[3] !== 'VertContent') {
      throw new Error('Adunit VertContent inválido: ' + parts.join('/'));
    }
    return '/4458504/Incontent/' + parts[1] + '/' + parts[2];
  }

  function custParams(targeting) {
    if (!targeting || typeof targeting !== 'object') throw new Error('Targeting TagBundle indisponível');
    var p = new URLSearchParams();
    Object.keys(targeting).forEach(function (key) {
      var value = targeting[key];
      if (Array.isArray(value)) value = value.filter(function (item) { return item != null && String(item) !== ''; }).join(',');
      if (value != null && String(value) !== '') p.set(key, String(value));
    });
    return p.toString();
  }

  function deviceType() {
    var ua = navigator.userAgent || '';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return '4';
    if (/iPhone|iPod|Android.*Mobile|Windows Phone|Mobi/i.test(ua)) return '2';
    if (/Windows NT|Macintosh|X11|Linux x86_64|CrOS/i.test(ua)) return '3';
    return '';
  }

  function buildVast(rec, item) {
    var now = String(Date.now() + Math.floor(Math.random() * 10000));
    var duration = Number(rec.video.duration);
    var isMobile = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
    var params = new URLSearchParams({
      iu: pathFor(rec.placement),
      ad_rule: '0',
      plcmt: '1',
      hl: 'pt',
      vconp: '2',
      vpa: rec.userStarted ? 'click' : 'auto',
      vpmute: rec.adMuted ? '1' : '0',
      vpos: 'preroll',
      wta: '1',
      description_url: window.location.href,
      tfcd: '0',
      ad_type: 'video',
      vad_type: 'linear',
      sz: isMobile ? '320x180' : '640x360',
      gdfp_req: '1',
      output: 'vast',
      unviewed_position_start: '1',
      env: 'vp',
      impl: 's',
      correlator: now,
      url: window.location.href,
      cust_params: custParams(rec.targeting)
    });
    var hint = deviceType();
    if (hint) params.set('dth', hint);
    if (isFinite(duration) && duration > 0) params.set('vid_d', String(Math.ceil(duration)));
    if (item.title) params.set('ct_ti', String(item.title));
    return 'https://pubads.g.doubleclick.net/gampad/ads?' + params.toString();
  }

  function dom(rec) {
    var shell = document.createElement('div');
    shell.className = 'pub-video-shell pub-html5-shell is-loading';
    shell.setAttribute('data-inc', 'player');
    var media = document.createElement('video');
    media.className = 'pub-html5-media';
    media.playsInline = true;
    media.setAttribute('playsinline', '');
    media.setAttribute('webkit-playsinline', '');
    media.preload = 'metadata';
    media.controls = false;
    media.muted = false;
    media.volume = 0.01;
    var adLayer = document.createElement('div');
    adLayer.className = 'pub-html5-ad-layer';
    var contentLink = document.createElement('a');
    contentLink.className = 'pub-html5-content-link';
    contentLink.target = '_blank';
    contentLink.rel = 'noopener noreferrer sponsored';
    contentLink.setAttribute('aria-label', 'Abrir conteúdo editorial');
    var controls = document.createElement('div');
    controls.className = 'pub-html5-controls';
    var mute = document.createElement('button');
    mute.type = 'button';
    mute.className = 'pub-html5-control pub-html5-mute';
    var play = document.createElement('button');
    play.type = 'button';
    play.className = 'pub-html5-control pub-html5-play';
    mute.setAttribute('aria-label', 'Silenciar');
    play.setAttribute('aria-label', 'Pausar');
    controls.appendChild(mute);
    controls.appendChild(play);
    shell.appendChild(media);
    shell.appendChild(contentLink);
    shell.appendChild(adLayer);
    shell.appendChild(controls);
    rec.stage.appendChild(shell);
    rec.shell = shell;
    rec.video = media;
    rec.adLayer = adLayer;
    rec.playControl = play;
    rec.muteControl = mute;
    rec.contentLink = contentLink;
    shell.addEventListener('click', function (event) {
      if (event.target !== media || rec.adPlaying) return;
      if (rec.manualPause) resumeContent(rec, true);
      else { rec.manualPause = true; media.pause(); updateUI(rec); }
    });
    play.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (rec.adPlaying) return;
      if (rec.manualPause || media.paused) resumeContent(rec, true);
      else { rec.manualPause = true; media.pause(); updateUI(rec); }
    });
    mute.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (rec.adPlaying || rec.waitingAds) {
        rec.adMuted = !rec.adMuted;
        media.muted = rec.adMuted;
        if (rec.manager && typeof rec.manager.setVolume === 'function') {
          try { rec.manager.setVolume(rec.adMuted ? 0 : rec.volume); } catch (e) {}
        }
      } else {
        rec.muted = !rec.muted;
        media.muted = rec.muted;
      }
      updateUI(rec);
    });
    media.addEventListener('play', function () { updateUI(rec); });
    media.addEventListener('pause', function () { updateUI(rec); });
    media.addEventListener('ended', function () { if (!rec.adPlaying) nextItem(rec); });
    window.addEventListener('resize', rec.onResize);
    updateUI(rec);
  }

  function updateUI(rec) {
    if (!rec.shell) return;
    rec.shell.classList.toggle('is-ad-playing', rec.adPlaying);
    rec.shell.classList.toggle('is-ad-requesting', rec.waitingAds);
    var audioMuted = rec.adPlaying || rec.waitingAds ? rec.adMuted : rec.muted;
    rec.shell.classList.toggle('is-audio-muted', audioMuted);
    rec.shell.classList.toggle('is-content-paused', rec.manualPause || rec.video.paused);
    rec.playControl.setAttribute('aria-label', rec.manualPause || rec.video.paused ? 'Reproduzir' : 'Pausar');
    rec.playControl.title = rec.manualPause || rec.video.paused ? 'Reproduzir' : 'Pausar';
    rec.muteControl.setAttribute('aria-label', audioMuted ? 'Ativar som' : 'Silenciar');
    rec.muteControl.title = audioMuted ? 'Ativar som' : 'Silenciar';
  }

  function markVisible(rec) {
    rec.hadVisibleContent = true;
    if (window.PubAdLayout && window.PubAdLayout.videoVisible) window.PubAdLayout.videoVisible(rec.wrapper);
  }

  function clearAds(rec) {
    if (rec.adTimer) window.clearTimeout(rec.adTimer);
    rec.adTimer = null;
    if (rec.manager) {
      try { rec.manager.destroy(); } catch (e) {}
    }
    rec.manager = null;
    rec.waitingAds = false;
    rec.adPlaying = false;
    rec.currentRequest = null;
    if (rec.shell) updateUI(rec);
  }

  function resumeContent(rec, fromClick) {
    if (rec.destroyed || rec.adPlaying || rec.waitingAds) return;
    if (fromClick) {
      rec.manualPause = false;
      rec.userStarted = true;
      if (rec.awaitingGesture && rec.currentRequest) {
        rec.awaitingGesture = false;
        rec.waitingAds = true;
        startManager(rec, rec.currentRequest, true);
        updateUI(rec);
        if (rec.waitingAds || rec.adPlaying) return;
      }
    }
    if (rec.manualPause) { updateUI(rec); return; }
    rec.video.muted = rec.muted;
    rec.video.volume = rec.volume;
    var promise;
    try { promise = rec.video.play(); } catch (error) { autoplayError(rec, error); return; }
    if (promise && promise.catch) promise.catch(function (error) { autoplayError(rec, error); });
    updateUI(rec);
  }

  function autoplayError(rec, error) {
    if (rec.destroyed || rec.manualPause || rec.adPlaying) return;
    if (error && error.name === 'NotAllowedError' && !rec.muted) {
      rec.muted = true;
      rec.video.muted = true;
      rec.shell.setAttribute('data-audio-autoplay-status', 'blocked-by-browser');
      updateUI(rec);
      var attempt = rec.video.play();
      if (attempt && attempt.catch) attempt.catch(function () { rec.manualPause = true; updateUI(rec); });
      return;
    }
    rec.manualPause = true;
    updateUI(rec);
  }

  function finishAds(rec, token, reason) {
    if (rec.destroyed || token !== rec.currentRequest || rec.completedRequest === token) return;
    rec.completedRequest = token;
    if (!rec.adStartedForRequest) {
      rec.misses++;
      rec.wrapper.setAttribute('data-publico-video-misses', String(rec.misses));
      log('VAST sem reprodução:', reason, 'pedido', rec.attempts);
    }
    clearAds(rec);
    rec.muted = false;
    rec.video.muted = false;
    rec.video.volume = rec.volume;
    updateUI(rec);
    resumeContent(rec, false);
  }

  function sizeOf(rec) {
    var rect = rec.adLayer.getBoundingClientRect();
    return { width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)) };
  }

  function bindManager(rec, manager, token) {
    var ima = window.google.ima;
    function listen(eventName, fn) { manager.addEventListener(eventName, fn); }
    listen(ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, function () {
      if (token !== rec.currentRequest) return;
      rec.video.pause();
      rec.video.muted = rec.adMuted;
      rec.adPlaying = true;
      rec.waitingAds = false;
      updateUI(rec);
    });
    listen(ima.AdEvent.Type.STARTED, function () {
      if (token !== rec.currentRequest) return;
      rec.adStartedForRequest = true;
      rec.emptyLoops = 0;
      rec.misses = 0;
      rec.playedThisLoop = true;
      rec.adPlaying = true;
      rec.waitingAds = false;
      rec.wrapper.setAttribute('data-publico-video-result', 'vast-started');
      rec.wrapper.setAttribute('data-publico-video-misses', '0');
      if (rec.adTimer) { window.clearTimeout(rec.adTimer); rec.adTimer = null; }
      rec.adMuted = true;
      if (rec.manager && typeof rec.manager.setVolume === 'function') {
        try { rec.manager.setVolume(0); } catch (e) {}
      }
      rec.video.muted = true;
      markVisible(rec);
      updateUI(rec);
      log('Publicidade VAST iniciou reprodução', token);
    });
    listen(ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, function () { finishAds(rec, token, 'ad-complete'); });
    listen(ima.AdEvent.Type.ALL_ADS_COMPLETED, function () { finishAds(rec, token, 'all-complete'); });
    listen(ima.AdEvent.Type.SKIPPED, function () { finishAds(rec, token, 'skipped'); });
    manager.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, function (event) {
      log('Erro IMA:', event.getError && String(event.getError()));
      finishAds(rec, token, 'ima-error');
    });
  }

  function startManager(rec, token, byUser) {
    if (rec.destroyed || token !== rec.currentRequest || !rec.manager) return;
    if (rec.startedManager === token) return;
    try {
      rec.adDisplay.initialize();
      var size = sizeOf(rec);
      rec.manager.init(size.width, size.height, window.google.ima.ViewMode.NORMAL);
      rec.manager.setVolume(rec.adMuted ? 0 : rec.volume);
      rec.startedManager = token;
      rec.manager.start();
    } catch (error) {
      log('O IMA não conseguiu iniciar:', error.message || String(error));
      if (!byUser && /user|gesture|interact|initialize/i.test(String(error.message || error))) {
        rec.awaitingGesture = true;
        rec.manualPause = true;
        rec.waitingAds = false;
        updateUI(rec);
      } else finishAds(rec, token, 'ima-start-error');
    }
  }

  function setupIma(rec) {
    var ima = window.google.ima;
    rec.adDisplay = new ima.AdDisplayContainer(rec.adLayer, rec.video);
    rec.loader = new ima.AdsLoader(rec.adDisplay);
    rec.loader.addEventListener(ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, function (event) {
      var token = event.getUserRequestContext && event.getUserRequestContext();
      if (token == null) token = rec.currentRequest;
      if (!token || rec.destroyed || token !== rec.currentRequest) return;
      var manager;
      try {
        var rendering = new ima.AdsRenderingSettings();
        rendering.restoreCustomPlaybackStateOnAdBreakComplete = false;
        manager = event.getAdsManager(rec.video, rendering);
      } catch (error) { finishAds(rec, token, 'manager-load-error'); return; }
      rec.manager = manager;
      bindManager(rec, manager, token);
      startManager(rec, token, false);
    });
    rec.loader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, function (event) {
      log('Falha ao receber VAST:', event.getError && String(event.getError()));
      finishAds(rec, rec.currentRequest, 'no-fill');
    });
  }

  function requestAd(rec, item) {
    if (rec.destroyed) return;
    clearAds(rec);
    rec.attempts++;
    var token = rec.attempts;
    rec.completedRequest = null;
    rec.startedManager = null;
    rec.adStartedForRequest = false;
    rec.adMuted = false;
    rec.video.muted = false;
    rec.awaitingGesture = false;
    rec.currentRequest = token;
    rec.waitingAds = true;
    rec.wrapper.setAttribute('data-publico-video-attempt', String(token));
    rec.wrapper.setAttribute('data-publico-video-misses', String(rec.misses));
    var url = buildVast(rec, item);
    rec.lastUrl = url;
    rec.shell.setAttribute('data-last-ad-tag-url', url);
    var request = new window.google.ima.AdsRequest();
    request.adTagUrl = url;
    var size = sizeOf(rec);
    request.linearAdSlotWidth = size.width;
    request.linearAdSlotHeight = size.height;
    request.nonLinearAdSlotWidth = size.width;
    request.nonLinearAdSlotHeight = Math.min(150, size.height);
    request.vastLoadTimeout = 7000;
    request.pageUrl = window.location.href;
    var duration = Number(rec.video.duration);
    if (isFinite(duration) && duration > 0) request.contentDuration = duration;
    if (item.title) request.contentTitle = String(item.title);
    if (typeof request.setAdWillAutoPlay === 'function') request.setAdWillAutoPlay(!rec.userStarted);
    if (typeof request.setAdWillPlayMuted === 'function') request.setAdWillPlayMuted(rec.adMuted);
    rec.adTimer = window.setTimeout(function () { finishAds(rec, token, 'timeout'); }, VAST_TIMEOUT);
    updateUI(rec);
    try { rec.loader.requestAds(request, token); }
    catch (error) { finishAds(rec, token, 'request-error'); }
  }

  function fallbackPlaylist(rec, reason) {
    if (rec.destroyed) return;
    if (rec.usingFallbackMedia) { rec.fallback('fallback-media-unavailable'); return; }
    rec.usingFallbackMedia = true;
    rec.failedMediaIndices = {};
    rec.playlist = [{ title: 'Fallback', src: FALLBACK_MEDIA, type: 'video/mp4', mediaButton: true }];
    rec.emptyLoops = 0;
    rec.playedThisLoop = false;
    rec.wrapper.setAttribute('data-inc-fallback', '1');
    rec.wrapper.setAttribute('data-inc-fallback-reason', String(reason));
    log('Usar fallback.mp4:', reason);
    if (rec.shell) prepareItem(rec, 0);
  }

  function nextItem(rec) {
    if (rec.destroyed || rec.waitingAds || rec.adPlaying) return;
    var next = rec.index;
    var skipped = 0;
    do {
      next++;
      if (next >= rec.playlist.length) {
        rec.completedLoops++;
        if (rec.playedThisLoop) rec.emptyLoops = 0;
        else rec.emptyLoops++;
        rec.playedThisLoop = false;
        rec.wrapper.setAttribute('data-publico-video-completed-loops', String(rec.completedLoops));
        rec.wrapper.setAttribute('data-publico-video-empty-loops', String(rec.emptyLoops));
        log('Loop completo:', rec.completedLoops, 'sem anúncios consecutivos:', rec.emptyLoops);
        if (rec.emptyLoops >= rec.maxLoops) { rec.fallback('no-vast-after-' + rec.maxLoops + '-playlist-loops'); return; }
        next = 0;
      }
      skipped++;
    } while (rec.failedMediaIndices[next] && skipped < rec.playlist.length);
    if (rec.failedMediaIndices[next]) { fallbackPlaylist(rec, 'playlist-mp4-unavailable'); return; }
    prepareItem(rec, next);
  }

  function prepareItem(rec, index) {
    if (rec.destroyed) return;
    rec.index = index;
    rec.itemEpoch++;
    var epoch = rec.itemEpoch;
    var item = rec.playlist[index];
    rec.shell.classList.add('is-loading');
    rec.shell.classList.toggle('has-media-button', item.mediaButton === true);
    var linkUrl = '';
    if (typeof item.url === 'string' && item.url.trim()) {
      try {
        var parsedLink = new URL(item.url.trim(), window.location.href);
        if (parsedLink.protocol === 'https:' || parsedLink.protocol === 'http:') linkUrl = parsedLink.href;
      } catch (e) {}
    }
    if (linkUrl) rec.contentLink.href = linkUrl;
    else rec.contentLink.removeAttribute('href');
    rec.contentLink.classList.toggle('is-disabled', !linkUrl);
    rec.video.pause();
    function mediaError(reason) {
      if (rec.destroyed || epoch !== rec.itemEpoch) return;
      if (rec.mediaTimer) { window.clearTimeout(rec.mediaTimer); rec.mediaTimer = null; }
      rec.failedMediaIndices[index] = true;
      if (rec.usingFallbackMedia) { rec.fallback('fallback-media-' + reason); return; }
      if (rec.playlist.every(function (entry, i) { return rec.failedMediaIndices[i]; })) {
        fallbackPlaylist(rec, 'playlist-mp4-unavailable');
      } else nextItem(rec);
    }
    rec.mediaTimer = window.setTimeout(function () { mediaError('timeout'); }, 12000);
    rec.video.onloadedmetadata = function () {
      if (rec.destroyed || epoch !== rec.itemEpoch) return;
      if (rec.mediaTimer) { window.clearTimeout(rec.mediaTimer); rec.mediaTimer = null; }
      rec.shell.classList.remove('is-loading');
      requestAd(rec, item);
    };
    rec.video.onerror = function () { mediaError('error'); };
    rec.video.src = new URL(item.src, PLAYLIST).href;
    rec.video.load();
    log('Playlist:', index + 1, '/', rec.playlist.length, item.title || 'MP4');
  }

  function destroy(rec) {
    if (rec.destroyed) return;
    rec.destroyed = true;
    if (rec.downloadTimer) window.clearTimeout(rec.downloadTimer);
    if (rec.mediaTimer) window.clearTimeout(rec.mediaTimer);
    if (rec.adTimer) window.clearTimeout(rec.adTimer);
    if (rec.loader) { try { rec.loader.destroy(); } catch (e) {} }
    if (rec.manager) { try { rec.manager.destroy(); } catch (e) {} }
    window.removeEventListener('resize', rec.onResize);
    if (rec.video) { rec.video.pause(); rec.video.removeAttribute('src'); rec.video.load(); }
    if (rec.observer) rec.observer.disconnect();
  }

  function mount(wrapper, placement, options) {
    if (!wrapper || !placement || !window.pub || window.pub.pageType !== 'noticia' || window.pub.showAds === false || window.hasAds === false) return false;
    if (wrapper.getAttribute('data-publico-vertcontent-video') === '1') return true;
    if (!options || !options.targeting || typeof options.targeting !== 'object') throw new Error('Targeting TagBundle em falta');
    pathFor(placement);
    var stage = document.createElement('div');
    stage.className = 'pub-vcv-stage';
    var rec = {
      wrapper: wrapper, placement: placement, stage: stage, targeting: options.targeting,
      state: 'loading', player: null, video: null, manager: null, loader: null, adDisplay: null,
      playlist: [], index: 0, completedLoops: 0, emptyLoops: 0, playedThisLoop: false,
      attempts: 0, misses: 0, itemEpoch: 0, currentRequest: null, completedRequest: null,
      adPlaying: false, waitingAds: false, adStartedForRequest: false, muted: false, adMuted: false, volume: 0.01,
      manualPause: false, userStarted: false, awaitingGesture: false, destroyed: false,
      maxLoops: Math.max(1, Number(window.VertInContentRequest && window.VertInContentRequest.maxPlaylistLoopsWithoutVast) || LIMIT_LOOPS),
      hadVisibleContent: false, mediaTimer: null, failedMediaIndices: {}, usingFallbackMedia: false
    };
    rec.onResize = function () {
      if (!rec.manager || !rec.adPlaying) return;
      try { var size = sizeOf(rec); rec.manager.resize(size.width, size.height, window.google.ima.ViewMode.NORMAL); } catch (e) {}
    };
    rec.fallback = function (reason) {
      if (rec.state === 'display') return;
      rec.state = 'display';
      destroy(rec);
      wrapper.replaceChildren(placement);
      wrapper.removeAttribute('data-publico-vertcontent-video');
      wrapper.setAttribute('data-publico-video-result', 'display');
      wrapper.setAttribute('data-publico-video-fallback-reason', String(reason || 'unknown'));
      document.dispatchEvent(new CustomEvent('publico:vertcontent-display-ready', { detail: { placement: placement, wrapper: wrapper, reason: reason } }));
      log('Fallback para VertContent display:', reason);
    };
    records.push(rec);
    wrapper.setAttribute('data-publico-vertcontent-video', '1');
    wrapper.setAttribute('data-publico-vcv-reserved', '0');
    wrapper.appendChild(stage);
    wrapper.setAttribute('data-publico-vcv-reserved', '1');
    if (window.PubAdLayout && window.PubAdLayout.videoRequested) window.PubAdLayout.videoRequested(wrapper);
    addCss();
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    rec.downloadTimer = window.setTimeout(function () { if (controller) controller.abort(); }, 6000);
    Promise.all([
      fetch(PLAYLIST, { credentials: 'omit', mode: 'cors', cache: 'no-store', signal: controller ? controller.signal : undefined }).then(function (response) {
        if (!response.ok) throw new Error('Playlist HTTP ' + response.status);
        return response.json();
      }).catch(function (error) {
        log('Playlist indisponível:', error.message || String(error));
        return null;
      }),
      loadIma()
    ]).then(function (results) {
      if (rec.destroyed || !wrapper.isConnected) return;
      rec.playlist = validPlaylist(results[0]);
      if (!rec.playlist.length) fallbackPlaylist(rec, 'playlist-missing-or-empty');
      dom(rec);
      setupIma(rec);
      rec.state = 'video';
      prepareItem(rec, 0);
    }).catch(function (error) {
      if (!rec.destroyed) rec.fallback(error.message || 'init-error');
    }).finally(function () { window.clearTimeout(rec.downloadTimer); });
    return true;
  }

  function inspect() {
    var result = records.map(function (rec) {
      return {
        slot: rec.placement.id,
        state: rec.state,
        videoAdUnit: '/4458504/Incontent/' + (String(rec.placement.getAttribute('adunit')).split('/')[1] || '') + '/' + (String(rec.placement.getAttribute('adunit')).split('/')[2] || ''),
        player: 'HTML5 + Google IMA',
        muted: rec.muted,
        adMuted: rec.adMuted,
        volume: rec.volume,
        currentItem: rec.playlist[rec.index] && rec.playlist[rec.index].title || null,
        mediaButton: Boolean(rec.playlist[rec.index] && rec.playlist[rec.index].mediaButton === true),
        fallbackMedia: rec.usingFallbackMedia,
        fallbackMediaUrl: rec.usingFallbackMedia ? FALLBACK_MEDIA : null,
        attempts: rec.attempts,
        misses: rec.misses,
        completedLoops: rec.completedLoops,
        emptyLoops: rec.emptyLoops,
        adPlaying: rec.adPlaying,
        waitingAds: rec.waitingAds,
        lastVastUrl: rec.lastUrl || null,
        fallbackReason: rec.wrapper.getAttribute('data-publico-video-fallback-reason')
      };
    });
    console.table(result);
    return result;
  }

  window.VertInContentRequest = Object.assign(window.VertInContentRequest || {}, {
    mount: mount,
    eligible: function () { return Boolean(window.pub && window.pub.pageType === 'noticia'); },
    enabled: true,
    maxPlaylistLoopsWithoutVast: LIMIT_LOOPS,
    instances: records,
    inspect: inspect,
    forceDisplay: function () { if (records.length) records[0].fallback('manual'); }
  });
})(window, document);
