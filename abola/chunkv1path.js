(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
    [3538], {
        90266: function(a, e, t) {
            "use strict";
            t.r(e), t.d(e, {
                __N_SSP: function() {
                    return O
                },
                default: function() {
                    return T
                }
            });
            var s = t(59499),
                i = t(17674),
                l = t(6570),
                c = t(16324),
                o = t(38416),
                d = t(76141),
                r = (t(67294), t(82109)),
                n = (t(43823), t(1826), t(77305)),
                m = t(5987),
                v = t(96780),
                u = t(76281),
                h = t(85893),
                p = function(a) {
                    var e, t, s, i, c = a.data,
                        o = !1;
                    (0, u.xb)(null === (e = c.relatedData) || void 0 === e ? void 0 : e.data) || (null === (i = c.relatedData) || void 0 === i || i.data.map((function(a, e) {
                        "video" === a.type && (o = !0)
                    })));
                    return (0, h.jsxs)("section", {
                        className: "related-videos",
                        children: [o && (0, h.jsx)("div", {
                            className: "page-header mb-0",
                            children: (0, h.jsx)("h2", {
                                children: "V\xeddeos relacionados"
                            })
                        }), (0, h.jsx)("div", {
                            className: "related-news clearfix",
                            children: !(0, u.xb)(null === (t = c.relatedData) || void 0 === t ? void 0 : t.data) && (null === (s = c.relatedData) || void 0 === s ? void 0 : s.data.map((function(a, e) {
                                var t;
                                if ("video" === a.type) return (0, h.jsx)("div", {
                                    className: "col-lg-3 col-md-6 col-xs-12 intext-news pad-l-r",
                                    children: (0, h.jsx)(l.Zb, {
                                        item: a.data.articleData,
                                        class_name: "top-item ".concat(null === (t = a.data.articleData.pathData) || void 0 === t ? void 0 : t.extra_class),
                                        type: "video"
                                    })
                                }, "related-posts-" + e)
                            })))
                        })]
                    })
                },
                x = t(58162),
                j = t(35043),
                g = t(50335),
                N = t(43859),
                D = t(326),
                y = t(93360),
                b = t(24368),
                f = function(a) {
                    var e = a.latestData;
                    return (0, h.jsx)("div", {
                        className: "abola-tv-schedule-widget mb-15 clearfix",
                        children: (0, h.jsxs)("div", {
                            className: "abolatv-programacao",
                            children: [(0, h.jsx)("div", {
                                className: "clearfix padding-0 relative with-sec-title",
                                children: (0, h.jsx)("div", {
                                    className: "col-md-9 padding-0",
                                    children: (0, h.jsx)("h3", {
                                        className: "vermelho titulo-direita mt-5 fs-26 mb-5",
                                        children: "Programa\xe7\xe3o do dia"
                                    })
                                })
                            }), (0, h.jsx)("div", {
                                id: "body_NoticiasbolaTV_ProgramacaoBolaTv_mostraProgramacaoTv",
                                className: "border-top spacing-top m-0",
                                children: e.data.data.length && e.data.data.map((function(a, e) {
                                    return (0, h.jsxs)("div", {
                                        children: [(0, h.jsxs)("span", {
                                            id: "body_NoticiasbolaTV_ProgramacaoBolaTv_rptProgramacaoDia_lblHora_54",
                                            className: "horaProgramacao",
                                            children: [(0, b.Z)(a.tv_date).format("HH:mm"), " -", " "]
                                        }), (0, h.jsx)("span", {
                                            id: "body_NoticiasbolaTV_ProgramacaoBolaTv_rptProgramacaoDia_lblPrograma_54",
                                            className: "temaProgramacao",
                                            children: a.title
                                        })]
                                    }, "schedule".concat(e))
                                }))
                            })]
                        })
                    })
                },
                _ = t(18509),
                P = t(57687),
                w = function(a) {
                    var e, t, s = a.catArticlesData,
                        i = a.latestData,
                        l = a.catData,
                        o = a.videosData,
                        d = a.sidebar;
                    return s.data && s.data.length ? (0, h.jsxs)("div", {
                        className: "category-container is-full row ".concat(null !== (e = l.entity_type) && void 0 !== e ? e : "", " ").concat(null !== (t = l.type) && void 0 !== t ? t : ""),
                        children: [(0, h.jsx)("div", {
                            className: "banner-centered billboard-centered",
                            children: (0, h.jsx)(j.Z, {
                                id: "mastheadCategory"
                            })
                        }), (0, h.jsxs)("section", {
                            className: "category-section",
                            children: [(0, h.jsx)(N.Z, {
                                archive: l,
                                imageExists: null === l || void 0 === l ? void 0 : l.imageExists,
                                imageSrc: null === l || void 0 === l ? void 0 : l.imageSrc,
                                hasSubMenus: !1,
                                hasTabs: !1
                            }, "category-header"), (0, h.jsxs)("div", {
                                className: "destaques-direita",
                                children: [(0, h.jsxs)("div", {
                                    className: "col-md-8 col-sm-6 col-xs-12 pad-l-r mt-18",
                                    children: [(0, h.jsx)("div", {
                                        className: "column-list",
                                        children: null === s || void 0 === s ? void 0 : s.data.map((function(a, e) {
                                            var t, s;
                                            return (0, h.jsx)(h.Fragment, {
                                                children: (0, h.jsx)(y.Zb, {
                                                    item: a,
                                                    item_type: null !== (t = l.type) && void 0 !== t ? t : "",
                                                    class_name: "top-item ".concat(null === (s = a.pathData) || void 0 === s ? void 0 : s.extra_class),
                                                    meta: a.meta,
                                                    type: "one-line"
                                                }, "list-item-".concat(e))
                                            })
                                        }))
                                    }), (0, h.jsx)("section", {
                                        className: "pagination-section border-top",
                                        children: (0, h.jsx)(D.Z, {
                                            meta: null === s || void 0 === s ? void 0 : s.meta
                                        })
                                    })]
                                }), (0, h.jsx)("div", {
                                    className: "col-md-4 col-sm-6 col-xs-12 pad-l-r  spacing-top",
                                    children: d ? "1" == d ? (0, h.jsxs)(h.Fragment, {
                                        children: [(0, h.jsx)(n.F, {
                                            latestData: i
                                        }), (0, h.jsx)("div", {
                                            className: "diaf-widget mb-15 clearfix",
                                            children: (0, h.jsx)("div", {
                                                className: "mrec show-default",
                                                children: (0, h.jsx)(j.Z, {
                                                    id: "mrecCategoryPage1",
                                                    isLazy: !0
                                                })
                                            })
                                        }), (0, h.jsx)(_.e, {
                                            videosData: o
                                        }), (0, h.jsx)("div", {
                                            className: "mrec show-default banner-centered d-only",
                                            children: (0, h.jsx)(j.Z, {
                                                id: "mrecSportEntityPage2",
                                                isLazy: !0
                                            })
                                        }), (0, h.jsx)("div", {
                                            className: "mrec show-default banner-centered m-only",
                                            children: (0, h.jsx)(j.Z, {
                                                id: "mrecSportEntityPage2Mob",
                                                isLazy: !0
                                            })
                                        }), (0, h.jsx)(P.b, {
                                            latestData: i
                                        })]
                                    }) : (0, h.jsx)(h.Fragment, {}) : (0, h.jsxs)(h.Fragment, {
                                        children: [(0, h.jsx)("div", {
                                            className: "col-12 mt--15 widget-container",
                                            children: (0, h.jsx)(_.e, {
                                                videosData: o
                                            })
                                        }), (0, h.jsx)("div", {
                                            className: "col-12 mt-28 widget-container",
                                            children: (0, h.jsx)(P.b, {
                                                latestData: s
                                            })
                                        })]
                                    })
                                })]
                            })]
                        })]
                    }) : (0, h.jsx)(c.H, {
                        title: l.title
                    })
                };

            function S(a, e) {
                var t = Object.keys(a);
                if (Object.getOwnPropertySymbols) {
                    var s = Object.getOwnPropertySymbols(a);
                    e && (s = s.filter((function(e) {
                        return Object.getOwnPropertyDescriptor(a, e).enumerable
                    }))), t.push.apply(t, s)
                }
                return t
            }

            function Z(a) {
                for (var e = 1; e < arguments.length; e++) {
                    var t = null != arguments[e] ? arguments[e] : {};
                    e % 2 ? S(Object(t), !0).forEach((function(e) {
                        (0, s.Z)(a, e, t[e])
                    })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(a, Object.getOwnPropertyDescriptors(t)) : S(Object(t)).forEach((function(e) {
                        Object.defineProperty(a, e, Object.getOwnPropertyDescriptor(t, e))
                    }))
                }
                return a
            }
            var C = {
                    Post: {
                        component: l.s6,
                        props: ["postId", "articleData", "popularData", "videosData", "moreCatData", "categoryPaths", "matchesData", "latestData", "destaqueData"]
                    },
                    Page: {
                        component: d.l,
                        props: ["postId", "articleData", "popularData", "videosData", "moreCatData", "categoryPaths", "matchesData", "latestData"]
                    },
                    Video: {
                        component: function(a) {
                            var e = a.articleData,
                                t = a.latestData,
                                s = a.categoryPaths,
                                i = a.moreCatData,
                                l = a.categories,
                                c = s.categoryPath;





                                
                            return (0, h.jsx)("div", {
                                className: "post-container is-full row video-post",
                                children: (0, h.jsxs)("section", {
                                    id: "VerNoticia",
                                    children: [(0, h.jsxs)("div", {
                                        className: "col-md-12 ",
                                        children: [(0, h.jsx)("div", {
                                            className: "col-md-8 pad-r",
                                            style: {
                                                paddingLeft: 0
                                            },
                                            children: (0, h.jsx)("section", {
                                                id: "Noticia",
                                                children: (0, h.jsx)("div", {
                                                    id: "body_Ver_pnlNoticia",
                                                    children: (0, h.jsxs)("div", {
                                                        className: "col-md-12 pad-l-0",
                                                        children: [(0, h.jsx)("div", {
                                                            id: "body_Ver_divImgNoticia",
                                                            className: "noticia",
                                                            children: (0, h.jsx)(r.Gh, {
                                                                data: e.data,
                                                                categoryPaths: s
                                                            }, "post-header")
                                                        }), (0, h.jsx)(r.nJ, {
                                                            data: e.data,
                                                            categoryPath: c,
                                                            showAuthor: !1
                                                        })]
                                                    })
                                                })
                                            })
                                        }), (0, h.jsxs)("div", {
                                            className: "col-md-4 pad-l destaques-direita",
                                            children: [(0, h.jsx)(x.S, {
                                                categories: l
                                            }), (0, h.jsx)("div", {
                                                className: "diaf-widget mb-15 clearfix",
                                                children: (0, h.jsx)("div", {
                                                    className: "banner-centered",
                                                    children: (0, h.jsx)(j.Z, {
                                                        id: "native-noticias-1"
                                                    })
                                                })
                                            })]
                                        })]
                                    }), (0, h.jsx)("div", {
                                        className: "col-12",
                                        children: (0, h.jsx)(p, {
                                            data: e.data,
                                            latestData: t
                                        })
                                    }), (0, h.jsxs)("div", {
                                        className: "col-md-12 mt-15",
                                        children: [(0, h.jsx)("div", {
                                            className: "col-md-8 pad-r",
                                            style: {
                                                paddingLeft: 0
                                            },
                                            children: (0, h.jsx)("section", {
                                                id: "Noticia",
                                                children: (0, h.jsxs)("div", {
                                                    id: "body_Ver_pnlNoticia",
                                                    children: [(0, h.jsx)("div", {
                                                        className: "col-md-12 pad-l-0",
                                                        children: (0, h.jsxs)("div", {
                                                            className: "col-md-12",
                                                            children: [(0, h.jsx)(v.Z, {
                                                                data: e.data,
                                                                showTags: !1
                                                            }), (0, h.jsx)(m.Z, {
                                                                moreCatData: i,
                                                                catTitle: "Mais recente",
                                                                type: "video"
                                                            })]
                                                        })
                                                    }), (0, h.jsx)("div", {
                                                        id: "videoModal"
                                                    })]
                                                })
                                            })
                                        }), (0, h.jsx)("div", {
                                            className: "col-md-4 pad-l destaques-direita",
                                            children: (0, h.jsxs)("div", {
                                                className: "visible-md visible-lg visible-xs",
                                                children: [(0, h.jsx)(n.F, {
                                                    latestData: t
                                                }), (0, h.jsx)("div", {
                                                    className: "diaf-widget mb-15 clearfix",
                                                    children: (0, h.jsx)("div", {
                                                        className: "mrec show-default",
                                                        id: "mrecHpGeral1"
                                                    })
                                                })]
                                            })
                                        }), (0, h.jsx)("div", {
                                            id: "videoLayer"
                                        }), (0, h.jsx)("div", {
                                            id: "pushdown-nnh"
                                        })]
                                    })]
                                })
                            })






                        },
                        props: ["postId", "articleData", "popularData", "videosData", "moreCatData", "categoryPaths", "matchesData", "latestData", "videoPostData", "categories"]
                    },
                    GalleryPost: {
                        component: o.k,
                        props: ["postId", "articleData", "videosData", "moreCatData", "categoryPaths", "pageNum"]
                    },
                    Home: {
                        component: l.Uv,
                        props: ["articleData", "aktualityFeedData", "hernazonaFeedData", "popularData", "latestData", "listsData", "tvProgramFeedData", "matchesTableData", "standingsTableData", "transfersData"]
                    },
                    Cat: {
                        component: l.GU,
                        props: ["categorySlug", "catArticlesData", "catData", "categoryMenuData", "videosData", "latestData", "pageNumber"]
                    },
                    VideoCat: {
                        component: g.y,
                        props: ["categorySlug", "catArticlesData", "catData", "videosData", "latestData", "pageNumber", "categories"]
                    },
                    AbolaTVCat: {
                        component: function(a) {
                            var e, t = a.catArticlesData,
                                s = a.latestData,
                                i = a.catData,
                                l = a.tvSchedule;
                            if (!t.data || !t.data.length) return (0, h.jsx)(c.H, {
                                title: i.title
                            });
                            var o = null === t || void 0 === t ? void 0 : t.data.slice(1, 9);
                            return (0, h.jsx)("div", {
                                className: "category-container is-full row",
                                children: (0, h.jsxs)("section", {
                                    className: "category-section",
                                    children: [(0, h.jsx)(N.Z, {
                                        archive: i,
                                        imageExists: null === i || void 0 === i ? void 0 : i.imageExists,
                                        imageSrc: null === i || void 0 === i ? void 0 : i.imageSrc,
                                        hasSubMenus: !1
                                    }, "category-header"), (0, h.jsx)("div", {
                                        className: "col-12",
                                        children: (0, h.jsx)("div", {
                                            className: "SeccaoA-2TopNews main-cat-card",
                                            children: (null === t || void 0 === t ? void 0 : t.data) && (null === t || void 0 === t ? void 0 : t.data[0]) && (0, h.jsx)(y.Zb, {
                                                item: null === t || void 0 === t ? void 0 : t.data[0],
                                                class_name: "top-item ".concat(null === t || void 0 === t || null === (e = t.data[0].pathData) || void 0 === e ? void 0 : e.extra_class),
                                                meta: null === t || void 0 === t ? void 0 : t.data[0].meta,
                                                type: "inline"
                                            })
                                        })
                                    }), (0, h.jsxs)("div", {
                                        className: "row flex-col-mb",
                                        children: [(0, h.jsxs)("div", {
                                            className: "col-md-8 pad-l-r",
                                            children: [(0, h.jsx)("div", {
                                                className: "SeccaoA-2TopNews",
                                                children: Array.from({
                                                    length: 4
                                                }).map((function(a, e) {
                                                    var t, s;
                                                    return (0, h.jsxs)("div", {
                                                        className: "col-12",
                                                        children: [(0, h.jsx)("div", {
                                                            className: "col-md-6 col-sm-6 pad-l-r",
                                                            children: o && o[2 * e] && (0, h.jsx)(y.Zb, {
                                                                item: o[2 * e],
                                                                class_name: "top-item ".concat(null === (t = o[2 * e].pathData) || void 0 === t ? void 0 : t.extra_class),
                                                                meta: o[2 * e].meta
                                                            })
                                                        }), (0, h.jsx)("div", {
                                                            className: "col-md-6 col-sm-6 pad-l-r",
                                                            children: o && o[2 * e + 1] && (0, h.jsx)(y.Zb, {
                                                                item: o[2 * e + 1],
                                                                class_name: "top-item ".concat(null === (s = o[2 * e + 1].pathData) || void 0 === s ? void 0 : s.extra_class),
                                                                meta: o[2 * e + 1].meta
                                                            })
                                                        })]
                                                    }, e)
                                                }))
                                            }), (0, h.jsx)("section", {
                                                className: "pagination-section border-top mt-18",
                                                children: (0, h.jsx)(D.Z, {
                                                    meta: null === t || void 0 === t ? void 0 : t.meta
                                                })
                                            })]
                                        }), s && (0, h.jsx)("div", {
                                            className: "col-md-4 pad-l-r destaques-direita",
                                            children: (0, h.jsx)("div", {
                                                className: "col-12 widget-container mt-10",
                                                children: (0, h.jsx)(f, {
                                                    latestData: l
                                                })
                                            })
                                        })]
                                    })]
                                })
                            })
                        },
                        props: ["categorySlug", "catArticlesData", "catData", "categoryMenuData", "latestData", "tvSchedule", "pageNumber"]
                    },
                    MercadoCat: {
                        component: w,
                        props: ["categorySlug", "catArticlesData", "catData", "latestData", "videosData", "pageNumber", "sidebar"]
                    },
                    OpinionCat: {
                        component: w,
                        props: ["categorySlug", "catArticlesData", "catData", "latestData", "videosData", "pageNumber", "sidebar"]
                    }
                },
                O = !0,
                T = function a(e) {
                    var t, s, o, d, r, n, m, v, u, p, x, j;
                    a.defaultProps = {
                        articleData: [],
                        aktualityFeedData: [],
                        hernazonaFeedData: [],
                        popularData: [],
                        tvProgramFeedData: [],
                        headData: [],
                        catArticlesData: [],
                        listsData: [],
                        catData: [],
                        videosData: [],
                        moreCatData: [],
                        categoryPaths: [],
                        matchesData: [],
                        categoryMenuData: [],
                        matchesTableData: [],
                        standingsTableData: [],
                        transfersData: [],
                        categories: []
                    };
                    var g = e.type,
                        N = e.matchesData,
                        D = C[g],
                        y = D ? D.component : c.H,
                        b = D ? Object.fromEntries(Object.entries(e).filter((function(a) {
                            var e = (0, i.Z)(a, 1)[0];
                            return D.props.includes(e)
                        }))) : {
                            title: "Desculpe, nenhum resultado encontrado!"
                        };
                    return (0, h.jsx)(l.Ar, {
                        type: g,
                        matchesData: N,
                        category: (null === (t = b.catData) || void 0 === t || null === (s = t.categoryPaths) || void 0 === s || null === (o = s.categoryPath) || void 0 === o ? void 0 : o.slug) || (null === (d = b.categoryPaths) || void 0 === d || null === (r = d.categoryPath) || void 0 === r ? void 0 : r.slug) || "",
                        categoryParent: (null === (n = b.categoryPaths) || void 0 === n || null === (m = n.categoryPath) || void 0 === m || null === (v = m.parent) || void 0 === v ? void 0 : v.slug) || (null === (u = b.catData) || void 0 === u || null === (p = u.categoryPaths) || void 0 === p || null === (x = p.categoryPath) || void 0 === x || null === (j = x.parent) || void 0 === j ? void 0 : j.slug) || "",
                        children: (0, h.jsx)(y, Z({}, b))
                    })
                }
        },
        50335: function(a, e, t) {
            "use strict";
            t.d(e, {
                y: function() {
                    return m
                }
            });
            var s = t(43859),
                i = t(326),
                l = t(16324),
                c = (t(67294), t(35043)),
                o = t(93360),
                d = t(18509),
                r = t(58162),
                n = t(85893),
                m = function(a) {
                    var e, t, m = a.catArticlesData,
                        v = a.videosData,
                        u = a.catData,
                        h = a.categories;
                    if (!m.data || !m.data.length) return (0, n.jsx)(l.H, {
                        title: u.title
                    });
                    var p = null !== (e = null === m || void 0 === m ? void 0 : m.data.slice(1, null === m || void 0 === m ? void 0 : m.data.length)) && void 0 !== e ? e : null;
                    return (0, n.jsx)("div", {
                        className: "category-container video-cat-container is-full row",
                        children: (0, n.jsxs)("section", {
                            className: "category-section",
                            children: [(0, n.jsx)("div", {
                                className: "banner-centered d-only banner-top",
                                children: (0, n.jsx)(c.Z, {
                                    id: "mastheadCategory"
                                })
                            }), (0, n.jsx)(s.Z, {
                                archive: u,
                                imageExists: null === u || void 0 === u ? void 0 : u.imageExists,
                                imageSrc: null === u || void 0 === u ? void 0 : u.imageSrc,
                                isVideoCategory: !0
                            }, "category-header"), (0, n.jsxs)("div", {
                                className: "row flex-col-mb",
                                children: [(0, n.jsx)("div", {
                                    className: "col-md-8 pad-l-r",
                                    children: (0, n.jsx)("div", {
                                        className: "SeccaoA-2TopNews main-cat-card",
                                        children: (null === m || void 0 === m ? void 0 : m.data) && (null === m || void 0 === m ? void 0 : m.data[0]) && (0, n.jsx)(o.Zb, {
                                            item: null === m || void 0 === m ? void 0 : m.data[0],
                                            class_name: "top-item ".concat(null === m || void 0 === m || null === (t = m.data[0].pathData) || void 0 === t ? void 0 : t.extra_class),
                                            meta: null === m || void 0 === m ? void 0 : m.data[0].meta,
                                            type: "inline"
                                        })
                                    })
                                }), (0, n.jsxs)("div", {
                                    className: "col-md-4 pad-l-r destaques-direita pt-18",
                                    children: [(0, n.jsx)(r.S, {
                                        categories: null !== h && void 0 !== h ? h : null
                                    }), (0, n.jsx)("div", {
                                        className: "mrec show-default",
                                        children: (0, n.jsx)(c.Z, {
                                            isLazy: !0,
                                            id: "mrecCategoryPage1"
                                        })
                                    })]
                                })]
                            }), (0, n.jsxs)("div", {
                                className: "most-recent-block",
                                children: [(0, n.jsxs)("div", {
                                    className: "col-md-8 col-sm-6 col-xs-12 pad-l-r spacing-top",
                                    children: [p && p.length ? (0, n.jsxs)("div", {
                                        className: "col-12",
                                        children: [(0, n.jsx)("div", {
                                            className: "clearfix padding-0 relative titulo-container",
                                            children: (0, n.jsx)("div", {
                                                className: "col-md-9 padding-0",
                                                children: (0, n.jsx)("h3", {
                                                    className: "vermelho titulo-direita mt-5 fs-26",
                                                    children: "Mais recente"
                                                })
                                            })
                                        }), Array.from({
                                            length: 4
                                        }).map((function(a, e) {
                                            var t, s;
                                            return (0, n.jsxs)("div", {
                                                className: "col-12 clearfix",
                                                children: [(0, n.jsx)("div", {
                                                    className: "col-md-6 col-sm-6 pad-l-r",
                                                    children: p && p[2 * e] && (0, n.jsx)(o.Zb, {
                                                        item: p[2 * e],
                                                        class_name: "top-item ".concat(null === (t = p[2 * e].pathData) || void 0 === t ? void 0 : t.extra_class),
                                                        meta: p[2 * e].meta
                                                    })
                                                }), (0, n.jsx)("div", {
                                                    className: "col-md-6 col-sm-6 pad-l-r",
                                                    children: p && p[2 * e + 1] && (0, n.jsx)(o.Zb, {
                                                        item: p[2 * e + 1],
                                                        class_name: "top-item ".concat(null === (s = p[2 * e + 1].pathData) || void 0 === s ? void 0 : s.extra_class),
                                                        meta: p[2 * e + 1].meta
                                                    })
                                                })]
                                            }, e)
                                        }))]
                                    }) : (0, n.jsx)(n.Fragment, {}), (0, n.jsx)("section", {
                                        className: "pagination-section border-top",
                                        children: (0, n.jsx)(i.Z, {
                                            meta: null === m || void 0 === m ? void 0 : m.meta
                                        })
                                    })]
                                }), (0, n.jsx)("div", {
                                    className: "col-md-4 col-sm-6 col-xs-12 pad-l-r  spacing-top",
                                    children: (0, n.jsxs)("div", {
                                        className: "col-12 mt--15 widget-container",
                                        children: [(0, n.jsx)(d.e, {
                                            videosData: v
                                        }), (0, n.jsx)("div", {
                                            className: "mrec show-default banner-centered d-only",
                                            children: (0, n.jsx)(c.Z, {
                                                isLazy: !0,
                                                id: "mrecSportEntityPage2"
                                            })
                                        }), (0, n.jsx)("div", {
                                            className: "banner-centered m-only",
                                            children: (0, n.jsx)(c.Z, {
                                                isLazy: !0,
                                                id: "mrecSportEntityPage2Mob"
                                            })
                                        })]
                                    })
                                })]
                            })]
                        })
                    })
                }
        },
        76141: function(a, e, t) {
            "use strict";
            t.d(e, {
                l: function() {
                    return o
                }
            });
            t(67294);
            var s = t(5152),
                i = t.n(s),
                l = (t(13529), t(1826), t(85893)),
                c = i()({
                    loader: function() {
                        return Promise.resolve().then(t.bind(t, 13529))
                    },
                    ssr: !0,
                    loadableGenerated: {
                        webpack: function() {
                            return [13529]
                        }
                    }
                }),
                o = function(a) {
                    var e = a.articleData;
                    return (0, l.jsx)("div", {
                        className: "post-container is-full row",
                        children: (0, l.jsx)("section", {
                            id: "VerNoticia",
                            children: (0, l.jsxs)("div", {
                                className: "col-md-12 ",
                                children: [(0, l.jsx)("div", {
                                    className: "col-md-12 pad-r",
                                    style: {
                                        paddingLeft: 0
                                    },
                                    children: (0, l.jsx)("section", {
                                        id: "Noticia",
                                        children: (0, l.jsxs)("div", {
                                            id: "body_Ver_pnlNoticia",
                                            children: [(0, l.jsxs)("div", {
                                                className: "col-md-12 pad-l-0",
                                                children: [(0, l.jsx)("h1", {
                                                    id: "body_Ver_lblTitulo",
                                                    className: "titulo",
                                                    children: e.data.title
                                                }), (0, l.jsx)("div", {
                                                    className: "col-md-12",
                                                    children: (0, l.jsx)("div", {
                                                        className: "col-md-12 col-sm-12 col-xs-12 noticia-contentor",
                                                        children: (0, l.jsx)("div", {
                                                            className: "corpo-noticia",
                                                            children: (0, l.jsx)("span", {
                                                                id: "body_Ver_lblNoticia",
                                                                style: {
                                                                    wordBreak: "break-word",
                                                                    width: "100%"
                                                                },
                                                                children: (0, l.jsx)(c, {
                                                                    data: e.data
                                                                }, "post-dynamic-content")
                                                            })
                                                        })
                                                    })
                                                })]
                                            }), (0, l.jsx)("div", {
                                                id: "videoModal"
                                            })]
                                        })
                                    })
                                }), (0, l.jsx)("div", {
                                    id: "videoLayer"
                                }), (0, l.jsx)("div", {
                                    id: "pushdown-nnh"
                                })]
                            })
                        })
                    })
                }
        },
        58162: function(a, e, t) {
            "use strict";
            t.d(e, {
                S: function() {
                    return d
                }
            });
            var s = t(67294),
                i = t(76281),
                l = t(11163),
                c = t(93181),
                o = t(85893),
                d = function(a) {
                    var e, t = a.categories,
                        d = (0, c.r)().setLoading,
                        r = (0, l.useRouter)(),
                        n = r.asPath,
                        m = new URL("http://abola.pt".concat(n)),
                        v = (0, s.useState)(m.pathname),
                        u = v[0],
                        h = v[1],
                        p = (0, s.useState)(null !== (e = r.query.q) && void 0 !== e ? e : ""),
                        x = p[0],
                        j = p[1],
                        g = (0, i.Vb)(t).map((function(a) {
                            return (0, o.jsx)("option", {
                                value: "/".concat(a.slug, "/videos"),
                                children: a.title
                            }, a.id)
                        })),
                        N = function() {
                            var a = "",
                                e = x.trim(),
                                t = u,
                                s = e ? "?q=".concat(encodeURIComponent(e)) : "";
                            ((0, i.c1)({
                                target: {
                                    pathname: "".concat(t),
                                    search: "".concat(s)
                                }
                            }, d), e) ? a = "".concat(u, "?q=").concat(encodeURIComponent(e)): a = u;
                            (t && t !== window.location.pathname || void 0 !== typeof s && s !== window.location.search) && r.push(a)
                        };
                    return (0, o.jsxs)("div", {
                        className: "col-12 mb-mt-15",
                        children: [(0, o.jsxs)("div", {
                            className: "video-forma d-none d-lg-block",
                            children: [(0, o.jsxs)("div", {
                                className: "input-group",
                                children: [(0, o.jsx)("input", {
                                    className: "form-control fs-13 gray-2 russo",
                                    id: "q",
                                    name: "q",
                                    placeholder: "Pesquisa",
                                    type: "text",
                                    value: x,
                                    onChange: function(a) {
                                        j(a.target.value)
                                    },
                                    onKeyDown: function(a) {
                                        "Enter" === a.key && N()
                                    }
                                }), (0, o.jsx)("div", {
                                    className: "input-group-append",
                                    children: (0, o.jsx)("button", {
                                        type: "button",
                                        className: "btn btn-outline-danger gray-2",
                                        onClick: N,
                                        children: (0, o.jsx)("i", {
                                            className: "abola-lupa"
                                        })
                                    })
                                })]
                            }), (0, o.jsxs)("div", {
                                className: "input-group my-3",
                                children: [(0, o.jsxs)("select", {
                                    className: "form-control gray-2 russo fs-13",
                                    value: u,
                                    onChange: function(a) {
                                        h(a.target.value)
                                    },
                                    children: [(0, o.jsx)("option", {
                                        value: "/miragens",
                                        children: "Categoria"
                                    }), g]
                                }), (0, o.jsx)("span", {
                                    className: "field-validation-valid error",
                                    "data-valmsg-for": "IdCategoria",
                                    "data-valmsg-replace": "true"
                                }), (0, o.jsx)("div", {
                                    className: "input-group-append",
                                    children: (0, o.jsx)("button", {
                                        type: "button",
                                        className: "btn btn-outline-danger gray-2 btn-sm russo",
                                        "data-html": "true",
                                        onClick: N,
                                        children: "OK"
                                    })
                                })]
                            })]
                        }), (0, o.jsx)("hr", {})]
                    })
                }
        },



        57331: function(a, e, t) {
            (window.__NEXT_P = window.__NEXT_P || []).push(["/[[...path]]", function() {
                return t(90266)
            }])
        }
    },
    function(a) {
        a.O(0, [8416, 9774, 2888, 179], (function() {
            return e = 57331, a(a.s = e);
            var e
        }));
        var e = a.O();
        _N_E = e
    }


]);