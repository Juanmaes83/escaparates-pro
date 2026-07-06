(function() {
    var effect = new EP.EffectBase('pseudo-3d', {
        name: 'Pseudo 3D',
        category: '3d-perspective',
        icon: '🎭',
        description: 'Parallax multicapa — planos independientes con desplazamiento por profundidad, movimiento de cámara y separación de capas estilo ditther.com Pseudo-3D'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'numLayers', type: 'range', min: 2, max: 6, default: 4, step: 1, label: 'Número de capas' },
        { key: 'layerSep', type: 'range', min: 5, max: 60, default: 25, step: 5, label: 'Separación capas', unit: '%' },
        { key: 'parallaxAmt', type: 'range', min: 10, max: 200, default: 80, step: 10, label: 'Intensidad parallax', unit: '%' },
        { key: 'camMotion', type: 'select', options: [
            { v: 'drift', l: 'Deriva suave (auto)' },
            { v: 'mouse', l: 'Seguir ratón' },
            { v: 'orbit', l: 'Órbita circular' },
            { v: 'none', l: 'Sin movimiento cámara' }
        ], default: 'drift', label: 'Movimiento cámara' },
        { key: 'camSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad cámara' },
        { key: 'layerStyle', type: 'select', options: [
            { v: 'depth', l: 'Niebla de profundidad' },
            { v: 'threshold', l: 'Umbrales de luminosidad' },
            { v: 'hue', l: 'Separación por matiz' },
            { v: 'color', l: 'Color plano por capa' }
        ], default: 'depth', label: 'Estilo capas' }
    ]);

    var LAYER_COLORS = [
        new THREE.Color('#88aaff'),
        new THREE.Color('#ff88aa'),
        new THREE.Color('#88ffaa'),
        new THREE.Color('#ffcc44'),
        new THREE.Color('#cc44ff'),
        new THREE.Color('#44ccff')
    ];

    function buildLayers(self, group, N) {
        // Defensive: always ensure arrays exist
        if (!self._planes)    self._planes    = [];
        if (!self._materials) self._materials = [];

        // Dispose and remove old planes
        for (var i = 0; i < self._planes.length; i++) {
            group.remove(self._planes[i]);
            if (self._materials[i]) self._materials[i].dispose();
        }
        self._planes    = [];
        self._materials = [];

        var sep = self.settings.layerSep / 100;
        for (var j = 0; j < N; j++) {
            var t = (N > 1) ? (j / (N - 1)) : 0;
            var zPos = -1.5 + j * sep * 3.5;
            var scale = 0.82 + t * 0.36;
            var geo = new THREE.PlaneGeometry(8 * scale, 4.5 * scale);
            var mat;
            if (j === 0 && self._mediaTexture) {
                // Back layer: full image, stationary
                mat = new THREE.MeshBasicMaterial({
                    map: self._mediaTexture,
                    transparent: false,
                    depthWrite: false
                });
            } else if (j === 0) {
                // Back layer without media: solid dark color
                mat = new THREE.MeshBasicMaterial({
                    color: LAYER_COLORS[0],
                    transparent: false,
                    depthWrite: false
                });
            } else {
                // Front layers: semi-transparent color planes that move with parallax
                mat = new THREE.MeshBasicMaterial({
                    color: LAYER_COLORS[(j - 1) % LAYER_COLORS.length],
                    transparent: true,
                    depthWrite: false,
                    opacity: 0.12 + t * 0.08
                });
            }
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = zPos;
            mesh.userData.depth = t;
            mesh.userData.idx   = j;
            group.add(mesh);
            self._planes.push(mesh);
            self._materials.push(mat);
        }
        self._lastN = N;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._planes       = [];
        this._materials    = [];
        this._mediaTexture = null;
        this._m0           = null;
        this._texReady     = false;
        this._mx           = 0;
        this._my           = 0;
        this._lastN        = -1;

        var m0 = mediaList && mediaList[0];
        if (m0) {
            this._m0 = m0;
            if (m0.texture && m0.texture.image) {
                this._mediaTexture = m0.texture;
                this._texReady = true;
            }
        }

        var N = Math.max(2, Math.min(6, Math.round(this.settings.numLayers)));
        buildLayers(this, group, N);

        var self = this;
        var dom = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
        if (dom) {
            this._onMouseMove = function(e) {
                var r = dom.getBoundingClientRect();
                self._mx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
                self._my = -((e.clientY - r.top)  / r.height - 0.5) * 2;
            };
            dom.addEventListener('mousemove', this._onMouseMove);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        // Defensive init in case build was never called
        if (!this._planes)    this._planes    = [];
        if (!this._materials) this._materials = [];

        // Poll for texture if not yet available at build time
        if (!this._texReady && this._m0) {
            var t = this._m0.texture;
            if (t && t.image) {
                this._mediaTexture = t;
                this._texReady = true;
                this._lastN = -1;  // force layer rebuild with the new texture
            }
        }
        // Keep video texture updated every frame
        if (this._mediaTexture && this._m0 && this._m0.element &&
                this._m0.element.tagName === 'VIDEO' && this._m0.element.readyState >= 2) {
            this._mediaTexture.needsUpdate = true;
        }

        var N = Math.max(2, Math.min(6, Math.round(this.settings.numLayers)));
        if (this._lastN !== N) {
            try { buildLayers(this, this.group, N); } catch(e) {
                this._planes = []; this._materials = []; this._lastN = -1; return;
            }
        }

        var parallax  = this.settings.parallaxAmt / 100;
        var camSpd    = this.settings.camSpeed * 0.08;
        var camMotion = this.settings.camMotion;
        var layerStyle = this.settings.layerStyle;
        var sep = this.settings.layerSep / 100;

        var camX = 0, camY = 0;
        switch(camMotion) {
            case 'drift':
                camX = Math.sin(time * camSpd * 0.4) * 0.6;
                camY = Math.cos(time * camSpd * 0.25) * 0.4;
                break;
            case 'mouse':
                camX = this._mx * 0.8;
                camY = this._my * 0.5;
                break;
            case 'orbit':
                camX = Math.cos(time * camSpd * 0.5) * 0.7;
                camY = Math.sin(time * camSpd * 0.5) * 0.4;
                break;
        }

        for (var i = 0; i < this._planes.length; i++) {
            var plane = this._planes[i];
            var depth = plane.userData.depth;
            var pFactor = depth * parallax;

            plane.position.x = -camX * pFactor * 0.8;
            plane.position.y = -camY * pFactor * 0.5;
            plane.position.z = -1.5 + i * sep * 3.5;

            var op;
            switch(layerStyle) {
                case 'depth':     op = 0.15 + depth * 0.75; break;
                case 'threshold': op = 0.20 + depth * 0.70; break;
                case 'hue':       op = 0.25 + depth * 0.65; break;
                default:          op = 0.25 + depth * 0.65;
            }
            this._materials[i].opacity = op;

            var breathe = 1 + Math.sin(time * 0.4 + depth * Math.PI) * 0.012;
            plane.scale.set(breathe, breathe, 1);
        }
    };

    effect.dispose = function() {
        var dom = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
        if (dom && this._onMouseMove) dom.removeEventListener('mousemove', this._onMouseMove);
        if (this._materials) {
            for (var i = 0; i < this._materials.length; i++) {
                if (this._materials[i]) this._materials[i].dispose();
            }
        }
        this._planes = []; this._materials = [];
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
