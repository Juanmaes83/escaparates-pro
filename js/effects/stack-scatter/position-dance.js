(function() {
    var effect = new EP.EffectBase('position-dance', {
        name: 'Position Dance',
        category: 'stack-scatter',
        icon: '💃',
        description: 'Tarjetas ciclan entre 3 posiciones y escalas'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 50, default: 35, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot', 'bounce'], default: 'snappy', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    var positions = [
        { x: -3, y: 1.5, s: 0.8 },
        { x: 0, y: 0, s: 1.2 },
        { x: 3, y: -1.5, s: 0.8 }
    ];

    function smoothstep(t) { return t * t * (3 - 2 * t); }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = Math.min(mediaList.length, 3);
        var cardScale = this.settings.cardSize / 100 * 3;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.3);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var cycleT = t * 3;
        var step = Math.floor(cycleT) % 3;
        var frac = smoothstep(cycleT % 1);

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var from = positions[(i + step) % 3];
            var to = positions[(i + step + 1) % 3];
            child.position.x = from.x + (to.x - from.x) * frac;
            child.position.y = from.y + (to.y - from.y) * frac;
            child.scale.setScalar(from.s + (to.s - from.s) * frac);
            child.position.z = i * 0.1;
        });
    };

    EP.Registry.register(effect);
})();
