(function() {
    var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function padWord(w, len) {
        var s = w;
        while (s.length < len) s += ' ';
        return s.substring(0, len);
    }

    var effect = new EP.EffectBase('text-morph', {
        name: 'Text Morph',
        category: 'text',
        icon: '🔄',
        description: 'Palabras que se transforman entre sí con efecto morph'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'word1', type: 'text', default: 'DISEÑO', label: 'Palabra 1' },
        { key: 'word2', type: 'text', default: 'CALIDAD', label: 'Palabra 2' },
        { key: 'word3', type: 'text', default: 'PREMIUM', label: 'Palabra 3' },
        { key: 'fontSize', type: 'range', min: 24, max: 140, default: 88, step: 1, label: 'Tamaño fuente' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Color texto' },
        { key: 'morphColor', type: 'color', default: '#ff6644', label: 'Color morph' },
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
        var fs = Math.round(this.settings.fontSize);

        var words = [
            String(this.settings.word1 || 'DISEÑO').toUpperCase(),
            String(this.settings.word2 || 'CALIDAD').toUpperCase(),
            String(this.settings.word3 || 'PREMIUM').toUpperCase()
        ];

        // Each word occupies 1/3 of the loop: 0..0.5 hold, 0.5..1.0 morph
        var total = words.length;
        var slotT = t * total;
        var wordIdx = Math.floor(slotT) % total;
        var nextIdx = (wordIdx + 1) % total;
        var phaseT = slotT - Math.floor(slotT);

        var fromWord = words[wordIdx];
        var toWord = words[nextIdx];
        var maxLen = Math.max(fromWord.length, toWord.length);
        var from = padWord(fromWord, maxLen);
        var to = padWord(toWord, maxLen);

        // hold for first half of slot, morph during second half
        var morphT = phaseT < 0.5 ? 0 : (phaseT - 0.5) * 2;
        var morphedCount = Math.floor(morphT * maxLen);

        var cvs = this._cvs;
        var ctx = this._ctx;
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.font = 'bold ' + fs + 'px "Arial", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        var charW = fs * 0.65;
        var totalW = maxLen * charW;
        var startX = (cvs.width - totalW) / 2;
        var midY = cvs.height / 2;

        for (var i = 0; i < maxLen; i++) {
            var x = startX + i * charW;
            if (i < morphedCount) {
                ctx.fillStyle = this.settings.textColor;
                ctx.fillText(to[i] !== ' ' ? to[i] : '', x, midY);
            } else if (i === morphedCount && morphT > 0 && morphT < 1) {
                ctx.fillStyle = this.settings.morphColor;
                ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, midY);
            } else {
                ctx.fillStyle = this.settings.textColor;
                ctx.fillText(from[i] !== ' ' ? from[i] : '', x, midY);
            }
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
