(function() {
    var effect = new EP.EffectBase('ticker-loop', {
        name: 'Ticker Loop',
        category: 'carousel-flow',
        icon: '📰',
        description: 'Filas marquee inclinadas en direcciones opuestas'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 12, max: 40, default: 22, label: 'Card Size', unit: '%' },
        { key: 'rows', type: 'range', min: 2, max: 5, default: 3, step: 1, label: 'Rows' },
        { key: 'tilt', type: 'range', min: 0, max: 20, default: 8, label: 'Tilt', unit: '°' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 2, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'easing', type: 'easing', options: ['linear', 'smooth'], default: 'linear', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var rows = this.settings.rows;
        var cardScale = this.settings.cardSize / 100 * 3;
        var gap = this.settings.gap / 100 * 2;
        var tilt = THREE.MathUtils.degToRad(this.settings.tilt);
        var perRow = 8;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 0.7);

        for (var r = 0; r < rows; r++) {
            var rowGroup = new THREE.Group();
            var y = (r - (rows - 1) / 2) * (cardScale * 0.7 + gap);
            rowGroup.position.y = y;
            rowGroup.rotation.z = tilt * (r % 2 === 0 ? 1 : -1);
            rowGroup.userData = { direction: r % 2 === 0 ? 1 : -1, cardW: cardScale + gap, perRow: perRow };

            for (var c = 0; c < perRow; c++) {
                var media = mediaList[(r * perRow + c) % mediaList.length];
                var mat = EP.Media.createMaterial(media);
                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.x = (c - perRow / 2) * (cardScale + gap);
                mesh.userData = { baseX: mesh.position.x };
                rowGroup.add(mesh);
            }
            group.add(rowGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        this.group.children.forEach(function(row) {
            var dir = row.userData.direction;
            var cardW = row.userData.cardW;
            var perRow = row.userData.perRow;
            var totalW = cardW * perRow;
            var offset = t * totalW * dir;
            row.children.forEach(function(mesh) {
                var x = mesh.userData.baseX + offset;
                x = ((x % totalW) + totalW + totalW / 2) % totalW - totalW / 2;
                mesh.position.x = x;
            });
        });
    };

    EP.Registry.register(effect);
})();
