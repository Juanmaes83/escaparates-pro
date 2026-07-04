// Masonry Lightbox Gallery — adapted from the CodePen gist "[Web Component]
// Simple Masonry V2 + lightgallery" (source read & understood: a dependency-free
// custom element <simple-masonry> that measures each child's rendered height,
// places it in the shortest column via absolute positioning + transform
// (dense placement), and re-flows on resize/orientation-change/DOM mutation —
// paired with lightGallery for a full-screen zoomable lightbox on click).
// Recreated as a real-estate photo catalog: the masonry web component and
// lightGallery wiring are kept verbatim (self-contained, no external "utils"
// helper needed), only the demo's 55 generative-art images are swapped for
// the client's own uploaded property photos.
(function() {
    var LIGHTGALLERY_CSS = 'https://cdn.jsdelivr.net/npm/lightgallery@2.0.0-beta.3/css/lightgallery.css';
    var LIGHTGALLERY_ZOOM_CSS = 'https://cdn.jsdelivr.net/npm/lightgallery@2.0.0-beta.3/css/lg-zoom.css';
    var LIGHTGALLERY_JS = 'https://cdn.jsdelivr.net/npm/lightgallery@2.0.0-beta.3/lightgallery.umd.js';
    var LIGHTGALLERY_ZOOM_JS = 'https://cdn.jsdelivr.net/npm/lightgallery@2.0.0-beta.3/plugins/zoom/lg-zoom.umd.js';
    var ASPECTS = ['3/4', '16/9', '1/1', '5/6', '4/3', '3/2', '9/16', '2/3', '6/5'];

    function itemMarkup(media, i) {
        var ar = ASPECTS[i % ASPECTS.length];
        var label = media.name || ('Foto ' + (i + 1));
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" muted loop playsinline autoplay></video>'
            : '<a data-src="' + media.url + '" class="lightgallery" data-sub-html="<h4>' + label + '</h4>"><img src="' + media.url + '" loading="lazy" alt="' + label + '"></a>';
        return '<div class="grid-item" style="aspect-ratio:' + ar + ';">' + inner + '</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 16;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var itemsHTML = media.length
            ? media.map(itemMarkup).join('\n        ')
            : '<p style="padding:4rem;color:#888">Sube imágenes para ver la galería.</p>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Galería Masonry</title>\n' +
'<link href="' + LIGHTGALLERY_CSS + '" rel="stylesheet">\n' +
'<link href="' + LIGHTGALLERY_ZOOM_CSS + '" rel="stylesheet">\n' +
'<style>\n' +
'*,*::before,*::after{box-sizing:border-box;}\n' +
'body{background:#1c1418;color:#e8dcd4;font-family:Arial,Helvetica,sans-serif;margin:0;}\n' +
'.gallery-title{text-align:center;padding:2.5rem 1rem 0;font-size:clamp(1.4rem,3.5vw,2.2rem);}\n' +
'.wrapper{display:block;margin:2rem auto;max-width:75rem;position:relative;width:calc(100% - 2rem);}\n' +
'html.no-scroll{overflow:hidden;}\n' +
'html.no-scroll body{height:100%;overflow:hidden;position:fixed;width:100%;}\n' +
'simple-masonry{--column-count:5;--grid-gap-horizontal:1.25rem;--grid-gap-vertical:1.25rem;display:grid;position:relative;width:100%;}\n' +
'.grid-item{background:#2a1f24;overflow:hidden;position:relative;grid-area:1/-1;}\n' +
'.grid-item a{cursor:pointer;display:block;height:100%;}\n' +
'img,video{background-repeat:no-repeat;background-size:cover;border:0;display:block;height:100%;object-fit:cover;width:100%;}\n' +
'.lg-backdrop{background:#1c1418;}\n' +
'@media (max-width:75.04em){simple-masonry{--column-count:4;}}\n' +
'@media (max-width:51.3em){simple-masonry{--column-count:3;--grid-gap-horizontal:1rem;--grid-gap-vertical:1rem;}}\n' +
'@media (max-width:36em){simple-masonry{--column-count:2;--grid-gap-horizontal:.75rem;--grid-gap-vertical:.75rem;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<h1 class="gallery-title">' + title + '</h1>\n' +
'<div class="wrapper">\n' +
'  <simple-masonry id="ep-masonry" data-use-column-count="true" data-dense-placement="true" data-animate-on-resize="true" data-gap-horizontal="--grid-gap-horizontal" data-gap-vertical="--grid-gap-vertical">\n' +
'        ' + itemsHTML + '\n' +
'  </simple-masonry>\n' +
'</div>\n' +
'<script src="' + LIGHTGALLERY_JS + '"></script>\n' +
'<script src="' + LIGHTGALLERY_ZOOM_JS + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'class SimpleMasonry extends HTMLElement {\n' +
'  #columnCount = null; #elementHeights = []; #columnHeightsTracker = []; #mutationObserver; #debounceTimeout; #boundHandleResize; #width; #isTouch;\n' +
'  #config = { baseColumnWidth: 250, densePlacement: true, animateOnResize: false, observeMutations: true, animationDuration: 300, useColumnCount: false, gapHorizontal: 10, gapVertical: 10 };\n' +
'  constructor() { super(); this.#isTouch = navigator.maxTouchPoints > 0 || window.matchMedia?.("(pointer: coarse)").matches; this.#boundHandleResize = this.#handleResize.bind(this); }\n' +
'  static get observedAttributes() { return ["data-base-column-width","data-dense-placement","data-gap-horizontal","data-gap-vertical","data-animation-duration","data-use-column-count"]; }\n' +
'  attributeChangedCallback(name, oldValue, newValue) { if (oldValue === newValue) return; if (this.isConnected) { this.#width = this.clientWidth || this.getBoundingClientRect().width; this.#readAttributes(); this.#applyMasonryLayout(false, true); } }\n' +
'  connectedCallback() { this.#readAttributes(); this.#initializeObservers(); this.#width = this.clientWidth || this.getBoundingClientRect().width; requestAnimationFrame(() => { this.#applyMasonryLayout(); }); }\n' +
'  disconnectedCallback() { this.destroy(); }\n' +
'  #readAttributes() {\n' +
'    const attrs = { baseColumnWidth: "data-base-column-width", densePlacement: "data-dense-placement", animateOnResize: "data-animate-on-resize", observeMutations: "data-observe-mutations", animationDuration: "data-animation-duration", useColumnCount: "data-use-column-count", gapHorizontal: "data-gap-horizontal", gapVertical: "data-gap-vertical" };\n' +
'    for (const [key, attr] of Object.entries(attrs)) { const value = this.getAttribute(attr); if (value !== null) this.#config[key] = this.#parseAttribute(key, value); }\n' +
'  }\n' +
'  #parseAttribute(key, value) {\n' +
'    if (["baseColumnWidth","animationDuration"].includes(key)) return parseInt(value, 10);\n' +
'    if (["gapHorizontal","gapVertical"].includes(key)) return value.startsWith("--") ? value : parseInt(value, 10);\n' +
'    if (key === "useColumnCount") return value.startsWith("--") ? value : value === "true";\n' +
'    return value === "true";\n' +
'  }\n' +
'  #initializeObservers() {\n' +
'    if (this.#isTouch) window.addEventListener("orientationchange", this.#boundHandleResize); else window.addEventListener("resize", this.#boundHandleResize);\n' +
'    if (this.#config.observeMutations && !this.#mutationObserver) { this.#mutationObserver = new MutationObserver(this.#handleMutations.bind(this)); this.#mutationObserver.observe(this, { childList: true }); }\n' +
'  }\n' +
'  #handleResize() {\n' +
'    if (this.#isTouch) { this.#debouncedTouchResize(); return; }\n' +
'    if (this.#debounceTimeout) cancelAnimationFrame(this.#debounceTimeout);\n' +
'    this.#debounceTimeout = requestAnimationFrame(() => { if (this.clientWidth !== this.#width) this.#applyMasonryLayout(true); });\n' +
'  }\n' +
'  #debouncedTouchResize() {\n' +
'    if (this.#debounceTimeout) clearTimeout(this.#debounceTimeout);\n' +
'    let startWidth = window.visualViewport?.width || window.innerWidth, attempts = 0;\n' +
'    const checkResize = () => { let currentWidth = window.visualViewport?.width || window.innerWidth; if (currentWidth !== startWidth) this.#applyMasonryLayout(true); else if (attempts < 3) { attempts++; this.#debounceTimeout = setTimeout(checkResize, 50); } };\n' +
'    this.#debounceTimeout = setTimeout(checkResize, 50);\n' +
'  }\n' +
'  #handleMutations(mutationsList) {\n' +
'    let layoutChanged = false;\n' +
'    for (const mutation of mutationsList) { if (mutation.type === "childList" && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) { layoutChanged = true; break; } }\n' +
'    if (layoutChanged) { if (this.#debounceTimeout) cancelAnimationFrame(this.#debounceTimeout); this.#debounceTimeout = requestAnimationFrame(() => { this.#applyMasonryLayout(false, true); }); }\n' +
'  }\n' +
'  #applyMasonryLayout(isResize = false, isNewItem = false) {\n' +
'    const previousColumnCount = this.#columnCount;\n' +
'    this.#reset();\n' +
'    const gapHorizontal = this.#getGapValue(this.#config.gapHorizontal);\n' +
'    this.#columnCount = this.#getColumnCount(this.#config.baseColumnWidth, gapHorizontal);\n' +
'    if (this.#columnCount < 1) return;\n' +
'    const gapVertical = this.#getGapValue(this.#config.gapVertical);\n' +
'    const columnWidth = Math.max(0, (this.#width + gapHorizontal) / this.#columnCount - gapHorizontal);\n' +
'    this.#columnHeightsTracker = new Array(this.#columnCount).fill(0);\n' +
'    this.#elementHeights.length = 0;\n' +
'    const children = Array.from(this.children);\n' +
'    let childrenLength = children.length, i = 0;\n' +
'    for (; i < childrenLength; i++) children[i].style.width = `${columnWidth}px`;\n' +
'    this.offsetHeight;\n' +
'    i = 0;\n' +
'    for (; i < childrenLength; i++) this.#elementHeights[i] = children[i].clientHeight || 0;\n' +
'    const totalItemWidth = this.#columnCount * (columnWidth + gapHorizontal) - gapHorizontal;\n' +
'    let initialLeft = 0;\n' +
'    if (this.#columnCount > childrenLength) initialLeft = Math.max(0, (this.#width - totalItemWidth) / 2);\n' +
'    let nextColumn, x, y; i = 0;\n' +
'    requestAnimationFrame(() => {\n' +
'      for (; i < childrenLength; i++) {\n' +
'        const child = children[i];\n' +
'        nextColumn = this.#config.densePlacement ? this.#getShortestColumn() : this.#getNextColumn(i);\n' +
'        x = Math.round(initialLeft + (columnWidth + gapHorizontal) * nextColumn);\n' +
'        y = Math.round(this.#columnHeightsTracker[nextColumn]);\n' +
'        child.style.transform = `translate(${x}px, ${y}px)`;\n' +
'        this.#columnHeightsTracker[nextColumn] += (this.#elementHeights[i] || 0) + gapVertical;\n' +
'      }\n' +
'      this.style.height = `${this.#columnHeightsTracker[this.#getTallestColumn()] - gapVertical}px`;\n' +
'      if (!this.#isTouch) { const transitionStyle = isResize && this.#config.animateOnResize ? `transform ${this.#config.animationDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)` : "none"; i = 0; for (; i < childrenLength; i++) children[i].style.transition = transitionStyle; }\n' +
'    });\n' +
'  }\n' +
'  #getGapValue(gap) { if (typeof gap === "string" && gap.startsWith("--")) return this.#getCssVariableValue(this, gap, true) ?? 0; return parseInt(gap, 10) || 0; }\n' +
'  #getCssVariableValue(el, varName, parseAsNumber = false) {\n' +
'    const computedStyle = window.getComputedStyle(el);\n' +
'    const value = computedStyle.getPropertyValue(varName)?.trim();\n' +
'    if (!value) return parseAsNumber ? 0 : "";\n' +
'    if (parseAsNumber) { const match = value.match(/^([\\d.]+)(px|em|rem|%)?$/); if (!match) return 0; let numericValue = parseFloat(match[1]); const unit = match[2] || "px"; if (unit === "em") numericValue *= parseFloat(computedStyle.fontSize); else if (unit === "rem") numericValue *= parseFloat(getComputedStyle(document.documentElement).fontSize); else if (unit === "%") numericValue = (numericValue / 100) * this.#width; return isNaN(numericValue) ? 0 : numericValue; }\n' +
'    return value;\n' +
'  }\n' +
'  #getColumnCount(baseWidth, gapHorizontal) { let columnCount = this.#resolveColumnCount(); if (columnCount !== null && columnCount > 0) return Math.max(1, columnCount); return Math.max(1, Math.floor((this.#width + gapHorizontal) / (baseWidth + gapHorizontal))); }\n' +
'  #resolveColumnCount() { if (typeof this.#config.useColumnCount === "string") return this.#getCssVariableValue(this, this.#config.useColumnCount, true); else if (this.#config.useColumnCount === true) return this.#getCssVariableValue(this, "--column-count", true); return null; }\n' +
'  #reset() { this.#width = this.clientWidth; this.#elementHeights.length = 0; this.#columnHeightsTracker.fill(0); }\n' +
'  #getNextColumn(index) { return this.#columnHeightsTracker.length ? index % this.#columnHeightsTracker.length : 0; }\n' +
'  #getShortestColumn() { if (!this.#columnHeightsTracker.length) return 0; let minIndex = 0, minHeight = this.#columnHeightsTracker[0]; for (let i = 1; i < this.#columnHeightsTracker.length; i++) { if (this.#columnHeightsTracker[i] < minHeight) { minHeight = this.#columnHeightsTracker[i]; minIndex = i; } } return minIndex; }\n' +
'  #getTallestColumn() { if (!this.#columnHeightsTracker.length) return 0; let maxIndex = 0, maxHeight = this.#columnHeightsTracker[0]; for (let i = 1; i < this.#columnHeightsTracker.length; i++) { if (this.#columnHeightsTracker[i] > maxHeight) { maxHeight = this.#columnHeightsTracker[i]; maxIndex = i; } } return maxIndex; }\n' +
'  destroy() {\n' +
'    if (this.#config.observeMutations && this.#mutationObserver) { this.#mutationObserver.disconnect(); this.#mutationObserver = null; }\n' +
'    if (this.#isTouch) window.removeEventListener("orientationchange", this.#boundHandleResize); else window.removeEventListener("resize", this.#boundHandleResize);\n' +
'    Array.from(this.children).forEach(c => c.style.cssText = "");\n' +
'    this.style.removeProperty("height"); this.#elementHeights.length = 0; this.#columnHeightsTracker.length = 0; this.#columnCount = null;\n' +
'  }\n' +
'}\n' +
'customElements.define("simple-masonry", SimpleMasonry);\n' +
'document.addEventListener("DOMContentLoaded", () => {\n' +
'  const masonry = document.getElementById("ep-masonry");\n' +
'  if (!masonry) return;\n' +
'  let galleryInstance = null;\n' +
'  masonry.addEventListener("lgInit", (event) => {\n' +
'    galleryInstance = event.detail.instance;\n' +
'    galleryInstance.LGel.on("lgBeforeOpen", () => document.documentElement.classList.add("no-scroll"));\n' +
'    galleryInstance.LGel.on("lgAfterClose", () => document.documentElement.classList.remove("no-scroll"));\n' +
'  });\n' +
'  window.lightGallery(masonry, { selector: ".lightgallery", plugins: [lgZoom], zoomFromOrigin: false, mode: "lg-fade", actualSize: true, infiniteZoom: false, mobileSettings: { controls: false, showCloseIcon: false, download: false, rotate: false } });\n' +
'});\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'masonry-lightbox-gallery',
        name: 'Galería Masonry + Lightbox',
        icon: '🖼️',
        description: 'Web component de galería masonry sin dependencias (mide alturas reales y coloca cada foto en la columna más corta, se reordena solo al redimensionar) con lightbox de zoom al hacer clic — catálogo de fotos de propiedades',
        sourceUrl: 'https://gist.github.com/Juanmaes83/711a6880988440a996060d2171b8834b',
        build: build
    });
})();
