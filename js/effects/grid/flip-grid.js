(function() {
    var effect = new EP.EffectBase('flip-grid', {
        name: 'Flip Grid',
        category: 'grid',
        icon: '🔄',
        description: 'Efecto flip entre dos sets con onda/ripple'
    }, [
        { key: 'cardSize', type: 'range', min: 20, max: 50, default: 30, label: 'Card Size', unit: '%' },
        { key: 'cols', type: 'range', min: 2, max: 5, default: 3, step: 1, label: 'Columns' },
        { key: 'rows', type: 'range', min: 2, max: 4, default: 2, step: 1, label: 'Rows' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 2, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'bounce'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cols = this.settings.cols;
        var rows = this.settings.rows;
        var cardScale = this.settings.cardSize / 100 * 3;
        var gap = this.settings.gap / 100 * 2;
        var count = cols * rows;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale);

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var idx = r * cols + c;
                var x = (c - (cols - 1) / 2) * (cardScale + gap);
                var y = (r - (rows - 1) / 2) * (cardScale + gap) * -1;

                var frontMat = EP.Media.createMaterial(mediaList[idx % mediaList.length]);
                var backMat = EP.Media.createMaterial(mediaList[(idx + count) % mediaList.length]);

                var pivot = new THREE.Group();
                pivot.position.set(x, y, 0);
                pivot.userData = { col: c, row: r, delay: (c + r) * 0.08 };

                var front = new THREE.Mesh(geo, frontMat);
                pivot.add(front);
                var back = new THREE.Mesh(geo, backMat);
                back.rotation.y = Math.PI;
                pivot.add(back);
                group.add(pivot);
            }
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        this.group.children.forEach(function(pivot) {
            var delay = pivot.userData.delay;
            var phase = ((t * 2 - delay) % 1 + 1) % 1;
            var flipProgress = Math.max(0, Math.min(1, phase * 2));
            pivot.rotation.y = flipProgress * Math.PI;
        });
    };

    EP.Registry.register(effect);
})();
