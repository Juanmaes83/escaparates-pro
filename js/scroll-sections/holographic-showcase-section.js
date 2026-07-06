// Holographic Showcase Section — adapted from the tracked effect
// js/effects/glassmorphism/holographic-card.js (a real Three.js card mesh
// with a procedural foil texture). This rewrite renders the card as a real
// Three.js plane with a custom fresnel-based iridescence shader — the
// rainbow sheen genuinely depends on view angle (dot(normal, viewDir)) as
// the card tilts with scroll and pointer, instead of a CSS conic-gradient
// blend trick — plus a small GPU point cloud of twinkling sparks. Rendered
// once per scroll/pointer tick only (never a permanent loop) and only while
// in the viewport. Falls back to the original CSS 3D foil-card version if
// THREE fails to load or WebGL is unavailable.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }

    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var claim = opts.claim || 'Edición limitada, brillo infinito';
        var hint = opts.hint || 'Sigue bajando';
        var background = opts.background || '#0a0a12';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var m0 = media[0];
        var mediaJSON = JSON.stringify(m0 || null);
        var artHTML = m0
            ? (m0.type === 'video'
                ? '<video src="' + m0.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + m0.url + '" alt="">')
            : '<div class="hcs-placeholder"></div>';

        var sparksHTML = '';
        for (var i = 0; i < 7; i++) {
            var left = (10 + i * 12.5).toFixed(1);
            var top = (14 + ((i * 37) % 72)).toFixed(1);
            sparksHTML += '<div class="hcs-spark" data-i="' + i + '" style="left:' + left + '%;top:' + top + '%;"></div>\n      ';
        }

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Holographic Showcase Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f2ede4;font-family:Arial,Helvetica,sans-serif;}\n' +
'.hcs-wrap{position:relative;height:260vh;}\n' +
'.hcs-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;perspective:1200px;}\n' +
'.hcs-canvas-gl{position:absolute;inset:0;width:100%;height:100%;display:none;}\n' +
'.hcs-stage{position:relative;width:min(58vw,420px);aspect-ratio:3/4;transform-style:preserve-3d;will-change:transform;}\n' +
'.hcs-shadow{position:absolute;left:6%;right:6%;bottom:-6%;height:14%;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,0.55),transparent 70%);filter:blur(4px);}\n' +
'.hcs-card{position:absolute;inset:0;border-radius:16px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.08) inset;background:#141420;}\n' +
'.hcs-card img,.hcs-card video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.hcs-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#26263a,#0c0c14);}\n' +
'.hcs-sheen{position:absolute;inset:-30%;background:conic-gradient(from 0deg,#ff5fa2,#ffd25f,#5fffb0,#5fc9ff,#b45fff,#ff5fa2);mix-blend-mode:color-dodge;opacity:0.42;will-change:transform,opacity;}\n' +
'.hcs-sweep{position:absolute;inset:0;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,0.55) 50%,transparent 60%);mix-blend-mode:overlay;will-change:transform;}\n' +
'.hcs-border{position:absolute;inset:0;border-radius:16px;box-shadow:0 0 0 1.5px rgba(255,255,255,0.25) inset;pointer-events:none;}\n' +
'.hcs-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 10px 3px rgba(255,255,255,0.8);opacity:0;pointer-events:none;}\n' +
'.hcs-caption{position:absolute;bottom:2.6rem;left:50%;transform:translateX(-50%) translateY(14px);z-index:4;text-align:center;max-width:80vw;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(1.1rem,2.6vw,1.9rem);opacity:0;transition:opacity 0.5s ease-out,transform 0.5s ease-out;pointer-events:none;text-shadow:0 2px 12px rgba(0,0,0,0.6);}\n' +
'.hcs-caption.is-visible{opacity:1;transform:translateX(-50%) translateY(0);}\n' +
'.hcs-hint{position:absolute;bottom:0.8rem;left:50%;transform:translateX(-50%);z-index:4;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.hcs-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'@media (max-width:768px){.hcs-stage{width:min(72vw,320px);} .hcs-pin{perspective:800px;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="hcs-wrap">\n' +
'  <div class="hcs-pin">\n' +
'    <canvas class="hcs-canvas-gl"></canvas>\n' +
'    <div class="hcs-stage">\n' +
'      <div class="hcs-shadow"></div>\n' +
'      <div class="hcs-card">\n' +
'        ' + artHTML + '\n' +
'        <div class="hcs-sheen"></div>\n' +
'        <div class="hcs-sweep"></div>\n' +
'        <div class="hcs-border"></div>\n' +
'        ' + sparksHTML + '\n' +
'      </div>\n' +
'    </div>\n' +
'    <div class="hcs-caption">' + claim + '</div>\n' +
'    <div class="hcs-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script src="' + THREE_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".hcs-wrap");\n' +
'  var stage = document.querySelector(".hcs-stage");\n' +
'  var canvasGl = document.querySelector(".hcs-canvas-gl");\n' +
'  var sheen = document.querySelector(".hcs-sheen");\n' +
'  var sweep = document.querySelector(".hcs-sweep");\n' +
'  var sparksDom = Array.prototype.slice.call(document.querySelectorAll(".hcs-spark"));\n' +
'  var caption = document.querySelector(".hcs-caption");\n' +
'  var hint = document.querySelector(".hcs-hint");\n' +
'  var M0 = ' + mediaJSON + ';\n' +
'  if (!wrap || !stage) return;\n' +
'\n' +
'  function clamp01(v) { return Math.max(0, Math.min(1, v)); }\n' +
'  function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }\n' +
'  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
'  var canHover = window.matchMedia && window.matchMedia("(pointer: fine)").matches;\n' +
'  var isMobile = window.innerWidth < 768;\n' +
'  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);\n' +
'  var pointerDX = 0, pointerDY = 0;\n' +
'\n' +
'  var useThree = !!(window.THREE && !reduced);\n' +
'  var renderer = null;\n' +
'  if (useThree) {\n' +
'    try { renderer = new THREE.WebGLRenderer({ canvas: canvasGl, alpha: true, antialias: true }); }\n' +
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
'    function draw(t) {\n' +
'      var camPass = Math.sin(t * Math.PI);\n' +
'      var rotY = -20 + t * 40 + pointerDX * 10;\n' +
'      var rotX = camPass * 6 + pointerDY * -8;\n' +
'      if (reduced) { rotY = 0; rotX = 0; }\n' +
'      stage.style.transform = "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";\n' +
'      var sheenPos = (t * 160 - 30);\n' +
'      sheen.style.transform = "translateX(" + sheenPos + "%) rotate(" + (t * 25) + "deg)";\n' +
'      sheen.style.opacity = String(0.28 + Math.sin(t * Math.PI) * 0.3);\n' +
'      var sweepX = (t * 220 - 60);\n' +
'      sweep.style.transform = "translateX(" + sweepX + "%)";\n' +
'      sparksDom.forEach(function(s, i) {\n' +
'        var phase = clamp01((t - i * 0.11) * 3);\n' +
'        var twinkle = Math.sin(phase * Math.PI);\n' +
'        s.style.opacity = String(Math.max(0, twinkle) * 0.9);\n' +
'        s.style.transform = "scale(" + (0.6 + twinkle * 0.8) + ")";\n' +
'      });\n' +
'      if (caption) caption.classList.toggle("is-visible", t > 0.35 && t < 0.95);\n' +
'      if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'    }\n' +
'    return { draw: draw, resize: function(){}, disposeThree: null };\n' +
'  }\n' +
'\n' +
'  function buildThree() {\n' +
'    stage.style.display = "none";\n' +
'    canvasGl.style.display = "block";\n' +
'    renderer.setPixelRatio(dpr);\n' +
'    var scene = new THREE.Scene();\n' +
'    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);\n' +
'    camera.position.set(0, 0, 6);\n' +
'\n' +
'    var geoms = [], mats = [];\n' +
'    var cardGeo = new THREE.PlaneGeometry(1.5, 2);\n' +
'    geoms.push(cardGeo);\n' +
'    var uMap = { value: null };\n' +
'    var uHasMap = { value: 0 };\n' +
'    var videos = [];\n' +
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
'      uMap.value = tex;\n' +
'      uHasMap.value = 1;\n' +
'    }\n' +
'    var cardMat = new THREE.ShaderMaterial({\n' +
'      uniforms: { uMap: uMap, uHasMap: uHasMap, uProgress: { value: 0 } },\n' +
'      vertexShader: [\n' +
'        "varying vec2 vUv;",\n' +
'        "varying vec3 vNormal;",\n' +
'        "varying vec3 vViewPosition;",\n' +
'        "void main() {",\n' +
'        "  vUv = uv;",\n' +
'        "  vNormal = normalize(normalMatrix * normal);",\n' +
'        "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",\n' +
'        "  vViewPosition = -mv.xyz;",\n' +
'        "  gl_Position = projectionMatrix * mv;",\n' +
'        "}"\n' +
'      ].join("\\n"),\n' +
'      fragmentShader: [\n' +
'        "uniform sampler2D uMap;",\n' +
'        "uniform float uHasMap;",\n' +
'        "uniform float uProgress;",\n' +
'        "varying vec2 vUv;",\n' +
'        "varying vec3 vNormal;",\n' +
'        "varying vec3 vViewPosition;",\n' +
'        "vec3 hsl2rgb(vec3 c) {",\n' +
'        "  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);",\n' +
'        "  return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));",\n' +
'        "}",\n' +
'        "void main() {",\n' +
'        "  vec3 viewDir = normalize(vViewPosition);",\n' +
'        "  vec3 normal = normalize(vNormal);",\n' +
'        "  float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 2.2);",\n' +
'        "  vec4 texColor = uHasMap > 0.5 ? texture2D(uMap, vUv) : vec4(0.12,0.12,0.16,1.0);",\n' +
'        "  float hue = fract(uProgress * 0.35 + fresnel * 1.3 + vUv.x * 0.35 + vUv.y * 0.15);",\n' +
'        "  vec3 holo = hsl2rgb(vec3(hue, 0.85, 0.6));",\n' +
'        "  float band = sin((vUv.x + vUv.y) * 8.0 - uProgress * 10.0) * 0.5 + 0.5;",\n' +
'        "  float sweep = smoothstep(0.82, 1.0, band) * 0.5;",\n' +
'        "  vec3 col = texColor.rgb + holo * fresnel * 0.85 + sweep;",\n' +
'        "  gl_FragColor = vec4(col, texColor.a);",\n' +
'        "}"\n' +
'      ].join("\\n")\n' +
'    });\n' +
'    mats.push(cardMat);\n' +
'    var card = new THREE.Mesh(cardGeo, cardMat);\n' +
'    scene.add(card);\n' +
'\n' +
'    var SPARKS = 7;\n' +
'    var sPos = new Float32Array(SPARKS * 3);\n' +
'    var sPhase = new Float32Array(SPARKS);\n' +
'    for (var i = 0; i < SPARKS; i++) {\n' +
'      sPos[i * 3] = (Math.random() - 0.5) * 1.3;\n' +
'      sPos[i * 3 + 1] = (Math.random() - 0.5) * 1.8;\n' +
'      sPos[i * 3 + 2] = 0.05;\n' +
'      sPhase[i] = i * 0.11;\n' +
'    }\n' +
'    var sparkGeo = new THREE.BufferGeometry();\n' +
'    geoms.push(sparkGeo);\n' +
'    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));\n' +
'    sparkGeo.setAttribute("aPhase", new THREE.BufferAttribute(sPhase, 1));\n' +
'    var sparkMat = new THREE.ShaderMaterial({\n' +
'      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,\n' +
'      uniforms: { uT: { value: 0 } },\n' +
'      vertexShader: [\n' +
'        "attribute float aPhase;",\n' +
'        "uniform float uT;",\n' +
'        "varying float vTwinkle;",\n' +
'        "void main() {",\n' +
'        "  float phase = clamp((uT - aPhase) * 3.0, 0.0, 1.0);",\n' +
'        "  vTwinkle = sin(phase * 3.14159265);",\n' +
'        "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",\n' +
'        "  gl_Position = projectionMatrix * mv;",\n' +
'        "  gl_PointSize = 3.0 + vTwinkle * 5.0;",\n' +
'        "}"\n' +
'      ].join("\\n"),\n' +
'      fragmentShader: [\n' +
'        "varying float vTwinkle;",\n' +
'        "void main() {",\n' +
'        "  vec2 uv = gl_PointCoord - 0.5;",\n' +
'        "  if (length(uv) > 0.5) discard;",\n' +
'        "  gl_FragColor = vec4(1.0, 1.0, 1.0, max(0.0, vTwinkle) * 0.9);",\n' +
'        "}"\n' +
'      ].join("\\n")\n' +
'    });\n' +
'    mats.push(sparkMat);\n' +
'    var sparks = new THREE.Points(sparkGeo, sparkMat);\n' +
'    sparks.frustumCulled = false;\n' +
'    card.add(sparks);\n' +
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
'      var camPass = Math.sin(t * Math.PI);\n' +
'      var rotY = -20 + t * 40 + pointerDX * 10;\n' +
'      var rotX = camPass * 6 + pointerDY * -8;\n' +
'      card.rotation.y = THREE.MathUtils.degToRad(rotY);\n' +
'      card.rotation.x = THREE.MathUtils.degToRad(rotX);\n' +
'      cardMat.uniforms.uProgress.value = t;\n' +
'      sparkMat.uniforms.uT.value = t;\n' +
'      renderer.render(scene, camera);\n' +
'      if (caption) caption.classList.toggle("is-visible", t > 0.35 && t < 0.95);\n' +
'      if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'    }\n' +
'\n' +
'    function disposeThree() {\n' +
'      geoms.forEach(function(g){ g.dispose(); });\n' +
'      mats.forEach(function(mt){ if (mt.uniforms && mt.uniforms.uMap && mt.uniforms.uMap.value) mt.uniforms.uMap.value.dispose(); mt.dispose(); });\n' +
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
'  function onPointerMove(e) {\n' +
'    if (!active) return;\n' +
'    var rect = wrap.getBoundingClientRect();\n' +
'    var cx = rect.left + rect.width / 2;\n' +
'    var cy = rect.top + rect.height / 2;\n' +
'    pointerDX = clamp01((e.clientX - cx) / (rect.width / 2) * 0.5 + 0.5) * 2 - 1;\n' +
'    pointerDY = clamp01((e.clientY - cy) / (rect.height / 2) * 0.5 + 0.5) * 2 - 1;\n' +
'    scheduleUpdate();\n' +
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
'  if (canHover && !reduced) window.addEventListener("mousemove", onPointerMove, { passive: true });\n' +
'\n' +
'  window.addEventListener("pagehide", function() {\n' +
'    window.removeEventListener("scroll", scheduleUpdate);\n' +
'    window.removeEventListener("mousemove", onPointerMove);\n' +
'    if (io) io.disconnect();\n' +
'    if (mode && mode.disposeThree) mode.disposeThree();\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'holographic-showcase-section',
        name: 'Holographic Showcase Section',
        icon: '💎',
        description: 'Tarjeta de producto en Three.js con foil holográfico real: un shader de fresnel calcula el arcoíris a partir del ángulo de vista genuino mientras la tarjeta gira con el scroll y el cursor, con chispas GPU parpadeando alrededor — reflejo auténtico, no un truco de blend en CSS. Adaptado del efecto interno Holographic Card (js/effects/glassmorphism/holographic-card.js); cae a la tarjeta CSS 3D original si WebGL no está disponible.',
        build: build
    });
})();
