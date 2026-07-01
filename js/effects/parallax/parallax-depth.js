(function() {
    var effect = new EP.EffectBase('parallax-depth', {
        name: 'Parallax Depth Layers',
        category: 'parallax',
        icon: '🏔️',
        description: 'Capas con profundidad parallax tipo diorama'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 25, max: 60, default: 42, label: 'Card Size', unit: '%' },
        { key: 'depthSpread', type: 'range', min: 1, max: 10, default: 5, step: 0.5, label: 'Depth Spread' },
        { key: 'parallaxStrength', type: 'range', min: 10, max: 100, default: 60, label: 'Parallax Force', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 6, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#08080f', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.5;
        var depth = this.settings.depthSpread;

        for (var i = 0; i < count; i++) {
            var layer = i / (count - 1 || 1);
            var w = cardScale * (0.7 + layer * 0.6);
            var h = w * 0.75;
            var geo = EP.RoundedPlaneGeometry(w, h, cr * (0.5 + layer * 0.5));
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            mat.opacity = 0.5 + layer * 0.5;
            var mesh = new THREE.Mesh(geo, mat);
            var z = -depth + layer * depth;
            var xSpread = (Math.random() - 0.5) * 3 * (1 - layer);
            var ySpread = (Math.random() - 0.5) * 2 * (1 - layer);
            mesh.position.set(xSpread, ySpread, z);
            mesh.userData = {
                layer: layer,
                baseX: xSpread,
                baseY: ySpread,
                baseZ: z,
                speed: 0.3 + layer * 0.7
            };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var strength = this.settings.parallaxStrength / 100;
        var wave = Math.sin(t * Math.PI * 2);
        var wave2 = Math.cos(t * Math.PI * 2);

        this.group.children.forEach(function(child) {
            var s = child.userData.speed;
            var layer = child.userData.layer;
            child.position.x = child.userData.baseX + wave * s * strength * 1.5;
            child.position.y = child.userData.baseY + wave2 * s * strength * 0.8;
            child.position.z = child.userData.baseZ + Math.sin(t * Math.PI * 4 + layer * 3) * 0.3 * strength;
            var sc = 1 + Math.sin(t * Math.PI * 2 + layer * 2) * 0.05 * strength;
            child.scale.setScalar(sc);
        });
    };

    EP.Registry.register(effect);
})();
