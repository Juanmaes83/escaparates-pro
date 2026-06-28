(function() {
    var effect = new EP.EffectBase('wheel-carousel', {
        name: 'Wheel Carousel',
        category: 'carousel-flow',
        icon: '🎡',
        description: 'Rueda con anticipacion y rebote fisico'
    }, [
        { key: 'cardSize', type: 'range', min: 20, max: 55, default: 38, label: 'Card Size', unit: '%' },
        { key: 'radius', type: 'range', min: 2, max: 7, default: 4, step: 0.5, label: 'Radius' },
        { key: 'easing', type: 'easing', options: ['bounce', 'overshoot', 'elastic', 'smooth'], default: 'bounce', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function bounceEase(t) {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
        if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
        t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
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
        var count = this.group.children.length;
        var stepDuration = 1 / count;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var targetAngle = i / count;
            var phase = ((t - targetAngle) % 1 + 1) % 1;
            var localT = Math.min(1, phase / stepDuration);
            var eased = bounceEase(localT);
            var angle = ((i - eased) / count) * Math.PI * 2;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius * 0.4;
            child.position.set(x, Math.sin(angle) * radius * 0.2, z);
            child.lookAt(0, 0, 10);
            var front = (1 + Math.cos(angle)) / 2;
            child.scale.setScalar(0.7 + front * 0.4);
        });
    };

    EP.Registry.register(effect);
})();
