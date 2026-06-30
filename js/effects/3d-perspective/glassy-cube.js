(function() {
    var effect = new EP.EffectBase('glassy-cube', {
        name: 'Glassy Cube',
        category: '3d-perspective',
        icon: '🧊',
        description: 'Cubo de cristal 3D con imagenes en las caras — efecto vidrio translucido con reflejos y rotacion suave'
    }, [
        { key: 'cubeSize', type: 'range', min: 30, max: 100, default: 60, label: 'Cube Size', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 25, label: 'Rotation Speed', unit: '%' },
        { key: 'glassOpacity', type: 'range', min: 10, max: 80, default: 45, label: 'Glass Opacity', unit: '%' },
        { key: 'photoSize', type: 'range', min: 30, max: 100, default: 70, label: 'Photo Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050510', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var S = 2 + 4 * this.settings.cubeSize / 100;
        var glassOp = this.settings.glassOpacity / 100;
        var photoScale = 0.4 + 0.5 * this.settings.photoSize / 100;

        var cubeGroup = new THREE.Group();
        cubeGroup.userData = { isCube: true };

        var cubeGeo = new THREE.BoxGeometry(S, S, S);
        var cubeMat = new THREE.MeshPhongMaterial({
            color: 0x88aacc,
            transparent: true,
            opacity: glassOp,
            shininess: 120,
            specular: 0x667788,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        var cube = new THREE.Mesh(cubeGeo, cubeMat);
        cube.userData = { isGlass: true };
        cubeGroup.add(cube);

        var edgeGeo = new THREE.EdgesGeometry(cubeGeo);
        var edgeMat = new THREE.LineBasicMaterial({ color: 0xaaccee, transparent: true, opacity: 0.6 });
        cubeGroup.add(new THREE.LineSegments(edgeGeo, edgeMat));

        var faces = [
            { pos: [0, 0, S / 2 + 0.01], rot: [0, 0, 0] },
            { pos: [0, 0, -S / 2 - 0.01], rot: [0, Math.PI, 0] },
            { pos: [S / 2 + 0.01, 0, 0], rot: [0, Math.PI / 2, 0] },
            { pos: [-S / 2 - 0.01, 0, 0], rot: [0, -Math.PI / 2, 0] },
            { pos: [0, S / 2 + 0.01, 0], rot: [-Math.PI / 2, 0, 0] },
            { pos: [0, -S / 2 - 0.01, 0], rot: [Math.PI / 2, 0, 0] }
        ];

        var ps = S * photoScale;

        for (var f = 0; f < faces.length; f++) {
            var mi = f % mediaList.length;
            var tex = null;
            if (mediaList[mi].element) {
                tex = new THREE.Texture(mediaList[mi].element);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var geo = new THREE.PlaneGeometry(ps, ps);
            var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(faces[f].pos[0], faces[f].pos[1], faces[f].pos[2]);
            mesh.rotation.set(faces[f].rot[0], faces[f].rot[1], faces[f].rot[2]);
            mesh.userData = { isCard: true, faceIndex: f };
            cubeGroup.add(mesh);
        }

        group.add(cubeGroup);

        var light1 = new THREE.DirectionalLight(0xffffff, 1.2);
        light1.position.set(5, 5, 8);
        group.add(light1);
        var light2 = new THREE.DirectionalLight(0x8888ff, 0.6);
        light2.position.set(-5, -3, -5);
        group.add(light2);
        var ambient = new THREE.AmbientLight(0x334466, 0.5);
        group.add(ambient);

        this._S = S;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var child = this.group.children[i];
            if (!child.userData.isCube) continue;

            child.rotation.x = time * speed * 0.1;
            child.rotation.y = time * speed * 0.15;

            var bob = Math.sin(time * 0.5) * 0.3;
            child.position.y = bob;

            for (var j = 0; j < child.children.length; j++) {
                var card = child.children[j];
                if (card.userData.isCard && card.material && card.material.map) {
                    card.material.map.needsUpdate = true;
                }
            }
        }

        var camDist = this._S + 6;
        EP.Core.camera.position.set(
            Math.sin(time * 0.12) * 1.5,
            Math.cos(time * 0.1) * 1,
            camDist
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
