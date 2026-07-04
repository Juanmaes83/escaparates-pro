// Infinite Hero Parallax — adapted from the Codrops tutorial repo
// "infinite-scroll-with-parallax" (source read & understood: full-viewport
// hero sections, each with its background image parallaxing vertically via
// ScrollTrigger scrub as it enters/exits the viewport; Lenis's built-in
// `infinite: true` wraps the scroll position so looping past the last
// section returns to the first with no visible seam — recreated with the
// client's own media list instead of the tutorial's 3 static photos).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function heroMarkup(media, i) {
        var label = media.name || ('Referencia ' + (i + 1));
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" alt="' + label + '">';
        return '<section class="hero"><picture class="hero-image">' + inner + '</picture><div class="hero-label">' + label + '</div></section>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 5;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);

        var heroesHTML = media.map(heroMarkup).join('\n      ');
        var loopHTML = media.length ? heroMarkup(media[0], 0).replace('<section class="hero">', '<section class="hero" aria-hidden="true">') : '';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Infinite Hero Parallax</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html,body{background:#0a0a0c;color:#fff;font-family:Arial,Helvetica,sans-serif;}\n' +
'.wrapper{position:relative;height:100svh;overflow:hidden;}\n' +
'.content{position:relative;}\n' +
'.hero{position:relative;z-index:1;display:grid;place-items:center;width:100%;height:100svh;overflow:clip;}\n' +
'.hero-image{position:absolute;inset:0;z-index:-1;background:#000;}\n' +
'.hero-image img,.hero-image video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.hero-label{position:relative;z-index:2;font-size:clamp(1.4rem,4vw,2.6rem);font-weight:800;letter-spacing:0.03em;text-transform:uppercase;text-shadow:0 4px 24px rgba(0,0,0,0.7);pointer-events:none;}\n' +
'.header{position:fixed;z-index:12;top:0;left:0;right:0;display:flex;justify-content:center;padding:1.6rem;background:linear-gradient(to bottom,rgba(0,0,0,0.7),transparent);}\n' +
'.header h1{font-size:1rem;letter-spacing:0.08em;text-transform:uppercase;font-weight:800;}\n' +
'.hint{position:fixed;z-index:12;bottom:1.6rem;left:0;right:0;text-align:center;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);pointer-events:none;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="header"><h1>' + title + '</h1></div>\n' +
'<div class="wrapper">\n' +
'  <div class="content">\n' +
'      ' + heroesHTML + '\n' +
'      ' + loopHTML + '\n' +
'  </div>\n' +
'</div>\n' +
'<div class="hint">Scroll infinito — desplázate para recorrer las referencias</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger);\n' +
'  var wrapper = document.querySelector(".wrapper");\n' +
'  var content = document.querySelector(".content");\n' +
'\n' +
'  var lenis = new Lenis({ infinite: true, wrapper: wrapper, content: content, syncTouch: true });\n' +
'\n' +
'  ScrollTrigger.scrollerProxy(wrapper, {\n' +
'    scrollTop: function(value) {\n' +
'      if (arguments.length) { lenis.scrollTo(value, { immediate: true }); }\n' +
'      else { return lenis.scroll; }\n' +
'    },\n' +
'    getBoundingClientRect: function() {\n' +
'      return { top: 0, left: 0, width: wrapper.clientWidth, height: wrapper.clientHeight };\n' +
'    },\n' +
'    pinType: "transform"\n' +
'  });\n' +
'\n' +
'  lenis.on("scroll", ScrollTrigger.update);\n' +
'  gsap.ticker.add(function(time) { lenis.raf(time * 1000); });\n' +
'  gsap.ticker.lagSmoothing(0);\n' +
'\n' +
'  var heroes = document.querySelectorAll(".hero");\n' +
'  heroes.forEach(function(hero) {\n' +
'    var image = hero.querySelector(".hero-image");\n' +
'    gsap.fromTo(image, { yPercent: -50 }, {\n' +
'      yPercent: 50,\n' +
'      ease: "none",\n' +
'      scrollTrigger: {\n' +
'        scroller: wrapper,\n' +
'        trigger: hero,\n' +
'        start: "top bottom",\n' +
'        end: "bottom top",\n' +
'        scrub: true,\n' +
'        fastScrollEnd: true\n' +
'      }\n' +
'    });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'infinite-hero-parallax',
        name: 'Infinite Hero Parallax',
        icon: '♾️',
        description: 'Secuencia de heroes a pantalla completa con parallax en la imagen de fondo al hacer scroll, y bucle infinito real (Lenis) — al llegar al final se vuelve al principio sin corte perceptible; ideal para recorrer varias referencias sin fin',
        sourceUrl: 'https://github.com/Juanmaes83/infinite-scroll-with-parallax',
        build: build
    });
})();
