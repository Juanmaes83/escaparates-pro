(function() {
    var effect = new EP.EffectBase('reveal-mosaic', {
        name: 'Reveal Mosaic',
        category: 'reveal-wipe',
        icon: '🧩',
        description: 'Piezas que se revelan con ola secuencial'
    }, [
        { key: 'cols', type: 'range', min: 2, max: 6, default: 3, step: 1, label: 'Columns' },
        { key: 'rows', type: 'range', min: 2, max: 4, default: 2, step: 1, label: 'Rows' },
        { key: 'staggerDelay', type: 'range', min: 5, max: 40, default: 15, label: 'Stagger', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 8, label: 'Corner Radius', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 3, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot'], default: 'overshoot', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0c0c14', label: 'Background' }
    ]);

    function easeOutBack(t) {
        var s = 1.70158;
        return (t = t - 1) * t * ((s + 1) * t + s) + 1;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cols = this.settings.cols;
        var rows = this.settings.rows;
        var gap = this.settings.gap / 100 * 0.5;
        var totalW = 8;
        var totalH = 5;
        var cellW = (totalW - gap * (cols - 1)) / cols;
        var cellH = (totalH - gap * (rows - 1)) / rows;
        var cr = this.settings.cornerRadius / 100 * Math.min(cellW, cellH) * 0.5;
        var geo = EP.RoundedPlaneGeometry(cellW, cellH, cr);
        var idx = 0;

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var media = mediaList[idx % mediaList.length];
                var mat = EP.Media.createMaterial(media);
                mat.transparent = true;
                mat.opacity = 0;
                var mesh = new THREE.Mesh(geo, mat);
                var x = -totalW / 2 + cellW / 2 + c * (cellW + gap);
                var y = totalH / 2 - cellH / 2 - r * (cellH + gap);
                mesh.position.set(x, y, 0);
                mesh.userData = {
                    col: c, row: r,
                    delay: (c + r) / (cols + rows - 2),
                    restX: x, restY: y
                };
                group.add(mesh);
                idx++;
            }
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var stagger = this.settings.staggerDelay / 100;
        var revealPhase = t * 2 % 2;

        this.group.children.forEach(function(child) {
            var d = child.userData.delay;
            var localT;

            if (revealPhase < 1) {
                localT = Math.max(0, Math.min(1, (revealPhase - d * stagger) / (1 - stagger)));
                var e = easeOutBack(localT);
                child.material.opacity = localT;
                child.scale.setScalar(0.3 + 0.7 * e);
                child.position.z = (1 - e) * -2;
                child.rotation.y = (1 - e) * Math.PI * 0.3;
            } else {
                var hideT = revealPhase - 1;
                localT = Math.max(0, Math.min(1, (hideT - d * stagger) / (1 - stagger)));
                child.material.opacity = 1 - localT;
                child.scale.setScalar(1 - localT * 0.3);
                child.position.z = -localT * 2;
                child.rotation.y = localT * Math.PI * 0.3;
            }
            child.position.x = child.userData.restX;
            child.position.y = child.userData.restY;
        });
    };

    EP.Registry.register(effect);
})();
