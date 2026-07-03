// Make Way Grid — adapted from Codrops "MakeWayGridEffect" (vanilla JS + GSAP).
// Source read & understood: https://github.com/codrops/MakeWayGridEffect (MIT)
// Technique: clicking a grid item expands it (scale up, front z-index) while
// every other item is pushed away radially, proportional to its distance
// from the clicked item — click again (or click elsewhere) to collapse.
// Ideal for "feature this property/product" interactions.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';

    function itemMarkup(media, i) {
        var caption = media.name || ('Referencia ' + (i + 1));
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<div class="grid__item-img" style="background-image:url(\'' + media.url + '\')"></div>';
        return '' +
            '<div class="grid__item">' +
                inner +
                '<div class="grid__item-caption">' + caption + '</div>' +
            '</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var itemCount = opts.itemCount || 16;
        var title = opts.title || 'Escaparate';
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);

        var itemsHTML = media.length
            ? media.map(itemMarkup).join('\n      ')
            : '<p style="padding:4rem;color:#888">Sube imágenes o vídeos para ver el grid.</p>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Make Way Grid</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;background:#0c0c0e;color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;}\n' +
'.mwg-title{position:fixed;top:1.5rem;left:1.5rem;z-index:5;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.75;}\n' +
'.mwg-hint{position:fixed;top:1.5rem;right:1.5rem;z-index:5;font-size:0.75rem;opacity:0.55;}\n' +
'.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.6vw;padding:8vh 4vw;max-width:1100px;margin:0 auto;}\n' +
'.grid__item{position:relative;aspect-ratio:1/1;border-radius:10px;overflow:hidden;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,0.4);will-change:transform;}\n' +
'.grid__item-img{width:100%;height:100%;background-size:cover;background-position:center;}\n' +
'.grid__item video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.grid__item-caption{position:absolute;bottom:0;left:0;right:0;padding:0.6rem 0.8rem;font-size:0.75rem;background:linear-gradient(transparent,rgba(0,0,0,0.75));opacity:0;transition:opacity 0.3s;}\n' +
'.grid__item:hover .grid__item-caption{opacity:1;}\n' +
'@media (max-width:700px){.grid{grid-template-columns:repeat(2,1fr);}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="mwg-title">' + title + '</div>\n' +
'<div class="mwg-hint">Clic para destacar</div>\n' +
'<div class="grid">\n' +
'      ' + itemsHTML + '\n' +
'</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  function map(v, a, b, c, d) { return c + (d - c) * ((v - a) / (b - a)); }\n' +
'  function getDistance(a, b) {\n' +
'    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();\n' +
'    var dx = (ra.left + ra.width/2) - (rb.left + rb.width/2);\n' +
'    var dy = (ra.top + ra.height/2) - (rb.top + rb.height/2);\n' +
'    return Math.sqrt(dx*dx + dy*dy);\n' +
'  }\n' +
'  function getTranslationDistance(otherEl, clickedEl, spread, maxDistance) {\n' +
'    var ra = otherEl.getBoundingClientRect(), rb = clickedEl.getBoundingClientRect();\n' +
'    var dx = (ra.left + ra.width/2) - (rb.left + rb.width/2);\n' +
'    var dy = (ra.top + ra.height/2) - (rb.top + rb.height/2);\n' +
'    var dist = Math.sqrt(dx*dx + dy*dy) || 1;\n' +
'    var force = Math.min(maxDistance / dist, 3) * (spread / 100);\n' +
'    return { x: (dx / dist) * force * 40, y: (dy / dist) * force * 40 };\n' +
'  }\n' +
'  var items = Array.prototype.slice.call(document.querySelectorAll(".grid__item"));\n' +
'  var expanded = -1;\n' +
'  var opts = { duration: 0.8, ease: "power4", scale: 2.1, spread: 90, maxDistance: 480 };\n' +
'  var tl = null;\n' +
'  function expand(item) {\n' +
'    if (tl) tl.kill();\n' +
'    var idx = items.indexOf(item);\n' +
'    var wasExpanded = expanded === idx;\n' +
'    expanded = wasExpanded ? -1 : idx;\n' +
'    tl = gsap.timeline({ defaults: { duration: opts.duration, ease: opts.ease } });\n' +
'    tl.set(item, { zIndex: expanded === -1 ? 1 : 999 });\n' +
'    tl.to(item, { scale: expanded === -1 ? 1 : opts.scale, x: 0, y: 0, rotation: 0 }, 0);\n' +
'    items.forEach(function(other) {\n' +
'      if (other === item) return;\n' +
'      var t = expanded === -1 ? { x: 0, y: 0 } : getTranslationDistance(other, item, opts.spread, opts.maxDistance);\n' +
'      tl.to(other, { x: t.x, y: t.y, rotation: expanded === -1 ? 0 : gsap.utils.random(-6, 6) }, 0);\n' +
'    });\n' +
'  }\n' +
'  items.forEach(function(item) {\n' +
'    item.addEventListener("click", function() { expand(item); });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'make-way-grid',
        name: 'Make Way Grid',
        icon: '🗂️',
        description: 'Grid interactivo — al hacer clic en una imagen/vídeo, se expande en primer plano y el resto de fichas se aparta a su alrededor, ideal para destacar una propiedad o producto',
        sourceUrl: 'https://github.com/codrops/MakeWayGridEffect',
        build: build
    });
})();
