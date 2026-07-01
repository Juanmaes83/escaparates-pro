(function() {
    var effect = new EP.EffectBase('glass-cards', {
        name: 'Glassmorphism Cards',
        category: 'glassmorphism',
        icon: '💎',
        description: 'Tarjetas con efecto vidrio esmerilado y bordes luminosos'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 55, default: 36, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 4, max: 20, default: 8, step: 1, label: 'Cards' },
        { key: 'radius', type: 'range', min: 2, max: 7, default: 4, step: 0.1, label: 'Radius' },
        { key: 'glassOpacity', type: 'range', min: 10, max: 90, default: 55, label: 'Glass Opacity', unit: '%' },
        { key: 'borderGlow', type: 'range', min: 0, max: 100, default: 60, label: 'Border Glow', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 12, label: 'Corner Radius', unit: '%' },
        { key: 'tilt', type: 'range', min: 0, max: 30, default: 10, label: 'Tilt', unit: '°' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a12', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.count;
        var cardScale = this.settings.cardSize / 100 * 3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.5;
        var h = cardScale * 1.3;
        var geo = EP.RoundedPlaneGeometry(cardScale, h, cr);
        var borderGeo = EP.RoundedPlaneGeometry(cardScale + 0.04, h + 0.04, cr + 0.02);
        var radius = this.settings.radius;
        var glassAlpha = this.settings.glassOpacity / 100;
        var borderIntensity = this.settings.borderGlow / 100;

        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius;
            var y = Math.sin(angle * 2) * 0.5 * (this.settings.tilt / 30);

            var cardGroup = new THREE.Group();

            var borderMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL((i / count + 0.5) % 1, 0.6, 0.7),
                transparent: true,
                opacity: 0.3 * borderIntensity,
                side: THREE.DoubleSide
            });
            var border = new THREE.Mesh(borderGeo, borderMat);
            border.position.z = -0.005;
            cardGroup.add(border);

            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            mat.transparent = true;
            mat.opacity = glassAlpha;
            var mesh = new THREE.Mesh(geo, mat);
            cardGroup.add(mesh);

            var glossGeo = EP.RoundedPlaneGeometry(cardScale * 0.9, h * 0.4, cr * 0.5);
            var glossMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.08,
                side: THREE.DoubleSide
            });
            var gloss = new THREE.Mesh(glossGeo, glossMat);
            gloss.position.y = h * 0.2;
            gloss.position.z = 0.01;
            cardGroup.add(gloss);

            cardGroup.position.set(x, y, z);
            cardGroup.lookAt(0, 0, 0);
            cardGroup.userData = { angle: angle, baseY: y, hue: i / count };
            group.add(cardGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        this.group.rotation.y = t * Math.PI * 2;

        this.group.children.forEach(function(card) {
            var hue = card.userData.hue;
            var border = card.children[0];
            if (border && border.material && border.material.color) {
                border.material.color.setHSL((hue + t) % 1, 0.7, 0.65);
                border.material.opacity = 0.15 + Math.sin(t * Math.PI * 4 + hue * Math.PI * 2) * 0.15;
            }
            var gloss = card.children[2];
            if (gloss && gloss.material) {
                gloss.material.opacity = 0.04 + Math.sin(t * Math.PI * 2 + hue * Math.PI * 4) * 0.06;
            }
        });
    };

    EP.Registry.register(effect);
})();
