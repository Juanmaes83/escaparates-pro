// Multi-Stage Comparator — adapted from the CodePen gist "CSS Scroll-Driven
// Multi-Stage Comparator [Egg Version]" (source read & understood: a pure-CSS
// scroll-driven image comparator using `animation-timeline: scroll(root)`,
// `@property`-typed custom properties and the new `sibling-index()` /
// `sibling-count()` functions — each image layer's clip-path reveal window,
// z-index stacking and divider-line position are computed automatically from
// its position among siblings, so stages can be added/removed with no manual
// per-layer class numbering. JS only handles: measuring each section's scroll
// offset, formatting the live percentage readout, a velocity-based wheel/
// touchpad momentum smoothing layer, and click-to-jump stage indicators.
// Recreated for real-estate "antes / durante / después de la reforma" or
// alternative-layout comparisons — same CSS mechanism, real content instead
// of the source's generative-art stages.
// NOTE: `sibling-index()`/`sibling-count()` and `animation-timeline: scroll()`
// are bleeding-edge CSS (Chrome/Edge only at time of writing) — kept as-is
// per the source (with its own `@supports not (...)` fallback message)
// rather than watering the technique down for older engines.
(function() {
    function layerMarkup(media, i, total, stage) {
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" decoding="async" fetchpriority="high" alt="' + stage.label + '">';
        return '' +
'<div class="image-layer">\n' +
'  ' + inner + '\n' +
'  <div class="comparator-overlay">\n' +
'    <span class="label">' + stage.label + '</span>\n' +
'    <div class="image-text">\n' +
'      <h2>' + stage.h2 + '</h2>\n' +
'      <h3>' + stage.h3 + '</h3>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>';
    }

    function dividerMarkup(count) {
        var out = '';
        for (var i = 0; i < count - 1; i++) out += '<div class="divider-line"></div>';
        return out;
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var stages = (opts.stages && opts.stages.length ? opts.stages : [
            { title: 'Etapa 1', price: 'Antes de la Reforma', description: '— Estado Original' },
            { title: 'Etapa 2', price: 'En Plena Transformación', description: '— Obra en Curso' },
            { title: 'Etapa 3', price: 'Resultado Final', description: '— Reforma Integral' }
        ]).map(function(s) {
            return { label: s.title || '', h2: s.price || '', h3: s.description || '' };
        });
        var media = EP.ScrollSections.fillMedia(mediaList, stages.length);
        var layersHTML = media.length
            ? media.map(function(m, i) { return layerMarkup(m, i, media.length, stages[i]); }).join('\n      ')
            : '<p style="padding:4rem;text-align:center;color:#888">Sube imágenes o vídeos para ver el comparador.</p>';

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Comparador Multi-Etapa</title>\n' +
'<style>\n' +
'@property --scroll-progress{inherits:true;initial-value:0;syntax:"<number>";}\n' +
'@property --layer-index{syntax:"<integer>";inherits:true;initial-value:1;}\n' +
'@property --layer-count{syntax:"<integer>";inherits:true;initial-value:1;}\n' +
'@property --divider-index{syntax:"<integer>";inherits:true;initial-value:1;}\n' +
'@property --divider-count{syntax:"<integer>";inherits:true;initial-value:1;}\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'html{overflow-y:scroll;}\n' +
':root{--comparator-duration:400vh;--comparator-offset:35vh;--comparator-max-width:56.25rem;--comparator-max-height:100vh;--comparator-aspect-ratio:16/11;}\n' +
'@media (max-width:48em){:root{--comparator-aspect-ratio:4/5;}}\n' +
'body{background:#0d0d10;color:#f2ede4;font-family:Arial,Helvetica,sans-serif;min-height:100vh;}\n' +
'@supports not ((animation-timeline: scroll()) and (z-index: sibling-count())){\n' +
'  .fallback-msg{display:block;background:#241a12;color:#f2ede4;border-radius:8px;padding:1rem;margin:2rem auto;max-width:56.25rem;width:calc(100% - 2rem);font-weight:600;}\n' +
'}\n' +
'.fallback-msg{display:none;}\n' +
'.scroll-section{block-size:calc(var(--comparator-duration) + 100vh);position:relative;}\n' +
'.spacer{block-size:50vh;}\n' +
'.scroll-indicator{font-size:1.6rem;text-align:center;padding:2rem;opacity:0.6;}\n' +
'.comparator-container{align-items:center;block-size:100vh;display:flex;inset-block-start:0;justify-content:center;overflow:hidden;position:sticky;}\n' +
'.comparator-wrapper{animation:comparator-3d-flip linear both;animation-range:calc(var(--comparator-offset) - 50vh) calc(var(--comparator-offset) + var(--comparator-duration) + 50vh);animation-timeline:scroll(root);aspect-ratio:var(--comparator-aspect-ratio);border-radius:0.5rem;inline-size:100%;margin-inline:1rem;max-block-size:var(--comparator-max-height);max-inline-size:var(--comparator-max-width);overflow:hidden;position:relative;}\n' +
'.comparator{animation:progress-calc linear both;animation-range:var(--comparator-offset) calc(var(--comparator-offset) + var(--comparator-duration));animation-timeline:scroll(root);block-size:100%;display:grid;inline-size:100%;position:relative;}\n' +
'.image-layers,.divider-lines{grid-area:1/-1;display:grid;position:relative;}\n' +
'.image-layer{display:grid;grid-area:1/-1;position:relative;z-index:calc(sibling-count() - sibling-index() + 1);}\n' +
'.image-layer:not(:last-child){--layer-index:sibling-index();--layer-count:sibling-count();--layer-start:calc((var(--layer-index) - 1) / (var(--layer-count) - 1));--layer-end:calc(var(--layer-index) / (var(--layer-count) - 1));animation:clip-reveal linear both;animation-timeline:scroll(root);animation-range:calc(var(--comparator-offset) + (var(--comparator-duration) * var(--layer-start))) calc(var(--comparator-offset) + (var(--comparator-duration) * var(--layer-end)));}\n' +
'.image-layer img,.image-layer video{grid-area:1/-1;max-block-size:var(--comparator-max-height);inline-size:100%;block-size:100%;display:block;object-fit:cover;object-position:center;}\n' +
'.divider-line{--divider-index:sibling-index();--divider-count:sibling-count();--layer-start:calc((var(--divider-index) - 1) / var(--divider-count));--layer-end:calc(var(--divider-index) / var(--divider-count));background:transparent;block-size:100%;border-inline-start:thin solid #0d0d10;box-shadow:0 0 10px rgba(212,168,75,0.5);grid-area:1/-1;inline-size:1px;pointer-events:none;position:relative;z-index:calc(20 - var(--divider-index));animation:divider-move linear both;animation-timeline:scroll(root);animation-range:calc(var(--comparator-offset) + (var(--comparator-duration) * var(--layer-start))) calc(var(--comparator-offset) + (var(--comparator-duration) * var(--layer-end)));}\n' +
'.comparator-overlay{block-size:100%;display:flex;flex-direction:column;grid-area:1/-1;inline-size:100%;max-block-size:var(--comparator-max-height);position:relative;}\n' +
'.label{backdrop-filter:blur(0.375rem);background:rgba(20,15,10,0.8);border-radius:1rem;color:#f2ede4;font-size:0.7rem;font-weight:600;inline-size:fit-content;letter-spacing:0.05em;margin-block:1rem auto;margin-inline:1rem auto;padding:0.375rem 0.75rem;pointer-events:none;position:relative;text-transform:uppercase;white-space:nowrap;z-index:11;}\n' +
'.image-text{animation:text-reveal 0.6s ease-out both;animation-range:var(--comparator-offset) calc(var(--comparator-offset) + 20vh);animation-timeline:scroll(root);margin-block:auto 1rem;margin-inline:1rem auto;max-inline-size:min(90%,28rem);pointer-events:none;position:relative;z-index:10;}\n' +
'.image-text h2{font-size:clamp(1.3rem,3vw,1.7rem);font-weight:500;letter-spacing:-0.03em;line-height:1.2;margin:0;color:#fff;}\n' +
'.image-text h3{font-size:clamp(1.1rem,1.5vw,1.4rem);font-weight:400;line-height:1.4;margin:0;color:#e5ded2;}\n' +
'.comparison-percentage{color:#fff;bottom:1rem;font-size:1.4rem;font-variant-numeric:tabular-nums;font-weight:500;pointer-events:none;position:absolute;right:1rem;z-index:20;}\n' +
'@keyframes comparator-3d-flip{0%{opacity:0.75;transform:perspective(1200px) rotateX(10deg) rotateY(-10deg) rotateZ(-3deg) scale(0.85);}15%,85%{opacity:1;transform:perspective(1200px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);}100%{opacity:0.75;transform:perspective(1200px) rotateX(-10deg) rotateY(10deg) rotateZ(3deg) scale(0.85);}}\n' +
'@keyframes progress-calc{from{--scroll-progress:0;}to{--scroll-progress:100;}}\n' +
'@keyframes clip-reveal{from{clip-path:inset(0 0 0 0);}to{clip-path:inset(0 100% 0 0);}}\n' +
'@keyframes divider-move{0%{inset-inline-start:100%;opacity:0;}2%{opacity:1;}98%{opacity:1;}100%{inset-inline-start:0%;opacity:0;}}\n' +
'@keyframes text-reveal{0%{opacity:0;transform:translateY(20px);}100%{opacity:1;transform:translateY(0);}}\n' +
'.stage-nav{display:flex;flex-direction:column;gap:0.5rem;position:absolute;right:1rem;top:50%;transform:translateY(-50%);z-index:25;pointer-events:auto;}\n' +
'.stage-indicator{appearance:none;background:rgba(242,237,228,0.3);border:none;border-radius:0.25rem;cursor:pointer;height:0.5rem;padding:0;transition:all 0.2s ease;width:0.5rem;}\n' +
'.stage-indicator:hover{background:rgba(242,237,228,0.7);transform:scale(1.3);}\n' +
'.stage-indicator.active{background:#d4a84b;height:1rem;}\n' +
'@media (max-width:48em){.stage-nav{flex-direction:row;right:50%;top:auto;bottom:3rem;transform:translateX(50%);}.stage-indicator.active{height:0.5rem;width:1rem;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<p class="fallback-msg">Tu navegador no soporta las funciones CSS avanzadas de este diseño. Usa la última versión de Chrome o Edge.</p>\n' +
'<section><p class="scroll-indicator">Desliza para comparar ↓</p></section>\n' +
'<section class="scroll-section">\n' +
'  <div class="comparator-container">\n' +
'    <div class="comparator-wrapper">\n' +
'      <div class="comparator">\n' +
'        <div class="comparison-percentage"></div>\n' +
'        <div class="image-layers">\n' +
'          ' + layersHTML + '\n' +
'        </div>\n' +
'        <div class="divider-lines">' + dividerMarkup(media.length) + '</div>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
'<section><p class="scroll-indicator">' + title + '</p></section>\n' +
'<section class="spacer"></section>\n' +
'<script>\n' +
'(function(){\n' +
'  "use strict";\n' +
'  var velocity = 0, ease = 0.12, friction = 0.92;\n' +
'  var sections = document.querySelectorAll(".scroll-section");\n' +
'  var wrappers = [], comparatorData = [];\n' +
'  for (var i = 0; i < sections.length; i++) {\n' +
'    var s = sections[i];\n' +
'    var w = s.querySelector(".comparator-wrapper");\n' +
'    if (w) wrappers.push({ section: s, wrapper: w });\n' +
'    var c = s.querySelector(".comparator");\n' +
'    if (!c) continue;\n' +
'    var p = c.querySelector(".comparison-percentage");\n' +
'    if (p) comparatorData.push({ comp: c, pct: p, section: s, layerCount: c.querySelectorAll(".image-layer").length, wrapper: w });\n' +
'  }\n' +
'  function createStageIndicators() {\n' +
'    comparatorData.forEach(function(d) {\n' +
'      var nav = document.createElement("div");\n' +
'      nav.className = "stage-nav";\n' +
'      d.indicators = [];\n' +
'      for (var j = 0; j < d.layerCount; j++) {\n' +
'        var ind = document.createElement("button");\n' +
'        ind.className = "stage-indicator";\n' +
'        ind.setAttribute("aria-label", "Ir a la etapa " + (j + 1));\n' +
'        ind.dataset.stage = j;\n' +
'        d.indicators.push(ind);\n' +
'        nav.appendChild(ind);\n' +
'      }\n' +
'      d.nav = nav;\n' +
'      d.comp.appendChild(nav);\n' +
'    });\n' +
'  }\n' +
'  function getComparatorDuration() {\n' +
'    var v = getComputedStyle(document.documentElement).getPropertyValue("--comparator-duration").trim();\n' +
'    return (parseFloat(v) * window.innerHeight) / 100;\n' +
'  }\n' +
'  var targetScrollPosition = null, scrollEase = 0.08;\n' +
'  function scrollToStage(data, stageIndex) {\n' +
'    var offset = data.section.offsetTop;\n' +
'    var duration = getComparatorDuration();\n' +
'    var stageCount = data.layerCount;\n' +
'    stageIndex = Math.max(0, Math.min(stageIndex, stageCount - 1));\n' +
'    var stageDuration = duration / (stageCount - 1);\n' +
'    targetScrollPosition = offset + stageDuration * stageIndex;\n' +
'  }\n' +
'  document.addEventListener("click", function(e) {\n' +
'    var btn = e.target.closest(".stage-indicator");\n' +
'    if (!btn) return;\n' +
'    var data = comparatorData.filter(function(d) { return d.indicators.indexOf(btn) !== -1; })[0];\n' +
'    if (data) scrollToStage(data, parseInt(btn.dataset.stage, 10));\n' +
'  });\n' +
'  function updateOffsets() {\n' +
'    wrappers.forEach(function(w) { w.wrapper.style.setProperty("--comparator-offset", w.section.offsetTop + "px"); });\n' +
'  }\n' +
'  window.addEventListener("wheel", function(e) { e.preventDefault(); targetScrollPosition = null; velocity += e.deltaY; }, { passive: false });\n' +
'  var resizeTimeout;\n' +
'  window.addEventListener("resize", function() { targetScrollPosition = null; clearTimeout(resizeTimeout); resizeTimeout = setTimeout(updateOffsets, 150); }, { passive: true });\n' +
'  window.addEventListener("mousedown", function(e) { if (!e.target.closest(".comparator-wrapper")) targetScrollPosition = null; }, { passive: true });\n' +
'  function frame() {\n' +
'    if (targetScrollPosition !== null) {\n' +
'      var delta = targetScrollPosition - window.scrollY;\n' +
'      if (Math.abs(delta) > 1) window.scrollBy(0, delta * scrollEase); else targetScrollPosition = null;\n' +
'    }\n' +
'    velocity *= friction;\n' +
'    if (velocity > 0.2 || velocity < -0.2) window.scrollBy(0, velocity * ease);\n' +
'    comparatorData.forEach(function(d) {\n' +
'      var v = parseFloat(getComputedStyle(d.comp).getPropertyValue("--scroll-progress")) || 0;\n' +
'      d.pct.textContent = (Math.round(v) + "").padStart(2, "0") + "%";\n' +
'      var currentStage = Math.round((v / 100) * (d.layerCount - 1));\n' +
'      d.indicators.forEach(function(ind, idx) { ind.classList.toggle("active", idx === currentStage); });\n' +
'    });\n' +
'    requestAnimationFrame(frame);\n' +
'  }\n' +
'  window.addEventListener("load", function() { createStageIndicators(); updateOffsets(); requestAnimationFrame(frame); });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'multi-stage-comparator',
        name: 'Comparador Multi-Etapa',
        icon: '🧭',
        description: 'Comparador de imágenes en varias etapas usando CSS scroll-timeline puro — el navegador calcula solas las ventanas de revelado, el z-index y la posición de las líneas divisoras según el número de imágenes; ideal para "antes / durante / después" de una reforma',
        sourceUrl: 'https://gist.github.com/Juanmaes83/9d21699a5e600064735b75cc35258ba0',
        build: build
    });
})();
