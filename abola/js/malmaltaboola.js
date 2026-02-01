// ==UserScript==
// @name         Isolation test: allow ONLY Taboola (block everything else)
// @description  Blocks all third-party traffic and DOM injections except Taboola; keeps first-party site assets allowed; blue background indicator.
// @author       HP
// @version      1.0
// @match        *://www.abola.pt/*
// @match        *://*.abola.pt/*
// @match        *://*.hugopedroso.com/*
// ==/UserScript==

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
  // Allow FIRST-PARTY so the page loads + allow ONLY Taboola as 3rd party.
  // Everything else is blocked.

  const FIRST_PARTY_HOST_PATTERNS = [
    /(^|\.)abola\.pt$/i,
    /(^|\.)hugopedroso\.com$/i,
  ];

  const ALLOW_HOST_PATTERNS = [
    ...FIRST_PARTY_HOST_PATTERNS,

    // Taboola (broad)
    /(^|\.)taboola\.com$/i,
    /(^|\.)taboola\.net$/i,
  ];

  // Optional: allow common “internal” URLs so we don’t break harmless stuff
  const ALLOW_URL_PREFIXES = [
    'about:blank',
    'blob:',
    'data:',
  ];

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

  function isAllowedByPrefix(raw) {
    try {
      const s = String(raw || '');
      return ALLOW_URL_PREFIXES.some(p => s.startsWith(p));
    } catch (_) {
      return false;
    }
  }

  function hostAllowed(host) {
    if (!host) return false;
    return ALLOW_HOST_PATTERNS.some(rx => rx.test(host));
  }

  // DEFAULT BLOCK: allow only Taboola + first-party
  function urlBlocked(input) {
    const u = toUrl(input);
    if (!u) return false;

    // allow internal schemes
    if (isAllowedByPrefix(u.href)) return false;

    // allow only whitelisted hosts
    if (hostAllowed(u.hostname)) return false;

    return true;
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
        logBlock('appendChild(blocked-node)', child.outerHTML ? child.outerHTML.slice(0, 220) : String(child));
        return child; // drop
      }
    } catch (_) {}
    return _appendChild.call(this, child);
  };

  const _insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    try {
      if (nodeHasBlockedUrl(newNode)) {
        logBlock('insertBefore(blocked-node)', newNode.outerHTML ? newNode.outerHTML.slice(0, 220) : String(newNode));
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
          return Promise.reject(new Error('Blocked by MITM injector (allow Taboola only)'));
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

  logInfo('active', 'Allowing ONLY first-party + Taboola. Everything else blocked.');
})();
