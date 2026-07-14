// Luxury Real Estate Storytelling PRO
// Complete cinematic real-estate landing page: scroll-scrub hero, editorial
// headline, glassmorphism panel, property cards, services and contact.
(function() {
    function esc(v) { var d = document.createElement('div'); d.textContent = String(v || ''); return d.innerHTML; }
    function escAttr(v) { return String(v || '').replace(/["']/g, function(ch) { return ch === '"' ? '&quot;' : '&#39;'; }); }
    function safeUrl(v) { return /^(https?:|mailto:|tel:)/i.test(String(v || '')) ? v : '#'; }
    function media(list, i) {
        var m = (list || []).filter(Boolean);
        var item = m.length ? m[i % m.length] : null;
        if (!item) return '<div class="lre-media lre-fallback"></div>';
        var url = item.url || (item.element && (item.element.currentSrc || item.element.src));
        if (!url) return '<div class="lre-media lre-fallback"></div>';
        return item.type === 'video'
            ? '<video class="lre-media" src="' + url + '" muted playsinline preload="auto"></video>'
            : '<img class="lre-media" src="' + url + '" alt="">';
    }

    var schema = [
        { key: 'brand', label: 'Marca', type: 'text', default: 'Escaparates Pro' },
        { key: 'logoText', label: 'Texto del logo', type: 'text', default: 'LUXURY ESTATES' },
        { key: 'language', label: 'Idioma inicial (es | en)', type: 'text', default: 'es' },
        { key: 'enableLanguageToggle', label: 'Mostrar selector de idioma (true | false)', type: 'text', default: 'true' },
        { key: 'heroLine1', label: 'Hero — Línea 1', type: 'text', default: 'Arquitectura' },
        { key: 'heroLine2', label: 'Hero — Línea 2', type: 'text', default: 'que respira' },
        { key: 'heroEyebrow', label: 'Hero — Etiqueta', type: 'text', default: 'Inmobiliaria exclusiva' },
        { key: 'heroSubtitle', label: 'Hero — Subtítulo', type: 'textarea', default: 'Propiedades seleccionadas donde el espacio, la luz y el entorno se encuentran.' },
        { key: 'aboutTitle', label: 'About — Título', type: 'text', default: 'Una forma diferente de habitar.' },
        { key: 'aboutText', label: 'About — Texto', type: 'textarea', default: 'Cada propiedad cuenta una historia. Seleccionamos inmuebles excepcionales y los presentamos con la calidad visual que merecen.' },
        { key: 'propertiesTitle', label: 'Propiedades — Título', type: 'text', default: 'Propiedades exclusivas' },
        { key: 'properties', label: 'Propiedades (Título | Localización | Precio | Descripción | CTA | URL | Badge)', type: 'textarea', default: 'Villa Aurora | Marbella, España | 2.400.000 € | Diseño mediterráneo con vistas al mar. | Solicitar visita | # | Exclusiva\nPiso Eixample | Barcelona, España | 1.100.000 € | Espacios generosos en edificio modernista. | Ver ficha | # | Última unidad\nÁtico Skyline | Madrid, España | 1.850.000 € | Terraza panorámica y acabados de lujo. | Reservar cita | # | Nuevo' },
        { key: 'servicesTitle', label: 'Servicios — Título', type: 'text', default: 'Servicios' },
        { key: 'service1', label: 'Servicio 1', type: 'text', default: 'Búsqueda personalizada' },
        { key: 'service2', label: 'Servicio 2', type: 'text', default: 'Valoración de propiedades' },
        { key: 'service3', label: 'Servicio 3', type: 'text', default: 'Asesoría legal y fiscal' },
        { key: 'service4', label: 'Servicio 4', type: 'text', default: 'Home staging premium' },
        { key: 'contactTitle', label: 'Contacto — Título', type: 'text', default: 'Hablemos de tu próximo espacio.' },
        { key: 'contactText', label: 'Contacto — Texto', type: 'textarea', default: 'Déjanos tus datos y un especialista te contactará para una visita privada.' },
        { key: 'ctaLabel', label: 'CTA principal', type: 'text', default: 'Solicitar visita' },
        { key: 'ctaUrl', label: 'URL CTA principal', type: 'text', default: '#' },
        { key: 'phone', label: 'Teléfono', type: 'text', default: '' },
        { key: 'whatsapp', label: 'WhatsApp (número)', type: 'text', default: '' },
        { key: 'email', label: 'Email', type: 'text', default: '' },
        { key: 'primaryColor', label: 'Color primario', type: 'text', default: '#d4af37' },
        { key: 'secondaryColor', label: 'Color secundario', type: 'text', default: '#1a1d26' },
        { key: 'backgroundColor', label: 'Color de fondo', type: 'text', default: '#0b0d12' },
        { key: 'textColor', label: 'Color de texto', type: 'text', default: '#f4f0e8' },
        { key: 'glassStrength', label: 'Fuerza glassmorphism (0-1)', type: 'text', default: '0.14' },
        { key: 'scrubSmoothing', label: 'Suavizado scrub (0.03-0.30)', type: 'text', default: '0.12' },
        { key: 'parallaxIntensity', label: 'Intensidad parallax (0-1)', type: 'text', default: '0.25' },
        { key: 'showNavigation', label: 'Mostrar navegación (true | false)', type: 'text', default: 'true' },
        { key: 'showAbout', label: 'Mostrar about (true | false)', type: 'text', default: 'true' },
        { key: 'showProperties', label: 'Mostrar propiedades (true | false)', type: 'text', default: 'true' },
        { key: 'showServices', label: 'Mostrar servicios (true | false)', type: 'text', default: 'true' },
        { key: 'showContact', label: 'Mostrar contacto (true | false)', type: 'text', default: 'true' },
        { key: 'showFooter', label: 'Mostrar footer (true | false)', type: 'text', default: 'true' }
    ];

    function parseProperties(text) {
        return String(text || '').split('\n').map(function(line) {
            var parts = line.split('|').map(function(s) { return s.trim(); });
            if (!parts[0]) return null;
            return {
                title: parts[0] || '',
                location: parts[1] || '',
                price: parts[2] || '',
                description: parts[3] || '',
                ctaLabel: parts[4] || 'Solicitar visita',
                url: parts[5] || '#',
                badge: parts[6] || ''
            };
        }).filter(Boolean);
    }

    function bool(v) { return String(v).toLowerCase() !== 'false'; }

    function build(list, raw) {
        var o = {};
        schema.forEach(function(f) { o[f.key] = raw[f.key] !== undefined ? raw[f.key] : f.default; });

        var brand = esc(o.brand);
        var logoText = esc(o.logoText);
        var lang = /^(es|en)$/i.test(o.language) ? o.language : 'es';
        var enableLang = bool(o.enableLanguageToggle);
        var heroLine1 = esc(o.heroLine1);
        var heroLine2 = esc(o.heroLine2);
        var heroEyebrow = esc(o.heroEyebrow);
        var heroSubtitle = esc(o.heroSubtitle);
        var aboutTitle = esc(o.aboutTitle);
        var aboutText = esc(o.aboutText);
        var propertiesTitle = esc(o.propertiesTitle);
        var servicesTitle = esc(o.servicesTitle);
        var service1 = esc(o.service1);
        var service2 = esc(o.service2);
        var service3 = esc(o.service3);
        var service4 = esc(o.service4);
        var contactTitle = esc(o.contactTitle);
        var contactText = esc(o.contactText);
        var ctaLabel = esc(o.ctaLabel);
        var ctaUrl = safeUrl(o.ctaUrl);
        var phone = esc(o.phone);
        var whatsapp = esc(o.whatsapp);
        var email = esc(o.email);
        var primaryColor = escAttr(o.primaryColor);
        var secondaryColor = escAttr(o.secondaryColor);
        var backgroundColor = escAttr(o.backgroundColor);
        var textColor = escAttr(o.textColor);
        var glassStrength = Math.max(0, Math.min(1, Number(o.glassStrength) || 0.14));
        var scrubSmoothing = Math.max(0.03, Math.min(0.30, Number(o.scrubSmoothing) || 0.12));
        var parallaxIntensity = Math.max(0, Math.min(1, Number(o.parallaxIntensity) || 0.25));

        var showNavigation = bool(o.showNavigation);
        var showAbout = bool(o.showAbout);
        var showProperties = bool(o.showProperties);
        var showServices = bool(o.showServices);
        var showContact = bool(o.showContact);
        var showFooter = bool(o.showFooter);

        var properties = parseProperties(o.properties);
        var services = [service1, service2, service3, service4].filter(Boolean);

        var i18n = {
            es: { menuProperties: 'Propiedades', menuServices: 'Servicios', menuContact: 'Contacto', langLabel: 'ES / EN', formName: 'Nombre', formEmail: 'Email', formPhone: 'Teléfono', formMessage: 'Mensaje', formSubmit: 'Enviar solicitud', formNote: 'Este formulario es una demo local. No se envían datos reales.', footerCopy: 'Experiencia inmobiliaria premium.' },
            en: { menuProperties: 'Properties', menuServices: 'Services', menuContact: 'Contact', langLabel: 'EN / ES', formName: 'Name', formEmail: 'Email', formPhone: 'Phone', formMessage: 'Message', formSubmit: 'Send request', formNote: 'This form is a local demo. No real data is sent.', footerCopy: 'Premium real estate experience.' }
        };
        var t = i18n[lang] || i18n.es;

        var heroVideoUrl = '';
        var heroPosterUrl = '';
        var hasHeroVideo = false;
        if (list && list[0]) {
            heroVideoUrl = list[0].url || (list[0].element && (list[0].element.currentSrc || list[0].element.src)) || '';
            hasHeroVideo = list[0].type === 'video';
        }
        if (list && list[1]) {
            heroPosterUrl = list[1].url || (list[1].element && (list[1].element.currentSrc || list[1].element.src)) || '';
        }

        var heroMedia = '';
        if (hasHeroVideo && heroVideoUrl) {
            heroMedia = '<video id="lre-hero-video" class="lre-media" src="' + escAttr(heroVideoUrl) + '" muted playsinline preload="auto" poster="' + escAttr(heroPosterUrl) + '"></video>';
        } else if (heroVideoUrl) {
            heroMedia = '<img id="lre-hero-image" class="lre-media" src="' + escAttr(heroVideoUrl) + '" alt="">';
        } else {
            heroMedia = '<div class="lre-media lre-fallback"><span>Sube un vídeo o imagen en el slot 1</span></div>';
        }

        var propertyCards = properties.map(function(p, i) {
            var badge = p.badge ? '<span class="lre-badge">' + esc(p.badge) + '</span>' : '';
            var idx = i + 2;
            return '<article class="lre-property">' +
                '<div class="lre-property-media">' + media(list, idx) + badge + '</div>' +
                '<div class="lre-property-copy">' +
                '<h3>' + esc(p.title) + '</h3>' +
                '<span class="lre-location">' + esc(p.location) + '</span>' +
                '<strong class="lre-price">' + esc(p.price) + '</strong>' +
                '<p>' + esc(p.description) + '</p>' +
                '<a class="lre-btn" href="' + safeUrl(p.url) + '">' + esc(p.ctaLabel) + '</a>' +
                '</div></article>';
        }).join('');

        var serviceCards = services.map(function(s, i) {
            return '<article class="lre-service"><span>0' + (i + 1) + '</span><h3>' + esc(s) + '</h3></article>';
        }).join('');

        var contactButtons = '';
        if (phone) contactButtons += '<a class="lre-btn lre-btn-ghost" href="tel:' + escAttr(phone) + '">Llamar</a>';
        if (whatsapp) contactButtons += '<a class="lre-btn" href="https://wa.me/' + escAttr(whatsapp.replace(/\D/g, '')) + '" target="_blank" rel="noopener">WhatsApp</a>';
        if (email) contactButtons += '<a class="lre-btn lre-btn-ghost" href="mailto:' + escAttr(email) + '">Email</a>';

        var navHTML = showNavigation
            ? '<nav class="lre-nav"><a class="lre-logo" href="#lre-top">' + logoText + '</a><div class="lre-menu">' +
              '<a href="#lre-properties">' + t.menuProperties + '</a>' +
              '<a href="#lre-services">' + t.menuServices + '</a>' +
              '<a href="#lre-contact">' + t.menuContact + '</a>' +
              '</div>' + (enableLang ? '<button type="button" class="lre-lang" id="lre-lang" aria-label="Cambiar idioma">' + t.langLabel + '</button>' : '') +
              '</nav>'
            : '';

        var aboutGlassHTML = showAbout
            ? '<div class="lre-glass" id="lre-glass"><span class="lre-kicker">01 / About</span><h2>' + aboutTitle + '</h2><p>' + aboutText + '</p></div>'
            : '';

        var aboutSectionHTML = showAbout
            ? '<section class="lre-about" id="lre-about"><div class="lre-glass"><span class="lre-kicker">01 / About</span><h2>' + aboutTitle + '</h2><p>' + aboutText + '</p></div>' +
              '<div class="lre-about-media">' + media(list, 8) + '</div></section>'
            : '';

        var propertiesHTML = showProperties
            ? '<section class="lre-properties" id="lre-properties"><div class="lre-section-head"><span class="lre-kicker">02 / Propiedades</span><h2>' + propertiesTitle + '</h2></div>' +
              '<div class="lre-property-grid">' + propertyCards + '</div></section>'
            : '';

        var servicesHTML = showServices
            ? '<section class="lre-services" id="lre-services"><div class="lre-section-head"><span class="lre-kicker">03 / Servicios</span><h2>' + servicesTitle + '</h2></div>' +
              '<div class="lre-service-grid">' + serviceCards + '</div></section>'
            : '';

        var contactHTML = showContact
            ? '<section class="lre-contact" id="lre-contact"><div class="lre-contact-copy"><span class="lre-kicker">04 / Contacto</span><h2>' + contactTitle + '</h2><p>' + contactText + '</p>' +
              '<div class="lre-contact-actions"><a class="lre-btn" href="' + escAttr(ctaUrl) + '">' + ctaLabel + '</a>' + contactButtons + '</div></div>' +
              '<form class="lre-form" id="lre-form" data-note="' + escAttr(t.formNote) + '" onsubmit="return false;">' +
              '<label><span>' + t.formName + '</span><input type="text" required></label>' +
              '<label><span>' + t.formEmail + '</span><input type="email" required></label>' +
              '<label><span>' + t.formPhone + '</span><input type="tel"></label>' +
              '<label><span>' + t.formMessage + '</span><textarea rows="4"></textarea></label>' +
              '<button type="submit" class="lre-btn">' + t.formSubmit + '</button>' +
              '<p class="lre-form-note">' + t.formNote + '</p>' +
              '<p class="lre-form-status" id="lre-form-status"></p></form></section>'
            : '';

        var footerHTML = showFooter
            ? '<footer class="lre-footer"><span>' + brand + '</span><span>' + t.footerCopy + '</span></footer>'
            : '';

        return '<!doctype html>\n<html lang="' + lang + '">\n<head>\n<meta charset="utf-8">\n' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
            '<title>' + brand + ' — Luxury Real Estate Storytelling PRO</title>\n' +
            '<style>\n' +
            ':root{--primary:' + primaryColor + ';--secondary:' + secondaryColor + ';--bg:' + backgroundColor + ';--text:' + textColor + ';--glass:' + glassStrength + ';--parallax:' + parallaxIntensity + ';--scrub:' + scrubSmoothing + '}\n' +
            '*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden}\n' +
            'button,input,textarea,select{font:inherit}a{color:inherit;text-decoration:none}\n' +
            '.lre-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}\n' +
            '.lre-fallback{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1d26,#0b0d12);color:rgba(255,255,255,.4);font-size:14px;text-align:center;padding:6vw}\n' +
            '.lre-nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:0 4vw;height:72px;background:rgba(11,13,18,.82);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.08)}\n' +
            '.lre-logo{font-size:14px;font-weight:900;letter-spacing:.14em;color:var(--primary)}\n' +
            '.lre-menu{display:flex;gap:28px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}\n' +
            '.lre-menu a{opacity:.7;transition:opacity .25s}.lre-menu a:hover{opacity:1;color:var(--primary)}\n' +
            '.lre-lang{background:transparent;border:1px solid rgba(255,255,255,.25);color:var(--text);padding:8px 12px;font-size:10px;font-weight:800;letter-spacing:.1em;cursor:pointer;transition:border-color .25s,color .25s}\n' +
            '.lre-lang:hover{border-color:var(--primary);color:var(--primary)}\n' +
            '.lre-hero{position:relative;height:300vh}\n' +
            '.lre-hero-sticky{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;align-items:flex-end;padding:0 0 10vh 6vw}\n' +
            '.lre-hero-media{position:absolute;inset:0;z-index:0}\n' +
            '.lre-hero-overlay{position:absolute;inset:0;z-index:1;background:linear-gradient(0deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.22) 50%,rgba(0,0,0,.42) 100%)}\n' +
            '.lre-hero-content{position:relative;z-index:2;max-width:900px}\n' +
            '.lre-kicker{display:block;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--primary);margin-bottom:18px}\n' +
            '.lre-hero h1{font-size:clamp(48px,9vw,130px);line-height:.86;letter-spacing:-.05em;margin-bottom:22px}\n' +
            '.lre-hero p{max-width:520px;font-size:clamp(16px,2vw,22px);line-height:1.5;color:rgba(255,255,255,.78)}\n' +
            '.lre-hero-line{display:block;overflow:hidden}\n' +
            '.lre-hero-line span{display:block;transform:translateY(100%);transition:transform 1.1s cubic-bezier(.16,1,.3,1)}\n' +
            '.lre-hero-revealed .lre-hero-line span{transform:translateY(0)}\n' +
            '.lre-glass{position:absolute;right:6vw;top:50%;transform:translateY(-50%);z-index:3;width:min(420px,34vw);padding:36px;background:rgba(255,255,255,calc(var(--glass)));border:1px solid rgba(255,255,255,.12);border-radius:4px;backdrop-filter:blur(22px);box-shadow:0 30px 80px rgba(0,0,0,.35);transition:transform .15s ease-out}\n' +
            '.lre-glass h2{font-size:28px;line-height:1.1;margin-bottom:14px}\n' +
            '.lre-glass p{font-size:14px;line-height:1.55;color:rgba(255,255,255,.78)}\n' +
            '.lre-section-head{padding:0 6vw 60px}.lre-section-head h2{font-size:clamp(36px,5vw,64px);line-height:.95;letter-spacing:-.03em}\n' +
            '.lre-about{position:relative;min-height:80vh;display:grid;grid-template-columns:1fr 1fr;gap:6vw;align-items:center;padding:120px 6vw;background:var(--secondary)}\n' +
            '.lre-about-media{position:relative;height:480px;border-radius:4px;overflow:hidden}\n' +
            '.lre-properties,.lre-services,.lre-contact{padding:120px 0}\n' +
            '.lre-property-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:28px;padding:0 6vw}\n' +
            '.lre-property{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:4px;overflow:hidden;transition:transform .3s,border-color .3s}\n' +
            '.lre-property:hover{transform:translateY(-6px);border-color:rgba(255,255,255,.2)}\n' +
            '.lre-property-media{position:relative;height:260px;overflow:hidden}\n' +
            '.lre-badge{position:absolute;top:14px;left:14px;background:var(--primary);color:#08090c;padding:6px 10px;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;border-radius:2px}\n' +
            '.lre-property-copy{padding:24px}\n' +
            '.lre-property-copy h3{font-size:22px;margin-bottom:6px}\n' +
            '.lre-location{display:block;font-size:12px;opacity:.6;margin-bottom:10px}\n' +
            '.lre-price{display:block;font-size:20px;color:var(--primary);margin-bottom:12px}\n' +
            '.lre-property-copy p{font-size:14px;line-height:1.5;opacity:.75;margin-bottom:18px}\n' +
            '.lre-service-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:0 6vw}\n' +
            '.lre-service{padding:34px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:4px}\n' +
            '.lre-service span{color:var(--primary);font-size:11px;font-weight:900;letter-spacing:.12em;display:block;margin-bottom:18px}\n' +
            '.lre-service h3{font-size:18px;line-height:1.2}\n' +
            '.lre-contact{display:grid;grid-template-columns:1fr 1fr;gap:6vw;padding:120px 6vw;align-items:start}\n' +
            '.lre-contact-copy h2{font-size:clamp(36px,5vw,64px);line-height:.95;margin-bottom:22px}\n' +
            '.lre-contact-copy p{font-size:16px;line-height:1.6;opacity:.75;max-width:460px;margin-bottom:28px}\n' +
            '.lre-contact-actions{display:flex;flex-wrap:wrap;gap:14px}\n' +
            '.lre-btn{display:inline-flex;padding:14px 24px;background:var(--primary);color:#08090c;font-weight:900;font-size:12px;letter-spacing:.08em;border-radius:2px;transition:transform .25s,box-shadow .25s;border:none;cursor:pointer}\n' +
            '.lre-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.35)}\n' +
            '.lre-btn-ghost{background:transparent;color:var(--text);border:1px solid rgba(255,255,255,.25)}\n' +
            '.lre-form{display:grid;gap:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);padding:34px;border-radius:4px}\n' +
            '.lre-form label{display:grid;gap:8px;font-size:12px;opacity:.8}\n' +
            '.lre-form input,.lre-form textarea{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:var(--text);padding:12px;border-radius:2px}\n' +
            '.lre-form input:focus,.lre-form textarea:focus{outline:2px solid var(--primary);border-color:transparent}\n' +
            '.lre-form-note{font-size:12px;opacity:.55;margin-top:8px}\n' +
            '.lre-form-status{font-size:13px;color:var(--primary);margin-top:6px}\n' +
            '.lre-footer{display:flex;justify-content:space-between;align-items:center;padding:28px 6vw;border-top:1px solid rgba(255,255,255,.08);font-size:12px;opacity:.6}\n' +
            '@media (max-width:1024px){.lre-glass{position:relative;right:auto;top:auto;transform:none;width:100%;margin-top:40px}.lre-hero-sticky{align-items:flex-start;flex-direction:column;justify-content:flex-end;padding:0 6vw 10vh}.lre-service-grid{grid-template-columns:repeat(2,1fr)}.lre-contact{grid-template-columns:1fr}}\n' +
            '@media (max-width:700px){.lre-menu{display:none}.lre-about{grid-template-columns:1fr}.lre-about-media{height:320px}.lre-service-grid{grid-template-columns:1fr}.lre-property-grid{grid-template-columns:1fr}.lre-contact{padding:80px 6vw}.lre-properties,.lre-services{padding:80px 0}.lre-hero h1{font-size:clamp(38px,12vw,64px)}}\n' +
            '@media (prefers-reduced-motion:reduce){.lre-hero-line span{transform:none}.lre-glass{transition:none}}\n' +
            '</style>\n</head>\n<body id="lre-top">\n' +
            navHTML + '\n' +
            '<section class="lre-hero" id="lre-hero"><div class="lre-hero-sticky">' +
            '<div class="lre-hero-media">' + heroMedia + '</div><div class="lre-hero-overlay"></div>' +
            '<div class="lre-hero-content">' +
            '<span class="lre-kicker">' + heroEyebrow + '</span>' +
            '<h1><span class="lre-hero-line"><span>' + heroLine1 + '</span></span><span class="lre-hero-line"><span>' + heroLine2 + '</span></span></h1>' +
            '<p>' + heroSubtitle + '</p>' +
            '</div>' + aboutGlassHTML + '</div></section>\n' +
            aboutSectionHTML + '\n' + propertiesHTML + '\n' + servicesHTML + '\n' + contactHTML + '\n' + footerHTML + '\n' +
            '<script>\n' +
            '(function(){\n' +
            '  var hero = document.getElementById("lre-hero");\n' +
            '  var video = document.getElementById("lre-hero-video");\n' +
            '  var image = document.getElementById("lre-hero-image");\n' +
            '  var glass = document.getElementById("lre-glass");\n' +
            '  var form = document.getElementById("lre-form");\n' +
            '  var langBtn = document.getElementById("lre-lang");\n' +
            '  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
            '  var smoothing = ' + scrubSmoothing + ';\n' +
            '  var parallax = ' + parallaxIntensity + ';\n' +
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
            '    var rect = hero.getBoundingClientRect();\n' +
            '    var span = hero.offsetHeight - window.innerHeight;\n' +
            '    if (span <= 0) return 0;\n' +
            '    return clamp(-rect.top / span);\n' +
            '  }\n' +
            '\n' +
            '  function render(){\n' +
            '    var p = getProgress();\n' +
            '    var content = document.querySelector(".lre-hero-content");\n' +
            '    if (content) {\n' +
            '      content.classList.toggle("lre-hero-revealed", true);\n' +
            '      if (!reduced) {\n' +
            '        content.style.opacity = String(1 - p * 0.85);\n' +
            '        content.style.transform = "translateY(" + (p * -30) + "px)";\n' +
            '      }\n' +
            '    }\n' +
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
            '    if (glass && !reduced) {\n' +
            '      var mx = (typeof window.__lreMouseX !== "undefined" ? window.__lreMouseX : 0.5) - 0.5;\n' +
            '      var my = (typeof window.__lreMouseY !== "undefined" ? window.__lreMouseY : 0.5) - 0.5;\n' +
            '      glass.style.transform = "translateY(-50%) perspective(1000px) rotateY(" + (mx * 10 * parallax) + "deg) rotateX(" + (-my * 10 * parallax) + "deg)";\n' +
            '    }\n' +
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
            '  if (glass && !reduced) {\n' +
            '    window.addEventListener("mousemove", function(e){\n' +
            '      window.__lreMouseX = e.clientX / window.innerWidth;\n' +
            '      window.__lreMouseY = e.clientY / window.innerHeight;\n' +
            '    });\n' +
            '  }\n' +
            '\n' +
            '  if (form) {\n' +
            '    form.addEventListener("submit", function(e){\n' +
            '      e.preventDefault();\n' +
            '      if (!form.reportValidity()) return;\n' +
            '      var status = document.getElementById("lre-form-status");\n' +
            '      if (status) status.textContent = form.dataset.note || "Demo local: formulario no enviado.";\n' +
            '    });\n' +
            '  }\n' +
            '\n' +
            '  if (langBtn) {\n' +
            '    langBtn.addEventListener("click", function(){\n' +
            '      var html = document.documentElement;\n' +
            '      html.lang = html.lang === "es" ? "en" : "es";\n' +
            '    });\n' +
            '  }\n' +
            '})();\n' +
            '</script>\n</body>\n</html>';
    }

    build.schema = schema;
    build.id = 'luxury-real-estate-storytelling-pro';

    EP.SectorBlueprints.register(build);
})();
