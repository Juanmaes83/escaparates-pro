// Blinds Scroll Reveal — adapted from the Codrops repo "Scroll-Transition"
// (source read & understood: the "Horizontal Blinds" variant — a stack of
// full-screen SVG image layers, each masked by N thin horizontal rectangles;
// scrolling through a tall pinned section grows each layer's rectangles in a
// staggered sweep, "opening the blinds" to reveal the layer beneath while a
// caption crossfades and a segmented progress bar tracks position — recreated
// with the client's own media list instead of the tutorial's 3 static photos).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function layerMarkup(media, i) {
        var n = i + 1;
        var inner = media.type === 'video'
            ? '<foreignObject x="0" y="0" width="100" height="100" mask="url(#mask' + n + ')"><video xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;object-fit:cover;" src="' + media.url + '" autoplay muted loop playsinline></video></foreignObject>'
            : '<image href="' + media.url + '" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" mask="url(#mask' + n + ')" />';
        return '' +
'      <svg class="layer" viewBox="0 0 100 100" preserveAspectRatio="none">\n' +
'        <defs><mask id="mask' + n + '" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="100" height="100" fill="black"/><g id="blinds' + n + '"></g></mask></defs>\n' +
'        ' + inner + '\n' +
'      </svg>';
    }

    function textMarkup(media, i) {
        var label = media.name || ('Referencia ' + (i + 1));
        return '' +
'        <div class="txt">\n' +
'          <h1>' + (i < 9 ? '0' : '') + (i + 1) + '</h1>\n' +
'          <h2>' + label + '</h2>\n' +
'        </div>';
    }

    function segmentMarkup() {
        return '<div class="segment"><div class="fill"></div></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 4;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var n = media.length || itemCount;

        var layersHTML = media.map(layerMarkup).join('\n');
        var textsHTML = media.map(textMarkup).join('\n');
        var segmentsHTML = media.map(segmentMarkup).join('');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Blinds Scroll Reveal</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html,body{background:#0a0a0c;color:#fff;font-family:Arial,Helvetica,sans-serif;}\n' +
'.spacer{height:60vh;display:grid;place-items:center;text-align:center;}\n' +
'.spacer h1{font-size:clamp(1.6rem,4vw,3rem);font-weight:800;letter-spacing:0.02em;text-transform:uppercase;}\n' +
'.spacer .info{opacity:0.55;font-size:0.9rem;letter-spacing:0.1em;text-transform:uppercase;margin-top:1rem;display:block;}\n' +
'.stage{height:' + (n * 100 + 100) + 'vh;position:relative;}\n' +
'.layers{position:sticky;top:0;width:100vw;height:100vh;overflow:hidden;}\n' +
'.layer{position:absolute;inset:0;width:100%;height:100%;}\n' +
'.layer image{width:100%;height:100%;object-fit:cover;filter:brightness(0.82);}\n' +
'.txt{position:absolute;left:0;width:100%;padding:3vw;color:#fff;text-transform:uppercase;clip-path:inset(100% 0 0 0);transform:translateY(40px);pointer-events:none;}\n' +
'.txt h1{margin-top:10vh;font-size:clamp(3rem,8vw,8rem);letter-spacing:-0.02em;line-height:0.85;}\n' +
'.txt h2{margin-top:2vw;font-size:clamp(1.1rem,1.6vw,1.6rem);letter-spacing:0.15em;}\n' +
'.progress-bar{position:fixed;bottom:0;left:0;width:100%;padding:2rem 3rem;display:flex;gap:1rem;z-index:20;}\n' +
'.segment{flex:1;height:2px;background:rgba(255,255,255,0.2);overflow:hidden;position:relative;}\n' +
'.fill{position:absolute;top:0;left:0;width:0%;height:100%;background:#fff;}\n' +
'.title{position:fixed;top:2rem;left:50%;transform:translateX(-50%);z-index:20;font-size:1rem;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;pointer-events:none;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="title">' + title + '</div>\n' +
'<div class="spacer"><h1>' + title + '</h1><span class="info">Scroll para descubrir las referencias</span></div>\n' +
'<section class="stage">\n' +
'  <div class="layers">\n' +
'' + layersHTML + '\n' +
'    <div class="progress-bar">' + segmentsHTML + '</div>\n' +
'    <div class="texts">\n' +
'' + textsHTML + '\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"><h1>FIN</h1></div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger);\n' +
'  var lenis = new Lenis({ lerp: 0.15, smoothWheel: true });\n' +
'  lenis.on("scroll", ScrollTrigger.update);\n' +
'  gsap.ticker.add(function(time) { lenis.raf(time * 1000); });\n' +
'\n' +
'  var BLIND_COUNT = 24;\n' +
'  var svgNS = "http://www.w3.org/2000/svg";\n' +
'  var blindsSets = [], master;\n' +
'\n' +
'  function createBlinds(groupId) {\n' +
'    var g = document.getElementById(groupId);\n' +
'    if (!g) return null;\n' +
'    g.innerHTML = "";\n' +
'    var height = window.innerHeight, width = window.innerWidth;\n' +
'    var vbHeight = (height / width) * 100;\n' +
'    var h = vbHeight / BLIND_COUNT;\n' +
'    var blinds = [], currentY = 0;\n' +
'    for (var i = 0; i < BLIND_COUNT; i++) {\n' +
'      var centerY = vbHeight - (currentY + h / 2);\n' +
'      var rectTop = document.createElementNS(svgNS, "rect");\n' +
'      var rectBottom = document.createElementNS(svgNS, "rect");\n' +
'      [rectTop, rectBottom].forEach(function(r) {\n' +
'        r.setAttribute("x", 0); r.setAttribute("width", 100); r.setAttribute("height", 0);\n' +
'        r.setAttribute("fill", "white"); r.setAttribute("shape-rendering", "crispEdges");\n' +
'      });\n' +
'      rectTop.setAttribute("y", centerY); rectBottom.setAttribute("y", centerY);\n' +
'      g.appendChild(rectTop); g.appendChild(rectBottom);\n' +
'      blinds.push({ top: rectTop, bottom: rectBottom, y: centerY, h: h / 2 });\n' +
'      currentY += h;\n' +
'    }\n' +
'    return blinds;\n' +
'  }\n' +
'\n' +
'  function updateLayout() {\n' +
'    var width = window.innerWidth, height = window.innerHeight;\n' +
'    var vbHeight = (height / width) * 100;\n' +
'    var layers = document.querySelectorAll(".layer");\n' +
'    blindsSets = [];\n' +
'    layers.forEach(function(svg) {\n' +
'      svg.setAttribute("viewBox", "0 0 100 " + vbHeight);\n' +
'      var maskRect = svg.querySelector("mask rect");\n' +
'      if (maskRect) { maskRect.setAttribute("width", 100); maskRect.setAttribute("height", vbHeight); }\n' +
'      var img = svg.querySelector("image");\n' +
'      if (img) { img.setAttribute("width", 100); img.setAttribute("height", vbHeight); }\n' +
'      var blindId = svg.querySelector(\'g[id^="blinds"]\').id;\n' +
'      var blinds = createBlinds(blindId);\n' +
'      if (blinds) blindsSets.push(blinds);\n' +
'    });\n' +
'    buildMasterTimeline();\n' +
'  }\n' +
'\n' +
'  function openBlinds(blinds) {\n' +
'    var targets = [];\n' +
'    blinds.forEach(function(b) { targets.push(b.top, b.bottom); });\n' +
'    return gsap.timeline().to(targets, {\n' +
'      attr: {\n' +
'        y: function(i) { var b = blinds[Math.floor(i / 2)]; return i % 2 === 0 ? b.y - b.h : b.y; },\n' +
'        height: function(i) { var b = blinds[Math.floor(i / 2)]; return b.h + 0.01; }\n' +
'      },\n' +
'      ease: "power3.out",\n' +
'      stagger: { each: 0.02, from: "start" }\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function textIn(el) { return gsap.to(el, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.2, ease: "expo.out" }); }\n' +
'  function textOut(el) { return gsap.to(el, { clipPath: "inset(0% 0% 100% 0%)", y: -30, duration: 1, ease: "power2.inOut" }); }\n' +
'\n' +
'  function buildMasterTimeline() {\n' +
'    if (master) master.kill();\n' +
'    var texts = gsap.utils.toArray(".txt");\n' +
'    master = gsap.timeline({\n' +
'      scrollTrigger: { trigger: ".stage", start: "top top", end: "bottom bottom", scrub: 2, anticipatePin: 1, invalidateOnRefresh: true }\n' +
'    });\n' +
'    blindsSets.forEach(function(blinds, i) {\n' +
'      master.add(openBlinds(blinds));\n' +
'      if (texts[i]) { master.add(textIn(texts[i]), "-=0.3"); master.add(textOut(texts[i]), "+=0.7"); }\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function initProgressBar() {\n' +
'    var progressFills = gsap.utils.toArray(".progress-bar .fill");\n' +
'    ScrollTrigger.create({\n' +
'      trigger: ".stage", start: "top top", end: "bottom bottom", scrub: 0.3,\n' +
'      onUpdate: function(self) {\n' +
'        var progress = self.progress, totalSteps = progressFills.length;\n' +
'        progressFills.forEach(function(fill, i) {\n' +
'          var p = (progress - i / totalSteps) * totalSteps;\n' +
'          p = Math.max(0, Math.min(1, p));\n' +
'          fill.style.width = (p * 100) + "%";\n' +
'        });\n' +
'      }\n' +
'    });\n' +
'  }\n' +
'\n' +
'  updateLayout();\n' +
'  initProgressBar();\n' +
'\n' +
'  var resizeTimer;\n' +
'  window.addEventListener("resize", function() { clearTimeout(resizeTimer); resizeTimer = setTimeout(updateLayout, 250); });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'blinds-scroll-reveal',
        name: 'Blinds Scroll Reveal',
        icon: '🪟',
        description: 'Persianas de líneas horizontales que se abren en cascada al hacer scroll, revelando la siguiente referencia con su título; barra de progreso segmentada y sección fijada mientras se recorre cada imagen',
        sourceUrl: 'https://github.com/Juanmaes83/Scroll-Transition',
        build: build
    });
})();
