(function() {
    var effect = new EP.EffectBase('cube-rain-transition-pro', {
        name: 'Cube Rain Transition PRO',
        category: 'reveal-wipe',
        icon: 'CR',
        description: 'Transicion de imagen o video en lluvia de cubos 3D con reticula, profundidad y ciclo por slots'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 120, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Diagonal' }, { v: 'left-right', l: 'Izquierda a derecha' }, { v: 'right-left', l: 'Derecha a izquierda' }, { v: 'top-bottom', l: 'Arriba a abajo' }, { v: 'bottom-top', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'rows', type: 'range', min: 4, max: 32, default: 14, step: 1, label: 'Rows' },
        { key: 'columns', type: 'range', min: 4, max: 40, default: 22, step: 1, label: 'Columns' },
        { key: 'gap', type: 'range', min: 0, max: 18, default: 4, step: 1, label: 'Gap', unit: '%' },
        { key: 'depth', type: 'range', min: 0, max: 260, default: 110, step: 1, label: 'Cube Depth', unit: '%' },
        { key: 'spread', type: 'range', min: 0, max: 240, default: 90, step: 1, label: 'Rain Spread', unit: '%' },
        { key: 'cycleDuration', type: 'range', min: 15, max: 120, default: 46, step: 1, label: 'Exposure', unit: '%' },
        { key: 'background', type: 'color', default: '#08090d', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'high',
        minMedia: 1,
        exportSafe: true,
        hasErrorBoundary: true
    };

    function makeTileMaterial(texture, col, row, cols, rows, opacity) {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: texture },
                uUvMin: { value: new THREE.Vector2(col / cols, 1 - (row + 1) / rows) },
                uUvMax: { value: new THREE.Vector2((col + 1) / cols, 1 - row / rows) },
                uOpacity: { value: opacity }
            },
            vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: 'uniform sampler2D uTexture;uniform vec2 uUvMin;uniform vec2 uUvMax;uniform float uOpacity;varying vec2 vUv;void main(){vec2 uv=mix(uUvMin,uUvMax,vUv);vec4 c=texture2D(uTexture,uv);gl_FragColor=vec4(c.rgb,c.a*uOpacity);}',
            transparent: true,
            side: THREE.DoubleSide
        });
    }

    function orderFor(tile, direction) {
        var x = tile.col / Math.max(1, tile.cols - 1);
        var y = tile.row / Math.max(1, tile.rows - 1);
        if (direction === 'left-right') return x;
        if (direction === 'right-left') return 1 - x;
        if (direction === 'top-bottom') return y;
        if (direction === 'bottom-top') return 1 - y;
        return (x + y) * 0.5;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._mediaList = mediaList || [];
        if (!this._mediaList.length) return group;
        var cols = Math.max(4, Math.floor(this.settings.columns));
        var rows = Math.max(4, Math.floor(this.settings.rows));
        var w = 7.6;
        var h = 4.28;
        var tw = w / cols;
        var th = h / rows;
        var gap = Math.min(tw, th) * this.settings.gap / 100;
        this._texA = EP.Media.createTexture(this._mediaList[0]);
        this._texB = EP.Media.createTexture(this._mediaList[Math.min(1, this._mediaList.length - 1)]);
        this._tiles = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var geo = new THREE.BoxGeometry(Math.max(0.01, tw - gap), Math.max(0.01, th - gap), 0.055);
                var matA = makeTileMaterial(this._texA, c, r, cols, rows, 1);
                var matB = makeTileMaterial(this._texB, c, r, cols, rows, 0);
                var meshA = new THREE.Mesh(geo, matA);
                var meshB = new THREE.Mesh(geo.clone(), matB);
                var baseX = -w / 2 + tw / 2 + c * tw;
                var baseY = h / 2 - th / 2 - r * th;
                meshA.position.set(baseX, baseY, 0);
                meshB.position.set(baseX, baseY, -0.01);
                var wrap = new THREE.Group();
                wrap.add(meshA);
                wrap.add(meshB);
                wrap.userData = {
                    col: c,
                    row: r,
                    cols: cols,
                    rows: rows,
                    baseX: baseX,
                    baseY: baseY,
                    seed: Math.sin((c + 1) * 19.19 + (r + 1) * 7.31) * 0.5 + 0.5,
                    a: meshA,
                    b: meshB
                };
                group.add(wrap);
                this._tiles.push(wrap);
            }
        }
        this.group = group;
        this._mediaIndex = 0;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._tiles || !this._tiles.length) return;
        if (EP.Core && EP.Core.scene) EP.Core.scene.background = new THREE.Color(this.settings.background || '#08090d');
        EP.Media.updateTexture(this._texA);
        EP.Media.updateTexture(this._texB);
        var motionOn = this.settings.playbackMotion !== 'off';
        var speed = motionOn ? this.settings.playbackMotionSpeed / 100 : 0;
        var phase = motionOn ? ((time * Math.max(0.02, speed)) / Math.max(0.2, loopDuration || 8)) % 1 : 0;
        var exposure = Math.max(0.12, Math.min(0.92, this.settings.cycleDuration / 100));
        var depth = this.settings.depth / 100;
        var spread = this.settings.spread / 100;
        var dir = this.settings.motionDirection || 'auto';
        var nextMediaIndex = this._mediaList.length ? Math.floor(time * Math.max(0.01, speed) / Math.max(0.4, loopDuration || 8)) % this._mediaList.length : 0;
        if (nextMediaIndex !== this._mediaIndex && this._mediaList.length > 1) {
            this._mediaIndex = nextMediaIndex;
            if (this._texA) this._texA.dispose();
            if (this._texB) this._texB.dispose();
            this._texA = EP.Media.createTexture(this._mediaList[this._mediaIndex]);
            this._texB = EP.Media.createTexture(this._mediaList[(this._mediaIndex + 1) % this._mediaList.length]);
            this._tiles.forEach(function(tile) {
                tile.userData.a.material.uniforms.uTexture.value = this._texA;
                tile.userData.b.material.uniforms.uTexture.value = this._texB;
            }, this);
        }
        this.group.rotation.x = -0.08;
        this.group.rotation.y = Math.sin(time * 0.18) * 0.05;
        this._tiles.forEach(function(tile) {
            var d = tile.userData;
            var order = orderFor(d, dir);
            var local = (phase - order * (1 - exposure) + d.seed * 0.035) / exposure;
            local = Math.max(0, Math.min(1, local));
            var e = local * local * (3 - 2 * local);
            var pulse = Math.sin(e * Math.PI);
            tile.position.x = (d.seed - 0.5) * 0.65 * pulse * spread;
            tile.position.y = -pulse * 1.0 * spread;
            tile.position.z = pulse * 1.8 * depth;
            tile.rotation.x = pulse * (0.3 + d.seed * 0.7) * depth;
            tile.rotation.y = pulse * (d.seed - 0.5) * 1.2 * depth;
            d.a.material.uniforms.uOpacity.value = 1 - e;
            d.b.material.uniforms.uOpacity.value = e;
        });
    };

    EP.Registry.register(effect);
})();
