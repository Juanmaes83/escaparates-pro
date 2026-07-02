EP.Tags = (function() {

    var TAG_DEFS = [
        // Curación
        { id: 'trending',      label: 'Trending',      icon: '🔥', group: 'curación' },
        { id: 'premium',       label: 'Premium',       icon: '⭐', group: 'curación' },
        { id: 'new',           label: 'Nuevo',         icon: '✨', group: 'curación' },
        { id: 'mobile-safe',   label: 'Mobile OK',     icon: '📱', group: 'curación' },
        // Web
        { id: 'hero',          label: 'Hero web',      icon: '🖥️',  group: 'web' },
        { id: 'landing',       label: 'Landing',       icon: '📄', group: 'web' },
        { id: 'servicios',     label: 'Servicios',     icon: '⚙️',  group: 'web' },
        { id: 'productos',     label: 'Productos',     icon: '🏷️',  group: 'web' },
        { id: 'marcas',        label: 'Marcas',        icon: '🎯', group: 'web' },
        { id: 'portfolio',     label: 'Portfolio',     icon: '🖼️',  group: 'web' },
        // RRSS
        { id: 'reel',          label: 'Reel',          icon: '🎬', group: 'rrss' },
        { id: 'story',         label: 'Story',         icon: '📲', group: 'rrss' },
        { id: 'post',          label: 'Post',          icon: '📸', group: 'rrss' },
        { id: 'video',         label: 'Video',         icon: '🎥', group: 'rrss' },
        // Físico
        { id: 'escaparate',    label: 'Escaparate',    icon: '🏪', group: 'físico' },
        { id: 'digital-signage', label: 'Pantalla',    icon: '📺', group: 'físico' }
    ];

    var TAG_MAP = {};
    TAG_DEFS.forEach(function(t) { TAG_MAP[t.id] = t; });

    // Curated trending/new lists (effect IDs)
    var TRENDING_IDS = [
        'showcase-stream', 'hyper-zoom', 'infinite-spiral', 'voxelhedron',
        'stacked-cards', 'immersive-layers-pro', 'kinetic-grid', 'parallax-wall',
        'glassmorphism-cards', 'spotlight-reveal'
    ];

    function autoTag(effect) {
        if (!effect || !effect.meta) return;
        var tags = {};
        (effect.meta.tags || []).forEach(function(t) { tags[t] = true; });

        var category = effect.meta.category || '';
        var name = (effect.meta.name || '').toLowerCase();
        var desc = (effect.meta.description || '').toLowerCase();
        var text = name + ' ' + desc;
        var caps = effect.capabilities || {};

        // --- Curación ---
        if (TRENDING_IDS.indexOf(effect.id) !== -1) tags['trending'] = true;
        if (caps.mobileRisk === 'low') tags['mobile-safe'] = true;
        if (caps.usesParticlesShaders || caps.usesCamera || caps.usesPostProcessing || category === 'glassmorphism') {
            tags['premium'] = true;
        }

        // --- Por categoría ---
        if (category === '3d-perspective') {
            tags['hero'] = true;
            tags['digital-signage'] = true;
            tags['premium'] = true;
        }
        if (category === 'parallax') {
            tags['hero'] = true;
            tags['landing'] = true;
        }
        if (category === 'glassmorphism') {
            tags['hero'] = true;
            tags['landing'] = true;
        }
        if (category === 'spotlight-focus') {
            tags['escaparate'] = true;
            tags['digital-signage'] = true;
            tags['productos'] = true;
        }
        if (category === 'reveal-wipe') {
            tags['reel'] = true;
            tags['story'] = true;
        }
        if (category === 'motion') {
            tags['reel'] = true;
            tags['story'] = true;
            tags['video'] = true;
        }
        if (category === 'carousel-flow') {
            tags['landing'] = true;
            tags['post'] = true;
            tags['servicios'] = true;
        }
        if (category === 'grid') {
            tags['post'] = true;
            tags['portfolio'] = true;
            tags['productos'] = true;
        }
        if (category === 'stack-scatter') {
            tags['reel'] = true;
            tags['story'] = true;
            tags['post'] = true;
        }
        if (category === 'gravity') {
            tags['reel'] = true;
            tags['story'] = true;
            tags['hero'] = true;
            tags['video'] = true;
        }
        if (category === 'field') {
            tags['hero'] = true;
            tags['reel'] = true;
            tags['digital-signage'] = true;
            tags['premium'] = true;
        }
        if (category === 'flicker') {
            tags['reel'] = true;
            tags['story'] = true;
            tags['video'] = true;
        }
        if (category === 'orbit') {
            tags['hero'] = true;
            tags['digital-signage'] = true;
            tags['premium'] = true;
        }
        if (category === 'proximity') {
            tags['landing'] = true;
            tags['post'] = true;
            tags['reel'] = true;
        }

        // --- Por keywords ---
        if (/gallery|galeria|showcase/.test(text)) {
            tags['portfolio'] = true;
            tags['productos'] = true;
        }
        if (/hero|showcase|stream|immersive/.test(text)) {
            tags['hero'] = true;
        }
        if (/logo|brand|marca/.test(text)) {
            tags['marcas'] = true;
        }
        if (/story/.test(text)) { tags['story'] = true; }
        if (/reel/.test(text)) { tags['reel'] = true; }
        if (/scroll|infinite|loop|continu|tunnel/.test(text)) {
            tags['digital-signage'] = true;
            tags['escaparate'] = true;
        }
        if (/product|producto|shop/.test(text)) { tags['productos'] = true; }
        if (/service|servicio/.test(text)) { tags['servicios'] = true; }
        if (/portfolio|work|obra/.test(text)) { tags['portfolio'] = true; }
        if (/video/.test(text)) { tags['video'] = true; }
        if (/card|tarjeta|post/.test(text)) { tags['post'] = true; }
        if (/landing|cta|conversion/.test(text)) { tags['landing'] = true; }
        if (/mupi|billboard|exterior|facade/.test(text)) {
            tags['digital-signage'] = true;
            tags['escaparate'] = true;
        }
        if (/immobil|real.?estate|inmobil|piso|casa|apartament|vivienda/.test(text)) {
            tags['hero'] = true;
        }

        // Supports video → tag video
        if (caps.supportsVideo) tags['video'] = true;

        effect.meta.tags = Object.keys(tags);
    }

    function getDefs() { return TAG_DEFS; }
    function getDef(id) { return TAG_MAP[id] || null; }

    return {
        getDefs: getDefs,
        getDef: getDef,
        autoTag: autoTag
    };
})();
