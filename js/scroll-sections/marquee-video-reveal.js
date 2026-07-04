// Marquee Video Reveal — adapted from the gsap-collection demo
// "recreate-animation-awwward-vooban" (source read & understood: four
// stacked, vertically-offset repeated titles sit behind a small
// rounded-mask video window; scrolling pins the section and expands the
// mask to fullscreen while the titles parallax upward — a "PLAY" button
// with two independent infinite marquees (one per row) sits on the video,
// and hovering it slides both marquee rows up in sync to swap which strip
// is visible, while the button itself repositions once the mask has
// expanded partway through the scroll. Recreated with the client's own
// media list and title instead of a single fixed video).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var CUSTOMEASE_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/CustomEase.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function marqueeRow(label, count) {
        var items = [];
        for (var i = 0; i < count; i++) items.push('<p>' + label + '</p>');
        return items.join('\n              ');
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var playLabel = opts.playLabel || 'Ver';
        var outro = opts.outro || '¿Quieres ver más referencias?';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var main = media[0] || { url: '', type: 'image' };
        var mainInner = main.type === 'video'
            ? '<video src="' + main.url + '" autoplay loop muted playsinline></video>'
            : '<img src="' + main.url + '" alt="">';
        var marqueeItems = marqueeRow(playLabel, 11) + '\n              ' + marqueeRow(playLabel, 11);

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Marquee Video Reveal</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{background:#1458e4;color:#fff;font-family:Arial,Helvetica,sans-serif;}\n' +
'.outro{width:100%;min-height:100dvh;text-transform:uppercase;display:flex;align-items:center;justify-content:center;font-size:clamp(1rem,2.4vw,1.6rem);text-align:center;padding:0 3rem;}\n' +
'.scrolling{position:relative;width:100%;height:180dvh;}\n' +
'.scrolling-content{position:relative;width:100%;height:100dvh;}\n' +
'.scrolling .scrolling-content .title{max-width:100vw;width:100%;font-size:9vw;text-align:center;text-transform:uppercase;line-height:1;letter-spacing:0.03em;font-weight:800;position:absolute;left:0;background:#1458e4;bottom:0;}\n' +
'.title:nth-child(3){transform:translateY(-3rem);}\n' +
'.title:nth-child(2){transform:translateY(-6rem);}\n' +
'.title:nth-child(1){transform:translateY(-9rem);}\n' +
'.wrapper-video{--mask-path: inset(20% 40% 20% 40% round 15px);width:100%;height:100dvh;position:absolute;top:0;left:0;clip-path:var(--mask-path);will-change:clip-path;}\n' +
'.play-btn{position:absolute;left:50%;top:70%;transform:translate(-50%,-50%);width:18%;border-radius:10px;border:1px solid #fff;overflow:hidden;cursor:pointer;will-change:top;}\n' +
'.marquee-inner{display:flex;width:fit-content;gap:0.8rem;padding:1rem 0.8rem;will-change:transform;}\n' +
'.marquee-inner p{flex-shrink:0;font-size:1.1rem;font-weight:700;text-transform:uppercase;}\n' +
'.marquee-wrapper{transition:transform 0.2s ease-out;}\n' +
'.marquee-wrapper.bottom .marquee-inner{background:#fff;color:#1458e4;}\n' +
'.marquee-wrapper.bottom{position:absolute;}\n' +
'.play-btn:hover .marquee-wrapper.top,.play-btn:hover .marquee-wrapper.bottom{transform:translateY(-100%);}\n' +
'.site{position:fixed;font-weight:800;text-transform:uppercase;font-size:0.85rem;letter-spacing:0.06em;top:1.5rem;left:1.5rem;z-index:11;}\n' +
'@media (max-width:768px){.wrapper-video{--mask-path: inset(20% 20% 20% 20% round 15px);} .play-btn{width:55%;} .marquee-inner p{font-size:0.9rem;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="site">' + title + '</div>\n' +
'<section class="scrolling">\n' +
'  <div class="scrolling-content">\n' +
'    <h1 class="title">' + title + '</h1>\n' +
'    <h1 class="title">' + title + '</h1>\n' +
'    <h1 class="title">' + title + '</h1>\n' +
'    <h1 class="title">' + title + '</h1>\n' +
'  </div>\n' +
'  <div class="wrapper-video">\n' +
'    ' + mainInner + '\n' +
'    <div class="play-btn">\n' +
'      <div class="marquee-wrapper top"><div class="marquee-inner">\n' +
'              ' + marqueeItems + '\n' +
'      </div></div>\n' +
'      <div class="marquee-wrapper bottom"><div class="marquee-inner">\n' +
'              ' + marqueeItems + '\n' +
'      </div></div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
'<section class="outro"><h1>' + outro + '</h1></section>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + CUSTOMEASE_CDN + '"></script>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger, CustomEase);\n' +
'  CustomEase.create("hop", "0.5, 1, 0.4, 0.5");\n' +
'  var lenis = new Lenis();\n' +
'  lenis.on("scroll", ScrollTrigger.update);\n' +
'  gsap.ticker.add(function(time) { lenis.raf(time * 1000); });\n' +
'  gsap.ticker.lagSmoothing(0);\n' +
'  var playButton = document.querySelector(".play-btn");\n' +
'\n' +
'  gsap.to(".marquee-wrapper.top .marquee-inner", { xPercent: -49.2, duration: 10, ease: "none", repeat: -1 });\n' +
'  gsap.fromTo(".marquee-wrapper.bottom .marquee-inner", { xPercent: -67.4 }, { xPercent: 0, duration: 10, ease: "none", repeat: -1 });\n' +
'\n' +
'  gsap.to(".wrapper-video", {\n' +
'    "--mask-path": "inset(0% 0% 0% 0% round 0px)", ease: "hop",\n' +
'    scrollTrigger: {\n' +
'      trigger: ".wrapper-video", start: "top top", end: "bottom bottom", endTrigger: ".scrolling", scrub: 1, pin: true,\n' +
'      onUpdate: function(self) {\n' +
'        var progress = self.progress * 10;\n' +
'        gsap.to(playButton, { top: progress > 2 ? "50%" : "75%", ease: "expo.out", duration: 1 });\n' +
'      }\n' +
'    }\n' +
'  });\n' +
'\n' +
'  document.querySelectorAll(".title").forEach(function(el) {\n' +
'    gsap.to(el, {\n' +
'      y: -300, duration: 1.5,\n' +
'      scrollTrigger: { trigger: ".scrolling-content", start: "top+=150 top", end: "bottom+=100 center-=250", scrub: 1 }\n' +
'    });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'marquee-video-reveal',
        name: 'Marquee Video Reveal',
        icon: '▶️',
        description: 'Título repetido en pila con parallax, fijado sobre un vídeo/imagen enmascarado que se expande a pantalla completa al hacer scroll; botón "Ver" con dos marquesinas infinitas que se deslizan al pasar el ratón',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/recreate-animation-awwward-vooban',
        build: build
    });
})();
