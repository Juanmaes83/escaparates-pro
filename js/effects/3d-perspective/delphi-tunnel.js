(function() {
    var effect = new EP.EffectBase('delphi-tunnel', {
        name: 'Delphi Infinite Tunnel',
        category: '3d-perspective',
        icon: '🏛️',
        description: 'Tunel infinito inmersivo tipo Delphi — las imagenes cubren paredes, suelo y techo de un corredor rectangular con wireframe grid'
    }, [
        { key: 'tunnelWidth', type: 'range', min: 20, max: 100, default: 60, label: 'Width', unit: '%' },
        { key: 'tunnelHeight', type: 'range', min: 20, max: 100, default: 50, label: 'Height', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 40, label: 'Travel Speed', unit: '%' },
        { key: 'density', type: 'range', min: 10, max: 100, default: 60, label: 'Image Density', unit: '%' },
        { key: 'gridOpacity', type: 'range', min: 0, max: 100, default: 50, label: 'Grid Lines', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050505', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var tw = 8 + 16 * this.settings.tunnelWidth / 100;
        var th = 5 + 11 * this.settings.tunnelHeight / 100;
        var segDepth = 6;
        var numSegments = 12;
        var floorCols = 6;
        var wallRows = 4;
        var colW = tw / floorCols;
        var rowH = th / wallRows;
        var gridOp = this.settings.gridOpacity / 100;
        var density = this.settings.density / 100;
        var hw = tw / 2;
        var hh = th / 2;

        this._segDepth = segDepth;
        this._numSegments = numSegments;
        this._hw = hw;
        this._hh = hh;
        this._totalLen = numSegments * segDepth;

        var imgIdx = 0;

        for (var s = 0; s < numSegments; s++) {
            var segGroup = new THREE.Group();
            segGroup.position.z = -s * segDepth;
            segGroup.userData = { isSegment: true, segIndex: s };

            if (gridOp > 0.01) {
                var verts = [];
                for (var i = 0; i <= floorCols; i++) {
                    var x = -hw + i * colW;
                    verts.push(x, -hh, 0, x, -hh, -segDepth);
                    verts.push(x, hh, 0, x, hh, -segDepth);
                }
                for (var j = 1; j < wallRows; j++) {
                    var y = -hh + j * rowH;
                    verts.push(-hw, y, 0, -hw, y, -segDepth);
                    verts.push(hw, y, 0, hw, y, -segDepth);
                }
                verts.push(-hw, -hh, 0, hw, -hh, 0);
                verts.push(-hw, hh, 0, hw, hh, 0);
                verts.push(-hw, -hh, 0, -hw, hh, 0);
                verts.push(hw, -hh, 0, hw, hh, 0);

                var lineGeo = new THREE.BufferGeometry();
                lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
                var lineMat = new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: gridOp * 0.5 });
                segGroup.add(new THREE.LineSegments(lineGeo, lineMat));
            }

            var margin = 0.3;

            for (var fc = 0; fc < floorCols; fc++) {
                if (Math.random() < density * 0.3) {
                    var mi = imgIdx % mediaList.length; imgIdx++;
                    var tex = null;
                    if (mediaList[mi].element) {
                        tex = EP.Media.createTexture(mediaList[mi]);
                        tex.needsUpdate = true;
                        tex.minFilter = THREE.LinearFilter;
                    }
                    var geo = new THREE.PlaneGeometry(colW - margin, segDepth - margin);
                    var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
                    var mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(-hw + fc * colW + colW / 2, -hh, -segDepth / 2);
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.userData = { isImage: true };
                    segGroup.add(mesh);
                }
            }

            for (var cc = 0; cc < floorCols; cc++) {
                if (Math.random() < density * 0.15) {
                    var mi2 = imgIdx % mediaList.length; imgIdx++;
                    var tex2 = null;
                    if (mediaList[mi2].element) {
                        tex2 = EP.Media.createTexture(mediaList[mi2]);
                        tex2.needsUpdate = true;
                        tex2.minFilter = THREE.LinearFilter;
                    }
                    var geo2 = new THREE.PlaneGeometry(colW - margin, segDepth - margin);
                    var mat2 = new THREE.MeshBasicMaterial({ map: tex2, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
                    var mesh2 = new THREE.Mesh(geo2, mat2);
                    mesh2.position.set(-hw + cc * colW + colW / 2, hh, -segDepth / 2);
                    mesh2.rotation.x = Math.PI / 2;
                    mesh2.userData = { isImage: true };
                    segGroup.add(mesh2);
                }
            }

            for (var wr = 0; wr < wallRows; wr++) {
                if (Math.random() < density * 0.3) {
                    var mi3 = imgIdx % mediaList.length; imgIdx++;
                    var tex3 = null;
                    if (mediaList[mi3].element) {
                        tex3 = EP.Media.createTexture(mediaList[mi3]);
                        tex3.needsUpdate = true;
                        tex3.minFilter = THREE.LinearFilter;
                    }
                    var geo3 = new THREE.PlaneGeometry(segDepth - margin, rowH - margin);
                    var mat3 = new THREE.MeshBasicMaterial({ map: tex3, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
                    var mesh3 = new THREE.Mesh(geo3, mat3);
                    mesh3.position.set(-hw, -hh + wr * rowH + rowH / 2, -segDepth / 2);
                    mesh3.rotation.y = Math.PI / 2;
                    mesh3.userData = { isImage: true };
                    segGroup.add(mesh3);
                }
                if (Math.random() < density * 0.3) {
                    var mi4 = imgIdx % mediaList.length; imgIdx++;
                    var tex4 = null;
                    if (mediaList[mi4].element) {
                        tex4 = EP.Media.createTexture(mediaList[mi4]);
                        tex4.needsUpdate = true;
                        tex4.minFilter = THREE.LinearFilter;
                    }
                    var geo4 = new THREE.PlaneGeometry(segDepth - margin, rowH - margin);
                    var mat4 = new THREE.MeshBasicMaterial({ map: tex4, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
                    var mesh4 = new THREE.Mesh(geo4, mat4);
                    mesh4.position.set(hw, -hh + wr * rowH + rowH / 2, -segDepth / 2);
                    mesh4.rotation.y = -Math.PI / 2;
                    mesh4.userData = { isImage: true };
                    segGroup.add(mesh4);
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
        var totalLen = this._totalLen;
        var segDepth = this._segDepth;

        if (EP.Core.camera.fov !== 70) {
            EP.Core.camera.fov = 70;
            EP.Core.camera.updateProjectionMatrix();
        }

        var camZ = -(time * speed * 3) % totalLen;

        for (var i = 0; i < this.group.children.length; i++) {
            var seg = this.group.children[i];
            if (!seg.userData.isSegment) continue;

            var baseZ = -seg.userData.segIndex * segDepth;
            var z = baseZ - camZ;
            z = ((z % totalLen) + totalLen) % totalLen;
            if (z > totalLen * 0.5) z -= totalLen;
            seg.position.z = z;

            seg.traverse(function(child) {
                if (child.userData.isImage && child.material && child.material.map) {
                    child.material.map.needsUpdate = true;
                }
            });
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.15) * 0.3,
            Math.cos(time * 0.12) * 0.2,
            0
        );
        EP.Core.camera.lookAt(
            Math.sin(time * 0.1) * 0.1,
            Math.cos(time * 0.08) * 0.1,
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
