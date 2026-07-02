(function() {
    var effect = new EP.EffectBase('bento-grid', {
        name: 'Bento Grid',
        category: 'grid',
        icon: '🍱',
        description: 'Apple bento box style grid — cells of different sizes with staggered entrance and gentle breathing animation'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'layout', type: 'select', options: [{ v: '3col', l: '3 Celdas' }, { v: '5col', l: '5 Celdas' }], default: '3col', label: 'Layout' },
        { key: 'gap', type: 'range', min: 0, max: 8, default: 4, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 12, step: 1, label: 'Corner Radius', unit: '%' },
        { key: 'breathe', type: 'range', min: 0, max: 10, default: 3, step: 0.5, label: 'Breathe', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a12', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var layout = this.settings.layout;
        var gap = this.settings.gap / 100 * 0.15;
        var totalW = 5.0;
        var totalH = 3.5;
        var cr = this.settings.cornerRadius / 100 * 0.4;
        var cells = [];

        if (layout === '3col') {
            // Left tall card + 2 stacked right
            var leftW = totalW * 0.38 - gap * 0.5;
            var rightW = totalW * 0.62 - gap * 0.5;
            var halfH = totalH * 0.5 - gap * 0.5;
            cells = [
                { x: -(totalW * 0.5 - leftW * 0.5), y: 0, w: leftW, h: totalH, mIdx: 0 },
                { x:   totalW * 0.5 - rightW * 0.5,  y: totalH * 0.25 + gap * 0.5, w: rightW, h: halfH, mIdx: 1 },
                { x:   totalW * 0.5 - rightW * 0.5,  y: -(totalH * 0.25 + gap * 0.5), w: rightW, h: halfH, mIdx: 2 }
            ];
        } else {
            // 5col: 1 large top-left + 2 wide middle + 2 small bottom
            var largeW = totalW * 0.55 - gap * 0.5;
            var largeH = totalH * 0.55 - gap * 0.5;
            var wideW = (totalW - gap) * 0.5 - gap * 0.5;
            var wideH = totalH * 0.25 - gap * 0.5;
            var smallW2 = (totalW - gap) * 0.5 - gap * 0.5;
            var smallH2 = totalH * 0.2 - gap * 0.5;
            var rightColW = totalW * 0.45 - gap * 0.5;
            cells = [
                { x: -(totalW * 0.5 - largeW * 0.5), y: totalH * 0.5 - largeH * 0.5, w: largeW, h: largeH, mIdx: 0 },
                { x:   totalW * 0.5 - rightColW * 0.5, y: totalH * 0.5 - largeH * 0.5, w: rightColW, h: largeH, mIdx: 1 },
                { x: -(totalW * 0.5 - wideW * 0.5), y: -(totalH * 0.5 - wideH * 0.5) - gap, w: wideW, h: wideH * 1.5, mIdx: 2 },
                { x:   totalW * 0.5 - smallW2 * 0.5, y: -(totalH * 0.5 - smallH2 * 0.5) - gap, w: smallW2, h: smallH2 * 1.2, mIdx: 3 },
                { x:   totalW * 0.5 - smallW2 * 0.5, y: -(totalH * 0.5 - smallH2 * 0.5) - gap - smallH2 * 1.2 - gap, w: smallW2, h: smallH2 * 1.2, mIdx: 4 }
            ];
        }

        var meshes = [];
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var media = mediaList[cell.mIdx % mediaList.length];
            var geo = cr > 0 ? EP.RoundedPlaneGeometry(cell.w, cell.h, cr) : new THREE.PlaneGeometry(cell.w, cell.h);
            var mat = EP.Media.createMaterial(media);
            mat.transparent = true;
            mat.opacity = 0;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(cell.x, cell.y, 0);
            mesh.scale.setScalar(0.01);
            mesh.userData = {
                baseX: cell.x,
                baseY: cell.y,
                baseScale: 1,
                phaseOffset: i * 0.7,
                delay: i * 0.12
            };
            group.add(mesh);
            meshes.push(mesh);
        }

        this._meshes = meshes;
        this._entranceDone = false;
        this._entranceStart = -1;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._meshes) return;
        var breatheAmt = this.settings.breathe / 100 * 0.04;
        var meshes = this._meshes;

        if (this._entranceStart < 0) this._entranceStart = time;
        var elapsed = time - this._entranceStart;
        var entranceDur = 1.5;

        for (var i = 0; i < meshes.length; i++) {
            var mesh = meshes[i];
            var d = mesh.userData;
            var delay = d.delay;
            var progress = Math.max(0, Math.min(1, (elapsed - delay) / (entranceDur * 0.5)));
            // Smoothstep
            progress = progress * progress * (3 - 2 * progress);

            var breathe = 1 + Math.sin(time * 0.8 + d.phaseOffset) * breatheAmt;
            var sc = progress * breathe;
            mesh.scale.setScalar(Math.max(0.001, sc));
            mesh.material.opacity = progress;
        }
    };

    EP.Registry.register(effect);
})();
