(function() {
    var effect = new EP.EffectBase('grid-reveal', {
        name: 'Grid Reveal',
        category: 'grid',
        icon: '⊞',
        description: 'Mosaico 2x2 que se ensambla y se dispersa'
    }, [
        { key: 'cardSize', type: 'range', min: 25, max: 60, default: 42, label: 'Card Size', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 3, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'easing', type: 'easing', options: ['overshoot', 'bounce', 'elastic', 'smooth'], default: 'overshoot', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function easeOutBack(t) {
        var s = 1.70158;
        return (t = t - 1) * t * ((s + 1) * t + s) + 1;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 3;
        var gap = this.settings.gap / 100 * 2;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale);
        var positions = [[-1, 1], [1, 1], [-1, -1], [1, -1]];

        for (var i = 0; i < 4; i++) {
            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            var mesh = new THREE.Mesh(geo, mat);
            var px = positions[i][0] * (cardScale / 2 + gap / 2);
            var py = positions[i][1] * (cardScale / 2 + gap / 2);
            mesh.userData = { targetX: px, targetY: py, index: i };
            mesh.position.set(px + positions[i][0] * 10, py + positions[i][1] * 10, 0);
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var assembleEnd = 0.4;
        var holdEnd = 0.7;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var tx = child.userData.targetX;
            var ty = child.userData.targetY;
            var delay = i * 0.08;

            if (t < assembleEnd) {
                var local = Math.max(0, Math.min(1, (t - delay) / (assembleEnd - delay * 4)));
                var e = easeOutBack(local);
                child.position.x = tx + (1 - e) * tx * 3;
                child.position.y = ty + (1 - e) * ty * 3;
                child.rotation.z = (1 - e) * 0.5;
                child.scale.setScalar(0.3 + e * 0.7);
            } else if (t < holdEnd) {
                child.position.set(tx, ty, 0);
                child.rotation.z = 0;
                child.scale.setScalar(1);
            } else {
                var scatter = (t - holdEnd) / (1 - holdEnd);
                scatter = scatter * scatter;
                child.position.x = tx + scatter * tx * 4;
                child.position.y = ty + scatter * ty * 4;
                child.rotation.z = scatter * (i % 2 === 0 ? 0.8 : -0.8);
                child.scale.setScalar(1 - scatter * 0.6);
                child.material.opacity = 1 - scatter;
            }
        });
    };

    EP.Registry.register(effect);
})();
