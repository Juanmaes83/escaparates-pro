(function() {
    var effect = new EP.EffectBase('split-reveal', {
        name: 'Split Reveal',
        category: 'reveal-wipe',
        icon: '⟺',
        description: 'Paneles emparejados desde lados opuestos'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 35, max: 75, default: 55, label: 'Card Size', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 3, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = Math.min(mediaList.length, 6);
        var pairs = Math.ceil(count / 2);
        var cardScale = this.settings.cardSize / 100 * 3.5;
        var gap = this.settings.gap / 100 * 2;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.4);

        for (var p = 0; p < pairs; p++) {
            var pairGroup = new THREE.Group();
            pairGroup.visible = false;
            pairGroup.userData = { pairIndex: p, totalPairs: pairs };

            var leftMat = EP.Media.createMaterial(mediaList[(p * 2) % mediaList.length]);
            var left = new THREE.Mesh(geo, leftMat);
            left.position.x = -(cardScale / 2 + gap / 2);
            left.userData = { side: 'left', restX: left.position.x };
            pairGroup.add(left);

            if (p * 2 + 1 < mediaList.length) {
                var rightMat = EP.Media.createMaterial(mediaList[p * 2 + 1]);
                var right = new THREE.Mesh(geo, rightMat);
                right.position.x = cardScale / 2 + gap / 2;
                right.userData = { side: 'right', restX: right.position.x };
                pairGroup.add(right);
            }
            group.add(pairGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var pairs = this.group.children.length;
        var perPair = 1 / pairs;

        this.group.children.forEach(function(pairGroup) {
            var p = pairGroup.userData.pairIndex;
            var start = p * perPair;
            var local = ((t - start) / perPair + 1) % 1;
            pairGroup.visible = true;

            pairGroup.children.forEach(function(panel) {
                var enterT = easeOutQuart(Math.min(1, local * 3));
                var exitT = easeOutQuart(Math.max(0, (local - 0.7) * 3.33));
                var offscreen = panel.userData.side === 'left' ? -12 : 12;
                panel.position.x = panel.userData.restX + offscreen * (1 - enterT) + offscreen * exitT;
                panel.material.opacity = enterT - exitT;
            });

            pairGroup.visible = pairGroup.children[0].material.opacity > 0.01;
        });
    };

    EP.Registry.register(effect);
})();
