(function() {
    var effect = new EP.EffectBase('kinetic-grid', {
        name: 'Kinetic Grid',
        category: '3d-perspective',
        icon: '⚡',
        description: 'Grid kinetico 3D — mosaico de imagenes que responden con rotacion, profundidad y ondas de choque'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'columns', type: 'range', min: 3, max: 10, default: 6, step: 1, label: 'Columns' },
        { key: 'rows', type: 'range', min: 2, max: 8, default: 4, step: 1, label: 'Rows' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 40, label: 'Wave Speed', unit: '%' },
        { key: 'waveDepth', type: 'range', min: 10, max: 100, default: 50, label: 'Wave Depth', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 55, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#060612', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cols = this.settings.columns;
        var rows = this.settings.rows;
        var cardScale = 0.5 + 1.5 * this.settings.cardSize / 100;
        var cw = cardScale;
        var ch = cardScale * 0.75;
        var gap = 0.15;

        var totalW = cols * (cw + gap) - gap;
        var totalH = rows * (ch + gap) - gap;
        var offsetX = -totalW / 2 + cw / 2;
        var offsetY = totalH / 2 - ch / 2;
        var imgIdx = 0;

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var mi = imgIdx % mediaList.length; imgIdx++;
                var tex = null;
                if (mediaList[mi].element) {
                    tex = EP.Media.createTexture(mediaList[mi]);
                    tex.needsUpdate = true;
                    tex.minFilter = THREE.LinearFilter;
                }

                var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.03) : new THREE.PlaneGeometry(cw, ch);
                var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true });
                var mesh = new THREE.Mesh(geo, mat);

                var x = offsetX + c * (cw + gap);
                var y = offsetY - r * (ch + gap);
                mesh.position.set(x, y, 0);
                mesh.userData = {
                    isCard: true,
                    col: c, row: r,
                    baseX: x, baseY: y,
                    gridU: c / (cols - 1),
                    gridV: r / (rows - 1)
                };
                group.add(mesh);
            }
        }

        this._cols = cols;
        this._rows = rows;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;
        var depth = this.settings.waveDepth / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var card = this.group.children[i];
            if (!card.userData.isCard) continue;

            var u = card.userData.gridU;
            var v = card.userData.gridV;
            var bx = card.userData.baseX;
            var by = card.userData.baseY;

            var wave1 = Math.sin(u * 4 + time * speed * 1.2) * Math.cos(v * 3 + time * speed * 0.8);
            var wave2 = Math.cos(u * 3 - time * speed * 0.6 + v * 2) * Math.sin(time * speed * 0.4);
            var shockwave = Math.sin((u + v) * 5 - time * speed * 2) * 0.3;

            card.position.z = (wave1 * 0.8 + wave2 * 0.4 + shockwave) * depth * 2;
            card.position.x = bx + Math.sin(time * speed * 0.3 + u * 3) * depth * 0.15;
            card.position.y = by + Math.cos(time * speed * 0.25 + v * 2.5) * depth * 0.1;

            card.rotation.x = wave1 * depth * 0.3;
            card.rotation.y = wave2 * depth * 0.25;

            var glow = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(time * speed + u * 4 + v * 3));
            card.material.opacity = glow;

            if (card.material.map) card.material.map.needsUpdate = true;
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.15) * 0.5,
            Math.cos(time * 0.12) * 0.3,
            8 + Math.sin(time * 0.1) * 0.5
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
