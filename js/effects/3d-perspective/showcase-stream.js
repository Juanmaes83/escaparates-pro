(function() {
    var effect = new EP.EffectBase('showcase-stream', {
        name: 'Showcase Stream',
        category: '3d-perspective',
        icon: '🌀',
        description: 'Tarjetas curvadas en anillo 3D inclinado'
    }, [
        { key: 'cardSize', type: 'range', min: 15, max: 60, default: 32, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 8, max: 60, default: 24, step: 1, label: 'Cards' },
        { key: 'radius', type: 'range', min: 2, max: 8, default: 4.5, step: 0.1, label: 'Radius' },
        { key: 'tilt', type: 'range', min: 0, max: 45, default: 20, label: 'Tilt', unit: '°' },
        { key: 'curve3d', type: 'range', min: 0, max: 100, default: 60, label: '3D Curve', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 2, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 5, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'motion', type: 'select', options: [{ v: 'continuous', l: 'Continuous' }, { v: 'stop-at-center', l: 'Stop at center' }], default: 'continuous', label: 'Motion' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.count;
        var radius = this.settings.radius;
        var tiltDeg = this.settings.tilt;
        var cardScale = this.settings.cardSize / 100 * 3;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.2);

        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius;
            var y = Math.sin(angle) * radius * Math.sin(THREE.MathUtils.degToRad(tiltDeg)) * (this.settings.curve3d / 100);

            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            mesh.lookAt(0, y * 0.5, 0);
            mesh.userData = { angle: angle, baseY: y };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speed = this.settings.motion === 'continuous' ? 1 : 0.5;
        this.group.rotation.y = t * Math.PI * 2 * speed;
    };

    EP.Registry.register(effect);
})();
