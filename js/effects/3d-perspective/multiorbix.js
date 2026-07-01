(function() {
    var effect = new EP.EffectBase('multiorbix', {
        name: 'Multiorbix Gallery',
        category: '3d-perspective',
        icon: '🪐',
        description: 'Galeria multi-orbital 3D — tres anillos concentricos de imagenes girando en direcciones opuestas con profundidad cinematografica'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'ringCount', type: 'range', min: 2, max: 4, default: 3, step: 1, label: 'Rings' },
        { key: 'cardsPerRing', type: 'range', min: 6, max: 20, default: 12, step: 1, label: 'Cards/Ring' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 35, label: 'Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 55, label: 'Card Size', unit: '%' },
        { key: 'tilt', type: 'range', min: 0, max: 60, default: 15, label: 'Tilt Angle' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a14', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var ringCount = this.settings.ringCount;
        var cardsPerRing = this.settings.cardsPerRing;
        var cardScale = 0.8 + 1.5 * this.settings.cardSize / 100;
        var tilt = this.settings.tilt * Math.PI / 180;
        var cw = cardScale;
        var ch = cardScale * 0.75;
        var imgIdx = 0;

        var ringsConfig = [];
        for (var r = 0; r < ringCount; r++) {
            var count = cardsPerRing + r * 4;
            var radius = (cw + 0.3) / (2 * Math.sin(Math.PI / count));
            ringsConfig.push({ count: count, radius: radius, direction: r % 2 === 0 ? 1 : -1, speedMult: 1.0 - r * 0.25 });
        }

        for (var ri = 0; ri < ringsConfig.length; ri++) {
            var cfg = ringsConfig[ri];
            var ringGroup = new THREE.Group();
            ringGroup.userData = { isRing: true, ringIndex: ri, direction: cfg.direction, speedMult: cfg.speedMult };

            for (var ci = 0; ci < cfg.count; ci++) {
                var mi = imgIdx % mediaList.length;
                imgIdx++;
                var tex = null;
                if (mediaList[mi].element) {
                    tex = EP.Media.createTexture(mediaList[mi]);
                    tex.needsUpdate = true;
                    tex.minFilter = THREE.LinearFilter;
                }

                var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.04) : new THREE.PlaneGeometry(cw, ch);
                var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true });

                var mesh = new THREE.Mesh(geo, mat);
                var angle = (ci / cfg.count) * Math.PI * 2;
                mesh.position.set(
                    cfg.radius * Math.cos(angle),
                    0,
                    cfg.radius * Math.sin(angle)
                );
                mesh.lookAt(mesh.position.x * 2, 0, mesh.position.z * 2);
                mesh.userData = { isCard: true, cardIndex: ci };
                ringGroup.add(mesh);
            }

            group.add(ringGroup);
        }

        group.rotation.x = -tilt;
        group.position.y = -1;

        var light1 = new THREE.PointLight(0xffffff, 0.8, 30);
        light1.position.set(5, 8, 10);
        light1.userData = { isLight: true };
        group.add(light1);

        var ambient = new THREE.AmbientLight(0x555566, 0.5);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var ringGroup = this.group.children[i];
            if (!ringGroup.userData.isRing) continue;

            ringGroup.rotation.y = time * speed * 0.3 * ringGroup.userData.direction * ringGroup.userData.speedMult;

            for (var j = 0; j < ringGroup.children.length; j++) {
                var card = ringGroup.children[j];
                if (card.userData.isCard && card.material && card.material.map) {
                    card.material.map.needsUpdate = true;
                }
            }
        }

        var t = time / loopDuration;
        EP.Core.camera.position.set(
            Math.sin(t * Math.PI * 2) * 2,
            5 + Math.sin(time * 0.2) * 1,
            15 + Math.cos(t * Math.PI * 2) * 2
        );
        EP.Core.camera.lookAt(0, -1, 0);
    };

    effect.dispose = function() {
        if (this.group) {
            this.group.traverse(function(child) {
                if (child.material && child.material.map) child.material.map.dispose();
            });
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
