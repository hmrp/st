/* 0.00.02 */

(function (window, document) {
    "use strict";

    var USER_TYPES = {
        anonymous: "Anonimo",
        registered: "Registado",
        subscriber: "Assinante"
    };

    var PAGE_TYPES = ["page", "noticia", "video", "infografia"];
    var DYNAMIC_SLOT_SELECTOR = '[data-publico-ad-placeholder="horz"], [data-publico-ad-placeholder="vert"], [data-publico-ad-placeholder="botao"]';
    var FOOTER_BLOCK = ["mundial-2026", "leituras"];
    var FULLSCREEN_BLOCK = ["mundial-2026", "leituras"];
    var FOOTER_NO_BTN = [3560930581, 3077683810, 3698619285];
    var FOOTER_BTN_DELAY_MS = 300;
    var FULLSCREEN_CAP_KEY = "intro_cap";
    var FULLSCREEN_CAP_MS = 180000;
    var FULLSCREEN_CAP_BYPASS = ["11826917"];
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

        overwrite = typeof overwrite === "string" ? overwrite.trim() : "";

        if (!overwrite) {
            return defaultName;
        }

        if (overwrite.indexOf("/") !== -1) {
            logError("data-publico-adunit-overwrite deve conter apenas o nome final do ad unit.", overwrite);
            return defaultName;
        }

        return overwrite;
    }

    function setupHorz(userType, adUnit) {
        Array.prototype.slice.call(document.querySelectorAll("ad-placement.pubHorz")).forEach(function (element, index) {
            if (!element.id) {
                element.id = "pubHorz" + index;
            }

            element.setAttribute("format", "horz");
            element.setAttribute(
                "adunit",
                "Horz_Publico/" + userType + "/" + adUnit + "/" + getAdUnitName(element, index === 0 ? "HorzTopo" : "HorzMiddle")
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
                "Vert_Publico/" + userType + "/" + adUnit + "/" + getAdUnitName(element, index === 0 ? "VertTopo" : "VertMiddle")
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
        var isSubscriber = config.userType === "subscriber";
        var isMobile = window.matchMedia && window.matchMedia("only screen and (max-width: 767px)").matches;
        var maxSlots = isSubscriber ? 3 : 100;
        var interval = isSubscriber ? 7 : 5;
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

            if (iCount === interval || (iCount === 3 && !firstSlotFilled)) {
                element.insertAdjacentElement("afterend", createVertContent(slotCount, userType, adUnit));
                iCount = 1;
                slotCount += 1;
                firstSlotFilled = true;
            }
        });

        return slotCount;
    }

    function initVertContent(config, userType, adUnit, runtime) {
        var isPwEnable;

        if (config.pageType !== "noticia" || !document.querySelector("#story-body")) {
            return;
        }

        runtime.vertContent = runtime.vertContent || {
            state: "pending",
            count: 0,
            listenerInstalled: false
        };

        isPwEnable = window.publicoConfig && typeof window.publicoConfig.isPwEnable === "boolean"
            ? window.publicoConfig.isPwEnable
            : null;

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

        if (window.Publico && window.Publico.BodyIsClean === true) {
            if (runtime.vertContent.state === "pending") {
                runtime.vertContent.state = "locked";
                runtime.vertContent.count = 0;
            }
            return;
        }

        if (!runtime.vertContent.listenerInstalled) {
            runtime.vertContent.listenerInstalled = true;

            document.addEventListener("ea.openedByMetered", function () {
                if (runtime.vertContent.state !== "pending") {
                    return;
                }

                runtime.vertContent.state = "open";
                runtime.vertContent.count = insertVertContent(userType, adUnit, config);
            }, { once: true });

            document.addEventListener("clean.done", function () {
                if (runtime.vertContent.state !== "pending") {
                    return;
                }

                runtime.vertContent.state = "locked";
                runtime.vertContent.count = 0;
            }, { once: true });
        }
    }

    function isTagBlocked(config, blockedTags) {
        return config.tags.some(function (tag) {
            return blockedTags.indexOf(tag) !== -1;
        });
    }

    function clearFullscreenCap() {
        try {
            if (window.localStorage) {
                window.localStorage.removeItem(FULLSCREEN_CAP_KEY);
            }
        } catch (e) {
        }
    }

    function setFullscreenCap() {
        try {
            if (window.localStorage) {
                window.localStorage.setItem(FULLSCREEN_CAP_KEY, String(Date.now() + FULLSCREEN_CAP_MS));
            }
        } catch (e) {
        }
    }

    function hasFullscreenCap() {
        var capUntil = 0;

        try {
            capUntil = parseInt(
                window.localStorage ? window.localStorage.getItem(FULLSCREEN_CAP_KEY) : null,
                10
            ) || 0;
        } catch (e) {
            capUntil = 0;
        }

        if (!capUntil) {
            return false;
        }

        if (Date.now() >= capUntil) {
            clearFullscreenCap();
            return false;
        }

        return true;
    }

    function canShowFullscreen(config) {
        if (!config || config.showAds === false || config.userType === "subscriber") {
            return false;
        }

        if (isTagBlocked(config, FULLSCREEN_BLOCK)) {
            return false;
        }

        return !hasFullscreenCap();
    }

    function initOOP(config, userType, adUnit, runtime) {
        var oop;

        runtime.fullscreen = runtime.fullscreen || {
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

        if (!canShowFullscreen(config)) {
            runtime.fullscreen.blocked = isTagBlocked(config, FULLSCREEN_BLOCK);

            if (config.userType === "subscriber") {
                runtime.fullscreen.state = "subscriber";
            } else if (runtime.fullscreen.blocked) {
                runtime.fullscreen.state = "blocked";
            } else {
                runtime.fullscreen.state = "capped";
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

        runtime.fullscreen.enabled = true;
        runtime.fullscreen.state = "oop-pending";
    }

    function initInterstitial(config, userType, adUnit, runtime) {
        var fullscreen = runtime.fullscreen;

        if (!fullscreen || fullscreen.interstitialInit || config.pageType !== "noticia" || !canShowFullscreen(config)) {
            return;
        }

        fullscreen.interstitialInit = true;

        window.googletag.cmd.push(function () {
            var slot;

            if (config.pageType !== "noticia" || !canShowFullscreen(config)) {
                return;
            }

            if (typeof window.googletag.defineOutOfPageSlot !== "function" ||
                !window.googletag.enums ||
                !window.googletag.enums.OutOfPageFormat ||
                !window.googletag.enums.OutOfPageFormat.INTERSTITIAL) {
                fullscreen.state = "interstitial-unsupported";
                return;
            }

            slot = window.googletag.defineOutOfPageSlot(
                "/4458504/INTERSTITIAL_Publico/" + userType + "/" + adUnit + "/INTERSTITIAL",
                window.googletag.enums.OutOfPageFormat.INTERSTITIAL
            );

            if (!slot) {
                fullscreen.state = "interstitial-unavailable";
                return;
            }

            fullscreen.state = "interstitial";
            setFullscreenCap();

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
        var fullscreen = runtime.fullscreen;

        if (!fullscreen || fullscreen.rewardedInit || config.pageType !== "noticia" || !canShowFullscreen(config)) {
            return;
        }

        fullscreen.rewardedInit = true;
        fullscreen.state = "rewarded-pending";

        window.googletag.cmd.push(function () {
            var rewardedSlot;

            if (config.pageType !== "noticia" || !canShowFullscreen(config)) {
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
                "/4458504/REWARDED_Publico/" + userType + "/" + adUnit + "/REWARDED",
                window.googletag.enums.OutOfPageFormat.REWARDED
            );

            if (!rewardedSlot) {
                initInterstitial(config, userType, adUnit, runtime);
                return;
            }

            rewardedSlot.addService(window.googletag.pubads());

            window.googletag.pubads().addEventListener("rewardedSlotReady", function (event) {
                if (event.slot !== rewardedSlot || fullscreen.rewardedTimedOut) {
                    return;
                }

                fullscreen.rewardedReady = true;

                if (fullscreen.rewardedVisible || typeof event.makeRewardedVisible !== "function") {
                    return;
                }

                fullscreen.rewardedVisible = true;
                fullscreen.state = "rewarded";
                setFullscreenCap();
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
                if (fullscreen.rewardedReady) {
                    return;
                }

                if (config.pageType !== "noticia" || !canShowFullscreen(config)) {
                    return;
                }

                fullscreen.rewardedTimedOut = true;
                if (window.googletag && typeof window.googletag.destroySlots === "function") {
                    window.googletag.destroySlots([rewardedSlot]);
                }
                initInterstitial(config, userType, adUnit, runtime);
            }, REWARDED_TIMEOUT_MS);
        });
    }

    function onOOPRender(event, config, userType, adUnit, runtime) {
        var fullscreen = runtime.fullscreen;
        var templateId;

        if (!fullscreen || !fullscreen.enabled || fullscreen.oopResolved) {
            return;
        }

        fullscreen.oopResolved = true;

        if (!event.isEmpty) {
            templateId = getTemplateId(event);

            if (templateId && FULLSCREEN_CAP_BYPASS.indexOf(templateId) !== -1) {
                clearFullscreenCap();
                fullscreen.state = "oop-bypass";
                return;
            }

            setFullscreenCap();
            fullscreen.state = "oop";
            return;
        }

        fullscreen.state = "oop-empty";
        window.setTimeout(function () {
            if (config.pageType !== "noticia" || !canShowFullscreen(config)) {
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

        if (config.userType === "subscriber") {
            return;
        }

        if (config.exclusive === true) {
            return;
        }

        if (isTagBlocked(config, FOOTER_BLOCK)) {
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
        var targeting = {
            user: [userType],
            noticiaTag: config.tags
        };

        if (typeof config.exclusive === "boolean") {
            targeting.exclusivo = [config.exclusive ? "sim" : "nao"];
        }

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

    function bindRenderEvents(runtime) {
        window.googletag = window.googletag || {};
        window.googletag.cmd = window.googletag.cmd || [];

        window.googletag.cmd.push(function () {
            if (!window.googletag.pubads || typeof window.googletag.pubads !== "function") {
                return;
            }

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

                if (!event.isEmpty && element) {
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
                adunit: "Horz_Publico/" + userType + "/" + adUnit + "/" + getAdUnitName(element, index === 0 ? "HorzTopo" : "HorzMiddle")
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
                adunit: "Vert_Publico/" + userType + "/" + adUnit + "/" + getAdUnitName(element, index === 0 ? "VertTopo" : "VertMiddle")
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

        initDynamicSlots(userType, adUnit);
        setupHorz(userType, adUnit);
        setupVert(userType, adUnit);
        initVertContent(config, userType, adUnit, runtime);
        initOOP(config, userType, adUnit, runtime);
        initFooter(config, userType, adUnit, runtime);
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
