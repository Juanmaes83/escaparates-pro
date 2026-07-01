(function() {
    var effect = new EP.EffectBase('infinitor', {
        name: 'Infinitor Tunnel',
        category: '3d-perspective',
        icon: '♾️',
        description: 'Tunel infinito procedural con grid wireframe — recorrido automatico por un corredor serpenteante con imagenes'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 40, label: 'Travel Speed', unit: '%' },
        { key: 'tunnelSize', type: 'range', min: 20, max: 100, default: 50, label: 'Tunnel Size', unit: '%' },
        { key: 'density', type: 'range', min: 10, max: 100, default: 60, label: 'Image Density', unit: '%' },
        { key: 'gridOpacity', type: 'range', min: 0, max: 100, default: 50, label: 'Grid Lines', unit: '%' },
        { key: 'curvature', type: 'range', min: 0, max: 100, default: 40, label: 'Curvature', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#020208', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var R = 4 + 6 * this.settings.tunnelSize / 100;
        var density = this.settings.density / 100;
        var gridOp = this.settings.gridOpacity / 100;
        var segDepth = 5;
        var numSegments = 14;

        this._R = R;
        this._segDepth = segDepth;
        this._numSegments = numSegments;
        this._totalLen = numSegments * segDepth;

        var imgIdx = 0;

        for (var s = 0; s < numSegments; s++) {
            var segGroup = new THREE.Group();
            segGroup.position.z = -s * segDepth;
            segGroup.userData = { isSegment: true, segIndex: s };

            if (gridOp > 0.01) {
                var verts = [];
                var gridDivs = 4;
                for (var g = 0; g <= gridDivs; g++) {
                    var frac = g / gridDivs;
                    var x1 = -R + frac * 2 * R;
                    verts.push(x1, -R, 0, x1, -R, -segDepth);
                    verts.push(x1, R, 0, x1, R, -segDepth);
                    var y1 = -R + frac * 2 * R;
                    verts.push(-R, y1, 0, -R, y1, -segDepth);
                    verts.push(R, y1, 0, R, y1, -segDepth);
                }
                verts.push(-R, -R, 0, R, -R, 0);
                verts.push(-R, R, 0, R, R, 0);
                verts.push(-R, -R, 0, -R, R, 0);
                verts.push(R, -R, 0, R, R, 0);
                var lineGeo = new THREE.BufferGeometry();
                lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
                var lineMat = new THREE.LineBasicMaterial({ color: 0x2244aa, transparent: true, opacity: gridOp * 0.35 });
                segGroup.add(new THREE.LineSegments(lineGeo, lineMat));
            }

            var margin = 0.2;
            var cellW = R * 0.8;
            var cellH = segDepth * 0.7;
            var walls = [
                { px: 0, py: -R, pz: -segDepth / 2, rx: -Math.PI / 2, ry: 0, w: cellW, h: cellH },
                { px: 0, py: R, pz: -segDepth / 2, rx: Math.PI / 2, ry: 0, w: cellW, h: cellH },
                { px: -R, py: 0, pz: -segDepth / 2, rx: 0, ry: Math.PI / 2, w: cellH, h: cellW },
                { px: R, py: 0, pz: -segDepth / 2, rx: 0, ry: -Math.PI / 2, w: cellH, h: cellW }
            ];

            for (var w = 0; w < walls.length; w++) {
                if (Math.random() < density * 0.45) {
                    var mi = imgIdx % mediaList.length; imgIdx++;
                    var tex = null;
                    if (mediaList[mi].element) {
                        tex = EP.Media.createTexture(mediaList[mi]);
                        tex.needsUpdate = true;
                        tex.minFilter = THREE.LinearFilter;
                    }
                    var geo = new THREE.PlaneGeometry(walls[w].w, walls[w].h);
                    var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
                    var mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(walls[w].px, walls[w].py, walls[w].pz);
                    mesh.rotation.x = walls[w].rx;
                    mesh.rotation.y = walls[w].ry;
                    mesh.userData = { isImage: true };
                    segGroup.add(mesh);
                }
            }

            group.add(segGroup);
        }

        this._origFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;
        var curve = this.settings.curvature / 100;
        var totalLen = this._totalLen;
        var segDepth = this._segDepth;

        if (EP.Core.camera.fov !== 80) {
            EP.Core.camera.fov = 80;
            EP.Core.camera.updateProjectionMatrix();
        }

        var camTravel = (time * speed * 3) % totalLen;

        for (var i = 0; i < this.group.children.length; i++) {
            var seg = this.group.children[i];
            if (!seg.userData.isSegment) continue;

            var baseZ = -seg.userData.segIndex * segDepth;
            var z = baseZ + camTravel;
            z = ((z % totalLen) + totalLen) % totalLen;
            if (z > totalLen * 0.5) z -= totalLen;
            seg.position.z = z;

            var segDist = z / totalLen;
            seg.position.x = Math.sin(segDist * Math.PI * 4 + time * 0.2) * curve * 3;
            seg.position.y = Math.cos(segDist * Math.PI * 3 + time * 0.15) * curve * 1.5;

            seg.traverse(function(child) {
                if (child.userData.isImage && child.material && child.material.map) {
                    child.material.map.needsUpdate = true;
                }
            });
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.12) * curve * 0.5,
            Math.cos(time * 0.1) * curve * 0.3,
            0
        );
        EP.Core.camera.lookAt(
            Math.sin(time * 0.08) * 0.2,
            Math.cos(time * 0.06) * 0.15,
            -10
        );
    };

    effect.dispose = function() {
        if (this._origFov) {
            EP.Core.camera.fov = this._origFov;
            EP.Core.camera.updateProjectionMatrix();
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
