(function() {
    var effect = new EP.EffectBase('photo-orbit', {
        name: 'Photo Orbit',
        category: 'carousel-flow',
        icon: '🌍',
        description: 'Cluster de tarjetas orbitando lentamente'
    }, [
        { key: 'cardSize', type: 'range', min: 15, max: 50, default: 30, label: 'Card Size', unit: '%' },
        { key: 'spread', type: 'range', min: 2, max: 8, default: 4, step: 0.5, label: 'Spread' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var spread = this.settings.spread;
        var cardScale = this.settings.cardSize / 100 * 3;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.2);

        for (var i = 0; i < count; i++) {
            var phi = Math.acos(1 - 2 * (i + 0.5) / count);
            var theta = Math.PI * (1 + Math.sqrt(5)) * i;
            var x = Math.sin(phi) * Math.cos(theta) * spread;
            var y = Math.sin(phi) * Math.sin(theta) * spread * 0.6;
            var z = Math.cos(phi) * spread * 0.5;
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            mesh.lookAt(0, 0, 10);
            mesh.userData = { basePos: { x: x, y: y, z: z } };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        this.group.rotation.y = t * Math.PI * 2 * 0.3;
        this.group.rotation.x = Math.sin(t * Math.PI * 2) * 0.1;
    };

    EP.Registry.register(effect);
})();
