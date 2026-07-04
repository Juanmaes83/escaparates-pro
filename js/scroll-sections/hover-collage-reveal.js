// Hover Collage Reveal — adapted from the gsap-collection demo
// "recreate-animation-awwwards-bindery" (source read & understood: a
// cursor-following preview box tracks the pointer over a "hover over me"
// zone; moving into the box triggers a timeline that scatters six satellite
// images outward around a blurring, shrinking center image while a caption
// reveals character by character — recreated with the client's own media
// list instead of 7 static photos, plus a contact-style footer with the
// client's own title).
//
// Premium pass: added a soft glow/shadow on the floating preview box and a
// slight stagger between satellite images instead of all six snapping out
// in perfect unison (a beat of cascade reads far more considered than a
// single simultaneous pop).
(function() {
    var GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    var SPLITTEXT_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js';
    var SATELLITE_POS = [
        { top: '30%', left: '-23%' }, { top: '3%', left: '-40%' }, { top: '-40%', left: '-5%' },
        { top: '-40%', left: '35%' }, { top: '0%', left: '70%' }, { top: '45%', left: '23%' }
    ];

    function satelliteMarkup(media, i) {
        var cls = ['image-bottom-left', 'image-top-left', 'image-top-one', 'image-top-two', 'image-right', 'image-bottom'][i];
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" alt="">';
        return '<div class="' + cls + '">' + inner + '</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var hoverLabel = opts.hoverLabel || 'Pasa el ratón';
        var hoverSub = opts.hoverSub || 'para ver la colección';
        var ctaLabel = opts.ctaLabel || 'contacta con nosotros';
        var lineA = opts.lineA || 'Hagamos algo';
        var lineB = opts.lineB || 'increíble juntos';
        var media = EP.ScrollSections.fillMedia(mediaList, 7);
        var center = media[0] || { url: '', type: 'image' };
        var satellites = media.slice(1, 7);
        while (satellites.length < 6) satellites.push(media[0] || { url: '', type: 'image' });
        var satellitesHTML = satellites.map(satelliteMarkup).join('\n          ');
        var centerInner = center.type === 'video'
            ? '<video src="' + center.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + center.url + '" alt="">';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Hover Collage Reveal</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#e7e789;color:#000;}\n' +
'.main-container{display:flex;flex-direction:column;height:100vh;overflow:hidden;}\n' +
'.hover{position:relative;height:70dvh;}\n' +
'.hover-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;}\n' +
'.hover-text h1{font-size:clamp(1.6rem,4vw,3rem);font-weight:800;text-transform:uppercase;letter-spacing:0.02em;}\n' +
'.hover-text p{margin-top:0.4rem;font-size:1rem;opacity:0.6;letter-spacing:0.05em;}\n' +
'.text{font-size:2rem;padding:1em 1.5em;display:flex;gap:0.5rem;height:30dvh;align-items:center;}\n' +
'.hover-image{width:20em;aspect-ratio:3/2;position:absolute;z-index:1;opacity:0;transform:translate(-50%,-50%);will-change:transform;cursor:pointer;pointer-events:none;filter:drop-shadow(0 30px 60px rgba(0,0,0,0.35));}\n' +
'.image-center{width:100%;height:100%;z-index:2;border-radius:10px;overflow:hidden;}\n' +
'.image-center p{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1em;color:#fff;text-transform:uppercase;overflow:hidden;font-weight:700;letter-spacing:0.05em;}\n' +
'.char{display:inline-block;transform:translateY(100px);}\n' +
'.image-bottom-left,.image-top-left,.image-top-one,.image-top-two,.image-right,.image-bottom{width:10.6vw;aspect-ratio:9/16;position:absolute;top:50%;left:50%;scale:0.5;border-radius:6px;overflow:hidden;xPercent:-50;}\n' +
'.image-top-left,.image-top-one,.image-top-two{aspect-ratio:5/3;width:14.1vw;}\n' +
'.image-bottom-left,.image-right,.image-bottom{z-index:-1;}\n' +
'.text .left{font-size:1.2em;width:50%;font-weight:800;text-transform:uppercase;line-height:1.1;}\n' +
'.text .right{display:flex;gap:0.5rem;width:50%;justify-content:flex-end;text-align:right;}\n' +
'.text .right .col{width:50%;font-size:0.5em;display:flex;flex-direction:column;gap:0.3rem;}\n' +
'.text .right .col h2{text-transform:uppercase;font-weight:800;letter-spacing:0.04em;}\n' +
'@media (max-width:768px){.hover-image{width:14em;} .text{flex-direction:column;gap:1rem;height:auto;padding:2rem;} .text .left,.text .right{width:100%;text-align:left;justify-content:flex-start;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<main class="main-container">\n' +
'  <section class="hover">\n' +
'    <div class="hover-text"><h1>' + hoverLabel + '</h1><p>' + hoverSub + '</p></div>\n' +
'    <div class="hover-image">\n' +
'          ' + satellitesHTML + '\n' +
'      <div class="image-center">' + centerInner + '<p>' + ctaLabel + '</p></div>\n' +
'    </div>\n' +
'  </section>\n' +
'  <section class="text">\n' +
'    <div class="left"><h1>' + lineA + '</h1><h1>' + lineB + '</h1></div>\n' +
'    <div class="right">\n' +
'      <div class="col"><h2>título</h2><p>' + title + '</p></div>\n' +
'    </div>\n' +
'  </section>\n' +
'</main>\n' +
'<script src="' + GSAP_CDN + '"></script>\n' +
'<script src="' + SPLITTEXT_CDN + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  gsap.registerPlugin(SplitText);\n' +
'  var hoverContainer = document.querySelector(".hover");\n' +
'  var hoverImage = document.querySelector(".hover-image");\n' +
'  var splitText = SplitText.create(".image-center p", { type: "chars", charsClass: "char" });\n' +
'\n' +
'  var floatingImages = [".image-bottom-left", ".image-top-one", ".image-top-two", ".image-bottom", ".image-top-left", ".image-right"];\n' +
'  floatingImages.forEach(function(sel) { gsap.set(sel, { top: "50%", left: "50%", xPercent: -50, yPercent: -50 }); });\n' +
'\n' +
'  var tlHoverImageEnter = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });\n' +
'  tlHoverImageEnter\n' +
'    .to(splitText.chars, { y: 0, stagger: 0.05 })\n' +
'    .to(".image-center img, .image-center video", { filter: "blur(5px)" }, "<")\n' +
'    .to(".image-center", { scale: 0.5 }, "<")\n' +
'    .to(".image-bottom-left", { top: "30%", left: "-23%", xPercent: 0, yPercent: 0 }, "<")\n' +
'    .to(".image-top-left", { top: "3%", left: "-40%", xPercent: 0, yPercent: 0 }, "<+=0.03")\n' +
'    .to(".image-top-one", { top: "-40%", left: "-5%", xPercent: 0, yPercent: 0 }, "<+=0.03")\n' +
'    .to(".image-top-two", { top: "-40%", left: "35%", xPercent: 0, yPercent: 0 }, "<+=0.03")\n' +
'    .to(".image-bottom", { top: "45%", left: "23%", xPercent: 0, yPercent: 0 }, "<+=0.03")\n' +
'    .to(".image-right", { top: "0%", left: "70%", xPercent: 0, yPercent: 0 }, "<+=0.03");\n' +
'\n' +
'  hoverContainer.addEventListener("pointermove", function() {\n' +
'    hoverImage.style.pointerEvents = "auto";\n' +
'    hoverImage.style.visibility = "visible";\n' +
'    gsap.to(hoverImage, { opacity: 1, ease: "power1.inOut" });\n' +
'  });\n' +
'  hoverContainer.addEventListener("pointerleave", function() {\n' +
'    gsap.to(hoverImage, {\n' +
'      opacity: 0, duration: 0.75, ease: "power1.inOut",\n' +
'      onComplete: function() { hoverImage.style.pointerEvents = "none"; hoverImage.style.visibility = "hidden"; }\n' +
'    });\n' +
'  });\n' +
'  hoverImage.addEventListener("pointerenter", function() { tlHoverImageEnter.play(); });\n' +
'  hoverImage.addEventListener("pointerleave", function() { tlHoverImageEnter.reverse(); });\n' +
'  hoverContainer.addEventListener("pointermove", function(e) {\n' +
'    gsap.to(hoverImage, { x: e.pageX + "px", y: e.pageY + "px", ease: "power1.out", duration: 2 });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'hover-collage-reveal',
        name: 'Hover Collage Reveal',
        icon: '🌼',
        description: 'Zona "pasa el ratón" que revela un collage de fotos flotantes escalonadas alrededor de una imagen central que se difumina, con texto de contacto emergiendo letra a letra; bloque final de marca a dos columnas',
        sourceUrl: 'https://github.com/Juanmaes83/gsap-collection/tree/main/recreate-animation-awwwards-bindery',
        build: build
    });
})();
