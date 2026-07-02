EP.PerformancePath = (function() {
    var enabled = false;
    var captureMode = false;
    var target = 'group';
    var strength = 100;
    var points = [];
    var canvasBound = false;
    var panelEls = {};

    function init() {
        panelEls.enabled = document.getElementById('path-enabled');
        panelEls.target = document.getElementById('path-target');
        panelEls.strength = document.getElementById('path-strength');
        panelEls.strengthVal = document.getElementById('path-strength-val');
        panelEls.capture = document.getElementById('path-capture');
        panelEls.clear = document.getElementById('path-clear');
        panelEls.count = document.getElementById('path-count');
        if (!panelEls.enabled) return;

        panelEls.enabled.addEventListener('change', function() {
            enabled = this.checked;
            syncUI();
        });
        panelEls.target.addEventListener('change', function() {
            target = this.value;
            resetBases();
        });
        panelEls.strength.addEventListener('input', function() {
            strength = parseFloat(this.value) || 0;
            panelEls.strengthVal.textContent = strength + '%';
        });
        panelEls.capture.addEventListener('click', function() {
            captureMode = !captureMode;
            syncUI();
        });
        panelEls.clear.addEventListener('click', function() {
            points = [];
            resetBases();
            syncUI();
            if (EP.UI) EP.UI.toast('Recorrido borrado');
        });

        bindCanvas();
        syncUI();
    }

    function bindCanvas() {
        if (canvasBound || !EP.Core || !EP.Core.renderer) return;
        var canvas = EP.Core.renderer.domElement;
        if (!canvas) return;
        canvas.addEventListener('click', function(e) {
            if (!captureMode) return;
            addPointFromEvent(e, canvas);
        });
        canvasBound = true;
    }

    function addPointFromEvent(e, canvas) {
        var rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        var y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        var t = EP.Timeline ? EP.Timeline.currentTime : 0;
        points.push({ t: round(t), x: round(x), y: round(y) });
        points.sort(function(a, b) { return a.t - b.t; });
        enabled = true;
        resetBases();
        syncUI();
        if (EP.UI) EP.UI.toast('Punto de recorrido: ' + points.length);
    }

    function apply(effect, time, dt, loopDuration) {
        if (!enabled || points.length < 2 || !effect) return;
        var sample = samplePath(time, loopDuration || 12);
        if (!sample) return;
        var amount = Math.max(0, strength) / 100;

        if (target === 'camera') {
            applyCamera(sample, amount);
        } else if (effect.group) {
            if (!effect.group.userData.performancePathBase) {
                effect.group.userData.performancePathBase = effect.group.position.clone();
            }
            var base = effect.group.userData.performancePathBase;
            effect.group.position.set(base.x + sample.x * 2.4 * amount, base.y + sample.y * 1.35 * amount, base.z);
        }

        if (typeof effect.applyPerformancePath === 'function') {
            effect.applyPerformancePath(sample, amount, time, dt, loopDuration);
        }
    }

    function applyCamera(sample, amount) {
        if (!EP.Core || !EP.Core.camera) return;
        var camera = EP.Core.camera;
        if (!camera.userData.performancePathBase) {
            camera.userData.performancePathBase = camera.position.clone();
        }
        var base = camera.userData.performancePathBase;
        camera.position.set(base.x + sample.x * 1.8 * amount, base.y + sample.y * 1.15 * amount, base.z);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }

    function samplePath(time, loopDuration) {
        if (points.length < 2) return null;
        loopDuration = Math.max(0.1, loopDuration || 12);
        var t = ((time % loopDuration) + loopDuration) % loopDuration;
        var list = points.slice().sort(function(a, b) { return a.t - b.t; });
        var prev = list[list.length - 1];
        var next = list[0];

        for (var i = 0; i < list.length; i++) {
            if (list[i].t <= t) prev = list[i];
            if (list[i].t > t) {
                next = list[i];
                break;
            }
        }

        var start = prev.t;
        var end = next.t;
        var localT = t;
        if (end <= start) end += loopDuration;
        if (localT < start) localT += loopDuration;
        var pct = smooth((localT - start) / Math.max(0.001, end - start));
        return {
            x: lerp(prev.x, next.x, pct),
            y: lerp(prev.y, next.y, pct),
            progress: pct,
            from: prev,
            to: next
        };
    }

    function resetBases() {
        var effect = EP.UI && EP.UI.getCurrentEffect ? EP.UI.getCurrentEffect() : null;
        if (effect && effect.group && effect.group.userData) delete effect.group.userData.performancePathBase;
        if (EP.Core && EP.Core.camera && EP.Core.camera.userData) delete EP.Core.camera.userData.performancePathBase;
    }

    function syncUI() {
        if (panelEls.enabled) panelEls.enabled.checked = enabled;
        if (panelEls.capture) {
            panelEls.capture.classList.toggle('active', captureMode);
            panelEls.capture.textContent = captureMode ? 'Punteando...' : 'Puntear recorrido';
        }
        if (panelEls.count) panelEls.count.textContent = points.length + ' puntos';
    }

    function getExportState() {
        return { enabled: enabled, target: target, strength: strength, points: points.slice() };
    }

    function importState(state) {
        state = state || {};
        enabled = !!state.enabled;
        target = state.target || 'group';
        strength = isFinite(parseFloat(state.strength)) ? parseFloat(state.strength) : 100;
        points = Array.isArray(state.points) ? state.points.map(function(p) {
            return { t: parseFloat(p.t) || 0, x: parseFloat(p.x) || 0, y: parseFloat(p.y) || 0 };
        }) : [];
        resetBases();
        syncUI();
    }

    function smooth(t) {
        t = Math.max(0, Math.min(1, t));
        return t * t * (3 - 2 * t);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function round(value) {
        return Number((value || 0).toFixed(4));
    }

    return {
        init: init,
        apply: apply,
        sample: samplePath,
        getExportState: getExportState,
        importState: importState,
        resetBases: resetBases
    };
})();
