(function() {
    var effect = new EP.EffectBase('inversion', {
        name: 'Inversion',
        category: 'motion',
        icon: '🔄',
        description: 'Inversión de colores animada — ciclo entre imagen original e invertida con selección de canales y modos strobe'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'invertAmount', type: 'range', min: 0, max: 100, default: 100, step: 5, label: 'Inversión máxima', unit: '%' },
        { key: 'cycleMode', type: 'select', options: [
            { v: 'auto', l: 'Auto ciclo suave' },
            { v: 'hold', l: 'Invertido fijo' },
            { v: 'strobe', l: 'Strobe (parpadeo)' },
            { v: 'wave', l: 'Ola horizontal' }
        ], default: 'auto', label: 'Modo' },
        { key: 'cycleSpeed', type: 'range', min: 1, max: 20, default: 4, step: 1, label: 'Velocidad ciclo' },
        { key: 'channelSelect', type: 'select', options: [
            { v: 'all', l: 'Todos los canales' },
            { v: 'rg', l: 'Solo R+G' },
            { v: 'rb', l: 'Solo R+B' },
            { v: 'gb', l: 'Solo G+B' },
            { v: 'r', l: 'Solo Rojo' }
        ], default: 'all', label: 'Canales a invertir' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 512; this._cvs.height = 288;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, depthWrite: false });
        group.add(new THREE.Mesh(geo, mat));

        this._sampCvs = document.createElement('canvas');
        this._sampCtx = this._sampCvs.getContext('2d');
        this._media = null;
        var m0 = mediaList && mediaList[0];
        if (m0) {
            var el = m0.element || (m0.texture && m0.texture.image);
            if (el) this._media = el;
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var W = this._cvs.width; var H = this._cvs.height;
        var maxAmt = this.settings.invertAmount / 100;
        var mode = this.settings.cycleMode;
        var spd = this.settings.cycleSpeed;
        var ch = this.settings.channelSelect;

        // Calculate per-mode global inversion factor (0=none, 1=full)
        var globalFactor;
        switch(mode) {
            case 'hold': globalFactor = maxAmt; break;
            case 'strobe': globalFactor = (Math.floor(time * spd * 2) % 2 === 0) ? maxAmt : 0; break;
            case 'auto': globalFactor = (Math.sin(time * spd) * 0.5 + 0.5) * maxAmt; break;
            default: globalFactor = maxAmt;
        }

        // Sample source
        if (this._sampCvs.width !== W || this._sampCvs.height !== H) {
            this._sampCvs.width = W; this._sampCvs.height = H;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, W, H);

        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, W, H); } catch(e) {}
        } else {
            var grd = sc.createLinearGradient(0, 0, W, H);
            grd.addColorStop(0, 'hsl(' + ((time * 20) % 360) + ',70%,55%)');
            grd.addColorStop(1, 'hsl(' + ((time * 20 + 160) % 360) + ',80%,35%)');
            sc.fillStyle = grd; sc.fillRect(0, 0, W, H);
        }

        var imgData; try { imgData = sc.getImageData(0, 0, W, H); } catch(e) { return; }
        var data = imgData.data;

        if (mode === 'wave') {
            // Wave: inversion sweeps horizontally
            for (var y = 0; y < H; y++) {
                for (var x = 0; x < W; x++) {
                    var waveF = Math.sin((x / W) * Math.PI * 2 - time * spd) * 0.5 + 0.5;
                    var amt = waveF * maxAmt;
                    var idx = (y * W + x) * 4;
                    var rv = data[idx], gv = data[idx+1], bv = data[idx+2];
                    if (ch === 'all' || ch === 'rg' || ch === 'rb' || ch === 'r') data[idx]   = Math.round(rv + (255 - rv * 2) * amt);
                    if (ch === 'all' || ch === 'rg' || ch === 'gb')               data[idx+1] = Math.round(gv + (255 - gv * 2) * amt);
                    if (ch === 'all' || ch === 'rb' || ch === 'gb')               data[idx+2] = Math.round(bv + (255 - bv * 2) * amt);
                }
            }
        } else {
            var f = globalFactor;
            var len = data.length;
            for (var i = 0; i < len; i += 4) {
                var rv = data[i], gv = data[i+1], bv = data[i+2];
                if (ch === 'all' || ch === 'rg' || ch === 'rb' || ch === 'r') data[i]   = Math.round(rv + (255 - rv * 2) * f);
                if (ch === 'all' || ch === 'rg' || ch === 'gb')               data[i+1] = Math.round(gv + (255 - gv * 2) * f);
                if (ch === 'all' || ch === 'rb' || ch === 'gb')               data[i+2] = Math.round(bv + (255 - bv * 2) * f);
            }
        }

        this._ctx.putImageData(imgData, 0, 0);
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
