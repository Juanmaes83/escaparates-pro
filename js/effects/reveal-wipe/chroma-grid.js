(function() {
    var effect = new EP.EffectBase('chroma-grid', {
        name: 'Chroma Grid',
        category: 'reveal-wipe',
        icon: '🔷',
        description: 'Grid triangular con aberración cromática — glitch de transición con desplazamiento RGB por celdas'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'gridCols', type: 'range', min: 4, max: 24, default: 10, step: 1, label: 'Columnas grid' },
        { key: 'chromaShift', type: 'range', min: 0, max: 40, default: 12, step: 1, label: 'Aberración RGB', unit: 'px' },
        { key: 'animSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad animación' },
        { key: 'glitchRate', type: 'range', min: 1, max: 30, default: 10, step: 1, label: 'Frecuencia glitch' },
        { key: 'revealStyle', type: 'select', options: [
            { v: 'wave', l: 'Ola diagonal' },
            { v: 'random', l: 'Aleatorio' },
            { v: 'radial', l: 'Radial' }
        ], default: 'wave', label: 'Estilo reveal' },
        { key: 'triangleMode', type: 'select', options: [{ v: 'on', l: 'Triángulos' }, { v: 'off', l: 'Rectángulos' }], default: 'on', label: 'Modo celda' }
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

        this._offCvs = document.createElement('canvas');
        this._offCvs.width = 512; this._offCvs.height = 288;

        this._imgA = null; this._imgB = null;
        var m0 = mediaList && mediaList[0];
        var m1 = mediaList && mediaList[1];
        var el0 = m0 && (m0.element || (m0.texture && m0.texture.image));
        var el1 = m1 && (m1.element || (m1.texture && m1.texture.image));
        if (el0) { var a = document.createElement('canvas'); a.width=512; a.height=288; try{a.getContext('2d').drawImage(el0,0,0,512,288); this._imgA=a;}catch(e){} }
        if (el1) { var b = document.createElement('canvas'); b.width=512; b.height=288; try{b.getContext('2d').drawImage(el1,0,0,512,288); this._imgB=b;}catch(e){} }
        if (!this._imgB && this._imgA) this._imgB = this._imgA;

        this._cells = [];
        this._nextGlitch = 0;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var cols = Math.round(this.settings.gridCols);
        var rows = Math.round(cols * H / W);
        var shift = this.settings.chromaShift;
        var spd = this.settings.animSpeed * 0.25;
        var rate = this.settings.glitchRate;
        var style = this.settings.revealStyle;
        var triMode = this.settings.triangleMode === 'on';
        var cw = W / cols; var ch = H / rows;
        var dur = loopDuration || 8;
        var t = (time % dur) / dur;

        // Build offscreen with RGB shift applied
        var offCtx = this._offCvs.getContext('2d');
        offCtx.clearRect(0, 0, W, H);
        var imgSrc = (t < 0.5) ? this._imgA : this._imgB;
        var imgDst = (t < 0.5) ? this._imgB : this._imgA;
        var localT = (t < 0.5) ? t * 2 : (t - 0.5) * 2;

        ctx.clearRect(0, 0, W, H);

        // Base image
        if (imgSrc) offCtx.drawImage(imgSrc, 0, 0, W, H);
        else { offCtx.fillStyle='#111'; offCtx.fillRect(0,0,W,H); }

        // Per-cell rendering with reveal + chroma
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var cx = col * cw; var cy = row * ch;

                // Reveal progress per cell
                var cellT;
                switch(style) {
                    case 'wave':
                        var diag = (col/cols + row/rows) / 2;
                        cellT = Math.min(1, Math.max(0, localT * 1.5 - diag * 0.5)); break;
                    case 'random':
                        var seed = sr(col * 17 + row * 31);
                        cellT = Math.min(1, Math.max(0, localT * 1.3 - seed * 0.3)); break;
                    case 'radial':
                        var dx = col/cols - 0.5; var dy = row/rows - 0.5;
                        var dist = Math.sqrt(dx*dx+dy*dy) * 1.4;
                        cellT = Math.min(1, Math.max(0, localT * 1.5 - dist * 0.5)); break;
                    default: cellT = localT;
                }

                // Glitch on cell boundary
                var glitchOn = (Math.random() < 0.008 * rate) && cellT > 0.1 && cellT < 0.9;
                var cellShift = glitchOn ? shift * (1 - cellT) : shift * (1 - cellT) * 0.3;

                ctx.save();
                if (triMode) {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy); ctx.lineTo(cx+cw, cy); ctx.lineTo(cx, cy+ch);
                    ctx.clip();
                } else {
                    ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip();
                }

                // R channel (shift right)
                if (imgSrc) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.drawImage(imgSrc, cellShift, 0, W, H);
                }
                ctx.restore();

                if (triMode) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(cx+cw, cy); ctx.lineTo(cx+cw, cy+ch); ctx.lineTo(cx, cy+ch);
                    ctx.clip();
                    // B channel (shift left)
                    if (imgDst && cellT > 0.05) {
                        ctx.globalAlpha = cellT;
                        ctx.drawImage(imgDst, -cellShift * 0.6, 0, W, H);
                        ctx.globalAlpha = 1;
                    }
                    ctx.restore();
                }
            }
        }

        // Global chroma glow overlay
        if (shift > 2) {
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.15 * (shift / 40);
            if (imgSrc) ctx.drawImage(imgSrc, shift, 0, W, H);
            ctx.globalAlpha = 0.1 * (shift / 40);
            if (imgSrc) ctx.drawImage(imgSrc, -Math.round(shift*0.6), 0, W, H);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgA = null; this._imgB = null; this._offCvs = null;
    };

    EP.Registry.register(effect);
})();
