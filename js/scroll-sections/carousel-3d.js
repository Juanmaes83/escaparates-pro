// 3D Carousel — adapted from Codrops "3DCarousel" (GSAP ScrollSmoother).
// Source read & understood: https://github.com/codrops/3DCarousel (MIT)
// Technique: cards positioned in a circle via rotateY+translateZ (CSS 3D),
// the whole ring rotates as the user scrolls, with a brightness dim and a
// subtle per-card counter-rotation for a cinematic showroom feel.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var SCROLLSMOOTHER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollSmoother.min.js';

    function cellMarkup(media) {
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<div class="card__img" style="background-image:url(\'' + media.url + '\')"></div>';
        return '<div class="carousel__cell"><div class="card">' + inner + '</div></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var itemCount = opts.itemCount || 9;
        var title = opts.title || 'Escaparate';
        var radius = opts.radius || 460;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);

        var cellsHTML = media.length
            ? media.map(cellMarkup).join('\n        ')
            : '<p style="padding:4rem;color:#888">Sube imágenes o vídeos para ver el carrusel 3D.</p>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — 3D Carousel</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;background:#08080a;color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;}\n' +
'.c3d-title{position:fixed;top:2rem;left:2rem;z-index:6;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;}\n' +
'.spacer{height:70vh;}\n' +
'.scene{height:100vh;display:flex;align-items:center;justify-content:center;perspective:2600px;position:relative;}\n' +
'.scene__title{position:absolute;top:6vh;left:50%;transform:translateX(-50%);font-size:clamp(1.6rem,5vw,3rem);font-weight:800;letter-spacing:0.02em;z-index:50;text-transform:uppercase;pointer-events:none;text-shadow:0 4px 24px rgba(0,0,0,0.85);}\n' +
'.carousel{width:1px;height:1px;position:relative;transform-style:preserve-3d;}\n' +
'.carousel__cell{position:absolute;top:50%;left:50%;width:220px;height:150px;margin:-75px 0 0 -110px;transform-style:preserve-3d;}\n' +
'.card{width:100%;height:100%;border-radius:14px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.6);}\n' +
'.card__img{width:100%;height:100%;background-size:cover;background-position:center;}\n' +
'.card video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="c3d-title">' + title + '</div>\n' +
'<main id="smooth-content">\n' +
'<div class="spacer"></div>\n' +
'<div class="scene" data-radius="' + radius + '">\n' +
'  <h2 class="scene__title"><span>' + title + '</span></h2>\n' +
'  <div class="carousel">\n' +
'        ' + cellsHTML + '\n' +
'  </div>\n' +
'</div>\n' +
'<div class="spacer"></div>\n' +
'</main>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + SCROLLSMOOTHER_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);\n' +
'  ScrollSmoother.create({ smooth: 1, effects: true, normalizeScroll: true });\n' +
'  var wrapper = document.querySelector(".scene");\n' +
'  var carousel = wrapper.querySelector(".carousel");\n' +
'  var cells = carousel.querySelectorAll(".carousel__cell");\n' +
'  var cards = carousel.querySelectorAll(".card");\n' +
'  var radius = parseFloat(wrapper.dataset.radius) || 500;\n' +
'  var angleStep = 360 / cells.length;\n' +
'  cells.forEach(function(cell, i) {\n' +
'    var angle = i * angleStep;\n' +
'    cell.style.transform = "rotateY(" + angle + "deg) translateZ(" + radius + "px)";\n' +
'  });\n' +
'  gsap.timeline({\n' +
'    defaults: { ease: "sine.inOut" },\n' +
'    scrollTrigger: { trigger: wrapper, start: "top bottom", end: "bottom top", scrub: true }\n' +
'  })\n' +
'  .fromTo(carousel, { rotationY: 0 }, { rotationY: -180 }, 0)\n' +
'  .fromTo(carousel, { rotationZ: 3, rotationX: 3 }, { rotationZ: -3, rotationX: -3 }, 0)\n' +
'  .fromTo(cards, { filter: "brightness(230%)" }, { filter: "brightness(85%)", ease: "power3" }, 0)\n' +
'  .fromTo(cards, { rotationZ: 8 }, { rotationZ: -8, ease: "none" }, 0);\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'carousel-3d',
        name: '3D Carousel',
        icon: '🎠',
        description: 'Carrusel circular 3D de tarjetas — la rueda entera gira con el scroll mientras las tarjetas se iluminan y basculan, estilo escaparate giratorio cinematográfico',
        sourceUrl: 'https://github.com/codrops/3DCarousel',
        build: build
    });
})();
