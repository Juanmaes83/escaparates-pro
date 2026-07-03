// Repeating Image Transition — adapted from Codrops "RepeatingImageTransition"
// (source read & understood: https://github.com/codrops/RepeatingImageTransition).
// Technique: clicking a grid photo sends a staggered trail of duplicate "mover"
// elements flying from the grid position to a detail panel, each revealed and
// hidden with a directional clip-path as it travels — the panel settles with
// the full nítida image and caption. Escape or the close link resets the view.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';

    function itemMarkup(media, i) {
        var title = media.name || ('Referencia ' + (i + 1));
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '';
        var bgStyle = media.type === 'video' ? '' : ' style="background-image:url(\'' + media.url + '\')"';
        return '' +
            '<figure class="grid__item" data-url="' + media.url + '" data-type="' + media.type + '">' +
                '<div class="grid__item-image"' + bgStyle + '>' + inner + '</div>' +
                '<figcaption class="grid__item-caption">' +
                    '<h3>' + title + '</h3>' +
                    '<p>Referencia disponible — contacta para más información.</p>' +
                '</figcaption>' +
            '</figure>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var media = EP.ScrollSections.fillMedia(mediaList, opts.itemCount || 8);

        var itemsHTML = media.length
            ? media.map(itemMarkup).join('\n        ')
            : '<p style="padding:4rem;color:#888">Sube imágenes o vídeos para ver el grid.</p>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Repeating Image Transition</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;min-height:100%;background:#0c0c0e;color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;}\n' +
'.frame{position:fixed;top:1.5rem;left:1.5rem;z-index:6;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.75;transition:opacity 0.4s;}\n' +
'.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.4vw;padding:8vh 4vw;max-width:1200px;margin:0 auto;}\n' +
'.grid__item{position:relative;aspect-ratio:1/1;border-radius:10px;overflow:hidden;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,0.4);}\n' +
'.grid__item-image{width:100%;height:100%;background-size:cover;background-position:center;}\n' +
'.grid__item-image video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.grid__item-caption{position:absolute;bottom:0;left:0;right:0;padding:0.7rem 0.9rem;background:linear-gradient(transparent,rgba(0,0,0,0.8));}\n' +
'.grid__item-caption h3{margin:0;font-size:0.85rem;font-weight:700;}\n' +
'.grid__item-caption p{margin:0.2rem 0 0;font-size:0.7rem;opacity:0.65;}\n' +
'@media (max-width:700px){.grid{grid-template-columns:repeat(2,1fr);}}\n' +
'.mover{position:fixed;background-size:cover;background-position:center;border-radius:8px;pointer-events:none;}\n' +
'.panel{position:fixed;top:0;bottom:0;width:min(46vw,560px);right:0;background:#141416;opacity:0;pointer-events:none;padding:4vw;display:flex;flex-direction:column;justify-content:center;}\n' +
'.panel--right{right:auto;left:0;}\n' +
'.panel__img{width:100%;aspect-ratio:4/3;border-radius:14px;background-size:cover;background-position:center;clip-path:inset(0% 0% 100% 0%);box-shadow:0 30px 80px rgba(0,0,0,0.5);}\n' +
'.panel__content{margin-top:1.6rem;}\n' +
'.panel__content h3{font-size:1.6rem;margin:0 0 0.4rem;}\n' +
'.panel__content p{font-size:0.9rem;opacity:0.7;line-height:1.5;margin:0 0 1.2rem;}\n' +
'.panel__close{color:#fff;text-decoration:none;font-size:0.8rem;letter-spacing:0.05em;text-transform:uppercase;border:1px solid rgba(255,255,255,0.3);padding:0.5rem 1rem;border-radius:20px;display:inline-block;}\n' +
'.panel__close:hover{background:rgba(255,255,255,0.1);}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="frame">' + title + '</div>\n' +
'<div class="grid">\n' +
'        ' + itemsHTML + '\n' +
'</div>\n' +
'<div class="panel">\n' +
'  <div class="panel__img"></div>\n' +
'  <div class="panel__content">\n' +
'    <h3></h3>\n' +
'    <p></p>\n' +
'    <a href="#" class="panel__close">Cerrar ✕</a>\n' +
'  </div>\n' +
'</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var config = {\n' +
'    clipPathDirection: "top-bottom", steps: 6, stepDuration: 0.35, stepInterval: 0.05,\n' +
'    moverPauseBeforeExit: 0.14, panelRevealEase: "sine.inOut", gridItemEase: "sine",\n' +
'    moverEnterEase: "sine.in", moverExitEase: "sine", panelRevealDurationFactor: 2,\n' +
'    clickedItemDurationFactor: 2, gridItemStaggerFactor: 0.3\n' +
'  };\n' +
'  var lerp = function(a, b, t) { return a + (b - a) * t; };\n' +
'  var grid = document.querySelector(".grid");\n' +
'  var frame = document.querySelector(".frame");\n' +
'  var panel = document.querySelector(".panel");\n' +
'  var panelContent = panel.querySelector(".panel__content");\n' +
'  var isAnimating = false, isPanelOpen = false, currentItem = null;\n' +
'\n' +
'  function hideFrame() { gsap.to(frame, { opacity: 0, duration: 0.5, ease: "sine.inOut", pointerEvents: "none" }); }\n' +
'  function showFrame() { gsap.to(frame, { opacity: 1, duration: 0.5, ease: "sine.inOut", pointerEvents: "auto" }); }\n' +
'\n' +
'  function positionPanelBasedOnClick(clickedItem) {\n' +
'    var centerX = getElementCenter(clickedItem).x;\n' +
'    var isLeftSide = centerX < window.innerWidth / 2;\n' +
'    panel.classList.toggle("panel--right", isLeftSide);\n' +
'  }\n' +
'\n' +
'  function getClipPathsForDirection(direction) {\n' +
'    switch (direction) {\n' +
'      case "bottom-top": return { from: "inset(0% 0% 100% 0%)", reveal: "inset(0% 0% 0% 0%)", hide: "inset(100% 0% 0% 0%)" };\n' +
'      case "left-right": return { from: "inset(0% 100% 0% 0%)", reveal: "inset(0% 0% 0% 0%)", hide: "inset(0% 0% 0% 100%)" };\n' +
'      case "right-left": return { from: "inset(0% 0% 0% 100%)", reveal: "inset(0% 0% 0% 0%)", hide: "inset(0% 100% 0% 0%)" };\n' +
'      default: return { from: "inset(100% 0% 0% 0%)", reveal: "inset(0% 0% 0% 0%)", hide: "inset(0% 0% 100% 0%)" };\n' +
'    }\n' +
'  }\n' +
'\n' +
'  function getElementCenter(el) {\n' +
'    var r = el.getBoundingClientRect();\n' +
'    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };\n' +
'  }\n' +
'\n' +
'  function computeStaggerDelays(clickedItem, items) {\n' +
'    var baseCenter = getElementCenter(clickedItem);\n' +
'    var distances = Array.prototype.map.call(items, function(el) {\n' +
'      var c = getElementCenter(el);\n' +
'      return Math.hypot(c.x - baseCenter.x, c.y - baseCenter.y);\n' +
'    });\n' +
'    var max = Math.max.apply(null, distances) || 1;\n' +
'    return distances.map(function(d) { return (d / max) * config.gridItemStaggerFactor; });\n' +
'  }\n' +
'\n' +
'  function animateGridItems(items, clickedItem, delays) {\n' +
'    var clipPaths = getClipPathsForDirection(config.clipPathDirection);\n' +
'    gsap.to(items, {\n' +
'      opacity: 0,\n' +
'      scale: function(i, el) { return el === clickedItem ? 1 : 0.8; },\n' +
'      duration: function(i, el) { return el === clickedItem ? config.stepDuration * config.clickedItemDurationFactor : 0.3; },\n' +
'      ease: config.gridItemEase,\n' +
'      clipPath: function(i, el) { return el === clickedItem ? clipPaths.from : "none"; },\n' +
'      delay: function(i) { return delays[i]; }\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function generateMotionPath(startRect, endRect, steps) {\n' +
'    var path = [], fullSteps = steps + 2;\n' +
'    var startCenter = { x: startRect.left + startRect.width / 2, y: startRect.top + startRect.height / 2 };\n' +
'    var endCenter = { x: endRect.left + endRect.width / 2, y: endRect.top + endRect.height / 2 };\n' +
'    for (var i = 0; i < fullSteps; i++) {\n' +
'      var t = i / (fullSteps - 1);\n' +
'      var width = lerp(startRect.width, endRect.width, t);\n' +
'      var height = lerp(startRect.height, endRect.height, t);\n' +
'      var cx = lerp(startCenter.x, endCenter.x, t);\n' +
'      var cy = lerp(startCenter.y, endCenter.y, t);\n' +
'      path.push({ left: cx - width / 2, top: cy - height / 2, width: width, height: height });\n' +
'    }\n' +
'    return path.slice(1, -1);\n' +
'  }\n' +
'\n' +
'  function createMoverStyle(step, index, imgURL) {\n' +
'    return {\n' +
'      backgroundImage: imgURL, position: "fixed", left: step.left, top: step.top,\n' +
'      width: step.width, height: step.height,\n' +
'      clipPath: getClipPathsForDirection(config.clipPathDirection).from,\n' +
'      zIndex: 1000 + index, backgroundPosition: "50% 50%"\n' +
'    };\n' +
'  }\n' +
'\n' +
'  function scheduleCleanup(movers) {\n' +
'    var cleanupDelay = config.steps * config.stepInterval + config.stepDuration * 2 + config.moverPauseBeforeExit;\n' +
'    gsap.delayedCall(cleanupDelay, function() { movers.forEach(function(m) { m.remove(); }); });\n' +
'  }\n' +
'\n' +
'  function revealPanel(endImg) {\n' +
'    var clipPaths = getClipPathsForDirection(config.clipPathDirection);\n' +
'    gsap.set(panelContent, { opacity: 0 });\n' +
'    gsap.set(panel, { opacity: 1, pointerEvents: "auto" });\n' +
'    gsap.timeline({ defaults: { duration: config.stepDuration * config.panelRevealDurationFactor, ease: config.panelRevealEase } })\n' +
'      .fromTo(endImg, { clipPath: clipPaths.hide }, { clipPath: clipPaths.reveal, pointerEvents: "auto", delay: config.steps * config.stepInterval })\n' +
'      .fromTo(panelContent, { y: 25 }, {\n' +
'        duration: 1, ease: "expo", opacity: 1, y: 0, delay: config.steps * config.stepInterval,\n' +
'        onComplete: function() { isAnimating = false; isPanelOpen = true; }\n' +
'      }, "<-=.2");\n' +
'  }\n' +
'\n' +
'  function animateTransition(startEl, endEl, imgURL) {\n' +
'    hideFrame();\n' +
'    var path = generateMotionPath(startEl.getBoundingClientRect(), endEl.getBoundingClientRect(), config.steps);\n' +
'    var frag = document.createDocumentFragment();\n' +
'    var clipPaths = getClipPathsForDirection(config.clipPathDirection);\n' +
'    path.forEach(function(step, index) {\n' +
'      var mover = document.createElement("div");\n' +
'      mover.className = "mover";\n' +
'      gsap.set(mover, createMoverStyle(step, index, imgURL));\n' +
'      frag.appendChild(mover);\n' +
'      var delay = index * config.stepInterval;\n' +
'      gsap.timeline({ delay: delay })\n' +
'        .fromTo(mover, { opacity: 0.4, clipPath: clipPaths.hide }, { opacity: 1, clipPath: clipPaths.reveal, duration: config.stepDuration, ease: config.moverEnterEase })\n' +
'        .to(mover, { clipPath: clipPaths.from, duration: config.stepDuration, ease: config.moverExitEase }, "+=" + config.moverPauseBeforeExit);\n' +
'    });\n' +
'    grid.parentNode.insertBefore(frag, grid.nextSibling);\n' +
'    scheduleCleanup(document.querySelectorAll(".mover"));\n' +
'    revealPanel(endEl);\n' +
'  }\n' +
'\n' +
'  function extractItemData(item) {\n' +
'    var imgDiv = item.querySelector(".grid__item-image");\n' +
'    var caption = item.querySelector("figcaption");\n' +
'    var url = item.dataset.url;\n' +
'    return {\n' +
'      imgURL: "url(\'" + url + "\')",\n' +
'      title: caption.querySelector("h3").textContent,\n' +
'      desc: caption.querySelector("p").textContent\n' +
'    };\n' +
'  }\n' +
'  function setPanelContent(data) {\n' +
'    panel.querySelector(".panel__img").style.backgroundImage = data.imgURL;\n' +
'    panel.querySelector("h3").textContent = data.title;\n' +
'    panel.querySelector("p").textContent = data.desc;\n' +
'  }\n' +
'\n' +
'  function onGridItemClick(item) {\n' +
'    if (isAnimating) return;\n' +
'    isAnimating = true; currentItem = item;\n' +
'    positionPanelBasedOnClick(item);\n' +
'    var data = extractItemData(item);\n' +
'    setPanelContent(data);\n' +
'    var allItems = document.querySelectorAll(".grid__item");\n' +
'    var delays = computeStaggerDelays(item, allItems);\n' +
'    animateGridItems(allItems, item, delays);\n' +
'    animateTransition(item.querySelector(".grid__item-image"), panel.querySelector(".panel__img"), data.imgURL);\n' +
'  }\n' +
'\n' +
'  function resetView() {\n' +
'    if (isAnimating) return;\n' +
'    isAnimating = true;\n' +
'    var allItems = document.querySelectorAll(".grid__item");\n' +
'    var delays = computeStaggerDelays(currentItem, allItems);\n' +
'    gsap.timeline({\n' +
'      defaults: { duration: config.stepDuration, ease: "expo" },\n' +
'      onComplete: function() { panel.classList.remove("panel--right"); isAnimating = false; isPanelOpen = false; }\n' +
'    })\n' +
'    .to(panel, { opacity: 0 })\n' +
'    .add(showFrame, 0)\n' +
'    .set(panel, { opacity: 0, pointerEvents: "none" })\n' +
'    .set(panel.querySelector(".panel__img"), { clipPath: "inset(0% 0% 100% 0%)" })\n' +
'    .set(allItems, { clipPath: "none", opacity: 0, scale: 0.8 }, 0)\n' +
'    .to(allItems, { opacity: 1, scale: 1, delay: function(i) { return delays[i]; } }, ">");\n' +
'  }\n' +
'\n' +
'  document.querySelectorAll(".grid__item").forEach(function(item) {\n' +
'    item.addEventListener("click", function() { onGridItemClick(item); });\n' +
'  });\n' +
'  panelContent.querySelector(".panel__close").addEventListener("click", function(e) {\n' +
'    e.preventDefault(); resetView();\n' +
'  });\n' +
'  document.addEventListener("keydown", function(e) {\n' +
'    if (e.key === "Escape" && isPanelOpen && !isAnimating) resetView();\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'repeating-image-transition',
        name: 'Repeating Image Transition',
        icon: '👻',
        description: 'Grid con panel de detalle — al hacer clic, un rastro escalonado de copias de la imagen "vuela" hacia el panel con revelado direccional, terminando en la foto nítida a gran tamaño con su ficha',
        sourceUrl: 'https://github.com/codrops/RepeatingImageTransition',
        build: build
    });
})();
