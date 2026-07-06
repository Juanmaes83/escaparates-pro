// Kinetic Text Trigger Section — adapted from the tracked effect
// js/effects/text/kinetic-text.js (source read & understood: three lines of
// text seeded off-canvas, pulled toward their resting position by a
// stateful spring integrator — stiffness/damping velocity accumulation
// drawn each frame to a canvas texture — running on a continuous
// time/loopDuration timeline that keeps re-seeding). Because the source is
// a stateful spring (not a pure function of time), it cannot be
// scroll-scrubbed like the other adaptations without breaking the physics.
// Recreated dependency-free as a trigger-on-enter section instead: the same
// spring math runs once per entry into the viewport, animating to rest,
// then the rAF loop cancels itself — no permanent loop, no scroll
// coupling. Leaving the viewport stops the loop and re-entering later
// replays the reveal from scratch. Native 2D canvas, no Three.js, no extra
// libraries.
(function() {
    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var line1 = (opts.line1 || 'DISEÑO').toUpperCase();
        var line2 = (opts.line2 || 'QUE').toUpperCase();
        var line3 = (opts.line3 || 'TRANSFORMA').toUpperCase();
        var hint = opts.hint || 'Sigue bajando';
        var textColor = opts.textColor || '#f5f2ea';
        var background = opts.background || '#101014';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Kinetic Text Trigger</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:' + textColor + ';font-family:Arial,Helvetica,sans-serif;}\n' +
'.ktt-section{position:relative;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;}\n' +
'.ktt-canvas{width:min(92vw,1000px);height:auto;display:block;}\n' +
'.ktt-fallback{display:none;max-width:90vw;text-align:center;font-weight:800;text-transform:uppercase;line-height:1.15;font-size:clamp(1.8rem,6vw,3.8rem);opacity:0;transition:opacity 0.6s ease-out;}\n' +
'.ktt-fallback.is-visible{opacity:1;}\n' +
'.ktt-hint{position:absolute;bottom:1.4rem;left:50%;transform:translateX(-50%);font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;pointer-events:none;}\n' +
'.spacer{height:60vh;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="ktt-section">\n' +
'  <canvas class="ktt-canvas" data-l1="' + line1.replace(/"/g, '&quot;') + '" data-l2="' + line2.replace(/"/g, '&quot;') + '" data-l3="' + line3.replace(/"/g, '&quot;') + '" data-color="' + textColor + '"></canvas>\n' +
'  <h1 class="ktt-fallback">' + line1 + '<br>' + line2 + '<br>' + line3 + '</h1>\n' +
'  <div class="ktt-hint">' + hint + '</div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var section = document.querySelector(".ktt-section");\n' +
'  var canvas = document.querySelector(".ktt-canvas");\n' +
'  var fallback = document.querySelector(".ktt-fallback");\n' +
'  if (!section) return;\n' +
'  var supportsCanvas = !!(canvas && canvas.getContext && canvas.getContext("2d"));\n' +
'\n' +
'  if (!supportsCanvas) {\n' +
'    if (canvas) canvas.style.display = "none";\n' +
'    if (fallback) fallback.style.display = "block";\n' +
'    if ("IntersectionObserver" in window && fallback) {\n' +
'      var fObs = new IntersectionObserver(function(entries) {\n' +
'        entries.forEach(function(e) { if (e.isIntersecting) fallback.classList.add("is-visible"); else fallback.classList.remove("is-visible"); });\n' +
'      }, { threshold: 0.35 });\n' +
'      fObs.observe(fallback);\n' +
'    } else if (fallback) {\n' +
'      fallback.classList.add("is-visible");\n' +
'    }\n' +
'    return;\n' +
'  }\n' +
'\n' +
'  var ctx = canvas.getContext("2d");\n' +
'  var lines = [canvas.dataset.l1 || "DISEÑO", canvas.dataset.l2 || "QUE", canvas.dataset.l3 || "TRANSFORMA"];\n' +
'  var textColor = canvas.dataset.color || "#f5f2ea";\n' +
'  var dpr = Math.min(window.devicePixelRatio || 1, 2);\n' +
'  var cssW = 0, cssH = 0;\n' +
'  var words = null;\n' +
'  var rafId = null;\n' +
'  var running = false;\n' +
'\n' +
'  function resize() {\n' +
'    var rect = canvas.getBoundingClientRect();\n' +
'    cssW = rect.width;\n' +
'    cssH = rect.width * 0.5;\n' +
'    canvas.style.height = cssH + "px";\n' +
'    canvas.width = Math.round(cssW * dpr);\n' +
'    canvas.height = Math.round(cssH * dpr);\n' +
'    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n' +
'  }\n' +
'\n' +
'  function initWords() {\n' +
'    var fontSize = Math.max(20, Math.round(cssH * 0.2));\n' +
'    var lineH = fontSize * 1.4;\n' +
'    var startY = cssH / 2 - lineH;\n' +
'    words = lines.map(function(text, i) {\n' +
'      var fromBelow = i % 2 === 0;\n' +
'      var targetY = startY + i * lineH + lineH / 2;\n' +
'      return {\n' +
'        text: text,\n' +
'        x: cssW / 2,\n' +
'        y: fromBelow ? cssH + lineH : -lineH,\n' +
'        targetX: cssW / 2,\n' +
'        targetY: targetY,\n' +
'        vx: 0,\n' +
'        vy: 0,\n' +
'        delay: i * 0.08\n' +
'      };\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function draw(fontSize) {\n' +
'    ctx.clearRect(0, 0, cssW, cssH);\n' +
'    ctx.font = "800 " + fontSize + "px Arial, Helvetica, sans-serif";\n' +
'    ctx.textAlign = "center";\n' +
'    ctx.textBaseline = "middle";\n' +
'    ctx.fillStyle = textColor;\n' +
'    words.forEach(function(w) { ctx.fillText(w.text, w.x, w.y); });\n' +
'  }\n' +
'\n' +
'  var elapsed = 0;\n' +
'  var lastT = 0;\n' +
'  function tick(now) {\n' +
'    if (!running) return;\n' +
'    if (!lastT) lastT = now;\n' +
'    var dt = Math.min(0.05, (now - lastT) / 1000);\n' +
'    lastT = now;\n' +
'    elapsed += dt;\n' +
'\n' +
'    var stiffness = 90;\n' +
'    var damping = 12;\n' +
'    var settled = true;\n' +
'    var fontSize = Math.max(20, Math.round(cssH * 0.2));\n' +
'\n' +
'    words.forEach(function(w) {\n' +
'      if (elapsed < w.delay) { settled = false; return; }\n' +
'      var ax = (w.targetX - w.x) * stiffness - w.vx * damping;\n' +
'      var ay = (w.targetY - w.y) * stiffness - w.vy * damping;\n' +
'      w.vx += ax * dt;\n' +
'      w.vy += ay * dt;\n' +
'      w.x += w.vx * dt;\n' +
'      w.y += w.vy * dt;\n' +
'      if (Math.abs(w.targetY - w.y) > 0.3 || Math.abs(w.vy) > 2) settled = false;\n' +
'    });\n' +
'\n' +
'    draw(fontSize);\n' +
'\n' +
'    if (settled) { running = false; rafId = null; return; }\n' +
'    rafId = requestAnimationFrame(tick);\n' +
'  }\n' +
'\n' +
'  function start() {\n' +
'    if (running) return;\n' +
'    resize();\n' +
'    initWords();\n' +
'    elapsed = 0;\n' +
'    lastT = 0;\n' +
'    running = true;\n' +
'    rafId = requestAnimationFrame(tick);\n' +
'  }\n' +
'\n' +
'  function stop() {\n' +
'    running = false;\n' +
'    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }\n' +
'  }\n' +
'\n' +
'  var played = false;\n' +
'  if ("IntersectionObserver" in window) {\n' +
'    var io = new IntersectionObserver(function(entries) {\n' +
'      entries.forEach(function(e) {\n' +
'        if (e.isIntersecting) {\n' +
'          if (!played) { played = true; start(); }\n' +
'        } else {\n' +
'          stop();\n' +
'          played = false;\n' +
'        }\n' +
'      });\n' +
'    }, { threshold: 0.35 });\n' +
'    io.observe(section);\n' +
'  } else {\n' +
'    resize();\n' +
'    initWords();\n' +
'    words.forEach(function(w) { w.x = w.targetX; w.y = w.targetY; });\n' +
'    draw(Math.max(20, Math.round(cssH * 0.2)));\n' +
'  }\n' +
'\n' +
'  window.addEventListener("resize", function() {\n' +
'    if (!running) resize();\n' +
'  });\n' +
'\n' +
'  window.addEventListener("pagehide", function() { stop(); });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'kinetic-text-trigger-section',
        name: 'Kinetic Text Trigger',
        icon: '⚡',
        description: 'Titular de tres líneas que entra con física de resorte al aparecer en el viewport — cada palabra cae/asciende y se asienta con inercia, ideal para manifiestos, claims de campaña o mensajes de marca. Adaptado del efecto interno Kinetic Text (js/effects/text/kinetic-text.js), reescrito sin Three.js sobre canvas 2D con arranque al entrar en pantalla en vez de scroll-scrub, evitando loops permanentes.',
        build: build
    });
})();
