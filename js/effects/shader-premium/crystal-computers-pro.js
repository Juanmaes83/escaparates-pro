(function() {
    var effect = new EP.EffectBase('crystal-computers-pro', {
        name: 'Crystal Computers PRO',
        category: 'shader-premium',
        icon: 'CC',
        description: 'Composicion cristalina de modulos/computadores con pliegues caleidoscopicos'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'moduleCount', type: 'range', min: 4, max: 18, default: 9, step: 1, label: 'Modules' },
        { key: 'crystalFold', type: 'range', min: 0, max: 220, default: 115, step: 1, label: 'Crystal Fold', unit: '%' },
        { key: 'zoom', type: 'range', min: 40, max: 180, default: 100, step: 1, label: 'Zoom', unit: '%' },
        { key: 'accentColor', type: 'color', default: '#d95bff', label: 'Accent Color' },
        { key: 'background', type: 'color', default: '#05020b', label: 'Background' }
    ]);

    effect.capabilities = { supportsMotionDirection: true, supportsVideo: true, usesCamera: true, usesPostProcessing: false, usesParticlesShaders: true, mobileRisk: 'medium', minMedia: 0, exportSafe: true, hasErrorBoundary: true };

    function directionVector(value) {
        if (value === 'ltr') return new THREE.Vector2(1, 0);
        if (value === 'rtl') return new THREE.Vector2(-1, 0);
        if (value === 'ttb') return new THREE.Vector2(0, -1);
        if (value === 'btt') return new THREE.Vector2(0, 1);
        return new THREE.Vector2(0, 0);
    }

    function mediaAspect(media) {
        if (!media || !media.element) return 1;
        var el = media.element;
        return (el.videoWidth || el.naturalWidth || el.width || 1) / (el.videoHeight || el.naturalHeight || el.height || 1);
    }

    function fitMediaPlane(mesh, media, width, height) {
        var aspect = mediaAspect(media);
        var target = width / height;
        mesh.scale.set(1, 1, 1);
        if (!media || !media.element) return;
        if (aspect > target) {
            mesh.scale.y = target / aspect;
        } else {
            mesh.scale.x = aspect / target;
        }
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._modules = [];
        this._mediaSurfaces = [];
        mediaList = mediaList || [];
        var count = this.settings.moduleCount;
        for (var i = 0; i < count; i++) {
            var media = mediaList.length ? mediaList[i % mediaList.length] : null;
            var frame = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 1.28, 0.08),
                new THREE.MeshPhysicalMaterial({ color: 0x15151f, roughness: 0.18, metalness: 0.25, transmission: 0.35, transparent: true, opacity: 0.72 })
            );
            var screenMat = media ? EP.Media.createMaterial(media, { opacity: 0.96 }) : new THREE.MeshBasicMaterial({ color: new THREE.Color(this.settings.accentColor), transparent: true, opacity: 0.55, side: THREE.DoubleSide });
            var screen = new THREE.Mesh(
                new THREE.PlaneGeometry(0.64, 0.84),
                screenMat
            );
            screen.position.z = 0.061;
            fitMediaPlane(screen, media, 0.64, 0.84);
            screen.userData = { mediaScreen: true, media: media };
            frame.add(screen);
            group.add(frame);
            this._modules.push(frame);
            this._mediaSurfaces.push(screen);
        }
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._modules) return;
        if (this._mediaSurfaces) {
            this._mediaSurfaces.forEach(function(screen) {
                if (screen.material) EP.Media.updateMaterial(screen.material);
            });
        }
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var dir = directionVector(this.settings.motionDirection);
        var count = this._modules.length;
        var fold = this.settings.crystalFold / 100;
        var radius = 2.2 * this.settings.zoom / 100;
        for (var i = 0; i < count; i++) {
            var mesh = this._modules[i];
            var a = (i / count) * Math.PI * 2 + time * speed * 0.25;
            var kaleido = Math.sin(a * 3 + time * speed) * 0.42 * fold;
            mesh.position.set(Math.cos(a) * radius + dir.x * Math.sin(time + i) * 0.25, Math.sin(a * 2) * 0.55 + dir.y * 0.25, Math.sin(a) * 1.1);
            mesh.rotation.set(0.25 + kaleido, -a + Math.PI / 2, kaleido);
            mesh.scale.setScalar(0.78 + 0.18 * Math.sin(time * speed + i));
            if (mesh.children[0] && mesh.children[0].material && !mesh.children[0].material.map) {
                mesh.children[0].material.color.set(this.settings.accentColor);
            }
        }
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.scene.background = new THREE.Color(this.settings.background);
        EP.Core.camera.position.set(0, 0.1, 6.8);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        this._modules = null;
        this._mediaSurfaces = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    effect.applyPerformancePath = function(sample, amount, time) {
        if (!this._modules || !sample) return;
        var focus = new THREE.Vector3(sample.x * 2.2, sample.y * 1.2, 0);
        for (var i = 0; i < this._modules.length; i++) {
            var mesh = this._modules[i];
            var pulse = 0.5 + 0.5 * Math.sin((time || 0) * 3 + i);
            mesh.position.lerp(focus, 0.035 * amount * pulse);
            mesh.rotation.y += sample.x * 0.045 * amount;
            mesh.rotation.x += sample.y * 0.035 * amount;
            if (mesh.children[0] && mesh.children[0].material) {
                mesh.children[0].material.opacity = Math.min(0.9, 0.45 + pulse * 0.25 * amount);
            }
        }
    };

    EP.Registry.register(effect);
})();
