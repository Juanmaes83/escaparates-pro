(function() {
    var effect = new EP.EffectBase('proximity-bloom', {
        name: 'Proximity Bloom',
        category: 'proximity',
        icon: '🌸',
        description: 'Tarjetas que florecen desde el centro y se contraen — reacción a la proximidad'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 15, max: 55, default: 28, label: 'Card Size', unit: '%' },
        { key: 'bloomRadius', type: 'range', min: 1, max: 6, default: 3.5, step: 0.5, label: 'Bloom Radius' },
        { key: 'stagger', type: 'range', min: 0, max: 1.5, default: 0.4, step: 0.05, label: 'Stagger', unit: 's' },
        { key: 'rotation', type: 'range', min: 0, max: 100, default: 20, label: 'Rotation', unit: '%' },
        { key: 'dimAmount', type: 'range', min: 0, max: 80, default: 0, label: 'Dim Periféricos', unit: '%' },
        { key: 'background', type: 'color', default: '#080a14', label: 'Background' }
    ]);

    function easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardW = 2.2 * this.settings.cardSize / 100;
        var cardH = cardW * 1.35;

        for (var i = 0; i < count; i++) {
            var geo = new THREE.PlaneGeometry(cardW, cardH);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            var angle = (i / count) * Math.PI * 2;
            mesh.userData = { index: i, total: count, baseAngle: angle };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var count = this.group.children.length;
        if (!count) return;

        var t = time / loopDuration;
        var speedMult = (this.settings.playbackMotionSpeed || 100) / 100;
        var bloomR = this.settings.bloomRadius || 3.5;
        var stagger = this.settings.stagger || 0.4;
        var rotAmt = (this.settings.rotation || 20) / 100;
        var dimAmount = (this.settings.dimAmount || 0) / 100;

        // Global bloom cycle: 0→bloom→hold→contract
        var cycle = (t * speedMult) % 1;
        // Bloom out: 0-0.35, hold: 0.35-0.65, contract: 0.65-1.0
        var globalBloom;
        if (cycle < 0.35) {
            globalBloom = easeInOut(cycle / 0.35);
        } else if (cycle < 0.65) {
            globalBloom = 1;
        } else {
            globalBloom = easeInOut(1 - (cycle - 0.65) / 0.35);
        }

        // Slow ring rotation when fully bloomed
        var ringAngle = t * speedMult * Math.PI * 0.5 * rotAmt;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var total = child.userData.total;
            var baseAngle = child.userData.baseAngle;

            // Stagger: each card blooms slightly after the previous
            var staggerOffset = (i / total) * stagger;
            var staggeredCycle = ((t * speedMult - staggerOffset) % 1 + 1) % 1;
            var cardBloom;
            if (staggeredCycle < 0.35) {
                cardBloom = easeInOut(staggeredCycle / 0.35);
            } else if (staggeredCycle < 0.65) {
                cardBloom = 1;
            } else {
                cardBloom = easeInOut(1 - (staggeredCycle - 0.65) / 0.35);
            }

            var dist = bloomR * cardBloom;
            var angle = baseAngle + ringAngle;
            var x = Math.cos(angle) * dist;
            var y = Math.sin(angle) * dist * 0.65; // ellipse
            var z = cardBloom * 0.3;

            child.position.set(x, y, z);
            child.scale.setScalar(0.3 + cardBloom * 0.7); // scale from 30% to 100%

            // Card leans slightly outward as it blooms
            child.rotation.z = Math.cos(angle) * cardBloom * 0.15;

            if (child.material) {
                var distFromCenter = dist / bloomR;
                child.material.opacity = dimAmount > 0
                    ? Math.max(0.1, 1 - dimAmount * distFromCenter)
                    : Math.max(0.2, cardBloom);
            }
        });
    };

    EP.Registry.register(effect);
})();
