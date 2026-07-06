// Force Field Section — adapted from the tracked effect
// js/effects/field/force-field.js (source read & understood: a canvas
// texture with 60 seeded flow particles trailing around a central point,
// their velocity field driven by elapsed time on a continuous
// time/loopDuration timeline). Recreated dependency-free for a real scroll
// section: rather than a particle simulation (which needs continuous time
// to accumulate state), the same "field surrounding a protected center"
// idea is rebuilt as concentric shield rings whose radius/opacity are a
// pure function of scroll progress `t` (ringPhase = frac(t*speed +
// index/count)) — a deterministic wave pattern that is fully reversible on
// scroll, with no time-based state at all. CSS radial-gradient/box-shadow
// only, no canvas, no Three.js, no extra libraries, no permanent rAF.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'Protegido, magnético, imposible de ignorar';
        var hint = opts.hint || 'Sigue bajando';
        var lineColor = opts.lineColor || '#00cfff';
        var background = opts.background || '#0d1117';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var m0 = media[0];
        var coreHTML = m0
            ? (m0.type === 'video'
                ? '<video src="' + m0.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + m0.url + '" alt="">')
            : '<div class="ffs-placeholder"></div>';
        var ringCount = 5;
        var ringsHTML = '';
        for (var i = 0; i < ringCount; i++) {
            ringsHTML += '<div class="ffs-ring" data-i="' + i + '"></div>\n      ';
        }

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Force Field Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#eaf6ff;font-family:Arial,Helvetica,sans-serif;}\n' +
'.ffs-wrap{position:relative;height:220vh;}\n' +
'.ffs-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;}\n' +
'.ffs-stage{position:relative;width:min(46vw,360px);aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;}\n' +
'.ffs-ring{position:absolute;left:50%;top:50%;width:100%;height:100%;border-radius:50%;border:2px solid ' + lineColor + ';transform:translate(-50%,-50%) scale(0);will-change:transform,opacity;pointer-events:none;}\n' +
'.ffs-core{position:relative;width:62%;height:62%;border-radius:50%;overflow:hidden;box-shadow:0 0 0 6px rgba(255,255,255,0.05),0 20px 50px rgba(0,0,0,0.5);z-index:2;}\n' +
'.ffs-core img,.ffs-core video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.ffs-placeholder{width:100%;height:100%;background:radial-gradient(circle,#26262f,#0c0c10);}\n' +
'.ffs-caption{position:absolute;bottom:2.4rem;left:50%;transform:translateX(-50%);z-index:3;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.ffs-caption.is-visible{opacity:1;}\n' +
'.ffs-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:3;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.ffs-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.ffs-stage{width:min(66vw,300px);}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="ffs-wrap">\n' +
'  <div class="ffs-pin">\n' +
'    <div class="ffs-stage">\n' +
'      ' + ringsHTML + '\n' +
'      <div class="ffs-core">' + coreHTML + '</div>\n' +
'    </div>\n' +
'    <div class="ffs-caption">' + claim + '</div>\n' +
'    <div class="ffs-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".ffs-wrap");\n' +
'  var rings = Array.prototype.slice.call(document.querySelectorAll(".ffs-ring"));\n' +
'  var core = document.querySelector(".ffs-core");\n' +
'  var caption = document.querySelector(".ffs-caption");\n' +
'  var hint = document.querySelector(".ffs-hint");\n' +
'  if (!wrap || !rings.length) return;\n' +
'\n' +
'  function clamp01(v) { return Math.max(0, Math.min(1, v)); }\n' +
'  var count = rings.length;\n' +
'  var speed = 1.6;\n' +
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
'    rings.forEach(function(ring, i) {\n' +
'      var phase = (t * speed + i / count) % 1;\n' +
'      var scale = 0.15 + phase * 1.15;\n' +
'      var opacity = (1 - phase) * 0.75 * clamp01(t * 4);\n' +
'      ring.style.transform = "translate(-50%,-50%) scale(" + scale + ")";\n' +
'      ring.style.opacity = opacity;\n' +
'    });\n' +
'\n' +
'    var glow = 8 + Math.sin(t * Math.PI * 2 * speed) * 6 + 14;\n' +
'    core.style.boxShadow = "0 0 " + glow + "px 4px rgba(255,255,255,0.12), 0 20px 50px rgba(0,0,0,0.5)";\n' +
'\n' +
'    if (caption) caption.classList.toggle("is-visible", t > 0.15 && t < 0.92);\n' +
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
        id: 'force-field-section',
        name: 'Force Field Section',
        icon: '🛡️',
        description: 'Anillos de escudo que laten y se expanden alrededor de un elemento central, en una onda determinista ligada al scroll — protección, aura o energía de marca para producto, servicio o hero. Adaptado del efecto interno Force Field (js/effects/field/force-field.js), reescrito sin Three.js ni canvas, solo CSS radial y transform, sin estado ni rAF permanente.',
        build: build
    });
})();
