(function() {
    var effect = new EP.EffectBase('data-tunnel', {
        name: 'Data Tunnel',
        category: '3d-perspective',
        icon: '💾',
        description: 'Tunel de datos digital — las imagenes fluyen por un corredor rectangular tipo matrix con lineas de datos luminosas'
    }, [
        { key: 'tunnelWidth', type: 'range', min: 20, max: 100, default: 50, label: 'Width', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 45, label: 'Speed', unit: '%' },
        { key: 'panelsPerWall', type: 'range', min: 2, max: 6, default: 3, step: 1, label: 'Panels/Wall' },
        { key: 'rings', type: 'range', min: 3, max: 8, default: 4, step: 1, label: 'Depth Rings' },
        { key: 'dataLines', type: 'range', min: 0, max: 100, default: 50, label: 'Data Lines', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000a08', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var hw = 2 + 3 * this.settings.tunnelWidth / 100;
        var hh = hw * 0.6;
        var rings = this.settings.rings;
        var ppw = this.settings.panelsPerWall;
        var ringSpacing = 5;
        var dataLines = this.settings.dataLines / 100;

        var imgIdx = 0;
        for (var ring = 0; ring < rings; ring++) {
            var z = -ring * ringSpacing;
            var panelH = ringSpacing * 0.9;

            for (var wall = 0; wall < 4; wall++) {
                for (var p = 0; p < ppw; p++) {
                    var mi = imgIdx % mediaList.length;
                    imgIdx++;

                    var tex = null;
                    if (mediaList[mi].element) {
                        tex = new THREE.Texture(mediaList[mi].element);
                        tex.needsUpdate = true;
                        tex.minFilter = THREE.LinearFilter;
                    }

                    var panelW, px, py, pz, rotY, rotX;
                    var offset = (p - (ppw - 1) / 2);

                    if (wall === 0) {
                        panelW = (hw * 2) / ppw * 0.9;
                        px = offset * panelW;
                        py = hh;
                        pz = z;
                        rotX = Math.PI / 2;
                        rotY = 0;
                    } else if (wall === 1) {
                        panelW = (hw * 2) / ppw * 0.9;
                        px = offset * panelW;
                        py = -hh;
                        pz = z;
                        rotX = -Math.PI / 2;
                        rotY = 0;
                    } else if (wall === 2) {
                        panelW = (hh * 2) / ppw * 0.9;
                        px = hw;
                        py = offset * panelW;
                        pz = z;
                        rotX = 0;
                        rotY = -Math.PI / 2;
                    } else {
                        panelW = (hh * 2) / ppw * 0.9;
                        px = -hw;
                        py = offset * panelW;
                        pz = z;
                        rotX = 0;
                        rotY = Math.PI / 2;
                    }

                    var geo = new THREE.PlaneGeometry(panelW, panelH);
                    var mat = new THREE.MeshBasicMaterial({
                        map: tex,
                        side: THREE.DoubleSide,
                        transparent: true
                    });
                    var mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(px, py, pz);
                    mesh.rotation.set(rotX, rotY, 0);
                    mesh.userData = { isPanel: true, baseZ: z };
                    group.add(mesh);
                }
            }
        }

        if (dataLines > 0) {
            var lineCount = Math.floor(20 * dataLines);
            for (var l = 0; l < lineCount; l++) {
                var lGeo = new THREE.PlaneGeometry(0.02, 0.5 + Math.random() * 2);
                var lMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(0.45 + Math.random() * 0.15, 1, 0.5),
                    transparent: true,
                    opacity: 0.3 + Math.random() * 0.4
                });
                var line = new THREE.Mesh(lGeo, lMat);
                var side = Math.floor(Math.random() * 4);
                if (side === 0) { line.position.set((Math.random() - 0.5) * hw * 2, hh - 0.01, 0); line.rotation.x = Math.PI / 2; }
                else if (side === 1) { line.position.set((Math.random() - 0.5) * hw * 2, -hh + 0.01, 0); line.rotation.x = Math.PI / 2; }
                else if (side === 2) { line.position.set(hw - 0.01, (Math.random() - 0.5) * hh * 2, 0); line.rotation.y = Math.PI / 2; }
                else { line.position.set(-hw + 0.01, (Math.random() - 0.5) * hh * 2, 0); line.rotation.y = Math.PI / 2; }
                line.userData = { isDataLine: true, baseZ: -Math.random() * rings * ringSpacing, speed: 1 + Math.random() * 3 };
                group.add(line);
            }
        }

        this._totalDepth = rings * ringSpacing;
        this._origFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;
        var totalDepth = this._totalDepth;

        if (EP.Core.camera.fov !== 80) {
            EP.Core.camera.fov = 80;
            EP.Core.camera.updateProjectionMatrix();
        }

        var travel = (time * speed * 2) % totalDepth;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            if (mesh.userData.isPanel) {
                var z = mesh.userData.baseZ + travel;
                z = ((z % totalDepth) + totalDepth) % totalDepth;
                if (z > totalDepth * 0.5) z -= totalDepth;
                mesh.position.z = z;
                mesh.material.opacity = Math.max(0.15, 1.0 - Math.abs(z) / (totalDepth * 0.5));
                if (mesh.material.map) mesh.material.map.needsUpdate = true;
            }
            if (mesh.userData.isDataLine) {
                var lz = mesh.userData.baseZ + time * mesh.userData.speed * speed;
                lz = ((lz % totalDepth) + totalDepth) % totalDepth;
                if (lz > totalDepth * 0.5) lz -= totalDepth;
                mesh.position.z = lz;
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.2) * 0.2,
            Math.cos(time * 0.15) * 0.15,
            0
        );
        EP.Core.camera.lookAt(0, 0, -10);
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
