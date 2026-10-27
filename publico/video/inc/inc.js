(function (window, document) {
  'use strict';

  var MODULE_SCRIPT_URL = document.currentScript && document.currentScript.src || null;
  if (!MODULE_SCRIPT_URL) throw new Error('Não foi possível identificar a localização do módulo HTML5 IMA');
  var PLAYLIST = new URL('../playlist.js', MODULE_SCRIPT_URL).href;
  var PLAYER_CSS = new URL('inc.css?v=20261019-media-controls-v11', MODULE_SCRIPT_URL).href;
  var FALLBACK_MEDIA = new URL('fallback.mp4', MODULE_SCRIPT_URL).href;
  var DEFAULT_EXTRA_LOOPS = 0;
  var VAST_TIMEOUT = 9000;
  var records = [];
  var imaPromise = null;
  var playlistPromise = null;

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

  function loadPlaylist() {
    if (playlistPromise) return playlistPromise;
    playlistPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      var settled = false;
      var timeout = window.setTimeout(function () { finish(new Error('Tempo de carregamento de playlist.js excedido')); }, 6000);
      function finish(error) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        script.onload = null;
        script.onerror = null;
        if (error) {
          script.remove();
          reject(error);
        } else {
          var config = window.pub && window.pub.incontent;
          if (!config || typeof config !== 'object' || !Array.isArray(config.videos)) reject(new Error('window.pub.incontent.videos inválido'));
          else resolve(config);
        }
      }
      script.src = PLAYLIST + '?v=' + Date.now();
      script.async = true;
      script.onload = function () { finish(null); };
      script.onerror = function () { finish(new Error('Não foi possível carregar playlist.js')); };
      document.head.appendChild(script);
    }).catch(function (error) { playlistPromise = null; throw error; });
    return playlistPromise;
  }

  function extraLoopsOf(config) {
    var value = config && config.loops;
    if (value === undefined || value === null || value === '') return DEFAULT_EXTRA_LOOPS;
    var number = Number(value);
    return Number.isInteger(number) && number >= 0 ? Math.min(number, 100) : DEFAULT_EXTRA_LOOPS;
  }

  function orderOf(config) {
    return config && config.order === 'random' ? 'random' : 'sequential';
  }

  function buildOrder(rec) {
    var result = rec.playlist.map(function (item, index) { return index; });
    if (rec.playbackOrder === 'random') {
      for (var i = result.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var previous = result[i];
        result[i] = result[j];
        result[j] = previous;
      }
    }
    return result;
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

  var dateCheckFormatter = new Intl.DateTimeFormat('pt-PT', {
    timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });

  function dateCheck() {
    var parts = {};
    dateCheckFormatter.formatToParts(new Date()).forEach(function (part) {
      if (part.type !== 'literal') parts[part.type] = part.value;
    });
    return parts.year + '-' + parts.month + '-' + parts.day + 'T' + parts.hour + ':' + parts.minute + ':' + parts.second;
  }

  function expiresAtStamp(value) {
    if (typeof value !== 'string') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value.trim());
    if (!m) return null;
    var year = Number(m[1]);
    var month = Number(m[2]);
    var day = Number(m[3]);
    var hour = Number(m[4] || 0);
    var minute = Number(m[5] || 0);
    var second = Number(m[6] || 0);
    var date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return null;
    return m[1] + '-' + m[2] + '-' + m[3] + 'T' + (m[4] || '00') + ':' + (m[5] || '00') + ':' + (m[6] || '00');
  }

  function expired(item, stamp) {
    if (!item || item.expiresAt == null || item.expiresAt === '') return false;
    var cutoff = expiresAtStamp(item.expiresAt);
    return !cutoff || (stamp || dateCheck()) >= cutoff;
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
    }).filter(function (entry) { return !expired(entry); });
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
    media.addEventListener('playing', function () {
      if (rec.destroyed || rec.adPlaying || rec.waitingAds || rec.contentResumeEpoch !== rec.itemEpoch) return;
      if (!isEditorialSource(rec)) return;
      rec.editorialPlayingEpoch = rec.itemEpoch;
      updateUI(rec);
    });
    media.addEventListener('ended', function () {
      if (rec.destroyed || rec.adPlaying || rec.waitingAds || rec.editorialPlayingEpoch !== rec.itemEpoch) return;
      if (!isEditorialSource(rec)) return;
      if (isFinite(media.duration) && media.duration > 0 && media.currentTime < media.duration - 0.75) return;
      rec.editorialPlayingEpoch = -1;
      nextItem(rec);
    });
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
    if (rec.resumeFallbackTimer) window.clearTimeout(rec.resumeFallbackTimer);
    rec.adTimer = null;
    rec.resumeFallbackTimer = null;
    if (rec.manager) {
      try { rec.manager.destroy(); } catch (e) {}
    }
    rec.manager = null;
    rec.waitingAds = false;
    rec.adPlaying = false;
    rec.currentRequest = null;
    if (rec.shell) {
      rec.shell.classList.remove('is-ima-custom-playback');
      updateUI(rec);
    }
  }

  function isEditorialSource(rec) {
    if (!rec.expectedEditorialUrl || !rec.video) return false;
    var current = rec.video.currentSrc || rec.video.src || '';
    try { return new URL(current, window.location.href).href === rec.expectedEditorialUrl; }
    catch (e) { return false; }
  }

  function resumeContent(rec, fromClick) {
    if (rec.destroyed || rec.adPlaying || rec.waitingAds) return;
    if (!rec.usingFallbackMedia && rec.playlist[rec.index] && expired(rec.playlist[rec.index])) {
      nextItem(rec);
      return;
    }
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
    if (!isEditorialSource(rec) && rec.expectedEditorialUrl) {
      rec.video.src = rec.expectedEditorialUrl;
      rec.video.load();
    }
    rec.contentResumeEpoch = rec.itemEpoch;
    rec.video.muted = rec.muted;
    rec.video.volume = rec.volume;
    var epoch = rec.itemEpoch;
    var promise;
    try { promise = rec.video.play(); } catch (error) { autoplayError(rec, error); return; }
    if (promise && promise.catch) promise.catch(function (error) {
      if (epoch === rec.itemEpoch) autoplayError(rec, error);
    });
    updateUI(rec);
  }

  function autoplayError(rec, error) {
    if (rec.destroyed || rec.manualPause || rec.adPlaying || rec.waitingAds) return;
    if (error && error.name === 'AbortError' && rec.resumeRetryCount < 2) {
      var epoch = rec.itemEpoch;
      rec.resumeRetryCount++;
      window.setTimeout(function () {
        if (rec.destroyed || epoch !== rec.itemEpoch || rec.manualPause || rec.adPlaying || rec.waitingAds) return;
        resumeContent(rec, false);
      }, 180);
      return;
    }
    if (error && error.name === 'NotAllowedError' && !rec.muted) {
      rec.muted = true;
      rec.video.muted = true;
      rec.shell.setAttribute('data-audio-autoplay-status', 'blocked-by-browser');
      updateUI(rec);
      var epoch = rec.itemEpoch;
      var attempt = rec.video.play();
      if (attempt && attempt.catch) attempt.catch(function () {
        if (epoch !== rec.itemEpoch || rec.destroyed) return;
        rec.manualPause = true;
        updateUI(rec);
      });
      return;
    }
    rec.manualPause = true;
    updateUI(rec);
  }

  function verifyContentResume(rec) {
    if (rec.resumeCheckTimer) window.clearTimeout(rec.resumeCheckTimer);
    var epoch = rec.itemEpoch;
    rec.resumeCheckTimer = window.setTimeout(function () {
      rec.resumeCheckTimer = null;
      if (rec.destroyed || rec.manualPause || rec.adPlaying || rec.waitingAds || epoch !== rec.itemEpoch) return;
      if (rec.video.paused && isEditorialSource(rec)) resumeContent(rec, false);
    }, 250);
  }

  function finishAds(rec, token, reason) {
    if (rec.destroyed || token !== rec.currentRequest || rec.completedRequest === token) return;
    rec.completedRequest = token;
    if (!rec.adStartedForRequest) {
      rec.misses++;

    }
    clearAds(rec);
    rec.muted = false;
    rec.video.muted = false;
    rec.video.volume = rec.volume;
    updateUI(rec);
    resumeContent(rec, false);
    verifyContentResume(rec);
  }

  function sizeOf(rec) {
    var rect = rec.adLayer.getBoundingClientRect();
    return { width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)) };
  }

  function syncAdPlaybackMode(rec) {
    var custom = true;
    if (rec.manager && typeof rec.manager.isCustomPlaybackUsed === 'function') {
      try { custom = rec.manager.isCustomPlaybackUsed() !== false; } catch (e) {}
    }
    rec.shell.classList.toggle('is-ima-custom-playback', custom);
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
      syncAdPlaybackMode(rec);
      updateUI(rec);
    });
    listen(ima.AdEvent.Type.STARTED, function () {
      if (token !== rec.currentRequest) return;
      if (rec.resumeFallbackTimer) {
        window.clearTimeout(rec.resumeFallbackTimer);
        rec.resumeFallbackTimer = null;
      }
      rec.adStartedForRequest = true;
      rec.emptyLoops = 0;
      rec.misses = 0;
      rec.playedThisLoop = true;
      rec.adPlaying = true;
      rec.waitingAds = false;
      syncAdPlaybackMode(rec);
      rec.wrapper.setAttribute('data-publico-video-result', 'vast-started');
      if (rec.adTimer) { window.clearTimeout(rec.adTimer); rec.adTimer = null; }
      rec.adMuted = true;
      if (rec.manager && typeof rec.manager.setVolume === 'function') {
        try { rec.manager.setVolume(0); } catch (e) {}
      }
      rec.video.muted = true;
      markVisible(rec);
      updateUI(rec);

    });
    function scheduleResumeFallback(reason) {
      if (rec.destroyed || token !== rec.currentRequest || rec.completedRequest === token) return;
      if (rec.resumeFallbackTimer) window.clearTimeout(rec.resumeFallbackTimer);
      rec.resumeFallbackTimer = window.setTimeout(function () {
        rec.resumeFallbackTimer = null;
        finishAds(rec, token, reason + '-resume-timeout');
      }, 1600);
    }
    listen(ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, function () { finishAds(rec, token, 'content-resume'); });
    listen(ima.AdEvent.Type.ALL_ADS_COMPLETED, function () { scheduleResumeFallback('all-complete'); });
    listen(ima.AdEvent.Type.SKIPPED, function () { scheduleResumeFallback('skipped'); });
    manager.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, function (event) {

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

      finishAds(rec, rec.currentRequest, 'no-fill');
    });
  }

  function requestAd(rec, item) {
    if (rec.destroyed || rec.adPlaying || rec.waitingAds || rec.adAttemptEpoch === rec.itemEpoch) return;
    rec.adAttemptEpoch = rec.itemEpoch;
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
    var url = buildVast(rec, item);
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
    rec.playOrder = [0];
    rec.orderPos = 0;
    rec.emptyLoops = 0;
    rec.playedThisLoop = false;
    rec.wrapper.setAttribute('data-inc-fallback', '1');
    rec.wrapper.setAttribute('data-inc-fallback-reason', String(reason));

    if (rec.shell) prepareItem(rec, 0);
  }

  function nextItem(rec) {
    if (rec.destroyed || rec.waitingAds || rec.adPlaying) return;
    if (!rec.playlist.some(function (entry, i) { return !rec.failedMediaIndices[i] && !expired(entry); })) {
      fallbackPlaylist(rec, 'playlist-expired-or-unavailable');
      return;
    }
    for (var skipped = 0; skipped < rec.playlist.length; skipped++) {
      var position = rec.orderPos + 1;
      if (position >= rec.playOrder.length) {
        rec.completedLoops++;
        if (rec.playedThisLoop) rec.emptyLoops = 0;
        else rec.emptyLoops++;
        rec.playedThisLoop = false;

        if (rec.emptyLoops >= rec.maxLoops) {
          rec.fallback('no-vast-after-' + rec.maxLoops + '-playlist-passes');
          return;
        }
        rec.playOrder = buildOrder(rec);
        position = 0;
      }
      rec.orderPos = position;
      var index = rec.playOrder[position];
      if (!rec.failedMediaIndices[index] && !expired(rec.playlist[index])) {
        prepareItem(rec, index);
        return;
      }
    }
    fallbackPlaylist(rec, 'playlist-expired-or-unavailable');
  }

  function prepareItem(rec, index) {
    if (rec.destroyed) return;
    rec.index = index;
    rec.itemEpoch++;
    rec.adAttemptEpoch = -1;
    rec.editorialPlayingEpoch = -1;
    rec.contentResumeEpoch = -1;
    rec.resumeRetryCount = 0;
    if (rec.resumeCheckTimer) { window.clearTimeout(rec.resumeCheckTimer); rec.resumeCheckTimer = null; }
    var epoch = rec.itemEpoch;
    var item = rec.playlist[index];
    if (expired(item)) { nextItem(rec); return; }
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
    rec.video.onloadedmetadata = null;
    rec.video.onerror = null;
    rec.expectedEditorialUrl = new URL(item.src, PLAYLIST).href;
    var mediaReady = false;
    function mediaError(reason) {
      if (rec.destroyed || epoch !== rec.itemEpoch || mediaReady) return;
      rec.video.onloadedmetadata = null;
      rec.video.onerror = null;
      if (rec.mediaTimer) { window.clearTimeout(rec.mediaTimer); rec.mediaTimer = null; }
      rec.failedMediaIndices[index] = true;
      if (rec.usingFallbackMedia) { rec.fallback('fallback-media-' + reason); return; }
      if (rec.playlist.every(function (entry, i) { return rec.failedMediaIndices[i]; })) {
        fallbackPlaylist(rec, 'playlist-mp4-unavailable');
      } else nextItem(rec);
    }
    rec.mediaTimer = window.setTimeout(function () { mediaError('timeout'); }, 12000);
    rec.video.onloadedmetadata = function () {
      if (rec.destroyed || epoch !== rec.itemEpoch || mediaReady || !isEditorialSource(rec)) return;
      mediaReady = true;
      rec.video.onloadedmetadata = null;
      rec.video.onerror = function () {
        if (rec.destroyed || epoch !== rec.itemEpoch || rec.adPlaying || rec.waitingAds || !isEditorialSource(rec)) return;
        rec.failedMediaIndices[index] = true;
        if (rec.usingFallbackMedia) { rec.fallback('fallback-media-playback-error'); return; }
        if (rec.playlist.every(function (entry, i) { return rec.failedMediaIndices[i]; })) {
          fallbackPlaylist(rec, 'playlist-mp4-unavailable');
        } else nextItem(rec);
      };
      if (rec.mediaTimer) { window.clearTimeout(rec.mediaTimer); rec.mediaTimer = null; }
      rec.shell.classList.remove('is-loading');
      if (expired(item)) { nextItem(rec); return; }
      requestAd(rec, item);
    };
    rec.video.onerror = function () { mediaError('error'); };
    rec.video.src = rec.expectedEditorialUrl;
    rec.video.load();

  }

  function destroy(rec) {
    if (rec.destroyed) return;
    rec.destroyed = true;
    if (rec.downloadTimer) window.clearTimeout(rec.downloadTimer);
    if (rec.mediaTimer) window.clearTimeout(rec.mediaTimer);
    if (rec.adTimer) window.clearTimeout(rec.adTimer);
    if (rec.resumeFallbackTimer) window.clearTimeout(rec.resumeFallbackTimer);
    if (rec.resumeCheckTimer) window.clearTimeout(rec.resumeCheckTimer);
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
      playlist: [], index: 0, playOrder: [], orderPos: 0, playbackOrder: 'sequential', extraLoops: 0, completedLoops: 0, emptyLoops: 0, playedThisLoop: false,
      attempts: 0, misses: 0, itemEpoch: 0, adAttemptEpoch: -1, editorialPlayingEpoch: -1, contentResumeEpoch: -1,
      expectedEditorialUrl: null, currentRequest: null, completedRequest: null,
      adPlaying: false, waitingAds: false, adStartedForRequest: false, muted: false, adMuted: false, volume: 0.01,
      manualPause: false, userStarted: false, awaitingGesture: false, destroyed: false,
      maxLoops: DEFAULT_EXTRA_LOOPS + 1,
      hadVisibleContent: false, mediaTimer: null, resumeFallbackTimer: null, resumeCheckTimer: null,
      resumeRetryCount: 0, failedMediaIndices: {}, usingFallbackMedia: false
    };
    rec.onResize = function () {
      if (!rec.manager || rec.startedManager !== rec.currentRequest || (!rec.adPlaying && !rec.waitingAds)) return;
      try { var size = sizeOf(rec); rec.manager.resize(size.width, size.height, window.google.ima.ViewMode.NORMAL); } catch (e) {}
    };
    rec.fallback = function (reason) {
      if (rec.state === 'display') return;
      rec.state = 'display';
      if (window.PubAdLayout && typeof window.PubAdLayout.videoToDisplay === 'function') window.PubAdLayout.videoToDisplay(wrapper);
      destroy(rec);
      placement.setAttribute('lazyload', 'false');
      wrapper.replaceChildren(placement);
      wrapper.removeAttribute('data-publico-vertcontent-video');
      wrapper.setAttribute('data-publico-video-result', 'display');
      wrapper.setAttribute('data-publico-video-fallback-reason', String(reason || 'unknown'));
      document.dispatchEvent(new CustomEvent('publico:vertcontent-display-ready', { detail: { placement: placement, wrapper: wrapper, reason: reason } }));

    };
    records.push(rec);
    wrapper.setAttribute('data-publico-vertcontent-video', '1');
    wrapper.setAttribute('data-publico-vcv-reserved', '0');
    wrapper.appendChild(stage);
    wrapper.setAttribute('data-publico-vcv-reserved', '1');
    if (window.PubAdLayout && window.PubAdLayout.videoRequested) window.PubAdLayout.videoRequested(wrapper);
    addCss();
    Promise.all([
      loadPlaylist().catch(function (error) {

        return null;
      }),
      loadIma()
    ]).then(function (results) {
      if (rec.destroyed || !wrapper.isConnected) return;
      var config = results[0];
      rec.extraLoops = extraLoopsOf(config);
      rec.maxLoops = rec.extraLoops + 1;
      rec.playbackOrder = orderOf(config);
      rec.playlist = validPlaylist(config);
      if (!rec.playlist.length) fallbackPlaylist(rec, 'playlist-missing-or-empty');
      rec.playOrder = buildOrder(rec);
      rec.orderPos = 0;
      dom(rec);
      setupIma(rec);
      rec.state = 'video';
      prepareItem(rec, rec.playOrder[0]);
    }).catch(function (error) {
      if (!rec.destroyed) rec.fallback(error.message || 'init-error');
    });
    return true;
  }

  window.VertInContentRequest = Object.assign(window.VertInContentRequest || {}, {
    mount: mount,
    eligible: function () { return Boolean(window.pub && window.pub.pageType === 'noticia'); },
    enabled: true,
    forceDisplay: function () { if (records.length) records[0].fallback('manual'); }
  });
})(window, document);
