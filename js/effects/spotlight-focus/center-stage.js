(function() {
    var effect = new EP.EffectBase('center-stage', {
        name: 'Center Stage',
        category: 'spotlight-focus',
        icon: '🎯',
        description: 'Un diseno protagonista en cada intervalo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 80, default: 55, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot'], default: 'smooth', label: 'Easing' },
        { key: 'cardRatio', type: 'aspect', options: ['1:1', '4:3', '3:4', '16:9', '9:16'], default: '4:3', label: 'Card Ratio' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function smoothstep(t) { return t * t * (3 - 2 * t); }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 5;
        var ratioMap = { '1:1': 1, '4:3': 1.33, '3:4': 0.75, '16:9': 1.78, '9:16': 0.56 };
        var ar = ratioMap[this.settings.cardRatio] || 1;
        var geo = new THREE.PlaneGeometry(cardScale * ar, cardScale);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
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
            if (i === active) {
                child.visible = true;
                var fadeIn = smoothstep(Math.min(1, localT * 4));
                var fadeOut = smoothstep(Math.max(0, (localT - 0.8) * 5));
                child.material.opacity = fadeIn - fadeOut;
                child.scale.setScalar(0.9 + fadeIn * 0.1);
            } else {
                child.visible = false;
            }
        });
    };

    EP.Registry.register(effect);
})();
