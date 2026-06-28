(function() {
    var effect = new EP.EffectBase('photo-cube', {
        name: '3D Photo Cube',
        category: '3d-perspective',
        icon: '🎲',
        description: 'Cubo 3D con 6 caras de fotos, reflexion y sombra'
    }, [
        { key: 'cubeSize', type: 'range', min: 20, max: 60, default: 38, label: 'Cube Size', unit: '%' },
        { key: 'rotSpeedX', type: 'range', min: 0, max: 100, default: 30, label: 'Rot X', unit: '%' },
        { key: 'rotSpeedY', type: 'range', min: 0, max: 100, default: 60, label: 'Rot Y', unit: '%' },
        { key: 'reflection', type: 'range', min: 0, max: 100, default: 50, label: 'Reflection', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 3, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a14', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var s = this.settings.cubeSize / 100 * 5;
        var cubeGroup = new THREE.Group();

        var faces = [
            { pos: [0, 0, s/2],   rot: [0, 0, 0] },
            { pos: [0, 0, -s/2],  rot: [0, Math.PI, 0] },
            { pos: [s/2, 0, 0],   rot: [0, Math.PI/2, 0] },
            { pos: [-s/2, 0, 0],  rot: [0, -Math.PI/2, 0] },
            { pos: [0, s/2, 0],   rot: [-Math.PI/2, 0, 0] },
            { pos: [0, -s/2, 0],  rot: [Math.PI/2, 0, 0] }
        ];

        var cr = this.settings.cornerRadius / 100 * s * 0.3;
        var geo = EP.RoundedPlaneGeometry(s, s, cr);

        for (var i = 0; i < 6; i++) {
            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.side = THREE.DoubleSide;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(faces[i].pos[0], faces[i].pos[1], faces[i].pos[2]);
            mesh.rotation.set(faces[i].rot[0], faces[i].rot[1], faces[i].rot[2]);
            cubeGroup.add(mesh);
        }

        var edgeGeo = new THREE.BoxGeometry(s + 0.04, s + 0.04, s + 0.04);
        var edgeMat = new THREE.MeshBasicMaterial({
            color: 0x333344, wireframe: true, transparent: true, opacity: 0.3
        });
        var edges = new THREE.Mesh(edgeGeo, edgeMat);
        cubeGroup.add(edges);

        cubeGroup.userData = { isCube: true };
        group.add(cubeGroup);

        var refl = this.settings.reflection / 100;
        if (refl > 0) {
            var reflGroup = new THREE.Group();
            for (var i = 0; i < 6; i++) {
                var rmat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
                rmat.transparent = true;
                rmat.opacity = refl * 0.25;
                rmat.side = THREE.DoubleSide;
                var rmesh = new THREE.Mesh(geo, rmat);
                rmesh.position.set(faces[i].pos[0], faces[i].pos[1], faces[i].pos[2]);
                rmesh.rotation.set(faces[i].rot[0], faces[i].rot[1], faces[i].rot[2]);
                reflGroup.add(rmesh);
            }
            reflGroup.scale.y = -1;
            reflGroup.position.y = -s - 0.5;
            reflGroup.userData = { isReflection: true };
            group.add(reflGroup);

            var floorGeo = new THREE.PlaneGeometry(s * 3, s * 3);
            var floorMat = new THREE.MeshBasicMaterial({
                color: 0x111118, transparent: true, opacity: 0.4, side: THREE.DoubleSide
            });
            var floor = new THREE.Mesh(floorGeo, floorMat);
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = -s / 2 - 0.25;
            group.add(floor);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var spdX = this.settings.rotSpeedX / 100;
        var spdY = this.settings.rotSpeedY / 100;

        this.group.children.forEach(function(child) {
            if (child.userData.isCube || child.userData.isReflection) {
                child.rotation.x = t * Math.PI * 2 * spdX;
                child.rotation.y = t * Math.PI * 2 * spdY;
            }
        });
    };

    EP.Registry.register(effect);
})();
