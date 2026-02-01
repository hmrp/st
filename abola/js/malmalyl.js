// ==UserScript==
// @name         Isolation test: block ONLY Taboola libtrc loader.js
// @description  Blocks only https://cdn.taboola.com/libtrc/sociedadevicradesportiva-abola/loader.js (incl. query/hash); allows everything else (Yieldlove loads normally). Blue background indicator.
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
      try { document.body.style.background = '#0400ff'; } catch (_) {}
    });
  } catch (_) {}

  // -------- Block rule: ONLY Taboola libtrc loader --------
  // Matches:
  //  - https://cdn.taboola.com/libtrc/sociedadevicradesportiva-abola/loader.js
  //  - .../loader.js?anything
  //  - .../loader.js#anything
  const BLOCK_RX =
    /^https:\/\/cdn\.taboola\.com\/libtrc\/sociedadevicradesportiva-abola\/loader\.js(?:[?#].*)?$/i;

  function log(kind, detail) {
    try { console.warn('[MITM-TABOOLA-BLOCK]', kind, detail); } catch (_) {}
  }

  function normalizeUrl(raw) {
    try {
      const u = new URL(String(raw), location.href);
      // Normalize away hash (query kept)
      u.hash = '';
      return u.toString();
    } catch (_) {
      return null;
    }
  }

  function isBlocked(input) {
    const norm = normalizeUrl(input);
    if (!norm) return false;
    return BLOCK_RX.test(norm);
  }

  // -------- 1) Block DOM-based loads (script/iframe/img/link/etc.) --------
  function patchUrlSetter(proto, prop) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (!desc || !desc.set) return;

    Object.defineProperty(proto, prop, {
      get: desc.get,
      set: function (v) {
        try {
          if (isBlocked(v)) {
            log(`${proto.constructor?.name || 'Element'}.${prop}`, normalizeUrl(v) || String(v));
            // Replace with harmless blank
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

  const _setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    try {
      const n = String(name).toLowerCase();
      if ((n === 'src' || n === 'href') && isBlocked(value)) {
        log('setAttribute', `${this.tagName}.${n} = ${normalizeUrl(value) || String(value)}`);
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

      return cand.some(u => u && isBlocked(u));
    } catch (_) {
      return false;
    }
  }

  const _appendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function(child) {
    try {
      if (nodeHasBlockedUrl(child)) {
        log('appendChild(blocked-node)', child.outerHTML ? child.outerHTML.slice(0, 240) : String(child));
        return child; // drop
      }
    } catch (_) {}
    return _appendChild.call(this, child);
  };

  const _insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    try {
      if (nodeHasBlockedUrl(newNode)) {
        log('insertBefore(blocked-node)', newNode.outerHTML ? newNode.outerHTML.slice(0, 240) : String(newNode));
        return newNode; // drop
      }
    } catch (_) {}
    return _insertBefore.call(this, newNode, referenceNode);
  };

  // -------- 2) Block fetch / XHR / beacon ONLY for that URL --------
  const _fetch = window.fetch;
  if (typeof _fetch === 'function') {
    window.fetch = function(input, init) {
      try {
        if (isBlocked(input)) {
          log('fetch', normalizeUrl(input) || String(input));
          return Promise.reject(new Error('Blocked Taboola libtrc loader.js by MITM'));
        }
      } catch (_) {}
      return _fetch.call(this, input, init);
    };
  }

  const _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    try {
      if (isBlocked(url)) {
        log('xhr.open', normalizeUrl(url) || String(url));
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
        log('xhr.send', '(blocked)');
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
        if (isBlocked(url)) {
          log('sendBeacon', normalizeUrl(url) || String(url));
          return false;
        }
      } catch (_) {}
      return _beacon(url, data);
    };
  }

  // -------- 3) Purge any already-present loader script tags --------
  function purgeExisting() {
    try {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      for (const s of scripts) {
        const u = s.src || s.getAttribute('src');
        if (u && isBlocked(u)) {
          log('purgeExisting', normalizeUrl(u) || String(u));
          try { s.remove(); } catch (_) {}
        }
      }
    } catch (_) {}
  }

  try { purgeExisting(); } catch (_) {}
  try { document.addEventListener('DOMContentLoaded', purgeExisting, { once: true }); } catch (_) {}

  log('active', 'Blocking ONLY cdn.taboola.com/libtrc/.../loader.js (everything else allowed, incl. Yieldlove).');
})();
