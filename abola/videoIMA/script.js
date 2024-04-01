window.Vlitejs.registerPlugin('sticky', window.VlitejsSticky, {
  mode: 'on',
  offset: 20,
  width: 400,
  ratio: 16 / 9
})


window.Vlitejs.registerPlugin("ima", window.VlitejsIma, {
  adTagUrl:
    "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=",
  updateImaSettings: (imaSettings) => {
    imaSettings.setLocale('pt');
  },
  DefaultAdsRenderingSettings: {
    "restoreCustomPlaybackStateOnAdBreakComplete": true,
    "enablePreloading": true,
    "uiElements": ["adAttribution", "countdown"]
  }
});


new window.Vlitejs("#player", {
 options: {
    controls: true,
    autoplay: true,
    playPause: true,
    progressBar: true,
    time: true,
    volume: true,
    fullscreen: false,
    poster: "https://yoriiis.github.io/cdn/static/vlitejs/demo-poster.jpg",
    bigPlay: true,
    playsinline: true,
    loop: false,
    muted: true,
    autoHide: true,
  },
  plugins: ['sticky','ima'],
  onReady: function (player) {
    player.on('ended', () => {
      console.log('fim video');
    });
    console.log(player);
    player.on('entersticky', () => console.log('entersticky'));
		player.on('leavesticky', () => console.log('leavesticky'));
    player.on("adsmanager", (e) => console.log("adsmanager", e.detail));
    player.on("adsloader", (e) => console.log("adsloader", e.detail));
    player.on("adsrequest", (e) => console.log("adsrequest", e.detail));
  }
});