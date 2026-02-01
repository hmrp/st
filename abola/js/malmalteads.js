// @name Isolation test: block Yieldlove + Taboola CDN (force-load Teads analytics)
// @description Blocks Yieldlove + Taboola CDN requests and DOM injections; FORCE loads Teads analytics and logs success/failure; blue background indicator.
// @author HP
// @version 1.3
// @match *://www.abola.pt/*
// @match *://*.abola.pt/*
// @match *://*.hugopedroso.com/*

(() => {
  'use strict';

  // -------- Visual indicator (injector active) --------
  try {
    document.documentElement.style.background = '#0400ff';
    if (document.body) document.body.style.background = '#0400ff';
    document.addEventListener('DOMContentLoaded', () => {
      try { document.body.style.background = '#0400ff'; } catch (e) {}
    });
  } catch (e) {}

  // -------- Config --------
  // Allow Teads analytics broadly (real-world URLs may include query params, versioning, etc.)
  const ALLOWLIST = [
    /^https:\/\/a\.teads\.tv\/analytics\/.*$/i,
    /^http:\/\/a\.teads\.tv\/analytics\/.*$/i, // fallback, rare
  ];

  // Blocklist: requested by you
  const BLOCK_HOST_PATTERNS = [
    // Taboola CDN (strict)
    /(^|\.)cdn\.taboola\.com$/i,

    // Yieldlove (broad)
    /(^|\.)yieldlove\.com$/i,
    /(^|\.)cdn-a\.yieldlove\.com$/i,
    /(^|\.)cdn\.yieldlove\.com$/i,
    /(^|\.)yieldlove-ad-serving\.net$/i,
    /(^|\.)yld\.io$/i,
  ];

  const BLOCK_URL_SUBSTRINGS = [
    'cdn.taboola.com',
    'yieldlove.com',
    'cdn-a.yieldlove.com',
    'cdn.yieldlove.com',
    'yieldlove-ad-serving.net',
    'yld.io',
  ];

  // Keep Teads unblocked (you set this already)
  const BLOCK_TEADS_AD_DELIVERY = false;

  // (Only used if BLOCK_TEADS_AD_DELIVERY=true)
  const TEADS_AD_HOST_PATTERNS = [
    /(^|\.)a\.teads\.tv$/i,
    /(^|\.)static\.teads\.tv$/i,
    /(^|\.)sync\.teads\.tv$/i,
  ];

  // -------- Helpers --------
  function logBlock(kind, detail) {
    try { console.warn('[MITM-BLOCK]', kind, detail); } catch (_) {}
  }

  function logInfo(kind, detail) {
    try { console.warn('[MITM]', kind, detail); } catch (_) {}
  }

  function toUrl(u) {
    try {
      if (u == null) return null;
      if (typeof u === 'string') return new URL(u, location.href);
      if (u instanceof URL) return u;
      if (typeof u === 'object' && u.url) return new URL(u.url, location.href); // Request-like
      return null;
    } catch (_) {
      return null;
    }
  }

  function isAllowed(urlString) {
    try {
      const s = String(urlString || '');
      return ALLOWLIST.some(rx => rx.test(s));
    } catch (_) {
      return false;
    }
  }

  function hostBlocked(host) {
    if (!host) return false;
    if (BLOCK_HOST_PATTERNS.some(rx => rx.test(host))) return true;
    if (BLOCK_TEADS_AD_DELIVERY && TEADS_AD_HOST_PATTERNS.some(rx => rx.test(host))) return true;
    return false;
  }

  function urlBlocked(input) {
    const u = toUrl(input);
    if (!u) return false;

    // Allowlist always wins
    if (isAllowed(u.href)) return false;

    // Host patterns
    if (hostBlocked(u.hostname)) return true;

    // Substring matches (covers odd URL forms)
    const s = u.href;
    if (BLOCK_URL_SUBSTRINGS.some(sub => s.includes(sub))) return true;

    // If blocking Teads ad delivery, catch likely page-tag/static/sync paths
    if (BLOCK_TEADS_AD_DELIVERY && /teads\.tv/i.test(s) && !isAllowed(s)) return true;

    return false;
  }

  // -------- 1) Block DOM-based loads (script/iframe/img/link/etc.) --------
  function patchUrlSetter(proto, prop) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (!desc || !desc.set) return;

    Object.defineProperty(proto, prop, {
      get: desc.get,
      set: function (v) {
        try {
          if (urlBlocked(v)) {
            logBlock(`${proto.constructor?.name || 'Element'}.${prop}`, v);
            return desc.set.call(this, 'about:blank');
          }
        } catch (_) {}
        return desc.set.call(this, v);
      },
      configurable: true,
      enumerable: desc.enumerable,
    });
  }

  try { patchUrlSetter(HTMLScriptElement.prototype, 'src'); } catch (_) {}
  try { patchUrlSetter(HTMLIFrameElement.prototype, 'src'); } catch (_) {}
  try { patchUrlSetter(HTMLImageElement.prototype, 'src'); } catch (_) {}
  try { patchUrlSetter(HTMLSourceElement.prototype, 'src'); } catch (_) {}
  try { patchUrlSetter(HTMLLinkElement.prototype, 'href'); } catch (_) {}
  try { patchUrlSetter(HTMLAnchorElement.prototype, 'href'); } catch (_) {}

  const _setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    try {
      const n = String(name).toLowerCase();
      if ((n === 'src' || n === 'href') && urlBlocked(value)) {
        logBlock('setAttribute', `${this.tagName}.${n} = ${value}`);
        return _setAttribute.call(this, name, 'about:blank');
      }
    } catch (_) {}
    return _setAttribute.call(this, name, value);
  };

  function nodeHasBlockedUrl(node) {
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

      return cand.some(u => u && urlBlocked(u));
    } catch (_) {
      return false;
    }
  }

  const _appendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function(child) {
    try {
      if (nodeHasBlockedUrl(child)) {
        logBlock('appendChild(blocked-node)', child.outerHTML ? child.outerHTML.slice(0, 200) : String(child));
        return child; // drop
      }
    } catch (_) {}
    return _appendChild.call(this, child);
  };

  const _insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    try {
      if (nodeHasBlockedUrl(newNode)) {
        logBlock('insertBefore(blocked-node)', newNode.outerHTML ? newNode.outerHTML.slice(0, 200) : String(newNode));
        return newNode; // drop
      }
    } catch (_) {}
    return _insertBefore.call(this, newNode, referenceNode);
  };

  // -------- 2) Block fetch / XHR / beacon --------
  const _fetch = window.fetch;
  if (typeof _fetch === 'function') {
    window.fetch = function(input, init) {
      try {
        if (urlBlocked(input)) {
          const u = toUrl(input);
          logBlock('fetch', u ? u.href : String(input));
          return Promise.reject(new Error('Blocked by MITM injector (Yieldlove/Taboola)'));
        }
      } catch (_) {}
      return _fetch.call(this, input, init);
    };
  }

  const _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    try {
      if (urlBlocked(url)) {
        logBlock('xhr.open', url);
        this.__mitm_blocked__ = true;
        return _open.call(this, method, 'about:blank', async !== false, user, password);
      }
    } catch (_) {}
    return _open.call(this, method, url, async !== false, user, password);
  };

  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(body) {
    try {
      if (this.__mitm_blocked__) {
        logBlock('xhr.send', '(blocked)');
        try { this.abort(); } catch (_) {}
        return;
      }
    } catch (_) {}
    return _send.call(this, body);
  };

  if (navigator.sendBeacon) {
    const _beacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(url, data) {
      try {
        if (urlBlocked(url)) {
          logBlock('sendBeacon', url);
          return false;
        }
      } catch (_) {}
      return _beacon(url, data);
    };
  }

  // -------- 3) Purge already-present blocked nodes (best-effort) --------
  function purgeExisting() {
    try {
      const els = Array.from(document.querySelectorAll('script[src], iframe[src], img[src], link[href]'));
      for (const el of els) {
        const u = el.src || el.href || el.getAttribute('src') || el.getAttribute('href');
        if (u && urlBlocked(u)) {
          logBlock('purgeExisting', u);
          try { el.remove(); } catch (_) {}
        }
      }
    } catch (_) {}
  }

  try { purgeExisting(); } catch (_) {}
  try { document.addEventListener('DOMContentLoaded', purgeExisting, { once: true }); } catch (_) {}

  // -------- 4) Force-load Teads analytics to validate it shows up in PCAP --------
  function forceLoadTeadsAnalytics() {
    try {
      // Avoid duplicates
      if (document.querySelector('script[data-mitm-teads-analytics="1"]')) return;

      // Ensure the config object exists (matches your site snippet)
      window.teads_analytics = window.teads_analytics || {};
      if (!window.teads_analytics.analytics_tag_id) {
        window.teads_analytics.analytics_tag_id = 'PUB_27904';
      }
      window.teads_analytics.share = window.teads_analytics.share || function() {
        (window.teads_analytics.shared_data = window.teads_analytics.shared_data || []).push(arguments);
      };

      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://a.teads.tv/analytics/tag.js';
      s.setAttribute('data-mitm-teads-analytics', '1');

      s.onload = () => {
        logInfo('Teads analytics loaded OK', s.src);
        // Optional visible marker: green outline means Teads analytics executed
        try { document.documentElement.style.outline = '6px solid #00ff00'; } catch (_) {}
      };
      s.onerror = (e) => {
        logInfo('Teads analytics FAILED to load', { src: s.src, err: String(e && e.message || e) });
        // Optional visible marker: red outline means it failed
        try { document.documentElement.style.outline = '6px solid #ff0000'; } catch (_) {}
      };

      (document.head || document.documentElement).appendChild(s);
      logInfo('Injected Teads analytics script', s.src);
    } catch (e) {
      logInfo('Could not inject Teads analytics', String(e && e.message || e));
    }
  }

  // Try immediately and again after DOM ready
  forceLoadTeadsAnalytics();
  try { document.addEventListener('DOMContentLoaded', forceLoadTeadsAnalytics, { once: true }); } catch (_) {}

  logInfo('active', 'Blocking Yieldlove + cdn.taboola.com; force-loading Teads analytics (tag.js)');
})();
