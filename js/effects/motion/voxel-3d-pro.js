(function() {
    var effect = new EP.EffectBase('voxel-3d-pro', {
        name: 'Voxel 3D Pro',
        category: 'motion',
        icon: '🧊',
        description: 'Voxelización 3D premium — InstancedMesh por píxel con emergencia dramática, niebla de profundidad, explosión local bajo el cursor con retorno spring y tilt de cámara'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'gridSize', type: 'range', min: 8, max: 40, default: 28, step: 2, label: 'Resolución grid', unit: 'celdas' },
        { key: 'voxelGap', type: 'range', min: 0, max: 50, default: 8, step: 2, label: 'Separación voxels', unit: '%' },
        { key: 'emergeSpeed', type: 'range', min: 1, max: 10, default: 5, step: 1, label: 'Velocidad emergencia' },
        { key: 'animMode', type: 'select', options: [
            { v: 'wave',    l: 'Ola de altura' },
            { v: 'explode', l: 'Explosión y reconstrucción' },
            { v: 'spin',    l: 'Rotación global' },
            { v: 'emerge',  l: 'Emergencia en loop' },
            { v: 'still',   l: 'Estático (solo hover)' }
        ], default: 'wave', label: 'Modo animación' },
        { key: 'animSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad animación' },
        { key: 'voxelStyle', type: 'select', options: [
            { v: 'neon',  l: 'Neón saturado' },
            { v: 'color', l: 'Color fuente' },
            { v: 'mono',  l: 'Escala de grises' },
            { v: 'depth', l: 'Profundidad por luminosidad' }
        ], default: 'neon', label: 'Estilo color' },
        { key: 'explodeRadius', type: 'range', min: 20, max: 200, default: 90, step: 10, label: 'Radio explosión cursor', unit: '%' },
        { key: 'fogIntensity', type: 'range', min: 0, max: 100, default: 40, step: 5, label: 'Niebla de profundidad', unit: '%' }
    ]);

    var _dummy = new THREE.Object3D();

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._sampCvs = document.createElement('canvas');
        this._sampCtx = this._sampCvs.getContext('2d');
        this._m0 = (mediaList && mediaList[0]) || null;
        this._media = this._m0 ? this._m0.element : null;
        this._mesh = null;
        this._lastGrid = -1;
        this._mx = 0; this._my = 0;
        this._hasMouse = false;
        this._emergeStart = null;
        // Per-voxel spring state (allocated on mesh creation)
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

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        if (this._emergeStart === null) this._emergeStart = time;
        dt = Math.min(dt || 0.016, 0.05);

        if (this._m0 && !this._media) this._media = this._m0.element;

        var gridN = Math.max(4, Math.round(this.settings.gridSize));
        var gap = 1 - this.settings.voxelGap / 100;
        var animMode = this.settings.animMode;
        var spd = this.settings.animSpeed;
        var voxStyle = this.settings.voxelStyle;
        var fog = this.settings.fogIntensity / 100;
        var explodeR = (this.settings.explodeRadius / 100) * 1.2;
        var emergeSpd = this.settings.emergeSpeed;

        var sH = Math.max(1, Math.round(gridN * (4.5 / 8)));
        var count = gridN * sH;

        // (Re)create InstancedMesh when grid changes
        if (this._mesh && this._lastGrid !== gridN) {
            this.group.remove(this._mesh);
            this._mesh.geometry.dispose();
            this._mesh.material.dispose();
            this._mesh = null;
        }
        if (!this._mesh) {
            this._lastGrid = gridN;
            var boxSize = (8 / gridN) * gap;
            var geo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
            var mat = new THREE.MeshBasicMaterial({});
            this._mesh = new THREE.InstancedMesh(geo, mat, count);
            this._mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
            this.group.add(this._mesh);
            this._springOff = new Float32Array(count * 3);
            this._springVel = new Float32Array(count * 3);
            this._emergeStart = time;
        }

        // Sample media at grid resolution
        if (this._sampCvs.width !== gridN || this._sampCvs.height !== sH) {
            this._sampCvs.width = gridN; this._sampCvs.height = sH;
        }
        var sc = this._sampCtx;
        var mediaReady = false;
        if (this._media) {
            var el = this._media;
            if (el.tagName === 'VIDEO') mediaReady = el.readyState >= 2;
            else if (el.tagName === 'IMG') mediaReady = el.complete && el.naturalHeight > 0;
            else mediaReady = true;
        }
        if (mediaReady) {
            try { sc.drawImage(this._media, 0, 0, gridN, sH); } catch (e) {}
        } else {
            // Demo: diagonal dual-hue gradient with a travelling radial pulse
            var g1 = sc.createLinearGradient(0, 0, gridN, sH);
            g1.addColorStop(0,   'hsl(' + ((time * 24) % 360) + ',95%,62%)');
            g1.addColorStop(0.5, 'hsl(' + ((time * 24 + 130) % 360) + ',90%,55%)');
            g1.addColorStop(1,   'hsl(' + ((time * 24 + 250) % 360) + ',95%,60%)');
            sc.fillStyle = g1;
            sc.fillRect(0, 0, gridN, sH);
            var px = (0.5 + 0.42 * Math.sin(time * 0.7)) * gridN;
            var py = (0.5 + 0.42 * Math.cos(time * 0.53)) * sH;
            var g2 = sc.createRadialGradient(px, py, 0, px, py, gridN * 0.35);
            g2.addColorStop(0, 'rgba(255,255,255,0.85)');
            g2.addColorStop(1, 'rgba(255,255,255,0)');
            sc.fillStyle = g2;
            sc.fillRect(0, 0, gridN, sH);
        }
        var imgData; try { imgData = sc.getImageData(0, 0, gridN, sH); } catch (e) { return; }
        var data = imgData.data;

        // Emerge factor: dramatic entrance in ~2s (scaled by emergeSpeed)
        var emergeT = (time - this._emergeStart) * (emergeSpd * 0.35);
        if (animMode === 'emerge') emergeT = emergeT % 3.2;   // loop the entrance
        var emergeGlobal = Math.max(0, Math.min(1, emergeT / 2));

        var cellW = 8 / gridN;
        var cellH = 4.5 / sH;
        var startX = -4 + cellW * 0.5;
        var startY = 2.25 - cellH * 0.5;

        // Camera tilt with mouse (spin overrides)
        if (animMode === 'spin') {
            this.group.rotation.y = time * spd * 0.25;
            this.group.rotation.x = Math.sin(time * spd * 0.1) * 0.12;
        } else {
            this.group.rotation.y += ((this._mx * 0.38) - this.group.rotation.y) * 0.08;
            this.group.rotation.x += ((-this._my * 0.22) - this.group.rotation.x) * 0.08;
        }

        // Mouse in world XY (viewport 8 x 4.5)
        var mwx = this._mx * 4;
        var mwy = this._my * 2.25;

        var off = this._springOff, vel = this._springVel;
        var k = 42, damp = 7.5;   // spring stiffness / damping
        var inst = 0;

        for (var row = 0; row < sH; row++) {
            for (var col = 0; col < gridN; col++) {
                var idx = (row * gridN + col) * 4;
                var r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255;
                var lum = 0.299 * r + 0.587 * g + 0.114 * b;

                var bx = startX + col * cellW;
                var by = startY - row * cellH;
                var bz = 0;

                switch (animMode) {
                    case 'wave':
                        bz = Math.sin(col * 0.45 + row * 0.32 + time * spd * 0.45) * 0.55 + lum * 0.5;
                        break;
                    case 'explode':
                        var phase = (Math.sin(time * spd * 0.18) + 1) * 0.5;
                        bz = Math.sin(col * 37.1 + row * 17.3) * 2.4 * phase;
                        bx += Math.sin(col * 23.7 + row * 11.9) * phase * 1.4;
                        by += Math.cos(col * 13.1 + row * 29.7) * phase * 1.4;
                        break;
                    case 'spin':
                        bz = lum * 0.9;
                        break;
                    case 'emerge':
                    case 'still':
                        bz = lum * 1.1;
                        break;
                }

                // Per-voxel staggered emergence (wave sweeps diagonally)
                var stagger = (col + row) / (gridN + sH);
                var eLocal = Math.max(0, Math.min(1, (emergeGlobal * 1.6 - stagger * 0.6)));
                var e = easeOutCubic(eLocal);
                bz *= e;
                var scl = 0.25 + 0.75 * e;

                // Cursor explosion: radial impulse inside radius, spring return
                var i3 = inst * 3;
                var dx = bx - mwx, dy = by - mwy;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (this._hasMouse && dist < explodeR && dist > 0.0001) {
                    var force = (1 - dist / explodeR);
                    force = force * force * 14;
                    vel[i3]     += (dx / dist) * force * dt;
                    vel[i3 + 1] += (dy / dist) * force * dt;
                    vel[i3 + 2] += force * 2.2 * dt;
                }
                // Spring integration back to rest
                vel[i3]     += (-k * off[i3]     - damp * vel[i3])     * dt;
                vel[i3 + 1] += (-k * off[i3 + 1] - damp * vel[i3 + 1]) * dt;
                vel[i3 + 2] += (-k * off[i3 + 2] - damp * vel[i3 + 2]) * dt;
                off[i3]     += vel[i3] * dt;
                off[i3 + 1] += vel[i3 + 1] * dt;
                off[i3 + 2] += vel[i3 + 2] * dt;

                var pz = bz + off[i3 + 2];
                _dummy.position.set(bx + off[i3], by + off[i3 + 1], pz);
                _dummy.rotation.set(0, 0, 0);
                if (animMode === 'wave') _dummy.rotation.y = Math.sin(col * 0.5 + row * 0.5 + time * spd * 0.3) * 0.15;
                _dummy.scale.set(scl, scl, scl);
                _dummy.updateMatrix();
                this._mesh.setMatrixAt(inst, _dummy.matrix);

                var fr, fg2, fb;
                switch (voxStyle) {
                    case 'color': fr = r; fg2 = g; fb = b; break;
                    case 'mono':  fr = lum; fg2 = lum; fb = lum; break;
                    case 'depth': fr = 1 - lum * 0.7; fg2 = lum * 0.4; fb = Math.min(1, lum * 1.2); break;
                    default:      fr = Math.pow(r, 0.45); fg2 = Math.pow(g, 0.45); fb = Math.pow(b, 0.45);
                }
                // Depth fog: voxels behind the plane get darker
                if (fog > 0 && pz < 0) {
                    var f = Math.max(0, 1 + pz * fog * 0.9);
                    fr *= f; fg2 *= f; fb *= f;
                }
                // Slight brightening for voxels pushed toward camera
                if (pz > 0.1) {
                    var lift = Math.min(0.35, (pz - 0.1) * 0.25);
                    fr = Math.min(1, fr + lift); fg2 = Math.min(1, fg2 + lift); fb = Math.min(1, fb + lift);
                }
                this._mesh.instanceColor.setXYZ(inst, fr, fg2, fb);
                inst++;
            }
        }

        this._mesh.count = inst;
        this._mesh.instanceMatrix.needsUpdate = true;
        this._mesh.instanceColor.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._dom && this._onMouseMove) this._dom.removeEventListener('mousemove', this._onMouseMove);
        this._dom = null; this._onMouseMove = null;
        this._mesh = null;
        this._sampCvs = null; this._sampCtx = null;
        this._springOff = null; this._springVel = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
