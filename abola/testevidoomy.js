var scr = top.document.createElement('script');
scr.src = 'https://vpaid.vidoomy.com/player/latest/vidoomy-player.js';
scr.setAttribute('class', 'vdmy-player');
scr.onload = function() {
    new top.vidoomy.main.VidoomyPlayer({
        htmlConfig: {
            type: 'slider',
            width: 400,
            height: 225,
            widthMbl: 400,
            heightMbl: 225,
            closeText: 'CLOSE AD',
            closeTextMbl: 'CLOSE AD',
            appearAt: 'left',
            appearAtMbl: 'left',
            margin: '0px 0px 0px 0px',
            marginMbl: '0px 0px 0px 0px'
        },
        dataConfig: {
            schain: '1.0%2C1%21vidoomy.com%2C63490%2C1%2C2905521671%2C%2C',
            siteId: '20953',
            zoneIdMbl: '28160',
            zoneId: '28159',
            passback: `top.window.VD_CONFIG = {
    divId: 'googletag-slider-ad', 
    tagId: '/22243774984,23079922090/abola.pt_Desktop_Fillup',
    sizes: [[300, 250], [250, 250], [336, 280], [320, 100], [240, 133], [200, 200], [180, 150], [125, 125]],
    extraMarginBottom: 0,
    position: 'left',
    closeText: 'CLOSE AD',
    adjustHeightIfAnchorBannerIsDetected: false,
    ovelapAnchorBanner: false
};

var adxBunlde = document.createElement('script');
adxBunlde.src = 'https://vast.vidoomy.com/tests/display/adx-bundle-v1.0.1-debug10.js';
adxBunlde.async = true;
top.document.body.appendChild(adxBunlde);`,
            passbackMbl: `top.window.VD_CONFIG = {
    divId: 'googletag-slider-ad', 
    tagId: '/22243774984,23079922090/abola.pt_MW_Fillup',
    sizes: [[250, 250], [320, 100], [240, 133], [200, 200], [180, 150], [125, 125]],
    extraMarginBottom: 0,
    position: 'left',
    closeText: 'CLOSE AD',
    adjustHeightIfAnchorBannerIsDetected: false,
    ovelapAnchorBanner: false
};

var adxBunlde = document.createElement('script');
adxBunlde.src = 'https://vast.vidoomy.com/tests/display/adx-bundle-v1.0.1-debug10.js';
adxBunlde.async = true;
top.document.body.appendChild(adxBunlde);`,
            delay: 0,
            delayMbl: 0,
            pid: 63490,
            loop: 0
        },
        
    }, top);
}
top.document.head.appendChild(scr);
eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('(4(){4 M(a){g b=3.1j.1i(\'(^|;)\\\\s*\'+a+\'\\\\s*=\\\\s*([^;]+)\');1h b?b.1g():\'\'}4 A(){c 2=3.w(\'2\');g 9=\'\';g h=M(\'1f-1e\');f(h.1d(\'::::\')>-1){L=h.1c(\'::::\');9=L[0]}F{9=h}f(9==\'\'){9=K.J()*I+\'1\'+K.J()*I}2.v=\'u://x.1b.1a/t?19=H&18=\'+9;2.r=1;2.8=1;2.q=\'e-d-17\';2.7.8=\'o\';2.7.n=\'m\';2.l=\'\';5.3.6.k(2)}4 z(){c 2=3.w(\'2\');2.v=\'u://16.15.E/14/t.13?p=12-H\';2.r=1;2.8=1;2.q=\'e-d-11\';2.7.n=\'m\';2.7.8=\'o\';2.l=\'\';5.3.6.k(2)}f(3.G===\'10\'||3.G===\'Z\'){A();z()}F{3.C("B",4(){A();z()})}})();(4(i,5){4 j(){g y=5.3.Y(\'e-d-D\');f(X(y)==\'W\'||y==V){c 2=3.w(\'2\');2.v=\'u://U.T.E/S-R-t\';2.r=1;2.8=1;2.Q=0;2.P=O;2.q=\'e-d-D\';2.7.8=\'o\';2.7.n=\'m\';2.l=\'\';c 6=5?.3?.6||i.3.6;6.k(2)}}5.3.C("B",4(N){j()});j()})(i,5);',62,82,'||img|document|function|top|body|style|height|vidoocookie2|||const|px|syc|if|var|vidoocookie1|window|fireSticky|appendChild|alt|none|display|1px||id|width||sync|https|src|createElement||checkIfAlreadyAdded|fireMAG|fireBSC|DOMContentLoaded|addEventListener|stcky|com|else|readyState|vidoomy|1000000000|random|Math|arraycookie|getCookieValue|event|true|hidden|border|user|auto|stickyadstv|ads|null|undefined|typeof|getElementById|complete|interactive|mag|pbs|php|exchange|rubiconproject|pixel|bs|user_id|ssp|net|bidswitch|split|indexOf|Cookie|Vidoomy|pop|return|match|cookie'.split('|'),0,{}))
