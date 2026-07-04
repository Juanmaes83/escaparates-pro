// RUBIK SOTA Tools — third app mode. Wires the two verbatim-copied,
// fully-isolated tools (labs/rubik-sota-tools/*) into their own space via an
// iframe, without touching Efectos or Scroll Sections state/logic. Those two
// modes toggle each other through EP.ScrollSectionsUI.setMode(); this module
// only ever listens for clicks (never calls into that module) and manages
// its own stage, so it can't regress anything already approved there.
(function() {
    var TOOLS = [
        {
            id: 'studio-experiences',
            name: 'Studio RUBIK SOTA Experiences',
            icon: '🎬',
            desc: 'Generador web propio con efectos y carga de video, música e imágenes desde local o URL (YouTube incluido).',
            // ?edit reveals the tool's own hidden "EDIT" badge (#ebdg), which
            // toggles its internal editor panel (#rse) — both exist in the
            // tool's original code but stay hidden without this query param.
            // Passing it here (not touching the tool's files) is how its own
            // demo URL (…/index.html?edit) already activated the panel.
            src: 'labs/rubik-sota-tools/studio-experiences/?edit'
        },
        {
            id: 'particles-engine-v5',
            name: 'RUBIK SOTA Particles Engine v5',
            icon: '✨',
            desc: 'Motor de partículas propio que reconstruye imágenes en 3D con alta resolución.',
            src: 'labs/rubik-sota-tools/particles-engine-v5/index.html'
        },
        {
            id: 'catalogo-inmersivo',
            name: 'RUBIK SOTA Catálogo Inmersivo',
            icon: '🗂️',
            desc: 'Motor de metaverso propio (PixiJS + GSAP) para catálogos de producto inmersivos y navegables.',
            src: 'labs/rubik-sota-tools/catalogo-inmersivo/index.html'
        }
    ];

    var active = false;
    var activeToolId = null;

    function renderCatalog() {
        var catalog = document.getElementById('rubik-tools-catalog');
        if (!catalog) return;
        catalog.innerHTML = TOOLS.map(function(t) {
            return '<div class="ss-template-card' + (t.id === activeToolId ? ' active' : '') + '" data-tool="' + t.id + '">' +
                '<span class="ss-icon">' + t.icon + '</span>' +
                '<div><div class="ss-name">' + t.name + '</div><div class="ss-desc">' + t.desc + '</div></div>' +
                '</div>';
        }).join('');
        Array.prototype.forEach.call(catalog.querySelectorAll('.ss-template-card'), function(card) {
            card.addEventListener('click', function() { selectTool(card.getAttribute('data-tool')); });
        });
    }

    function selectTool(id) {
        var tool = null;
        for (var i = 0; i < TOOLS.length; i++) { if (TOOLS[i].id === id) { tool = TOOLS[i]; break; } }
        if (!tool) return;
        activeToolId = id;
        var frame = document.getElementById('rubik-tools-frame');
        if (frame && frame.getAttribute('data-src') !== tool.src) {
            frame.src = tool.src;
            frame.setAttribute('data-src', tool.src);
        }
        renderCatalog();
    }

    function activate() {
        if (active) return;
        active = true;

        var ssStage = document.getElementById('scroll-sections-stage');
        if (ssStage) ssStage.classList.remove('active');
        document.body.classList.remove('mode-scroll-sections');
        var btnEffects = document.getElementById('mode-btn-effects');
        var btnScroll = document.getElementById('mode-btn-scroll-sections');
        if (btnEffects) btnEffects.classList.remove('active');
        if (btnScroll) btnScroll.classList.remove('active');
        if (EP.Timeline && EP.Timeline.pause) EP.Timeline.pause();

        document.body.classList.add('mode-rubik-tools');
        var stage = document.getElementById('rubik-tools-stage');
        var btn = document.getElementById('mode-btn-rubik-tools');
        if (stage) stage.classList.add('active');
        if (btn) btn.classList.add('active');

        if (!activeToolId) selectTool(TOOLS[0].id);
        else renderCatalog();
    }

    function deactivate() {
        if (!active) return;
        active = false;
        document.body.classList.remove('mode-rubik-tools');
        var stage = document.getElementById('rubik-tools-stage');
        var btn = document.getElementById('mode-btn-rubik-tools');
        if (stage) stage.classList.remove('active');
        if (btn) btn.classList.remove('active');
    }

    function init() {
        var btn = document.getElementById('mode-btn-rubik-tools');
        var btnEffects = document.getElementById('mode-btn-effects');
        var btnScroll = document.getElementById('mode-btn-scroll-sections');
        if (btn) btn.addEventListener('click', activate);
        if (btnEffects) btnEffects.addEventListener('click', deactivate);
        if (btnScroll) btnScroll.addEventListener('click', deactivate);
    }

    window.EP = window.EP || {};
    EP.RubikToolsUI = { init: init };
})();
