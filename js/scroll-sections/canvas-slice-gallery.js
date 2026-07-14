// Canvas Slice Gallery — adapted from the CodePen "Gallery Example" gist
// by Toshiya Marukubo (source read & understood: gist a348087df301f26edd1ff4d3d6157322).
// Technique: the active image is sliced into horizontal bands of random height;
// each band starts offset sideways with noise and eases into alignment,
// reconstructing the photo. Clicking advances to the next image with a
// shatter-apart transition (bands drift with a sine wave) before the next
// photo assembles. A loading bar tracks image preloading.
(function() {
    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var media = EP.ScrollSections.fillMedia(mediaList, opts.itemCount || 6);
        function placeholder(label, bg, fg) {
            return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">' +
                '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
                '<stop stop-color="' + bg + '"/><stop offset="1" stop-color="' + fg + '"/></linearGradient></defs>' +
                '<rect width="1200" height="800" fill="url(#g)"/>' +
                '<circle cx="965" cy="150" r="220" fill="rgba(255,255,255,.18)"/>' +
                '<circle cx="190" cy="690" r="260" fill="rgba(0,0,0,.18)"/>' +
                '<text x="70" y="650" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="800" fill="white">' + label + '</text>' +
                '<text x="76" y="710" font-family="Arial, Helvetica, sans-serif" font-size="28" letter-spacing="10" fill="rgba(255,255,255,.72)">CANVAS SLICE GALLERY</text>' +
                '</svg>'
            );
        }
        if (!media.length) {
            media = [
                { type: 'image', url: placeholder('ESCAPARATE', '#101827', '#5b7cfa') },
                { type: 'image', url: placeholder('PREMIUM', '#1d1531', '#d487ff') },
                { type: 'image', url: placeholder('MARCA', '#062a2c', '#f8c776') },
                { type: 'image', url: placeholder('STORY', '#221315', '#fb7867') }
            ];
        }
        var urlsJson = JSON.stringify(media.map(function(m) { return m.url; }));

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Canvas Slice Gallery</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;height:100%;background:#01012A;overflow:hidden;font-family:Arial,Helvetica,sans-serif;}\n' +
'#csg-title{position:fixed;top:2rem;left:2rem;z-index:5;color:#fff;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.75;}\n' +
'#csg-hint{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);z-index:5;color:#fff;font-size:0.75rem;opacity:0.55;}\n' +
'#csg-loading{position:fixed;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#01012A;transition:opacity 0.4s;}\n' +
'#csg-loading.loaded{opacity:0;pointer-events:none;}\n' +
'.csg-line-wrap{width:200px;height:2px;background:rgba(255,255,255,0.15);}\n' +
'.csg-line{height:100%;width:0%;background:#fff;}\n' +
'.csg-counter{margin-top:1rem;color:#fff;font-size:0.8rem;letter-spacing:0.05em;}\n' +
'canvas{display:block;cursor:pointer;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div id="csg-title">' + title + '</div>\n' +
'<div id="csg-hint">Clic para siguiente imagen</div>\n' +
'<div id="csg-loading">\n' +
'  <div class="csg-line-wrap"><div class="csg-line"></div></div>\n' +
'  <div class="csg-counter">0%</div>\n' +
'</div>\n' +
'<script>\n' +
'(function(){\n' +
'  var IMAGE_URLS = ' + urlsJson + ';\n' +
'  function Utilities(){}\n' +
'  Utilities.randomInt = function(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); };\n' +
'\n' +
'  function Loading() {\n' +
'    this.line = document.querySelector(".csg-line");\n' +
'    this.wrap = document.getElementById("csg-loading");\n' +
'    this.counter = document.querySelector(".csg-counter");\n' +
'    this.loadedNumber = 0;\n' +
'  }\n' +
'  Loading.prototype.run = function(urls, onDone) {\n' +
'    var self = this;\n' +
'    if (!urls.length) { onDone(); return; }\n' +
'    urls.forEach(function(url) {\n' +
'      var img = new Image();\n' +
'      img.crossOrigin = "anonymous";\n' +
'      img.addEventListener("load", function() {\n' +
'        self.loadedNumber++;\n' +
'        var pct = Math.floor((self.loadedNumber / urls.length) * 100);\n' +
'        self.line.style.width = pct + "%";\n' +
'        self.counter.textContent = pct + "%";\n' +
'        if (self.loadedNumber >= urls.length) {\n' +
'          setTimeout(function() { self.wrap.classList.add("loaded"); onDone(); }, 300);\n' +
'        }\n' +
'      });\n' +
'      img.addEventListener("error", function() {\n' +
'        self.loadedNumber++;\n' +
'        if (self.loadedNumber >= urls.length) { self.wrap.classList.add("loaded"); onDone(); }\n' +
'      });\n' +
'      img.src = url;\n' +
'    });\n' +
'  };\n' +
'\n' +
'  function DrawMainImage(ctx, width, height) {\n' +
'    this.ctx = ctx; this.width = width; this.height = height;\n' +
'    this.canvas = document.createElement("canvas");\n' +
'    this.ctx2 = this.canvas.getContext("2d");\n' +
'    this.image = null;\n' +
'    this.dataArr = [];\n' +
'    this.drawWidth = 0;\n' +
'    this.drawHeight = 0;\n' +
'    this.isLoaded = false;\n' +
'    this.startTime = 0;\n' +
'  }\n' +
'  DrawMainImage.prototype.ease = function(x) { return 1 - Math.sqrt(1 - Math.pow(x, 2)); };\n' +
'  DrawMainImage.prototype.drawImage = function(src) {\n' +
'    var self = this;\n' +
'    this.isLoaded = false;\n' +
'    this.image = new Image();\n' +
'    this.image.crossOrigin = "anonymous";\n' +
'    this.image.src = src;\n' +
'    this.image.addEventListener("load", function() {\n' +
'      self.startTime = performance.now();\n' +
'      var iw, ih, ratio;\n' +
'      if (self.image.width >= self.image.height) {\n' +
'        iw = Math.min(self.width * 0.72, self.image.width);\n' +
'        ratio = self.image.width / self.image.height;\n' +
'        ih = iw / ratio;\n' +
'      } else {\n' +
'        ih = Math.min(self.height * 0.72, self.image.height);\n' +
'        ratio = self.image.height / self.image.width;\n' +
'        iw = ih / ratio;\n' +
'        if (iw >= self.width * 0.72) {\n' +
'          iw = Math.min(self.width * 0.72, self.image.width);\n' +
'          ratio = self.image.width / self.image.height;\n' +
'          ih = iw / ratio;\n' +
'        }\n' +
'      }\n' +
'      self.canvas.width = Math.max(1, Math.round(iw)); self.canvas.height = Math.max(1, Math.round(ih));\n' +
'      self.drawWidth = self.canvas.width; self.drawHeight = self.canvas.height;\n' +
'      self.getImageData();\n' +
'      self.isLoaded = true;\n' +
'    });\n' +
'    this.image.addEventListener("error", function() { self.isLoaded = false; });\n' +
'  };\n' +
'  DrawMainImage.prototype.getImageData = function() {\n' +
'    this.dataArr = [];\n' +
'    var preHeight = 0, addHeight = 0;\n' +
'    for (var y = 0; y < this.drawHeight; y += addHeight) {\n' +
'      addHeight = Utilities.randomInt(6, 22);\n' +
'      if (preHeight + addHeight > this.drawHeight) addHeight = Math.floor(this.drawHeight - preHeight);\n' +
'      if (addHeight <= 0) break;\n' +
'      this.dataArr.push({ sy: preHeight, sh: addHeight, height: preHeight, offset: (Math.random() - 0.5) * this.width * 0.9 });\n' +
'      preHeight += addHeight;\n' +
'    }\n' +
'  };\n' +
'  DrawMainImage.prototype.render = function(now, exiting) {\n' +
'    if (!this.isLoaded) return;\n' +
'    var elapsed = now - this.startTime;\n' +
'    var t = 1.0 - Math.min(elapsed * 0.0016, 1.0);\n' +
'    var e = this.ease(t);\n' +
'    var cx = this.width / 2 - this.drawWidth / 2;\n' +
'    var cy = this.height / 2 - this.drawHeight / 2;\n' +
'    for (var i = 0; i < this.dataArr.length; i++) {\n' +
'      var band = this.dataArr[i];\n' +
'      var ox;\n' +
'      if (exiting !== undefined) {\n' +
'        ox = Math.tan(exiting * 0.01 + band.height / Math.PI) * 140;\n' +
'      } else {\n' +
'        ox = band.offset * e;\n' +
'      }\n' +
'      try {\n' +
'        var srcY = band.sy / this.drawHeight * this.image.height;\n' +
'        var srcH = band.sh / this.drawHeight * this.image.height;\n' +
'        this.ctx.drawImage(this.image, 0, srcY, this.image.width, srcH, Math.round(cx + ox), Math.round(cy + band.height), this.drawWidth, band.sh);\n' +
'      } catch (err) {}\n' +
'    }\n' +
'  };\n' +
'\n' +
'  var canvas = document.createElement("canvas");\n' +
'  var ctx = canvas.getContext("2d");\n' +
'  canvas.style.position = "fixed"; canvas.style.top = "0"; canvas.style.left = "0";\n' +
'  document.body.appendChild(canvas);\n' +
'  var width, height;\n' +
'  function resize() {\n' +
'    width = canvas.width = window.innerWidth;\n' +
'    height = canvas.height = window.innerHeight;\n' +
'  }\n' +
'  resize();\n' +
'  window.addEventListener("resize", resize);\n' +
'\n' +
'  var drawer = new DrawMainImage(ctx, width, height);\n' +
'  var idx = 0;\n' +
'  var exitPhase = null;\n' +
'  var exitStart = 0;\n' +
'\n' +
'  function showImage(i) {\n' +
'    if (!IMAGE_URLS.length) return;\n' +
'    drawer = new DrawMainImage(ctx, width, height);\n' +
'    drawer.drawImage(IMAGE_URLS[i % IMAGE_URLS.length]);\n' +
'  }\n' +
'\n' +
'  document.body.addEventListener("click", function() {\n' +
'    if (exitPhase !== null) return;\n' +
'    exitPhase = 0; exitStart = performance.now();\n' +
'  });\n' +
'\n' +
'  function loop(now) {\n' +
'    ctx.clearRect(0, 0, width, height);\n' +
'    if (exitPhase !== null) {\n' +
'      var t = now - exitStart;\n' +
'      drawer.render(now, t * 0.25);\n' +
'      if (t > 260) {\n' +
'        exitPhase = null;\n' +
'        idx = (idx + 1) % Math.max(1, IMAGE_URLS.length);\n' +
'        showImage(idx);\n' +
'      }\n' +
'    } else {\n' +
'      drawer.render(now);\n' +
'    }\n' +
'    requestAnimationFrame(loop);\n' +
'  }\n' +
'\n' +
'  var loading = new Loading();\n' +
'  loading.run(IMAGE_URLS, function() {\n' +
'    showImage(0);\n' +
'    requestAnimationFrame(loop);\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'canvas-slice-gallery',
        name: 'Canvas Slice Gallery',
        icon: '🎞️',
        description: 'Galería canvas con barra de carga — cada imagen se reconstruye en bandas horizontales que encajan con suavidad, y un clic la hace estallar hacia la siguiente foto',
        sourceUrl: 'https://codepen.io/toshiya-marukubo/pen/gOKMvPZ',
        build: build
    });
})();
