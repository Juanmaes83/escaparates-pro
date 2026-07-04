// Grid Slides Toggle — adapted from the gsap-collection demo
// "layout-transition-faintfilm" (source read & understood: a small grayscale
// image grid sits beside a sticky preview panel; a pill toggle switches the
// whole layout via GSAP Flip between "Grid" — the small grid + preview pair
// — and "Slides" — the same images reflowed into one giant horizontal
// filmstrip filling the viewport, staggered; the preview panel's clip-path
// masks in/out to match. Recreated with the client's own media list instead
// of 18 static photos).
//
// Premium pass: the source's hover "+" cursor overlay implied you could open
// an image but the original script never wired that up — a dead affordance.
// Wired real click-to-preview behaviour into the grid so the "+" actually
// does something, plus a numbered index consistent with the rest of the
// toolkit's premium pass.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var FLIP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Flip.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function cardMarkup(media, i) {
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" muted playsinline data-src="' + media.url + '"></video>'
            : '<img src="' + media.url + '" data-src="' + media.url + '" alt="">';
        return '<div class="card-image" data-idx="' + i + '"><p>' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</p><div class="image">' + inner + '</div></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 16;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var firstUrl = media[0] ? media[0].url : '';
        var cardsHTML = media.map(cardMarkup).join('\n          ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Grid Slides Toggle</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{position:absolute;width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#eaeaea;color:#111;}\n' +
'.navbar{position:fixed;top:0;left:0;padding:1.6rem 1.5em 1.6rem 2.5rem;display:flex;align-items:center;justify-content:space-between;z-index:10;width:100%;}\n' +
'.navbar h1{font-size:1rem;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;}\n' +
'.container{width:100%;height:100vh;position:relative;}\n' +
'.main-content{max-width:100%;width:100%;min-height:100%;padding-left:2rem;position:relative;display:flex;justify-content:space-between;}\n' +
'.main-content.slides{max-width:100%;overflow:hidden;}\n' +
'.wrapper-images{padding-block:6rem;width:47%;display:grid;grid-template-columns:repeat(4,1fr);gap:1.6rem;align-items:center;--width-card:9vw;--heigth-card:8vw;}\n' +
'.wrapper-images.slides{width:fit-content;display:flex;align-items:center;min-height:100dvh;gap:40px;flex-wrap:nowrap;--width-card:60svh;--heigth-card:40svh;}\n' +
'.main-content .preview-image{width:50%;position:sticky;top:0;right:0;background:#f2f2f2;z-index:9;height:100svh;display:flex;align-items:center;justify-content:center;clip-path:var(--mask-path);will-change:clip-path;}\n' +
'.preview-card{width:90%;aspect-ratio:3/2;position:relative;border-radius:6px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,0.2);}\n' +
'.card-image{display:flex;gap:0.6rem;filter:grayscale(1);width:var(--width-card);height:var(--heigth-card);}\n' +
'.card-image p{position:absolute;z-index:3;font-size:0.65rem;color:#fff;padding:0.3rem 0.4rem;opacity:0;transition:opacity 0.2s;text-shadow:0 1px 4px rgba(0,0,0,0.7);}\n' +
'.card-image:hover p{opacity:0.9;}\n' +
'.image{width:100%;height:100%;position:relative;cursor:pointer;flex-grow:1;border-radius:3px;overflow:hidden;}\n' +
'.image::before{content:"";width:100%;height:100%;background:#000;opacity:0;position:absolute;inset:0;transition:opacity 0.2s ease-in-out;z-index:1;}\n' +
'.image::after{content:"+";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;color:#fff;opacity:0;z-index:2;transition:opacity 0.2s ease-in-out;}\n' +
'.image:hover::before{opacity:0.55;}\n' +
'.image:hover::after{opacity:1;}\n' +
'.switch-button{position:fixed;left:50%;transform:translateX(-50%);bottom:2rem;z-index:20;display:flex;gap:10px;background:#000000b3;padding:0.25rem;align-items:center;width:fit-content;border-radius:100vmax;}\n' +
'.switch-button button{background:transparent;border:none;min-width:70px;height:28px;display:flex;position:relative;align-items:center;justify-content:center;border-radius:100vmax;color:#f2f2f2;z-index:2;transition:all 0.4s ease-in-out;cursor:pointer;pointer-events:auto;font-weight:600;font-family:inherit;font-size:0.8rem;}\n' +
'.switch-button button.is-current{color:#000;pointer-events:none;}\n' +
'.bg-white{background:#f2f2f2;width:70px;height:28px;border-radius:100vmax;position:absolute;}\n' +
'@media (max-width:768px){.main-content{flex-direction:column;} .wrapper-images{width:100%;} .preview-image{display:none;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<nav class="navbar"><h1>' + title + '</h1></nav>\n' +
'<main class="container">\n' +
'  <div class="main-content">\n' +
'    <section class="wrapper-images">\n' +
'          ' + cardsHTML + '\n' +
'    </section>\n' +
'    <section class="preview-image" style="--mask-path: inset(0% 0% 0% 0%)">\n' +
'      <div class="preview-card"><img id="preview-img" src="' + firstUrl + '" alt=""></div>\n' +
'    </section>\n' +
'  </div>\n' +
'</main>\n' +
'<div class="switch-button">\n' +
'  <button class="is-current grid-button"><span>Grid</span></button>\n' +
'  <button class="slides-button"><span>Slides</span></button>\n' +
'  <div class="bg-white"></div>\n' +
'</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + FLIP_CDN + '"></script>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(Flip);\n' +
'  var lenis = new Lenis();\n' +
'  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }\n' +
'  requestAnimationFrame(raf);\n' +
'\n' +
'  var buttonGrid = document.querySelector(".grid-button");\n' +
'  var buttonSlides = document.querySelector(".slides-button");\n' +
'  var bgWhiteButton = document.querySelector(".bg-white");\n' +
'  var previewImage = document.querySelector(".preview-image");\n' +
'  var previewImg = document.getElementById("preview-img");\n' +
'  var wrapperImages = document.querySelector(".wrapper-images");\n' +
'  var mainContainer = document.querySelector(".main-content");\n' +
'  var isAnimating = false;\n' +
'  var allImage = document.querySelectorAll(".card-image");\n' +
'\n' +
'  allImage.forEach(function(card) {\n' +
'    card.querySelector(".image").addEventListener("click", function() {\n' +
'      var media = card.querySelector("img,video");\n' +
'      var src = media.getAttribute("data-src");\n' +
'      if (!src) return;\n' +
'      gsap.to(previewImg, {\n' +
'        opacity: 0, duration: 0.2, onComplete: function() {\n' +
'          previewImg.src = src;\n' +
'          gsap.to(previewImg, { opacity: 1, duration: 0.3 });\n' +
'        }\n' +
'      });\n' +
'    });\n' +
'  });\n' +
'\n' +
'  buttonGrid.addEventListener("click", function() {\n' +
'    if (isAnimating) return;\n' +
'    isAnimating = true;\n' +
'    buttonSlides.disabled = true;\n' +
'    gsap.to(bgWhiteButton, { translateX: 0, ease: "power2.inOut", duration: 1 });\n' +
'    buttonSlides.classList.remove("is-current");\n' +
'    buttonGrid.classList.add("is-current");\n' +
'    var state = Flip.getState(allImage);\n' +
'    mainContainer.classList.remove("slides");\n' +
'    wrapperImages.classList.remove("slides");\n' +
'    Flip.from(state, {\n' +
'      absolute: true, duration: 1.4, ease: "power3.inOut",\n' +
'      onComplete: function() {\n' +
'        gsap.to(previewImage, {\n' +
'          "--mask-path": "inset(0% 0% 0% 0%)", ease: "power1.inOut", duration: 1,\n' +
'          onComplete: function() { isAnimating = false; buttonSlides.disabled = false; }\n' +
'        });\n' +
'      }\n' +
'    });\n' +
'  });\n' +
'\n' +
'  buttonSlides.addEventListener("click", function() {\n' +
'    if (isAnimating) return;\n' +
'    buttonGrid.disabled = true;\n' +
'    isAnimating = true;\n' +
'    lenis.scrollTo(0, { duration: 0.001 });\n' +
'    gsap.to(bgWhiteButton, { translateX: 80, ease: "power2.inOut", duration: 1 });\n' +
'    buttonGrid.classList.remove("is-current");\n' +
'    buttonSlides.classList.add("is-current");\n' +
'    gsap.to(previewImage, { "--mask-path": "inset(0% 0% 0% 100%)", ease: "power1.inOut", duration: 0.75 });\n' +
'    var state = Flip.getState(allImage);\n' +
'    mainContainer.classList.add("slides");\n' +
'    wrapperImages.classList.add("slides");\n' +
'    Flip.from(state, {\n' +
'      absolute: true, delay: 0.3, duration: 1.4, ease: "power3.inOut",\n' +
'      stagger: { each: 0.02, from: "start" },\n' +
'      onComplete: function() { isAnimating = false; buttonGrid.disabled = false; }\n' +
'    });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'grid-slides-toggle',
        name: 'Grid Slides Toggle',
        icon: '🔃',
        description: 'Toggle Grid↔Slides con GSAP Flip — grid pequeño + panel de vista previa sticky (clic en cualquier miniatura la muestra en grande) que se transforma en una franja horizontal de tarjetas a pantalla completa; distinto a nuestro Grid Flip Resize',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/layout-transition-faintfilm',
        build: build
    });
})();
