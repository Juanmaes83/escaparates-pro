(function() {
    var effect = new EP.EffectBase('stack-slide', {
        name: 'Stack Slide',
        category: 'stack-scatter',
        icon: '📚',
        description: 'Tarjetas se apilan con aterrizaje elastico'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 25, max: 55, default: 40, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['elastic', 'bounce', 'overshoot', 'smooth'], default: 'elastic', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function elasticOut(t) {
        return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 3;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.4);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i, total: count };
            mesh.position.set(0, -8, i * 0.05);
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var arriveAt = i / count;
            var local = Math.max(0, (t - arriveAt) / (1 / count));
            if (local > 1) local = 1;
            var e = elasticOut(Math.min(1, local));
            var targetY = (i - count / 2) * 0.15;
            child.position.y = targetY + (1 - e) * -8;
            child.position.z = i * 0.05;
            child.rotation.z = (1 - e) * (i % 2 === 0 ? 0.3 : -0.3);
        });
    };

    EP.Registry.register(effect);
})();
