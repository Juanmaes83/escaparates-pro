(function() {
    var effect = new EP.EffectBase('spiral-vortex', {
        name: 'Spiral Vortex',
        category: 'motion',
        icon: '🌪️',
        description: 'Imagenes girando en espiral descendente tipo tornado con profundidad'
    }, [
        { key: 'cardSize', type: 'range', min: 15, max: 45, default: 28, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 6, max: 20, default: 12, step: 1, label: 'Cards' },
        { key: 'spiralTight', type: 'range', min: 10, max: 100, default: 50, label: 'Spiral Tight', unit: '%' },
        { key: 'vortexSpeed', type: 'range', min: 10, max: 100, default: 60, label: 'Vortex Speed', unit: '%' },
        { key: 'depth', type: 'range', min: 2, max: 10, default: 5, step: 0.5, label: 'Depth' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 25, default: 8, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050510', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.count;
        var cardScale = this.settings.cardSize / 100 * 3;
        var h = cardScale * 1.2;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.4;
        var depth = this.settings.depth;

        for (var i = 0; i < count; i++) {
            var geo = EP.RoundedPlaneGeometry(cardScale, h, cr);
            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.transparent = true;
            mat.side = THREE.DoubleSide;
            var mesh = new THREE.Mesh(geo, mat);

            mesh.userData = {
                index: i,
                spiralPos: i / count,
                baseAngle: (i / count) * Math.PI * 2 * 3
            };
            group.add(mesh);
        }

        var coreGeo = new THREE.ConeGeometry(0.08, 0.3, 8);
        var coreMat = new THREE.MeshBasicMaterial({
            color: 0x6644ff, transparent: true, opacity: 0.4
        });
        var core = new THREE.Mesh(coreGeo, coreMat);
        core.rotation.x = Math.PI;
        core.position.y = -depth * 0.5;
        core.userData = { isCore: true };
        group.add(core);

        for (var r = 0; r < 3; r++) {
            var ringGeo = new THREE.RingGeometry(1 + r * 1.5, 1.05 + r * 1.5, 32);
            var ringMat = new THREE.MeshBasicMaterial({
                color: 0x4422aa, transparent: true, opacity: 0.08,
                side: THREE.DoubleSide
            });
            var ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = -r * 0.5;
            ring.userData = { isRing: true, ringIndex: r };
            group.add(ring);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var tight = this.settings.spiralTight / 100;
        var speed = this.settings.vortexSpeed / 100;
        var depth = this.settings.depth;
        var count = this.settings.count;

        var rotTime = t * Math.PI * 2 * speed * 2;

        for (var i = 0; i < this.group.children.length; i++) {
            var child = this.group.children[i];

            if (child.userData.isCore) {
                child.rotation.y = rotTime * 3;
                child.material.opacity = 0.3 + Math.sin(t * Math.PI * 8) * 0.2;
                var hue = (t * 0.3) % 1;
                child.material.color.setHSL(hue, 0.7, 0.5);
                continue;
            }
            if (child.userData.isRing) {
                child.rotation.z = rotTime * (1 + child.userData.ringIndex * 0.3);
                child.material.opacity = 0.05 + Math.sin(t * Math.PI * 4 + child.userData.ringIndex) * 0.03;
                continue;
            }

            var d = child.userData;
            var spiralT = (d.spiralPos + t * speed) % 1;

            var radiusMax = 4;
            var radiusMin = 0.15;
            var radius = radiusMax - (radiusMax - radiusMin) * spiralT * tight;
            radius = Math.max(radiusMin, radius);

            var turns = 2 + tight * 3;
            var angle = d.baseAngle + rotTime + spiralT * Math.PI * 2 * turns;

            var yTop = depth * 0.4;
            var yBot = -depth * 0.6;
            var y = yTop + (yBot - yTop) * spiralT;

            child.position.x = Math.cos(angle) * radius;
            child.position.z = Math.sin(angle) * radius;
            child.position.y = y;

            child.lookAt(0, y - 0.5, 0);
            child.rotation.z += Math.sin(t * Math.PI * 6 + d.index) * 0.1;

            var scaleFactor = 1 - spiralT * 0.6;
            child.scale.setScalar(Math.max(0.1, scaleFactor));

            child.material.opacity = (1 - spiralT * 0.8) * 0.95;
        }
    };

    EP.Registry.register(effect);
})();
