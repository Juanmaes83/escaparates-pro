// Spotlight Frame Showcase Section — original scroll skeleton (concept only,
// no code borrowed): a single framed picture/product sits on a dark gallery
// wall lit by three colored SpotLights with real PCF shadows. Scroll progress
// drives a narrow camera arc (mimicking a constrained OrbitControls look-
// around) and sweeps the spotlights left-to-right, exactly like a visitor
// walking past a lit exhibit. Event-driven redraw only (scroll/resize),
// no permanent animation loop, full dispose + reduced-motion + mobile LOD.
(function() {
    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var kicker = opts.kicker || 'Pieza destacada';
        var title = opts.title || 'Cada detalle, bajo su propia luz';
        var claim = opts.claim || 'Un escaparate de galeria para tu producto: marco real, sombras reales, tres focos de color que lo envuelven mientras el visitante avanza.';
        var hint = opts.hint || 'Desliza para acercarte';
        var ctaText = opts.ctaText || 'Ver la coleccion';
        var ctaHref = opts.ctaHref || '#';
        var accentColor = opts.accentColor || '#ffcf5c';
        var frameColor = opts.frameColor || '#1c1c1c';
        var itemLabel = (opts.items && opts.items[0] && (opts.items[0].label || opts.items[0].name)) || 'Pieza 01';
        var itemSub = (opts.items && opts.items[0] && (opts.items[0].sub || opts.items[0].description)) || 'Iluminacion de estudio';

        var picture = EP.ScrollSections.fillMedia(mediaList, 1)[0] || { type: 'image', url: '' };
        var mediaJSON = JSON.stringify(picture);

        var html = '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>Spotlight Frame Showcase Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:#0b0b10;color:#f4efe6;font-family:Arial,Helvetica,sans-serif;}\n' +
'.sf-wrap{position:relative;height:340vh;}\n' +
'.sf-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;background:#0b0b10;}\n' +
'.sf-canvas-gl{position:absolute;inset:0;width:100%;height:100%;display:none;}\n' +
'.sf-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 28% 22%,rgba(255,207,92,0.20),transparent 55%),radial-gradient(circle at 72% 26%,rgba(90,210,255,0.17),transparent 55%),radial-gradient(circle at 50% 78%,rgba(255,90,210,0.14),transparent 55%),#0b0b10;}\n' +
'.sf-fbframe{position:relative;width:min(46vw,420px);aspect-ratio:4/5;background:#fff;padding:14px;box-shadow:0 40px 90px rgba(0,0,0,0.55),0 0 0 10px ' + frameColor + ';}\n' +
'.sf-fbframe img{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.sf-intro{position:absolute;top:11%;left:50%;transform:translateX(-50%);z-index:5;text-align:center;max-width:86vw;opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.sf-intro.is-visible{opacity:1;}\n' +
'.sf-kicker{font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase;color:' + accentColor + ';font-weight:700;margin-bottom:0.6rem;}\n' +
'.sf-title{font-size:clamp(1.6rem,4.2vw,2.8rem);font-weight:800;margin-bottom:0.5rem;text-shadow:0 4px 18px rgba(0,0,0,0.6);}\n' +
'.sf-claim{font-size:clamp(0.95rem,1.8vw,1.2rem);color:#d8d2c6;max-width:44ch;margin:0 auto;}\n' +
'.sf-caption{position:absolute;bottom:5.6rem;left:50%;transform:translateX(-50%);z-index:5;text-align:center;opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.sf-caption.is-visible{opacity:1;}\n' +
'.sf-caption-label{font-weight:800;text-transform:uppercase;letter-spacing:0.05em;font-size:clamp(1rem,2.2vw,1.5rem);color:' + accentColor + ';text-shadow:0 2px 10px rgba(0,0,0,0.7);}\n' +
'.sf-caption-sub{font-size:0.85rem;color:#cfc9bd;margin-top:0.2rem;}\n' +
'.sf-cta{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) translateY(16px);z-index:6;text-align:center;opacity:0;transition:opacity 0.5s ease-out,transform 0.5s ease-out;pointer-events:none;}\n' +
'.sf-cta.is-visible{opacity:1;transform:translate(-50%,-50%) translateY(0);pointer-events:auto;}\n' +
'.sf-cta a{display:inline-block;padding:0.9rem 2.2rem;border-radius:999px;background:' + accentColor + ';color:#100c02;font-weight:800;text-decoration:none;letter-spacing:0.02em;box-shadow:0 14px 30px rgba(0,0,0,0.4);}\n' +
'.sf-hint{position:absolute;bottom:1rem;left:50%;transform:translateX(-50%);z-index:5;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.sf-hint.is-hidden{opacity:0;}\n' +
'@media (max-width:768px){.sf-fbframe{width:70vw;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div style="height:100vh"></div>\n' +
'<div class="sf-wrap">\n' +
'  <div class="sf-pin">\n' +
'    <canvas class="sf-canvas-gl"></canvas>\n' +
'    <div class="sf-fallback">\n' +
'      <div class="sf-fbframe">' + (picture.type === 'video' ? '<video src="' + picture.url + '" autoplay loop muted playsinline></video>' : (picture.url ? '<img src="' + picture.url + '" alt="">' : '')) + '</div>\n' +
'    </div>\n' +
'    <div class="sf-intro"><div class="sf-kicker">' + kicker + '</div><h1 class="sf-title">' + title + '</h1><p class="sf-claim">' + claim + '</p></div>\n' +
'    <div class="sf-caption"><div class="sf-caption-label">' + itemLabel + '</div><div class="sf-caption-sub">' + itemSub + '</div></div>\n' +
'    <div class="sf-cta"><a href="' + ctaHref + '">' + ctaText + '</a></div>\n' +
'    <div class="sf-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</div>\n' +
'<div style="height:100vh"></div>\n' +
'<script src="' + THREE_CDN + '"><\/script>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".sf-wrap");\n' +
'  var canvasGl = document.querySelector(".sf-canvas-gl");\n' +
'  var fallbackEl = document.querySelector(".sf-fallback");\n' +
'  var intro = document.querySelector(".sf-intro");\n' +
'  var captionEl = document.querySelector(".sf-caption");\n' +
'  var ctaEl = document.querySelector(".sf-cta");\n' +
'  var hint = document.querySelector(".sf-hint");\n' +
'  var PICTURE = ' + mediaJSON + ';\n' +
'  var ACCENT = "' + accentColor + '";\n' +
'  var FRAME_COLOR = "' + frameColor + '";\n' +
'  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
'  var isMobile = window.innerWidth < 768;\n' +
'\n' +
'  function smoothstep(e0, e1, x) { x = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return x * x * (3 - 2 * x); }\n' +
'\n' +
'  function progressOf() {\n' +
'    var rect = wrap.getBoundingClientRect();\n' +
'    var total = rect.height - window.innerHeight;\n' +
'    if (total <= 0) return rect.top <= 0 ? 1 : 0;\n' +
'    return Math.max(0, Math.min(1, -rect.top / total));\n' +
'  }\n' +
'\n' +
'  var mode = { draw: function(){}, resize: function(){}, disposeThree: null };\n' +
'\n' +
'  function drawChrome(p) {\n' +
'    var introT = smoothstep(0, 0.12, p) * (1 - smoothstep(0.92, 1.0, p));\n' +
'    intro.classList.toggle("is-visible", introT > 0.5);\n' +
'    var capT = smoothstep(0.16, 0.3, p) * (1 - smoothstep(0.88, 1.0, p));\n' +
'    captionEl.classList.toggle("is-visible", capT > 0.5);\n' +
'    var outroT = smoothstep(0.86, 1.0, p);\n' +
'    ctaEl.classList.toggle("is-visible", outroT > 0.5);\n' +
'    hint.classList.toggle("is-hidden", p > 0.06);\n' +
'  }\n' +
'\n' +
'  var webglOK = !!(window.THREE);\n' +
'  if (!webglOK) {\n' +
'    mode.draw = drawChrome;\n' +
'  } else {\n' +
'    try {\n' +
'      initThree();\n' +
'    } catch (e) {\n' +
'      webglOK = false;\n' +
'      mode.draw = drawChrome;\n' +
'    }\n' +
'  }\n' +
'\n' +
'  function initThree() {\n' +
'    var renderer = new THREE.WebGLRenderer({ canvas: canvasGl, antialias: true, alpha: true });\n' +
'    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));\n' +
'    renderer.shadowMap.enabled = true;\n' +
'    renderer.shadowMap.type = THREE.PCFShadowMap;\n' +
'\n' +
'    var scene = new THREE.Scene();\n' +
'    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);\n' +
'\n' +
'    var geoms = [], mats = [];\n' +
'    var frameW = 3.0, frameH = 3.75, frameDepth = 0.12, borderW = 0.22;\n' +
'\n' +
'    var backdropGeo = new THREE.PlaneGeometry(30, 18);\n' +
'    geoms.push(backdropGeo);\n' +
'    var backdropMat = new THREE.MeshPhongMaterial({ color: 0x141418 });\n' +
'    mats.push(backdropMat);\n' +
'    var backdrop = new THREE.Mesh(backdropGeo, backdropMat);\n' +
'    backdrop.position.z = -1.4;\n' +
'    backdrop.receiveShadow = true;\n' +
'    scene.add(backdrop);\n' +
'\n' +
'    var texture = null, video = null;\n' +
'    if (PICTURE.url) {\n' +
'      if (PICTURE.type === "video") {\n' +
'        video = document.createElement("video");\n' +
'        video.src = PICTURE.url; video.crossOrigin = "anonymous"; video.loop = true; video.muted = true; video.playsInline = true; video.autoplay = true;\n' +
'        video.play().catch(function(){});\n' +
'        texture = new THREE.VideoTexture(video);\n' +
'      } else {\n' +
'        var loader = new THREE.TextureLoader();\n' +
'        loader.crossOrigin = "anonymous";\n' +
'        texture = loader.load(PICTURE.url);\n' +
'      }\n' +
'    }\n' +
'\n' +
'    var pictureGeo = new THREE.PlaneGeometry(frameW * 0.86, frameH * 0.86);\n' +
'    geoms.push(pictureGeo);\n' +
'    var pictureMat = texture ? new THREE.MeshPhongMaterial({ map: texture }) : new THREE.MeshPhongMaterial({ color: 0x2a2a32 });\n' +
'    pictureMat.polygonOffset = true;\n' +
'    pictureMat.polygonOffsetUnits = -10;\n' +
'    mats.push(pictureMat);\n' +
'    var pictureMesh = new THREE.Mesh(pictureGeo, pictureMat);\n' +
'    pictureMesh.receiveShadow = true;\n' +
'    scene.add(pictureMesh);\n' +
'\n' +
'    var boardGeo = new THREE.BoxGeometry(frameW, frameH, frameDepth);\n' +
'    geoms.push(boardGeo);\n' +
'    var boardMat = new THREE.MeshPhongMaterial({ color: 0xffffff });\n' +
'    mats.push(boardMat);\n' +
'    var board = new THREE.Mesh(boardGeo, boardMat);\n' +
'    board.receiveShadow = true;\n' +
'    scene.add(board);\n' +
'\n' +
'    var borderMat = new THREE.MeshPhongMaterial({ color: new THREE.Color(FRAME_COLOR) });\n' +
'    mats.push(borderMat);\n' +
'    var borderDepth = frameDepth * 3;\n' +
'    function addBorder(w, h, x, y) {\n' +
'      var g = new THREE.BoxGeometry(w, h, borderDepth);\n' +
'      geoms.push(g);\n' +
'      var m = new THREE.Mesh(g, borderMat);\n' +
'      m.position.set(x, y, 0);\n' +
'      m.castShadow = true; m.receiveShadow = true;\n' +
'      scene.add(m);\n' +
'    }\n' +
'    addBorder(borderW, frameH, frameW / 2 + borderW / 2, 0);\n' +
'    addBorder(borderW, frameH, -frameW / 2 - borderW / 2, 0);\n' +
'    addBorder(frameW + borderW * 2, borderW, 0, frameH / 2 + borderW / 2);\n' +
'    addBorder(frameW + borderW * 2, borderW, 0, -frameH / 2 - borderW / 2);\n' +
'\n' +
'    var ambient = new THREE.AmbientLight(0xffffff, 0.28);\n' +
'    scene.add(ambient);\n' +
'\n' +
'    var shadowRes = isMobile ? 512 : 1024;\n' +
'    function makeSpot(color, intensity, x, y, castsShadow) {\n' +
'      var light = new THREE.SpotLight(color, intensity, 16, Math.PI / 30, 0.6, 1.4);\n' +
'      light.position.set(x, y, 6);\n' +
'      light.target.position.set(0, 0, 0);\n' +
'      scene.add(light.target);\n' +
'      if (castsShadow) {\n' +
'        light.castShadow = true;\n' +
'        light.shadow.mapSize.width = shadowRes;\n' +
'        light.shadow.mapSize.height = shadowRes;\n' +
'      }\n' +
'      scene.add(light);\n' +
'      return light;\n' +
'    }\n' +
'    var accentInt = new THREE.Color(ACCENT);\n' +
'    var light1 = makeSpot(accentInt.getHex(), 3.2, -3, 4, true);\n' +
'    var light2 = makeSpot(0x4ad9ff, isMobile ? 1.2 : 2.4, 3, 4, !isMobile);\n' +
'    var light3 = isMobile ? null : makeSpot(0xff4ad9, 2.0, 0, 4.6, false);\n' +
'    var lights = [light1, light2];\n' +
'    if (light3) lights.push(light3);\n' +
'\n' +
'    function resizeThree() {\n' +
'      var w = wrap.clientWidth || window.innerWidth;\n' +
'      var h = window.innerHeight;\n' +
'      camera.aspect = w / h;\n' +
'      camera.updateProjectionMatrix();\n' +
'      renderer.setSize(w, h, false);\n' +
'    }\n' +
'\n' +
'    function drawThree(p) {\n' +
'      drawChrome(p);\n' +
'      if (video && video.readyState >= 2) { /* THREE.VideoTexture auto-updates */ }\n' +
'      var focusT = smoothstep(0.1, 0.9, p);\n' +
'      var arc = reducedMotion ? 0 : Math.sin(focusT * Math.PI * 2 - Math.PI / 2) * 0.55;\n' +
'      var camDist = 6.4;\n' +
'      camera.position.set(Math.sin(arc) * camDist, 0.4 + Math.sin(focusT * Math.PI) * 0.3, Math.cos(arc) * camDist);\n' +
'      camera.lookAt(0, 0, 0);\n' +
'\n' +
'      var sway = reducedMotion ? 0 : Math.sin(focusT * Math.PI * 2) * 3.2;\n' +
'      light1.position.x = -3 + sway * 0.6;\n' +
'      light2.position.x = 3 - sway * 0.6;\n' +
'      if (light3) light3.position.x = sway;\n' +
'\n' +
'      renderer.render(scene, camera);\n' +
'    }\n' +
'\n' +
'    resizeThree();\n' +
'    fallbackEl.style.display = "none";\n' +
'    canvasGl.style.display = "block";\n' +
'    mode.draw = drawThree;\n' +
'    mode.resize = resizeThree;\n' +
'    mode.disposeThree = function() {\n' +
'      geoms.forEach(function(g){ g.dispose(); });\n' +
'      mats.forEach(function(mt){ if (mt.map) mt.map.dispose(); mt.dispose(); });\n' +
'      if (video) { video.pause(); video.src = ""; }\n' +
'      renderer.dispose();\n' +
'    };\n' +
'  }\n' +
'\n' +
'  var inView = false;\n' +
'  var scheduled = false;\n' +
'  var rafHandle = null;\n' +
'  function scheduleUpdate() {\n' +
'    if (scheduled) return;\n' +
'    scheduled = true;\n' +
'    rafHandle = window.requestAnimationFrame(function() {\n' +
'      scheduled = false;\n' +
'      mode.draw(progressOf());\n' +
'    });\n' +
'  }\n' +
'\n' +
'  if ("IntersectionObserver" in window) {\n' +
'    var io = new IntersectionObserver(function(entries) {\n' +
'      entries.forEach(function(e) {\n' +
'        inView = e.isIntersecting;\n' +
'        if (inView) { mode.resize(); scheduleUpdate(); }\n' +
'      });\n' +
'    }, { threshold: 0 });\n' +
'    io.observe(wrap);\n' +
'  } else {\n' +
'    inView = true;\n' +
'  }\n' +
'\n' +
'  mode.resize();\n' +
'  mode.draw(progressOf());\n' +
'\n' +
'  window.addEventListener("scroll", function(){ if (inView) scheduleUpdate(); }, { passive: true });\n' +
'  window.addEventListener("resize", function(){ mode.resize(); scheduleUpdate(); });\n' +
'\n' +
'  window.addEventListener("pagehide", function() {\n' +
'    if (rafHandle) window.cancelAnimationFrame(rafHandle);\n' +
'    if (io) io.disconnect();\n' +
'    if (mode.disposeThree) mode.disposeThree();\n' +
'  });\n' +
'})();\n' +
'<\/script>\n' +
'</body>\n' +
'</html>\n';

        return html;
    }

    EP.ScrollSections.register({
        id: 'spotlight-frame-section',
        name: 'Spotlight Frame Showcase Section',
        icon: '🎯',
        description: 'Esqueleto completo de seccion: intro (kicker + titulo + claim), cuadro/producto enmarcado con 3 focos de color y sombras reales (Three.js), leyenda del item, CTA final y fallback CSS con marco y focos simulados si falla WebGL.',
        badge: 'Hero / Product',
        sourceUrl: 'https://gist.github.com/Juanmaes83/edd55f4fcecbb078732945195e14d446',
        build: build
    });
})();
