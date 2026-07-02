(function() {
    var effect = new EP.EffectBase('flip-carousel', {
        name: 'Flip Carousel',
        category: 'carousel-flow',
        icon: '🃏',
        description: 'Cards flip on Y-axis as they pass through the center focus zone — like turning pages'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 15, max: 55, default: 32, label: 'Card Size', unit: '%' },
        { key: 'cardRatio', type: 'range', min: 50, max: 180, default: 133, step: 1, label: 'Card Ratio', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 2, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 5, step: 0.5, label: 'Corner Radius', unit: '%' },
        { key: 'flipAmount', type: 'range', min: 30, max: 180, default: 90, step: 5, label: 'Flip Amount', unit: '°' },
        { key: 'focusScale', type: 'range', min: 100, max: 160, default: 120, step: 1, label: 'Focus Scale', unit: '%' },
        { key: 'dimAmount', type: 'range', min: 0, max: 90, default: 50, step: 1, label: 'Dim Amount', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0d0d14', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var cardW = this.settings.cardSize / 100 * 3;
        var cardH = cardW * (this.settings.cardRatio / 100);
        var gap = this.settings.gap / 100 * 2;
        var cr = this.settings.cornerRadius / 100 * cardW * 0.5;
        var total = Math.max(mediaList.length, 7);
        var span = cardW + gap;

        for (var i = 0; i < total; i++) {
            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            mat.side = THREE.DoubleSide;
            mat.transparent = true;
            var geo = cr > 0 ? EP.RoundedPlaneGeometry(cardW, cardH, cr) : new THREE.PlaneGeometry(cardW, cardH);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i, baseX: i * span };
            group.add(mesh);
        }

        this._total = total;
        this._span = span;
        this._cardW = cardW;
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
        var dimAmount = this.settings.dimAmount / 100;
        var flipRad = THREE.MathUtils.degToRad(this.settings.flipAmount);
        var children = this.group.children;

        for (var i = 0; i < children.length; i++) {
            var mesh = children[i];
            var baseX = mesh.userData.baseX;
            var x = baseX - t * totalW;
            x = ((x % totalW) + totalW + totalW / 2) % totalW - totalW / 2;
            mesh.position.x = x;

            var norm = Math.abs(x) / (totalW * 0.5);
            norm = Math.min(1, norm);

            // Bell curve proximity to center
            var prox = 1 - norm;
            var smooth = prox * prox * (3 - 2 * prox);

            // Flip: cards away from center are rotated, center card faces forward
            var flipSign = x >= 0 ? 1 : -1;
            mesh.rotation.y = flipSign * (1 - smooth) * flipRad;

            // Scale
            var sc = 1 + (focusScale - 1) * smooth;
            mesh.scale.setScalar(sc);

            // Dim
            mesh.material.opacity = 1 - dimAmount * (1 - smooth);
        }
    };

    EP.Registry.register(effect);
})();
