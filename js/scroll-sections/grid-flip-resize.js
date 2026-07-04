// Grid Flip Resize — adapted from the Codrops repo "grid-layout-transition"
// (source read & understood: a CSS Grid masonry gallery with per-item aspect
// ratios; clicking a density button changes the grid's column count via a
// data attribute, and GSAP Flip captures the before/after layout to animate
// every tile smoothly into its new position/size, staggered at random with a
// brief blur+brightness flash — the "Filter + Stagger" variant from the
// repo's index2.html, merged here as the single default behaviour).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var FLIP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Flip.min.js';
    var RATIOS = ['1 / 1', '4 / 5', '16 / 9', '3 / 4', '5 / 4', '4 / 3', '3 / 2', '5 / 7'];

    function tileMarkup(media, i) {
        var label = media.name || ('Referencia ' + (i + 1));
        var ratio = RATIOS[i % RATIOS.length];
        var inner = media.type === 'video'
            ? '<video class="image" style="aspect-ratio:' + ratio + '" src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<div class="image" style="aspect-ratio:' + ratio + ';background-image:url(\'' + media.url + '\')"></div>';
        return '<div class="grid_gallery_item">' + inner + '<p>' + (i < 9 ? '0' : '') + (i + 1) + ' — ' + label + '</p></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 16;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var tilesHTML = media.map(tileMarkup).join('\n      ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Grid Flip Resize</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html,body{background:#0a0a0c;color:#fff;font-family:Arial,Helvetica,sans-serif;}\n' +
'button{background:transparent;border:none;cursor:pointer;font-family:inherit;color:inherit;}\n' +
'.frame{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;padding:1.2rem 2rem;background:linear-gradient(to bottom,rgba(10,10,12,0.9),transparent);}\n' +
'.frame__title{font-size:1rem;font-weight:800;letter-spacing:0.03em;text-transform:uppercase;}\n' +
'.configuration_grid_size{display:flex;align-items:center;gap:1px;background:#333;border:1px solid #333;border-radius:15px;overflow:hidden;}\n' +
'.configuration_grid_size button{background:#111;padding:0.55rem 0.9rem;font-size:0.75rem;}\n' +
'.configuration_grid_size button.active{background:#fff;color:#0a0a0c;}\n' +
'.grid_gallery_container{position:relative;display:grid;gap:1rem;padding:1rem 2rem 3rem;width:100%;max-width:1400px;margin:0 auto;}\n' +
'.grid_gallery_container[data-size-grid="50%"]{grid-template-columns:repeat(10,1fr);}\n' +
'.grid_gallery_container[data-size-grid="75%"]{grid-template-columns:repeat(7,1fr);}\n' +
'.grid_gallery_container[data-size-grid="100%"]{grid-template-columns:repeat(5,1fr);}\n' +
'.grid_gallery_container[data-size-grid="150%"]{grid-template-columns:repeat(3,1fr);}\n' +
'.grid_gallery_item{display:flex;flex-direction:column;}\n' +
'.grid_gallery_item p{font-size:0.65rem;letter-spacing:0.05em;text-transform:uppercase;opacity:0.65;padding-top:0.4rem;}\n' +
'.image{width:100%;background-size:cover;background-position:center;object-fit:cover;border-radius:6px;filter:brightness(0.85);transition:filter 0.3s ease;}\n' +
'.image:hover{filter:brightness(1);}\n' +
'@media (max-width:768px){.grid_gallery_container[data-size-grid]{grid-template-columns:repeat(2,1fr) !important;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<header class="frame">\n' +
'  <h1 class="frame__title">' + title + '</h1>\n' +
'  <nav class="configuration_grid_size">\n' +
'    <button data-size="50%">50%</button>\n' +
'    <button class="active" data-size="75%">75%</button>\n' +
'    <button data-size="100%">100%</button>\n' +
'    <button data-size="150%">150%</button>\n' +
'  </nav>\n' +
'</header>\n' +
'<section class="grid_gallery_container" id="grid-gallery" data-size-grid="75%">\n' +
'      ' + tilesHTML + '\n' +
'</section>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + FLIP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(Flip);\n' +
'  var gridGallery = document.getElementById("grid-gallery");\n' +
'  var triggerButtons = document.querySelectorAll(".configuration_grid_size button");\n' +
'  var allGridItem = document.querySelectorAll(".grid_gallery_item");\n' +
'  var animated = false, currentGridSize = gridGallery.dataset.sizeGrid || "75%";\n' +
'\n' +
'  triggerButtons.forEach(function(btn) {\n' +
'    btn.addEventListener("click", function() {\n' +
'      if (animated) return;\n' +
'      var targetSize = btn.dataset.size;\n' +
'      if (targetSize === currentGridSize) return;\n' +
'      animated = true;\n' +
'\n' +
'      var state = Flip.getState(allGridItem);\n' +
'      gridGallery.dataset.sizeGrid = targetSize;\n' +
'      currentGridSize = targetSize;\n' +
'\n' +
'      triggerButtons.forEach(function(b) { b.classList.remove("active"); });\n' +
'      btn.classList.add("active");\n' +
'\n' +
'      var flipDuration = 0.9, staggerAmount = 0.3, totalFlipDuration = flipDuration + staggerAmount;\n' +
'      Flip.from(state, {\n' +
'        absolute: true,\n' +
'        duration: flipDuration,\n' +
'        ease: "expo.inOut",\n' +
'        onComplete: function() { animated = false; },\n' +
'        stagger: { amount: staggerAmount, from: "random" }\n' +
'      }).fromTo(gridGallery, {\n' +
'        filter: "blur(0px) brightness(100%)"\n' +
'      }, {\n' +
'        duration: totalFlipDuration,\n' +
'        keyframes: [\n' +
'          { filter: "blur(8px) brightness(200%)", duration: totalFlipDuration * 0.5, ease: "power2.in" },\n' +
'          { filter: "blur(0px) brightness(100%)", duration: totalFlipDuration * 0.5, ease: "power2", delay: 0.4 }\n' +
'        ]\n' +
'      }, 0);\n' +
'    });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'grid-flip-resize',
        name: 'Grid Flip Resize',
        icon: '🔲',
        description: 'Galería en grid masonry con ratios variados — botones de densidad recomponen el grid en tiempo real, animado con GSAP Flip (reflow suave + destello de blur/brillo aleatorio); ideal para catálogos grandes de propiedades/productos',
        sourceUrl: 'https://github.com/Juanmaes83/grid-layout-transition',
        build: build
    });
})();
