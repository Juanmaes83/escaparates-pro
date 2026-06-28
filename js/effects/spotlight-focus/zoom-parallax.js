(function() {
    var effect = new EP.EffectBase('zoom-parallax', {
        name: 'Zoom Parallax',
        category: 'spotlight-focus',
        icon: '🔭',
        description: 'Ken Burns suave con crossfade'
    }, [
        { key: 'cardSize', type: 'range', min: 40, max: 90, default: 70, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 8;
        var geo = new THREE.PlaneGeometry(cardScale * 1.6, cardScale);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            mesh.userData = { index: i, total: count, panDir: i % 2 === 0 ? 1 : -1 };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var perSlide = 1 / count;
        var crossfade = 0.15;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var start = i * perSlide;
            var end = start + perSlide;
            var visible = false;
            var opacity = 0;

            if (t >= start && t < end) {
                visible = true;
                var local = (t - start) / perSlide;
                opacity = 1;
                if (local < crossfade) opacity = local / crossfade;
                if (local > 1 - crossfade) opacity = (1 - local) / crossfade;

                var zoom = 1 + local * 0.15;
                var panX = child.userData.panDir * local * 0.5;
                child.scale.setScalar(zoom);
                child.position.x = panX;
                child.position.z = 0;
            }

            child.visible = visible;
            child.material.opacity = Math.max(0, Math.min(1, opacity));
        });
    };

    EP.Registry.register(effect);
})();
