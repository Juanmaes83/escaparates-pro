(function() {
    var effect = new EP.EffectBase('virtual-tour', {
        name: 'Virtual Tour',
        category: 'reveal-wipe',
        icon: '🏠',
        description: 'Tour virtual — transita entre espacios con movimiento de cámara hacia adelante'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 80, default: 60, label: 'Card Size', unit: '%' },
        { key: 'zoomDepth', type: 'range', min: 10, max: 80, default: 40, label: 'Zoom Depth', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 10, default: 0, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'organic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 5;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.5;

        for (var i = 0; i < count; i++) {
            var geo = EP.RoundedPlaneGeometry(cardScale * 1.33, cardScale, cr);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(0, 0, 0);
            mesh.scale.setScalar(1);
            mesh.userData = { index: i, total: count };
            mesh.visible = false;
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var total = this.group.children.length;
        if (total === 0) return;

        var activeFloat = t * total;
        var active = Math.floor(activeFloat) % total;
        var next = (active + 1) % total;
        var localT = activeFloat % 1;
        var zd = (this.settings.zoomDepth || 40) / 100;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;

            if (i === active) {
                // Active card: scales up (zooms toward viewer), fades out as it zooms
                child.visible = true;
                var scale = 1 + zd * localT;
                child.scale.setScalar(scale);
                child.material.opacity = 1 - localT * 0.8;
                child.position.set(0, 0, 0);
            } else if (i === next) {
                // Next card: starts small (in the distance), grows and fades in
                child.visible = true;
                var scaleNext = 1 - zd * (1 - localT);
                scaleNext = Math.max(0.01, scaleNext);
                child.scale.setScalar(scaleNext);
                child.material.opacity = localT;
                child.position.set(0, 0, 0);
            } else {
                // All others: hidden
                child.visible = false;
                child.scale.setScalar(0);
                child.material.opacity = 0;
            }
        });
    };

    EP.Registry.register(effect);
})();
