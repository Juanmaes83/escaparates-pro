(function() {
    var effect = new EP.EffectBase('polaroid-scatter', {
        name: 'Polaroid Scatter',
        category: 'stack-scatter',
        icon: '📸',
        description: 'Polaroids que caen sobre una mesa con rotacion y rebote'
    }, [
        { key: 'cardSize', type: 'range', min: 20, max: 50, default: 32, label: 'Card Size', unit: '%' },
        { key: 'spread', type: 'range', min: 2, max: 8, default: 4, step: 0.5, label: 'Spread' },
        { key: 'borderWidth', type: 'range', min: 5, max: 25, default: 12, label: 'Border', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 2, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['bounce', 'elastic', 'smooth'], default: 'bounce', label: 'Easing' },
        { key: 'background', type: 'color', default: '#1a1816', label: 'Background' }
    ]);

    function bounceOut(t) {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
        if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
        t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
    }

    function seededRandom(seed) {
        var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        group.rotation.x = -Math.PI * 0.35;
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 3;
        var border = this.settings.borderWidth / 100 * cardScale;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.3;
        var spread = this.settings.spread;

        for (var i = 0; i < count; i++) {
            var polaroid = new THREE.Group();

            var frameW = cardScale + border * 2;
            var frameH = cardScale * 1.2 + border * 2.5;
            var frameGeo = EP.RoundedPlaneGeometry(frameW, frameH, cr + border * 0.3);
            var frameMat = new THREE.MeshBasicMaterial({ color: 0xf5f0e8, side: THREE.DoubleSide });
            var frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.z = -0.005;
            polaroid.add(frame);

            var photoGeo = EP.RoundedPlaneGeometry(cardScale, cardScale * 1.2, cr);
            var mat = EP.Media.createMaterial(mediaList[i]);
            var photo = new THREE.Mesh(photoGeo, mat);
            photo.position.y = border * 0.25;
            polaroid.add(photo);

            var shadowGeo = new THREE.PlaneGeometry(frameW * 1.1, frameH * 1.1);
            var shadowMat = new THREE.MeshBasicMaterial({
                color: 0x000000, transparent: true, opacity: 0.2, side: THREE.DoubleSide
            });
            var shadow = new THREE.Mesh(shadowGeo, shadowMat);
            shadow.position.z = -0.02;
            shadow.position.x = 0.1;
            shadow.position.y = -0.1;
            polaroid.add(shadow);

            var rx = (seededRandom(i * 7.3) - 0.5) * spread;
            var ry = (seededRandom(i * 13.1) - 0.5) * spread * 0.6;
            var rr = (seededRandom(i * 3.7) - 0.5) * 0.8;

            polaroid.userData = {
                index: i, total: count,
                restX: rx, restY: ry, restRot: rr,
                dropDelay: i / count * 0.7
            };
            group.add(polaroid);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var cycleT = t * 2 % 2;

        this.group.children.forEach(function(polaroid) {
            var d = polaroid.userData;
            if (cycleT < 1) {
                var localT = Math.max(0, Math.min(1, (cycleT - d.dropDelay) / 0.3));
                var e = bounceOut(localT);
                polaroid.position.x = d.restX;
                polaroid.position.y = d.restY + (1 - e) * 8;
                polaroid.position.z = d.index * 0.02;
                polaroid.rotation.z = d.restRot * e;
                polaroid.children[0].material.opacity = 1;
                polaroid.children[1].material.opacity = Math.min(1, localT * 3);
            } else {
                var hideT = cycleT - 1;
                var localHide = Math.max(0, Math.min(1, (hideT - d.dropDelay) / 0.25));
                polaroid.position.x = d.restX + localHide * d.restRot * 5;
                polaroid.position.y = d.restY - localHide * 6;
                polaroid.rotation.z = d.restRot + localHide * Math.PI * 0.5 * (d.restRot > 0 ? 1 : -1);
                polaroid.children[1].material.opacity = 1 - localHide;
            }
        });
    };

    EP.Registry.register(effect);
})();
