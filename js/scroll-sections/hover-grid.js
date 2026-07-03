// Hover Grid — adapted from Codrops "HoverGrid"
// (source read & understood: https://github.com/codrops/HoverGrid).
// Technique: a navigation list of items; hovering one reveals its associated
// full-bleed image with a directional clip-path wipe (from top/bottom/left/
// right) plus a brightness flash, while a tinted background and the main
// title fade out — releasing the hover restores the idle state.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var DIRECTIONS = ['right', 'left', 'top', 'bottom'];

    function navItemMarkup(media, i) {
        var label = media.name || ('Referencia ' + (i + 1));
        return '<li><a href="#content-' + i + '" data-idx="' + i + '">' + label + '</a></li>';
    }

    function contentMarkup(media, i) {
        var dir = DIRECTIONS[i % DIRECTIONS.length];
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<div class="content__img-inner" style="background-image:url(\'' + media.url + '\')"></div>';
        return '' +
            '<div class="content" id="content-' + i + '">' +
                '<h3 class="content__title">' + (media.name || 'Referencia ' + (i + 1)) + '</h3>' +
                '<div class="content__img" data-dir="' + dir + '">' + inner + '</div>' +
            '</div>';
    }

    function bgMarkup(media, i) {
        var url = media.url;
        return '<div class="background__image" id="bg-' + i + '" style="background-image:url(\'' + url + '\')"></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 6;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);

        var navHTML = media.length ? media.map(navItemMarkup).join('\n        ') : '';
        var contentHTML = media.length ? media.map(contentMarkup).join('\n      ') : '';
        var bgHTML = media.length ? media.map(bgMarkup).join('\n      ') : '';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Hover Grid</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;height:100%;background:#0a0a0c;color:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden;}\n' +
'.stage{position:fixed;inset:0;}\n' +
'.background__image{position:absolute;inset:0;background-size:cover;background-position:50% 50%;opacity:0;filter:brightness(0.4);transition:none;}\n' +
'.center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;z-index:3;}\n' +
'.center__title{font-size:clamp(1.8rem,6vw,4rem);font-weight:800;letter-spacing:0.02em;text-transform:uppercase;}\n' +
'nav.works{list-style:none;margin:1.5rem 0 0;padding:0;display:flex;flex-direction:column;gap:0.4rem;position:relative;z-index:5;pointer-events:auto;}\n' +
'nav.works a{color:rgba(255,255,255,0.55);text-decoration:none;font-size:1.4rem;font-weight:700;text-transform:uppercase;transition:color 0.3s;}\n' +
'nav.works a:hover{color:#fff;}\n' +
'.content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;pointer-events:none;z-index:4;}\n' +
'.content--current{opacity:1;}\n' +
'.content__title{position:absolute;top:2rem;left:2rem;font-size:1rem;letter-spacing:0.1em;text-transform:uppercase;opacity:0;}\n' +
'.content__img{width:60vw;max-width:640px;aspect-ratio:16/10;overflow:hidden;border-radius:12px;clip-path:polygon(0% 0%,100% 0%,100% 100%,0% 100%);box-shadow:0 30px 80px rgba(0,0,0,0.6);}\n' +
'.content__img-inner,.content__img video{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.5);}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="stage">\n' +
'      ' + bgHTML + '\n' +
'  <div class="center">\n' +
'    <div class="center__title">' + title + '</div>\n' +
'    <nav class="works">\n' +
'      <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:0.4rem;">\n' +
'        ' + navHTML + '\n' +
'      </ul>\n' +
'    </nav>\n' +
'  </div>\n' +
'      ' + contentHTML + '\n' +
'</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var links = Array.prototype.slice.call(document.querySelectorAll("nav.works a"));\n' +
'  var centerTitle = document.querySelector(".center__title");\n' +
'  var clipDirs = {\n' +
'    right:  "polygon(0% 0%,0% 0%,0% 100%,0% 100%)",\n' +
'    left:   "polygon(100% 0%,100% 0%,100% 100%,100% 100%)",\n' +
'    top:    "polygon(0% 100%,100% 100%,100% 100%,0% 100%)",\n' +
'    bottom: "polygon(0% 0%,100% 0%,100% 0%,0% 0%)"\n' +
'  };\n' +
'  var fullClip = "polygon(0% 0%,100% 0%,100% 100%,0% 100%)";\n' +
'\n' +
'  function toggle(linkEl, show) {\n' +
'    var idx = linkEl.dataset.idx;\n' +
'    var contentEl = document.getElementById("content-" + idx);\n' +
'    var bgEl = document.getElementById("bg-" + idx);\n' +
'    var imgEl = contentEl.querySelector(".content__img");\n' +
'    var innerEl = contentEl.querySelector(".content__img-inner, video");\n' +
'    var titleEl = contentEl.querySelector(".content__title");\n' +
'    var dir = imgEl.dataset.dir;\n' +
'\n' +
'    if (linkEl.tlEnter) linkEl.tlEnter.kill();\n' +
'    if (linkEl.tlLeave) linkEl.tlLeave.kill();\n' +
'\n' +
'    if (show) {\n' +
'      gsap.set(contentEl, { zIndex: 1 });\n' +
'      contentEl.classList.add("content--current");\n' +
'      linkEl.tlEnter = gsap.timeline({ defaults: { duration: 0.9, ease: "power4" } })\n' +
'        .set(bgEl, { opacity: 1 })\n' +
'        .fromTo(titleEl, { opacity: 0 }, { opacity: 0.8 }, 0)\n' +
'        .fromTo(imgEl, { filter: "brightness(300%)", clipPath: clipDirs[dir] }, { filter: "brightness(100%)", clipPath: fullClip }, 0)\n' +
'        .fromTo(innerEl, { scale: 1.5 }, { scale: 1 }, 0)\n' +
'        .to(centerTitle, { opacity: 0, duration: 0.5 }, 0);\n' +
'    } else {\n' +
'      gsap.set(contentEl, { zIndex: 0 });\n' +
'      linkEl.tlLeave = gsap.timeline({\n' +
'        defaults: { duration: 0.9, ease: "power4" },\n' +
'        onComplete: function() { contentEl.classList.remove("content--current"); }\n' +
'      })\n' +
'        .set(bgEl, { opacity: 0 }, 0.05)\n' +
'        .to(titleEl, { opacity: 0 }, 0)\n' +
'        .to(imgEl, { clipPath: clipDirs[dir] }, 0)\n' +
'        .to(innerEl, { scale: 1.5 }, 0)\n' +
'        .to(centerTitle, { opacity: 1, duration: 0.6 }, 0);\n' +
'    }\n' +
'  }\n' +
'\n' +
'  links.forEach(function(link) {\n' +
'    var hoverTimer;\n' +
'    link.addEventListener("mouseenter", function() {\n' +
'      hoverTimer = setTimeout(function() { toggle(link, true); }, 30);\n' +
'    });\n' +
'    link.addEventListener("mouseleave", function() {\n' +
'      clearTimeout(hoverTimer);\n' +
'      toggle(link, false);\n' +
'    });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'hover-grid',
        name: 'Hover Grid',
        icon: '🖱️',
        description: 'Menú de navegación — al pasar el ratón sobre una referencia, su imagen o video aparece a pantalla completa con un barrido direccional y destello de brillo, ideal para catálogos de propiedades/productos',
        sourceUrl: 'https://github.com/codrops/HoverGrid',
        build: build
    });
})();
