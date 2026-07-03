// Audio Visualizer Rings — adapted from the CodePen gist "Audio Visualizer with
// Three.js" (GSAP/inertia Challenge #2). Source read & understood: the demo's
// `drawCircularVisualizer()` renders 3 concentric rings on a Canvas2D, each ring
// sampling a different frequency band from a Web Audio AnalyserNode, radius
// modulated by the band's average magnitude, filled with radial gradients.
// Here that exact ring technique is reused, wired to the platform's own
// EP.Audio module (Reactivo / BPM Sync mode) instead of a bespoke audio loader
// — falls back to an animated demo waveform when no audio is active.
(function() {
    var effect = new EP.EffectBase('audio-visualizer-rings', {
        name: 'Audio Visualizer Rings',
        category: 'motion',
        icon: '🎧',
        description: 'Anillos concéntricos que reaccionan a las bandas de frecuencia del audio (modo Reactivo/BPM Sync) — cada anillo responde a graves, medios o agudos, con degradado de color e imagen/video del cliente legible detrás'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'sensitivity', type: 'range', min: 20, max: 300, default: 130, step: 10, label: 'Sensibilidad', unit: '%' },
        { key: 'ringColor1', type: 'color', default: '#ff4e42', label: 'Color anillo graves' },
        { key: 'ringColor2', type: 'color', default: '#42c8ff', label: 'Color anillo medios' },
        { key: 'ringColor3', type: 'color', default: '#ffd166', label: 'Color anillo agudos' },
        { key: 'bgOverlay', type: 'range', min: 0, max: 90, default: 55, step: 5, label: 'Oscurecer fondo', unit: '%' },
        { key: 'rotSpeed', type: 'range', min: 0, max: 100, default: 20, step: 5, label: 'Rotación lenta', unit: '%' }
    ]);

    function hexToRgb(hex) {
        var v = parseInt(hex.replace('#', ''), 16);
        return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._m0 = (mediaList && mediaList[0]) || null;
        this._bgMat = null;
        if (this._m0) {
            var bgMat = EP.Media.createMaterial(this._m0);
            var bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), bgMat);
            bgMesh.position.z = -0.1;
            group.add(bgMesh);
            this._bgMat = bgMat;
            var ovMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false });
            var ovMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), ovMat);
            ovMesh.position.z = -0.05;
            group.add(ovMesh);
            this._overlayMat = ovMat;
        }

        this._cvs = document.createElement('canvas');
        this._cvs.width = 640; this._cvs.height = 640;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(4.5, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.1;
        group.add(mesh);

        this._freqCache = new Uint8Array(256);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;

        var W = this._cvs.width, H = this._cvs.height;
        var ctx = this._ctx;
        var cx = W / 2, cy = H / 2;
        var sens = this.settings.sensitivity / 100;
        var baseRadius = Math.min(W, H) * 0.28;
        var numPoints = 140;
        var numRings = 3;
        var colors = [this.settings.ringColor1, this.settings.ringColor2, this.settings.ringColor3];

        var freq = (EP.Audio && EP.Audio.isActive && EP.Audio.isActive() && EP.Audio.getFrequencyData)
            ? EP.Audio.getFrequencyData() : null;
        var binCount = freq ? freq.length : 256;

        if (!freq) {
            // Demo: synthetic animated spectrum so the effect always looks alive
            var demo = this._freqCache;
            for (var i = 0; i < 256; i++) {
                var band = i / 256;
                var wave = Math.sin(time * 2.2 + band * 14) * 0.5 + 0.5;
                var envelope = Math.pow(1 - band, 1.4);
                demo[i] = Math.max(0, Math.min(255, (wave * envelope * 200 + Math.sin(time * 5 + i) * 15)));
            }
            freq = demo;
        }

        ctx.clearRect(0, 0, W, H);

        for (var ring = 0; ring < numRings; ring++) {
            var ringRadius = baseRadius * (1 + ring * 0.42);
            var opacity = 0.85 - ring * 0.18;
            var freqStart = Math.floor((ring * binCount) / (numRings * 1.5));
            var freqEnd = Math.floor(((ring + 1) * binCount) / (numRings * 1.5));
            var freqRange = Math.max(1, freqEnd - freqStart);
            var segmentSize = Math.max(1, Math.floor(freqRange / numPoints));

            ctx.beginPath();
            for (var p = 0; p < numPoints; p++) {
                var sum = 0;
                for (var s = 0; s < segmentSize; s++) {
                    var idx = freqStart + ((p * segmentSize + s) % freqRange);
                    sum += freq[idx];
                }
                var value = sum / (segmentSize * 255);
                var adjusted = value * sens;
                var dynR = ringRadius * (1 + adjusted * 0.6);
                var angle = (p / numPoints) * Math.PI * 2 + (ring % 2 === 0 ? 1 : -1) * time * (this.settings.rotSpeed / 100) * 0.3;
                var x = cx + Math.cos(angle) * dynR;
                var y = cy + Math.sin(angle) * dynR;
                if (p === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();

            var rgb = hexToRgb(colors[ring]);
            var grad = ctx.createRadialGradient(cx, cy, ringRadius * 0.85, cx, cy, ringRadius * 1.15);
            grad.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
            grad.addColorStop(0.5, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + opacity + ')');
            grad.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
            ctx.lineWidth = W * 0.03;
            ctx.strokeStyle = grad;
            ctx.stroke();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(255,255,255,' + (opacity * 0.35) + ')';
            ctx.stroke();
        }

        // Center pulse dot
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();

        this._tex.needsUpdate = true;

        if (this._overlayMat) this._overlayMat.opacity = this.settings.bgOverlay / 100;
    };

    effect.dispose = function() {
        this._cvs = null; this._ctx = null; this._tex = null;
        this._bgMat = null; this._overlayMat = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
