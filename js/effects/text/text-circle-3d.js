// 3D Text Circle — procedural equivalent of "3D Text Circle Animation" by David Faure
// (source read & understood: github.com/Juanmaes83/3d-text-circle-animation-codrops).
// The original uses three-msdf-text-utils (MSDF font atlas + npm package) to arrange
// words around a ring, each word rotated to align tangentially with its position
// (rotation.z = index/total * 2π), spun by scroll/drag momentum. Here each word is
// rendered on its own canvas texture (no external MSDF atlas/build step needed) using
// the exact same circular layout math, with mouse-drag momentum and a legible media
// plane behind the ring.
(function() {
    var effect = new EP.EffectBase('text-circle-3d', {
        name: '3D Text Circle',
        category: 'text',
        icon: '🎡',
        description: 'Anillo de palabras en 3D que gira con inercia al arrastrar el ratón, cada palabra inclinada tangencialmente como los radios de una rueda — imagen o video del cliente legible detrás'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'wordsList', type: 'text', default: 'Diseño, Presencia, Impacto, Marca, Premium, Escaparate, Detalle, Luz, Espacio, Forma',
          label: 'Palabras (separadas por coma)' },
        { key: 'fontSize', type: 'range', min: 40, max: 160, default: 90, step: 10, label: 'Tamaño de letra', unit: 'px' },
        { key: 'textColor', type: 'color', default: '#f5f5f5', label: 'Color texto' },
        { key: 'radius', type: 'range', min: 100, max: 250, default: 150, step: 5, label: 'Radio del anillo', unit: '%' },
        { key: 'circleSpeed', type: 'range', min: 0, max: 100, default: 30, step: 5, label: 'Velocidad giro automático', unit: '%' },
        { key: 'mouseSpeed', type: 'range', min: 0, max: 200, default: 100, step: 10, label: 'Sensibilidad arrastre ratón', unit: '%' },
        { key: 'tilt', type: 'range', min: 0, max: 100, default: 35, step: 5, label: 'Inclinación de cámara', unit: '%' },
        { key: 'bgOverlay', type: 'range', min: 0, max: 90, default: 45, step: 5, label: 'Oscurecer fondo', unit: '%' }
    ]);

    function makeWordTexture(word, fontPx, color) {
        var cvs = document.createElement('canvas');
        var ctx = cvs.getContext('2d');
        ctx.font = '800 ' + fontPx + 'px Arial, sans-serif';
        var w = Math.max(64, Math.ceil(ctx.measureText(word).width) + 40);
        var h = fontPx * 1.5;
        cvs.width = w; cvs.height = h;
        ctx.font = '800 ' + fontPx + 'px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(word, w / 2, h / 2);
        var tex = new THREE.CanvasTexture(cvs);
        tex.minFilter = THREE.LinearFilter;
        return { tex: tex, aspect: w / h };
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._m0 = (mediaList && mediaList[0]) || null;
        this._bgMat = null;
        if (this._m0) {
            var bgMat = EP.Media.createMaterial(this._m0);
            var bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), bgMat);
            bgMesh.position.z = -3;
            group.add(bgMesh);
            this._bgMat = bgMat;
            var ovMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false });
            var ovMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), ovMat);
            ovMesh.position.z = -2.9;
            group.add(ovMesh);
            this._overlayMat = ovMat;
        }

        this._ring = new THREE.Group();
        group.add(this._ring);
        this._wordMeshes = [];
        this._lastWordsKey = '';

        this._angle = 0;
        this._angleVel = 0;
        this._mx = 0; this._prevMx = 0;
        this._hasMouse = false;
        this._dragging = false;

        var self = this;
        var dom = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
        if (dom) {
            this._onMouseMove = function(e) {
                var r = dom.getBoundingClientRect();
                var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
                if (self._hasMouse) self._angleVel += (nx - self._mx) * 2.2;
                self._mx = nx;
                self._hasMouse = true;
            };
            dom.addEventListener('mousemove', this._onMouseMove);
            this._dom = dom;
        }

        this.group = group;
        return group;
    };

    effect._rebuildWords = function(words, fontPx, color, radius) {
        var self = this;
        this._wordMeshes.forEach(function(m) { self._ring.remove(m); m.geometry.dispose(); m.material.dispose(); });
        this._wordMeshes = [];

        var n = words.length;
        for (var i = 0; i < n; i++) {
            var w = makeWordTexture(words[i], fontPx, color);
            var h = 0.9;
            var geo = new THREE.PlaneGeometry(h * w.aspect, h);
            var mat = new THREE.MeshBasicMaterial({ map: w.tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData.baseAngle = (i / n) * Math.PI * 2;
            mesh.userData.radius = radius;
            this._ring.add(mesh);
            this._wordMeshes.push(mesh);
        }
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        dt = Math.min(dt || 0.016, 0.05);

        var wordsRaw = (this.settings.wordsList || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        if (!wordsRaw.length) wordsRaw = ['Escaparate'];
        var fontPx = this.settings.fontSize;
        var color = this.settings.textColor || '#f5f5f5';
        var radius = 2.6 * (this.settings.radius / 150);
        var key = wordsRaw.join('|') + '_' + fontPx + '_' + color + '_' + radius.toFixed(2);

        if (key !== this._lastWordsKey) {
            this._rebuildWords(wordsRaw, fontPx, color, radius);
            this._lastWordsKey = key;
        }

        // Auto rotation + mouse-drag momentum (decays like the source's lerp-based speed)
        var autoSpd = (this.settings.circleSpeed / 100) * 0.35;
        var mouseSpd = this.settings.mouseSpeed / 100;
        this._angleVel *= 0.9;
        this._angle += (autoSpd + this._angleVel * mouseSpd) * dt;

        var n = this._wordMeshes.length;
        for (var i = 0; i < n; i++) {
            var mesh = this._wordMeshes[i];
            var theta = mesh.userData.baseAngle - this._angle;
            var r = mesh.userData.radius;
            mesh.position.set(Math.cos(theta) * r, Math.sin(theta) * r * 0.42, Math.sin(theta) * 0.3);
            mesh.rotation.z = theta;
            var depthFade = 0.55 + 0.45 * ((Math.cos(theta) + 1) * 0.5);
            mesh.material.opacity = depthFade;
        }

        var tiltAmt = (this.settings.tilt / 100) * 0.5;
        this._ring.rotation.x = -tiltAmt + (this._hasMouse ? this._prevMx * 0.05 : 0);

        if (this._overlayMat) this._overlayMat.opacity = this.settings.bgOverlay / 100;
    };

    effect.dispose = function() {
        if (this._dom && this._onMouseMove) this._dom.removeEventListener('mousemove', this._onMouseMove);
        this._dom = null; this._onMouseMove = null;
        this._wordMeshes = null; this._ring = null; this._bgMat = null; this._overlayMat = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
