// Magnetic Poles Section — adapted from the tracked effect
// js/effects/field/magnetic-poles.js (source read & understood: cards seeded
// to an orbital base position, then pulled toward one of two oscillating
// "poles" — north/south attract on alternating cards — with distance-based
// opacity dimming, all driven by a continuous time/loopDuration timeline).
// Recreated dependency-free for a real scroll section: the same pole
// oscillation formula and per-card attraction math are kept, but `t` now
// comes from scroll position inside a sticky pin (scrub — scroll up pulls
// the field back) instead of a looping timer, and everything is drawn with
// CSS transform/opacity on absolutely-positioned DOM cards. No CDN, no
// Three.js, no extra libraries.
(function() {
    function seededRandom(seed) {
        var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    function cardMarkup(media, i) {
        var inner = media
            ? (media.type === 'video'
                ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + media.url + '" alt="">')
            : '<div class="mps-placeholder"></div>';
        return '<div class="mps-card" data-i="' + i + '"><div class="mps-frame">' + inner + '</div></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'Fuerzas que se atraen, historias que conectan';
        var hint = opts.hint || 'Sigue bajando';
        var background = opts.background || '#060612';
        var count = Math.max(4, Math.min(10, opts.count || 8));
        var media = EP.ScrollSections.fillMedia(mediaList, count);
        var cardsHTML = '';
        for (var i = 0; i < count; i++) {
            cardsHTML += cardMarkup(media[i], i) + '\n    ';
        }

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Magnetic Poles Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f2ede4;font-family:Arial,Helvetica,sans-serif;}\n' +
'.mps-wrap{position:relative;height:260vh;}\n' +
'.mps-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;}\n' +
'.mps-stage{position:absolute;inset:0;}\n' +
'.mps-card{position:absolute;left:50%;top:50%;width:min(15vw,140px);will-change:transform,opacity;}\n' +
'.mps-frame{background:#100f1a;border-radius:8px;padding:4px;box-shadow:0 16px 34px rgba(0,0,0,0.5);}\n' +
'.mps-frame img,.mps-frame video{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;border-radius:5px;}\n' +
'.mps-placeholder{width:100%;aspect-ratio:1/1;background:linear-gradient(135deg,#1b1a2c,#0c0b14);border-radius:5px;}\n' +
'.mps-pole{position:absolute;left:50%;top:50%;width:min(9vw,84px);height:min(9vw,84px);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;letter-spacing:0.05em;will-change:transform;}\n' +
'.mps-pole--north{background:radial-gradient(circle,rgba(94,234,212,0.55),rgba(94,234,212,0) 70%);color:#5eead4;}\n' +
'.mps-pole--south{background:radial-gradient(circle,rgba(249,115,22,0.55),rgba(249,115,22,0) 70%);color:#f97316;}\n' +
'.mps-caption{position:absolute;bottom:2.4rem;left:50%;transform:translateX(-50%);z-index:2;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.mps-caption.is-visible{opacity:1;}\n' +
'.mps-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:2;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.mps-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.mps-card{width:min(26vw,120px);} .mps-pole{width:min(16vw,84px);height:min(16vw,84px);} .mps-wrap{height:300vh;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="mps-wrap">\n' +
'  <div class="mps-pin">\n' +
'    <div class="mps-stage">\n' +
'    ' + cardsHTML + '\n' +
'    <div class="mps-pole mps-pole--north">N</div>\n' +
'    <div class="mps-pole mps-pole--south">S</div>\n' +
'    </div>\n' +
'    <div class="mps-caption">' + claim + '</div>\n' +
'    <div class="mps-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".mps-wrap");\n' +
'  var cards = Array.prototype.slice.call(document.querySelectorAll(".mps-card"));\n' +
'  var north = document.querySelector(".mps-pole--north");\n' +
'  var south = document.querySelector(".mps-pole--south");\n' +
'  var caption = document.querySelector(".mps-caption");\n' +
'  var hint = document.querySelector(".mps-hint");\n' +
'  if (!wrap || !cards.length) return;\n' +
'\n' +
'  function seededRandom(seed) {\n' +
'    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;\n' +
'    return x - Math.floor(x);\n' +
'  }\n' +
'\n' +
'  var count = cards.length;\n' +
'  var seeds = cards.map(function(_, i) {\n' +
'    return {\n' +
'      baseAngle: (i / count) * Math.PI * 2,\n' +
'      baseR: 2 + seededRandom(i * 7) * 1.5,\n' +
'      pole: (i % 2 === 0) ? 1 : -1\n' +
'    };\n' +
'  });\n' +
'\n' +
'  var poleDist = 3.2;\n' +
'  var pullStrength = 1.35;\n' +
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
'  function toPercent(x, y) {\n' +
'    return { left: 50 + (x / 5) * 38, top: 50 + (y / 3.5) * 30 };\n' +
'  }\n' +
'\n' +
'  function draw(t) {\n' +
'    var poleAngle = t * Math.PI * 2 * 1.5;\n' +
'    var northX = Math.cos(poleAngle) * poleDist * 0.5;\n' +
'    var northY = Math.sin(poleAngle * 0.7) * poleDist * 0.3;\n' +
'    var southX = -northX;\n' +
'    var southY = -northY;\n' +
'\n' +
'    var np = toPercent(northX, northY);\n' +
'    var sp = toPercent(southX, southY);\n' +
'    north.style.transform = "translate(-50%,-50%) translate(" + (np.left - 50) + "%," + (np.top - 50) + "%)";\n' +
'    south.style.transform = "translate(-50%,-50%) translate(" + (sp.left - 50) + "%," + (sp.top - 50) + "%)";\n' +
'    north.style.left = "50%"; north.style.top = "50%";\n' +
'    south.style.left = "50%"; south.style.top = "50%";\n' +
'\n' +
'    cards.forEach(function(card, i) {\n' +
'      var s = seeds[i];\n' +
'      var baseX = Math.cos(s.baseAngle + t * 0.45) * s.baseR;\n' +
'      var baseY = Math.sin(s.baseAngle + t * 0.45) * s.baseR * 0.6;\n' +
'\n' +
'      var poleX = s.pole > 0 ? northX : southX;\n' +
'      var poleY = s.pole > 0 ? northY : southY;\n' +
'      var toPoleX = poleX - baseX;\n' +
'      var toPoleY = poleY - baseY;\n' +
'      var pull = Math.max(0, Math.min(1, t)) * pullStrength;\n' +
'\n' +
'      var x = Math.max(-5, Math.min(5, baseX + toPoleX * pull));\n' +
'      var y = Math.max(-3.5, Math.min(3.5, baseY + toPoleY * pull));\n' +
'      var pos = toPercent(x, y);\n' +
'      var angle = Math.atan2(toPoleY, toPoleX) * (180 / Math.PI) * 0.2;\n' +
'      var dist = Math.sqrt(x * x + y * y);\n' +
'      var opacity = Math.max(0.35, 1 - dist / 8);\n' +
'\n' +
'      card.style.left = pos.left + "%";\n' +
'      card.style.top = pos.top + "%";\n' +
'      card.style.transform = "translate(-50%,-50%) rotate(" + angle + "deg)";\n' +
'      card.style.opacity = opacity;\n' +
'    });\n' +
'\n' +
'    if (caption) caption.classList.toggle("is-visible", t > 0.15 && t < 0.9);\n' +
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
        id: 'magnetic-poles-section',
        name: 'Magnetic Poles Section',
        icon: '🧲',
        description: 'Tarjetas orbitando en pares que son atraídas hacia dos polos opuestos oscilantes al hacer scroll — tensión magnética visual para storytelling de dualidad, contraste o fuerzas opuestas de marca. Adaptado del efecto interno Magnetic Poles (js/effects/field/magnetic-poles.js), reescrito sin Three.js con transforms CSS puros y progreso scrubbed por scroll.',
        build: build
    });
})();
