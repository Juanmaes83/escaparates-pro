(function() {
    var effect = new EP.EffectBase('flywheel', {
        name: 'Flywheel Gallery',
        category: '3d-perspective',
        icon: '🎡',
        description: 'Rueda 3D tipo noria — las imagenes giran montadas sobre una rueda con radios y aro metalico'
    }, [
        { key: 'cardCount', type: 'range', min: 4, max: 16, default: 8, step: 1, label: 'Cards' },
        { key: 'radius', type: 'range', min: 30, max: 100, default: 55, label: 'Wheel Radius', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 30, label: 'Rotation Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 55, label: 'Card Size', unit: '%' },
        { key: 'tilt', type: 'range', min: 0, max: 45, default: 15, label: 'Tilt' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080812', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.cardCount;
        var R = 2 + 4 * this.settings.radius / 100;
        var cardScale = 0.8 + 1.8 * this.settings.cardSize / 100;
        var tilt = this.settings.tilt * Math.PI / 180;

        var wheelGroup = new THREE.Group();
        wheelGroup.userData = { isWheel: true };

        var rimGeo = new THREE.TorusGeometry(R, 0.06, 8, 64);
        var rimMat = new THREE.MeshPhongMaterial({ color: 0x888899, shininess: 80, specular: 0x444444 });
        var rim = new THREE.Mesh(rimGeo, rimMat);
        rim.userData = { isPart: true };
        wheelGroup.add(rim);

        var hubGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16);
        var hubMat = new THREE.MeshPhongMaterial({ color: 0x999999, shininess: 100 });
        var hub = new THREE.Mesh(hubGeo, hubMat);
        hub.rotation.x = Math.PI / 2;
        hub.userData = { isPart: true };
        wheelGroup.add(hub);

        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var mi = i % mediaList.length;

            var spokeGeo = new THREE.CylinderGeometry(0.02, 0.02, R - 0.3, 4);
            var spokeMat = new THREE.MeshPhongMaterial({ color: 0x777788 });
            var spoke = new THREE.Mesh(spokeGeo, spokeMat);
            spoke.position.set(Math.cos(angle) * (R / 2), Math.sin(angle) * (R / 2), 0);
            spoke.rotation.z = angle - Math.PI / 2;
            spoke.userData = { isPart: true };
            wheelGroup.add(spoke);

            var tex = null;
            if (mediaList[mi].element) {
                tex = EP.Media.createTexture(mediaList[mi]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var cw = cardScale;
            var ch = cardScale * 0.75;
            var cardGeo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.04) : new THREE.PlaneGeometry(cw, ch);
            var cardMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true });
            var card = new THREE.Mesh(cardGeo, cardMat);
            card.position.set(Math.cos(angle) * R, Math.sin(angle) * R, 0.1);
            card.userData = { isCard: true, cardIndex: i, baseAngle: angle };
            wheelGroup.add(card);
        }

        wheelGroup.rotation.x = tilt;
        group.add(wheelGroup);

        var light1 = new THREE.DirectionalLight(0xffffff, 1.0);
        light1.position.set(5, 5, 10);
        group.add(light1);
        var ambient = new THREE.AmbientLight(0x444455, 0.6);
        group.add(ambient);

        this._R = R;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var child = this.group.children[i];
            if (child.userData.isWheel) {
                child.rotation.z = time * speed * 0.4;

                for (var j = 0; j < child.children.length; j++) {
                    var card = child.children[j];
                    if (card.userData.isCard) {
                        card.rotation.z = -(time * speed * 0.4);
                        if (card.material && card.material.map) card.material.map.needsUpdate = true;
                    }
                }
            }
        }

        var camDist = this._R + 5;
        EP.Core.camera.position.set(
            Math.sin(time * 0.08) * 2,
            Math.cos(time * 0.06) * 1,
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
