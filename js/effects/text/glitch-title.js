(function() {
    var effect = new EP.EffectBase('glitch-title', {
        name: 'Glitch Title',
        category: 'text',
        icon: '📡',
        description: 'Título con glitch RGB, cortes y scanlines estilo CRT'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'textContent', type: 'text', default: 'GLITCH', label: 'Texto' },
        { key: 'fontSize', type: 'range', min: 30, max: 160, default: 96, step: 1, label: 'Tamaño fuente' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Color base' },
        { key: 'glitchFreq', type: 'range', min: 0, max: 30, default: 12, step: 1, label: 'Frecuencia glitch' },
        { key: 'scanlines', type: 'select', options: [{ v: 'on', l: 'Scanlines On' }, { v: 'off', l: 'Scanlines Off' }], default: 'on', label: 'Scanlines' },
        { key: 'background', type: 'color', default: '#101014', label: 'Fondo' }
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
        this._cvs.width = 1024; this._cvs.height = 512;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);

        var geo = new THREE.PlaneGeometry(8, 4);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);

        this.group = group;
        this._glitchTimer = 0;
        this._glitchActive = false;
        this._glitchOffsets = [];
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var text = String(this.settings.textContent || 'GLITCH').toUpperCase();
        var fs = Math.round(this.settings.fontSize);
        var freq = this.settings.glitchFreq;

        // Trigger glitch bursts randomly
        this._glitchTimer -= dt;
        if (this._glitchTimer <= 0) {
            this._glitchActive = Math.random() < (freq / 30);
            this._glitchTimer = 0.05 + Math.random() * 0.1;
            if (this._glitchActive) {
                this._glitchOffsets = [];
                var numSlices = 2 + Math.floor(Math.random() * 4);
                for (var i = 0; i < numSlices; i++) {
                    this._glitchOffsets.push((Math.random() - 0.5) * 40);
                }
            }
        }

        var cvs = this._cvs; var ctx = this._ctx;
        var W = cvs.width; var H = cvs.height;
        var cx = W / 2; var cy = H / 2;

        ctx.clearRect(0, 0, W, H);
        ctx.font = 'bold ' + fs + 'px "Arial Black", Arial, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        if (this._glitchActive) {
            // RGB split
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = '#ff0044';
            ctx.fillText(text, cx - 6, cy);
            ctx.fillStyle = '#00ffcc';
            ctx.fillText(text, cx + 6, cy);
            ctx.globalAlpha = 1;

            // Slice corruption
            var sliceH = Math.floor(H / (this._glitchOffsets.length + 1));
            this._glitchOffsets.forEach(function(offset, i) {
                var sy = i * sliceH;
                var imageData = ctx.getImageData(0, sy, W, sliceH);
                ctx.putImageData(imageData, offset, sy);
            });
        }

        // Base text always on top
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = this.settings.textColor;
        ctx.fillText(text, cx, cy + (this._glitchActive ? (Math.random() - 0.5) * 6 : 0));

        // Scanlines
        if (this.settings.scanlines === 'on') {
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = '#000000';
            for (var y = 0; y < H; y += 3) {
                ctx.fillRect(0, y, W, 1);
            }
            ctx.globalAlpha = 1;
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
