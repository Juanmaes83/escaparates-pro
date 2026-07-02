(function() {
    var effect = new EP.EffectBase('candy-stacker-pro', {
        name: 'Candy Stacker PRO',
        category: 'shader-premium',
        icon: 'CS',
        description: 'Stacker mecanico con piezas tipo candy, engranajes sugeridos y movimiento lateral'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'ltr', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'stackCount', type: 'range', min: 4, max: 18, default: 10, step: 1, label: 'Stack Count' },
        { key: 'candySize', type: 'range', min: 40, max: 180, default: 100, step: 1, label: 'Candy Size', unit: '%' },
        { key: 'mechanicalWave', type: 'range', min: 0, max: 220, default: 120, step: 1, label: 'Mechanical Wave', unit: '%' },
        { key: 'accentColor', type: 'color', default: '#7ef8ec', label: 'Accent Color' },
        { key: 'background', type: 'color', default: '#05100f', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'medium',
        minMedia: 0,
        exportSafe: true,
        hasErrorBoundary: true
    };

    function directionSign(value) {
        if (value === 'rtl' || value === 'btt') return -1;
        return 1;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._items = [];
        this._mediaSurfaces = [];
        mediaList = mediaList || [];
        var count = this.settings.stackCount;
        for (var i = 0; i < count; i++) {
            var geo = new THREE.BoxGeometry(1.15, 0.58, 0.34);
            var hue = (i / Math.max(1, count) + 0.42) % 1;
            var color = new THREE.Color().setHSL(hue, 0.82, 0.58);
            var mat = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.34,
                metalness: 0.12,
                emissive: new THREE.Color(this.settings.accentColor),
                emissiveIntensity: 0.05
            });
            var mesh = new THREE.Mesh(geo, mat);
            var media = mediaList.length ? mediaList[i % mediaList.length] : null;
            var faceMat = media ? EP.Media.createMaterial(media, { opacity: 0.98 }) : new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
            var face = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.50), faceMat);
            face.position.z = 0.176;
            face.userData = { mediaFace: true, media: media };
            mesh.add(face);
            mesh.position.x = (i - (count - 1) / 2) * 0.72;
            mesh.position.y = Math.sin(i * 0.7) * 0.28;
            mesh.rotation.z = (i % 2 ? -1 : 1) * 0.22;
            group.add(mesh);
            this._items.push(mesh);
            this._mediaSurfaces.push(face);
        }
        var railMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.settings.accentColor), transparent: true, opacity: 0.22 });
        var rail = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 0.05), railMat);
        rail.position.y = -1.05;
        group.add(rail);
        this._rail = rail;
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._items) return;
        if (this._mediaSurfaces) {
            this._mediaSurfaces.forEach(function(face) {
                if (face.material) EP.Media.updateMaterial(face.material);
            });
        }
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var sign = directionSign(this.settings.motionDirection);
        var count = this._items.length;
        var scale = this.settings.candySize / 100;
        var wave = this.settings.mechanicalWave / 100;
        for (var i = 0; i < count; i++) {
            var mesh = this._items[i];
            var phase = time * speed * 1.7 * sign - i * 0.38;
            var push = Math.max(0, Math.sin(phase)) * wave;
            mesh.position.x = (i - (count - 1) / 2) * 0.72 + push * 0.26 * sign;
            mesh.position.y = Math.sin(phase * 1.2) * 0.18 * wave;
            mesh.position.z = Math.cos(phase) * 0.18;
            mesh.rotation.z = (i % 2 ? -1 : 1) * 0.22 + Math.sin(phase) * 0.18;
            mesh.scale.setScalar(scale);
        }
        if (this._rail) {
            this._rail.material.color.set(this.settings.accentColor);
        }
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.scene.background = new THREE.Color(this.settings.background);
        EP.Core.camera.position.set(0, 0.2, 8.5);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        this._items = null;
        this._mediaSurfaces = null;
        this._rail = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    effect.applyPerformancePath = function(sample, amount, time) {
        if (!this._items || !sample) return;
        var count = this._items.length;
        var impactIndex = (sample.progress || 0) * Math.max(1, count - 1);
        for (var i = 0; i < count; i++) {
            var mesh = this._items[i];
            var distance = Math.abs(i - impactIndex);
            var hit = Math.max(0, 1 - distance / 3);
            var rush = Math.sin((time || 0) * 8 + i * 0.4) * hit * amount;
            mesh.position.x += sample.x * hit * 0.55 * amount;
            mesh.position.y += Math.abs(sample.y) * hit * 0.28 * amount;
            mesh.rotation.z += rush * 0.22;
            mesh.scale.multiplyScalar(1 + hit * 0.10 * amount);
        }
    };

    EP.Registry.register(effect);
})();
