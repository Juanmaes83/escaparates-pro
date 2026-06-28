EP.Registry = (function() {
    var effects = {};
    var categories = [
        { id: '3d-perspective', name: '3D & Perspective', icon: '🎲' },
        { id: 'carousel-flow', name: 'Carousel & Flow', icon: '🎠' },
        { id: 'grid', name: 'Grid', icon: '⊞' },
        { id: 'stack-scatter', name: 'Stack & Scatter', icon: '🃏' },
        { id: 'spotlight-focus', name: 'Spotlight & Focus', icon: '🔦' },
        { id: 'reveal-wipe', name: 'Reveal & Wipe', icon: '✨' },
        { id: 'glassmorphism', name: 'Glassmorphism', icon: '💎' },
        { id: 'parallax', name: 'Parallax', icon: '🏔️' },
        { id: 'motion', name: 'Motion', icon: '☁️' }
    ];

    function register(effect) {
        effects[effect.id] = effect;
    }

    function get(id) {
        return effects[id] || null;
    }

    function getAll() {
        return effects;
    }

    function getByCategory(catId) {
        var result = [];
        for (var id in effects) {
            if (effects[id].meta.category === catId) result.push(effects[id]);
        }
        return result;
    }

    function getCategories() {
        return categories;
    }

    function search(query) {
        query = query.toLowerCase();
        var result = [];
        for (var id in effects) {
            var e = effects[id];
            if (e.meta.name.toLowerCase().indexOf(query) !== -1 ||
                e.meta.description.toLowerCase().indexOf(query) !== -1) {
                result.push(e);
            }
        }
        return result;
    }

    return {
        register: register,
        get: get,
        getAll: getAll,
        getByCategory: getByCategory,
        getCategories: getCategories,
        search: search
    };
})();
