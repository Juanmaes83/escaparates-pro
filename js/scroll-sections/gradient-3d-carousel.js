// Gradient 3D Carousel — adapted from Clément Grellier's "Infinite Gradient
// 3D Carousel" (source read & understood: github.com/clementgrellier/gradientslider).
// Technique: an infinite drag/wheel-driven 3D carousel with real physics
// (velocity + friction decay, no GSAP scrub), each card rotated/scaled/blurred
// by its distance from center, and a canvas background gradient that morphs
// to the dominant colors extracted from the currently centered image via
// hue/saturation histogram analysis.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var media = EP.ScrollSections.fillMedia(mediaList, opts.itemCount || 10);
        var urlsJson = JSON.stringify(media.map(function(m) { return m.url; }));
        var typesJson = JSON.stringify(media.map(function(m) { return m.type; }));

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Gradient 3D Carousel</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;height:100%;background:#f0f0f0;overflow:hidden;font-family:Arial,Helvetica,sans-serif;}\n' +
'.g3c-title{position:fixed;top:1.5rem;left:1.5rem;z-index:6;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.55;color:#222;}\n' +
'.stage{position:relative;width:100vw;height:100vh;overflow:hidden;color:#222;}\n' +
'.stage.carousel-mode{touch-action:none;cursor:grab;}\n' +
'.stage.carousel-mode.dragging{cursor:grabbing;}\n' +
'#bg{position:absolute;inset:0;z-index:0;width:100%;height:100%;}\n' +
'.cards{position:absolute;inset:0;z-index:1;perspective:1400px;transform-style:preserve-3d;}\n' +
'.card{position:absolute;top:50%;left:50%;width:min(26vw,360px);aspect-ratio:4/5;will-change:transform;}\n' +
'.card__img{border-radius:15px;opacity:1;width:100%;height:100%;object-fit:cover;display:block;box-shadow:0 20px 60px rgba(0,0,0,0.25);}\n' +
'.loader{position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:#f0f0f0;transition:opacity 0.4s;}\n' +
'.loader--hide{opacity:0;pointer-events:none;}\n' +
'.loader__ring{width:32px;height:32px;border:3px solid rgba(0,0,0,0.15);border-top-color:#222;border-radius:50%;animation:g3cspin 0.8s linear infinite;}\n' +
'@keyframes g3cspin{to{transform:rotate(360deg);}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="g3c-title">' + title + '</div>\n' +
'<main class="stage">\n' +
'  <div id="loader" class="loader"><div class="loader__ring"></div></div>\n' +
'  <canvas id="bg"></canvas>\n' +
'  <section id="cards" class="cards"></section>\n' +
'</main>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var MEDIA_URLS = ' + urlsJson + ';\n' +
'  var MEDIA_TYPES = ' + typesJson + ';\n' +
'  var FRICTION = 0.9, WHEEL_SENS = 0.6, DRAG_SENS = 1.0;\n' +
'  var MAX_ROTATION = 28, MAX_DEPTH = 140, MIN_SCALE = 0.92, SCALE_RANGE = 0.1, GAP = 28;\n' +
'  var stage = document.querySelector(".stage");\n' +
'  var cardsRoot = document.getElementById("cards");\n' +
'  var bgCanvas = document.getElementById("bg");\n' +
'  var bgCtx = bgCanvas.getContext("2d", { alpha: false });\n' +
'  var loader = document.getElementById("loader");\n' +
'  var items = [], positions = [], activeIndex = -1, isEntering = true;\n' +
'  var CARD_W = 300, CARD_H = 400, STEP = CARD_W + GAP, TRACK = 0, SCROLL_X = 0;\n' +
'  var VW_HALF = window.innerWidth * 0.5;\n' +
'  var vX = 0, rafId = null, bgRAF = null, lastTime = 0, lastBgDraw = 0;\n' +
'  var gradPalette = [];\n' +
'  var gradCurrent = { r1: 240, g1: 240, b1: 240, r2: 235, g2: 235, b2: 235 };\n' +
'  var bgFastUntil = 0;\n' +
'\n' +
'  function mod(n, m) { return ((n % m) + m) % m; }\n' +
'\n' +
'  function createCards() {\n' +
'    cardsRoot.innerHTML = ""; items = [];\n' +
'    var frag = document.createDocumentFragment();\n' +
'    MEDIA_URLS.forEach(function(src, i) {\n' +
'      var card = document.createElement("article");\n' +
'      card.className = "card"; card.style.willChange = "transform";\n' +
'      var el;\n' +
'      if (MEDIA_TYPES[i] === "video") {\n' +
'        el = document.createElement("video");\n' +
'        el.autoplay = true; el.muted = true; el.loop = true; el.playsInline = true;\n' +
'      } else {\n' +
'        el = new Image();\n' +
'        el.decoding = "async"; el.loading = "eager";\n' +
'      }\n' +
'      el.className = "card__img"; el.draggable = false; el.src = src;\n' +
'      card.appendChild(el);\n' +
'      frag.appendChild(card);\n' +
'      items.push({ el: card, x: i * STEP });\n' +
'    });\n' +
'    cardsRoot.appendChild(frag);\n' +
'  }\n' +
'\n' +
'  function measure() {\n' +
'    var sample = items[0] && items[0].el;\n' +
'    if (!sample) return;\n' +
'    var r = sample.getBoundingClientRect();\n' +
'    CARD_W = r.width || CARD_W; CARD_H = r.height || CARD_H;\n' +
'    STEP = CARD_W + GAP; TRACK = items.length * STEP;\n' +
'    items.forEach(function(it, i) { it.x = i * STEP; });\n' +
'    positions = new Float32Array(items.length);\n' +
'  }\n' +
'\n' +
'  function computeTransformComponents(screenX) {\n' +
'    var norm = Math.max(-1, Math.min(1, screenX / VW_HALF));\n' +
'    var absNorm = Math.abs(norm), invNorm = 1 - absNorm;\n' +
'    return { ry: -norm * MAX_ROTATION, tz: invNorm * MAX_DEPTH, scale: MIN_SCALE + invNorm * SCALE_RANGE };\n' +
'  }\n' +
'  function transformForScreenX(screenX) {\n' +
'    var c = computeTransformComponents(screenX);\n' +
'    return { transform: "translate3d(" + screenX + "px,-50%," + c.tz + "px) rotateY(" + c.ry + "deg) scale(" + c.scale + ")", z: c.tz };\n' +
'  }\n' +
'\n' +
'  function updateCarouselTransforms() {\n' +
'    var half = TRACK / 2, closestIdx = -1, closestDist = Infinity;\n' +
'    for (var i = 0; i < items.length; i++) {\n' +
'      var pos = items[i].x - SCROLL_X;\n' +
'      if (pos < -half) pos += TRACK;\n' +
'      if (pos > half) pos -= TRACK;\n' +
'      positions[i] = pos;\n' +
'      var dist = Math.abs(pos);\n' +
'      if (dist < closestDist) { closestDist = dist; closestIdx = i; }\n' +
'    }\n' +
'    var prevIdx = (closestIdx - 1 + items.length) % items.length;\n' +
'    var nextIdx = (closestIdx + 1) % items.length;\n' +
'    for (i = 0; i < items.length; i++) {\n' +
'      var it = items[i], pos2 = positions[i];\n' +
'      var norm = Math.max(-1, Math.min(1, pos2 / VW_HALF));\n' +
'      var tf = transformForScreenX(pos2);\n' +
'      it.el.style.transform = tf.transform;\n' +
'      it.el.style.zIndex = String(1000 + Math.round(tf.z));\n' +
'      var isCore = i === closestIdx || i === prevIdx || i === nextIdx;\n' +
'      var blur = isCore ? 0 : 2 * Math.pow(Math.abs(norm), 1.1);\n' +
'      it.el.style.filter = "blur(" + blur.toFixed(2) + "px)";\n' +
'    }\n' +
'    if (closestIdx !== activeIndex) setActiveGradient(closestIdx);\n' +
'  }\n' +
'\n' +
'  function tick(t) {\n' +
'    var dt = lastTime ? (t - lastTime) / 1000 : 0; lastTime = t;\n' +
'    SCROLL_X = mod(SCROLL_X + vX * dt, TRACK);\n' +
'    var decay = Math.pow(FRICTION, dt * 60);\n' +
'    vX *= decay; if (Math.abs(vX) < 0.02) vX = 0;\n' +
'    updateCarouselTransforms();\n' +
'    rafId = requestAnimationFrame(tick);\n' +
'  }\n' +
'  function startCarousel() { cancelCarousel(); lastTime = 0; rafId = requestAnimationFrame(function(t){ updateCarouselTransforms(); tick(t); }); }\n' +
'  function cancelCarousel() { if (rafId) cancelAnimationFrame(rafId); rafId = null; }\n' +
'\n' +
'  function rgbToHsl(r, g, b) {\n' +
'    r /= 255; g /= 255; b /= 255;\n' +
'    var max = Math.max(r, g, b), min = Math.min(r, g, b), h, s, l = (max + min) / 2;\n' +
'    if (max === min) { h = 0; s = 0; }\n' +
'    else {\n' +
'      var d = max - min;\n' +
'      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);\n' +
'      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);\n' +
'      else if (max === g) h = (b - r) / d + 2;\n' +
'      else h = (r - g) / d + 4;\n' +
'      h /= 6;\n' +
'    }\n' +
'    return [h * 360, s, l];\n' +
'  }\n' +
'  function hslToRgb(h, s, l) {\n' +
'    h = ((h % 360) + 360) % 360; h /= 360;\n' +
'    var r, g, b;\n' +
'    if (s === 0) { r = g = b = l; }\n' +
'    else {\n' +
'      var hue2rgb = function(p, q, t) {\n' +
'        if (t < 0) t += 1; if (t > 1) t -= 1;\n' +
'        if (t < 1/6) return p + (q - p) * 6 * t;\n' +
'        if (t < 1/2) return q;\n' +
'        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;\n' +
'        return p;\n' +
'      };\n' +
'      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;\n' +
'      var p = 2 * l - q;\n' +
'      r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);\n' +
'    }\n' +
'    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];\n' +
'  }\n' +
'  function fallbackFromIndex(idx) {\n' +
'    var h = (idx * 37) % 360;\n' +
'    return { c1: hslToRgb(h, 0.65, 0.52), c2: hslToRgb(h, 0.65, 0.72) };\n' +
'  }\n' +
'  function extractColors(imgEl, idx) {\n' +
'    try {\n' +
'      if (imgEl.tagName === "VIDEO") return fallbackFromIndex(idx);\n' +
'      var MAX = 48;\n' +
'      var ratio = imgEl.naturalWidth && imgEl.naturalHeight ? imgEl.naturalWidth / imgEl.naturalHeight : 1;\n' +
'      var tw = ratio >= 1 ? MAX : Math.max(16, Math.round(MAX * ratio));\n' +
'      var th = ratio >= 1 ? Math.max(16, Math.round(MAX / ratio)) : MAX;\n' +
'      var canvas = document.createElement("canvas"); canvas.width = tw; canvas.height = th;\n' +
'      var ctx = canvas.getContext("2d");\n' +
'      ctx.drawImage(imgEl, 0, 0, tw, th);\n' +
'      var data = ctx.getImageData(0, 0, tw, th).data;\n' +
'      var H_BINS = 36, S_BINS = 5, SIZE = H_BINS * S_BINS;\n' +
'      var wSum = new Float32Array(SIZE), rSum = new Float32Array(SIZE), gSum = new Float32Array(SIZE), bSum = new Float32Array(SIZE);\n' +
'      for (var i = 0; i < data.length; i += 4) {\n' +
'        var a = data[i + 3] / 255; if (a < 0.05) continue;\n' +
'        var r = data[i], g = data[i + 1], b = data[i + 2];\n' +
'        var hsl = rgbToHsl(r, g, b), h = hsl[0], s = hsl[1], l = hsl[2];\n' +
'        if (l < 0.1 || l > 0.92 || s < 0.08) continue;\n' +
'        var w = a * (s * s) * (1 - Math.abs(l - 0.5) * 0.6);\n' +
'        var hi = Math.max(0, Math.min(H_BINS - 1, Math.floor((h / 360) * H_BINS)));\n' +
'        var si = Math.max(0, Math.min(S_BINS - 1, Math.floor(s * S_BINS)));\n' +
'        var bidx = hi * S_BINS + si;\n' +
'        wSum[bidx] += w; rSum[bidx] += r * w; gSum[bidx] += g * w; bSum[bidx] += b * w;\n' +
'      }\n' +
'      var pIdx = -1, pW = 0;\n' +
'      for (i = 0; i < SIZE; i++) { if (wSum[i] > pW) { pW = wSum[i]; pIdx = i; } }\n' +
'      if (pIdx < 0 || pW <= 0) return fallbackFromIndex(idx);\n' +
'      var pHue = Math.floor(pIdx / S_BINS) * (360 / H_BINS);\n' +
'      var sIdx = -1, sW = 0;\n' +
'      for (i = 0; i < SIZE; i++) {\n' +
'        var w2 = wSum[i]; if (w2 <= 0) continue;\n' +
'        var hh = Math.floor(i / S_BINS) * (360 / H_BINS);\n' +
'        var dh = Math.abs(hh - pHue); dh = Math.min(dh, 360 - dh);\n' +
'        if (dh >= 25 && w2 > sW) { sW = w2; sIdx = i; }\n' +
'      }\n' +
'      var avgRGB = function(idx2) {\n' +
'        var w3 = wSum[idx2] || 1e-6;\n' +
'        return [Math.round(rSum[idx2]/w3), Math.round(gSum[idx2]/w3), Math.round(bSum[idx2]/w3)];\n' +
'      };\n' +
'      var prgb = avgRGB(pIdx);\n' +
'      var hsl1 = rgbToHsl(prgb[0], prgb[1], prgb[2]);\n' +
'      var s1 = Math.max(0.45, Math.min(1, hsl1[1] * 1.15));\n' +
'      var c1 = hslToRgb(hsl1[0], s1, 0.5);\n' +
'      var c2;\n' +
'      if (sIdx >= 0 && sW >= pW * 0.6) {\n' +
'        var srgb = avgRGB(sIdx);\n' +
'        var hsl2 = rgbToHsl(srgb[0], srgb[1], srgb[2]);\n' +
'        var s2 = Math.max(0.45, Math.min(1, hsl2[1] * 1.05));\n' +
'        c2 = hslToRgb(hsl2[0], s2, 0.72);\n' +
'      } else { c2 = hslToRgb(hsl1[0], s1, 0.72); }\n' +
'      return { c1: c1, c2: c2 };\n' +
'    } catch (e) { return fallbackFromIndex(idx); }\n' +
'  }\n' +
'  function buildPalette() {\n' +
'    gradPalette = items.map(function(it, i) {\n' +
'      var el = it.el.querySelector("img, video");\n' +
'      return extractColors(el, i);\n' +
'    });\n' +
'  }\n' +
'  function setActiveGradient(idx) {\n' +
'    if (idx < 0 || idx >= items.length || idx === activeIndex) return;\n' +
'    activeIndex = idx;\n' +
'    var pal = gradPalette[idx] || { c1: [240,240,240], c2: [235,235,235] };\n' +
'    var to = { r1: pal.c1[0], g1: pal.c1[1], b1: pal.c1[2], r2: pal.c2[0], g2: pal.c2[1], b2: pal.c2[2] };\n' +
'    bgFastUntil = performance.now() + 800;\n' +
'    gsap.to(gradCurrent, Object.assign({}, to, { duration: 0.45, ease: "power2.out" }));\n' +
'  }\n' +
'\n' +
'  function resizeBG() {\n' +
'    var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));\n' +
'    var w = bgCanvas.clientWidth || stage.clientWidth, h = bgCanvas.clientHeight || stage.clientHeight;\n' +
'    var tw = Math.floor(w * dpr), th = Math.floor(h * dpr);\n' +
'    if (bgCanvas.width !== tw || bgCanvas.height !== th) {\n' +
'      bgCanvas.width = tw; bgCanvas.height = th;\n' +
'      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);\n' +
'    }\n' +
'  }\n' +
'  function drawBackground() {\n' +
'    var now = performance.now();\n' +
'    var minInterval = now < bgFastUntil ? 16 : 33;\n' +
'    if (now - lastBgDraw < minInterval) { bgRAF = requestAnimationFrame(drawBackground); return; }\n' +
'    lastBgDraw = now; resizeBG();\n' +
'    var w = bgCanvas.clientWidth || stage.clientWidth, h = bgCanvas.clientHeight || stage.clientHeight;\n' +
'    bgCtx.fillStyle = "#f6f7f9"; bgCtx.fillRect(0, 0, w, h);\n' +
'    var time = now * 0.0002, cx = w * 0.5, cy = h * 0.5;\n' +
'    var a1 = Math.min(w, h) * 0.35, a2 = Math.min(w, h) * 0.28;\n' +
'    var x1 = cx + Math.cos(time) * a1, y1 = cy + Math.sin(time * 0.8) * a1 * 0.4;\n' +
'    var x2 = cx + Math.cos(-time * 0.9 + 1.2) * a2, y2 = cy + Math.sin(-time * 0.7 + 0.7) * a2 * 0.5;\n' +
'    var r1 = Math.max(w, h) * 0.75, r2 = Math.max(w, h) * 0.65;\n' +
'    var g1 = bgCtx.createRadialGradient(x1, y1, 0, x1, y1, r1);\n' +
'    g1.addColorStop(0, "rgba(" + gradCurrent.r1 + "," + gradCurrent.g1 + "," + gradCurrent.b1 + ",0.85)");\n' +
'    g1.addColorStop(1, "rgba(255,255,255,0)");\n' +
'    bgCtx.fillStyle = g1; bgCtx.fillRect(0, 0, w, h);\n' +
'    var g2 = bgCtx.createRadialGradient(x2, y2, 0, x2, y2, r2);\n' +
'    g2.addColorStop(0, "rgba(" + gradCurrent.r2 + "," + gradCurrent.g2 + "," + gradCurrent.b2 + ",0.70)");\n' +
'    g2.addColorStop(1, "rgba(255,255,255,0)");\n' +
'    bgCtx.fillStyle = g2; bgCtx.fillRect(0, 0, w, h);\n' +
'    bgRAF = requestAnimationFrame(drawBackground);\n' +
'  }\n' +
'  function startBG() { cancelBG(); bgRAF = requestAnimationFrame(drawBackground); }\n' +
'  function cancelBG() { if (bgRAF) cancelAnimationFrame(bgRAF); bgRAF = null; }\n' +
'\n' +
'  function onResize() {\n' +
'    var prevStep = STEP || 1, ratio = SCROLL_X / (items.length * prevStep);\n' +
'    measure(); VW_HALF = window.innerWidth * 0.5;\n' +
'    SCROLL_X = mod(ratio * TRACK, TRACK);\n' +
'    updateCarouselTransforms(); resizeBG();\n' +
'  }\n' +
'\n' +
'  stage.addEventListener("wheel", function(e) {\n' +
'    if (isEntering) return;\n' +
'    e.preventDefault();\n' +
'    var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;\n' +
'    vX += delta * WHEEL_SENS * 20;\n' +
'  }, { passive: false });\n' +
'  stage.addEventListener("dragstart", function(e) { e.preventDefault(); });\n' +
'\n' +
'  var dragging = false, lastX = 0, lastT = 0, lastDelta = 0;\n' +
'  stage.addEventListener("pointerdown", function(e) {\n' +
'    if (isEntering) return;\n' +
'    dragging = true; lastX = e.clientX; lastT = performance.now(); lastDelta = 0;\n' +
'    stage.setPointerCapture(e.pointerId); stage.classList.add("dragging");\n' +
'  });\n' +
'  stage.addEventListener("pointermove", function(e) {\n' +
'    if (!dragging) return;\n' +
'    var now = performance.now(), dx = e.clientX - lastX, dt = Math.max(1, now - lastT) / 1000;\n' +
'    SCROLL_X = mod(SCROLL_X - dx * DRAG_SENS, TRACK);\n' +
'    lastDelta = dx / dt; lastX = e.clientX; lastT = now;\n' +
'  });\n' +
'  stage.addEventListener("pointerup", function(e) {\n' +
'    if (!dragging) return;\n' +
'    dragging = false; stage.releasePointerCapture(e.pointerId);\n' +
'    vX = -lastDelta * DRAG_SENS; stage.classList.remove("dragging");\n' +
'  });\n' +
'  window.addEventListener("resize", function() {\n' +
'    clearTimeout(onResize._t); onResize._t = setTimeout(onResize, 80);\n' +
'  });\n' +
'  document.addEventListener("visibilitychange", function() {\n' +
'    if (document.hidden) { cancelCarousel(); cancelBG(); } else { startCarousel(); startBG(); }\n' +
'  });\n' +
'\n' +
'  function waitForMedia() {\n' +
'    var promises = items.map(function(it) {\n' +
'      var el = it.el.querySelector("img, video");\n' +
'      if (!el) return Promise.resolve();\n' +
'      if (el.tagName === "IMG" && el.complete) return Promise.resolve();\n' +
'      if (el.tagName === "VIDEO" && el.readyState >= 2) return Promise.resolve();\n' +
'      return new Promise(function(resolve) {\n' +
'        el.addEventListener("load", resolve, { once: true });\n' +
'        el.addEventListener("loadeddata", resolve, { once: true });\n' +
'        el.addEventListener("error", resolve, { once: true });\n' +
'        setTimeout(resolve, 2500);\n' +
'      });\n' +
'    });\n' +
'    return Promise.all(promises);\n' +
'  }\n' +
'\n' +
'  async function init() {\n' +
'    if (!MEDIA_URLS.length) { loader.classList.add("loader--hide"); return; }\n' +
'    createCards(); measure(); updateCarouselTransforms();\n' +
'    stage.classList.add("carousel-mode");\n' +
'    await waitForMedia();\n' +
'    buildPalette();\n' +
'    var half = TRACK / 2, closestIdx = 0, closestDist = Infinity;\n' +
'    for (var i = 0; i < items.length; i++) {\n' +
'      var pos = items[i].x - SCROLL_X;\n' +
'      if (pos < -half) pos += TRACK; if (pos > half) pos -= TRACK;\n' +
'      var d = Math.abs(pos);\n' +
'      if (d < closestDist) { closestDist = d; closestIdx = i; }\n' +
'    }\n' +
'    activeIndex = -1;\n' +
'    setActiveGradient(closestIdx);\n' +
'    resizeBG();\n' +
'    var w = bgCanvas.clientWidth || stage.clientWidth, h = bgCanvas.clientHeight || stage.clientHeight;\n' +
'    bgCtx.fillStyle = "#f6f7f9"; bgCtx.fillRect(0, 0, w, h);\n' +
'    startBG();\n' +
'    await new Promise(function(r) { setTimeout(r, 100); });\n' +
'    loader.classList.add("loader--hide");\n' +
'    isEntering = false;\n' +
'    startCarousel();\n' +
'  }\n' +
'  init();\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'gradient-3d-carousel',
        name: 'Gradient 3D Carousel',
        icon: '🌈',
        description: 'Carrusel 3D infinito con física real (fricción, inercia al arrastrar) y un fondo de gradiente que muta con los colores dominantes extraídos de cada foto o vídeo',
        sourceUrl: 'https://github.com/clementgrellier/gradientslider',
        build: build
    });
})();
