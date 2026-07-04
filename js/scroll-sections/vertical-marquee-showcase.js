// Vertical Marquee Showcase — adapted from the CodePen gist "GSAP Homepage
// Demo 4" (source read & understood: three columns of photo cards, each
// column an infinitely-looping vertical marquee at its own speed, the whole
// stage tilted in 3D perspective; hovering a card pauses its column and
// scales the card up while dimming the rest; clicking a card zooms it to
// fullscreen with a close button that tracks the pointer, then restores the
// marquee on close — recreated with vanilla JS instead of jQuery and the
// client's own media list instead of 12 static photos).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';

    function boxMarkup(media, i) {
        var label = media.name || ('Referencia ' + (i + 1));
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '';
        var bg = media.type === 'video' ? '' : ' style="background-image:url(\'' + media.url + '\')"';
        return '<div class="photoBox" data-idx="' + i + '"' + bg + '>' + inner + '<span class="photoBox__label">' + label + '</span></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 12;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var boxesHTML = media.map(boxMarkup).join('\n      ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Vertical Marquee Showcase</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0a0a0c;font-family:Arial,Helvetica,sans-serif;}\n' +
'.main{position:absolute;inset:0;opacity:0;}\n' +
'.mainBoxes{position:absolute;top:0;}\n' +
'.photoBox{position:absolute;background-size:cover;background-position:center;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);overflow:hidden;opacity:0;}\n' +
'.photoBox video{width:100%;height:100%;object-fit:cover;}\n' +
'.photoBox__label{position:absolute;left:0;right:0;bottom:0;padding:0.8rem 1.1rem;color:#fff;font-size:0.85rem;letter-spacing:0.06em;text-transform:uppercase;background:linear-gradient(0deg,rgba(0,0,0,0.65),transparent);}\n' +
'.mainClose{position:absolute;width:60px;height:60px;cursor:pointer;z-index:200;}\n' +
'.title{position:fixed;top:2rem;left:50%;transform:translateX(-50%);z-index:20;color:#fff;font-size:1rem;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;pointer-events:none;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="title">' + title + '</div>\n' +
'<div class="main">\n' +
'  <div class="mainBoxes"></div>\n' +
'  <div class="mainClose">\n' +
'    <svg width="100%" height="100%" fill="none">\n' +
'      <circle cx="30" cy="30" r="30" fill="#000" opacity="0.4"/>\n' +
'      <path d="M15,16L45,46 M45,16L15,46" stroke="#000" stroke-width="3.5" opacity="0.5"/>\n' +
'      <path d="M15,15L45,45 M45,15L15,45" stroke="#fff" stroke-width="2"/>\n' +
'    </svg>\n' +
'  </div>\n' +
'</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var mediaBoxesHTML = ' + JSON.stringify(boxesHTML) + ';\n' +
'  document.querySelector(".mainBoxes").innerHTML = mediaBoxesHTML;\n' +
'\n' +
'  var currentImg, currentImgProps = { x: 0, y: 0 }, isZooming = false, column = -1;\n' +
'  var mouse = { x: 0, y: 0 }, delayedPlay;\n' +
'  var boxes = Array.prototype.slice.call(document.querySelectorAll(".photoBox"));\n' +
'\n' +
'  boxes.forEach(function(b, i) {\n' +
'    if (i % 4 === 0) column++;\n' +
'    b.classList.add("pb-col" + column);\n' +
'    gsap.set(b, {\n' +
'      x: [60, 280, 500][column], width: 260, height: 400, borderRadius: 16, scale: 0.5, zIndex: 1\n' +
'    });\n' +
'    b.tl = gsap.timeline({ paused: true, repeat: -1 })\n' +
'      .fromTo(b, { y: [-575, 800, 800][column], rotation: -0.05 }, { duration: [40, 35, 26][column], y: [800, -575, -575][column], rotation: 0.05, ease: "none" })\n' +
'      .progress((i % 4) / 4);\n' +
'  });\n' +
'\n' +
'  function pauseBoxes(b) {\n' +
'    var classStr = "pb-col0";\n' +
'    if (b.classList.contains("pb-col1")) classStr = "pb-col1";\n' +
'    if (b.classList.contains("pb-col2")) classStr = "pb-col2";\n' +
'    boxes.forEach(function(bx) { if (bx.classList.contains(classStr)) gsap.to(bx.tl, { timeScale: 0, ease: "sine" }); });\n' +
'  }\n' +
'  function playBoxes() {\n' +
'    boxes.forEach(function(bx) {\n' +
'      bx.tl.play();\n' +
'      gsap.to(bx.tl, { duration: 0.4, timeScale: 1, ease: "sine.in", overwrite: true });\n' +
'    });\n' +
'  }\n' +
'\n' +
'  gsap.timeline({ onStart: playBoxes })\n' +
'    .set(".main", { perspective: 800 })\n' +
'    .set(".photoBox", { opacity: 1, cursor: "pointer" })\n' +
'    .set(".mainBoxes", { left: "75%", xPercent: -50, width: 780, rotationX: 14, rotationY: -15, rotationZ: 10 })\n' +
'    .set(".mainClose", { autoAlpha: 0, left: -30, top: -31, pointerEvents: "none" })\n' +
'    .fromTo(".main", { autoAlpha: 0 }, { duration: 0.6, ease: "power2.inOut", autoAlpha: 1 }, 0.2);\n' +
'\n' +
'  boxes.forEach(function(b) {\n' +
'    b.addEventListener("mouseenter", function(e) {\n' +
'      if (currentImg) return;\n' +
'      if (delayedPlay) delayedPlay.kill();\n' +
'      pauseBoxes(e.currentTarget);\n' +
'      var t = e.currentTarget;\n' +
'      gsap.to(".photoBox", { duration: 0.2, overwrite: "auto", opacity: function(i, el) { return (el === t) ? 1 : 0.33; } });\n' +
'      gsap.fromTo(t, { zIndex: 100 }, { duration: 0.2, scale: 0.62, overwrite: "auto", ease: "power3" });\n' +
'    });\n' +
'    b.addEventListener("mouseleave", function(e) {\n' +
'      if (currentImg) return;\n' +
'      var t = e.currentTarget;\n' +
'      if (gsap.getProperty(t, "scale") > 0.62) delayedPlay = gsap.delayedCall(0.3, playBoxes);\n' +
'      else playBoxes();\n' +
'      gsap.timeline()\n' +
'        .set(t, { zIndex: 1 })\n' +
'        .to(t, { duration: 0.3, scale: 0.5, overwrite: "auto", ease: "expo" }, 0)\n' +
'        .to(".photoBox", { duration: 0.5, opacity: 1, ease: "power2.inOut" }, 0);\n' +
'    });\n' +
'    b.addEventListener("click", function(e) {\n' +
'      if (isZooming) return;\n' +
'      isZooming = true;\n' +
'      gsap.delayedCall(0.8, function() { isZooming = false; });\n' +
'\n' +
'      if (currentImg) {\n' +
'        gsap.timeline({ defaults: { ease: "expo.inOut" } })\n' +
'          .to(".mainClose", { duration: 0.1, autoAlpha: 0, overwrite: true }, 0)\n' +
'          .to(".mainBoxes", { duration: 0.5, scale: 1, left: "75%", width: 780, rotationX: 14, rotationY: -15, rotationZ: 10, overwrite: true }, 0)\n' +
'          .to(".photoBox", { duration: 0.6, opacity: 1, ease: "power4.inOut" }, 0)\n' +
'          .to(currentImg, { duration: 0.6, width: 260, height: 400, borderRadius: 16, x: currentImgProps.x, y: currentImgProps.y, scale: 0.5, rotation: 0, zIndex: 1 }, 0);\n' +
'        currentImg = undefined;\n' +
'      } else {\n' +
'        pauseBoxes(e.currentTarget);\n' +
'        currentImg = e.currentTarget;\n' +
'        currentImgProps.x = gsap.getProperty(currentImg, "x");\n' +
'        currentImgProps.y = gsap.getProperty(currentImg, "y");\n' +
'        gsap.timeline({ defaults: { duration: 0.6, ease: "expo.inOut" } })\n' +
'          .set(currentImg, { zIndex: 100 })\n' +
'          .fromTo(".mainClose", { x: mouse.x, y: mouse.y, background: "rgba(0,0,0,0)" }, { autoAlpha: 1, duration: 0.3, ease: "power3.inOut" }, 0)\n' +
'          .to(".photoBox", { opacity: 0 }, 0)\n' +
'          .to(currentImg, { width: "100%", height: "100%", borderRadius: 0, x: 0, top: 0, y: 0, scale: 1, opacity: 1 }, 0)\n' +
'          .to(".mainBoxes", { duration: 0.5, left: "50%", width: "100%", rotationX: 0, rotationY: 0, rotationZ: 0 }, 0.15)\n' +
'          .to(".mainBoxes", { duration: 5, scale: 1.06, rotation: 0.05, ease: "none" }, 0.65);\n' +
'      }\n' +
'    });\n' +
'  });\n' +
'\n' +
'  if ("ontouchstart" in window) { mouse.x = window.innerWidth - 50; mouse.y = 60; }\n' +
'  else {\n' +
'    document.querySelector(".main").addEventListener("mousemove", function(e) {\n' +
'      mouse.x = e.clientX; mouse.y = e.clientY;\n' +
'      if (currentImg) gsap.to(".mainClose", { duration: 0.1, x: mouse.x, y: mouse.y, overwrite: "auto" });\n' +
'    });\n' +
'  }\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'vertical-marquee-showcase',
        name: 'Vertical Marquee Showcase',
        icon: '🎞️',
        description: 'Tres columnas de fotos en marquesina vertical infinita, en perspectiva 3D — al pasar el ratón la columna se detiene y la ficha se agranda; clic para pantalla completa con botón de cierre que sigue al cursor',
        sourceUrl: 'https://gist.github.com/Juanmaes83/200a80afb1983c27b951d6b1618bb0a1',
        build: build
    });
})();
