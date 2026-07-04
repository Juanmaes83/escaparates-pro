// Word Swap Statement — adapted from the gsap-collection demo
// "scroll-text-boring-awwward" (source read & understood: a pinned section
// with a big three-line brand statement; two of those lines are word-swap
// pairs — the first word slides up and out exactly as the second word
// slides up into its place from below, both scrubbed to the same scroll
// range — with a horizontal divider drawing in underneath once the swap
// completes, next to a supporting paragraph. Recreated with the client's
// own word pairs instead of "Rational→Emotion" / "cheap→value").
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var intro = opts.intro || 'Donde el movimiento se convierte en significado. Damos vida a las palabras con animaciones que transforman cada frase en una experiencia.';
        var wordA1 = opts.wordA1 || 'Detalle';
        var wordA2 = opts.wordA2 || 'Carácter';
        var wordMid = opts.wordMid || 'define';
        var wordB1 = opts.wordB1 || 'un espacio';
        var wordB2 = opts.wordB2 || 'un hogar';
        var description = opts.description || 'Llevamos la creatividad a cada rincón de tu propiedad — porque las marcas más fuertes cuidan hasta el último detalle.';
        var outro = opts.outro || 'Más que fotos. Más que movimiento. Esto es diseño en movimiento — un homenaje al arte de contar historias a través del scroll.';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Word Swap Statement</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#f5f4ed;color:#000;}\n' +
'.intro,.outro{width:100%;height:100dvh;display:flex;justify-content:center;align-items:flex-end;padding:0 8vw 3rem;position:relative;}\n' +
'.intro h1,.outro h1{max-width:70vw;font-size:clamp(1.2rem,2.4vw,1.8rem);font-weight:500;line-height:1.4;text-align:center;}\n' +
'.site{position:absolute;top:2rem;right:2rem;font-weight:800;font-size:0.9rem;letter-spacing:0.06em;text-transform:uppercase;}\n' +
'.scrolling{width:100%;height:100svh;}\n' +
'.wrapper-scrolling{width:100%;padding-inline:0.875rem;margin-inline:auto;max-width:72rem;height:100%;}\n' +
'.layout-text{width:100%;height:100%;display:flex;align-items:center;}\n' +
'.big-text{width:64%;font-size:6vw;display:flex;flex-direction:column;line-height:1;padding-inline:2rem;font-weight:800;text-transform:uppercase;}\n' +
'.big-text-line2{align-self:self-end;opacity:0.35;}\n' +
'.big-text-line3{position:relative;display:inline-block;}\n' +
'.text-wrap{position:relative;overflow:hidden;display:inline-block;padding:0.5rem;}\n' +
'.text-wrap h1{will-change:transform;font-size:inherit;font-weight:inherit;line-height:inherit;text-transform:inherit;}\n' +
'.text-wrap h1:last-of-type{position:absolute;top:0;left:0;transform:translateY(120%);}\n' +
'.small-text{width:36%;font-size:1.6rem;line-height:1.3;text-indent:1.5rem;font-weight:500;}\n' +
'.divider{position:absolute;left:0;bottom:0;background:#000;width:100%;height:6px;transform:scaleX(0);will-change:transform;transform-origin:left;}\n' +
'@media (max-width:768px){.layout-text{flex-direction:column;justify-content:center;gap:2rem;} .big-text,.small-text{width:100%;font-size:9vw;} .small-text{font-size:1.1rem;text-indent:0;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<section class="intro">\n' +
'  <div class="site">' + title + '</div>\n' +
'  <h1>' + intro + '</h1>\n' +
'</section>\n' +
'<section class="scrolling">\n' +
'  <div class="wrapper-scrolling">\n' +
'    <div class="layout-text">\n' +
'      <div class="big-text">\n' +
'        <div class="big-text-line1"><div class="text-wrap"><h1>' + wordA1 + '</h1><h1>' + wordA2 + '</h1></div></div>\n' +
'        <div class="big-text-line2"><h1>' + wordMid + '</h1></div>\n' +
'        <div class="big-text-line3"><div class="text-wrap"><h1>' + wordB1 + '</h1><h1>' + wordB2 + '</h1><div class="divider"></div></div></div>\n' +
'      </div>\n' +
'      <div class="small-text"><p>' + description + '</p></div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
'<section class="outro"><h1>' + outro + '</h1></section>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger);\n' +
'  var lenis = new Lenis();\n' +
'  lenis.on("scroll", ScrollTrigger.update);\n' +
'  gsap.ticker.add(function(time) { lenis.raf(time * 1000); });\n' +
'  gsap.ticker.lagSmoothing(0);\n' +
'\n' +
'  var scrolling = document.querySelector(".scrolling");\n' +
'  var firstTexts = document.querySelectorAll(".text-wrap h1:first-of-type");\n' +
'  var lastTexts = document.querySelectorAll(".text-wrap h1:last-of-type");\n' +
'  var yPercent = 120;\n' +
'  var divider = document.querySelector(".divider");\n' +
'\n' +
'  ScrollTrigger.create({\n' +
'    trigger: scrolling, start: "top top", end: "+=250%", pin: true, scrub: true,\n' +
'    onUpdate: function(self) {\n' +
'      var progress = self.progress * 10;\n' +
'      if (progress <= 7) {\n' +
'        var target = 7;\n' +
'        var progressText = Math.round((progress / target) * yPercent);\n' +
'        gsap.set(lastTexts, { y: (yPercent - progressText) + "%" });\n' +
'        gsap.set(firstTexts, { y: "-" + progressText + "%" });\n' +
'      } else {\n' +
'        gsap.set(lastTexts, { y: "0%" });\n' +
'        gsap.set(firstTexts, { y: yPercent + "%" });\n' +
'      }\n' +
'      if (progress >= 7 && progress <= 10) { gsap.set(divider, { scaleX: progress - 7 }); }\n' +
'      else if (progress < 7) { gsap.set(divider, { scaleX: 0 }); }\n' +
'      else if (progress > 9) { gsap.set(divider, { scaleX: 1 }); }\n' +
'    }\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'word-swap-statement',
        name: 'Word Swap Statement',
        icon: '🔀',
        description: 'Titular de marca a gran escala, fijado en pantalla — dos pares de palabras se intercambian en scroll (una sale mientras la otra entra), con una línea divisoria que se dibuja al completarse; bloque de apertura y cierre incluidos',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/scroll-text-boring-awwward',
        build: build
    });
})();
