(function() {
    var effect = new EP.EffectBase('pendulum-swing', {
        name: 'Pendulum Swing',
        category: 'gravity',
        icon: '🫳',
        description: 'Tarjetas oscilando como péndulos con gravedad — rítmico y elegante'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 15, max: 55, default: 30, label: 'Card Size', unit: '%' },
        { key: 'amplitude', type: 'range', min: 5, max: 60, default: 30, label: 'Amplitud', unit: '°' },
        { key: 'ropeLength', type: 'range', min: 1, max: 5, default: 2.5, step: 0.5, label: 'Rope Length' },
        { key: 'stagger', type: 'range', min: 0, max: 1, default: 0.3, step: 0.05, label: 'Stagger', unit: 's' },
        { key: 'dimAmount', type: 'range', min: 0, max: 80, default: 0, label: 'Dim Periféricos', unit: '%' },
        { key: 'background', type: 'color', default: '#0a0a12', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = Math.min(mediaList.length, 7);
        var cardW = 2.5 * this.settings.cardSize / 100;
        var cardH = cardW * 1.35;

        for (var i = 0; i < count; i++) {
            var geo = new THREE.PlaneGeometry(cardW, cardH);
            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            // Pivot marker (invisible)
            var pivot = new THREE.Object3D();
            pivot.userData = { index: i, total: count };
            pivot.add(mesh);
            mesh.position.y = -(this.settings.ropeLength || 2.5);
            group.add(pivot);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var count = this.group.children.length;
        if (!count) return;
        var amp = (this.settings.amplitude || 30) * Math.PI / 180;
        var ropeLenSetting = this.settings.ropeLength || 2.5;
        var stagger = this.settings.stagger || 0.3;
        var dimAmount = (this.settings.dimAmount || 0) / 100;
        var speedMult = ((this.settings.playbackMotionSpeed || 100) / 100);
        var g = 9.8;
        var spread = 2.4;

        for (var i = 0; i < count; i++) {
            var pivot = this.group.children[i];
            var card = pivot.children[0];
            if (!card) continue;

            // Stagger: each pendulum has a slight phase offset
            var phaseOff = (i / count) * stagger * Math.PI * 2;
            var omega = Math.sqrt(g / Math.max(0.5, ropeLenSetting)); // natural frequency
            var angle = amp * Math.sin(time * speedMult * omega + phaseOff);

            pivot.rotation.z = angle;
            pivot.position.x = (i - (count - 1) / 2) * spread;
            pivot.position.y = 2.0; // hang from top

            // Rope length update
            if (card.position.y !== -ropeLenSetting) card.position.y = -ropeLenSetting;

            // Dim peripherals
            if (dimAmount > 0 && card.material) {
                var centerDist = Math.abs(i - (count - 1) / 2) / ((count - 1) / 2);
                card.material.opacity = Math.max(0.15, 1 - dimAmount * centerDist);
            } else if (card.material) {
                card.material.opacity = 1;
            }
        }
    };

    effect.dispose = function() {
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
