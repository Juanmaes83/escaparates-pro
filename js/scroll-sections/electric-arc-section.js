// Electric Arc Section — adapted from the tracked effect
// js/effects/field/electric-arc.js (source read & understood: a canvas
// texture drawing a set of seeded point-pairs as jagged lightning arcs over
// an optional image backdrop, redrawn every frame with fresh random jitter
// on a continuous time/loopDuration timeline). Recreated dependency-free
// for a real scroll section: the same seeded arc endpoints and jagged
// zigzag stroke are kept, and how many arcs are lit / how intense the glow
// is now scales with scroll progress (more energy the deeper you scroll).
// Redrawing forever would need a permanent rAF loop, so instead each
// scroll update triggers a short, bounded flicker burst (~12 frames) that
// re-jitters the arcs for a live feel, then cancels itself — no permanent
// loop. Native 2D canvas, no Three.js, no extra libraries.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }

    function seededRand(s) { var x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'La energía que enciende la idea';
        var hint = opts.hint || 'Sigue bajando';
        var arcColor = opts.arcColor || '#88ccff';
        var background = opts.background || '#040810';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var m0 = media[0];
        var bgHTML = m0
            ? (m0.type === 'video'
                ? '<video class="eas-bg-media" src="' + m0.url + '" autoplay muted loop playsinline></video>'
                : '<img class="eas-bg-media" src="' + m0.url + '" alt="">')
            : '';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Electric Arc Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#eaf6ff;font-family:Arial,Helvetica,sans-serif;}\n' +
'.eas-wrap{position:relative;height:220vh;}\n' +
'.eas-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;}\n' +
'.eas-stage{position:relative;width:min(88vw,900px);aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:#050b12;}\n' +
'.eas-bg{position:absolute;inset:0;opacity:0.35;}\n' +
'.eas-bg img,.eas-bg video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.eas-canvas{position:absolute;inset:0;width:100%;height:100%;}\n' +
'.eas-caption{position:absolute;bottom:2.4rem;left:50%;transform:translateX(-50%);z-index:2;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.eas-caption.is-visible{opacity:1;}\n' +
'.eas-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:2;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.eas-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.eas-stage{width:min(94vw,420px);aspect-ratio:4/5;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="eas-wrap">\n' +
'  <div class="eas-pin">\n' +
'    <div class="eas-stage">\n' +
(bgHTML ? '      <div class="eas-bg">' + bgHTML + '</div>\n' : '') +
'      <canvas class="eas-canvas" data-color="' + arcColor + '"></canvas>\n' +
'    </div>\n' +
'    <div class="eas-caption">' + claim + '</div>\n' +
'    <div class="eas-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".eas-wrap");\n' +
'  var canvas = document.querySelector(".eas-canvas");\n' +
'  var caption = document.querySelector(".eas-caption");\n' +
'  var hint = document.querySelector(".eas-hint");\n' +
'  if (!wrap || !canvas || !canvas.getContext) return;\n' +
'\n' +
'  function clamp01(v) { return Math.max(0, Math.min(1, v)); }\n' +
'  function seededRand(s) { var x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }\n' +
'\n' +
'  var ctx = canvas.getContext("2d");\n' +
'  var arcColor = canvas.dataset.color || "#88ccff";\n' +
'  var rc = parseInt(arcColor.slice(1, 3), 16) || 136;\n' +
'  var gc = parseInt(arcColor.slice(3, 5), 16) || 204;\n' +
'  var bc = parseInt(arcColor.slice(5, 7), 16) || 255;\n' +
'  var dpr = Math.min(window.devicePixelRatio || 1, 2);\n' +
'  var cssW = 0, cssH = 0;\n' +
'\n' +
'  var ARC_COUNT = 14;\n' +
'  var points = [];\n' +
'  for (var i = 0; i < ARC_COUNT; i++) {\n' +
'    points.push({\n' +
'      x1: seededRand(i * 3.1) , y1: seededRand(i * 7.7),\n' +
'      x2: seededRand(i * 5.3 + 1) , y2: seededRand(i * 9.1 + 1)\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function resize() {\n' +
'    var rect = canvas.getBoundingClientRect();\n' +
'    cssW = rect.width; cssH = rect.height;\n' +
'    canvas.width = Math.round(cssW * dpr);\n' +
'    canvas.height = Math.round(cssH * dpr);\n' +
'    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n' +
'  }\n' +
'\n' +
'  function zigzag(x1, y1, x2, y2, jitter, seed) {\n' +
'    ctx.beginPath();\n' +
'    ctx.moveTo(x1, y1);\n' +
'    var segs = 7;\n' +
'    for (var s = 1; s < segs; s++) {\n' +
'      var lt = s / segs;\n' +
'      var px = x1 + (x2 - x1) * lt + (seededRand(seed + s * 1.7) - 0.5) * jitter;\n' +
'      var py = y1 + (y2 - y1) * lt + (seededRand(seed + s * 2.3 + 50) - 0.5) * jitter;\n' +
'      ctx.lineTo(px, py);\n' +
'    }\n' +
'    ctx.lineTo(x2, y2);\n' +
'    ctx.stroke();\n' +
'  }\n' +
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
'  function draw(t, tick) {\n' +
'    ctx.clearRect(0, 0, cssW, cssH);\n' +
'    var intensity = 0.15 + t * 0.85;\n' +
'    var visibleCount = Math.round(3 + intensity * (ARC_COUNT - 3));\n' +
'    var jitter = Math.min(cssW, cssH) * 0.05;\n' +
'\n' +
'    for (var i = 0; i < visibleCount; i++) {\n' +
'      var p = points[i];\n' +
'      var x1 = p.x1 * cssW, y1 = p.y1 * cssH;\n' +
'      var x2 = p.x2 * cssW, y2 = p.y2 * cssH;\n' +
'      var seed = i * 31.7 + tick * 4.13;\n' +
'\n' +
'      ctx.strokeStyle = "rgba(" + rc + "," + gc + "," + bc + "," + (0.35 * intensity).toFixed(2) + ")";\n' +
'      ctx.lineWidth = 4;\n' +
'      ctx.shadowBlur = 14;\n' +
'      ctx.shadowColor = "rgba(" + rc + "," + gc + "," + bc + ",0.8)";\n' +
'      zigzag(x1, y1, x2, y2, jitter, seed);\n' +
'      ctx.shadowBlur = 0;\n' +
'\n' +
'      ctx.strokeStyle = "rgba(255,255,255," + (0.85 * intensity).toFixed(2) + ")";\n' +
'      ctx.lineWidth = 1.4;\n' +
'      zigzag(x1, y1, x2, y2, jitter * 0.6, seed + 100);\n' +
'    }\n' +
'\n' +
'    if (caption) caption.classList.toggle("is-visible", t > 0.35 && t < 0.95);\n' +
'    if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'  }\n' +
'\n' +
'  var active = false;\n' +
'  var burstFrames = 0;\n' +
'  var burstTick = 0;\n' +
'  var rafId = null;\n' +
'\n' +
'  function burstTickFn() {\n' +
'    rafId = null;\n' +
'    if (!active) return;\n' +
'    burstTick++;\n' +
'    draw(progressOf(), burstTick);\n' +
'    burstFrames--;\n' +
'    if (burstFrames > 0) rafId = requestAnimationFrame(burstTickFn);\n' +
'  }\n' +
'\n' +
'  function triggerBurst() {\n' +
'    if (!active) return;\n' +
'    burstFrames = 12;\n' +
'    if (rafId === null) rafId = requestAnimationFrame(burstTickFn);\n' +
'  }\n' +
'\n' +
'  var io = null;\n' +
'  if ("IntersectionObserver" in window) {\n' +
'    io = new IntersectionObserver(function(entries) {\n' +
'      entries.forEach(function(e) {\n' +
'        active = e.isIntersecting;\n' +
'        if (active) { resize(); triggerBurst(); }\n' +
'        else if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; burstFrames = 0; }\n' +
'      });\n' +
'    }, { threshold: 0 });\n' +
'    io.observe(wrap);\n' +
'  } else {\n' +
'    active = true;\n' +
'    resize();\n' +
'    draw(progressOf(), 0);\n' +
'  }\n' +
'\n' +
'  window.addEventListener("scroll", triggerBurst, { passive: true });\n' +
'  window.addEventListener("resize", function() { if (active) { resize(); triggerBurst(); } });\n' +
'\n' +
'  window.addEventListener("pagehide", function() {\n' +
'    if (rafId !== null) cancelAnimationFrame(rafId);\n' +
'    window.removeEventListener("scroll", triggerBurst);\n' +
'    if (io) io.disconnect();\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'electric-arc-section',
        name: 'Electric Arc Section',
        icon: '⚡',
        description: 'Arcos de energía que se encienden y multiplican al hacer scroll — más tensión eléctrica cuanto más se avanza, con destellos breves y autocancelables. Ideal para tecnología, innovación o impacto de marca. Adaptado del efecto interno Electric Arc (js/effects/field/electric-arc.js), reescrito sin Three.js sobre canvas 2D con ráfagas de parpadeo acotadas en vez de un loop permanente.',
        build: build
    });
})();
