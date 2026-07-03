// Video Projection Grid — adapted from Efetivos/video-projection-codrops
// (source read & understood: js/Models.js — a single VideoTexture is shared
// across a 3D grid of tiles, each remapping its UV attribute to its own crop
// of the source, so together they reconstruct the full image/video as a
// puzzle of independently animatable 3D tiles). Each tile gets a fixed subtle
// facet tilt (catches studio light differently per piece, like shattered
// glass), a soft drop-shadow card behind it, and a lit shader with bevel
// darkening at its edges — instead of a flat unlit image cut into squares.
(function() {
    var effect = new EP.EffectBase('video-projection-grid', {
        name: 'Video Projection Grid',
        category: 'grid',
        icon: '🧩',
        description: 'Mosaico 3D con luz de estudio y facetas — una sola imagen o video se reparte en teselas independientes (recorte UV real) que emergen, flotan y se recomponen en la foto nítida',
        capabilities: { supportsVideo: true }
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'gridCols', type: 'range', min: 3, max: 16, default: 8, step: 1, label: 'Columnas' },
        { key: 'tileGap', type: 'range', min: 0, max: 40, default: 10, step: 2, label: 'Separación teselas', unit: '%' },
        { key: 'animMode', type: 'select', options: [
            { v: 'emerge',  l: 'Emergencia y recomposición' },
            { v: 'wave',    l: 'Ola suave' },
            { v: 'explode', l: 'Explosión y reconstrucción' },
            { v: 'still',   l: 'Estático (mosaico fijo)' }
        ], default: 'emerge', label: 'Modo animación' },
        { key: 'animSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad animación' },
        { key: 'facetTilt', type: 'range', min: 0, max: 100, default: 55, step: 5, label: 'Facetado (catch-light)', unit: '%' },
        { key: 'hoverDepth', type: 'range', min: 0, max: 100, default: 75, step: 5, label: 'Empuje hover cursor', unit: '%' },
        { key: 'fogIntensity', type: 'range', min: 0, max: 100, default: 35, step: 5, label: 'Niebla de profundidad', unit: '%' }
    ]);

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    var _vert = [
        'attribute vec2 uvLocal;',
        'varying vec2 vUv;',
        'varying vec2 vUvLocal;',
        'varying vec3 vNormalW;',
        'void main() {',
        '  vUv = uv;',
        '  vUvLocal = uvLocal;',
        '  vNormalW = normalize(mat3(modelMatrix) * normal);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var _frag = [
        'uniform sampler2D uMedia;',
        'uniform float uOpacity;',
        'uniform float uBrightness;',
        'varying vec2 vUv;',
        'varying vec2 vUvLocal;',
        'varying vec3 vNormalW;',
        'void main() {',
        '  vec4 col = texture2D(uMedia, vUv);',
        '  col.rgb = (col.rgb - 0.5) * 1.1 + 0.5;',
        '  col.rgb *= 1.06;',
        // Bevel: darken near the tile's own edges (independent of image UV)
        '  float bw = 0.09;',
        '  float ex = min(smoothstep(0.0, bw, vUvLocal.x), smoothstep(1.0, 1.0 - bw, vUvLocal.x));',
        '  float ey = min(smoothstep(0.0, bw, vUvLocal.y), smoothstep(1.0, 1.0 - bw, vUvLocal.y));',
        '  float bevel = mix(0.45, 1.0, min(ex, ey));',
        // Studio lambert — varies per tile thanks to each tile's own fixed facet tilt
        '  vec3 n = normalize(vNormalW);',
        '  float key = max(dot(n, normalize(vec3(0.4, 0.65, 0.6))), 0.0);',
        '  float lighting = 0.5 + key * 0.6;',
        '  col.rgb *= bevel * lighting * uBrightness;',
        '  gl_FragColor = vec4(col.rgb, uOpacity);',
        '}'
    ].join('\n');

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._m0 = (mediaList && mediaList[0]) || null;
        this._mediaTexture = null;
        this._texReady = false;
        this._demoCvs = document.createElement('canvas');
        this._demoCvs.width = 512; this._demoCvs.height = 288;
        this._demoCtx = this._demoCvs.getContext('2d');
        this._demoTex = new THREE.CanvasTexture(this._demoCvs);
        this._mx = 0; this._my = 0;
        this._hasMouse = false;
        this._tiles = null;
        this._lastCols = -1;
        this._emergeStart = null;
        this._springOff = null;
        this._springVel = null;

        var self = this;
        var dom = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
        if (dom) {
            this._onMouseMove = function(e) {
                var r = dom.getBoundingClientRect();
                self._mx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
                self._my = -((e.clientY - r.top)  / r.height - 0.5) * 2;
                self._hasMouse = true;
            };
            dom.addEventListener('mousemove', this._onMouseMove);
            this._dom = dom;
        }

        if (this._m0 && this._m0.element && EP.Media && EP.Media.createTexture) {
            this._mediaTexture = EP.Media.createTexture(this._m0);
            this._texReady = !!this._mediaTexture;
        }

        this.group = group;
        return group;
    };

    effect._rebuildGrid = function(cols, rows, gap, facetAmt) {
        var self = this;
        if (this._tiles) {
            this._tiles.forEach(function(tile) {
                self.group.remove(tile.mesh); tile.mesh.geometry.dispose(); tile.mesh.material.dispose();
                self.group.remove(tile.shadow); tile.shadow.geometry.dispose(); tile.shadow.material.dispose();
            });
        }
        this._tiles = [];
        var cellW = 8 / cols, cellH = 4.5 / rows;
        var startX = -4 + cellW * 0.5, startY = 2.25 - cellH * 0.5;
        var count = cols * rows;
        this._springOff = new Float32Array(count * 3);
        this._springVel = new Float32Array(count * 3);

        var sharedTex = this._texReady ? this._mediaTexture : this._demoTex;
        var tileW = cellW * (1 - gap), tileH = cellH * (1 - gap);

        var idx = 0;
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var geo = new THREE.PlaneGeometry(tileW, tileH);
                var uvAttr = geo.attributes.uv;
                var localArr = new Float32Array(uvAttr.count * 2);
                var u0 = col / cols, v0 = 1 - (row + 1) / rows;
                var uw = 1 / cols, vh = 1 / rows;
                for (var i = 0; i < uvAttr.count; i++) {
                    var ou = uvAttr.getX(i), ov = uvAttr.getY(i);
                    localArr[i * 2] = ou; localArr[i * 2 + 1] = ov;
                    uvAttr.setXY(i, u0 + ou * uw, v0 + ov * vh);
                }
                uvAttr.needsUpdate = true;
                geo.setAttribute('uvLocal', new THREE.BufferAttribute(localArr, 2));

                var mat = new THREE.ShaderMaterial({
                    vertexShader: _vert, fragmentShader: _frag,
                    uniforms: {
                        uMedia:      { value: sharedTex },
                        uOpacity:    { value: 1 },
                        uBrightness: { value: 1 }
                    },
                    transparent: true, depthWrite: true
                });
                var mesh = new THREE.Mesh(geo, mat);
                var bx = startX + col * cellW, by = startY + row * cellH;
                mesh.position.set(bx, by, 0);
                // Fixed per-tile facet tilt — each piece catches the key light
                // slightly differently, like shards of a mirror mosaic.
                var seed = (col * 928.7 + row * 371.3);
                var jx = (Math.sin(seed) * 0.5) * facetAmt;
                var jy = (Math.cos(seed * 1.7) * 0.5) * facetAmt;
                mesh.rotation.x = jx;
                mesh.rotation.y = jy;
                this.group.add(mesh);

                // Soft drop-shadow card behind each tile for depth separation
                var shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
                var shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(tileW * 1.14, tileH * 1.14), shadowMat);
                shadowMesh.position.set(bx + tileW * 0.035, by - tileH * 0.035, -0.04);
                this.group.add(shadowMesh);

                this._tiles.push({ mesh: mesh, shadow: shadowMesh, mat: mat, shadowMat: shadowMat,
                    bx: bx, by: by, row: row, col: col, idx: idx, jx: jx, jy: jy });
                idx++;
            }
        }
        this._lastCols = cols;
        this._emergeStart = null;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        dt = Math.min(dt || 0.016, 0.05);

        if (!this._texReady && this._m0 && this._m0.element && EP.Media && EP.Media.createTexture) {
            this._mediaTexture = EP.Media.createTexture(this._m0);
            this._texReady = !!this._mediaTexture;
        }
        if (this._texReady && EP.Media && EP.Media.updateTexture) {
            EP.Media.updateTexture(this._mediaTexture);
        }

        if (!this._texReady) {
            var dc = this._demoCtx, W = this._demoCvs.width, H = this._demoCvs.height;
            var g = dc.createLinearGradient(0, 0, W, H);
            g.addColorStop(0,   'hsl(' + ((time * 22) % 360) + ',85%,60%)');
            g.addColorStop(0.5, 'hsl(' + ((time * 22 + 110) % 360) + ',80%,55%)');
            g.addColorStop(1,   'hsl(' + ((time * 22 + 240) % 360) + ',85%,50%)');
            dc.fillStyle = g; dc.fillRect(0, 0, W, H);
            this._demoTex.needsUpdate = true;
        }

        var cols = Math.max(3, Math.round(this.settings.gridCols));
        var rows = Math.max(2, Math.round(cols * (4.5 / 8)));
        var gap = this.settings.tileGap / 100;
        var facetAmt = (this.settings.facetTilt / 100) * 0.35;

        if (!this._tiles || this._lastCols !== cols) {
            this._rebuildGrid(cols, rows, gap, facetAmt);
        }
        var newTex = this._texReady ? this._mediaTexture : this._demoTex;
        if (this._tiles.length && this._tiles[0].mat.uniforms.uMedia.value !== newTex) {
            for (var mi = 0; mi < this._tiles.length; mi++) this._tiles[mi].mat.uniforms.uMedia.value = newTex;
        }

        if (this._emergeStart === null) this._emergeStart = time;
        var animMode = this.settings.animMode;
        var spd = this.settings.animSpeed;
        var fog = this.settings.fogIntensity / 100;
        var hoverR = 1.1;
        var hoverForce = (this.settings.hoverDepth / 100) * 18;

        var mwx = this._mx * 4, mwy = this._my * 2.25;
        var emergeT = (time - this._emergeStart) * (spd * 0.3);
        if (animMode === 'emerge') emergeT = emergeT % 3.4;
        var emergeGlobal = Math.max(0, Math.min(1, emergeT / 2));

        var off = this._springOff, vel = this._springVel;
        var k = 40, damp = 7;

        for (var i = 0; i < this._tiles.length; i++) {
            var tile = this._tiles[i];
            var mesh = tile.mesh;
            var bz = 0, bx = tile.bx, by = tile.by;
            var scl = 1;

            // Gentle permanent idle breathing so the mosaic stays alive at rest
            var idle = Math.sin(time * 0.6 + tile.col * 0.7 + tile.row * 0.5) * 0.035;

            switch (animMode) {
                case 'wave':
                    bz = Math.sin(tile.col * 0.5 + tile.row * 0.4 + time * spd * 0.4) * 0.35;
                    break;
                case 'explode':
                    var phase = (Math.sin(time * spd * 0.15) + 1) * 0.5;
                    bz = Math.sin(tile.col * 31.7 + tile.row * 19.3) * 1.6 * phase;
                    bx += Math.sin(tile.col * 17.1 + tile.row * 9.7) * phase * 0.8;
                    by += Math.cos(tile.col * 11.3 + tile.row * 23.9) * phase * 0.8;
                    break;
                case 'emerge':
                    var stagger = (tile.col + tile.row) / (this._lastCols + 8);
                    var eLocal = Math.max(0, Math.min(1, emergeGlobal * 1.6 - stagger * 0.6));
                    var e = easeOutCubic(eLocal);
                    bz = (1 - e) * -3 + idle * e;
                    scl = 0.2 + 0.8 * e;
                    break;
                default:
                    bz = idle;
                    break;
            }

            var i3 = tile.idx * 3;
            var dx = bx - mwx, dy = by - mwy;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (this._hasMouse && dist < hoverR && dist > 0.0001) {
                var force = 1 - dist / hoverR;
                force = force * force * hoverForce;
                vel[i3 + 2] += force * dt * 2.2;
            }
            vel[i3]     += (-k * off[i3]     - damp * vel[i3])     * dt;
            vel[i3 + 1] += (-k * off[i3 + 1] - damp * vel[i3 + 1]) * dt;
            vel[i3 + 2] += (-k * off[i3 + 2] - damp * vel[i3 + 2]) * dt;
            off[i3]     += vel[i3] * dt;
            off[i3 + 1] += vel[i3 + 1] * dt;
            off[i3 + 2] += vel[i3 + 2] * dt;

            var pz = bz + off[i3 + 2];
            mesh.position.set(bx + off[i3], by + off[i3 + 1], pz);
            mesh.scale.set(scl, scl, 1);
            mesh.rotation.x = tile.jx + off[i3 + 1] * 0.15;
            mesh.rotation.y = tile.jy + off[i3] * 0.15;

            tile.shadow.position.set(bx + off[i3] + 0.05, by + off[i3 + 1] - 0.05, -0.04 + Math.min(0, pz) * 0.5);
            tile.shadow.scale.set(scl, scl, 1);

            var brightness = 1;
            var op = scl;
            if (fog > 0 && pz < 0) brightness = Math.max(0.4, 1 + pz * fog * 0.35);
            tile.mat.uniforms.uOpacity.value = op;
            tile.mat.uniforms.uBrightness.value = brightness;
            tile.shadowMat.opacity = 0.32 * scl;
        }
    };

    effect.dispose = function() {
        if (this._dom && this._onMouseMove) this._dom.removeEventListener('mousemove', this._onMouseMove);
        this._dom = null; this._onMouseMove = null;
        this._tiles = null;
        this._demoCvs = null; this._demoCtx = null; this._demoTex = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
