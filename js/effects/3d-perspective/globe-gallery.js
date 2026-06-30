(function() {
    var effect = new EP.EffectBase('globe-gallery', {
        name: '3D Globe Gallery',
        category: '3d-perspective',
        icon: '🌍',
        description: 'Globo 3D con imagenes distribuidas esfericamente — rotacion continua con densidad alta tipo planeta de fotos'
    }, [
        { key: 'cardCount', type: 'range', min: 20, max: 80, default: 40, step: 1, label: 'Photos' },
        { key: 'radius', type: 'range', min: 30, max: 100, default: 60, label: 'Globe Radius', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 25, label: 'Rotation Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 80, default: 40, label: 'Photo Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080810', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.cardCount;
        var R = 3 + 5 * this.settings.radius / 100;
        var cardScale = 0.4 + 1.2 * this.settings.cardSize / 100;
        var cw = cardScale;
        var ch = cardScale;

        var globeGroup = new THREE.Group();
        globeGroup.userData = { isGlobe: true };

        var goldenAngle = Math.PI * (3 - Math.sqrt(5));

        for (var i = 0; i < count; i++) {
            var mi = i % mediaList.length;
            var tex = null;
            if (mediaList[mi].element) {
                tex = new THREE.Texture(mediaList[mi].element);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var y = 1 - (i / (count - 1)) * 2;
            var radiusAtY = Math.sqrt(1 - y * y);
            var theta = goldenAngle * i;

            var px = radiusAtY * Math.cos(theta) * R;
            var py = y * R;
            var pz = radiusAtY * Math.sin(theta) * R;

            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.03) : new THREE.PlaneGeometry(cw, ch);
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true });
            var mesh = new THREE.Mesh(geo, mat);

            mesh.position.set(px, py, pz);
            mesh.lookAt(px * 2, py * 2, pz * 2);
            mesh.userData = { isCard: true, cardIndex: i };
            globeGroup.add(mesh);
        }

        group.add(globeGroup);

        this._R = R;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var globe = this.group.children[i];
            if (!globe.userData.isGlobe) continue;
            globe.rotation.y = time * speed * 0.2;
            globe.rotation.x = Math.sin(time * 0.1) * 0.1;

            for (var j = 0; j < globe.children.length; j++) {
                var card = globe.children[j];
                if (card.userData.isCard && card.material && card.material.map) {
                    card.material.map.needsUpdate = true;
                }
            }
        }

        var camDist = this._R + 7;
        EP.Core.camera.position.set(
            Math.sin(time * 0.08) * 2,
            Math.cos(time * 0.06) * 1.5,
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
