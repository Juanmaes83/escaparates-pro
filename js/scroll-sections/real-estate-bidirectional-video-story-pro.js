// Real Estate Bidirectional Story PRO
// Scroll-driven cinematic real-estate narrative with video scrub, four editable
// phases, bidirectional playback and a premium editorial feel.
(function() {
    function escapeHTML(value) {
        return String(value || '').replace(/[&<>'"]/g, function(ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch];
        });
    }

    function escapeAttr(value) {
        return String(value || '').replace(/["']/g, function(ch) {
            return ch === '"' ? '&quot;' : '&#39;';
        });
    }

    function safeUrl(value) {
        var v = String(value || '').trim();
        if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
        if (/^#/.test(v)) return v;
        return '#';
    }

    function getMedia(mediaList, index) {
        var list = mediaList || [];
        if (index < list.length && list[index]) return list[index];
        return null;
    }

    function build(mediaList, opts) {
        opts = opts || {};

        var brand = escapeHTML(opts.brand || 'Escaparates Pro');
        var eyebrow = escapeHTML(opts.eyebrow || 'Narrativa inmobiliaria');
        var scrollLength = Math.max(300, Math.min(900, Number(opts.scrollLength) || 500));
        var scrubSmoothing = Math.max(0.03, Math.min(0.30, Number(opts.scrubSmoothing) || 0.12));
        var playbackMode = ['forward', 'forward-reverse', 'loop'].indexOf(opts.playbackMode) !== -1 ? opts.playbackMode : 'forward-reverse';
        var overlayStrength = Math.max(0, Math.min(0.85, Number(opts.overlayStrength) || 0.45));
        var textPosition = ['center', 'left', 'right'].indexOf(opts.textPosition) !== -1 ? opts.textPosition : 'center';
        var showPhaseDots = opts.showPhaseDots !== false;
        var showDirectionHint = opts.showDirectionHint !== false;
        var showProgress = opts.showProgress !== false;
        var accentColor = escapeAttr(opts.accentColor || '#d4af37');
        var textColor = escapeAttr(opts.textColor || '#ffffff');
        var ctaLabel = escapeHTML(opts.ctaLabel || 'Solicitar visita');
        var ctaUrl = safeUrl(opts.ctaUrl);

        var phases = [
            { title: escapeHTML(opts.phase1Title || 'El entorno'), subtitle: escapeHTML(opts.phase1Subtitle || 'Ubicación, luz y paisaje que lo cambian todo.') },
            { title: escapeHTML(opts.phase2Title || 'La arquitectura'), subtitle: escapeHTML(opts.phase2Subtitle || 'Espacios pensados para vivir con amplitud.') },
            { title: escapeHTML(opts.phase3Title || 'Los detalles'), subtitle: escapeHTML(opts.phase3Subtitle || 'Materiales, acabados y calidad en cada rincón.') },
            { title: escapeHTML(opts.phase4Title || 'Tu nuevo hogar'), subtitle: escapeHTML(opts.phase4Subtitle || 'Una propiedad que se siente tuya desde el primer momento.') }
        ];

        var mainMedia = getMedia(mediaList, 0);
        var posterMedia = getMedia(mediaList, 1);
        var ctaMedia = getMedia(mediaList, 2);

        var hasVideo = mainMedia && mainMedia.type === 'video';
        var mainUrl = mainMedia ? (mainMedia.url || '') : '';
        var posterUrl = posterMedia ? (posterMedia.url || '') : '';
        var ctaUrlMedia = ctaMedia ? (ctaMedia.url || '') : '';

        var mainVideoTag = hasVideo
            ? '<video id="rebs-video" class="rebs-media" src="' + escapeAttr(mainUrl) + '" muted playsinline preload="auto" poster="' + escapeAttr(posterUrl) + '"></video>'
            : '';
        var mainImageTag = !hasVideo && mainUrl
            ? '<img id="rebs-image" class="rebs-media" src="' + escapeAttr(mainUrl) + '" alt="Propiedad">'
            : '';
        var fallbackTag = !hasVideo && !mainUrl
            ? '<div id="rebs-fallback" class="rebs-media rebs-fallback"><span>Sube un vídeo o imagen en el slot 1</span></div>'
            : '';

        var ctaImageTag = ctaUrlMedia
            ? (ctaMedia && ctaMedia.type === 'video'
                ? '<video class="rebs-cta-media" src="' + escapeAttr(ctaUrlMedia) + '" autoplay muted loop playsinline></video>'
                : '<img class="rebs-cta-media" src="' + escapeAttr(ctaUrlMedia) + '" alt="Contacto">')
            : '';

        var textAlignClass = textPosition === 'left' ? 'rebs-text-left' : (textPosition === 'right' ? 'rebs-text-right' : 'rebs-text-center');

        var phasesHTML = phases.map(function(phase, i) {
            return '<div class="rebs-phase" data-phase="' + i + '">' +
                '<span class="rebs-phase-eyebrow">' + eyebrow + ' / 0' + (i + 1) + '</span>' +
                '<h2 class="rebs-phase-title">' + phase.title + '</h2>' +
                '<p class="rebs-phase-subtitle">' + phase.subtitle + '</p>' +
                '</div>';
        }).join('');

        var dotsHTML = '';
        if (showPhaseDots) {
            dotsHTML = '<div class="rebs-dots" aria-label="Fases de la narrativa">' +
                phases.map(function(_, i) { return '<button type="button" class="rebs-dot" data-dot="' + i + '" aria-label="Fase ' + (i + 1) + '"></button>'; }).join('') +
                '</div>';
        }

        var directionHTML = showDirectionHint
            ? '<div class="rebs-direction" aria-hidden="true"><span class="rebs-dir-arrow">↓</span><span class="rebs-dir-label">Scroll</span></div>'
            : '';

        var progressHTML = showProgress
            ? '<div class="rebs-progress" aria-hidden="true"><div class="rebs-progress-bar"></div></div>'
            : '';

        return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
            '<title>' + brand + ' — Real Estate Bidirectional Story PRO</title>\n' +
            '<style>\n' +
            ':root{--accent:' + accentColor + ';--text:' + textColor + ';--overlay:' + (Math.round(overlayStrength * 100) / 100) + '}\n' +
            '*{box-sizing:border-box;margin:0;padding:0}\n' +
            'html,body{background:#0b0d12;color:var(--text);font-family:Arial,Helvetica,sans-serif;overflow-x:hidden}\n' +
            'button{font:inherit}\n' +
            '.rebs-story{height:' + scrollLength + 'vh;position:relative}\n' +
            '.rebs-sticky{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center}\n' +
            '.rebs-media-layer{position:absolute;inset:0;z-index:0;background:#0b0d12}\n' +
            '.rebs-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}\n' +
            '.rebs-fallback{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1d26,#0b0d12);color:rgba(255,255,255,.45);font-size:clamp(14px,2vw,18px);text-align:center;padding:8vw}\n' +
            '.rebs-overlay{position:absolute;inset:0;z-index:1;background:rgba(0,0,0,calc(var(--overlay) * 0.85));pointer-events:none}\n' +
            '.rebs-vignette{position:absolute;inset:0;z-index:2;background:radial-gradient(circle at center,transparent 0%,rgba(0,0,0,.55) 100%);pointer-events:none}\n' +
            '.rebs-content{position:relative;z-index:3;width:min(1100px,88vw);text-align:center;padding:6vh 0}\n' +
            '.rebs-text-left{text-align:left;align-items:flex-start}\n' +
            '.rebs-text-right{text-align:right;align-items:flex-end}\n' +
            '.rebs-text-center{align-items:center}\n' +
            '.rebs-brand{position:absolute;top:24px;left:4vw;z-index:4;font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--text);opacity:.9}\n' +
            '.rebs-phase{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(900px,86vw);opacity:0;transition:opacity .6s ease,transform .6s ease;pointer-events:none}\n' +
            '.rebs-text-left .rebs-phase{left:4vw;transform:translate(0,-50%)}\n' +
            '.rebs-text-right .rebs-phase{left:auto;right:4vw;transform:translate(0,-50%)}\n' +
            '.rebs-phase.active{opacity:1;pointer-events:auto}\n' +
            '.rebs-phase-eyebrow{display:block;font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);margin-bottom:18px}\n' +
            '.rebs-phase-title{font-size:clamp(36px,7vw,92px);line-height:.92;letter-spacing:-.04em;margin-bottom:20px;text-shadow:0 8px 32px rgba(0,0,0,.55)}\n' +
            '.rebs-phase-subtitle{font-size:clamp(16px,2vw,22px);line-height:1.5;max-width:640px;margin:0 auto;color:rgba(255,255,255,.82);text-shadow:0 4px 18px rgba(0,0,0,.5)}\n' +
            '.rebs-text-left .rebs-phase-subtitle,.rebs-text-right .rebs-phase-subtitle{margin:0}\n' +
            '.rebs-cta{display:inline-flex;margin-top:28px;padding:15px 26px;background:var(--accent);color:#08090c;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:.08em;border-radius:2px;transition:transform .25s ease,box-shadow .25s ease}\n' +
            '.rebs-cta:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.35)}\n' +
            '.rebs-dots{position:absolute;right:3vw;top:50%;transform:translateY(-50%);z-index:4;display:flex;flex-direction:column;gap:14px}\n' +
            '.rebs-dot{width:10px;height:10px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:transparent;cursor:pointer;transition:background .25s,border-color .25s}\n' +
            '.rebs-dot.active{background:var(--accent);border-color:var(--accent)}\n' +
            '.rebs-direction{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);z-index:4;display:flex;flex-direction:column;align-items:center;gap:6px;color:rgba(255,255,255,.6);font-size:10px;letter-spacing:.14em;text-transform:uppercase;animation:rebs-bounce 2s infinite}\n' +
            '@keyframes rebs-bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}\n' +
            '.rebs-dir-arrow{font-size:16px}\n' +
            '.rebs-progress{position:absolute;bottom:0;left:0;right:0;height:3px;z-index:4;background:rgba(255,255,255,.1)}\n' +
            '.rebs-progress-bar{height:100%;width:0%;background:var(--accent);transition:width .08s linear}\n' +
            '.rebs-cta-section{min-height:60vh;display:flex;align-items:center;justify-content:center;position:relative;padding:8vh 6vw;background:#0b0d12}\n' +
            '.rebs-cta-inner{max-width:1100px;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:6vw;align-items:center}\n' +
            '.rebs-cta-media{width:100%;height:380px;object-fit:cover;border-radius:2px}\n' +
            '.rebs-cta-copy h2{font-size:clamp(32px,5vw,56px);line-height:1;letter-spacing:-.03em;margin-bottom:18px}\n' +
            '.rebs-cta-copy p{color:rgba(255,255,255,.7);line-height:1.55;max-width:420px;margin-bottom:24px}\n' +
            '@media (max-width:900px){.rebs-cta-inner{grid-template-columns:1fr}.rebs-cta-media{height:280px}.rebs-dots{right:auto;bottom:24px;top:auto;left:50%;transform:translateX(-50%);flex-direction:row}\n' +
            '.rebs-text-left .rebs-phase,.rebs-text-right .rebs-phase{left:50%;right:auto;transform:translate(-50%,-50%);text-align:center}\n' +
            '.rebs-text-left .rebs-phase-subtitle,.rebs-text-right .rebs-phase-subtitle{margin:0 auto}}\n' +
            '@media (prefers-reduced-motion:reduce){.rebs-direction,.rebs-phase{transition:none}.rebs-media{object-fit:cover}}\n' +
            '</style>\n</head>\n<body>\n' +
            '<div class="rebs-brand">' + brand + '</div>\n' +
            '<section class="rebs-story" id="rebs-story">\n' +
            '  <div class="rebs-sticky">\n' +
            '    <div class="rebs-media-layer">' + mainVideoTag + mainImageTag + fallbackTag + '</div>\n' +
            '    <div class="rebs-overlay"></div>\n' +
            '    <div class="rebs-vignette"></div>\n' +
            '    <div class="rebs-content ' + textAlignClass + '">\n' + phasesHTML + '\n' +
            '      <a class="rebs-cta" href="' + escapeAttr(ctaUrl) + '">' + ctaLabel + '</a>\n' +
            '    </div>\n' + dotsHTML + directionHTML + progressHTML + '\n' +
            '  </div>\n' +
            '</section>\n' +
            '<section class="rebs-cta-section">\n' +
            '  <div class="rebs-cta-inner">\n' +
            '    <div>' + ctaImageTag + '</div>\n' +
            '    <div class="rebs-cta-copy">\n' +
            '      <h2>' + phases[3].title + '</h2>\n' +
            '      <p>' + phases[3].subtitle + '</p>\n' +
            '      <a class="rebs-cta" href="' + escapeAttr(ctaUrl) + '">' + ctaLabel + '</a>\n' +
            '    </div>\n' +
            '  </div>\n' +
            '</section>\n' +
            '<script>\n' +
            '(function(){\n' +
            '  var story = document.getElementById("rebs-story");\n' +
            '  var video = document.getElementById("rebs-video");\n' +
            '  var image = document.getElementById("rebs-image");\n' +
            '  var phases = [].slice.call(document.querySelectorAll(".rebs-phase"));\n' +
            '  var dots = [].slice.call(document.querySelectorAll(".rebs-dot"));\n' +
            '  var bar = document.querySelector(".rebs-progress-bar");\n' +
            '  var dirArrow = document.querySelector(".rebs-dir-arrow");\n' +
            '  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
            '  var mode = ' + JSON.stringify(playbackMode) + ';\n' +
            '  var smoothing = ' + scrubSmoothing + ';\n' +
            '  var hasVideo = !!video;\n' +
            '  var duration = 0;\n' +
            '  var targetTime = 0;\n' +
            '  var currentTime = 0;\n' +
            '  var raf = null;\n' +
            '  var lastProgress = -1;\n' +
            '  var loaded = false;\n' +
            '\n' +
            '  function clamp(v){return Math.max(0,Math.min(1,v))}\n' +
            '  function lerp(a,b,t){return a + (b - a) * t}\n' +
            '\n' +
            '  function getProgress(){\n' +
            '    var rect = story.getBoundingClientRect();\n' +
            '    var span = story.offsetHeight - window.innerHeight;\n' +
            '    if (span <= 0) return 0;\n' +
            '    return clamp(-rect.top / span);\n' +
            '  }\n' +
            '\n' +
            '  function mapProgress(p){\n' +
            '    if (mode === "forward-reverse") {\n' +
            '      return p <= 0.5 ? p * 2 : 1 - (p - 0.5) * 2;\n' +
            '    }\n' +
            '    if (mode === "loop") {\n' +
            '      return p;\n' +
            '    }\n' +
            '    return p;\n' +
            '  }\n' +
            '\n' +
            '  function updatePhases(p){\n' +
            '    var active = Math.min(phases.length - 1, Math.floor(p * phases.length));\n' +
            '    phases.forEach(function(ph, i){\n' +
            '      ph.classList.toggle("active", i === active);\n' +
            '    });\n' +
            '    dots.forEach(function(dot, i){\n' +
            '      dot.classList.toggle("active", i === active);\n' +
            '    });\n' +
            '  }\n' +
            '\n' +
            '  function updateDirection(p){\n' +
            '    if (!dirArrow) return;\n' +
            '    dirArrow.textContent = p > 0.96 ? "↑" : "↓";\n' +
            '  }\n' +
            '\n' +
            '  function seek(){\n' +
            '    if (!hasVideo || !duration) return;\n' +
            '    var diff = targetTime - currentTime;\n' +
            '    if (Math.abs(diff) < 0.03) currentTime = targetTime;\n' +
            '    else currentTime = lerp(currentTime, targetTime, smoothing * 3);\n' +
            '    if (isFinite(currentTime) && isFinite(duration)) {\n' +
            '      video.currentTime = clamp(currentTime) * duration;\n' +
            '    }\n' +
            '  }\n' +
            '\n' +
            '  function render(){\n' +
            '    var p = getProgress();\n' +
            '    if (p === lastProgress) {\n' +
            '      raf = window.requestAnimationFrame(render);\n' +
            '      return;\n' +
            '    }\n' +
            '    lastProgress = p;\n' +
            '    var mediaProgress = mapProgress(p);\n' +
            '    if (hasVideo && duration) targetTime = mediaProgress;\n' +
            '    if (image && !reduced) {\n' +
            '      var s = 1 + mediaProgress * 0.12;\n' +
            '      image.style.transform = "scale(" + s + ")";\n' +
            '    }\n' +
            '    updatePhases(p);\n' +
            '    updateDirection(p);\n' +
            '    if (bar) bar.style.width = (p * 100) + "%";\n' +
            '    if (!reduced) seek();\n' +
            '    raf = window.requestAnimationFrame(render);\n' +
            '  }\n' +
            '\n' +
            '  function onScroll(){\n' +
            '    if (raf) return;\n' +
            '    raf = window.requestAnimationFrame(render);\n' +
            '  }\n' +
            '\n' +
            '  function start(){\n' +
            '    if (raf) window.cancelAnimationFrame(raf);\n' +
            '    raf = window.requestAnimationFrame(render);\n' +
            '  }\n' +
            '\n' +
            '  function stop(){\n' +
            '    if (raf) { window.cancelAnimationFrame(raf); raf = null; }\n' +
            '  }\n' +
            '\n' +
            '  if (hasVideo) {\n' +
            '    function ready(){\n' +
            '      if (loaded) return;\n' +
            '      loaded = true;\n' +
            '      duration = video.duration || 0;\n' +
            '      if (duration) start();\n' +
            '    }\n' +
            '    video.addEventListener("loadedmetadata", ready);\n' +
            '    video.addEventListener("canplay", ready);\n' +
            '    video.addEventListener("error", function(){\n' +
            '      video.style.display = "none";\n' +
            '    });\n' +
            '    if (video.readyState >= 1) ready();\n' +
            '    video.pause();\n' +
            '  } else {\n' +
            '    start();\n' +
            '  }\n' +
            '\n' +
            '  window.addEventListener("scroll", onScroll, { passive: true });\n' +
            '  window.addEventListener("resize", render);\n' +
            '  window.addEventListener("beforeunload", stop);\n' +
            '\n' +
            '  dots.forEach(function(dot){\n' +
            '    dot.addEventListener("click", function(){\n' +
            '      var i = Number(dot.dataset.dot);\n' +
            '      var span = story.offsetHeight - window.innerHeight;\n' +
            '      var top = story.offsetTop + (span * ((i + 0.5) / phases.length));\n' +
            '      window.scrollTo({ top: top, behavior: "smooth" });\n' +
            '    });\n' +
            '  });\n' +
            '\n' +
            '  updatePhases(0);\n' +
            '})();\n' +
            '</script>\n</body>\n</html>';
    }

    EP.ScrollSections.register({
        id: 'real-estate-bidirectional-video-story-pro',
        name: 'Real Estate Bidirectional Story PRO',
        icon: 'RE',
        description: 'Narrativa inmobiliaria cinematográfica con vídeo sincronizado al scroll, cuatro fases editables y reproducción bidireccional.',
        sourceUrl: 'https://github.com/Juanmaes83/INMOBILIARIA-STORYTELLING-SCROOL-PREMIUM',
        build: build
    });
})();
