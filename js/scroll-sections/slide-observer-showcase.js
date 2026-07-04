// Slide Observer Showcase — adapted from the gsap-collection demo
// "slide-animation-observer" (source read & understood: full-bleed slides
// stacked absolutely; the GSAP Observer plugin listens for wheel/touch and
// steps to the next/previous slide — outgoing slide scales down + turns
// grayscale while its SplitText title collapses per-character, incoming
// slide slides in at full color/scale with its title staggering back in,
// using a custom "hop" ease — recreated with the client's own media list
// instead of 5 static stock photos).
//
// Premium pass: added a slow Ken Burns drift on the active slide (stillness
// reads as cheap on a hero), a numbered index + progress dots (so the
// viewer always knows where they are — bare "keep scrolling" text alone
// isn't enough wayfinding for an Awwwards-level piece), and a custom
// magnetic cursor that reveals a "SCROLL" label — the kind of tactile detail
// that separates a generic slider from a considered interactive object.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var CUSTOMEASE_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/CustomEase.min.js';
    var OBSERVER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Observer.min.js';
    var SPLITTEXT_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js';

    function slideMarkup(media, i) {
        var label = media.name || ('Referencia ' + (i + 1));
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" alt="' + label + '">';
        return '<section class="slide"><div class="bg"><div class="bg__media">' + inner + '</div></div><h1 class="title-slide">' + label + '</h1></section>';
    }

    function dotMarkup(_, i) {
        return '<span class="dot" data-idx="' + i + '"></span>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 5;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var slidesHTML = media.map(slideMarkup).join('\n      ');
        var dotsHTML = media.map(dotMarkup).join('');
        var n = media.length || itemCount;

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Slide Observer Showcase</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#141313;color:#ececec;cursor:none;}\n' +
'.main-content{width:100%;height:100dvh;position:relative;overflow:hidden;opacity:0;}\n' +
'.slide{position:absolute;width:100%;height:100%;top:0;left:0;will-change:transform,filter;}\n' +
'.bg{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;}\n' +
'.bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.05) 30%,rgba(0,0,0,0.15) 70%,rgba(0,0,0,0.55) 100%);pointer-events:none;}\n' +
'.bg__media{position:absolute;inset:-4%;width:108%;height:108%;}\n' +
'.slide.is-active .bg__media{animation:kenburns 9s ease-in-out infinite alternate;}\n' +
'@keyframes kenburns{from{transform:scale(1) translate(0,0);}to{transform:scale(1.08) translate(-1%,-1%);}}\n' +
'.title-slide{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:clamp(1.4rem,3.5vw,3rem);font-weight:800;text-align:center;white-space:nowrap;max-width:90%;text-transform:uppercase;letter-spacing:0.02em;text-shadow:0 4px 24px rgba(0,0,0,0.6);}\n' +
'.scroll-text{position:absolute;bottom:1.8rem;left:50%;transform:translateX(-50%);font-size:0.75rem;letter-spacing:0.25rem;text-transform:uppercase;opacity:0.55;z-index:5;pointer-events:none;}\n' +
'.brand{position:absolute;top:1.8rem;left:50%;transform:translateX(-50%);font-size:0.8rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;z-index:5;pointer-events:none;}\n' +
'.index-counter{position:absolute;bottom:1.8rem;right:2.2rem;z-index:5;font-size:0.85rem;letter-spacing:0.08em;font-variant-numeric:tabular-nums;pointer-events:none;display:flex;align-items:baseline;gap:0.3rem;}\n' +
'.index-counter .cur{font-size:1.2rem;font-weight:800;}\n' +
'.index-counter .sep{opacity:0.4;}\n' +
'.index-counter .tot{opacity:0.55;}\n' +
'.dots{position:absolute;bottom:1.8rem;left:2.2rem;z-index:5;display:flex;gap:0.5rem;pointer-events:none;}\n' +
'.dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.3);transition:background 0.3s,transform 0.3s;}\n' +
'.dot.active{background:#fff;transform:scale(1.5);}\n' +
'.cursor{position:fixed;top:0;left:0;width:14px;height:14px;border-radius:50%;background:#fff;mix-blend-mode:difference;pointer-events:none;z-index:50;transform:translate(-50%,-50%);transition:width 0.35s cubic-bezier(0.16,1,0.3,1),height 0.35s cubic-bezier(0.16,1,0.3,1);display:flex;align-items:center;justify-content:center;}\n' +
'.cursor span{opacity:0;font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;color:#000;white-space:nowrap;transition:opacity 0.25s;}\n' +
'.cursor.hover{width:74px;height:74px;}\n' +
'.cursor.hover span{opacity:1;}\n' +
'@media (max-width:768px){.title-slide{font-size:1.6rem;} .scroll-text{font-size:0.65rem;} body{cursor:auto;} .cursor{display:none;}}\n' +
'@media (hover:none){body{cursor:auto;} .cursor{display:none;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="cursor"><span>Scroll</span></div>\n' +
'<main class="main-content">\n' +
'  <div class="brand">' + title + '</div>\n' +
'      ' + slidesHTML + '\n' +
'  <div class="dots">' + dotsHTML + '</div>\n' +
'  <div class="index-counter"><span class="cur">01</span><span class="sep">/</span><span class="tot">' + (n < 10 ? '0' + n : n) + '</span></div>\n' +
'  <h1 class="scroll-text">( Sigue haciendo scroll )</h1>\n' +
'</main>\n' +
'<script src="' + CUSTOMEASE_CDN + '"></script>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + OBSERVER_CDN + '"></script>\n' +
'<script src="' + SPLITTEXT_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(Observer, SplitText, CustomEase);\n' +
'  CustomEase.create("hop", "0.7, 0, 0, 1");\n' +
'\n' +
'  var lastIndex = 0, isAnimating = true;\n' +
'  var slides = gsap.utils.toArray(".slide");\n' +
'  var totalSlide = slides.length;\n' +
'  var scaleSlide = 0.75, grayscaleSlide = "grayscale(0.7)";\n' +
'  var dots = gsap.utils.toArray(".dot");\n' +
'  var counterCur = document.querySelector(".index-counter .cur");\n' +
'  var splitTitle = gsap.utils.toArray(".title-slide").map(function(t) {\n' +
'    return SplitText.create(t, {\n' +
'      type: "chars", autoSplit: true,\n' +
'      onSplit: function(self) {\n' +
'        gsap.set(self.chars, { scale: 0, transformOrigin: function(i) { return (i % 2 === 0) ? "bottom" : "top"; } });\n' +
'        return gsap.to(self.chars, { scale: 1, duration: 0.5, stagger: 0.1 });\n' +
'      }\n' +
'    });\n' +
'  });\n' +
'\n' +
'  function setActiveVisuals(index) {\n' +
'    slides.forEach(function(s, i) { s.classList.toggle("is-active", i === index); });\n' +
'    dots.forEach(function(d, i) { d.classList.toggle("active", i === index); });\n' +
'    counterCur.textContent = (index + 1 < 10 ? "0" : "") + (index + 1);\n' +
'  }\n' +
'\n' +
'  gsap.set(slides.filter(function(_, index) { return index !== 0; }), { xPercent: 100, scale: scaleSlide, filter: grayscaleSlide });\n' +
'  gsap.to(".main-content", { opacity: 1, duration: 0.9, ease: "power4.inOut" });\n' +
'  gsap.delayedCall(1.2, function() { isAnimating = false; });\n' +
'  setActiveVisuals(0);\n' +
'\n' +
'  function goToSection(index, direction) {\n' +
'    isAnimating = true;\n' +
'    var isGoDown = direction === 1, dFactor = isGoDown ? 1 : -1;\n' +
'    var timeline = gsap.timeline({\n' +
'      onComplete: function() { lastIndex = index; isAnimating = false; },\n' +
'      defaults: { duration: 1.25, ease: "power4.inOut" }\n' +
'    });\n' +
'    gsap.set(slides[index], { scale: scaleSlide, filter: grayscaleSlide, xPercent: 100 * dFactor });\n' +
'    gsap.set(splitTitle[index].chars, { scale: 0, transformOrigin: function(i) { return (i % 2 === 0) ? "bottom" : "top"; } });\n' +
'    setActiveVisuals(index);\n' +
'    timeline\n' +
'      .to(splitTitle[lastIndex].chars, { scale: 0, transformOrigin: function(i) { return (i % 2 === 0) ? "top" : "bottom"; }, stagger: 0.1, duration: 0.5 })\n' +
'      .to(slides[lastIndex], { scale: scaleSlide, filter: grayscaleSlide }, "-=0.4")\n' +
'      .to(slides[lastIndex], { xPercent: -100 * dFactor, ease: "hop" })\n' +
'      .to(slides[index], { xPercent: 0, ease: "hop" }, "<")\n' +
'      .to(slides[index], { scale: 1, filter: "grayscale(0)" })\n' +
'      .to(splitTitle[index].chars, { scale: 1, stagger: 0.1, duration: 0.45 }, "-=.95");\n' +
'  }\n' +
'\n' +
'  Observer.create({\n' +
'    type: "wheel,touch",\n' +
'    onDown: function() { if (!isAnimating) goToSection((lastIndex - 1 + totalSlide) % totalSlide, -1); },\n' +
'    onUp: function() { if (!isAnimating) goToSection((lastIndex + 1) % totalSlide, 1); },\n' +
'    wheelSpeed: -1\n' +
'  });\n' +
'\n' +
'  dots.forEach(function(d, i) {\n' +
'    d.style.pointerEvents = "auto";\n' +
'    d.style.cursor = "pointer";\n' +
'    d.addEventListener("click", function() {\n' +
'      if (isAnimating || i === lastIndex) return;\n' +
'      goToSection(i, i > lastIndex ? 1 : -1);\n' +
'    });\n' +
'  });\n' +
'\n' +
'  var cursor = document.querySelector(".cursor");\n' +
'  var cx = 0, cy = 0, tx = 0, ty = 0;\n' +
'  window.addEventListener("mousemove", function(e) { tx = e.clientX; ty = e.clientY; cursor.style.opacity = 1; });\n' +
'  window.addEventListener("mouseleave", function() { cursor.style.opacity = 0; });\n' +
'  gsap.ticker.add(function() {\n' +
'    cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;\n' +
'    cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";\n' +
'  });\n' +
'  document.querySelector(".main-content").addEventListener("mouseenter", function() { cursor.classList.add("hover"); });\n' +
'  document.querySelector(".main-content").addEventListener("mouseleave", function() { cursor.classList.remove("hover"); });\n' +
'})();\n' +
'</script>\n' +
'<script>\n' + EP.ScrollSections.curlyCursorScript('rgba(255,255,255,0.35)') + '</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'slide-observer-showcase',
        name: 'Slide Observer Showcase',
        icon: '🎚️',
        description: 'Slideshow a pantalla completa — rueda o swipe cambia de referencia con transición color↔grises, título que se pliega/despliega letra a letra, Ken Burns sutil, contador y cursor magnético "Scroll"; carrusel hero de nivel Awwwards',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/slide-animation-observer',
        build: build
    });
})();
