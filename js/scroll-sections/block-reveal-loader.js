// Block Reveal Loader — adapted from the gsap-collection demo
// "page-reveal-block" (source read & understood: a 54-block grid overlay
// covers the screen while a fake percentage counter snaps through loading
// milestones and a two-word logo slides through; once "loaded", the blocks
// fade out in a random stagger, revealing a hero with a SplitText title and
// four images that were stacked centered — then GSAP Flip morphs them out
// to their final scattered clip-path-revealed positions. Recreated with the
// client's own media list and title instead of "Creative Club").
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var CUSTOMEASE_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/CustomEase.min.js';
    var SPLITTEXT_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js';
    var FLIP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Flip.min.js';
    var CARD_POS = [
        'width:250px;aspect-ratio:3/4;top:25%;left:30%;', 'width:300px;aspect-ratio:4/5;top:30%;right:10%;',
        'width:400px;aspect-ratio:3/2;top:80%;left:30%;', 'width:500px;aspect-ratio:5/3;top:80%;left:70%;'
    ];

    function preloadBlockMarkup() { return '<div class="preload-block"></div>'; }

    function cardMarkup(media, i) {
        var pos = CARD_POS[i % CARD_POS.length];
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" alt="">';
        return '<div class="image-container ordered" style="' + pos + '">' + inner + '</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var word1 = opts.word1 || 'Bienvenido';
        var word2 = opts.word2 || 'al escaparate';
        var heroTitle = opts.heroTitle || ('bienvenido a ' + title.toLowerCase());
        var media = EP.ScrollSections.fillMedia(mediaList, 4);
        var cardsHTML = media.map(cardMarkup).join('\n      ');
        var blocksHTML = new Array(54).fill(0).map(preloadBlockMarkup).join('');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Block Reveal Loader</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111;}\n' +
'.hero{position:relative;width:100%;height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center;}\n' +
'.hero .title{font-size:clamp(1.2rem,5vw,4rem);text-align:center;z-index:1;text-transform:uppercase;position:relative;overflow:hidden;font-weight:800;letter-spacing:0.01em;}\n' +
'.logo{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;gap:0.5rem;font-size:clamp(1.5rem,5vw,3rem);overflow:hidden;text-align:center;font-weight:800;text-transform:uppercase;}\n' +
'.word1{transform:translate(0px,100px);display:inline-block;will-change:transform;}\n' +
'.word2{transform:translate(0px,-100px);display:inline-block;will-change:transform;}\n' +
'.image-container{position:absolute;overflow:hidden;transform:translate(-50%,-50%);border-radius:8px;box-shadow:0 30px 70px rgba(0,0,0,0.25);clip-path:polygon(0 0,100% 0,100% 0,0 0);will-change:clip-path;}\n' +
'.image-container.ordered{top:50%;left:50%;width:20%;aspect-ratio:1/1;transform:translate(-50%,-50%);}\n' +
'.overlay-preload{display:grid;grid-template-columns:repeat(9,1fr);grid-template-rows:repeat(6,1fr);width:100%;height:100%;position:fixed;inset:0;z-index:1000;color:#fff;gap:0;}\n' +
'.overlay-preload .preload-block{width:100%;height:100%;background:#ff4d07;will-change:clip-path;}\n' +
'.loader-percentage{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100;color:#fff;font-size:clamp(1.5rem,5vw,3rem);letter-spacing:0.15rem;overflow:hidden;font-weight:700;}\n' +
'.char{display:inline-block;will-change:transform;}\n' +
'.loader-spinner{position:absolute;bottom:30%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;border-radius:50%;border:2px solid #eaeaea;border-top-color:transparent;animation:spin 1s linear infinite;will-change:transform;}\n' +
'@keyframes spin{0%{transform:translate(-50%,-50%) rotate(0deg);}100%{transform:translate(-50%,-50%) rotate(360deg);}}\n' +
'@media (max-width:768px){.image-container.ordered{width:40%;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<section class="overlay-preload">\n' +
'      ' + blocksHTML + '\n' +
'  <div class="logo"><h1 class="word1">' + word1 + '</h1><h1 class="word2">' + word2 + '</h1></div>\n' +
'  <div class="loader-percentage"><p>0%</p></div>\n' +
'  <div class="loader-spinner"></div>\n' +
'</section>\n' +
'<section class="hero">\n' +
'  <div class="title"><h1>' + heroTitle + '</h1></div>\n' +
'      ' + cardsHTML + '\n' +
'</section>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + CUSTOMEASE_CDN + '"></script>\n' +
'<script src="' + SPLITTEXT_CDN + '"></script>\n' +
'<script src="' + FLIP_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(SplitText, Flip);\n' +
'  var preloadBlocks = document.querySelectorAll(".preload-block");\n' +
'  var loaderPercentage = document.querySelector(".loader-percentage p");\n' +
'  var overlayPreload = document.querySelector(".overlay-preload");\n' +
'  var loaderSpinner = document.querySelector(".loader-spinner");\n' +
'  var splitTitle = SplitText.create(".title h1", { type: "chars", charsClass: "char" });\n' +
'  var images = gsap.utils.toArray(".image-container");\n' +
'  gsap.set(splitTitle.chars, { yPercent: 150 });\n' +
'\n' +
'  function playAnimation() {\n' +
'    var tl = gsap.timeline({\n' +
'      onComplete: function() {\n' +
'        var state = Flip.getState(".image-container");\n' +
'        images.forEach(function(image) { image.classList.remove("ordered"); });\n' +
'        Flip.from(state, { absolute: true, duration: 1, ease: "power3.inOut" });\n' +
'      }\n' +
'    });\n' +
'\n' +
'    tl.to(loaderPercentage, { textContent: "100%", duration: 2.5, snap: { textContent: [7, 11, 24, 36, 41, 54, 62, 70, 88, 98, 99, 100] }, delay: 0.4 })\n' +
'      .to(loaderPercentage, { y: -100, duration: 0.6, delay: 0.4 })\n' +
'      .to(loaderSpinner, { opacity: 0, duration: 0.4 })\n' +
'      .to(".word1", { y: 0, duration: 0.6, ease: "power3.out" })\n' +
'      .to(".word2", { y: 0, duration: 0.6, ease: "power3.out" }, "<")\n' +
'      .to(".word1", { y: -100, duration: 0.6, ease: "power3.in", delay: 0.6 })\n' +
'      .to(".word2", { y: 100, duration: 0.6, ease: "power3.in" }, "<")\n' +
'      .to(preloadBlocks, {\n' +
'        opacity: 0, duration: 0.4, stagger: { each: 0.012, from: "random" }, ease: "power3.inOut",\n' +
'        onComplete: function() { overlayPreload.style.display = "none"; }\n' +
'      })\n' +
'      .to(splitTitle.chars, { yPercent: 0, duration: 0.6, ease: "power3.out", stagger: { each: 0.04, from: "start" } })\n' +
'      .to(".image-container", { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 0.9, ease: "power3.inOut", stagger: { each: 0.2, from: "start" } });\n' +
'  }\n' +
'\n' +
'  playAnimation();\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'block-reveal-loader',
        name: 'Block Reveal Loader',
        icon: '🧱',
        description: 'Loader/preload de bloques con contador de porcentaje falso y logo deslizante; al terminar revela un titular letra a letra y 4 fichas que se despliegan (GSAP Flip) desde el centro a sus posiciones finales. Ideal como intro de cualquier export',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/page-reveal-block',
        build: build
    });
})();
