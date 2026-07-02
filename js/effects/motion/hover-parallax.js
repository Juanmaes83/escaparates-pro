(function() {
    var effect = new EP.EffectBase('hover-parallax', {
        name: 'Hover Parallax',
        category: 'motion',
        icon: '🖱️',
        description: 'Parallax multicapa reactivo al ratón — profundidad 3D interactiva'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'depth', type: 'range', min: 5, max: 60, default: 25, step: 1, label: 'Profundidad', unit: 'px' },
        { key: 'layers', type: 'range', min: 2, max: 4, default: 3, step: 1, label: 'Capas' },
        { key: 'smoothing', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Suavidad' },
        { key: 'autoFloat', type: 'select', options: [{ v: 'on', l: 'Auto float' }, { v: 'off', l: 'Solo mouse' }], default: 'on', label: 'Flotación auto' },
        { key: 'floatSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad float' },
        { key: 'vignette', type: 'range', min: 0, max: 100, default: 40, step: 5, label: 'Viñeta', unit: '%' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();

        this._layers = [];
        var numLayers = Math.round(this.settings.layers);
        var self = this;

        // Build layer meshes — each slightly different Z for 3D depth
        for (var i = 0; i < numLayers; i++) {
            var scale = 1 + i * 0.08; // outer layers slightly bigger
            var geo = new THREE.PlaneGeometry(8 * scale, 4.5 * scale);
            var mat;
            var mediaIdx = Math.min(i, (mediaList ? mediaList.length - 1 : 0));
            if (mediaList && mediaList.length > 0) {
                mat = EP.Media.createMaterial(mediaList[mediaIdx] || mediaList[0]);
            } else {
                mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1 + i * 0.05, 0.1, 0.15), transparent: true });
            }
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = -0.3 + i * 0.15;
            group.add(mesh);
            this._layers.push({ mesh: mesh, depth: (i + 1) / numLayers });
        }

        // Target and current mouse position (normalized -1..1)
        this._targetX = 0; this._targetY = 0;
        this._currentX = 0; this._currentY = 0;

        // Listen to mouse on the canvas
        this._onMouseMove = function(e) {
            var canvas = document.querySelector('canvas');
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            self._targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            self._targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        };
        window.addEventListener('mousemove', this._onMouseMove);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        var smoothFactor = Math.min(1, (this.settings.smoothing / 100) * (dt || 0.016) * 60);
        var depth = this.settings.depth / 100;

        // Auto-float when no mouse or setting enabled
        var autoFloat = this.settings.autoFloat === 'on';
        var floatSpeed = this.settings.floatSpeed / 10;
        if (autoFloat) {
            var floatX = Math.sin(time * floatSpeed * 0.3) * 0.4;
            var floatY = Math.cos(time * floatSpeed * 0.2) * 0.3;
            // Blend mouse + float
            this._targetX = floatX;
            this._targetY = floatY;
        }

        // Smooth toward target
        this._currentX += (this._targetX - this._currentX) * smoothFactor;
        this._currentY += (this._targetY - this._currentY) * smoothFactor;

        // Apply parallax to each layer
        for (var i = 0; i < this._layers.length; i++) {
            var layer = this._layers[i];
            var layerDepth = layer.depth;
            layer.mesh.position.x = this._currentX * depth * layerDepth;
            layer.mesh.position.y = this._currentY * depth * layerDepth;
            // Subtle rotation for 3D feel
            layer.mesh.rotation.y = this._currentX * 0.05 * layerDepth;
            layer.mesh.rotation.x = -this._currentY * 0.05 * layerDepth;
        }
    };

    effect.dispose = function() {
        if (this._onMouseMove) {
            window.removeEventListener('mousemove', this._onMouseMove);
            this._onMouseMove = null;
        }
        this._layers = [];
    };

    EP.Registry.register(effect);
})();
