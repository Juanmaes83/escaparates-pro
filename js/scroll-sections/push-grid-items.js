// Push Grid Items — adapted from Codrops "PushGridItems"
// (source read & understood: https://github.com/codrops/PushGridItems, demo1).
// Technique: clicking a grid photo flips it (GSAP Flip) into a fullscreen view;
// every other item is pushed toward the grid edge in the cardinal direction
// (north/south/east/west) matching its position relative to the clicked item —
// a directional "make way" rather than a radial one, with a real fullscreen
// detail moment. Clicking again (or another photo) restores the grid.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var FLIP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Flip.min.js';

    // Staggered "brick" positions from the source demo (7x7 grid, offset placement)
    var POSITIONS = [
        [2, 2], [4, 2], [6, 2], [3, 3], [5, 3],
        [2, 4], [4, 4], [6, 4], [3, 5], [5, 5],
        [2, 6], [4, 6], [6, 6], [3, 7], [5, 7]
    ];

    function itemMarkup(media, i) {
        var pos = POSITIONS[i % POSITIONS.length];
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline data-index="' + i + '"></video>'
            : '<div class="grid__img" data-index="' + i + '" style="background-image:url(\'' + media.url + '\')"></div>';
        return '<div class="grid__item" style="grid-area:' + pos[0] + ' / ' + pos[1] + ' / ' + (pos[0] + 1) + ' / ' + (pos[1] + 1) + ';">' + inner + '</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var media = EP.ScrollSections.fillMedia(mediaList, opts.itemCount || 13);

        var itemsHTML = media.length
            ? media.map(itemMarkup).join('\n        ')
            : '<p style="padding:4rem;color:#888">Sube imágenes o vídeos para ver el grid.</p>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Push Grid Items</title>\n' +
'<style>\n' +
':root{--cgap:5%;--rgap:5%;--rows:8;--columns:8;}\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;height:100%;background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden;}\n' +
'.pgi-title{position:fixed;top:1.5rem;left:1.5rem;z-index:6;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.75;}\n' +
'.pgi-hint{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:6;font-size:0.75rem;opacity:0.5;}\n' +
'.stage{position:fixed;inset:0;}\n' +
'.grid{position:absolute;inset:8%;display:grid;grid-auto-flow:column;grid-template-columns:repeat(var(--columns),1fr);grid-template-rows:repeat(var(--rows),1fr);grid-row-gap:var(--rgap);grid-column-gap:var(--cgap);pointer-events:none;}\n' +
'.grid__item{width:100%;height:100%;position:relative;will-change:transform,opacity;}\n' +
'.grid__img,.grid__item video{width:100%;height:100%;background-size:cover;background-position:50% 50%;pointer-events:auto;filter:brightness(0.62);cursor:pointer;will-change:transform;border-radius:10px;object-fit:cover;display:block;transition:filter 0.3s;}\n' +
'.grid__img:hover,.grid__item video:hover{filter:brightness(0.85);}\n' +
'.pos-north{grid-row:1;}\n' +
'.pos-south{grid-row:var(--rows);}\n' +
'.pos-west{grid-column:1;}\n' +
'.pos-east{grid-column:var(--columns);}\n' +
'.fullscreen{position:absolute;width:calc(100% - 30px);height:calc(100% - 30px);top:15px;left:15px;pointer-events:none;}\n' +
'.fullscreen .grid__img,.fullscreen video{border-radius:18px;}\n' +
'</style>\n' +
'</head>\n' +
'<body class="loading">\n' +
'<div class="pgi-title">' + title + '</div>\n' +
'<div class="pgi-hint">Clic en una foto para verla en pantalla completa</div>\n' +
'<div class="stage">\n' +
'  <div class="grid">\n' +
'        ' + itemsHTML + '\n' +
'  </div>\n' +
'  <div class="fullscreen"></div>\n' +
'</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + FLIP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(Flip);\n' +
'  var POS = { NORTH: "pos-north", SOUTH: "pos-south", WEST: "pos-west", EAST: "pos-east" };\n' +
'  var gridEl = document.querySelector(".grid");\n' +
'  var gridItems = Array.prototype.slice.call(gridEl.querySelectorAll(".grid__item"));\n' +
'  var gridMedia = gridEl.querySelectorAll(".grid__img, video");\n' +
'  var fullscreenEl = document.querySelector(".fullscreen");\n' +
'  var isFullscreen = false;\n' +
'  var defaults = { duration: 0.9, ease: "expo" };\n' +
'\n' +
'  function flipMedia(gridItem, mediaEl) {\n' +
'    gsap.set(gridItem, { zIndex: 99 });\n' +
'    var state = Flip.getState(mediaEl);\n' +
'    if (isFullscreen) { gridItem.appendChild(mediaEl); } else { fullscreenEl.appendChild(mediaEl); }\n' +
'    Flip.from(state, Object.assign({}, defaults, {\n' +
'      scale: true, prune: true,\n' +
'      onComplete: function() {\n' +
'        if (isFullscreen) gsap.set(gridItem, { zIndex: "auto" });\n' +
'        isFullscreen = !isFullscreen;\n' +
'      }\n' +
'    }));\n' +
'  }\n' +
'\n' +
'  function determinePositionClass(itemRect, clickedRect) {\n' +
'    if (itemRect.bottom < clickedRect.top) return POS.NORTH;\n' +
'    if (itemRect.top > clickedRect.bottom) return POS.SOUTH;\n' +
'    if (itemRect.right < clickedRect.left) return POS.WEST;\n' +
'    if (itemRect.left > clickedRect.right) return POS.EAST;\n' +
'    return "";\n' +
'  }\n' +
'\n' +
'  function moveOtherItems(gridItem) {\n' +
'    var clickedRect = gridItem.getBoundingClientRect();\n' +
'    var others = gridItems.filter(function(it) { return it !== gridItem; });\n' +
'    var state = Flip.getState(others);\n' +
'    others.forEach(function(item) {\n' +
'      var itemRect = item.getBoundingClientRect();\n' +
'      var cls = determinePositionClass(itemRect, clickedRect);\n' +
'      if (cls) item.classList.toggle(cls, !isFullscreen);\n' +
'    });\n' +
'    Flip.from(state, Object.assign({}, defaults, { scale: true, prune: true }));\n' +
'  }\n' +
'\n' +
'  function toggleMedia(ev) {\n' +
'    var mediaEl = ev.currentTarget;\n' +
'    var idx = parseInt(mediaEl.dataset.index, 10);\n' +
'    var gridItem = gridItems[idx];\n' +
'    flipMedia(gridItem, mediaEl);\n' +
'    moveOtherItems(gridItem);\n' +
'  }\n' +
'\n' +
'  gridMedia.forEach(function(el) { el.addEventListener("click", toggleMedia); });\n' +
'  document.body.classList.remove("loading");\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'push-grid-items',
        name: 'Push Grid Items',
        icon: '📤',
        description: 'Grid escalonado — al hacer clic en una foto, se convierte en vista a pantalla completa (GSAP Flip) y el resto se empuja direccionalmente (norte/sur/este/oeste) según su posición, ideal para destacar una propiedad',
        sourceUrl: 'https://github.com/codrops/PushGridItems',
        build: build
    });
})();
