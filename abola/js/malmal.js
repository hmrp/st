// ==UserScript==
// @name         Maltrace (GAM + HB/YLHH + Taboola) - PCAPdroid JS Injector (Taboola loader blocked)
// @description  Captura IDs de GAM (lineItemId/creativeId), targeting hb_*, eventos YLHH, inserções de scripts/iframes (marca Taboola), scroll timeline, e tentativas de redirect (window.open, location.assign/replace, beforeunload, visibility:hidden). + BLOQUEIA apenas cdn.taboola.com/libtrc/.../loader.js. Persiste incidente/checkpoints em localStorage/window.name e mostra overlay para copiar.
// @author       HP
// @version      1.4
// @match        *://www.abola.pt/*
// @match        *://*.abola.pt/*
// @match        *://*.hugopedroso.com/*
// ==/UserScript==

(function () {
  'use strict';

  // =========================
  // Visual indicator (injector ON)
  // =========================
  function paint() {
    try {
      const el = document.body || document.documentElement;
      if (el) el.style.background = '#0400ff';
    } catch {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paint, { once: true });
  } else {
    paint();
  }

  // =========================
  // BLOCK: Taboola libtrc loader.js (ONLY this)
  // =========================
  const TABOOLA_LOADER_RX =
    /^https:\/\/cdn\.taboola\.com\/libtrc\/sociedadevicradesportiva-abola\/loader\.js(?:[?#].*)?$/i;

  function __mt_normUrl(raw) {
    try {
      const u = new URL(String(raw), location.href);
      u.hash = ''; // normalize away hash
      return u.toString();
    } catch {
      return null;
    }
  }

  function __mt_isBlockedUrl(raw) {
    const norm = __mt_normUrl(raw);
    if (!norm) return false;
    return TABOOLA_LOADER_RX.test(norm);
  }

  function __mt_blockLog(kind, detail) {
    try { console.warn('[MAL-TRACE][BLOCK]', kind, detail); } catch {}
  }

  // Patch element URL setters to blank ONLY the blocked URL
  function __mt_patchUrlSetter(proto, prop) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (!desc || typeof desc.set !== 'function') return;

    Object.defineProperty(proto, prop, {
      get: desc.get,
      set: function (v) {
        try {
          if (__mt_isBlockedUrl(v)) {
            __mt_blockLog(`${proto.constructor?.name || 'Element'}.${prop}`, __mt_normUrl(v) || String(v));
            return desc.set.call(this, 'about:blank');
          }
        } catch {}
        return desc.set.call(this, v);
      },
      configurable: true,
      enumerable: desc.enumerable
    });
  }

  try { __mt_patchUrlSetter(HTMLScriptElement.prototype, 'src'); } catch {}
  try { __mt_patchUrlSetter(HTMLIFrameElement.prototype, 'src'); } catch {}
  try { __mt_patchUrlSetter(HTMLImageElement.prototype, 'src'); } catch {}
  try { __mt_patchUrlSetter(HTMLSourceElement.prototype, 'src'); } catch {}
  try { __mt_patchUrlSetter(HTMLLinkElement.prototype, 'href'); } catch {}

  // setAttribute hook (src/href)
  const __mt_origSetAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    try {
      const n = String(name).toLowerCase();
      if ((n === 'src' || n === 'href') && __mt_isBlockedUrl(value)) {
        __mt_blockLog('setAttribute', `${this.tagName}.${n} = ${__mt_normUrl(value) || String(value)}`);
        return __mt_origSetAttr.call(this, name, 'about:blank');
      }
    } catch {}
    return __mt_origSetAttr.call(this, name, value);
  };

  // appendChild / insertBefore hook (drop nodes that try to load blocked URL)
  function __mt_nodeHasBlockedUrl(node) {
    try {
      if (!node || node.nodeType !== 1) return false;
      const el = node;

      const cand = [];
      if (el.src) cand.push(el.src);
      if (el.href) cand.push(el.href);

      const asrc = el.getAttribute && el.getAttribute('src');
      const ahref = el.getAttribute && el.getAttribute('href');
      if (asrc) cand.push(asrc);
      if (ahref) cand.push(ahref);

      return cand.some(u => u && __mt_isBlockedUrl(u));
    } catch {
      return false;
    }
  }

  const __mt_origAppend = Node.prototype.appendChild;
  Node.prototype.appendChild = function (node) {
    try {
      if (__mt_nodeHasBlockedUrl(node)) {
        __mt_blockLog('appendChild(drop)', node.outerHTML ? node.outerHTML.slice(0, 240) : String(node));
        return node; // drop
      }
    } catch {}
    return __mt_origAppend.call(this, node);
  };

  const __mt_origInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, refNode) {
    try {
      if (__mt_nodeHasBlockedUrl(newNode)) {
        __mt_blockLog('insertBefore(drop)', newNode.outerHTML ? newNode.outerHTML.slice(0, 240) : String(newNode));
        return newNode; // drop
      }
    } catch {}
    return __mt_origInsertBefore.call(this, newNode, refNode);
  };

  // fetch / XHR / beacon hooks (ONLY for blocked URL)
  const __mt_fetch = window.fetch;
  if (typeof __mt_fetch === 'function') {
    window.fetch = function (input, init) {
      try {
        if (__mt_isBlockedUrl(input && input.url ? input.url : input)) {
          __mt_blockLog('fetch', __mt_normUrl(input && input.url ? input.url : input) || String(input));
          return Promise.reject(new Error('Blocked Taboola libtrc loader.js (Maltrace)'));
        }
      } catch {}
      return __mt_fetch.call(this, input, init);
    };
  }

  const __mt_xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
    try {
      if (__mt_isBlockedUrl(url)) {
        __mt_blockLog('xhr.open', __mt_normUrl(url) || String(url));
        this.__mt_blocked__ = true;
        return __mt_xhrOpen.call(this, method, 'about:blank', async !== false, user, password);
      }
    } catch {}
    return __mt_xhrOpen.call(this, method, url, async !== false, user, password);
  };

  const __mt_xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    try {
      if (this.__mt_blocked__) {
        __mt_blockLog('xhr.send', '(blocked)');
        try { this.abort(); } catch {}
        return;
      }
    } catch {}
    return __mt_xhrSend.call(this, body);
  };

  if (navigator.sendBeacon) {
    const __mt_beacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      try {
        if (__mt_isBlockedUrl(url)) {
          __mt_blockLog('sendBeacon', __mt_normUrl(url) || String(url));
          return false;
        }
      } catch {}
      return __mt_beacon(url, data);
    };
  }

  // Purge already present <script src="...loader.js">
  function __mt_purgeTaboolaLoader() {
    try {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      for (const s of scripts) {
        const u = s.src || s.getAttribute('src');
        if (u && __mt_isBlockedUrl(u)) {
          __mt_blockLog('purgeExisting', __mt_normUrl(u) || String(u));
          try { s.remove(); } catch {}
        }
      }
    } catch {}
  }
  __mt_purgeTaboolaLoader();
  try { document.addEventListener('DOMContentLoaded', __mt_purgeTaboolaLoader, { once: true }); } catch {}

  // =========================
  // Config
  // =========================
  const MAX_EVENTS = 500;
  const LS_KEY = '__maltrace_store_v1';
  const LS_LAST_INCIDENT = '__maltrace_last_incident_v1';
  const LS_LAST_CHECKPOINT = '__maltrace_last_checkpoint_v1';
  const now = () => Math.round(performance.now());

  // throttle checkpoint writes so we don't hammer storage
  const CHECKPOINT_MIN_INTERVAL_MS = 1500;
  let lastCheckpointWrite = 0;

  // =========================
  // State
  // =========================
  const TRACE = (window.__malTrace = {
    v: 1,
    page: location.href,
    ts: Date.now(),
    t0: now(),
    events: [],
    lastGpt: null,
    lastHb: null,
    lastTag: null,
    lastNav: null
  });

  function vendorFromSrc(src) {
    if (!src) return null;
    const s = String(src).toLowerCase();
    if (s.includes('taboola')) return 'taboola';
    if (s.includes('outbrain')) return 'outbrain';
    if (s.includes('criteo')) return 'criteo';
    if (s.includes('doubleclick') || s.includes('googleads') || s.includes('googlesyndication')) return 'google_ads';
    if (s.includes('yieldlove') || s.includes('yieldlab') || s.includes('ylhh')) return 'yieldlove';
    return null;
  }

  function push(evt, data) {
    const e = { t: now(), evt, ...data };
    TRACE.events.push(e);
    if (TRACE.events.length > MAX_EVENTS) TRACE.events.shift();

    if (evt.startsWith('gpt.')) TRACE.lastGpt = e;
    if (evt.startsWith('hb.') || evt.startsWith('ylhh.')) TRACE.lastHb = e;
    if (evt.startsWith('tag.') || evt.startsWith('iframe.')) TRACE.lastTag = e;
    if (evt.startsWith('nav.')) TRACE.lastNav = e;

    try { console.log('[MAL-TRACE]', e); } catch {}
    return e;
  }

  function safeParse(json) {
    try { return JSON.parse(json); } catch { return null; }
  }

  function persistIncident(reason, extra) {
    try {
      const payload = {
        kind: 'incident',
        reason,
        page: TRACE.page,
        ts: Date.now(),
        href_now: location.href,
        lastGpt: TRACE.lastGpt,
        lastHb: TRACE.lastHb,
        lastTag: TRACE.lastTag,
        lastNav: TRACE.lastNav,
        lastCheckpoint: safeParse(localStorage.getItem(LS_LAST_CHECKPOINT) || 'null'),
        tail: TRACE.events.slice(-200),
        extra: extra || null
      };

      localStorage.setItem(LS_LAST_INCIDENT, JSON.stringify(payload));

      const store = safeParse(localStorage.getItem(LS_KEY) || '[]') || [];
      store.push(payload);
      while (store.length > 20) store.shift();
      localStorage.setItem(LS_KEY, JSON.stringify(store));

      window.name = 'MALTRACE:' + JSON.stringify(payload).slice(0, 60000);

      try {
        const g = payload.lastGpt || {};
        const tgt = g.targeting || {};
        const hbBidder = tgt.hb_bidder ? tgt.hb_bidder[0] : null;
        console.error(
          '[MAL-TRACE][INCIDENT]',
          reason,
          'lineItemId=', g.lineItemId,
          'creativeId=', g.creativeId,
          'adUnitPath=', g.adUnitPath,
          'slotId=', g.slotId,
          'hb_bidder=', hbBidder,
          'lastTag=', payload.lastTag && (payload.lastTag.src || null),
          'target=', extra && extra.url ? extra.url : null
        );
      } catch {}
    } catch {}
  }

  function persistCheckpoint(kind, extra) {
    const t = Date.now();
    if (t - lastCheckpointWrite < CHECKPOINT_MIN_INTERVAL_MS) return;
    lastCheckpointWrite = t;

    try {
      const payload = {
        kind: 'checkpoint',
        checkpoint: kind,
        page: TRACE.page,
        ts: t,
        href_now: location.href,
        lastGpt: TRACE.lastGpt,
        lastHb: TRACE.lastHb,
        lastTag: TRACE.lastTag,
        lastNav: TRACE.lastNav,
        tail: TRACE.events.slice(-80),
        extra: extra || null
      };
      localStorage.setItem(LS_LAST_CHECKPOINT, JSON.stringify(payload));
      window.name = 'MALTRACE_CP:' + JSON.stringify(payload).slice(0, 30000);
    } catch {}
  }

  // =========================
  // Redirect / navigation tripwires
  // =========================
  const _open = window.open;
  window.open = function () {
    const args = Array.prototype.slice.call(arguments, 0, 3);
    push('nav.window_open', { args });
    persistIncident('window.open', { args });
    return _open.apply(this, arguments);
  };

  window.addEventListener('beforeunload', function () {
    push('nav.beforeunload', {});
    persistIncident('beforeunload');
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      push('nav.visibility_hidden', {});
      persistIncident('visibility:hidden');
    }
  });

  (function hookLocation() {
    try {
      const _assign = window.location.assign.bind(window.location);
      const _replace = window.location.replace.bind(window.location);

      window.location.assign = function (url) {
        push('nav.location_assign', { url: String(url) });
        persistIncident('location.assign', { url: String(url) });
        return _assign(url);
      };

      window.location.replace = function (url) {
        push('nav.location_replace', { url: String(url) });
        persistIncident('location.replace', { url: String(url) });
        return _replace(url);
      };
    } catch {}
  })();

  document.addEventListener(
    'click',
    function (e) {
      try {
        const a = e.target && e.target.closest ? e.target.closest('a') : null;
        push('ui.click', { tag: e.target && e.target.tagName, href: a ? a.href : null });
        persistCheckpoint('ui.click', { href: a ? a.href : null });
      } catch {}
    },
    true
  );

  let lastScrollLog = 0;
  window.addEventListener(
    'scroll',
    function () {
      const t = Date.now();
      if (t - lastScrollLog < 800) return;
      lastScrollLog = t;
      push('ui.scroll', { y: Math.round(window.scrollY || 0) });
      persistCheckpoint('ui.scroll', { y: Math.round(window.scrollY || 0) });
    },
    { passive: true }
  );

  // =========================
  // Tag / iframe origin sensor
  // =========================
  const origAppend = Node.prototype.appendChild;
  Node.prototype.appendChild = function (node) {
    try {
      if (node && node.tagName === 'SCRIPT' && node.src) {
        push('tag.script_added', { src: node.src, vendor: vendorFromSrc(node.src) });
        persistCheckpoint('tag.script_added', { src: node.src, vendor: vendorFromSrc(node.src) });
      }
      if (node && node.tagName === 'IFRAME' && node.src) {
        push('iframe.added', { src: node.src, vendor: vendorFromSrc(node.src) });
        persistCheckpoint('iframe.added', { src: node.src, vendor: vendorFromSrc(node.src) });
      }
    } catch {}
    return origAppend.call(this, node);
  };

  try {
    const mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes &&
          m.addedNodes.forEach(function (n) {
            if (!n || !n.tagName) return;
            if (n.tagName === 'SCRIPT' && n.src) {
              push('tag.script_added', { src: n.src, vendor: vendorFromSrc(n.src) });
              persistCheckpoint('tag.script_added', { src: n.src, vendor: vendorFromSrc(n.src) });
            }
            if (n.tagName === 'IFRAME' && n.src) {
              push('iframe.added', { src: n.src, vendor: vendorFromSrc(n.src) });
              persistCheckpoint('iframe.added', { src: n.src, vendor: vendorFromSrc(n.src) });
            }
          });
      });
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch {}

  // =========================
  // GPT hook (lineItemId / creativeId + targeting hb_*)
  // =========================
  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(function () {
    const pubads = googletag.pubads();

    pubads.addEventListener('slotRenderEnded', function (e) {
      const slot = e.slot;
      let targeting = {};
      try {
        const keys = slot.getTargetingKeys();
        keys.forEach((k) => (targeting[k] = slot.getTargeting(k)));
      } catch {}

      const record = {
        slotId: slot.getSlotElementId && slot.getSlotElementId(),
        adUnitPath: slot.getAdUnitPath && slot.getAdUnitPath(),
        isEmpty: !!e.isEmpty,
        size: e.size || null,
        creativeId: e.creativeId ?? null,
        lineItemId: e.lineItemId ?? null,
        advertiserId: e.advertiserId ?? null,
        campaignId: e.campaignId ?? null,
        targeting
      };

      push('gpt.slotRenderEnded', record);

      if (!e.isEmpty) {
        persistCheckpoint('gpt.slotRenderEnded', {
          slotId: record.slotId,
          adUnitPath: record.adUnitPath,
          creativeId: record.creativeId,
          lineItemId: record.lineItemId
        });
      }
    });

    pubads.addEventListener('impressionViewable', function (e) {
      const slot = e.slot;
      const rec = { slotId: slot.getSlotElementId && slot.getSlotElementId(), adUnitPath: slot.getAdUnitPath && slot.getAdUnitPath() };
      push('gpt.impressionViewable', rec);
      persistCheckpoint('gpt.impressionViewable', rec);
    });

    pubads.addEventListener('slotRequested', function (e) {
      const slot = e.slot;
      push('gpt.slotRequested', { slotId: slot.getSlotElementId && slot.getSlotElementId(), adUnitPath: slot.getAdUnitPath && slot.getAdUnitPath() });
    });

    pubads.addEventListener('slotResponseReceived', function (e) {
      const slot = e.slot;
      push('gpt.slotResponseReceived', { slotId: slot.getSlotElementId && slot.getSlotElementId(), adUnitPath: slot.getAdUnitPath && slot.getAdUnitPath() });
    });
  });

  // =========================
  // YLHH hook (tracker) — best-effort
  // =========================
  function wrap(obj, fnName) {
    if (!obj || typeof obj[fnName] !== 'function') return;
    const orig = obj[fnName];
    obj[fnName] = function () {
      try {
        push('ylhh.' + fnName, { argc: arguments.length });
        persistCheckpoint('ylhh.' + fnName, { argc: arguments.length });
      } catch {}
      return orig.apply(this, arguments);
    };
  }

  function tryHookYLHH() {
    const bidder = window.YLHH && window.YLHH.bidder;
    const tr = bidder && bidder.tracker;
    if (!tr) return false;

    ['onBidsRequested', 'beforeAdServerRequest', 'onSlotRendered', 'onCreativeClick', 'init'].forEach((n) => wrap(tr, n));

    push('hb.yld_hooked', { ok: true });
    persistCheckpoint('hb.yld_hooked', { ok: true });
    return true;
  }

  const hookI = setInterval(function () {
    if (tryHookYLHH()) clearInterval(hookI);
  }, 50);
  setTimeout(function () {
    clearInterval(hookI);
  }, 9000);

  // =========================
  // Overlay: show last incident (and last checkpoint if no incident)
  // =========================
  function readLast() {
    let last = safeParse(localStorage.getItem(LS_LAST_INCIDENT) || 'null');
    if (last) return last;

    last = safeParse(localStorage.getItem(LS_LAST_CHECKPOINT) || 'null');
    if (last) return last;

    try {
      if (typeof window.name === 'string' && window.name.startsWith('MALTRACE:')) return JSON.parse(window.name.slice(9));
      if (typeof window.name === 'string' && window.name.startsWith('MALTRACE_CP:')) return JSON.parse(window.name.slice(12));
    } catch {}
    return null;
  }

  function showOverlay() {
    const last = readLast();
    if (!last) return;

    const box = document.createElement('div');
    box.style.cssText = [
      'position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px',
      'max-height:48vh;overflow:auto;background:#111;color:#fff',
      'border:2px solid #fff;border-radius:10px;padding:10px;font:12px/1.3 monospace'
    ].join(';');

    const title = document.createElement('div');
    title.textContent = last.kind === 'incident' ? 'MALTRACE last INCIDENT (copy & paste):' : 'MALTRACE last CHECKPOINT (no incident yet):';
    title.style.cssText = 'margin:0 0 8px 0;font-weight:700;';

    const txt = document.createElement('pre');
    txt.textContent = JSON.stringify(last, null, 2);
    txt.style.margin = '0';

    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 8px 0;';

    const btnCopy = document.createElement('button');
    btnCopy.textContent = 'Copy JSON';
    btnCopy.style.cssText = 'padding:6px 10px;border-radius:8px;border:0;cursor:pointer;';
    btnCopy.onclick = async function () { try { await navigator.clipboard.writeText(txt.textContent); } catch {} };

    const btnClose = document.createElement('button');
    btnClose.textContent = 'Close';
    btnClose.style.cssText = 'padding:6px 10px;border-radius:8px;border:0;cursor:pointer;';
    btnClose.onclick = function () { box.remove(); };

    const btnClearIncident = document.createElement('button');
    btnClearIncident.textContent = 'Clear incident';
    btnClearIncident.style.cssText = 'padding:6px 10px;border-radius:8px;border:0;cursor:pointer;';
    btnClearIncident.onclick = function () { try { localStorage.removeItem(LS_LAST_INCIDENT); box.remove(); } catch {} };

    const btnClearAll = document.createElement('button');
    btnClearAll.textContent = 'Clear all stored';
    btnClearAll.style.cssText = 'padding:6px 10px;border-radius:8px;border:0;cursor:pointer;';
    btnClearAll.onclick = function () {
      try {
        localStorage.removeItem(LS_LAST_INCIDENT);
        localStorage.removeItem(LS_LAST_CHECKPOINT);
        localStorage.removeItem(LS_KEY);
        box.remove();
      } catch {}
    };

    bar.appendChild(btnCopy);
    bar.appendChild(btnClose);
    bar.appendChild(btnClearIncident);
    bar.appendChild(btnClearAll);

    box.appendChild(title);
    box.appendChild(bar);
    box.appendChild(txt);
    document.documentElement.appendChild(box);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showOverlay, { once: true });
  else showOverlay();

  window.__malTraceDump = function () {
    try {
      console.log('last incident:', safeParse(localStorage.getItem(LS_LAST_INCIDENT) || 'null'));
      console.log('last checkpoint:', safeParse(localStorage.getItem(LS_LAST_CHECKPOINT) || 'null'));
      console.log('store:', safeParse(localStorage.getItem(LS_KEY) || '[]'));
    } catch {}
    console.log('in-memory TRACE:', TRACE);
  };

  push('init', { ok: true, href: location.href });
  persistCheckpoint('init', { ok: true, href: location.href });

  // final notice
  __mt_blockLog('active', 'Blocking ONLY Taboola libtrc loader.js; tracing everything else normally.');
})();
