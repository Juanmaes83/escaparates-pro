(function() {
    var effect = new EP.EffectBase('zoom-tunnel', {
        name: 'Infinite Zoom Tunnel',
        category: '3d-perspective',
        icon: '🕳️',
        description: 'Tunel infinito de imagenes con zoom hipnotico'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 80, default: 55, label: 'Card Size', unit: '%' },
        { key: 'depth', type: 'range', min: 5, max: 20, default: 12, step: 1, label: 'Depth' },
        { key: 'spacing', type: 'range', min: 1, max: 5, default: 2.5, step: 0.5, label: 'Spacing' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 6, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'linear', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050508', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.depth;
        var cardScale = this.settings.cardSize / 100 * 5;
        var spacing = this.settings.spacing;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.3;
        var geo = EP.RoundedPlaneGeometry(cardScale, cardScale * 0.65, cr);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = -i * spacing;
            mesh.userData = { index: i, total: count, baseZ: -i * spacing };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var spacing = this.settings.spacing;
        var count = this.group.children.length;
        var totalDepth = count * spacing;
        var zOffset = t * totalDepth;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var z = -i * spacing + zOffset;
            z = ((z % totalDepth) + totalDepth) % totalDepth;
            z = z - spacing;
            child.position.z = -z;

            var norm = z / totalDepth;
            child.material.opacity = norm < 0.1 ? norm * 10 : (norm > 0.85 ? (1 - norm) / 0.15 : 1);

            var scale = 1 + (1 - norm) * 0.3;
            child.scale.setScalar(scale);
        });
    };

    EP.Registry.register(effect);
})();
