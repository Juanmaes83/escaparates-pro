// Carousel Showcase Section — adapted from the tracked effect
// js/effects/carousel-flow/cylinder-carousel.js (a Three.js turntable of
// textured panels). Unlike the Batch 5 sections (one visual moment), this is
// built as a COMPLETE, personalizable section skeleton with three real
// beats driven purely by scroll progress: (1) an intro block (kicker + title
// + claim) that introduces the collection, (2) the turntable itself with a
// live caption for whichever item is facing the camera, taken from
// opts.items (or auto-generated), and (3) a closing CTA block with a real
// button (opts.ctaText / opts.ctaHref). Real Three.js: a ring of lit
// MeshStandardMaterial panels rotating as a group, a moving point light for
// a glint sweep, ambient + directional light. Renders once per scroll tick
// only, only while in the viewport, with full dispose on teardown. Falls
// back to a CSS 3D ring if THREE fails to load or WebGL is unavailable.
(function() {
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function smoothstep(a, b, t) { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); }

    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js';
    var N_DESKTOP = 6, N_MOBILE = 4;

    function build(mediaList, opts) {
        opts = opts || {};
        var kicker = opts.kicker || 'Catálogo';
        var title = opts.title || 'Nuestra colección';
        var claim = opts.claim || 'Gira, descubre, elige.';
        var hint = opts.hint || 'Sigue bajando';
        var ctaText = opts.ctaText || 'Ver todo el catálogo';
        var ctaHref = opts.ctaHref || '#';
        var accentColor = opts.accentColor || '#ffb15e';
        var background = opts.background || '#0a0a10';
        var items = opts.items || [];

        var mediaN = EP.ScrollSections.fillMedia(mediaList, N_DESKTOP);
        var captions = [];
        for (var i = 0; i < N_DESKTOP; i++) captions.push(items[i] || ('Pieza ' + (i + 1).toString().padStart(2, '0')));
        var mediaJSON = JSON.stringify(mediaN);
        var captionsJSON = JSON.stringify(captions);

        var fbHTML = '';
        for (var f = 0; f < N_DESKTOP; f++) {
            var fa = Math.round((f / N_DESKTOP) * 360);
            var fm = mediaN[f];
            var fart = fm
                ? (fm.type === 'video' ? '<video src="' + fm.url + '" autoplay muted loop playsinline></video>' : '<img src="' + fm.url + '" alt="">')
                : '<div class="cs-placeholder"></div>';
            fbHTML += '<div class="cs-fbpanel" style="transform:rotateY(' + fa + 'deg) translateZ(var(--cs-radius)) translate(-50%,-50%);">' + fart + '</div>\n        ';
        }

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Carousel Showcase Section</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:' + background + ';color:#f4efe6;font-family:Arial,Helvetica,sans-serif;}\n' +
'.cs-wrap{position:relative;height:340vh;}\n' +
'.cs-pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;background:radial-gradient(circle at 50% 60%,#151520 0%,' + background + ' 70%);perspective:1100px;}\n' +
'.cs-canvas-gl{position:absolute;inset:0;width:100%;height:100%;display:none;}\n' +
'.cs-fallback{position:absolute;inset:0;}\n' +
'.cs-fbscene{position:absolute;top:56%;left:50%;width:1px;height:1px;transform-style:preserve-3d;will-change:transform;}\n' +
'.cs-fbpanel{position:absolute;top:0;left:0;width:var(--cs-panel-w);height:var(--cs-panel-h);border-radius:10px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,0.5);backface-visibility:hidden;}\n' +
'.cs-fbpanel img,.cs-fbpanel video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.cs-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#242432,#0c0c14);}\n' +
':root{--cs-radius:260px;--cs-panel-w:190px;--cs-panel-h:250px;}\n' +
'@media (max-width:768px){:root{--cs-radius:150px;--cs-panel-w:120px;--cs-panel-h:160px;}}\n' +
'.cs-intro{position:absolute;top:12%;left:50%;transform:translateX(-50%);z-index:5;text-align:center;max-width:86vw;opacity:0;transition:opacity 0.5s ease-out,transform 0.5s ease-out;pointer-events:none;}\n' +
'.cs-intro.is-visible{opacity:1;}\n' +
'.cs-kicker{font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase;color:' + accentColor + ';font-weight:700;margin-bottom:0.6rem;}\n' +
'.cs-title{font-size:clamp(1.6rem,4.2vw,2.8rem);font-weight:800;margin-bottom:0.5rem;text-shadow:0 2px 18px rgba(0,0,0,0.6);}\n' +
'.cs-claim{font-size:clamp(0.95rem,1.8vw,1.2rem);color:#d8d2c6;max-width:44ch;margin:0 auto;}\n' +
'.cs-caption{position:absolute;bottom:5.6rem;left:50%;transform:translateX(-50%) translateY(10px);z-index:5;text-align:center;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;font-size:clamp(1rem,2.2vw,1.5rem);opacity:0;transition:opacity 0.35s ease-out;pointer-events:none;text-shadow:0 2px 12px rgba(0,0,0,0.7);color:' + accentColor + ';}\n' +
'.cs-caption.is-visible{opacity:1;}\n' +
'.cs-cta{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) translateY(16px);z-index:6;text-align:center;opacity:0;transition:opacity 0.5s ease-out,transform 0.5s ease-out;pointer-events:none;}\n' +
'.cs-cta.is-visible{opacity:1;transform:translate(-50%,-50%) translateY(0);pointer-events:auto;}\n' +
'.cs-cta a{display:inline-block;padding:0.9rem 2.2rem;border-radius:999px;background:' + accentColor + ';color:#151005;font-weight:800;text-decoration:none;letter-spacing:0.02em;box-shadow:0 12px 30px rgba(0,0,0,0.4);}\n' +
'.cs-hint{position:absolute;bottom:1rem;left:50%;transform:translateX(-50%);z-index:5;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;transition:opacity 0.4s ease-out;pointer-events:none;}\n' +
'.cs-hint.is-hidden{opacity:0;}\n' +
'.spacer{height:60vh;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="spacer"></div>\n' +
'<section class="cs-wrap">\n' +
'  <div class="cs-pin">\n' +
'    <canvas class="cs-canvas-gl"></canvas>\n' +
'    <div class="cs-fallback">\n      <div class="cs-fbscene">\n        ' + fbHTML + '\n      </div>\n    </div>\n' +
'    <div class="cs-intro"><div class="cs-kicker">' + kicker + '</div><h1 class="cs-title">' + title + '</h1><p class="cs-claim">' + claim + '</p></div>\n' +
'    <div class="cs-caption"></div>\n' +
'    <div class="cs-cta"><a href="' + ctaHref + '" target="_blank" rel="noopener">' + ctaText + '</a></div>\n' +
'    <div class="cs-hint">' + hint + '</div>\n' +
'  </div>\n' +
'</section>\n' +
'<div class="spacer"></div>\n' +
'<script src="' + THREE_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var wrap = document.querySelector(".cs-wrap");\n' +
'  var canvasGl = document.querySelector(".cs-canvas-gl");\n' +
'  var fallbackEl = document.querySelector(".cs-fallback");\n' +
'  var intro = document.querySelector(".cs-intro");\n' +
'  var captionEl = document.querySelector(".cs-caption");\n' +
'  var ctaEl = document.querySelector(".cs-cta");\n' +
'  var hint = document.querySelector(".cs-hint");\n' +
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
'  function beats(t) {\n' +
'    var introT = 1 - smoothstep(0.0, 0.16, t);\n' +
'    var spinT = smoothstep(0.16, 0.82, t);\n' +
'    var outroT = smoothstep(0.86, 1.0, t);\n' +
'    return { introT: introT, spinT: spinT, outroT: outroT };\n' +
'  }\n' +
'\n' +
'  var useThree = !!(window.THREE && !reduced);\n' +
'  var renderer = null;\n' +
'  if (useThree) {\n' +
'    try { renderer = new THREE.WebGLRenderer({ canvas: canvasGl, alpha: true, antialias: !isMobile }); }\n' +
'    catch (err) { useThree = false; renderer = null; }\n' +
'  }\n' +
'\n' +
'  function updateChrome(t, frontIdx) {\n' +
'    var b = beats(t);\n' +
'    intro.classList.toggle("is-visible", b.introT > 0.5);\n' +
'    ctaEl.classList.toggle("is-visible", b.outroT > 0.5);\n' +
'    if (b.spinT > 0.02 && b.spinT < 0.98) {\n' +
'      captionEl.textContent = CAPTIONS[frontIdx % CAPTIONS.length];\n' +
'      captionEl.classList.add("is-visible");\n' +
'    } else {\n' +
'      captionEl.classList.remove("is-visible");\n' +
'    }\n' +
'    if (hint) hint.classList.toggle("is-hidden", t > 0.05);\n' +
'  }\n' +
'\n' +
'  function buildFallback() {\n' +
'    fallbackEl.style.display = "block";\n' +
'    var scene = document.querySelector(".cs-fbscene");\n' +
'    function draw(t) {\n' +
'      var b = beats(t);\n' +
'      var rotY = b.spinT * 720;\n' +
'      scene.style.transform = "translate(-50%,-50%) rotateY(" + rotY + "deg)";\n' +
'      var frontIdx = Math.round(((-rotY * Math.PI / 180) / (Math.PI * 2 / N)) % N);\n' +
'      frontIdx = ((frontIdx % N) + N) % N;\n' +
'      updateChrome(t, frontIdx);\n' +
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
'    var camDist = isMobile ? 7.5 : 8.5;\n' +
'    camera.position.set(0, 0, camDist);\n' +
'\n' +
'    var geoms = [], mats = [];\n' +
'    var ambient = new THREE.AmbientLight(0xffffff, 0.55);\n' +
'    scene.add(ambient);\n' +
'    var dirLight = new THREE.DirectionalLight(0xffffff, 0.5);\n' +
'    dirLight.position.set(2, 3, 4);\n' +
'    scene.add(dirLight);\n' +
'    var glint = new THREE.PointLight(0xffd9a0, 1.4, 14);\n' +
'    scene.add(glint);\n' +
'\n' +
'    var radius = isMobile ? 3.1 : 4.2;\n' +
'    var panelW = isMobile ? 1.5 : 1.9;\n' +
'    var panelH = isMobile ? 2.0 : 2.5;\n' +
'    var panelGeo = new THREE.PlaneGeometry(panelW, panelH);\n' +
'    geoms.push(panelGeo);\n' +
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
'    var ring = new THREE.Group();\n' +
'    scene.add(ring);\n' +
'    for (var i = 0; i < N; i++) {\n' +
'      var m = MEDIA[i % MEDIA.length];\n' +
'      var tex = textureFor(m);\n' +
'      var mat = tex\n' +
'        ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide })\n' +
'        : new THREE.MeshStandardMaterial({ color: 0x242432, roughness: 0.6, side: THREE.DoubleSide });\n' +
'      mats.push(mat);\n' +
'      var mesh = new THREE.Mesh(panelGeo, mat);\n' +
'      var angle = (i / N) * Math.PI * 2;\n' +
'      mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);\n' +
'      mesh.rotation.y = angle;\n' +
'      ring.add(mesh);\n' +
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
'    function draw(t) {\n' +
'      var b = beats(t);\n' +
'      var rotY = b.spinT * Math.PI * 2 * 2;\n' +
'      ring.rotation.y = rotY;\n' +
'      camera.position.y = Math.sin(t * Math.PI) * 0.25;\n' +
'      camera.lookAt(0, 0, 0);\n' +
'      var glintAngle = t * Math.PI * 4;\n' +
'      glint.position.set(Math.cos(glintAngle) * (radius + 2), 1.5, Math.sin(glintAngle) * (radius + 2));\n' +
'      var frontIdx = Math.round((-rotY / (Math.PI * 2 / N)) % N);\n' +
'      frontIdx = ((frontIdx % N) + N) % N;\n' +
'      renderer.render(scene, camera);\n' +
'      updateChrome(t, frontIdx);\n' +
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
        id: 'carousel-showcase-section',
        name: 'Carousel Showcase Section',
        icon: '🎠',
        description: 'Esqueleto completo de sección: bloque de intro (kicker + título + claim), un carrusel giratorio en Three.js con iluminación real y un glint que recorre las piezas, leyenda dinámica del producto que queda al frente, y un bloque de cierre con botón CTA personalizable. Adaptado del efecto interno Cylinder Carousel (js/effects/carousel-flow/cylinder-carousel.js); cae a un anillo CSS 3D si WebGL no está disponible. Totalmente personalizable vía opts: kicker, title, claim, items (leyendas por pieza), ctaText, ctaHref, accentColor.',
        build: build
    });
})();
