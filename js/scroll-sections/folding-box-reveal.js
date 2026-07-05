// Customizable Folding Box — adapted from the CodePen gist "On-Scroll
// Folding Box w/ Three.js and GSAP" (source read & understood, full Codrops
// tutorial: a procedurally generated corrugated-cardboard box — each panel
// built from merged plane geometries offset to fake a fluted middle layer —
// whose four flaps and two half-widths animate open/closed via a scrubbed
// GSAP timeline tied to page scroll, with OrbitControls auto-rotating the
// camera and manual zoom buttons). Kept the procedural geometry and folding
// timeline verbatim; dropped the source's dev-only lil-gui parameter panel
// and its personal clickable-copyright easter egg (both author-tooling, not
// client-facing).
//
// Generalized beyond the real-estate "welcome box" per explicit direction:
// this is a customizable packaging/shipping box for e-commerce, personalized
// carts, or any sector — each of the box's 4 visible side walls gets its own
// material built at runtime from either an uploaded image, an uploaded
// video (THREE.VideoTexture), or a canvas-drawn text/logo panel when no
// media is provided for that face. The flaps stay a single plain cardboard
// material so the fold silhouette still reads clearly.
(function() {
    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js';
    var ORBIT_CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
    var BGU_CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js';
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var SCROLLTOPLUGIN_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollToPlugin.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var message = opts.message || 'Tu pedido, listo para viajar.';
        var boxColor = opts.boxColor || '#9C8D7B';
        var faceLabels = (opts.faceLabels && opts.faceLabels.length ? opts.faceLabels : [
            { title: title, year: message },
            { title: 'Frágil', year: 'Manéjese con cuidado' },
            { title: title, year: '' },
            { title: '#EscaparatesPro', year: '' }
        ]).slice(0, 4).map(function(f) { return { text: f.title || '', sub: f.year || '' }; });
        while (faceLabels.length < 4) faceLabels.push({ text: title, sub: '' });

        var media = EP.ScrollSections.fillMedia(mediaList, 4);
        var faces = [0, 1, 2, 3].map(function(i) {
            var m = media[i];
            if (m && m.type === 'video') return { type: 'video', url: m.url };
            if (m && m.url) return { type: 'image', url: m.url };
            return { type: 'text', text: faceLabels[i].text, sub: faceLabels[i].sub };
        });

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Caja Personalizable</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'body{padding:0;margin:0;background:#f2ede4;font-family:Arial,Helvetica,sans-serif;}\n' +
'.page{width:100%;height:200vh;}\n' +
'.container{position:fixed;top:0;left:0;width:100%;height:100vh;}\n' +
'.fb-title{position:absolute;top:8%;left:50%;transform:translateX(-50%);text-align:center;z-index:2;pointer-events:none;}\n' +
'.fb-title h1{margin:0;font-size:clamp(1.6rem,4vw,2.6rem);color:#3a2f22;}\n' +
'.fb-title p{margin:0.4rem 0 0;color:#6b5d4a;font-size:0.95rem;}\n' +
'.ui-controls{position:absolute;bottom:7%;left:50%;transform:translateX(-50%);user-select:none;text-align:center;width:100%;}\n' +
'.ui-controls .fb-hint{color:#6b5d4a;font-size:0.85rem;}\n' +
'.container button{display:inline-block;text-align:center;padding:0;cursor:pointer;font-size:15px;width:30px;height:30px;margin:0 0.2rem 1em;border-radius:50%;border:1px solid #6b5d4a;background:#fff;color:#3a2f22;}\n' +
'.container button.disabled{pointer-events:none;cursor:auto;opacity:0.3;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="page">\n' +
'  <div class="container">\n' +
'    <canvas id="box-canvas"></canvas>\n' +
'    <div class="fb-title"><h1>' + title + '</h1><p>' + message + '</p></div>\n' +
'    <div class="ui-controls">\n' +
'      <div><button id="zoom-in">+</button><button id="zoom-out">-</button></div>\n' +
'      <div class="fb-hint">Desliza ⬇ para abrir la caja</div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'<script src="' + THREE_CDN + '"></script>\n' +
'<script src="' + ORBIT_CDN + '"></script>\n' +
'<script src="' + BGU_CDN + '"></script>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + SCROLLTOPLUGIN_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);\n' +
'  var FACES = ' + JSON.stringify(faces) + ';\n' +
'  var container = document.querySelector(".container");\n' +
'  var boxCanvas = document.querySelector("#box-canvas");\n' +
'\n' +
'  var box = {\n' +
'    params: { width: 27, length: 80, depth: 45, thickness: 0.25, fluteFreq: 5, flapGap: 1 },\n' +
'    els: {\n' +
'      group: new THREE.Group(),\n' +
'      backHalf: { width: { top: new THREE.Mesh(), side: new THREE.Mesh(), bottom: new THREE.Mesh() }, length: { top: new THREE.Mesh(), side: new THREE.Mesh(), bottom: new THREE.Mesh() } },\n' +
'      frontHalf: { width: { top: new THREE.Mesh(), side: new THREE.Mesh(), bottom: new THREE.Mesh() }, length: { top: new THREE.Mesh(), side: new THREE.Mesh(), bottom: new THREE.Mesh() } }\n' +
'    },\n' +
'    animated: {\n' +
'      openingAngle: 0.02 * Math.PI,\n' +
'      flapAngles: {\n' +
'        backHalf: { width: { top: 0, bottom: 0 }, length: { top: 0, bottom: 0 } },\n' +
'        frontHalf: { width: { top: 0, bottom: 0 }, length: { top: 0, bottom: 0 } }\n' +
'      }\n' +
'    }\n' +
'  };\n' +
'\n' +
'  var renderer, scene, camera, orbit;\n' +
'\n' +
'  function drawTextTexture(face) {\n' +
'    var canvas = document.createElement("canvas");\n' +
'    canvas.width = 512; canvas.height = 512;\n' +
'    var ctx = canvas.getContext("2d");\n' +
'    ctx.fillStyle = "' + boxColor + '";\n' +
'    ctx.fillRect(0, 0, 512, 512);\n' +
'    ctx.strokeStyle = "rgba(0,0,0,0.07)";\n' +
'    ctx.lineWidth = 1;\n' +
'    for (var y = 0; y < 512; y += 7) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }\n' +
'    ctx.fillStyle = "#3a2f22";\n' +
'    ctx.textAlign = "center";\n' +
'    ctx.font = "bold 44px Arial";\n' +
'    wrapText(ctx, face.text || "", 256, 235, 440, 50);\n' +
'    if (face.sub) { ctx.font = "26px Arial"; ctx.fillStyle = "#5c4f3d"; ctx.fillText(face.sub, 256, 300); }\n' +
'    var tex = new THREE.CanvasTexture(canvas);\n' +
'    tex.needsUpdate = true;\n' +
'    return tex;\n' +
'  }\n' +
'\n' +
'  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {\n' +
'    var words = text.split(" ");\n' +
'    var line = "";\n' +
'    var lines = [];\n' +
'    for (var i = 0; i < words.length; i++) {\n' +
'      var test = line + words[i] + " ";\n' +
'      if (ctx.measureText(test).width > maxWidth && line !== "") { lines.push(line); line = words[i] + " "; }\n' +
'      else line = test;\n' +
'    }\n' +
'    lines.push(line);\n' +
'    var startY = y - ((lines.length - 1) * lineHeight) / 2;\n' +
'    lines.forEach(function(l, i) { ctx.fillText(l.trim(), x, startY + i * lineHeight); });\n' +
'  }\n' +
'\n' +
'  function createFaceMaterial(face) {\n' +
'    if (face.type === "video") {\n' +
'      var video = document.createElement("video");\n' +
'      video.src = face.url; video.crossOrigin = "anonymous"; video.muted = true; video.loop = true; video.playsInline = true;\n' +
'      video.play().catch(function() {});\n' +
'      var vt = new THREE.VideoTexture(video);\n' +
'      return new THREE.MeshStandardMaterial({ map: vt, side: THREE.DoubleSide });\n' +
'    }\n' +
'    if (face.type === "image") {\n' +
'      var loader = new THREE.TextureLoader();\n' +
'      loader.crossOrigin = "anonymous";\n' +
'      var tex = loader.load(face.url);\n' +
'      return new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide });\n' +
'    }\n' +
'    return new THREE.MeshStandardMaterial({ map: drawTextTexture(face), side: THREE.DoubleSide });\n' +
'  }\n' +
'\n' +
'  function initScene() {\n' +
'    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas: boxCanvas });\n' +
'    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));\n' +
'    scene = new THREE.Scene();\n' +
'    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 10, 1000);\n' +
'    camera.position.set(40, 90, 110);\n' +
'    updateSceneSize();\n' +
'    scene.add(box.els.group);\n' +
'    setGeometryHierarchy();\n' +
'    var ambientLight = new THREE.AmbientLight(0xffffff, 0.7);\n' +
'    scene.add(ambientLight);\n' +
'    var lightHolder = new THREE.Group();\n' +
'    var topLight = new THREE.PointLight(0xffffff, 0.5);\n' +
'    topLight.position.set(-30, 300, 0);\n' +
'    lightHolder.add(topLight);\n' +
'    var sideLight = new THREE.PointLight(0xffffff, 0.7);\n' +
'    sideLight.position.set(50, 0, 150);\n' +
'    lightHolder.add(sideLight);\n' +
'    scene.add(lightHolder);\n' +
'    window.__fbLightHolder = lightHolder;\n' +
'\n' +
'    var flapMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color("' + boxColor + '"), side: THREE.DoubleSide });\n' +
'    [box.els.frontHalf.width, box.els.frontHalf.length, box.els.backHalf.width, box.els.backHalf.length].forEach(function(g) {\n' +
'      g.top.material = flapMaterial;\n' +
'      g.bottom.material = flapMaterial;\n' +
'    });\n' +
'    box.els.frontHalf.width.side.material = createFaceMaterial(FACES[0]);\n' +
'    box.els.frontHalf.length.side.material = createFaceMaterial(FACES[1]);\n' +
'    box.els.backHalf.width.side.material = createFaceMaterial(FACES[2]);\n' +
'    box.els.backHalf.length.side.material = createFaceMaterial(FACES[3]);\n' +
'\n' +
'    orbit = new THREE.OrbitControls(camera, boxCanvas);\n' +
'    orbit.enableZoom = false;\n' +
'    orbit.enablePan = false;\n' +
'    orbit.enableDamping = true;\n' +
'    orbit.autoRotate = true;\n' +
'    orbit.autoRotateSpeed = 0.75;\n' +
'    createBoxElements();\n' +
'    createFoldingAnimation();\n' +
'    createZooming();\n' +
'    render();\n' +
'  }\n' +
'\n' +
'  function render() {\n' +
'    orbit.update();\n' +
'    window.__fbLightHolder.quaternion.copy(camera.quaternion);\n' +
'    renderer.render(scene, camera);\n' +
'    requestAnimationFrame(render);\n' +
'  }\n' +
'\n' +
'  function updateSceneSize() {\n' +
'    camera.aspect = container.clientWidth / container.clientHeight;\n' +
'    camera.updateProjectionMatrix();\n' +
'    renderer.setSize(container.clientWidth, container.clientHeight);\n' +
'  }\n' +
'  window.addEventListener("resize", updateSceneSize);\n' +
'\n' +
'  function setGeometryHierarchy() {\n' +
'    box.els.group.add(box.els.frontHalf.width.side, box.els.frontHalf.length.side, box.els.backHalf.width.side, box.els.backHalf.length.side);\n' +
'    box.els.frontHalf.width.side.add(box.els.frontHalf.width.top, box.els.frontHalf.width.bottom);\n' +
'    box.els.frontHalf.length.side.add(box.els.frontHalf.length.top, box.els.frontHalf.length.bottom);\n' +
'    box.els.backHalf.width.side.add(box.els.backHalf.width.top, box.els.backHalf.width.bottom);\n' +
'    box.els.backHalf.length.side.add(box.els.backHalf.length.top, box.els.backHalf.length.bottom);\n' +
'  }\n' +
'\n' +
'  function createBoxElements() {\n' +
'    for (var halfIdx = 0; halfIdx < 2; halfIdx++) {\n' +
'      for (var sideIdx = 0; sideIdx < 2; sideIdx++) {\n' +
'        var half = halfIdx ? "frontHalf" : "backHalf";\n' +
'        var side = sideIdx ? "width" : "length";\n' +
'        var sideWidth = side === "width" ? box.params.width : box.params.length;\n' +
'        var flapWidth = sideWidth - 2 * box.params.flapGap;\n' +
'        var flapHeight = 0.5 * box.params.width - 0.75 * box.params.flapGap;\n' +
'        var sidePlaneGeometry = new THREE.PlaneGeometry(sideWidth, box.params.depth, Math.floor(5 * sideWidth), Math.floor(0.2 * box.params.depth));\n' +
'        var flapPlaneGeometry = new THREE.PlaneGeometry(flapWidth, flapHeight, Math.floor(5 * flapWidth), Math.floor(0.2 * flapHeight));\n' +
'        var sideGeometry = createSideGeometry(sidePlaneGeometry, [sideWidth, box.params.depth], [true, true, true, true], false);\n' +
'        var topGeometry = createSideGeometry(flapPlaneGeometry, [flapWidth, flapHeight], [false, false, true, false], true);\n' +
'        var bottomGeometry = createSideGeometry(flapPlaneGeometry, [flapWidth, flapHeight], [true, false, false, false], true);\n' +
'        topGeometry.translate(0, 0.5 * flapHeight, 0);\n' +
'        bottomGeometry.translate(0, -0.5 * flapHeight, 0);\n' +
'        box.els[half][side].top.geometry = topGeometry;\n' +
'        box.els[half][side].side.geometry = sideGeometry;\n' +
'        box.els[half][side].bottom.geometry = bottomGeometry;\n' +
'        box.els[half][side].top.position.y = 0.5 * box.params.depth;\n' +
'        box.els[half][side].bottom.position.y = -0.5 * box.params.depth;\n' +
'      }\n' +
'    }\n' +
'    updatePanelsTransform();\n' +
'  }\n' +
'\n' +
'  function createSideGeometry(baseGeometry, size, folds, hasMiddleLayer) {\n' +
'    var geometriesToMerge = [];\n' +
'    geometriesToMerge.push(getLayerGeometry(function(v) { return -0.5 * box.params.thickness + 0.01 * Math.sin(box.params.fluteFreq * v); }));\n' +
'    geometriesToMerge.push(getLayerGeometry(function(v) { return 0.5 * box.params.thickness + 0.01 * Math.sin(box.params.fluteFreq * v); }));\n' +
'    if (hasMiddleLayer) geometriesToMerge.push(getLayerGeometry(function(v) { return 0.5 * box.params.thickness * Math.sin(box.params.fluteFreq * v); }));\n' +
'\n' +
'    function getLayerGeometry(offset) {\n' +
'      var layerGeometry = baseGeometry.clone();\n' +
'      var positionAttr = layerGeometry.attributes.position;\n' +
'      for (var i = 0; i < positionAttr.count; i++) {\n' +
'        var x = positionAttr.getX(i);\n' +
'        var y = positionAttr.getY(i);\n' +
'        var z = positionAttr.getZ(i) + offset(x);\n' +
'        z = applyFolds(x, y, z);\n' +
'        positionAttr.setXYZ(i, x, y, z);\n' +
'      }\n' +
'      return layerGeometry;\n' +
'    }\n' +
'\n' +
'    function applyFolds(x, y, z) {\n' +
'      var modifier = function(c, s) { return 1 - Math.pow(c / (0.5 * s), 10); };\n' +
'      if ((x > 0 && folds[1]) || (x < 0 && folds[3])) z *= modifier(x, size[0]);\n' +
'      if ((y > 0 && folds[0]) || (y < 0 && folds[2])) z *= modifier(y, size[1]);\n' +
'      return z;\n' +
'    }\n' +
'\n' +
'    var mergedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometriesToMerge, false);\n' +
'    mergedGeometry.computeVertexNormals();\n' +
'    return mergedGeometry;\n' +
'  }\n' +
'\n' +
'  function createFoldingAnimation() {\n' +
'    gsap.timeline({\n' +
'      scrollTrigger: { trigger: ".page", start: "0% 0%", end: "100% 100%", scrub: true },\n' +
'      onUpdate: updatePanelsTransform\n' +
'    })\n' +
'      .to(box.animated, { duration: 1, openingAngle: 0.5 * Math.PI, ease: "power1.inOut" })\n' +
'      .to([box.animated.flapAngles.backHalf.width, box.animated.flapAngles.frontHalf.width], { duration: 0.6, bottom: 0.6 * Math.PI, ease: "back.in(3)" }, 0.9)\n' +
'      .to(box.animated.flapAngles.backHalf.length, { duration: 0.7, bottom: 0.5 * Math.PI, ease: "back.in(2)" }, 1.1)\n' +
'      .to(box.animated.flapAngles.frontHalf.length, { duration: 0.8, bottom: 0.49 * Math.PI, ease: "back.in(3)" }, 1.4)\n' +
'      .to([box.animated.flapAngles.backHalf.width, box.animated.flapAngles.frontHalf.width], { duration: 0.6, top: 0.6 * Math.PI, ease: "back.in(3)" }, 1.4)\n' +
'      .to(box.animated.flapAngles.backHalf.length, { duration: 0.7, top: 0.5 * Math.PI, ease: "back.in(3)" }, 1.7)\n' +
'      .to(box.animated.flapAngles.frontHalf.length, { duration: 0.9, top: 0.49 * Math.PI, ease: "back.in(4)" }, 1.8);\n' +
'  }\n' +
'\n' +
'  function updatePanelsTransform() {\n' +
'    box.els.frontHalf.width.side.position.x = 0.5 * box.params.length;\n' +
'    box.els.backHalf.width.side.position.x = -0.5 * box.params.length;\n' +
'    box.els.frontHalf.width.side.rotation.y = box.animated.openingAngle;\n' +
'    box.els.backHalf.width.side.rotation.y = box.animated.openingAngle;\n' +
'    var cos = Math.cos(box.animated.openingAngle);\n' +
'    box.els.frontHalf.length.side.position.x = -0.5 * cos * box.params.width;\n' +
'    box.els.backHalf.length.side.position.x = 0.5 * cos * box.params.width;\n' +
'    var sin = Math.sin(box.animated.openingAngle);\n' +
'    box.els.frontHalf.length.side.position.z = 0.5 * sin * box.params.width;\n' +
'    box.els.backHalf.length.side.position.z = -0.5 * sin * box.params.width;\n' +
'    box.els.frontHalf.width.top.rotation.x = -box.animated.flapAngles.frontHalf.width.top;\n' +
'    box.els.frontHalf.length.top.rotation.x = -box.animated.flapAngles.frontHalf.length.top;\n' +
'    box.els.frontHalf.width.bottom.rotation.x = box.animated.flapAngles.frontHalf.width.bottom;\n' +
'    box.els.frontHalf.length.bottom.rotation.x = box.animated.flapAngles.frontHalf.length.bottom;\n' +
'    box.els.backHalf.width.top.rotation.x = box.animated.flapAngles.backHalf.width.top;\n' +
'    box.els.backHalf.length.top.rotation.x = box.animated.flapAngles.backHalf.length.top;\n' +
'    box.els.backHalf.width.bottom.rotation.x = -box.animated.flapAngles.backHalf.width.bottom;\n' +
'    box.els.backHalf.length.bottom.rotation.x = -box.animated.flapAngles.backHalf.length.bottom;\n' +
'  }\n' +
'\n' +
'  function createZooming() {\n' +
'    var zoomInBtn = document.querySelector("#zoom-in");\n' +
'    var zoomOutBtn = document.querySelector("#zoom-out");\n' +
'    var zoomLevel = 1;\n' +
'    var limits = [0.4, 2];\n' +
'    zoomInBtn.addEventListener("click", function() { zoomLevel *= 1.3; applyZoomLimits(); });\n' +
'    zoomOutBtn.addEventListener("click", function() { zoomLevel *= 0.75; applyZoomLimits(); });\n' +
'    function applyZoomLimits() {\n' +
'      if (zoomLevel > limits[1]) { zoomLevel = limits[1]; zoomInBtn.classList.add("disabled"); }\n' +
'      else if (zoomLevel < limits[0]) { zoomLevel = limits[0]; zoomOutBtn.classList.add("disabled"); }\n' +
'      else { zoomInBtn.classList.remove("disabled"); zoomOutBtn.classList.remove("disabled"); }\n' +
'      gsap.to(camera, { duration: 0.2, zoom: zoomLevel, onUpdate: function() { camera.updateProjectionMatrix(); } });\n' +
'    }\n' +
'  }\n' +
'\n' +
'  initScene();\n' +
'  window.onbeforeunload = function() { window.scrollTo(0, 0); };\n' +
'  gsap.to(window, { duration: 1.2, scrollTo: window.innerHeight, ease: "power1.inOut" });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'folding-box-reveal',
        name: 'Caja Personalizable Plegable',
        icon: '📦',
        description: 'Caja de cartón corrugado en 3D (geometría procedural) que se despliega al hacer scroll — sus 4 caras laterales se personalizan con imagen, vídeo o texto/logo propio; pensada para packaging, e-commerce y carritos personalizados de cualquier sector',
        sourceUrl: 'https://gist.github.com/Juanmaes83/74515d51f3d04acc4c1eac99075c3a31',
        build: build
    });
})();
