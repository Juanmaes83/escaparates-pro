// Particle Morph Section — adapted from the tracked effect
// js/effects/particle-morph/image-to-text-2d.js (a real Three.js GPU point
// cloud sampled from an image, driven by a shader that scatters/reassembles
// particles). This rewrite renders the point cloud as real THREE.Points with
// a custom ShaderMaterial (GPU-driven, thousands of round soft particles)
// instead of manual canvas fillRect squares — same pixel-sampling approach
// to build the target shape, but the actual draw is on the GPU. The scene is
// re-rendered once per scroll tick only (never a permanent rAF loop) and
// only while in the viewport. Falls back to the original canvas 2D particle
// draw if THREE fails to load or a WebGL context cannot be created.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }
    function seededRand(s) { var x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'La idea toma forma';
        var hint = opts.hint || 'Sigue bajando';
        var background = opts.background || '#07070c';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var m0 = media[0];
        var imgUrl = m0 ? m0.url : '';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Particle Morph Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f2ede4;font-family:Arial,Helvetica,sans-serif;}\n' +
'.pms-wrap{position:relative;height:280vh;}\n' +
'.pms-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;}\n' +
'.pms-canvas{position:absolute;inset:0;width:100%;height:100%;}\n' +
'.pms-canvas-gl{display:none;}\n' +
'.pms-caption{position:absolute;bottom:2.6rem;left:50%;transform:translateX(-50%) translateY(14px);z-index:2;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out,transform 0.5s ease-out;pointer-events:none;text-shadow:0 2px 12px rgba(0,0,0,0.6);}\n' +
'.pms-caption.is-visible{opacity:1;transform:translateX(-50%) translateY(0);}\n' +
'.pms-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:2;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.pms-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="pms-wrap">\n' +
'  <div class="pms-pin">\n' +
'    <canvas class="pms-canvas pms-canvas-2d" data-src="' + imgUrl + '"></canvas>\n' +
'    <canvas class="pms-canvas pms-canvas-gl"></canvas>\n' +
'    <div class="pms-caption">' + claim + '</div>\n' +
'    <div class="pms-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script src="' + THREE_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".pms-wrap");\n' +
'  var canvas2d = document.querySelector(".pms-canvas-2d");\n' +
'  var canvasGl = document.querySelector(".pms-canvas-gl");\n' +
'  var caption = document.querySelector(".pms-caption");\n' +
'  var hint = document.querySelector(".pms-hint");\n' +
'  if (!wrap || !canvas2d || !canvas2d.getContext) return;\n' +
'\n' +
'  function clamp01(v) { return Math.max(0, Math.min(1, v)); }\n' +
'  function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }\n' +
'  function seededRand(s) { var x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }\n' +
'  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
'  var isMobile = window.innerWidth < 768;\n' +
'  var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 1.5);\n' +
'\n' +
'  var useThree = !!window.THREE;\n' +
'  var renderer = null;\n' +
'  if (useThree) {\n' +
'    try { renderer = new THREE.WebGLRenderer({ canvas: canvasGl, alpha: true, antialias: false }); }\n' +
'    catch (err) { useThree = false; renderer = null; }\n' +
'  }\n' +
'\n' +
'  var GRID_W = useThree ? (isMobile ? 58 : 118) : (isMobile ? 46 : 78);\n' +
'  var GRID_H = useThree ? (isMobile ? 42 : 86) : (isMobile ? 34 : 56);\n' +
'  var MAX_PARTICLES = useThree ? (isMobile ? 2600 : 7000) : (isMobile ? 900 : 2200);\n' +
'\n' +
'  var cssW = 0, cssH = 0;\n' +
'  var points = [];\n' +
'  var ready = false;\n' +
'\n' +
'  function buildFallbackPoints() {\n' +
'    var pts = [];\n' +
'    var n = isMobile ? 700 : 1600;\n' +
'    for (var i = 0; i < n; i++) {\n' +
'      var a = seededRand(i * 3.1) * Math.PI * 2;\n' +
'      var rr = Math.sqrt(seededRand(i * 7.7 + 1)) * 0.42;\n' +
'      var fx = 0.5 + Math.cos(a) * rr;\n' +
'      var fy = 0.5 + Math.sin(a) * rr * 0.85;\n' +
'      var hue = (200 + seededRand(i * 5.3) * 120) | 0;\n' +
'      var rgb = hslToRgb(hue / 360, 0.8, 0.65);\n' +
'      pts.push({ fx: fx, fy: fy, r: rgb[0], g: rgb[1], b: rgb[2] });\n' +
'    }\n' +
'    return pts;\n' +
'  }\n' +
'\n' +
'  function hslToRgb(h, s, l) {\n' +
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
'\n' +
'  function samplePoints(img) {\n' +
'    var off = document.createElement("canvas");\n' +
'    off.width = GRID_W; off.height = GRID_H;\n' +
'    var octx = off.getContext("2d");\n' +
'    var scale = Math.max(GRID_W / img.width, GRID_H / img.height);\n' +
'    var dw = img.width * scale, dh = img.height * scale;\n' +
'    octx.drawImage(img, (GRID_W - dw) / 2, (GRID_H - dh) / 2, dw, dh);\n' +
'    var data = octx.getImageData(0, 0, GRID_W, GRID_H).data;\n' +
'    var pts = [];\n' +
'    for (var y = 0; y < GRID_H; y++) {\n' +
'      for (var x = 0; x < GRID_W; x++) {\n' +
'        var idx = (y * GRID_W + x) * 4;\n' +
'        if (data[idx + 3] < 40) continue;\n' +
'        pts.push({ fx: x / GRID_W, fy: y / GRID_H, r: data[idx], g: data[idx + 1], b: data[idx + 2] });\n' +
'      }\n' +
'    }\n' +
'    if (pts.length > MAX_PARTICLES) {\n' +
'      var step = pts.length / MAX_PARTICLES;\n' +
'      var thinned = [];\n' +
'      for (var i = 0; i < MAX_PARTICLES; i++) thinned.push(pts[Math.floor(i * step)]);\n' +
'      pts = thinned;\n' +
'    }\n' +
'    return pts;\n' +
'  }\n' +
'\n' +
'  var mode = null;\n' +
'\n' +
'  function finalize(pts) {\n' +
'    for (var i = 0; i < pts.length; i++) {\n' +
'      var p = pts[i];\n' +
'      var ang = seededRand(i * 9.3 + 2) * Math.PI * 2;\n' +
'      var dist = 0.55 + seededRand(i * 6.1 + 5) * 0.8;\n' +
'      p.sx = 0.5 + Math.cos(ang) * dist;\n' +
'      p.sy = 0.5 + Math.sin(ang) * dist;\n' +
'      p.jx = (seededRand(i * 4.4) - 0.5) * 0.01;\n' +
'      p.jy = (seededRand(i * 8.8) - 0.5) * 0.01;\n' +
'    }\n' +
'    points = pts;\n' +
'    ready = true;\n' +
'    mode = useThree ? buildThreeMode(pts) : buildCanvasMode();\n' +
'    mode.resize();\n' +
'    if (active) scheduleUpdate();\n' +
'  }\n' +
'\n' +
'  function buildCanvasMode() {\n' +
'    canvas2d.style.display = "block";\n' +
'    canvasGl.style.display = "none";\n' +
'    var ctx = canvas2d.getContext("2d");\n' +
'    function resize() {\n' +
'      var rect = canvas2d.getBoundingClientRect();\n' +
'      cssW = rect.width; cssH = rect.height;\n' +
'      canvas2d.width = Math.round(cssW * dpr);\n' +
'      canvas2d.height = Math.round(cssH * dpr);\n' +
'      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n' +
'    }\n' +
'    function draw(t) {\n' +
'      ctx.clearRect(0, 0, cssW, cssH);\n' +
'      if (!ready) return;\n' +
'      var e = smoothstep(0.05, 0.85, t);\n' +
'      var settle = 1 - e;\n' +
'      var size = Math.max(1.4, Math.min(cssW, cssH) / 260);\n' +
'      for (var i = 0; i < points.length; i++) {\n' +
'        var p = points[i];\n' +
'        var px = (p.sx + (p.fx - p.sx) * e + p.jx * settle) * cssW;\n' +
'        var py = (p.sy + (p.fy - p.sy) * e + p.jy * settle) * cssH;\n' +
'        var alpha = 0.15 + e * 0.85;\n' +
'        ctx.fillStyle = "rgba(" + p.r + "," + p.g + "," + p.b + "," + alpha.toFixed(2) + ")";\n' +
'        ctx.fillRect(px - size / 2, py - size / 2, size, size);\n' +
'      }\n' +
'      if (caption) caption.classList.toggle("is-visible", t > 0.82);\n' +
'      if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'    }\n' +
'    return { draw: draw, resize: resize, disposeThree: null };\n' +
'  }\n' +
'\n' +
'  function buildThreeMode(pts) {\n' +
'    canvasGl.style.display = "block";\n' +
'    canvas2d.style.display = "none";\n' +
'    renderer.setPixelRatio(dpr);\n' +
'    var scene = new THREE.Scene();\n' +
'    var camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1);\n' +
'\n' +
'    var n = pts.length;\n' +
'    var position = new Float32Array(n * 3);\n' +
'    var aStart = new Float32Array(n * 3);\n' +
'    var aTarget = new Float32Array(n * 3);\n' +
'    var aColor = new Float32Array(n * 3);\n' +
'    var aJitter = new Float32Array(n * 2);\n' +
'    for (var i = 0; i < n; i++) {\n' +
'      var p = pts[i];\n' +
'      aStart[i * 3] = p.sx; aStart[i * 3 + 1] = p.sy; aStart[i * 3 + 2] = 0;\n' +
'      aTarget[i * 3] = p.fx; aTarget[i * 3 + 1] = p.fy; aTarget[i * 3 + 2] = 0;\n' +
'      position[i * 3] = p.fx; position[i * 3 + 1] = p.fy; position[i * 3 + 2] = 0;\n' +
'      aColor[i * 3] = p.r / 255; aColor[i * 3 + 1] = p.g / 255; aColor[i * 3 + 2] = p.b / 255;\n' +
'      aJitter[i * 2] = p.jx; aJitter[i * 2 + 1] = p.jy;\n' +
'    }\n' +
'    var geometry = new THREE.BufferGeometry();\n' +
'    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));\n' +
'    geometry.setAttribute("aStart", new THREE.BufferAttribute(aStart, 3));\n' +
'    geometry.setAttribute("aTarget", new THREE.BufferAttribute(aTarget, 3));\n' +
'    geometry.setAttribute("aColor", new THREE.BufferAttribute(aColor, 3));\n' +
'    geometry.setAttribute("aJitter", new THREE.BufferAttribute(aJitter, 2));\n' +
'\n' +
'    var material = new THREE.ShaderMaterial({\n' +
'      transparent: true,\n' +
'      depthWrite: false,\n' +
'      uniforms: { uProgress: { value: 0 }, uSize: { value: 3 } },\n' +
'      vertexShader: [\n' +
'        "attribute vec3 aStart;",\n' +
'        "attribute vec3 aTarget;",\n' +
'        "attribute vec3 aColor;",\n' +
'        "attribute vec2 aJitter;",\n' +
'        "uniform float uProgress;",\n' +
'        "uniform float uSize;",\n' +
'        "varying vec3 vColor;",\n' +
'        "varying float vAlpha;",\n' +
'        "void main() {",\n' +
'        "  vec3 pos = mix(aStart, aTarget, uProgress);",\n' +
'        "  pos.x += aJitter.x * (1.0 - uProgress);",\n' +
'        "  pos.y += aJitter.y * (1.0 - uProgress);",\n' +
'        "  vColor = aColor;",\n' +
'        "  vAlpha = 0.15 + uProgress * 0.85;",\n' +
'        "  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);",\n' +
'        "  gl_Position = projectionMatrix * mvPosition;",\n' +
'        "  gl_PointSize = uSize;",\n' +
'        "}"\n' +
'      ].join("\\n"),\n' +
'      fragmentShader: [\n' +
'        "varying vec3 vColor;",\n' +
'        "varying float vAlpha;",\n' +
'        "void main() {",\n' +
'        "  vec2 uv = gl_PointCoord - 0.5;",\n' +
'        "  if (length(uv) > 0.5) discard;",\n' +
'        "  gl_FragColor = vec4(vColor, vAlpha);",\n' +
'        "}"\n' +
'      ].join("\\n")\n' +
'    });\n' +
'\n' +
'    var cloud = new THREE.Points(geometry, material);\n' +
'    cloud.frustumCulled = false;\n' +
'    scene.add(cloud);\n' +
'\n' +
'    function resize() {\n' +
'      var rect = canvasGl.getBoundingClientRect();\n' +
'      cssW = rect.width; cssH = rect.height;\n' +
'      renderer.setSize(cssW, cssH, false);\n' +
'      material.uniforms.uSize.value = Math.max(1.6, Math.min(cssW, cssH) / 230) * dpr;\n' +
'    }\n' +
'\n' +
'    function draw(t) {\n' +
'      var e = smoothstep(0.05, 0.85, t);\n' +
'      material.uniforms.uProgress.value = e;\n' +
'      renderer.render(scene, camera);\n' +
'      if (caption) caption.classList.toggle("is-visible", t > 0.82);\n' +
'      if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'    }\n' +
'\n' +
'    function disposeThree() {\n' +
'      geometry.dispose();\n' +
'      material.dispose();\n' +
'      renderer.dispose();\n' +
'    }\n' +
'\n' +
'    return { draw: draw, resize: resize, disposeThree: disposeThree };\n' +
'  }\n' +
'\n' +
'  var src = canvas2d.dataset.src;\n' +
'  if (src) {\n' +
'    var img = new Image();\n' +
'    img.crossOrigin = "anonymous";\n' +
'    img.onload = function() {\n' +
'      try { finalize(samplePoints(img)); }\n' +
'      catch (err) { finalize(buildFallbackPoints()); }\n' +
'    };\n' +
'    img.onerror = function() { finalize(buildFallbackPoints()); };\n' +
'    img.src = src;\n' +
'  } else {\n' +
'    finalize(buildFallbackPoints());\n' +
'  }\n' +
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
'  var active = false;\n' +
'  var scheduled = false;\n' +
'  function scheduleUpdate() {\n' +
'    if (!active || scheduled || !mode) return;\n' +
'    if (reduced) { mode.draw(0.9); return; }\n' +
'    scheduled = true;\n' +
'    requestAnimationFrame(function() { scheduled = false; if (mode) mode.draw(progressOf()); });\n' +
'  }\n' +
'\n' +
'  var io = null;\n' +
'  if ("IntersectionObserver" in window) {\n' +
'    io = new IntersectionObserver(function(entries) {\n' +
'      entries.forEach(function(e) {\n' +
'        active = e.isIntersecting;\n' +
'        if (active && mode) { mode.resize(); scheduleUpdate(); }\n' +
'      });\n' +
'    }, { threshold: 0 });\n' +
'    io.observe(wrap);\n' +
'  } else {\n' +
'    active = true;\n' +
'  }\n' +
'\n' +
'  window.addEventListener("scroll", scheduleUpdate, { passive: true });\n' +
'  window.addEventListener("resize", function() { if (active && mode) { mode.resize(); mode.draw(progressOf()); } });\n' +
'\n' +
'  window.addEventListener("pagehide", function() {\n' +
'    window.removeEventListener("scroll", scheduleUpdate);\n' +
'    if (io) io.disconnect();\n' +
'    if (mode && mode.disposeThree) mode.disposeThree();\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'particle-morph-section',
        name: 'Particle Morph Section',
        icon: '✨',
        description: 'Miles de partículas GPU (THREE.Points + shader propio) vuelan desde fuera de encuadre y se ensamblan en la imagen nítida a medida que avanzas el scroll — materialización cinematográfica del producto o la marca, con partículas redondas suaves en vez de píxeles cuadrados. Adaptado del efecto interno Particle Morph (js/effects/particle-morph/image-to-text-2d.js); cae a un canvas 2D con el mismo muestreo de píxeles si WebGL no está disponible.',
        build: build
    });
})();
