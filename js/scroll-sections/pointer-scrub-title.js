// Pointer Scrub Title — adapted from the CodePen gist "pointer position
// controls timeline progress" (source read & understood: an SVG title is
// duplicated into a mirrored, skewed "reflection" pair; one GSAP timeline
// unfolds the skew/scale/position of both halves, a second staggers each
// text line sliding in from off-screen — normally the pointer's horizontal
// position directly scrubs both timelines' progress (0 at the left edge, 1
// at the right); here that scrubbing is kept, with an idle auto-play
// yoyo loop so the piece stays alive with no pointer present — a showcase
// "explore" interaction, e.g. for a property's interior walkthrough teaser).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var words = (opts.words && opts.words.length) ? opts.words : ['ESCAPARATE', 'PREMIUM', 'INTERIOR'];
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var bgUrl = media[0] ? media[0].url : '';
        var bgIsVideo = media[0] && media[0].type === 'video';

        var linesLeft = words.map(function(w, i) { return '<text y="' + (120 + i * 130) + '">' + w + '</text>'; }).join('\n      ');
        var linesRight = words.map(function(w, i) { return '<text y="' + (120 + i * 130) + '">' + w + '</text>'; }).join('\n      ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Pointer Scrub Title</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;}\n' +
'@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap");\n' +
'html,body{font-family:"Montserrat",Arial,sans-serif;font-weight:900;background:#0a0a0c;overflow:hidden;width:100%;height:100%;}\n' +
'.bg{position:fixed;inset:0;z-index:0;opacity:0.35;}\n' +
'.bg img,.bg video{width:100%;height:100%;object-fit:cover;}\n' +
'svg{position:relative;z-index:1;width:100%;height:100vh;display:block;}\n' +
'.hint{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);z-index:5;color:rgba(255,255,255,0.5);font-family:Arial,Helvetica,sans-serif;font-weight:400;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;pointer-events:none;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="bg">' + (bgUrl ? (bgIsVideo ? '<video src="' + bgUrl + '" autoplay muted loop playsinline></video>' : '<img src="' + bgUrl + '">') : '') + '</div>\n' +
'<svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">\n' +
'  <mask id="maskLeft"><rect x="-50%" width="100%" height="100%" fill="#fff"/></mask>\n' +
'  <mask id="maskRight"><rect x="50%" width="100%" height="100%" fill="#fff"/></mask>\n' +
'  <g font-size="110">\n' +
'    <g mask="url(#maskLeft)" fill="#fff" class="left">\n' +
'      ' + linesLeft + '\n' +
'    </g>\n' +
'    <g mask="url(#maskRight)" fill="#999" class="right">\n' +
'      ' + linesRight + '\n' +
'    </g>\n' +
'  </g>\n' +
'</svg>\n' +
'<div class="hint">Mueve el cursor para explorar</div>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  var tl = gsap.timeline({ defaults: { duration: 2, yoyo: true, ease: "power2.inOut" }, paused: true })\n' +
'    .fromTo(".left, .right", {\n' +
'      svgOrigin: "640 400", skewY: function(i) { return [-30, 15][i]; }, scaleX: function(i) { return [0.6, 0.85][i]; }, x: 200\n' +
'    }, {\n' +
'      skewY: function(i) { return [-15, 30][i]; }, scaleX: function(i) { return [0.85, 0.6][i]; }, x: -200\n' +
'    });\n' +
'\n' +
'  var tl2 = gsap.timeline({ paused: true });\n' +
'  document.querySelectorAll("text").forEach(function(t, i) {\n' +
'    tl2.add(\n' +
'      gsap.fromTo(t, { xPercent: -100, x: 700 }, { duration: 1, xPercent: 0, x: 575, ease: "sine.inOut" }),\n' +
'      (i % ' + words.length + ') * 0.2\n' +
'    );\n' +
'  });\n' +
'\n' +
'  var idle = gsap.timeline({ repeat: -1, yoyo: true })\n' +
'    .to([tl, tl2], { duration: 3, ease: "sine.inOut", progress: 1 });\n' +
'\n' +
'  var scrubbing = false;\n' +
'  window.addEventListener("pointermove", function(e) {\n' +
'    scrubbing = true;\n' +
'    idle.pause();\n' +
'    gsap.to([tl, tl2], { duration: 0.6, ease: "power3", progress: e.clientX / window.innerWidth });\n' +
'  });\n' +
'  window.addEventListener("pointerleave", function() { scrubbing = false; idle.play(); });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        id: 'pointer-scrub-title',
        name: 'Pointer Scrub Title',
        icon: '🖱️',
        description: 'Título espejado y sesgado que se despliega en tiempo real según la posición horizontal del cursor — con auto-reproducción cuando no hay interacción; ideal como teaser interactivo "explora el interior"',
        sourceUrl: 'https://gist.github.com/Juanmaes83/8179f5835e72aa33c50760cbf0fb7c9e',
        build: build
    });
})();
