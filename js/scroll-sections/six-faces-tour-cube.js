// Six Faces Tour Cube — adapted from the CodePen gist "N > Six Faces / Walking
// The Cow V2" (source read & understood: a fixed, centered CSS 3D cube whose
// six faces each hold one image; a custom velocity-based smooth-scroll layer
// hijacks wheel input and eases the page's scrollY, and that eased scroll
// fraction drives both the cube's rotateX/rotateY (through six pre-defined
// "stops," one per face-turn) and a HUD readout (percentage, progress bar,
// current face name) plus a right-hand dot nav and click-to-jump anchor
// links). The source loops the same 6 images twice (12 stops) as a stylistic
// choice for its generative-art piece and swaps in "-dark.webp" image variants
// on theme toggle; both dropped here — one straight 360° turn maps cleanly to
// "one room per face," and the light/dark toggle now only recolors the UI
// rather than requiring a second set of client photos.
(function() {
    var FACE_ORDER = ['top', 'front', 'right', 'back', 'left', 'bottom'];
    // rotateX/rotateY the cube sits at when face N is fully "square to camera"
    var STOPS = [
        { rx: 90, ry: 0 }, { rx: 0, ry: 0 }, { rx: 0, ry: -90 },
        { rx: 0, ry: -180 }, { rx: 0, ry: -270 }, { rx: -90, ry: -360 }
    ];

    function faceMarkup(faceName, i, media, room) {
        var inner = media
            ? (media.type === 'video'
                ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
                : '<img src="' + media.url + '" alt="' + room.name + '">')
            : '<span class="face-ph">' + faceName.toUpperCase() + '</span>';
        return '<div class="face" data-face="' + faceName + '" data-i="' + i + '">' + inner + '</div>';
    }

    function cardMarkup(i, room, align) {
        var isFirst = i === 0;
        var cls = 'text-card' + (align === 'right' ? ' right' : align === 'center' ? ' center' : '');
        return '' +
'<section id="s' + i + '">\n' +
'  <div class="' + cls + '">\n' +
(isFirst ? '' : '    <div class="h-line"></div>\n') +
'    <div class="tag">' + (String(i + 1).padStart(2, '0')) + ' — ' + room.name + '</div>\n' +
'    <' + (isFirst ? 'h1' : 'h2') + '>' + room.name + '</' + (isFirst ? 'h1' : 'h2') + '>\n' +
'    <p class="body-text">' + room.desc + '</p>\n' +
'    <div class="cta-row">\n' +
(isFirst ? '' : '      <a class="cta-back" href="#s' + (i - 1) + '">← Anterior</a>\n') +
'      <a class="cta" href="#s' + ((i + 1) % room.total) + '">' + (i === room.total - 1 ? 'Volver al inicio' : 'Siguiente estancia →') + '</a>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var rooms = (opts.rooms && opts.rooms.length ? opts.rooms : [
            { title: 'Recibidor', year: 'La primera impresión marca el resto del recorrido — luz natural y materiales nobles desde la entrada.' },
            { title: 'Salón', year: 'Un espacio amplio y luminoso pensado para vivir, no solo para pasar.' },
            { title: 'Cocina', year: 'Diseño funcional con acabados de calidad, el corazón de la vivienda.' },
            { title: 'Dormitorio Principal', year: 'Descanso y calma, orientado para aprovechar la mejor luz del día.' },
            { title: 'Baño', year: 'Materiales nobles y un diseño atemporal en cada detalle.' },
            { title: 'Terraza', year: 'El exterior como una habitación más, con vistas abiertas.' }
        ]).slice(0, 6).map(function(r) { return { name: r.title || '', desc: r.year || '' }; });
        while (rooms.length < 6) rooms.push({ name: 'Estancia ' + (rooms.length + 1), desc: '' });

        var media = EP.ScrollSections.fillMedia(mediaList, 6);
        var facesHTML = FACE_ORDER.map(function(f, i) { return faceMarkup(f, i, media[i], rooms[i]); }).join('\n    ');
        var dotsHTML = rooms.map(function(_, i) { return '<a href="#s' + i + '" class="scene-dot' + (i === 0 ? ' active' : '') + '"></a>'; }).join('');
        var aligns = ['', 'right', '', 'right', '', 'right'];
        var sectionsHTML = rooms.map(function(r, i) {
            return cardMarkup(i, { name: r.name, desc: r.desc, total: 6 }, aligns[i]);
        }).join('\n  ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Recorrido Cubo 3D</title>\n' +
'<style>\n' +
'*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}\n' +
':root{color-scheme:dark;--dark-bg:#1c1814;--dark-fg:#ede8df;--dark-muted:#8a7b6e;--light-bg:#f0ece3;--light-fg:#0d0d14;--light-muted:#9a9aaa;--accent-dark:#d4a84b;--accent-light:#3a6e00;--bg:var(--dark-bg);--fg:var(--dark-fg);--muted:var(--dark-muted);--accent:var(--accent-dark);--ui-inset:2rem;--card-bg:rgba(28,24,20,0.82);--card-border:rgba(212,168,75,0.2);}\n' +
'body{background:var(--bg);color:var(--fg);font-family:Arial,Helvetica,sans-serif;overflow-x:hidden;transition:background 0.3s ease,color 0.3s ease;}\n' +
'#scene{position:fixed;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;perspective:1100px;pointer-events:none;}\n' +
'#scroll_container{position:relative;z-index:1;}\n' +
'section{min-height:100vh;display:flex;align-items:center;padding:6rem calc(5rem + var(--ui-inset)) 6rem 5rem;}\n' +
'#cube{--s:min(74vw,74vh,560px);width:var(--s);height:var(--s);position:relative;transform-style:preserve-3d;transform:rotateX(90deg) rotateY(0deg);will-change:transform;}\n' +
'.face{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;background:#14100d;}\n' +
'.face img,.face video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}\n' +
'.face-ph{position:absolute;bottom:1.5rem;left:1.75rem;font-size:clamp(2rem,8vw,5rem);letter-spacing:0.04em;color:rgba(255,255,255,0.06);}\n' +
'.face[data-face="front"]{transform:translateZ(calc(var(--s) / 2));}\n' +
'.face[data-face="back"]{transform:rotateY(180deg) translateZ(calc(var(--s) / 2));}\n' +
'.face[data-face="right"]{transform:rotateY(90deg) translateZ(calc(var(--s) / 2));}\n' +
'.face[data-face="left"]{transform:rotateY(-90deg) translateZ(calc(var(--s) / 2));}\n' +
'.face[data-face="top"]{transform:rotateX(-90deg) translateZ(calc(var(--s) / 2));}\n' +
'.face[data-face="bottom"]{transform:rotateX(90deg) translateZ(calc(var(--s) / 2));}\n' +
'#hud{position:fixed;top:var(--ui-inset);right:var(--ui-inset);z-index:10;text-align:right;font-size:0.65rem;letter-spacing:0.15em;color:var(--muted);text-transform:uppercase;}\n' +
'#hud .progress-bar{width:7.5rem;height:1px;background:var(--muted);margin-block-start:0.5rem;margin-inline-start:auto;position:relative;overflow:hidden;}\n' +
'#hud .progress-fill{position:absolute;inset-block:0;inset-inline-start:0;width:0%;background:var(--accent);transition:width 0.1s linear;}\n' +
'#hud .scene-label{font-size:0.6rem;color:var(--accent);margin-block-start:0.4rem;}\n' +
'#scene_strip{position:fixed;left:calc(var(--ui-inset) + 0.125rem);top:50%;translate:-50% -50%;z-index:10;display:flex;flex-direction:column;gap:0.75rem;}\n' +
'.scene-dot{position:relative;display:block;width:0.25rem;height:0.25rem;border-radius:50%;background:var(--muted);transition:background 0.3s,scale 0.3s;cursor:pointer;}\n' +
'.scene-dot.active{background:var(--accent);scale:1.8;}\n' +
'#theme_toggle{position:fixed;bottom:var(--ui-inset);left:calc(var(--ui-inset) + 0.125rem);translate:-50% 0;z-index:10;width:2rem;height:2rem;border:none;background:color-mix(in srgb,var(--muted) 35%,transparent);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}\n' +
'#theme_toggle svg{width:0.875rem;height:0.875rem;position:absolute;transition:opacity 0.3s ease,rotate 0.3s ease;color:var(--accent);}\n' +
'#theme_toggle .icon-sun{opacity:1;rotate:0deg;}\n' +
'#theme_toggle .icon-moon{opacity:0;rotate:90deg;}\n' +
'#face_caption{position:fixed;bottom:var(--ui-inset);left:50%;translate:-50% 0;z-index:10;text-align:center;pointer-events:none;}\n' +
'#face_caption_num{font-size:0.58rem;letter-spacing:0.28em;color:var(--accent);text-transform:uppercase;margin-block-end:0.15rem;}\n' +
'#face_caption_name{font-size:clamp(1.8rem,5vw,3.5rem);letter-spacing:0.08em;color:var(--muted);opacity:0.5;line-height:1;}\n' +
'.text-card{max-width:23.75rem;padding:2.25rem 2rem;background:var(--card-bg);border-left:1px solid var(--card-border);backdrop-filter:blur(6px) saturate(120%);}\n' +
'.text-card.right{margin-inline-start:auto;border-left:none;border-right:1px solid var(--card-border);text-align:right;}\n' +
'.text-card.right .h-line{transform-origin:right;margin-inline-start:auto;}\n' +
'.tag{font-size:0.6rem;letter-spacing:0.25em;text-transform:uppercase;color:var(--accent);margin-block-end:1.1rem;}\n' +
'h1,h2{font-weight:400;letter-spacing:0.03em;line-height:0.92;}\n' +
'h1{font-size:clamp(3rem,8vw,6.5rem);}\n' +
'h2{font-size:clamp(2.2rem,5vw,4rem);}\n' +
'.body-text{font-size:0.85rem;line-height:1.8;color:color-mix(in srgb,var(--fg) 65%,transparent);margin-block-start:1.25rem;}\n' +
'.h-line{width:3.125rem;height:1px;background:var(--accent);margin-block-end:1.2rem;transform-origin:left;}\n' +
'.cta-row{display:flex;align-items:center;justify-content:flex-start;gap:0.75rem;margin-block-start:1.75rem;}\n' +
'.text-card.right .cta-row{justify-content:flex-end;}\n' +
'.cta,.cta-back{display:inline-flex;align-items:center;gap:0.6rem;padding:0.6rem 1.25rem;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;cursor:pointer;transition:background 0.2s,color 0.2s;}\n' +
'.cta{border:1px solid var(--accent);color:var(--accent);}\n' +
'.cta:hover{background:var(--accent);color:var(--bg);}\n' +
'.cta-back{border:1px solid color-mix(in srgb,var(--muted) 45%,transparent);color:var(--muted);}\n' +
'.cta-back:hover{background:color-mix(in srgb,var(--muted) 12%,transparent);color:var(--fg);}\n' +
':root[data-theme="light"]{color-scheme:light;--bg:var(--light-bg);--fg:var(--light-fg);--muted:var(--light-muted);--accent:var(--accent-light);--card-bg:rgba(240,236,227,0.08);--card-border:rgba(58,110,0,0.14);}\n' +
':root[data-theme="light"] .face{background:#ddd8cf;}\n' +
':root[data-theme="light"] #theme_toggle .icon-sun{opacity:0;rotate:-90deg;}\n' +
':root[data-theme="light"] #theme_toggle .icon-moon{opacity:1;rotate:0deg;}\n' +
'@media (width <= 56.25em){#hud{top:1rem;right:1rem;}#scene_strip{display:none;}#theme_toggle{bottom:1rem;left:1.25rem;translate:0 0;}#face_caption{bottom:1rem;}section{min-height:150vh;align-items:flex-end;padding:0 1.5rem 3.5rem;}#s0{min-height:100vh;align-items:center;padding:4rem 1.5rem;}.text-card{max-width:100%;padding:1.5rem 1.25rem;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div id="scene"><div id="cube">\n' +
'    ' + facesHTML + '\n' +
'</div></div>\n' +
'<div id="hud"><div id="hud_pct">000%</div><div class="progress-bar"><div class="progress-fill" id="prog_fill"></div></div><div class="scene-label" id="scene_name"></div></div>\n' +
'<button id="theme_toggle" aria-label="Cambiar modo claro/oscuro">\n' +
'  <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>\n' +
'  <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>\n' +
'</button>\n' +
'<div id="scene_strip">' + dotsHTML + '</div>\n' +
'<div id="face_caption"><div id="face_caption_num">01</div><div id="face_caption_name"></div></div>\n' +
'<div id="scroll_container">\n' +
'  ' + sectionsHTML + '\n' +
'</div>\n' +
'<script>\n' +
'(function(){\n' +
'  var FACE_NAMES = ' + JSON.stringify(rooms.map(function(r) { return r.name; })) + ';\n' +
'  var STOPS = ' + JSON.stringify(STOPS) + ';\n' +
'  var N = 6;\n' +
'  var dom = {\n' +
'    cube: document.getElementById("cube"),\n' +
'    strip: document.getElementById("scene_strip"),\n' +
'    hudPct: document.getElementById("hud_pct"),\n' +
'    progFill: document.getElementById("prog_fill"),\n' +
'    sceneName: document.getElementById("scene_name"),\n' +
'    captionNum: document.getElementById("face_caption_num"),\n' +
'    captionName: document.getElementById("face_caption_name"),\n' +
'    themeToggle: document.getElementById("theme_toggle")\n' +
'  };\n' +
'  var sceneDots = Array.prototype.slice.call(document.querySelectorAll(".scene-dot"));\n' +
'  var sections = Array.prototype.slice.call(document.querySelectorAll("#scroll_container section"));\n' +
'  var lastFaceIdx = -1;\n' +
'\n' +
'  var mq = window.matchMedia("(prefers-color-scheme: dark)");\n' +
'  function applyTheme(theme) {\n' +
'    document.documentElement.setAttribute("data-theme", theme);\n' +
'    document.documentElement.style.colorScheme = theme;\n' +
'  }\n' +
'  applyTheme(mq.matches ? "dark" : "light");\n' +
'  dom.themeToggle.addEventListener("click", function() {\n' +
'    var cur = document.documentElement.getAttribute("data-theme") || "dark";\n' +
'    applyTheme(cur === "dark" ? "light" : "dark");\n' +
'  });\n' +
'\n' +
'  var sectionTops = [];\n' +
'  function buildSectionTops() { sectionTops = sections.map(function(s) { return s.getBoundingClientRect().top + window.scrollY; }); }\n' +
'  function sectionIndexFromScroll(y) {\n' +
'    var mid = y + innerHeight * 0.5, idx = 0;\n' +
'    for (var i = 0; i < sectionTops.length; i++) if (mid >= sectionTops[i]) idx = i;\n' +
'    return Math.min(idx, N - 1);\n' +
'  }\n' +
'\n' +
'  var easeIO = function(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; };\n' +
'  function setCubeTransform(s) {\n' +
'    var t = s * (N - 1);\n' +
'    var i = Math.min(Math.floor(t), N - 2);\n' +
'    var f = easeIO(t - i);\n' +
'    var a = STOPS[i], b = STOPS[i + 1];\n' +
'    var rx = a.rx + (b.rx - a.rx) * f, ry = a.ry + (b.ry - a.ry) * f;\n' +
'    dom.cube.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)";\n' +
'  }\n' +
'\n' +
'  function updateHUD(s) {\n' +
'    var p = Math.round(s * 100);\n' +
'    var si = sectionIndexFromScroll(window.scrollY);\n' +
'    dom.hudPct.textContent = String(p).padStart(3, "0") + "%";\n' +
'    dom.progFill.style.width = p + "%";\n' +
'    if (si !== lastFaceIdx) {\n' +
'      lastFaceIdx = si;\n' +
'      var name = FACE_NAMES[si] || "";\n' +
'      dom.sceneName.textContent = name;\n' +
'      dom.captionNum.textContent = String(si + 1).padStart(2, "0");\n' +
'      dom.captionName.textContent = name;\n' +
'      sceneDots.forEach(function(d, i) { d.classList.toggle("active", i === si); });\n' +
'    }\n' +
'  }\n' +
'\n' +
'  var maxScroll = 1, lastScrollHeight = 0, lastInnerHeight = 0;\n' +
'  function resize() {\n' +
'    var h = document.documentElement.scrollHeight, vh = innerHeight;\n' +
'    if (h === lastScrollHeight && vh === lastInnerHeight) return;\n' +
'    lastScrollHeight = h; lastInnerHeight = vh;\n' +
'    maxScroll = Math.max(1, h - vh);\n' +
'    buildSectionTops();\n' +
'  }\n' +
'  resize();\n' +
'\n' +
'  var tgt = 0, smooth = 0, velocity = 0;\n' +
'  var ease = 0.1;\n' +
'  function dynamicFriction(v) { return Math.abs(v) > 200 ? 0.8 : 0.9; }\n' +
'\n' +
'  window.addEventListener("resize", function() { resize(); tgt = maxScroll > 0 ? window.scrollY / maxScroll : 0; smooth = tgt; });\n' +
'  window.addEventListener("scroll", function() { tgt = Math.max(0, Math.min(1, maxScroll > 0 ? window.scrollY / maxScroll : 0)); }, { passive: true });\n' +
'  window.addEventListener("wheel", function(e) {\n' +
'    e.preventDefault();\n' +
'    var linePx = 16, pagePx = innerHeight * 0.9;\n' +
'    var delta = e.deltaMode === 1 ? e.deltaY * linePx : e.deltaMode === 2 ? e.deltaY * pagePx : e.deltaY;\n' +
'    if (Math.abs(delta) < 5) return;\n' +
'    stopAnchorAnim();\n' +
'    velocity += delta;\n' +
'    velocity = Math.max(-600, Math.min(600, velocity));\n' +
'  }, { passive: false });\n' +
'\n' +
'  var lastNow = performance.now();\n' +
'  function frame(now) {\n' +
'    requestAnimationFrame(frame);\n' +
'    if (document.hidden) { lastNow = now; return; }\n' +
'    var dt = Math.min((now - lastNow) / 1000, 0.05);\n' +
'    lastNow = now;\n' +
'    velocity *= Math.pow(dynamicFriction(velocity), dt * 60);\n' +
'    if (Math.abs(velocity) < 0.01) velocity = 0;\n' +
'    if (Math.abs(velocity) > 0.2) {\n' +
'      var next = Math.max(0, Math.min(window.scrollY + velocity * ease, maxScroll));\n' +
'      window.scrollTo(0, next);\n' +
'      tgt = next / maxScroll;\n' +
'    }\n' +
'    smooth += (tgt - smooth) * (1 - Math.exp(-dt * 8));\n' +
'    smooth = Math.max(0, Math.min(1, smooth));\n' +
'    updateHUD(smooth);\n' +
'    setCubeTransform(smooth);\n' +
'  }\n' +
'  requestAnimationFrame(frame);\n' +
'\n' +
'  var anchorAnim = null;\n' +
'  function stopAnchorAnim() { if (anchorAnim) { cancelAnimationFrame(anchorAnim); anchorAnim = null; } }\n' +
'  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }\n' +
'  function smoothScrollToY(targetY, duration) {\n' +
'    duration = duration || 900;\n' +
'    stopAnchorAnim();\n' +
'    velocity = 0;\n' +
'    var startY = window.scrollY, diff = targetY - startY, start = performance.now();\n' +
'    function tick(now) {\n' +
'      var p = Math.min(1, (now - start) / duration);\n' +
'      var y = startY + diff * easeInOutCubic(p);\n' +
'      window.scrollTo(0, y);\n' +
'      tgt = y / maxScroll; smooth = tgt;\n' +
'      if (p < 1) anchorAnim = requestAnimationFrame(tick); else anchorAnim = null;\n' +
'    }\n' +
'    anchorAnim = requestAnimationFrame(tick);\n' +
'  }\n' +
'  window.addEventListener("touchstart", stopAnchorAnim, { passive: true });\n' +
'  window.addEventListener("mousedown", stopAnchorAnim, { passive: true });\n' +
'\n' +
'  document.addEventListener("click", function(e) {\n' +
'    var a = e.target.closest(\'a[href^="#s"]\');\n' +
'    if (!a) return;\n' +
'    var target = document.querySelector(a.getAttribute("href"));\n' +
'    if (!target) return;\n' +
'    e.preventDefault();\n' +
'    var idx = sections.indexOf(target);\n' +
'    var baseY = idx >= 0 ? sectionTops[idx] : target.getBoundingClientRect().top + window.scrollY;\n' +
'    smoothScrollToY(Math.max(0, baseY));\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'six-faces-tour-cube',
        name: 'Cubo de Recorrido 6 Caras',
        icon: '🎲',
        description: 'Cubo 3D fijo con scroll suave propio (física de velocidad) que rota una cara por cada estancia — HUD con porcentaje y barra de progreso, navegación por puntos, y ficha lateral por estancia; recorrido inmobiliario original en vez de galería lineal',
        sourceUrl: 'https://gist.github.com/Juanmaes83/7171c4f21a2123c864a32f66e8522c3c',
        build: build
    });
})();
