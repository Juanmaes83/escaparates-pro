// Falling Text Drop — adapted from the gsap-collection demo "falling-text"
// (source read & understood: a full-screen paragraph is split into
// lines/words/chars via SplitText; a type selector picks the split level,
// and a "Start" button drops every piece of that level off-screen with
// random horizontal drift and rotation, elastic-in, then resets it back to
// place — recreated with the client's own paragraph instead of a fixed bio).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SPLITTEXT_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var paragraph = opts.paragraph || 'Cada espacio cuenta una historia. Convertimos visiones estáticas en experiencias vivas, con animaciones cuidadas y presentaciones que enamoran a primera vista. No solo buscamos que luzca bien — buscamos que se sienta inolvidable.';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Falling Text Drop</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#e3e4e0;color:#100e09;text-transform:uppercase;}\n' +
'button{background:transparent;border:none;cursor:pointer;font-family:inherit;}\n' +
'.content{width:100%;height:100dvh;display:flex;align-items:center;justify-content:center;overflow:hidden;user-select:none;padding:0 4rem;}\n' +
'.content h1{max-width:90%;text-align:center;font-size:clamp(1.1rem,3vw,2.2rem);line-height:1.4;font-weight:700;}\n' +
'.chars,.lines,.words{will-change:transform;}\n' +
'.brand{position:fixed;top:1.5rem;left:1.5rem;font-size:0.85rem;font-weight:800;letter-spacing:0.06em;z-index:10;}\n' +
'.selected-type{position:fixed;bottom:1.5rem;left:1.5rem;display:flex;gap:0.5rem;z-index:10;}\n' +
'.selected-type button{padding:0.5rem 1rem;border:2px solid #100e09;font-size:0.8rem;transition:background 0.3s,color 0.3s;text-transform:uppercase;}\n' +
'.selected-type button.active{background:#100e09;color:#e3e4e0;}\n' +
'.start-button{position:fixed;bottom:1.5rem;right:1.5rem;padding:0.5rem 1.2rem;border:2px solid #100e09;background:#100e09;color:#e3e4e0;font-size:0.8rem;text-transform:uppercase;z-index:10;}\n' +
'@media (max-width:768px){.content h1{font-size:1rem;} .selected-type button,.start-button{font-size:0.7rem;padding:0.4rem 0.7rem;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="brand">' + title + '</div>\n' +
'<section class="content"><h1>' + paragraph + '</h1></section>\n' +
'<div class="selected-type">\n' +
'  <button data-type="lines">Líneas</button>\n' +
'  <button data-type="words">Palabras</button>\n' +
'  <button class="active" data-type="chars">Letras</button>\n' +
'</div>\n' +
'<button class="start-button">Activar animación</button>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SPLITTEXT_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(SplitText);\n' +
'  var isAnimating = false;\n' +
'  var buttons = document.querySelectorAll(".selected-type button");\n' +
'  var startButton = document.querySelector(".start-button");\n' +
'  var activeButton = document.querySelector(".selected-type button.active");\n' +
'  var selectedType = activeButton ? activeButton.getAttribute("data-type") : "chars";\n' +
'\n' +
'  var splitType = SplitText.create(".content h1", {\n' +
'    type: "lines,words,chars", charsClass: "chars", wordsClass: "words", linesClass: "lines", smartWrap: true\n' +
'  });\n' +
'\n' +
'  buttons.forEach(function(button) {\n' +
'    button.addEventListener("click", function() {\n' +
'      if (isAnimating) return;\n' +
'      buttons.forEach(function(btn) { btn.classList.remove("active"); });\n' +
'      button.classList.add("active");\n' +
'      selectedType = button.getAttribute("data-type");\n' +
'    });\n' +
'  });\n' +
'\n' +
'  function createAnimation() {\n' +
'    if (isAnimating) return;\n' +
'    isAnimating = true;\n' +
'    if (!splitType.isSplit) { isAnimating = false; return; }\n' +
'    gsap.to(splitType[selectedType], {\n' +
'      y: "120dvh", x: "random(-150, 150)", rotate: "random(-720, 720)",\n' +
'      ease: "elastic.in(1,0.75)", duration: 1,\n' +
'      stagger: { each: selectedType === "lines" ? 0.1 : selectedType === "words" ? 0.05 : 0.0095, from: "random" },\n' +
'      onComplete: function() {\n' +
'        gsap.set(splitType[selectedType], {\n' +
'          y: 0, x: 0, rotate: 0, delay: 0.5,\n' +
'          onComplete: function() { isAnimating = false; }\n' +
'        });\n' +
'      }\n' +
'    });\n' +
'  }\n' +
'\n' +
'  startButton.addEventListener("click", createAnimation);\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'falling-text-drop',
        name: 'Falling Text Drop',
        icon: '🍂',
        description: 'Párrafo de marca que se puede "hacer caer" al pulsar un botón — letras, palabras o líneas se desploman con rotación aleatoria y rebote elástico, luego vuelven a su sitio; toque lúdico e interactivo para presentaciones',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/falling-text',
        build: build
    });
})();
