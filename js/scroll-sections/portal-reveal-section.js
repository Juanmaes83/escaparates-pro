// Portal Reveal Section — adapted from the tracked effect
// js/effects/reveal-wipe/portal-transition.js (a real Three.js scene: glow
// ring meshes and orbiting spark particles in front of a camera that dollies
// through the portal into the next image). This rewrite is a genuine Three.js
// scene — concentric ring meshes with additive glow, a GPU point cloud of
// orbiting sparks, and a camera that flies toward and through the portal as
// a pure function of scroll progress — instead of a 2D clip-path circle.
// Render happens once per scroll tick only (never a permanent loop) and only
// while in the viewport. Falls back to the previous CSS clip-path + canvas
// version if THREE fails to load or WebGL is unavailable.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }
    function seededRand(s) { var x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js';

    function hexToRgb01(hex) {
        var h = hex.replace('#', '');
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        var num = parseInt(h, 16);
        return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'Cruza el umbral';
        var hint = opts.hint || 'Sigue bajando';
        var portalColor = opts.portalColor || '#ff8a3d';
        var background = opts.background || '#04040a';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var m0 = media[0];
        var mediaJSON = JSON.stringify(m0 || null);
        var colorRgb = hexToRgb01(portalColor);

        var ringsHTML = '';
        for (var i = 0; i < 5; i++) {
            ringsHTML += '<div class="prs-ring" data-i="' + i + '"></div>\n      ';
        }
        var artHTML = m0
            ? (m0.type === 'video'
                ? '<video src="' + m0.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + m0.url + '" alt="">')
            : '<div class="prs-placeholder"></div>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Portal Reveal Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#fff0e0;font-family:Arial,Helvetica,sans-serif;}\n' +
'.prs-wrap{position:relative;height:300vh;}\n' +
'.prs-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;}\n' +
'.prs-void{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,#0d0812 0%,' + background + ' 65%);}\n' +
'.prs-canvas-gl{position:absolute;inset:0;width:100%;height:100%;display:none;}\n' +
'.prs-stage{position:relative;width:100%;height:100%;}\n' +
'.prs-media{position:absolute;inset:0;clip-path:circle(0% at 50% 50%);will-change:clip-path;}\n' +
'.prs-media img,.prs-media video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.prs-placeholder{width:100%;height:100%;background:radial-gradient(circle,#26262f,#0c0c10);}\n' +
'.prs-ring{position:absolute;top:50%;left:50%;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:2px solid ' + portalColor + ';box-shadow:0 0 24px ' + portalColor + '55;opacity:0;will-change:transform,opacity;pointer-events:none;}\n' +
'.prs-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}\n' +
'.prs-caption{position:absolute;bottom:2.6rem;left:50%;transform:translateX(-50%) translateY(14px);z-index:5;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out,transform 0.5s ease-out;pointer-events:none;text-shadow:0 2px 12px rgba(0,0,0,0.7);}\n' +
'.prs-caption.is-visible{opacity:1;transform:translateX(-50%) translateY(0);}\n' +
'.prs-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:5;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.prs-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="prs-wrap">\n' +
'  <div class="prs-pin">\n' +
'    <div class="prs-void"></div>\n' +
'    <canvas class="prs-canvas-gl"></canvas>\n' +
'    <div class="prs-stage">\n' +
'      <div class="prs-media">' + artHTML + '</div>\n' +
'      ' + ringsHTML + '\n' +
'      <canvas class="prs-canvas"></canvas>\n' +
'    </div>\n' +
'    <div class="prs-caption">' + claim + '</div>\n' +
'    <div class="prs-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script src="' + THREE_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".prs-wrap");\n' +
'  var media = document.querySelector(".prs-media");\n' +
'  var rings = Array.prototype.slice.call(document.querySelectorAll(".prs-ring"));\n' +
'  var canvas = document.querySelector(".prs-canvas");\n' +
'  var canvasGl = document.querySelector(".prs-canvas-gl");\n' +
'  var stage = document.querySelector(".prs-stage");\n' +
'  var caption = document.querySelector(".prs-caption");\n' +
'  var hint = document.querySelector(".prs-hint");\n' +
'  var PORTAL_COLOR = ' + JSON.stringify(colorRgb) + ';\n' +
'  var M0 = ' + mediaJSON + ';\n' +
'  if (!wrap || !media) return;\n' +
'\n' +
'  function clamp01(v) { return Math.max(0, Math.min(1, v)); }\n' +
'  function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }\n' +
'  function seededRand(s) { var x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }\n' +
'  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
'  var isMobile = window.innerWidth < 768;\n' +
'  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);\n' +
'\n' +
'  var useThree = !!(window.THREE && !reduced);\n' +
'  var renderer = null;\n' +
'  if (useThree) {\n' +
'    try { renderer = new THREE.WebGLRenderer({ canvas: canvasGl, alpha: true, antialias: !isMobile }); }\n' +
'    catch (err) { useThree = false; renderer = null; }\n' +
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
'  function buildFallback() {\n' +
'    stage.style.display = "block";\n' +
'    var ctx = (canvas && canvas.getContext) ? canvas.getContext("2d") : null;\n' +
'    var SPARKS = isMobile ? 12 : 24;\n' +
'    var cssW = 0, cssH = 0;\n' +
'    var sparks = [];\n' +
'    for (var i = 0; i < SPARKS; i++) {\n' +
'      sparks.push({\n' +
'        baseAngle: seededRand(i * 3.7) * Math.PI * 2,\n' +
'        speed: 1.4 + seededRand(i * 5.1 + 1) * 2.2,\n' +
'        radiusJitter: seededRand(i * 7.3 + 2) * 0.4\n' +
'      });\n' +
'    }\n' +
'    function resize() {\n' +
'      if (!ctx) return;\n' +
'      var rect = canvas.getBoundingClientRect();\n' +
'      cssW = rect.width; cssH = rect.height;\n' +
'      canvas.width = Math.round(cssW * dpr);\n' +
'      canvas.height = Math.round(cssH * dpr);\n' +
'      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n' +
'    }\n' +
'    function draw(t) {\n' +
'      var openT = smoothstep(0.05, 0.85, t);\n' +
'      var radiusPct = openT * 145;\n' +
'      media.style.clipPath = "circle(" + radiusPct + "% at 50% 50%)";\n' +
'      var energy = clamp01(1 - t * 1.15);\n' +
'      rings.forEach(function(ring, i) {\n' +
'        var scale = 0.3 + openT * (1.6 + i * 0.35);\n' +
'        ring.style.transform = "translate(-50%,-50%) scale(" + scale + ")";\n' +
'        ring.style.opacity = String(energy * (0.6 - i * 0.08));\n' +
'      });\n' +
'      if (ctx) {\n' +
'        ctx.clearRect(0, 0, cssW, cssH);\n' +
'        if (energy > 0.01) {\n' +
'          var cx = cssW / 2, cy = cssH / 2;\n' +
'          var baseR = Math.min(cssW, cssH) * (0.06 + openT * 0.32);\n' +
'          for (var i = 0; i < sparks.length; i++) {\n' +
'            var s = sparks[i];\n' +
'            var ang = s.baseAngle + t * s.speed * Math.PI * 2;\n' +
'            var r = baseR * (1 + s.radiusJitter);\n' +
'            var x = cx + Math.cos(ang) * r;\n' +
'            var y = cy + Math.sin(ang) * r;\n' +
'            ctx.beginPath();\n' +
'            ctx.arc(x, y, 2.4, 0, Math.PI * 2);\n' +
'            ctx.fillStyle = "rgba(255,170,90," + (energy * 0.85).toFixed(2) + ")";\n' +
'            ctx.fill();\n' +
'          }\n' +
'        }\n' +
'      }\n' +
'      if (caption) caption.classList.toggle("is-visible", t > 0.75);\n' +
'      if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'    }\n' +
'    return { draw: draw, resize: resize, disposeThree: null };\n' +
'  }\n' +
'\n' +
'  function buildThree() {\n' +
'    stage.style.display = "none";\n' +
'    canvasGl.style.display = "block";\n' +
'    renderer.setPixelRatio(dpr);\n' +
'    var scene = new THREE.Scene();\n' +
'    scene.fog = new THREE.Fog(0x04040a, 4, 26);\n' +
'    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);\n' +
'    camera.position.set(0, 0, 6);\n' +
'\n' +
'    var portalGroup = new THREE.Group();\n' +
'    scene.add(portalGroup);\n' +
'    var geoms = [], mats = [];\n' +
'\n' +
'    var ringMats = [];\n' +
'    for (var i = 0; i < 5; i++) {\n' +
'      var inner = 1.1 + i * 0.32;\n' +
'      var outer = inner + 0.05;\n' +
'      var rg = new THREE.RingGeometry(inner, outer, 64);\n' +
'      geoms.push(rg);\n' +
'      var rm = new THREE.MeshBasicMaterial({ color: new THREE.Color(PORTAL_COLOR[0], PORTAL_COLOR[1], PORTAL_COLOR[2]), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });\n' +
'      mats.push(rm);\n' +
'      ringMats.push(rm);\n' +
'      var ringMesh = new THREE.Mesh(rg, rm);\n' +
'      portalGroup.add(ringMesh);\n' +
'    }\n' +
'\n' +
'    var SPARKS = isMobile ? 260 : 520;\n' +
'    var sBase = new Float32Array(SPARKS);\n' +
'    var sSpeed = new Float32Array(SPARKS);\n' +
'    var sJitter = new Float32Array(SPARKS);\n' +
'    var sPos = new Float32Array(SPARKS * 3);\n' +
'    for (var i = 0; i < SPARKS; i++) {\n' +
'      sBase[i] = seededRand(i * 3.7) * Math.PI * 2;\n' +
'      sSpeed[i] = 1.4 + seededRand(i * 5.1 + 1) * 2.2;\n' +
'      sJitter[i] = seededRand(i * 7.3 + 2) * 0.4;\n' +
'    }\n' +
'    var sparkGeo = new THREE.BufferGeometry();\n' +
'    geoms.push(sparkGeo);\n' +
'    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));\n' +
'    sparkGeo.setAttribute("aBase", new THREE.BufferAttribute(sBase, 1));\n' +
'    sparkGeo.setAttribute("aSpeed", new THREE.BufferAttribute(sSpeed, 1));\n' +
'    sparkGeo.setAttribute("aJitter", new THREE.BufferAttribute(sJitter, 1));\n' +
'    var sparkMat = new THREE.ShaderMaterial({\n' +
'      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,\n' +
'      uniforms: { uProgress: { value: 0 }, uSize: { value: 4 }, uEnergy: { value: 1 }, uColor: { value: new THREE.Color(PORTAL_COLOR[0], PORTAL_COLOR[1], PORTAL_COLOR[2]) } },\n' +
'      vertexShader: [\n' +
'        "attribute float aBase;",\n' +
'        "attribute float aSpeed;",\n' +
'        "attribute float aJitter;",\n' +
'        "uniform float uProgress;",\n' +
'        "uniform float uSize;",\n' +
'        "void main() {",\n' +
'        "  float ang = aBase + uProgress * aSpeed * 6.2831853;",\n' +
'        "  float r = (0.85 + aJitter) * (0.6 + uProgress * 1.6);",\n' +
'        "  vec3 pos = vec3(cos(ang) * r, sin(ang) * r, 0.0);",\n' +
'        "  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);",\n' +
'        "  gl_Position = projectionMatrix * mvPosition;",\n' +
'        "  gl_PointSize = uSize;",\n' +
'        "}"\n' +
'      ].join("\\n"),\n' +
'      fragmentShader: [\n' +
'        "uniform vec3 uColor;",\n' +
'        "uniform float uEnergy;",\n' +
'        "void main() {",\n' +
'        "  vec2 uv = gl_PointCoord - 0.5;",\n' +
'        "  float d = length(uv);",\n' +
'        "  if (d > 0.5) discard;",\n' +
'        "  float a = (1.0 - d * 2.0) * uEnergy;",\n' +
'        "  gl_FragColor = vec4(uColor, a);",\n' +
'        "}"\n' +
'      ].join("\\n")\n' +
'    });\n' +
'    mats.push(sparkMat);\n' +
'    var sparks = new THREE.Points(sparkGeo, sparkMat);\n' +
'    sparks.frustumCulled = false;\n' +
'    portalGroup.add(sparks);\n' +
'\n' +
'    var planeGeo = new THREE.PlaneGeometry(60, 40);\n' +
'    geoms.push(planeGeo);\n' +
'    var videos = [];\n' +
'    var planeMat;\n' +
'    if (M0) {\n' +
'      var tex;\n' +
'      if (M0.type === "video") {\n' +
'        var v = document.createElement("video");\n' +
'        v.src = M0.url; v.crossOrigin = "anonymous"; v.loop = true; v.muted = true; v.playsInline = true; v.autoplay = true;\n' +
'        v.play().catch(function(){});\n' +
'        videos.push(v);\n' +
'        tex = new THREE.VideoTexture(v);\n' +
'      } else {\n' +
'        var loader = new THREE.TextureLoader();\n' +
'        loader.crossOrigin = "anonymous";\n' +
'        tex = loader.load(M0.url);\n' +
'      }\n' +
'      planeMat = new THREE.MeshBasicMaterial({ map: tex });\n' +
'    } else {\n' +
'      planeMat = new THREE.MeshBasicMaterial({ color: 0x26262f });\n' +
'    }\n' +
'    mats.push(planeMat);\n' +
'    var revealPlane = new THREE.Mesh(planeGeo, planeMat);\n' +
'    revealPlane.position.z = -16;\n' +
'    scene.add(revealPlane);\n' +
'\n' +
'    function resizeThree() {\n' +
'      var w = wrap.clientWidth || window.innerWidth;\n' +
'      var h = window.innerHeight;\n' +
'      camera.aspect = w / h;\n' +
'      camera.updateProjectionMatrix();\n' +
'      renderer.setSize(w, h, false);\n' +
'    }\n' +
'\n' +
'    function draw(t) {\n' +
'      var openT = smoothstep(0.05, 0.85, t);\n' +
'      var energy = clamp01(1 - t * 1.15);\n' +
'      portalGroup.position.z = -14 + openT * 15.4;\n' +
'      var scl = 1 + openT * 1.5;\n' +
'      portalGroup.scale.set(scl, scl, 1);\n' +
'      for (var i = 0; i < ringMats.length; i++) {\n' +
'        ringMats[i].opacity = energy * (0.6 - i * 0.08);\n' +
'      }\n' +
'      sparkMat.uniforms.uProgress.value = t;\n' +
'      sparkMat.uniforms.uEnergy.value = energy;\n' +
'      camera.position.y = Math.sin(t * Math.PI) * 0.15;\n' +
'      renderer.render(scene, camera);\n' +
'      if (caption) caption.classList.toggle("is-visible", t > 0.75);\n' +
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
'    mode = useThree ? buildThree() : buildFallback();\n' +
'  } catch (err) {\n' +
'    useThree = false;\n' +
'    canvasGl.style.display = "none";\n' +
'    mode = buildFallback();\n' +
'  }\n' +
'\n' +
'  var active = false;\n' +
'  var scheduled = false;\n' +
'  function scheduleUpdate() {\n' +
'    if (!active || scheduled) return;\n' +
'    scheduled = true;\n' +
'    requestAnimationFrame(function() { scheduled = false; mode.draw(progressOf()); });\n' +
'  }\n' +
'\n' +
'  var io = null;\n' +
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
        id: 'portal-reveal-section',
        name: 'Portal Reveal Section',
        icon: '🌀',
        description: 'Portal real en Three.js: anillos de energía con blending aditivo y una nube de chispas GPU orbitando mientras la cámara vuela hacia el umbral y lo atraviesa, revelando la imagen al fondo — umbral cinematográfico de verdad, no un clip-path plano. Adaptado del efecto interno Portal Transition (js/effects/reveal-wipe/portal-transition.js); cae al clip-path circular + canvas 2D original si WebGL no está disponible.',
        build: build
    });
})();
