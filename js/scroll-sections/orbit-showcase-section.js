// Orbit Showcase Section — adapted from the tracked effect
// js/effects/orbit/solar-system.js (Three.js sun + orbiting planets). Built
// as a COMPLETE, personalizable section skeleton, not a single visual
// moment: an intro block (kicker + title + claim), a real Three.js solar
// system where each media item becomes a textured "planet" orbiting a lit
// sun, a sequential feature-caption beat that highlights one planet at a
// time (scaling it up + fading in its caption from opts.items) as the
// camera pulls back through the system, and a closing CTA block with a real
// button (opts.ctaText / opts.ctaHref). Real Three.js: emissive sun mesh +
// corona sprite, PointLight lighting the orbiting MeshStandardMaterial
// planets, a static starfield, deterministic orbit motion driven by scroll
// progress (no clock). Renders once per scroll tick, only in viewport, full
// dispose on teardown. Falls back to a CSS radial/orbit layout if THREE
// fails to load or WebGL is unavailable.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }

    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js';
    var N_DESKTOP = 5, N_MOBILE = 3;

    function build(mediaList, opts) {
        opts = opts || {};
        var kicker = opts.kicker || 'Ecosistema';
        var title = opts.title || 'Un universo de productos';
        var claim = opts.claim || 'Cada pieza, en su órbita.';
        var hint = opts.hint || 'Sigue bajando';
        var ctaText = opts.ctaText || 'Explorar el catálogo';
        var ctaHref = opts.ctaHref || '#';
        var accentColor = opts.accentColor || '#7fd8ff';
        var sunColor = opts.sunColor || '#ffd27a';
        var background = opts.background || '#05050a';
        var items = opts.items || [];

        var mediaN = EP.ScrollSections.fillMedia(mediaList, N_DESKTOP);
        var captions = [];
        for (var i = 0; i < N_DESKTOP; i++) captions.push(items[i] || ('Producto ' + (i + 1).toString().padStart(2, '0')));
        var mediaJSON = JSON.stringify(mediaN);
        var captionsJSON = JSON.stringify(captions);

        var fbHTML = '';
        for (var f = 0; f < N_DESKTOP; f++) {
            var fm = mediaN[f];
            var fart = fm
                ? (fm.type === 'video' ? '<video src="' + fm.url + '" autoplay muted loop playsinline></video>' : '<img src="' + fm.url + '" alt="">')
                : '<div class="os-placeholder"></div>';
            fbHTML += '<div class="os-fbplanet" style="--i:' + f + ';">' + fart + '</div>\n        ';
        }

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Orbit Showcase Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f4efe6;font-family:Arial,Helvetica,sans-serif;}\n' +
'.os-wrap{position:relative;height:360vh;}\n' +
'.os-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;background:radial-gradient(circle at 50% 45%,#12121c 0%,' + background + ' 75%);}\n' +
'.os-canvas-gl{position:absolute;inset:0;width:100%;height:100%;display:none;}\n' +
'.os-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}\n' +
'.os-fbscene{position:relative;width:1px;height:1px;}\n' +
'.os-fbsun{position:absolute;top:50%;left:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:radial-gradient(circle,' + sunColor + ',rgba(255,178,90,0));box-shadow:0 0 60px 20px rgba(255,178,90,0.5);}\n' +
'.os-fbplanet{position:absolute;top:50%;left:50%;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.5);animation:os-orbit calc(14s + var(--i) * 4s) linear infinite;transform-origin:0 0;}\n' +
'.os-fbplanet img,.os-fbplanet video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.os-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#242432,#0c0c14);}\n' +
'@keyframes os-orbit{from{transform:rotate(0deg) translateX(calc(90px + var(--i) * 42px)) rotate(0deg);}to{transform:rotate(360deg) translateX(calc(90px + var(--i) * 42px)) rotate(-360deg);}}\n' +
'.os-intro{position:absolute;top:12%;left:50%;transform:translateX(-50%);z-index:5;text-align:center;max-width:86vw;opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.os-intro.is-visible{opacity:1;}\n' +
'.os-kicker{font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase;color:' + accentColor + ';font-weight:700;margin-bottom:0.6rem;}\n' +
'.os-title{font-size:clamp(1.6rem,4.2vw,2.8rem);font-weight:800;margin-bottom:0.5rem;text-shadow:0 2px 18px rgba(0,0,0,0.6);}\n' +
'.os-claim{font-size:clamp(0.95rem,1.8vw,1.2rem);color:#d8d2c6;max-width:44ch;margin:0 auto;}\n' +
'.os-caption{position:absolute;bottom:5.6rem;left:50%;transform:translateX(-50%);z-index:5;text-align:center;opacity:0;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.os-caption.is-visible{opacity:1;}\n' +
'.os-caption-label{font-weight:800;text-transform:uppercase;letter-spacing:0.05em;font-size:clamp(1rem,2.2vw,1.5rem);color:' + accentColor + ';text-shadow:0 2px 12px rgba(0,0,0,0.7);}\n' +
'.os-cta{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) translateY(16px);z-index:6;text-align:center;opacity:0;transition:opacity 0.5s ease-out,transform 0.5s ease-out;pointer-events:none;}\n' +
'.os-cta.is-visible{opacity:1;transform:translate(-50%,-50%) translateY(0);pointer-events:auto;}\n' +
'.os-cta a{display:inline-block;padding:0.9rem 2.2rem;border-radius:999px;background:' + accentColor + ';color:#0a1620;font-weight:800;text-decoration:none;letter-spacing:0.02em;box-shadow:0 12px 30px rgba(0,0,0,0.4);}\n' +
'.os-hint{position:absolute;bottom:1rem;left:50%;transform:translateX(-50%);z-index:5;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.os-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="os-wrap">\n' +
'  <div class="os-pin">\n' +
'    <canvas class="os-canvas-gl"></canvas>\n' +
'    <div class="os-fallback">\n      <div class="os-fbscene">\n        <div class="os-fbsun"></div>\n        ' + fbHTML + '\n      </div>\n    </div>\n' +
'    <div class="os-intro"><div class="os-kicker">' + kicker + '</div><h1 class="os-title">' + title + '</h1><p class="os-claim">' + claim + '</p></div>\n' +
'    <div class="os-caption"><div class="os-caption-label"></div></div>\n' +
'    <div class="os-cta"><a href="' + ctaHref + '" target="_blank" rel="noopener">' + ctaText + '</a></div>\n' +
'    <div class="os-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script src="' + THREE_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".os-wrap");\n' +
'  var canvasGl = document.querySelector(".os-canvas-gl");\n' +
'  var fallbackEl = document.querySelector(".os-fallback");\n' +
'  var intro = document.querySelector(".os-intro");\n' +
'  var captionEl = document.querySelector(".os-caption");\n' +
'  var captionLabel = document.querySelector(".os-caption-label");\n' +
'  var ctaEl = document.querySelector(".os-cta");\n' +
'  var hint = document.querySelector(".os-hint");\n' +
'  var MEDIA = ' + mediaJSON + ';\n' +
'  var CAPTIONS = ' + captionsJSON + ';\n' +
'  if (!wrap) return;\n' +
'\n' +
'  function clamp01(v) { return Math.max(0, Math.min(1, v)); }\n' +
'  function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }\n' +
'  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
'  var isMobile = window.innerWidth < 768;\n' +
'  var N = isMobile ? ' + N_MOBILE + ' : ' + N_DESKTOP + ';\n' +
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
'  var SPIN_START = 0.14, SPIN_END = 0.86;\n' +
'  function beats(t) {\n' +
'    var introT = 1 - smoothstep(0.0, 0.14, t);\n' +
'    var spinT = smoothstep(SPIN_START, SPIN_END, t);\n' +
'    var outroT = smoothstep(0.9, 1.0, t);\n' +
'    return { introT: introT, spinT: spinT, outroT: outroT };\n' +
'  }\n' +
'\n' +
'  function activeIndex(spinT) {\n' +
'    if (spinT <= 0.01 || spinT >= 0.99) return -1;\n' +
'    var idx = Math.floor(spinT * N);\n' +
'    if (idx >= N) idx = N - 1;\n' +
'    return idx;\n' +
'  }\n' +
'\n' +
'  var useThree = !!(window.THREE && !reduced);\n' +
'  var renderer = null;\n' +
'  if (useThree) {\n' +
'    try { renderer = new THREE.WebGLRenderer({ canvas: canvasGl, alpha: true, antialias: !isMobile }); }\n' +
'    catch (err) { useThree = false; renderer = null; }\n' +
'  }\n' +
'\n' +
'  function updateChrome(t, focusIdx) {\n' +
'    var b = beats(t);\n' +
'    intro.classList.toggle("is-visible", b.introT > 0.5);\n' +
'    ctaEl.classList.toggle("is-visible", b.outroT > 0.5);\n' +
'    if (focusIdx >= 0) {\n' +
'      captionLabel.textContent = CAPTIONS[focusIdx % CAPTIONS.length];\n' +
'      captionEl.classList.add("is-visible");\n' +
'    } else {\n' +
'      captionEl.classList.remove("is-visible");\n' +
'    }\n' +
'    if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'  }\n' +
'\n' +
'  function buildFallback() {\n' +
'    fallbackEl.style.display = "flex";\n' +
'    function draw(t) {\n' +
'      var b = beats(t);\n' +
'      var idx = activeIndex(b.spinT);\n' +
'      updateChrome(t, idx);\n' +
'    }\n' +
'    return { draw: draw, resize: function(){}, disposeThree: null };\n' +
'  }\n' +
'\n' +
'  function buildThree() {\n' +
'    fallbackEl.style.display = "none";\n' +
'    canvasGl.style.display = "block";\n' +
'    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));\n' +
'    var scene = new THREE.Scene();\n' +
'    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);\n' +
'\n' +
'    var geoms = [], mats = [];\n' +
'\n' +
'    var starGeo = new THREE.BufferGeometry();\n' +
'    var starCount = isMobile ? 250 : 500;\n' +
'    var starPos = new Float32Array(starCount * 3);\n' +
'    for (var s = 0; s < starCount; s++) {\n' +
'      var r = 30 + Math.random() * 40;\n' +
'      var th = Math.random() * Math.PI * 2;\n' +
'      var ph = Math.acos(Math.random() * 2 - 1);\n' +
'      starPos[s * 3] = r * Math.sin(ph) * Math.cos(th);\n' +
'      starPos[s * 3 + 1] = r * Math.sin(ph) * Math.sin(th);\n' +
'      starPos[s * 3 + 2] = r * Math.cos(ph);\n' +
'    }\n' +
'    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));\n' +
'    geoms.push(starGeo);\n' +
'    var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.7, depthWrite: false });\n' +
'    mats.push(starMat);\n' +
'    var stars = new THREE.Points(starGeo, starMat);\n' +
'    scene.add(stars);\n' +
'\n' +
'    var sunGeo = new THREE.SphereGeometry(0.9, 24, 24);\n' +
'    geoms.push(sunGeo);\n' +
'    var sunMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("' + sunColor + '") });\n' +
'    mats.push(sunMat);\n' +
'    var sun = new THREE.Mesh(sunGeo, sunMat);\n' +
'    scene.add(sun);\n' +
'\n' +
'    function makeGlowTexture() {\n' +
'      var c = document.createElement("canvas");\n' +
'      c.width = c.height = 256;\n' +
'      var ctx = c.getContext("2d");\n' +
'      var g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);\n' +
'      g.addColorStop(0, "rgba(255,220,160,0.85)");\n' +
'      g.addColorStop(1, "rgba(255,220,160,0)");\n' +
'      ctx.fillStyle = g;\n' +
'      ctx.fillRect(0, 0, 256, 256);\n' +
'      return new THREE.CanvasTexture(c);\n' +
'    }\n' +
'    var glowTex = makeGlowTexture();\n' +
'    var glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });\n' +
'    mats.push(glowMat);\n' +
'    var glowSprite = new THREE.Sprite(glowMat);\n' +
'    glowSprite.scale.set(4.2, 4.2, 1);\n' +
'    scene.add(glowSprite);\n' +
'\n' +
'    var sunLight = new THREE.PointLight(0xffe0b0, 1.6, 40);\n' +
'    scene.add(sunLight);\n' +
'    var ambient = new THREE.AmbientLight(0xffffff, 0.22);\n' +
'    scene.add(ambient);\n' +
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
'    var planetR = isMobile ? 0.55 : 0.7;\n' +
'    var planets = [];\n' +
'    var planetGeo = new THREE.SphereGeometry(planetR, 20, 20);\n' +
'    geoms.push(planetGeo);\n' +
'    var baseOrbitR = isMobile ? 2.6 : 3.2;\n' +
'    var orbitStep = isMobile ? 1.1 : 1.5;\n' +
'    for (var i = 0; i < N; i++) {\n' +
'      var m = MEDIA[i % MEDIA.length];\n' +
'      var tex = textureFor(m);\n' +
'      var mat = tex\n' +
'        ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 })\n' +
'        : new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.6 });\n' +
'      mats.push(mat);\n' +
'      var mesh = new THREE.Mesh(planetGeo, mat);\n' +
'      var orbitRadius = baseOrbitR + i * orbitStep;\n' +
'      var baseAngle = (i / N) * Math.PI * 2;\n' +
'      var speed = 0.55 + (i % 3) * 0.22;\n' +
'      scene.add(mesh);\n' +
'      planets.push({ mesh: mesh, orbitRadius: orbitRadius, baseAngle: baseAngle, speed: speed, tilt: (i % 2 === 0 ? 1 : -1) * 0.18 });\n' +
'      if (i === N - 1) {\n' +
'        var ringGeo = new THREE.RingGeometry(planetR * 1.5, planetR * 1.9, 32);\n' +
'        geoms.push(ringGeo);\n' +
'        var ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });\n' +
'        mats.push(ringMat);\n' +
'        var ringMesh = new THREE.Mesh(ringGeo, ringMat);\n' +
'        ringMesh.rotation.x = Math.PI / 2.4;\n' +
'        mesh.add(ringMesh);\n' +
'      }\n' +
'    }\n' +
'\n' +
'    function resizeThree() {\n' +
'      var w = wrap.clientWidth || window.innerWidth;\n' +
'      var h = window.innerHeight;\n' +
'      camera.aspect = w / h;\n' +
'      camera.updateProjectionMatrix();\n' +
'      renderer.setSize(w, h, false);\n' +
'    }\n' +
'\n' +
'    var closeR = isMobile ? 5 : 6, farR = isMobile ? 10 : 13;\n' +
'    var closeH = 1.2, farH = 4.5;\n' +
'    var ORBIT_SWEEP = 2.1, TURNS = 0.9;\n' +
'\n' +
'    function draw(t) {\n' +
'      var b = beats(t);\n' +
'      var camAngle = 0.4 + t * ORBIT_SWEEP;\n' +
'      var camRadius = closeR + (farR - closeR) * smoothstep(0, 1, t);\n' +
'      var camHeight = closeH + (farH - closeH) * t;\n' +
'      camera.position.set(Math.sin(camAngle) * camRadius, camHeight, Math.cos(camAngle) * camRadius);\n' +
'      camera.lookAt(0, 0, 0);\n' +
'      stars.rotation.y = t * 0.15;\n' +
'      var focusIdx = activeIndex(b.spinT);\n' +
'      for (var i = 0; i < planets.length; i++) {\n' +
'        var p = planets[i];\n' +
'        var angle = p.baseAngle + t * p.speed * Math.PI * 2 * TURNS;\n' +
'        p.mesh.position.set(Math.cos(angle) * p.orbitRadius, Math.sin(angle * 0.6) * p.tilt, Math.sin(angle) * p.orbitRadius);\n' +
'        var focused = (i === focusIdx);\n' +
'        var targetScale = focused ? 1.5 : 1.0;\n' +
'        p.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.35);\n' +
'      }\n' +
'      renderer.render(scene, camera);\n' +
'      updateChrome(t, focusIdx);\n' +
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
        id: 'orbit-showcase-section',
        name: 'Orbit Showcase Section',
        icon: '🪐',
        description: 'Esqueleto completo de sección: bloque de intro (kicker + título + claim), un sistema solar en Three.js con sol emisivo, corona y luz real, planetas texturizados con cada producto orbitando a distinto radio y velocidad, una cámara que se aleja y recorre el sistema, un foco secuencial que agranda cada planeta y muestra su leyenda (opts.items), y un bloque de cierre con botón CTA personalizable. Adaptado del efecto interno Solar System (js/effects/orbit/solar-system.js); cae a un layout CSS de órbitas si WebGL no está disponible. Personalizable vía opts: kicker, title, claim, items, ctaText, ctaHref, accentColor, sunColor.',
        build: build
    });
})();
