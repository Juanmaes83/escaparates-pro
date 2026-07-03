// Connected Grid — adapted from Codrops "ConnectedGrid" (GSAP ScrollTrigger + Lenis).
// Source read & understood: https://github.com/codrops/ConnectedGrid (MIT)
// Technique: an asymmetric masonry grid (CSS grid + --r/--c/--s custom props) where
// each item zooms in from a side-dependent origin as it enters the viewport, its
// inner image counter-zooms for a parallax reveal, and the caption slides in.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    // Masonry layout taken from the source demo: [row, col, span]
    var LAYOUT = [
        [1, 1, 4], [2, 5, 3], [3, 3, 2], [4, 1, 2], [5, 3, 5],
        [6, 1, 3], [7, 6, 3], [8, 1, 5], [9, 6, 2], [10, 2, 3]
    ];

    function itemMarkup(media, layout, caption) {
        var r = layout[0], c = layout[1], s = layout[2];
        var inner = media
            ? (media.type === 'video'
                ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
                : '<div class="grid__item-img-inner" style="background-image:url(\'' + media.url + '\')"></div>')
            : '<div class="grid__item-img-inner cg-placeholder"></div>';
        return '' +
            '<figure class="grid__item" style="--r:' + r + ';--c:' + c + ';--s:' + s + ';">' +
                '<div class="grid__item-img">' + inner + '</div>' +
                '<figcaption class="grid__item-caption"><h3>' + caption.title + '</h3> <span>' + caption.year + '</span></figcaption>' +
            '</figure>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var captions = opts.captions || [];
        var media = EP.ScrollSections.fillMedia(mediaList, LAYOUT.length);
        var currentYear = new Date().getFullYear();

        var itemsHTML = LAYOUT.map(function(layout, i) {
            var m = media[i] || null;
            var custom = captions[i % (captions.length || 1)] || {};
            var caption = {
                title: custom.title || (m && m.name) || ('Referencia ' + (i + 1)),
                year: custom.year || currentYear
            };
            return itemMarkup(m, layout, caption);
        }).join('\n        ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Connected Grid</title>\n' +
'<style>\n' +
':root{--color-title:#f5f5f5;--color-year:#8a8a8a;--img-ratio:4/3;}\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;background:#0a0a0c;color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;}\n' +
'.cg-title{position:fixed;top:1.5rem;left:1.5rem;z-index:5;font-size:0.8rem;letter-spacing:0.06em;text-transform:uppercase;opacity:0.75;}\n' +
'.grid{width:100%;grid-template-columns:100%;grid-auto-rows:auto;display:grid;grid-gap:4rem;position:relative;margin:14vh auto 40vh;padding:0 4vw;}\n' +
'.grid__item{position:relative;margin:0;}\n' +
'.grid__item-img{position:relative;overflow:hidden;display:grid;place-items:center;width:100%;height:auto;aspect-ratio:var(--img-ratio);border-radius:8px;}\n' +
'.grid__item-img-inner{width:100%;height:100%;background-position:50%;background-size:cover;position:relative;}\n' +
'.grid__item-img-inner video{width:100%;height:100%;object-fit:cover;}\n' +
'.cg-placeholder{background:linear-gradient(135deg,#222,#333);}\n' +
'.grid__item-caption{position:absolute;padding:0.6rem;display:flex;flex-wrap:wrap;gap:0.5rem;bottom:0;left:0;}\n' +
'.grid__item-caption h3{font-weight:700;font-size:1rem;margin:0;color:var(--color-title);}\n' +
'.grid__item-caption span{font-weight:700;color:var(--color-year);font-size:0.9rem;}\n' +
'@media screen and (min-width:53em){\n' +
'  .grid{grid-template-columns:repeat(8,1fr);}\n' +
'  .grid__item{grid-column:var(--c) / span var(--s);grid-row:var(--r);}\n' +
'}\n' +
'</style>\n' +
'</head>\n' +
'<body class="loading">\n' +
'<div class="cg-title">' + title + '</div>\n' +
'<main>\n' +
'  <div class="grid">\n' +
'        ' + itemsHTML + '\n' +
'  </div>\n' +
'</main>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger);\n' +
'  var lenis = new Lenis({ lerp: 0.15, smoothWheel: true });\n' +
'  lenis.on("scroll", function(){ ScrollTrigger.update(); });\n' +
'  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }\n' +
'  requestAnimationFrame(raf);\n' +
'  var gridItems = document.querySelectorAll(".grid__item");\n' +
'  gridItems.forEach(function(item) {\n' +
'    var prev = item.previousElementSibling;\n' +
'    var isLeftSide = prev && (item.offsetLeft + item.offsetWidth <= prev.offsetLeft + 1);\n' +
'    var originX = isLeftSide ? 100 : 0;\n' +
'    gsap.timeline({\n' +
'      defaults: { ease: "power4" },\n' +
'      scrollTrigger: { trigger: item, start: "top bottom-=15%", end: "+=100%", scrub: true }\n' +
'    })\n' +
'    .fromTo(item.querySelector(".grid__item-img"), { scale: 0, transformOrigin: originX + "% 0%" }, { scale: 1 })\n' +
'    .fromTo(item.querySelector(".grid__item-img-inner"), { scale: 5, transformOrigin: originX + "% 0%" }, { scale: 1 }, 0)\n' +
'    .fromTo(item.querySelector(".grid__item-caption"), { xPercent: isLeftSide ? 100 : -100, opacity: 0 }, { ease: "power1", xPercent: 0, opacity: 1 }, 0);\n' +
'  });\n' +
'  document.body.classList.remove("loading");\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'connected-grid',
        name: 'Connected Grid',
        icon: '🔗',
        description: 'Masonry asimétrico donde cada imagen/vídeo entra con zoom desde el lateral y su leyenda se desliza — ideal para portfolios y catálogos de propiedades',
        sourceUrl: 'https://github.com/codrops/ConnectedGrid',
        build: build
    });
})();
