(function() {
    var effect = new EP.EffectBase('dolly-zoom', {
        name: 'Cinematic Dolly Zoom',
        category: '3d-perspective',
        icon: '🎬',
        description: 'Efecto Vertigo de Hitchcock con distorsion de perspectiva'
    }, [
        { key: 'cardSize', type: 'range', min: 25, max: 55, default: 38, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 4, max: 16, default: 8, step: 1, label: 'Cards' },
        { key: 'fovRange', type: 'range', min: 20, max: 100, default: 60, label: 'FOV Range', unit: '%' },
        { key: 'dollyDepth', type: 'range', min: 2, max: 12, default: 6, step: 0.5, label: 'Dolly Depth' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 5, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080810', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.count;
        var cardScale = this.settings.cardSize / 100 * 3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.4;
        var h = cardScale * 1.2;

        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var radius = 4;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius;
            var geo = EP.RoundedPlaneGeometry(cardScale, h, cr);
            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, 0, z);
            mesh.lookAt(0, 0, 0);
            mesh.userData = {
                angle: angle,
                baseRadius: radius,
                index: i
            };
            group.add(mesh);
        }

        var floorGeo = new THREE.PlaneGeometry(20, 20);
        var floorMat = new THREE.MeshBasicMaterial({
            color: 0x111118, transparent: true, opacity: 0.3, side: THREE.DoubleSide
        });
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -h / 2 - 0.1;
        group.add(floor);

        this._baseFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var fovRange = this.settings.fovRange / 100;
        var dollyDepth = this.settings.dollyDepth;

        var wave = Math.sin(t * Math.PI * 2);
        var minFov = 20, maxFov = 20 + fovRange * 100;
        var fov = minFov + (wave * 0.5 + 0.5) * (maxFov - minFov);

        EP.Core.camera.fov = fov;
        EP.Core.camera.updateProjectionMatrix();

        var refDist = 12;
        var tanRef = Math.tan(THREE.MathUtils.degToRad(45 / 2));
        var tanCur = Math.tan(THREE.MathUtils.degToRad(fov / 2));
        var camZ = refDist * (tanRef / tanCur);
        camZ = Math.max(3, Math.min(30, camZ));

        EP.Core.camera.position.z = camZ;
        EP.Core.camera.position.x = Math.sin(t * Math.PI * 0.5) * 0.5;
        EP.Core.camera.position.y = Math.sin(t * Math.PI * 0.3) * 0.3;
        EP.Core.camera.lookAt(0, 0, 0);

        this.group.rotation.y = t * Math.PI * 2 * 0.3;

        var children = this.group.children;
        for (var i = 0; i < children.length - 1; i++) {
            var child = children[i];
            var d = child.userData;
            var breathe = Math.sin(t * Math.PI * 4 + d.index * 0.8) * 0.05;
            child.scale.setScalar(1 + breathe);

            var distFactor = fov / 45;
            child.material.opacity = Math.min(1, 0.5 + (1 / distFactor) * 0.5);
        }
    };

    effect.dispose = function() {
        if (this._baseFov) {
            EP.Core.camera.fov = this._baseFov;
            EP.Core.camera.updateProjectionMatrix();
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
