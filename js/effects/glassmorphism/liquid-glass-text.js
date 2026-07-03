(function() {
    var effect = new EP.EffectBase('liquid-glass-text', {
        name: 'Liquid Glass Text',
        category: 'glassmorphism',
        icon: '💧',
        description: 'Texto con efecto liquid glass — distorsión líquida animada con aberración cromática suave'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'text', type: 'text', default: '12:34', label: 'Texto / Número' },
        { key: 'fontSize', type: 'range', min: 40, max: 200, default: 120, step: 10, label: 'Tamaño fuente', unit: 'px' },
        { key: 'glassColor', type: 'color', default: '#00ccff', label: 'Color cristal' },
        { key: 'distortion', type: 'range', min: 0, max: 30, default: 12, step: 1, label: 'Distorsión líquida', unit: 'px' },
        { key: 'chromaAmt', type: 'range', min: 0, max: 20, default: 5, step: 1, label: 'Aberración cromática', unit: 'px' },
        { key: 'blurAmt', type: 'range', min: 0, max: 20, default: 6, step: 1, label: 'Blur efecto glass', unit: 'px' },
        { key: 'waveSpeed', type: 'range', min: 1, max: 20, default: 4, step: 1, label: 'Velocidad ola líquida' },
        { key: 'bgColor', type: 'color', default: '#050a14', label: 'Color fondo' }
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

        // Off-screen for distortion pass
        this._offCvs = document.createElement('canvas');
        this._offCvs.width = 1024; this._offCvs.height = 576;

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var txt = String(this.settings.text || '12:34');
        var fs = this.settings.fontSize * (W / 512);
        var gc = this.settings.glassColor || '#00ccff';
        var gr = parseInt(gc.slice(1,3),16), gg = parseInt(gc.slice(3,5),16), gb = parseInt(gc.slice(5,7),16);
        var dist = this.settings.distortion;
        var chroma = this.settings.chromaAmt;
        var blur = this.settings.blurAmt;
        var wSpd = this.settings.waveSpeed * 0.3;
        var bgC = this.settings.bgColor || '#050a14';

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bgC;
        ctx.fillRect(0, 0, W, H);

        // Draw text to offscreen first
        var offCtx = this._offCvs.getContext('2d');
        offCtx.clearRect(0, 0, W, H);
        offCtx.font = 'bold ' + fs + 'px "Share Tech Mono", monospace';
        offCtx.textAlign = 'center'; offCtx.textBaseline = 'middle';

        // Base glass text — multiple layers
        // Layer 1: blurred glow (ctx.filter with shadowBlur fallback for Safari <15.4)
        var hasFilter = typeof offCtx.filter !== 'undefined';
        if (blur > 0) {
            if (hasFilter) { offCtx.filter = 'blur(' + blur + 'px)'; }
            else { offCtx.shadowBlur = blur * 3; offCtx.shadowColor = 'rgba(' + gr + ',' + gg + ',' + gb + ',0.6)'; }
        }
        offCtx.fillStyle = 'rgba(' + gr + ',' + gg + ',' + gb + ',0.4)';
        offCtx.fillText(txt, W/2, H/2);
        if (hasFilter) { offCtx.filter = 'none'; } else { offCtx.shadowBlur = 0; }

        // Layer 2: white core
        offCtx.fillStyle = 'rgba(255,255,255,0.85)';
        offCtx.fillText(txt, W/2, H/2);

        // Apply liquid distortion row by row
        if (dist > 0) {
            var src = offCtx.getImageData(0, 0, W, H);
            offCtx.clearRect(0, 0, W, H);
            var sliceH = 3;
            for (var y = 0; y < H; y += sliceH) {
                var wave = Math.sin(y * 0.02 + time * wSpd) * dist +
                           Math.sin(y * 0.05 - time * wSpd * 1.3) * dist * 0.4;
                offCtx.putImageData(src, Math.round(wave), y, 0, y, W, Math.min(sliceH, H-y));
            }
        }

        // Chromatic aberration: draw 3 passes
        if (chroma > 0) {
            ctx.globalCompositeOperation = 'screen';
            // R channel right
            ctx.globalAlpha = 0.6;
            ctx.drawImage(this._offCvs, chroma, 0, W, H);
            // G channel center
            ctx.globalAlpha = 0.5;
            ctx.drawImage(this._offCvs, 0, 0, W, H);
            // B channel left
            ctx.globalAlpha = 0.6;
            ctx.drawImage(this._offCvs, -Math.round(chroma*0.7), 0, W, H);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        } else {
            ctx.drawImage(this._offCvs, 0, 0, W, H);
        }

        // Animated water highlight line
        var wh = H * 0.04;
        var wy = H/2 - fs*0.3 + Math.sin(time*wSpd)*fs*0.15;
        var whGrd = ctx.createLinearGradient(W*0.2, wy, W*0.8, wy+wh);
        whGrd.addColorStop(0, 'rgba(255,255,255,0)');
        whGrd.addColorStop(0.3, 'rgba(255,255,255,0.35)');
        whGrd.addColorStop(0.7, 'rgba(' + gr + ',' + gg + ',' + gb + ',0.25)');
        whGrd.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = whGrd;
        ctx.fillRect(W*0.2, wy, W*0.6, wh);

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._offCvs = null;
    };

    EP.Registry.register(effect);
})();
