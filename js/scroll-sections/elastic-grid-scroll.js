// Elastic Grid Scroll — adapted from Codrops "ElasticGridScroll" (GSAP ScrollSmoother).
// Source read & understood: https://github.com/codrops/ElasticGridScroll (MIT)
// Technique: grid columns get progressively more scroll "lag" the farther they
// are from the center column, producing a soft elastic/parallax feel.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var SCROLLSMOOTHER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollSmoother.min.js';

    function itemMarkup(media, i) {
        var caption = media.name || ('Item ' + (i + 1));
        if (media.type === 'video') {
            return '' +
                '<figure class="grid__item">' +
                    '<div class="grid__item-media">' +
                        '<video src="' + media.url + '" autoplay muted loop playsinline></video>' +
                    '</div>' +
                    '<figcaption class="grid__item-caption">' + caption + '</figcaption>' +
                '</figure>';
        }
        return '' +
            '<figure class="grid__item">' +
                '<div class="grid__item-img" style="background-image:url(\'' + media.url + '\')"></div>' +
                '<figcaption class="grid__item-caption">' + caption + '</figcaption>' +
            '</figure>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var itemCount = opts.itemCount || 24;
        var title = opts.title || 'Escaparate';
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);

        var itemsHTML = media.length
            ? media.map(itemMarkup).join('\n        ')
            : '<p style="padding:4rem;color:#888">Sube imágenes o vídeos para ver el grid.</p>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Elastic Grid Scroll</title>\n' +
'<style>\n' +
':root{--c-gap:5vw;--r-gap:5vw;--column-size:80px;--column-count:2;--page-bg:#0b0b0d;--page-fg:#f2f2f2;}\n' +
'@media screen and (min-width:48em){:root{--column-count:4;}}\n' +
'@media screen and (min-width:65em){:root{--column-count:6;}}\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;background:var(--page-bg);color:var(--page-fg);font-family:Arial,Helvetica,sans-serif;}\n' +
'.eg-title{position:fixed;top:2rem;left:2rem;z-index:5;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;}\n' +
'.grid{display:grid;padding:14rem 6vw 20rem;margin:0 auto;grid-template-columns:repeat(var(--column-count), minmax(var(--column-size), 1fr));grid-column-gap:var(--c-gap);grid-row-gap:var(--r-gap);}\n' +
'.grid__item{margin:0;}\n' +
'.grid__item-img,.grid__item-media{aspect-ratio:3/4;background-size:cover;background-position:center;border-radius:6px;overflow:hidden;}\n' +
'.grid__item-media video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.grid__column{display:flex;flex-direction:column;gap:var(--c-gap);}\n' +
'.grid__item-caption{font-size:0.7rem;opacity:0.6;margin-top:0.4rem;}\n' +
'</style>\n' +
'</head>\n' +
'<body class="loading">\n' +
'<div class="eg-title">' + title + '</div>\n' +
'<main id="smooth-content">\n' +
'  <div class="grid">\n' +
'        ' + itemsHTML + '\n' +
'  </div>\n' +
'</main>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + SCROLLSMOOTHER_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);\n' +
'  var smoother = ScrollSmoother.create({ smooth: 1, effects: true, normalizeScroll: true });\n' +
'  var grid = document.querySelector(".grid");\n' +
'  var originalItems = Array.prototype.slice.call(grid.querySelectorAll(".grid__item"));\n' +
'  var baseLag = 0.5, lagScale = 0.12, currentColumnCount = null;\n' +
'  function getColumnCount() {\n' +
'    var raw = getComputedStyle(grid).getPropertyValue("grid-template-columns");\n' +
'    return raw.split(" ").filter(Boolean).length;\n' +
'  }\n' +
'  function groupItemsByColumn() {\n' +
'    var n = getColumnCount();\n' +
'    var columns = [];\n' +
'    for (var i = 0; i < n; i++) columns.push([]);\n' +
'    var items = grid.querySelectorAll(".grid__item");\n' +
'    items.forEach(function(item, idx) { columns[idx % n].push(item); });\n' +
'    return { columns: columns, numColumns: n };\n' +
'  }\n' +
'  function clearGrid() {\n' +
'    grid.querySelectorAll(".grid__column").forEach(function(c){ c.remove(); });\n' +
'    originalItems.forEach(function(item){ grid.appendChild(item); });\n' +
'  }\n' +
'  function buildGrid(columns, numColumns) {\n' +
'    var frag = document.createDocumentFragment();\n' +
'    var mid = (numColumns - 1) / 2;\n' +
'    var containers = [];\n' +
'    columns.forEach(function(column, i) {\n' +
'      var distance = Math.abs(i - mid);\n' +
'      var lag = baseLag + distance * lagScale;\n' +
'      var wrap = document.createElement("div");\n' +
'      wrap.className = "grid__column";\n' +
'      column.forEach(function(item){ wrap.appendChild(item); });\n' +
'      frag.appendChild(wrap);\n' +
'      containers.push({ element: wrap, lag: lag });\n' +
'    });\n' +
'    grid.appendChild(frag);\n' +
'    return containers;\n' +
'  }\n' +
'  function applyLagEffects(containers) {\n' +
'    containers.forEach(function(c){ smoother.effects(c.element, { speed: 1, lag: c.lag }); });\n' +
'  }\n' +
'  function init() {\n' +
'    clearGrid();\n' +
'    var g = groupItemsByColumn();\n' +
'    currentColumnCount = g.numColumns;\n' +
'    var containers = buildGrid(g.columns, g.numColumns);\n' +
'    applyLagEffects(containers);\n' +
'  }\n' +
'  window.addEventListener("resize", function() {\n' +
'    var n = getColumnCount();\n' +
'    if (n !== currentColumnCount) init();\n' +
'  });\n' +
'  document.body.classList.remove("loading");\n' +
'  init();\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'elastic-grid-scroll',
        name: 'Elastic Grid Scroll',
        icon: '🧲',
        description: 'Grid de imágenes/vídeos donde cada columna se desplaza con un lag distinto al hacer scroll, creando una sensación elástica y suave',
        sourceUrl: 'https://github.com/codrops/ElasticGridScroll',
        build: build
    });
})();
