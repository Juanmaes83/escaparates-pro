// Gallery Walk Section — adapted from the tracked "gallery walk" style
// dolly-camera concept (parallax corridor). Built as a COMPLETE,
// personalizable section skeleton: an intro block (kicker + title + claim),
// a real Three.js corridor lit with spotlights where each media item hangs
// as a framed picture alternating left/right along the walls, a sequential
// caption beat that surfaces each frame's own legend (opts.items) as the
// camera dollies past it, and a closing CTA block at the far end of the
// corridor with a real button (opts.ctaText / opts.ctaHref). Real Three.js:
// lit MeshStandardMaterial floor/ceiling/walls + frame borders, PointLights
// per frame, textured picture planes, a straight dolly camera move driven
// purely by scroll progress (no clock). Renders once per scroll tick, only
// in viewport, full dispose on teardown. Falls back to a CSS 3D filmstrip
// corridor if THREE fails to load or WebGL is unavailable.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }

    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js';
    var N_DESKTOP = 6, N_MOBILE = 4;

    function build(mediaList, opts) {
        opts = opts || {};
        var kicker = opts.kicker || 'Galería';
        var title = opts.title || 'Un paseo por la colección';
        var claim = opts.claim || 'Avanza y descubre cada pieza.';
        var hint = opts.hint || 'Sigue bajando';
        var ctaText = opts.ctaText || 'Reservar visita';
        var ctaHref = opts.ctaHref || '#';
        var accentColor = opts.accentColor || '#e8c07d';
        var background = opts.background || '#0b0a08';
        var items = opts.items || [];

        var mediaN = EP.ScrollSections.fillMedia(mediaList, N_DESKTOP);
        var captions = [];
        for (var i = 0; i < N_DESKTOP; i++) captions.push(items[i] || ('Obra ' + (i + 1).toString().padStart(2, '0')));
        var mediaJSON = JSON.stringify(mediaN);
        var captionsJSON = JSON.stringify(captions);

        var fbHTML = '';
        for (var f = 0; f < N_DESKTOP; f++) {
            var side = (f % 2 === 0) ? 'left' : 'right';
            var fm = mediaN[f];
            var fart = fm
                ? (fm.type === 'video' ? '<video src="' + fm.url + '" autoplay muted loop playsinline></video>' : '<img src="' + fm.url + '" alt="">')
                : '<div class="gw-placeholder"></div>';
            fbHTML += '<div class="gw-fbframe gw-fbframe--' + side + '" style="--i:' + f + ';">' + fart + '</div>\n        ';
        }

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Gallery Walk Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f4efe6;font-family:Arial,Helvetica,sans-serif;}\n' +
'.gw-wrap{position:relative;height:380vh;}\n' +
'.gw-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;background:' + background + ';perspective:900px;}\n' +
'.gw-canvas-gl{position:absolute;inset:0;width:100%;height:100%;display:none;}\n' +
'.gw-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform-style:preserve-3d;}\n' +
'.gw-fbcorridor{position:relative;width:1px;height:1px;transform-style:preserve-3d;will-change:transform;}\n' +
'.gw-fbframe{position:absolute;top:50%;width:180px;height:230px;margin-top:-115px;border-radius:6px;overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,0.55);transform-style:preserve-3d;}\n' +
'.gw-fbframe--left{left:calc(50% - 340px);transform:translateZ(calc(var(--i) * -90px)) rotateY(35deg);}\n' +
'.gw-fbframe--right{left:calc(50% + 160px);transform:translateZ(calc(var(--i) * -90px)) rotateY(-35deg);}\n' +
'.gw-fbframe img,.gw-fbframe video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.gw-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#242432,#0c0c14);}\n' +
'.gw-intro{position:absolute;top:12%;left:50%;transform:translateX(-50%);z-index:5;text-align:center;max-width:86vw;opacity:0;transition:opacity 0.5s ease-out;pointer-events:none;}\n' +
'.gw-intro.is-visible{opacity:1;}\n' +
'.gw-kicker{font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase;color:' + accentColor + ';font-weight:700;margin-bottom:0.6rem;}\n' +
'.gw-title{font-size:clamp(1.6rem,4.2vw,2.8rem);font-weight:800;margin-bottom:0.5rem;text-shadow:0 2px 18px rgba(0,0,0,0.6);}\n' +
'.gw-claim{font-size:clamp(0.95rem,1.8vw,1.2rem);color:#d8d2c6;max-width:44ch;margin:0 auto;}\n' +
'.gw-caption{position:absolute;bottom:5.6rem;left:50%;transform:translateX(-50%);z-index:5;text-align:center;opacity:0;transition:opacity 0.35s ease-out;pointer-events:none;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;font-size:clamp(1rem,2.2vw,1.5rem);color:' + accentColor + ';text-shadow:0 2px 12px rgba(0,0,0,0.7);}\n' +
'.gw-caption.is-visible{opacity:1;}\n' +
'.gw-cta{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) translateY(16px);z-index:6;text-align:center;opacity:0;transition:opacity 0.5s ease-out,transform 0.5s ease-out;pointer-events:none;}\n' +
'.gw-cta.is-visible{opacity:1;transform:translate(-50%,-50%) translateY(0);pointer-events:auto;}\n' +
'.gw-cta a{display:inline-block;padding:0.9rem 2.2rem;border-radius:999px;background:' + accentColor + ';color:#241a05;font-weight:800;text-decoration:none;letter-spacing:0.02em;box-shadow:0 12px 30px rgba(0,0,0,0.4);}\n' +
'.gw-hint{position:absolute;bottom:1rem;left:50%;transform:translateX(-50%);z-index:5;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.gw-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="gw-wrap">\n' +
'  <div class="gw-pin">\n' +
'    <canvas class="gw-canvas-gl"></canvas>\n' +
'    <div class="gw-fallback">\n      <div class="gw-fbcorridor">\n        ' + fbHTML + '\n      </div>\n    </div>\n' +
'    <div class="gw-intro"><div class="gw-kicker">' + kicker + '</div><h1 class="gw-title">' + title + '</h1><p class="gw-claim">' + claim + '</p></div>\n' +
'    <div class="gw-caption"></div>\n' +
'    <div class="gw-cta"><a href="' + ctaHref + '" target="_blank" rel="noopener">' + ctaText + '</a></div>\n' +
'    <div class="gw-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script src="' + THREE_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".gw-wrap");\n' +
'  var canvasGl = document.querySelector(".gw-canvas-gl");\n' +
'  var fallbackEl = document.querySelector(".gw-fallback");\n' +
'  var fbCorridor = document.querySelector(".gw-fbcorridor");\n' +
'  var intro = document.querySelector(".gw-intro");\n' +
'  var captionEl = document.querySelector(".gw-caption");\n' +
'  var ctaEl = document.querySelector(".gw-cta");\n' +
'  var hint = document.querySelector(".gw-hint");\n' +
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
'  var WALK_START = 0.12, WALK_END = 0.88;\n' +
'  function beats(t) {\n' +
'    var introT = 1 - smoothstep(0.0, 0.12, t);\n' +
'    var walkT = smoothstep(WALK_START, WALK_END, t);\n' +
'    var outroT = smoothstep(0.9, 1.0, t);\n' +
'    return { introT: introT, walkT: walkT, outroT: outroT };\n' +
'  }\n' +
'\n' +
'  function activeIndex(walkT) {\n' +
'    if (walkT <= 0.01 || walkT >= 0.99) return -1;\n' +
'    var idx = Math.floor(walkT * N);\n' +
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
'      captionEl.textContent = CAPTIONS[focusIdx % CAPTIONS.length];\n' +
'      captionEl.classList.add("is-visible");\n' +
'    } else {\n' +
'      captionEl.classList.remove("is-visible");\n' +
'    }\n' +
'    if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'  }\n' +
'\n' +
'  function buildFallback() {\n' +
'    fallbackEl.style.display = "flex";\n' +
'    var depth = N * 90 + 200;\n' +
'    function draw(t) {\n' +
'      var b = beats(t);\n' +
'      fbCorridor.style.transform = "translateZ(" + (b.walkT * depth) + "px)";\n' +
'      updateChrome(t, activeIndex(b.walkT));\n' +
'    }\n' +
'    return { draw: draw, resize: function(){}, disposeThree: null };\n' +
'  }\n' +
'\n' +
'  function buildThree() {\n' +
'    fallbackEl.style.display = "none";\n' +
'    canvasGl.style.display = "block";\n' +
'    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));\n' +
'    var scene = new THREE.Scene();\n' +
'    scene.fog = new THREE.Fog(0x0b0a08, 4, 22);\n' +
'    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);\n' +
'\n' +
'    var geoms = [], mats = [];\n' +
'    var corridorWidth = 4.4, corridorHeight = 3.2;\n' +
'    var step = isMobile ? 3.2 : 3.8;\n' +
'    var corridorLength = N * step + 6;\n' +
'\n' +
'    var floorGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);\n' +
'    geoms.push(floorGeo);\n' +
'    var floorMat = new THREE.MeshStandardMaterial({ color: 0x1c1712, roughness: 0.9 });\n' +
'    mats.push(floorMat);\n' +
'    var floor = new THREE.Mesh(floorGeo, floorMat);\n' +
'    floor.rotation.x = -Math.PI / 2;\n' +
'    floor.position.set(0, -corridorHeight / 2, -corridorLength / 2 + 4);\n' +
'    scene.add(floor);\n' +
'\n' +
'    var ceilGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);\n' +
'    geoms.push(ceilGeo);\n' +
'    var ceilMat = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 1 });\n' +
'    mats.push(ceilMat);\n' +
'    var ceil = new THREE.Mesh(ceilGeo, ceilMat);\n' +
'    ceil.rotation.x = Math.PI / 2;\n' +
'    ceil.position.set(0, corridorHeight / 2, -corridorLength / 2 + 4);\n' +
'    scene.add(ceil);\n' +
'\n' +
'    var wallGeo = new THREE.PlaneGeometry(corridorLength, corridorHeight);\n' +
'    geoms.push(wallGeo);\n' +
'    var wallMat = new THREE.MeshStandardMaterial({ color: 0x241d16, roughness: 0.95 });\n' +
'    mats.push(wallMat);\n' +
'    var wallL = new THREE.Mesh(wallGeo, wallMat);\n' +
'    wallL.rotation.y = Math.PI / 2;\n' +
'    wallL.position.set(-corridorWidth / 2, 0, -corridorLength / 2 + 4);\n' +
'    scene.add(wallL);\n' +
'    var wallR = new THREE.Mesh(wallGeo, wallMat);\n' +
'    wallR.rotation.y = -Math.PI / 2;\n' +
'    wallR.position.set(corridorWidth / 2, 0, -corridorLength / 2 + 4);\n' +
'    scene.add(wallR);\n' +
'\n' +
'    var ambient = new THREE.AmbientLight(0xffe8c8, 0.35);\n' +
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
'    var frameW = isMobile ? 1.3 : 1.7, frameH = isMobile ? 1.7 : 2.2;\n' +
'    var borderGeo = new THREE.PlaneGeometry(frameW + 0.24, frameH + 0.24);\n' +
'    var picGeo = new THREE.PlaneGeometry(frameW, frameH);\n' +
'    geoms.push(borderGeo, picGeo);\n' +
'    var borderMat = new THREE.MeshStandardMaterial({ color: 0xcaa25a, roughness: 0.5, metalness: 0.3 });\n' +
'    mats.push(borderMat);\n' +
'    var frameLights = [];\n' +
'    for (var i = 0; i < N; i++) {\n' +
'      var m = MEDIA[i % MEDIA.length];\n' +
'      var tex = textureFor(m);\n' +
'      var picMat = tex\n' +
'        ? new THREE.MeshBasicMaterial({ map: tex })\n' +
'        : new THREE.MeshBasicMaterial({ color: 0x333340 });\n' +
'      mats.push(picMat);\n' +
'      var z = 2 - i * step;\n' +
'      var onLeft = (i % 2 === 0);\n' +
'      var x = onLeft ? (-corridorWidth / 2 + 0.02) : (corridorWidth / 2 - 0.02);\n' +
'      var rotY = onLeft ? Math.PI / 2 : -Math.PI / 2;\n' +
'      var border = new THREE.Mesh(borderGeo, borderMat);\n' +
'      border.position.set(x, 0, z);\n' +
'      border.rotation.y = rotY;\n' +
'      scene.add(border);\n' +
'      var pic = new THREE.Mesh(picGeo, picMat);\n' +
'      pic.position.set(onLeft ? x + 0.03 : x - 0.03, 0, z);\n' +
'      pic.rotation.y = rotY;\n' +
'      scene.add(pic);\n' +
'      var spotlight = new THREE.PointLight(0xffe8c8, 0.9, 5);\n' +
'      spotlight.position.set(onLeft ? x + 0.6 : x - 0.6, corridorHeight / 2 - 0.3, z);\n' +
'      scene.add(spotlight);\n' +
'      frameLights.push(spotlight);\n' +
'    }\n' +
'\n' +
'    var exitLight = new THREE.PointLight(0xfff2d8, 1.6, 14);\n' +
'    exitLight.position.set(0, 0.5, -corridorLength + 6);\n' +
'    scene.add(exitLight);\n' +
'\n' +
'    function resizeThree() {\n' +
'      var w = wrap.clientWidth || window.innerWidth;\n' +
'      var h = window.innerHeight;\n' +
'      camera.aspect = w / h;\n' +
'      camera.updateProjectionMatrix();\n' +
'      renderer.setSize(w, h, false);\n' +
'    }\n' +
'\n' +
'    var camStartZ = 4, camEndZ = -corridorLength + 8;\n' +
'\n' +
'    function draw(t) {\n' +
'      var b = beats(t);\n' +
'      var z = camStartZ + (camEndZ - camStartZ) * b.walkT;\n' +
'      camera.position.set(Math.sin(t * 3.1) * 0.08, 1.5 + Math.sin(t * 6.2) * 0.03, z);\n' +
'      camera.lookAt(Math.sin(t * 2.3) * 0.15, 1.5, z - 5);\n' +
'      renderer.render(scene, camera);\n' +
'      updateChrome(t, activeIndex(b.walkT));\n' +
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
        id: 'gallery-walk-section',
        name: 'Gallery Walk Section',
        icon: '🖼️',
        description: 'Esqueleto completo de sección: bloque de intro (kicker + título + claim), un corredor de galería en Three.js con suelo, techo y paredes iluminadas por focos reales, cuadros con marca dorada texturizados con cada producto alternando pared izquierda/derecha, una cámara que avanza en dolly recto por el pasillo, una leyenda secuencial por cuadro (opts.items) y un bloque de cierre con botón CTA al final del recorrido. Cae a un filmstrip 3D en CSS si WebGL no está disponible. Personalizable vía opts: kicker, title, claim, items, ctaText, ctaHref, accentColor.',
        build: build
    });
})();
