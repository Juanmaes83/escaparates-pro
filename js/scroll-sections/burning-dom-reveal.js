// Burning DOM Reveal — adapted from the CodePen gist "Burning DOM element
// with WebGL" by Ksenia Kondrashova (source read & understood: a popup
// <div> is rasterized into an image via dom-to-image, that image becomes a
// THREE.Texture on a full-screen orthographic-camera plane positioned
// exactly over the original element's bounding box, the original element is
// hidden, and a GLSL fragment shader burns the texture away over time using
// layered Fractal Brownian Motion noise — one FBM pass drives an edge-
// weighted mask that decides how much of the original color survives, a
// second FBM pass generates the yellow/red fire color mixed in at the
// burning edge, and the output alpha fades to fully transparent once a
// point has fully burned). Dropped the source's CodePen self-promotional
// tutorial copy; kept the shader and rasterize-then-burn mechanism verbatim.
//
// Framed as a generic dramatic reveal, not real-estate-specific per
// explicit direction — "burning away" a card reads as an unusual metaphor
// for showing a property, but works well for other sectors: a countdown/
// offer card that burns away when time runs out, a festival/event
// announcement, a restaurant's "menú anterior" dissolving into the new one,
// or a product-launch teaser. Title, popup heading, up to 3 fields and the
// two button labels are all configurable.
(function() {
    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js';
    var DOMTOIMAGE_CDN = 'https://cdn.jsdelivr.net/npm/dom-to-image@2.6.0/dist/dom-to-image.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Últimas Plazas Disponibles';
        var message = opts.message || 'Cuando se agoten, esta oferta desaparece para siempre.';
        var popupTitle = opts.popupTitle || 'Reserva tu plaza';
        var fields = (opts.fields && opts.fields.length ? opts.fields : [
            { title: 'Nombre', year: 'Ana Torres' },
            { title: 'Email', year: 'ana@email.com' },
            { title: 'Comentario', year: '' }
        ]).slice(0, 3).map(function(f) { return { label: f.title || '', value: f.year || '' }; });
        var openLabel = opts.openLabel || 'Ver oferta';
        var burnLabel = opts.burnLabel || 'Confirmar y quemar';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var bgUrl = media[0] ? media[0].url : '';

        var fieldsHTML = fields.map(function(f, i) {
            return '<label for="bf' + i + '">' + f.label + '</label><input type="text" id="bf' + i + '" value="' + f.value + '">';
        }).join('\n            ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + '</title>\n' +
'<style>\n' +
'html,body{padding:0;margin:0;font-family:Arial,Helvetica,sans-serif;background:#0d0d10;color:#f2ede4;}\n' +
'.container{position:relative;max-width:900px;margin:0 auto;min-height:100vh;padding:6em 1.5em;text-align:center;}\n' +
(bgUrl ? '.container{background:linear-gradient(rgba(13,13,16,0.75),rgba(13,13,16,0.9)),url(\'' + bgUrl + '\') center/cover;}\n' : '') +
'.container h1{font-size:clamp(1.8rem,4vw,2.8rem);margin-bottom:0.75rem;}\n' +
'.container p{color:#cbbfae;max-width:32rem;margin:0 auto 2rem;}\n' +
'#canvas{position:absolute;top:0;left:0;width:0;height:0;border-radius:8px;}\n' +
'.btn{border:2px solid #d9822b;background:#d9822b;padding:0.8rem 1.6rem;color:#1a1206;cursor:pointer;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;border-radius:6px;font-size:0.85rem;}\n' +
'.btn:hover{background:#f0932b;}\n' +
'.popup-wrapper{position:fixed;top:0;left:0;width:100%;height:100vh;background:rgba(0,0,0,0);display:none;justify-content:center;align-items:center;z-index:10;}\n' +
'.popup{line-height:1.8;width:min(90vw,26rem);color:#1a1206;padding:1.5rem;background:#fff;border-radius:8px;visibility:hidden;text-align:left;}\n' +
'.popup h2{margin:0 0 1rem;color:#1a1206;}\n' +
'.popup label{font-weight:700;font-size:0.85rem;display:block;margin-bottom:0.2rem;}\n' +
'.popup input{width:100%;box-sizing:border-box;border:2px solid #1D3075;border-radius:4px;padding:0.5rem;margin-bottom:0.9rem;font-family:inherit;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="container">\n' +
'  <h1>' + title + '</h1>\n' +
'  <p>' + message + '</p>\n' +
'  <button class="open-btn btn">' + openLabel + '</button>\n' +
'  <canvas id="canvas"></canvas>\n' +
'</div>\n' +
'<div class="popup-wrapper">\n' +
'  <div class="popup">\n' +
'    <h2>' + popupTitle + '</h2>\n' +
'    ' + fieldsHTML + '\n' +
'    <button id="close-btn" class="btn">' + burnLabel + '</button>\n' +
'  </div>\n' +
'</div>\n' +
'<script type="x-shader/x-fragment" id="fragmentShader">\n' +
'varying vec2 vUv;\n' +
'uniform float u_size;\n' +
'uniform float u_ratio;\n' +
'uniform float u_time;\n' +
'uniform sampler2D u_texture;\n' +
'float random (in vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }\n' +
'float noise (in vec2 st) {\n' +
'  vec2 i = floor(st); vec2 f = fract(st);\n' +
'  float a = random(i); float b = random(i + vec2(1.0, 0.0)); float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));\n' +
'  vec2 u = f * f * (3.0 - 2.0 * f);\n' +
'  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;\n' +
'}\n' +
'float fbm (in vec2 st) {\n' +
'  float value = 0.0; float amplitude = .5;\n' +
'  for (int i = 0; i < 4; i++) { value += amplitude * noise(st); st *= 2.; amplitude *= .5; }\n' +
'  return value;\n' +
'}\n' +
'void main() {\n' +
'  vec2 uv = vUv; uv.y /= u_ratio;\n' +
'  vec4 base = texture2D(u_texture, vUv);\n' +
'  float t = pow(3. * u_time, .9);\n' +
'  float edges_mask = max(.4, pow(length(vUv - vec2(.5)), .5));\n' +
'  float noise_mask = fbm(vec2(.01 * u_size * uv)) / edges_mask;\n' +
'  noise_mask -= .06 * length(base.rgb);\n' +
'  vec3 color = mix(base.rgb, vec3(0.), smoothstep(noise_mask - .15, noise_mask - .1, t));\n' +
'  vec3 fire_color = fbm(6. * vUv + .1 * t) * vec3(6., 1.4, .0);\n' +
'  color = mix(color, fire_color, smoothstep(noise_mask - .1, noise_mask - .05, t));\n' +
'  color -= .3 * fbm(3. * vUv) * pow(t, 4.);\n' +
'  float opacity = 1. - smoothstep(noise_mask - .01, noise_mask, t);\n' +
'  gl_FragColor = vec4(color, opacity);\n' +
'}\n' +
'</script>\n' +
'<script type="x-shader/x-vertex" id="vertexShader">\n' +
'varying vec2 vUv;\n' +
'void main() { vUv = uv; gl_Position = vec4(position, 1.); }\n' +
'</script>\n' +
'<script src="' + THREE_CDN + '"></script>\n' +
'<script src="' + DOMTOIMAGE_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var popupWrapper = document.querySelector(".popup-wrapper");\n' +
'  var canvasEl = document.querySelector("#canvas");\n' +
'  var openBtns = Array.prototype.slice.call(document.querySelectorAll(".open-btn"));\n' +
'  var closeBtn = document.querySelector("#close-btn");\n' +
'  var popupEl = document.querySelector(".popup");\n' +
'  var renderer, scene, camera, clock, material;\n' +
'\n' +
'  function initScene() {\n' +
'    renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvasEl });\n' +
'    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));\n' +
'    scene = new THREE.Scene();\n' +
'    camera = new THREE.OrthographicCamera(-.5, .5, .5, -.5, 1, 1);\n' +
'    clock = new THREE.Clock();\n' +
'    material = new THREE.ShaderMaterial({\n' +
'      uniforms: { u_time: { value: 0 }, u_ratio: { value: 0 }, u_size: { value: 0 }, u_texture: { value: null } },\n' +
'      vertexShader: document.getElementById("vertexShader").textContent,\n' +
'      fragmentShader: document.getElementById("fragmentShader").textContent,\n' +
'      transparent: true\n' +
'    });\n' +
'    var planeGeometry = new THREE.PlaneGeometry(2, 2);\n' +
'    scene.add(new THREE.Mesh(planeGeometry, material));\n' +
'  }\n' +
'\n' +
'  function render() {\n' +
'    material.uniforms.u_time.value += clock.getDelta();\n' +
'    renderer.render(scene, camera);\n' +
'    requestAnimationFrame(render);\n' +
'  }\n' +
'\n' +
'  function burnElement(texture) {\n' +
'    texture.needsUpdate = true;\n' +
'    material.uniforms.u_texture.value = texture;\n' +
'    material.uniforms.u_time.value = 0;\n' +
'    material.uniforms.u_ratio.value = popupEl.clientWidth / popupEl.clientHeight;\n' +
'    material.uniforms.u_size.value = Math.max(popupEl.clientWidth, popupEl.clientHeight);\n' +
'    renderer.setSize(popupEl.clientWidth, popupEl.clientHeight);\n' +
'    var sourceRect = popupEl.getBoundingClientRect();\n' +
'    canvasEl.style.position = "fixed";\n' +
'    canvasEl.style.top = sourceRect.top + "px";\n' +
'    canvasEl.style.left = sourceRect.left + "px";\n' +
'    render();\n' +
'  }\n' +
'\n' +
'  function onModalClose() {\n' +
'    popupWrapper.style.pointerEvents = "none";\n' +
'    domtoimage.toPng(popupEl).then(function(data) {\n' +
'      var img = new Image();\n' +
'      img.src = data;\n' +
'      burnElement(new THREE.Texture(img));\n' +
'      closePopup();\n' +
'    }).catch(function(error) { console.error("burn failed", error); });\n' +
'  }\n' +
'\n' +
'  function openPopup() {\n' +
'    popupWrapper.style.display = "flex";\n' +
'    gsapFallbackShow();\n' +
'    function gsapFallbackShow() {\n' +
'      popupWrapper.style.transition = "background-color .2s ease-out";\n' +
'      requestAnimationFrame(function() { popupWrapper.style.backgroundColor = "rgba(0,0,0,.35)"; });\n' +
'      setTimeout(function() { popupEl.style.visibility = "visible"; }, 200);\n' +
'    }\n' +
'  }\n' +
'\n' +
'  function closePopup() {\n' +
'    popupEl.style.visibility = "hidden";\n' +
'    popupWrapper.style.transition = "background-color .55s ease-out";\n' +
'    popupWrapper.style.backgroundColor = "rgba(0,0,0,0)";\n' +
'    setTimeout(function() {\n' +
'      popupWrapper.style.display = "none";\n' +
'      renderer.setSize(0, 0);\n' +
'      popupWrapper.style.pointerEvents = "auto";\n' +
'    }, 550);\n' +
'  }\n' +
'\n' +
'  initScene();\n' +
'  closeBtn.addEventListener("click", onModalClose);\n' +
'  popupWrapper.addEventListener("click", function(e) { if (e.target.classList.contains("popup-wrapper")) onModalClose(); });\n' +
'  openBtns.forEach(function(b) { b.addEventListener("click", openPopup); });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'burning-dom-reveal',
        name: 'Reveal en Llamas',
        icon: '🔥',
        description: 'Una tarjeta/popup se convierte en textura y se "quema" con un shader WebGL de fuego (ruido fractal en dos capas: una para la máscara de combustión, otra para el color de las llamas) — dramático para cuentas atrás, ofertas que expiran, anuncios de eventos o cualquier reveal con tensión; pensado para sectores más allá de inmobiliaria',
        sourceUrl: 'https://gist.github.com/Juanmaes83/580a7693b0ffff4754e323421acb7851',
        build: build
    });
})();
