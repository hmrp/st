# Video.js + IMA hybrid package

## Content player
Use `content-player.html` for normal editorial video with Video.js + videojs-ima. This version supports sequential playlist playback through `playlist.json`; every time a content video ends, the next item is loaded and a fresh preroll VAST request is made with a new correlator.

## Incontent / ad-only
Use `ad-only.html` or `SNIPPET_PUBLICO_INCONTENT.html` for incontent ad-only.
This mode uses Google IMA HTML5 SDK directly, without Video.js and without a dummy MP4.

This corrected version includes an empty `<video data-incontent-video>` as the IMA ad playback surface:

```html
<div class="pub-incontent-ad__media" data-incontent-media>
  <video data-incontent-video playsinline muted preload="none"></video>
</div>
```

The fallback template is only used for no-fill, ad error, request timeout, or start timeout. When an ad completes, the slot remains in place by default.


## Autoplay no Modo 1

O Modo 1 está configurado com `data-autoplay="true"`, `data-muted="false"` e `data-volume="1"`, o que equivale a volume 1/100. A tag VAST foi ajustada para `vpa=auto` e `vpmute=0`. Browsers podem bloquear autoplay com som em alguns contextos; nesse caso o player mostra o aviso no estado do vídeo.
