(function() {
    var effect = new EP.EffectBase('orbit-carousel', {
        name: 'Orbit Carousel',
        category: '3d-perspective',
        icon: '🪐',
        description: 'Orbita 3D con profundidad y foco frontal'
    }, [
        { key: 'cardSize', type: 'range', min: 20, max: 60, default: 40, label: 'Card Size', unit: '%' },
        { key: 'radius', type: 'range', min: 2, max: 8, default: 5, step: 0.1, label: 'Radius' },
        { key: 'curve3d', type: 'range', min: 0, max: 100, default: 70, label: '3D Curve', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var radius = this.settings.radius;
        var cardScale = this.settings.cardSize / 100 * 3;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.3);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i, total: count };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var radius = this.settings.radius;
        var curve = this.settings.curve3d / 100;
        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var total = child.userData.total;
            var angle = (i / total) * Math.PI * 2 + t * Math.PI * 2;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius * curve;
            child.position.set(x, 0, z);
            child.lookAt(0, 0, 0);
            var distFromFront = (1 + Math.sin(angle)) / 2;
            child.scale.setScalar(0.6 + distFromFront * 0.5);
            child.material.opacity = 0.5 + distFromFront * 0.5;
        });
    };

    EP.Registry.register(effect);
})();
