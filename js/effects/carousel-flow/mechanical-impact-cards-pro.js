(function() {
    var effect = new EP.EffectBase('mechanical-impact-cards-pro', {
        name: 'Mechanical Impact Cards PRO',
        category: 'carousel-flow',
        icon: 'MI',
        description: 'Cards escalonadas con choque mecanico, empuje en cadena y rebote divertido'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 35, max: 130, default: 72, step: 1, label: 'Card Size', unit: '%' },
        { key: 'cardRatio', type: 'aspect', options: ['16:9', '4:3', '3:4', '1:1'], default: '16:9', label: 'Card Ratio' },
        { key: 'visibleCards', type: 'range', min: 3, max: 9, default: 6, step: 1, label: 'Visible Cards' },
        { key: 'gap', type: 'range', min: 12, max: 120, default: 36, step: 1, label: 'Distance', unit: '%' },
        { key: 'impactStrength', type: 'range', min: 0, max: 180, default: 92, step: 1, label: 'Impact Strength', unit: '%' },
        { key: 'bounce', type: 'range', min: 0, max: 140, default: 58, step: 1, label: 'Bounce', unit: '%' },
        { key: 'rush', type: 'range', min: 0, max: 180, default: 72, step: 1, label: 'Chain Rush', unit: '%' },
        { key: 'depth', type: 'range', min: 0, max: 140, default: 48, step: 1, label: 'Depth', unit: '%' },
        { key: 'tilt', type: 'range', min: -45, max: 45, default: -6, step: 1, label: 'Tilt', unit: 'deg' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 28, default: 9, step: 1, label: 'Roundness', unit: '%' },
        { key: 'shadow', type: 'range', min: 0, max: 100, default: 45, step: 1, label: 'Shadow', unit: '%' },
        { key: 'background', type: 'color', default: '#dedede', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = Math.max(3, Math.min(this.settings.visibleCards, mediaList.length || this.settings.visibleCards));
        var ratioMap = { '1:1': 1, '4:3': 1.33, '3:4': 0.75, '16:9': 1.78 };
        var ratio = ratioMap[this.settings.cardRatio] || 1.78;
        var h = this.settings.cardSize / 100 * 2.75;
        var w = h * ratio;
        var radius = h * this.settings.cornerRadius / 100 * 0.38;
        var cardGeo = EP.RoundedPlaneGeometry(w, h, radius);
        var shadowGeo = EP.RoundedPlaneGeometry(w * 1.02, h * 1.02, radius * 1.15);
        var shadowOpacity = this.settings.shadow / 100 * 0.28;

        for (var i = 0; i < count; i++) {
            var card = new THREE.Group();
            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            mat.transparent = true;

            var shadowMat = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: shadowOpacity,
                depthWrite: false
            });
            var shadow = new THREE.Mesh(shadowGeo, shadowMat);
            shadow.position.set(0.09, -0.11, -0.035);
            card.add(shadow);

            var mesh = new THREE.Mesh(cardGeo, mat);
            mesh.position.z = 0.01;
            card.add(mesh);

            card.userData = {
                index: i,
                width: w,
                height: h,
                baseScale: 1,
                shadow: shadow,
                mesh: mesh
            };
            group.add(card);
        }

        this.group = group;
        return group;
    };

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function smoothstep(edge0, edge1, x) {
        var t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }

    function pulse(x, center, width) {
        var d = Math.abs(x - center);
        var t = clamp(1 - d / Math.max(0.0001, width), 0, 1);
        return t * t * (3 - 2 * t);
    }

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var cards = this.group.children;
        var count = cards.length;
        if (!count) return;

        var t = ((time / loopDuration) % 1 + 1) % 1;
        var phase = t * count;
        var active = Math.floor(phase) % count;
        var local = phase - Math.floor(phase);
        var approach = smoothstep(0.08, 0.68, local);
        var hit = pulse(local, 0.72, 0.18);
        var settle = pulse(local, 0.88, 0.22);

        var cardW = cards[0].userData.width;
        var cardH = cards[0].userData.height;
        var gap = cardW * (0.44 + this.settings.gap / 100 * 0.85);
        var depth = this.settings.depth / 100;
        var impact = this.settings.impactStrength / 100;
        var bounce = this.settings.bounce / 100;
        var rush = this.settings.rush / 100;
        var tilt = this.settings.tilt * Math.PI / 180;

        var centerOffset = (count - 1) * 0.5;
        var cyclePush = (approach * 0.55 + hit * 0.24 - settle * 0.12) * impact * cardW * 0.56;

        for (var i = 0; i < count; i++) {
            var card = cards[i];
            var rel = ((i - active + count) % count);
            if (rel > count / 2) rel -= count;
            var visual = rel + centerOffset;
            var backness = visual / Math.max(1, count - 1);

            var chainDelay = Math.max(0, rel) * (0.055 + 0.055 * (1 - rush));
            var chainHit = pulse(local - chainDelay, 0.72, 0.16 + rush * 0.05);
            var chainSettle = pulse(local - chainDelay, 0.9, 0.24);
            var push = chainHit * impact * cardW * (0.3 + rush * 0.28) - chainSettle * impact * cardW * 0.13;
            var hammerPull = rel === 0 ? cyclePush : 0;
            var urgency = Math.max(0, rel) * chainHit * rush * cardW * 0.12;
            var rebound = Math.sin((local - chainDelay) * Math.PI * 10) * chainHit * bounce * cardW * 0.035;

            var x = (visual - centerOffset) * gap + hammerPull + push + urgency + rebound;
            var y = 0.7 + (0.42 - backness) * cardH * 0.52 + Math.sin((local + i * 0.13) * Math.PI * 2) * hit * bounce * 0.035;
            var z = -Math.abs(visual - centerOffset) * (0.55 + depth * 1.05) + chainHit * impact * 0.24;
            var scale = 1.08 - Math.abs(visual - centerOffset) * (0.07 + depth * 0.025) + chainHit * bounce * 0.04;
            var rotZ = tilt + (visual - centerOffset) * -0.035 + chainHit * bounce * 0.035;
            var rotY = (visual - centerOffset) * -0.05 + hit * impact * (rel === 0 ? -0.06 : 0.025);

            card.position.set(x, y, z);
            card.rotation.set(0.02 * depth, rotY, rotZ);
            card.scale.setScalar(Math.max(0.34, scale));
            card.renderOrder = 100 + Math.round((1 - backness) * 50);

            if (card.userData.mesh && card.userData.mesh.material) {
                card.userData.mesh.material.opacity = clamp(1 - Math.abs(visual - centerOffset) * 0.075, 0.35, 1);
            }
            if (card.userData.shadow && card.userData.shadow.material) {
                card.userData.shadow.material.opacity = this.settings.shadow / 100 * (0.12 + Math.abs(chainHit) * 0.2);
            }
        }

        this.group.rotation.x = -0.06 * depth;
        this.group.rotation.y = 0.08 * depth;
    };

    EP.Registry.register(effect);
})();
