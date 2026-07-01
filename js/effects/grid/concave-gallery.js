(function() {
    var effect = new EP.EffectBase('concave-gallery', {
        name: 'Concave Gallery',
        category: 'grid',
        icon: '🔮',
        description: 'Grid infinito con distorsion concava tipo ojo de pez — efecto lente sobre mosaico de imagenes'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 80, default: 50, label: 'Card Size', unit: '%' },
        { key: 'cols', type: 'range', min: 3, max: 10, default: 6, step: 1, label: 'Columns' },
        { key: 'rows', type: 'range', min: 2, max: 8, default: 4, step: 1, label: 'Rows' },
        { key: 'bulgeStrength', type: 'range', min: 0, max: 100, default: 40, label: 'Bulge', unit: '%' },
        { key: 'driftSpeed', type: 'range', min: 10, max: 100, default: 40, label: 'Drift Speed', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 30, default: 12, label: 'Gap', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 3, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function seededHash(x, y, mod) {
        var h = (x * 7919 + y * 7307) % mod;
        return Math.abs(h);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cols = this.settings.cols;
        var rows = this.settings.rows;
        var cardScale = this.settings.cardSize / 100 * 2.5;
        var gapVal = this.settings.gap / 100 * cardScale * 0.5;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.3;
        var cellW = cardScale + gapVal;
        var cellH = cardScale + gapVal;
        var worldW = cols * cellW;
        var worldH = rows * cellH;

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var idx = seededHash(c, r, mediaList.length);
                var w = cardScale;
                var h = cardScale;
                var geo = EP.RoundedPlaneGeometry(w, h, cr);
                var mat = EP.Media.createMaterial(mediaList[idx]);
                mat.transparent = true;
                var mesh = new THREE.Mesh(geo, mat);

                var baseX = c * cellW - worldW / 2 + cellW / 2;
                var baseY = -(r * cellH - worldH / 2 + cellH / 2);

                mesh.position.set(baseX, baseY, 0);
                mesh.userData = {
                    baseX: baseX,
                    baseY: baseY,
                    col: c,
                    row: r
                };
                group.add(mesh);
            }
        }

        this._worldW = worldW;
        this._worldH = worldH;
        this._cellW = cellW;
        this._cellH = cellH;
        this._cols = cols;
        this._rows = rows;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speed = this.settings.driftSpeed / 100;
        var bulge = this.settings.bulgeStrength / 100;
        var worldW = this._worldW;
        var worldH = this._worldH;

        var panX = time * speed * 0.6;
        var panY = time * speed * 0.25 + Math.sin(time * 0.3) * 0.4;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            var d = mesh.userData;

            var x = d.baseX + panX;
            var y = d.baseY + panY;

            x = x - worldW * Math.floor((x + worldW / 2) / worldW);
            y = y - worldH * Math.floor((y + worldH / 2) / worldH);

            mesh.position.x += (x - mesh.position.x) * 0.12;
            mesh.position.y += (y - mesh.position.y) * 0.12;

            var nx = mesh.position.x / (worldW * 0.5);
            var ny = mesh.position.y / (worldH * 0.5);
            var dist = Math.sqrt(nx * nx + ny * ny);

            if (dist < 1.5 && bulge > 0) {
                var normDist = dist / 1.5;
                var z = Math.sqrt(Math.max(0, 0.5 - normDist * normDist));
                var displacement = bulge * z * 2;
                mesh.position.z = displacement;

                var scale = 1 + displacement * 0.3;
                mesh.scale.setScalar(scale);

                mesh.material.opacity = 0.5 + (1 - normDist) * 0.5;
            } else {
                mesh.position.z = 0;
                mesh.scale.setScalar(1);
                mesh.material.opacity = 0.4;
            }

            mesh.rotation.x = Math.sin(time * 0.3 + i * 0.2) * 0.02;
            mesh.rotation.y = Math.cos(time * 0.25 + i * 0.3) * 0.02;
        }

        EP.Core.camera.position.z = worldW * 0.8;
        EP.Core.camera.position.x = Math.sin(t * Math.PI * 2) * 0.3;
        EP.Core.camera.position.y = Math.cos(t * Math.PI * 1.5) * 0.2;
        EP.Core.camera.lookAt(0, 0, 0);
    };

    EP.Registry.register(effect);
})();
