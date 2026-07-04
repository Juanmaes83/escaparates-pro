// Scroll Sections — full-page scroll-driven templates (GSAP + Lenis/ScrollSmoother).
// Architecturally separate from EP.EffectBase (Three.js canvas loop): these are
// real-scroll DOM experiences with no fixed duration, built for the client to
// paste directly into their own website (one standalone .html file, no build step).
EP.ScrollSections = (function() {
    var TEMPLATES = {};

    function register(tpl) {
        TEMPLATES[tpl.id] = tpl;
    }

    function get(id) {
        return TEMPLATES[id] || null;
    }

    function getAll() {
        var list = [];
        for (var id in TEMPLATES) list.push(TEMPLATES[id]);
        return list;
    }

    // Normalizes whatever media source is available (EP.Media.getAll() slots,
    // or a plain array of {type, url}) into a flat list of {type, url}.
    function normalizeMedia(mediaList) {
        var out = [];
        (mediaList || []).forEach(function(m) {
            if (!m) return;
            var url = m.url;
            if (!url && m.element) {
                url = m.element.currentSrc || m.element.src || '';
            }
            if (!url) return;
            out.push({ type: m.type || 'image', url: url, name: m.name || '' });
        });
        return out;
    }

    // Cycles through available media to fill `count` slots, repeating if needed.
    function fillMedia(mediaList, count) {
        var norm = normalizeMedia(mediaList);
        if (norm.length === 0) return [];
        var out = [];
        for (var i = 0; i < count; i++) out.push(norm[i % norm.length]);
        return out;
    }

    // Builds a complete standalone HTML document string for a template —
    // this is exactly what gets downloaded / copy-pasted into the client site.
    function buildDocument(id, mediaList, opts) {
        var tpl = TEMPLATES[id];
        if (!tpl) return null;
        return tpl.build(mediaList || [], opts || {});
    }

    // Shared "curly cursor" tail — adapted from the CodePen gist "Satisfying
    // curly cursor" (spring-physics chain of points trailing the pointer,
    // drawn as a tapered quadratic-curve stroke on a fixed full-viewport
    // canvas). Templates with a custom cursor embed this snippet alongside
    // their own hover-label bubble rather than duplicating the physics code
    // in each file — each exported HTML document stays fully standalone,
    // this just avoids re-authoring the same ~30 lines three times over.
    function curlyCursorScript(color) {
        return '' +
'(function(){\n' +
'  var cCanvas = document.createElement("canvas");\n' +
'  cCanvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40;";\n' +
'  document.body.appendChild(cCanvas);\n' +
'  var cCtx = cCanvas.getContext("2d");\n' +
'  function cResize(){ cCanvas.width = window.innerWidth; cCanvas.height = window.innerHeight; }\n' +
'  cResize();\n' +
'  window.addEventListener("resize", cResize);\n' +
'\n' +
'  var cPointer = { x: 0.5 * window.innerWidth, y: 0.5 * window.innerHeight };\n' +
'  var cMoved = false;\n' +
'  var cParams = { pointsNumber: 24, widthFactor: 0.22, spring: 0.4, friction: 0.5 };\n' +
'  var cTrail = [];\n' +
'  for (var ci = 0; ci < cParams.pointsNumber; ci++) cTrail.push({ x: cPointer.x, y: cPointer.y, dx: 0, dy: 0 });\n' +
'\n' +
'  window.addEventListener("mousemove", function(e) { cMoved = true; cPointer.x = e.clientX; cPointer.y = e.clientY; });\n' +
'  window.addEventListener("touchmove", function(e) { if (e.touches[0]) { cMoved = true; cPointer.x = e.touches[0].clientX; cPointer.y = e.touches[0].clientY; } });\n' +
'  window.__cursorPointer = cPointer;\n' +
'\n' +
'  function cTick(t) {\n' +
'    if (!cMoved) {\n' +
'      cPointer.x = (0.5 + 0.3 * Math.cos(0.002 * t) * Math.sin(0.005 * t)) * window.innerWidth;\n' +
'      cPointer.y = (0.5 + 0.2 * Math.cos(0.005 * t) + 0.1 * Math.cos(0.01 * t)) * window.innerHeight;\n' +
'    }\n' +
'    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);\n' +
'    cTrail.forEach(function(p, idx) {\n' +
'      var prev = idx === 0 ? cPointer : cTrail[idx - 1];\n' +
'      var spring = idx === 0 ? 0.4 * cParams.spring : cParams.spring;\n' +
'      p.dx += (prev.x - p.x) * spring; p.dy += (prev.y - p.y) * spring;\n' +
'      p.dx *= cParams.friction; p.dy *= cParams.friction;\n' +
'      p.x += p.dx; p.y += p.dy;\n' +
'    });\n' +
'    cCtx.lineCap = "round";\n' +
'    cCtx.strokeStyle = "' + (color || 'rgba(255,255,255,0.55)') + '";\n' +
'    cCtx.beginPath();\n' +
'    cCtx.moveTo(cTrail[0].x, cTrail[0].y);\n' +
'    for (var i = 1; i < cTrail.length - 1; i++) {\n' +
'      var xc = 0.5 * (cTrail[i].x + cTrail[i + 1].x), yc = 0.5 * (cTrail[i].y + cTrail[i + 1].y);\n' +
'      cCtx.quadraticCurveTo(cTrail[i].x, cTrail[i].y, xc, yc);\n' +
'      cCtx.lineWidth = cParams.widthFactor * (cParams.pointsNumber - i);\n' +
'      cCtx.stroke();\n' +
'    }\n' +
'    cCtx.lineTo(cTrail[cTrail.length - 1].x, cTrail[cTrail.length - 1].y);\n' +
'    cCtx.stroke();\n' +
'    window.requestAnimationFrame(cTick);\n' +
'  }\n' +
'  window.requestAnimationFrame(cTick);\n' +
'})();\n';
    }

    return {
        register: register,
        get: get,
        getAll: getAll,
        normalizeMedia: normalizeMedia,
        fillMedia: fillMedia,
        buildDocument: buildDocument,
        curlyCursorScript: curlyCursorScript
    };
})();
