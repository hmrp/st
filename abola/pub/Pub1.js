        window.subSeccaoSite = subSeccaoSite;
        var targetSettings = window.targetSettings || [];


        var googletag = googletag || {};
        googletag.cmd = googletag.cmd || [];
        var pub = {vert:[],horz:[],tag:[],oop:[],fEnd:[encodeURI(window.location.href.match(/([^\?]*)\/*$/)[0])]};

        googletag.cmd.push(function () {
                googletag.pubads()
                    .setTargeting("assinante", targetAssinante)
                    .setTargeting('end', pub.fEnd)
                    .setTargeting("noticiatag", targetSettings)
                    .setTargeting("Seccao", subSeccaoSite);
                googletag.pubads().enableLazyLoad({
                    fetchMarginPercent: 40,
                    renderMarginPercent: 25,
                    mobileScaling: 1.3
                });

                var pos_tag = [],
                pos_horz = [],
                pos_vert = [],
                contador = 0,
                w_sz,
                q_vert = document.querySelectorAll(".pubVert").length,
                q_horz = document.querySelectorAll(".pubHorz").length;


                function units(className, contador) {
                    if (className) {
                        var targetID,
                        items = document.getElementsByClassName(className),
                        targetCLASS = ["pubAutorefresh"];

                        function tgt() {
                            var x = [];
                            for (var i = 0; i < targetCLASS.length; i++) {
                            if (document.getElementById(targetID).classList.contains(targetCLASS[i])) {
                                x.push(targetCLASS[i].replace(/pub/g,''));
                                }
                            }
                            return x.toString();
                       };
                        for (var i = 0; i < items.length; i++) {
                                contador++;
                                if (className == "oop") {
                                    items[i].id = "oop";
                                    pub.oop = googletag.defineOutOfPageSlot('/4458504/OOP/' + dfpSection, 'oop').addService(googletag.pubads());
                                }

                                if (className == "pubHorz") {
                                    targetID = className + contador;
                                    items[i].id = targetID;
                                    if (contador == 1) {
										var horSize = googletag.sizeMapping().addSize([0, 0], [[320, 100], [320, 160],[300, 120], [320, 50], [300, 100], [300, 50], [300,75], [300,50], [234,60], [125,125],"fluid"]).addSize([768, 200], [[728, 90], [738, 120], [468, 60], "fluid"]).addSize([1024, 200],[[1140, 220], [1140, 120], [970, 250], [840, 250], [800, 250], [728, 90], [468, 60], "fluid"]).build();
										pub.horz[i] = googletag.defineSlot("/4458504/Horz/" + dfpSection, [[1140, 220], [1140, 120], [970, 250],[840, 250],[800, 250], [738, 120], [728, 90], [468, 60], [320, 100], [320, 160], [300, 120], [320, 50], [300, 100], [300, 50], [300,75], [300,50], [234,60], [125,125]], "pubHorz" + contador).defineSizeMapping(horSize).setTargeting("pos", ["ATF", tgt()]).addService(googletag.pubads());
									} else {
										pub.horz[i] = googletag.defineSlot("/4458504/Horz/" + dfpSection,  [[1140, 220], [1140, 120], [970, 250],[840, 250],[800, 250], [738, 120], [728, 90], [468, 60], [320, 100], [320, 160], [300, 120], [320, 50], [300, 100], [300, 50], [300,75], [300,50], [234,60], [125,125],"fluid"], "pubHorz" + contador).defineSizeMapping(horSize).setTargeting("pos", ["BTFhorz" + Number(contador - 1), tgt()]).addService(googletag.pubads());
									}
                                }
                                if (className == "pubVert") {
                                    targetID = className + contador;
                                    items[i].id = targetID;
									if (contador == 1) {
										var verSize = googletag.sizeMapping().addSize([0, 0], [[300, 250], [300, 600], [300, 130], [300, 60], [200, 200], [250, 250], [320,160], [320,50], [320,100], [300,50], [300,100], [300,75],[234,60], [180,150], [125,125],"fluid"]).addSize([768, 200], [[300, 600], [300, 250], [300, 130], [300, 60], [200, 200], [250, 250], [300,50], [300,100], [300,75],[234,60], [180,150], [125,125],"fluid"]).build();
										pub.vert[i] = googletag.defineSlot("/4458504/Vert/" + dfpSection, [[300, 600], [300, 250], [300, 130], [300, 60], [200, 200], [250, 250], [320,50], [320,100], [320,160], [300,50], [300,100], [300,75], [234,60], [180,150], [125,125], "fluid"], "pubVert" + contador).defineSizeMapping(verSize).setTargeting("pos", ["ATF", tgt()]).addService(googletag.pubads());
									} else {
										pub.vert[i] = googletag.defineSlot("/4458504/Vert/" + dfpSection, [[300, 600], [300, 250], [300, 130], [300, 60], [200, 200], [250, 250], [320,50], [320,100], [320,160], [300,50], [300,100], [300,75], [234,60], [180,150], [125,125], "fluid"], "pubVert" + contador).defineSizeMapping(verSize).setTargeting("pos", ["BTFvert" + Number(contador - 1), tgt()]).addService(googletag.pubads());
									}
                                }
                       }
                    }
                };

                units("oop", contador);
                units("pubHorz", contador);
                units("pubVert", contador);


                googletag.pubads().addEventListener("slotRequested", function (event) {
                    var x = event.slot.getAdUnitPath();
                       if ((x.indexOf("/Horz")>4) || (x.indexOf("/Vert")>4)) {
                        document.getElementById(event.slot.getSlotElementId()).classList.remove("pubtxt", "\u2714");
                    }
                });
                googletag.pubads().addEventListener("slotRenderEnded", function (event) {
                    var x = !event.isEmpty && event.slot;
                    if (x != pub.oop) {
                        document.getElementById(event.slot.getSlotElementId()).classList.add("pubtxt");
                    }
                });
                googletag.pubads().addEventListener("impressionViewable", function (event) {
                    if (!event.isEmpty && event.slot != pub.oop) {
                        document.getElementById(event.slot.getSlotElementId()).classList.add("\u2714");
                        if (event.slot.getTargeting("pos").indexOf("Autorefresh") >-1 ) {
                            setTimeout(function(){
                                googletag.pubads().refresh([event.slot], {changeCorrelator: true});
                            }, 60000);
                        }
                    }
                });
               // googletag.disablePublisherConsole();
                googletag.pubads().enableVideoAds();
                googletag.pubads().enableSingleRequest();
                googletag.pubads().enableAsyncRendering();
                googletag.pubads().setCentering(true);
                googletag.pubads().disableInitialLoad();
                googletag.pubads().collapseEmptyDivs(true, true);
                googletag.enableServices();
                if (document.getElementById("oop")) {googletag.display("oop")};
                for (var i = 0; i < q_horz; i++) {pos_vert[i] = googletag.display("pubHorz" + q_horz)};
                for (var i = 0; i < q_vert; i++) {pos_horz[i] = googletag.display("pubVert" + q_vert)};
                function r() {googletag.pubads().refresh()};
                
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
