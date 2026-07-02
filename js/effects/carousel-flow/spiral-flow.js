(function() {
    var effect = new EP.EffectBase('spiral-flow', {
        name: 'Spiral Flow',
        category: 'carousel-flow',
        icon: '🌀',
        description: 'Cards positioned on a flat Archimedean spiral on the XY plane — scrolls through the spiral as the group rotates slowly'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 15, max: 50, default: 30, label: 'Card Size', unit: '%' },
        { key: 'spiralStep', type: 'range', min: 1, max: 4, default: 2, step: 0.5, label: 'Spiral Step' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 5, step: 0.5, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080810', label: 'Background' }
    ]);

    var GOLDEN_ANGLE = 2.39996322972865; // radians

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var cardW = this.settings.cardSize / 100 * 2.5;
        var cardH = cardW * 1.3;
        var cr = this.settings.cornerRadius / 100 * cardW * 0.5;
        var spiralStep = this.settings.spiralStep;
        var n = Math.max(mediaList.length, 8);

        for (var i = 0; i < n; i++) {
            var angle = i * GOLDEN_ANGLE;
            var radius = i * spiralStep * 0.3;
            var bx = Math.sin(angle) * radius;
            var by = Math.cos(angle) * radius;

            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            mat.transparent = true;
            var geo = cr > 0 ? EP.RoundedPlaneGeometry(cardW, cardH, cr) : new THREE.PlaneGeometry(cardW, cardH);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(bx, by, -radius * 0.05);
            mesh.userData = {
                index: i,
                baseX: bx,
                baseY: by,
                baseRadius: radius,
                angle: angle
            };
            group.add(mesh);
        }

        this._n = n;
        this._spiralStep = spiralStep;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var rotOffset = t * Math.PI * 2;
        var spiralStep = this._spiralStep;
        var children = this.group.children;

        // Rotate the whole group slowly through the spiral
        this.group.rotation.z = rotOffset;

        // Per-card: fade and scale based on world-space distance from top (0, maxR)
        var maxR = (this._n - 1) * spiralStep * 0.3;

        for (var i = 0; i < children.length; i++) {
            var mesh = children[i];
            var d = mesh.userData;

            // After rotation, find effective angle from top
            var effectiveAngle = d.angle + rotOffset;
            // Normalize angle to 0..2PI
            effectiveAngle = ((effectiveAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

            // Cards near the "top" of the spiral (angle near 0 or 2PI) are featured
            var angDist = Math.min(effectiveAngle, Math.PI * 2 - effectiveAngle) / Math.PI;
            // Also weight by radius — center cards are brighter
            var radiusFrac = maxR > 0 ? d.baseRadius / maxR : 0;

            // Proximity: closer to top-center = higher value
            var prox = (1 - angDist) * (1 - radiusFrac * 0.7);
            prox = Math.max(0, Math.min(1, prox));
            var smooth = prox * prox * (3 - 2 * prox);

            mesh.scale.setScalar(0.3 + 0.7 * smooth);
            mesh.material.opacity = 0.15 + 0.85 * smooth;
        }
    };

    EP.Registry.register(effect);
})();
