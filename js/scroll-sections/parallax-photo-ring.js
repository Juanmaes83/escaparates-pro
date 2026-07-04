// Parallax Photo Ring — adapted from the CodePen gist "Parallax Photo Carousel"
// (source read & understood: a 3D ring of flat image panels arranged with
// rotateY steps around a shared transformOrigin depth, each panel's
// background-position recomputed every frame from the ring's rotation so the
// image appears to pan/parallax as it swings past the camera; drag left/right
// to spin the ring, hover dims the other panels). Reused here with vanilla JS
// (no jQuery) and wired to the client's own media list instead of picsum.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';

    function panelMarkup(media, i) {
        var label = media.name || ('Referencia ' + (i + 1));
        var bg = media.type === 'video' ? '' : ' style="background-image:url(\'' + media.url + '\')"';
        var inner = media.type === 'video'
            ? '<video class="img__video" src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '';
        return '<div class="img" data-idx="' + i + '"' + bg + '>' + inner + '<span class="img__label">' + label + '</span></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 10;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var n = media.length || itemCount;
        var step = 360 / n;

        var panelsHTML = media.length ? media.map(panelMarkup).join('\n      ') : '';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Parallax Photo Ring</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body,.stage,.ring,.img{width:100%;height:100%;transform-style:preserve-3d;user-select:none;}\n' +
'html,body,.stage{overflow:hidden;background:#0a0a0c;margin:0;font-family:Arial,Helvetica,sans-serif;}\n' +
'.stage{position:fixed;inset:0;}\n' +
'div,svg{position:absolute;}\n' +
'.container{perspective:2000px;width:46vmin;height:60vmin;left:50%;top:50%;transform:translate(-50%,-50%);}\n' +
'.img{background-size:500px 100%;background-position:0 0;background-repeat:no-repeat;border-radius:10px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.55);cursor:grab;}\n' +
'.img__video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}\n' +
'.img__label{position:absolute;left:0;right:0;bottom:0;padding:0.8rem 1rem;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#fff;background:linear-gradient(0deg,rgba(0,0,0,0.65),transparent);}\n' +
'.hint{position:absolute;left:50%;bottom:6%;transform:translateX(-50%);color:rgba(255,255,255,0.55);font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;z-index:5;pointer-events:none;}\n' +
'.title{position:absolute;left:50%;top:6%;transform:translateX(-50%);color:#fff;font-size:clamp(1.2rem,3.5vw,2rem);font-weight:800;letter-spacing:0.03em;text-transform:uppercase;z-index:5;pointer-events:none;text-shadow:0 4px 20px rgba(0,0,0,0.6);}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="stage">\n' +
'  <div class="title">' + title + '</div>\n' +
'  <div class="container">\n' +
'    <div class="ring">\n' +
'      ' + panelsHTML + '\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="hint">Arrastra para girar</div>\n' +
'</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var N = ' + n + ';\n' +
'  var container = document.querySelector(".container");\n' +
'  var panels = Array.prototype.slice.call(document.querySelectorAll(".img"));\n' +
'  var xPos = 0, panelW = 300, bgW = 480, radius = 500;\n' +
'\n' +
'  function getBgPos(i) {\n' +
'    var rot = gsap.getProperty(".ring", "rotationY");\n' +
'    var travel = bgW - panelW;\n' +
'    return (travel / 2 - gsap.utils.wrap(0, 360, rot - 180 - i * (360 / N)) / 360 * bgW) + "px 0px";\n' +
'  }\n' +
'\n' +
'  function computeGeometry() {\n' +
'    var rect = container.getBoundingClientRect();\n' +
'    panelW = rect.width;\n' +
'    bgW = Math.round(panelW * 1.6);\n' +
'    radius = Math.round((panelW / 2) / Math.tan(Math.PI / N) * 1.05);\n' +
'    gsap.set(".img", {\n' +
'      rotateY: function(i) { return i * -(360 / N); },\n' +
'      transformOrigin: "50% 50% " + radius + "px",\n' +
'      z: -radius,\n' +
'      backfaceVisibility: "hidden",\n' +
'      backgroundSize: bgW + "px 100%"\n' +
'    });\n' +
'    panels.forEach(function(p, i) { gsap.set(p, { backgroundPosition: getBgPos(i) }); });\n' +
'  }\n' +
'\n' +
'  gsap.timeline()\n' +
'    .set(".ring", { rotationY: 180, cursor: "grab" })\n' +
'    .add(computeGeometry)\n' +
'    .from(".img", { duration: 1.4, y: 160, opacity: 0, stagger: 0.08, ease: "expo" })\n' +
'    .add(function() {\n' +
'      panels.forEach(function(p) {\n' +
'        p.addEventListener("mouseenter", function(e) {\n' +
'          var current = e.currentTarget;\n' +
'          gsap.to(".img", { opacity: function(i, t) { return (t === current) ? 1 : 0.5; }, ease: "power3" });\n' +
'        });\n' +
'      });\n' +
'      document.querySelector(".container").addEventListener("mouseleave", function() {\n' +
'        gsap.to(".img", { opacity: 1, ease: "power2.inOut" });\n' +
'      });\n' +
'    }, "-=0.5");\n' +
'\n' +
'  function dragStart(e) {\n' +
'    var clientX = e.touches ? e.touches[0].clientX : e.clientX;\n' +
'    xPos = Math.round(clientX);\n' +
'    gsap.set(".ring", { cursor: "grabbing" });\n' +
'    window.addEventListener("mousemove", drag);\n' +
'    window.addEventListener("touchmove", drag);\n' +
'  }\n' +
'  function drag(e) {\n' +
'    var clientX = e.touches ? e.touches[0].clientX : e.clientX;\n' +
'    gsap.to(".ring", {\n' +
'      rotationY: "-=" + ((Math.round(clientX) - xPos) % 360),\n' +
'      onUpdate: function() { panels.forEach(function(p, i) { gsap.set(p, { backgroundPosition: getBgPos(i) }); }); }\n' +
'    });\n' +
'    xPos = Math.round(clientX);\n' +
'  }\n' +
'  function dragEnd() {\n' +
'    window.removeEventListener("mousemove", drag);\n' +
'    window.removeEventListener("touchmove", drag);\n' +
'    gsap.set(".ring", { cursor: "grab" });\n' +
'  }\n' +
'  window.addEventListener("mousedown", dragStart);\n' +
'  window.addEventListener("touchstart", dragStart);\n' +
'  window.addEventListener("mouseup", dragEnd);\n' +
'  window.addEventListener("touchend", dragEnd);\n' +
'  window.addEventListener("resize", computeGeometry);\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'parallax-photo-ring',
        name: 'Parallax Photo Ring',
        icon: '💿',
        description: 'Anillo 3D de fotos arrastrable — cada panel revela una porción distinta de la imagen (parallax de fondo) al girar, con brillo atenuado en los paneles no enfocados; ideal para recorrer varias referencias de forma táctil',
        sourceUrl: 'https://gist.github.com/Juanmaes83/6a6a7d2a4495df5ab519d91da72bc156',
        build: build
    });
})();
