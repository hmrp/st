"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8416],{38416:function(e,t,a){a.d(t,{k:function(){return m}});var n,i=a(67294),r=a(5152),l=a.n(r);a(84760);function s(){return s=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n])}return e},s.apply(this,arguments)}var c=function(e){return i.createElement("svg",s({width:24,height:24,fill:"none"},e),n||(n=i.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M4.334 4.349a1.141 1.141 0 011.615 0l6.044 6.049 6.044-6.05a1.142 1.142 0 111.614 1.617l-6.043 6.049 6.043 6.05a1.143 1.143 0 01-1.614 1.615l-6.044-6.049-6.044 6.05a1.141 1.141 0 01-1.615-1.617l6.044-6.049-6.044-6.05a1.143 1.143 0 010-1.615z",fill:"#31548B"})))},o=(a(1826),a(76281)),d=a(41664),u=a.n(d),h=a(93181),p=a(85893),f=l()({loader:function(){return Promise.resolve().then(a.bind(a,84760))},ssr:!0,loadableGenerated:{webpack:function(){return[84760]}}}),m=function(e){var t=e.articleData,a=e.pageNum,n=(0,h.r)().setLoading;return(0,p.jsxs)("div",{className:"post-container post-gallery-container is-full",children:[(0,p.jsx)("div",{className:"post-gallery-header",children:(0,p.jsx)("div",{className:"container",children:(0,p.jsx)(u(),{href:(0,o.pd)(t.data.pathData),children:(0,p.jsxs)("a",{onClick:function(e){return(0,o.c1)(e,n)},className:"close-gallery",children:[(0,p.jsx)("span",{children:"Fechar galeria de fotos"}),(0,p.jsx)(c,{})]})})})}),(0,p.jsx)("main",{children:(0,p.jsx)("div",{className:"single-layout layout-gallery",children:(0,p.jsx)("div",{className:"container",children:(0,p.jsxs)("div",{className:"row align-items-start justify-content-between",children:[(0,p.jsx)("div",{className:"col-12 col-xl-3 sidebar",children:(0,p.jsx)("div",{})}),(0,p.jsx)("div",{className:"col-12 col-xl-9 main-content",children:(0,p.jsx)("div",{className:"row single-news-content",children:(0,p.jsxs)("div",{className:"col-12 col-lg-12 col-xl-12",children:[(0,p.jsx)("br",{}),(0,p.jsx)("article",{className:"single-news",children:(0,p.jsx)(f,{data:t.data,page:a-1},"post-dynamic-content")})]})})})]})})})})]})}},84760:function(e,t,a){a.r(t),a.d(t,{GalleryPostContent:function(){return D},default:function(){return L}});var n,i,r=a(67294),l=a(4099),s=a(67677);function c(){return c=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n])}return e},c.apply(this,arguments)}var o=function(e){return r.createElement("svg",c({width:40,height:40,fill:"none"},e),n||(n=r.createElement("rect",{width:40,height:40,rx:10,fill:"#31548B"})),i||(i=r.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M24.29 23.603l4.438 4.703a1.015 1.015 0 01-.027 1.415.967.967 0 01-1.388-.028l-4.472-4.739a7.352 7.352 0 01-4.313 1.389C14.378 26.343 11 22.9 11 18.67c0-4.229 3.377-7.67 7.528-7.67s7.529 3.441 7.529 7.671c0 1.81-.626 3.55-1.767 4.932zm-.197-4.932c0-3.126-2.497-5.67-5.565-5.67-3.068 0-5.564 2.544-5.564 5.67 0 3.127 2.496 5.67 5.564 5.67 3.069 0 5.565-2.543 5.565-5.67z",fill:"#fff"})))},d=a(11163),u=a(25675),h=a.n(u),p=a(76281),f=function(e,t){(0,r.useEffect)((function(){var a=function(a){e.every((function(e){return"escape"===e&&"Escape"==a.key||"right"===e&&"ArrowRight"==a.key||"left"===e&&"ArrowLeft"==a.key||"string"===typeof e&&a.key.toLowerCase()===e}))&&t()};return window.addEventListener("keydown",a),function(){window.removeEventListener("keydown",a)}}),[e,t])},m=a(85893),v=r.createRef(),g=r.createRef(),j=r.createRef();var x,w,b=function(e){var t=e.data,a=e.items,n=e.selected,i=void 0===n?0:n,l=(0,r.useState)(!1),c=l[0],u=l[1],x=(0,r.useState)(i),w=x[0],b=x[1],y=(0,d.useRouter)();if(f(["escape"],(function(){return u(!1)})),f(["right"],(function(){return _(w+1)})),f(["left"],(function(){return _(w-1)})),(0,r.useEffect)((function(){if(i>0&&(v.current.splide.go(i),window.innerWidth<960)){var e=document.querySelector("#main-item-"+i),t=e?e.getBoundingClientRect().top+window.pageYOffset+-70:0;window.scrollTo({top:t,behavior:"smooth"})}}),[]),!a)return null;var N={perPage:1,autoHeight:!0,type:"slide",arrows:!0,pagination:!1,start:null!==i&&void 0!==i?i:0,breakpoints:{640:{destroy:!0}}},k={perPage:6,autoHeight:!0,type:"slide",arrows:!1,pagination:!1,start:i},O={perPage:1,autoHeight:!0,type:"slide",arrows:!0,pagination:!1,start:null!==w&&void 0!==w?w:0,breakpoints:{640:{destroy:!0}}},E=function(e){v.current.splide&&v.current.splide.go(e)},_=function(e){c&&j.current.splide&&j.current.splide.go(e)};return(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(s.tv,{ref:v,options:N,onMove:function(e,a,n){b(a),g.current.splide.go(a),y.push((0,p.rD)(t.pathData,a+1),void 0,{scroll:!1,shallow:!0})},"aria-label":"Gallery",children:a.map((function(e,t){return(0,m.jsxs)(s.jw,{children:[(0,m.jsxs)("div",{className:"main-image-wrapper",id:"main-item-".concat(t),children:[(0,m.jsx)("img",{src:e.urls.uploaded.embed,alt:e.caption,style:{maxHeight:"500px",width:"auto",height:"100%",objectFit:"cover"}}),(0,m.jsx)("img",{className:"main-bg-blur",src:e.urls.uploaded.embed,style:{maxHeight:"500px",height:"auto",width:"100%",objectFit:"cover"}}),(0,m.jsx)("a",{className:"zoom-image",children:(0,m.jsx)(o,{onClick:function(){return function(e){b(e),u(!c)}(t)}})})]}),(0,m.jsxs)("span",{className:"gallery-counter",children:[(0,m.jsx)("b",{children:t+1}),"/",a.length]}),(0,m.jsx)("span",{className:"gallery-alt",children:e.alt}),(0,m.jsx)("span",{className:"gallery-caption",children:e.description})]},"splide-splide-".concat(e.id))}))}),(0,m.jsx)(s.tv,{ref:g,options:k,className:"splide-thumb-wrapper","aria-label":"Thumbs",children:a.map((function(e,t){return(0,m.jsx)(s.jw,{children:(0,m.jsx)(h(),{id:"splide-thumb-"+t,className:w==t?"splide-thumbnail splide-thumbnail-active":"splide-thumbnail",onClick:function(){return E(t)},src:"".concat(e.urls.uploaded.original,"?operations=fit(360:)"),alt:e.caption,width:120,height:120,style:{maxHeight:"120px",objectFit:"cover"}})},"splide-splide-".concat(e.id))}))}),c&&(0,m.jsxs)("div",{className:"zoom-popup",children:[(0,m.jsx)("div",{className:"zoom-header",children:(0,m.jsx)("button",{onClick:function(){return u(!c)},className:"close-top-story-popup",children:"X"})}),(0,m.jsx)("div",{className:"zoom-popup-inner",children:(0,m.jsx)(s.tv,{ref:j,options:O,onMove:function(e,a,n){E(a),b(a),y.push((0,p.rD)(t.pathData,a+1),void 0,{scroll:!1,shallow:!0})},"aria-label":"Zoom Gallery",children:a.map((function(e,t){return(0,m.jsx)(s.jw,{children:(0,m.jsx)("div",{className:"zoom-image-wrapper",children:(0,m.jsx)("img",{src:"".concat(e.urls.uploaded.original,"?operations=fit(1280:0)"),alt:e.caption,style:{maxWidth:"100%",width:"auto",height:"100%",objectFit:"contain"}})})},"splide-splide-".concat(e.id))}))})})]})]})};function y(){return y=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n])}return e},y.apply(this,arguments)}var N,k=function(e){return r.createElement("svg",y({width:35,height:35,fill:"none"},e),x||(x=r.createElement("rect",{width:35,height:35,rx:17.5,fill:"#3A559F"})),w||(w=r.createElement("path",{d:"M21.517 8.459l-2.255-.004c-2.535 0-4.173 1.636-4.173 4.167v1.92h-2.268a.35.35 0 00-.355.346v2.784c0 .19.159.345.355.345h2.268v7.023c0 .19.159.345.355.345h2.96a.35.35 0 00.354-.345v-7.023h2.652a.35.35 0 00.355-.345l.001-2.784a.34.34 0 00-.104-.244.36.36 0 00-.25-.101h-2.654v-1.629c0-.782.192-1.18 1.24-1.18h1.52a.35.35 0 00.354-.346V8.804a.35.35 0 00-.355-.345z",fill:"#fff"})))};function O(){return O=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n])}return e},O.apply(this,arguments)}var E,_=function(e){return r.createElement("svg",O({className:"twitter_svg__footer-soc-links twitter_svg__footer-soc-twitter",width:35,height:35,fill:"none"},e),N||(N=r.createElement("path",{d:"M26.812 11.783c-.63.295-1.3.49-2 .585a3.647 3.647 0 001.527-2.046 6.678 6.678 0 01-2.2.896c-.637-.723-1.544-1.171-2.534-1.171-1.921 0-3.467 1.663-3.467 3.701 0 .294.023.576.08.844-2.884-.15-5.437-1.624-7.151-3.87a3.918 3.918 0 00-.475 1.87c0 1.282.619 2.418 1.541 3.076a3.264 3.264 0 01-1.567-.456v.04c0 1.799 1.202 3.293 2.78 3.637a3.26 3.26 0 01-.91.122c-.223 0-.447-.014-.657-.064.45 1.466 1.725 2.543 3.242 2.578a6.7 6.7 0 01-5.132 1.528 9.33 9.33 0 005.322 1.66c6.384 0 9.875-5.64 9.875-10.53 0-.164-.006-.322-.013-.479a7.193 7.193 0 001.739-1.92z",fill:"#fff"})))};function z(){return z=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n])}return e},z.apply(this,arguments)}var R,C=function(e){return r.createElement("svg",z({width:24,height:25,fill:"none"},e),E||(E=r.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M5 4.5a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1v-5a1 1 0 00-1-1H5zm0 9a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1v-5a1 1 0 00-1-1H5zm8-8a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-5a1 1 0 01-1-1v-5zm1 8a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1v-5a1 1 0 00-1-1h-5z",fill:"#31548B"})))};function H(){return H=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n])}return e},H.apply(this,arguments)}var P=function(e){return r.createElement("svg",H({width:24,height:25,fill:"none"},e),R||(R=r.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M14.2 8.563c0-.299.116-.585.322-.796.207-.21.486-.33.778-.33.292 0 .571.12.778.33a1.14 1.14 0 010 1.591c-.207.21-.486.33-.778.33-.292 0-.572-.12-.778-.33a1.138 1.138 0 01-.322-.796zm.825 3.656L18.6 17H5.4l4.97-6.961 3.12 4.29 1.535-2.11zm5.775 5.906c0 .298-.116.584-.322.795a1.09 1.09 0 01-.778.33H4.3c-.292 0-.572-.119-.778-.33a1.138 1.138 0 01-.322-.795V6.875c0-.298.116-.584.322-.795.206-.211.486-.33.778-.33h15.4c.292 0 .572.119.778.33.206.21.322.497.322.795v11.25zm0-14.625H3.2c-.583 0-1.143.237-1.556.659A2.276 2.276 0 001 5.75v13.5c0 .597.232 1.17.644 1.591.413.422.973.659 1.556.659h17.6c.584 0 1.143-.237 1.556-.659.412-.422.644-.994.644-1.591V5.75c0-.597-.232-1.17-.644-1.591A2.175 2.175 0 0020.8 3.5z",fill:"#31548B"})))},D=function(e){var t=e.data,a=e.page,n=(0,r.useState)(""),i=n[0],s=n[1],c=(0,r.useState)(!0),o=c[0],u=c[1],h=(0,r.useState)(a),f=h[0],v=h[1],g=["poll"],j=function(){return u(!o)},x=(0,d.useRouter)();(0,r.useEffect)((function(){var e=window.location.href.split("?")[0];s(e)}),[]);return t&&t.body?(0,m.jsxs)("div",{className:"single-news-content",id:"single-news-content",children:[t.body.map((function(e,a){return!e.data||g.includes(e.type)?null:"gallery"===e.type?(0,m.jsxs)("div",{children:[(0,m.jsx)("h1",{className:"gallery-page-title",children:e.data.preview.gallery.title}),(0,m.jsxs)("div",{className:"gallery-page-meta",children:[(0,m.jsxs)("div",{className:"gallery-box",children:[(0,m.jsx)("span",{children:"Compartilhar:"}),(0,m.jsx)("a",{href:"https://www.facebook.com/share.php?u=".concat(i,"?utm_medium=social&utm_source=facebook&utm_campaign=share-button"),id:"fb-share",target:"_blank",title:"facebook",className:"share-link social-share tooltip-wrapper","cmp-ltrk":"Najnov\u0161ie vide\xe1","cmp-ltrk-idx":5,children:(0,m.jsx)(k,{})}),(0,m.jsx)("a",{href:"https://twitter.com/intent/tweet?url=".concat(i,"?utm_medium=social&utm_source=twitter&utm_campaign=share-button"),id:"tw-share",target:"_blank",title:"Twitter",className:"share-link social-share tooltip-wrapper","cmp-ltrk":"Najnov\u0161ie vide\xe1","cmp-ltrk-idx":6,children:(0,m.jsx)(_,{})})]}),(0,m.jsxs)("div",{className:"gallery-box btn-box",onClick:j,children:[o?(0,m.jsx)(C,{}):(0,m.jsx)(P,{}),(0,m.jsx)("span",{children:"Lista de fotos"})]})]}),o?(0,m.jsx)(b,{data:t,selected:f,items:null===(n=e.data.preview)||void 0===n||null===(r=n.gallery)||void 0===r?void 0:r.items}):(0,m.jsx)("div",{className:"gallery-grid-wrapper",children:e.data.preview.gallery.items.map((function(e,a){return(0,m.jsx)("div",{onClick:function(e){x.push((0,p.rD)(t.pathData,a+1),void 0,{scroll:!1,shallow:!0}),function(){v(arguments.length>0&&void 0!==arguments[0]?arguments[0]:0),j()}(a)},className:"grid-image-wrapper","data-key":a,children:(0,m.jsx)("img",{src:e.urls.uploaded.embed,alt:e.caption})},a)}))})]},a):void(0,p.o$)("msg","UNKNOWN BODY BLOCK:",e);var n,r})),t.main_media.map((function(e,t){if("gallery"===e.resource_type)return(0,m.jsx)("div",{className:"after-article-slider",children:(0,m.jsx)(l.Z,{items:e.data.items})},"splide-container-gallery-".concat(t))}))]}):(0,m.jsx)("div",{children:"Loading..."})},L=D}}]);