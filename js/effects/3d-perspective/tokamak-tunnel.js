(function() {
    var effect = new EP.EffectBase('tokamak-tunnel', {
        name: 'Digital Tokamak Tunnel',
        category: '3d-perspective',
        icon: '🌀',
        description: 'Tunel inmersivo digital tipo tokamak — las imagenes forman las paredes de un tunel infinito que te absorbe hacia el interior'
    }, [
        { key: 'tunnelRadius', type: 'range', min: 20, max: 100, default: 50, label: 'Radius', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 40, label: 'Travel Speed', unit: '%' },
        { key: 'segments', type: 'range', min: 4, max: 12, default: 6, step: 1, label: 'Wall Segments' },
        { key: 'rings', type: 'range', min: 3, max: 10, default: 5, step: 1, label: 'Depth Rings' },
        { key: 'glow', type: 'range', min: 0, max: 100, default: 60, label: 'Glow', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#020210', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var segs = this.settings.segments;
        var rings = this.settings.rings;
        var radius = 2 + 3 * this.settings.tunnelRadius / 100;
        var ringSpacing = 5;

        var imgIdx = 0;
        for (var ring = 0; ring < rings; ring++) {
            for (var seg = 0; seg < segs; seg++) {
                var mi = imgIdx % mediaList.length;
                imgIdx++;

                var tex = null;
                if (mediaList[mi].element) {
                    tex = EP.Media.createTexture(mediaList[mi]);
                    tex.needsUpdate = true;
                    tex.minFilter = THREE.LinearFilter;
                }

                var angle = (seg / segs) * Math.PI * 2;
                var panelW = 2 * radius * Math.sin(Math.PI / segs) * 0.92;
                var panelH = ringSpacing * 0.88;

                var geo = new THREE.PlaneGeometry(panelW, panelH);
                var mat = new THREE.MeshBasicMaterial({
                    map: tex,
                    side: THREE.DoubleSide,
                    transparent: true
                });

                var mesh = new THREE.Mesh(geo, mat);
                var x = radius * Math.cos(angle);
                var y = radius * Math.sin(angle);
                var z = -ring * ringSpacing;

                mesh.position.set(x, y, z);
                mesh.lookAt(0, 0, z);

                mesh.userData = {
                    isPanelMesh: true,
                    ring: ring,
                    seg: seg,
                    baseZ: z,
                    angle: angle
                };
                group.add(mesh);
            }
        }

        var totalDepth = rings * ringSpacing;
        this._totalDepth = totalDepth;
        this._ringSpacing = ringSpacing;
        this._origFov = EP.Core.camera.fov;

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;
        var totalDepth = this._totalDepth;

        if (EP.Core.camera.fov !== 90) {
            EP.Core.camera.fov = 90;
            EP.Core.camera.updateProjectionMatrix();
        }

        var travel = (time * speed * 2) % totalDepth;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            if (!mesh.userData.isPanelMesh) continue;

            var z = mesh.userData.baseZ + travel;
            z = ((z % totalDepth) + totalDepth) % totalDepth;
            if (z > totalDepth * 0.5) z -= totalDepth;

            mesh.position.z = z;

            var dist = Math.abs(z);
            mesh.material.opacity = Math.max(0.15, 1.0 - dist / (totalDepth * 0.5));

            if (mesh.material.map) mesh.material.map.needsUpdate = true;
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.3) * 0.15,
            Math.cos(time * 0.25) * 0.15,
            0
        );
        EP.Core.camera.lookAt(
            Math.sin(time * 0.2) * 0.05,
            Math.cos(time * 0.18) * 0.05,
            -10
        );
    };

    effect.dispose = function() {
        if (this._origFov) {
            EP.Core.camera.fov = this._origFov;
            EP.Core.camera.updateProjectionMatrix();
        }
        if (this.group) {
            for (var i = 0; i < this.group.children.length; i++) {
                var m = this.group.children[i];
                if (m.material && m.material.map) m.material.map.dispose();
            }
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
