// @name Maltrace (GAM + HB/YLHH + Taboola) - PCAPdroid JS Injector
// @description Captura IDs de GAM (lineItemId/creativeId), targeting hb_*, eventos YLHH, inserções de scripts/iframes (marca Taboola), e tentativas de redirect. Persiste incidente em localStorage/window.name e mostra overlay para copiar.
// @author you
// @version 1.1
// @match *://www.abola.pt/*
// @match *://*.abola.pt/*
// @match *://*.hugopedroso.com/*

(function () {
  // =========================
  // Visual indicator (injector ON)
  // =========================
  function paint() {
    try {
      const el = document.body || document.documentElement;
      if (el) el.style.background = "#0400ff";
    } catch {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", paint, { once: true });
  } else {
    paint();
  }

  // =========================
  // Config
  // =========================
  const MAX_EVENTS = 350;
  const LS_KEY = "__maltrace_store_v1";
  const LS_LAST_INCIDENT = "__maltrace_last_incident_v1";
  const now = () => Math.round(performance.now());

  // =========================
  // State
  // =========================
  const TRACE = window.__malTrace = {
    v: 1,
    page: location.href,
    ts: Date.now(),
    t0: now(),
    events: [],
    lastGpt: null,
    lastHb: null,
    lastTag: null,
    lastNav: null
  };

  function vendorFromSrc(src) {
    if (!src) return null;
    const s = String(src).toLowerCase();
    if (s.includes("taboola")) return "taboola";
    if (s.includes("outbrain")) return "outbrain";
    if (s.includes("criteo")) return "criteo";
    if (s.includes("doubleclick") || s.includes("googleads") || s.includes("googlesyndication")) return "google_ads";
    if (s.includes("yieldlove") || s.includes("yieldlab") || s.includes("ylhh")) return "yieldlove";
    return null;
  }

  function push(evt, data) {
    const e = { t: now(), evt, ...data };
    TRACE.events.push(e);
    if (TRACE.events.length > MAX_EVENTS) TRACE.events.shift();

    if (evt.startsWith("gpt.")) TRACE.lastGpt = e;
    if (evt.startsWith("hb.") || evt.startsWith("ylhh.")) TRACE.lastHb = e;
    if (evt.startsWith("tag.") || evt.startsWith("iframe.")) TRACE.lastTag = e;
    if (evt.startsWith("nav.")) TRACE.lastNav = e;

    try { console.log("[MAL-TRACE]", e); } catch {}
    return e;
  }

  function persist(reason, extra) {
    try {
      const payload = {
        reason,
        page: TRACE.page,
        ts: Date.now(),
        href_now: location.href,
        lastGpt: TRACE.lastGpt,
        lastHb: TRACE.lastHb,
        lastTag: TRACE.lastTag,
        lastNav: TRACE.lastNav,
        tail: TRACE.events.slice(-150),
        extra: extra || null
      };

      // Last incident (single)
      localStorage.setItem(LS_LAST_INCIDENT, JSON.stringify(payload));

      // Rolling store (up to 20 incidents)
      const store = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      store.push(payload);
      while (store.length > 20) store.shift();
      localStorage.setItem(LS_KEY, JSON.stringify(store));

      // window.name fallback (survives navigation in same tab)
      window.name = "MALTRACE:" + JSON.stringify(payload).slice(0, 60000);

      // One-line summary (easy to spot in logs)
      try {
        const g = payload.lastGpt || {};
        const tgt = (g.targeting || {});
        const hbBidder = tgt.hb_bidder ? tgt.hb_bidder[0] : null;
        console.error(
          "[MAL-TRACE][INCIDENT]",
          reason,
          "lineItemId=", g.lineItemId,
          "creativeId=", g.creativeId,
          "adUnitPath=", g.adUnitPath,
          "slotId=", g.slotId,
          "hb_bidder=", hbBidder,
          "lastTag=", payload.lastTag && (payload.lastTag.src || payload.lastTag.href || null)
        );
      } catch {}

    } catch {}
  }

  // =========================
  // Redirect / navigation tripwires
  // =========================
  const _open = window.open;
  window.open = function () {
    const args = Array.prototype.slice.call(arguments, 0, 3);
    push("nav.window_open", { args });
    persist("window.open", { args });
    return _open.apply(this, arguments);
  };

  window.addEventListener("beforeunload", function () {
    push("nav.beforeunload", {});
    persist("beforeunload");
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      push("nav.visibility_hidden", {});
      persist("visibility:hidden");
    }
  });

  // Click logger (helps distinguish click-driven redirects)
  document.addEventListener("click", function (e) {
    try {
      const a = e.target && e.target.closest ? e.target.closest("a") : null;
      push("ui.click", {
        tag: e.target && e.target.tagName,
        href: a ? a.href : null
      });
    } catch {}
  }, true);

  // =========================
  // Tag / iframe origin sensor
  // =========================
  const origAppend = Node.prototype.appendChild;
  Node.prototype.appendChild = function (node) {
    try {
      if (node && node.tagName === "SCRIPT" && node.src) {
        push("tag.script_added", { src: node.src, vendor: vendorFromSrc(node.src) });
      }
      if (node && node.tagName === "IFRAME" && node.src) {
        push("iframe.added", { src: node.src, vendor: vendorFromSrc(node.src) });
      }
    } catch {}
    return origAppend.call(this, node);
  };

  try {
    const mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes && m.addedNodes.forEach(function (n) {
          if (!n || !n.tagName) return;
          if (n.tagName === "SCRIPT" && n.src) {
            push("tag.script_added", { src: n.src, vendor: vendorFromSrc(n.src) });
          }
          if (n.tagName === "IFRAME" && n.src) {
            push("iframe.added", { src: n.src, vendor: vendorFromSrc(n.src) });
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

    pubads.addEventListener("slotRenderEnded", function (e) {
      const slot = e.slot;
      let targeting = {};
      try {
        const keys = slot.getTargetingKeys();
        keys.forEach(k => targeting[k] = slot.getTargeting(k));
      } catch {}

      push("gpt.slotRenderEnded", {
        slotId: slot.getSlotElementId && slot.getSlotElementId(),
        adUnitPath: slot.getAdUnitPath && slot.getAdUnitPath(),
        isEmpty: !!e.isEmpty,
        size: e.size || null,
        creativeId: e.creativeId ?? null,
        lineItemId: e.lineItemId ?? null,
        advertiserId: e.advertiserId ?? null,
        campaignId: e.campaignId ?? null,
        targeting
      });
    });

    pubads.addEventListener("impressionViewable", function (e) {
      const slot = e.slot;
      push("gpt.impressionViewable", {
        slotId: slot.getSlotElementId && slot.getSlotElementId(),
        adUnitPath: slot.getAdUnitPath && slot.getAdUnitPath()
      });
    });

    pubads.addEventListener("slotRequested", function(e) {
      const slot = e.slot;
      push("gpt.slotRequested", {
        slotId: slot.getSlotElementId && slot.getSlotElementId(),
        adUnitPath: slot.getAdUnitPath && slot.getAdUnitPath()
      });
    });

    pubads.addEventListener("slotResponseReceived", function(e) {
      const slot = e.slot;
      push("gpt.slotResponseReceived", {
        slotId: slot.getSlotElementId && slot.getSlotElementId(),
        adUnitPath: slot.getAdUnitPath && slot.getAdUnitPath()
      });
    });
  });

  // =========================
  // YLHH hook (tracker) — best-effort
  // =========================
  function wrap(obj, fnName) {
    if (!obj || typeof obj[fnName] !== "function") return;
    const orig = obj[fnName];
    obj[fnName] = function () {
      try { push("ylhh." + fnName, { argc: arguments.length }); } catch {}
      return orig.apply(this, arguments);
    };
  }

  function tryHookYLHH() {
    const bidder = window.YLHH && window.YLHH.bidder;
    const tr = bidder && bidder.tracker;
    if (!tr) return false;

    ["onBidsRequested", "beforeAdServerRequest", "onSlotRendered", "onCreativeClick", "init"]
      .forEach(n => wrap(tr, n));

    push("hb.yld_hooked", { ok: true });
    return true;
  }

  const hookI = setInterval(function () {
    if (tryHookYLHH()) clearInterval(hookI);
  }, 50);
  setTimeout(function () { clearInterval(hookI); }, 8000);

  // =========================
  // Overlay: show last incident after navigation
  // =========================
  function showOverlay() {
    let last = null;
    try { last = JSON.parse(localStorage.getItem(LS_LAST_INCIDENT) || "null"); } catch {}

    if (!last) {
      try {
        if (typeof window.name === "string" && window.name.startsWith("MALTRACE:")) {
          last = JSON.parse(window.name.slice(9));
        }
      } catch {}
    }

    if (!last) return;

    const box = document.createElement("div");
    box.style.cssText = [
      "position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px",
      "max-height:45vh;overflow:auto;background:#111;color:#fff",
      "border:2px solid #fff;border-radius:10px;padding:10px;font:12px/1.3 monospace"
    ].join(";");

    const title = document.createElement("div");
    title.textContent = "MALTRACE last incident (copy & paste):";
    title.style.cssText = "margin:0 0 8px 0;font-weight:700;";

    const txt = document.createElement("pre");
    txt.textContent = JSON.stringify(last, null, 2);
    txt.style.margin = "0";

    const bar = document.createElement("div");
    bar.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 8px 0;";

    const btnCopy = document.createElement("button");
    btnCopy.textContent = "Copy JSON";
    btnCopy.style.cssText = "padding:6px 10px;border-radius:8px;border:0;cursor:pointer;";
    btnCopy.onclick = async function () {
      try { await navigator.clipboard.writeText(txt.textContent); } catch {}
    };

    const btnClose = document.createElement("button");
    btnClose.textContent = "Close";
    btnClose.style.cssText = "padding:6px 10px;border-radius:8px;border:0;cursor:pointer;";
    btnClose.onclick = function () { box.remove(); };

    const btnClear = document.createElement("button");
    btnClear.textContent = "Clear stored";
    btnClear.style.cssText = "padding:6px 10px;border-radius:8px;border:0;cursor:pointer;";
    btnClear.onclick = function () {
      try {
        localStorage.removeItem(LS_LAST_INCIDENT);
        box.remove();
      } catch {}
    };

    bar.appendChild(btnCopy);
    bar.appendChild(btnClose);
    bar.appendChild(btnClear);

    box.appendChild(title);
    box.appendChild(bar);
    box.appendChild(txt);
    document.documentElement.appendChild(box);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showOverlay, { once: true });
  } else {
    showOverlay();
  }

  // helper manual
  window.__malTraceDump = function () {
    try {
      console.log("last incident:", JSON.parse(localStorage.getItem(LS_LAST_INCIDENT) || "null"));
      console.log("store:", JSON.parse(localStorage.getItem(LS_KEY) || "[]"));
    } catch {}
    console.log("in-memory TRACE:", TRACE);
  };

  push("init", { ok: true, href: location.href });
})();
