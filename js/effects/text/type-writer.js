(function() {
    var effect = new EP.EffectBase('type-writer', {
        name: 'Type Writer',
        category: 'text',
        icon: '⌨️',
        description: 'Escritura progresiva con cursor parpadeante'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'textContent', type: 'text', default: 'Diseño de interiores premium', label: 'Texto' },
        { key: 'fontSize', type: 'range', min: 20, max: 100, default: 52, step: 1, label: 'Tamaño fuente' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Color texto' },
        { key: 'cursorColor', type: 'color', default: '#4f8cff', label: 'Color cursor' },
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
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var t = (time % loopDuration) / loopDuration;
        var target = String(this.settings.textContent || 'Texto');
        var len = target.length;
        var fs = Math.round(this.settings.fontSize);

        // 0..0.55 type out, 0.55..0.80 hold + blink, 0.80..1.0 erase
        var typeEnd = 0.55;
        var holdEnd = 0.80;

        var visibleLen, showCursor;
        if (t < typeEnd) {
            visibleLen = Math.floor((t / typeEnd) * len);
            showCursor = true;
        } else if (t < holdEnd) {
            visibleLen = len;
            showCursor = Math.floor(time * 3) % 2 === 0;
        } else {
            var eraseT = (t - holdEnd) / (1 - holdEnd);
            visibleLen = Math.max(0, Math.floor((1 - eraseT) * len));
            showCursor = true;
        }

        var cvs = this._cvs;
        var ctx = this._ctx;
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.font = fs + 'px "Georgia", serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.settings.textColor;

        var displayText = target.substring(0, visibleLen);
        ctx.fillText(displayText, cvs.width / 2, cvs.height / 2);

        if (showCursor) {
            var textW = ctx.measureText(displayText).width;
            var cursorX = cvs.width / 2 + textW / 2 + 4;
            ctx.fillStyle = this.settings.cursorColor;
            ctx.fillRect(cursorX, cvs.height / 2 - fs * 0.55, Math.max(2, fs * 0.08), fs * 1.1);
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null;
        this._ctx = null;
    };

    EP.Registry.register(effect);
})();
