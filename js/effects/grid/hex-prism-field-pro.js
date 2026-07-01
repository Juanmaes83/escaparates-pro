(function() {
    var effect = new EP.EffectBase('hex-prism-field-pro', {
        name: 'Hex Prism Field PRO',
        category: 'grid',
        icon: 'HX',
        description: 'Campo de prismas hexagonales 3D animados con material de imagen o video'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'rows', type: 'range', min: 4, max: 14, default: 10, step: 1, label: 'Rows' },
        { key: 'cols', type: 'range', min: 6, max: 20, default: 15, step: 1, label: 'Columns' },
        { key: 'height', type: 'range', min: 15, max: 160, default: 70, step: 1, label: 'Prism Depth', unit: '%' },
        { key: 'speed', type: 'range', min: 20, max: 220, default: 100, step: 1, label: 'Flip Speed', unit: '%' },
        { key: 'stagger', type: 'range', min: 0, max: 100, default: 55, step: 1, label: 'Stagger', unit: '%' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function makeMat(media) {
        if (!media) return new THREE.MeshBasicMaterial({ color: 0xdddddd, side: THREE.DoubleSide });
        var t = EP.Media.createTexture(media);
        t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
        return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, transparent: true, opacity: 0.94 });
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var rows = Math.floor(this.settings.rows), cols = Math.floor(this.settings.cols);
        var geo = new THREE.CylinderGeometry(0.18, 0.18, 0.34 * this.settings.height / 100, 6, 1, false);
        var totalW = cols * 0.46;
        var totalH = rows * 0.39;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var mat = makeMat(mediaList && mediaList.length ? mediaList[(x + y) % mediaList.length] : null);
                var prism = new THREE.Mesh(geo, mat);
                prism.rotation.x = Math.PI / 2;
                prism.position.set(-totalW / 2 + x * 0.46 + (y % 2) * 0.23, totalH / 2 - y * 0.39, 0);
                prism.userData = { x: x, y: y };
                group.add(prism);
            }
        }
        group.rotation.x = -0.22;
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;
        var stagger = this.settings.stagger / 100;
        this.group.children.forEach(function(prism) {
            var delay = prism.userData.x * 0.16 * stagger + prism.userData.y * 0.08 * stagger;
            var p = (Math.sin(time * speed + delay) + 1) * 0.5;
            prism.rotation.y = p * Math.PI;
            prism.scale.z = 0.55 + p * effect.settings.height / 55;
            prism.position.z = p * 0.34;
            if (prism.material.map && prism.material.map.isVideoTexture) prism.material.map.needsUpdate = true;
        });
    };

    EP.Registry.register(effect);
})();
