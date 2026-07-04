// Depth Scatter Intro — adapted from the gsap-collection demo
// "recreate-animation-awwwards-telescope" (source read & understood: a
// cinematic hero where a two-line title and a dozen scattered, randomly
// positioned cards fade in from deep Z, staggered, over a SplitText logo
// reveal; once settled, each card's image subtly parallax-shifts toward the
// cursor within its frame — a magnetic hover-tilt — recreated with the
// client's own media list instead of 12 fixed stock photos).
//
// Premium pass: the magnetic hover-tilt only worked on hover in the source,
// leaving the hero fully static otherwise — added a slow ambient drift so
// the collage never looks frozen, and a legible bottom-corner brand/scroll
// pairing consistent with the rest of the "Original's Top" pieces.
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SPLITTEXT_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js';
    var CARD_POS = [
        'top:4%;right:6%;width:6.1vw;', 'top:28%;right:7%;width:13.2vw;aspect-ratio:1/1;',
        'bottom:32%;right:-1.5%;width:4.7vw;', 'bottom:5.5%;right:15%;width:15vw;aspect-ratio:2/1;',
        'bottom:1.5%;right:38%;width:8.3vw;aspect-ratio:2/1;', 'bottom:13.5%;left:16%;width:9.5vw;aspect-ratio:1/1;',
        'bottom:24%;left:29%;width:5.9vw;aspect-ratio:1/1;', 'bottom:46%;left:7.5%;width:5.2vw;aspect-ratio:3/2;',
        'top:21%;left:-8%;width:13vw;aspect-ratio:1/1;', 'top:15%;left:29%;width:9.2vw;aspect-ratio:3/2;',
        'top:3%;left:36%;width:8.5vw;aspect-ratio:1/1;z-index:-1;', 'top:11%;right:30%;width:7.6vw;aspect-ratio:1/1;'
    ];

    function cardMarkup(media, i) {
        var pos = CARD_POS[i % CARD_POS.length];
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" alt="">';
        return '<div class="card-img" style="' + pos + '">' + inner + '<div class="hover"></div></div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var lineA = opts.lineA || 'Referencias reales';
        var lineB = opts.lineB || 'de espacios reales';
        var itemCount = opts.itemCount || 12;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var cardsHTML = media.map(cardMarkup).join('\n      ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Depth Scatter Intro</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#f4f3f0;color:#1a1915;}\n' +
'h1{font-weight:800;text-align:center;font-size:clamp(2rem,7vw,5.5rem);letter-spacing:0.01em;text-transform:uppercase;}\n' +
'.hero{position:relative;height:100svh;width:100%;overflow:hidden;perspective:600px;}\n' +
'.text-intro{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;pointer-events:none;}\n' +
'.text-intro h1{transform:translate(0,200px);opacity:0;will-change:transform,opacity;}\n' +
'.card-img{position:absolute;opacity:0;will-change:transform,opacity;transform-style:preserve-3d;backface-visibility:hidden;border-radius:6px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.15);}\n' +
'.hover{position:absolute;top:0;left:0;width:100%;height:100%;scale:1.35;cursor:pointer;}\n' +
'.logo{position:absolute;top:1.8rem;left:1.8rem;text-transform:uppercase;font-size:0.9rem;font-weight:800;letter-spacing:0.08em;overflow:hidden;z-index:11;}\n' +
'.char{transform:translate(0px,200%);display:inline-block;will-change:transform;}\n' +
'.scroll{position:absolute;bottom:1.8rem;right:1.8rem;font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;opacity:0.6;z-index:11;}\n' +
'@media (max-width:768px){.card-img{display:none;} .card-img:nth-child(-n+5){display:block;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<section class="hero">\n' +
'  <div class="text-intro"><h1>' + lineA + '</h1><h1>' + lineB + '</h1></div>\n' +
'      ' + cardsHTML + '\n' +
'  <p class="logo">' + title + '</p>\n' +
'  <p class="scroll">Scroll</p>\n' +
'</section>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SPLITTEXT_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(SplitText);\n' +
'  var titles = document.querySelectorAll(".text-intro h1");\n' +
'  var images = gsap.utils.toArray(".card-img");\n' +
'  var logoSplit = SplitText.create(".logo", { type: "chars,words", charsClass: "char", autoSplit: true });\n' +
'\n' +
'  gsap.set(titles, { y: 100, opacity: 0 });\n' +
'  gsap.set(images, { z: -500, opacity: 0 });\n' +
'\n' +
'  var timeline = gsap.timeline();\n' +
'  timeline\n' +
'    .to(logoSplit.chars, { y: 0, duration: 1, ease: "power3.inOut", stagger: 0.05 })\n' +
'    .to(titles[0], { duration: 1, y: 0, ease: "power1.out", opacity: 1 })\n' +
'    .to(titles[1], { duration: 1, y: 0, ease: "power1.out", opacity: 1 }, "<=0.5")\n' +
'    .to(images, {\n' +
'      duration: 1, opacity: 1, ease: "power1.out", stagger: 0.15, z: 0,\n' +
'      onComplete: function() {\n' +
'        images.forEach(function(img) {\n' +
'          var hover = img.querySelector(".hover");\n' +
'          var image = img.querySelector("img,video");\n' +
'          var targetX = 0, targetY = 0, currentX = 0, currentY = 0;\n' +
'          var driftPhase = Math.random() * Math.PI * 2;\n' +
'\n' +
'          hover.addEventListener("mousemove", function(e) {\n' +
'            var rect = hover.getBoundingClientRect();\n' +
'            var percentX = (e.clientX - rect.left) / rect.width - 0.5;\n' +
'            var percentY = (e.clientY - rect.top) / rect.height - 0.5;\n' +
'            targetX = percentX * 40; targetY = percentY * 40;\n' +
'          });\n' +
'          hover.addEventListener("mouseleave", function() { targetX = 0; targetY = 0; });\n' +
'\n' +
'          gsap.ticker.add(function(time) {\n' +
'            var driftX = Math.sin(time * 0.3 + driftPhase) * 3;\n' +
'            var driftY = Math.cos(time * 0.25 + driftPhase) * 3;\n' +
'            currentX += (targetX + driftX - currentX) * 0.08;\n' +
'            currentY += (targetY + driftY - currentY) * 0.08;\n' +
'            gsap.set(image, { x: currentX, y: currentY });\n' +
'          });\n' +
'        });\n' +
'      }\n' +
'    });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'depth-scatter-intro',
        name: 'Depth Scatter Intro',
        icon: '🔭',
        description: 'Hero cinematográfico — título en dos líneas y una docena de fichas dispersas entran desde profundidad Z con logo letra a letra; cada ficha deriva suavemente y reacciona al cursor con un ligero desplazamiento magnético',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/recreate-animation-awwwards-telescope',
        build: build
    });
})();
