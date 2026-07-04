// Cursor Poster Scroll — adapted from the gsap-collection demo
// "split-vignette" (source read & understood: full-bleed galleries stacked
// down the page, each carrying a small "poster" thumbnail that follows the
// cursor everywhere on the page — not just over its own section — offering
// a floating secondary preview; an outro section has hover-triggered
// captions that each stack a freshly scaled-in image into the poster,
// accumulating a small trail of recently-viewed images capped at 8.
// Recreated with the client's own media list instead of 8 static photos).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var CUSTOMEASE_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/CustomEase.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function galleryMarkup(mainMedia, posterMedia) {
        var mainInner = mainMedia.type === 'video'
            ? '<video src="' + mainMedia.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + mainMedia.url + '" alt="">';
        var posterInner = posterMedia.type === 'video'
            ? '<video src="' + posterMedia.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + posterMedia.url + '" alt="">';
        return '<section class="gallery">' + mainInner + '<div class="poster">' + posterInner + '</div></section>';
    }

    function hoverTextMarkup(label, media) {
        return '<h2 class="hover-text" data-image="' + media.url + '">' + label + '</h2>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var labels = (opts.labels && opts.labels.length) ? opts.labels : ['Luz natural', 'Materiales nobles', 'Silencio y calma'];
        var media = EP.ScrollSections.fillMedia(mediaList, 12);
        var galleryPairs = [[media[0], media[4]], [media[1], media[5]], [media[2], media[6]], [media[3], media[7]]];
        var galleriesHTML = galleryPairs.map(function(pair) { return galleryMarkup(pair[0], pair[1]); }).join('\n      ');
        var hoverTextsHTML = labels.map(function(l, i) { return hoverTextMarkup(l, media[(8 + i) % media.length]); }).join('\n      ');
        var outroPosterMedia = media[8] || media[0];
        var outroPosterInner = outroPosterMedia.type === 'video'
            ? '<video src="' + outroPosterMedia.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + outroPosterMedia.url + '" alt="">';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Cursor Poster Scroll</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#eaeaea;color:#131313;}\n' +
'.overlay{background:#eaeaea;position:fixed;inset:0;width:100%;height:100dvh;z-index:100;}\n' +
'.gallery{width:100%;height:120dvh;position:relative;clip-path:polygon(0 0,0 100%,100% 100%,100% 0);}\n' +
'.poster{width:20vw;min-width:200px;height:25vw;min-height:250px;overflow:hidden;pointer-events:none;position:fixed;top:0;left:0;clip-path:inset(0 0 0 0 round 10px);z-index:10;box-shadow:0 30px 70px rgba(0,0,0,0.35);}\n' +
'.outro{width:100%;height:100dvh;clip-path:polygon(0 0,0 100%,100% 100%,100% 0);display:flex;flex-direction:column;gap:2.4rem;align-items:center;justify-content:center;position:relative;background:#131313;color:#eaeaea;}\n' +
'.outro .hover-text{font-weight:700;font-size:clamp(1.6rem,4vw,3.4rem);cursor:pointer;z-index:11;text-transform:uppercase;letter-spacing:0.01em;transition:opacity 0.3s;}\n' +
'.outro .hover-text:hover{opacity:0.6;}\n' +
'.card-image{will-change:transform;width:100%;height:100%;position:absolute;top:0;left:0;transform-origin:center;}\n' +
'.site{position:absolute;font-weight:800;text-transform:uppercase;font-size:0.9rem;letter-spacing:0.06em;top:1.5rem;right:1.5rem;z-index:12;}\n' +
'@media (max-width:768px){.poster{width:40vw;height:45vw;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<main class="main-container">\n' +
'      ' + galleriesHTML + '\n' +
'  <section class="outro">\n' +
'    <div class="site">' + title + '</div>\n' +
'      ' + hoverTextsHTML + '\n' +
'    <div class="poster">' + outroPosterInner + '</div>\n' +
'  </section>\n' +
'</main>\n' +
'<div class="overlay"></div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + CUSTOMEASE_CDN + '"></script>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var lenis = new Lenis();\n' +
'  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }\n' +
'  requestAnimationFrame(raf);\n' +
'\n' +
'  gsap.to(".overlay", {\n' +
'    delay: 0.6, opacity: 0, duration: 1, ease: "power3.out",\n' +
'    onComplete: function() { document.querySelector(".overlay").remove(); }\n' +
'  });\n' +
'\n' +
'  var posters = document.querySelectorAll(".poster");\n' +
'  var posterOutro = document.querySelector(".outro .poster");\n' +
'  var hoverText = document.querySelectorAll(".hover-text");\n' +
'\n' +
'  document.addEventListener("mousemove", function(e) {\n' +
'    posters.forEach(function(poster) {\n' +
'      var rect = poster.getBoundingClientRect();\n' +
'      var moveX = e.clientX - rect.width / 2;\n' +
'      var moveY = e.clientY - rect.height / 2;\n' +
'      gsap.to(poster, { x: moveX, y: moveY, duration: 0.5, ease: "power2.out" });\n' +
'    });\n' +
'  });\n' +
'\n' +
'  hoverText.forEach(function(text) {\n' +
'    var source = text.getAttribute("data-image");\n' +
'    text.addEventListener("mouseenter", function() {\n' +
'      var card = document.createElement("div");\n' +
'      card.className = "card-image";\n' +
'      card.style.zIndex = posterOutro.childElementCount + 1;\n' +
'      var newImg = document.createElement("img");\n' +
'      newImg.src = source; newImg.alt = "";\n' +
'      card.appendChild(newImg);\n' +
'      if (posterOutro.childElementCount > 8) posterOutro.firstElementChild.remove();\n' +
'      posterOutro.appendChild(card);\n' +
'      gsap.fromTo(card, { scale: 0 }, { scale: 1, duration: 1, ease: "power4.out" });\n' +
'    });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'cursor-poster-scroll',
        name: 'Cursor Poster Scroll',
        icon: '🎬',
        description: 'Galerías a pantalla completa con un póster secundario que sigue al cursor por toda la página; al final, pasar el ratón sobre cada palabra clave apila una nueva imagen ampliándose en ese póster — tono cinematográfico de estudio creativo',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/split-vignette',
        build: build
    });
})();
