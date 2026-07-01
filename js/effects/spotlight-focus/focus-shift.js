(function() {
    var effect = new EP.EffectBase('focus-shift', {
        name: 'Focus Shift',
        category: 'spotlight-focus',
        icon: '📐',
        description: 'Miniaturas que se expanden por turnos'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 15, max: 45, default: 28, label: 'Card Size', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 2, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot'], default: 'snappy', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 2;
        var gap = this.settings.gap / 100 * 2;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.2);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            var x = (i - (count - 1) / 2) * (cardScale + gap);
            mesh.position.set(x, -3, 0);
            mesh.userData = { index: i, total: count, restX: x, restY: -3 };
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
            if (i === active) {
                var expand = easeOutCubic(Math.min(1, localT * 2));
                var shrink = easeOutCubic(Math.max(0, (localT - 0.7) * 3.33));
                var s = 1 + expand * 1.8 - shrink * 1.8;
                child.scale.setScalar(s);
                child.position.y = child.userData.restY + expand * 3 - shrink * 3;
                child.position.z = 1;
            } else {
                child.scale.setScalar(1);
                child.position.y = child.userData.restY;
                child.position.z = 0;
            }
        });
    };

    EP.Registry.register(effect);
})();
