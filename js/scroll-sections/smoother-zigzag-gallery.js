// Smoother Zigzag Gallery — adapted from the gsap-collection demo
// "scroll-image-gallery" (source read & understood: ScrollSmoother drives a
// tall pinned section where zigzag-positioned cards each parallax upward at
// their own scrub speed via ScrollSmoother's per-element lag effect; a
// pinned title sits behind the cards, visible through the gaps; SplitText
// reveals the intro/outro headlines character by character; a vertical
// progress bar fixed bottom-right fills with overall scroll progress —
// recreated with the client's own media list instead of 7 static photos).
//
// Premium pass: the cards previously just sat there fully visible from the
// first frame with no arrival moment — a flat, static-feeling gallery for a
// piece built around parallax. Added a clip-path + scale reveal per card as
// it enters, an index/caption overlay, a subtle hover tilt, and a numeric
// scroll percentage next to the progress rail instead of a bare label.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var SCROLLSMOOTHER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollSmoother.min.js';
    var SPLITTEXT_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js';
    var POSITIONS = [
        { top: '5%', side: 'right' }, { top: '17%', side: 'left' }, { top: '30%', side: 'right' },
        { top: '43%', side: 'left' }, { top: '53%', side: 'right' }, { top: '68%', side: 'left' },
        { top: '80%', side: 'right' }
    ];

    function cardMarkup(media, i) {
        var pos = POSITIONS[i % POSITIONS.length];
        var label = media.name || ('Referencia ' + (i + 1));
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" alt="" loading="lazy">';
        return '<div class="card" style="top:' + pos.top + ';' + pos.side + ':10%">' +
            '<div class="card__inner">' + inner + '<span class="card__num">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span><span class="card__cap">' + label + '</span></div>' +
            '</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var galleryTitle = opts.galleryTitle || 'Cada detalle cuenta una historia — descúbrela al hacer scroll';
        var outro = opts.outro || '¿Quieres ver más referencias?';
        var itemCount = opts.itemCount || 7;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var cardsHTML = media.map(cardMarkup).join('\n          ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Smoother Zigzag Gallery</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#f0f0f0;color:#1a1a1a;}\n' +
'.char{transform:translate(0px,100%);display:inline-block;will-change:transform;}\n' +
'.intro,.outro{width:100%;height:100dvh;display:flex;align-items:center;justify-content:center;text-transform:uppercase;font-size:clamp(1.4rem,5vw,2.6rem);font-weight:800;}\n' +
'.outro h1,.intro h1{position:relative;overflow:hidden;text-align:center;}\n' +
'.gallery{position:relative;width:100%;height:500dvh;}\n' +
'.gallery-title{width:100%;height:100dvh;display:flex;align-items:center;justify-content:center;padding:0 15vw;font-size:clamp(1rem,2vw,1.6rem);font-weight:700;text-transform:uppercase;text-align:center;position:relative;top:0;left:0;z-index:-1;}\n' +
'.card{position:absolute;width:20%;aspect-ratio:2/3;will-change:transform;}\n' +
'.card__inner{position:relative;width:100%;height:100%;border-radius:6px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.18);clip-path:inset(30% round 6px);transform:scale(0.82);transition:transform 0.45s cubic-bezier(0.16,1,0.3,1);}\n' +
'.card:hover .card__inner{transform:scale(0.85) rotate(-0.6deg);}\n' +
'.card__num{position:absolute;top:0.6rem;left:0.7rem;font-size:0.65rem;letter-spacing:0.05em;color:#fff;opacity:0.85;text-shadow:0 1px 4px rgba(0,0,0,0.7);}\n' +
'.card__cap{position:absolute;left:0;right:0;bottom:0;padding:0.6rem 0.8rem;font-size:0.68rem;letter-spacing:0.04em;text-transform:uppercase;color:#fff;background:linear-gradient(0deg,rgba(0,0,0,0.6),transparent);opacity:0;transform:translateY(6px);transition:opacity 0.3s ease,transform 0.3s ease;}\n' +
'.card:hover .card__cap{opacity:1;transform:translateY(0);}\n' +
'.progress-scroll-container{position:fixed;bottom:1.5em;right:2.5em;z-index:10;display:flex;flex-direction:column;align-items:center;gap:0.6em;}\n' +
'.progress-scroll-container .progress-scroll{height:200px;width:5px;background:rgba(26,26,26,0.15);border-radius:10px;position:relative;overflow:hidden;}\n' +
'.progress-scroll-container .progress-scroll .fill{position:absolute;bottom:0;left:0;width:100%;height:0%;background:#1a1a1a;border-radius:10px;}\n' +
'.progress-scroll-container .pct{font-size:0.7rem;font-variant-numeric:tabular-nums;font-weight:700;letter-spacing:0.05em;}\n' +
'.progress-scroll-container p{margin:0;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;position:absolute;left:-1.6em;top:50%;transform:translateY(-50%) rotate(90deg);white-space:nowrap;opacity:0.6;}\n' +
'@media (max-width:768px){.card{width:45%;aspect-ratio:3/4;} .gallery-title{font-size:0.9rem;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div id="smooth-wrapper">\n' +
'  <div id="smooth-content">\n' +
'    <section class="intro"><h1>' + title + '</h1></section>\n' +
'    <section class="gallery">\n' +
'          ' + cardsHTML + '\n' +
'      <article class="gallery-title"><h1>' + galleryTitle + '</h1></article>\n' +
'    </section>\n' +
'    <section class="outro"><h1>' + outro + '</h1></section>\n' +
'  </div>\n' +
'  <div class="progress-scroll-container"><span class="pct">0%</span><div class="progress-scroll"><div class="fill"></div></div><p>scroll</p></div>\n' +
'</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SPLITTEXT_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + SCROLLSMOOTHER_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);\n' +
'\n' +
'  var splitTextOutro = SplitText.create(".outro h1", { type: "lines, words, chars", charsClass: "char", autoSplit: true });\n' +
'  var splitTextIntro = SplitText.create(".intro h1", { type: "lines, words, chars", charsClass: "char", autoSplit: true });\n' +
'  var cards = gsap.utils.toArray(".card");\n' +
'\n' +
'  gsap.to(splitTextIntro.chars, { y: 0, stagger: 0.05, ease: "power3.out", duration: 1 });\n' +
'\n' +
'  var smoother = ScrollSmoother.create({ smooth: 2, effects: true, smoothTouch: 0.1 });\n' +
'  smoother.effects(".card", { lag: 0.8, speed: 1 });\n' +
'\n' +
'  var pctLabel = document.querySelector(".pct");\n' +
'  ScrollTrigger.create({\n' +
'    trigger: document.body, start: "top top", end: "bottom bottom",\n' +
'    onUpdate: function(self) {\n' +
'      gsap.to(".progress-scroll .fill", { height: (self.progress * 100) + "%", ease: "none", overwrite: true, duration: 0.1 });\n' +
'      pctLabel.textContent = Math.round(self.progress * 100) + "%";\n' +
'    }\n' +
'  });\n' +
'\n' +
'  cards.forEach(function(card) {\n' +
'    var inner = card.querySelector(".card__inner");\n' +
'    gsap.to(card, {\n' +
'      yPercent: -100, ease: "none",\n' +
'      scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true }\n' +
'    });\n' +
'    gsap.to(inner, {\n' +
'      clipPath: "inset(0% round 6px)", scale: 1, ease: "power2.out",\n' +
'      scrollTrigger: { trigger: card, start: "top 90%", end: "top 40%", scrub: 0.6 }\n' +
'    });\n' +
'  });\n' +
'\n' +
'  gsap.to(splitTextOutro.chars, {\n' +
'    y: 0, stagger: 0.05, ease: "power3.out", duration: 1,\n' +
'    scrollTrigger: { trigger: ".outro", start: "top center", end: "bottom bottom", scrub: true }\n' +
'  });\n' +
'\n' +
'  ScrollTrigger.create({ trigger: ".gallery-title", start: "top top", end: "bottom bottom", pin: true, endTrigger: ".gallery" });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'smoother-zigzag-gallery',
        name: 'Smoother Zigzag Gallery',
        icon: '🪄',
        description: 'Galería en zigzag con ScrollSmoother — las fichas se revelan con clip-path + escala al entrar y suben con distinto retraso/velocidad de parallax; leyenda por ficha al hover, titular fijado entre huecos, y barra de progreso con porcentaje',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/scroll-image-gallery',
        build: build
    });
})();
