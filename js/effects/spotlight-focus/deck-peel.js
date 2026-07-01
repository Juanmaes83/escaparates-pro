(function() {
    var effect = new EP.EffectBase('deck-peel', {
        name: 'Deck Peel',
        category: 'spotlight-focus',
        icon: '🃏',
        description: 'Deck centrado con peel lateral'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 25, max: 60, default: 45, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 4;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.35);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = (count - i) * 0.02;
            mesh.userData = { index: i, total: count };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var activeFloat = t * count;
        var active = Math.floor(activeFloat) % count;
        var localT = activeFloat % 1;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            if (i === active && localT > 0.4) {
                var peelT = easeInOutCubic((localT - 0.4) / 0.6);
                var dir = i % 2 === 0 ? 1 : -1;
                child.position.x = peelT * 8 * dir;
                child.rotation.y = peelT * 0.4 * dir;
                child.material.opacity = 1 - peelT * 0.8;
            } else {
                child.position.x = 0;
                child.rotation.y = 0;
                child.material.opacity = 1;
            }
            child.position.z = (count - i) * 0.02;
        });
    };

    EP.Registry.register(effect);
})();
