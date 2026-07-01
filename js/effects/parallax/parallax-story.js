(function() {
    var effect = new EP.EffectBase('parallax-story', {
        name: 'Parallax Scroll Story',
        category: 'parallax',
        icon: '📜',
        description: 'Historia vertical con scroll infinito y parallax por capa'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 70, default: 50, label: 'Card Size', unit: '%' },
        { key: 'spacing', type: 'range', min: 1, max: 6, default: 3, step: 0.5, label: 'Spacing' },
        { key: 'parallaxStrength', type: 'range', min: 10, max: 100, default: 70, label: 'Parallax', unit: '%' },
        { key: 'tiltAmount', type: 'range', min: 0, max: 30, default: 10, label: 'Tilt', unit: '°' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 8, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a12', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 4;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.4;
        var spacing = this.settings.spacing;

        for (var i = 0; i < count; i++) {
            var w = cardScale * (0.8 + Math.sin(i * 1.5) * 0.3);
            var h = w * (0.6 + Math.cos(i * 2.1) * 0.15);
            var geo = EP.RoundedPlaneGeometry(w, h, cr);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            var xOff = Math.sin(i * 2.3) * 1.5;
            var zOff = Math.cos(i * 1.7) * 1.5 - 2;
            mesh.position.set(xOff, -i * spacing, zOff);
            mesh.userData = {
                index: i,
                total: count,
                baseX: xOff,
                baseY: -i * spacing,
                baseZ: zOff,
                parallaxSpeed: 0.5 + (i / count) * 0.8,
                width: w
            };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var spacing = this.settings.spacing;
        var totalH = count * spacing;
        var scroll = t * totalH;
        var px = this.settings.parallaxStrength / 100;
        var tilt = THREE.MathUtils.degToRad(this.settings.tiltAmount);

        this.group.children.forEach(function(child) {
            var d = child.userData;
            var y = d.baseY + scroll;
            y = ((y % totalH) + totalH + totalH / 2) % totalH - totalH / 2;
            child.position.y = y;

            var viewDist = Math.abs(y) / (totalH * 0.4);
            var visible = Math.max(0, 1 - viewDist);

            child.position.x = d.baseX + Math.sin(t * Math.PI * 2 + d.index) * 0.3 * px * d.parallaxSpeed;
            child.position.z = d.baseZ + visible * 1.5;
            child.rotation.y = Math.sin(t * Math.PI * 2 + d.index * 0.8) * tilt * (1 - visible * 0.5);
            child.rotation.x = (1 - visible) * 0.2 * (y > 0 ? 1 : -1);

            var scale = 0.5 + visible * 0.5;
            child.scale.setScalar(scale);
            child.material.opacity = Math.min(1, visible * 2);
        });
    };

    EP.Registry.register(effect);
})();
