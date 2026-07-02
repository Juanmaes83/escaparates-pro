(function() {
    var effect = new EP.EffectBase('wheel-carousel', {
        name: 'Wheel Carousel',
        category: 'carousel-flow',
        icon: '🎡',
        description: 'Rueda con anticipacion y rebote fisico'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 55, default: 38, label: 'Card Size', unit: '%' },
        { key: 'radius', type: 'range', min: 2, max: 7, default: 4, step: 0.5, label: 'Radius' },
        { key: 'focusScale', type: 'range', min: 80, max: 150, default: 100, label: 'Focus Scale', unit: '%' },
        { key: 'dimAmount', type: 'range', min: 0, max: 100, default: 0, label: 'Dim Periféricos', unit: '%' },
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
            mat.transparent = true;
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
        var dimAmount = (this.settings.dimAmount || 0) / 100;
        var focusMult = (this.settings.focusScale || 100) / 100;

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

            // frontness: 0 = back, 1 = front
            var front = (1 + Math.cos(angle)) / 2;
            var isFront = front > 0.85;

            if (isFront) {
                child.scale.setScalar(focusMult);
                child.material.opacity = 1;
            } else {
                child.scale.setScalar(0.7 + front * 0.4);
                child.material.opacity = dimAmount > 0
                    ? Math.max(0.08, 1 - dimAmount * (1 - front) * 1.5)
                    : 1;
            }
            child.material.transparent = dimAmount > 0 || isFront;
        });
    };

    EP.Registry.register(effect);
})();
