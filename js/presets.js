EP.Presets = (function() {
    var KEY = 'ep_presets_v1';

    function getAll() {
        try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
        catch(e) { return []; }
    }

    function save(name, effectId, settings, meta) {
        var all = getAll();
        var p = {
            id: 'p_' + Date.now(),
            name: name,
            effectId: effectId,
            settings: JSON.parse(JSON.stringify(settings || {})),
            meta: meta || {},
            savedAt: Date.now()
        };
        all.unshift(p);
        if (all.length > 50) all.length = 50;
        localStorage.setItem(KEY, JSON.stringify(all));
        return p;
    }

    function remove(id) {
        var all = getAll().filter(function(p) { return p.id !== id; });
        localStorage.setItem(KEY, JSON.stringify(all));
    }

    function get(id) {
        var all = getAll();
        for (var i = 0; i < all.length; i++) {
            if (all[i].id === id) return all[i];
        }
        return null;
    }

    return { getAll: getAll, save: save, remove: remove, get: get };
})();
