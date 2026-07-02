(function() {
    var effect = new EP.EffectBase('split-word-reveal', {
        name: 'Split Word Reveal',
        category: 'text',
        icon: '✂️',
        description: 'Palabras que aparecen letra a letra o palabra a palabra con slide'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'text', type: 'text', default: 'DISEÑO PREMIUM', label: 'Texto' },
        { key: 'revealMode', type: 'select', options: [{ v: 'words', l: 'Por palabras' }, { v: 'chars', l: 'Por letras' }], default: 'words', label: 'Modo reveal' },
        { key: 'direction', type: 'select', options: [{ v: 'up', l: 'Desde abajo' }, { v: 'down', l: 'Desde arriba' }, { v: 'left', l: 'Desde izquierda' }], default: 'up', label: 'Dirección' },
        { key: 'stagger', type: 'range', min: 0, max: 60, default: 20, step: 1, label: 'Desfase', unit: '%' },
        { key: 'fontSize', type: 'range', min: 20, max: 120, default: 72, step: 1, label: 'Tamaño fuente' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Color texto' },
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

        this._tokens = null;
        this.group = group;
        return group;
    };

    effect._buildTokens = function() {
        var raw = String(this.settings.text || 'DISEÑO PREMIUM');
        var byWords = this.settings.revealMode === 'words';
        this._tokens = byWords ? raw.split(' ') : raw.split('');
        this._staggerFrac = this.settings.stagger / 100;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        if (!this._tokens) this._buildTokens();

        var t = (time % loopDuration) / loopDuration;
        var ctx = this._ctx;
        var W = this._cvs.width; var H = this._cvs.height;
        var fs = Math.round(this.settings.fontSize);
        var n = this._tokens.length;
        var stagger = this._staggerFrac;
        var dir = this.settings.direction;

        ctx.clearRect(0, 0, W, H);
        ctx.font = 'bold ' + fs + 'px "Arial Black", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.settings.textColor;

        // Measure total to center
        var byWords = this.settings.revealMode === 'words';
        var totalWidth = 0;
        var widths = this._tokens.map(function(tok) {
            var w = ctx.measureText(tok).width + (byWords ? fs * 0.4 : 0);
            totalWidth += w;
            return w;
        });

        var cx = W / 2; var cy = H / 2;
        var x = cx - totalWidth / 2;

        // Reveal window: 0..0.7 reveal, 0.7..0.85 hold, 0.85..1 fade out
        var revealEnd = 0.70; var holdEnd = 0.85;
        var globalAlpha = t < revealEnd ? 1 : (t < holdEnd ? 1 : 1 - (t - holdEnd) / (1 - holdEnd));
        ctx.globalAlpha = Math.max(0, globalAlpha);

        for (var i = 0; i < n; i++) {
            var tokenStart = (i / n) * stagger;
            var tokenEnd = tokenStart + (1 - stagger);
            var localT = Math.max(0, Math.min(1, (t - tokenStart) / Math.max(0.001, tokenEnd - tokenStart)));
            // Ease in
            var eased = 1 - Math.pow(1 - localT, 3);

            var tx = x + widths[i] / 2;
            var ty = cy;
            var offsetX = 0; var offsetY = 0;
            var slideAmt = fs * 1.5;

            if (dir === 'up') offsetY = slideAmt * (1 - eased);
            else if (dir === 'down') offsetY = -slideAmt * (1 - eased);
            else if (dir === 'left') offsetX = slideAmt * (1 - eased);

            ctx.save();
            ctx.globalAlpha = ctx.globalAlpha * eased;
            ctx.fillText(this._tokens[i], tx + offsetX, ty + offsetY);
            ctx.restore();

            x += widths[i];
        }

        ctx.globalAlpha = 1;
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._tokens = null;
    };

    EP.Registry.register(effect);
})();
