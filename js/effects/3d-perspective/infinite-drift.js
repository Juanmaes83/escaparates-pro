(function() {
    var effect = new EP.EffectBase('infinite-drift', {
        name: 'Infinite Drift',
        category: '3d-perspective',
        icon: '🌊',
        description: '8 bandas horizontales de imagenes desplazandose en parallax infinito — cada fila a distinta velocidad y direccion'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'bandCount', type: 'range', min: 4, max: 10, default: 8, step: 1, label: 'Bands' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 35, label: 'Drift Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 55, label: 'Photo Size', unit: '%' },
        { key: 'gap', type: 'range', min: 5, max: 50, default: 15, label: 'Gap', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a1a2a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var bands = this.settings.bandCount;
        var cardScale = 0.8 + 1.6 * this.settings.cardSize / 100;
        var gapFactor = 0.1 + 0.4 * this.settings.gap / 100;

        var cw = cardScale * 1.6;
        var ch = cardScale;
        var bandSpacing = ch + gapFactor;
        var totalH = bands * bandSpacing;
        var startY = totalH / 2 - bandSpacing / 2;

        this._bands = [];
        var imgsPerBand = [8, 10, 7, 11, 9, 12, 8, 10];

        for (var b = 0; b < bands; b++) {
            var bandGroup = new THREE.Group();
            bandGroup.position.y = startY - b * bandSpacing;
            var dir = (b % 2 === 0) ? 1 : -1;
            var speedMult = 0.6 + Math.random() * 0.8;
            var count = imgsPerBand[b % imgsPerBand.length];
            var totalW = count * (cw + gapFactor);

            for (var c = 0; c < count * 2; c++) {
                var mi = (b * 3 + c) % mediaList.length;
                var tex = null;
                if (mediaList[mi].element) {
                    tex = EP.Media.createTexture(mediaList[mi]);
                    tex.needsUpdate = true;
                    tex.minFilter = THREE.LinearFilter;
                }
                var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.04) : new THREE.PlaneGeometry(cw, ch);
                var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.x = c * (cw + gapFactor) - totalW;
                mesh.userData = { isCard: true };
                bandGroup.add(mesh);
            }

            bandGroup.userData = { isBand: true, direction: dir, speedMult: speedMult, totalWidth: totalW, cardWidth: cw + gapFactor };
            group.add(bandGroup);
            this._bands.push(bandGroup);
        }

        this._cw = cw;
        this._gapFactor = gapFactor;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._bands) return;
        var speed = this.settings.speed / 100;

        for (var i = 0; i < this._bands.length; i++) {
            var band = this._bands[i];
            var dir = band.userData.direction;
            var sm = band.userData.speedMult;
            var tw = band.userData.totalWidth;
            var cwd = band.userData.cardWidth;

            for (var j = 0; j < band.children.length; j++) {
                var card = band.children[j];
                card.position.x += dir * speed * sm * dt * 2;

                if (dir > 0 && card.position.x > tw) {
                    card.position.x -= tw * 2;
                } else if (dir < 0 && card.position.x < -tw) {
                    card.position.x += tw * 2;
                }

                if (card.material && card.material.map) {
                    card.material.map.needsUpdate = true;
                }
            }
        }

        var camZ = 8 + this._bands.length * 0.5;
        EP.Core.camera.position.set(
            Math.sin(time * 0.06) * 0.5,
            Math.sin(time * 0.04) * 0.3,
            camZ
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
