// Rotating On-Scroll Animations — adapted from Codrops "RotatingOnScrollAnimations"
// (GSAP ScrollTrigger + Lenis smooth scroll).
// Source read & understood: https://github.com/codrops/RotatingOnScrollAnimations (MIT)
// Technique: each gallery item starts with a random 3D tilt and un-rotates to flat
// as it scrolls through the viewport (scrubbed), while items are horizontally
// offset in a sine wave and a marquee headline drifts across the middle layer.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function itemMarkup(media) {
        if (media.type === 'video') {
            return '' +
                '<div class="gallery__item">' +
                    '<video src="' + media.url + '" autoplay muted loop playsinline></video>' +
                '</div>';
        }
        return '<div class="gallery__item" style="background-image:url(\'' + media.url + '\')"></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var itemCount = opts.itemCount || 20;
        var headline = opts.headline || 'ESCAPARATE · PREMIUM · SHOWCASE · ';
        var title = opts.title || 'Escaparate';
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);

        var itemsHTML = media.length
            ? media.map(itemMarkup).join('\n      ')
            : '<p style="padding:4rem;color:#888">Sube imágenes o vídeos para ver la galería.</p>';

        var marqueeSpans = '';
        for (var i = 0; i < 6; i++) marqueeSpans += '<span>' + headline + '</span>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Rotating On-Scroll</title>\n' +
'<style>\n' +
':root{--item-width:640px;--item-ar:16/10;--page-bg:#050506;--page-fg:#f5f5f5;--color-marquee:rgba(245,245,245,0.85);--font-size-marquee:9vw;}\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;background:var(--page-bg);color:var(--page-fg);font-family:Arial,Helvetica,sans-serif;overflow-x:hidden;}\n' +
'.ro-title{position:fixed;top:2rem;left:2rem;z-index:5;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;}\n' +
'body::after{content:"";position:fixed;inset:0;z-index:1000;pointer-events:none;background:radial-gradient(rgba(0,0,0,0) 10%, rgba(0,0,0,0.55) 85%);}\n' +
'.mark{position:fixed;width:100vw;top:50%;left:0;transform:translateY(-50%);z-index:1;overflow:hidden;mix-blend-mode:difference;}\n' +
'.mark__inner{display:flex;gap:3rem;width:max-content;position:relative;will-change:transform;}\n' +
'.mark__inner span{white-space:nowrap;text-transform:uppercase;color:var(--color-marquee);font-size:var(--font-size-marquee);line-height:1;font-weight:800;}\n' +
'.gallery{position:relative;display:flex;flex-direction:column;align-items:center;margin-top:30vh;margin-bottom:40vh;}\n' +
'.gallery__item-wrap{width:100%;max-width:var(--item-width);perspective:900px;margin-bottom:-5rem;}\n' +
'.gallery__item{width:100%;background-size:cover;background-position:center;background-repeat:no-repeat;transform-style:preserve-3d;will-change:transform,filter;border-radius:14px;aspect-ratio:var(--item-ar);box-shadow:0 30px 60px rgba(0,0,0,0.5);}\n' +
'.gallery__item video{width:100%;height:100%;object-fit:cover;display:block;border-radius:14px;}\n' +
'</style>\n' +
'</head>\n' +
'<body class="loading">\n' +
'<div class="ro-title">' + title + '</div>\n' +
'<div class="gallery">\n' +
'      ' + itemsHTML + '\n' +
'</div>\n' +
'<div class="mark">\n' +
'  <div class="mark__inner">' + marqueeSpans + '</div>\n' +
'</div>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger);\n' +
'  var lenis = new Lenis();\n' +
'  lenis.on("scroll", ScrollTrigger.update);\n' +
'  gsap.ticker.add(function(time){ lenis.raf(time * 1000); });\n' +
'  gsap.ticker.lagSmoothing(0);\n' +
'  var marqueeInner = document.querySelector(".mark > .mark__inner");\n' +
'  var items = gsap.utils.toArray(".gallery__item");\n' +
'  items.forEach(function(item){\n' +
'    var wrap = document.createElement("div");\n' +
'    wrap.className = "gallery__item-wrap";\n' +
'    item.parentNode.insertBefore(wrap, item);\n' +
'    wrap.appendChild(item);\n' +
'  });\n' +
'  var wraps = gsap.utils.toArray(".gallery__item-wrap");\n' +
'  function positionGalleryItems() {\n' +
'    var amplitude = window.innerWidth * 0.2;\n' +
'    wraps.forEach(function(wrap, i){\n' +
'      var angle = i * 0.45;\n' +
'      gsap.set(wrap, { x: Math.sin(angle) * amplitude });\n' +
'    });\n' +
'  }\n' +
'  function initGalleryAnimation() {\n' +
'    items.forEach(function(item){\n' +
'      var rotationX = gsap.utils.random(70, 120);\n' +
'      var rotationY = gsap.utils.random(-20, 20);\n' +
'      var rotationZ = gsap.utils.random(-20, 20);\n' +
'      var setZ = gsap.quickSetter(item, "z", "px");\n' +
'      gsap.fromTo(item, {\n' +
'        rotationX: rotationX, rotationY: rotationY, rotationZ: rotationZ\n' +
'      }, {\n' +
'        rotationX: -rotationX, rotationY: -rotationY, rotationZ: -rotationZ,\n' +
'        ease: "none",\n' +
'        scrollTrigger: {\n' +
'          trigger: item, start: "top bottom+=20%", end: "bottom top-=20%",\n' +
'          scrub: true, invalidateOnRefresh: true,\n' +
'          onUpdate: function(self) {\n' +
'            var progress = self.progress;\n' +
'            setZ(Math.sin(progress * Math.PI) * -50);\n' +
'          }\n' +
'        }\n' +
'      });\n' +
'    });\n' +
'  }\n' +
'  function animateMarquee() {\n' +
'    gsap.timeline({\n' +
'      scrollTrigger: {\n' +
'        trigger: document.querySelector(".gallery"),\n' +
'        start: "top bottom", end: "bottom top", scrub: true\n' +
'      }\n' +
'    }).fromTo(marqueeInner, { x: "100vw" }, { x: "-100%", ease: "none" });\n' +
'  }\n' +
'  window.addEventListener("resize", function() {\n' +
'    positionGalleryItems();\n' +
'    ScrollTrigger.refresh();\n' +
'  });\n' +
'  positionGalleryItems();\n' +
'  initGalleryAnimation();\n' +
'  animateMarquee();\n' +
'  document.body.classList.remove("loading");\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'rotating-onscroll',
        name: 'Rotating On-Scroll',
        icon: '🌀',
        description: 'Galería vertical donde cada imagen/vídeo entra con un giro 3D aleatorio y se endereza según avanza el scroll, con marquesina de texto de fondo',
        sourceUrl: 'https://github.com/codrops/RotatingOnScrollAnimations',
        build: build
    });
})();
