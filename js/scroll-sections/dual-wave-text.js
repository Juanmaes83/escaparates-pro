// Dual Wave Text Animation — adapted from ValentinDBS's "codrops-tutorial-text-animation"
// (source read & understood: DualWaveAnimation.js, dual-wave variant).
// Technique: two columns of stacked words oscillate horizontally in a sine
// wave as the user scrolls (mirrored left/right), and a floating thumbnail
// image tracks whichever word row is closest to the viewport center —
// perfect for a scrolling list of properties/products with a live preview.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var wordsRaw = (opts.words && opts.words.length) ? opts.words : [
            'Diseño', 'Presencia', 'Impacto', 'Marca', 'Premium', 'Escaparate',
            'Detalle', 'Luz', 'Espacio', 'Forma', 'Textura', 'Enfoque'
        ];
        var media = EP.ScrollSections.fillMedia(mediaList, wordsRaw.length);
        var hasMedia = media.length > 0;

        var leftHTML = '', rightHTML = '';
        wordsRaw.forEach(function(word, i) {
            var imgAttr = hasMedia ? ' data-image="' + media[i % media.length].url + '"' : '';
            leftHTML += '<div class="animated-text"' + imgAttr + '>' + word + '</div>\n        ';
            rightHTML += '<div class="animated-text">' + word + '</div>\n        ';
        });

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Dual Wave Text</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;background:#08080a;color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;overflow-x:hidden;}\n' +
'.dw-title{position:fixed;top:1.5rem;left:1.5rem;z-index:6;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;}\n' +
'.spacer{height:40vh;}\n' +
'.wrapper{position:relative;padding:10vh 0;}\n' +
'.wave-columns{display:flex;justify-content:space-between;gap:4vw;padding:0 6vw;}\n' +
'.wave-column-left,.wave-column-right{flex:1;display:flex;flex-direction:column;gap:2.2vh;}\n' +
'.animated-text{font-size:clamp(1.4rem,3.4vw,2.6rem);font-weight:800;text-transform:uppercase;white-space:nowrap;opacity:0.35;transition:opacity 0.3s,color 0.3s;will-change:transform;}\n' +
'.animated-text.focused{opacity:1;color:#ffd166;}\n' +
'.image-thumbnail{position:fixed;top:0;right:6vw;width:min(22vw,300px);aspect-ratio:4/5;object-fit:cover;border-radius:14px;box-shadow:0 30px 70px rgba(0,0,0,0.6);pointer-events:none;z-index:5;opacity:0.95;}\n' +
'@media (max-width:900px){.image-thumbnail{display:none;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="dw-title">' + title + '</div>\n' +
'<div class="spacer"></div>\n' +
'<div class="wrapper" id="dw-wrapper">\n' +
'  <div class="wave-columns">\n' +
'    <div class="wave-column-left">\n' +
'        ' + leftHTML + '\n' +
'    </div>\n' +
'    <div class="wave-column-right">\n' +
'        ' + rightHTML + '\n' +
'    </div>\n' +
'  </div>\n' +
'  ' + (hasMedia ? '<img class="image-thumbnail" src="' + media[0].url + '" alt="">' : '') + '\n' +
'</div>\n' +
'<div class="spacer"></div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger);\n' +
'\n' +
'  function DualWaveAnimation(wrapper, options) {\n' +
'    options = options || {};\n' +
'    this.wrapper = wrapper instanceof Element ? wrapper : document.querySelector(wrapper);\n' +
'    var waveNumber = this.wrapper && this.wrapper.dataset.waveNumber ? parseFloat(this.wrapper.dataset.waveNumber) : 2;\n' +
'    var waveSpeed = this.wrapper && this.wrapper.dataset.waveSpeed ? parseFloat(this.wrapper.dataset.waveSpeed) : 1;\n' +
'    this.config = Object.assign({ waveNumber: waveNumber, waveSpeed: waveSpeed }, options);\n' +
'    this.currentImage = null;\n' +
'  }\n' +
'\n' +
'  DualWaveAnimation.prototype.init = function() {\n' +
'    if (!this.wrapper) return;\n' +
'    this.leftColumn = this.wrapper.querySelector(".wave-column-left");\n' +
'    this.rightColumn = this.wrapper.querySelector(".wave-column-right");\n' +
'    if (!this.leftColumn || !this.rightColumn) return;\n' +
'    this.setupAnimation();\n' +
'  };\n' +
'\n' +
'  DualWaveAnimation.prototype.setupAnimation = function() {\n' +
'    var self = this;\n' +
'    this.leftTexts = gsap.utils.toArray(this.leftColumn.querySelectorAll(".animated-text"));\n' +
'    this.rightTexts = gsap.utils.toArray(this.rightColumn.querySelectorAll(".animated-text"));\n' +
'    this.thumbnail = this.wrapper.querySelector(".image-thumbnail");\n' +
'    if (this.leftTexts.length === 0 || this.rightTexts.length === 0) return;\n' +
'\n' +
'    this.leftQuickSetters = this.leftTexts.map(function(text) { return gsap.quickTo(text, "x", { duration: 0.6, ease: "power4.out" }); });\n' +
'    this.rightQuickSetters = this.rightTexts.map(function(text) { return gsap.quickTo(text, "x", { duration: 0.6, ease: "power4.out" }); });\n' +
'\n' +
'    this.calculateRanges();\n' +
'    this.setInitialPositions(this.leftTexts, this.leftRange, 1);\n' +
'    this.setInitialPositions(this.rightTexts, this.rightRange, -1);\n' +
'    this.setupScrollTrigger();\n' +
'\n' +
'    this.resizeHandler = function() { self.calculateRanges(); };\n' +
'    window.addEventListener("resize", this.resizeHandler);\n' +
'  };\n' +
'\n' +
'  DualWaveAnimation.prototype.calculateRanges = function() {\n' +
'    var maxLeftTextWidth = Math.max.apply(null, this.leftTexts.map(function(t) { return t.offsetWidth; }));\n' +
'    var maxRightTextWidth = Math.max.apply(null, this.rightTexts.map(function(t) { return t.offsetWidth; }));\n' +
'    this.leftRange = { minX: 0, maxX: this.leftColumn.offsetWidth - maxLeftTextWidth };\n' +
'    this.rightRange = { minX: 0, maxX: this.rightColumn.offsetWidth - maxRightTextWidth };\n' +
'  };\n' +
'\n' +
'  DualWaveAnimation.prototype.setInitialPositions = function(texts, range, multiplier) {\n' +
'    var self = this;\n' +
'    var rangeSize = range.maxX - range.minX;\n' +
'    texts.forEach(function(text, index) {\n' +
'      var initialPhase = self.config.waveNumber * index - Math.PI / 2;\n' +
'      var initialWave = Math.sin(initialPhase);\n' +
'      var initialProgress = (initialWave + 1) / 2;\n' +
'      var startX = (range.minX + initialProgress * rangeSize) * multiplier;\n' +
'      gsap.set(text, { x: startX });\n' +
'    });\n' +
'  };\n' +
'\n' +
'  DualWaveAnimation.prototype.setupScrollTrigger = function() {\n' +
'    var self = this;\n' +
'    this.scrollTrigger = ScrollTrigger.create({\n' +
'      trigger: this.wrapper, start: "top bottom", end: "bottom top",\n' +
'      onUpdate: function(self2) { self.handleScroll(self2); }\n' +
'    });\n' +
'  };\n' +
'\n' +
'  DualWaveAnimation.prototype.handleScroll = function(self) {\n' +
'    var globalProgress = self.progress;\n' +
'    var closestIndex = this.findClosestToViewportCenter();\n' +
'    this.updateColumn(this.leftTexts, this.leftQuickSetters, this.leftRange, globalProgress, closestIndex, 1);\n' +
'    this.updateColumn(this.rightTexts, this.rightQuickSetters, this.rightRange, globalProgress, closestIndex, -1);\n' +
'    var focusedText = this.leftTexts[closestIndex];\n' +
'    this.updateThumbnail(this.thumbnail, focusedText);\n' +
'  };\n' +
'\n' +
'  DualWaveAnimation.prototype.updateColumn = function(texts, setters, range, progress, focusedIndex, multiplier) {\n' +
'    var self = this;\n' +
'    var rangeSize = range.maxX - range.minX;\n' +
'    texts.forEach(function(text, index) {\n' +
'      var finalX = self.calculateWavePosition(index, progress, range.minX, rangeSize) * multiplier;\n' +
'      setters[index](finalX);\n' +
'      text.classList.toggle("focused", index === focusedIndex);\n' +
'    });\n' +
'  };\n' +
'\n' +
'  DualWaveAnimation.prototype.updateThumbnail = function(thumbnail, focusedText) {\n' +
'    if (!thumbnail || !focusedText) return;\n' +
'    var newImage = focusedText.dataset.image;\n' +
'    if (newImage && this.currentImage !== newImage) { this.currentImage = newImage; thumbnail.src = newImage; }\n' +
'    var wrapperRect = this.wrapper.getBoundingClientRect();\n' +
'    var viewportCenter = window.innerHeight / 2;\n' +
'    var thumbnailHeight = thumbnail.offsetHeight;\n' +
'    var wrapperHeight = this.wrapper.offsetHeight;\n' +
'    var idealY = viewportCenter - wrapperRect.top - thumbnailHeight / 2;\n' +
'    var minY = -thumbnailHeight / 2, maxY = wrapperHeight - thumbnailHeight / 2;\n' +
'    var clampedY = Math.max(minY, Math.min(maxY, idealY));\n' +
'    gsap.set(thumbnail, { y: clampedY });\n' +
'  };\n' +
'\n' +
'  DualWaveAnimation.prototype.calculateWavePosition = function(index, globalProgress, minX, range) {\n' +
'    var phase = this.config.waveNumber * index + this.config.waveSpeed * globalProgress * Math.PI * 2 - Math.PI / 2;\n' +
'    var wave = Math.sin(phase);\n' +
'    var cycleProgress = (wave + 1) / 2;\n' +
'    return minX + cycleProgress * range;\n' +
'  };\n' +
'\n' +
'  DualWaveAnimation.prototype.findClosestToViewportCenter = function() {\n' +
'    var viewportCenter = window.innerHeight / 2;\n' +
'    var closestIndex = 0, minDistance = Infinity;\n' +
'    this.leftTexts.forEach(function(text, index) {\n' +
'      var rect = text.getBoundingClientRect();\n' +
'      var elementCenter = rect.top + rect.height / 2;\n' +
'      var distance = Math.abs(elementCenter - viewportCenter);\n' +
'      if (distance < minDistance) { minDistance = distance; closestIndex = index; }\n' +
'    });\n' +
'    return closestIndex;\n' +
'  };\n' +
'\n' +
'  var anim = new DualWaveAnimation("#dw-wrapper", { waveNumber: 2, waveSpeed: 1 });\n' +
'  anim.init();\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'dual-wave-text',
        name: 'Dual Wave Text',
        icon: '🌊',
        description: 'Dos columnas de palabras ondulando en sentidos opuestos al hacer scroll — una miniatura flotante muestra la imagen/video asociado a la palabra más cercana al centro',
        sourceUrl: 'https://github.com/ValentinDBS/codrops-tutorial-text-animation',
        build: build
    });
})();
