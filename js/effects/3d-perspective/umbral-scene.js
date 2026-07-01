(function() {
    var effect = new EP.EffectBase('umbral-scene', {
        name: 'UMBRAL 3D Scene',
        category: '3d-perspective',
        icon: '🌌',
        description: 'Escena 3D envolvente tipo UMBRAL — las imagenes flotan como texturas de objetos 3D en un espacio cinematografico'
    }, [
        { key: 'objectCount', type: 'range', min: 3, max: 12, default: 6, step: 1, label: 'Objects' },
        { key: 'spread', type: 'range', min: 20, max: 100, default: 60, label: 'Spread', unit: '%' },
        { key: 'rotSpeed', type: 'range', min: 10, max: 100, default: 35, label: 'Rotation', unit: '%' },
        { key: 'floatAmount', type: 'range', min: 0, max: 100, default: 50, label: 'Float', unit: '%' },
        { key: 'objectStyle', type: 'range', min: 1, max: 3, default: 1, step: 1, label: 'Style (1=cubes, 2=mixed, 3=flat)' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080812', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.objectCount;
        var spread = this.settings.spread / 100;
        var style = this.settings.objectStyle;

        for (var i = 0; i < count; i++) {
            var mi = i % mediaList.length;
            var tex = null;
            if (mediaList[mi].element) {
                tex = EP.Media.createTexture(mediaList[mi]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var geo;
            var objType = style === 1 ? 0 : (style === 3 ? 2 : (i % 3));

            if (objType === 0) {
                geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
            } else if (objType === 1) {
                geo = new THREE.CylinderGeometry(1, 1, 1.8, 16);
            } else {
                geo = new THREE.PlaneGeometry(2.2, 1.6);
            }

            var mat = new THREE.MeshPhongMaterial({
                map: tex,
                shininess: 60,
                specular: 0x444444,
                side: THREE.DoubleSide
            });

            var mesh = new THREE.Mesh(geo, mat);

            var angle = (i / count) * Math.PI * 2;
            var radius = 3 + spread * 4;
            var layerSpread = spread * 3;
            mesh.position.set(
                Math.cos(angle) * radius * (0.5 + Math.random() * 0.5),
                (Math.random() - 0.5) * layerSpread,
                Math.sin(angle) * radius * (0.5 + Math.random() * 0.5) - 3
            );

            mesh.rotation.set(
                Math.random() * 0.5,
                Math.random() * Math.PI * 2,
                Math.random() * 0.3
            );

            mesh.userData = {
                objIndex: i,
                isObj: true,
                baseX: mesh.position.x,
                baseY: mesh.position.y,
                baseZ: mesh.position.z,
                baseRotY: mesh.rotation.y,
                floatPhase: Math.random() * Math.PI * 2,
                floatFreq: 0.3 + Math.random() * 0.4
            };
            group.add(mesh);
        }

        var light1 = new THREE.PointLight(0xffffff, 1.2, 30);
        light1.position.set(4, 5, 8);
        light1.userData = { isLight: true };
        group.add(light1);

        var light2 = new THREE.PointLight(0x6644cc, 0.6, 20);
        light2.position.set(-5, -3, 3);
        light2.userData = { isLight: true };
        group.add(light2);

        var light3 = new THREE.PointLight(0x2266ff, 0.4, 15);
        light3.position.set(0, 0, -8);
        light3.userData = { isLight: true };
        group.add(light3);

        var ambient = new THREE.AmbientLight(0x222233, 0.4);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var rotSpeed = this.settings.rotSpeed / 100;
        var floatAmount = this.settings.floatAmount / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            if (!mesh.userData.isObj) continue;
            var d = mesh.userData;

            mesh.rotation.y = d.baseRotY + time * rotSpeed * 0.3;
            mesh.position.y = d.baseY + Math.sin(time * d.floatFreq + d.floatPhase) * floatAmount * 0.8;
            mesh.position.x = d.baseX + Math.cos(time * d.floatFreq * 0.7 + d.floatPhase) * floatAmount * 0.3;

            if (mesh.material.map) mesh.material.map.needsUpdate = true;
        }

        var t = time / loopDuration;
        var camAngle = t * Math.PI * 2;
        EP.Core.camera.position.set(
            Math.sin(camAngle) * 3,
            1 + Math.sin(time * 0.2) * 0.5,
            Math.cos(camAngle) * 3 + 5
        );
        EP.Core.camera.lookAt(0, 0, -2);
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
