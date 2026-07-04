// Accordion Gallery — adapted from the CodePen gist "Accordion gallery"
// (source read & understood: a row of thin vertical strips, each labelled;
// hovering/clicking a strip expands it while the others collapse toward the
// edges with an elastic stagger, and a full-bleed background image crossfades
// in behind — recreated here with vanilla JS instead of inline onmouseenter,
// wired to the client's own media list instead of picsum).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 6;
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
'<title>' + title + ' — Accordion Gallery</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;}\n' +
'html,body{width:100%;height:100%;color:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden;margin:0;background:#0a0a0c;}\n' +
'#fg,#bg{width:100%;height:100%;}\n' +
'div{position:absolute;top:0;}\n' +
'.bgImg{background-size:cover;background-position:center;}\n' +
'.box{cursor:pointer;overflow:hidden;background:rgba(10,10,12,0.18);}\n' +
'.box p{padding:1rem;font-size:1.1rem;font-weight:800;letter-spacing:0.02em;text-shadow:0 2px 12px rgba(0,0,0,0.6);}\n' +
'.box sub{font-size:0.65rem;display:block;letter-spacing:0.15em;text-transform:uppercase;opacity:0.7;}\n' +
'.title{position:absolute;left:2rem;bottom:2rem;z-index:5;font-size:clamp(1.2rem,3vw,1.8rem);font-weight:800;text-transform:uppercase;letter-spacing:0.03em;text-shadow:0 4px 20px rgba(0,0,0,0.6);pointer-events:none;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div id="bg"></div>\n' +
'<div id="fg"></div>\n' +
'<div class="title">' + title + '</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var media = ' + mediaJson + ';\n' +
'  var n = media.length, current = n - 1;\n' +
'  var bg = document.getElementById("bg"), fg = document.getElementById("fg");\n' +
'  var closedWidth = Math.floor(window.innerWidth / n);\n' +
'\n' +
'  for (var i = 0; i < n; i++) {\n' +
'    (function(i) {\n' +
'      var bgEl = document.createElement("div");\n' +
'      bgEl.className = "bgImg";\n' +
'      bgEl.id = "bgImg" + i;\n' +
'      bg.appendChild(bgEl);\n' +
'      if (media[i].type === "video") {\n' +
'        var vid = document.createElement("video");\n' +
'        vid.src = media[i].url; vid.autoplay = true; vid.muted = true; vid.loop = true; vid.playsInline = true;\n' +
'        vid.style.width = "100%"; vid.style.height = "100%"; vid.style.objectFit = "cover";\n' +
'        bgEl.appendChild(vid);\n' +
'      } else {\n' +
'        gsap.set(bgEl, { width: "100%", height: "100%", backgroundImage: "url(" + media[i].url + ")" });\n' +
'      }\n' +
'\n' +
'      var b = document.createElement("div");\n' +
'      b.id = "b" + i; b.className = "box";\n' +
'      b.innerHTML = "<sub>Ref.</sub><p>" + media[i].label + "</p>";\n' +
'      fg.appendChild(b);\n' +
'      gsap.fromTo(b, {\n' +
'        width: "100%", height: "100%",\n' +
'        borderLeft: (i > 0) ? "solid 1px rgba(255,255,255,0.15)" : "",\n' +
'        left: i * closedWidth,\n' +
'        transformOrigin: "100% 100%",\n' +
'        x: "100%"\n' +
'      }, { duration: i * 0.15, x: 0, ease: "expo.inOut" });\n' +
'\n' +
'      b.addEventListener("mouseenter", activate);\n' +
'      b.addEventListener("click", activate);\n' +
'      function activate() {\n' +
'        if (i === current) return;\n' +
'        var staggerOrder = current < i;\n' +
'        current = i;\n' +
'        gsap.to(".box", {\n' +
'          duration: 0.5, ease: "elastic.out(0.3)",\n' +
'          left: function(idx) { return (idx <= current) ? idx * closedWidth : window.innerWidth - ((n - idx) * closedWidth); },\n' +
'          x: 0,\n' +
'          stagger: staggerOrder ? 0.05 : -0.05\n' +
'        });\n' +
'        bg.appendChild(document.getElementById("bgImg" + current));\n' +
'        gsap.fromTo("#bgImg" + current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.inOut" });\n' +
'        gsap.fromTo("#bgImg" + current, { scale: 1.05, rotation: 0.05 }, { scale: 1, rotation: 0, duration: 1.5, ease: "sine" });\n' +
'      }\n' +
'    })(i);\n' +
'  }\n' +
'\n' +
'  window.addEventListener("resize", function() {\n' +
'    closedWidth = Math.floor(window.innerWidth / n);\n' +
'    gsap.set(".box", { x: 0, left: function(idx) { return (idx <= current) ? idx * closedWidth : window.innerWidth - ((n - idx) * closedWidth); } });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'accordion-gallery',
        name: 'Accordion Gallery',
        icon: '🪗',
        description: 'Galería en acordeón — franjas verticales que se expanden al pasar el ratón o hacer clic, revelando la imagen o video de fondo a pantalla completa; ideal para catálogos de referencias/propiedades',
        sourceUrl: 'https://gist.github.com/Juanmaes83/c3f791ba9dec0520a4f0d9fd92454df3',
        build: build
    });
})();
