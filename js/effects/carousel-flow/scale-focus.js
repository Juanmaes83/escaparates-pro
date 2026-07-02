(function() {
    var effect = new EP.EffectBase('scale-focus', {
        name: 'Scale Focus',
        category: 'carousel-flow',
        icon: '🔭',
        description: 'Dramatic spotlight zoom — center card is huge, peripheral cards shrink to tiny with a smooth bell curve transition'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 15, max: 55, default: 30, label: 'Card Size', unit: '%' },
        { key: 'cardRatio', type: 'range', min: 50, max: 180, default: 133, step: 1, label: 'Card Ratio', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 3, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'focusScale', type: 'range', min: 100, max: 200, default: 140, step: 1, label: 'Focus Scale', unit: '%' },
        { key: 'minScale', type: 'range', min: 10, max: 60, default: 30, step: 1, label: 'Min Scale', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 5, step: 0.5, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var cardW = this.settings.cardSize / 100 * 3;
        var cardH = cardW * (this.settings.cardRatio / 100);
        var gap = this.settings.gap / 100 * 2;
        var cr = this.settings.cornerRadius / 100 * cardW * 0.5;
        var total = Math.max(mediaList.length, 9);
        var span = cardW + gap;

        for (var i = 0; i < total; i++) {
            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            mat.transparent = true;
            var geo = cr > 0 ? EP.RoundedPlaneGeometry(cardW, cardH, cr) : new THREE.PlaneGeometry(cardW, cardH);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i, baseX: i * span };
            group.add(mesh);
        }

        this._total = total;
        this._span = span;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var total = this._total;
        var span = this._span;
        var totalW = total * span;
        var focusScale = this.settings.focusScale / 100;
        var minScale = this.settings.minScale / 100;
        var children = this.group.children;

        for (var i = 0; i < children.length; i++) {
            var mesh = children[i];
            var baseX = mesh.userData.baseX;
            var x = baseX - t * totalW;
            x = ((x % totalW) + totalW + totalW / 2) % totalW - totalW / 2;
            mesh.position.x = x;

            // Normalized distance from center (0=center, 1=far edge)
            var dist = Math.abs(x) / (totalW * 0.5);
            dist = Math.min(1, dist);

            // Smoothstep bell curve
            var prox = 1 - dist;
            var smooth = prox * prox * (3 - 2 * prox);

            // Scale: lerp from minScale to focusScale
            var sc = minScale + (focusScale - minScale) * smooth;
            mesh.scale.setScalar(sc);

            // Depth: center card pops forward slightly
            mesh.position.z = smooth * 0.5;

            // Opacity: dim peripheral cards
            mesh.material.opacity = minScale + (1 - minScale) * smooth;
        }
    };

    EP.Registry.register(effect);
})();
