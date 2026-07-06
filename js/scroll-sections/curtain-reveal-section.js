// Curtain Reveal Section — adapted from the tracked effect
// js/effects/reveal-wipe/curtain-reveal.js (source read & understood:
// theatre curtains built from folded strips per side that slide open with a
// close/open/hold/close easing curve and a subtle cloth sway, revealing an
// image behind, on a continuous time/loopDuration timeline). Recreated
// dependency-free for a real scroll section: the same open/hold/close curve
// and folded-cloth look are kept (folds simulated with a CSS repeating
// gradient instead of per-fold meshes to keep the DOM light), but progress
// now comes from scroll position inside a sticky pin instead of a looping
// timer, and the sway is a function of scroll progress, not elapsed time.
// No CDN, no Three.js, no extra libraries.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }

    function shade(hex, factor) {
        var h = hex.replace('#', '');
        var r = Math.round(parseInt(h.substr(0, 2), 16) * factor);
        var g = Math.round(parseInt(h.substr(2, 2), 16) * factor);
        var b = Math.round(parseInt(h.substr(4, 2), 16) * factor);
        return 'rgb(' + Math.min(255, r) + ',' + Math.min(255, g) + ',' + Math.min(255, b) + ')';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'El telón se abre para tu producto';
        var hint = opts.hint || 'Sigue bajando';
        var curtainColor = opts.curtainColor || '#8b0000';
        var background = opts.background || '#0a0a12';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var m0 = media[0];
        var artHTML = m0
            ? (m0.type === 'video'
                ? '<video src="' + m0.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + m0.url + '" alt="">')
            : '<div class="crs-placeholder"></div>';
        var light = shade(curtainColor, 1.15);
        var dark = shade(curtainColor, 0.75);

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Curtain Reveal Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f2ede4;font-family:Arial,Helvetica,sans-serif;}\n' +
'.crs-wrap{position:relative;height:240vh;}\n' +
'.crs-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;}\n' +
'.crs-stage{position:relative;width:min(70vw,640px);aspect-ratio:4/3;overflow:hidden;border-radius:6px;box-shadow:0 24px 60px rgba(0,0,0,0.5);}\n' +
'.crs-art{position:absolute;inset:0;}\n' +
'.crs-art img,.crs-art video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.crs-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#2a2a33,#0c0c10);}\n' +
'.crs-rod{position:absolute;top:0;left:-4%;right:-4%;height:1.6%;background:linear-gradient(180deg,#e0c26a,#a9832f);z-index:3;box-shadow:0 2px 6px rgba(0,0,0,0.4);}\n' +
'.crs-curtain{position:absolute;top:0;height:100%;width:52%;will-change:transform;z-index:2;background-image:repeating-linear-gradient(90deg,' + light + ' 0,' + light + ' 8%,' + dark + ' 8%,' + dark + ' 16%);box-shadow:0 0 24px rgba(0,0,0,0.5) inset;}\n' +
'.crs-curtain--left{left:0;transform-origin:left center;}\n' +
'.crs-curtain--right{right:0;transform-origin:right center;}\n' +
'.crs-caption{position:absolute;bottom:2.4rem;left:50%;transform:translateX(-50%);z-index:4;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;color:#f2ede4;text-shadow:0 2px 12px rgba(0,0,0,0.6);}\n' +
'.crs-caption.is-visible{opacity:1;}\n' +
'.crs-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:4;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.crs-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.crs-stage{width:min(88vw,420px);aspect-ratio:3/4;} .crs-wrap{height:260vh;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="crs-wrap">\n' +
'  <div class="crs-pin">\n' +
'    <div class="crs-stage">\n' +
'      <div class="crs-art">' + artHTML + '</div>\n' +
'      <div class="crs-curtain crs-curtain--left"></div>\n' +
'      <div class="crs-curtain crs-curtain--right"></div>\n' +
'      <div class="crs-rod"></div>\n' +
'    </div>\n' +
'    <div class="crs-caption">' + claim + '</div>\n' +
'    <div class="crs-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".crs-wrap");\n' +
'  var left = document.querySelector(".crs-curtain--left");\n' +
'  var right = document.querySelector(".crs-curtain--right");\n' +
'  var art = document.querySelector(".crs-art");\n' +
'  var caption = document.querySelector(".crs-caption");\n' +
'  var hint = document.querySelector(".crs-hint");\n' +
'  if (!wrap || !left || !right) return;\n' +
'\n' +
'  function clamp01(v) { return Math.max(0, Math.min(1, v)); }\n' +
'  function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }\n' +
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
'    var openIn = smoothstep(0.1, 0.4, t);\n' +
'    var closeOut = smoothstep(0.82, 1, t);\n' +
'    var openT = clamp01(openIn - closeOut);\n' +
'\n' +
'    var sway = Math.sin(t * Math.PI * 5) * 2.2 * (1 - openT) + Math.sin(t * Math.PI * 8) * 1.1 * openT * (1 - openT) * 4;\n' +
'\n' +
'    left.style.transform = "translateX(" + (-openT * 100) + "%) skewY(" + sway + "deg)";\n' +
'    right.style.transform = "translateX(" + (openT * 100) + "%) skewY(" + (-sway) + "deg)";\n' +
'    art.style.opacity = openT;\n' +
'\n' +
'    if (caption) caption.classList.toggle("is-visible", t > 0.42 && t < 0.8);\n' +
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
        id: 'curtain-reveal-section',
        name: 'Curtain Reveal Section',
        icon: '🎭',
        description: 'Cortinas de teatro con pliegues que se abren y cierran al hacer scroll, revelando la imagen tras ellas — reveal teatral y editorial para producto, escaparate o campaña. Adaptado del efecto interno Curtain Reveal (js/effects/reveal-wipe/curtain-reveal.js), reescrito sin Three.js con transform/skew CSS puros.',
        build: build
    });
})();
