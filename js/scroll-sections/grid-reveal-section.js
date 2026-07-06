// Grid Reveal Section — adapted from the tracked effect
// js/effects/grid/grid-reveal.js (source read & understood: four quadrant
// cards seeded off-screen per corner, assembling into a 2x2 grid with an
// easeOutBack curve then scattering back out, on a continuous
// time/loopDuration loop). Recreated dependency-free for a real scroll
// section: the same corner-seeded assemble curve and per-index stagger are
// kept and extended to a configurable NxM grid (catalog/portfolio use),
// but progress now comes from scroll position inside a sticky pin instead
// of a looping timer, cards assemble once and hold (no scatter-out, since
// a settled catalog grid is the useful end state), and everything is drawn
// with CSS transform/opacity on DOM cells. No CDN, no Three.js, no extra
// libraries.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function easeOutBack(t) {
        var s = 1.70158;
        t = t - 1;
        return t * t * ((s + 1) * t + s) + 1;
    }

    function cellMarkup(media, i) {
        var inner = media
            ? (media.type === 'video'
                ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + media.url + '" alt="">')
            : '<div class="grs-placeholder"></div>';
        return '<div class="grs-cell" data-i="' + i + '"><div class="grs-frame">' + inner + '</div></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'Cada pieza encuentra su lugar';
        var hint = opts.hint || 'Sigue bajando';
        var background = opts.background || '#101014';
        var count = Math.max(4, Math.min(16, opts.count || 9));
        var cols = Math.ceil(Math.sqrt(count));
        var media = EP.ScrollSections.fillMedia(mediaList, count);
        var cellsHTML = '';
        for (var i = 0; i < count; i++) {
            cellsHTML += cellMarkup(media[i], i) + '\n    ';
        }

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Grid Reveal Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f2ede4;font-family:Arial,Helvetica,sans-serif;}\n' +
'.grs-wrap{position:relative;height:220vh;}\n' +
'.grs-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;}\n' +
'.grs-grid{display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:min(1.4vw,12px);width:min(80vw,760px);}\n' +
'.grs-cell{position:relative;aspect-ratio:1/1;will-change:transform,opacity;}\n' +
'.grs-frame{width:100%;height:100%;border-radius:6px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.4);}\n' +
'.grs-frame img,.grs-frame video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.grs-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#26262f,#141419);}\n' +
'.grs-caption{position:absolute;bottom:2.4rem;left:50%;transform:translateX(-50%);z-index:2;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.grs-caption.is-visible{opacity:1;}\n' +
'.grs-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:2;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.grs-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.grs-grid{width:min(90vw,420px);gap:2vw;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="grs-wrap">\n' +
'  <div class="grs-pin">\n' +
'    <div class="grs-grid">\n' +
'    ' + cellsHTML + '\n' +
'    </div>\n' +
'    <div class="grs-caption">' + claim + '</div>\n' +
'    <div class="grs-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".grs-wrap");\n' +
'  var cells = Array.prototype.slice.call(document.querySelectorAll(".grs-cell"));\n' +
'  var caption = document.querySelector(".grs-caption");\n' +
'  var hint = document.querySelector(".grs-hint");\n' +
'  var cols = ' + cols + ';\n' +
'  if (!wrap || !cells.length) return;\n' +
'\n' +
'  function clamp01(v) { return Math.max(0, Math.min(1, v)); }\n' +
'  function easeOutBack(t) {\n' +
'    var s = 1.70158;\n' +
'    t = t - 1;\n' +
'    return t * t * ((s + 1) * t + s) + 1;\n' +
'  }\n' +
'\n' +
'  var count = cells.length;\n' +
'  var dirs = cells.map(function(_, i) {\n' +
'    var col = i % cols;\n' +
'    var row = Math.floor(i / cols);\n' +
'    var halfCols = (cols - 1) / 2;\n' +
'    var sx = col < halfCols ? -1 : (col > halfCols ? 1 : (i % 2 === 0 ? -1 : 1));\n' +
'    var sy = row % 2 === 0 ? -1 : 1;\n' +
'    return {\n' +
'      x: sx * (60 + (col * 4)),\n' +
'      y: sy * (60 + (row * 4)),\n' +
'      rot: sx * 12,\n' +
'      delay: (i / count) * 0.5\n' +
'    };\n' +
'  });\n' +
'\n' +
'  function progressOf() {\n' +
'    var rect = wrap.getBoundingClientRect();\n' +
'    var vh = window.innerHeight;\n' +
'    var span = rect.height - vh;\n' +
'    if (span <= 0) return rect.top <= 0 ? 1 : 0;\n' +
'    var p = (0 - rect.top) / span;\n' +
'    return clamp01(p);\n' +
'  }\n' +
'\n' +
'  function draw(t) {\n' +
'    cells.forEach(function(cell, i) {\n' +
'      var d = dirs[i];\n' +
'      var local = clamp01((t - d.delay) / 0.45);\n' +
'      var e = easeOutBack(local);\n' +
'      var x = d.x * (1 - e);\n' +
'      var y = d.y * (1 - e);\n' +
'      var rot = d.rot * (1 - e);\n' +
'      var scale = 0.4 + 0.6 * clamp01(local);\n' +
'      var opacity = clamp01(local * 1.4);\n' +
'      cell.style.transform = "translate(" + x + "%," + y + "%) rotate(" + rot + "deg) scale(" + scale + ")";\n' +
'      cell.style.opacity = opacity;\n' +
'    });\n' +
'\n' +
'    if (caption) caption.classList.toggle("is-visible", t > 0.55 && t < 0.97);\n' +
'    if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'  }\n' +
'\n' +
'  var active = false;\n' +
'  var scheduled = false;\n' +
'  function scheduleUpdate() {\n' +
'    if (!active || scheduled) return;\n' +
'    scheduled = true;\n' +
'    requestAnimationFrame(function() { scheduled = false; draw(progressOf()); });\n' +
'  }\n' +
'\n' +
'  var io = null;\n' +
'  if ("IntersectionObserver" in window) {\n' +
'    io = new IntersectionObserver(function(entries) {\n' +
'      entries.forEach(function(e) {\n' +
'        active = e.isIntersecting;\n' +
'        if (active) scheduleUpdate();\n' +
'      });\n' +
'    }, { threshold: 0 });\n' +
'    io.observe(wrap);\n' +
'  } else {\n' +
'    active = true;\n' +
'    draw(progressOf());\n' +
'  }\n' +
'\n' +
'  window.addEventListener("scroll", scheduleUpdate, { passive: true });\n' +
'  window.addEventListener("resize", function() { if (active) draw(progressOf()); });\n' +
'\n' +
'  window.addEventListener("pagehide", function() {\n' +
'    window.removeEventListener("scroll", scheduleUpdate);\n' +
'    if (io) io.disconnect();\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'grid-reveal-section',
        name: 'Grid Reveal Section',
        icon: '▦',
        description: 'Mosaico de celdas que llegan desde sus esquinas y se ensamblan en cuadrícula al hacer scroll, con stagger por índice — ideal para catálogo, portfolio o presentación de producto en grid. Adaptado del efecto interno Grid Reveal (js/effects/grid/grid-reveal.js), reescrito sin Three.js con transforms CSS puros y ensamblaje que permanece estable.',
        build: build
    });
})();
