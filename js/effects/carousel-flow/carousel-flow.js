(function() {
    var effect = new EP.EffectBase('carousel-flow', {
        name: 'Carousel Flow',
        category: 'carousel-flow',
        icon: '↔️',
        description: 'Scroll lateral clasico con foco central'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 60, default: 40, label: 'Card Size', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 3, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 8, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'cardRatio', type: 'aspect', options: ['1:1', '4:3', '3:4', '16:9'], default: '4:3', label: 'Card Ratio' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 3;
        var gap = this.settings.gap / 100 * 2;
        var ratioMap = { '1:1': 1, '4:3': 1.33, '3:4': 0.75, '16:9': 1.78 };
        var ar = ratioMap[this.settings.cardRatio] || 1;
        var w = cardScale * ar;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.5;
        var geo = EP.RoundedPlaneGeometry(w, cardScale, cr);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i, total: count, cardW: w + gap };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var total = child.userData.total;
            var span = child.userData.cardW;
            var totalW = span * total;
            var x = (i - t * total) * span;
            x = ((x % totalW) + totalW + totalW / 2) % totalW - totalW / 2;
            child.position.x = x;
            var dist = Math.abs(x) / (totalW / 2);
            child.position.z = -dist * 2;
            child.scale.setScalar(1 - dist * 0.3);
            child.material.opacity = 1 - dist * 0.4;
        });
    };

    EP.Registry.register(effect);
})();
