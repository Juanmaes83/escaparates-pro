// Split Reveal Section — adapted from the tracked effect
// js/effects/reveal-wipe/split-reveal.js (source read & understood: paired
// left/right panels that slide in from opposite offscreen edges, cross-fade
// as they pass through their resting position, then exit the way they came —
// each pair scrubbed by a fraction of the loop timeline). Recreated
// dependency-free for a real scroll section: same enter/exit easing curve
// and resting-position layout, but progress now comes from scroll position
// inside a sticky pin instead of a looping timer, and slide/opacity are
// driven by transform + CSS opacity instead of a WebGL plane.
(function() {
    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

    function panelMarkup(media, side) {
        var inner = media
            ? (media.type === 'video'
                ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + media.url + '" alt="">')
            : '<div class="srs-placeholder"></div>';
        return '<div class="srs-panel srs-panel--' + side + '">' + inner + '</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'Dos miradas, una misma historia';
        var hint = opts.hint || 'Sigue bajando';
        var background = opts.background || '#101014';
        var media = EP.ScrollSections.fillMedia(mediaList, 2);

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Split Reveal Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f2ede4;font-family:Arial,Helvetica,sans-serif;}\n' +
'.srs-wrap{position:relative;height:220vh;}\n' +
'.srs-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:min(4vw,2rem);}\n' +
'.srs-panel{position:relative;width:min(38vw,420px);aspect-ratio:3/4;overflow:hidden;border-radius:6px;opacity:0;will-change:transform,opacity;}\n' +
'.srs-panel img,.srs-panel video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.srs-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#22222b,#15151c);}\n' +
'.srs-caption{position:absolute;bottom:2.4rem;left:50%;transform:translateX(-50%);z-index:2;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.srs-caption.is-visible{opacity:1;}\n' +
'.srs-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:2;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.srs-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.srs-pin{flex-direction:column;gap:1rem;} .srs-panel{width:min(80vw,420px);aspect-ratio:4/3;} .srs-wrap{height:260vh;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="srs-wrap">\n' +
'  <div class="srs-pin">\n' +
'    ' + panelMarkup(media[0], 'left') + '\n' +
'    ' + panelMarkup(media[1], 'right') + '\n' +
'    <div class="srs-caption">' + claim + '</div>\n' +
'    <div class="srs-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".srs-wrap");\n' +
'  var left = document.querySelector(".srs-panel--left");\n' +
'  var right = document.querySelector(".srs-panel--right");\n' +
'  var caption = document.querySelector(".srs-caption");\n' +
'  var hint = document.querySelector(".srs-hint");\n' +
'  if (!wrap || !left || !right) return;\n' +
'\n' +
'  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }\n' +
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
'    var enterEnd = 0.35, holdEnd = 0.75;\n' +
'    var enterT = easeOutQuart(Math.min(1, t / enterEnd));\n' +
'    var exitT = t > holdEnd ? easeOutQuart(Math.min(1, (t - holdEnd) / (1 - holdEnd))) : 0;\n' +
'    var offscreen = 60;\n' +
'\n' +
'    var leftX = -offscreen * (1 - enterT) + -offscreen * exitT;\n' +
'    var rightX = offscreen * (1 - enterT) + offscreen * exitT;\n' +
'    var opacity = Math.max(0, enterT - exitT);\n' +
'\n' +
'    left.style.transform = "translateX(" + leftX + "%)";\n' +
'    right.style.transform = "translateX(" + rightX + "%)";\n' +
'    left.style.opacity = opacity;\n' +
'    right.style.opacity = opacity;\n' +
'\n' +
'    if (caption) caption.classList.toggle("is-visible", t > enterEnd * 0.6 && t < 0.95);\n' +
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
        id: 'split-reveal-section',
        name: 'Split Reveal Section',
        icon: '⟺',
        description: 'Panel emparejado que entra desde lados opuestos y se revela en scroll, tipo split editorial — ideal para título, claim o presentación de escaparate. Adaptado del efecto interno Split Reveal (js/effects/reveal-wipe/split-reveal.js), reescrito sin Three.js con transform/opacity puros.',
        build: build
    });
})();
