// Scroll Sections UI — mode toggle, template catalog, live preview and export.
// Wires the standalone EP.ScrollSections template registry into the app shell
// without touching the existing Effects canvas/panel logic (additive only).
EP.ScrollSectionsUI = (function() {
    var FIELD_SCHEMAS = {
        'elastic-grid-scroll': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'rotating-onscroll': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'headline', type: 'text', label: 'Texto marquesina', default: 'ESCAPARATE · PREMIUM · SHOWCASE · ' }
        ],
        'scroll-text-motion': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'words', type: 'wordlist', label: 'Palabras / frases (una por línea)',
              default: ['Diseño', 'Presencia digital', 'Impacto visual', 'Marca', 'Experiencia premium',
                        'Escaparate', 'Storytelling', 'Detalle', 'Materialidad', 'Luz', 'Textura',
                        'Movimiento', 'Composición', 'Ambición', 'Claridad', 'Elegancia'] }
        ],
        'draggable-grid': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'items', type: 'itemlist3', label: 'Fichas — Título | Precio | Descripción (una por línea)',
              default: [] }
        ],
        'connected-grid': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'captions', type: 'itemlist2', label: 'Leyendas — Título | Año (una por línea)',
              default: [] }
        ],
        'scroll-3d-grid': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'carousel-3d': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'make-way-grid': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'canvas-slice-gallery': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'push-grid-items': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'hover-grid': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ]
    };

    var state = { mode: 'effects', activeId: null, options: {} };
    var renderTimer = null;

    function getSchema(id) { return FIELD_SCHEMAS[id] || []; }

    function ensureOptions(id) {
        if (state.options[id]) return state.options[id];
        var opts = {};
        getSchema(id).forEach(function(f) { opts[f.key] = f.default; });
        state.options[id] = opts;
        return opts;
    }

    function textToWordlist(text) {
        return text.split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
    }
    function wordlistToText(arr) { return (arr || []).join('\n'); }

    function textToItemlist3(text) {
        return text.split('\n').map(function(line) {
            var parts = line.split('|').map(function(s) { return s.trim(); });
            if (!parts[0]) return null;
            return { title: parts[0] || '', price: parts[1] || '', description: parts[2] || '', ctaLabel: parts[3] || '' };
        }).filter(Boolean);
    }
    function itemlist3ToText(arr) {
        return (arr || []).map(function(it) { return [it.title, it.price, it.description].join(' | '); }).join('\n');
    }

    function textToItemlist2(text) {
        return text.split('\n').map(function(line) {
            var parts = line.split('|').map(function(s) { return s.trim(); });
            if (!parts[0]) return null;
            return { title: parts[0] || '', year: parts[1] || '' };
        }).filter(Boolean);
    }
    function itemlist2ToText(arr) {
        return (arr || []).map(function(it) { return [it.title, it.year].join(' | '); }).join('\n');
    }

    // Converts the schema-shaped state into the `opts` object each template's build() expects.
    function buildOptsFor(id) {
        var raw = ensureOptions(id);
        var out = {};
        getSchema(id).forEach(function(f) {
            switch (f.type) {
                case 'wordlist': out[f.key] = raw[f.key]; break;
                case 'itemlist3': out[f.key] = raw[f.key]; break;
                case 'itemlist2': out[f.key] = raw[f.key]; break;
                default: out[f.key] = raw[f.key];
            }
        });
        return out;
    }

    function renderCatalog() {
        var container = document.getElementById('scroll-sections-catalog');
        if (!container) return;
        var templates = EP.ScrollSections.getAll();
        container.innerHTML = '';
        templates.forEach(function(t) {
            var card = document.createElement('div');
            card.className = 'ss-template-card' + (t.id === state.activeId ? ' active' : '');
            card.innerHTML =
                '<div class="ss-icon">' + t.icon + '</div>' +
                '<div><div class="ss-name">' + t.name + '</div><div class="ss-desc">' + t.description + '</div></div>';
            card.addEventListener('click', function() { selectTemplate(t.id); });
            container.appendChild(card);
        });
    }

    function renderFields() {
        var wrap = document.getElementById('ss-props-fields');
        var titleEl = document.getElementById('ss-props-title');
        var noteEl = document.getElementById('ss-source-note');
        if (!wrap || !state.activeId) return;
        var tpl = EP.ScrollSections.get(state.activeId);
        var opts = ensureOptions(state.activeId);
        if (titleEl) titleEl.textContent = (tpl.icon + ' ' + tpl.name).toUpperCase();
        wrap.innerHTML = '';

        getSchema(state.activeId).forEach(function(f) {
            var field = document.createElement('div');
            field.className = 'ss-field';
            var label = document.createElement('label');
            label.textContent = f.label;
            field.appendChild(label);

            var input;
            if (f.type === 'text') {
                input = document.createElement('input');
                input.type = 'text';
                input.value = opts[f.key] || '';
                input.addEventListener('input', function() {
                    opts[f.key] = input.value;
                    scheduleRender();
                });
            } else {
                input = document.createElement('textarea');
                if (f.type === 'wordlist') input.value = wordlistToText(opts[f.key]);
                else if (f.type === 'itemlist3') input.value = itemlist3ToText(opts[f.key]);
                else if (f.type === 'itemlist2') input.value = itemlist2ToText(opts[f.key]);
                input.addEventListener('input', function() {
                    if (f.type === 'wordlist') opts[f.key] = textToWordlist(input.value);
                    else if (f.type === 'itemlist3') opts[f.key] = textToItemlist3(input.value);
                    else if (f.type === 'itemlist2') opts[f.key] = textToItemlist2(input.value);
                    scheduleRender();
                });
            }
            field.appendChild(input);
            wrap.appendChild(field);
        });

        if (noteEl) {
            noteEl.innerHTML = tpl.sourceUrl
                ? 'Técnica adaptada de <a href="' + tpl.sourceUrl + '" target="_blank" rel="noopener">' + tpl.sourceUrl.replace('https://', '') + '</a>. Los textos y la media se sustituyen por los tuyos.'
                : '';
        }
    }

    function scheduleRender() {
        if (renderTimer) clearTimeout(renderTimer);
        renderTimer = setTimeout(renderPreview, 250);
    }

    function renderPreview() {
        if (state.mode !== 'scroll-sections' || !state.activeId) return;
        var frame = document.getElementById('ss-preview-frame');
        if (!frame) return;
        var mediaList = (EP.Media && EP.Media.getAll) ? EP.Media.getAll() : [];
        var html = EP.ScrollSections.buildDocument(state.activeId, mediaList, buildOptsFor(state.activeId));
        if (html) frame.srcdoc = html;
    }

    function selectTemplate(id) {
        state.activeId = id;
        ensureOptions(id);
        renderCatalog();
        renderFields();
        renderPreview();
    }

    function exportCurrent() {
        if (!state.activeId) return;
        var mediaList = (EP.Media && EP.Media.getAll) ? EP.Media.getAll() : [];
        var html = EP.ScrollSections.buildDocument(state.activeId, mediaList, buildOptsFor(state.activeId));
        if (!html) return;
        var blob = new Blob([html], { type: 'text/html' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'escaparate-' + state.activeId + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
        if (EP.UI && EP.UI.toast) EP.UI.toast('Archivo HTML exportado — listo para copiar/pegar en la web del cliente');
    }

    function setMode(mode) {
        if (state.mode === mode) return;
        state.mode = mode;
        document.body.classList.toggle('mode-scroll-sections', mode === 'scroll-sections');

        var stage = document.getElementById('scroll-sections-stage');
        var catalog = document.getElementById('scroll-sections-catalog');
        var effectsBody = document.getElementById('effects-catalog-body');
        var props = document.getElementById('scroll-sections-props');
        var btnEffects = document.getElementById('mode-btn-effects');
        var btnScroll = document.getElementById('mode-btn-scroll-sections');

        var isScroll = mode === 'scroll-sections';
        if (stage) stage.classList.toggle('active', isScroll);
        if (catalog) catalog.style.display = isScroll ? 'block' : 'none';
        if (effectsBody) effectsBody.style.display = isScroll ? 'none' : 'block';
        if (props) props.style.display = isScroll ? 'block' : 'none';
        if (btnEffects) btnEffects.classList.toggle('active', !isScroll);
        if (btnScroll) btnScroll.classList.toggle('active', isScroll);

        if (isScroll) {
            if (EP.Timeline && EP.Timeline.pause) EP.Timeline.pause();
            if (!state.activeId) {
                var first = EP.ScrollSections.getAll()[0];
                if (first) selectTemplate(first.id);
            } else {
                renderFields();
                renderPreview();
            }
        } else {
            if (EP.Timeline && EP.Timeline.play) EP.Timeline.play();
        }
    }

    function init() {
        renderCatalog();

        var btnEffects = document.getElementById('mode-btn-effects');
        var btnScroll = document.getElementById('mode-btn-scroll-sections');
        if (btnEffects) btnEffects.addEventListener('click', function() { setMode('effects'); });
        if (btnScroll) btnScroll.addEventListener('click', function() { setMode('scroll-sections'); });

        var exportBtn = document.getElementById('ss-export-btn');
        if (exportBtn) exportBtn.addEventListener('click', exportCurrent);

        if (EP.Media && EP.Media.onChange) {
            EP.Media.onChange(function() {
                if (state.mode === 'scroll-sections') renderPreview();
            });
        }
    }

    return { init: init, setMode: setMode, selectTemplate: selectTemplate };
})();
