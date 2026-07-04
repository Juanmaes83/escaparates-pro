// Keyhole Scroll Slideshow — adapted from the CodePen gist "GSAP Scroll-Synced
// Image Slideshow with Timed Cues and Keyhole Effect" (source read & understood:
// a pinned, scroll-scrubbed image sequence where only one image is visible at a
// time based on data-start/data-end cue ranges, overlay captions cross-fade in
// sync with the active image, a polygon clip-path "keyhole" expands to reveal
// the sequence as it's scrolled into view and collapses again on the way out,
// and a side track renders time markers + cue start/end markers. Reimplemented
// with the platform's standard GSAP + ScrollTrigger + ScrollSmoother stack
// (dropping the source's external "utils-v3" helper library in favour of a
// handful of inlined equivalents) and real-estate room-by-room copy instead of
// the source's abstract art sequence.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var SCROLLSMOOTHER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollSmoother.min.js';
    var CUE_SPAN = 2; // seconds of "on screen" time each image cue occupies

    function imgMarkup(media, i, start, end) {
        var inner = media.type === 'video'
            ? '<video class="seq-img" data-start="' + start + '"' + (end !== null ? ' data-end="' + end + '"' : '') + ' data-src="' + media.url + '" muted loop playsinline></video>'
            : '<img class="seq-img" data-start="' + start + '"' + (end !== null ? ' data-end="' + end + '"' : '') + ' data-src="' + media.url + '" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'1\' height=\'1\'%3E%3C/svg%3E" alt="">';
        return inner;
    }

    function cueMarkup(cue, start, end) {
        return '' +
'<div class="seq-overlay" data-start="' + start + '" data-end="' + end + '">\n' +
'  <div class="seq-overlay-inner"><h2>' + cue.h2 + '</h2><p>' + cue.p + '</p></div>\n' +
'</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var cues = (opts.cues && opts.cues.length ? opts.cues : [
            { title: 'Recibidor', year: 'Primera Impresión' },
            { title: 'Salón', year: 'Luz y Amplitud' },
            { title: 'Cocina', year: 'Diseño y Funcionalidad' },
            { title: 'Dormitorio Principal', year: 'Descanso y Calma' },
            { title: 'Baño', year: 'Materiales Nobles' },
            { title: 'Terraza', year: 'Vistas Abiertas' }
        ]).map(function(c) { return { h2: c.title || '', p: c.year || '' }; });
        var media = EP.ScrollSections.fillMedia(mediaList, cues.length);
        var n = media.length;
        var duration = n * CUE_SPAN;

        var imgsHTML = '', cuesHTML = '';
        for (var i = 0; i < n; i++) {
            var start = i === 0 ? -0.5 : i * CUE_SPAN;
            var end = i === n - 1 ? null : (i + 1) * CUE_SPAN;
            imgsHTML += imgMarkup(media[i], i, start, end) + '\n          ';
            cuesHTML += cueMarkup(cues[i], (i * CUE_SPAN) + 0.3, (i * CUE_SPAN) + CUE_SPAN - 0.2) + '\n          ';
        }

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Recorrido con Mirilla</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
'body{background:#241014;color:#f5e6e0;font-family:Arial,Helvetica,sans-serif;line-height:1.5;min-height:100vh;}\n' +
'section.intro,section.indicator{margin:3rem auto;max-width:56.25rem;width:calc(100% - 2rem);}\n' +
'section.intro h1{font-size:clamp(1.6rem,4vw,2.6rem);margin-bottom:1rem;}\n' +
'section.intro p{opacity:0.75;margin-bottom:0.5rem;}\n' +
'section.indicator{text-align:center;font-size:1.4rem;opacity:0.6;}\n' +
'section:has(.seq-wrapper){padding:3rem 0;}\n' +
'.seq-wrapper{margin-inline:auto;max-width:64rem;position:relative;width:calc(100% - 2rem);--border-radius:clamp(0.5rem,1.5vh,1.5rem);}\n' +
'.seq-pin-container{aspect-ratio:16/9;display:grid;max-height:100vh;overflow:hidden;position:relative;width:100%;border-radius:8px;}\n' +
'@media (max-width:51.3em){.seq-pin-container{aspect-ratio:4/3;}}\n' +
'@media (max-width:36em){.seq-pin-container{aspect-ratio:1/1;}}\n' +
'.seq-img-layer,.seq-overlay-layer,.seq-keyhole-layer{display:grid;grid-area:1/-1;height:100%;position:relative;width:100%;}\n' +
'.seq-img-layer{z-index:1;}\n' +
'.seq-img-layer::after{content:"";display:block;grid-area:1/-1;height:100%;width:100%;background:linear-gradient(-90deg,transparent,rgba(17,17,17,0.85));pointer-events:none;position:relative;z-index:5;}\n' +
'.seq-img{grid-area:1/-1;height:100%;width:100%;object-fit:cover;display:block;opacity:0;}\n' +
'.seq-overlay-layer{z-index:2;}\n' +
'.seq-overlay{display:grid;grid-area:1/-1;height:100%;width:100%;position:relative;}\n' +
'.seq-overlay-inner{align-items:center;display:flex;flex-direction:column;justify-content:center;height:100%;width:100%;opacity:0;padding:1rem;text-align:center;pointer-events:none;}\n' +
'.seq-overlay-inner h2{font-size:clamp(1.6rem,4vw,2.8rem);font-weight:400;color:#fff;text-shadow:0.125rem 0.125rem 0.25rem rgba(0,0,0,0.5);margin-bottom:0.35em;}\n' +
'.seq-overlay-inner p{opacity:0.85;}\n' +
'.seq-preloader-layer{background:#000;display:block;grid-area:1/-1;pointer-events:none;position:relative;transition:opacity .35s ease;z-index:3;}\n' +
'.seq-keyhole-layer{z-index:4;}\n' +
'.seq-keyhole{background:#1a0d10;clip-path:polygon(0 0,0 100%,0 100%,0 0,100% 0,100% 100%,0 100%,0 100%,100% 100%,100% 0);height:100%;position:relative;width:100%;display:block;grid-area:1/-1;pointer-events:none;}\n' +
'.seq-keyhole-corner{--kc-bg:#1a0d10;height:var(--border-radius);position:absolute;width:var(--border-radius);display:block;grid-area:1/-1;pointer-events:none;}\n' +
'.seq-keyhole-corner.top-left{margin-top:-0.03rem;margin-left:-0.03rem;background:radial-gradient(circle at bottom right,transparent calc(var(--border-radius) - 0.06rem),var(--kc-bg) var(--border-radius));}\n' +
'.seq-keyhole-corner.top-right{margin-top:-0.03rem;margin-left:calc(-1 * var(--border-radius) + 0.03rem);background:radial-gradient(circle at bottom left,transparent calc(var(--border-radius) - 0.06rem),var(--kc-bg) var(--border-radius));}\n' +
'.seq-keyhole-corner.bottom-left{margin-top:calc(-1 * var(--border-radius) + 0.03rem);margin-left:-0.03rem;background:radial-gradient(circle at top right,transparent calc(var(--border-radius) - 0.06rem),var(--kc-bg) var(--border-radius));}\n' +
'.seq-keyhole-corner.bottom-right{margin-top:calc(-1 * var(--border-radius) + 0.03rem);margin-left:calc(-1 * var(--border-radius) + 0.03rem);background:radial-gradient(circle at top left,transparent calc(var(--border-radius) - 0.06rem),var(--kc-bg) var(--border-radius));}\n' +
'.seq-track{display:block;height:var(--track-height,100vh);margin-top:var(--track-offset-y,-100vh);pointer-events:none;position:relative;width:100%;}\n' +
'.seq-track-markers{inset:0;pointer-events:none;position:absolute;}\n' +
'.seq-track-time-marker{border-top:thin dashed #f5e6e0;color:#f5e6e0;font-size:0.625rem;left:0;padding-right:0.25rem;position:absolute;text-align:right;width:100%;opacity:0.4;}\n' +
'.seq-track-overlay-marker{align-items:center;display:flex;height:0.0625rem;left:0;position:absolute;width:100%;}\n' +
'.seq-track-overlay-marker.start{background-color:#2ecc71;}\n' +
'.seq-track-overlay-marker.end{background-color:#e74c3c;}\n' +
'.spacer{display:block;height:60vh;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<section class="intro"><h1>' + title + '</h1><p>Un recorrido guiado por el scroll, estancia a estancia.</p></section>\n' +
'<section class="indicator">Desliza ↓</section>\n' +
'<section>\n' +
'  <div id="scrub_01" class="seq-wrapper" data-duration="' + duration + '">\n' +
'    <div class="seq-pin-container">\n' +
'      <div class="seq-img-layer">\n' +
'          ' + imgsHTML + '\n' +
'      </div>\n' +
'      <div class="seq-overlay-layer">\n' +
'          ' + cuesHTML + '\n' +
'      </div>\n' +
'      <div class="seq-preloader-layer"></div>\n' +
'      <div class="seq-keyhole-layer">\n' +
'        <div class="seq-keyhole"></div>\n' +
'        <div class="seq-keyhole-corner top-left"></div>\n' +
'        <div class="seq-keyhole-corner top-right"></div>\n' +
'        <div class="seq-keyhole-corner bottom-left"></div>\n' +
'        <div class="seq-keyhole-corner bottom-right"></div>\n' +
'      </div>\n' +
'    </div>\n' +
'    <div class="seq-track"><div class="seq-track-markers"></div></div>\n' +
'  </div>\n' +
'</section>\n' +
'<section class="indicator">↑ Fin del recorrido</section>\n' +
'<section><div class="spacer"></div></section>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + SCROLLSMOOTHER_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);\n' +
'  var isTouch = "ontouchstart" in window;\n' +
'  if (!isTouch) {\n' +
'    ScrollSmoother.create({ smooth: 1.4, effects: false, normalizeScroll: true });\n' +
'  }\n' +
'\n' +
'  var container = document.getElementById("scrub_01");\n' +
'  var pinContainer = container.querySelector(".seq-pin-container");\n' +
'  var imageLayer = container.querySelector(".seq-img-layer");\n' +
'  var preloaderLayer = container.querySelector(".seq-preloader-layer");\n' +
'  var keyholeMask = container.querySelector(".seq-keyhole");\n' +
'  var corners = {\n' +
'    topLeft: pinContainer.querySelector(".top-left"),\n' +
'    topRight: pinContainer.querySelector(".top-right"),\n' +
'    bottomLeft: pinContainer.querySelector(".bottom-left"),\n' +
'    bottomRight: pinContainer.querySelector(".bottom-right")\n' +
'  };\n' +
'  var trackEl = container.querySelector(".seq-track");\n' +
'  var trackMarkers = trackEl.querySelector(".seq-track-markers");\n' +
'  var timelineDuration = parseFloat(container.getAttribute("data-duration")) || 1;\n' +
'\n' +
'  var imageItems = Array.prototype.map.call(imageLayer.querySelectorAll(".seq-img"), function(el) {\n' +
'    var end = el.getAttribute("data-end");\n' +
'    gsap.set(el, { opacity: 0 });\n' +
'    return { el: el, start: parseFloat(el.getAttribute("data-start")), end: end === null ? null : parseFloat(end), loaded: false, loading: false };\n' +
'  });\n' +
'  var overlayCueItems = Array.prototype.map.call(container.querySelectorAll(".seq-overlay"), function(el) {\n' +
'    return { container: el, inner: el.querySelector(".seq-overlay-inner"), start: parseFloat(el.getAttribute("data-start")), end: parseFloat(el.getAttribute("data-end")), active: false };\n' +
'  });\n' +
'\n' +
'  var activeImageIndex = -1, preloaderRemoved = false;\n' +
'\n' +
'  function preloadImage(item, cb) {\n' +
'    if (item.loaded) { if (cb) cb(); return; }\n' +
'    item.loading = true;\n' +
'    var mediaEl = item.el;\n' +
'    if (mediaEl.dataset.src) mediaEl.src = mediaEl.dataset.src;\n' +
'    var done = function() { item.loaded = true; item.loading = false; if (cb) cb(); };\n' +
'    if (mediaEl.tagName === "VIDEO") {\n' +
'      mediaEl.addEventListener("loadeddata", done, { once: true });\n' +
'      mediaEl.addEventListener("error", done, { once: true });\n' +
'      mediaEl.play().catch(function() {});\n' +
'    } else if (mediaEl.complete && mediaEl.naturalWidth !== 0) {\n' +
'      done();\n' +
'    } else {\n' +
'      mediaEl.addEventListener("load", done, { once: true });\n' +
'      mediaEl.addEventListener("error", done, { once: true });\n' +
'    }\n' +
'  }\n' +
'\n' +
'  function removePreloaderOnce() {\n' +
'    if (preloaderRemoved || !preloaderLayer) return;\n' +
'    preloaderRemoved = true;\n' +
'    preloaderLayer.style.opacity = "0";\n' +
'    setTimeout(function() { if (preloaderLayer.parentNode) preloaderLayer.parentNode.removeChild(preloaderLayer); }, 350);\n' +
'  }\n' +
'\n' +
'  function updateImage(targetIndex) {\n' +
'    if (targetIndex === activeImageIndex) return;\n' +
'    var prev = imageItems[activeImageIndex];\n' +
'    var next = imageItems[targetIndex];\n' +
'    if (prev) {\n' +
'      gsap.killTweensOf(prev.el);\n' +
'      gsap.to(prev.el, { opacity: 0, duration: 0.5, ease: "power2.inOut" });\n' +
'    }\n' +
'    gsap.killTweensOf(next.el);\n' +
'    next.el.style.zIndex = "1";\n' +
'    gsap.to(next.el, { opacity: 1, duration: 0.8, ease: "power2.out" });\n' +
'    activeImageIndex = targetIndex;\n' +
'    if (!preloaderRemoved) setTimeout(removePreloaderOnce, 250);\n' +
'  }\n' +
'\n' +
'  function findMatchingImageIndex(time) {\n' +
'    for (var i = 0; i < imageItems.length; i++) {\n' +
'      if (imageItems[i].start > time) return i - 1;\n' +
'    }\n' +
'    return imageItems.length - 1;\n' +
'  }\n' +
'\n' +
'  function activateMatchedImage(index) {\n' +
'    var matched = imageItems[index];\n' +
'    if (!matched.loaded && !matched.loading) preloadImage(matched, function() { updateImage(index); });\n' +
'    else updateImage(index);\n' +
'  }\n' +
'\n' +
'  var scrollDirection = "down", lastProgress = 0;\n' +
'\n' +
'  function updateOverlayCues(progress) {\n' +
'    var currentTime = progress * timelineDuration;\n' +
'    var isDown = scrollDirection === "down";\n' +
'    var yIn = isDown ? 50 : -50, yOut = isDown ? -50 : 50;\n' +
'    var activeCue = null;\n' +
'    for (var i = 0; i < overlayCueItems.length; i++) {\n' +
'      var c = overlayCueItems[i];\n' +
'      if (currentTime >= c.start && currentTime < c.end) { activeCue = c; break; }\n' +
'    }\n' +
'    overlayCueItems.forEach(function(c) {\n' +
'      if (c === activeCue) {\n' +
'        if (!c.active) {\n' +
'          c.active = true;\n' +
'          gsap.set(c.inner, { opacity: 0, y: yIn });\n' +
'          gsap.to(c.inner, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", overwrite: true });\n' +
'        }\n' +
'      } else if (c.active) {\n' +
'        c.active = false;\n' +
'        gsap.killTweensOf(c.inner);\n' +
'        gsap.to(c.inner, { opacity: 0, y: yOut, duration: 0.3, ease: "power1.inOut", overwrite: true });\n' +
'      }\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function renderTrackMarkers() {\n' +
'    var trackHeight = trackEl.offsetHeight;\n' +
'    var pinHeight = pinContainer.offsetHeight;\n' +
'    var scrollableHeight = trackHeight - pinHeight;\n' +
'    var pinOffset = pinHeight / 2;\n' +
'    trackMarkers.innerHTML = "";\n' +
'    var frag = document.createDocumentFragment();\n' +
'    var seconds = Math.floor(timelineDuration);\n' +
'    for (var i = 0; i <= seconds; i++) {\n' +
'      var offset = (i / timelineDuration) * scrollableHeight + pinOffset;\n' +
'      var marker = document.createElement("div");\n' +
'      marker.className = "seq-track-time-marker";\n' +
'      marker.style.top = offset + "px";\n' +
'      marker.textContent = i + "s";\n' +
'      frag.appendChild(marker);\n' +
'    }\n' +
'    overlayCueItems.forEach(function(item) {\n' +
'      [["start","start"],["end","end"]].forEach(function(pair) {\n' +
'        var time = item[pair[0]];\n' +
'        var offset = (time / timelineDuration) * scrollableHeight + pinOffset;\n' +
'        var marker = document.createElement("div");\n' +
'        marker.className = "seq-track-overlay-marker " + pair[1];\n' +
'        marker.style.top = offset + "px";\n' +
'        frag.appendChild(marker);\n' +
'      });\n' +
'    });\n' +
'    trackMarkers.appendChild(frag);\n' +
'  }\n' +
'\n' +
'  function updateTrack() {\n' +
'    var pinHeight = pinContainer.offsetHeight;\n' +
'    var totalHeight = pinHeight * timelineDuration * 1.5;\n' +
'    trackEl.style.setProperty("--track-offset-y", "-" + pinHeight + "px");\n' +
'    trackEl.style.setProperty("--track-height", (totalHeight - pinHeight) + "px");\n' +
'    renderTrackMarkers();\n' +
'  }\n' +
'\n' +
'  var keyholeInner = 65, keyholeOuter = 100 - keyholeInner;\n' +
'  function polyCollapsed(inner) {\n' +
'    var outer = 100 - inner;\n' +
'    return "polygon(0% 0%,0% 100%," + outer + "% 100%," + outer + "% " + outer + "%," + inner + "% " + outer + "%," + inner + "% " + inner + "%," + outer + "% " + inner + "%," + outer + "% 100%,100% 100%,100% 0%)";\n' +
'  }\n' +
'  var polyRevealed = "polygon(0% 0%,0% 100%,0% 100%,0% 0%,100% 0%,100% 100%,0% 100%,0% 100%,100% 100%,100% 0%)";\n' +
'\n' +
'  gsap.fromTo(keyholeMask, { clipPath: polyCollapsed(keyholeInner) }, {\n' +
'    clipPath: polyRevealed, ease: "none",\n' +
'    scrollTrigger: { trigger: pinContainer, scrub: true, start: "top 100%", end: "center 50%" }\n' +
'  });\n' +
'  ["topLeft","topRight","bottomLeft","bottomRight"].forEach(function(key) {\n' +
'    var from = { topLeft: { top: keyholeOuter + "%", left: keyholeOuter + "%" }, topRight: { top: keyholeOuter + "%", left: keyholeInner + "%" }, bottomLeft: { top: keyholeInner + "%", left: keyholeOuter + "%" }, bottomRight: { top: keyholeInner + "%", left: keyholeInner + "%" } }[key];\n' +
'    var to = { topLeft: { top: "0%", left: "0%" }, topRight: { top: "0%", left: "100%" }, bottomLeft: { top: "100%", left: "0%" }, bottomRight: { top: "100%", left: "100%" } }[key];\n' +
'    gsap.fromTo(corners[key], from, { ...to, ease: "none", scrollTrigger: { trigger: pinContainer, scrub: true, start: "top 100%", end: "center 50%" } });\n' +
'  });\n' +
'  gsap.fromTo(keyholeMask, { clipPath: polyRevealed }, {\n' +
'    clipPath: function() { return polyCollapsed(keyholeInner); }, ease: "none", immediateRender: false,\n' +
'    scrollTrigger: { trigger: pinContainer, scrub: true, start: "center 50%", end: "bottom 0%" }\n' +
'  });\n' +
'\n' +
'  ScrollTrigger.create({\n' +
'    trigger: pinContainer,\n' +
'    pin: pinContainer,\n' +
'    start: "center 50%",\n' +
'    end: function() { updateTrack(); return "+=" + (trackEl.offsetHeight - pinContainer.offsetHeight); },\n' +
'    scrub: true,\n' +
'    pinSpacing: false,\n' +
'    invalidateOnRefresh: true,\n' +
'    onUpdate: function(self) {\n' +
'      var progress = self.progress;\n' +
'      scrollDirection = progress > lastProgress ? "down" : "up";\n' +
'      lastProgress = progress;\n' +
'      var currentTime = progress * timelineDuration;\n' +
'      var matchedIndex = findMatchingImageIndex(currentTime);\n' +
'      if (matchedIndex !== -1) activateMatchedImage(matchedIndex);\n' +
'      updateOverlayCues(progress);\n' +
'    }\n' +
'  });\n' +
'\n' +
'  activateMatchedImage(0);\n' +
'  setTimeout(function() { updateTrack(); ScrollTrigger.refresh(); }, 300);\n' +
'  window.addEventListener("resize", function() { setTimeout(function() { updateTrack(); ScrollTrigger.refresh(); }, 150); });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'keyhole-scroll-slideshow',
        name: 'Recorrido con Mirilla',
        icon: '🔑',
        description: 'Slideshow sincronizado al scroll con revelado tipo "mirilla" (clip-path que se expande y se contrae) y texto superpuesto que cambia por estancia; barra lateral con marcadores de tiempo — ideal como tour cinematográfico de una vivienda',
        sourceUrl: 'https://gist.github.com/Juanmaes83/e85c14dfafd12cf96e6af3104407707f',
        build: build
    });
})();
