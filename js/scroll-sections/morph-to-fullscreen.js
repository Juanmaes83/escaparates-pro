// Morph to Fullscreen — adapted from the gsap-collection demo
// "morphing-gallery" (source read & understood: a 3-column layout — image,
// centered media + caption, image — where the center media is a GSAP Flip
// target; as the user scrolls from that section down to an empty full-height
// section below, Flip.fit() morphs the center media smoothly into filling
// the entire viewport, scrubbed to scroll and playing/pausing the video in
// sync — recreated with the client's own media list instead of 2 photos +
// 1 video).
//
// Premium pass: the side images previously just sat static while only the
// center morphed (dead weight, no motion language), and the fullscreen
// destination was a bare video with no payoff — a morph with nothing waiting
// at the end feels unfinished. Added subtle opposing parallax to the side
// images, and a caption that crossfades onto the fullscreen media once the
// morph completes, with a bottom vignette to keep it legible.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var FLIP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Flip.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function sideMarkup(media) {
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" alt="">';
        return inner;
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var intro = opts.intro || 'Entra en un espacio donde cada imagen se expande más allá del marco';
        var outro = opts.outro || 'Cada referencia cuenta una historia — la tuya continúa aquí.';
        var caption = opts.caption || 'Detalle';
        var captionText = opts.captionText || 'Una mirada cercana a los acabados y la luz que definen este espacio.';
        var media = EP.ScrollSections.fillMedia(mediaList, 3);
        var left = media[0] || { url: '', type: 'image' };
        var center = media[1] || media[0] || { url: '', type: 'image' };
        var right = media[2] || media[0] || { url: '', type: 'image' };
        var centerIsVideo = center.type === 'video';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Morph to Fullscreen</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#0a0a0c;color:#ececec;}\n' +
'.intro,.outro{width:100%;height:100dvh;display:flex;justify-content:center;align-items:center;padding:0 10vw;text-align:center;}\n' +
'.intro h1,.outro h1{font-size:clamp(1.4rem,3vw,2.4rem);font-weight:500;line-height:1.3;}\n' +
'.scrolling{width:100%;display:flex;flex-direction:column;gap:10em;padding:0 1.25em;}\n' +
'.wrapper-about{display:flex;gap:2rem;}\n' +
'.left,.center,.right{flex:1;}\n' +
'.left,.right{aspect-ratio:16/9;margin-top:5em;border-radius:8px;overflow:hidden;will-change:transform;}\n' +
'.center{display:flex;flex-direction:column;gap:0.6rem;}\n' +
'.center .target-fullscreen{aspect-ratio:16/9;position:relative;border-radius:8px;overflow:hidden;}\n' +
'.center h1{font-size:1.4rem;font-weight:800;text-transform:uppercase;letter-spacing:0.03em;}\n' +
'.center p{font-size:1rem;opacity:0.75;max-width:40ch;}\n' +
'.container-fullscreen{width:100%;height:100dvh;position:relative;}\n' +
'.fullscreen{width:100%;height:100%;position:relative;}\n' +
'.fs-caption{position:absolute;left:0;right:0;bottom:0;padding:4rem 4rem 3rem;z-index:2;background:linear-gradient(0deg,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.15) 60%,transparent 100%);opacity:0;transform:translateY(16px);pointer-events:none;}\n' +
'.fs-caption h2{font-size:clamp(1.4rem,3vw,2.2rem);font-weight:800;text-transform:uppercase;letter-spacing:0.02em;}\n' +
'.fs-caption p{margin-top:0.5rem;font-size:1rem;opacity:0.8;max-width:44ch;}\n' +
'.fs-hint{position:absolute;bottom:1.6rem;right:2rem;z-index:2;font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;opacity:0;color:rgba(255,255,255,0.6);pointer-events:none;}\n' +
'@media (max-width:768px){.wrapper-about{flex-direction:column;} .fs-caption{padding:2rem 1.5rem 2rem;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<section class="intro"><h1>' + intro + '</h1></section>\n' +
'<section class="scrolling">\n' +
'  <div class="wrapper-about">\n' +
'    <div class="left">' + sideMarkup(left) + '</div>\n' +
'    <div class="center">\n' +
'      <div class="target-fullscreen">' + (centerIsVideo
        ? '<video class="target-fullscreen-media" src="' + center.url + '" loop muted playsinline></video>'
        : '<img class="target-fullscreen-media" src="' + center.url + '" alt="">') + '</div>\n' +
'      <h1>' + caption + '</h1>\n' +
'      <p>' + captionText + '</p>\n' +
'    </div>\n' +
'    <div class="right">' + sideMarkup(right) + '</div>\n' +
'  </div>\n' +
'  <div class="container-fullscreen">\n' +
'    <div class="fullscreen"></div>\n' +
'    <div class="fs-caption"><h2>' + caption + '</h2><p>' + captionText + '</p></div>\n' +
'    <div class="fs-hint">( Sigue haciendo scroll )</div>\n' +
'  </div>\n' +
'</section>\n' +
'<section class="outro"><h1>' + outro + '</h1></section>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + FLIP_CDN + '"></script>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger, Flip);\n' +
'  var lenis = new Lenis();\n' +
'  lenis.on("scroll", ScrollTrigger.update);\n' +
'  gsap.ticker.add(function(time) { lenis.raf(time * 1000); });\n' +
'  gsap.ticker.lagSmoothing(0);\n' +
'\n' +
'  var targetFullscreen = Flip.getState(".container-fullscreen .fullscreen");\n' +
'  var media = document.querySelector(".target-fullscreen-media");\n' +
'  var isVideo = media.tagName === "VIDEO";\n' +
'\n' +
'  var tl = gsap.timeline({\n' +
'    scrollTrigger: {\n' +
'      trigger: ".wrapper-about", start: "center center", end: "center center",\n' +
'      endTrigger: ".container-fullscreen", scrub: true,\n' +
'      onEnter: function() { if (isVideo) media.play(); },\n' +
'      onLeaveBack: function() { if (isVideo) media.pause(); }\n' +
'    }\n' +
'  });\n' +
'\n' +
'  tl.add(Flip.fit(media, targetFullscreen, { ease: "none", duration: 2, scale: true, absolute: true }));\n' +
'  tl.to(".fs-caption", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, ">-0.3");\n' +
'  tl.to(".fs-hint", { opacity: 1, duration: 0.3 }, "<");\n' +
'\n' +
'  gsap.utils.toArray(".left, .right").forEach(function(el, i) {\n' +
'    gsap.to(el, {\n' +
'      yPercent: i === 0 ? -12 : 12, ease: "none",\n' +
'      scrollTrigger: { trigger: ".wrapper-about", start: "top bottom", end: "bottom top", scrub: true }\n' +
'    });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'morph-to-fullscreen',
        name: 'Morph to Fullscreen',
        icon: '🫧',
        description: 'Bloque a 3 columnas donde el elemento central se transforma sin corte en pantalla completa al hacer scroll (GSAP Flip) — imágenes laterales con parallax opuesto y una leyenda que aparece sobre el vídeo/foto ya en pantalla completa',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/morphing-gallery',
        build: build
    });
})();
