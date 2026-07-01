(function() {
    var effect = new EP.EffectBase('diagonal-wipe', {
        name: 'Diagonal Wipe',
        category: 'reveal-wipe',
        icon: '⟋',
        description: 'Reveal diagonal con borde deslizante'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 40, max: 90, default: 70, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 7;
        var geo = new THREE.PlaneGeometry(cardScale * 1.6, cardScale);

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
        var count = this.group.children.length;
        var perSlide = 1 / count;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var start = i * perSlide;
            var local = ((t - start) / perSlide + 1) % 1;
            var wipeProgress = local * 2 - 0.5;
            child.position.x = Math.max(0, (1 - local * 1.5)) * 12;
            child.position.z = (count - i) * 0.01 + (i === Math.floor(t * count) % count ? 0.5 : 0);
            child.material.opacity = local < 0.1 ? local * 10 : (local > 0.9 ? (1 - local) * 10 : 1);
            child.visible = child.material.opacity > 0.01;
        });
    };

    EP.Registry.register(effect);
})();
