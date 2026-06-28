(function() {
    var effect = new EP.EffectBase('spotlight-zoom', {
        name: 'Spotlight Zoom',
        category: 'grid',
        icon: '🔍',
        description: 'Tarjetas que se turnan llenando el frame'
    }, [
        { key: 'cardSize', type: 'range', min: 25, max: 55, default: 35, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    function smoothstep(a, b, t) { t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 3;
        var geo = new THREE.PlaneGeometry(cardScale, cardScale * 1.2);

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

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            if (i === active) {
                var local = (activeFloat % 1);
                var zoomIn = smoothstep(0, 0.3, local);
                var zoomOut = smoothstep(0.7, 1, local);
                var scale = 1 + zoomIn * 2.5 - zoomOut * 2.5;
                child.scale.setScalar(scale);
                child.material.opacity = 1 - zoomOut;
                child.position.z = 1;
                child.visible = true;
            } else {
                child.visible = false;
                child.scale.setScalar(1);
            }
        });
    };

    EP.Registry.register(effect);
})();
