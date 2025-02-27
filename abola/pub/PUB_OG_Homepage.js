<!--ASYNC CALL -->
<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<!-- END ASYNC -->
<script>
    if (typeof window.hasAds == "undefined" || window.hasAds != false) {
        var userOnPage = Publico.userSession;
        var referrer = document.referrer;
		var dfpSection = window.dfpSection || "home";
		var dbPageSection = window.dbPageSection || "home";
		var dbPageSubSection = window.dbPageSubSection || "";
        var referrerTarget = "";
        if (referrer) {
            if (referrer.substr(document.referrer.length - 1, 1) == "/") referrer = referrer.substr(document.referrer.length - 1, 1);
            var fbReg = /(^|\.)facebook\.(com?|[a-z]{2}|com?\.[a-z]{2}|cat)$/;
            if (fbReg.exec(referrer) != null) {
                referrerTarget = "fb";
            }
        }


        var wasSub, isAtMinute = false;
        try {
            var jp = localStorage.getItem("subscriber_ads");
            if (jp != null) {
                try {
                    var jpj = JSON.parse(jp);
                    if (jpj.isSubscriber) {
                        wasSub = true;
                        userOnPage.isSubscriber = true;
                    }
                } catch (e) { }
            }
        } catch (e) { }
        if (Publico) {
            if (window.pageTags && Array.isArray(window.pageTags) && window.pageTags.length > 0) {
                if (window.pageTags.indexOf("Ao Minuto") > -1 && Publico.Url.param("FromApp") == "1") {
                    isAtMinute = true;
                }
            }
        }
        if (userOnPage.isSubscriber || !wasSub || isAtMinute) {
            var billboardAd = document.querySelector("billboardAd");
			if(billboardAd != null)
				billboardAd.closest("aside").remove();
        }
        var targetAssinante = window.targetAssinante = document.cookie.indexOf("_publico") > -1 ? "log" : "nao";
        if (typeof userOnPage !== "undefined" && userOnPage.isSubscriber) {
            window.targetAssinante = targetAssinante = "sim";
        } else {
            try {
                var jsonAd = JSON.parse(localStorage["subscriber_ads"]);
                if (jsonAd.isSubscriber) {
                    window.targetAssinante = targetAssinante = "sim";
                }
            } catch (e) { }
        }
        try {
            var jP = JSON.parse(localStorage.getItem("subscriber_ads"));
            if (jP && jP.isSubscriber) {
                targetAssinante = "sim";
            }
        } catch (e) { }


        var subSeccaoSite = [];
        subSeccaoSite.push("home");

        if (typeof dbPageSection !== "undefined" && dbPageSection != "") {
            if (subSeccaoSite.indexOf(dbPageSection.toLowerCase()) < 0) {
                subSeccaoSite.push(dbPageSection.toLowerCase());
            }
            if (dbPageSubSection != "" && subSeccaoSite.indexOf(dbPageSubSection.toLowerCase()) < 0) {
                subSeccaoSite.push(dbPageSubSection.toLowerCase());
            }
        }

        window.subSeccaoSite = subSeccaoSite;
        var targetSettings = window.targetSettings || [];
        targetSettings.push(window.isFromRefresh ? "comrefresh" : "semrefresh");
        var isDesktop = Publico.Utils.IsMobile;

        var googletag = googletag || {};
        googletag.cmd = googletag.cmd || [];
       // var pub = { vert: [], horz: [], tag: [], oop: [], fEnd: [encodeURI(window.location.href.match(/([^\?]*)\/*$/)[0])] };

        googletag.cmd.push(function () {
            googletag.pubads()
                .setTargeting("assinante", targetAssinante)
                .setTargeting('end', pub.fEnd)
                .setTargeting("noticiatag", targetSettings)
                .setTargeting("Seccao", subSeccaoSite)
                .setTargeting("og", referrerTarget);
            googletag.pubads().enableLazyLoad({
                fetchMarginPercent: 50,
                renderMarginPercent: 25,
                mobileScaling: 1.3
            });

            var pos_tag = [],
                pos_horz = [],
                pos_vert = [],
                contador = 0,
                w_sz,
                q_vert = document.querySelectorAll(".pubVert").length,
                q_horz = document.querySelectorAll(".pubHorz").length,
                q_tag = document.querySelectorAll(".pubTag").length;

            function units(className, contador) {
                if (className) {
                    var targetID,
                        items = document.getElementsByClassName(className),
                        targetCLASS = ["pubAutorefresh", "pubWidget", "pubIdealista", "pubAssinaturas", "pubBtnFixo"];

                    function tgt() {
                        var x = [];
                        for (var i = 0; i < targetCLASS.length; i++) {
                            if (document.getElementById(targetID).classList.contains(targetCLASS[i])) {
                                x.push(targetCLASS[i].replace(/pub/g, ''));
                            }
                        }
                        return x.toString();
                    };
                    for (var i = 0; i < items.length; i++) {
                        var runAd = true;
                        var isOnlyDeskop = items[i].className.indexOf("show-for-desktop") > -1;
                        var isOnlyMobile = items[i].className.indexOf("hide-for-desktop") > -1;
                        var allowHalfpage = items[i].className.indexOf("show-only-square") < 0;
                        if (isOnlyDeskop || isOnlyMobile) {
                            if (isOnlyDeskop && !isDesktop) runAd = false;
                            if (isOnlyMobile && isDesktop) runAd = false;
                        }
                        if (runAd) {
                            contador++;
                            if (className == "oop") {
                                items[i].id = "oop";
                                pub.oop = googletag.defineOutOfPageSlot('/4458504/OOP/' + dfpSection, 'oop').addService(googletag.pubads());
                            }

                            if (className == "pubHorz") {
                                targetID = className + contador;
                                items[i].id = targetID;
                                if (contador == 1) {
                                    var horSize = googletag.sizeMapping().addSize([0, 0], [[320, 100], [320, 160], [300, 120], [320, 50], [300, 100], [300, 50], [300, 75], [300, 50], [234, 60], [125, 125], "fluid"]).addSize([768, 200], [[728, 90], [738, 120], [468, 60], "fluid"]).addSize([1024, 200], [[1140, 220], [1140, 120], [970, 250], [840, 250], [800, 250], [728, 90], [468, 60], "fluid"]).build();
                                    pub.horz[i] = googletag.defineSlot("/4458504/Horz/" + dfpSection, [[1140, 220], [1140, 120], [970, 250], [840, 250], [800, 250], [738, 120], [728, 90], [468, 60], [320, 100], [320, 160], [300, 120], [320, 50], [300, 100], [300, 50], [300, 75], [300, 50], [234, 60], [125, 125]], "pubHorz" + contador).defineSizeMapping(horSize).setTargeting("pos", ["ATF", tgt()]).addService(googletag.pubads());
                                } else {
                                    pub.horz[i] = googletag.defineSlot("/4458504/Horz/" + dfpSection, [[1140, 220], [1140, 120], [970, 250], [840, 250], [800, 250], [738, 120], [728, 90], [468, 60], [320, 100], [320, 160], [300, 120], [320, 50], [300, 100], [300, 50], [300, 75], [300, 50], [234, 60], [125, 125], "fluid"], "pubHorz" + contador).defineSizeMapping(horSize).setTargeting("pos", ["BTFhorz" + Number(contador - 1), tgt()]).addService(googletag.pubads());
                                }
                            }
                            if (className == "pubVert") {
                                targetID = className + contador;
                                items[i].id = targetID;
                                if (allowHalfpage) {
                                    if (contador == 1) {
                                        var verSize = googletag.sizeMapping().addSize([0, 0], [[300, 250], [300, 600], [300, 130], [300, 60], [200, 200], [250, 250], [320, 160], [320, 50], [320, 100], [300, 50], [300, 100], [300, 75], [234, 60], [180, 150], [125, 125], "fluid"]).addSize([768, 200], [[300, 600], [300, 250], [300, 130], [300, 60], [200, 200], [250, 250], [300, 50], [300, 100], [300, 75], [234, 60], [180, 150], [125, 125], "fluid"]).build();
                                        pub.vert[i] = googletag.defineSlot("/4458504/Vert/" + dfpSection, [[300, 600], [300, 250], [300, 130], [300, 60], [200, 200], [250, 250], [320, 50], [320, 100], [320, 160], [300, 50], [300, 100], [300, 75], [234, 60], [180, 150], [125, 125], "fluid"], "pubVert" + contador).defineSizeMapping(verSize).setTargeting("pos", ["ATF", tgt()]).addService(googletag.pubads());
                                    } else {
                                        pub.vert[i] = googletag.defineSlot("/4458504/Vert/" + dfpSection, [[300, 600], [300, 250], [300, 130], [300, 60], [200, 200], [250, 250], [320, 50], [320, 100], [320, 160], [300, 50], [300, 100], [300, 75], [234, 60], [180, 150], [125, 125], "fluid"], "pubVert" + contador).defineSizeMapping(verSize).setTargeting("pos", ["BTFvert" + Number(contador - 1), tgt()]).addService(googletag.pubads());
                                    }
                                } else {
                                    if (contador == 1) {
                                        var verSize = googletag.sizeMapping().addSize([0, 0], [[300, 250], [300, 130], [300, 60], [200, 200], [250, 250], [320, 160], [320, 50], [320, 100], [300, 50], [300, 100], [300, 75], [234, 60], [180, 150], [125, 125], "fluid"]).addSize([768, 200], [[300, 250], [300, 130], [300, 60], [200, 200], [250, 250], [300, 50], [300, 100], [300, 75], [234, 60], [180, 150], [125, 125], "fluid"]).build();
                                        pub.vert[i] = googletag.defineSlot("/4458504/Vert/" + dfpSection, [[300, 250], [300, 130], [300, 60], [200, 200], [250, 250], [320, 50], [320, 100], [320, 160], [300, 50], [300, 100], [300, 75], [234, 60], [180, 150], [125, 125], "fluid"], "pubVert" + contador).defineSizeMapping(verSize).setTargeting("pos", ["ATF", tgt()]).addService(googletag.pubads());
                                    } else {
                                        pub.vert[i] = googletag.defineSlot("/4458504/Vert/" + dfpSection, [[300, 250], [300, 130], [300, 60], [200, 200], [250, 250], [320, 50], [320, 100], [320, 160], [300, 50], [300, 100], [300, 75], [234, 60], [180, 150], [125, 125], "fluid"], "pubVert" + contador).defineSizeMapping(verSize).setTargeting("pos", ["BTFvert" + Number(contador - 1), tgt()]).addService(googletag.pubads());
                                    }
                                }
                            }
                        }

                    }
                }
            };
            units("Fincontentdfp", contador);
            units("oop", contador);
            units("pubHorz", contador);
			units("pubVert", contador);
            units("pubTag", contador);

            googletag.pubads().addEventListener("slotRequested", function (event) {
                var x = event.slot.getAdUnitPath();
                if ((x.indexOf("/Horz") > 4) || (x.indexOf("/Vert") > 4)) {
                    document.getElementById(event.slot.getSlotElementId()).classList.remove("pubtxt", "\u2714");
                }
            });

            var horzInterval = null;
            var horzIntervalCount = 0;			
            googletag.pubads().addEventListener("slotRenderEnded", function (event) {
                var x = !event.isEmpty && event.slot;
                if (x === pub.horz[0]) {
                    if (!event.isEmpty) {
                        var ev = new Event('hasBillboard');
                        document.dispatchEvent(ev);
                        window.hasBillboard = true;
                    } else {
                        debugger;
                    }
                    if (typeof Waypoint !== "undefined") {
                        Waypoint.refreshAll();
                    }
                    /*horzInterval = setInterval(function () {
                        $(".pubHorz").eq(0).addClass("pubtxt");
                        if ($(".pubHorz").eq(0).hasClass("✔") || horzIntervalCount == 6) {
                            $(".pubHorz").eq(0).removeClass("pubSticky");
                            clearInterval(horzInterval);
                        } else {
                            horzIntervalCount++;
                        }
                    }, 500);*/
                }
               
                if (x === (pub.vert[0] || pub.vert[1]) && event.size[1] > 599) {
                    googletag.pubads().clear([pub.vert[1]]);
                    googletag.destroySlots([pub.vert[1]]);
                    var el = document.getElementById(pub.vert[1].getSlotElementId());
                    if (el != null) {					
                        el.parentElement.remove();
                    }						
                }

                if (x != pub.oop) {
                    document.getElementById(event.slot.getSlotElementId()).classList.add("pubtxt");
                } else {
                    //$(".fb-customerchat").css("z-index", 0);
                }
				
                if (event.isEmpty && event.slot) {
                    var el = document.getElementById(event.slot.getSlotElementId());
                    if (el != null) {
                        googletag.pubads().clear([event.slot]);
                        googletag.destroySlots([event.slot]);
					
						if (event.slot != pub.oop) {
							el.style.display = "none";
						}

                    }
				}				
            });
            googletag.pubads().addEventListener("impressionViewable", function (event) {
                if (!event.isEmpty) {
                    document.getElementById(event.slot.getSlotElementId()).classList.add("\u2714");
                    if (event.slot.getTargeting("pos").indexOf("Autorefresh") > -1) {
                        setTimeout(function () {
                            googletag.pubads().refresh([event.slot], { changeCorrelator: true });
                        }, 300000);
                    }
                }
            });

            //googletag.disablePublisherConsole();
            googletag.pubads().enableVideoAds();
            googletag.pubads().enableSingleRequest();
            googletag.pubads().enableAsyncRendering();
            googletag.pubads().setCentering(true);
            googletag.pubads().disableInitialLoad();
            googletag.pubads().collapseEmptyDivs(true, true);
            googletag.enableServices();
            if (document.querySelector(".oop")) { googletag.display("oop") };
            for (var i = 0; i < q_horz; i++) { pos_vert[i] = googletag.display("pubHorz" + q_horz) };
            for (var i = 0; i < q_vert; i++) { pos_horz[i] = googletag.display("pubVert" + q_vert) };
            for (var i = 0; i < q_tag; i++) { pos_tag[i] = googletag.display("pubTag" + q_tag) };
            function r() {
                //googletag.pubads().refresh()
            };

            (window.pub.cr = function () {
                var x = window.innerWidth;
                if (x <= 767 && w_sz !== 1) {
                    w_sz = 1;
                    r();
                }
                if (x >= 768 && x <= 1023 && w_sz !== 2) {
                    w_sz = 2;
                    r();
                }
                if (x >= 1024 && w_sz !== 3) {
                    w_sz = 3;
                    r();
                }
            })();
            window.addEventListener("resize", function () {
                clearTimeout(this.id);
                this.id = setTimeout(pub.cr, 1500);
            });
        });

        document.addEventListener("pub.cmpReady", function () {
            window.cmpReady = true;
			LoadAds();
        });

        window.adsRefreshed = false;
        var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
        if (isIE11) {
            setTimeout(function () {
                if (window.hasAds && !window.adsRefreshed) {
                    googletag.pubads().refresh();
                }
            }, 2000);
        }
		
		if(window.cmpReady){
			LoadAds();
		}
		
    } else {
        /*if (document.location.pathname == "/") {
            $(".stack--print-edition").remove();
            $("html").addClass("user--subscriber-x2");
            var $li = $(".stack__slice__item .stack__ads").closest(".stack__slice__item");
            $li.empty();
            $li.append("<div class=\"card card--print-edition\"><div class=\"card__inner\"><div class=\"card__content\"><header class=\"stack__header\"><h2 class=\"stack__title\">Edição impressa</h2><div class=\"stack__blurb\"><p>O jornal de hoje em formato digital. Exclusivo para assinantes.</p></div></header><figure class=\"media media--image media--action media--print-cover\" data-media-action=\"modal\" aria-label=\"media\"><figcaption class=\"caption caption--image\">09 de maio de 2023</figcaption><div class=\"flex-media cover\"><img data-media-size=\"1200x835\" data-media-viewer=\"https://imagens.publicocdn.com/imagens.aspx/2023/05/09/P1/Publico.jpg?tp=ARQUIVO\" src=\"https://imagens.publicocdn.com/imagens.aspx/2023/05/09/P1/Publico.jpg?tp=ARQUIVO&w=400&h=502&act=cropResize\" data-interchange=\"[https://imagens.publicocdn.com/imagens.aspx/2023/05/09/P1/Publico.jpg?tp=ARQUIVO&w=400&h=502&act=cropResize, small], [https://imagens.publicocdn.com/imagens.aspx/2023/05/09/P1/Publico.jpg?tp=ARQUIVO&w=400&h=502&act=cropResize, small-retina]\"></div></figure><footer><a href=\"/jornal\" class=\"stack__button card__faux-block-link\">Ver edição</a></footer></div></div></div>");
        }*/
    }
	
	function LoadAds(){
		if (window.hasAds) {
			if (typeof googletag != "undefined" && typeof googletag.pubads != "undefined" && googletag.pubadsReady) {
			googletag.pubads().refresh();
			} else {
				window.googleAdInterval = setInterval(function () {		
					if(typeof googletag != "undefined" && googletag.pubadsReady){
						clearInterval(window.googleAdInterval);
						googletag.pubads().refresh();
					}
				}, 200);
			}
		} else {
			/*if (document.location.pathname == "/") {
				$(".stack--print-edition").remove();
				$("html").addClass("user--subscriber-x2");
				var $li = $("#pubVert1").closest(".stack__slice__item");
				$li.empty();
				$li.append("<div class=\"card card--print-edition\"><div class=\"card__inner\"><div class=\"card__content\"><header class=\"stack__header\"><h2 class=\"stack__title\">Edição impressa</h2><div class=\"stack__blurb\"><p>O jornal de hoje em formato digital. Exclusivo para assinantes.</p></div></header><figure class=\"media media--image media--action media--print-cover\" data-media-action=\"modal\" aria-label=\"media\"><figcaption class=\"caption caption--image\">09 de maio de 2023</figcaption><div class=\"flex-media cover\"><img data-media-size=\"1200x835\" data-media-viewer=\"https://imagens.publicocdn.com/imagens.aspx/2023/05/09/P1/Publico.jpg?tp=ARQUIVO\" src=\"https://imagens.publicocdn.com/imagens.aspx/2023/05/09/P1/Publico.jpg?tp=ARQUIVO\" data-interchange=\"[https://imagens.publicocdn.com/imagens.aspx/2023/05/09/P1/Publico.jpg?tp=ARQUIVO&w=400&h=502&act=cropResize, small], [https://imagens.publicocdn.com/imagens.aspx/2023/05/09/P1/Publico.jpg?tp=ARQUIVO&w=400&h=502&act=cropResize, small-retina]\"></div></figure><footer><a href=\"/jornal\" class=\"stack__button card__faux-block-link\">Ver edição</a></footer></div></div></div>");
			}*/
			document.querySelectorAll(".ad-slot").forEach(function(el){el.remove();});
			document.querySelectorAll(".pubHorz").forEach(function(el){el.remove();});
		}	
	}	


    </script>