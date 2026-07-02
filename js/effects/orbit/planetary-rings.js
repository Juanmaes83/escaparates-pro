(function() {
    var effect = new EP.EffectBase('planetary-rings', {
        name: 'Planetary Rings',
        category: 'orbit',
        icon: '🪐',
        description: 'Imágenes en anillos orbitales elípticos inclinados — sistema planetario visual'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 10, max: 45, default: 22, label: 'Card Size', unit: '%' },
        { key: 'ringCount', type: 'range', min: 2, max: 4, default: 3, step: 1, label: 'Rings' },
        { key: 'ringSpread', type: 'range', min: 1, max: 4, default: 2, step: 0.5, label: 'Ring Spread' },
        { key: 'inclination', type: 'range', min: 0, max: 60, default: 25, label: 'Inclination', unit: '°' },
        { key: 'dimAmount', type: 'range', min: 0, max: 80, default: 40, label: 'Dim Periféricos', unit: '%' },
        { key: 'background', type: 'color', default: '#04040e', label: 'Background' }
    ]);

    // Ring configs: [radiusMultiplier, speedMultiplier, inclinationOffset, eccentricity]
    var RING_CONFIGS = [
        [1.0,  1.0,   0,   0.15],
        [1.7,  0.63,  25,  0.08],
        [2.5,  0.40, -15,  0.20],
        [3.4,  0.28,  40,  0.05]
    ];

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var rings = Math.min(this.settings.ringCount || 3, 4);
        var cardW = 2.2 * this.settings.cardSize / 100;
        var cardH = cardW * 1.3;
        var perRing = Math.max(2, Math.ceil(count / rings));

        for (var r = 0; r < rings; r++) {
            var ringGroup = new THREE.Group();
            var cfg = RING_CONFIGS[r];
            ringGroup.userData = { ring: r, speedMult: cfg[1], inclinationDeg: cfg[2], ecc: cfg[3] };

            var n = (r === rings - 1) ? Math.max(1, count - r * perRing) : perRing;
            for (var i = 0; i < n; i++) {
                var mediaIdx = (r * perRing + i) % count;
                var geo = new THREE.PlaneGeometry(cardW, cardH);
                var mat = EP.Media.createMaterial(mediaList[mediaIdx]);
                mat.transparent = true;
                var mesh = new THREE.Mesh(geo, mat);
                mesh.userData = { posInRing: i, totalInRing: n, ring: r };
                ringGroup.add(mesh);
            }
            group.add(ringGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speedMult = (this.settings.playbackMotionSpeed || 100) / 100;
        var baseRadius = (this.settings.ringSpread || 2);
        var globalInclination = (this.settings.inclination || 25) * Math.PI / 180;
        var dimAmount = (this.settings.dimAmount || 40) / 100;

        this.group.children.forEach(function(ringGroup) {
            var cfg = RING_CONFIGS[ringGroup.userData.ring] || RING_CONFIGS[0];
            var radius = baseRadius * cfg[0];
            var speed = cfg[1] * speedMult;
            var incOff = (cfg[2] * Math.PI / 180);
            var ecc = cfg[3]; // ellipse eccentricity: b = a * (1 - ecc)

            // Tilt the ring by its inclination
            ringGroup.rotation.x = globalInclination + incOff;

            var n = ringGroup.children.length;
            ringGroup.children.forEach(function(card) {
                var i = card.userData.posInRing;
                var angle = (i / n) * Math.PI * 2 + t * Math.PI * 2 * speed;
                var a = radius;
                var b = radius * (1 - ecc);
                var x = Math.cos(angle) * a;
                var z = Math.sin(angle) * b;
                card.position.set(x, 0, z);
                // Always face viewer
                card.rotation.x = -(globalInclination + incOff);

                // Dim cards on the far side (z < 0 in world space)
                var worldZ = Math.sin(angle) * b;
                var frontness = (1 - worldZ / radius) / 2; // 0-1
                if (card.material) {
                    card.material.opacity = dimAmount > 0
                        ? Math.max(0.1, 1 - dimAmount * (1 - frontness))
                        : 1;
                }
            });
        });
    };

    EP.Registry.register(effect);
})();
