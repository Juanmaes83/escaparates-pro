// Folding Box Reveal — adapted from the CodePen gist "On-Scroll Folding Box
// w/ Three.js and GSAP" (source read & understood, full Codrops tutorial: a
// procedurally generated corrugated-cardboard box — each panel built from
// merged plane geometries offset to fake a fluted middle layer — whose four
// flaps and two half-widths animate open/closed via a scrubbed GSAP
// timeline tied to page scroll, with OrbitControls auto-rotating the camera
// and manual zoom buttons). Kept the procedural geometry and folding
// timeline verbatim; dropped the source's dev-only lil-gui parameter panel
// and its personal clickable-copyright easter egg (both author-tooling, not
// client-facing), and added an HTML title/message overlay so the reveal
// works as a "so this is how we hand over the keys" welcome moment instead
// of a bare mechanical demo.
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
        var message = opts.message || 'Así te entregamos las llaves de tu nuevo hogar.';
        var boxColor = opts.boxColor || '#9C8D7B';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Caja de Bienvenida</title>\n' +
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
'  function initScene() {\n' +
'    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas: boxCanvas });\n' +
'    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));\n' +
'    scene = new THREE.Scene();\n' +
'    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 10, 1000);\n' +
'    camera.position.set(40, 90, 110);\n' +
'    updateSceneSize();\n' +
'    scene.add(box.els.group);\n' +
'    setGeometryHierarchy();\n' +
'    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);\n' +
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
'    var material = new THREE.MeshStandardMaterial({ color: new THREE.Color("' + boxColor + '"), side: THREE.DoubleSide });\n' +
'    box.els.group.traverse(function(c) { if (c.isMesh) c.material = material; });\n' +
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
        name: 'Caja de Bienvenida Plegable',
        icon: '📦',
        description: 'Caja de cartón corrugado en 3D (geometría procedural, textura de canal simulada) que se despliega y se cierra al hacer scroll, con órbita automática de cámara y zoom manual — un reveal cinematográfico para "así entregamos las llaves"',
        sourceUrl: 'https://gist.github.com/Juanmaes83/74515d51f3d04acc4c1eac99075c3a31',
        build: build
    });
})();
