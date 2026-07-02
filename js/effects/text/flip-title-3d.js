(function() {
    var effect = new EP.EffectBase('flip-title-3d', {
        name: '3D Flip Title',
        category: 'text',
        icon: '🔁',
        description: 'Tarjeta de texto que gira en 3D revelando palabras — estilo Animos'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'word1', type: 'text', default: 'DISEÑO', label: 'Palabra A' },
        { key: 'word2', type: 'text', default: 'INTERIOR', label: 'Palabra B' },
        { key: 'fontSize', type: 'range', min: 30, max: 160, default: 96, step: 1, label: 'Tamaño fuente' },
        { key: 'colorA', type: 'color', default: '#ffffff', label: 'Color A' },
        { key: 'colorB', type: 'color', default: '#4f8cff', label: 'Color B' },
        { key: 'cardColor', type: 'color', default: '#1a1a2e', label: 'Color tarjeta' },
        { key: 'background', type: 'color', default: '#101014', label: 'Fondo' }
    ]);

    function makeCardCanvas(text, textColor, bgColor, fs) {
        var cvs = document.createElement('canvas');
        cvs.width = 1024; cvs.height = 256;
        var ctx = cvs.getContext('2d');
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 5;
        ctx.strokeRect(10, 10, cvs.width - 20, cvs.height - 20);
        ctx.font = 'bold ' + fs + 'px "Arial Black", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor;
        ctx.fillText(String(text).toUpperCase(), cvs.width / 2, cvs.height / 2);
        return cvs;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();

        if (mediaList && mediaList.length > 0) {
            var bgGeo = new THREE.PlaneGeometry(8, 4.5);
            var bgMat = EP.Media.createMaterial(mediaList[0]);
            var bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -0.1;
            group.add(bgMesh);
        }

        var fs = Math.round(this.settings.fontSize);
        var cvsA = makeCardCanvas(this.settings.word1 || 'DISEÑO', this.settings.colorA, this.settings.cardColor, fs);
        var cvsB = makeCardCanvas(this.settings.word2 || 'INTERIOR', this.settings.colorB, this.settings.cardColor, fs);

        this._texA = new THREE.CanvasTexture(cvsA);
        this._texB = new THREE.CanvasTexture(cvsB);
        this._showingA = true;

        var geo = new THREE.PlaneGeometry(5.5, 1.375);
        this._mat = new THREE.MeshBasicMaterial({ map: this._texA, side: THREE.DoubleSide });
        this._mesh = new THREE.Mesh(geo, this._mat);
        this._mesh.position.z = 0.05;
        this._mesh.renderOrder = 1;
        group.add(this._mesh);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._mesh) return;
        // Each half-loop: hold 40% → flip 20% → hold 40%
        var t = (time % loopDuration) / loopDuration;
        var phase = (t * 2) % 1; // 0..1 within each half
        var holdFrac = 0.40;
        var flipFrac = 0.20;

        var flipAngle;
        if (phase < holdFrac) {
            flipAngle = 0;
        } else if (phase < holdFrac + flipFrac) {
            var ft = (phase - holdFrac) / flipFrac;
            flipAngle = (1 - Math.cos(ft * Math.PI)) / 2 * Math.PI;
        } else {
            flipAngle = Math.PI;
        }

        var halfIdx = Math.floor(t * 2) % 2;
        var totalAngle = halfIdx % 2 === 0 ? flipAngle : Math.PI + flipAngle;
        this._mesh.rotation.y = totalAngle;

        // Swap texture at the edge-on moment (90° or 270°)
        var normAngle = ((totalAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        var shouldShowA = normAngle <= Math.PI / 2 || normAngle >= Math.PI * 3 / 2;
        if (shouldShowA !== this._showingA) {
            this._showingA = shouldShowA;
            this._mat.map = shouldShowA ? this._texA : this._texB;
            this._mat.needsUpdate = true;
        }
    };

    effect.dispose = function() {
        if (this._texA) { this._texA.dispose(); this._texA = null; }
        if (this._texB) { this._texB.dispose(); this._texB = null; }
    };

    EP.Registry.register(effect);
})();
