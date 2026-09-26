/* 0.0.30 */
(function (window, document) {
    "use strict";

    var USER_TYPES = {
        anonymous: "Anonimo",
        registered: "Registado",
        subscriber: "Assinante"
    };

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
    var FOOTER_BLOCK_NOTICIATAG = ["mundial-2026", "leituras"];
    var OOP_BLOCK = ["mundial-2026", "leituras"];
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

        if (hostname === "www.publico.pt") {
            hostname = "publico.pt";
        }

        if (hostname === "publico.pt" || hostname.endsWith(".publico.pt")) {
            return "https://tagbundle.com/static/" + hostname + "/tagbundle.min.js";
        }

        logError("Host não autorizado para carregamento do TagBundle.", hostname);
        return null;
    }

    function checkConfig(config) {
        if (!config || typeof config !== "object") {
            return logError("window.pub não está definido.");
        }

        if (config.showAds === false) {
            return true;
        }

        if (typeof config.showAds !== "undefined" && typeof config.showAds !== "boolean") {
            return logError("window.pub.showAds tem de ser booleano quando definido.", config.showAds);
        }

        if (!USER_TYPES[config.userType]) {
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

    function createVertContent(index, userType, adUnit) {
        var wrapper = document.createElement("aside");
        var placement = document.createElement("ad-placement");

        wrapper.className = "ad-slot ad-slot--in-content";
        wrapper.setAttribute("data-publico-vertcontent", "1");

        placement.id = "VertContent" + index;
        placement.setAttribute("format", "vertContent");
        placement.setAttribute("adunit", "Vert_Publico/" + userType + "/" + adUnit + "/VertContent");

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
                element.insertAdjacentElement("afterend", createVertContent(slotCount, userType, adUnit));
                iCount = 1;
                slotCount += 1;
                firstSlotFilled = true;
            }
        });

        return slotCount;
    }

    function insertLockedVertContent(userType, adUnit) {
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
        placement = createVertContent(0, userType, adUnit);
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
            runtime.vertContent.count = insertLockedVertContent(userType, adUnit);
        }

        isPwEnable = window.publicoConfig && typeof window.publicoConfig.isPwEnable === "boolean"
            ? window.publicoConfig.isPwEnable
            : null;

        if (config.userType === "subscriber") {
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
        if (!config || config.showAds === false) {
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
                            navBar: false,
                            unhideWindow: false,
                            inactivity: false,
                            endOfArticle: false,
                            backward: true
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

    function initFooter(config, userType, adUnit, runtime) {
        var footer;

        runtime.footer = runtime.footer || {
            enabled: false,
            blocked: false
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
        footer.setAttribute("refresh", "false");
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
        var adUnitPath = event && event.slot && typeof event.slot.getAdUnitPath === "function"
            ? event.slot.getAdUnitPath()
            : "";
        var wrapper;

        if (!adUnitPath || adUnitPath.split("/").pop() !== "VertContent" || !element || typeof element.closest !== "function") {
            return;
        }

        wrapper = element.closest('aside[data-publico-vertcontent="1"]');

        if (!wrapper) {
            return;
        }

        wrapper.style.display = event.isEmpty ? "none" : "";
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
        var footer = document.getElementById("Footer");
        var wrapper = getFooterWrapper();

        resetFooterBtn(runtime);

        if (footer) {
            footer.removeAttribute("format");
        }

        if (wrapper) {
            wrapper.classList.remove("footer-close-ready");
            wrapper.classList.add("footer-special-hidden");
        }
    }

    function showFooterBtn(runtime) {
        var wrapper = getFooterWrapper();

        resetFooterBtn(runtime);

        if (!wrapper || wrapper.classList.contains("footer-special-hidden")) {
            return;
        }

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
                resetPlacementCreativeControls(element);
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
                    return;
                }

                campaignId = getCampaignId(event);

                if (FOOTER_NO_BTN.indexOf(campaignId) !== -1) {
                    hideFooterBtn(runtime);
                    return;
                }

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
        window.TagBundle.init(window.tagBundleConfig);
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

            if (config.showAds === false) {
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
        var tagBundleConfig;

        if (!checkConfig(config)) {
            return;
        }

        if (config.showAds === false) {
            return;
        }

        if (!config.runtime || typeof config.runtime !== "object") {
            config.runtime = {};
        }

        runtime = config.runtime;

        if (runtime.initialized) {
            return;
        }

        userType = USER_TYPES[config.userType];
        adUnit = config.adUnit;
        tagBundleUrl = getTagBundleUrl();

        if (!tagBundleUrl) {
            return;
        }

        runtime.initialized = true;
        runtime.userType = userType;
        runtime.adUnit = adUnit;
        runtime.tagBundleUrl = tagBundleUrl;

        initCreativeAdControl(runtime);
        initDynamicSlots(userType, adUnit);
        setupHorz(userType, adUnit);
        setupVert(userType, adUnit);
        initVertContent(config, userType, adUnit, runtime);
        initOOP(config, userType, adUnit, runtime);
        initFooter(config, userType, adUnit, runtime);
        initGallery(config, runtime);
        watchDynamicSlots(userType, adUnit, runtime);

        tagBundleConfig = getTagBundleConfig(config, userType);
        window.tagBundleConfig = tagBundleConfig;

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