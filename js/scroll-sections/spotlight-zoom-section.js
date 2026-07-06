// Spotlight Zoom Section — adapted from the tracked effect
// js/effects/grid/spotlight-zoom.js (source read & understood: cards take
// turns filling the frame, one active card per time-slice zooming in then
// out via a smoothstep scale/opacity curve, on a continuous
// time/loopDuration timeline). Recreated dependency-free for a real scroll
// section: the same "one active card at a time" slicing and smoothstep
// zoom-in/zoom-out curve are kept, but `t` now comes from scroll position
// inside a sticky pin (scrub) instead of a looping timer, and a radial-
// gradient spotlight mask (CSS variable driven) is layered on top of the
// scale/opacity transform for an editorial reveal feel. No CDN, no
// Three.js, no extra libraries.
(function() {
    function smoothstep(a, b, t) { t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); }

    function cardMarkup(media, i) {
        var inner = media
            ? (media.type === 'video'
                ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + media.url + '" alt="">')
            : '<div class="spz-placeholder"></div>';
        return '<div class="spz-card" data-i="' + i + '">' + inner + '<div class="spz-spot"></div></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'Un foco a la vez, cada detalle revelado';
        var hint = opts.hint || 'Sigue bajando';
        var background = opts.background || '#101014';
        var count = Math.max(3, Math.min(7, opts.count || 5));
        var media = EP.ScrollSections.fillMedia(mediaList, count);
        var cardsHTML = '';
        for (var i = 0; i < count; i++) {
            cardsHTML += cardMarkup(media[i], i) + '\n    ';
        }
        var wrapHeight = Math.max(220, count * 70);

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Spotlight Zoom Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f2ede4;font-family:Arial,Helvetica,sans-serif;}\n' +
'.spz-wrap{position:relative;height:' + wrapHeight + 'vh;}\n' +
'.spz-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;}\n' +
'.spz-stage{position:relative;width:min(64vw,620px);aspect-ratio:4/5;}\n' +
'.spz-card{position:absolute;inset:0;border-radius:8px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.5);opacity:0;will-change:transform,opacity;transform:scale(1);}\n' +
'.spz-card.is-active{opacity:1;}\n' +
'.spz-card img,.spz-card video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.spz-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#26262f,#141419);}\n' +
'.spz-spot{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 50%, transparent var(--r,0%), rgba(0,0,0,0.92) calc(var(--r,0%) + 22%));}\n' +
'.spz-caption{position:absolute;bottom:2.4rem;left:50%;transform:translateX(-50%);z-index:2;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.spz-caption.is-visible{opacity:1;}\n' +
'.spz-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:2;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.spz-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.spz-stage{width:min(86vw,420px);}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="spz-wrap">\n' +
'  <div class="spz-pin">\n' +
'    <div class="spz-stage">\n' +
'    ' + cardsHTML + '\n' +
'    </div>\n' +
'    <div class="spz-caption">' + claim + '</div>\n' +
'    <div class="spz-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".spz-wrap");\n' +
'  var cards = Array.prototype.slice.call(document.querySelectorAll(".spz-card"));\n' +
'  var caption = document.querySelector(".spz-caption");\n' +
'  var hint = document.querySelector(".spz-hint");\n' +
'  if (!wrap || !cards.length) return;\n' +
'\n' +
'  function smoothstep(a, b, t) { t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); }\n' +
'\n' +
'  var count = cards.length;\n' +
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
'    var activeFloat = Math.min(t * count, count - 0.0001);\n' +
'    var active = Math.floor(activeFloat);\n' +
'    var local = activeFloat - active;\n' +
'    var zoomIn = smoothstep(0, 0.35, local);\n' +
'    var zoomOut = smoothstep(0.75, 1, local);\n' +
'    var scale = 1 + zoomIn * 0.28 - zoomOut * 0.28;\n' +
'    var reveal = Math.max(0, zoomIn - zoomOut) * 70 + 6;\n' +
'\n' +
'    cards.forEach(function(card, i) {\n' +
'      if (i === active) {\n' +
'        card.classList.add("is-active");\n' +
'        card.style.transform = "scale(" + scale + ")";\n' +
'        card.style.setProperty("--r", reveal + "%");\n' +
'      } else {\n' +
'        card.classList.remove("is-active");\n' +
'        card.style.transform = "scale(1)";\n' +
'        card.style.setProperty("--r", "0%");\n' +
'      }\n' +
'    });\n' +
'\n' +
'    if (caption) caption.classList.toggle("is-visible", t > 0.06 && t < 0.94);\n' +
'    if (hint) hint.classList.toggle("is-hidden", t > 0.04);\n' +
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
        id: 'spotlight-zoom-section',
        name: 'Spotlight Zoom Section',
        icon: '🔍',
        description: 'Un elemento a la vez ocupa el foco, ampliándose bajo un spotlight radial que se abre y cierra al hacer scroll — ideal para revelar producto o detalle con sensación editorial premium. Adaptado del efecto interno Spotlight Zoom (js/effects/grid/spotlight-zoom.js), reescrito sin Three.js con transform/opacity y máscara radial-gradient por CSS variable.',
        build: build
    });
})();
