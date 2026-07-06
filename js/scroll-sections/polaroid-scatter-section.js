// Polaroid Scatter Section — adapted from the tracked effect
// js/effects/stack-scatter/polaroid-scatter.js (source read & understood:
// polaroid-framed cards seeded to random rest positions/rotations, animated
// bounce-in from above then bounce-out on a repeating loop timeline).
// Recreated dependency-free for a real scroll section: the same seeded
// scatter positions and polaroid frame/shadow look are kept, but the loop is
// replaced with a one-way scroll-scrubbed transition — scattered like
// thrown photos at rest, assembling into a neat fanned row as the section
// scrolls through, driven by translate/rotate/scale transforms instead of a
// WebGL plane grid.
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
            : '<div class="pls-placeholder"></div>';
        return '<div class="pls-card" data-i="' + i + '"><div class="pls-frame">' + inner + '</div></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'Cada instante, un recuerdo enmarcado';
        var hint = opts.hint || 'Sigue bajando';
        var background = opts.background || '#1a1816';
        var count = Math.max(3, Math.min(8, opts.count || 6));
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
'<title>' + title + ' — Polaroid Scatter Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f2ede4;font-family:Arial,Helvetica,sans-serif;}\n' +
'.pls-wrap{position:relative;height:240vh;}\n' +
'.pls-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;}\n' +
'.pls-stage{position:absolute;inset:0;}\n' +
'.pls-card{position:absolute;left:50%;top:50%;width:min(20vw,190px);will-change:transform;}\n' +
'.pls-frame{background:#f5f0e8;border-radius:4px;padding:min(1.4vw,10px) min(1.4vw,10px) min(3.2vw,22px);box-shadow:0 18px 40px rgba(0,0,0,0.45);}\n' +
'.pls-frame img,.pls-frame video{width:100%;aspect-ratio:3/3.6;object-fit:cover;display:block;border-radius:1px;}\n' +
'.pls-placeholder{width:100%;aspect-ratio:3/3.6;background:linear-gradient(135deg,#cfc6b8,#e8e1d3);border-radius:1px;}\n' +
'.pls-caption{position:absolute;bottom:2.4rem;left:50%;transform:translateX(-50%);z-index:2;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;color:#f2ede4;text-shadow:0 2px 12px rgba(0,0,0,0.6);}\n' +
'.pls-caption.is-visible{opacity:1;}\n' +
'.pls-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:2;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.pls-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.pls-card{width:min(38vw,190px);} .pls-wrap{height:280vh;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="pls-wrap">\n' +
'  <div class="pls-pin">\n' +
'    <div class="pls-stage">\n' +
'    ' + cardsHTML + '\n' +
'    </div>\n' +
'    <div class="pls-caption">' + claim + '</div>\n' +
'    <div class="pls-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".pls-wrap");\n' +
'  var cards = Array.prototype.slice.call(document.querySelectorAll(".pls-card"));\n' +
'  var caption = document.querySelector(".pls-caption");\n' +
'  var hint = document.querySelector(".pls-hint");\n' +
'  if (!wrap || !cards.length) return;\n' +
'\n' +
'  function seededRandom(seed) {\n' +
'    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;\n' +
'    return x - Math.floor(x);\n' +
'  }\n' +
'  function easeOutBack(t) {\n' +
'    var s = 1.70158;\n' +
'    return (t = t - 1) * t * ((s + 1) * t + s) + 1;\n' +
'  }\n' +
'\n' +
'  var count = cards.length;\n' +
'  var seeds = cards.map(function(_, i) {\n' +
'    return {\n' +
'      sx: (seededRandom(i * 7.3) - 0.5) * 2,\n' +
'      sy: (seededRandom(i * 13.1) - 0.5) * 2,\n' +
'      sr: (seededRandom(i * 3.7) - 0.5) * 2,\n' +
'      delay: seededRandom(i * 5.2) * 0.15\n' +
'    };\n' +
'  });\n' +
'\n' +
'  var active = false;\n' +
'  var settled = false;\n' +
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
'    var narrow = window.innerWidth < 700;\n' +
'    var spreadX = narrow ? 70 : 140;\n' +
'    var spreadY = narrow ? 60 : 45;\n' +
'    var spacing = narrow ? 0 : 92;\n' +
'    var fanRot = narrow ? 0 : 3;\n' +
'\n' +
'    cards.forEach(function(card, i) {\n' +
'      var s = seeds[i];\n' +
'      var localT = Math.max(0, Math.min(1, (t - s.delay) / (1 - s.delay)));\n' +
'      var e = easeOutBack(localT);\n' +
'\n' +
'      var scatterX = s.sx * spreadX;\n' +
'      var scatterY = s.sy * spreadY + 10;\n' +
'      var scatterRot = s.sr * 35;\n' +
'\n' +
'      var targetX = (i - (count - 1) / 2) * spacing;\n' +
'      var targetY = 0;\n' +
'      var targetRot = (i - (count - 1) / 2) * fanRot;\n' +
'\n' +
'      var x = scatterX + (targetX - scatterX) * e;\n' +
'      var y = scatterY + (targetY - scatterY) * e;\n' +
'      var rot = scatterRot + (targetRot - scatterRot) * e;\n' +
'      var scale = 0.82 + 0.18 * Math.min(1, Math.max(0, localT));\n' +
'\n' +
'      card.style.transform = "translate(-50%,-50%) translate(" + x + "%," + y + "%) rotate(" + rot + "deg) scale(" + scale + ")";\n' +
'      card.style.zIndex = String(200 + Math.round(e * 10) + i);\n' +
'    });\n' +
'\n' +
'    if (caption) caption.classList.toggle("is-visible", t > 0.55 && t < 0.97);\n' +
'    if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'    settled = (t <= 0) || (t >= 1);\n' +
'  }\n' +
'\n' +
'  var flickerFrame = null;\n' +
'  function tick() {\n' +
'    draw(progressOf());\n' +
'    if (!active || settled) { flickerFrame = null; return; }\n' +
'    flickerFrame = requestAnimationFrame(tick);\n' +
'  }\n' +
'  function kick() {\n' +
'    if (!active) return;\n' +
'    if (flickerFrame === null) flickerFrame = requestAnimationFrame(tick);\n' +
'  }\n' +
'  function stop() {\n' +
'    if (flickerFrame !== null) { cancelAnimationFrame(flickerFrame); flickerFrame = null; }\n' +
'  }\n' +
'\n' +
'  var io = null;\n' +
'  if ("IntersectionObserver" in window) {\n' +
'    io = new IntersectionObserver(function(entries) {\n' +
'      entries.forEach(function(e) {\n' +
'        active = e.isIntersecting;\n' +
'        if (active) kick(); else stop();\n' +
'      });\n' +
'    }, { threshold: 0 });\n' +
'    io.observe(wrap);\n' +
'  } else {\n' +
'    active = true;\n' +
'    draw(progressOf());\n' +
'  }\n' +
'\n' +
'  window.addEventListener("scroll", kick, { passive: true });\n' +
'  window.addEventListener("resize", kick);\n' +
'\n' +
'  window.addEventListener("pagehide", function() {\n' +
'    stop();\n' +
'    window.removeEventListener("scroll", kick);\n' +
'    if (io) io.disconnect();\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'polaroid-scatter-section',
        name: 'Polaroid Scatter Section',
        icon: '📸',
        description: 'Polaroids esparcidas que se ordenan en fila al hacer scroll — tarjetas con marco y sombra, con posiciones seed-random y ensamblaje suave, ideal para escaparates, campañas visuales o storytelling de producto. Adaptado del efecto interno Polaroid Scatter (js/effects/stack-scatter/polaroid-scatter.js), reescrito sin Three.js con transforms CSS puros.',
        build: build
    });
})();
