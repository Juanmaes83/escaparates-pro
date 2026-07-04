// Photo Filter Editor — adapted from the CodePen gist "[cpc] Filter selection"
// (source read & understood: a live-preview tool that adjusts CSS filter()
// values — saturate/brightness/hue-rotate/contrast — via +/- stepper buttons
// bound to CSS custom properties, applied instantly to a stack of preview
// images, with a "copy CSS" button that puts the combined filter() string on
// the clipboard and a "random image" swap button). Recreated as a real
// utility for property photos: the +/- circular-text buttons are swapped for
// plain range sliders (works with photos of any word length, unlike the
// source's per-letter rotation degrees tuned for the English words), the
// image stack cycles through the client's own uploaded photos instead of a
// fixed demo list, and "copy CSS" now copies a ready-to-paste
// `style="filter:...""` attribute for reuse in the exported showcase.
(function() {
    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 6;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var imgsHTML = media.length
            ? media.map(function(m, i) {
                return m.type === 'video'
                    ? '<video class="pf-photo' + (i === 0 ? ' active' : '') + '" src="' + m.url + '" muted loop playsinline autoplay></video>'
                    : '<img class="pf-photo' + (i === 0 ? ' active' : '') + '" src="' + m.url + '" alt="">';
            }).join('\n      ')
            : '<p style="padding:4rem;color:#888">Sube fotos para editarlas.</p>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Editor de Fotos</title>\n' +
'<style>\n' +
'*,*::before,*::after{box-sizing:border-box;}\n' +
'body{background:#111;color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:2.5rem 1rem;}\n' +
'h1{font-size:clamp(1.3rem,3vw,1.9rem);margin:0 0 1.5rem;}\n' +
'.pf-stage{position:relative;width:min(100%,720px);aspect-ratio:16/10;border-radius:12px;overflow:hidden;background:#000;}\n' +
'.pf-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.4s ease;filter:saturate(var(--saturate,100%)) brightness(var(--brightness,100%)) hue-rotate(var(--hue,0deg)) contrast(var(--contrast,100%));}\n' +
'.pf-photo.active{opacity:1;}\n' +
'.pf-controls{width:min(100%,720px);margin-top:1.5rem;display:grid;gap:1rem;}\n' +
'.pf-row{display:grid;grid-template-columns:120px 1fr 3.5rem;align-items:center;gap:0.75rem;font-size:0.85rem;}\n' +
'.pf-row input[type=range]{width:100%;}\n' +
'.pf-buttons{display:flex;gap:0.75rem;margin-top:1.5rem;flex-wrap:wrap;justify-content:center;}\n' +
'.pf-buttons button{background:#242424;color:#f2f2f2;border:1px solid #3a3a3a;border-radius:8px;padding:0.6rem 1.1rem;font-size:0.8rem;cursor:pointer;transition:background 0.2s;}\n' +
'.pf-buttons button:hover{background:#333;}\n' +
'.pf-toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(20px);background:#2ecc71;color:#08240f;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.8rem;font-weight:600;opacity:0;transition:all 0.25s ease;pointer-events:none;}\n' +
'.pf-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<h1>' + title + ' — Editor de Fotos</h1>\n' +
'<div class="pf-stage">\n' +
'      ' + imgsHTML + '\n' +
'</div>\n' +
'<div class="pf-controls">\n' +
'  <div class="pf-row"><label for="pf-saturate">Saturación</label><input type="range" id="pf-saturate" min="0" max="200" value="100"><span id="pf-saturate-val">100%</span></div>\n' +
'  <div class="pf-row"><label for="pf-brightness">Brillo</label><input type="range" id="pf-brightness" min="0" max="200" value="100"><span id="pf-brightness-val">100%</span></div>\n' +
'  <div class="pf-row"><label for="pf-hue">Tono</label><input type="range" id="pf-hue" min="0" max="360" value="0"><span id="pf-hue-val">0°</span></div>\n' +
'  <div class="pf-row"><label for="pf-contrast">Contraste</label><input type="range" id="pf-contrast" min="0" max="200" value="100"><span id="pf-contrast-val">100%</span></div>\n' +
'</div>\n' +
'<div class="pf-buttons">\n' +
'  <button id="pf-copy">Copiar CSS</button>\n' +
'  <button id="pf-next">Siguiente foto</button>\n' +
'  <button id="pf-reset">Restablecer</button>\n' +
'</div>\n' +
'<div class="pf-toast" id="pf-toast">Filtro CSS copiado</div>\n' +
'<script>\n' +
'(function(){\n' +
'  var stage = document.querySelector(".pf-stage");\n' +
'  var photos = Array.prototype.slice.call(document.querySelectorAll(".pf-photo"));\n' +
'  var activeIndex = 0;\n' +
'  var controls = { saturate: 100, brightness: 100, hue: 0, contrast: 100 };\n' +
'\n' +
'  function apply() {\n' +
'    stage.style.setProperty("--saturate", controls.saturate + "%");\n' +
'    stage.style.setProperty("--brightness", controls.brightness + "%");\n' +
'    stage.style.setProperty("--hue", controls.hue + "deg");\n' +
'    stage.style.setProperty("--contrast", controls.contrast + "%");\n' +
'    document.getElementById("pf-saturate-val").textContent = controls.saturate + "%";\n' +
'    document.getElementById("pf-brightness-val").textContent = controls.brightness + "%";\n' +
'    document.getElementById("pf-hue-val").textContent = controls.hue + "°";\n' +
'    document.getElementById("pf-contrast-val").textContent = controls.contrast + "%";\n' +
'  }\n' +
'\n' +
'  [["pf-saturate","saturate"],["pf-brightness","brightness"],["pf-hue","hue"],["pf-contrast","contrast"]].forEach(function(pair) {\n' +
'    var input = document.getElementById(pair[0]);\n' +
'    if (!input) return;\n' +
'    input.addEventListener("input", function() { controls[pair[1]] = parseInt(input.value, 10); apply(); });\n' +
'  });\n' +
'\n' +
'  document.getElementById("pf-copy").addEventListener("click", function() {\n' +
'    var css = "filter: saturate(" + controls.saturate + "%) brightness(" + controls.brightness + "%) hue-rotate(" + controls.hue + "deg) contrast(" + controls.contrast + "%);";\n' +
'    if (navigator.clipboard) navigator.clipboard.writeText(css);\n' +
'    var toast = document.getElementById("pf-toast");\n' +
'    toast.classList.add("show");\n' +
'    setTimeout(function() { toast.classList.remove("show"); }, 1600);\n' +
'  });\n' +
'\n' +
'  document.getElementById("pf-next").addEventListener("click", function() {\n' +
'    if (photos.length < 2) return;\n' +
'    photos[activeIndex].classList.remove("active");\n' +
'    activeIndex = (activeIndex + 1) % photos.length;\n' +
'    photos[activeIndex].classList.add("active");\n' +
'  });\n' +
'\n' +
'  document.getElementById("pf-reset").addEventListener("click", function() {\n' +
'    controls = { saturate: 100, brightness: 100, hue: 0, contrast: 100 };\n' +
'    document.getElementById("pf-saturate").value = 100;\n' +
'    document.getElementById("pf-brightness").value = 100;\n' +
'    document.getElementById("pf-hue").value = 0;\n' +
'    document.getElementById("pf-contrast").value = 100;\n' +
'    apply();\n' +
'  });\n' +
'\n' +
'  apply();\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'photo-filter-editor',
        name: 'Editor de Fotos',
        icon: '🎚️',
        description: 'Mini editor de fotos con preview en vivo — saturación, brillo, tono y contraste con sliders, botón para copiar el CSS resultante y para pasar a la siguiente foto subida; utility real para preparar las imágenes antes de publicar el escaparate',
        sourceUrl: 'https://gist.github.com/Juanmaes83/8341956640a533c2d7b1f9edd200a86d',
        build: build
    });
})();
