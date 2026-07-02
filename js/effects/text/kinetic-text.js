(function() {
    var effect = new EP.EffectBase('kinetic-text', {
        name: 'Kinetic Text',
        category: 'text',
        icon: '🌀',
        description: 'Palabras con física de resorte — caen y rebotan hacia su posición'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'line1', type: 'text', default: 'DISEÑO', label: 'Línea 1' },
        { key: 'line2', type: 'text', default: 'PREMIUM', label: 'Línea 2' },
        { key: 'line3', type: 'text', default: 'ESPACIOS', label: 'Línea 3' },
        { key: 'fontSize', type: 'range', min: 20, max: 100, default: 56, step: 1, label: 'Tamaño fuente' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Color texto' },
        { key: 'stiffness', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Rigidez resorte' },
        { key: 'damping', type: 'range', min: 50, max: 98, default: 78, step: 1, label: 'Amortiguación', unit: '%' },
        { key: 'background', type: 'color', default: '#101014', label: 'Fondo' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();

        if (mediaList && mediaList.length > 0) {
            var bgGeo = new THREE.PlaneGeometry(8, 4.5);
            var bgMat = EP.Media.createMaterial(mediaList[0]);
            new THREE.Mesh(bgGeo, bgMat);
            var bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -0.05;
            group.add(bgMesh);
        }

        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 512;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);

        var geo = new THREE.PlaneGeometry(8, 4);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);

        this._words = null;
        this.group = group;
        return group;
    };

    effect._initWords = function(loopDuration) {
        var lines = [
            String(this.settings.line1 || 'DISEÑO').toUpperCase(),
            String(this.settings.line2 || 'PREMIUM').toUpperCase(),
            String(this.settings.line3 || 'ESPACIOS').toUpperCase()
        ];
        var fs = Math.round(this.settings.fontSize);
        var h = this._cvs.height;
        var w = this._cvs.width;
        var lineH = fs * 1.4;
        var totalH = lines.length * lineH;
        var startY = (h - totalH) / 2 + lineH / 2;

        this._words = lines.map(function(line, i) {
            var targetY = startY + i * lineH;
            var fromY = (Math.random() > 0.5 ? -h * 0.6 : h * 1.6);
            return {
                text: line,
                targetX: w / 2,
                targetY: targetY,
                x: w / 2 + (Math.random() - 0.5) * w * 0.5,
                y: fromY,
                vx: 0,
                vy: 0,
                delay: i * 0.12 * loopDuration
            };
        });
        this._lastTime = -1;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        if (!this._words) this._initWords(loopDuration);

        var t = time % loopDuration;
        var prevT = this._lastTime < 0 ? t : this._lastTime % loopDuration;

        // Reset on loop
        if (t < prevT - 0.1) this._initWords(loopDuration);
        this._lastTime = time;

        var stiff = this.settings.stiffness / 1000;
        var damp = this.settings.damping / 100;
        var fs = Math.round(this.settings.fontSize);

        var cvs = this._cvs;
        var ctx = this._ctx;
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.font = 'bold ' + fs + 'px "Arial Black", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.settings.textColor;

        var self = this;
        this._words.forEach(function(w) {
            if (t < w.delay) return;
            var ax = (w.targetX - w.x) * stiff;
            var ay = (w.targetY - w.y) * stiff;
            w.vx = (w.vx + ax) * damp;
            w.vy = (w.vy + ay) * damp;
            w.x += w.vx;
            w.y += w.vy;
            ctx.fillText(w.text, w.x, w.y);
        });

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._words = null;
    };

    EP.Registry.register(effect);
})();
