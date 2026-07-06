// Scramble Text Reveal — adapted from the tracked effect js/effects/text/
// scramble-text.js (source read & understood: a Three.js canvas-texture plane
// whose only real work is drawing to a plain 2D canvas — revealed characters
// in the target color, not-yet-revealed positions filled with a random
// glitch glyph in a second color, driven by a 0..1 progress value split into
// reveal/hold/fade phases). Recreated dependency-free for a real scroll
// section: the WebGL plane wrapper is dropped, the same canvas-drawing logic
// now runs directly against a native 2D canvas, and progress comes from
// scroll position inside a sticky pin (scrub — scroll up re-scrambles the
// text) instead of a looping timer. No CDN, no extra libraries.
(function() {
    var GLITCH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!%&*?$';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'DISEÑO QUE TRANSFORMA ESPACIOS';
        var hint = opts.hint || 'Sigue bajando';
        var textColor = opts.textColor || '#ffffff';
        var glitchColor = opts.glitchColor || '#00ccff';
        var background = opts.background || '#0b0b0f';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var m0 = media[0];
        var bgHTML = m0
            ? (m0.type === 'video'
                ? '<video src="' + m0.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + m0.url + '" alt="">')
            : '';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Scramble Text Reveal</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:' + textColor + ';font-family:Arial,Helvetica,sans-serif;}\n' +
'.str-wrap{position:relative;height:220vh;}\n' +
'.str-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;}\n' +
'.str-bg{position:absolute;inset:0;opacity:0.28;}\n' +
'.str-bg img,.str-bg video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.str-overlay{position:absolute;inset:0;background:' + background + ';opacity:0.55;}\n' +
'.str-canvas{position:relative;z-index:1;width:min(90vw,1024px);height:auto;display:block;}\n' +
'.str-fallback{position:relative;z-index:1;display:none;max-width:90vw;text-align:center;font-weight:800;text-transform:uppercase;font-size:clamp(1.6rem,5vw,3.4rem);letter-spacing:0.02em;opacity:0;transition:opacity 0.6s ease-out;}\n' +
'.str-fallback.is-visible{opacity:1;}\n' +
'.str-hint{position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);z-index:2;font-size:0.75rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.6;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.str-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.str-wrap{height:260vh;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="str-wrap">\n' +
'  <div class="str-pin">\n' +
(bgHTML ? '    <div class="str-bg">' + bgHTML + '</div>\n' : '') +
'    <div class="str-overlay"></div>\n' +
'    <canvas class="str-canvas" data-text="' + claim.replace(/"/g, '&quot;') + '" data-text-color="' + textColor + '" data-glitch-color="' + glitchColor + '"></canvas>\n' +
'    <h1 class="str-fallback">' + claim + '</h1>\n' +
'    <div class="str-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var GLITCH = "' + GLITCH + '";\n' +
'  var wrap = document.querySelector(".str-wrap");\n' +
'  var pin = document.querySelector(".str-pin");\n' +
'  var canvas = document.querySelector(".str-canvas");\n' +
'  var fallback = document.querySelector(".str-fallback");\n' +
'  var hint = document.querySelector(".str-hint");\n' +
'  var supportsCanvas = !!(canvas && canvas.getContext && canvas.getContext("2d"));\n' +
'\n' +
'  if (!supportsCanvas) {\n' +
'    if (canvas) canvas.style.display = "none";\n' +
'    if (fallback) fallback.style.display = "block";\n' +
'    if ("IntersectionObserver" in window && fallback) {\n' +
'      var fObs = new IntersectionObserver(function(entries) {\n' +
'        entries.forEach(function(e) { if (e.isIntersecting) fallback.classList.add("is-visible"); });\n' +
'      }, { threshold: 0.4 });\n' +
'      fObs.observe(fallback);\n' +
'    } else if (fallback) {\n' +
'      fallback.classList.add("is-visible");\n' +
'    }\n' +
'    return;\n' +
'  }\n' +
'\n' +
'  var ctx = canvas.getContext("2d");\n' +
'  var target = (canvas.dataset.text || "TEXTO").toUpperCase();\n' +
'  var textColor = canvas.dataset.textColor || "#ffffff";\n' +
'  var glitchColor = canvas.dataset.glitchColor || "#00ccff";\n' +
'  var len = target.length;\n' +
'  var dpr = Math.min(window.devicePixelRatio || 1, 2);\n' +
'  var cssW = 0, cssH = 0;\n' +
'\n' +
'  function resize() {\n' +
'    var rect = canvas.getBoundingClientRect();\n' +
'    cssW = rect.width;\n' +
'    cssH = rect.width * 0.28;\n' +
'    canvas.style.height = cssH + "px";\n' +
'    canvas.width = Math.round(cssW * dpr);\n' +
'    canvas.height = Math.round(cssH * dpr);\n' +
'    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n' +
'  }\n' +
'\n' +
'  var active = false;\n' +
'  var flickerFrame = null;\n' +
'  var lastRevealed = -1;\n' +
'\n' +
'  function progressOf() {\n' +
'    var rect = wrap.getBoundingClientRect();\n' +
'    var vh = window.innerHeight;\n' +
'    var span = rect.height - vh;\n' +
'    if (span <= 0) return rect.top <= 0 ? 1 : 0;\n' +
'    var p = (0 - rect.top) / span;\n' +
'    return Math.max(0, Math.min(1, p));\n' +
'  }\n' +
'\n' +
'  function draw(t) {\n' +
'    var revealEnd = 0.6, holdEnd = 0.82;\n' +
'    var revealedCount, alpha;\n' +
'    if (t < revealEnd) { revealedCount = Math.floor((t / revealEnd) * len); alpha = 1; }\n' +
'    else if (t < holdEnd) { revealedCount = len; alpha = 1; }\n' +
'    else { revealedCount = len; alpha = Math.max(0, 1 - (t - holdEnd) / (1 - holdEnd)); }\n' +
'\n' +
'    lastRevealed = revealedCount;\n' +
'    var fs = Math.max(18, Math.round(cssH * 0.42));\n' +
'    ctx.clearRect(0, 0, cssW, cssH);\n' +
'    ctx.globalAlpha = alpha;\n' +
'    ctx.font = "800 " + fs + "px Arial, Helvetica, sans-serif";\n' +
'    ctx.textBaseline = "middle";\n' +
'    ctx.textAlign = "left";\n' +
'\n' +
'    var charW = fs * 0.64;\n' +
'    var totalW = len * charW;\n' +
'    var startX = Math.max(0, (cssW - totalW) / 2);\n' +
'    var midY = cssH / 2;\n' +
'\n' +
'    for (var i = 0; i < len; i++) {\n' +
'      var x = startX + i * charW;\n' +
'      if (target[i] === " ") continue;\n' +
'      if (i < revealedCount) {\n' +
'        ctx.fillStyle = textColor;\n' +
'        ctx.fillText(target[i], x, midY);\n' +
'      } else {\n' +
'        var g = GLITCH[Math.floor(Math.random() * GLITCH.length)];\n' +
'        ctx.fillStyle = glitchColor;\n' +
'        ctx.fillText(g, x, midY);\n' +
'      }\n' +
'    }\n' +
'    ctx.globalAlpha = 1;\n' +
'\n' +
'    if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'  }\n' +
'\n' +
'  function update() {\n' +
'    if (!active) return;\n' +
'    draw(progressOf());\n' +
'  }\n' +
'\n' +
'  var scheduled = false;\n' +
'  function scheduleUpdate() {\n' +
'    if (scheduled) return;\n' +
'    scheduled = true;\n' +
'    requestAnimationFrame(function() { scheduled = false; update(); maybeStartFlicker(); });\n' +
'  }\n' +
'\n' +
'  function flickerTick() {\n' +
'    if (!active || lastRevealed >= len) { flickerFrame = null; return; }\n' +
'    draw(progressOf());\n' +
'    flickerFrame = requestAnimationFrame(flickerTick);\n' +
'  }\n' +
'\n' +
'  function maybeStartFlicker() {\n' +
'    if (active && lastRevealed < len && flickerFrame === null) {\n' +
'      flickerFrame = requestAnimationFrame(flickerTick);\n' +
'    }\n' +
'  }\n' +
'\n' +
'  function stopFlicker() {\n' +
'    if (flickerFrame !== null) { cancelAnimationFrame(flickerFrame); flickerFrame = null; }\n' +
'  }\n' +
'\n' +
'  var io = null;\n' +
'  if ("IntersectionObserver" in window) {\n' +
'    io = new IntersectionObserver(function(entries) {\n' +
'      entries.forEach(function(e) {\n' +
'        active = e.isIntersecting;\n' +
'        if (active) { resize(); scheduleUpdate(); } else { stopFlicker(); }\n' +
'      });\n' +
'    }, { threshold: 0 });\n' +
'    io.observe(wrap);\n' +
'  } else {\n' +
'    active = true;\n' +
'    resize();\n' +
'    scheduleUpdate();\n' +
'  }\n' +
'\n' +
'  window.addEventListener("scroll", scheduleUpdate, { passive: true });\n' +
'  window.addEventListener("resize", function() { resize(); scheduleUpdate(); });\n' +
'\n' +
'  window.addEventListener("pagehide", function() {\n' +
'    stopFlicker();\n' +
'    window.removeEventListener("scroll", scheduleUpdate);\n' +
'    if (io) io.disconnect();\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'scramble-text-reveal',
        name: 'Scramble Text Reveal',
        icon: '🔀',
        description: 'Titular editorial que se decodifica carácter a carácter al hacer scroll — glitch scrambleado hasta revelar el claim, con fondo de imagen opcional atenuado. Adaptado del efecto interno Scramble Text (js/effects/text/scramble-text.js), reescrito sin Three.js para canvas 2D puro.',
        build: build
    });
})();
