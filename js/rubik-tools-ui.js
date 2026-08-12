// RUBIK SOTA Tools — isolated product family.
// TYPE A tools stay verbatim in iframe. TYPE B tools open an Escaparates authoring host
// that adapts a preserved engine without moving its visual algorithms into EP.Core.
(function() {
    var TOOLS = [
        {
            id: 'studio-experiences',
            name: 'Studio RUBIK SOTA Experiences',
            icon: '🎬',
            desc: 'Generador web propio con efectos y carga de video, música e imágenes desde local o URL (YouTube incluido).',
            integrationType: 'type-a',
            src: 'labs/rubik-sota-tools/studio-experiences/?edit'
        },
        {
            id: 'particles-engine-v5',
            name: 'RUBIK SOTA Particles Engine v5',
            icon: '✨',
            desc: 'Motor de partículas propio que reconstruye imágenes en 3D con alta resolución.',
            integrationType: 'type-a',
            src: 'labs/rubik-sota-tools/particles-engine-v5/'
        },
        {
            id: 'catalogo-inmersivo',
            name: 'RUBIK SOTA Catálogo Inmersivo',
            icon: '🗂️',
            desc: 'Motor de metaverso propio (PixiJS + GSAP) para catálogos de producto inmersivos y navegables.',
            integrationType: 'type-a',
            src: 'labs/rubik-sota-tools/catalogo-inmersivo/'
        },
        {
            id: 'pin-mapping-studio-pro',
            name: 'Pin Mapping Studio PRO',
            icon: 'PIN',
            desc: 'Herramienta visual de hotspots: compara dos crops, mantiene posicion y escala, permite lupa, arrastre y JSON final.',
            integrationType: 'type-a',
            src: 'labs/rubik-sota-tools/pin-mapping-studio-pro/'
        },
        {
            id: 'infinite-display-studio-pro',
            name: 'Infinite Display Studio PRO',
            icon: '∞',
            desc: 'Advanced Integrated Tool: 12 modos 3D, media, branding, presentación, proyectos y outputs con motor canónico preservado.',
            integrationType: 'type-b',
            src: 'advanced-tool.html?tool=infinite-display-studio-pro'
        },
        {
            id: 'banderolas-studio-pro',
            name: 'Banderolas Studio PRO',
            icon: '〰',
            desc: 'Advanced Integrated Tool: tela/banderola WebGL con física Verlet preservada, imagen/vídeo, composición, proyectos, PNG, WEBM y standalone.',
            integrationType: 'type-b',
            src: 'banderolas-tool.html'
        }
    ];

    var active = false;
    var activeToolId = null;

    function renderCatalog() {
        var catalog = document.getElementById('rubik-tools-catalog');
        if (!catalog) return;
        catalog.innerHTML = TOOLS.map(function(t) {
            var badge = t.integrationType === 'type-b' ? '<span class="ss-family" style="margin-left:7px">ADVANCED</span>' : '';
            return '<div class="ss-template-card' + (t.id === activeToolId ? ' active' : '') + '" data-tool="' + t.id + '">' +
                '<span class="ss-icon">' + t.icon + '</span>' +
                '<div><div class="ss-name">' + t.name + badge + '</div><div class="ss-desc">' + t.desc + '</div></div>' +
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
    EP.RubikToolsUI = { init: init, getTools: function(){ return TOOLS.slice(); } };
})();
