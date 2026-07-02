(function() {
    var effect = new EP.EffectBase('magnetic-poles', {
        name: 'Magnetic Poles',
        category: 'field',
        icon: '🧲',
        description: 'Tarjetas atraídas y repelidas por polos magnéticos oscilantes'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 10, max: 50, default: 25, label: 'Card Size', unit: '%' },
        { key: 'fieldStrength', type: 'range', min: 10, max: 100, default: 55, label: 'Field Strength', unit: '%' },
        { key: 'poleDistance', type: 'range', min: 1, max: 6, default: 3, step: 0.5, label: 'Pole Distance' },
        { key: 'dimAmount', type: 'range', min: 0, max: 80, default: 30, label: 'Dim Periféricos', unit: '%' },
        { key: 'background', type: 'color', default: '#060612', label: 'Background' }
    ]);

    function seededRand(seed) {
        var x = Math.sin(seed + 1) * 43758.5453;
        return x - Math.floor(x);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = Math.min(mediaList.length, 12);
        var cardW = 2.0 * this.settings.cardSize / 100;

        for (var i = 0; i < count; i++) {
            var geo = new THREE.PlaneGeometry(cardW, cardW * 1.3);
            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            // Base angle around the field — evenly distributed
            var baseAngle = (i / count) * Math.PI * 2;
            var baseR = 2 + seededRand(i * 7) * 1.5;
            mesh.userData = { index: i, total: count, baseAngle: baseAngle, baseR: baseR };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speedMult = (this.settings.playbackMotionSpeed || 100) / 100;
        var strength = (this.settings.fieldStrength || 55) / 100;
        var poleDist = this.settings.poleDistance || 3;
        var dimAmount = (this.settings.dimAmount || 30) / 100;

        // Two poles oscillating: N pole left-right, S pole opposite
        var poleAngle = t * Math.PI * 2 * speedMult;
        var northX = Math.cos(poleAngle) * poleDist * 0.5;
        var northY = Math.sin(poleAngle * 0.7) * poleDist * 0.3;
        var southX = -northX;
        var southY = -northY;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var total = child.userData.total;
            var baseAngle = child.userData.baseAngle;
            var baseR = child.userData.baseR;

            // Base position on the ring
            var baseX = Math.cos(baseAngle + t * 0.3 * speedMult) * baseR;
            var baseY = Math.sin(baseAngle + t * 0.3 * speedMult) * baseR * 0.6;

            // Magnetic attraction: pull toward nearest pole
            var toNorthX = northX - baseX, toNorthY = northY - baseY;
            var distN = Math.sqrt(toNorthX * toNorthX + toNorthY * toNorthY) + 0.01;
            var toSouthX = southX - baseX, toSouthY = southY - baseY;
            var distS = Math.sqrt(toSouthX * toSouthX + toSouthY * toSouthY) + 0.01;

            // Even cards attracted to N, odd to S
            var attract = (i % 2 === 0)
                ? { x: toNorthX / (distN * distN), y: toNorthY / (distN * distN) }
                : { x: toSouthX / (distS * distS), y: toSouthY / (distS * distS) };

            var pull = strength * 1.5;
            var x = baseX + attract.x * pull;
            var y = baseY + attract.y * pull;

            // Clamp
            x = Math.max(-5, Math.min(5, x));
            y = Math.max(-3.5, Math.min(3.5, y));

            child.position.set(x, y, 0);

            // Orient card toward its pole (slight rotation)
            var poleTarget = (i % 2 === 0) ? { x: northX, y: northY } : { x: southX, y: southY };
            var angle = Math.atan2(poleTarget.y - y, poleTarget.x - x);
            child.rotation.z = angle * 0.2;

            // Dim by distance from center
            if (child.material && dimAmount > 0) {
                var distFromCenter = Math.sqrt(x * x + y * y) / 4;
                child.material.opacity = Math.max(0.1, 1 - dimAmount * distFromCenter);
            } else if (child.material) {
                child.material.opacity = 1;
            }
        });
    };

    EP.Registry.register(effect);
})();
