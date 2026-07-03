(function() {
    var effect = new EP.EffectBase('parallax-multicapa', {
        name: 'Parallax Multicapa',
        category: 'parallax',
        icon: '🏞️',
        description: 'Capas de imagen en paralaje 3D — profundidad Z con separación por cursor o auto-float'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'layers', type: 'range', min: 2, max: 6, default: 4, step: 1, label: 'Capas' },
        { key: 'depthScale', type: 'range', min: 10, max: 100, default: 40, step: 5, label: 'Profundidad paralaje', unit: '%' },
        { key: 'floatSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad auto-float' },
        { key: 'smoothing', type: 'range', min: 5, max: 20, default: 8, step: 1, label: 'Suavizado seguimiento' },
        { key: 'zSpread', type: 'range', min: 1, max: 30, default: 10, step: 1, label: 'Separación Z' },
        { key: 'scaleByDepth', type: 'select', options: [{ v: 'on', l: 'Sí (óptico)' }, { v: 'off', l: 'No' }], default: 'on', label: 'Escala óptica' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var ml = mediaList || [];
        var nLayers = Math.min(Math.round(this.settings.layers), Math.max(1, ml.length || 1));
        var zSpread = this.settings.zSpread * 0.05;

        this._meshes = [];
        for (var i = 0; i < nLayers; i++) {
            var m = ml.length > 0 ? ml[i % ml.length] : null;
            var geo = new THREE.PlaneGeometry(8.5, 4.8);
            var mat = m ? EP.Media.createMaterial(m) : new THREE.MeshBasicMaterial({ color: 0x112233, transparent: true });
            var mesh = new THREE.Mesh(geo, mat);
            var depth = i / Math.max(1, nLayers - 1); // 0=front, 1=back
            mesh.position.z = -depth * zSpread;
            if (this.settings.scaleByDepth === 'on') {
                var sc = 1 + depth * 0.15;
                mesh.scale.set(sc, sc, 1);
            }
            group.add(mesh);
            this._meshes.push({ mesh: mesh, depth: depth, baseZ: -depth * zSpread });
        }

        this._mouseX = 0; this._mouseY = 0;
        this._curX = 0; this._curY = 0;
        var self = this;
        this._onMouseMove = function(e) {
            var canvas = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            self._mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            self._mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        };
        window.addEventListener('mousemove', this._onMouseMove);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._meshes) return;
        var depthScale = this.settings.depthScale / 100;
        var sm = Math.min(1, (this.settings.smoothing / 100) * (dt || 0.016) * 60);
        var fspd = this.settings.floatSpeed * 0.2;

        var targetX = this._mouseX + Math.sin(time * fspd * 0.25) * 0.3;
        var targetY = this._mouseY + Math.cos(time * fspd * 0.2) * 0.2;
        this._curX += (targetX - this._curX) * sm;
        this._curY += (targetY - this._curY) * sm;

        for (var i = 0; i < this._meshes.length; i++) {
            var layer = this._meshes[i];
            var move = layer.depth * depthScale;
            layer.mesh.position.x = this._curX * move * 2;
            layer.mesh.position.y = this._curY * move * 1.2;
            layer.mesh.position.z = layer.baseZ;
            // Subtle breathing
            var br = Math.sin(time * 0.4 + i * 0.8) * 0.01;
            layer.mesh.rotation.y = this._curX * 0.03 * (1 + layer.depth);
            layer.mesh.rotation.x = -this._curY * 0.02 * (1 + layer.depth) + br;
        }
    };

    effect.dispose = function() {
        if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
        this._meshes = null;
    };

    EP.Registry.register(effect);
})();
