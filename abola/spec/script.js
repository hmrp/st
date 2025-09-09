
fetch("data.json")
  .then(res => res.json())
  .then(DATA => {
    window.DATA = DATA;
    let state = {
    medium: "abola",
    digitalType: "all",
    subtype: "all",
    tvDuration: null,
    tvShowAll: !1
};
const $masthead = document.getElementById("masthead"),
    $headerSpacer = document.getElementById("headerSpacer"),
    $mainTabs = document.getElementById("mainTabs"),
    $contextTabs = document.getElementById("contextTabs"),
    $brandBtn = document.getElementById("brandBtn"),
    $secAbola = document.getElementById("sec-abola"),
    $secDigital = document.getElementById("sec-digital"),
    $secprint = document.getElementById("sec-print"),
    $secTV = document.getElementById("sec-tv"),
    $secBranded = document.getElementById("sec-branded"),
    $secTerms = document.getElementById("sec-condicoes"),
    $gridAbola = document.getElementById("gridAbola"),
    $gridDigital = document.getElementById("gridDigital"),
    $gridprint = document.getElementById("gridprint"),
    $gridBranded = document.getElementById("gridBranded"),
    $tvPanel = document.getElementById("tvPanel"),
    $printNote = document.getElementById("printNotice"),
    $scrim = document.getElementById("scrim"),
    $drawer = document.getElementById("drawer"),
    $drawerTitle = document.getElementById("drawerTitle"),
    $drawerTags = document.getElementById("drawerTags"),
    $preview = document.getElementById("preview"),
    $specList = document.getElementById("specList"),
    $specSection = document.getElementById("specSection"),
    $closeDrawerBtn = document.getElementById("closeDrawerBtn"),
    $brandBar = document.querySelector(".masthead > .brand"),
    $drawerContent = document.querySelector(".drawer-content");

function mastHeight() {
    return $masthead?.getBoundingClientRect().height || 0
}

function syncHeaderSpacer() {
    const e = $masthead?.getBoundingClientRect().height || 0;
    $headerSpacer && ($headerSpacer.style.height = e + "px"), document.documentElement.style.setProperty("--mastpad", e + 8 + "px")
}

function buildItemHash(e) {
    if ("digital" === e.medium) {
        return `#digital/${state.digitalType||"all"}/item/${e.id}`
    }
    if ("print" === e.medium) {
        return `#print/${state.subtype||"all"}/item/${e.id}`
    }
    return "branded" === e.medium ? `#branded/item/${e.id}` : "abola" === e.medium ? `#abola/item/${e.id}` : location.hash || "#"
}

function buildprintTechBox() {
    const e = document.createElement("section");
    return e.className = "print-tech", e.innerHTML = "\n    <h4>Especificações de Impressão</h4>\n    <ul>\n      <li>Formato <strong>PDF, EPS</strong> ou <strong>TIFF</strong>, <strong>300&nbsp;dpi</strong>, <strong>CMYK</strong> (quadricromia).</li>\n      <li>Os textos devem ser <strong>convertidos em curvas.</strong></li>\n      <li>Para melhores resultados de impressão, os ficheiros devem ser <strong>acompanhados de provas de cor.</strong></li>\n      <li>Os textos devem ser <strong>exclusivamente a preto (100%)</strong>; as restantes cores <strong>CMY</strong> devem vir com <strong>0%</strong>.</li>\n      <li>Caso os pontos acima não sejam respeitados a Soc. Vicra Desportiva não se responsabiliza por qualquer falha ou defeito na impressão.</li>\n    </ul>\n\n    <h4>Sobretaxa</h4>\n    <p>Localização obrigatória +50%.</p> <p> Publicidade em idioma estrangeiro +50%.</p> <p>Publicidade produzida pelo jornal +50%.</p>\n  ", e
}

function baseHashForCurrent() {
    return "digital" === state.medium ? `#digital/${state.digitalType}` : "print" === state.medium ? `#print/${state.subtype}` : "tv" === state.medium ? "#" + updateHashTV() : "branded" === state.medium ? "#branded" : "condicoes" === state.medium ? "#condicoes" : "#abola"
}

function measureBrand() {
    if (!$brandBar || !$masthead) return;
    const e = $masthead.classList.contains("show-brand");
    $masthead.classList.add("show-brand"), requestAnimationFrame((() => {
        const t = $brandBar.scrollHeight || 0;
        $masthead.style.setProperty("--brandH", t + "px"), e || $masthead.classList.remove("show-brand"), syncHeaderSpacer()
    }))
}

function updateBrandVisibility() {
    const e = pickSectionByRefLine(),
        t = e ? SECTION_TO_MEDIUM[e.id] : null,
        n = !(!t || "abola" === t);
    $masthead.classList.toggle("show-brand", n), syncHeaderSpacer()
}

function getContextNav() {
    return document.querySelector(".context-pane.is-live .context-tabs")
}

function scrollToHeadById(e) {
    const t = document.getElementById(e);
    if (!t) return;
    syncHeaderSpacer();
    const n = t.closest(".section") || t;
    let o = 0;
    o = "number" == typeof n.offsetTop ? n.offsetTop : window.scrollY + n.getBoundingClientRect().top;
    const i = Math.max(0, o - mastHeight() - 8),
        a = Math.abs(window.scrollY - i);
    lockSpy(Math.min(2e3, Math.max(900, .9 * a))), window.scrollTo({
        top: i,
        behavior: "smooth"
    })
}

function setActiveTab(e, t, n = "data-medium") {
    e && [...e.querySelectorAll("button")].forEach((e => {
        e.classList.toggle("active", e.getAttribute(n) === t)
    }))
}

function gradStyle([e, t]) {
    return `background:linear-gradient(135deg,${e},${t});`
}
window.addEventListener("load", measureBrand), window.addEventListener("resize", measureBrand), window.addEventListener("resize", syncHeaderSpacer), window.ResizeObserver && new ResizeObserver(syncHeaderSpacer).observe($masthead || document.body), syncHeaderSpacer();
let spyLocked = !1,
    spyUnlockTimer = null;

function lockSpy(e = 900) {
    spyLocked = !0, clearTimeout(spyUnlockTimer), spyUnlockTimer = setTimeout((() => {
        spyLocked = !1
    }), e)
}

function unlockSpy() {
    spyLocked && (spyLocked = !1, clearTimeout(spyUnlockTimer), onScrollSpy())
}

function buildSubmenu(e) {
    const t = document.querySelector(".context-slot"),
        n = document.getElementById("contextTabs");
    if (!t || !n) return;
    let o = [];
    if ("digital" === e ? o = [{
            val: "all",
            label: "Todos"
        }, {
            val: "display",
            label: "Display"
        }, {
            val: "rich media",
            label: "Rich Media"
        }] : "print" === e && (o = [{
            val: "all",
            label: "Todos"
        }, {
            val: "capa",
            label: "Capa"
        }, {
            val: "interior",
            label: "Interior"
        }, {
            val: "contracapa",
            label: "Contra Capa"
        }]), t.classList.toggle("is-open", o.length > 0), 0 !== o.length) {
        n.innerHTML = "";
        for (const t of o) {
            const o = document.createElement("button");
            o.textContent = t.label, o.setAttribute("data-sub", t.val);
            ("digital" === e && state.digitalType === t.val || "print" === e && state.subtype === t.val) && o.classList.add("active"), o.onclick = () => {
                "digital" === e ? (state.digitalType = t.val, renderDigitalSection(), history.replaceState(null, "", `#digital/${t.val}`), scrollToHeadById("head-digital")) : (state.subtype = t.val, renderprintSection(), history.replaceState(null, "", `#print/${t.val}`), scrollToHeadById("head-print")), [...n.querySelectorAll("button")].forEach((e => e.classList.toggle("active", e === o)))
            }, n.appendChild(o)
        }
    } else n.innerHTML = ""
}
window.addEventListener("wheel", unlockSpy, {
    passive: !0
}), window.addEventListener("touchstart", unlockSpy, {
    passive: !0
}), window.addEventListener("touchmove", unlockSpy, {
    passive: !0
}), window.addEventListener("keydown", (e => {
    ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key) && unlockSpy()
}), {
    passive: !0
});
let __lockY = 0;

function lockPageScroll() {
    __lockY = window.scrollY || window.pageYOffset || 0, document.body.style.position = "fixed", document.body.style.top = `-${__lockY}px`, document.body.style.left = "0", document.body.style.right = "0", document.body.style.width = "100%"
}

function unlockPageScroll() {
    const e = Math.abs(parseInt(document.body.style.top || "0", 10)) || 0;
    document.body.style.position = "", document.body.style.top = "", document.body.style.left = "", document.body.style.right = "", document.body.style.width = "", window.scrollTo(0, e)
}

function closeDrawer({
    updateHash: e = !0
} = {}) {
    $preview?.querySelectorAll("video")?.forEach((e => {
        try {
            e.pause(), e.currentTime = 0
        } catch {}
    })), $scrim?.classList.remove("show"), $drawer?.classList.remove("show"), document.body.classList.remove("no-scroll"), e && history.replaceState(null, "", baseHashForCurrent())
}

function openDrawer(e, {
    fromHash: t = !1
} = {}) {
    if (!e || "tv" === e.medium || !$drawer) return;
    if ($drawerTitle && ($drawerTitle.textContent = e.name || "Details"), $drawerTags && ($drawerTags.textContent = [e.subtype, e.medium].filter(Boolean).join(" · ")), function() {
            let e = document.getElementById("fs-overlay-style");
            e || (e = document.createElement("style"), e.id = "fs-overlay-style", document.head.appendChild(e)), e.textContent = "\n      .preview .media-box{ position:relative; }             \n      .preview .media-box.is-zoomable{ cursor: zoom-in; }    \n      .preview .media-box:focus{ outline:none; }\n      .fs-btn{\n        position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);\n        width:66px; height:66px; border-radius:999px;\n        background: rgba(0,0,0,.55);\n        border:1px solid rgba(255,255,255,.18);\n        box-shadow: 0 1px 0 rgba(0,0,0,.08), 0 6px 18px rgba(0,0,0,.25);\n        color:#fff; display:flex; align-items:center; justify-content:center;\n        opacity:0; pointer-events:none; transition:opacity .18s ease, transform .02s ease;\n      }\n      .fs-btn svg{ width:28px; height:28px; display:block; }\n      @media (hover:hover) and (pointer:fine){\n        .media-box.is-zoomable:hover .fs-btn{ opacity:.9; }\n      }\n      .media-box.is-zoomable:focus-visible .fs-btn{ opacity:.9; }\n      .is-fs .fs-btn{ display:none; }\n      .media-box video{ pointer-events:none; } \n    "
        }(), $preview) {
        $preview.innerHTML = "";
        const t = document.createElement("div");
        t.className = "media-box " + ("print" === e.medium ? "is-print" : "is-digital"), t.tabIndex = 0;
        const n = (t = e.art) => {
                if (!t) return null;
                const n = document.createElement("img");
                return n.src = t, n.alt = e.name || "", n.loading = "lazy", n
            },
            o = e => {
                const o = n(e);
                if (!o) return;
                const i = t.querySelector("video");
                if (i) {
                    try {
                        i.pause()
                    } catch {}
                    t.removeChild(i)
                }
                const a = t.querySelector("img");
                a ? a.replaceWith(o) : t.appendChild(o)
            },
            i = () => {
                if (!t.querySelector("video, img")) {
                    const n = e.gradient || ["#eee", "#fff"];
                    t.style.background = `linear-gradient(135deg, ${n[0]}, ${n[1]})`
                }
            };
        let a = 0;
        const d = () => window.scrollY || document.documentElement.scrollTop || 0,
            r = e => {
                requestAnimationFrame((() => window.scrollTo(0, e))), document.body.style.position = "", document.body.style.top = "", document.body.style.left = "", document.body.style.right = "", document.body.style.width = ""
            },
            s = () => document.fullscreenElement === t || document.webkitFullscreenElement === t,
            l = () => {
                const e = s();
                t.classList.toggle("is-fs", e), e || r(a)
            },
            c = async () => {
                a = d();
                try {
                    t.requestFullscreen ? await t.requestFullscreen() : t.webkitRequestFullscreen && t.webkitRequestFullscreen()
                } catch {}
            }, u = async () => {
                try {
                    document.fullscreenElement ? await document.exitFullscreen() : document.webkitFullscreenElement && document.webkitExitFullscreen()
                } catch {}
            }, m = () => {
                s() ? u() : c()
            };
        if (document.addEventListener("fullscreenchange", l), document.addEventListener("webkitfullscreenchange", l), "digital" === e.medium && (e.video || e.videos)) {
            t.classList.add("is-zoomable");
            const n = {
                    desktop: e.videos?.desktop || e.video || null,
                    mobile: e.videos?.mobile || null
                },
                i = {
                    desktop: e.posters?.desktop || e.art || null,
                    mobile: e.posters?.mobile || e.art || null
                };
            let d = n.desktop ? "desktop" : n.mobile ? "mobile" : null;
            const s = document.createElement("video");
            s.autoplay = !0, s.muted = !0, s.loop = !0, s.playsInline = !0, s.controls = !1, s.preload = "metadata";
            let c = null,
                u = null;
            const p = e => {
                if (e && n[e]) {
                    d = e;
                    try {
                        s.pause()
                    } catch {}
                    s.src = n[e], i[e] ? s.setAttribute("poster", i[e]) : s.removeAttribute("poster"), s.load(), s.play().catch((() => {})), c?.classList?.toggle("is-active", "desktop" === e), u?.classList?.toggle("is-active", "mobile" === e)
                }
            };
            s.addEventListener("error", (() => {
                o(e.art)
            }), {
                once: !0
            }), "webkitEnterFullscreen" in HTMLVideoElement.prototype && s.addEventListener("webkitendfullscreen", (() => r(a))), t.appendChild(s);
            const h = document.createElement("div");
            h.className = "fs-btn", h.setAttribute("aria-hidden", "true"), h.innerHTML = '\n        <svg viewBox="0 0 24 24" aria-hidden="true">\n          <path d="M8 3 H5 a2 2 0 0 0 -2 2 V8 M16 3 H19 a2 2 0 0 1 2 2 V8\n                   M8 21 H5 a2 2 0 0 1 -2 -2 V16 M16 21 H19 a2 2 0 0 0 2 -2 V16"\n                fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>\n          <path d="M9 9 L5 5 M15 9 L19 5 M9 15 L5 19 M15 15 L19 19"\n                fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>\n        </svg>', t.appendChild(h);
            const y = e => {
                e.preventDefault(), e.stopPropagation(), m()
            };
            t.addEventListener("click", y);
            const b = document.createElement("div");
            b.className = "preview-switch", n.desktop && (c = document.createElement("button"), c.className = "switch-btn", c.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 5h18v12H3zM8 21h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> DESKTOP', c.addEventListener("click", (() => p("desktop"))), b.appendChild(c)), n.mobile && (u = document.createElement("button"), u.className = "switch-btn", u.innerHTML = '<svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="18" r="1.2"/></svg> MOBILE', u.addEventListener("click", (() => p("mobile"))), b.appendChild(u)), $preview.appendChild(t), b.childElementCount && $preview.appendChild(b), d && p(d);
            const v = () => {
                document.removeEventListener("fullscreenchange", l), document.removeEventListener("webkitfullscreenchange", l), t.removeEventListener("click", y), document.body.style.position = "", document.body.style.top = "", document.body.style.left = "", document.body.style.right = "", document.body.style.width = ""
            };
            $scrim?.addEventListener("click", v, {
                once: !0
            }), $closeDrawerBtn?.addEventListener("click", v, {
                once: !0
            }), window.addEventListener("keydown", (e => {
                "Escape" === e.key && v()
            }), {
                once: !0
            })
        } else if ("print" === e.medium) {
            t.classList.add("is-zoomable"), o(e.art), $preview.appendChild(t);
            const n = document.createElement("div");
            n.className = "fs-btn", n.setAttribute("aria-hidden", "true"), n.innerHTML = '\n        <svg viewBox="0 0 24 24" aria-hidden="true">\n          <path d="M8 3 H5 a2 2 0 0 0 -2 2 V8 M16 3 H19 a2 2 0 0 1 2 2 V8\n                   M8 21 H5 a2 2 0 0 1 -2 -2 V16 M16 21 H19 a2 2 0 0 0 2 -2 V16"\n                fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>\n          <path d="M9 9 L5 5 M15 9 L19 5 M9 15 L5 19 M15 15 L19 19"\n                fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>\n        </svg>', t.appendChild(n);
            const i = e => {
                e.preventDefault(), e.stopPropagation(), m()
            };
            if (t.addEventListener("click", i), e.gridReference) {
                const t = document.createElement("div");
                t.className = "preview-switch";
                const n = document.createElement("button");
                n.className = "switch-btn is-active", n.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 5h18v14H3zM3 9h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> MANCHA ÚTIL';
                const i = document.createElement("button");
                i.className = "switch-btn", i.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16v10H4zM8 11l3 3 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> GRELHA DE MÓDULOS';
                const a = t => {
                    o("layout" === t ? e.art : e.gridReference), n.classList.toggle("is-active", "layout" === t), i.classList.toggle("is-active", "gridReference" === t)
                };
                n.addEventListener("click", (() => a("layout"))), i.addEventListener("click", (() => a("gridReference"))), t.append(n, i), $preview.appendChild(t)
            }
            const a = () => {
                document.removeEventListener("fullscreenchange", l), document.removeEventListener("webkitfullscreenchange", l), t.removeEventListener("click", i), document.body.style.position = "", document.body.style.top = "", document.body.style.left = "", document.body.style.right = "", document.body.style.width = ""
            };
            $scrim?.addEventListener("click", a, {
                once: !0
            }), $closeDrawerBtn?.addEventListener("click", a, {
                once: !0
            }), window.addEventListener("keydown", (e => {
                "Escape" === e.key && a()
            }), {
                once: !0
            })
        } else i(), $preview.appendChild(t)
    }
    if ($specList) {
        $specList.innerHTML = "";
        const t = e.specs || {
            Note: "Specs coming soon"
        };
        Object.entries(t).forEach((([e, t]) => {
            const n = document.createElement("dt");
            n.textContent = e;
            const o = document.createElement("dd");
            if (t && "object" == typeof t && t.href) {
                const e = document.createElement("a");
                e.href = t.href, e.textContent = t.label || t.href, e.target = "_blank", e.rel = "noopener", o.appendChild(e)
            } else o.innerHTML = String(t);
            $specList.append(n, o)
        }))
    }
    $specSection && ($specSection.style.display = "block");
    const n = document.querySelector(".drawer-content");
    if (n) {
        const t = n.querySelector(".print-tech-inside");
        if (t && t.remove(), "print" === e.medium) {
            [...n.querySelectorAll(".print-tech-inside,.print-tech")].forEach((e => e.remove()));
            const e = buildprintTechBox();
            e.classList.add("print-tech-inside"), n.appendChild(e)
        }
    }
    if ($scrim?.classList.add("show"), $drawer?.classList.add("show"), document.body.classList.add("no-scroll"), !t) {
        let t = baseHashForCurrent();
        "digital" === e.medium ? t = `#digital/${state.digitalType}/item/${e.id}` : "print" === e.medium ? t = `#print/${state.subtype}/item/${e.id}` : "branded" === e.medium && (t = `#branded/item/${e.id}`), history.replaceState(null, "", t)
    }
}

function labelForItem(e) {
    return {
        display: "Display",
        "rich media": "Rich Media",
        capa: "Capa",
        interior: "Interior",
        contracapa: "Contra Capa"
    } [e.subtype || ""] || ""
}

function posterBG(e) {
    if (e.art) return `background: center / cover no-repeat url("${e.art}")`;
    const t = e.gradient || ["#e5e7eb", "#ffffff"];
    return `background: linear-gradient(135deg, ${t[0]}, ${t[1]})`
}

function buildPoster(e) {
    const t = document.createElement("article");
    t.className = "card", t.dataset.medium = e.medium || "";
    const n = document.createElement("div");
    n.className = "poster";
    const o = document.createElement("div");
    o.className = "grad", o.style.cssText = posterBG(e), n.appendChild(o);
    const i = labelForItem(e);
    if (i) {
        const e = document.createElement("div");
        e.className = "label", e.textContent = i, n.appendChild(e)
    }
    const a = document.createElement("div");
    a.className = "meta";
    const d = document.createElement("div");
    d.className = "title", d.innerHTML = `<span>${e.name||""}</span>`;
    const r = document.createElement("div");
    return r.className = "muted", r.style.fontSize = "13px", r.textContent = e.summary || "", a.append(d, r), t.append(n, a), t.addEventListener("click", (() => openDrawer(e))), t
}

function datasetAbola() {
    return DATA.ABOLA
}

function datasetDigital() {
    return "all" === state.digitalType ? DATA.DIGITAL : DATA.DIGITAL.filter((e => e.subtype === state.digitalType))
}

function datasetprint() {
    return "all" === state.subtype ? DATA.print : DATA.print.filter((e => e.subtype === state.subtype))
}

function datasetBranded() {
    return DATA.BRANDED
}

function renderAbolaSection() {
    $gridAbola && ($gridAbola.innerHTML = "", datasetAbola().forEach((e => $gridAbola.appendChild(buildPoster(e)))))
}

function renderDigitalSection() {
    $gridDigital && ($gridDigital.innerHTML = "", datasetDigital().forEach((e => $gridDigital.appendChild(buildPoster(e)))))
}

function renderprintSection() {
    $gridprint && $secprint && ($gridprint.innerHTML = "", datasetprint().forEach((e => $gridprint.appendChild(buildPoster(e)))), $printNote && ($printNote.style.display = "none", $printNote.textContent = ""), [...$secprint.querySelectorAll(".print-tech")].forEach((e => e.remove())), $secprint.appendChild(buildprintTechBox()))
}

function renderBrandedSection() {
    $gridBranded && ($gridBranded.innerHTML = "", datasetBranded().forEach((e => $gridBranded.appendChild(buildPoster(e)))))
}

function updateHashTV() {
    let e = "tv";
    return Number.isFinite(state.tvDuration) && (e += "/" + state.tvDuration), state.tvShowAll && (e += "/all"), e
}

function renderTVMatrix(e, t) {
    const n = e.durations,
        o = document.createElement("div");
    o.className = "hscroll";
    const i = document.createElement("table");
    i.className = "rate-table";
    const a = Object.fromEntries(n.map((e => [e, []])));

    function d(e, t) {
        (a[e] || []).forEach((e => e.classList.toggle("col-hover", t)))
    }

    function r(e) {
        Object.values(a).flat().forEach((e => e.classList.remove("col-active"))), (a[e] || []).forEach((e => e.classList.add("col-active")))
    }

    function s(e) {
        state.tvDuration = e, r(e), history.replaceState(null, "", "#" + updateHashTV()), scrollToHeadById("head-tv")
    }
    const l = document.createElement("thead"),
        c = document.createElement("tr"),
        u = document.createElement("th");
    u.textContent = "Duração", u.className = "sticky-col", c.appendChild(u), n.forEach((e => {
        const t = document.createElement("th");
        t.textContent = `${e}”`, t.classList.add("dur"), t.dataset.dur = e, t.addEventListener("mouseenter", (() => d(e, !0))), t.addEventListener("mouseleave", (() => d(e, !1))), t.addEventListener("click", (() => s(e))), a[e].push(t), c.appendChild(t)
    })), l.appendChild(c), i.appendChild(l);
    const m = document.createElement("tbody");
    (e.dayparts || []).forEach((e => {
        const t = document.createElement("tr");
        t.className = "section-row";
        const o = document.createElement("th");
        o.className = "sticky-col", o.textContent = e.name || "";
        const i = document.createElement("th");
        i.colSpan = n.length, t.append(o, i), m.appendChild(t), (e.slots || []).forEach((e => {
            const t = document.createElement("tr"),
                o = document.createElement("td");
            o.className = "sticky-col", o.textContent = e.time || "", t.appendChild(o), n.forEach((n => {
                const o = document.createElement("td");
                o.dataset.dur = n;
                const i = e.prices?.[n];
                o.textContent = null != i ? "€ " + i.toLocaleString("pt-PT", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) : "—", o.addEventListener("mouseenter", (() => d(n, !0))), o.addEventListener("mouseleave", (() => d(n, !1))), o.addEventListener("click", (() => s(n))), a[n].push(o), t.appendChild(o)
            })), m.appendChild(t)
        }))
    }));
    const p = document.createElement("tr");
    p.className = "section-row";
    const h = document.createElement("th");
    h.className = "sticky-col", h.textContent = "INDEX";
    const y = document.createElement("th");
    y.colSpan = n.length, p.append(h, y), m.appendChild(p);
    const b = document.createElement("tr"),
        v = document.createElement("td");
    v.className = "sticky-col", v.textContent = "", b.appendChild(v), n.forEach((t => {
        const n = document.createElement("td");
        n.dataset.dur = t, n.textContent = (e.index?.[t] != null ? e.index[t].toLocaleString("pt-PT") : "—"), n.addEventListener("mouseenter", (() => d(t, !0))), n.addEventListener("mouseleave", (() => d(t, !1))), n.addEventListener("click", (() => s(t))), a[t].push(n), b.appendChild(n)
    })), m.appendChild(b), i.appendChild(m), o.appendChild(i), t.appendChild(o), Number.isFinite(state.tvDuration) && r(state.tvDuration)
}

function renderTVTechNote(e) {
    const t = document.createElement("section");
    t.className = "tv-tech", t.innerHTML = "\n    <h4>Especificações Técnicas de Emissão</h4>\n    <dl>\n      <dt>Tipo de ficheiro</dt><dd>MXF (.mxf)</dd>\n      <dt>Codec</dt><dd>MPEG Video — XCam HD 35 — Version 2</dd>\n      <dt>Bit rate</dt><dd>35 Mb/s</dd>\n      <dt>Resolution</dt><dd>1920×1080 — 16:9</dd>\n      <dt>Frame rate</dt><dd>25.000 FPS</dd>\n      <dt>Bit depth</dt><dd>8 bits</dd>\n      <dt>Scan type</dt><dd>Interlaced</dd>\n      <dt>Scan order</dt><dd>Top Field Order</dd>\n      <dt>Compression mode</dt><dd>Lossy</dd>\n    </dl>\n    <p>Caso os pontos acima não sejam respeitados a Soc. Vicra Desportiva não se responsabiliza por qualquer falha ou defeito na emissão.</p> <p>A Vicra Comunicações Lda é a entidade responsável pela comercialização de publicidade no canal de televisão A BOLA TV.</p> <p>A contratação de publicidade a difundir na A BOLA TV deverá observar as disposições previstas nas presentes condições comerciais, bem como na legislação nacional e internacional aplicável.</p>\n  ", e.appendChild(t)
}

function renderTVOutside(e) {
    if (!$tvPanel || !e) return;
    $tvPanel.innerHTML = "";
    const t = document.createElement("h4");
    t.textContent = "Tabela de Preços", $tvPanel.appendChild(t), renderTVMatrix(e, $tvPanel), renderTVTechNote($tvPanel)
}

function renderAll() {
    renderAbolaSection(), renderDigitalSection(), renderprintSection(), renderBrandedSection(), DATA.TV[0] && renderTVOutside(DATA.TV[0])
}
$scrim?.addEventListener("click", (e => {
    e.preventDefault(), closeDrawer({
        updateHash: !0
    })
})), $closeDrawerBtn?.addEventListener("click", (e => {
    e.preventDefault(), closeDrawer({
        updateHash: !0
    })
})), window.addEventListener("keydown", (e => {
    "Escape" === e.key && closeDrawer({
        updateHash: !0
    })
})), renderAll(), $brandBtn?.addEventListener("click", (() => {
    state.medium = "top", setActiveTab($mainTabs, null), buildSubmenu("top"), lockSpy(900), scrollToHeadById("head-abola"), history.replaceState(null, "", "#top")
})), $mainTabs?.addEventListener("click", (e => {
    const t = e.target.closest("button");
    if (!t) return;
    const n = t.dataset.medium;
    if (!n) return;
    state.medium = n, setActiveTab($mainTabs, n), buildSubmenu(n);
    scrollToHeadById({
        digital: "head-digital",
        print: "head-print",
        tv: "head-tv",
        branded: "head-branded",
        condicoes: "head-condicoes"
    } [n]), "digital" === n ? history.replaceState(null, "", `#digital/${state.digitalType}`) : "print" === n ? history.replaceState(null, "", `#print/${state.subtype}`) : "tv" === n ? history.replaceState(null, "", "#" + updateHashTV()) : history.replaceState(null, "", `#${n}`)
}));
const SECTION_TO_MEDIUM = {
        "sec-abola": "abola",
        "sec-digital": "digital",
        "sec-print": "print",
        "sec-tv": "tv",
        "sec-branded": "branded",
        "sec-condicoes": "condicoes"
    },
    SECTIONS = Array.from(document.querySelectorAll(".section")),
    COOLDOWN_MS = 200,
    REF_EXTRA = 12;
let spyCooldown = !1;

function cool(e = COOLDOWN_MS) {
    spyCooldown = !0, setTimeout((() => spyCooldown = !1), e)
}

function pickSectionByRefLine() {
    const e = (mastHeight() || 0) + REF_EXTRA;
    let t = null;
    for (const n of SECTIONS) {
        const o = n.getBoundingClientRect();
        if (o.top <= e && o.bottom > e) {
            t = n;
            break
        }
    }
    if (!t) {
        let n = null;
        for (const t of SECTIONS) {
            const o = Math.abs(t.getBoundingClientRect().top - e);
            (!n || o < n.d) && (n = {
                sec: t,
                d: o
            })
        }
        t = n?.sec || null
    }
    return t
}
let ticking = !1;

function onScrollSpy() {
    spyLocked || spyCooldown || ticking || (ticking = !0, requestAnimationFrame((() => {
        ticking = !1;
        const e = pickSectionByRefLine();
        if (updateBrandVisibility(), !e) return;
        const t = SECTION_TO_MEDIUM[e.id];
        ("top" !== state.medium && !location.hash.startsWith("#top") || "abola" !== t) && t && state.medium !== t && (state.medium = t, "condicoes" === t ? (setActiveTab($mainTabs, null), buildSubmenu("condicoes"), history.replaceState(null, "", "#condicoes")) : (setActiveTab($mainTabs, t), buildSubmenu(t), "digital" === t ? history.replaceState(null, "", `#digital/${state.digitalType}`) : "print" === t ? history.replaceState(null, "", `#print/${state.subtype}`) : "tv" === t ? history.replaceState(null, "", "#" + updateHashTV()) : history.replaceState(null, "", `#${t}`)), cool())
    })))
}

function handleHash() {
    const e = (location.hash || "").replace("#", "").trim();
    if (!e) return state.medium = "abola", setActiveTab($mainTabs, null), void buildSubmenu("abola");
    const t = e.split("/").filter(Boolean),
        n = t[0];
    if ("tv" === n) {
        state.medium = "tv", setActiveTab($mainTabs, "tv"), buildSubmenu("tv");
        const e = parseInt(t[2] || t[1], 10);
        return isNaN(e) || (state.tvDuration = e), state.tvShowAll = t.includes("all"), DATA.TV[0] && renderTVOutside(DATA.TV[0]), lockSpy(900), void scrollToHeadById("head-tv")
    }
    if ("digital" !== n)
        if ("print" !== n)
            if ("branded" !== n) {
                if ("top" === n) return state.medium = "top", setActiveTab($mainTabs, null), buildSubmenu("top"), lockSpy(900), void scrollToHeadById("head-abola");
                if ("abola" !== n) {
                    if ("condicoes" === n) return state.medium = "condicoes", setActiveTab($mainTabs, null), buildSubmenu("condicoes"), lockSpy(900), void scrollToHeadById("head-condicoes");
                    buildSubmenu(state.medium)
                } else if (state.medium = "abola", setActiveTab($mainTabs, null), buildSubmenu("abola"), "item" === t[1] && t[2]) {
                    const e = t[2],
                        n = DATA.ABOLA?.find?.((t => t.id === e));
                    lockSpy(900), scrollToHeadById("head-abola"), n && setTimeout((() => openDrawer(n)), 0)
                } else lockSpy(900), scrollToHeadById("head-abola")
            } else if (state.medium = "branded", setActiveTab($mainTabs, "branded"), buildSubmenu("branded"), renderBrandedSection(), "item" === t[1] && t[2]) {
        const e = t[2],
            n = DATA.BRANDED?.find?.((t => t.id === e));
        lockSpy(900), scrollToHeadById("head-branded"), n && setTimeout((() => openDrawer(n)), 0)
    } else lockSpy(900), scrollToHeadById("head-branded");
    else {
        state.medium = "print";
        const e = t[1];
        if (["all", "capa", "interior", "contracapa"].includes(e) && (state.subtype = e), setActiveTab($mainTabs, "print"), buildSubmenu("print"), setActiveTab(getContextNav(), state.subtype, "data-sub"), renderprintSection(), "item" === t[2] && t[3]) {
            const e = t[3],
                n = DATA.print.find((t => t.id === e));
            lockSpy(900), scrollToHeadById("head-print"), n && setTimeout((() => openDrawer(n)), 0)
        } else lockSpy(900), scrollToHeadById("head-print")
    } else {
        state.medium = "digital";
        const e = t[1];
        if (["all", "display", "rich-media"].includes(e) && (state.digitalType = e), setActiveTab($mainTabs, "digital"), buildSubmenu("digital"), setActiveTab(getContextNav(), state.digitalType, "data-sub"), renderDigitalSection(), "item" === t[2] && t[3]) {
            const e = t[3],
                n = DATA.DIGITAL.find((t => t.id === e));
            lockSpy(900), scrollToHeadById("head-digital"), n && setTimeout((() => openDrawer(n)), 0)
        } else lockSpy(900), scrollToHeadById("head-digital")
    }
}
window.addEventListener("scroll", onScrollSpy, {
    passive: !0
}), window.addEventListener("resize", onScrollSpy), onScrollSpy(), window.addEventListener("hashchange", handleHash), handleHash();
const mqMobile = window.matchMedia("(max-width: 640px)");
mqMobile.addEventListener?.("change", (() => {
        "tv" === state.medium && DATA.TV[0] && renderTVOutside(DATA.TV[0])
    })),
    function() {
        const e = document.querySelector("#head-abola .hero-inner");
        if (!e) return;
        const t = Array.from(e.querySelectorAll(".hero-metrics"));
        if (t.length <= 1) return;
        const n = document.createElement("div");
        n.className = "metrics-rotator", e.insertBefore(n, t[0]);
        let o = 0;
        t.forEach((e => {
            n.appendChild(e), o = Math.max(o, e.offsetHeight || 0)
        })), n.style.setProperty("--rot-h", o + "px"), t.forEach((e => {
            e.classList.add("metrics-slide"), e.setAttribute("aria-hidden", "true")
        }));
        const i = document.createElement("div");
        i.className = "hero-metrics-nav";
        const a = (e, t, n) => {
                const o = document.createElement("button");
                return o.type = "button", o.className = `nav-btn ${e}`, o.setAttribute("aria-label", t), o.innerHTML = n, o
            },
            d = a("prev", "Anterior", '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
            r = a("next", "Seguinte", '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
        i.append(d, r), n.appendChild(i);
        let s = 0,
            l = null,
            c = !1;

        function u(e) {
            t[s].classList.remove("is-active"), t[s].setAttribute("aria-hidden", "true"), s = (e + t.length) % t.length, t[s].classList.add("is-active"), t[s].setAttribute("aria-hidden", "false")
        }

        function m() {
            c || (p(), l = setInterval((() => u(s + 1)), 5e3))
        }

        function p() {
            l && (clearInterval(l), l = null)
        }

        function h() {
            c = !0, p(), u(s + 1)
        }

        function y() {
            c = !0, p(), u(s - 1)
        }
        u(0), d.addEventListener("click", y), r.addEventListener("click", h), n.tabIndex = 0, n.addEventListener("keydown", (e => {
            "ArrowRight" === e.key ? h() : "ArrowLeft" === e.key && y()
        })), n.addEventListener("mouseenter", p), n.addEventListener("mouseleave", (() => {
            c || m()
        }));

        function b() {
            t.forEach((e => e.classList.remove("metrics-slide")));
            const e = Math.max(...t.map((e => e.offsetHeight || 0)));
            n.style.setProperty("--rot-h", (e || o) + "px"), t.forEach((e => e.classList.add("metrics-slide")))
        }
        let v;
        new IntersectionObserver((([e]) => {
            e && e.isIntersecting && !c ? m() : p()
        }), {
            threshold: .2
        }).observe(n), window.addEventListener("resize", (() => {
            cancelAnimationFrame(v), v = requestAnimationFrame(b)
        })), document.fonts && document.fonts.ready && document.fonts.ready.then(b).catch((() => {})), setTimeout(b, 1200)
    }(),
    function() {
        const e = document.getElementById("bcVideo"),
            t = document.getElementById("bcPlay"),
            n = document.getElementById("bcMute");
        if (!e || !t || !n) return;
        const o = () => e.play().catch((() => {}));
        o(), t.addEventListener("click", (() => {
            e.paused ? e.play().catch((() => {})) : e.pause(), t.classList.toggle("is-paused", e.paused)
        })), n.addEventListener("click", (() => {
            e.muted = !e.muted, n.classList.toggle("is-muted", e.muted)
        }));
        new IntersectionObserver((([t]) => {
            t && (t.isIntersecting ? o() : e.pause())
        }), {
            threshold: .25
        }).observe(e)
    }(),
    function() {
        var e = document.documentElement;

        function t() {
            var t = window.visualViewport;
            t ? e.style.setProperty("--vv-top", t.offsetTop + "px") : e.style.setProperty("--vv-top", "0px")
        }
        t(), window.visualViewport && (window.visualViewport.addEventListener("resize", t), window.visualViewport.addEventListener("scroll", t)), window.addEventListener("orientationchange", t), window.addEventListener("pageshow", t)
    }(),
    function() {
        var e = 0;

        function t(t) {
            var n = document.createElement("div");
            n.style.cssText = "position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:2147483647";
            var o = new Image;

            function i() {
                document.removeEventListener("keydown", a), n.remove(), document.body.style.position = "", document.body.style.top = "", document.body.style.left = "", document.body.style.right = "", document.body.style.width = "", window.scrollTo(0, e)
            }

            function a(e) {
                "Escape" === e.key && i()
            }
            o.src = t.currentSrc || t.src, o.style.cssText = "max-width:100vw;max-height:100vh;object-fit:contain", n.appendChild(o), n.addEventListener("click", i), document.addEventListener("keydown", a), document.body.appendChild(n), e = window.pageYOffset || document.documentElement.scrollTop || 0, document.body.style.position = "fixed", document.body.style.top = "-" + e + "px", document.body.style.left = "0", document.body.style.right = "0", document.body.style.width = "100%"
        }
        document.addEventListener("click", (function(e) {
            var n = e.target.closest(".media-box.is-zoomable");
            if (n) {
                var o, i = n.querySelector("video"),
                    a = n.querySelector("img"),
                    d = /iPad|iPhone|iPod/.test(navigator.userAgent),
                    r = !(!(o = n).requestFullscreen && !o.webkitRequestFullscreen);
                if (!d || !i || "function" != typeof i.webkitEnterFullscreen) return d && a && !r ? (e.preventDefault(), e.stopPropagation(), void t(a)) : void 0;
                e.preventDefault(), e.stopPropagation();
                try {
                    i.webkitEnterFullscreen()
                } catch (e) {}
            }
        }), !0)
    }();
    
(function() {
    function e() {
        if (matchMedia("(max-width: 640px)").matches) {
            var e = document.querySelector("#head-abola .metrics-rotator");
            if (e) {
                var t = e.querySelectorAll(".metrics-slide"),
                    n = 0;
                t.forEach(function(e) {
                    var t = e.getAttribute("style") || "";
                    e.style.position = "static";
                    e.style.display = "block";
                    e.style.opacity = "1";
                    e.style.visibility = "visible";
                    var o = e.offsetHeight;
                    if (o > n) n = o;
                    e.setAttribute("style", t);
                });
                if (n > 0) e.style.minHeight = n + "px";
            }
        }
    }
    window.addEventListener("load", e);
    window.addEventListener("resize", e);
    document.addEventListener("DOMContentLoaded", e);
    setTimeout(e, 0);
})();


});