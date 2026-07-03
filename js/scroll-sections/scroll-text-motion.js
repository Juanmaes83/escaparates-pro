// Scroll Text Motion — adapted from Codrops "ScrollTextMotion"
// (GSAP ScrollSmoother + Flip + ScrambleTextPlugin).
// Source read & understood: https://github.com/codrops/ScrollTextMotion (MIT)
// Technique: scattered typographic phrases scramble into view as they enter the
// viewport and reposition (Flip) as the user scrolls past them. Enhanced here
// with full-bleed image/video reveal blocks between text groups so the client's
// own media becomes part of the kinetic-typography story (source is 100% text-only).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var SCROLLSMOOTHER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollSmoother.min.js';
    var FLIP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Flip.min.js';
    var SCRAMBLE_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrambleTextPlugin.min.js';

    // Word groups with layout structure taken from the original demo (pos-N /
    // data-alt-pos pairs), but the phrase content is fully replaceable.
    var GROUP_LAYOUT = [
        { pos: 4, alt: 2, count: 3 },
        { pos: 1, alt: 3, count: 5 },
        { pos: 1, alt: 2, count: 1, xl: true },
        { pos: 2, alt: 5, count: 3 },
        { pos: 3, alt: 2, count: 4 },
        { pos: 2, alt: 4, count: 5, xl: false },
        { pos: 1, alt: 3, count: 1, xl: true },
        { pos: 2, alt: 9, count: 5 },
        { pos: 4, alt: 3, count: 4 },
        { pos: 3, alt: 5, count: 4 },
        { pos: 2, alt: 3, count: 1, xl: true },
        { pos: 3, alt: 6, count: 4 },
        { pos: 2, alt: 7, count: 4 },
        { pos: 1, alt: 1, count: 5 }
    ];

    var DEFAULT_WORDS = [
        'Diseño', 'Presencia digital', 'Impacto visual', 'Marca', 'Experiencia premium',
        'Escaparate', 'Storytelling', 'Detalle', 'Materialidad', 'Luz', 'Textura',
        'Movimiento', 'Composición', 'Enfoque', 'Ambición', 'Claridad', 'Ritmo',
        'Precisión', 'Elegancia', 'Contraste', 'Espacio', 'Forma', 'Identidad',
        'Visión', 'Sustancia', 'Atmósfera', 'Escala', 'Ritual', 'Signature', 'Aura'
    ];

    function mediaBlock(media) {
        if (!media) return '';
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<div class="stm-media-img" style="background-image:url(\'' + media.url + '\')"></div>';
        return '<div class="stm-media-block">' + inner + '</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var words = (opts.words && opts.words.length) ? opts.words : DEFAULT_WORDS;
        var media = EP.ScrollSections.fillMedia(mediaList, 4);
        var wi = 0;

        var groupsHTML = '';
        var wordIdx = 0;
        GROUP_LAYOUT.forEach(function(g, gi) {
            var elClass = 'el pos-' + g.pos + (g.xl ? ' el--xl' : '');
            var items = '';
            for (var i = 0; i < g.count; i++) {
                var word = words[wordIdx % words.length];
                wordIdx++;
                var scrambleAttr = g.xl ? ' data-scramble-duration="2.5"' : '';
                items += '<div class="' + elClass + '" data-alt-pos="pos-' + g.alt + '"' + scrambleAttr + '>' + word + '</div>\n          ';
            }
            groupsHTML += '<div class="group">\n          ' + items + '\n        </div>\n        ';
            // Splice a media reveal block roughly every 4 groups
            if (media.length && (gi + 1) % 4 === 0 && wi < media.length) {
                groupsHTML += mediaBlock(media[wi]) + '\n        ';
                wi++;
            }
        });

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Scroll Text Motion</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;background:#08080a;color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;overflow-x:hidden;}\n' +
'.stm-logo{display:grid;place-items:center;width:100%;height:100vh;pointer-events:none;position:fixed;left:0;top:0;z-index:0;}\n' +
'.stm-logo span{font-size:clamp(2rem,10vw,4.5rem);font-weight:800;letter-spacing:-0.02em;}\n' +
'.content{position:relative;z-index:1;padding:100vh 6vw 25vh;}\n' +
'.group{display:flex;flex-direction:column;flex:1 1 100px;margin-bottom:10vh;}\n' +
'.el{white-space:nowrap;filter:blur(0);text-transform:uppercase;opacity:0.55;font-size:1.4rem;font-weight:600;}\n' +
'.el--xl{font-size:clamp(3rem,20vw,14rem);opacity:1;font-weight:800;}\n' +
'.pos-2{margin-left:25vw;} .pos-3{margin-left:70vw;} .pos-4{margin-left:auto;}\n' +
'.pos-5{margin-top:150px;opacity:1;} .pos-6{margin-left:auto;margin-top:150px;opacity:1;}\n' +
'.pos-7{margin-top:150px;opacity:1;filter:blur(1px);} .pos-9{margin-left:25vw;margin-top:200px;}\n' +
'.stm-media-block{position:relative;width:100%;aspect-ratio:16/8;margin:12vh 0;border-radius:10px;overflow:hidden;z-index:1;}\n' +
'.stm-media-block video,.stm-media-img{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'</style>\n' +
'</head>\n' +
'<body class="loading">\n' +
'<div class="stm-logo"><span data-text-original>' + title + '</span></div>\n' +
'<main id="smooth-content">\n' +
'  <div class="content">\n' +
'        ' + groupsHTML + '\n' +
'  </div>\n' +
'</main>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + SCROLLSMOOTHER_CDN + '"></script>\n' +
'<script src="' + FLIP_CDN + '"></script>\n' +
'<script src="' + SCRAMBLE_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, Flip, ScrambleTextPlugin);\n' +
'  ScrollSmoother.create({ smooth: 1, normalizeScroll: true });\n' +
'  var textElements = document.querySelectorAll(".el");\n' +
'  var logoEl = document.querySelector(".stm-logo span");\n' +
'  var logoText = logoEl.textContent;\n' +
'  textElements.forEach(function(el){ el.dataset.text = el.textContent; });\n' +
'  logoEl.dataset.text = logoText;\n' +
'  function resetTextElements() {\n' +
'    textElements.forEach(function(el){ gsap.set(el, { clearProps: "transform,opacity,filter" }); });\n' +
'  }\n' +
'  function initFlips() {\n' +
'    resetTextElements();\n' +
'    textElements.forEach(function(el){\n' +
'      var originalClass = Array.prototype.find.call(el.classList, function(c){ return c.indexOf("pos-") === 0; });\n' +
'      var targetClass = el.dataset.altPos;\n' +
'      if (!originalClass || !targetClass) return;\n' +
'      el.classList.add(targetClass); el.classList.remove(originalClass);\n' +
'      var flipState = Flip.getState(el, { props: "opacity, filter, width" });\n' +
'      el.classList.add(originalClass); el.classList.remove(targetClass);\n' +
'      Flip.to(flipState, { ease: "expo.inOut", scrollTrigger: { trigger: el, start: "clamp(bottom bottom-=10%)", end: "clamp(center center)", scrub: true } });\n' +
'      Flip.from(flipState, { ease: "expo.inOut", scrollTrigger: { trigger: el, start: "clamp(center center)", end: "clamp(top top)", scrub: true } });\n' +
'    });\n' +
'  }\n' +
'  var scrambleChars = "upperAndLowerCase";\n' +
'  function scramble(el, cfg) {\n' +
'    cfg = cfg || {};\n' +
'    var text = el.dataset.text || el.textContent;\n' +
'    var duration = cfg.duration || (el.dataset.scrambleDuration ? parseFloat(el.dataset.scrambleDuration) : 1);\n' +
'    gsap.killTweensOf(el);\n' +
'    gsap.fromTo(el, { scrambleText: { text: "", chars: "" } }, { scrambleText: { text: text, chars: scrambleChars, revealDelay: cfg.revealDelay || 0 }, duration: duration });\n' +
'  }\n' +
'  function killScrambleTriggers() {\n' +
'    ScrollTrigger.getAll().forEach(function(st){ if (st.vars.id === "scramble") st.kill(); });\n' +
'  }\n' +
'  function initScramble() {\n' +
'    killScrambleTriggers();\n' +
'    textElements.forEach(function(el){\n' +
'      ScrollTrigger.create({ id: "scramble", trigger: el, start: "top bottom", end: "bottom top",\n' +
'        onEnter: function(){ scramble(el); }, onEnterBack: function(){ scramble(el); } });\n' +
'    });\n' +
'    scramble(logoEl, { revealDelay: 0.5 });\n' +
'  }\n' +
'  window.addEventListener("resize", function() {\n' +
'    ScrollTrigger.refresh(true);\n' +
'    initFlips();\n' +
'    initScramble();\n' +
'  });\n' +
'  initFlips();\n' +
'  initScramble();\n' +
'  document.body.classList.remove("loading");\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'scroll-text-motion',
        name: 'Scroll Text Motion',
        icon: '🔤',
        description: 'Tipografía cinética: frases dispersas se revelan con scramble y se reposicionan (Flip) al hacer scroll, con bloques de imagen/vídeo del cliente intercalados',
        sourceUrl: 'https://github.com/codrops/ScrollTextMotion',
        build: build
    });
})();
