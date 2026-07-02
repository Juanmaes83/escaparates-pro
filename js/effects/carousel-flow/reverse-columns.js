(function() {
    var effect = new EP.EffectBase('reverse-columns', {
        name: 'Reverse Columns',
        category: 'carousel-flow',
        icon: '↕️',
        description: 'Columnas de imágenes con scroll inverso alternado — galería dinámica con movimiento opuesto'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'columns', type: 'range', min: 2, max: 6, default: 3, step: 1, label: 'Columnas' },
        { key: 'scrollSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad scroll' },
        { key: 'gap', type: 'range', min: 0, max: 20, default: 6, step: 1, label: 'Separación', unit: 'px' },
        { key: 'imagesPerColumn', type: 'range', min: 2, max: 6, default: 4, step: 1, label: 'Imágenes por columna' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var ml = mediaList || [];
        var nCols = Math.round(this.settings.columns);
        var nImgs = Math.round(this.settings.imagesPerColumn);
        var gapU = this.settings.gap * 0.005;
        var colW = 8 / nCols;
        var imgH = 4.5 / (nImgs * 0.72);

        this._columns = [];
        for (var c = 0; c < nCols; c++) {
            var colGroup = new THREE.Group();
            colGroup.position.x = -4 + (c + 0.5) * colW;
            var meshes = [];
            for (var r = 0; r < nImgs; r++) {
                var mIdx = ml.length > 0 ? (c * nImgs + r) % ml.length : 0;
                var m = ml.length > 0 ? ml[mIdx] : null;
                var geo = new THREE.PlaneGeometry(colW - gapU, imgH - gapU);
                var mat = m ? EP.Media.createMaterial(m) : new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.y = r * imgH - (nImgs - 1) * imgH / 2;
                colGroup.add(mesh);
                meshes.push(mesh);
            }
            group.add(colGroup);
            this._columns.push({
                group: colGroup,
                meshes: meshes,
                offset: 0,
                imgH: imgH,
                nImgs: nImgs,
                dir: (c % 2 === 0) ? 1 : -1
            });
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._columns) return;
        var spd = this.settings.scrollSpeed * 0.018;
        var ddt = dt || 0.016;

        for (var c = 0; c < this._columns.length; c++) {
            var col = this._columns[c];
            col.offset += col.dir * spd * ddt * 60 * 0.016;
            var totalH = col.imgH * col.nImgs;
            if (col.offset > totalH) col.offset -= totalH;
            if (col.offset < 0) col.offset += totalH;
            for (var r = 0; r < col.meshes.length; r++) {
                var baseY = r * col.imgH - (col.nImgs - 1) * col.imgH / 2;
                var y = ((baseY + col.offset + totalH / 2) % totalH) - totalH / 2;
                col.meshes[r].position.y = y;
            }
        }
    };

    effect.dispose = function() { this._columns = null; };

    EP.Registry.register(effect);
})();
