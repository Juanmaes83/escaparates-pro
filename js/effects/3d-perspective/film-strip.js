(function() {
    var effect = new EP.EffectBase('film-strip', {
        name: 'Film Strip',
        category: '3d-perspective',
        icon: '🎞️',
        description: 'Banda horizontal curvada en 3D'
    }, [
        { key: 'cardSize', type: 'range', min: 15, max: 50, default: 32, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 6, max: 40, default: 18, step: 1, label: 'Cards' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 2.5, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'curve3d', type: 'range', min: 0, max: 100, default: 78, label: '3D Curve', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 5, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot', 'bounce', 'elastic', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'cardRatio', type: 'aspect', options: ['1:1', '4:3', '3:4', '16:9', '9:16'], default: '1:1', label: 'Card Ratio' },
        { key: 'motion', type: 'select', options: [{ v: 'continuous', l: 'Continuous' }, { v: 'stop-at-center', l: 'Stop at center' }], default: 'continuous', label: 'Motion' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function getAspectMultiplier(ratio) {
        switch (ratio) {
            case '4:3': return { w: 1.33, h: 1 };
            case '3:4': return { w: 0.75, h: 1 };
            case '16:9': return { w: 1.78, h: 1 };
            case '9:16': return { w: 0.56, h: 1 };
            default: return { w: 1, h: 1 };
        }
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.count;
        var cardScale = this.settings.cardSize / 100 * 3;
        var gap = this.settings.gap / 100 * 2;
        var curve = this.settings.curve3d / 100;
        var ar = getAspectMultiplier(this.settings.cardRatio);
        var geo = new THREE.PlaneGeometry(cardScale * ar.w, cardScale * ar.h);
        var totalWidth = count * (cardScale * ar.w + gap);

        for (var i = 0; i < count; i++) {
            var x = (i / (count - 1) - 0.5) * totalWidth;
            var normalizedX = (i / (count - 1)) * 2 - 1;
            var z = -Math.abs(normalizedX) * 3 * curve;
            var rotY = normalizedX * 0.3 * curve;
            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, 0, z);
            mesh.rotation.y = rotY;
            mesh.userData = { baseX: x };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var cardScale = this.settings.cardSize / 100 * 3;
        var ar = getAspectMultiplier(this.settings.cardRatio);
        var gap = this.settings.gap / 100 * 2;
        var totalWidth = this.settings.count * (cardScale * ar.w + gap);
        var offset = t * totalWidth;

        this.group.children.forEach(function(child) {
            var x = child.userData.baseX - offset;
            while (x < -totalWidth / 2) x += totalWidth;
            while (x > totalWidth / 2) x -= totalWidth;
            child.position.x = x;
            var norm = (x / (totalWidth / 2));
            child.position.z = -Math.abs(norm) * 3 * (this.settings.curve3d / 100);
            child.rotation.y = norm * 0.3 * (this.settings.curve3d / 100);
        }.bind(this));
    };

    EP.Registry.register(effect);
})();
