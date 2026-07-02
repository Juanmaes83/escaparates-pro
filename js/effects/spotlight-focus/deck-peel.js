(function() {
    var effect = new EP.EffectBase('deck-peel', {
        name: 'Deck Peel',
        category: 'spotlight-focus',
        icon: '🃏',
        description: 'Deck centrado con peel lateral'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 25, max: 60, default: 45, label: 'Card Size', unit: '%' },
        { key: 'cardRatio', type: 'aspect', options: ['1:1', '4:3', '3:4', '16:9'], default: '3:4', label: 'Card Ratio' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 6, label: 'Corner Radius', unit: '%' },
        { key: 'spread', type: 'range', min: 0, max: 30, default: 10, label: 'Fan Spread', unit: '°' },
        { key: 'peelDirection', type: 'select', options: [{ v: 'left', l: '← Izquierda' }, { v: 'right', l: '→ Derecha' }, { v: 'alternate', l: '⇄ Alternando' }], default: 'alternate', label: 'Peel' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 4;

        var ratioMap = { '1:1': 1, '4:3': 1.33, '3:4': 0.75, '16:9': 1.78 };
        var ar = ratioMap[this.settings.cardRatio] || 0.75;
        var cardW = cardScale * ar;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.5;
        var geo = EP.RoundedPlaneGeometry(cardW, cardScale, cr);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = (count - i) * 0.02;
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
        var activeFloat = t * count;
        var active = Math.floor(activeFloat) % count;
        var localT = activeFloat % 1;
        var spread = this.settings.spread || 10;
        var peelDir = this.settings.peelDirection || 'alternate';

        this.group.children.forEach(function(child) {
            var i = child.userData.index;

            // Determine peel direction for this card
            var dir;
            if (peelDir === 'left') {
                dir = -1;
            } else if (peelDir === 'right') {
                dir = 1;
            } else {
                // alternate
                dir = i % 2 === 0 ? 1 : -1;
            }

            if (i === active && localT > 0.4) {
                var peelT = easeInOutCubic((localT - 0.4) / 0.6);
                child.position.x = peelT * 8 * dir;
                child.rotation.y = peelT * 0.4 * dir;
                child.rotation.z = 0;
                child.material.opacity = 1 - peelT * 0.8;
            } else {
                child.position.x = 0;
                child.rotation.y = 0;
                child.material.opacity = 1;
                // Fan spread for non-active cards
                var relPos = i - active;
                child.rotation.z = relPos * spread * Math.PI / 180 * 0.15;
            }
            child.position.z = (count - i) * 0.02;
        });
    };

    EP.Registry.register(effect);
})();
