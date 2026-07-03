// Scroll 3D Grid — adapted from Codrops "Scroll3DGrid" (GSAP ScrollTrigger).
// Source read & understood: https://github.com/codrops/Scroll3DGrid (MIT)
// Technique: CSS 3D grid where each item starts scattered along Z with a
// random depth and rotation, flying into perfect grid alignment (with a
// brightness flash) as the user scrolls through the section.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function itemMarkup(media, i) {
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<div class="grid__item-img" style="background-image:url(\'' + media.url + '\')"></div>';
        return '<div class="grid__item"><div class="grid__item-inner">' + inner + '</div></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var itemCount = opts.itemCount || 18;
        var title = opts.title || 'Escaparate';
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);

        var itemsHTML = media.length
            ? media.map(itemMarkup).join('\n        ')
            : '<p style="padding:4rem;color:#888">Sube imágenes o vídeos para ver la grid 3D.</p>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Scroll 3D Grid</title>\n' +
'<style>\n' +
':root{--perspective:2000px;--grid-width:145%;--grid-columns:6;--grid-gap:3.2vw;--grid-item-ratio:0.8;--grid-inner-scale:0.5;}\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;background:#050506;color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;overflow-x:hidden;}\n' +
'.s3g-title{position:fixed;top:2rem;left:2rem;z-index:5;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;}\n' +
'.spacer{height:60vh;}\n' +
'.grid{perspective:var(--perspective);margin:0 auto;padding:20vh 0;}\n' +
'.grid-wrap{width:var(--grid-width);margin:0 auto;display:grid;grid-template-columns:repeat(var(--grid-columns),1fr);gap:var(--grid-gap);transform-style:preserve-3d;}\n' +
'.grid__item{aspect-ratio:var(--grid-item-ratio);position:relative;overflow:hidden;border-radius:8px;transform-style:preserve-3d;will-change:transform,filter;}\n' +
'.grid__item-inner{position:absolute;top:50%;left:50%;width:calc(1 / var(--grid-inner-scale) * 100%);height:calc(1 / var(--grid-inner-scale) * 100%);transform:translate(-50%,-50%);}\n' +
'.grid__item-img{width:100%;height:100%;background-size:cover;background-position:center;}\n' +
'.grid__item-inner video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="s3g-title">' + title + '</div>\n' +
'<div class="spacer"></div>\n' +
'<div class="grid">\n' +
'  <div class="grid-wrap">\n' +
'        ' + itemsHTML + '\n' +
'  </div>\n' +
'</div>\n' +
'<div class="spacer"></div>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger);\n' +
'  var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });\n' +
'  lenis.on("scroll", function(){ ScrollTrigger.update(); });\n' +
'  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }\n' +
'  requestAnimationFrame(raf);\n' +
'  var gridWrap = document.querySelector(".grid-wrap");\n' +
'  var gridItems = document.querySelectorAll(".grid__item");\n' +
'  var gridItemsInner = Array.prototype.map.call(gridItems, function(it){ return it.querySelector(".grid__item-inner"); });\n' +
'  gsap.timeline({\n' +
'    defaults: { ease: "none" },\n' +
'    scrollTrigger: { trigger: gridWrap, start: "top bottom+=5%", end: "bottom top-=5%", scrub: true }\n' +
'  })\n' +
'  .set(gridWrap, { rotationX: 9 })\n' +
'  .set(gridItems, { z: function(){ return gsap.utils.random(-320, -80); } })\n' +
'  .fromTo(gridItems, {\n' +
'    yPercent: function(){ return gsap.utils.random(55, 200); },\n' +
'    rotationY: -16,\n' +
'    filter: "brightness(200%)"\n' +
'  }, {\n' +
'    ease: "power2",\n' +
'    yPercent: function(){ return gsap.utils.random(-200, -55); },\n' +
'    rotationY: 16,\n' +
'    filter: "brightness(90%)"\n' +
'  }, 0)\n' +
'  .fromTo(gridWrap, { rotationZ: -2 }, { rotationX: -9, rotationZ: 4, scale: 1.06 }, 0)\n' +
'  .fromTo(gridItemsInner, { scale: 1.7 }, { scale: 0.75 }, 0);\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'scroll-3d-grid',
        name: 'Scroll 3D Grid',
        icon: '🎇',
        description: 'Grid de imágenes/vídeos dispersas en profundidad que vuelan hasta alinearse en perfecta cuadrícula 3D con un destello de brillo al hacer scroll',
        sourceUrl: 'https://github.com/codrops/Scroll3DGrid',
        build: build
    });
})();
