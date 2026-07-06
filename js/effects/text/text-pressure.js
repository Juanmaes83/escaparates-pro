(function() {
    var effect = new EP.EffectBase('text-pressure', {
        name: 'Text Pressure',
        category: 'text',
        icon: '💪',
        description: 'Presión tipográfica — caracteres se escalan y deforman por proximidad al cursor, máxima fidelidad al react-bits TextPressure'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'text', type: 'text', default: 'ESCAPARATES PRO', label: 'Texto' },
        { key: 'baseFontSize', type: 'range', min: 20, max: 120, default: 64, step: 2, label: 'Tamaño base', unit: 'px' },
        { key: 'maxScale', type: 'range', min: 1.2, max: 4, default: 2.5, step: 0.1, label: 'Escala máxima presión' },
        { key: 'pressureRadius', type: 'range', min: 30, max: 250, default: 100, step: 10, label: 'Radio de influencia', unit: 'px' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Color texto' },
        { key: 'pressureColor', type: 'color', default: '#ff4488', label: 'Color bajo presión' },
        { key: 'bgColor', type: 'color', default: '#08080f', label: 'Color fondo' },
        { key: 'fontStyle', type: 'select', options: [
            { v: 'bold', l: 'Bold' },
            { v: 'normal', l: 'Regular' },
            { v: 'italic', l: 'Italic' },
            { v: 'bold italic', l: 'Bold Italic' }
        ], default: 'bold', label: 'Estilo fuente' },
        { key: 'autoOrbit', type: 'select', options: [
            { v: 'on', l: 'Auto-orbita (demo)' },
            { v: 'off', l: 'Solo cursor' }
        ], default: 'on', label: 'Modo demo' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (mediaList && mediaList.length > 0) {
            var bgGeo = new THREE.PlaneGeometry(8, 4.5);
            var bgMat = EP.Media.createMaterial(mediaList[0]);
            var bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -0.05;
            group.add(bgMesh);
        }
        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._ctx.fillStyle = '#08080f';
        this._ctx.fillRect(0, 0, 1024, 576);
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);

        this._mouseX = 512; this._mouseY = 288;
        var self = this;
        this._onMouseMove = function(e) {
            var canvas = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            // Map to canvas coords
            self._mouseX = ((e.clientX - rect.left) / rect.width) * 1024;
            self._mouseY = ((e.clientY - rect.top) / rect.height) * 576;
        };
        window.addEventListener('mousemove', this._onMouseMove);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var txt = (this.settings.text || 'PRESSURE').toUpperCase();
        var baseFs = this.settings.baseFontSize;
        var maxSc = this.settings.maxScale;
        var radius = this.settings.pressureRadius;
        var textC = this.settings.textColor || '#ffffff';
        var pressC = this.settings.pressureColor || '#ff4488';
        var bgC = this.settings.bgColor || '#08080f';
        var fontStyle = this.settings.fontStyle || 'bold';
        var autoOrbit = this.settings.autoOrbit === 'on';

        var tr = parseInt(textC.slice(1,3),16), tg = parseInt(textC.slice(3,5),16), tb = parseInt(textC.slice(5,7),16);
        var pr = parseInt(pressC.slice(1,3),16), pg = parseInt(pressC.slice(3,5),16), pb = parseInt(pressC.slice(5,7),16);

        // Cursor position (auto-orbit or real)
        var mx, my;
        if (autoOrbit) {
            mx = W/2 + Math.cos(time * 0.8) * W * 0.38;
            my = H/2 + Math.sin(time * 0.6) * H * 0.3;
        } else {
            mx = this._mouseX; my = this._mouseY;
        }

        ctx.fillStyle = bgC;
        ctx.fillRect(0, 0, W, H);

        // Measure each character at base size
        ctx.font = fontStyle + ' ' + baseFs + 'px "Arial", sans-serif';
        ctx.textBaseline = 'alphabetic';

        var chars = txt.split('');
        var charWidths = [];
        var totalWidthBase = 0;
        for (var i = 0; i < chars.length; i++) {
            var w = ctx.measureText(chars[i]).width;
            charWidths.push(w);
            totalWidthBase += w;
        }

        // First pass: calculate scales based on mouse proximity (using base positions)
        // Pre-layout with base widths to get approximate center positions
        var approxX = (W - totalWidthBase) / 2;
        var scales = [];
        var pressures = [];
        for (var i = 0; i < chars.length; i++) {
            var cx = approxX + charWidths[i] * 0.5;
            var cy = H * 0.5;
            var dist = Math.sqrt((cx - mx) * (cx - mx) + (cy - my) * (cy - my));
            var p = Math.max(0, 1 - dist / radius);
            p = p * p; // quadratic falloff
            pressures.push(p);
            scales.push(1 + (maxSc - 1) * p);
            approxX += charWidths[i];
        }

        // Second pass: real layout with scaled widths
        var scaledWidths = [];
        var totalScaledW = 0;
        for (var i = 0; i < chars.length; i++) {
            var sw = charWidths[i] * scales[i];
            scaledWidths.push(sw);
            totalScaledW += sw;
        }

        var startX = (W - totalScaledW) / 2;
        var baselineY = H / 2 + baseFs * 0.35;

        // Draw each character
        for (var i = 0; i < chars.length; i++) {
            var sc = scales[i];
            var pr2 = pressures[i];
            var fs = baseFs * sc;

            // Interpolate color
            var r = Math.round(tr + (pr - tr) * pr2);
            var g2 = Math.round(tg + (pg - tg) * pr2);
            var b = Math.round(tb + (pb - tb) * pr2);

            ctx.save();
            ctx.font = fontStyle + ' ' + fs + 'px "Arial", sans-serif';
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';

            // Glow for pressed chars
            if (pr2 > 0.1) {
                ctx.shadowColor = 'rgba(' + pr + ',' + pg + ',' + pb + ',' + pr2 + ')';
                ctx.shadowBlur = fs * 0.3 * pr2;
            }

            ctx.fillStyle = 'rgb(' + r + ',' + g2 + ',' + b + ')';
            // Center char horizontally in its slot
            var charX = startX + (scaledWidths[i] - ctx.measureText(chars[i]).width) / 2;
            // Lift/press vertically based on pressure
            var liftY = baselineY - pr2 * fs * 0.15;
            ctx.fillText(chars[i], charX, liftY);

            ctx.shadowBlur = 0;
            ctx.restore();

            startX += scaledWidths[i];
        }

        // Cursor indicator
        if (autoOrbit) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(mx, my, radius, 0, Math.PI*2);
            ctx.strokeStyle = 'rgba(' + pr + ',' + pg + ',' + pb + ',0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._onMouseMove) { window.removeEventListener('mousemove', this._onMouseMove); this._onMouseMove = null; }
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
