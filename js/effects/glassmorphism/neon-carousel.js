(function() {
    var effect = new EP.EffectBase('neon-carousel', {
        name: 'Neon Glow Carousel',
        category: 'glassmorphism',
        icon: '🌈',
        description: 'Carousel 3D con aura neon pulsante y bordes luminosos'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 50, default: 35, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 5, max: 20, default: 10, step: 1, label: 'Cards' },
        { key: 'radius', type: 'range', min: 2, max: 7, default: 4.5, step: 0.1, label: 'Radius' },
        { key: 'glowIntensity', type: 'range', min: 10, max: 100, default: 70, label: 'Glow', unit: '%' },
        { key: 'colorSpeed', type: 'range', min: 10, max: 100, default: 40, label: 'Color Speed', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 8, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#06060e', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.count;
        var cardScale = this.settings.cardSize / 100 * 3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.5;
        var h = cardScale * 1.3;
        var radius = this.settings.radius;
        var geo = EP.RoundedPlaneGeometry(cardScale, h, cr);

        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var cardGroup = new THREE.Group();

            var glowGeo = EP.RoundedPlaneGeometry(cardScale + 0.2, h + 0.2, cr + 0.1);
            var glowMat = new THREE.MeshBasicMaterial({
                color: 0xff00ff, transparent: true, opacity: 0.15,
                side: THREE.DoubleSide
            });
            var glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.z = -0.02;
            glow.userData = { isGlow: true };
            cardGroup.add(glow);

            var outerGeo = EP.RoundedPlaneGeometry(cardScale + 0.4, h + 0.4, cr + 0.2);
            var outerMat = new THREE.MeshBasicMaterial({
                color: 0xff00ff, transparent: true, opacity: 0.06,
                side: THREE.DoubleSide
            });
            var outer = new THREE.Mesh(outerGeo, outerMat);
            outer.position.z = -0.04;
            outer.userData = { isOuter: true };
            cardGroup.add(outer);

            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.transparent = true;
            mat.opacity = 0.92;
            var mesh = new THREE.Mesh(geo, mat);
            cardGroup.add(mesh);

            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius;
            cardGroup.position.set(x, 0, z);
            cardGroup.lookAt(0, 0, 0);
            cardGroup.userData = { angle: angle, index: i, hue: i / count };
            group.add(cardGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var glow = this.settings.glowIntensity / 100;
        var colorSpd = this.settings.colorSpeed / 100;

        this.group.rotation.y = t * Math.PI * 2;

        this.group.children.forEach(function(card) {
            var hue = (card.userData.hue + t * colorSpd) % 1;
            var pulse = 0.5 + Math.sin(t * Math.PI * 6 + card.userData.index * 1.2) * 0.5;

            var distFromFront = Math.abs(Math.sin(card.userData.angle + t * Math.PI * 2));
            var isFront = 1 - distFromFront;
            var glowMult = (0.3 + isFront * 0.7) * glow;

            card.children.forEach(function(child) {
                if (child.userData.isGlow) {
                    child.material.color.setHSL(hue, 0.9, 0.6);
                    child.material.opacity = (0.1 + pulse * 0.2) * glowMult;
                    child.scale.setScalar(1 + pulse * 0.05 * glow);
                } else if (child.userData.isOuter) {
                    child.material.color.setHSL((hue + 0.1) % 1, 0.8, 0.5);
                    child.material.opacity = (0.03 + pulse * 0.08) * glowMult;
                    child.scale.setScalar(1 + pulse * 0.08 * glow);
                }
            });

            var scale = 0.85 + isFront * 0.15;
            card.children[2].material.opacity = 0.7 + isFront * 0.3;
            card.scale.setScalar(scale);
        });
    };

    EP.Registry.register(effect);
})();
