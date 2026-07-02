EP.VisualPipeline = (function() {
    var state = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        grayscale: false,
        sepia: false,
        glowEnabled: false,
        glowStrength: 6,
        compareActive: false
    };

    function getCanvas() {
        return EP.Core && EP.Core.renderer ? EP.Core.renderer.domElement : null;
    }

    function buildFilter() {
        var parts = [];
        if (state.brightness !== 100) parts.push('brightness(' + (state.brightness / 100).toFixed(2) + ')');
        if (state.contrast !== 100) parts.push('contrast(' + (state.contrast / 100).toFixed(2) + ')');
        if (state.saturation !== 100) parts.push('saturate(' + (state.saturation / 100).toFixed(2) + ')');
        if (state.hue !== 0) parts.push('hue-rotate(' + state.hue + 'deg)');
        if (state.grayscale) parts.push('grayscale(1)');
        if (state.sepia) parts.push('sepia(0.7)');
        return parts.length ? parts.join(' ') : '';
    }

    function applyFilter() {
        var canvas = getCanvas();
        if (!canvas) return;
        canvas.style.filter = state.compareActive ? '' : buildFilter();
    }

    function setGlow() {
        if (typeof EP.Core.setPostProcessing === 'function') {
            EP.Core.setPostProcessing({
                bloomEnabled: state.glowEnabled,
                bloomStrength: state.glowStrength / 10,
                bloomRadius: 0.3,
                bloomThreshold: 0.65
            });
        }
    }

    function bindControls() {
        function bindRange(id, valId, key, unit) {
            var el = document.getElementById(id);
            var valEl = document.getElementById(valId);
            if (!el) return;
            el.value = state[key];
            if (valEl) valEl.textContent = state[key] + (unit || '');
            el.addEventListener('input', function() {
                state[key] = parseFloat(this.value);
                if (valEl) valEl.textContent = state[key] + (unit || '');
                applyFilter();
            });
        }

        function bindToggle(id, key, onAction) {
            var el = document.getElementById(id);
            if (!el) return;
            el.classList.toggle('vp-active', !!state[key]);
            el.addEventListener('click', function() {
                state[key] = !state[key];
                this.classList.toggle('vp-active', state[key]);
                if (onAction) onAction();
                else applyFilter();
            });
        }

        bindRange('vp-brightness', 'vp-brightness-val', 'brightness', '%');
        bindRange('vp-contrast', 'vp-contrast-val', 'contrast', '%');
        bindRange('vp-saturation', 'vp-saturation-val', 'saturation', '%');
        bindRange('vp-hue', 'vp-hue-val', 'hue', '°');

        bindToggle('vp-grayscale', 'grayscale');
        bindToggle('vp-sepia', 'sepia');

        // Glow toggle
        var glowBtn = document.getElementById('vp-glow');
        var glowRow = document.getElementById('vp-glow-strength-row');
        var glowStrEl = document.getElementById('vp-glow-strength');
        var glowValEl = document.getElementById('vp-glow-strength-val');
        if (glowBtn) {
            glowBtn.addEventListener('click', function() {
                state.glowEnabled = !state.glowEnabled;
                this.classList.toggle('vp-active', state.glowEnabled);
                if (glowRow) glowRow.style.display = state.glowEnabled ? '' : 'none';
                setGlow();
            });
        }
        if (glowStrEl) {
            glowStrEl.value = state.glowStrength;
            if (glowValEl) glowValEl.textContent = (state.glowStrength / 10).toFixed(1);
            glowStrEl.addEventListener('input', function() {
                state.glowStrength = parseFloat(this.value);
                if (glowValEl) glowValEl.textContent = (state.glowStrength / 10).toFixed(1);
                if (state.glowEnabled) setGlow();
            });
        }

        // Compare
        var compareBtn = document.getElementById('vp-compare');
        if (compareBtn) {
            compareBtn.addEventListener('click', function() {
                state.compareActive = !state.compareActive;
                this.classList.toggle('vp-active', state.compareActive);
                this.textContent = state.compareActive ? '👁 Original' : '👁 Compare';
                applyFilter();
            });
        }

        // Reset
        var resetBtn = document.getElementById('vp-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                state.brightness = 100;
                state.contrast = 100;
                state.saturation = 100;
                state.hue = 0;
                state.grayscale = false;
                state.sepia = false;
                state.glowEnabled = false;
                state.glowStrength = 6;
                state.compareActive = false;

                ['vp-brightness','vp-contrast','vp-saturation'].forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el) el.value = 100;
                });
                ['vp-brightness-val','vp-contrast-val','vp-saturation-val'].forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el) el.textContent = '100%';
                });
                var hueEl = document.getElementById('vp-hue');
                if (hueEl) hueEl.value = 0;
                var hueValEl = document.getElementById('vp-hue-val');
                if (hueValEl) hueValEl.textContent = '0°';
                if (glowStrEl) glowStrEl.value = 6;
                if (glowValEl) glowValEl.textContent = '0.6';
                if (glowRow) glowRow.style.display = 'none';

                ['vp-grayscale','vp-sepia','vp-glow'].forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el) el.classList.remove('vp-active');
                });

                if (compareBtn) {
                    compareBtn.classList.remove('vp-active');
                    compareBtn.textContent = '👁 Compare';
                }

                applyFilter();
                if (typeof EP.Core.setPostProcessing === 'function') {
                    EP.Core.setPostProcessing({ bloomEnabled: false });
                }
            });
        }
    }

    function init() {
        bindControls();
    }

    return {
        init: init,
        applyFilter: applyFilter,
        get state() { return state; }
    };
})();
