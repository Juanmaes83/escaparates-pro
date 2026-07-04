// Spin Scroll Gallery — adapted from the CodePen gist "GSAP ScrollTrigger -
// Carousel" (source read & understood: a field of circular tiles, each with
// its own paused rotationX timeline; ScrollTrigger scrubs every tile's
// timeline progress in lockstep with page scroll, so the whole field spins
// like a tunnel of coins as the user scrolls — recreated with the client's
// own media list instead of picsum, tile count reduced and sized for legible
// property photos instead of tiny thumbnails).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 14;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var n = media.length || itemCount;

        var mediaJson = JSON.stringify(media.map(function(m, i) {
            return { url: m.url, type: m.type || 'image', label: m.name || ('Referencia ' + (i + 1)) };
        }));

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Spin Scroll Gallery</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{margin:0;background:#0a0a0c;overflow-x:hidden;}\n' +
'div{position:absolute;user-select:none;}\n' +
'#container{position:fixed;inset:0;width:100%;height:100%;overflow:hidden;}\n' +
'#scrollDist{top:0;width:100%;height:400vh;}\n' +
'.tile{border-radius:16px;overflow:hidden;background-size:cover;background-position:center;box-shadow:0 20px 50px rgba(0,0,0,0.5);cursor:pointer;}\n' +
'.tile video{width:100%;height:100%;object-fit:cover;}\n' +
'.title{position:fixed;left:50%;top:6%;transform:translateX(-50%);z-index:5;color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:clamp(1.2rem,3.5vw,2rem);font-weight:800;text-transform:uppercase;letter-spacing:0.03em;text-shadow:0 4px 20px rgba(0,0,0,0.6);pointer-events:none;}\n' +
'.hint{position:fixed;left:50%;bottom:5%;transform:translateX(-50%);z-index:5;color:rgba(255,255,255,0.55);font-family:Arial,Helvetica,sans-serif;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;pointer-events:none;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="title">' + title + '</div>\n' +
'<div id="scrollDist"></div>\n' +
'<div id="container"></div>\n' +
'<div class="hint">Scroll para girar la galería</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger);\n' +
'  var media = ' + mediaJson + ';\n' +
'  var c = document.getElementById("container");\n' +
'  var boxes = [];\n' +
'  var size = Math.max(140, Math.min(220, window.innerWidth / 6));\n' +
'\n' +
'  media.forEach(function(m, i) {\n' +
'    var b = document.createElement("div");\n' +
'    if (m.type === "video") {\n' +
'      var vid = document.createElement("video");\n' +
'      vid.src = m.url; vid.autoplay = true; vid.muted = true; vid.loop = true; vid.playsInline = true;\n' +
'      b.appendChild(vid);\n' +
'    }\n' +
'    boxes.push(b);\n' +
'    c.appendChild(b);\n' +
'  });\n' +
'\n' +
'  gsap.to(c, { duration: 0.4, perspective: 900 });\n' +
'\n' +
'  boxes.forEach(function(b, i) {\n' +
'    var m = media[i];\n' +
'    gsap.set(b, {\n' +
'      className: "tile",\n' +
'      left: "50%", top: "50%", margin: -(size / 2),\n' +
'      width: size, height: size,\n' +
'      backgroundImage: (m.type === "video") ? "" : ("url(" + m.url + ")"),\n' +
'      clearProps: "transform",\n' +
'      backfaceVisibility: "hidden"\n' +
'    });\n' +
'\n' +
'    b.tl = gsap.timeline({ paused: true, defaults: { immediateRender: true } })\n' +
'      .fromTo(b, {\n' +
'        scale: 0.35,\n' +
'        rotationX: (i / boxes.length) * 360,\n' +
'        transformOrigin: "50% 50% -520%"\n' +
'      }, {\n' +
'        rotationX: "+=360",\n' +
'        ease: "none"\n' +
'      })\n' +
'      .timeScale(0.05);\n' +
'\n' +
'    b.addEventListener("mouseover", function(e) { gsap.to(e.currentTarget, { opacity: 0.6, scale: 0.42, duration: 0.4, ease: "expo" }); });\n' +
'    b.addEventListener("mouseout", function(e) { gsap.to(e.currentTarget, { opacity: 1, scale: 0.35, duration: 0.2, ease: "back.out(3)", overwrite: "auto" }); });\n' +
'  });\n' +
'\n' +
'  ScrollTrigger.create({\n' +
'    trigger: "#scrollDist",\n' +
'    start: "top top",\n' +
'    end: "bottom bottom",\n' +
'    onRefresh: function(self) { boxes.forEach(function(b) { gsap.set(b.tl, { progress: self.progress }); }); },\n' +
'    onUpdate: function(self) { boxes.forEach(function(b) { gsap.to(b.tl, { progress: self.progress, overwrite: true }); }); }\n' +
'  });\n' +
'\n' +
'  window.addEventListener("resize", function() {\n' +
'    size = Math.max(140, Math.min(220, window.innerWidth / 6));\n' +
'    boxes.forEach(function(b) { gsap.set(b, { width: size, height: size, margin: -(size / 2) }); });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'spin-scroll-gallery',
        name: 'Spin Scroll Gallery',
        icon: '🌀',
        description: 'Campo de fotos circulares cuya rotación está enganchada al scroll — al bajar la página la galería entera gira como un túnel de monedas; efecto de scroll muy físico para recorrer varias referencias',
        sourceUrl: 'https://gist.github.com/Juanmaes83/a6cf1115d33845e0347c30f4143f74da',
        build: build
    });
})();
