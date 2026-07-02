(function() {
    var effect = new EP.EffectBase('gravity-wave', {
        name: 'Gravity Wave',
        category: 'gravity',
        icon: '🌊',
        description: 'Imagen que ondula como una ola gravitacional — distorsión de malla'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'waveAmp', type: 'range', min: 5, max: 80, default: 30, step: 1, label: 'Amplitud ola', unit: 'px' },
        { key: 'waveFreq', type: 'range', min: 1, max: 10, default: 3, step: 1, label: 'Frecuencia' },
        { key: 'waveSpeed', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Velocidad ola' },
        { key: 'direction', type: 'select', options: [{ v: 'horizontal', l: 'Horizontal' }, { v: 'vertical', l: 'Vertical' }, { v: 'radial', l: 'Radial' }], default: 'horizontal', label: 'Dirección' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();

        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);

        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        group.add(new THREE.Mesh(geo, mat));

        this._imgCvs = null;
        var m0 = mediaList && mediaList[0];
        var el0 = m0 && (m0.element || (m0.texture && m0.texture.image));
        if (el0) {
            var oc = document.createElement('canvas');
            oc.width = 1024; oc.height = 576;
            try { oc.getContext('2d').drawImage(el0, 0, 0, 1024, 576); this._imgCvs = oc; } catch(e) {}
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var amp = this.settings.waveAmp;
        var freq = this.settings.waveFreq;
        var speed = this.settings.waveSpeed;
        var dir = this.settings.direction;

        ctx.clearRect(0, 0, W, H);

        if (!this._imgCvs) {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#4f8cff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GRAVITY WAVE', W/2, H/2);
            this._tex.needsUpdate = true;
            return;
        }

        // Draw rows with wave offset
        var sliceH = 4; // horizontal slices
        for (var y = 0; y < H; y += sliceH) {
            var offset = 0;
            if (dir === 'horizontal') {
                offset = Math.sin((y / H) * Math.PI * 2 * freq + time * speed) * amp;
                ctx.drawImage(this._imgCvs, 0, y, W, sliceH, offset, y, W, sliceH);
                // fill gap
                if (offset > 0) ctx.drawImage(this._imgCvs, W - offset, y, offset, sliceH, 0, y, offset, sliceH);
                else if (offset < 0) ctx.drawImage(this._imgCvs, 0, y, -offset, sliceH, W + offset, y, -offset, sliceH);
            } else if (dir === 'vertical') {
                var sliceW = 4;
                for (var x = 0; x < W; x += sliceW) {
                    var yOff = Math.sin((x / W) * Math.PI * 2 * freq + time * speed) * amp;
                    ctx.drawImage(this._imgCvs, x, 0, sliceW, H, x, yOff, sliceW, H);
                }
                break;
            } else { // radial
                var cx = W/2; var cy = H/2;
                var dx = (y - cy); // reuse loop var as y-center distance
                offset = Math.sin(Math.sqrt(dx*dx) / H * Math.PI * 2 * freq - time * speed) * amp;
                ctx.drawImage(this._imgCvs, 0, y, W, sliceH, offset * (y < cy ? -1 : 1), y, W, sliceH);
            }
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null;
    };

    EP.Registry.register(effect);
})();
