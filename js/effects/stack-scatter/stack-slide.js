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
        { key: 'cardRatio', type: 'aspect', options: ['1:1', '4:3', '3:4', '16:9'], default: '3:4', label: 'Card Ratio' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 8, label: 'Corner Radius', unit: '%' },
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

        var ratioMap = { '1:1': 1, '4:3': 1.33, '3:4': 0.75, '16:9': 1.78 };
        var ar = ratioMap[this.settings.cardRatio] || 0.75;
        var cardW = cardScale * ar;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.5;
        var geo = EP.RoundedPlaneGeometry(cardW, cardScale, cr);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
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
        var activeFloat = t * count;
        var active = Math.floor(activeFloat) % count;
        var localT = activeFloat % 1;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var relPos = ((i - active) % count + count) % count;
            // relPos: 0 = current active, 1 = next, count-1 = previous

            var targetY, targetZ, targetScale, targetOpacity;

            if (relPos === 0) {
                // Active card: slide in from top, ease to center
                var e = Math.min(1, localT * 3);
                e = 1 - Math.pow(1 - e, 3); // ease out cubic
                targetY = (1 - e) * -6;
                targetZ = 0.1 * count;
                targetScale = 1;
                targetOpacity = 1;
            } else if (relPos === count - 1) {
                // Previous card: slide off to bottom
                var exitT = Math.max(0, (localT - 0.6) / 0.4);
                exitT = exitT * exitT;
                targetY = exitT * -6;
                targetZ = 0;
                targetScale = 1 - exitT * 0.3;
                targetOpacity = 1 - exitT;
            } else {
                // Waiting cards: stacked behind, visually offset
                var stackPos = Math.min(relPos, 3);
                targetY = (count - stackPos) * 0.1;
                targetZ = -stackPos * 0.5;
                targetScale = 1 - stackPos * 0.05;
                targetOpacity = Math.max(0, 1 - stackPos * 0.3);
            }

            child.position.y = targetY;
            child.position.z = targetZ;
            child.scale.setScalar(targetScale);
            child.material.opacity = targetOpacity;
            child.material.transparent = true;
            child.rotation.z = 0; // reset any previous rotation
        });
    };

    EP.Registry.register(effect);
})();
