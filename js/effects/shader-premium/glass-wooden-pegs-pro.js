(function() {
    var effect = new EP.EffectBase('glass-wooden-pegs-pro', {
        name: 'Glass Wooden Pegs PRO',
        category: 'shader-premium',
        icon: 'GP',
        description: 'Campo de pegs de madera y vidrio con reflejos, altura procedural y camara orbital'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'pegCount', type: 'range', min: 4, max: 12, default: 8, step: 1, label: 'Peg Grid' },
        { key: 'heightWave', type: 'range', min: 0, max: 220, default: 120, step: 1, label: 'Height Wave', unit: '%' },
        { key: 'glassMix', type: 'range', min: 0, max: 200, default: 90, step: 1, label: 'Glass Mix', unit: '%' },
        { key: 'accentColor', type: 'color', default: '#63eaff', label: 'Glass Color' },
        { key: 'background', type: 'color', default: '#050704', label: 'Background' }
    ]);

    effect.capabilities = { supportsMotionDirection: true, supportsVideo: false, usesCamera: true, usesPostProcessing: false, usesParticlesShaders: false, mobileRisk: 'medium', minMedia: 0, exportSafe: true, hasErrorBoundary: true };

    effect.build = function() {
        var group = new THREE.Group();
        this._pegs = [];
        var n = this.settings.pegCount;
        for (var x = 0; x < n; x++) {
            for (var z = 0; z < n; z++) {
                var glass = (x + z) % 3 === 0;
                var mat = glass ? new THREE.MeshPhysicalMaterial({ color: new THREE.Color(this.settings.accentColor), transparent: true, opacity: 0.45, roughness: 0.08, metalness: 0.05, transmission: 0.4 }) : new THREE.MeshStandardMaterial({ color: 0x9b5c24, roughness: 0.55, metalness: 0.02 });
                var peg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1, 14), mat);
                peg.position.set((x - (n - 1) / 2) * 0.42, 0, (z - (n - 1) / 2) * 0.42);
                group.add(peg);
                this._pegs.push({ mesh: peg, x: x, z: z, glass: glass });
            }
        }
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._pegs) return;
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var wave = this.settings.heightWave / 100;
        for (var i = 0; i < this._pegs.length; i++) {
            var item = this._pegs[i];
            var h = 0.35 + Math.max(0, Math.sin(time * speed * 1.3 + item.x * 0.7 + item.z * 0.45)) * wave;
            item.mesh.scale.y = h;
            item.mesh.position.y = h * 0.5 - 0.8;
            if (item.glass) {
                item.mesh.material.color.set(this.settings.accentColor);
                item.mesh.material.opacity = Math.min(0.8, 0.25 + this.settings.glassMix / 250);
            }
        }
        this.group.rotation.y = time * speed * 0.16;
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.scene.background = new THREE.Color(this.settings.background);
        EP.Core.camera.position.set(0, 2.2, 5.4);
        EP.Core.camera.lookAt(0, -0.35, 0);
    };

    effect.dispose = function() {
        this._pegs = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    effect.applyPerformancePath = function(sample, amount) {
        if (!this._pegs || !sample) return;
        var focusX = sample.x * 2.1;
        var focusZ = sample.y * 1.35;
        for (var i = 0; i < this._pegs.length; i++) {
            var item = this._pegs[i];
            var dx = item.mesh.position.x - focusX;
            var dz = item.mesh.position.z - focusZ;
            var influence = Math.max(0, 1 - Math.sqrt(dx * dx + dz * dz) / 1.8);
            item.mesh.scale.y += influence * 0.75 * amount;
            item.mesh.position.y += influence * 0.35 * amount;
            if (item.glass && item.mesh.material) {
                item.mesh.material.opacity = Math.min(0.92, item.mesh.material.opacity + influence * 0.25 * amount);
            }
        }
    };

    EP.Registry.register(effect);
})();
