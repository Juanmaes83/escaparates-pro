// Scroll Sections — full-page scroll-driven templates (GSAP + Lenis/ScrollSmoother).
// Architecturally separate from EP.EffectBase (Three.js canvas loop): these are
// real-scroll DOM experiences with no fixed duration, built for the client to
// paste directly into their own website (one standalone .html file, no build step).
EP.ScrollSections = (function() {
    var TEMPLATES = {};

    function register(tpl) {
        TEMPLATES[tpl.id] = tpl;
    }

    function get(id) {
        return TEMPLATES[id] || null;
    }

    function getAll() {
        var list = [];
        for (var id in TEMPLATES) list.push(TEMPLATES[id]);
        return list;
    }

    // Normalizes whatever media source is available (EP.Media.getAll() slots,
    // or a plain array of {type, url}) into a flat list of {type, url}.
    function normalizeMedia(mediaList) {
        var out = [];
        (mediaList || []).forEach(function(m) {
            if (!m) return;
            var url = m.url;
            if (!url && m.element) {
                url = m.element.currentSrc || m.element.src || '';
            }
            if (!url) return;
            out.push({ type: m.type || 'image', url: url, name: m.name || '' });
        });
        return out;
    }

    // Cycles through available media to fill `count` slots, repeating if needed.
    function fillMedia(mediaList, count) {
        var norm = normalizeMedia(mediaList);
        if (norm.length === 0) return [];
        var out = [];
        for (var i = 0; i < count; i++) out.push(norm[i % norm.length]);
        return out;
    }

    // Builds a complete standalone HTML document string for a template —
    // this is exactly what gets downloaded / copy-pasted into the client site.
    function buildDocument(id, mediaList, opts) {
        var tpl = TEMPLATES[id];
        if (!tpl) return null;
        return tpl.build(mediaList || [], opts || {});
    }

    return {
        register: register,
        get: get,
        getAll: getAll,
        normalizeMedia: normalizeMedia,
        fillMedia: fillMedia,
        buildDocument: buildDocument
    };
})();
