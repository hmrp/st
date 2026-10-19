                          
(function (window, document) {
    "use strict";

    var VALID_USER_TYPES = ["anonymous", "registered", "subscriber"];

    var PAGE_TYPES = ["page", "noticia", "video", "infografia", "fotogaleria"];
    var VERT_CONTENT_RULES = {
        anonymous: {
            maxSlots: 100,
            interval: 5,
            firstSlotAt: 3
        },
        registered: {
            maxSlots: 100,
            interval: 5,
            firstSlotAt: 3
        },
        subscriber: {
            maxSlots: 3,
            interval: 7,
            firstSlotAt: 3
        }
    };
    var DYNAMIC_SLOT_SELECTOR = '[data-publico-ad-placeholder="horz"], [data-publico-ad-placeholder="vert"], [data-publico-ad-placeholder="botao"], [data-publico-ad-placeholder="gallery"]';
    var FOOTER_BLOCK_NOTICIATAG = ["mundial-2026", "leituras", "livros", "explicadores", "primeira-hora", "podcast-no-escuro", "centro-jogo"];
    var OOP_BLOCK = ["mundial-2026", "leituras", "livros", "explicadores", "primeira-hora", "podcast-no-escuro","centro-jogo"];
    var FOOTER_NO_BTN = [3560930581, 3077683810, 3698619285];
    var FOOTER_BTN_DELAY_MS = 300;
    var OOP_CAP_KEY = "intro_cap";
    var OOP_CAP_MS = 180000;
    var OOP_CAP_BYPASS = ["11826917"];
    var OOP_FALLBACK_MS = 800;
    var REWARDED_TIMEOUT_MS = 10000;

    function logError(message, detail) {
        if (window.console && typeof window.console.error === "function") {
            window.console.error("[ads_publico] " + message, detail || "");
        }
        return false;
    }

    function getTagBundleUrl() {
        var hostname = String(window.location.hostname || "")
            .trim()
            .toLowerCase()
            .replace(/\.$/, "");

        if (hostname === "publico.pt" || hostname.endsWith(".publico.pt")) {
            return "https://tagbundle.com/static/" + hostname + "/tagbundle.min.js";
        }

        logError("Host não autorizado para carregamento do TagBundle.", hostname);
        return null;
    }

    function adsAreDisabled(config) {
        return window.hasAds === false || (config && config.showAds === false);
    }

    function checkConfig(config) {
        if (!config || typeof config !== "object") {
            return logError("window.pub não está definido.");
        }

        if (adsAreDisabled(config)) {
            return true;
        }

        if (typeof config.showAds !== "undefined" && typeof config.showAds !== "boolean") {
            return logError("window.pub.showAds tem de ser booleano quando definido.", config.showAds);
        }

        if (VALID_USER_TYPES.indexOf(config.userType) === -1) {
            return logError("window.pub.userType inválido. Valores aceites: anonymous, registered, subscriber.", config.userType);
        }

        if (PAGE_TYPES.indexOf(config.pageType) === -1) {
            return logError("window.pub.pageType inválido. Valores aceites: page, noticia, video, infografia.", config.pageType);
        }

        if (typeof config.adUnit !== "string" || config.adUnit.length === 0) {
            return logError("window.pub.adUnit tem de ser uma string não vazia.", config.adUnit);
        }

        if (!Array.isArray(config.tags)) {
            return logError("window.pub.tags tem de ser um array.", config.tags);
        }

        return true;
    }

    function getAdUnitName(element, defaultName) {
        var overwrite = element && element.getAttribute
            ? element.getAttribute("data-publico-adunit-overwrite")
            : null;
        var segments;

        overwrite = typeof overwrite === "string" ? overwrite.trim() : "";

        if (!overwrite) {
            return defaultName;
        }

        segments = overwrite.split("/");

        if (segments.some(function (segment) {
            segment = segment.trim();
            return !segment || segment === "." || segment === "..";
        })) {
            logError("data-publico-adunit-overwrite contém um caminho relativo inválido.", overwrite);
            return defaultName;
        }

        return segments.map(function (segment) {
            return segment.trim();
        }).join("/");
    }

    function getAdUnitPath(adUnit) {
        var segments = String(adUnit || "").split("/").map(function (segment) {
            return segment.trim();
        }).filter(function (segment) {
            return segment.length > 0;
        });

        if (!segments.length || segments.some(function (segment) {
            return segment === "." || segment === "..";
        })) {
            return null;
        }

        segments[0] = segments[0].charAt(0).toUpperCase() + segments[0].slice(1);

        return segments.join("/");
    }

    function setupHorz(userType, adUnit) {
        Array.prototype.slice.call(document.querySelectorAll("ad-placement.pubHorz")).forEach(function (element, index) {
            if (!element.id) {
                element.id = "pubHorz" + index;
            }

            element.setAttribute("format", "horz");
            element.setAttribute(
                "adunit",
                "Horz_Publico/" + userType + "/" + adUnit + "/" + getAdUnitName(element, index === 0 ? "HorzTop" : "HorzMiddle")
            );
        });
    }

    function suppressListingSidebarVerts(config) {
        if (config.pageType !== "page" ||
            !document.querySelector(".page--listing #ul-listing") ||
            !window.Foundation ||
            !window.Foundation.MediaQuery ||
            typeof window.Foundation.MediaQuery.atLeast !== "function" ||
            window.Foundation.MediaQuery.atLeast("xmedium")) {
            return;
        }

        Array.prototype.slice.call(document.querySelectorAll(
            ".page--listing .page__extras .stack__ads ad-placement.pubVert:not(.BtnFixo)"
        )).forEach(function (element) {
            element.remove();
        });
    }

    function setupVert(userType, adUnit) {
        var verticals = Array.prototype.slice.call(document.querySelectorAll("ad-placement.pubVert:not(.BtnFixo)"));
        var buttons = Array.prototype.slice.call(document.querySelectorAll("ad-placement.pubVert.BtnFixo"));

        verticals.forEach(function (element, index) {
            if (!element.id) {
                element.id = "pubVert" + index;
            }

            element.setAttribute("format", "vert");
            element.setAttribute(
                "adunit",
                "Vert_Publico/" + userType + "/" + adUnit + "/" + getAdUnitName(element, index === 0 ? "VertTop" : "VertMiddle")
            );
        });

        buttons.forEach(function (element, index) {
            if (!element.id) {
                element.id = "Botao" + index;
            }

            element.setAttribute("format", "Botao");
            element.setAttribute("adunit", "Botao_Publico/" + userType + "/" + adUnit + "/" + getAdUnitName(element, "Botao"));
        });
    }

                                                                   
                                                              
                                                              
                                                           
                                                                  
                                                                 
                                                
                                                                      
    var pubAdLayout = (function () {
        var MAX_HEIGHT = 600;
        var STICKY_GAP = 80;
        var states = new WeakMap();
        var tracked = [];

        function targetFor(placement) {
            if (!placement || !placement.closest) return null;
            var wrapper = placement.closest('aside[data-publico-vertcontent="1"]');
            if (wrapper) return { holder: wrapper, placement: placement, kind: 'content' };
            if (placement.matches && placement.matches(
                'ad-placement.pubVert:not(.BtnFixo), ad-placement[format="vert"]:not(.BtnFixo)')) {
                return { holder: placement, placement: placement, kind: 'vert' };
            }
            return null;
        }
        function getState(target) {
            if (!target) return null;
            var state = states.get(target.holder);
            if (state) {
                state.placement = target.placement;
                return state;
            }
            state = {
                holder: target.holder,
                placement: target.placement,
                kind: target.kind,
                held: 0,                                               
                applied: 0,                                                         
                current: 0,
                filled: false,
                phase: 'idle'
            };
            states.set(target.holder, state);
            tracked.push(state);
            target.holder.classList.add('pub-ad-layout');
            target.holder.setAttribute('data-pub-ad-phase', 'idle');
            return state;
        }
        function setPhase(state, phase) {
            if (state.phase === phase) return;
            state.phase = phase;
            state.holder.setAttribute('data-pub-ad-phase', phase);
        }
        function setSticky(state, value) {
            var flag = value ? 'true' : 'false';
            if (state.holder.getAttribute('data-pub-ad-sticky') !== flag) {
                state.holder.setAttribute('data-pub-ad-sticky', flag);
            }
        }
        function setReservedHeight(state, height) {
            height = Math.max(0, Math.ceil(Number(height) || 0));
            if (state.applied === height) return;
            state.applied = height;
            if (height) {
                state.holder.style.setProperty('--pub-ad-min-height', height + 'px');
            } else {
                state.holder.style.removeProperty('--pub-ad-min-height');
            }
        }
        function hold(state, height) {
            height = Math.max(0, Math.ceil(Number(height) || 0));
            if (!height) return;
                                                         
            state.held = Math.max(state.held, Math.min(MAX_HEIGHT, height));
                                                                           
                                                                        
            setReservedHeight(state, Math.max(state.held, height));
        }
        function forContent(wrapper) {
            if (!wrapper) return null;
            return getState({
                holder: wrapper,
                placement: wrapper.querySelector('ad-placement[format="vertContent"]'),
                kind: 'content'
            });
        }
        function requested(placement) {
            var state = getState(targetFor(placement));
            if (!state) return;
                                                                        
                                                                        
            setPhase(state, 'requested');
        }
        function rendered(placement, event) {
            var state = getState(targetFor(placement));
            if (!state || !event) return;

            if (event.isEmpty) {
                state.current = 0;
                setSticky(state, false);
                if (!state.filled) {
                                                                          
                    state.held = 0;
                    setReservedHeight(state, 0);
                    setPhase(state, 'idle');
                } else {
                                                                                      
                    setReservedHeight(state, state.held);
                    setPhase(state, 'empty-held');
                }
                return;
            }

            state.filled = true;
            setPhase(state, 'filled');
            var size = event.size;
            var rawHeight = Array.isArray(size) ? Number(size[1]) : 0;
            if (rawHeight > 1 && isFinite(rawHeight)) {
                                                                  
                                                                         
                                                                        
                state.current = rawHeight;
                hold(state, rawHeight);
                setSticky(state, state.applied - rawHeight >= STICKY_GAP);
            } else {
                                                                       
                                                                              
                state.current = 0;
                setSticky(state, false);
            }
        }
        function videoRequested(wrapper) {
            var state = forContent(wrapper);
            if (state) setPhase(state, 'video');
        }
        function videoVisible(wrapper) {
            var state = forContent(wrapper);
            if (!state) return;
            state.filled = true;
            setPhase(state, 'video');
                                                                        
            var stage = wrapper.querySelector('.pub-vcv-stage');
            if (stage) hold(state, stage.getBoundingClientRect().height);
        }
        function inspect() {
            var output = tracked.filter(function (state) { return state.holder.isConnected; })
                .map(function (state) {
                    return {
                        id: state.placement && state.placement.id || 'video',
                        kind: state.kind,
                        phase: state.phase,
                        heldHeightPx: state.held,
                        reservedHeightPx: state.applied,
                        currentCreativePx: state.current,
                        sticky: state.holder.getAttribute('data-pub-ad-sticky') === 'true',
                        renderedHeightPx: Math.ceil(state.holder.getBoundingClientRect().height)
                    };
                });
            console.table(output);
            return output;
        }
        return {
            registerContent: forContent,
            requested: requested,
            rendered: rendered,
            videoRequested: videoRequested,
            videoVisible: videoVisible,
            inspect: inspect
        };
    })();
    window.PubAdLayout = pubAdLayout;

                                                                          
                                                                          
                                                                    
    var publicoAdsScriptUrl = document.currentScript && document.currentScript.src || null;
    var vertVideoModulePromise = null;
    function loadVertVideoModule() {
        if (window.VertInContentRequest && typeof window.VertInContentRequest.mount === "function") {
            return Promise.resolve(window.VertInContentRequest);
        }
        if (vertVideoModulePromise) return vertVideoModulePromise;
        vertVideoModulePromise = new Promise(function (resolve, reject) {
            var script = document.createElement("script");
            if (!publicoAdsScriptUrl) {
                reject(new Error("Não foi possível identificar o endereço de ads_publico.js"));
                return;
            }
            script.src = new URL("video/inc/inc.js?v=20261019-media-controls-v11", publicoAdsScriptUrl).href;
            script.async = true;
            script.onload = function () {
                if (window.VertInContentRequest && typeof window.VertInContentRequest.mount === "function") {
                    resolve(window.VertInContentRequest);
                } else {
                    reject(new Error("Módulo VertInContentRequest não foi disponibilizado"));
                }
            };
            script.onerror = function () { reject(new Error("Falha ao carregar inc.js")); };
            document.head.appendChild(script);
        }).catch(function (error) {
            vertVideoModulePromise = null;
            throw error;
        });
        return vertVideoModulePromise;
    }

    function scheduleVertVideo(wrapper, placement, targeting) {
        var started = false;
        var observer = null;
                                                                 
        wrapper.setAttribute("data-publico-vcv-reserved", "0");

        function fallback(reason) {
            if (!wrapper.isConnected || wrapper.getAttribute("data-publico-video-result") === "display") return;
            wrapper.replaceChildren(placement);
                                                                       
                                                                   
            wrapper.removeAttribute("data-publico-vcv-reserved");
            wrapper.removeAttribute("data-publico-vertcontent-video");
            wrapper.setAttribute("data-publico-video-result", "display");
            wrapper.setAttribute("data-publico-video-fallback-reason", String(reason));
            document.dispatchEvent(new CustomEvent("publico:vertcontent-display-ready", {
                detail: { placement: placement, wrapper: wrapper, reason: reason }
            }));
        }
        function start() {
            if (started || !wrapper.isConnected) return;
            started = true;
            if (observer) { observer.disconnect(); observer = null; }
            loadVertVideoModule().then(function (module) {
                if (!wrapper.isConnected) return;
                try {
                    if (!module.mount(wrapper, placement, {
                        targeting: targeting,
                        startImmediately: true
                    })) fallback("player-ineligible");
                } catch (error) {
                    logError("Não foi possível iniciar o Incontent; usar display", error);
                    fallback("player-mount-error");
                }
            }).catch(function (error) {
                logError("Erro ao carregar o módulo Incontent", error);
                fallback("player-module-error");
            });
        }
        if (window.IntersectionObserver) {
                                                                                 
                                                                             
                                                                           
                                                                           
                                                                           
                                                                        
            var mobileVideo = window.matchMedia && window.matchMedia("(max-width: 767px)").matches;
            var expectedPlayerHeight = mobileVideo ? 300 : 389;
            var minVisiblePx = Math.ceil(expectedPlayerHeight * 0.50);
            observer = new IntersectionObserver(function (entries) {
                if (entries.some(function (entry) { return entry.isIntersecting; })) start();
            }, { rootMargin: "0px 0px -" + minVisiblePx + "px 0px", threshold: 0 });
            observer.observe(wrapper);
        } else {
                                                                  
            window.setTimeout(start, 0);
        }
        return true;
    }

    function createVertContent(index, userType, adUnit, targeting) {
        var wrapper = document.createElement("aside");
        var placement = document.createElement("ad-placement");

        wrapper.className = "ad-slot ad-slot--in-content";
        wrapper.setAttribute("data-publico-vertcontent", "1");
        pubAdLayout.registerContent(wrapper);

        placement.id = "VertContent" + index;
        placement.setAttribute("format", "vertContent");
        placement.setAttribute("adunit", "Vert_Publico/" + userType + "/" + adUnit + "/VertContent");

                                                                           
                                                                                 
        if (index === 0 && window.pub && window.pub.pageType === "noticia" &&
                !adsAreDisabled(window.pub) &&
                !(window.VertInContentRequest && window.VertInContentRequest.enabled === false) &&
                targeting && typeof targeting === "object") {
            scheduleVertVideo(wrapper, placement, targeting);
            return wrapper;
        }

        wrapper.appendChild(placement);
        return wrapper;
    }

    function insertVertContent(userType, adUnit, config) {
        var storyBody = document.querySelector("#story-body");
        var nodes;
        var rules = VERT_CONTENT_RULES[config.userType];
        var isMobile = window.matchMedia && window.matchMedia("only screen and (max-width: 767px)").matches;
        var maxSlots = rules.maxSlots;
        var interval = rules.interval;
        var firstSlotAt = rules.firstSlotAt;
        var iCount = 1;
        var slotCount = 0;
        var firstSlotFilled = false;

        if (!storyBody) {
            return 0;
        }

        if (storyBody.querySelector('aside[data-publico-vertcontent="1"]')) {
            return storyBody.querySelectorAll('aside[data-publico-vertcontent="1"]').length;
        }

        nodes = Array.prototype.slice.call(storyBody.childNodes);

        nodes.forEach(function (element) {
            var nodeName;

            if (!element || element.nodeType !== 1 || slotCount >= maxSlots) {
                return;
            }

            nodeName = element.nodeName;

            if (nodeName === "P" || nodeName === "FIGURE") {
                iCount += 1;
            }

            if (nodeName === "ASIDE" && (isMobile || !element.classList.contains("show-for-small"))) {
                iCount = element.classList.contains("ad-slot") ? 1 : iCount + 1;
            }

            if (iCount === interval || (iCount === firstSlotAt && !firstSlotFilled)) {
                element.insertAdjacentElement("afterend", createVertContent(slotCount, userType, adUnit, config.runtime.tagBundleConfig.targeting));
                iCount = 1;
                slotCount += 1;
                firstSlotFilled = true;
            }
        });

        return slotCount;
    }

    function insertLockedVertContent(userType, adUnit, runtime) {
        var storyBody = document.querySelector("#story-body");
        var pwContainer;
        var placement;
        var isMobile;

        if (!storyBody) {
            return 0;
        }

        if (storyBody.querySelector('aside[data-publico-vertcontent="1"]')) {
            return storyBody.querySelectorAll('aside[data-publico-vertcontent="1"]').length;
        }

        pwContainer = storyBody.querySelector(".pw-container");

        if (!pwContainer) {
            return 0;
        }

        isMobile = window.matchMedia && window.matchMedia("only screen and (max-width: 767px)").matches;
        placement = createVertContent(0, userType, adUnit, runtime.tagBundleConfig.targeting);
        pwContainer.insertAdjacentElement(isMobile ? "beforebegin" : "afterend", placement);

        return 1;
    }

    function initVertContent(config, userType, adUnit, runtime) {
        var isPwEnable;
        var pwContainer;

        if (config.pageType !== "noticia" || !document.querySelector("#story-body")) {
            return;
        }

        runtime.vertContent = runtime.vertContent || {
            state: "pending",
            count: 0,
            listenerInstalled: false,
            lockedObserver: null
        };

        function disconnectLockedObserver() {
            if (runtime.vertContent.lockedObserver) {
                runtime.vertContent.lockedObserver.disconnect();
                runtime.vertContent.lockedObserver = null;
            }
        }

        function setLocked() {
            if (runtime.vertContent.state !== "pending") {
                return;
            }

            disconnectLockedObserver();
            runtime.vertContent.state = "locked";
            runtime.vertContent.count = insertLockedVertContent(userType, adUnit, runtime);
        }

        isPwEnable = window.publicoConfig && typeof window.publicoConfig.isPwEnable === "boolean"
            ? window.publicoConfig.isPwEnable
            : null;

        if (config.userType !== "subscriber" &&
            config.contentAccess === "open" &&
            isPwEnable === true &&
            window.publicoConfig &&
            window.publicoConfig.isExclusivo === true) {
            pwContainer = document.querySelector("#story-body > .pw-container");
            if (pwContainer &&
                pwContainer.previousElementSibling &&
                pwContainer.previousElementSibling.tagName === "P" &&
                document.querySelectorAll("#story-body > p").length === 1) {
                setLocked();
                return;
            }
        }

        if (config.userType === "subscriber" || config.contentAccess === "open") {
            if (runtime.vertContent.state === "pending") {
                runtime.vertContent.state = "open";
                runtime.vertContent.count = insertVertContent(userType, adUnit, config);
            }
            return;
        }

        if (isPwEnable === null) {
            runtime.vertContent.state = "unknown";
            return;
        }

        if (isPwEnable === false) {
            if (runtime.vertContent.state === "pending") {
                runtime.vertContent.state = "open";
                runtime.vertContent.count = insertVertContent(userType, adUnit, config);
            }
            return;
        }

        pwContainer = document.querySelector("#story-body .pw-container");

        if ((window.Publico && window.Publico.BodyIsClean === true) ||
            (pwContainer && pwContainer.querySelector(".decider-inline"))) {
            setLocked();
            return;
        }

        if (!runtime.vertContent.listenerInstalled) {
            runtime.vertContent.listenerInstalled = true;

            document.addEventListener("ea.openedByMetered", function () {
                if (runtime.vertContent.state !== "pending") {
                    return;
                }

                disconnectLockedObserver();
                runtime.vertContent.state = "open";
                runtime.vertContent.count = insertVertContent(userType, adUnit, config);
            }, { once: true });

            document.addEventListener("clean.done", function () {
                setLocked();
            }, { once: true });

            if (pwContainer && typeof window.MutationObserver === "function") {
                runtime.vertContent.lockedObserver = new window.MutationObserver(function () {
                    if (runtime.vertContent.state !== "pending") {
                        disconnectLockedObserver();
                        return;
                    }

                    if (pwContainer.querySelector(".decider-inline")) {
                        setLocked();
                    }
                });

                runtime.vertContent.lockedObserver.observe(pwContainer, {
                    childList: true,
                    subtree: true
                });

                if (pwContainer.querySelector(".decider-inline")) {
                    setLocked();
                }
            }
        }
    }

    function isTagBlocked(config, blockedTags) {
        return config.tags.some(function (tag) {
            return blockedTags.indexOf(tag) !== -1;
        });
    }

    function clearOOPCap() {
        try {
            if (window.localStorage) {
                window.localStorage.removeItem(OOP_CAP_KEY);
            }
        } catch (e) {
        }
    }

    function setOOPCap() {
        try {
            if (window.localStorage) {
                window.localStorage.setItem(OOP_CAP_KEY, String(Date.now() + OOP_CAP_MS));
            }
        } catch (e) {
        }
    }

    function hasOOPCap() {
        var capUntil = 0;

        try {
            capUntil = parseInt(
                window.localStorage ? window.localStorage.getItem(OOP_CAP_KEY) : null,
                10
            ) || 0;
        } catch (e) {
            capUntil = 0;
        }

        if (!capUntil) {
            return false;
        }

        if (Date.now() >= capUntil) {
            clearOOPCap();
            return false;
        }

        return true;
    }

    function canInitOOP(config) {
        if (!config || adsAreDisabled(config)) {
            return false;
        }

        if (isTagBlocked(config, OOP_BLOCK)) {
            return false;
        }

        if (new URLSearchParams(window.location.search).has("google_preview")) {
            return true;
        }

        if (config.userType === "subscriber") {
            return false;
        }

        return !hasOOPCap();
    }

    function initOOP(config, userType, adUnit, runtime) {
        var oop;

        runtime.oop = runtime.oop || {
            enabled: false,
            blocked: false,
            oopResolved: false,
            slot: null,
            rewardedInit: false,
            rewardedReady: false,
            rewardedTimedOut: false,
            rewardedVisible: false,
            interstitialInit: false,
            state: "idle"
        };

        if (!canInitOOP(config)) {
            runtime.oop.blocked = isTagBlocked(config, OOP_BLOCK);

            if (config.userType === "subscriber") {
                runtime.oop.state = "subscriber";
            } else if (runtime.oop.blocked) {
                runtime.oop.state = "blocked";
            } else {
                runtime.oop.state = "capped";
            }

            return;
        }

        if (document.getElementById("oop")) {
            return logError("Já existe um elemento #oop antes da criação dinâmica do OOP.");
        }

        oop = document.createElement("ad-placement");
        oop.id = "oop";
        oop.className = "oop";
        oop.setAttribute("format", "outOfPage");
        oop.setAttribute("adunit", "OOP_Publico/" + userType + "/" + adUnit + "/OOP");

        document.body.insertAdjacentElement("afterbegin", oop);

        runtime.oop.enabled = true;
        runtime.oop.state = "oop-pending";
        trackOOPFrameUrls(runtime);
    }

    function initInterstitial(config, userType, adUnit, runtime) {
        var oop = runtime.oop;

        if (!oop || oop.interstitialInit || config.pageType !== "noticia" || !canInitOOP(config)) {
            return;
        }

        oop.interstitialInit = true;

        window.googletag.cmd.push(function () {
            var slot;

            if (config.pageType !== "noticia" || !canInitOOP(config)) {
                return;
            }

            if (typeof window.googletag.defineOutOfPageSlot !== "function" ||
                !window.googletag.enums ||
                !window.googletag.enums.OutOfPageFormat ||
                !window.googletag.enums.OutOfPageFormat.INTERSTITIAL) {
                oop.state = "interstitial-unsupported";
                return;
            }

            slot = window.googletag.defineOutOfPageSlot(
                "/4458504/Interstitial_Publico/" + userType + "/" + adUnit + "/Interstitial",
                window.googletag.enums.OutOfPageFormat.INTERSTITIAL
            );

            if (!slot) {
                oop.state = "interstitial-unavailable";
                return;
            }

            oop.state = "interstitial";
            setOOPCap();

            if (typeof slot.setConfig === "function") {
                slot.setConfig({
                    interstitial: {
                        requireStorageAccess: true,
                        triggers: {
                            navBar: true,
                            unhideWindow: true,
                            inactivity: true,
                            endOfArticle: true
                        }
                    }
                });
            }

            slot.addService(window.googletag.pubads());
            window.googletag.display(slot);

            if (window.googletag.pubads && typeof window.googletag.pubads().refresh === "function") {
                window.googletag.pubads().refresh([slot]);
            }
        });
    }

    function initRewarded(config, userType, adUnit, runtime) {
        var oop = runtime.oop;

        if (!oop || oop.rewardedInit || config.pageType !== "noticia" || !canInitOOP(config)) {
            return;
        }

        oop.rewardedInit = true;
        oop.state = "rewarded-pending";

        window.googletag.cmd.push(function () {
            var rewardedSlot;

            if (config.pageType !== "noticia" || !canInitOOP(config)) {
                return;
            }

            if (typeof window.googletag.defineOutOfPageSlot !== "function" ||
                !window.googletag.enums ||
                !window.googletag.enums.OutOfPageFormat ||
                !window.googletag.enums.OutOfPageFormat.REWARDED) {
                initInterstitial(config, userType, adUnit, runtime);
                return;
            }

            rewardedSlot = window.googletag.defineOutOfPageSlot(
                "/4458504/Rewarded_Publico/" + userType + "/" + adUnit + "/Rewarded",
                window.googletag.enums.OutOfPageFormat.REWARDED
            );

            if (!rewardedSlot) {
                initInterstitial(config, userType, adUnit, runtime);
                return;
            }

            rewardedSlot.addService(window.googletag.pubads());

            window.googletag.pubads().addEventListener("rewardedSlotReady", function (event) {
                if (event.slot !== rewardedSlot || oop.rewardedTimedOut) {
                    return;
                }

                oop.rewardedReady = true;

                if (oop.rewardedVisible || typeof event.makeRewardedVisible !== "function") {
                    return;
                }

                oop.rewardedVisible = true;
                oop.state = "rewarded";
                setOOPCap();
                event.makeRewardedVisible();
            });

            window.googletag.pubads().addEventListener("rewardedSlotClosed", function (event) {
                if (event.slot !== rewardedSlot) {
                    return;
                }

                if (window.googletag && typeof window.googletag.destroySlots === "function") {
                    window.googletag.destroySlots([rewardedSlot]);
                }
            });

            window.googletag.display(rewardedSlot);

            if (window.googletag.pubads && typeof window.googletag.pubads().refresh === "function") {
                window.googletag.pubads().refresh([rewardedSlot]);
            }

            window.setTimeout(function () {
                if (oop.rewardedReady) {
                    return;
                }

                if (config.pageType !== "noticia" || !canInitOOP(config)) {
                    return;
                }

                oop.rewardedTimedOut = true;
                if (window.googletag && typeof window.googletag.destroySlots === "function") {
                    window.googletag.destroySlots([rewardedSlot]);
                }
                initInterstitial(config, userType, adUnit, runtime);
            }, REWARDED_TIMEOUT_MS);
        });
    }

    function onOOPRender(event, config, userType, adUnit, runtime) {
        var oop = runtime.oop;
        var templateId;

        if (!oop || !oop.enabled || oop.oopResolved) {
            return;
        }

        oop.oopResolved = true;
        oop.slot = event.slot;

        if (!event.isEmpty) {
            templateId = getTemplateId(event);

            if (templateId && OOP_CAP_BYPASS.indexOf(templateId) !== -1) {
                clearOOPCap();
                oop.state = "oop-bypass";
                return;
            }

            setOOPCap();
            oop.state = "oop";
            return;
        }

        oop.state = "oop-empty";
        window.setTimeout(function () {
            if (config.pageType !== "noticia" || !canInitOOP(config)) {
                return;
            }

            initRewarded(config, userType, adUnit, runtime);
        }, OOP_FALLBACK_MS);
    }

    function getHeavyAdFrameDetails(report) {
        var message = report && report.body && typeof report.body.message === "string"
            ? report.body.message
            : "";
        var match = message.match(/\(id=([^;)]*);url=([^)]*)\)/);

        return {
            id: match && match[1] ? match[1].trim() : null,
            url: match && match[2] ? match[2].trim() : null
        };
    }

    function getHeavyAdFrameUrl(report) {
        return getHeavyAdFrameDetails(report).url;
    }

    function normalizeHeavyAdUrl(url) {
        var parsed;

        if (typeof url !== "string" || !url.trim()) {
            return null;
        }

        try {
            parsed = new URL(url, window.location.href);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                return null;
            }
            parsed.hash = "";
            return parsed.href;
        } catch (e) {
            return null;
        }
    }

    function trackOOPFrameUrls(runtime) {
        var oop = runtime.oop;
        var element = document.getElementById("oop");

        if (!oop || !element || oop.frameObserver) {
            return;
        }

        oop.frameUrls = oop.frameUrls || [];

        function rememberUrl(value) {
            var url = normalizeHeavyAdUrl(value);

            if (url && oop.frameUrls.indexOf(url) === -1) {
                oop.frameUrls.push(url);
            }
        }

        function collectFrameUrls() {
            Array.prototype.slice.call(element.querySelectorAll("iframe")).forEach(function (frame) {
                rememberUrl(frame.getAttribute("src"));
                rememberUrl(frame.getAttribute("data-src"));
            });
        }

        collectFrameUrls();

        if (typeof window.MutationObserver === "function") {
            oop.frameObserver = new window.MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === "attributes") {
                        rememberUrl(mutation.oldValue);
                    }
                });
                collectFrameUrls();
            });
            oop.frameObserver.observe(element, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["src", "data-src"],
                attributeOldValue: true
            });
        }
    }

    function heavyAdCoversViewport(element) {
        var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        var rect;

        if (!element || !viewportWidth || !viewportHeight ||
            typeof element.getBoundingClientRect !== "function") {
            return false;
        }

        rect = element.getBoundingClientRect();
        return rect.width >= viewportWidth * 0.75 &&
            rect.height >= viewportHeight * 0.75;
    }

    function isOOPFullscreen(element) {
        var frames;
        var i;

        if (!element) {
            return false;
        }

        if (heavyAdCoversViewport(element)) {
            return true;
        }

        frames = element.querySelectorAll("iframe");

        for (i = 0; i < frames.length; i++) {
            if (heavyAdCoversViewport(frames[i])) {
                return true;
            }
        }

        return false;
    }

    function findHeavyAdIframe(details) {
        var frames = document.querySelectorAll("iframe");
        var matches = [];
        var url = normalizeHeavyAdUrl(details.url);
        var i;
        var frame;

        if (details.id) {
            for (i = 0; i < frames.length; i++) {
                frame = frames[i];
                if (frame.id === details.id || frame.name === details.id) {
                    matches.push(frame);
                }
            }

            if (matches.length === 1) {
                return { frame: matches[0], byId: true };
            }
            if (matches.length > 1) {
                return null;
            }
        }

        if (!url) {
            return null;
        }

        for (i = 0; i < frames.length; i++) {
            frame = frames[i];
            if (normalizeHeavyAdUrl(frame.getAttribute("src")) === url ||
                normalizeHeavyAdUrl(frame.getAttribute("data-src")) === url) {
                matches.push(frame);
            }
        }

        return matches.length === 1 ? { frame: matches[0], byId: false } : null;
    }

    function isHeavyAdForOOP(report, element, runtime, locatedFrame) {
        var oop = runtime.oop;
        var frameUrl = normalizeHeavyAdUrl(getHeavyAdFrameUrl(report));
        var reportUrl = normalizeHeavyAdUrl(report && report.url);
        var pageUrl = normalizeHeavyAdUrl(window.location.href);
        var candidateUrls = [];
        var knownUrls = oop && oop.frameUrls ? oop.frameUrls : [];
        var frames;
        var i;
        var frame;
        var frameSrc;
        var frameDataSrc;
        var matchedOOP = false;
        var matchedOther = false;

        if (!element || !oop) {
            return false;
        }

        if (locatedFrame && locatedFrame.frame) {
            return element.contains(locatedFrame.frame);
        }

        if (frameUrl) {
            candidateUrls.push(frameUrl);
        }

        if (reportUrl && reportUrl !== pageUrl && candidateUrls.indexOf(reportUrl) === -1) {
            candidateUrls.push(reportUrl);
        }

        for (i = 0; i < candidateUrls.length; i++) {
            if (knownUrls.indexOf(candidateUrls[i]) !== -1) {
                matchedOOP = true;
                break;
            }
        }

        if (candidateUrls.length) {
            frames = document.querySelectorAll("iframe");

            for (i = 0; i < frames.length; i++) {
                frame = frames[i];
                frameSrc = normalizeHeavyAdUrl(frame.getAttribute("src"));
                frameDataSrc = normalizeHeavyAdUrl(frame.getAttribute("data-src"));

                if (candidateUrls.indexOf(frameSrc) === -1 &&
                    candidateUrls.indexOf(frameDataSrc) === -1) {
                    continue;
                }

                if (element.contains(frame)) {
                    matchedOOP = true;
                } else {
                    matchedOther = true;
                }
            }
        }

        if (matchedOther) {
            return false;
        }

        if (matchedOOP) {
            return true;
        }

        return !getHeavyAdFrameDetails(report).id &&
            (oop.state === "oop" || oop.state === "oop-bypass") &&
            isOOPFullscreen(element);
    }

    function removeHeavyOOP(runtime) {
        var oop = runtime.oop;
        var element = document.getElementById("oop");

        if (!oop || !element) {
            return false;
        }

        if (oop.frameObserver) {
            oop.frameObserver.disconnect();
            oop.frameObserver = null;
        }

        if (oop.slot && window.googletag && typeof window.googletag.destroySlots === "function") {
            window.googletag.destroySlots([oop.slot]);
        }

        element.remove();
        oop.enabled = false;
        oop.slot = null;
        oop.state = "oop-heavy-ad-blocked";
        return true;
    }

    function removeExternalHeavyOOP(locatedFrame, runtime) {
        var frame = locatedFrame && locatedFrame.frame;
        var placement;
        var candidate;
        var parent;
        var computed;
        var depth;
        var slot;

        if (!frame || !locatedFrame.byId || !frame.isConnected) {
            return null;
        }

        placement = typeof frame.closest === "function"
            ? frame.closest('ad-placement[adunit*="OOP_Publico/"]')
            : null;

        if (placement) {
            if (placement.id === "oop" && removeHeavyOOP(runtime)) {
                return "oop-removed";
            }

            if (window.googletag && window.googletag.pubads &&
                typeof window.googletag.pubads === "function" &&
                typeof window.googletag.destroySlots === "function") {
                window.googletag.pubads().getSlots().forEach(function (item) {
                    if (typeof item.getSlotElementId === "function" &&
                        item.getSlotElementId() === placement.id &&
                        typeof item.getAdUnitPath === "function" &&
                        item.getAdUnitPath().indexOf("/OOP_Publico/") !== -1) {
                        slot = item;
                    }
                });
                if (slot) {
                    window.googletag.destroySlots([slot]);
                }
            }

            placement.remove();
            return "external-oop-placement-removed";
        }

        if (typeof frame.closest === "function" && frame.closest("ad-placement")) {
            return null;
        }

        candidate = null;
        parent = frame.parentElement;

        for (depth = 0; depth < 5 && parent && parent !== document.body &&
            parent !== document.documentElement; depth++) {
            if (heavyAdCoversViewport(parent) &&
                parent.querySelectorAll("iframe").length === 1 &&
                !parent.querySelector("main, article, header, nav, footer, form, ad-placement") &&
                String(parent.textContent || "").trim().length <= 120) {
                computed = window.getComputedStyle ? window.getComputedStyle(parent) : null;
                if (computed && (computed.position === "fixed" || computed.position === "absolute")) {
                    candidate = parent;
                }
            }
            parent = parent.parentElement;
        }

        if (!candidate && !heavyAdCoversViewport(frame)) {
            return null;
        }

        (candidate || frame).remove();
        return candidate ? "external-fullscreen-overlay-removed" : "external-fullscreen-iframe-removed";
    }

    function initHeavyAdObserver(runtime) {
        if (runtime.heavyAdObserverInitialized || typeof window.ReportingObserver !== "function") {
            return;
        }

        runtime.heavyAdObserverInitialized = true;
        runtime.heavyAdReports = runtime.heavyAdReports || [];
        runtime.heavyAdObserver = new window.ReportingObserver(function (reports) {
            reports.forEach(function (report) {
                var body = report && report.body;
                var oop = runtime.oop;
                var details;
                var located;
                var element;
                var matched;
                var entry;

                if (!body || body.id !== "HeavyAdIntervention") {
                    return;
                }

                details = getHeavyAdFrameDetails(report);
                located = findHeavyAdIframe(details);
                element = document.getElementById("oop");
                matched = !!(oop && oop.enabled && element &&
                    oop.state !== "oop-empty" && oop.state !== "oop-heavy-ad-blocked" &&
                    isHeavyAdForOOP(report, element, runtime, located));

                entry = {
                    message: body.message || "",
                    frameId: details.id,
                    frameUrl: details.url,
                    reportUrl: report.url || null,
                    state: oop ? oop.state : null,
                    matchedOOP: matched,
                    action: "none"
                };

                runtime.heavyAdReports.push(entry);
                if (runtime.heavyAdReports.length > 20) {
                    runtime.heavyAdReports.shift();
                }
                if (oop) {
                    oop.lastHeavyAdReport = entry;
                }

                if (/A future version of Chrome may remove this ad/i.test(entry.message)) {
                    entry.action = "warning-only";
                    return;
                }

                if (matched && removeHeavyOOP(runtime)) {
                    entry.action = "oop-removed";
                    return;
                }

                entry.action = removeExternalHeavyOOP(located, runtime) || "no-safe-match";
            });
        }, {
            types: ["intervention"],
            buffered: true
        });

        runtime.heavyAdObserver.observe();
    }

    function initFooter(config, userType, adUnit, runtime) {
        var footer;

        runtime.footer = runtime.footer || {
            enabled: false,
            blocked: false,
            specialNoRefresh: false
        };

        if (config.pageType !== "noticia") {
            return;
        }

        if (config.userType === "subscriber") {
            return;
        }

        if (window.publicoConfig && window.publicoConfig.isExclusivo === true) {
            return;
        }

        if (isTagBlocked(config, FOOTER_BLOCK_NOTICIATAG)) {
            runtime.footer.blocked = true;
            return;
        }

        if (document.getElementById("Footer")) {
            logError("Já existe um elemento #Footer antes da criação dinâmica do Footer.");
            return;
        }

        footer = document.createElement("ad-placement");
        footer.id = "Footer";
        footer.className = "tagbundle-footer-sticky";
        footer.setAttribute("format", "stickyBottom");
        footer.setAttribute("adunit", "Footer_Publico/" + userType + "/" + adUnit + "/Footer");
        document.body.appendChild(footer);

        runtime.footer.enabled = true;
        runtime.footer.blocked = false;
    }

    function getFooterWrapper() {
        var footer = document.getElementById("Footer");

        if (!footer || typeof footer.closest !== "function") {
            return null;
        }

        return footer.closest(".TagBundleStickyBottom");
    }

    function getTemplateId(event) {
        var response = null;
        var templateId = null;

        if (event && typeof event.creativeTemplateId !== "undefined" && event.creativeTemplateId !== null) {
            templateId = event.creativeTemplateId;
        }

        if (!templateId && event && event.slot && typeof event.slot.getResponseInformation === "function") {
            response = event.slot.getResponseInformation();

            if (response && typeof response.creativeTemplateId !== "undefined" && response.creativeTemplateId !== null) {
                templateId = response.creativeTemplateId;
            }
        }

        return templateId ? String(templateId) : null;
    }

    function getCampaignId(event) {
        var response = event && event.slot && typeof event.slot.getResponseInformation === "function"
            ? event.slot.getResponseInformation()
            : null;
        var id = event && event.campaignId ? event.campaignId : response && response.campaignId;

        return id ? Number(id) : null;
    }

    function getSlotElement(slotId) {
        var element = document.getElementById(slotId);

        if (element) {
            return element;
        }

        return Array.prototype.slice.call(document.querySelectorAll("[data-id]")).find(function (item) {
            return item.getAttribute("data-id") === slotId;
        }) || null;
    }

    function setVertContentVisibility(event, element) {
                                                                                
                                                                              
        if (element) pubAdLayout.rendered(element, event);
    }

    function resetFooterBtn(runtime) {
        var wrapper = getFooterWrapper();

        if (runtime.footerBtnTimer) {
            window.clearTimeout(runtime.footerBtnTimer);
            runtime.footerBtnTimer = null;
        }

        if (wrapper) {
            wrapper.classList.remove("footer-close-ready");
        }
    }

    function hideFooterBtn(runtime) {
        var wrapper = getFooterWrapper();

        resetFooterBtn(runtime);

        if (wrapper) {
            wrapper.classList.add("footer-special-hidden");
        }
    }

    function showFooterBtn(runtime) {
        var wrapper = getFooterWrapper();

        resetFooterBtn(runtime);

        if (!wrapper) {
            return;
        }

        wrapper.classList.remove("footer-special-hidden");

        runtime.footerBtnTimer = window.setTimeout(function () {
            var currentWrapper = getFooterWrapper();

            if (currentWrapper && !currentWrapper.classList.contains("footer-special-hidden")) {
                currentWrapper.classList.add("footer-close-ready");
            }
        }, FOOTER_BTN_DELAY_MS);
    }

    function getTagBundleConfig(config, userType) {
        var href = String(window.location.href || "");
        var queryIndex = href.indexOf("?");
        var fEnd = queryIndex !== -1
            ? encodeURI(href.slice(queryIndex + 1).split("#")[0])
            : "";
        var targeting = {
            user: [userType],
            noticiaTag: config.tags
        };

        if (fEnd) {
            targeting.end = [fEnd];
        }

        targeting.exclusivo = [
            window.publicoConfig && window.publicoConfig.isExclusivo === true ? "sim" : "nao"
        ];

        if (config.pageType === "noticia" &&
            window.publicoConfig &&
            (typeof window.publicoConfig.pageArticleId === "string" ||
                typeof window.publicoConfig.pageArticleId === "number") &&
            String(window.publicoConfig.pageArticleId).length > 0) {
            targeting.id = [String(window.publicoConfig.pageArticleId)];
        }

        return {
            clientId: 4458504,
            autoRefresh: {
                enabled: true,
                interval: 30
            },
            renderMargin: 150,
            refreshThreshold: 0.5,
            stickyBottomThreshold: 0,
            sizes: {
                desktop: 980,
                tablet: 481,
                mobile: 0
            },
            formats: {
                horz: {
                    desktop: [[1, 1], [728, 90], [970, 250], [970, 90], [1140, 220], [1140, 90], [1140, 120], "fluid"],
                    tablet: [[1, 1], [728, 90], [970, 90], [1140, 120], "fluid"],
                    mobile: [[1, 1], [300, 50], [300, 75], [320, 100], [300, 100], [300, 250], [300, 300], [300, 120], "fluid"]
                },
                vert: {
                    desktop: [[1, 1], [300, 250], [300, 600], [300, 200], [120, 600], "fluid"],
                    tablet: [[1, 1], [300, 250], [300, 600], [300, 200], [120, 600], "fluid"],
                    mobile: [[1, 1], [300, 250], [300, 600], [300, 200], [120, 600], "fluid"]
                },
                gallery: {
                    desktop: [[1, 1], [300, 250], [300, 600]],
                    tablet: [[1, 1], [300, 250], [300, 600]],
                    mobile: [[1, 1], [300, 250], [300, 600]]
                },
                vertContent: {
                    desktop: [[1, 1], [300, 250], [300, 600], [300, 200], "fluid"],
                    tablet: [[1, 1], [300, 250], [300, 600], [300, 200], "fluid"],
                    mobile: [[1, 1], [300, 250], [300, 600], [300, 200], "fluid"]
                },
                Botao: {
                    desktop: [[300, 150]],
                    tablet: [[300, 150]],
                    mobile: [[300, 150]]
                },
                stickyBottom: {
                    desktop: [[1, 1], [728, 90], [970, 90], [1140, 90], [1140, 120], [728, 120], [970, 120], "fluid"],
                    tablet: [[1, 1], [728, 90], [970, 90], [728, 120], [970, 120], "fluid"],
                    mobile: [[1, 1], [320, 50], [320, 100], [300, 50], [300, 100], [300, 120], "fluid"]
                }
            },
            targeting: targeting
        };
    }

    function getAdPlacementFromMessageSource(source) {
        var placements = document.querySelectorAll("ad-placement");
        var i;
        var frames;
        var j;

        if (!source) {
            return null;
        }

        for (i = 0; i < placements.length; i++) {
            frames = placements[i].querySelectorAll("iframe");

            for (j = 0; j < frames.length; j++) {
                try {
                    if (frames[j].contentWindow === source) {
                        return placements[i];
                    }
                } catch (e) {
                }
            }
        }

        return null;
    }

    function stopPlacementAutoRefresh(placement) {
        if (!placement || placement.getAttribute("data-publico-no-auto-refresh") === "true") {
            return;
        }

        placement.setAttribute("data-publico-no-auto-refresh", "true");
        placement._publicoRefreshAttribute = placement.getAttribute("refresh");
        placement.setAttribute("refresh", "false");

        if (typeof placement.refresh === "function") {
            placement._publicoRefreshOriginal = placement.refresh;
            placement.refresh = function () {
                return false;
            };
        }
    }

    function enablePlacementAutoRefresh(placement) {
        if (!placement || placement.getAttribute("data-publico-no-auto-refresh") !== "true") {
            return;
        }

        placement.removeAttribute("data-publico-no-auto-refresh");

        if (placement._publicoRefreshAttribute === null) {
            placement.removeAttribute("refresh");
        } else if (typeof placement._publicoRefreshAttribute === "string") {
            placement.setAttribute("refresh", placement._publicoRefreshAttribute);
        }

        if (typeof placement._publicoRefreshOriginal === "function") {
            placement.refresh = placement._publicoRefreshOriginal;
        }

        delete placement._publicoRefreshAttribute;
        delete placement._publicoRefreshOriginal;
    }

    function setPlacementAutoRefresh(placement, enabled) {
        if (enabled === false) {
            stopPlacementAutoRefresh(placement);
            return;
        }

        if (enabled === true) {
            enablePlacementAutoRefresh(placement);
        }
    }

    function resetPlacementCreativeControls(placement) {
        if (!placement) {
            return;
        }

        placement.removeAttribute("data-publico-hide-pub-label");
        placement.classList.remove("pubtxt");
        enablePlacementAutoRefresh(placement);
    }

    function hidePlacementPubLabel(placement) {
        if (!placement) {
            return;
        }

        placement.setAttribute("data-publico-hide-pub-label", "true");
        placement.classList.remove("pubtxt");
    }

    function initCreativeAdControl(runtime) {
        if (runtime.creativeAdControlInitialized) {
            return;
        }

        runtime.creativeAdControlInitialized = true;

        window.addEventListener("message", function (event) {
            var data = event.data;
            var placement;

            if (!data ||
                typeof data !== "object" ||
                data.type !== "adControl" ||
                (typeof data.autoRefresh !== "boolean" && data.hidePubLabel !== true)) {
                return;
            }

            placement = getAdPlacementFromMessageSource(event.source);

            if (!placement) {
                return;
            }

            if (typeof data.autoRefresh === "boolean") {
                setPlacementAutoRefresh(placement, data.autoRefresh);
            }

            if (data.hidePubLabel === true) {
                hidePlacementPubLabel(placement);
            }
        });
    }

    function bindRenderEvents(runtime) {
        window.googletag = window.googletag || {};
        window.googletag.cmd = window.googletag.cmd || [];

        window.googletag.cmd.push(function () {
            if (!window.googletag.pubads || typeof window.googletag.pubads !== "function") {
                return;
            }

            window.googletag.pubads().addEventListener("slotRequested", function (event) {
                var slotId;
                var element;

                if (!event || !event.slot || typeof event.slot.getSlotElementId !== "function") {
                    return;
                }

                slotId = event.slot.getSlotElementId();
                element = slotId ? getSlotElement(slotId) : null;

                if (element) pubAdLayout.requested(element);

                if (slotId !== "Footer" || !runtime.footer || !runtime.footer.specialNoRefresh) {
                    resetPlacementCreativeControls(element);
                }

                if (slotId === "Footer") {
                    resetFooterBtn(runtime);
                }
            });

            window.googletag.pubads().addEventListener("impressionViewable", function (event) {
                var slotId;
                var element;
                var iframe;

                if (!event || !event.slot || typeof event.slot.getSlotElementId !== "function") {
                    return;
                }

                slotId = event.slot.getSlotElementId();
                element = slotId ? getSlotElement(slotId) : null;
                iframe = element && typeof element.querySelector === "function"
                    ? element.querySelector('iframe[id^="google_ads_iframe_"]') || element.querySelector("iframe")
                    : null;

                if (iframe) {
                    iframe.classList.add("\u2714");
                }
            });

            window.googletag.pubads().addEventListener("slotRenderEnded", function (event) {
                var slotId;
                var element;
                var campaignId;

                if (!event || !event.slot || typeof event.slot.getSlotElementId !== "function") {
                    return;
                }

                slotId = event.slot.getSlotElementId();
                element = slotId ? getSlotElement(slotId) : null;

                setVertContentVisibility(event, element);

                if (!event.isEmpty &&
                    element &&
                    slotId !== "oop" &&
                    element.getAttribute("data-publico-hide-pub-label") !== "true") {
                    element.classList.add("pubtxt");
                }

                if (slotId === "oop") {
                    onOOPRender(event, window.pub, runtime.userType, runtime.adUnit, runtime);
                }

                if (slotId !== "Footer") {
                    return;
                }

                resetFooterBtn(runtime);

                if (event.isEmpty) {
                    var footerWrapper = getFooterWrapper();

                    if (runtime.footer) {
                        runtime.footer.specialNoRefresh = false;
                    }
                    enablePlacementAutoRefresh(element);

                    if (footerWrapper) {
                        footerWrapper.classList.remove("footer-special-hidden");
                    }
                    return;
                }

                campaignId = getCampaignId(event);

                if (FOOTER_NO_BTN.indexOf(campaignId) !== -1) {
                    hideFooterBtn(runtime);
                    stopPlacementAutoRefresh(element);
                    if (runtime.footer) {
                        runtime.footer.specialNoRefresh = true;
                    }
                    return;
                }

                if (runtime.footer) {
                    runtime.footer.specialNoRefresh = false;
                }
                enablePlacementAutoRefresh(element);
                showFooterBtn(runtime);
            });
        });
    }

    function initTagBundle(runtime) {
        if (!window.TagBundle || typeof window.TagBundle.init !== "function") {
            return logError("TagBundle carregou sem disponibilizar TagBundle.init().");
        }

        if (runtime.tagBundleInitialized) {
            return true;
        }

        bindRenderEvents(runtime);
        window.TagBundle.init(runtime.tagBundleConfig);
        runtime.tagBundleInitialized = true;
        return true;
    }

    function loadTagBundle(tagBundleUrl, callback) {
        var existing;
        var script;

        if (window.TagBundle && typeof window.TagBundle.init === "function") {
            callback();
            return;
        }

        existing = document.querySelector('script[src="' + tagBundleUrl + '"]');

        if (existing) {
            existing.addEventListener("load", callback, { once: true });
            existing.addEventListener("error", function () {
                logError("Falha ao carregar TagBundle.", tagBundleUrl);
            }, { once: true });
            return;
        }

        script = document.createElement("script");
        script.src = tagBundleUrl;
        script.async = true;
        script.addEventListener("load", callback, { once: true });
        script.addEventListener("error", function () {
            logError("Falha ao carregar TagBundle.", tagBundleUrl);
        }, { once: true });
        document.head.appendChild(script);
    }

    function getSlotIndex(element, selector) {
        return Array.prototype.slice.call(document.querySelectorAll(selector)).indexOf(element);
    }

    function getDynamicSlotConfig(element, userType, adUnit) {
        var slotType = element.getAttribute("data-publico-ad-placeholder");
        var index;

        if (slotType === "horz") {
            index = getSlotIndex(
                element,
                'ad-placement.pubHorz, [data-publico-ad-placeholder="horz"]'
            );

            if (index < 0) {
                return null;
            }

            return {
                id: "pubHorz" + index,
                format: "horz",
                adunit: "Horz_Publico/" + userType + "/" + adUnit + "/" + getAdUnitName(element, index === 0 ? "HorzTop" : "HorzMiddle")
            };
        }

        if (slotType === "botao") {
            index = getSlotIndex(
                element,
                'ad-placement.pubVert.BtnFixo, [data-publico-ad-placeholder="botao"]'
            );

            if (index < 0) {
                return null;
            }

            return {
                id: "Botao" + index,
                format: "Botao",
                adunit: "Botao_Publico/" + userType + "/" + adUnit + "/" + getAdUnitName(element, "Botao")
            };
        }

        if (slotType === "vert") {
            index = getSlotIndex(
                element,
                'ad-placement.pubVert:not(.BtnFixo), [data-publico-ad-placeholder="vert"]'
            );

            if (index < 0) {
                return null;
            }

            return {
                id: "pubVert" + index,
                format: "vert",
                adunit: "Vert_Publico/" + userType + "/" + adUnit + "/" + getAdUnitName(element, index === 0 ? "VertTop" : "VertMiddle")
            };
        }

        if (slotType === "gallery") {
            return {
                id: "pubGaleria",
                format: "gallery",
                adunit: "Vert_Publico/" + userType + "/" + adUnit + "/Galeria"
            };
        }

        return null;
    }

    function createDynamicSlot(marker, slotConfig) {
        var placement = document.createElement("ad-placement");

        placement.id = marker.id || slotConfig.id;
        placement.className = marker.className || "";
        placement.setAttribute("format", slotConfig.format);
        placement.setAttribute("adunit", slotConfig.adunit);

        ["refresh", "lazyload", "targeting", "data-publico-adunit-overwrite"].forEach(function (attributeName) {
            if (marker.hasAttribute(attributeName)) {
                placement.setAttribute(attributeName, marker.getAttribute(attributeName));
            }
        });

        marker.replaceWith(placement);
        return placement;
    }

    function initDynamicSlot(marker, userType, adUnit) {
        var slotConfig;

        if (!marker || marker.nodeType !== 1 || !marker.isConnected) {
            return;
        }

        slotConfig = getDynamicSlotConfig(marker, userType, adUnit);

        if (!slotConfig) {
            return;
        }

        createDynamicSlot(marker, slotConfig);
    }

    function initDynamicSlots(userType, adUnit) {
        Array.prototype.slice.call(document.querySelectorAll(DYNAMIC_SLOT_SELECTOR)).forEach(function (marker) {
            initDynamicSlot(marker, userType, adUnit);
        });
    }

    function watchDynamicSlots(userType, adUnit, runtime) {
        if (runtime.dynamicSlotObserver || typeof window.MutationObserver !== "function") {
            return;
        }

        runtime.dynamicSlotObserver = new window.MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                Array.prototype.slice.call(mutation.addedNodes || []).forEach(function (node) {
                    var markers = [];

                    if (!node || node.nodeType !== 1) {
                        return;
                    }

                    if (typeof node.matches === "function" && node.matches(DYNAMIC_SLOT_SELECTOR)) {
                        markers.push(node);
                    }

                    if (typeof node.querySelectorAll === "function") {
                        markers = markers.concat(
                            Array.prototype.slice.call(node.querySelectorAll(DYNAMIC_SLOT_SELECTOR))
                        );
                    }

                    markers.forEach(function (marker) {
                        initDynamicSlot(marker, userType, adUnit);
                    });
                });
            });
        });

        runtime.dynamicSlotObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function createGallerySlot() {
        var scrollWrap;
        var wrapper;
        var marker;

        if (document.getElementById("pubGaleria") ||
            document.querySelector('[data-publico-ad-placeholder="gallery"]')) {
            return;
        }

        scrollWrap = document.querySelector("#pswp-standard .pswp__scroll-wrap") ||
            document.querySelector(".pswp__scroll-wrap");

        if (!scrollWrap) {
            return;
        }

        wrapper = document.createElement("aside");
        wrapper.className = "ad-slot ad-slot--gallery";
        wrapper.style.zIndex = "9999999999";

        marker = document.createElement("div");
        marker.id = "pubGaleria";
        marker.className = "ad-slot--gallery-wrapper";
        marker.setAttribute("data-publico-ad-placeholder", "gallery");
        marker.setAttribute("refresh", "false");

        wrapper.appendChild(marker);
        scrollWrap.insertBefore(wrapper, scrollWrap.firstChild);
    }

    function refreshGallerySlot() {
        var placement = document.getElementById("pubGaleria");

        if (!placement || typeof placement.refresh !== "function") {
            return false;
        }

        return placement.refresh() !== false;
    }

    function initGallery(config, runtime) {
        if (runtime.gallery && runtime.gallery.initialized) {
            return;
        }

        runtime.gallery = {
            initialized: true,
            element: null,
            lastIndex: null,
            slidesSinceCooldown: 0,
            lastRefreshAt: 0
        };

        function bindGalleryChanges() {
            var galleryElement = window.publico &&
                window.publico.gallery &&
                window.publico.gallery.element;

            if (!galleryElement ||
                typeof galleryElement.listen !== "function" ||
                typeof galleryElement.getCurrentIndex !== "function" ||
                runtime.gallery.element === galleryElement) {
                return;
            }

            runtime.gallery.element = galleryElement;

            galleryElement.listen("afterChange", function () {
                var index;
                var now;

                if (runtime.gallery.element !== galleryElement) {
                    return;
                }

                index = galleryElement.getCurrentIndex();

                if (typeof index !== "number" || index === runtime.gallery.lastIndex) {
                    return;
                }

                runtime.gallery.lastIndex = index;
                now = Date.now();

                if (now - runtime.gallery.lastRefreshAt < 5000) {
                    return;
                }

                runtime.gallery.slidesSinceCooldown++;

                if (runtime.gallery.slidesSinceCooldown < 3) {
                    return;
                }

                if (refreshGallerySlot()) {
                    runtime.gallery.slidesSinceCooldown = 0;
                    runtime.gallery.lastRefreshAt = now;
                }
            });
        }

        window.addEventListener("pub.gallery.open", function () {
            var existingGallerySlot;

            if (adsAreDisabled(config)) {
                return;
            }

            runtime.gallery.lastIndex = null;
            runtime.gallery.slidesSinceCooldown = 0;
            runtime.gallery.lastRefreshAt = Date.now();
            existingGallerySlot = document.getElementById("pubGaleria");

            if (existingGallerySlot) {
                refreshGallerySlot();
            } else {
                createGallerySlot();
            }

            bindGalleryChanges();
        });
    }

    function initAds() {
        var config = window.pub;
        var runtime;
        var userType;
        var adUnit;
        var tagBundleUrl;

        if (!checkConfig(config)) {
            return;
        }

        if (adsAreDisabled(config)) {
            return;
        }

        if (!config.runtime || typeof config.runtime !== "object") {
            config.runtime = {};
        }

        runtime = config.runtime;

        if (runtime.initialized) {
            return;
        }

        userType = config.userType.charAt(0).toUpperCase() + config.userType.slice(1);
        adUnit = getAdUnitPath(config.adUnit);
        tagBundleUrl = getTagBundleUrl();

        if (!adUnit) {
            return logError("window.pub.adUnit contém um caminho inválido.", config.adUnit);
        }

        if (!tagBundleUrl) {
            return;
        }

        runtime.initialized = true;
        runtime.userType = userType;
        runtime.adUnit = adUnit;
        runtime.tagBundleUrl = tagBundleUrl;

                                                                           
                                                                               
                                                                                      
        runtime.tagBundleConfig = getTagBundleConfig(config, userType);
        window.tagBundleConfig = runtime.tagBundleConfig;

        initCreativeAdControl(runtime);
        initHeavyAdObserver(runtime);
        suppressListingSidebarVerts(config);
        initDynamicSlots(userType, adUnit);
        setupHorz(userType, adUnit);
        setupVert(userType, adUnit);
        initVertContent(config, userType, adUnit, runtime);
        initOOP(config, userType, adUnit, runtime);
        initFooter(config, userType, adUnit, runtime);
        initGallery(config, runtime);
        watchDynamicSlots(userType, adUnit, runtime);

        loadTagBundle(tagBundleUrl, function () {
            initTagBundle(runtime);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAds, { once: true });
    } else {
        initAds();
    }
})(window, document);
