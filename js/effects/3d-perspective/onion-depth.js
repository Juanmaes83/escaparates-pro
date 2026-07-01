(function() {
    var effect = new EP.EffectBase('onion-depth', {
        name: 'Onion Depth',
        category: '3d-perspective',
        icon: '🧅',
        description: 'Capas con profundidad tipo cebolla — las imagenes se apilan con separacion 3D y se revelan una a una como pelar capas'
    }, [
        { key: 'layerGap', type: 'range', min: 10, max: 100, default: 50, label: 'Layer Gap', unit: '%' },
        { key: 'peelSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Peel Speed', unit: '%' },
        { key: 'scaleDecay', type: 'range', min: 0, max: 100, default: 40, label: 'Scale Decay', unit: '%' },
        { key: 'rotationTilt', type: 'range', min: 0, max: 100, default: 30, label: 'Rotation Tilt', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a18', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        for (var img = 0; img < mediaList.length; img++) {
            var tex = null;
            var aspect = 1;
            if (mediaList[img].element) {
                tex = EP.Media.createTexture(mediaList[img]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || 1;
                aspect = ew / eh;
            }
            var w = aspect >= 1 ? 6 : 6 * aspect;
            var h = aspect >= 1 ? 6 / aspect : 6;

            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(w, h, 0.08) : new THREE.PlaneGeometry(w, h);
            var mat = new THREE.MeshPhongMaterial({
                map: tex,
                transparent: true,
                side: THREE.DoubleSide,
                shininess: 40,
                specular: 0x333333
            });

            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = -img * 1.5;
            mesh.userData = {
                imageIndex: img,
                isImage: true,
                baseZ: -img * 1.5,
                baseScale: 1.0
            };
            group.add(mesh);
        }

        var light1 = new THREE.PointLight(0xffffff, 1.0, 20);
        light1.position.set(3, 4, 8);
        light1.userData = { isLight: true };
        group.add(light1);

        var light2 = new THREE.PointLight(0x8888ff, 0.4, 15);
        light2.position.set(-3, -2, 5);
        light2.userData = { isLight: true };
        group.add(light2);

        var ambient = new THREE.AmbientLight(0x444455, 0.5);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        this._imageCount = mediaList.length;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this._imageCount;
        if (count === 0) return;

        var layerGap = this.settings.layerGap / 100;
        var peelSpeed = this.settings.peelSpeed / 100;
        var scaleDecay = this.settings.scaleDecay / 100;
        var rotTilt = this.settings.rotationTilt / 100;

        var currentLayer = t * count;
        var activeIdx = Math.floor(currentLayer) % count;
        var localT = currentLayer - Math.floor(currentLayer);

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            if (!mesh.userData.isImage) continue;

            var idx = mesh.userData.imageIndex;
            if (mesh.material.map) mesh.material.map.needsUpdate = true;

            var relIdx = ((idx - activeIdx) + count) % count;

            if (relIdx === 0) {
                var peelT = localT;
                var peelEased = peelT * peelT * (3 - 2 * peelT);
                mesh.position.z = peelEased * 5 * peelSpeed;
                mesh.position.x = peelEased * 4;
                mesh.rotation.y = peelEased * Math.PI * 0.3 * rotTilt;
                mesh.material.opacity = 1.0 - peelEased * 0.8;
                var s = 1.0;
                mesh.scale.set(s, s, 1);
                mesh.visible = true;
            } else if (relIdx < count * 0.7) {
                var depth = relIdx - localT;
                mesh.position.z = -depth * 1.5 * layerGap;
                mesh.position.x = 0;
                mesh.rotation.y = 0;
                var sc = Math.max(0.3, 1.0 - depth * 0.08 * scaleDecay);
                mesh.scale.set(sc, sc, 1);
                mesh.material.opacity = Math.max(0.15, 1.0 - depth * 0.2);
                mesh.visible = true;
            } else {
                mesh.visible = false;
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.2) * 0.4,
            Math.cos(time * 0.15) * 0.3,
            7
        );
        EP.Core.camera.lookAt(0, 0, -3);
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
