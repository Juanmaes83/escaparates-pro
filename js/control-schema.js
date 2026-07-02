EP.ControlSchema = (function() {
    var DEFAULTS = {
        range: { min: 0, max: 100, step: 1 },
        text: { maxLength: 120 },
        color: { default: '#000000' }
    };

    function normalizeControl(ctrl) {
        ctrl = Object.assign({}, ctrl || {});
        if (!ctrl.key) return ctrl;

        if (ctrl.type === 'range') {
            var rangeDefaults = DEFAULTS.range;
            ctrl.min = toFiniteNumber(ctrl.min, rangeDefaults.min);
            ctrl.max = toFiniteNumber(ctrl.max, rangeDefaults.max);
            if (ctrl.max < ctrl.min) {
                var tmp = ctrl.max;
                ctrl.max = ctrl.min;
                ctrl.min = tmp;
            }
            ctrl.step = toFiniteNumber(ctrl.step, rangeDefaults.step);
            if (ctrl.step <= 0) ctrl.step = rangeDefaults.step;
            ctrl.default = clamp(toFiniteNumber(ctrl.default, ctrl.min), ctrl.min, ctrl.max);
        } else if (ctrl.type === 'select' && Array.isArray(ctrl.options) && ctrl.options.length) {
            var values = ctrl.options.map(function(o) { return o.v; });
            if (values.indexOf(ctrl.default) === -1) ctrl.default = values[0];
        } else if (ctrl.type === 'color') {
            ctrl.default = normalizeColor(ctrl.default || DEFAULTS.color.default, DEFAULTS.color.default);
        } else if (ctrl.type === 'text') {
            ctrl.maxLength = Math.max(1, Math.floor(toFiniteNumber(ctrl.maxLength, DEFAULTS.text.maxLength)));
            ctrl.default = String(ctrl.default || '').slice(0, ctrl.maxLength);
        }

        return ctrl;
    }

    function normalizeControls(controls) {
        return (controls || []).map(normalizeControl);
    }

    function validateValue(effect, key, value) {
        var ctrl = findControl(effect, key);
        if (!ctrl) return value;
        ctrl = normalizeControl(ctrl);

        if (ctrl.type === 'range') {
            var num = toFiniteNumber(value, ctrl.default);
            num = clamp(num, ctrl.min, getEffectiveMax(effect, ctrl));
            if (ctrl.step > 0) {
                var steps = Math.round((num - ctrl.min) / ctrl.step);
                num = ctrl.min + steps * ctrl.step;
            }
            return Number(num.toFixed(6));
        }

        if (ctrl.type === 'select') {
            var opts = Array.isArray(ctrl.options) ? ctrl.options.map(function(o) { return o.v; }) : [];
            return opts.indexOf(value) !== -1 ? value : ctrl.default;
        }

        if (ctrl.type === 'color') {
            return normalizeColor(value, ctrl.default);
        }

        if (ctrl.type === 'text') {
            return String(value || '').slice(0, ctrl.maxLength || DEFAULTS.text.maxLength);
        }

        if (ctrl.type === 'easing') {
            return Array.isArray(ctrl.options) && ctrl.options.indexOf(value) !== -1 ? value : ctrl.default;
        }

        if (ctrl.type === 'aspect') {
            return Array.isArray(ctrl.options) && ctrl.options.indexOf(value) !== -1 ? value : ctrl.default;
        }

        return value;
    }

    function validateSettings(effect, settings) {
        var clean = {};
        var source = settings || {};
        (effect.controlsDef || []).forEach(function(ctrl) {
            clean[ctrl.key] = validateValue(effect, ctrl.key, source[ctrl.key] !== undefined ? source[ctrl.key] : ctrl.default);
        });
        return applyCrossFieldRules(effect, clean);
    }

    function applyCrossFieldRules(effect, settings) {
        var loopDuration = EP.Timeline ? EP.Timeline.loopDuration : 12;
        Object.keys(settings).forEach(function(key) {
            if (/stagger|delay/i.test(key) && typeof settings[key] === 'number') {
                settings[key] = Math.min(settings[key], Math.max(0, loopDuration * 0.95));
            }
            if (/count|segments|density|particles/i.test(key) && typeof settings[key] === 'number' && isMobileViewport()) {
                settings[key] = Math.min(settings[key], 250);
            }
        });

        if (settings.outputSize !== undefined && effect && effect.capabilities && effect.capabilities.mobileRisk === 'high' && isMobileViewport()) {
            settings.outputSize = Math.min(settings.outputSize, 400);
        }

        return settings;
    }

    function getEffectiveMax(effect, ctrl) {
        if (!effect || !effect.capabilities) return ctrl.max;
        if (ctrl.key === 'outputSize' && effect.capabilities.mobileRisk === 'high' && isMobileViewport()) {
            return Math.min(ctrl.max, 400);
        }
        return ctrl.max;
    }

    function findControl(effect, key) {
        var controls = effect && effect.controlsDef ? effect.controlsDef : [];
        for (var i = 0; i < controls.length; i++) {
            if (controls[i].key === key) return controls[i];
        }
        return null;
    }

    function toFiniteNumber(value, fallback) {
        var num = typeof value === 'number' ? value : parseFloat(value);
        return isFinite(num) ? num : fallback;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function normalizeColor(value, fallback) {
        if (typeof value !== 'string') return fallback;
        return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
    }

    function isMobileViewport() {
        return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    }

    return {
        normalizeControl: normalizeControl,
        normalizeControls: normalizeControls,
        validateValue: validateValue,
        validateSettings: validateSettings
    };
})();
