// Split Mask Reveal — adapted from the gsap-collection demo
// "scroll-animation-cinecasero" (source read & understood: a 5-column grid
// — left-outer, left (2 stacked images), a hidden center spacer, right (2
// stacked images), right-outer — sits behind a video overlay masked into a
// small rounded window; scrolling pins the section, expands the mask to
// fullscreen, and pushes the left columns left / right columns right in
// parallax, while a title fades in word-by-word once the mask is mostly
// expanded. Recreated with the client's own media list instead of 6 fixed
// stock photos + 1 video).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SCROLLTRIGGER_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';
    var SPLITTEXT_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js';
    var LENIS_CDN = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js';

    function imgTag(media) {
        return media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" alt="">';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var intro = opts.intro || 'Descubre el arte del movimiento en esta experiencia visual — una exploración creativa que combina diseño, narrativa y código en un recorrido continuo.';
        var heroTitle = opts.heroTitle || 'Crezcamos juntos y creemos algo increíble';
        var outro = opts.outro || 'Gracias por explorar este recorrido — que inspire tu propia forma de contar historias a través del movimiento.';
        var media = EP.ScrollSections.fillMedia(mediaList, 7);
        var leftOuter = media[0], left1 = media[1], left2 = media[2];
        var center = media[3];
        var right1 = media[4], right2 = media[5], rightOuter = media[6];
        var overlayMedia = center;
        var overlayInner = overlayMedia.type === 'video'
            ? '<video src="' + overlayMedia.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + overlayMedia.url + '" alt="">';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Split Mask Reveal</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#eae9e4;color:#111;}\n' +
'.intro,.outro,.scrolling{width:100%;height:100dvh;}\n' +
'.intro,.outro{display:flex;align-items:flex-end;padding-bottom:2rem;justify-content:center;position:relative;padding-inline:3rem;}\n' +
'.intro h1,.outro h1{max-width:70vw;font-size:clamp(1rem,2.2vw,1.5rem);text-align:center;line-height:1.4;}\n' +
'.site{position:absolute;top:2rem;right:2rem;font-weight:800;font-size:0.9rem;letter-spacing:0.06em;text-transform:uppercase;}\n' +
'.scrolling{position:relative;display:flex;align-items:center;}\n' +
'.grid{display:grid;gap:24px;grid-template-columns:1fr 1fr 2fr 1fr 1fr;padding:0 3rem;}\n' +
'.left-outer,.left,.center,.right,.right-outer{width:100%;height:100%;}\n' +
'.left,.right{will-change:transform;}\n' +
'.left-outer,.right-outer{display:flex;align-items:center;will-change:transform;}\n' +
'.center img,.center video{aspect-ratio:5/6;visibility:hidden;}\n' +
'.title{font-size:calc(2vw + 1.4rem);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#fff;font-weight:800;text-transform:uppercase;text-shadow:0 4px 20px rgba(0,0,0,0.5);z-index:5;}\n' +
'.grid img,.grid video{width:100%;height:auto;border-radius:12px;}\n' +
'.grid > div > *+*{margin-top:24px;}\n' +
'.overlay{position:absolute;top:0;left:0;width:100%;height:100dvh;clip-path:var(--mask-path);}\n' +
'@media (max-width:768px){.grid{grid-template-columns:1fr 2fr 1fr;padding:0 1rem;} .left-outer,.right-outer{display:none;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<section class="intro">\n' +
'  <div class="site">' + title + '</div>\n' +
'  <h1>' + intro + '</h1>\n' +
'</section>\n' +
'<section class="scrolling">\n' +
'  <div class="grid">\n' +
'    <div class="left-outer">' + imgTag(leftOuter) + '</div>\n' +
'    <div class="left">' + imgTag(left1) + imgTag(left2) + '</div>\n' +
'    <div class="center">' + imgTag(center) + '</div>\n' +
'    <div class="right">' + imgTag(right1) + imgTag(right2) + '</div>\n' +
'    <div class="right-outer">' + imgTag(rightOuter) + '</div>\n' +
'  </div>\n' +
'  <div class="overlay" style="--mask-path: inset(20% 35% 20% 35% round 15px)">' + overlayInner + '</div>\n' +
'  <h1 class="title">' + heroTitle + '</h1>\n' +
'</section>\n' +
'<section class="outro"><h1>' + outro + '</h1></section>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SPLITTEXT_CDN + '"></script>\n' +
'<script src="' + SCROLLTRIGGER_CDN + '"></script>\n' +
'<script src="' + LENIS_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(ScrollTrigger, SplitText);\n' +
'  var lenis = new Lenis();\n' +
'  lenis.on("scroll", ScrollTrigger.update);\n' +
'  gsap.ticker.add(function(time) { lenis.raf(time * 1000); });\n' +
'  gsap.ticker.lagSmoothing(0);\n' +
'\n' +
'  var leftGallery = document.querySelector(".left");\n' +
'  var leftOuterGallery = document.querySelector(".left-outer");\n' +
'  var rightGallery = document.querySelector(".right");\n' +
'  var rightOuterGallery = document.querySelector(".right-outer");\n' +
'  var media = document.querySelector(".overlay video, .overlay img");\n' +
'  var isVideo = media.tagName === "VIDEO";\n' +
'\n' +
'  var splitTitle = SplitText.create(".title", { type: "words" });\n' +
'  var wordsTitle = splitTitle.words;\n' +
'  var yWords = 20;\n' +
'  gsap.set(wordsTitle, { opacity: 0, y: yWords });\n' +
'\n' +
'  ScrollTrigger.create({\n' +
'    trigger: ".scrolling", start: "top top", pin: true, scrub: true, end: "+=200%",\n' +
'    onEnter: function() { if (isVideo) media.play(); },\n' +
'    onUpdate: function(self) {\n' +
'      var percentageTopBottomMask = 20, percentageLeftRightMask = 35;\n' +
'      var progress = self.progress;\n' +
'      var maskTopBottomProgress = ((1 - progress) * percentageTopBottomMask) + "%";\n' +
'      var maskLeftRightProgress = ((1 - progress) * percentageLeftRightMask) + "%";\n' +
'      var borderProgress = (1 - progress) * 15;\n' +
'      gsap.set(".overlay", { "--mask-path": "inset(" + maskTopBottomProgress + " " + maskLeftRightProgress + " " + maskTopBottomProgress + " " + maskLeftRightProgress + " round " + borderProgress + "px)" });\n' +
'\n' +
'      if (progress <= 0.9) {\n' +
'        var galleryProgress = progress / 0.9;\n' +
'        var distance = window.innerWidth / 3;\n' +
'        gsap.set(leftGallery, { x: "-" + (galleryProgress * distance) });\n' +
'        gsap.set(leftOuterGallery, { x: "-" + (galleryProgress * distance) });\n' +
'        gsap.set(rightOuterGallery, { x: galleryProgress * distance });\n' +
'        gsap.set(rightGallery, { x: galleryProgress * distance });\n' +
'      }\n' +
'\n' +
'      if (progress >= 0.5 && progress <= 0.9) {\n' +
'        var titleProgress = (progress - 0.5) / 0.2;\n' +
'        var totalWords = wordsTitle.length;\n' +
'        var yProgress = (0.9 - progress) * 10 * (yWords / 2);\n' +
'        gsap.set(wordsTitle, { y: yProgress });\n' +
'        wordsTitle.forEach(function(word, i) {\n' +
'          var wordStartDelay = i / totalWords;\n' +
'          var wordEndDelay = (i + 1.5) / totalWords;\n' +
'          var wordOpacity = 0;\n' +
'          if (titleProgress >= wordEndDelay) wordOpacity = 1;\n' +
'          else if (titleProgress >= wordStartDelay) wordOpacity = (titleProgress - wordStartDelay) / (wordEndDelay - wordStartDelay);\n' +
'          gsap.set(word, { opacity: wordOpacity });\n' +
'        });\n' +
'      } else if (progress < 0.5) {\n' +
'        gsap.set(wordsTitle, { opacity: 0, y: yWords });\n' +
'      } else if (progress > 0.9) {\n' +
'        gsap.set(wordsTitle, { opacity: 1, y: 0 });\n' +
'      }\n' +
'    }\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'split-mask-reveal',
        name: 'Split Mask Reveal',
        icon: '🎦',
        description: 'Grid de 5 columnas que se abre en parallax mientras un vídeo/imagen central enmascarado se expande a pantalla completa; titular que aparece palabra por palabra al completarse. Fijado en scroll, muy cinematográfico',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/scroll-animation-cinecasero',
        build: build
    });
})();
