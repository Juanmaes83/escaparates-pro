(function() {
    var effect = new EP.EffectBase('neon-pulse-glow', {
        name: 'Neon Pulse Glow',
        category: 'text',
        icon: '✨',
        description: 'Texto neón con pulso suave sinusoidal — glow animado sobre imagen o fondo oscuro'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'text', type: 'text', default: 'ESCAPARATE PRO', label: 'Texto neón' },
        { key: 'subtitle', type: 'text', default: '', label: 'Subtítulo' },
        { key: 'neonColor', type: 'color', default: '#00ffff', label: 'Color neón' },
        { key: 'pulseSpeed', type: 'range', min: 1, max: 20, default: 4, step: 1, label: 'Velocidad pulso' },
        { key: 'pulseMin', type: 'range', min: 0, max: 80, default: 25, step: 5, label: 'Brillo mínimo', unit: '%' },
        { key: 'fontSize', type: 'range', min: 20, max: 120, default: 68, step: 4, label: 'Tamaño fuente', unit: 'px' },
        { key: 'glowRadius', type: 'range', min: 5, max: 100, default: 40, step: 5, label: 'Radio glow', unit: 'px' }
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

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var txt = String(this.settings.text || 'NEON').toUpperCase();
        var sub = String(this.settings.subtitle || '');
        var hexC = this.settings.neonColor || '#00ffff';
        var cr = parseInt(hexC.slice(1, 3), 16);
        var cg = parseInt(hexC.slice(3, 5), 16);
        var cb = parseInt(hexC.slice(5, 7), 16);
        var spd = this.settings.pulseSpeed * 0.5;
        var minBr = this.settings.pulseMin / 100;
        var fs = this.settings.fontSize * (W / 512);
        var gr = this.settings.glowRadius * (W / 512);
        var hasSub = sub.length > 0;
        var pulse = minBr + (1 - minBr) * ((Math.sin(time * spd) + 1) / 2);

        ctx.clearRect(0, 0, W, H);

        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.82)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var cy = H / 2 - (hasSub ? fs * 0.42 : 0);

        ctx.font = 'bold ' + fs + 'px "Arial Black", Arial';

        // Outer glow
        ctx.globalAlpha = pulse;
        ctx.shadowColor = hexC; ctx.shadowBlur = gr * 2;
        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.28)';
        ctx.fillText(txt, W / 2, cy);

        // Mid glow
        ctx.shadowBlur = gr;
        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + pulse.toFixed(2) + ')';
        ctx.fillText(txt, W / 2, cy);

        // White core
        ctx.shadowBlur = gr * 0.3; ctx.shadowColor = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,' + (pulse * 0.92).toFixed(2) + ')';
        ctx.fillText(txt, W / 2, cy);
        ctx.shadowBlur = 0;

        if (hasSub) {
            ctx.font = Math.round(fs * 0.38) + 'px Arial';
            ctx.globalAlpha = pulse * 0.82;
            ctx.shadowColor = hexC; ctx.shadowBlur = gr * 0.5;
            ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.95)';
            ctx.fillText(sub, W / 2, H / 2 + fs * 0.52);
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
