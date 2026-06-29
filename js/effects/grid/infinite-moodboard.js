(function() {
    var effect = new EP.EffectBase('infinite-moodboard', {
        name: 'Infinite Moodboard',
        category: 'grid',
        icon: '🖼️',
        description: 'Grid infinito arrastrable con wrapping toroidal — las imagenes flotan en un mosaico sin fin'
    }, [
        { key: 'cardSize', type: 'range', min: 30, max: 80, default: 55, label: 'Card Size', unit: '%' },
        { key: 'cols', type: 'range', min: 3, max: 8, default: 5, step: 1, label: 'Columns' },
        { key: 'rows', type: 'range', min: 2, max: 6, default: 3, step: 1, label: 'Rows' },
        { key: 'driftSpeed', type: 'range', min: 10, max: 100, default: 45, label: 'Drift Speed', unit: '%' },
        { key: 'proximity', type: 'range', min: 10, max: 100, default: 60, label: 'Proximity FX', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 4, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a0f', label: 'Background' }
    ]);

    function seededRandom(s) {
        var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cols = this.settings.cols;
        var rows = this.settings.rows;
        var cardScale = this.settings.cardSize / 100 * 2.5;
        var gap = cardScale * 0.15;
        var cellW = cardScale + gap;
        var cellH = cardScale * 0.7 + gap;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.3;

        var worldW = cols * cellW;
        var worldH = rows * cellH;

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var idx = r * cols + c;
                var mediaIdx = idx % mediaList.length;
                var w = cardScale;
                var h = cardScale * 0.7;
                var geo = EP.RoundedPlaneGeometry(w, h, cr);
                var mat = EP.Media.createMaterial(mediaList[mediaIdx]);
                mat.transparent = true;
                var mesh = new THREE.Mesh(geo, mat);

                var baseX = c * cellW - worldW / 2 + cellW / 2;
                var baseY = -(r * cellH - worldH / 2 + cellH / 2);

                mesh.position.set(baseX, baseY, 0);
                mesh.userData = {
                    baseX: baseX,
                    baseY: baseY,
                    col: c,
                    row: r,
                    currentScale: 1,
                    currentGray: 1,
                    targetScale: 1,
                    targetGray: 1
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
        var proxForce = this.settings.proximity / 100;
        var worldW = this._worldW;
        var worldH = this._worldH;

        var panX = time * speed * 0.8;
        var panY = time * speed * 0.3 + Math.sin(time * 0.5) * 0.5;

        var focusX = Math.sin(t * Math.PI * 4) * worldW * 0.3;
        var focusY = Math.cos(t * Math.PI * 3) * worldH * 0.3;
        var influenceR = 2.5 * proxForce;
        var maxScale = 1.6;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            var d = mesh.userData;

            var x = d.baseX + panX;
            var y = d.baseY + panY;

            x = x - worldW * Math.floor((x + worldW / 2) / worldW);
            y = y - worldH * Math.floor((y + worldH / 2) / worldH);

            mesh.position.x += (x - mesh.position.x) * 0.12;
            mesh.position.y += (y - mesh.position.y) * 0.12;

            var dx = mesh.position.x - focusX;
            var dy = mesh.position.y - focusY;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < influenceR) {
                var prox = 1 - dist / influenceR;
                prox = prox * prox * prox;
                d.targetScale = 1 + (maxScale - 1) * prox;
                d.targetGray = 1 - prox;
                mesh.position.z = prox * 0.8;
            } else {
                d.targetScale = 1;
                d.targetGray = 1;
                mesh.position.z = 0;
            }

            d.currentScale += (d.targetScale - d.currentScale) * 0.1;
            d.currentGray += (d.targetGray - d.currentGray) * 0.1;

            mesh.scale.setScalar(d.currentScale);

            var gray = d.currentGray;
            if (mesh.material.color) {
                mesh.material.color.setRGB(
                    gray + (1 - gray),
                    gray + (1 - gray) * 0.3,
                    gray + (1 - gray) * 0.3
                );
            }
            mesh.material.opacity = 0.5 + (1 - gray) * 0.5;

            mesh.rotation.x = Math.sin(time * 0.5 + i * 0.3) * 0.03;
            mesh.rotation.y = Math.cos(time * 0.4 + i * 0.5) * 0.03;
        }
    };

    EP.Registry.register(effect);
})();
