// Horizontal Spotlight Gallery — adapted from the gsap-collection demo
// "gallery-horizontal-scroll" (source read & understood: a pinned section
// where a filmstrip of small grayscale thumbnails scrolls horizontally
// beneath a large "spotlight" image; as each thumbnail crosses the center
// point, the spotlight image's src swaps to match — using a
// containerAnimation-scoped ScrollTrigger per thumbnail — framed by
// full-screen intro/outro text sections. Recreated with the client's own
// media list instead of 12 static stock photos).
//
// Premium pass: the original swapped the spotlight image with a blunt
// innerHTML replace (a hard cut, and no way to tell which thumbnail was
// "active" in the filmstrip — both read as unfinished). Added a genuine
// crossfade between two stacked spotlight layers, an active-thumbnail ring +
// full color pop against the dimmed grayscale strip, a running index counter,
// a section-scoped scroll progress rail, and a "Ver" cursor label on hover.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function thumbMarkup(media, i) {
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" muted playsinline data-src="' + media.url + '"></video>'
            : '<img src="' + media.url + '" data-src="' + media.url + '" alt="">';
        return '<div class="gallery-item" data-idx="' + i + '">' + inner + '<span class="gallery-item__num">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var headline = opts.headline || 'Cada scroll revela una nueva perspectiva. Recorre nuestras referencias en un flujo visual continuo.';
        var outro = opts.outro || 'Al terminar el recorrido, que estas imágenes se queden contigo — el detalle siempre cuenta una historia.';
        var itemCount = opts.itemCount || 12;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var firstUrl = media[0] ? media[0].url : '';
        var thumbsHTML = media.map(thumbMarkup).join('\n        ');
        var n = media.length || itemCount;

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Horizontal Spotlight Gallery</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#e4e0dd;color:#1a1a1a;cursor:none;}\n' +
'.site{position:absolute;top:1.5rem;right:1.5rem;font-size:0.85rem;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;}\n' +
'.intro,.outro{width:100%;height:100dvh;background:#0a0a0c;color:#ececec;display:flex;justify-content:center;align-items:flex-end;padding-bottom:3rem;position:relative;}\n' +
'.intro h1,.outro h1{max-width:70vw;font-size:clamp(1.4rem,2.6vw,2.2rem);font-weight:500;line-height:1.3;text-align:center;}\n' +
'.scrolling{width:100%;height:100dvh;position:relative;padding:2rem 3rem;overflow:hidden;}\n' +
'.wrapper-content{width:100%;height:100%;display:flex;justify-content:space-between;}\n' +
'.left-content{width:33%;}\n' +
'.title-content{line-height:1;text-transform:uppercase;letter-spacing:0.1em;font-size:clamp(1.6rem,3vw,2.6rem);font-weight:800;}\n' +
'.description-content{margin-top:1rem;font-size:1rem;font-weight:500;max-width:26ch;}\n' +
'.counter{margin-top:2rem;font-size:0.85rem;letter-spacing:0.06em;font-variant-numeric:tabular-nums;opacity:0.7;}\n' +
'.counter .cur{font-size:1.1rem;font-weight:800;}\n' +
'.right-content{width:67%;position:relative;}\n' +
'.wrapper-image{width:70%;height:70%;margin-inline:auto;border-radius:8px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.25);position:relative;background:#000;}\n' +
'.wrapper-image .layer{position:absolute;inset:0;}\n' +
'.wrapper-image img,.wrapper-image video{object-fit:contain;background:#000;}\n' +
'.list-gallery{display:flex;gap:1rem;flex-wrap:nowrap;position:absolute;bottom:2rem;left:0;padding-left:50vw;will-change:transform;}\n' +
'.gallery-item{position:relative;width:10vw;min-width:110px;aspect-ratio:4/3;filter:grayscale(1) brightness(0.75);border-radius:4px;overflow:hidden;cursor:pointer;transform:scale(1);transition:filter 0.4s ease,transform 0.4s ease,box-shadow 0.4s ease;}\n' +
'.gallery-item.active{filter:grayscale(0) brightness(1);transform:scale(1.12);box-shadow:0 0 0 2px #fff,0 20px 40px rgba(0,0,0,0.35);z-index:2;}\n' +
'.gallery-item__num{position:absolute;bottom:0.3rem;right:0.4rem;font-size:0.6rem;letter-spacing:0.05em;color:#fff;opacity:0;transition:opacity 0.3s;text-shadow:0 1px 4px rgba(0,0,0,0.8);}\n' +
'.gallery-item.active .gallery-item__num{opacity:0.9;}\n' +
'.progress-rail{position:absolute;bottom:0.9rem;left:50%;transform:translateX(-50%);width:min(50vw,500px);height:2px;background:rgba(0,0,0,0.12);border-radius:2px;overflow:hidden;}\n' +
'.progress-rail .fill{width:0%;height:100%;background:#1a1a1a;}\n' +
'.cursor{position:fixed;top:0;left:0;width:14px;height:14px;border-radius:50%;background:#1a1a1a;pointer-events:none;z-index:50;transform:translate(-50%,-50%);transition:width 0.35s cubic-bezier(0.16,1,0.3,1),height 0.35s cubic-bezier(0.16,1,0.3,1),background 0.3s;display:flex;align-items:center;justify-content:center;opacity:0;}\n' +
'.cursor span{opacity:0;font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;color:#fff;white-space:nowrap;transition:opacity 0.25s;}\n' +
'.cursor.hover{width:58px;height:58px;background:#1a1a1a;}\n' +
'.cursor.hover span{opacity:1;}\n' +
'@media (max-width:768px){.wrapper-content{flex-direction:column;} .left-content,.right-content{width:100%;} body{cursor:auto;} .cursor{display:none;}}\n' +
'@media (hover:none){body{cursor:auto;} .cursor{display:none;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="cursor"><span>Ver</span></div>\n' +
'<section class="intro">\n' +
'  <div class="site">' + title + '</div>\n' +
'  <h1>' + headline + '</h1>\n' +
'</section>\n' +
'<section class="scrolling">\n' +
'  <div class="wrapper-content">\n' +
'    <div class="left-content">\n' +
'      <h1 class="title-content">' + title + '</h1>\n' +
'      <p class="description-content">Recorre la colección deslizando — cada imagen se enfoca en grande a medida que avanza.</p>\n' +
'      <div class="counter"><span class="cur">01</span> / ' + (n < 10 ? '0' + n : n) + '</div>\n' +
'    </div>\n' +
'    <div class="right-content">\n' +
'      <div class="wrapper-image"><div class="layer layer-a"><img src="' + firstUrl + '" alt=""></div><div class="layer layer-b"></div></div>\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="list-gallery">\n' +
'        ' + thumbsHTML + '\n' +
'  </div>\n' +
'  <div class="progress-rail"><div class="fill"></div></div>\n' +
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
'  var galleryItems = gsap.utils.toArray(".gallery-item");\n' +
'  var layerA = document.querySelector(".layer-a");\n' +
'  var layerB = document.querySelector(".layer-b");\n' +
'  var frontIsA = true;\n' +
'  var containerHorizontal = document.querySelector(".list-gallery");\n' +
'  var counterCur = document.querySelector(".counter .cur");\n' +
'  var progressFill = document.querySelector(".progress-rail .fill");\n' +
'  var calculateXPercent = 50 + window.innerWidth / 50;\n' +
'  var currentIdx = -1;\n' +
'\n' +
'  var tweenContainer = gsap.to(containerHorizontal, {\n' +
'    xPercent: -calculateXPercent, ease: "none",\n' +
'    scrollTrigger: {\n' +
'      trigger: ".scrolling", start: "top top", end: "+=2000", scrub: 1, pin: true, invalidateOnRefresh: true,\n' +
'      onUpdate: function(self) { gsap.set(progressFill, { width: (self.progress * 100) + "%" }); }\n' +
'    }\n' +
'  });\n' +
'\n' +
'  function mediaMarkup(src, isVideo) {\n' +
'    return isVideo\n' +
'      ? "<video src=\\"" + src + "\\" autoplay muted loop playsinline></video>"\n' +
'      : "<img src=\\"" + src + "\\" alt=\\"\\">";\n' +
'  }\n' +
'\n' +
'  function setSpotlight(item) {\n' +
'    var idx = Number(item.getAttribute("data-idx"));\n' +
'    if (idx === currentIdx) return;\n' +
'    currentIdx = idx;\n' +
'    galleryItems.forEach(function(g) { g.classList.toggle("active", Number(g.getAttribute("data-idx")) === idx); });\n' +
'    counterCur.textContent = (idx + 1 < 10 ? "0" : "") + (idx + 1);\n' +
'\n' +
'    var media = item.querySelector("img,video");\n' +
'    var src = media.getAttribute("data-src");\n' +
'    var isVideo = media.tagName === "VIDEO";\n' +
'    var incoming = frontIsA ? layerB : layerA;\n' +
'    var outgoing = frontIsA ? layerA : layerB;\n' +
'    incoming.innerHTML = mediaMarkup(src, isVideo);\n' +
'    gsap.set(incoming, { opacity: 0, zIndex: 2 });\n' +
'    gsap.set(outgoing, { zIndex: 1 });\n' +
'    gsap.fromTo(incoming, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" });\n' +
'    gsap.to(outgoing, { opacity: 0, duration: 0.5, ease: "power2.out" });\n' +
'    frontIsA = !frontIsA;\n' +
'  }\n' +
'\n' +
'  galleryItems.forEach(function(item) {\n' +
'    ScrollTrigger.create({\n' +
'      trigger: item, start: "left center", end: "right center",\n' +
'      containerAnimation: tweenContainer,\n' +
'      onEnter: function() { setSpotlight(item); },\n' +
'      onEnterBack: function() { setSpotlight(item); },\n' +
'      invalidateOnRefresh: true\n' +
'    });\n' +
'    item.addEventListener("click", function() { setSpotlight(item); });\n' +
'  });\n' +
'  setSpotlight(galleryItems[0]);\n' +
'\n' +
'  var cursor = document.querySelector(".cursor");\n' +
'  var cx = 0, cy = 0, tx = 0, ty = 0;\n' +
'  window.addEventListener("mousemove", function(e) { tx = e.clientX; ty = e.clientY; cursor.style.opacity = 1; });\n' +
'  window.addEventListener("mouseleave", function() { cursor.style.opacity = 0; });\n' +
'  gsap.ticker.add(function() {\n' +
'    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;\n' +
'    cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";\n' +
'  });\n' +
'  galleryItems.forEach(function(item) {\n' +
'    item.addEventListener("mouseenter", function() { cursor.classList.add("hover"); });\n' +
'    item.addEventListener("mouseleave", function() { cursor.classList.remove("hover"); });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'horizontal-spotlight-gallery',
        name: 'Horizontal Spotlight Gallery',
        icon: '🎞️',
        description: 'Filmstrip horizontal fijado en pantalla — cada miniatura se enfoca en grande con crossfade suave al pasar por el centro; miniatura activa resaltada con anillo y color, contador, riel de progreso y cursor "Ver". Lookbook nivel Awwwards',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/gallery-horizontal-scroll',
        build: build
    });
})();
