(function() {
    var effect = new EP.EffectBase('polygon-wall', {
        name: 'Polygon Wall',
        category: '3d-perspective',
        icon: '🔷',
        description: 'Muro de poligonos 3D con texturas de imagen — pared geometrica animada con profundidad'
    }, [
        { key: 'polyCount', type: 'range', min: 6, max: 40, default: 18, step: 1, label: 'Polygons' },
        { key: 'polySize', type: 'range', min: 10, max: 100, default: 50, label: 'Size', unit: '%' },
        { key: 'wallSpread', type: 'range', min: 20, max: 100, default: 60, label: 'Spread', unit: '%' },
        { key: 'rotateSpeed', type: 'range', min: 0, max: 100, default: 40, label: 'Rotation', unit: '%' },
        { key: 'wobble', type: 'range', min: 0, max: 100, default: 30, label: 'Wobble', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a14', label: 'Background' }
    ]);

    function createPolygonGeo(sides, radius) {
        var shape = new THREE.Shape();
        for (var i = 0; i <= sides; i++) {
            var angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
            var x = Math.cos(angle) * radius;
            var y = Math.sin(angle) * radius;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        return new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.polyCount;
        var baseSize = 0.4 + 0.8 * this.settings.polySize / 100;
        var spread = 4 * this.settings.wallSpread / 100;

        for (var i = 0; i < count; i++) {
            var imgIdx = i % mediaList.length;
            var tex = null;
            if (mediaList[imgIdx].element) {
                tex = EP.Media.createTexture(mediaList[imgIdx]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var sides = 3 + Math.floor(Math.random() * 5);
            var size = baseSize * (0.6 + Math.random() * 0.8);
            var geo = createPolygonGeo(sides, size);

            var mat;
            if (tex) {
                mat = new THREE.MeshPhongMaterial({
                    map: tex,
                    shininess: 40,
                    specular: 0x333333,
                    side: THREE.DoubleSide
                });
            } else {
                mat = new THREE.MeshPhongMaterial({
                    color: new THREE.Color().setHSL(Math.random(), 0.5, 0.4),
                    shininess: 40,
                    side: THREE.DoubleSide
                });
            }

            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                (Math.random() - 0.5) * spread * 2,
                (Math.random() - 0.5) * spread * 1.5,
                (Math.random() - 0.5) * spread * 0.5
            );
            mesh.rotation.set(
                Math.random() * 0.3,
                Math.random() * 0.3,
                Math.random() * Math.PI * 2
            );
            mesh.userData = {
                polyIndex: i,
                basePos: mesh.position.clone(),
                baseRot: mesh.rotation.clone(),
                wobblePhase: Math.random() * Math.PI * 2,
                rotDir: (Math.random() - 0.5) * 2
            };
            group.add(mesh);
        }

        var light1 = new THREE.PointLight(0xffffff, 1.2, 20);
        light1.position.set(3, 3, 5);
        light1.userData = { isLight: true };
        group.add(light1);

        var light2 = new THREE.PointLight(0x8866ff, 0.6, 15);
        light2.position.set(-3, -2, 4);
        light2.userData = { isLight: true };
        group.add(light2);

        var ambient = new THREE.AmbientLight(0x222233, 0.5);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var rotSpd = this.settings.rotateSpeed / 100;
        var wobble = this.settings.wobble / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            if (mesh.userData.polyIndex === undefined) continue;
            var d = mesh.userData;

            mesh.rotation.z = d.baseRot.z + time * rotSpd * 0.3 * d.rotDir;
            mesh.position.x = d.basePos.x + Math.sin(time * 0.5 + d.wobblePhase) * wobble * 0.3;
            mesh.position.y = d.basePos.y + Math.cos(time * 0.4 + d.wobblePhase) * wobble * 0.2;
            mesh.position.z = d.basePos.z + Math.sin(time * 0.6 + d.wobblePhase * 1.5) * wobble * 0.15;

            if (mesh.material.map) mesh.material.map.needsUpdate = true;
        }

        var t = time / loopDuration;
        var camAngle = t * Math.PI * 2;
        EP.Core.camera.position.set(
            Math.sin(camAngle) * 1.5,
            Math.cos(camAngle * 0.7) * 0.8,
            7
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
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
