// Truchet Pattern Hero — adapted from the CodePen gist "Truchet Tiles"
// (source read & understood: a full-viewport grid of tiles, each a div with
// two quarter-circle arcs drawn via opposite-corner radial-gradients in
// ::before/::after; a checkerboard base rotation creates a continuous maze
// pattern, individual tiles flip 90° on hover and on their own randomized
// interval timers, and clicking the page cycles through a few global
// alternating-rotation patterns — recreated as a generative, no-media
// ambient background behind a title/CTA, since the pattern needs no photos
// at all to read as a designed hero).
(function() {
    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var tagline = opts.tagline || 'Diseño que se mueve contigo';
        var bgColor = opts.bgColor || '#1a1a1e';
        var tileColor = opts.tileColor || '#3a3a42';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Truchet Pattern Hero</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{height:100%;overflow:hidden;margin:0;}\n' +
'body{display:flex;flex-direction:column;justify-content:center;align-items:center;--bg:' + bgColor + ';--clr:' + tileColor + ';background:var(--bg);transform-style:preserve-3d;perspective:1000px;font-family:Arial,Helvetica,sans-serif;}\n' +
'body::after{content:"";display:block;position:absolute;inset:0;background:linear-gradient(0deg,#0000 42%,#0008 100%);pointer-events:none;z-index:2;}\n' +
'.cirContainer{transform:translateY(-12%) rotateX(28deg);--tc:4px;}\n' +
'.cirRow{display:flex;height:fit-content;}\n' +
'.cir{position:relative;width:var(--size);height:var(--size);overflow:hidden;transition:all 0.6s ease-in-out;box-shadow:inset 0 0 0 0.5px rgba(255,255,255,0.12);background:var(--bg);}\n' +
'.cir::before,.cir::after{content:"";display:block;position:absolute;margin:auto;left:0;right:0;top:0;bottom:0;height:100%;width:100%;}\n' +
'.cir::before{background:radial-gradient(circle at 0.1% 0.1%, transparent 0px, transparent calc((var(--size) / 2) - var(--tc)), var(--clr) calc((var(--size) / 2) - var(--tc)), var(--clr) calc((var(--size) / 2) + var(--tc)), transparent calc((var(--size) / 2) + var(--tc)));}\n' +
'.cir::after{background:radial-gradient(circle at 99.9% 99.9%, transparent 0px, transparent calc((var(--size) / 2) - var(--tc)), var(--clr) calc((var(--size) / 2) - var(--tc)), var(--clr) calc((var(--size) / 2) + var(--tc)), transparent calc((var(--size) / 2) + var(--tc)));}\n' +
'.hero-text{position:relative;z-index:3;text-align:center;color:#fff;pointer-events:none;}\n' +
'.hero-text h1{font-size:clamp(2rem,7vw,5rem);font-weight:800;text-transform:uppercase;letter-spacing:0.02em;text-shadow:0 10px 40px rgba(0,0,0,0.6);}\n' +
'.hero-text p{margin-top:0.8rem;font-size:clamp(0.9rem,1.6vw,1.2rem);opacity:0.8;letter-spacing:0.05em;text-shadow:0 4px 20px rgba(0,0,0,0.6);}\n' +
'.hint{position:fixed;bottom:1.6rem;left:50%;transform:translateX(-50%);z-index:3;color:rgba(255,255,255,0.55);font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;pointer-events:none;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="hero-text"><h1>' + title + '</h1><p>' + tagline + '</p></div>\n' +
'<div class="hint">Clic para cambiar el patrón</div>\n' +
'<script>\n' +
'(function(){\n' +
'  var elementScale = 64;\n' +
'  var elementsPerRow, rows, intervals = [];\n' +
'\n' +
'  function updateDimensions() {\n' +
'    elementsPerRow = Math.floor(window.innerWidth / (elementScale * 0.5)) + 1;\n' +
'    rows = Math.floor(window.innerHeight / (elementScale * 0.8)) + 1;\n' +
'  }\n' +
'  function getRanInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }\n' +
'  function rotateElement(element, random) {\n' +
'    random = random === undefined ? true : random;\n' +
'    var direction = random ? (Math.random() < 0.5 ? 1 : -1) : 1;\n' +
'    var currentRotation = parseInt(element.getAttribute("data-rotation") || "0", 10);\n' +
'    var newRotation = currentRotation + (90 * direction);\n' +
'    element.style.transform = "rotate(" + newRotation + "deg)";\n' +
'    element.setAttribute("data-rotation", newRotation);\n' +
'  }\n' +
'  function startIntervals() {\n' +
'    document.querySelectorAll(".cir").forEach(function(cir) {\n' +
'      var intervalId = setInterval(function() { rotateElement(cir); }, getRanInt(1000, 42000));\n' +
'      intervals.push(intervalId);\n' +
'    });\n' +
'  }\n' +
'  function clearIntervals() { intervals.forEach(clearInterval); intervals = []; }\n' +
'\n' +
'  function createGrid() {\n' +
'    var cirContainer = document.createElement("div");\n' +
'    cirContainer.classList.add("cirContainer");\n' +
'    cirContainer.style.setProperty("--size", elementScale + "px");\n' +
'    document.querySelectorAll(".cirContainer").forEach(function(row) { row.remove(); });\n' +
'    updateDimensions();\n' +
'    for (var i = 0; i < rows; i++) {\n' +
'      var cirRow = document.createElement("div");\n' +
'      cirRow.classList.add("cirRow");\n' +
'      for (var j = 0; j < elementsPerRow; j++) {\n' +
'        var cir = document.createElement("div");\n' +
'        cir.classList.add("cir");\n' +
'        cir.setAttribute("x", j); cir.setAttribute("y", i);\n' +
'        if ((j % 2 === 0 && i % 2 === 0) || (j % 2 === 1 && i % 2 === 1)) cir.style.rotate = "90deg";\n' +
'        cir.addEventListener("mouseover", function() { rotateElement(this); });\n' +
'        cirRow.appendChild(cir);\n' +
'      }\n' +
'      cirContainer.appendChild(cirRow);\n' +
'    }\n' +
'    document.body.insertBefore(cirContainer, document.body.firstChild);\n' +
'  }\n' +
'\n' +
'  createGrid();\n' +
'  startIntervals();\n' +
'\n' +
'  var alt = 0;\n' +
'  document.body.addEventListener("click", function() {\n' +
'    var mod = alt === 0 ? 4 : alt === 1 ? 2 : alt === 2 ? 3 : null;\n' +
'    document.querySelectorAll(".cir").forEach(function(cir, index) {\n' +
'      var newRotation = mod && (index % mod === 0) ? 90 : 0;\n' +
'      cir.style.transform = "rotate(" + newRotation + "deg)";\n' +
'      cir.setAttribute("data-rotation", newRotation);\n' +
'    });\n' +
'    alt = (alt + 1) % 4;\n' +
'  });\n' +
'\n' +
'  document.body.addEventListener("mouseenter", clearIntervals);\n' +
'  document.body.addEventListener("mouseleave", startIntervals);\n' +
'  window.addEventListener("resize", function() { clearIntervals(); createGrid(); startIntervals(); });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'truchet-pattern-hero',
        name: 'Truchet Pattern Hero',
        icon: '🔷',
        description: 'Fondo generativo de azulejos que forman un laberinto continuo — giran solos con temporizadores aleatorios, al pasar el ratón, y clic para alternar patrones globales; hero decorativo sin necesidad de fotos',
        sourceUrl: 'https://gist.github.com/Juanmaes83/e9a54d9fad1991a07e01b0ec795a0e81',
        build: build
    });
})();
