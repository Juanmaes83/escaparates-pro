(function() {
    var effect = new EP.EffectBase('audio-eq', {
        name: 'Audio EQ Visualizer',
        category: 'motion',
        icon: '🎵',
        description: 'Visualizador de espectro de audio en tiempo real — 32 bandas EQ reactivas a música'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'bands', type: 'range', min: 8, max: 64, default: 32, step: 8, label: 'Bandas EQ' },
        { key: 'barColor1', type: 'color', default: '#00ffcc', label: 'Color bajo' },
        { key: 'barColor2', type: 'color', default: '#ff0055', label: 'Color alto' },
        { key: 'bgColor', type: 'color', default: '#000000', label: 'Color fondo' },
        { key: 'sensitivity', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Sensibilidad' },
        { key: 'smoothing', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Suavizado' },
        { key: 'mirrorMode', type: 'select', options: [{ v: 'on', l: 'Espejo' }, { v: 'off', l: 'Normal' }], default: 'on', label: 'Modo espejo' },
        { key: 'showMic', type: 'select', options: [{ v: 'off', l: 'Demo (sin mic)' }, { v: 'on', l: 'Micrófono' }], default: 'off', label: 'Fuente audio' }
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
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);

        // Simulated frequency data
        this._freqData = new Float32Array(64);
        this._smoothed = new Float32Array(64);

        // Web Audio setup (optional, mic)
        this._analyser = null;
        this._rawData = null;
        if (this.settings.showMic === 'on') {
            var self = this;
            try {
                navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
                    var ac = new (window.AudioContext || window.webkitAudioContext)();
                    var src = ac.createMediaStreamSource(stream);
                    var an = ac.createAnalyser();
                    an.fftSize = 128;
                    an.smoothingTimeConstant = 0.8;
                    src.connect(an);
                    self._analyser = an;
                    self._rawData = new Uint8Array(an.frequencyBinCount);
                    self._stream = stream;
                    self._ac = ac;
                }).catch(function() {});
            } catch(e) {}
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var bands = Math.round(this.settings.bands);
        var c1 = this.settings.barColor1 || '#00ffcc';
        var c2 = this.settings.barColor2 || '#ff0055';
        var bgC = this.settings.bgColor || '#000000';
        var sens = this.settings.sensitivity * 0.1;
        var sm = this.settings.smoothing * 0.04;
        var mirror = this.settings.mirrorMode === 'on';
        var r1=parseInt(c1.slice(1,3),16), g1=parseInt(c1.slice(3,5),16), b1=parseInt(c1.slice(5,7),16);
        var r2=parseInt(c2.slice(1,3),16), g2=parseInt(c2.slice(3,5),16), b2=parseInt(c2.slice(5,7),16);

        // Get or simulate frequency data
        if (this._analyser && this._rawData) {
            this._analyser.getByteFrequencyData(this._rawData);
            for (var i = 0; i < bands; i++) {
                var rIdx = Math.floor(i * this._rawData.length / bands);
                this._freqData[i] = this._rawData[rIdx] / 255;
            }
        } else {
            // Procedural simulation: bass + mid + treble with time variation
            for (var i = 0; i < bands; i++) {
                var t = i / bands;
                var bass = Math.pow(Math.max(0, Math.sin(time * 2.1 + i * 0.3)), 2) * (1 - t * 0.7);
                var mid = Math.abs(Math.sin(time * 3.7 + i * 0.7 + 1.2)) * 0.5 * (0.2 + t * 0.6);
                var treble = Math.random() * 0.3 * t * Math.abs(Math.sin(time * 8 + i));
                this._freqData[i] = Math.min(1, (bass + mid + treble) * sens);
            }
        }

        // Smooth
        for (var i = 0; i < bands; i++) {
            this._smoothed[i] = this._smoothed[i] * sm + this._freqData[i] * (1 - sm);
        }

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bgC;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;

        var barW = (mirror ? W / 2 : W) / bands;
        var maxBarH = H * 0.85;
        var baseY = H * 0.92;

        for (var i = 0; i < bands; i++) {
            var val = this._smoothed[i];
            var barH = val * maxBarH;
            var t = i / (bands - 1);
            var r = Math.round(r1 + (r2 - r1) * t);
            var g = Math.round(g1 + (g2 - g1) * t);
            var b = Math.round(b1 + (b2 - b1) * t);

            // Gradient per bar
            var grd = ctx.createLinearGradient(0, baseY - barH, 0, baseY);
            grd.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',1)');
            grd.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0.3)');
            ctx.fillStyle = grd;

            var pad = Math.max(1, barW * 0.1);
            if (mirror) {
                // Left half (mirrored, bands reversed)
                var li = bands - 1 - i;
                ctx.fillRect(li * barW + pad, baseY - barH, barW - pad * 2, barH);
                // Right half (normal)
                ctx.fillRect(W / 2 + i * barW + pad, baseY - barH, barW - pad * 2, barH);
            } else {
                ctx.fillRect(i * barW + pad, baseY - barH, barW - pad * 2, barH);
            }

            // Peak dot
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            var px = mirror ? (W / 2 + i * barW + pad) : (i * barW + pad);
            ctx.fillRect(px, baseY - barH - 3, barW - pad * 2, 3);
            if (mirror) ctx.fillRect((bands - 1 - i) * barW + pad, baseY - barH - 3, barW - pad * 2, 3);
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._stream) {
            this._stream.getTracks().forEach(function(t){ t.stop(); });
            this._stream = null;
        }
        if (this._ac) { try { this._ac.close(); } catch(e) {} this._ac = null; }
        this._analyser = null;
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
