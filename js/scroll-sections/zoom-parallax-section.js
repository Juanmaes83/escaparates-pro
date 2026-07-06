// Zoom Parallax Section — adapted from the tracked effect
// js/effects/spotlight-focus/zoom-parallax.js (source read & understood: a
// Ken Burns crossfade slideshow — each slide zooms and pans slightly while
// visible, crossfading into the next, driven by a continuous
// time/loopDuration timeline). Recreated dependency-free for a real scroll
// section: the same Ken Burns zoom/pan curve is kept for a single hero
// image, but progress now comes from scroll position inside a sticky pin
// instead of a looping timer, and a caption + eyebrow tag are layered on
// top at different parallax speeds to build depth. No CDN, no Three.js, no
// extra libraries.
(function() {
    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var tag = opts.tag || 'Colección 2026';
        var claim = opts.claim || 'El detalle que hace mirar dos veces';
        var hint = opts.hint || 'Sigue bajando';
        var background = opts.background || '#000000';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var m0 = media[0];
        var bgHTML = m0
            ? (m0.type === 'video'
                ? '<video src="' + m0.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + m0.url + '" alt="">')
            : '<div class="zps-placeholder"></div>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Zoom Parallax Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f5f2ea;font-family:Arial,Helvetica,sans-serif;}\n' +
'.zps-wrap{position:relative;height:240vh;}\n' +
'.zps-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;}\n' +
'.zps-bg{position:absolute;inset:-4%;will-change:transform;}\n' +
'.zps-bg img,.zps-bg video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.zps-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#2a2a33,#0c0c10);}\n' +
'.zps-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.55) 78%);}\n' +
'.zps-tag{position:absolute;top:12%;left:50%;transform:translate(-50%,0);z-index:2;font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;opacity:0;will-change:transform,opacity;pointer-events:none;}\n' +
'.zps-caption{position:absolute;bottom:14%;left:50%;transform:translate(-50%,0);z-index:2;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.3rem,3.4vw,2.6rem);opacity:0;will-change:transform,opacity;pointer-events:none;}\n' +
'.zps-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:2;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.zps-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.zps-wrap{height:260vh;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="zps-wrap">\n' +
'  <div class="zps-pin">\n' +
'    <div class="zps-bg">' + bgHTML + '</div>\n' +
'    <div class="zps-overlay"></div>\n' +
'    <div class="zps-tag">' + tag + '</div>\n' +
'    <div class="zps-caption">' + claim + '</div>\n' +
'    <div class="zps-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".zps-wrap");\n' +
'  var bg = document.querySelector(".zps-bg");\n' +
'  var tag = document.querySelector(".zps-tag");\n' +
'  var caption = document.querySelector(".zps-caption");\n' +
'  var hint = document.querySelector(".zps-hint");\n' +
'  if (!wrap || !bg) return;\n' +
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
'  function smoothstep(a, b, t) { t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); }\n' +
'\n' +
'  function draw(t) {\n' +
'    var zoom = 1 + t * 0.22;\n' +
'    var panX = (t - 0.5) * 6;\n' +
'    bg.style.transform = "scale(" + zoom + ") translateX(" + panX + "%)";\n' +
'\n' +
'    var tagT = smoothstep(0.05, 0.25, t) - smoothstep(0.8, 1, t);\n' +
'    var capT = smoothstep(0.15, 0.4, t) - smoothstep(0.85, 1, t);\n' +
'    var tagY = (0.5 - t) * 70;\n' +
'    var capY = (0.5 - t) * 34;\n' +
'\n' +
'    tag.style.opacity = Math.max(0, tagT);\n' +
'    tag.style.transform = "translate(-50%,0) translateY(" + tagY + "px)";\n' +
'    caption.style.opacity = Math.max(0, capT);\n' +
'    caption.style.transform = "translate(-50%,0) translateY(" + capY + "px)";\n' +
'\n' +
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
        id: 'zoom-parallax-section',
        name: 'Zoom Parallax Section',
        icon: '🌀',
        description: 'Ken Burns editorial: la imagen de fondo hace zoom lento mientras la etiqueta y el titular flotan en capas de parallax independientes — hero premium para producto, escaparate inmersivo o portada de campaña. Adaptado del efecto interno Zoom Parallax (js/effects/spotlight-focus/zoom-parallax.js), reescrito sin Three.js con transform/opacity puros.',
        build: build
    });
})();
