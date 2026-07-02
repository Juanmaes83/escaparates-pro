(function() {
    var effect = new EP.EffectBase('swaying-gallery', {
        name: 'Swaying Gallery',
        category: 'carousel-flow',
        icon: '🖼️',
        description: 'Fotos colgantes que se balancean como en una pared — movimiento péndulo suave'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'swayAmount', type: 'range', min: 1, max: 30, default: 10, step: 1, label: 'Amplitud balanceo', unit: '°' },
        { key: 'swaySpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad balanceo' },
        { key: 'photoCount', type: 'range', min: 1, max: 6, default: 3, step: 1, label: 'Fotos visibles' },
        { key: 'scale', type: 'range', min: 20, max: 100, default: 55, step: 5, label: 'Tamaño foto', unit: '%' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var ml = mediaList || [];
        var n = Math.min(Math.round(this.settings.photoCount), Math.max(1, ml.length || 1));
        var photoScale = this.settings.scale / 100;
        var w = 3.0 * photoScale;
        var h = 2.0 * photoScale;
        var spacing = 8 / (n + 1);

        this._pivots = [];
        for (var i = 0; i < n; i++) {
            var pivot = new THREE.Group();
            pivot.position.x = -4 + (i + 1) * spacing;
            pivot.position.y = 1.5;

            var m = ml.length > 0 ? ml[i % ml.length] : null;
            var geo = new THREE.PlaneGeometry(w, h);
            var mat = m ? EP.Media.createMaterial(m) : new THREE.MeshBasicMaterial({ color: 0x2a2a2a, transparent: true });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = -(h / 2 + 0.18);
            pivot.add(mesh);

            // Hanging string
            var sGeo = new THREE.PlaneGeometry(0.015, 0.35);
            var sMat = new THREE.MeshBasicMaterial({ color: 0xbbbbbb, transparent: true, opacity: 0.55 });
            var sLine = new THREE.Mesh(sGeo, sMat);
            sLine.position.y = -0.18;
            pivot.add(sLine);

            group.add(pivot);
            this._pivots.push({ pivot: pivot, phase: i * 1.3 + (i % 2) * 0.7 });
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._pivots) return;
        var spd = this.settings.swaySpeed * 0.25;
        var amp = (this.settings.swayAmount || 10) * Math.PI / 180;
        for (var i = 0; i < this._pivots.length; i++) {
            var p = this._pivots[i];
            p.pivot.rotation.z = Math.sin(time * spd + p.phase) * amp;
        }
    };

    effect.dispose = function() { this._pivots = null; };

    EP.Registry.register(effect);
})();
