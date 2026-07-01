(function() {
    var effect = new EP.EffectBase('image-trail', {
        name: 'Image Trail',
        category: 'stack-scatter',
        icon: '✧',
        description: 'Estela de tarjetas en arco que se desvanecen'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 15, max: 45, default: 25, label: 'Card Size', unit: '%' },
        { key: 'trail', type: 'range', min: 4, max: 20, default: 10, step: 1, label: 'Trail Length' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var trail = this.settings.trail;
        var cardScale = this.settings.cardSize / 100 * 3;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.2);

        for (var i = 0; i < trail; i++) {
            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i, total: trail };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var trail = this.group.children.length;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var offset = i / trail;
            var phase = ((t - offset * 0.3) % 1 + 1) % 1;
            var angle = phase * Math.PI * 1.5 - Math.PI * 0.75;
            var radius = 4;
            child.position.x = Math.cos(angle) * radius;
            child.position.y = Math.sin(angle) * radius * 0.6;
            child.position.z = -i * 0.1;
            child.scale.setScalar(1 - i / trail * 0.5);
            child.material.opacity = 1 - i / trail * 0.7;
            child.rotation.z = angle * 0.1;
        });
    };

    EP.Registry.register(effect);
})();
