// Tunnel Zoom Section — adapted from the tracked effect
// js/effects/3d-perspective/depth-tunnel.js (a real Three.js scene: rings of
// textured planes receding along Z, camera flying through). This rewrite
// uses real Three.js (loaded from the same CDN pattern already used by
// js/scroll-sections/folding-box-reveal.js and burning-dom-reveal.js) so the
// tunnel has genuine perspective, fog depth-cueing and a moving camera
// instead of a CSS 3D approximation. Render calls happen only once per
// scroll tick (rAF-throttled), never a permanent loop, and only while the
// section is in the viewport. Falls back to a CSS 3D tunnel if THREE fails
// to load or WebGL is unavailable.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }

    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js';
    var FB_RINGS = 4;
    var FB_PANELS = 4;

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'Hasta el fondo de la idea';
        var hint = opts.hint || 'Sigue bajando';
        var glowColor = opts.glowColor || '#8ec8ff';
        var background = opts.background || '#020208';
        var mediaJSON = JSON.stringify(EP.ScrollSections.normalizeMedia(mediaList));

        var fbMedia = EP.ScrollSections.fillMedia(mediaList, FB_RINGS * FB_PANELS);
        var fbRingsHTML = '';
        for (var r = 0; r < FB_RINGS; r++) {
            var ringZ = 'calc(var(--tzs-spacing-z) * -' + (r + 1) + ')';
            var panelsHTML = '';
            for (var s = 0; s < FB_PANELS; s++) {
                var angle = Math.round((s / FB_PANELS) * 360);
                var m = fbMedia[r * FB_PANELS + s];
                var art = m
                    ? (m.type === 'video'
                        ? '<video src="' + m.url + '" autoplay muted loop playsinline></video>'
                        : '<img src="' + m.url + '" alt="">')
                    : '<div class="tzs-placeholder"></div>';
                panelsHTML += '<div class="tzs-panel" style="transform:rotateY(' + angle + 'deg) translateZ(var(--tzs-radius)) translate(-50%,-50%);">' + art + '</div>\n          ';
            }
            fbRingsHTML += '<div class="tzs-ring" style="transform:translate(-50%,-50%) translateZ(' + ringZ + ');">\n          ' + panelsHTML + '\n        </div>\n        ';
        }

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Tunnel Zoom Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#eef4ff;font-family:Arial,Helvetica,sans-serif;}\n' +
'.tzs-wrap{position:relative;height:340vh;}\n' +
'.tzs-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;background:radial-gradient(circle at 50% 50%,#0b0f1c 0%,' + background + ' 70%);}\n' +
'.tzs-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;display:none;}\n' +
'.tzs-vignette{position:absolute;inset:0;z-index:3;pointer-events:none;background:radial-gradient(circle at 50% 50%,transparent 35%,rgba(0,0,0,0.85) 100%);}\n' +
'.tzs-caption{position:absolute;bottom:2.6rem;left:50%;transform:translateX(-50%) translateY(14px);z-index:4;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.2rem,2.8vw,2.1rem);opacity:0;transition:opacity 0.5s ease-out,transform 0.5s ease-out;pointer-events:none;text-shadow:0 2px 16px rgba(0,0,0,0.7);}\n' +
'.tzs-caption.is-visible{opacity:1;transform:translateX(-50%) translateY(0);}\n' +
'.tzs-hint{position:absolute;bottom:0.9rem;left:50%;transform:translateX(-50%);z-index:4;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.tzs-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'.tzs-fallback{position:absolute;inset:0;perspective:900px;}\n' +
'.tzs-core{position:absolute;top:50%;left:50%;width:40px;height:40px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#ffffff,' + glowColor + ' 40%,transparent 70%);z-index:2;pointer-events:none;filter:blur(2px);}\n' +
'.tzs-scene{position:absolute;top:50%;left:50%;width:1px;height:1px;transform-style:preserve-3d;will-change:transform;z-index:1;}\n' +
'.tzs-ring{position:absolute;top:0;left:0;width:1px;height:1px;transform-style:preserve-3d;}\n' +
'.tzs-panel{position:absolute;top:0;left:0;width:var(--tzs-panel-w);height:var(--tzs-panel-h);border-radius:8px;overflow:hidden;box-shadow:0 0 24px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.06) inset;backface-visibility:hidden;}\n' +
'.tzs-panel img,.tzs-panel video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.tzs-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#232336,#0c0c14);}\n' +
':root,.tzs-scene{--tzs-spacing-z:300px;--tzs-radius:230px;--tzs-panel-w:170px;--tzs-panel-h:120px;}\n' +
'@media (max-width:768px){\n' +
'  .tzs-scene{--tzs-spacing-z:220px;--tzs-radius:130px;--tzs-panel-w:108px;--tzs-panel-h:78px;}\n' +
'  .tzs-fallback{perspective:640px;}\n' +
'}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="tzs-wrap">\n' +
'  <div class="tzs-pin">\n' +
'    <canvas class="tzs-canvas"></canvas>\n' +
'    <div class="tzs-fallback">\n' +
'      <div class="tzs-core"></div>\n' +
'      <div class="tzs-scene">\n        ' + fbRingsHTML + '\n      </div>\n' +
'    </div>\n' +
'    <div class="tzs-vignette"></div>\n' +
'    <div class="tzs-caption">' + claim + '</div>\n' +
'    <div class="tzs-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script src="' + THREE_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".tzs-wrap");\n' +
'  var caption = document.querySelector(".tzs-caption");\n' +
'  var hint = document.querySelector(".tzs-hint");\n' +
'  var fallbackEl = document.querySelector(".tzs-fallback");\n' +
'  var canvasEl = document.querySelector(".tzs-canvas");\n' +
'  var GLOW_COLOR = ' + JSON.stringify(glowColor) + ';\n' +
'  var MEDIA = ' + mediaJSON + ';\n' +
'  if (!wrap) return;\n' +
'\n' +
'  function clamp01(v) { return Math.max(0, Math.min(1, v)); }\n' +
'  function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }\n' +
'  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
'  var isMobile = window.innerWidth < 768;\n' +
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
'  var io = null;\n' +
'  var pointerDX = 0, pointerDY = 0;\n' +
'  var canHover = window.matchMedia && window.matchMedia("(pointer: fine)").matches;\n' +
'\n' +
'  var useThree = !!(window.THREE && !reduced);\n' +
'  var renderer, scene, camera, glowSprite;\n' +
'  var depth = 0;\n' +
'\n' +
'  function buildFallback() {\n' +
'    var scene0 = document.querySelector(".tzs-scene");\n' +
'    var core = document.querySelector(".tzs-core");\n' +
'    function depthPx() {\n' +
'      var cs = getComputedStyle(scene0);\n' +
'      var spacing = parseFloat(cs.getPropertyValue("--tzs-spacing-z")) || 300;\n' +
'      return spacing * FB_RINGS_JS;\n' +
'    }\n' +
'    var FB_RINGS_JS = ' + FB_RINGS + ';\n' +
'    function draw(t) {\n' +
'      if (reduced) {\n' +
'        scene0.style.opacity = String(0.4 + t * 0.6);\n' +
'        if (caption) caption.classList.toggle("is-visible", t > 0.5);\n' +
'        if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'        return;\n' +
'      }\n' +
'      var d = depthPx();\n' +
'      var z = -d * (1 - t);\n' +
'      var twist = t * 22;\n' +
'      scene0.style.transform = "translate(-50%,-50%) translateZ(" + z + "px) rotateZ(" + twist + "deg)";\n' +
'      if (core) {\n' +
'        var glow = smoothstep(0.7, 1, t);\n' +
'        core.style.opacity = String(0.2 + glow * 0.9);\n' +
'        core.style.transform = "translate(-50%,-50%) scale(" + (0.6 + glow * 2.2) + ")";\n' +
'      }\n' +
'      if (caption) caption.classList.toggle("is-visible", t > 0.8);\n' +
'      if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'    }\n' +
'    return { draw: draw, resize: function(){} };\n' +
'  }\n' +
'\n' +
'  function makeGlowTexture() {\n' +
'    var c = document.createElement("canvas");\n' +
'    c.width = 128; c.height = 128;\n' +
'    var g = c.getContext("2d");\n' +
'    var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);\n' +
'    grad.addColorStop(0, "rgba(255,255,255,1)");\n' +
'    grad.addColorStop(0.35, GLOW_COLOR);\n' +
'    grad.addColorStop(1, "rgba(0,0,0,0)");\n' +
'    g.fillStyle = grad;\n' +
'    g.fillRect(0, 0, 128, 128);\n' +
'    return new THREE.CanvasTexture(c);\n' +
'  }\n' +
'\n' +
'  function buildThree() {\n' +
'    var RINGS = isMobile ? 5 : 8;\n' +
'    var PANELS = isMobile ? 4 : 6;\n' +
'    var spacingZ = isMobile ? 9 : 12;\n' +
'    var radius = isMobile ? 4 : 6.4;\n' +
'    var panelW = isMobile ? 2.5 : 3.3;\n' +
'    var panelH = isMobile ? 1.8 : 2.3;\n' +
'    depth = spacingZ * RINGS;\n' +
'\n' +
'    scene = new THREE.Scene();\n' +
'    scene.fog = new THREE.Fog(new THREE.Color(' + JSON.stringify(background) + ').getHex(), 3, depth * 0.92);\n' +
'    camera = new THREE.PerspectiveCamera(62, 1, 0.1, depth + 20);\n' +
'    camera.position.set(0, 0, 2);\n' +
'\n' +
'    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: !isMobile });\n' +
'    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));\n' +
'\n' +
'    var texCache = {};\n' +
'    var loader = new THREE.TextureLoader();\n' +
'    loader.crossOrigin = "anonymous";\n' +
'    var videos = [];\n' +
'    function textureFor(m) {\n' +
'      if (!m) return null;\n' +
'      if (texCache[m.url]) return texCache[m.url];\n' +
'      var tex;\n' +
'      if (m.type === "video") {\n' +
'        var v = document.createElement("video");\n' +
'        v.src = m.url; v.crossOrigin = "anonymous"; v.loop = true; v.muted = true; v.playsInline = true; v.autoplay = true;\n' +
'        v.play().catch(function(){});\n' +
'        videos.push(v);\n' +
'        tex = new THREE.VideoTexture(v);\n' +
'      } else {\n' +
'        tex = loader.load(m.url);\n' +
'      }\n' +
'      texCache[m.url] = tex;\n' +
'      return tex;\n' +
'    }\n' +
'\n' +
'    var geoms = [];\n' +
'    var mats = [];\n' +
'    var panelGeo = new THREE.PlaneGeometry(panelW, panelH);\n' +
'    geoms.push(panelGeo);\n' +
'    var count = 0;\n' +
'    for (var r = 0; r < RINGS; r++) {\n' +
'      var ringZ = -(r + 1) * spacingZ;\n' +
'      for (var s = 0; s < PANELS; s++) {\n' +
'        var m = MEDIA.length ? MEDIA[count % MEDIA.length] : null;\n' +
'        count++;\n' +
'        var tex = textureFor(m);\n' +
'        var mat = tex\n' +
'          ? new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: true })\n' +
'          : new THREE.MeshBasicMaterial({ color: 0x232336, side: THREE.DoubleSide, fog: true });\n' +
'        mats.push(mat);\n' +
'        var mesh = new THREE.Mesh(panelGeo, mat);\n' +
'        var angle = (s / PANELS) * Math.PI * 2;\n' +
'        mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, ringZ);\n' +
'        mesh.lookAt(Math.cos(angle) * (radius + 1), Math.sin(angle) * (radius + 1), ringZ);\n' +
'        scene.add(mesh);\n' +
'      }\n' +
'    }\n' +
'\n' +
'    var glowTex = makeGlowTexture();\n' +
'    var glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });\n' +
'    mats.push(glowMat);\n' +
'    glowSprite = new THREE.Sprite(glowMat);\n' +
'    glowSprite.position.set(0, 0, -depth * 0.95);\n' +
'    glowSprite.scale.set(6, 6, 1);\n' +
'    scene.add(glowSprite);\n' +
'\n' +
'    function resizeThree() {\n' +
'      var rect = wrap.getBoundingClientRect();\n' +
'      var w = wrap.clientWidth || window.innerWidth;\n' +
'      var h = window.innerHeight;\n' +
'      camera.aspect = w / h;\n' +
'      camera.updateProjectionMatrix();\n' +
'      renderer.setSize(w, h, false);\n' +
'    }\n' +
'\n' +
'    function draw(t) {\n' +
'      var camStart = 2;\n' +
'      var camEnd = -depth * 0.9;\n' +
'      camera.position.z = camStart + (camEnd - camStart) * t;\n' +
'      camera.rotation.z = t * 0.3;\n' +
'      camera.position.x = pointerDX * 0.4;\n' +
'      camera.position.y = pointerDY * -0.3;\n' +
'      var glow = smoothstep(0.7, 1, t);\n' +
'      glowMat.opacity = 0.2 + glow * 0.7;\n' +
'      glowSprite.scale.set(6 + glow * 10, 6 + glow * 10, 1);\n' +
'      renderer.render(scene, camera);\n' +
'      if (caption) caption.classList.toggle("is-visible", t > 0.8);\n' +
'      if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'    }\n' +
'\n' +
'    function disposeThree() {\n' +
'      geoms.forEach(function(g){ g.dispose(); });\n' +
'      mats.forEach(function(mt){ if (mt.map) mt.map.dispose(); mt.dispose(); });\n' +
'      videos.forEach(function(v){ v.pause(); v.src = ""; });\n' +
'      renderer.dispose();\n' +
'    }\n' +
'\n' +
'    resizeThree();\n' +
'    return { draw: draw, resize: resizeThree, disposeThree: disposeThree };\n' +
'  }\n' +
'\n' +
'  var mode = null;\n' +
'  try {\n' +
'    if (useThree) {\n' +
'      mode = buildThree();\n' +
'      canvasEl.style.display = "block";\n' +
'      fallbackEl.style.display = "none";\n' +
'    } else {\n' +
'      mode = buildFallback();\n' +
'    }\n' +
'  } catch (err) {\n' +
'    useThree = false;\n' +
'    canvasEl.style.display = "none";\n' +
'    fallbackEl.style.display = "block";\n' +
'    mode = buildFallback();\n' +
'  }\n' +
'\n' +
'  function scheduleUpdate() {\n' +
'    if (!active || scheduled) return;\n' +
'    scheduled = true;\n' +
'    requestAnimationFrame(function() { scheduled = false; mode.draw(progressOf()); });\n' +
'  }\n' +
'\n' +
'  function onPointerMove(e) {\n' +
'    if (!active || !useThree) return;\n' +
'    pointerDX = (e.clientX / window.innerWidth) * 2 - 1;\n' +
'    pointerDY = (e.clientY / window.innerHeight) * 2 - 1;\n' +
'    scheduleUpdate();\n' +
'  }\n' +
'\n' +
'  if ("IntersectionObserver" in window) {\n' +
'    io = new IntersectionObserver(function(entries) {\n' +
'      entries.forEach(function(e) {\n' +
'        active = e.isIntersecting;\n' +
'        if (active) { mode.resize(); scheduleUpdate(); }\n' +
'      });\n' +
'    }, { threshold: 0 });\n' +
'    io.observe(wrap);\n' +
'  } else {\n' +
'    active = true;\n' +
'    mode.resize();\n' +
'    mode.draw(progressOf());\n' +
'  }\n' +
'\n' +
'  window.addEventListener("scroll", scheduleUpdate, { passive: true });\n' +
'  window.addEventListener("resize", function() { if (active) { mode.resize(); mode.draw(progressOf()); } });\n' +
'  if (canHover && useThree) window.addEventListener("mousemove", onPointerMove, { passive: true });\n' +
'\n' +
'  window.addEventListener("pagehide", function() {\n' +
'    window.removeEventListener("scroll", scheduleUpdate);\n' +
'    window.removeEventListener("mousemove", onPointerMove);\n' +
'    if (io) io.disconnect();\n' +
'    if (useThree && mode && mode.disposeThree) mode.disposeThree();\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'tunnel-zoom-section',
        name: 'Tunnel Zoom Section',
        icon: '🕳️',
        description: 'Túnel infinito de imágenes con profundidad real en Three.js — cámara de verdad volando entre anillos de paneles con niebla de profundidad y núcleo de luz aditiva al llegar al fondo; cae a un túnel CSS 3D si WebGL no está disponible. Ideal para hero cinematográfico o apertura de campaña tipo Awwwards. Adaptado del efecto interno Depth Tunnel (js/effects/3d-perspective/depth-tunnel.js).',
        build: build
    });
})();
