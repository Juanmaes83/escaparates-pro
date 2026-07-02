(function() {
    var effect = new EP.EffectBase('retro-vhs', {
        name: 'Retro VHS',
        category: 'motion',
        icon: '📼',
        description: 'Efecto VHS retro — scanlines + noise + color bleed + tracking error'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'scanlines', type: 'range', min: 0, max: 100, default: 60, step: 5, label: 'Scanlines', unit: '%' },
        { key: 'noise', type: 'range', min: 0, max: 100, default: 40, step: 5, label: 'Ruido', unit: '%' },
        { key: 'colorBleed', type: 'range', min: 0, max: 20, default: 6, step: 1, label: 'Color bleed', unit: 'px' },
        { key: 'trackingError', type: 'range', min: 0, max: 100, default: 35, step: 5, label: 'Tracking error', unit: '%' },
        { key: 'tint', type: 'color', default: '#00ff44', label: 'Tinte VHS' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();

        this._cvs = document.createElement('canvas');
        this._cvs.width = 512; this._cvs.height = 288; // lower-res for VHS feel
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        this._tex.magFilter = THREE.NearestFilter; // pixelated VHS look

        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        group.add(new THREE.Mesh(geo, mat));

        // Cache media
        this._imgCvs = null;
        var m0 = mediaList && mediaList[0];
        var el0 = m0 && (m0.element || (m0.texture && m0.texture.image));
        if (el0) {
            var oc = document.createElement('canvas');
            oc.width = 512; oc.height = 288;
            try { oc.getContext('2d').drawImage(el0, 0, 0, 512, 288); this._imgCvs = oc; } catch(e) {}
        }

        this._frame = 0;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx;
        var W = this._cvs.width; var H = this._cvs.height;
        this._frame++;

        ctx.clearRect(0, 0, W, H);

        // Base image or fallback
        if (this._imgCvs) {
            ctx.drawImage(this._imgCvs, 0, 0, W, H);
        } else {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#44ff44';
            ctx.font = 'bold 28px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VHS MODE', W / 2, H / 2);
        }

        // Color bleed (RGB offset)
        var bleed = Math.round(this.settings.colorBleed);
        if (bleed > 0 && this._imgCvs) {
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.25;
            ctx.drawImage(this._imgCvs, bleed, 0, W, H);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }

        // Tracking error — horizontal jitter on random strip
        var te = this.settings.trackingError / 100;
        if (te > 0.05 && Math.random() < te * 0.3) {
            var stripY = Math.random() * H;
            var stripH = 4 + Math.random() * 12;
            var jitter = (Math.random() - 0.5) * W * te * 0.3;
            var imgData = ctx.getImageData(0, Math.floor(stripY), W, Math.ceil(stripH));
            ctx.putImageData(imgData, Math.round(jitter), Math.floor(stripY));
        }

        // Scanlines
        var sl = this.settings.scanlines / 100;
        if (sl > 0) {
            ctx.fillStyle = 'rgba(0,0,0,' + (sl * 0.55) + ')';
            for (var y = 0; y < H; y += 2) {
                ctx.fillRect(0, y, W, 1);
            }
        }

        // Noise grain
        var noiseAmt = this.settings.noise / 100;
        if (noiseAmt > 0) {
            var imageData = ctx.getImageData(0, 0, W, H);
            var data = imageData.data;
            var step = Math.max(1, Math.round(4 / noiseAmt)); // sparse for perf
            for (var i = 0; i < data.length; i += 4 * step) {
                var n = (Math.random() - 0.5) * 255 * noiseAmt * 0.5;
                data[i] = Math.min(255, Math.max(0, data[i] + n));
                data[i+1] = Math.min(255, Math.max(0, data[i+1] + n));
                data[i+2] = Math.min(255, Math.max(0, data[i+2] + n));
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // VHS tint overlay
        var tintHex = this.settings.tint || '#00ff44';
        var tr = parseInt(tintHex.slice(1,3),16);
        var tg = parseInt(tintHex.slice(3,5),16);
        var tb = parseInt(tintHex.slice(5,7),16);
        ctx.fillStyle = 'rgba(' + tr + ',' + tg + ',' + tb + ',0.06)';
        ctx.fillRect(0, 0, W, H);

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null;
    };

    EP.Registry.register(effect);
})();
