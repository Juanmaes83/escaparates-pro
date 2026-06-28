(function() {
    var effect = new EP.EffectBase('poster-burst', {
        name: 'Poster Burst',
        category: 'stack-scatter',
        icon: '💥',
        description: 'Expansion desde el centro cubriendo el fondo'
    }, [
        { key: 'cardSize', type: 'range', min: 20, max: 55, default: 35, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['overshoot', 'smooth', 'elastic'], default: 'overshoot', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
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
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.3);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i, total: count };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var activeFloat = t * count;
        var active = Math.floor(activeFloat) % count;
        var localT = activeFloat % 1;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            if (i === active) {
                var e = easeOutBack(Math.min(1, localT * 1.5));
                child.scale.setScalar(e * 4);
                child.material.opacity = Math.min(1, localT * 3);
                child.position.z = 2;
                child.visible = true;
            } else if (i === (active + count - 1) % count && localT < 0.3) {
                child.scale.setScalar(4);
                child.material.opacity = 1 - localT * 3.3;
                child.position.z = 1;
                child.visible = true;
            } else {
                child.visible = false;
            }
        });
    };

    EP.Registry.register(effect);
})();
