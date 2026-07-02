var EP = window.EP || {};
window.EP = EP;

EP.OutputPresets = (function() {
    var presets = [
        { id: 'web-hero-16-9', group: 'Web', label: 'Hero 16:9', ratio: 16 / 9, embedRatio: '16 / 9', exportWidth: 1920, exportHeight: 1080, loop: false },
        { id: 'web-hero-21-9', group: 'Web', label: 'Hero 21:9', ratio: 21 / 9, embedRatio: '21 / 9', exportWidth: 2560, exportHeight: 1097, loop: false },
        { id: 'web-full-width', group: 'Web', label: 'Full-width', ratio: 16 / 7, embedRatio: '16 / 7', exportWidth: 2560, exportHeight: 1120, loop: false },
        { id: 'web-section', group: 'Web', label: 'Seccion web', ratio: 4 / 3, embedRatio: '4 / 3', exportWidth: 1600, exportHeight: 1200, loop: false },
        { id: 'social-9-16', group: 'RRSS', label: 'Story/Reel 9:16', ratio: 9 / 16, embedRatio: '9 / 16', exportWidth: 1080, exportHeight: 1920, loop: true },
        { id: 'social-1-1', group: 'RRSS', label: 'Post 1:1', ratio: 1, embedRatio: '1 / 1', exportWidth: 1080, exportHeight: 1080, loop: true },
        { id: 'social-4-5', group: 'RRSS', label: 'Post 4:5', ratio: 4 / 5, embedRatio: '4 / 5', exportWidth: 1080, exportHeight: 1350, loop: true },
        { id: 'social-3-4', group: 'RRSS', label: 'Post 3:4', ratio: 3 / 4, embedRatio: '3 / 4', exportWidth: 1200, exportHeight: 1600, loop: true },
        { id: 'screen-16-9', group: 'Pantallas', label: 'Pantalla 16:9', ratio: 16 / 9, embedRatio: '16 / 9', exportWidth: 1920, exportHeight: 1080, loop: true },
        { id: 'screen-vertical', group: 'Pantallas', label: 'Vertical signage', ratio: 9 / 16, embedRatio: '9 / 16', exportWidth: 1080, exportHeight: 1920, loop: true },
        { id: 'screen-loop', group: 'Pantallas', label: 'Loop continuo', ratio: 16 / 9, embedRatio: '16 / 9', exportWidth: 1920, exportHeight: 1080, loop: true }
    ];
    var currentId = 'web-hero-16-9';

    function getAll() {
        return presets.slice();
    }

    function get(id) {
        return presets.find(function(preset) { return preset.id === id; }) || presets[0];
    }

    function getCurrent() {
        return get(currentId);
    }

    function setCurrent(id) {
        currentId = get(id).id;
        return getCurrent();
    }

    function apply(id) {
        var preset = setCurrent(id || currentId);
        if (EP.Core && EP.Core.setAspectRatio) EP.Core.setAspectRatio(preset.ratio);
        return preset;
    }

    function fromAspect(aspect) {
        var map = {
            '16:9': 'web-hero-16-9',
            '4:3': 'web-section',
            '1:1': 'social-1-1',
            '4:5': 'social-4-5',
            '3:4': 'social-3-4',
            '9:16': 'social-9-16',
            '21:9': 'web-hero-21-9'
        };
        return map[aspect] || currentId;
    }

    return {
        getAll: getAll,
        get: get,
        getCurrent: getCurrent,
        setCurrent: setCurrent,
        apply: apply,
        fromAspect: fromAspect
    };
})();
