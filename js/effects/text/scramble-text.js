(function() {
    var GLITCH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!%&*?$';

    var effect = new EP.EffectBase('scramble-text', {
        name: 'Scramble Text',
        category: 'text',
        icon: '🔀',
        description: 'Texto glitch que se decodifica carácter a carácter'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'textContent', type: 'text', default: 'ESCAPARATES PRO', label: 'Texto' },
        { key: 'fontSize', type: 'range', min: 24, max: 120, default: 72, step: 1, label: 'Tamaño fuente' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Color texto' },
        { key: 'glitchColor', type: 'color', default: '#00ccff', label: 'Color glitch' },
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
        this._cvs.width = 1024;
        this._cvs.height = 256;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);

        var geo = new THREE.PlaneGeometry(7.5, 1.875);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        this._textMesh = new THREE.Mesh(geo, mat);
        this._textMesh.position.z = 0.05;
        group.add(this._textMesh);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var t = (time % loopDuration) / loopDuration;
        var target = String(this.settings.textContent || 'TEXTO').toUpperCase();
        var len = target.length;
        var fs = Math.round(this.settings.fontSize);

        var revealEnd = 0.65;
        var holdEnd = 0.85;

        var revealedCount, alpha;
        if (t < revealEnd) {
            revealedCount = Math.floor((t / revealEnd) * len);
            alpha = 1;
        } else if (t < holdEnd) {
            revealedCount = len;
            alpha = 1;
        } else {
            revealedCount = len;
            alpha = Math.max(0, 1 - (t - holdEnd) / (1 - holdEnd));
        }

        var cvs = this._cvs;
        var ctx = this._ctx;
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.globalAlpha = alpha;
        ctx.font = 'bold ' + fs + 'px "Courier New", monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        var charW = fs * 0.62;
        var totalW = len * charW;
        var startX = (cvs.width - totalW) / 2;
        var midY = cvs.height / 2;

        for (var i = 0; i < len; i++) {
            var x = startX + i * charW;
            if (i < revealedCount) {
                ctx.fillStyle = this.settings.textColor;
                ctx.fillText(target[i], x, midY);
            } else {
                var g = GLITCH[Math.floor(Math.random() * GLITCH.length)];
                ctx.fillStyle = this.settings.glitchColor;
                ctx.fillText(g, x, midY);
            }
        }

        ctx.globalAlpha = 1;
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null;
        this._ctx = null;
    };

    EP.Registry.register(effect);
})();
