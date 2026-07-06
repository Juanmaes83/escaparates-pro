(function() {
    var effect = new EP.EffectBase('voxel', {
        name: 'Voxel',
        category: 'motion',
        icon: '🧊',
        description: 'Voxel pixelado 3D — InstancedMesh con BoxGeometry por píxel sampled, rotación, explosión y reconstrucción, estilo ditther.com Voxel'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'gridSize', type: 'range', min: 8, max: 40, default: 20, step: 2, label: 'Resolución grid', unit: 'celdas' },
        { key: 'voxelGap', type: 'range', min: 0, max: 50, default: 10, step: 5, label: 'Separación voxels', unit: '%' },
        { key: 'animMode', type: 'select', options: [
            { v: 'wave', l: 'Ola de altura' },
            { v: 'explode', l: 'Explosión y reconstrucción' },
            { v: 'spin', l: 'Rotación global' },
            { v: 'still', l: 'Estático' }
        ], default: 'wave', label: 'Modo animación' },
        { key: 'animSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad animación' },
        { key: 'voxelStyle', type: 'select', options: [
            { v: 'neon', l: 'Neón saturado' },
            { v: 'color', l: 'Color fuente' },
            { v: 'mono', l: 'Escala de grises' },
            { v: 'depth', l: 'Profundidad por luminosidad' }
        ], default: 'neon', label: 'Estilo color' }
    ]);

    var _dummy = new THREE.Object3D();

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._sampCvs = document.createElement('canvas');
        this._sampCtx = this._sampCvs.getContext('2d');
        this._media = null;
        this._m0 = null;
        this._mesh = null;
        this._lastGrid = -1;   // -1 forces creation on first update()
        this._mx = 0; this._my = 0;

        var m0 = mediaList && mediaList[0];
        if (m0) {
            this._m0 = m0;
            var bgGeo = new THREE.PlaneGeometry(8, 4.5);
            var bgMat = EP.Media.createMaterial(m0);
            var bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -1.5;
            group.add(bgMesh);
            var el = m0.element || (m0.texture && m0.texture.image);
            if (el) this._media = el;
        }

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
        // Poll for media element if not ready yet
        if (this._m0 && !this._media) {
            var el2 = this._m0.element || (this._m0.texture && this._m0.texture.image);
            if (el2) this._media = el2;
        }
        var gridN = Math.max(4, Math.round(this.settings.gridSize));
        var gap = 1 - this.settings.voxelGap / 100;
        var animMode = this.settings.animMode;
        var spd = this.settings.animSpeed;
        var voxStyle = this.settings.voxelStyle;
        var count = gridN * gridN;

        // Rebuild InstancedMesh when grid size changes
        if (this._mesh && (this._lastGrid !== gridN)) {
            this.group.remove(this._mesh);
            this._mesh.geometry.dispose();
            this._mesh.material.dispose();
            this._mesh = null;
        }

        if (!this._mesh) {
            this._lastGrid = gridN;
            var boxSize = (8 / gridN) * gap;
            var geo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
            var mat = new THREE.MeshBasicMaterial({ vertexColors: true });
            this._mesh = new THREE.InstancedMesh(geo, mat, count);
            this._mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
            this.group.add(this._mesh);
        }

        // Sample image at grid resolution
        var sW = gridN, sH = Math.max(1, Math.round(gridN * (4.5 / 8)));
        if (this._sampCvs.width !== sW || this._sampCvs.height !== sH) {
            this._sampCvs.width = sW; this._sampCvs.height = sH;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, sW, sH);
        var mediaReady = false;
        if (this._media) {
            var _el = this._media;
            if (_el.tagName === 'VIDEO') mediaReady = _el.readyState >= 2;
            else if (_el.tagName === 'IMG') mediaReady = _el.complete && _el.naturalHeight > 0;
            else mediaReady = true;
        }
        if (mediaReady) {
            try { sc.drawImage(this._media, 0, 0, sW, sH); } catch(e) {}
        } else {
            var grd = sc.createLinearGradient(0, 0, sW, sH);
            grd.addColorStop(0,   'hsl(' + ((time * 25) % 360) + ',90%,78%)');
            grd.addColorStop(0.5, 'hsl(' + ((time * 25 + 120) % 360) + ',85%,68%)');
            grd.addColorStop(1,   'hsl(' + ((time * 25 + 240) % 360) + ',90%,72%)');
            sc.fillStyle = grd;
            sc.fillRect(0, 0, sW, sH);
        }
        var imgData; try { imgData = sc.getImageData(0, 0, sW, sH); } catch(e){ return; }
        var data = imgData.data;

        var cellW = 8 / gridN;
        var cellH = 4.5 / sH;
        var startX = -4 + cellW * 0.5;
        var startY = 2.25 - cellH * 0.5;
        var totalRows = sH;
        var totalCols = gridN;
        var inst = 0;

        // Global rotation for spin mode; otherwise apply subtle mouse tilt
        if (animMode === 'spin') {
            this.group.rotation.y = time * spd * 0.3;
            this.group.rotation.x = 0;
        } else {
            this.group.rotation.y = this._mx * 0.35;
            this.group.rotation.x = -this._my * 0.2;
        }

        for (var row = 0; row < totalRows; row++) {
            for (var col = 0; col < totalCols; col++) {
                if (inst >= count) break;
                var idx = (row * sW + col) * 4;
                var r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255;
                var lum = 0.299 * r + 0.587 * g + 0.114 * b;

                var px = startX + col * cellW;
                var py = startY - row * cellH;
                var pz = 0;

                switch(animMode) {
                    case 'wave':
                        pz = Math.sin(col * 0.5 + row * 0.3 + time * spd * 0.5) * 0.5;
                        break;
                    case 'explode':
                        var phase = (Math.sin(time * spd * 0.2) + 1) * 0.5;
                        pz = Math.sin(col * 37 + row * 17) * 2.5 * phase;
                        px += Math.sin(col * 23 + row * 11) * phase * 1.5;
                        py += Math.cos(col * 13 + row * 29) * phase * 1.5;
                        break;
                    case 'depth':
                        pz = lum * 1.5;
                        break;
                }

                _dummy.position.set(px, py, pz);
                _dummy.rotation.y = (animMode === 'spin') ? 0 : Math.sin(col + row + time * spd * 0.3) * 0.2;
                _dummy.updateMatrix();
                this._mesh.setMatrixAt(inst, _dummy.matrix);

                var fr, fg, fb;
                switch(voxStyle) {
                    case 'mono':   fr = lum; fg = lum; fb = lum; break;
                    case 'neon':   fr = Math.pow(r, 0.5); fg = Math.pow(g, 0.5); fb = Math.pow(b, 0.5); break;
                    case 'depth':
                        fr = 1 - lum * 0.7; fg = lum * 0.4; fb = lum; break;
                    default:       fr = r; fg = g; fb = b;
                }
                this._mesh.instanceColor.setXYZ(inst, fr, fg, fb);
                inst++;
            }
        }

        this._mesh.count = inst;
        this._mesh.instanceMatrix.needsUpdate = true;
        this._mesh.instanceColor.needsUpdate = true;
    };

    effect.dispose = function() {
        var dom = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
        if (dom && this._onMouseMove) dom.removeEventListener('mousemove', this._onMouseMove);
        if (this._mesh) {
            this._mesh.geometry.dispose();
            this._mesh.material.dispose();
            this._mesh = null;
        }
        this._sampCvs = null; this._sampCtx = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
