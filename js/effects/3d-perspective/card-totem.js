(function() {
    var effect = new EP.EffectBase('card-totem', {
        name: 'Card Totem',
        category: '3d-perspective',
        icon: '🗼',
        description: 'Tira vertical curvada en 3D'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 60, default: 35, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 6, max: 40, default: 16, step: 1, label: 'Cards' },
        { key: 'height', type: 'range', min: 4, max: 16, default: 10, step: 0.5, label: 'Height' },
        { key: 'curve3d', type: 'range', min: 0, max: 100, default: 50, label: '3D Curve', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'bounce', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.count;
        var totalH = this.settings.height;
        var cardScale = this.settings.cardSize / 100 * 2.5;
        var curve = this.settings.curve3d / 100;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.4);

        for (var i = 0; i < count; i++) {
            var t = i / Math.max(1, count - 1);
            var y = (t - 0.5) * totalH;
            var angle = t * Math.PI * 2;
            var x = Math.sin(angle) * 1.5 * curve;
            var z = Math.cos(angle) * 1.5 * curve;
            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            mesh.lookAt(0, y, 5);
            mesh.userData = { baseY: y };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var offset = t * this.settings.height;
        this.group.children.forEach(function(child) {
            var ny = child.userData.baseY + offset;
            var half = this.settings.height / 2;
            while (ny > half) ny -= this.settings.height;
            while (ny < -half) ny += this.settings.height;
            child.position.y = ny;
        }.bind(this));
    };

    EP.Registry.register(effect);
})();
