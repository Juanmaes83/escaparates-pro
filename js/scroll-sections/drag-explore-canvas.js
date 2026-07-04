// Drag Explore Canvas — adapted from the gsap-collection demo
// "interactive-drag-gallery" (source read & understood: a large flat grid of
// image cards, laid out in staggered columns far bigger than the viewport;
// the GSAP Observer plugin tracks pointer/touch/wheel movement and pans the
// whole grid, clamped so it can never be dragged past its edges; on load the
// grid eases in from off-center to a centered resting position; dragging
// dims the background to black and scales cards down slightly for a tactile
// feel — recreated with the client's own media list instead of 25 photos,
// with a centered title/description sitting behind the grid).
//
// Premium pass: a plain grid of unlabeled photos reads as a stock demo, not
// a curated moodboard — added per-card captions that reveal on hover, a
// custom "Arrastra" cursor that flips to a directional grab icon while
// dragging (the original left the system cursor doing all the talking),
// and a soft edge vignette so the canvas boundary feels designed rather than
// like scrolling simply ran out of content.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var OBSERVER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Observer.min.js';

    function cardMarkup(media, i) {
        var label = media.name || ('Referencia ' + (i + 1));
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" alt="">';
        return '<div class="card-img">' + inner + '<span class="card-img__cap">' + label + '</span></div>';
    }

    function columnMarkup(items) {
        return '<div class="column">' + items.map(cardMarkup).join('\n          ') + '</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var description = opts.description || 'Arrastra para explorar la colección completa';
        var itemCount = opts.itemCount || 15;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);

        var cols = [[], [], []];
        media.forEach(function(m, i) { cols[i % 3].push(m); });
        var columnsHTML = cols.map(columnMarkup).join('\n        ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Drag Explore Canvas</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#e4e0dd;cursor:none;}\n' +
'.container{width:100%;height:100svh;position:fixed;top:0;left:0;overflow:hidden;user-select:none;transition:background-color 0.35s cubic-bezier(0.165,0.84,0.44,1);}\n' +
'.container.dragging{background:#000;}\n' +
'.container.dragging .card-img{transform:scale(0.85);}\n' +
'.vignette{position:absolute;inset:0;box-shadow:inset 0 0 140px 40px rgba(0,0,0,0.18);pointer-events:none;z-index:5;}\n' +
'.wrapper{display:flex;flex-wrap:nowrap;width:fit-content;height:fit-content;padding:10vw;gap:15vw;z-index:10;will-change:transform;}\n' +
'.column{display:flex;flex-direction:column;gap:5rem;}\n' +
'.column:nth-child(even){margin-top:8rem;}\n' +
'.container:not(.dragging) .card-img:hover{transform:scale(1.05);}\n' +
'.card-img{position:relative;width:16vw;min-width:170px;aspect-ratio:1;border-radius:8px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.2);transition:transform 0.3s cubic-bezier(0.165,0.84,0.44,1);}\n' +
'.card-img__cap{position:absolute;left:0;right:0;bottom:0;padding:0.7rem 0.9rem;font-size:0.7rem;letter-spacing:0.05em;text-transform:uppercase;color:#fff;background:linear-gradient(0deg,rgba(0,0,0,0.65),transparent);opacity:0;transform:translateY(6px);transition:opacity 0.3s ease,transform 0.3s ease;}\n' +
'.container:not(.dragging) .card-img:hover .card-img__cap{opacity:1;transform:translateY(0);}\n' +
'.text-wrapper{position:absolute;top:0;left:0;width:100%;height:100dvh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1.2rem;transition:color 0.3s cubic-bezier(0.165,0.84,0.44,1);pointer-events:none;user-select:none;color:#1a1a1a;z-index:1;}\n' +
'.container.dragging .text-wrapper{color:#fff;}\n' +
'.text-wrapper h1{text-transform:uppercase;font-weight:800;font-size:clamp(2rem,7vw,6rem);letter-spacing:0.02em;}\n' +
'.text-wrapper p{font-size:clamp(0.85rem,1.4vw,1.1rem);letter-spacing:0.05em;text-transform:uppercase;opacity:0.7;}\n' +
'.cursor{position:fixed;top:0;left:0;width:16px;height:16px;border-radius:50%;background:#1a1a1a;pointer-events:none;z-index:50;transform:translate(-50%,-50%);transition:width 0.3s cubic-bezier(0.16,1,0.3,1),height 0.3s cubic-bezier(0.16,1,0.3,1),background 0.3s;display:flex;align-items:center;justify-content:center;opacity:0;}\n' +
'.cursor span{opacity:1;font-size:0.6rem;letter-spacing:0.08em;text-transform:uppercase;color:#fff;white-space:nowrap;transform:scale(0);transition:transform 0.25s;}\n' +
'.cursor.hover{width:84px;height:84px;}\n' +
'.cursor.hover span{transform:scale(1);}\n' +
'.cursor.dragging{background:#fff;width:60px;height:60px;}\n' +
'.cursor.dragging span{color:#1a1a1a;transform:scale(1);}\n' +
'@media (max-width:768px){.card-img{width:26vw;} body{cursor:auto;} .cursor{display:none;}}\n' +
'@media (hover:none){body{cursor:auto;} .cursor{display:none;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="cursor"><span>Arrastra</span></div>\n' +
'<section class="container">\n' +
'  <div class="text-wrapper"><h1>' + title + '</h1><p>' + description + '</p></div>\n' +
'  <div class="wrapper">\n' +
'        ' + columnsHTML + '\n' +
'  </div>\n' +
'  <div class="vignette"></div>\n' +
'</section>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + OBSERVER_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(Observer);\n' +
'  var gallery = document.querySelector(".wrapper");\n' +
'  var container = document.querySelector(".container");\n' +
'  var startX = (window.innerWidth - gallery.offsetWidth) / 2;\n' +
'  var startY = (window.innerHeight - gallery.offsetHeight) / 2;\n' +
'  var isDoneCentredAnimation = false;\n' +
'\n' +
'  gsap.to(gallery, { x: startX, y: startY, duration: 2.5, ease: "power4.inOut", onComplete: function() { isDoneCentredAnimation = true; } });\n' +
'\n' +
'  var yQuick = gsap.quickTo(gallery, "y", { ease: "expo.out", duration: 1.45 });\n' +
'  var xQuick = gsap.quickTo(gallery, "x", { ease: "expo.out", duration: 1.45 });\n' +
'\n' +
'  var maxX = -(gallery.offsetWidth - window.innerWidth);\n' +
'  var maxY = -(gallery.offsetHeight - window.innerHeight);\n' +
'  var xTrack = startX, yTrack = startY;\n' +
'\n' +
'  Observer.create({\n' +
'    type: "pointer,touch,wheel",\n' +
'    onChange: function(self) {\n' +
'      if (!isDoneCentredAnimation) return;\n' +
'      if (self.event.type === "wheel") { xTrack -= self.deltaX; yTrack -= self.deltaY; }\n' +
'      else { xTrack += self.deltaX * 1.5; yTrack += self.deltaY * 1.5; }\n' +
'      xTrack = gsap.utils.clamp(maxX, 0, xTrack);\n' +
'      yTrack = gsap.utils.clamp(maxY, 0, yTrack);\n' +
'      yQuick(yTrack); xQuick(xTrack);\n' +
'    },\n' +
'    onPress: function() { container.classList.add("dragging"); cursor.classList.add("dragging"); },\n' +
'    onRelease: function() { container.classList.remove("dragging"); cursor.classList.remove("dragging"); },\n' +
'    tolerance: 10\n' +
'  });\n' +
'\n' +
'  window.addEventListener("resize", function() {\n' +
'    startX = (window.innerWidth - gallery.offsetWidth) / 2;\n' +
'    startY = (window.innerHeight - gallery.offsetHeight) / 2;\n' +
'    gsap.set(gallery, { x: startX, y: startY });\n' +
'  });\n' +
'\n' +
'  var cursor = document.querySelector(".cursor");\n' +
'  var cx = 0, cy = 0, tx = 0, ty = 0;\n' +
'  window.addEventListener("mousemove", function(e) { tx = e.clientX; ty = e.clientY; cursor.style.opacity = 1; });\n' +
'  window.addEventListener("mouseleave", function() { cursor.style.opacity = 0; });\n' +
'  gsap.ticker.add(function() {\n' +
'    cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;\n' +
'    cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";\n' +
'  });\n' +
'  container.addEventListener("mouseenter", function() { cursor.classList.add("hover"); });\n' +
'  container.addEventListener("mouseleave", function() { cursor.classList.remove("hover"); });\n' +
'})();\n' +
'</script>\n' +
'<script>\n' + EP.ScrollSections.curlyCursorScript('rgba(255,255,255,0.3)') + '</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'drag-explore-canvas',
        name: 'Drag Explore Canvas',
        icon: '✋',
        description: 'Lienzo enorme de fotos en columnas escalonadas que se arrastra libremente (ratón, touch o rueda) — leyenda por ficha al hover, cursor "Arrastra" que reacciona al gesto, viñeta de borde y fondo que se oscurece al arrastrar. Moodboard nivel Awwwards',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/interactive-drag-gallery',
        build: build
    });
})();
