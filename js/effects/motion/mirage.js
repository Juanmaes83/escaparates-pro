(function() {
    var effect = new EP.EffectBase('mirage', {
        name: 'Mirage',
        category: 'motion',
        icon: '🌅',
        description: 'Espejismo / distorsión térmica — ondulación de calor animada con gradiente térmico y refracción óptica, estilo ditther.com Mirage'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'heatStrength', type: 'range', min: 1, max: 40, default: 14, step: 1, label: 'Fuerza distorsión', unit: 'px' },
        { key: 'heatFreq', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Frecuencia ondas' },
        { key: 'heatSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad ondas' },
        { key: 'heatZone', type: 'select', options: [
            { v: 'bottom', l: 'Calor abajo (asfalto)' },
            { v: 'full', l: 'Calor total' },
            { v: 'center', l: 'Calor central' },
            { v: 'top', l: 'Calor arriba' }
        ], default: 'bottom', label: 'Zona de calor' },
        { key: 'thermalTint', type: 'select', options: [
            { v: 'warm', l: 'Tinte cálido (naranja)' },
            { v: 'cold', l: 'Tinte frío (azul)' },
            { v: 'none', l: 'Sin tinte' }
        ], default: 'warm', label: 'Tinte térmico' },
        { key: 'mirrorBottom', type: 'select', options: [
            { v: 'on', l: 'Reflejo en suelo (espejismo)' },
            { v: 'off', l: 'Sin reflejo' }
        ], default: 'on', label: 'Espejismo reflejo' }
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
        if (m0) { var el = m0.element || (m0.texture && m0.texture.image); if (el) this._media = el; }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var W = this._cvs.width; var H = this._cvs.height;
        var ctx = this._ctx;
        var strength = this.settings.heatStrength;
        var freq = this.settings.heatFreq;
        var spd = this.settings.heatSpeed;
        var zone = this.settings.heatZone;
        var thermalTint = this.settings.thermalTint;
        var mirrorBottom = this.settings.mirrorBottom === 'on';

        if (this._sampCvs.width !== W || this._sampCvs.height !== H) {
            this._sampCvs.width = W; this._sampCvs.height = H;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, W, H);
        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, W, H); } catch(e) {}
        } else {
            var grd = sc.createLinearGradient(0, 0, W, H);
            grd.addColorStop(0, 'hsl(35,90%,60%)');
            grd.addColorStop(0.6, 'hsl(20,80%,45%)');
            grd.addColorStop(1, 'hsl(190,60%,30%)');
            sc.fillStyle = grd; sc.fillRect(0, 0, W, H);
        }

        var imgData; try { imgData = sc.getImageData(0, 0, W, H); } catch(e){ return; }
        var data = imgData.data;

        var outData = ctx.createImageData(W, H);
        var out = outData.data;

        // Heat zone factor: how much distortion per row
        function heatFactor(y) {
            var t = y / H;
            switch(zone) {
                case 'bottom': return t * t;
                case 'top':    return (1-t)*(1-t);
                case 'center': return 1 - Math.abs(t - 0.5) * 2;
                default:       return 0.3 + 0.7 * t * t;
            }
        }

        for (var y = 0; y < H; y++) {
            var hf = heatFactor(y);
            for (var x = 0; x < W; x++) {
                // Multi-frequency heat shimmer
                var dx = Math.sin(y * freq * 0.08 + time * spd * 0.7 + x * 0.02) * strength * hf
                       + Math.sin(y * freq * 0.13 - time * spd * 0.5 + x * 0.015) * strength * 0.4 * hf;
                var dy = Math.cos(x * freq * 0.06 + time * spd * 0.6) * strength * 0.3 * hf;

                var sx2 = Math.max(0, Math.min(W-1, Math.round(x + dx)));
                var sy2 = Math.max(0, Math.min(H-1, Math.round(y + dy)));

                // Mirror bottom for mirage effect
                if (mirrorBottom && zone === 'bottom' && y > H * 0.65) {
                    var mirrorY = Math.floor(H - (y - H*0.65) * 0.8);
                    sy2 = Math.max(0, Math.min(H-1, mirrorY + Math.round(dy)));
                }

                var srcIdx = (sy2 * W + sx2) * 4;
                var rd = data[srcIdx], gd = data[srcIdx+1], bd = data[srcIdx+2];

                // Thermal tint
                var hf2 = hf;
                if (thermalTint === 'warm') {
                    rd = Math.min(255, rd + hf2 * 40);
                    gd = Math.max(0, gd - hf2 * 10);
                    bd = Math.max(0, bd - hf2 * 30);
                } else if (thermalTint === 'cold') {
                    rd = Math.max(0, rd - hf2 * 30);
                    gd = Math.max(0, gd - hf2 * 10);
                    bd = Math.min(255, bd + hf2 * 40);
                }

                // Alpha fade at mirror zone
                var alpha = (mirrorBottom && zone === 'bottom' && y > H * 0.65) ?
                    Math.max(0, 1 - (y - H*0.65) / (H*0.35) * 1.2) : 1;

                out[(y*W+x)*4]   = rd;
                out[(y*W+x)*4+1] = gd;
                out[(y*W+x)*4+2] = bd;
                out[(y*W+x)*4+3] = Math.round(alpha * 255);
            }
        }

        ctx.putImageData(outData, 0, 0);

        // Heat haze gradient overlay
        if (zone === 'bottom' || zone === 'full') {
            var hazeGrad = ctx.createLinearGradient(0, H*0.6, 0, H);
            hazeGrad.addColorStop(0, 'rgba(255,220,150,0)');
            hazeGrad.addColorStop(1, thermalTint === 'cold' ? 'rgba(100,150,255,0.12)' : 'rgba(255,200,100,0.12)');
            ctx.fillStyle = hazeGrad;
            ctx.fillRect(0, H*0.6, W, H*0.4);
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
