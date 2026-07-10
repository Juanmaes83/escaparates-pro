// Website Modules Lab - isolated cinematic web sections.
// Source reference: Juanmaes83/cinematic-site-components, MIT by Jay from RoboLabs.
// Each build returns a standalone final viewer HTML. Nothing is loaded into the app core.
window.EP = window.EP || {};
EP.WebsiteModules = (function() {
    var MODULES = {};

    var DEFAULTS = {
        headline: 'Built Different',
        subtitle: 'Una seccion cinematografica lista para campanas, producto y branding.',
        cta: 'Descubrir',
        url: '#',
        primaryColor: '#d7a86e',
        secondaryColor: '#f5efe6',
        backgroundColor: '#07080b',
        fontFamily: 'Outfit',
        logoText: 'Escaparates Pro',
        speed: 1,
        intensity: 1,
        scrollLength: 3,
        mediaMode: 'uploaded'
    };

    var SCHEMA = [
        { key: 'headline', type: 'text', label: 'Headline', default: DEFAULTS.headline },
        { key: 'subtitle', type: 'textarea', label: 'Subtitle / narrativa', default: DEFAULTS.subtitle },
        { key: 'cta', type: 'text', label: 'CTA', default: DEFAULTS.cta },
        { key: 'url', type: 'url', label: 'URL destino', default: DEFAULTS.url },
        { key: 'primaryColor', type: 'color', label: 'Color principal', default: DEFAULTS.primaryColor },
        { key: 'secondaryColor', type: 'color', label: 'Color texto', default: DEFAULTS.secondaryColor },
        { key: 'backgroundColor', type: 'color', label: 'Fondo', default: DEFAULTS.backgroundColor },
        { key: 'fontFamily', type: 'select', label: 'Fuente', default: DEFAULTS.fontFamily, options: ['Outfit', 'Inter Tight', 'Georgia', 'Arial'] },
        { key: 'logoText', type: 'text', label: 'Marca / logo texto', default: DEFAULTS.logoText },
        { key: 'speed', type: 'range', label: 'Velocidad', min: 0.4, max: 2, step: 0.1, default: DEFAULTS.speed },
        { key: 'intensity', type: 'range', label: 'Intensidad visual', min: 0.2, max: 2, step: 0.1, default: DEFAULTS.intensity },
        { key: 'scrollLength', type: 'range', label: 'Scroll length', min: 1.5, max: 6, step: 0.5, default: DEFAULTS.scrollLength }
    ];

    function register(module) { MODULES[module.id] = module; }
    function get(id) { return MODULES[id] || null; }
    function getAll() { return Object.keys(MODULES).map(function(id) { return MODULES[id]; }); }
    function getSchema() { return SCHEMA.slice(); }

    function escapeHTML(value) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(value == null ? '' : String(value)));
        return div.innerHTML;
    }

    function escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
    }

    function cssUrl(value) {
        return String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '');
    }

    function safeUrl(value) {
        var url = String(value || '#').trim();
        if (!url || url === '#') return '#';
        if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
        return '#';
    }

    function normalizeOptions(opts) {
        var out = {};
        SCHEMA.forEach(function(field) {
            var value = opts && opts[field.key] != null ? opts[field.key] : field.default;
            if (field.type === 'range') value = Math.max(field.min, Math.min(field.max, parseFloat(value) || field.default));
            out[field.key] = value;
        });
        return out;
    }

    function normalizeMedia(mediaList) {
        var out = [];
        (mediaList || []).forEach(function(item) {
            if (!item) return;
            var url = item.url;
            if (!url && item.element) url = item.element.currentSrc || item.element.src || '';
            if (!url) return;
            out.push({ type: item.type || 'image', url: url, name: item.name || '' });
        });
        return out;
    }

    function mediaAt(mediaList, index, fallback) {
        var media = normalizeMedia(mediaList);
        if (!media.length) return { type: 'image', url: fallback || '', name: 'fallback' };
        return media[index % media.length];
    }

    function mediaMarkup(media, className, alt) {
        if (!media || !media.url) return '<div class="' + className + ' wm-gradient-fallback"></div>';
        if (media.type === 'video') {
            return '<video class="' + className + '" src="' + escapeAttr(media.url) + '" autoplay muted loop playsinline></video>';
        }
        return '<img class="' + className + '" src="' + escapeAttr(media.url) + '" alt="' + escapeAttr(alt || media.name || 'Media') + '">';
    }

    function bgLayer(media, className) {
        if (!media || !media.url) return '<div class="' + className + ' wm-gradient-fallback"></div>';
        if (media.type === 'video') {
            return '<video class="' + className + '" src="' + escapeAttr(media.url) + '" autoplay muted loop playsinline></video>';
        }
        return '<div class="' + className + '" style="background-image:url(&quot;' + cssUrl(media.url) + '&quot;)"></div>';
    }

    function fontCSS(fontFamily) {
        if (fontFamily === 'Georgia') return "Georgia, 'Times New Roman', serif";
        if (fontFamily === 'Arial') return "Arial, Helvetica, sans-serif";
        if (fontFamily === 'Inter Tight') return "'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif";
        return "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
    }

    function gsapScripts() {
        return '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>\n' +
            '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"><\/script>\n';
    }

    function baseHead(title, opts) {
        var fontHref = opts.fontFamily === 'Inter Tight'
            ? 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700;800;900&display=swap'
            : 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap';
        return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
            '<title>' + escapeHTML(title) + '</title>' +
            '<link href="' + fontHref + '" rel="stylesheet">' +
            '<meta name="escaparates-module-source" content="cinematic-site-components MIT Jay from RoboLabs">' +
            '<style>';
    }

    function baseCSS(opts) {
        return ':root{--bg:' + opts.backgroundColor + ';--text:' + opts.secondaryColor + ';--accent:' + opts.primaryColor + ';--muted:rgba(245,239,230,.66);--line:rgba(255,255,255,.14);--glass:rgba(255,255,255,.075);--font:' + fontCSS(opts.fontFamily) + ';}' +
            '*{box-sizing:border-box}html{background:var(--bg);scroll-behavior:smooth}body{margin:0;width:100%;min-height:100%;background:var(--bg);color:var(--text);font-family:var(--font);overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}' +
            'a{color:inherit}.wm-brand{position:fixed;top:22px;left:24px;z-index:80;display:flex;align-items:center;gap:10px;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--text);text-shadow:0 10px 34px rgba(0,0,0,.6)}.wm-brand::before{content:"";width:30px;height:30px;border-radius:10px;background:linear-gradient(135deg,var(--accent),rgba(255,255,255,.92));box-shadow:0 16px 46px color-mix(in srgb,var(--accent),transparent 62%)}' +
            '.wm-cta{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 24px;border-radius:999px;background:linear-gradient(135deg,var(--accent),#ffe3b4);color:#08080a;text-decoration:none;font-weight:900;box-shadow:0 20px 58px color-mix(in srgb,var(--accent),transparent 70%),inset 0 1px 0 rgba(255,255,255,.45)}' +
            '.wm-kicker{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);font-weight:900}.wm-gradient-fallback{background:radial-gradient(circle at 25% 20%,color-mix(in srgb,var(--accent),white 18%),transparent 22%),radial-gradient(circle at 70% 76%,#34465d,transparent 28%),linear-gradient(135deg,#191b22,#050507 74%)}' +
            'img,video{display:block;max-width:100%}.grain{position:fixed;inset:0;pointer-events:none;z-index:70;opacity:.12;background-image:url("data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.9%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%27.55%27/%3E%3C/svg%3E")}' +
            '@media(max-width:720px){.wm-brand{top:12px;left:12px;font-size:10px}.wm-brand::before{width:24px;height:24px}.wm-cta{width:100%;min-height:48px}}' +
            '@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.001ms!important}.wm-reduced-hide{display:none!important}}';
    }

    function attribution() {
        return '<div style="position:fixed;left:0;right:0;bottom:0;z-index:90;padding:7px 12px;text-align:center;font:11px system-ui,sans-serif;color:rgba(255,255,255,.54);background:rgba(0,0,0,.46);backdrop-filter:blur(10px)">MIT source: cinematic-site-components by Jay from RoboLabs / RoboNuggets. Adapted in Escaparates Pro.</div>';
    }

    function closeDoc(body, scripts) {
        return '</style></head><body>' + body + attribution() + (scripts || '') + '<div class="grain"></div></body></html>';
    }

    function splitHeadline(text) {
        var clean = escapeHTML(text || '').trim();
        if (!clean) clean = 'Built Different';
        var words = clean.split(/\s+/);
        if (words.length < 3) return clean.replace(/\s+/g, '<br>');
        var mid = Math.ceil(words.length / 2);
        return words.slice(0, mid).join(' ') + '<br>' + words.slice(mid).join(' ');
    }

    function numberedTitle(index, title, fallback) {
        return escapeHTML(title || fallback || ('Momento ' + index));
    }

    function buildTextMask(mediaList, rawOpts) {
        var opts = normalizeOptions(rawOpts);
        var media = mediaAt(mediaList, 0);
        var fill = mediaAt(mediaList, 1, media.url);
        var scroll = Math.round(opts.scrollLength * 105);
        var css = baseCSS(opts) +
            '.hero{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px 24px;position:relative;overflow:hidden}.hero::before{content:"";position:absolute;inset:-20%;background:radial-gradient(circle at 50% 22%,color-mix(in srgb,var(--accent),transparent 70%),transparent 30%),linear-gradient(180deg,transparent,rgba(0,0,0,.52));pointer-events:none}.hero-label{position:relative;margin-bottom:22px}.hero h1{position:relative;font-size:clamp(36px,6vw,78px);font-weight:300;line-height:1.05;max-width:900px;letter-spacing:-.035em;margin:0}.hero h1 strong,.hero h1 span{font-weight:900;color:var(--accent)}.hero p{position:relative;margin:22px auto 0;font-size:clamp(16px,2vw,22px);line-height:1.45;color:var(--muted);max-width:700px}.scroll-hint{position:relative;margin-top:48px;font-size:12px;color:var(--muted);letter-spacing:.16em;text-transform:uppercase;animation:pulse 2s ease-in-out infinite}@keyframes pulse{50%{opacity:.35}}' +
            '.mask-section{position:relative;min-height:' + scroll + 'vh}.mask-sticky{position:sticky;top:0;height:100dvh;display:flex;align-items:center;justify-content:center;overflow:hidden}.mask-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background-size:cover;background-position:center;opacity:.72;filter:saturate(' + (1.05 + opts.intensity * .14).toFixed(2) + ') contrast(1.05)}.mask-section::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,transparent 0 28%,rgba(0,0,0,.55) 76%);pointer-events:none}.mask-overlay{position:absolute;inset:0;background:rgba(7,8,11,.92);display:flex;align-items:center;justify-content:center}.mask-text,.mask-text-filled{font-size:clamp(64px,15vw,230px);font-weight:900;letter-spacing:-.06em;line-height:.86;text-align:center;text-transform:uppercase}.mask-text{color:transparent;-webkit-text-stroke:2px rgba(245,239,230,.18);text-shadow:0 28px 100px rgba(0,0,0,.8)}.mask-reveal{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3;clip-path:inset(100% 0 0 0)}.mask-text-filled{color:transparent;-webkit-background-clip:text;background-clip:text;background-image:linear-gradient(135deg,var(--accent),#fff0cf 42%,var(--accent));background-size:cover;background-position:center}.mask-subtext{position:absolute;left:50%;bottom:12%;transform:translate(-50%,24px);text-align:center;opacity:0;z-index:5;width:min(720px,calc(100% - 44px));padding:22px;border:1px solid var(--line);border-radius:26px;background:rgba(0,0,0,.28);backdrop-filter:blur(16px)}.mask-subtext p{font-size:clamp(15px,1.8vw,21px);line-height:1.55;color:var(--text);margin:0 0 18px}.explain{padding:110px 24px;text-align:center;max-width:780px;margin:0 auto}.explain h2{font-size:clamp(28px,4vw,54px);letter-spacing:-.04em;margin:14px 0}.explain p{font-size:18px;line-height:1.65;color:var(--muted)}footer{border-top:1px solid var(--line);padding:28px;text-align:center;color:var(--muted);font-size:12px}' +
            '@media(max-width:720px){.hero{padding:70px 18px}.mask-text,.mask-text-filled{font-size:clamp(56px,22vw,126px)}.mask-subtext{bottom:9%;padding:16px}}';
        if (fill && fill.url && fill.type !== 'video') {
            css += '.mask-text-filled{background-image:url("' + cssUrl(fill.url) + '"),linear-gradient(135deg,var(--accent),#fff0cf 42%,var(--accent));}';
        }
        var bg = bgLayer(media, 'mask-video');
        var body = '<div class="wm-brand">' + escapeHTML(opts.logoText) + '</div>' +
            '<section class="hero"><div class="hero-label wm-kicker">Text Mask Reveal - Cinematic Web Section</div><h1>Scroll to <strong>reveal</strong><br>' + escapeHTML(opts.headline) + '</h1><p>' + escapeHTML(opts.subtitle) + '</p><div class="scroll-hint">Scroll down</div></section>' +
            '<section class="mask-section"><div class="mask-sticky">' + bg + '<div class="mask-overlay"><div class="mask-text">' + splitHeadline(opts.headline) + '</div></div><div class="mask-reveal"><div class="mask-text-filled">' + splitHeadline(opts.headline) + '</div></div><div class="mask-subtext"><p>' + escapeHTML(opts.subtitle) + '</p><a class="wm-cta" href="' + escapeAttr(safeUrl(opts.url)) + '">' + escapeHTML(opts.cta) + '</a></div></div></section>' +
            '<section class="explain"><div class="wm-kicker">Why it converts</div><h2>Attention through anticipation</h2><p>El visitante completa el mensaje con el scroll: primero ve la promesa, despues aparece el activo de marca y finalmente llega al CTA. Es una pieza final lista para hero, campana o landing.</p></section><footer>' + escapeHTML(opts.logoText) + ' - Text Mask Reveal final viewer</footer>';
        var scripts = gsapScripts() + '<script>(function(){if(!window.gsap||matchMedia("(prefers-reduced-motion: reduce)").matches)return;gsap.registerPlugin(ScrollTrigger);var section=document.querySelector(".mask-section");gsap.to(".mask-reveal",{clipPath:"inset(0% 0 0 0)",ease:"none",scrollTrigger:{trigger:section,start:"top top",end:"60% bottom",scrub:' + (0.28 / opts.speed).toFixed(2) + '}});gsap.to(".mask-subtext",{opacity:1,y:0,ease:"none",scrollTrigger:{trigger:section,start:"55% top",end:"72% top",scrub:true}});})();<\/script>';
        return baseHead('Text Mask Reveal', opts) + css + closeDoc(body, scripts);
    }

    function buildStickyStack(mediaList, rawOpts) {
        var opts = normalizeOptions(rawOpts);
        var media = [0, 1, 2, 3].map(function(i) { return mediaAt(mediaList, i); });
        var titles = ['Impacto inmediato', 'Prueba visual', 'Decision guiada', 'Conversion final'];
        var states = media.map(function(m, i) {
            return '<div class="mockup-state' + (i === 0 ? ' active' : '') + '" data-state="' + (i + 1) + '">' + mediaMarkup(m, 'mock-media', opts.headline) + '<div class="mock-copy"><div class="mock-metric">' + (i === 0 ? '01' : '0' + (i + 1)) + '</div><div class="mock-label">' + numberedTitle(i + 1, titles[i]) + '</div></div></div>';
        }).join('');
        var cards = titles.map(function(title, i) {
            return '<article class="feature-card' + (i === 0 ? ' active' : '') + '" data-feature="' + (i + 1) + '"><div class="feature-num">0' + (i + 1) + '</div><h3>' + numberedTitle(i + 1, title) + '</h3><p>' + escapeHTML(opts.subtitle) + '</p></article>';
        }).join('');
        var css = baseCSS(opts) +
            ':root{--surface:#ffffff;--paper:#f7f3ec;--ink:#15161a;--soft:#6b6c74}body{background:linear-gradient(180deg,var(--paper),#fff);color:var(--ink)}.wm-brand{color:var(--ink);text-shadow:none}.hero{min-height:92dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:70px 24px}.hero h1{font-size:clamp(38px,5.8vw,72px);font-weight:800;line-height:1.02;letter-spacing:-.045em;max-width:850px;margin:0}.hero h1 span{color:var(--accent)}.hero p{font-size:19px;color:var(--soft);max-width:650px;line-height:1.55}.stack-section{max-width:1180px;margin:0 auto;padding:0 24px 130px}.stack-section-label{text-align:center;margin-bottom:50px}.stack-container{display:grid;grid-template-columns:.98fr 1.02fr;gap:58px;align-items:start}.stack-visual{position:sticky;top:105px}.mockup{background:var(--surface);border:1px solid #e6e0d6;border-radius:24px;overflow:hidden;box-shadow:0 34px 90px rgba(20,20,20,.1)}.mockup-bar{height:46px;background:#f0ece5;border-bottom:1px solid #e6e0d6;display:flex;align-items:center;padding:0 16px;gap:8px}.mockup-dot{width:11px;height:11px;border-radius:50%;background:#d2c8b9}.mockup-body{position:relative;min-height:480px;overflow:hidden}.mockup-state{position:absolute;inset:0;opacity:0;transform:scale(.98);transition:opacity .55s ease,transform .55s ease}.mockup-state.active{opacity:1;transform:scale(1)}.mock-media{width:100%;height:100%;object-fit:cover}.mock-copy{position:absolute;left:24px;right:24px;bottom:24px;padding:18px;border-radius:18px;background:rgba(255,255,255,.78);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.58)}.mock-metric{font-size:52px;font-weight:900;color:var(--accent);letter-spacing:-.06em}.mock-label{font-size:15px;font-weight:800;color:var(--ink)}.stack-features{display:flex;flex-direction:column;gap:44px;padding:40px 0}.feature-card{padding:42px 36px;border-radius:22px;background:var(--surface);border:1px solid #e5dfd4;opacity:.38;transform:translateY(12px) scale(.985);transition:all .42s cubic-bezier(.16,1,.3,1);box-shadow:0 16px 50px rgba(0,0,0,.045)}.feature-card.active{opacity:1;transform:translateY(0) scale(1);border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 26px 70px color-mix(in srgb,var(--accent),transparent 84%)}.feature-num{font-size:12px;font-weight:900;color:var(--accent);letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}.feature-card h3{font-size:clamp(24px,3vw,38px);font-weight:900;letter-spacing:-.03em;margin:0 0 12px}.feature-card p{font-size:16px;color:var(--soft);line-height:1.65}.explain{padding:110px 24px;text-align:center;max-width:740px;margin:0 auto;border-top:1px solid #e5dfd4}.explain h2{font-size:clamp(26px,4vw,46px);letter-spacing:-.04em;margin:12px 0}.explain p{color:var(--soft);font-size:18px;line-height:1.62}footer{border-top:1px solid #e5dfd4;padding:28px;text-align:center;color:var(--soft);font-size:12px}' +
            '@media(max-width:820px){.stack-container{grid-template-columns:1fr}.stack-visual{position:relative;top:0}.mockup-body{min-height:380px}.stack-features{gap:18px}.feature-card{opacity:1}}';
        var body = '<div class="wm-brand">' + escapeHTML(opts.logoText) + '</div><section class="hero"><div class="hero-label wm-kicker">Sticky Stack Narrative</div><h1>' + escapeHTML(opts.headline) + '<br><span>siempre visible.</span></h1><p>' + escapeHTML(opts.subtitle) + '</p><div class="scroll-hint">Scroll down</div></section><section class="stack-section"><div class="stack-section-label wm-kicker">Narrativa por capas</div><div class="stack-container"><div class="stack-visual"><div class="mockup"><div class="mockup-bar"><div class="mockup-dot"></div><div class="mockup-dot"></div><div class="mockup-dot"></div></div><div class="mockup-body">' + states + '</div></div></div><div class="stack-features">' + cards + '<a class="wm-cta" href="' + escapeAttr(safeUrl(opts.url)) + '">' + escapeHTML(opts.cta) + '</a></div></div></section><section class="explain"><div class="wm-kicker">Why it works</div><h2>Ver y entender al mismo tiempo</h2><p>El producto queda anclado mientras cada beneficio activa una visual distinta. Es perfecto para moda, inmobiliaria, SaaS, servicios premium y marcas que necesitan explicar sin perder impacto.</p></section><footer>' + escapeHTML(opts.logoText) + ' - Sticky Stack final viewer</footer>';
        var scripts = gsapScripts() + '<script>(function(){if(!window.gsap)return;gsap.registerPlugin(ScrollTrigger);var cards=document.querySelectorAll(".feature-card"),states=document.querySelectorAll(".mockup-state");function activate(num){cards.forEach(function(c){c.classList.toggle("active",c.dataset.feature===num)});states.forEach(function(s){s.classList.toggle("active",s.dataset.state===num)});}cards.forEach(function(card){ScrollTrigger.create({trigger:card,start:"top 62%",end:"bottom 38%",onEnter:function(){activate(card.dataset.feature)},onEnterBack:function(){activate(card.dataset.feature)}});});})();<\/script>';
        return baseHead('Sticky Stack Narrative', opts) + css + closeDoc(body, scripts);
    }

    function buildZoomParallax(mediaList, rawOpts) {
        var opts = normalizeOptions(rawOpts);
        var product = mediaAt(mediaList, 0);
        var texture = mediaAt(mediaList, 1);
        var zoomHeight = Math.round(opts.scrollLength * 115);
        var css = baseCSS(opts) +
            '.hero{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:72px 24px}.hero h1{font-size:clamp(38px,6vw,76px);font-weight:900;line-height:1.02;letter-spacing:-.045em;max-width:840px;margin:0}.hero h1 span{color:var(--accent)}.hero p{font-size:19px;color:var(--muted);max-width:650px;line-height:1.55}.zoom-section{position:relative;height:' + zoomHeight + 'vh}.zoom-sticky{position:sticky;top:0;height:100dvh;overflow:hidden;display:flex;align-items:center;justify-content:center;perspective:1000px}.layer-bg{position:absolute;inset:-22%;z-index:1;background:radial-gradient(ellipse at 50% 40%,color-mix(in srgb,var(--accent),transparent 70%),transparent 34%),radial-gradient(ellipse at 70% 70%,#443265,transparent 28%),var(--bg)}.layer-media{position:absolute;inset:-6%;z-index:2;width:112%;height:112%;object-fit:cover;background-size:cover;background-position:center;opacity:.32;filter:saturate(1.1) contrast(1.05);mix-blend-mode:screen}.layer-mid{position:absolute;inset:0;z-index:3}.shape{position:absolute;border-radius:50%;opacity:.16;filter:blur(1px)}.shape-1{width:340px;height:340px;background:radial-gradient(circle,var(--accent),transparent 70%);top:13%;left:8%}.shape-2{width:230px;height:230px;background:radial-gradient(circle,#6a7fff,transparent 70%);top:58%;right:14%}.shape-3{width:430px;height:430px;background:radial-gradient(circle,#ff6a8a,transparent 70%);bottom:8%;left:39%}.layer-fg{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center}.zoom-headline{font-size:clamp(58px,13vw,172px);font-weight:900;letter-spacing:-.07em;text-align:center;line-height:.88;color:var(--text);text-shadow:0 30px 120px rgba(0,0,0,.75)}.layer-product{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;opacity:0}.product-card{display:grid;grid-template-columns:1fr .82fr;gap:26px;align-items:stretch;background:rgba(12,13,18,.72);border:1px solid var(--line);border-radius:30px;padding:22px;width:min(900px,calc(100vw - 38px));box-shadow:0 48px 130px rgba(0,0,0,.62);backdrop-filter:blur(20px)}.product-media{width:100%;height:440px;object-fit:cover;border-radius:22px}.product-copy{display:flex;flex-direction:column;justify-content:center;padding:20px}.product-copy h2{font-size:clamp(30px,4vw,56px);letter-spacing:-.045em;line-height:.95;margin:0 0 14px}.product-copy p{font-size:17px;line-height:1.62;color:var(--muted)}.details{padding:110px 24px;display:grid;grid-template-columns:1fr 1fr;gap:34px;max-width:940px;margin:0 auto}.detail-block{opacity:0;transform:translateY(30px);padding:24px;border:1px solid var(--line);border-radius:22px;background:var(--glass)}.num{font-size:48px;font-weight:900;color:var(--accent);letter-spacing:-.05em}.detail-block h3{font-size:21px;margin:8px 0}.detail-block p{color:var(--muted);line-height:1.6}footer{border-top:1px solid var(--line);padding:28px;text-align:center;color:var(--muted);font-size:12px}' +
            '@media(max-width:760px){.shape-1,.shape-3{display:none}.product-card{grid-template-columns:1fr}.product-media{height:310px}.details{grid-template-columns:1fr}.zoom-headline{font-size:clamp(58px,21vw,118px)}}';
        var mediaLayer = bgLayer(texture, 'layer-media');
        var body = '<div class="wm-brand">' + escapeHTML(opts.logoText) + '</div><section class="hero"><div class="hero-label wm-kicker">Layered Zoom Parallax</div><h1>Scroll to fly <span>through</span><br>' + escapeHTML(opts.headline) + '</h1><p>' + escapeHTML(opts.subtitle) + '</p><div class="scroll-hint">Scroll down</div></section><section class="zoom-section"><div class="zoom-sticky"><div class="layer-bg"></div>' + mediaLayer + '<div class="layer-mid"><div class="shape shape-1"></div><div class="shape shape-2"></div><div class="shape shape-3"></div></div><div class="layer-fg"><div class="zoom-headline">DEPTH</div></div><div class="layer-product"><div class="product-card">' + mediaMarkup(product, 'product-media', opts.headline) + '<div class="product-copy"><div class="wm-kicker">Product reveal</div><h2>' + escapeHTML(opts.headline) + '</h2><p>' + escapeHTML(opts.subtitle) + '</p><a class="wm-cta" href="' + escapeAttr(safeUrl(opts.url)) + '">' + escapeHTML(opts.cta) + '</a></div></div></div></div></section><section class="details"><div class="detail-block"><div class="num">3</div><h3>Capas de profundidad</h3><p>Fondo, atmosfera y producto se mueven a velocidades distintas para crear entrada cinematografica.</p></div><div class="detail-block"><div class="num">1</div><h3>Destino comercial</h3><p>Todo converge en un CTA claro con imagen o video del usuario.</p></div></section><footer>' + escapeHTML(opts.logoText) + ' - Layered Zoom final viewer</footer>';
        var scripts = gsapScripts() + '<script>(function(){if(!window.gsap||matchMedia("(prefers-reduced-motion: reduce)").matches)return;gsap.registerPlugin(ScrollTrigger);var section=document.querySelector(".zoom-section"),scrub=' + (0.45 / opts.speed).toFixed(2) + ';gsap.fromTo(".layer-bg",{scale:1},{scale:' + (1.1 + opts.intensity * .12).toFixed(2) + ',ease:"none",scrollTrigger:{trigger:section,start:"top top",end:"bottom bottom",scrub:scrub}});gsap.fromTo(".layer-mid",{scale:1,y:0},{scale:' + (1.35 + opts.intensity * .32).toFixed(2) + ',y:-110,ease:"none",scrollTrigger:{trigger:section,start:"top top",end:"bottom bottom",scrub:scrub}});gsap.fromTo(".layer-fg",{scale:1,opacity:.95},{scale:' + (4.4 + opts.intensity * 1.8).toFixed(2) + ',opacity:0,ease:"none",scrollTrigger:{trigger:section,start:"top top",end:"50% top",scrub:true}});gsap.fromTo(".layer-product",{opacity:0,scale:.82},{opacity:1,scale:1,ease:"power2.out",scrollTrigger:{trigger:section,start:"40% top",end:"62% top",scrub:true}});gsap.utils.toArray(".detail-block").forEach(function(el,i){gsap.to(el,{opacity:1,y:0,duration:.7,delay:i*.08,ease:"power2.out",scrollTrigger:{trigger:el,start:"top 84%"}});});})();<\/script>';
        return baseHead('Layered Zoom Parallax', opts) + css + closeDoc(body, scripts);
    }

    function buildHorizontalScroll(mediaList, rawOpts) {
        var opts = normalizeOptions(rawOpts);
        var labels = ['Strategy', 'Design', 'Build', 'Launch', 'Scale', 'Support'];
        var cards = labels.map(function(label, i) {
            var m = mediaAt(mediaList, i);
            return '<article class="h-card">' + bgLayer(m, 'h-card-bg') + '<div class="h-card-overlay"></div><div class="h-card-content"><div class="h-card-num">0' + (i + 1) + ' / ' + escapeHTML(label) + '</div><h3>' + escapeHTML(i === 0 ? opts.headline : label + ' moment') + '</h3><p>' + escapeHTML(opts.subtitle) + '</p></div></article>';
        }).join('');
        var css = baseCSS(opts) +
            'body{background:radial-gradient(circle at 18% 16%,color-mix(in srgb,var(--accent),transparent 72%),transparent 24%),var(--bg)}.h-scroll-section{position:relative;overflow:hidden;height:560vh}.h-scroll-sticky{position:sticky;top:0;height:100dvh;display:grid;grid-template-columns:minmax(320px,34vw) 1fr;align-items:center;gap:32px;overflow:hidden;padding:72px max(30px,4vw) 58px}.h-intro{position:relative;z-index:7;align-self:center;padding:30px;border:1px solid var(--line);border-radius:30px;background:rgba(0,0,0,.34);backdrop-filter:blur(18px);box-shadow:0 34px 110px rgba(0,0,0,.42)}.h-intro h1{font-size:clamp(38px,5vw,76px);font-weight:900;line-height:.93;letter-spacing:-.055em;margin:12px 0}.h-intro h1 span{color:var(--accent)}.h-intro p{font-size:17px;color:var(--muted);line-height:1.55;margin:0 0 22px}.h-scroll-cue{display:flex;align-items:center;gap:12px;margin-top:18px;color:var(--text);font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.h-scroll-cue::before{content:"";width:46px;height:2px;background:var(--accent);box-shadow:0 0 24px var(--accent)}.h-track-window{position:relative;z-index:5;width:100%;overflow:visible}.h-scroll-track{display:flex;gap:34px;padding:0 12vw 0 0;will-change:transform;align-items:center}.h-card{flex:0 0 clamp(420px,48vw,690px);height:min(72vh,720px);border-radius:32px;overflow:hidden;position:relative;border:1px solid var(--line);display:flex;flex-direction:column;justify-content:flex-end;padding:36px;box-shadow:0 42px 120px rgba(0,0,0,.5);transition:transform .32s cubic-bezier(.16,1,.3,1),filter .32s}.h-card:first-child{outline:1px solid color-mix(in srgb,var(--accent),transparent 35%);box-shadow:0 0 0 1px color-mix(in srgb,var(--accent),transparent 65%),0 42px 140px rgba(0,0,0,.58)}.h-card:hover{transform:translateY(-7px) scale(1.01)}.h-card-bg{position:absolute;inset:0;z-index:0;background-size:cover;background-position:center;transition:transform .6s ease;width:100%;height:100%;object-fit:cover}.h-card:hover .h-card-bg{transform:scale(1.05)}.h-card-overlay{position:absolute;inset:0;z-index:1;background:linear-gradient(to top,rgba(8,8,10,.94),rgba(8,8,10,.34) 48%,rgba(8,8,10,.08) 78%)}.h-card-content{position:relative;z-index:2}.h-card-num{font-size:12px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);margin-bottom:10px;font-weight:900}.h-card h3{font-size:clamp(30px,4vw,56px);font-weight:900;letter-spacing:-.045em;line-height:.96;margin:0 0 10px}.h-card p{font-size:16px;color:var(--muted);line-height:1.55;max-width:44ch}.h-progress{position:fixed;bottom:42px;left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:12px;opacity:1;transition:opacity .3s;padding:12px 17px;border:1px solid var(--line);border-radius:999px;background:rgba(0,0,0,.42);backdrop-filter:blur(16px);box-shadow:0 18px 50px rgba(0,0,0,.34)}.h-progress-bar{width:160px;height:3px;background:rgba(255,255,255,.17);border-radius:4px;overflow:hidden}.h-progress-fill{height:100%;background:var(--accent);width:0}.h-progress-label{font-size:11px;color:var(--muted);letter-spacing:.1em;white-space:nowrap}.h-end{min-height:72dvh;display:grid;place-items:center;text-align:center;padding:90px 24px;border-top:1px solid var(--line)}.h-end h2{font-size:clamp(30px,5vw,64px);letter-spacing:-.045em;line-height:.96;margin:0 0 16px}.h-end p{color:var(--muted);font-size:18px;line-height:1.62;max-width:720px;margin:0 auto 24px}footer{border-top:1px solid var(--line);padding:28px;text-align:center;color:var(--muted);font-size:12px}' +
            '@media(max-width:900px){.h-scroll-sticky{grid-template-columns:1fr;padding:68px 24px 80px}.h-intro{align-self:end}.h-track-window{align-self:start}.h-card{flex-basis:min(82vw,560px);height:54vh}.h-intro h1{font-size:clamp(34px,10vw,64px)}}@media(max-width:720px){.h-scroll-section{height:auto!important}.h-scroll-sticky{position:relative;height:auto;display:block;overflow:hidden}.h-intro{margin:62px 18px 18px}.h-scroll-track{display:grid;gap:18px;padding:18px}.h-card{width:100%;height:460px;flex:auto}.h-progress{display:none}.h-end{min-height:auto;padding:58px 20px}}';
        var body = '<div class="wm-brand">' + escapeHTML(opts.logoText) + '</div><section class="h-scroll-section" id="hSection"><div class="h-scroll-sticky"><aside class="h-intro"><div class="wm-kicker">Horizontal Scroll Hijack</div><h1>Scroll vertical.<br><span>Galeria horizontal.</span></h1><p>' + escapeHTML(opts.subtitle) + '</p><a class="wm-cta" href="' + escapeAttr(safeUrl(opts.url)) + '">' + escapeHTML(opts.cta) + '</a><div class="h-scroll-cue">Scroll para avanzar</div></aside><div class="h-track-window"><div class="h-scroll-track" id="hTrack">' + cards + '</div></div></div></section><div class="h-progress" id="hProgress"><div class="h-progress-bar"><div class="h-progress-fill" id="hFill"></div></div><div class="h-progress-label" id="hLabel">1 / 6</div></div><section class="h-end"><div><div class="wm-kicker">Final viewer</div><h2>' + escapeHTML(opts.headline) + '</h2><p>La secuencia ya esta cerrada para web: imagenes o videos del panel, narrativa, CTA y progreso de scroll sin mostrar la herramienta de edicion.</p><a class="wm-cta" href="' + escapeAttr(safeUrl(opts.url)) + '">' + escapeHTML(opts.cta) + '</a></div></section><footer>' + escapeHTML(opts.logoText) + ' - Horizontal Scroll final viewer</footer>';
        var scripts = gsapScripts() + '<script>(function(){if(!window.gsap||matchMedia("(prefers-reduced-motion: reduce)").matches||innerWidth<721)return;gsap.registerPlugin(ScrollTrigger);var track=document.getElementById("hTrack"),section=document.getElementById("hSection"),cards=track.querySelectorAll(".h-card"),fill=document.getElementById("hFill"),label=document.getElementById("hLabel");function distance(){var last=cards[cards.length-1];var intro=document.querySelector(".h-intro");var safeRight=Math.max(32,innerWidth*.08);return Math.max(0,last.getBoundingClientRect().right-track.getBoundingClientRect().left-(innerWidth-(intro?intro.getBoundingClientRect().right:0))-safeRight);}function height(){section.style.height=Math.max(360,cards.length*86)+' + "'vh'" + ';}height();addEventListener("resize",function(){height();ScrollTrigger.refresh();});gsap.to(track,{x:function(){return -distance();},ease:"none",scrollTrigger:{trigger:section,start:"top top",end:"bottom bottom",scrub:' + (0.38 / opts.speed).toFixed(2) + ',invalidateOnRefresh:true,onUpdate:function(self){var p=self.progress;if(fill)fill.style.width=(p*100)+"%";if(label)label.textContent=Math.min(Math.floor(p*cards.length)+1,cards.length)+" / "+cards.length;cards.forEach(function(card,i){var center=card.getBoundingClientRect().left+card.offsetWidth/2;var d=Math.min(1,Math.abs(center-innerWidth*.62)/(innerWidth*.62));card.style.filter="saturate("+(1.12-d*.25)+") brightness("+(1-d*.18)+")";});}}});})();<\/script>';
        return baseHead('Horizontal Scroll Hijack', opts) + css + closeDoc(body, scripts);
    }

    function buildCursorReactive(mediaList, rawOpts) {
        var opts = normalizeOptions(rawOpts);
        var bg = mediaAt(mediaList, 0);
        var cards = ['Realtime sync', 'Pixel-perfect exports', 'Branching workflows', 'Zero-config deploy'].map(function(title, i) {
            return '<article class="tilt-card"><div class="spotlight"></div><div class="icon">' + ['◇', '◆', '◈', '✦'][i] + '</div><h3>' + escapeHTML(title) + '</h3><p>' + escapeHTML(opts.subtitle) + '</p></article>';
        }).join('');
        var css = baseCSS(opts) +
            '.cursor-glow{position:fixed;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent),transparent 84%) 0%,transparent 70%);pointer-events:none;z-index:1;transform:translate(-50%,-50%);will-change:transform}.hero{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:70px 24px;position:relative;overflow:hidden}.hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background-size:cover;background-position:center;opacity:.35;filter:saturate(1.15) contrast(1.05)}.hero::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,transparent,rgba(0,0,0,.72))}.hero>*:not(.hero-bg){position:relative;z-index:3}.hero h1{font-size:clamp(42px,7vw,92px);font-weight:900;line-height:.95;letter-spacing:-.055em;max-width:860px;margin:0}.hero p{font-size:19px;color:var(--muted);max-width:680px;line-height:1.55}.cards-section{padding:90px 24px 120px;max-width:1060px;margin:0 auto}.cards-section-label{text-align:center;margin-bottom:44px}.cards-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.tilt-card{background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:24px;padding:48px 36px;position:relative;overflow:hidden;transform-style:preserve-3d;transition:transform .15s ease-out,border-color .3s;will-change:transform;box-shadow:0 24px 80px rgba(0,0,0,.28)}.spotlight{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s;border-radius:24px}.tilt-card:hover .spotlight{opacity:1}.icon{width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--accent),transparent 88%);display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:22px;color:var(--accent)}.tilt-card h3{font-size:22px;margin:0 0 10px}.tilt-card p{font-size:15px;color:var(--muted);line-height:1.62}.magnet-section,.ripple-section{padding:120px 24px;text-align:center}.magnet-section h2,.ripple-section h2{font-size:clamp(28px,4vw,50px);letter-spacing:-.04em;margin:0 0 12px}.magnet-section p,.ripple-section p{font-size:18px;color:var(--muted)}.magnetic-btn{display:inline-flex;align-items:center;justify-content:center;min-height:54px;margin-top:26px;padding:0 48px;background:var(--accent);color:#08080a;border:0;border-radius:16px;font:900 16px var(--font);cursor:pointer;transition:transform .2s cubic-bezier(.16,1,.3,1),box-shadow .2s;will-change:transform;box-shadow:0 18px 52px color-mix(in srgb,var(--accent),transparent 75%)}.ripple-section{position:relative;overflow:hidden;min-height:58vh;display:flex;flex-direction:column;align-items:center;justify-content:center;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.ripple-canvas{position:absolute;inset:0;z-index:1}.ripple-section>*:not(canvas){position:relative;z-index:2}.explain{padding:110px 24px;text-align:center;max-width:740px;margin:0 auto}.explain h2{font-size:clamp(26px,4vw,48px);letter-spacing:-.04em;margin:12px 0}.explain p{color:var(--muted);font-size:18px;line-height:1.62}footer{border-top:1px solid var(--line);padding:28px;text-align:center;color:var(--muted);font-size:12px}@media(max-width:768px){.cards-grid{grid-template-columns:1fr}.cursor-glow{display:none}.tilt-card{transform:none!important}.hero{min-height:88dvh}}';
        var body = '<div class="wm-brand">' + escapeHTML(opts.logoText) + '</div><div class="cursor-glow" id="glow"></div><section class="hero">' + bgLayer(bg, 'hero-bg') + '<div class="hero-label wm-kicker">Cursor Reactive CTA</div><h1>' + splitHeadline(opts.headline) + '</h1><p>' + escapeHTML(opts.subtitle) + '</p><a class="wm-cta" href="' + escapeAttr(safeUrl(opts.url)) + '">' + escapeHTML(opts.cta) + '</a></section><section class="cards-section"><div class="cards-section-label wm-kicker">3D tilt cards - hover over them</div><div class="cards-grid">' + cards + '</div></section><section class="magnet-section"><h2>Magnetic button</h2><p>El CTA reacciona al cursor para aumentar exploracion y sensacion premium.</p><button class="magnetic-btn" id="magnetBtn">' + escapeHTML(opts.cta) + '</button></section><section class="ripple-section" id="rippleArea"><canvas class="ripple-canvas" id="rippleCanvas"></canvas><h2>Click anywhere</h2><p>Ripples expand from the exact click coordinates.</p></section><section class="explain"><div class="wm-kicker">Why it works</div><h2>La pagina se siente viva</h2><p>Glow, tilt, magnetismo y ondas de click convierten una llamada a la accion en una microexperiencia que invita a jugar sin bloquear el mensaje comercial.</p></section><footer>' + escapeHTML(opts.logoText) + ' - Cursor Reactive final viewer</footer>';
        var scripts = '<script>(function(){var glow=document.getElementById("glow"),mx=innerWidth/2,my=innerHeight/2,gx=mx,gy=my,intensity=' + opts.intensity.toFixed(2) + ';document.addEventListener("mousemove",function(e){mx=e.clientX;my=e.clientY});function moveGlow(){gx+=(mx-gx)*.12;gy+=(my-gy)*.12;if(glow)glow.style.transform="translate("+(gx-260)+"px,"+(gy-260)+"px)";requestAnimationFrame(moveGlow)}moveGlow();document.querySelectorAll(".tilt-card").forEach(function(card){card.addEventListener("mousemove",function(e){var rect=card.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width-.5,y=(e.clientY-rect.top)/rect.height-.5;card.style.transform="perspective(700px) rotateY("+(x*14*intensity)+"deg) rotateX("+(-y*14*intensity)+"deg) scale(1.025)";var spot=card.querySelector(".spotlight");spot.style.background="radial-gradient(circle at "+(e.clientX-rect.left)+"px "+(e.clientY-rect.top)+"px, rgba(255,255,255,.12) 0%, transparent 58%)"});card.addEventListener("mouseleave",function(){card.style.transform="perspective(700px) rotateY(0deg) rotateX(0deg) scale(1)"})});var btn=document.getElementById("magnetBtn");if(btn){btn.addEventListener("mousemove",function(e){var rect=btn.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;btn.style.transform="translate("+((e.clientX-cx)*.28*intensity)+"px,"+((e.clientY-cy)*.28*intensity)+"px)"});btn.addEventListener("mouseleave",function(){btn.style.transform="translate(0,0)"})}var canvas=document.getElementById("rippleCanvas"),area=document.getElementById("rippleArea"),ctx=canvas&&canvas.getContext("2d"),ripples=[];function resize(){if(!canvas)return;canvas.width=area.offsetWidth;canvas.height=area.offsetHeight}resize();addEventListener("resize",resize);area.addEventListener("click",function(e){var r=area.getBoundingClientRect();ripples.push({x:e.clientX-r.left,y:e.clientY-r.top,r:0,a:.55})});function draw(){if(!ctx)return;ctx.clearRect(0,0,canvas.width,canvas.height);for(var i=ripples.length-1;i>=0;i--){var p=ripples[i];p.r+=4.5*intensity;p.a-=.007;if(p.a<=0){ripples.splice(i,1);continue}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.strokeStyle="rgba(215,168,110,"+p.a+")";ctx.lineWidth=1.5;ctx.stroke()}requestAnimationFrame(draw)}draw();})();<\/script>';
        return baseHead('Cursor Reactive CTA', opts) + css + closeDoc(body, scripts);
    }

    register({ id: 'text-mask-reveal', name: 'Text Mask Reveal', icon: 'TM', family: 'Hero / Campaign', description: 'Hero con mascara de texto, scroll reveal y media imagen/video de fondo.', sourceFile: 'text-mask.html', mediaMap: 'Slot 1 fondo reveal. Slot 2 textura del texto si es imagen.', build: buildTextMask });
    register({ id: 'sticky-stack-narrative', name: 'Sticky Stack Narrative', icon: 'SS', family: 'Product Story', description: 'Producto fijo y beneficios que activan imagen/video por scroll.', sourceFile: 'sticky-stack.html', mediaMap: 'Slots 1-4 estados visuales del mockup sticky.', build: buildStickyStack });
    register({ id: 'layered-zoom-parallax', name: 'Layered Zoom Parallax', icon: 'ZP', family: 'Immersive Hero', description: 'Zoom multicapa con destino comercial y producto en imagen/video.', sourceFile: 'zoom-parallax.html', mediaMap: 'Slot 1 producto final. Slot 2 textura/ambiente de profundidad.', build: buildZoomParallax });
    register({ id: 'horizontal-scroll-hijack', name: 'Horizontal Scroll Hijack', icon: 'HS', family: 'Gallery', description: 'Scroll vertical convertido en galeria horizontal premium.', sourceFile: 'horizontal-scroll.html', mediaMap: 'Slots 1-6 cards horizontales, imagen o video.', build: buildHorizontalScroll });
    register({ id: 'cursor-reactive-cta', name: 'Cursor Reactive CTA', icon: 'CR', family: 'CTA / Interaction', description: 'Glow, tilt cards, boton magnetico y ondas de click con fallback touch.', sourceFile: 'cursor-reactive.html', mediaMap: 'Slot 1 fondo hero. El resto queda libre para siguientes variantes.', build: buildCursorReactive });

    return {
        get: get,
        getAll: getAll,
        getSchema: getSchema,
        normalizeOptions: normalizeOptions,
        normalizeMedia: normalizeMedia
    };
})();
