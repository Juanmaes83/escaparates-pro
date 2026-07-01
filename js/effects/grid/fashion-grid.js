(function() {
    var effect = new EP.EffectBase('fashion-grid', {
        name: 'Fashion Grid',
        category: 'grid',
        icon: '📐',
        description: 'Grid draggable con zoom split-screen — click para ampliar, inercia y multiples niveles de zoom'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 80, default: 50, label: 'Card Size', unit: '%' },
        { key: 'cols', type: 'range', min: 3, max: 8, default: 5, step: 1, label: 'Columns' },
        { key: 'rows', type: 'range', min: 2, max: 6, default: 4, step: 1, label: 'Rows' },
        { key: 'zoomLevel', type: 'range', min: 30, max: 100, default: 60, label: 'Zoom Level', unit: '%' },
        { key: 'driftSpeed', type: 'range', min: 10, max: 100, default: 35, label: 'Drift Speed', unit: '%' },
        { key: 'gap', type: 'range', min: 5, max: 40, default: 15, label: 'Gap', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 3, label: 'Corner Radius', unit: '%' },
        { key: 'introStyle', type: 'select', options: ['Expand', 'Fade', 'Cascade'], default: 'Expand', label: 'Intro Style' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

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
                var idx = (r * cols + c) % mediaList.length;
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
                    row: r,
                    index: r * cols + c,
                    currentScale: 0.01,
                    targetScale: 1
                };
                group.add(mesh);
            }
        }

        this._worldW = worldW;
        this._worldH = worldH;
        this._cols = cols;
        this._rows = rows;
        this._introComplete = false;
        this._introStart = -1;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speed = this.settings.driftSpeed / 100;
        var zoom = this.settings.zoomLevel / 100;
        var introStyle = this.settings.introStyle;
        var worldW = this._worldW;
        var worldH = this._worldH;
        var cols = this._cols;
        var rows = this._rows;
        var totalCards = cols * rows;

        if (this._introStart < 0) this._introStart = time;
        var introElapsed = time - this._introStart;
        var introDuration = 2.0;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            var d = mesh.userData;

            if (introElapsed < introDuration && !this._introComplete) {
                var cardDelay;
                if (introStyle === 'Cascade') {
                    cardDelay = (d.col + d.row) / (cols + rows) * introDuration * 0.6;
                } else {
                    cardDelay = d.index / totalCards * introDuration * 0.5;
                }
                var cardProgress = Math.max(0, Math.min(1, (introElapsed - cardDelay) / (introDuration * 0.4)));
                cardProgress = cardProgress * cardProgress * (3 - 2 * cardProgress);

                if (introStyle === 'Expand') {
                    d.targetScale = cardProgress;
                    mesh.position.x = d.baseX * cardProgress;
                    mesh.position.y = d.baseY * cardProgress;
                } else if (introStyle === 'Fade') {
                    d.targetScale = 1;
                    mesh.material.opacity = cardProgress;
                } else {
                    d.targetScale = cardProgress;
                }
            } else {
                if (!this._introComplete) this._introComplete = true;
                d.targetScale = 1;

                var panX = time * speed * 0.4;
                var panY = time * speed * 0.15 + Math.sin(time * 0.2) * 0.3;

                var x = d.baseX + panX;
                var y = d.baseY + panY;
                x = x - worldW * Math.floor((x + worldW / 2) / worldW);
                y = y - worldH * Math.floor((y + worldH / 2) / worldH);

                mesh.position.x += (x - mesh.position.x) * 0.08;
                mesh.position.y += (y - mesh.position.y) * 0.08;
                mesh.material.opacity = 1;
            }

            d.currentScale += (d.targetScale - d.currentScale) * 0.12;
            mesh.scale.setScalar(Math.max(0.001, d.currentScale));

            mesh.rotation.x = Math.sin(time * 0.3 + i * 0.2) * 0.015;
            mesh.rotation.y = Math.cos(time * 0.25 + i * 0.3) * 0.015;
        }

        var focusX = Math.sin(t * Math.PI * 4) * worldW * 0.15;
        var focusY = Math.cos(t * Math.PI * 3) * worldH * 0.15;

        if (this._introComplete) {
            for (var j = 0; j < this.group.children.length; j++) {
                var m = this.group.children[j];
                var dx = m.position.x - focusX;
                var dy = m.position.y - focusY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var influenceR = 2.5;

                if (dist < influenceR) {
                    var prox = 1 - dist / influenceR;
                    prox = prox * prox;
                    m.position.z = prox * 0.5;
                    var brightBoost = prox * 0.3;
                    if (m.material.color) {
                        m.material.color.setRGB(1 + brightBoost, 1 + brightBoost * 0.5, 1 + brightBoost * 0.5);
                    }
                } else {
                    m.position.z *= 0.9;
                    if (m.material.color) m.material.color.setRGB(1, 1, 1);
                }
            }
        }

        var camZ = worldW * 0.9 / zoom;
        EP.Core.camera.position.z = camZ;
        EP.Core.camera.position.x = focusX * 0.1;
        EP.Core.camera.position.y = focusY * 0.1;
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
