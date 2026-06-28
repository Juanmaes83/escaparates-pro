(function() {
    var effect = new EP.EffectBase('column-drift', {
        name: 'Column Drift',
        category: 'carousel-flow',
        icon: '⬍',
        description: 'Tres columnas verticales con flujo contrario'
    }, [
        { key: 'cardSize', type: 'range', min: 15, max: 45, default: 28, label: 'Card Size', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 2, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 3;
        var gap = this.settings.gap / 100 * 2;
        var cols = 3;
        var perCol = 6;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.4);

        for (var c = 0; c < cols; c++) {
            var colGroup = new THREE.Group();
            var x = (c - 1) * (cardScale + gap * 2);
            colGroup.position.x = x;
            colGroup.userData = { direction: c % 2 === 0 ? 1 : -1, cardH: cardScale * 1.4 + gap, perCol: perCol };

            for (var r = 0; r < perCol; r++) {
                var media = mediaList[(c * perCol + r) % mediaList.length];
                var mat = EP.Media.createMaterial(media);
                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.y = (r - perCol / 2) * (cardScale * 1.4 + gap);
                mesh.userData = { baseY: mesh.position.y };
                colGroup.add(mesh);
            }
            group.add(colGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        this.group.children.forEach(function(col) {
            var dir = col.userData.direction;
            var cardH = col.userData.cardH;
            var perCol = col.userData.perCol;
            var totalH = cardH * perCol;
            var offset = t * totalH * dir;
            col.children.forEach(function(mesh) {
                var y = mesh.userData.baseY + offset;
                y = ((y % totalH) + totalH + totalH / 2) % totalH - totalH / 2;
                mesh.position.y = y;
            });
        });
    };

    EP.Registry.register(effect);
})();
