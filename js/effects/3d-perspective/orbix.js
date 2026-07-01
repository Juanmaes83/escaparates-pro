(function() {
    var effect = new EP.EffectBase('orbix', {
        name: 'Orbix Ring',
        category: '3d-perspective',
        icon: '💍',
        description: 'Anillo orbital 3D — las imagenes giran en un anillo tipo rolodex con rotacion continua'
    }, [
        { key: 'cardCount', type: 'range', min: 8, max: 30, default: 16, step: 1, label: 'Cards' },
        { key: 'radius', type: 'range', min: 20, max: 100, default: 55, label: 'Radius', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 30, label: 'Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 50, label: 'Card Size', unit: '%' },
        { key: 'tilt', type: 'range', min: 0, max: 30, default: 10, label: 'Tilt' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080810', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.cardCount;
        var R = 3 + 5 * this.settings.radius / 100;
        var cardScale = 0.6 + 1.4 * this.settings.cardSize / 100;
        var tilt = this.settings.tilt * Math.PI / 180;
        var cw = cardScale * 1.4;
        var ch = cardScale;

        var ringGroup = new THREE.Group();
        ringGroup.userData = { isRing: true };

        for (var i = 0; i < count; i++) {
            var mi = i % mediaList.length;
            var tex = null;
            if (mediaList[mi].element) {
                tex = EP.Media.createTexture(mediaList[mi]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.03) : new THREE.PlaneGeometry(cw, ch);
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true });
            var mesh = new THREE.Mesh(geo, mat);

            var angle = (i / count) * Math.PI * 2;
            mesh.position.set(R * Math.cos(angle), 0, R * Math.sin(angle));
            mesh.lookAt(0, 0, 0);
            mesh.rotateY(Math.PI / 2);
            mesh.userData = { isCard: true, cardIndex: i, baseAngle: angle };
            ringGroup.add(mesh);
        }

        ringGroup.rotation.x = -tilt;
        group.add(ringGroup);

        this._R = R;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var ring = this.group.children[i];
            if (!ring.userData.isRing) continue;
            ring.rotation.y = time * speed * 0.3;

            for (var j = 0; j < ring.children.length; j++) {
                var card = ring.children[j];
                if (card.userData.isCard && card.material && card.material.map) {
                    card.material.map.needsUpdate = true;
                }
            }
        }

        var camDist = this._R + 6;
        EP.Core.camera.position.set(
            Math.sin(time * 0.1) * 1.5,
            3 + Math.sin(time * 0.15) * 0.5,
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
