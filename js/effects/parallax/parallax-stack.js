(function() {
    var effect = new EP.EffectBase('parallax-stack', {
        name: 'Parallax Card Stack',
        category: 'parallax',
        icon: '📚',
        description: 'Stack de tarjetas en abanico con parallax interno 2.5D'
    }, [
        { key: 'cardSize', type: 'range', min: 25, max: 55, default: 40, label: 'Card Size', unit: '%' },
        { key: 'fanAngle', type: 'range', min: 5, max: 45, default: 20, label: 'Fan Angle', unit: '°' },
        { key: 'parallaxInner', type: 'range', min: 10, max: 100, default: 60, label: 'Inner Parallax', unit: '%' },
        { key: 'stackGap', type: 'range', min: 1, max: 10, default: 4, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 10, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'overshoot', 'snappy'], default: 'overshoot', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0c0c16', label: 'Background' }
    ]);

    function easeOutBack(t) {
        var s = 1.70158;
        return (t = t - 1) * t * ((s + 1) * t + s) + 1;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.5;
        var h = cardScale * 1.3;

        for (var i = 0; i < count; i++) {
            var card = new THREE.Group();

            var frameGeo = EP.RoundedPlaneGeometry(cardScale + 0.08, h + 0.08, cr + 0.04);
            var frameMat = new THREE.MeshBasicMaterial({
                color: 0x333340, transparent: true, opacity: 0.6, side: THREE.DoubleSide
            });
            var frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.z = -0.01;
            card.add(frame);

            var innerScale = 0.92;
            var innerGeo = EP.RoundedPlaneGeometry(cardScale * innerScale, h * innerScale, cr * 0.8);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            var inner = new THREE.Mesh(innerGeo, mat);
            inner.userData = { isInner: true };
            card.add(inner);

            card.position.z = -i * 0.15;
            card.userData = {
                index: i, total: count,
                baseZ: -i * 0.15
            };
            group.add(card);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var fanAngle = THREE.MathUtils.degToRad(this.settings.fanAngle);
        var gap = this.settings.stackGap / 100 * 2;
        var parallax = this.settings.parallaxInner / 100;
        var cycleT = t * 2 % 2;

        this.group.children.forEach(function(card, idx) {
            var d = card.userData;
            var i = d.index;
            var centerOff = (i - (count - 1) / 2);

            if (cycleT < 1) {
                var delay = i * 0.12;
                var localT = Math.max(0, Math.min(1, (cycleT - delay) / 0.4));
                var e = easeOutBack(localT);
                card.position.x = centerOff * gap * e;
                card.rotation.z = -centerOff * fanAngle / count * e;
                card.position.y = -Math.abs(centerOff) * 0.15 * e;
                card.position.z = d.baseZ;

                var inner = card.children[1];
                if (inner) {
                    var px = Math.sin(t * Math.PI * 4 + i) * 0.08 * parallax;
                    var py = Math.cos(t * Math.PI * 3 + i * 2) * 0.05 * parallax;
                    inner.position.x = px;
                    inner.position.y = py;
                    inner.scale.setScalar(1 + Math.sin(t * Math.PI * 2 + i) * 0.02 * parallax);
                }
            } else {
                var hideDelay = i * 0.1;
                var hideT = Math.max(0, Math.min(1, (cycleT - 1 - hideDelay) / 0.35));
                card.position.x = centerOff * gap * (1 - hideT);
                card.position.y = -Math.abs(centerOff) * 0.15 * (1 - hideT) + hideT * 3;
                card.rotation.z = -centerOff * fanAngle / count * (1 - hideT) + hideT * 0.5;
            }
        });
    };

    EP.Registry.register(effect);
})();
