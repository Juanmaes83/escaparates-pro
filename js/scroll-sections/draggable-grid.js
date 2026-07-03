// Draggable Grid — adapted from joffreysp/draggable-grid (Codrops)
// (GSAP Draggable + Flip + SplitText).
// Source read & understood: https://github.com/joffreysp/draggable-grid (MIT)
// Technique: an infinite-feeling grid of product/property cards the visitor can
// drag or wheel-scroll freely; clicking a card Flips it into a detail panel with
// SplitText char/line reveal (price, description, CTA).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var DRAGGABLE_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Draggable.min.js';
    var FLIP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Flip.min.js';
    var SPLITTEXT_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js';

    var COLUMNS = 8;
    var ROWS_PER_COLUMN = 5;

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var items = opts.items || [];
        var mediaCount = COLUMNS * ROWS_PER_COLUMN;
        var media = EP.ScrollSections.fillMedia(mediaList, mediaCount);

        function itemMeta(idx) {
            var m = media[idx % (media.length || 1)] || null;
            var custom = items[idx % (items.length || 1)] || {};
            return {
                media: m,
                title: custom.title || (m && m.name) || ('Referencia ' + (idx + 1)),
                price: custom.price || '',
                description: custom.description || 'Detalle disponible bajo pedido. Contacta para más información sobre disponibilidad y condiciones.',
                cta: custom.ctaLabel || 'Más información'
            };
        }

        // Build columns exactly like the source: 8 columns x 5 stacked media refs
        var columnsHTML = '';
        var uniqueMeta = [];
        for (var c = 0; c < COLUMNS; c++) {
            var colItems = '';
            for (var r = 0; r < ROWS_PER_COLUMN; r++) {
                var idx = (c * ROWS_PER_COLUMN + r) % mediaCount;
                var meta = itemMeta(idx);
                if (!uniqueMeta[idx]) uniqueMeta[idx] = meta;
                var mediaTag = meta.media
                    ? (meta.media.type === 'video'
                        ? '<video src="' + meta.media.url + '" autoplay muted loop playsinline></video>'
                        : '<img src="' + meta.media.url + '" alt="' + meta.title + '">')
                    : '<div class="dg-placeholder"></div>';
                colItems += '<div class="product"><div data-id="' + idx + '">' + mediaTag + '</div></div>\n            ';
            }
            columnsHTML += '<div class="column">\n            ' + colItems + '\n          </div>\n          ';
        }

        var titlesHTML = '', textsHTML = '';
        uniqueMeta.forEach(function(meta, idx) {
            if (!meta) return;
            titlesHTML += '<p data-title="' + idx + '" data-text>' + meta.title + '</p>\n          ';
            textsHTML += '' +
                '<p data-desc="' + idx + '" data-text>' +
                    (meta.price ? '<span>' + meta.price + '</span>' : '') +
                    meta.description +
                    '<button>' + meta.cta + '</button>' +
                '</p>\n          ';
        });

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Draggable Grid</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;height:100%;background:#111;color:#111;font-family:Arial,Helvetica,sans-serif;overflow:hidden;}\n' +
'.dg-title{position:fixed;top:1.5rem;left:1.5rem;z-index:7;color:#eee;font-size:0.8rem;letter-spacing:0.06em;text-transform:uppercase;opacity:0.8;}\n' +
'.line,.char{transform:translate3d(0,100%,0);}\n' +
'.container{position:fixed;width:100vw;height:100vh;top:0;left:0;transform-origin:center center;will-change:transform;}\n' +
'.grid{position:absolute;width:max-content;height:max-content;display:flex;gap:5vw;}\n' +
'.--is-loaded{overflow:hidden;}\n' +
'.--is-loaded .grid{transition:transform 0.45s cubic-bezier(0.33,1,0.68,1);cursor:grab;}\n' +
'.--is-loaded .grid.--is-dragging{cursor:grabbing;transition:none;}\n' +
'.column{display:flex;flex-direction:column;gap:5vw;}\n' +
'.column:nth-child(even){margin-top:10vw;}\n' +
'.product{position:relative;width:18.5vw;aspect-ratio:1/1;}\n' +
'.product div{width:18.5vw;aspect-ratio:1/1;position:relative;overflow:hidden;border-radius:8px;background:#e5e5e5;}\n' +
'.product img,.product video{position:absolute;width:100%;height:100%;object-fit:cover;will-change:transform;transition:transform 300ms ease-in-out;top:0;left:0;}\n' +
'.product:hover img,.product:hover video{transform:scale(1.05);}\n' +
'.dg-placeholder{width:100%;height:100%;background:#ddd;}\n' +
'.details{position:fixed;top:0;right:0;width:50vw;height:100vh;padding:3vw 4vw;background:#f1f1f1;transform:translate3d(50vw,0,0);z-index:6;overflow:auto;}\n' +
'@media (max-width:600px){.details{width:90%;transform:translate3d(90%,0,0);padding:8vw 7vw;}}\n' +
'.details__title{margin-bottom:4vw;position:relative;display:grid;}\n' +
'.details__title p{grid-area:1/-1;overflow:hidden;font-size:2.4vw;font-weight:700;}\n' +
'@media (max-width:600px){.details__title p{font-size:1.6rem;}}\n' +
'.details__body{display:flex;flex-wrap:wrap;align-items:end;gap:2vw;}\n' +
'.details__texts{position:relative;height:100%;line-height:1.5;display:grid;max-width:16rem;}\n' +
'.details__texts span{display:block;font-size:1.4rem;margin-bottom:1rem;font-weight:700;}\n' +
'.details__texts button{appearance:none;display:block;background:transparent;margin-top:1.2rem;border:1px solid #111;border-radius:1rem;padding:0.4rem 1.1rem;cursor:pointer;font-size:0.9rem;}\n' +
'.details__texts [data-text]{grid-area:1/-1;}\n' +
'.details__thumb{position:relative;width:25vw;aspect-ratio:1/1;z-index:3;will-change:transform;border-radius:8px;overflow:hidden;}\n' +
'@media (max-width:600px){.details__thumb{width:100%;}}\n' +
'.details__thumb div,.details__thumb img,.details__thumb video{position:absolute;width:100%;height:100%;object-fit:cover;top:0;left:0;}\n' +
'.cross{position:fixed;width:3vw;height:3vw;transform:translate(-50%,-50%) scale(0);z-index:5;pointer-events:none;}\n' +
'.cross svg{width:100%;height:100%;}\n' +
'.--is-details-showing{cursor:pointer;}\n' +
'.--is-details-showing .grid{pointer-events:none;}\n' +
'</style>\n' +
'</head>\n' +
'<body class="loading">\n' +
'<div class="dg-title">' + title + '</div>\n' +
'<main class="container">\n' +
'  <div class="grid">\n' +
'          ' + columnsHTML + '\n' +
'  </div>\n' +
'</main>\n' +
'<div class="details">\n' +
'  <div class="details__title">\n' +
'          ' + titlesHTML + '\n' +
'  </div>\n' +
'  <div class="details__body">\n' +
'    <div class="details__thumb"></div>\n' +
'    <div class="details__texts">\n' +
'          ' + textsHTML + '\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'<div class="cross">\n' +
'  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'    <path d="M18 6L6 18" stroke="#313131" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
'    <path d="M6 6L18 18" stroke="#313131" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
'  </svg>\n' +
'</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + DRAGGABLE_CDN + '"></script>\n' +
'<script src="' + FLIP_CDN + '"></script>\n' +
'<script src="' + SPLITTEXT_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(Draggable, Flip, SplitText);\n' +
'  function Grid() {\n' +
'    this.dom = document.querySelector(".container");\n' +
'    this.grid = document.querySelector(".grid");\n' +
'    this.products = Array.prototype.slice.call(document.querySelectorAll(".product div"));\n' +
'    this.details = document.querySelector(".details");\n' +
'    this.detailsThumb = this.details.querySelector(".details__thumb");\n' +
'    this.cross = document.querySelector(".cross");\n' +
'    this.isDragging = false;\n' +
'    this.SHOW_DETAILS = false;\n' +
'  }\n' +
'  Grid.prototype.init = function() { this.intro(); };\n' +
'  Grid.prototype.centerGrid = function() {\n' +
'    var gw = this.grid.offsetWidth, gh = this.grid.offsetHeight;\n' +
'    var cx = (window.innerWidth - gw) / 2, cy = (window.innerHeight - gh) / 2;\n' +
'    gsap.set(this.grid, { x: cx, y: cy });\n' +
'  };\n' +
'  Grid.prototype.intro = function() {\n' +
'    var self = this;\n' +
'    this.centerGrid();\n' +
'    var tl = gsap.timeline();\n' +
'    tl.set(this.dom, { scale: 0.5 });\n' +
'    tl.set(this.products, { scale: 0.5, opacity: 0 });\n' +
'    tl.to(this.products, { scale: 1, opacity: 1, duration: 0.6, ease: "power3.out", stagger: { amount: 1.2, from: "random" } });\n' +
'    tl.to(this.dom, { scale: 1, duration: 1.2, ease: "power3.inOut", onComplete: function() {\n' +
'      self.setupDraggable(); self.addEvents(); self.observeProducts(); self.handleDetails();\n' +
'    }});\n' +
'  };\n' +
'  Grid.prototype.setupDraggable = function() {\n' +
'    var self = this;\n' +
'    this.dom.classList.add("--is-loaded");\n' +
'    this.draggable = Draggable.create(this.grid, {\n' +
'      type: "x,y",\n' +
'      bounds: {\n' +
'        minX: -(this.grid.offsetWidth - window.innerWidth) - 200, maxX: 200,\n' +
'        minY: -(this.grid.offsetHeight - window.innerHeight) - 100, maxY: 100\n' +
'      },\n' +
'      inertia: true, allowEventDefault: true, edgeResistance: 0.9,\n' +
'      onDragStart: function() { self.isDragging = true; self.grid.classList.add("--is-dragging"); },\n' +
'      onDragEnd: function() { self.isDragging = false; self.grid.classList.remove("--is-dragging"); }\n' +
'    })[0];\n' +
'  };\n' +
'  Grid.prototype.addEvents = function() {\n' +
'    var self = this;\n' +
'    window.addEventListener("wheel", function(e) {\n' +
'      e.preventDefault();\n' +
'      var dX = -e.deltaX * 7, dY = -e.deltaY * 7;\n' +
'      var cx = gsap.getProperty(self.grid, "x"), cy = gsap.getProperty(self.grid, "y");\n' +
'      var nx = cx + dX, ny = cy + dY;\n' +
'      var b = self.draggable.vars.bounds;\n' +
'      var clx = Math.max(b.minX, Math.min(b.maxX, nx));\n' +
'      var cly = Math.max(b.minY, Math.min(b.maxY, ny));\n' +
'      gsap.to(self.grid, { x: clx, y: cly, duration: 0.3, ease: "power3.out" });\n' +
'    }, { passive: false });\n' +
'    window.addEventListener("resize", function() { self.updateBounds(); });\n' +
'    window.addEventListener("mousemove", function(e) { if (self.SHOW_DETAILS) self.handleCursor(e); });\n' +
'  };\n' +
'  Grid.prototype.updateBounds = function() {\n' +
'    if (!this.draggable) return;\n' +
'    this.draggable.vars.bounds = {\n' +
'      minX: -(this.grid.offsetWidth - window.innerWidth) - 50, maxX: 50,\n' +
'      minY: -(this.grid.offsetHeight - window.innerHeight) - 50, maxY: 50\n' +
'    };\n' +
'  };\n' +
'  Grid.prototype.observeProducts = function() {\n' +
'    var self = this;\n' +
'    this.observer = new IntersectionObserver(function(entries) {\n' +
'      entries.forEach(function(entry) {\n' +
'        if (entry.target === self.currentProduct) return;\n' +
'        if (entry.isIntersecting) gsap.to(entry.target, { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" });\n' +
'        else gsap.to(entry.target, { opacity: 0, scale: 0.5, duration: 0.5, ease: "power2.in" });\n' +
'      });\n' +
'    }, { root: null, threshold: 0.1 });\n' +
'    this.products.forEach(function(p) { self.observer.observe(p); });\n' +
'  };\n' +
'  Grid.prototype.handleDetails = function() {\n' +
'    var self = this;\n' +
'    this.titles = this.details.querySelectorAll(".details__title p");\n' +
'    this.texts = this.details.querySelectorAll(".details__body [data-text]");\n' +
'    new SplitText(this.titles, { type: "lines, chars", mask: "lines", charsClass: "char" });\n' +
'    new SplitText(this.texts, { type: "lines", mask: "lines", linesClass: "line" });\n' +
'    this.products.forEach(function(product) {\n' +
'      product.addEventListener("click", function(e) { e.stopPropagation(); self.showDetails(product); });\n' +
'    });\n' +
'    this.dom.addEventListener("click", function() { if (self.SHOW_DETAILS) self.hideDetails(); });\n' +
'  };\n' +
'  Grid.prototype.showDetails = function(product) {\n' +
'    var self = this;\n' +
'    if (this.SHOW_DETAILS) return;\n' +
'    this.SHOW_DETAILS = true;\n' +
'    this.details.classList.add("--is-showing");\n' +
'    this.dom.classList.add("--is-details-showing");\n' +
'    gsap.to(this.dom, { x: "-50vw", duration: 1.2, ease: "power3.inOut" });\n' +
'    gsap.to(this.details, { x: 0, duration: 1.2, ease: "power3.inOut" });\n' +
'    this.flipProduct(product);\n' +
'    var id = product.dataset.id;\n' +
'    var titleEl = this.details.querySelector(\'[data-title="\' + id + \'"]\');\n' +
'    var textEl = this.details.querySelector(\'[data-desc="\' + id + \'"]\');\n' +
'    if (titleEl) gsap.to(titleEl.querySelectorAll(".char"), { y: 0, duration: 1.1, delay: 0.4, ease: "power3.inOut", stagger: 0.025 });\n' +
'    if (textEl) gsap.to(textEl.querySelectorAll(".line"), { y: 0, duration: 1.1, delay: 0.4, ease: "power3.inOut", stagger: 0.05 });\n' +
'  };\n' +
'  Grid.prototype.hideDetails = function() {\n' +
'    var self = this;\n' +
'    this.SHOW_DETAILS = false;\n' +
'    this.dom.classList.remove("--is-details-showing");\n' +
'    gsap.to(this.dom, { x: 0, duration: 1.2, delay: 0.3, ease: "power3.inOut", onComplete: function() { self.details.classList.remove("--is-showing"); } });\n' +
'    gsap.to(this.details, { x: "50vw", duration: 1.2, delay: 0.3, ease: "power3.inOut" });\n' +
'    this.unFlipProduct();\n' +
'    this.titles.forEach(function(t) { gsap.to(t.querySelectorAll(".char"), { y: "100%", duration: 0.6, ease: "power3.inOut", stagger: { amount: 0.025, from: "end" } }); });\n' +
'    this.texts.forEach(function(t) { gsap.to(t.querySelectorAll(".line"), { y: "100%", duration: 0.6, ease: "power3.inOut", stagger: 0.05 }); });\n' +
'  };\n' +
'  Grid.prototype.flipProduct = function(product) {\n' +
'    this.currentProduct = product;\n' +
'    this.originalParent = product.parentNode;\n' +
'    var state = Flip.getState(product);\n' +
'    if (this.observer) this.observer.unobserve(product);\n' +
'    gsap.set(product, { opacity: 1, scale: 1 });\n' +
'    this.detailsThumb.appendChild(product);\n' +
'    Flip.from(state, { absolute: true, duration: 1.2, ease: "power3.inOut" });\n' +
'    gsap.to(this.cross, { scale: 1, duration: 0.4, delay: 0.5, ease: "power2.out" });\n' +
'  };\n' +
'  Grid.prototype.unFlipProduct = function() {\n' +
'    var self = this;\n' +
'    if (!this.currentProduct || !this.originalParent) return;\n' +
'    if (this.observer) this.observer.observe(this.currentProduct);\n' +
'    gsap.to(this.cross, { scale: 0, duration: 0.4, ease: "power2.out" });\n' +
'    var finalRect = this.originalParent.getBoundingClientRect();\n' +
'    var currentRect = this.currentProduct.getBoundingClientRect();\n' +
'    var thumbRect = this.detailsThumb.getBoundingClientRect();\n' +
'    gsap.set(this.currentProduct, { position: "absolute", top: (currentRect.top - thumbRect.top) + "px", left: (currentRect.left - thumbRect.left) + "px", width: currentRect.width + "px", height: currentRect.height + "px", zIndex: 10000 });\n' +
'    gsap.to(this.currentProduct, { top: (finalRect.top - thumbRect.top) + "px", left: (finalRect.left - thumbRect.left) + "px", width: finalRect.width + "px", height: finalRect.height + "px", duration: 1.2, delay: 0.3, ease: "power3.inOut", onComplete: function() {\n' +
'      self.originalParent.appendChild(self.currentProduct);\n' +
'      gsap.set(self.currentProduct, { position: "", top: "", left: "", width: "", height: "", zIndex: "" });\n' +
'      self.currentProduct = null; self.originalParent = null;\n' +
'    }});\n' +
'  };\n' +
'  Grid.prototype.handleCursor = function(e) {\n' +
'    gsap.to(this.cross, { x: e.clientX - this.cross.offsetWidth / 2, y: e.clientY - this.cross.offsetHeight / 2, duration: 0.4, ease: "power2.out" });\n' +
'  };\n' +
'  function preloadMedia() {\n' +
'    var els = Array.prototype.slice.call(document.querySelectorAll(".product img, .product video"));\n' +
'    return Promise.all(els.map(function(el) {\n' +
'      return new Promise(function(resolve) {\n' +
'        if (el.tagName === "IMG") {\n' +
'          if (el.complete && el.naturalWidth > 0) return resolve();\n' +
'          el.addEventListener("load", resolve, { once: true });\n' +
'          el.addEventListener("error", resolve, { once: true });\n' +
'        } else {\n' +
'          if (el.readyState >= 1) return resolve();\n' +
'          el.addEventListener("loadedmetadata", resolve, { once: true });\n' +
'          el.addEventListener("error", resolve, { once: true });\n' +
'        }\n' +
'      });\n' +
'    }));\n' +
'  }\n' +
'  var grid = new Grid();\n' +
'  preloadMedia().then(function() {\n' +
'    grid.init();\n' +
'    document.body.classList.remove("loading");\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'draggable-grid',
        name: 'Draggable Grid',
        icon: '🖐️',
        description: 'Grid arrastrable de fichas (imagen/vídeo) con inercia — al hacer clic, la ficha se convierte en un panel de detalle con precio, descripción y CTA mediante Flip + SplitText',
        sourceUrl: 'https://github.com/joffreysp/draggable-grid',
        build: build
    });
})();
