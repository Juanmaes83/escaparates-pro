(function() {
    var effect = new EP.EffectBase('gallery-walk', {
        name: 'Gallery Walk',
        category: 'parallax',
        icon: '🏛️',
        description: 'Paseo por galeria 3D tipo museo con cuadros en las paredes'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 50, default: 35, label: 'Card Size', unit: '%' },
        { key: 'hallWidth', type: 'range', min: 2, max: 8, default: 4, step: 0.5, label: 'Hall Width' },
        { key: 'hallLength', type: 'range', min: 8, max: 30, default: 16, step: 1, label: 'Hall Length' },
        { key: 'frameWidth', type: 'range', min: 0, max: 20, default: 8, label: 'Frame', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 2, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'linear', label: 'Easing' },
        { key: 'background', type: 'color', default: '#121218', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 3;
        var hw = this.settings.hallWidth / 2;
        var hallLen = this.settings.hallLength;
        var border = this.settings.frameWidth / 100 * cardScale;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.3;
        var count = mediaList.length;
        var spacing = hallLen / Math.ceil(count / 2);

        var wallGeo = new THREE.PlaneGeometry(hallLen, hw * 2);
        var wallMat = new THREE.MeshBasicMaterial({ color: 0x1a1a22, side: THREE.DoubleSide });

        var leftWall = new THREE.Mesh(wallGeo, wallMat.clone());
        leftWall.position.set(0, 0, -hw);
        group.add(leftWall);

        var rightWall = new THREE.Mesh(wallGeo, wallMat.clone());
        rightWall.position.set(0, 0, hw);
        rightWall.rotation.y = Math.PI;
        group.add(rightWall);

        var floorGeo = new THREE.PlaneGeometry(hallLen, hw * 2);
        var floorMat = new THREE.MeshBasicMaterial({ color: 0x0e0e14, side: THREE.DoubleSide });
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = Math.PI / 2;
        floor.rotation.z = Math.PI / 2;
        floor.position.y = -hw;
        group.add(floor);

        var ceilMat = new THREE.MeshBasicMaterial({ color: 0x16161e, side: THREE.DoubleSide });
        var ceil = new THREE.Mesh(floorGeo.clone(), ceilMat);
        ceil.rotation.x = Math.PI / 2;
        ceil.rotation.z = Math.PI / 2;
        ceil.position.y = hw;
        group.add(ceil);

        for (var i = 0; i < count; i++) {
            var side = i % 2 === 0 ? -1 : 1;
            var pos = Math.floor(i / 2) * spacing - hallLen / 2 + spacing / 2;
            var h = cardScale * 0.75;

            var painting = new THREE.Group();

            if (border > 0) {
                var frameGeo = EP.RoundedPlaneGeometry(cardScale + border * 2, h + border * 2, cr + border * 0.3);
                var frameMat = new THREE.MeshBasicMaterial({ color: 0x8b7355, side: THREE.DoubleSide });
                var frame = new THREE.Mesh(frameGeo, frameMat);
                frame.position.z = -0.01 * side;
                painting.add(frame);

                var innerFrame = EP.RoundedPlaneGeometry(cardScale + border, h + border, cr + border * 0.15);
                var innerMat = new THREE.MeshBasicMaterial({ color: 0x3d3428, side: THREE.DoubleSide });
                var inner = new THREE.Mesh(innerFrame, innerMat);
                inner.position.z = -0.005 * side;
                painting.add(inner);
            }

            var artGeo = EP.RoundedPlaneGeometry(cardScale, h, cr);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.side = THREE.DoubleSide;
            var art = new THREE.Mesh(artGeo, mat);
            painting.add(art);

            var lightGeo = new THREE.PlaneGeometry(cardScale * 0.6, 0.15);
            var lightMat = new THREE.MeshBasicMaterial({
                color: 0xffffee, transparent: true, opacity: 0.5, side: THREE.DoubleSide
            });
            var light = new THREE.Mesh(lightGeo, lightMat);
            light.position.y = h / 2 + border + 0.3;
            light.position.z = 0.15 * side;
            light.rotation.x = Math.PI * 0.15 * side;
            painting.add(light);

            painting.position.set(pos, 0.3, (hw - 0.05) * side);
            if (side > 0) painting.rotation.y = Math.PI;
            painting.userData = { index: i, baseX: pos };
            group.add(painting);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var hallLen = this.settings.hallLength;
        var camX = -hallLen / 2 + t * hallLen;

        EP.Core.camera.position.x = camX;
        EP.Core.camera.position.y = 0;
        EP.Core.camera.position.z = 0;
        EP.Core.camera.lookAt(camX + 3, 0.2, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
