(function() {
    var effect = new EP.EffectBase('mosaic', {
        name: 'Mosaic',
        category: 'motion',
        icon: '🔲',
        description: 'Pixelización mosaico — bloques de color del promedio de región, con modos de animación: pulso, revelado y dispersión'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'blockSize', type: 'range', min: 4, max: 80, default: 20, step: 2, label: 'Tamaño bloque', unit: 'px' },
        { key: 'animMode', type: 'select', options: [
            { v: 'static', l: 'Estático' },
            { v: 'pulse', l: 'Pulso — bloques palpitan' },
            { v: 'reveal', l: 'Revelado progresivo' },
            { v: 'scatter', l: 'Dispersión aleatoria' }
        ], default: 'pulse', label: 'Modo animación' },
        { key: 'animSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad animación' },
        { key: 'borderWidth', type: 'range', min: 0, max: 6, default: 0, step: 1, label: 'Borde entre bloques', unit: 'px' },
        { key: 'borderColor', type: 'color', default: '#000000', label: 'Color borde' }
    ]);

    function sr(s) { var r = (Math.sin(s + 1) * 43758.5453) % 1; return r < 0 ? r + 1 : r; }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 512; this._cvs.height = 288;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
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
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var bs = Math.max(2, Math.round(this.settings.blockSize));
        var mode = this.settings.animMode;
        var spd = this.settings.animSpeed * 0.3;
        var bw = this.settings.borderWidth;
        var bc = this.settings.borderColor || '#000';
        var dur = loopDuration || 8;
        var phase = (time % dur) / dur;

        var cols = Math.ceil(W / bs);
        var rows = Math.ceil(H / bs);
        var sampW = cols; var sampH = rows;

        if (this._sampCvs.width !== sampW || this._sampCvs.height !== sampH) {
            this._sampCvs.width = sampW; this._sampCvs.height = sampH;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, sampW, sampH);

        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, sampW, sampH); } catch(e) {}
        } else {
            var grd = sc.createLinearGradient(0, 0, sampW, sampH);
            grd.addColorStop(0, 'hsl(' + ((time * 30) % 360) + ',70%,50%)');
            grd.addColorStop(0.5, 'hsl(' + ((time * 30 + 120) % 360) + ',80%,40%)');
            grd.addColorStop(1, 'hsl(' + ((time * 30 + 240) % 360) + ',70%,30%)');
            sc.fillStyle = grd; sc.fillRect(0, 0, sampW, sampH);
        }

        var imgData; try { imgData = sc.getImageData(0, 0, sampW, sampH); } catch(e) { return; }
        var data = imgData.data;

        ctx.clearRect(0, 0, W, H);

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var idx = (row * sampW + col) * 4;
                var r = data[idx], g = data[idx+1], b = data[idx+2];

                var bx = col * bs; var by = row * bs;
                var bw2 = Math.min(bs, W - bx); var bh2 = Math.min(bs, H - by);

                var sizeMod = 1;

                switch(mode) {
                    case 'pulse':
                        sizeMod = 0.65 + Math.sin(time * spd + col * 0.45 + row * 0.35) * 0.35;
                        break;
                    case 'reveal':
                        var cellPhase = (col / cols) * 0.6 + (row / rows) * 0.4;
                        var localPhase = phase;
                        sizeMod = Math.max(0, Math.min(1, (localPhase - cellPhase * 0.8) / 0.25));
                        break;
                    case 'scatter':
                        var seed = sr(col * 17 + row * 31);
                        var t2 = (time * spd * 0.08 + seed) % 1;
                        sizeMod = t2 > 0.35 ? 1 : t2 / 0.35;
                        break;
                }

                if (sizeMod <= 0.01) continue;

                var px = bx + bw2 * (1 - sizeMod) * 0.5;
                var py = by + bh2 * (1 - sizeMod) * 0.5;
                var pw = bw2 * sizeMod;
                var ph = bh2 * sizeMod;

                ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                ctx.fillRect(px, py, pw, ph);

                if (bw > 0 && sizeMod > 0.6) {
                    ctx.strokeStyle = bc;
                    ctx.lineWidth = bw;
                    ctx.strokeRect(px + bw * 0.5, py + bw * 0.5, pw - bw, ph - bw);
                }
            }
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
