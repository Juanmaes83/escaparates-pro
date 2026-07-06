// Particle Flow Section — adapted from the tracked "photo particles" style
// flowing-media concept. Built as a COMPLETE, personalizable section
// skeleton: an intro block (kicker + title + claim), a real Three.js scene
// where each media item flies in along its own curved arc (scattered start,
// bezier control point, tumbling rotation that eases out) and assembles
// into a lit photo mosaic grid, per-item captions (opts.items) that fade in
// under each grid cell once it arrives (screen position computed via a real
// camera projection, not guesswork), and a closing CTA block with a real
// button (opts.ctaText / opts.ctaHref). Real Three.js: MeshBasicMaterial
// textured planes on a deterministic quadratic-bezier flight path driven
// purely by scroll progress with a per-item stagger (no clock, no
// InstancedMesh — plain per-item Mesh + texture cache keeps every image its
// own crisp source, and the count stays small enough that this is cheap).
// Renders once per scroll tick, only in viewport, full dispose on teardown.
// Falls back to a CSS grid cascade (opacity/scale reveal per cell) if THREE
// fails to load or WebGL is unavailable.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }

    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js';
    var N_DESKTOP = 8, N_MOBILE = 4;
    var COLS_DESKTOP = 4, COLS_MOBILE = 2;

    function hash(i) {
        var x = Math.sin(i * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var kicker = opts.kicker || 'Momentos';
        var title = opts.title || 'Todo cobra forma';
        var claim = opts.claim || 'Cada imagen encuentra su lugar.';
        var hint = opts.hint || 'Sigue bajando';
        var ctaText = opts.ctaText || 'Ver la colección completa';
        var ctaHref = opts.ctaHref || '#';
        var accentColor = opts.accentColor || '#ff6f91';
        var background = opts.background || '#08080c';
        var items = opts.items || [];

        var mediaN = EP.ScrollSections.fillMedia(mediaList, N_DESKTOP);
        var captions = [];
        for (var i = 0; i < N_DESKTOP; i++) captions.push(items[i] || ('Pieza ' + (i + 1).toString().padStart(2, '0')));
        var mediaJSON = JSON.stringify(mediaN);
        var captionsJSON = JSON.stringify(captions);

        var fbHTML = '';
        for (var f = 0; f < N_DESKTOP; f++) {
            var fm = mediaN[f];
            var fart = fm
                ? (fm.type === 'video' ? '<video src="' + fm.url + '" autoplay muted loop playsinline></video>' : '<img src="' + fm.url + '" alt="">')
                : '<div class="pf-placeholder"></div>';
            fbHTML += '<div class="pf-fbcell" data-idx="' + f + '">' + fart + '<span class="pf-fbcaption"></span></div>\n        ';
        }

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Particle Flow Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f4efe6;font-family:Arial,Helvetica,sans-serif;}\n' +
'.pf-wrap{position:relative;height:340vh;}\n' +
'.pf-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;background:radial-gradient(circle at 50% 50%,#141018 0%,' + background + ' 75%);}\n' +
'.pf-canvas-gl{position:absolute;inset:0;width:100%;height:100%;display:none;}\n' +
'.pf-fallback{position:absolute;inset:0;display:grid;grid-template-columns:repeat(' + COLS_MOBILE + ',1fr);gap:0.6rem;padding:4.5rem 1.2rem;place-items:stretch;}\n' +
'@media (min-width:769px){.pf-fallback{grid-template-columns:repeat(' + COLS_DESKTOP + ',1fr);gap:1rem;padding:6rem 3rem;}}\n' +
'.pf-fbcell{position:relative;border-radius:10px;overflow:hidden;opacity:0;transform:scale(0.7);transition:opacity 0.35s ease-out,transform 0.35s ease-out;box-shadow:0 14px 30px rgba(0,0,0,0.5);}\n' +
'.pf-fbcell.is-in{opacity:1;transform:scale(1);}\n' +
'.pf-fbcell img,.pf-fbcell video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.pf-placeholder{width:100%;height:100%;min-height:120px;background:linear-gradient(135deg,#242432,#0c0c14);}\n' +
'.pf-fbcaption{position:absolute;bottom:0;left:0;right:0;padding:0.35rem 0.5rem;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;background:linear-gradient(to top,rgba(0,0,0,0.75),transparent);color:' + accentColor + ';}\n' +
'.pf-caption-tag{position:absolute;transform:translate(-50%,4px);z-index:4;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:' + accentColor + ';text-shadow:0 2px 8px rgba(0,0,0,0.8);opacity:0;transition:opacity 0.35s ease-out;pointer-events:none;white-space:nowrap;}\n' +
'.pf-caption-tag.is-visible{opacity:1;}\n' +
'.pf-intro{position:absolute;top:12%;left:50%;transform:translateX(-50%);z-index:5;text-align:center;max-width:86vw;opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.pf-intro.is-visible{opacity:1;}\n' +
'.pf-kicker{font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase;color:' + accentColor + ';font-weight:700;margin-bottom:0.6rem;}\n' +
'.pf-title{font-size:clamp(1.6rem,4.2vw,2.8rem);font-weight:800;margin-bottom:0.5rem;text-shadow:0 2px 18px rgba(0,0,0,0.6);}\n' +
'.pf-claim{font-size:clamp(0.95rem,1.8vw,1.2rem);color:#d8d2c6;max-width:44ch;margin:0 auto;}\n' +
'.pf-cta{position:absolute;bottom:4.2rem;left:50%;transform:translateX(-50%) translateY(16px);z-index:6;text-align:center;opacity:0;transition:opacity 0.5s ease-out,transform 0.5s ease-out;pointer-events:none;}\n' +
'.pf-cta.is-visible{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto;}\n' +
'.pf-cta a{display:inline-block;padding:0.85rem 2rem;border-radius:999px;background:' + accentColor + ';color:#210812;font-weight:800;text-decoration:none;letter-spacing:0.02em;box-shadow:0 12px 30px rgba(0,0,0,0.4);}\n' +
'.pf-hint{position:absolute;bottom:1rem;left:50%;transform:translateX(-50%);z-index:5;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.pf-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="pf-wrap">\n' +
'  <div class="pf-pin">\n' +
'    <canvas class="pf-canvas-gl"></canvas>\n' +
'    <div class="pf-fallback">\n        ' + fbHTML + '\n    </div>\n' +
'    <div class="pf-intro"><div class="pf-kicker">' + kicker + '</div><h1 class="pf-title">' + title + '</h1><p class="pf-claim">' + claim + '</p></div>\n' +
'    <div class="pf-cta"><a href="' + ctaHref + '" target="_blank" rel="noopener">' + ctaText + '</a></div>\n' +
'    <div class="pf-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script src="' + THREE_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".pf-wrap");\n' +
'  var canvasGl = document.querySelector(".pf-canvas-gl");\n' +
'  var fallbackEl = document.querySelector(".pf-fallback");\n' +
'  var intro = document.querySelector(".pf-intro");\n' +
'  var ctaEl = document.querySelector(".pf-cta");\n' +
'  var hint = document.querySelector(".pf-hint");\n' +
'  var pinEl = document.querySelector(".pf-pin");\n' +
'  var MEDIA = ' + mediaJSON + ';\n' +
'  var CAPTIONS = ' + captionsJSON + ';\n' +
'  if (!wrap) return;\n' +
'\n' +
'  function clamp01(v) { return Math.max(0, Math.min(1, v)); }\n' +
'  function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }\n' +
'  function hash(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }\n' +
'  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
'  var isMobile = window.innerWidth < 768;\n' +
'  var N = isMobile ? ' + N_MOBILE + ' : ' + N_DESKTOP + ';\n' +
'  var COLS = isMobile ? ' + COLS_MOBILE + ' : ' + COLS_DESKTOP + ';\n' +
'  var ROWS = Math.ceil(N / COLS);\n' +
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
'  var FLOW_START = 0.14, FLOW_END = 0.78;\n' +
'  function beats(t) {\n' +
'    var introT = 1 - smoothstep(0.0, 0.12, t);\n' +
'    var flowT = smoothstep(FLOW_START, FLOW_END, t);\n' +
'    var outroT = smoothstep(0.88, 1.0, t);\n' +
'    return { introT: introT, flowT: flowT, outroT: outroT };\n' +
'  }\n' +
'\n' +
'  var stagger = 0.5 / N;\n' +
'  var windowLen = 1 - stagger * (N - 1);\n' +
'  function localProgress(i, flowT) {\n' +
'    var start = i * stagger;\n' +
'    return smoothstep(start, start + windowLen, flowT);\n' +
'  }\n' +
'\n' +
'  var useThree = !!(window.THREE && !reduced);\n' +
'  var renderer = null;\n' +
'  if (useThree) {\n' +
'    try { renderer = new THREE.WebGLRenderer({ canvas: canvasGl, alpha: true, antialias: !isMobile }); }\n' +
'    catch (err) { useThree = false; renderer = null; }\n' +
'  }\n' +
'\n' +
'  function updateChrome(t) {\n' +
'    var b = beats(t);\n' +
'    intro.classList.toggle("is-visible", b.introT > 0.5);\n' +
'    ctaEl.classList.toggle("is-visible", b.outroT > 0.5);\n' +
'    if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'  }\n' +
'\n' +
'  function buildFallback() {\n' +
'    fallbackEl.style.display = "grid";\n' +
'    var cells = Array.prototype.slice.call(document.querySelectorAll(".pf-fbcell"));\n' +
'    cells.forEach(function(cell, i) {\n' +
'      var capEl = cell.querySelector(".pf-fbcaption");\n' +
'      if (capEl) capEl.textContent = CAPTIONS[i % CAPTIONS.length];\n' +
'    });\n' +
'    function draw(t) {\n' +
'      var b = beats(t);\n' +
'      cells.forEach(function(cell, i) {\n' +
'        cell.classList.toggle("is-in", localProgress(i, b.flowT) > 0.5);\n' +
'      });\n' +
'      updateChrome(t);\n' +
'    }\n' +
'    return { draw: draw, resize: function(){}, disposeThree: null };\n' +
'  }\n' +
'\n' +
'  function buildThree() {\n' +
'    fallbackEl.style.display = "none";\n' +
'    canvasGl.style.display = "block";\n' +
'    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));\n' +
'    var scene = new THREE.Scene();\n' +
'    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);\n' +
'    camera.position.set(0, 0, 9);\n' +
'    camera.lookAt(0, 0, 0);\n' +
'\n' +
'    var geoms = [], mats = [];\n' +
'    var ambient = new THREE.AmbientLight(0xffffff, 0.9);\n' +
'    scene.add(ambient);\n' +
'    var keyLight = new THREE.DirectionalLight(0xffffff, 0.4);\n' +
'    keyLight.position.set(2, 3, 5);\n' +
'    scene.add(keyLight);\n' +
'\n' +
'    var cellW = isMobile ? 1.5 : 1.9, cellH = isMobile ? 1.15 : 1.4;\n' +
'    var gapX = isMobile ? 0.18 : 0.24, gapY = isMobile ? 0.18 : 0.24;\n' +
'    var gridW = COLS * cellW + (COLS - 1) * gapX;\n' +
'    var gridH = ROWS * cellH + (ROWS - 1) * gapY;\n' +
'\n' +
'    var loader = new THREE.TextureLoader();\n' +
'    loader.crossOrigin = "anonymous";\n' +
'    var texCache = {};\n' +
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
'    var planeGeo = new THREE.PlaneGeometry(cellW, cellH);\n' +
'    geoms.push(planeGeo);\n' +
'\n' +
'    var pieces = [];\n' +
'    var captionEls = [];\n' +
'    for (var i = 0; i < N; i++) {\n' +
'      var m = MEDIA[i % MEDIA.length];\n' +
'      var tex = textureFor(m);\n' +
'      var mat = tex\n' +
'        ? new THREE.MeshBasicMaterial({ map: tex, transparent: true })\n' +
'        : new THREE.MeshBasicMaterial({ color: 0x333340, transparent: true });\n' +
'      mats.push(mat);\n' +
'      var mesh = new THREE.Mesh(planeGeo, mat);\n' +
'      var col = i % COLS, row = Math.floor(i / COLS);\n' +
'      var targetX = -gridW / 2 + cellW / 2 + col * (cellW + gapX);\n' +
'      var targetY = gridH / 2 - cellH / 2 - row * (cellH + gapY);\n' +
'      var targetZ = 0;\n' +
'      var seed = i * 7.31;\n' +
'      var ang = hash(seed) * Math.PI * 2;\n' +
'      var rad = 7 + hash(seed + 1) * 5;\n' +
'      var startX = Math.cos(ang) * rad;\n' +
'      var startY = Math.sin(ang) * rad * 0.6 + (hash(seed + 2) - 0.5) * 3;\n' +
'      var startZ = -4 - hash(seed + 3) * 5;\n' +
'      var ctrlX = (startX + targetX) / 2 + (hash(seed + 4) - 0.5) * 4;\n' +
'      var ctrlY = Math.max(startY, targetY) + 2 + hash(seed + 5) * 2;\n' +
'      var ctrlZ = (startZ + targetZ) / 2 + 2;\n' +
'      var spinDir = hash(seed + 6) > 0.5 ? 1 : -1;\n' +
'      mesh.position.set(startX, startY, startZ);\n' +
'      scene.add(mesh);\n' +
'      pieces.push({\n' +
'        mesh: mesh, mat: mat,\n' +
'        start: new THREE.Vector3(startX, startY, startZ),\n' +
'        ctrl: new THREE.Vector3(ctrlX, ctrlY, ctrlZ),\n' +
'        target: new THREE.Vector3(targetX, targetY, targetZ),\n' +
'        spinDir: spinDir\n' +
'      });\n' +
'      var tag = document.createElement("div");\n' +
'      tag.className = "pf-caption-tag";\n' +
'      tag.textContent = CAPTIONS[i % CAPTIONS.length];\n' +
'      pinEl.appendChild(tag);\n' +
'      captionEls.push(tag);\n' +
'    }\n' +
'\n' +
'    function resizeThree() {\n' +
'      var w = wrap.clientWidth || window.innerWidth;\n' +
'      var h = window.innerHeight;\n' +
'      camera.aspect = w / h;\n' +
'      camera.updateProjectionMatrix();\n' +
'      renderer.setSize(w, h, false);\n' +
'      pieces.forEach(function(p, i) {\n' +
'        var v = p.target.clone().project(camera);\n' +
'        var sx = (v.x * 0.5 + 0.5) * w;\n' +
'        var sy = (1 - (v.y * 0.5 + 0.5)) * h + (cellH * 22);\n' +
'        captionEls[i].style.left = sx + "px";\n' +
'        captionEls[i].style.top = sy + "px";\n' +
'      });\n' +
'    }\n' +
'\n' +
'    function bezier(p0, p1, p2, u) {\n' +
'      var mu = 1 - u;\n' +
'      return new THREE.Vector3(\n' +
'        mu * mu * p0.x + 2 * mu * u * p1.x + u * u * p2.x,\n' +
'        mu * mu * p0.y + 2 * mu * u * p1.y + u * u * p2.y,\n' +
'        mu * mu * p0.z + 2 * mu * u * p1.z + u * u * p2.z\n' +
'      );\n' +
'    }\n' +
'\n' +
'    function draw(t) {\n' +
'      var b = beats(t);\n' +
'      for (var i = 0; i < pieces.length; i++) {\n' +
'        var p = pieces[i];\n' +
'        var u = localProgress(i, b.flowT);\n' +
'        var pos = bezier(p.start, p.ctrl, p.target, u);\n' +
'        p.mesh.position.copy(pos);\n' +
'        var spin = (1 - u) * Math.PI * 1.4 * p.spinDir;\n' +
'        p.mesh.rotation.y = spin;\n' +
'        p.mesh.rotation.z = spin * 0.4;\n' +
'        p.mat.opacity = 0.15 + 0.85 * u;\n' +
'        var s = 0.6 + 0.4 * u;\n' +
'        p.mesh.scale.set(s, s, s);\n' +
'        captionEls[i].classList.toggle("is-visible", u > 0.92 && b.outroT < 0.6);\n' +
'      }\n' +
'      renderer.render(scene, camera);\n' +
'      updateChrome(t);\n' +
'    }\n' +
'\n' +
'    function disposeThree() {\n' +
'      geoms.forEach(function(g){ g.dispose(); });\n' +
'      mats.forEach(function(mt){ if (mt.map) mt.map.dispose(); mt.dispose(); });\n' +
'      videos.forEach(function(v){ v.pause(); v.src = ""; });\n' +
'      captionEls.forEach(function(el){ el.remove(); });\n' +
'      renderer.dispose();\n' +
'    }\n' +
'\n' +
'    resizeThree();\n' +
'    return { draw: draw, resize: resizeThree, disposeThree: disposeThree };\n' +
'  }\n' +
'\n' +
'  var mode = null;\n' +
'  try { mode = useThree ? buildThree() : buildFallback(); }\n' +
'  catch (err) { useThree = false; canvasGl.style.display = "none"; mode = buildFallback(); }\n' +
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
        id: 'particle-flow-section',
        name: 'Particle Flow Section',
        icon: '🌊',
        description: 'Esqueleto completo de sección: bloque de intro (kicker + título + claim), cada imagen del cliente entra volando en Three.js por una curva bezier propia (origen disperso, giro que se frena, fundido de opacidad) hasta ensamblarse en un mosaico con iluminación real, leyendas por pieza (opts.items) que aparecen bajo cada celda usando la proyección real de cámara, y un bloque de cierre con botón CTA. Inspirado en el concepto interno de flujo de partículas fotográficas; cae a un grid CSS con cascada de aparición si WebGL no está disponible. Personalizable vía opts: kicker, title, claim, items, ctaText, ctaHref, accentColor.',
        build: build
    });
})();
