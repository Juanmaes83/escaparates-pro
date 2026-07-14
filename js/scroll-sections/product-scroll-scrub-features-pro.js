// Product Scroll Storytelling PRO
// Generic premium product launch experience: sticky scene, scroll-scrub video,
// progressive feature cards, progress bar, optional audio and CTA.
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

    function bool(v) { return String(v).toLowerCase() !== 'false'; }

    function build(mediaList, opts) {
        opts = opts || {};

        var brand = escapeHTML(opts.brand || 'Escaparates Pro');
        var productName = escapeHTML(opts.productName || 'Producto');
        var headline = escapeHTML(opts.headline || 'Diseñado para destacar.');
        var subtitle = escapeHTML(opts.subtitle || 'Cada detalle responde a una idea: hacer que el producto se sienta irresistible.');
        var eyebrow = escapeHTML(opts.eyebrow || 'Nuevo lanzamiento');
        var ctaLabel = escapeHTML(opts.ctaLabel || 'Descubrir más');
        var ctaUrl = safeUrl(opts.ctaUrl);
        var scrollLength = Math.max(300, Math.min(900, Number(opts.scrollLength) || 520));
        var scrubSmoothing = Math.max(0.03, Math.min(0.30, Number(opts.scrubSmoothing) || 0.12));
        var featureRevealStart = Math.max(0, Math.min(1, Number(opts.featureRevealStart) || 0.18));
        var featureRevealEnd = Math.max(featureRevealStart, Math.min(1, Number(opts.featureRevealEnd) || 0.78));
        var showNavigation = bool(opts.showNavigation);
        var showProgress = bool(opts.showProgress);
        var showPercentage = bool(opts.showPercentage);
        var showAudioControl = bool(opts.showAudioControl);
        var overlayStrength = Math.max(0, Math.min(0.85, Number(opts.overlayStrength) || 0.35));
        var primaryColor = escapeAttr(opts.primaryColor || '#ffffff');
        var secondaryColor = escapeAttr(opts.secondaryColor || '#8a8f9c');
        var backgroundColor = escapeAttr(opts.backgroundColor || '#0b0d12');
        var textColor = escapeAttr(opts.textColor || '#f4f0e8');

        var features = [];
        for (var i = 1; i <= 4; i++) {
            var label = opts['feature' + i + 'Label'];
            var title = opts['feature' + i + 'Title'];
            var text = opts['feature' + i + 'Text'];
            if (label || title || text) {
                features.push({
                    label: escapeHTML(label || ''),
                    title: escapeHTML(title || ''),
                    text: escapeHTML(text || '')
                });
            }
        }
        if (features.length === 0) {
            features = [
                { label: '01', title: 'Materiales premium', text: 'Acabados seleccionados para una sensación de calidad inmediata.' },
                { label: '02', title: 'Diseño funcional', text: 'Cada curva y cada junta responde a un propósito real.' },
                { label: '03', title: 'Rendimiento optimizado', text: 'Tecnología que mejora la experiencia sin complicarla.' }
            ];
        }

        var mainMedia = getMedia(mediaList, 0);
        var posterMedia = getMedia(mediaList, 1);
        var detailMedia = getMedia(mediaList, 2);
        var extraMedia = getMedia(mediaList, 3);

        var hasVideo = mainMedia && mainMedia.type === 'video';
        var mainUrl = mainMedia ? (mainMedia.url || '') : '';
        var posterUrl = posterMedia ? (posterMedia.url || '') : '';
        var detailUrl = detailMedia ? (detailMedia.url || '') : '';
        var extraUrl = extraMedia ? (extraMedia.url || '') : '';

        var mainVideoTag = hasVideo && mainUrl
            ? '<video id="pss-video" class="pss-media" src="' + escapeAttr(mainUrl) + '" muted playsinline preload="auto" poster="' + escapeAttr(posterUrl) + '"></video>'
            : '';
        var mainImageTag = !hasVideo && mainUrl
            ? '<img id="pss-image" class="pss-media" src="' + escapeAttr(mainUrl) + '" alt="' + escapeAttr(productName) + '">'
            : '';
        var fallbackTag = !hasVideo && !mainUrl
            ? '<div id="pss-fallback" class="pss-media pss-fallback"><span>Sube un vídeo o imagen en el slot 1</span></div>'
            : '';

        var detailTag = detailUrl
            ? (detailMedia && detailMedia.type === 'video'
                ? '<video class="pss-detail-media" src="' + escapeAttr(detailUrl) + '" autoplay muted loop playsinline></video>'
                : '<img class="pss-detail-media" src="' + escapeAttr(detailUrl) + '" alt="Detalle">')
            : '';
        var extraTag = extraUrl
            ? (extraMedia && extraMedia.type === 'video'
                ? '<video class="pss-extra-media" src="' + escapeAttr(extraUrl) + '" autoplay muted loop playsinline></video>'
                : '<img class="pss-extra-media" src="' + escapeAttr(extraUrl) + '" alt="Complementaria">')
            : '';

        var cardsHTML = features.map(function(f, i) {
            var side = i % 2 === 0 ? 'pss-card-left' : 'pss-card-right';
            return '<article class="pss-feature-card ' + side + '" data-feature="' + i + '">' +
                '<span class="pss-feature-label">' + f.label + '</span>' +
                '<h3>' + f.title + '</h3>' +
                '<p>' + f.text + '</p>' +
                '</article>';
        }).join('');

        var navHTML = showNavigation
            ? '<nav class="pss-nav"><span class="pss-logo">' + brand + '</span><a class="pss-cta-mini" href="' + escapeAttr(ctaUrl) + '">' + ctaLabel + '</a></nav>'
            : '';

        var progressHTML = showProgress
            ? '<div class="pss-progress" aria-hidden="true"><div class="pss-progress-bar"></div></div>'
            : '';

        var percentageHTML = showPercentage
            ? '<div class="pss-percentage" aria-live="polite"><span id="pss-percent">0</span>%</div>'
            : '';

        var audioHTML = showAudioControl
            ? '<button type="button" class="pss-audio" id="pss-audio" aria-label="Activar audio"><span id="pss-audio-icon">🔇</span><span class="pss-audio-label">Audio</span></button>'
            : '';

        return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
            '<title>' + brand + ' — ' + productName + '</title>\n' +
            '<style>\n' +
            ':root{--primary:' + primaryColor + ';--secondary:' + secondaryColor + ';--bg:' + backgroundColor + ';--text:' + textColor + ';--overlay:' + overlayStrength + '}\n' +
            '*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden}\n' +
            'button{font:inherit}a{color:inherit;text-decoration:none}\n' +
            '.pss-nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:0 4vw;height:68px;background:rgba(11,13,18,.7);backdrop-filter:blur(14px)}\n' +
            '.pss-logo{font-size:13px;font-weight:900;letter-spacing:.14em}\n' +
            '.pss-cta-mini{padding:10px 18px;border:1px solid rgba(255,255,255,.25);font-size:11px;font-weight:800;letter-spacing:.08em;transition:border-color .25s,color .25s}\n' +
            '.pss-cta-mini:hover{border-color:var(--primary);color:var(--primary)}\n' +
            '.pss-story{height:' + scrollLength + 'vh;position:relative}\n' +
            '.pss-sticky{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center}\n' +
            '.pss-media-layer{position:absolute;inset:0;z-index:0;background:var(--bg)}\n' +
            '.pss-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}\n' +
            '.pss-fallback{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1d26,var(--bg));color:rgba(255,255,255,.4);font-size:14px;text-align:center;padding:8vw}\n' +
            '.pss-overlay{position:absolute;inset:0;z-index:1;background:rgba(0,0,0,calc(var(--overlay) * 0.9));pointer-events:none}\n' +
            '.pss-content{position:relative;z-index:2;width:min(1200px,92vw);height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12vh 0}\n' +
            '.pss-hero-text{max-width:900px;margin-bottom:auto;padding-top:10vh}\n' +
            '.pss-eyebrow{font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:var(--secondary);margin-bottom:18px;display:block}\n' +
            '.pss-content h1{font-size:clamp(44px,8vw,120px);line-height:.88;letter-spacing:-.04em;margin-bottom:20px}\n' +
            '.pss-subtitle{font-size:clamp(15px,2vw,20px);line-height:1.5;max-width:560px;margin:0 auto;color:rgba(255,255,255,.75)}\n' +
            '.pss-cta-main{display:inline-flex;margin-top:26px;padding:15px 28px;background:var(--primary);color:#08090c;font-weight:900;font-size:12px;letter-spacing:.08em;border-radius:2px;transition:transform .25s,box-shadow .25s}\n' +
            '.pss-cta-main:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(0,0,0,.4)}\n' +
            '.pss-feature-card{position:absolute;width:min(320px,30vw);padding:26px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:4px;backdrop-filter:blur(14px);text-align:left;opacity:0;transform:translateY(30px);transition:opacity .6s ease,transform .6s ease}\n' +
            '.pss-feature-card.active{opacity:1;transform:translateY(0)}\n' +
            '.pss-card-left{left:5vw;top:50%}\n' +
            '.pss-card-right{right:5vw;top:50%}\n' +
            '.pss-feature-label{display:block;font-size:10px;font-weight:900;letter-spacing:.16em;color:var(--primary);margin-bottom:12px}\n' +
            '.pss-feature-card h3{font-size:20px;margin-bottom:10px;line-height:1.15}\n' +
            '.pss-feature-card p{font-size:14px;line-height:1.5;color:rgba(255,255,255,.7)}\n' +
            '.pss-progress{position:absolute;bottom:0;left:0;right:0;height:3px;z-index:4;background:rgba(255,255,255,.08)}\n' +
            '.pss-progress-bar{height:100%;width:0%;background:var(--primary);transition:width .08s linear}\n' +
            '.pss-percentage{position:absolute;right:4vw;bottom:34px;z-index:4;font-size:11px;font-weight:900;letter-spacing:.08em;color:rgba(255,255,255,.55)}\n' +
            '.pss-audio{position:absolute;left:4vw;bottom:28px;z-index:4;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:var(--text);padding:10px 14px;border-radius:999px;cursor:pointer;transition:background .25s}\n' +
            '.pss-audio:hover{background:rgba(255,255,255,.14)}\n' +
            '.pss-audio-label{font-size:11px;font-weight:800;letter-spacing:.06em}\n' +
            '.pss-detail-section,.pss-extra-section{min-height:70vh;display:grid;grid-template-columns:1fr 1fr;gap:6vw;align-items:center;padding:10vh 6vw;background:var(--bg)}\n' +
            '.pss-detail-media,.pss-extra-media{width:100%;height:480px;object-fit:cover;border-radius:4px;display:block}\n' +
            '.pss-detail-copy h2,.pss-extra-copy h2{font-size:clamp(32px,5vw,56px);line-height:.95;margin-bottom:20px}\n' +
            '.pss-detail-copy p,.pss-extra-copy p{font-size:16px;line-height:1.6;color:rgba(255,255,255,.7);max-width:440px}\n' +
            '@media (max-width:1024px){.pss-feature-card{position:relative;left:auto!important;right:auto!important;top:auto!important;width:min(520px,90vw);margin:16px auto;opacity:1;transform:none}.pss-content{height:auto;padding:14vh 0 8vh}.pss-hero-text{padding-top:0;margin-bottom:40px}.pss-story{height:auto}.pss-sticky{position:relative;height:auto}}\n' +
            '@media (max-width:700px){.pss-detail-section,.pss-extra-section{grid-template-columns:1fr}.pss-detail-media,.pss-extra-media{height:320px}.pss-content h1{font-size:clamp(34px,11vw,56px)}.pss-feature-card h3{font-size:18px}}\n' +
            '@media (prefers-reduced-motion:reduce){.pss-feature-card{transition:none}.pss-media{transform:none!important}}\n' +
            '</style>\n</head>\n<body>\n' +
            navHTML + '\n' +
            '<section class="pss-story" id="pss-story">\n' +
            '  <div class="pss-sticky">\n' +
            '    <div class="pss-media-layer">' + mainVideoTag + mainImageTag + fallbackTag + '</div>\n' +
            '    <div class="pss-overlay"></div>\n' +
            '    <div class="pss-content">\n' +
            '      <div class="pss-hero-text">\n' +
            '        <span class="pss-eyebrow">' + eyebrow + '</span>\n' +
            '        <h1>' + headline + '</h1>\n' +
            '        <p class="pss-subtitle">' + subtitle + '</p>\n' +
            '        <a class="pss-cta-main" href="' + escapeAttr(ctaUrl) + '">' + ctaLabel + '</a>\n' +
            '      </div>\n' + cardsHTML + '\n' +
            '    </div>\n' + progressHTML + percentageHTML + audioHTML + '\n' +
            '  </div>\n' +
            '</section>\n' +
            (detailTag ? '<section class="pss-detail-section"><div>' + detailTag + '</div><div class="pss-detail-copy"><h2>' + features[0].title + '</h2><p>' + features[0].text + '</p><a class="pss-cta-main" href="' + escapeAttr(ctaUrl) + '">' + ctaLabel + '</a></div></section>' : '') + '\n' +
            (extraTag ? '<section class="pss-extra-section"><div class="pss-extra-copy"><h2>' + (features[1] ? features[1].title : features[0].title) + '</h2><p>' + (features[1] ? features[1].text : features[0].text) + '</p></div><div>' + extraTag + '</div></section>' : '') + '\n' +
            '<script>\n' +
            '(function(){\n' +
            '  var story = document.getElementById("pss-story");\n' +
            '  var video = document.getElementById("pss-video");\n' +
            '  var image = document.getElementById("pss-image");\n' +
            '  var cards = [].slice.call(document.querySelectorAll(".pss-feature-card"));\n' +
            '  var bar = document.querySelector(".pss-progress-bar");\n' +
            '  var percent = document.getElementById("pss-percent");\n' +
            '  var audioBtn = document.getElementById("pss-audio");\n' +
            '  var audioIcon = document.getElementById("pss-audio-icon");\n' +
            '  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
            '  var smoothing = ' + scrubSmoothing + ';\n' +
            '  var revealStart = ' + featureRevealStart + ';\n' +
            '  var revealEnd = ' + featureRevealEnd + ';\n' +
            '  var duration = 0;\n' +
            '  var targetTime = 0;\n' +
            '  var currentTime = 0;\n' +
            '  var raf = null;\n' +
            '  var loaded = false;\n' +
            '\n' +
            '  function clamp(v){return Math.max(0,Math.min(1,v))}\n' +
            '  function lerp(a,b,t){return a+(b-a)*t}\n' +
            '\n' +
            '  function getProgress(){\n' +
            '    var rect = story.getBoundingClientRect();\n' +
            '    var span = story.offsetHeight - window.innerHeight;\n' +
            '    if (span <= 0) return 0;\n' +
            '    return clamp(-rect.top / span);\n' +
            '  }\n' +
            '\n' +
            '  function updateCards(p){\n' +
            '    var range = revealEnd - revealStart;\n' +
            '    if (range <= 0) range = 0.001;\n' +
            '    var local = clamp((p - revealStart) / range);\n' +
            '    var activeCount = Math.floor(local * (cards.length + 0.5));\n' +
            '    cards.forEach(function(card,i){\n' +
            '      card.classList.toggle("active", i < activeCount);\n' +
            '    });\n' +
            '  }\n' +
            '\n' +
            '  function render(){\n' +
            '    var p = getProgress();\n' +
            '    if (video && duration && !reduced) {\n' +
            '      targetTime = p;\n' +
            '      var diff = targetTime - currentTime;\n' +
            '      if (Math.abs(diff) < 0.02) currentTime = targetTime;\n' +
            '      else currentTime = lerp(currentTime, targetTime, smoothing * 2);\n' +
            '      video.currentTime = clamp(currentTime) * duration;\n' +
            '    }\n' +
            '    if (image && !reduced) {\n' +
            '      var s = 1 + p * 0.1;\n' +
            '      image.style.transform = "scale(" + s + ")";\n' +
            '    }\n' +
            '    updateCards(p);\n' +
            '    if (bar) bar.style.width = (p * 100) + "%";\n' +
            '    if (percent) percent.textContent = Math.round(p * 100);\n' +
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
            '  if (video) {\n' +
            '    function ready(){\n' +
            '      if (loaded) return;\n' +
            '      loaded = true;\n' +
            '      duration = video.duration || 0;\n' +
            '      if (duration) start();\n' +
            '    }\n' +
            '    video.addEventListener("loadedmetadata", ready);\n' +
            '    video.addEventListener("canplay", ready);\n' +
            '    video.addEventListener("error", function(){ video.style.display = "none"; });\n' +
            '    if (video.readyState >= 1) ready();\n' +
            '    video.pause();\n' +
            '  } else {\n' +
            '    start();\n' +
            '  }\n' +
            '\n' +
            '  window.addEventListener("scroll", function(){ if (!raf) raf = window.requestAnimationFrame(render); }, { passive: true });\n' +
            '  window.addEventListener("resize", render);\n' +
            '  window.addEventListener("beforeunload", stop);\n' +
            '\n' +
            '  if (audioBtn && video) {\n' +
            '    audioBtn.addEventListener("click", function(){\n' +
            '      video.muted = !video.muted;\n' +
            '      if (audioIcon) audioIcon.textContent = video.muted ? "🔇" : "🔊";\n' +
            '    });\n' +
            '  }\n' +
            '\n' +
            '  updateCards(0);\n' +
            '})();\n' +
            '</script>\n</body>\n</html>';
    }

    EP.ScrollSections.register({
        id: 'product-scroll-scrub-features-pro',
        name: 'Product Scroll Storytelling PRO',
        icon: 'PS',
        description: 'Presentación cinematográfica de producto con vídeo sincronizado al scroll, beneficios progresivos, barra de avance y CTA comercial.',
        sourceUrl: 'https://github.com/Juanmaes83/AirPods-Max-Symphony-of-Silence-SoundStudio',
        build: build
    });
})();
