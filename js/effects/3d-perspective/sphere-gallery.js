(function() {
    var effect = new EP.EffectBase('sphere-gallery', {
        name: 'Sphere Gallery',
        category: '3d-perspective',
        icon: '🔮',
        description: 'Esferas 3D con texturas de imagen flotando con gravedad suave — sphere packing visual'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'count', type: 'range', min: 5, max: 40, default: 15, step: 1, label: 'Spheres' },
        { key: 'sphereSize', type: 'range', min: 10, max: 100, default: 50, label: 'Size', unit: '%' },
        { key: 'spread', type: 'range', min: 20, max: 100, default: 60, label: 'Spread', unit: '%' },
        { key: 'floatSpeed', type: 'range', min: 0, max: 100, default: 40, label: 'Float Speed', unit: '%' },
        { key: 'shininess', type: 'range', min: 0, max: 100, default: 60, label: 'Shininess', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0d0d1a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = Math.min(this.settings.count, 40);
        var baseSize = 0.4 + 1.2 * this.settings.sphereSize / 100;
        var spread = 3 * this.settings.spread / 100;

        for (var i = 0; i < count; i++) {
            var imgIdx = i % mediaList.length;
            var tex = null;
            if (mediaList[imgIdx].element) {
                tex = EP.Media.createTexture(mediaList[imgIdx]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var size = baseSize * (0.5 + Math.random() * 0.8);
            var geo = new THREE.SphereGeometry(size, 32, 24);
            var mat;
            if (tex) {
                mat = new THREE.MeshPhongMaterial({
                    map: tex,
                    shininess: this.settings.shininess,
                    specular: 0x444444
                });
            } else {
                mat = new THREE.MeshPhongMaterial({
                    color: new THREE.Color().setHSL(Math.random(), 0.6, 0.5),
                    shininess: this.settings.shininess,
                    specular: 0x444444
                });
            }

            var mesh = new THREE.Mesh(geo, mat);
            var phi = Math.acos(2 * Math.random() - 1);
            var theta = Math.random() * Math.PI * 2;
            var r = spread * (0.5 + Math.random() * 0.5);
            mesh.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            mesh.userData = {
                sphereIndex: i,
                basePos: mesh.position.clone(),
                floatPhase: Math.random() * Math.PI * 2,
                floatAmp: 0.2 + Math.random() * 0.4,
                rotSpeed: (Math.random() - 0.5) * 0.5
            };
            group.add(mesh);
        }

        var light1 = new THREE.PointLight(0xffffff, 1.2, 20);
        light1.position.set(3, 4, 5);
        light1.userData = { isLight: true };
        group.add(light1);

        var light2 = new THREE.PointLight(0x6688ff, 0.8, 15);
        light2.position.set(-4, -2, 3);
        light2.userData = { isLight: true };
        group.add(light2);

        var ambient = new THREE.AmbientLight(0x222233, 0.6);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var floatSpd = this.settings.floatSpeed / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            if (mesh.userData.sphereIndex === undefined) continue;
            var d = mesh.userData;
            mesh.position.x = d.basePos.x + Math.sin(time * floatSpd + d.floatPhase) * d.floatAmp;
            mesh.position.y = d.basePos.y + Math.cos(time * floatSpd * 0.7 + d.floatPhase) * d.floatAmp;
            mesh.position.z = d.basePos.z + Math.sin(time * floatSpd * 0.5 + d.floatPhase * 1.3) * d.floatAmp * 0.5;
            mesh.rotation.y += d.rotSpeed * dt;
            mesh.rotation.x += d.rotSpeed * dt * 0.3;

            if (mesh.material.map) mesh.material.map.needsUpdate = true;
        }

        var t = time / loopDuration;
        var camAngle = t * Math.PI * 2;
        EP.Core.camera.position.set(
            Math.sin(camAngle) * 6,
            Math.cos(camAngle * 0.5) * 2,
            Math.cos(camAngle) * 6 + 2
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
