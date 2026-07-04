// CSS Spotlight Reveal — adapted from the Frontend Masters article "CSS
// Spotlight Effect" (source read & understood: a fixed full-viewport overlay
// paints a dark radial-gradient mask with a transparent "hole" centered on
// the cursor via CSS custom properties (--clientX/--clientY) updated by a
// single mousemove listener — no canvas, no WebGL, just CSS doing the
// masking work, so it's far lighter than a canvas-based spotlight. Recreated
// as a full-bleed media reveal: the photo/video sits hidden in darkness and
// the cursor becomes a torch that reveals it circle by circle).
(function() {
    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var hint = opts.hint || 'Mueve el cursor para descubrir el espacio';
        var media = EP.ScrollSections.fillMedia(mediaList, 1);
        var m0 = media[0] || { url: '', type: 'image' };
        var inner = m0.type === 'video'
            ? '<video src="' + m0.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + m0.url + '" alt="">';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — CSS Spotlight Reveal</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html,body{width:100%;height:100%;background:#0a0a0c;overflow:hidden;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.media{position:fixed;inset:0;}\n' +
'.brand{position:fixed;top:2rem;left:50%;transform:translateX(-50%);z-index:5;color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:0.9rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;pointer-events:none;text-shadow:0 2px 10px rgba(0,0,0,0.6);}\n' +
'.hint{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);z-index:5;color:rgba(255,255,255,0.7);font-family:Arial,Helvetica,sans-serif;font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;pointer-events:none;text-shadow:0 2px 10px rgba(0,0,0,0.6);}\n' +
'.spotlight{position:fixed;inset:0;z-index:2;pointer-events:none;background-image:radial-gradient(circle at var(--clientX, 50%) var(--clientY, 50%), transparent 9em, rgba(5,5,7,0.93) 15em);}\n' +
'@media (max-width:768px){.spotlight{background-image:radial-gradient(circle at var(--clientX, 50%) var(--clientY, 50%), transparent 6em, rgba(5,5,7,0.93) 10em);}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="media">' + inner + '</div>\n' +
'<div class="spotlight"></div>\n' +
'<div class="brand">' + title + '</div>\n' +
'<div class="hint">' + hint + '</div>\n' +
'<script>\n' +
'(function(){\n' +
'  document.body.addEventListener("mousemove", function(e) {\n' +
'    document.body.style.setProperty("--clientX", e.clientX + "px");\n' +
'    document.body.style.setProperty("--clientY", e.clientY + "px");\n' +
'  });\n' +
'  document.body.addEventListener("touchmove", function(e) {\n' +
'    if (!e.touches[0]) return;\n' +
'    document.body.style.setProperty("--clientX", e.touches[0].clientX + "px");\n' +
'    document.body.style.setProperty("--clientY", e.touches[0].clientY + "px");\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'css-spotlight-reveal',
        name: 'CSS Spotlight Reveal',
        icon: '🔦',
        description: 'Foco de luz que sigue al cursor sobre una imagen/vídeo a oscuras — solo CSS (radial-gradient + custom properties), sin canvas ni WebGL; versión ligera para exports que priorizan rendimiento',
        sourceUrl: 'https://frontendmasters.com/blog/css-spotlight-effect/',
        build: build
    });
})();
