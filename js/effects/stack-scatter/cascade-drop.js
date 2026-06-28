(function() {
    var effect = new EP.EffectBase('cascade-drop', {
        name: 'Cascade Drop',
        category: 'stack-scatter',
        icon: '🎴',
        description: 'Tarjetas caen en cascada formando un monton'
    }, [
        { key: 'cardSize', type: 'range', min: 20, max: 50, default: 35, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['bounce', 'elastic', 'smooth'], default: 'bounce', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function bounceOut(t) {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
        if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
        t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 3;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.3);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            var rx = (Math.random() - 0.5) * 3;
            var rrot = (Math.random() - 0.5) * 0.6;
            mesh.userData = { index: i, total: count, restX: rx, restRot: rrot };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var dropAt = i / count * 0.8;
            var local = Math.max(0, Math.min(1, (t - dropAt) / (0.8 / count)));
            var e = bounceOut(local);
            child.position.x = child.userData.restX;
            child.position.y = 8 * (1 - e) + (count - i) * 0.08 * e;
            child.position.z = i * 0.03;
            child.rotation.z = child.userData.restRot * e;
            child.material.opacity = Math.min(1, local * 3);
        });
    };

    EP.Registry.register(effect);
})();
