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
        ],
        'gradient-3d-carousel': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'repeating-image-transition': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'dual-wave-text': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'words', type: 'wordlist', label: 'Palabras (una por línea)',
              default: ['Diseño', 'Presencia', 'Impacto', 'Marca', 'Premium', 'Escaparate',
                        'Detalle', 'Luz', 'Espacio', 'Forma', 'Textura', 'Enfoque'] }
        ],
        'parallax-photo-ring': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'accordion-gallery': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'spin-scroll-gallery': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'infinite-hero-parallax': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'grid-flip-resize': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'blinds-scroll-reveal': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'vertical-marquee-showcase': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'pointer-scrub-title': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'words', type: 'wordlist', label: 'Líneas de título (una por línea)',
              default: ['ESCAPARATE', 'PREMIUM', 'INTERIOR'] }
        ],
        'slide-observer-showcase': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'horizontal-spotlight-gallery': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'headline', type: 'text', label: 'Texto de apertura', default: 'Cada scroll revela una nueva perspectiva. Recorre nuestras referencias en un flujo visual continuo.' },
            { key: 'outro', type: 'text', label: 'Texto de cierre', default: 'Al terminar el recorrido, que estas imágenes se queden contigo — el detalle siempre cuenta una historia.' }
        ],
        'drag-explore-canvas': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'description', type: 'text', label: 'Descripción', default: 'Arrastra para explorar la colección completa' }
        ],
        'smoother-zigzag-gallery': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'galleryTitle', type: 'text', label: 'Titular central', default: 'Cada detalle cuenta una historia — descúbrela al hacer scroll' },
            { key: 'outro', type: 'text', label: 'Texto de cierre', default: '¿Quieres ver más referencias?' }
        ],
        'morph-to-fullscreen': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'intro', type: 'text', label: 'Texto de apertura', default: 'Entra en un espacio donde cada imagen se expande más allá del marco' },
            { key: 'outro', type: 'text', label: 'Texto de cierre', default: 'Cada referencia cuenta una historia — la tuya continúa aquí.' },
            { key: 'caption', type: 'text', label: 'Título central', default: 'Detalle' },
            { key: 'captionText', type: 'text', label: 'Descripción central', default: 'Una mirada cercana a los acabados y la luz que definen este espacio.' }
        ],
        'hover-collage-reveal': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'hoverLabel', type: 'text', label: 'Texto hover (título)', default: 'Pasa el ratón' },
            { key: 'hoverSub', type: 'text', label: 'Texto hover (subtítulo)', default: 'para ver la colección' },
            { key: 'ctaLabel', type: 'text', label: 'Texto CTA en imagen central', default: 'contacta con nosotros' },
            { key: 'lineA', type: 'text', label: 'Línea 1 del bloque final', default: 'Hagamos algo' },
            { key: 'lineB', type: 'text', label: 'Línea 2 del bloque final', default: 'increíble juntos' }
        ],
        'depth-scatter-intro': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'lineA', type: 'text', label: 'Línea 1 del titular', default: 'Referencias reales' },
            { key: 'lineB', type: 'text', label: 'Línea 2 del titular', default: 'de espacios reales' }
        ],
        'word-swap-statement': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'intro', type: 'text', label: 'Texto de apertura', default: 'Donde el movimiento se convierte en significado. Damos vida a las palabras con animaciones que transforman cada frase en una experiencia.' },
            { key: 'wordA1', type: 'text', label: 'Palabra que sale (par 1)', default: 'Detalle' },
            { key: 'wordA2', type: 'text', label: 'Palabra que entra (par 1)', default: 'Carácter' },
            { key: 'wordMid', type: 'text', label: 'Palabra central fija', default: 'define' },
            { key: 'wordB1', type: 'text', label: 'Palabra que sale (par 2)', default: 'un espacio' },
            { key: 'wordB2', type: 'text', label: 'Palabra que entra (par 2)', default: 'un hogar' },
            { key: 'description', type: 'text', label: 'Párrafo lateral', default: 'Llevamos la creatividad a cada rincón de tu propiedad — porque las marcas más fuertes cuidan hasta el último detalle.' },
            { key: 'outro', type: 'text', label: 'Texto de cierre', default: 'Más que fotos. Más que movimiento. Esto es diseño en movimiento — un homenaje al arte de contar historias a través del scroll.' }
        ],
        'grid-slides-toggle': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'block-reveal-loader': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'word1', type: 'text', label: 'Palabra loader 1', default: 'Bienvenido' },
            { key: 'word2', type: 'text', label: 'Palabra loader 2', default: 'al escaparate' },
            { key: 'heroTitle', type: 'text', label: 'Titular hero', default: 'bienvenido a tu escaparate' }
        ],
        'cursor-poster-scroll': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'labels', type: 'wordlist', label: 'Palabras clave (una por línea)',
              default: ['Luz natural', 'Materiales nobles', 'Silencio y calma'] }
        ],
        'marquee-video-reveal': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'playLabel', type: 'text', label: 'Palabra en la marquesina', default: 'Ver' },
            { key: 'outro', type: 'text', label: 'Texto de cierre', default: '¿Quieres ver más referencias?' }
        ],
        'split-mask-reveal': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'intro', type: 'text', label: 'Texto de apertura', default: 'Descubre el arte del movimiento en esta experiencia visual — una exploración creativa que combina diseño, narrativa y código en un recorrido continuo.' },
            { key: 'heroTitle', type: 'text', label: 'Titular central', default: 'Crezcamos juntos y creemos algo increíble' },
            { key: 'outro', type: 'text', label: 'Texto de cierre', default: 'Gracias por explorar este recorrido — que inspire tu propia forma de contar historias a través del movimiento.' }
        ],
        'falling-text-drop': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'paragraph', type: 'text', label: 'Párrafo de marca', default: 'Cada espacio cuenta una historia. Convertimos visiones estáticas en experiencias vivas, con animaciones cuidadas y presentaciones que enamoran a primera vista. No solo buscamos que luzca bien — buscamos que se sienta inolvidable.' }
        ],
        'css-spotlight-reveal': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'hint', type: 'text', label: 'Texto de ayuda', default: 'Mueve el cursor para descubrir el espacio' }
        ],
        'truchet-pattern-hero': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'tagline', type: 'text', label: 'Eslogan', default: 'Diseño que se mueve contigo' }
        ],
        'product-card-slider': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'multi-stage-comparator': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'stages', type: 'itemlist3', label: 'Etapas — Etiqueta | Título | Subtítulo (una por línea)',
              default: [] }
        ],
        'keyhole-scroll-slideshow': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'cues', type: 'itemlist2', label: 'Estancias — Nombre | Descripción (una por línea)',
              default: [] }
        ],
        'six-faces-tour-cube': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'rooms', type: 'itemlist2', label: 'Estancias (6) — Nombre | Descripción (una por línea)',
              default: [] }
        ],
        'masonry-lightbox-gallery': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'photo-filter-editor': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' }
        ],
        'viewing-appointment-ticket': [
            { key: 'title', type: 'text', label: 'Título del evento / viaje', default: 'Concierto de Rock' },
            { key: 'subtitle', type: 'text', label: 'Lugar / dirección', default: 'Recinto Municipal, Madrid' },
            { key: 'iconType', type: 'text', label: 'Icono (avion / coche / tren / personas / musica / evento)', default: 'musica' },
            { key: 'codeFrom', type: 'text', label: 'Código izquierdo (3 letras)', default: 'MAD' },
            { key: 'codeTo', type: 'text', label: 'Código derecho (3 letras)', default: 'EVT' },
            { key: 'rightLabel', type: 'text', label: 'Etiqueta del resguardo', default: 'ACCESO' },
            { key: 'fields', type: 'itemlist2', label: 'Campos — Etiqueta | Valor (hasta 4, una por línea)',
              default: [] }
        ],
        'team-circle-rotator': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Nuestro Equipo' },
            { key: 'members', type: 'itemlist2', label: 'Equipo — Nombre | Cargo (una por línea)',
              default: [] }
        ],
        'folding-box-reveal': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Escaparate' },
            { key: 'message', type: 'text', label: 'Mensaje', default: 'Tu pedido, listo para viajar.' },
            { key: 'faceLabels', type: 'itemlist2', label: 'Caras sin imagen — Texto | Subtexto (hasta 4, una por línea; si subes fotos/vídeos ocupan esas caras primero)',
              default: [] }
        ],
        'rube-goldberg-contact-form': [
            { key: 'title', type: 'text', label: 'Título de la página', default: 'Contacta con Nosotros' },
            { key: 'nameLabel', type: 'text', label: 'Placeholder de nombre', default: 'nombre' },
            { key: 'emailLabel', type: 'text', label: 'Placeholder de email', default: 'email' },
            { key: 'checkboxLabel', type: 'text', label: 'Texto de la casilla', default: 'acepto recibir información' },
            { key: 'submitLabel', type: 'text', label: 'Texto del botón', default: 'enviar' }
        ],
        'burning-dom-reveal': [
            { key: 'title', type: 'text', label: 'Título / Marca', default: 'Últimas Plazas Disponibles' },
            { key: 'message', type: 'text', label: 'Subtítulo', default: 'Cuando se agoten, esta oferta desaparece para siempre.' },
            { key: 'popupTitle', type: 'text', label: 'Título del popup', default: 'Reserva tu plaza' },
            { key: 'openLabel', type: 'text', label: 'Texto botón abrir', default: 'Ver oferta' },
            { key: 'burnLabel', type: 'text', label: 'Texto botón quemar', default: 'Confirmar y quemar' },
            { key: 'fields', type: 'itemlist2', label: 'Campos del popup — Etiqueta | Valor por defecto (hasta 3, una por línea)',
              default: [] }
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

    function makeCard(t) {
        var card = document.createElement('div');
        card.className = 'ss-template-card' + (t.id === state.activeId ? ' active' : '');
        card.innerHTML =
            '<div class="ss-icon">' + t.icon + '</div>' +
            '<div><div class="ss-name">' + t.name + '</div><div class="ss-desc">' + t.description + '</div></div>';
        card.addEventListener('click', function() { selectTemplate(t.id); });
        return card;
    }

    // "Original's Top" — a catch-all bucket for templates adapted faithfully from a
    // specific named original (an Awwwards site, a creative playground, etc.) whose
    // own interaction model is distinctive enough that it doesn't need to be forced
    // into any other grouping — they just get flagged and shown together, unchanged.
    function renderCatalog() {
        var container = document.getElementById('scroll-sections-catalog');
        if (!container) return;
        var templates = EP.ScrollSections.getAll();
        container.innerHTML = '';

        var regular = templates.filter(function(t) { return t.badge !== 'original-top'; });
        var originalTop = templates.filter(function(t) { return t.badge === 'original-top'; });

        regular.forEach(function(t) { container.appendChild(makeCard(t)); });

        if (originalTop.length) {
            var header = document.createElement('div');
            header.className = 'ss-catalog-section-header';
            header.textContent = '🏆 Original\'s Top';
            container.appendChild(header);
            originalTop.forEach(function(t) { container.appendChild(makeCard(t)); });
        }

        var searchEl = document.getElementById('effects-search');
        if (searchEl && searchEl.value && state.mode === 'scroll-sections') filterCatalog(searchEl.value);
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

    // The #effects-search box lives in the shared panel-header and its own
    // input handler (in ui.js) only ever queries .effect-category/.effect-card
    // — it has no idea .ss-template-card exists, so typing there did nothing
    // while in Scroll Sections mode. Wired up separately here rather than
    // editing ui.js's handler, so Effects search behavior is untouched.
    function normalizeSearchText(str) {
        return (str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function filterCatalog(query) {
        var container = document.getElementById('scroll-sections-catalog');
        if (!container) return;
        var q = normalizeSearchText(query);
        var children = Array.prototype.slice.call(container.children);
        var pendingHeader = null;
        var pendingHeaderVisibleCount = 0;
        function flushHeader() {
            if (pendingHeader) pendingHeader.style.display = pendingHeaderVisibleCount > 0 ? '' : 'none';
        }
        children.forEach(function(child) {
            if (child.classList.contains('ss-catalog-section-header')) {
                flushHeader();
                pendingHeader = child;
                pendingHeaderVisibleCount = 0;
                return;
            }
            if (child.classList.contains('ss-template-card')) {
                var nameEl = child.querySelector('.ss-name');
                var descEl = child.querySelector('.ss-desc');
                var name = normalizeSearchText(nameEl ? nameEl.textContent : '');
                var desc = normalizeSearchText(descEl ? descEl.textContent : '');
                var show = !q || name.indexOf(q) !== -1 || desc.indexOf(q) !== -1;
                child.style.display = show ? '' : 'none';
                if (show) pendingHeaderVisibleCount++;
            }
        });
        flushHeader();
    }

    function bindCatalogSearch() {
        var search = document.getElementById('effects-search');
        var clearBtn = document.getElementById('effects-search-clear');
        if (!search) return;
        search.addEventListener('input', function() {
            if (state.mode === 'scroll-sections') filterCatalog(search.value);
        });
        search.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && state.mode === 'scroll-sections') filterCatalog('');
        });
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                if (state.mode === 'scroll-sections') filterCatalog('');
            });
        }
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
        bindCatalogSearch();

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
