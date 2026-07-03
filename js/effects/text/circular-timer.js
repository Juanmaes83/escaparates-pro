(function() {
    var effect = new EP.EffectBase('circular-timer', {
        name: 'Circular Timer',
        category: 'text',
        icon: '⏱️',
        description: 'Temporizador circular animado — cuenta regresiva o progreso con arco Canvas2D y etiqueta'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'duration', type: 'range', min: 5, max: 120, default: 30, step: 5, label: 'Duración', unit: 's' },
        { key: 'mode', type: 'select', options: [{ v: 'countdown', l: 'Cuenta regresiva' }, { v: 'progress', l: 'Progreso' }], default: 'countdown', label: 'Modo' },
        { key: 'arcColor', type: 'color', default: '#ff4488', label: 'Color arco' },
        { key: 'bgColor', type: 'color', default: '#0d0d1a', label: 'Color fondo disco' },
        { key: 'trackColor', type: 'color', default: '#2a2a44', label: 'Color pista' },
        { key: 'arcWidth', type: 'range', min: 5, max: 40, default: 18, step: 1, label: 'Grosor arco', unit: 'px' },
        { key: 'label', type: 'text', default: 'OFERTA', label: 'Etiqueta' }
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
        this._cvs.width = 512; this._cvs.height = 512;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(4.5, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var S = this._cvs.width;
        var dur = this.settings.duration;
        var arcC = this.settings.arcColor || '#ff4488';
        var bgC = this.settings.bgColor || '#0d0d1a';
        var trackC = this.settings.trackColor || '#2a2a44';
        var lbl = String(this.settings.label || '');
        var mode = this.settings.mode;
        var aw = this.settings.arcWidth;

        var phase = (time % dur) / dur;
        var progress = mode === 'countdown' ? 1 - phase : phase;
        var remaining = mode === 'countdown' ? Math.ceil((1 - phase) * dur) : Math.floor(phase * 100);
        var R = S * 0.38;

        ctx.clearRect(0, 0, S, S);

        // Background circle
        ctx.fillStyle = bgC;
        ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2); ctx.fill();

        // Track ring
        ctx.strokeStyle = trackC; ctx.lineWidth = aw;
        ctx.beginPath(); ctx.arc(S / 2, S / 2, R, 0, Math.PI * 2); ctx.stroke();

        // Progress arc
        ctx.strokeStyle = arcC; ctx.lineWidth = aw; ctx.lineCap = 'round';
        ctx.shadowBlur = 18; ctx.shadowColor = arcC;
        ctx.beginPath();
        ctx.arc(S / 2, S / 2, R, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Number
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold ' + Math.round(S * 0.22) + 'px Arial';
        ctx.fillText(String(remaining), S / 2, S / 2 - S * 0.06);

        // Unit
        ctx.font = Math.round(S * 0.065) + 'px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText(mode === 'countdown' ? 'seg' : '%', S / 2, S / 2 + S * 0.09);

        // Label below
        if (lbl) {
            ctx.font = 'bold ' + Math.round(S * 0.085) + 'px Arial';
            ctx.fillStyle = arcC;
            ctx.shadowBlur = 10; ctx.shadowColor = arcC;
            ctx.fillText(lbl.toUpperCase(), S / 2, S / 2 + S * 0.22);
            ctx.shadowBlur = 0;
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
