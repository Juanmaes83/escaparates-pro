(function() {
    var effect = new EP.EffectBase('circular-scroll-gallery-pro', {
        name: 'Infinite Scroll Circular Gallery PRO',
        category: '3d-perspective',
        icon: 'IC',
        description: 'Galeria circular 3D inspirada en scroll infinito, adaptada a timeline y media slots'
    }, [
        { key: 'items', type: 'range', min: 6, max: 30, default: 18, step: 1, label: 'Items' },
        { key: 'radius', type: 'range', min: 180, max: 620, default: 360, step: 1, label: 'Radius', unit: '%' },
        { key: 'cardSize', type: 'range', min: 45, max: 140, default: 82, step: 1, label: 'Card Size', unit: '%' },
        { key: 'speed', type: 'range', min: -220, max: 220, default: 80, step: 1, label: 'Scroll Speed', unit: '%' },
        { key: 'depthFade', type: 'range', min: 0, max: 100, default: 65, step: 1, label: 'Depth Fade', unit: '%' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function texture(media) {
        var t = EP.Media.createTexture(media);
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.needsUpdate = true;
        return t;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        this._textures = mediaList.map(texture);
        var count = Math.floor(this.settings.items);
        var radius = this.settings.radius / 100;
        var w = 1.35 * this.settings.cardSize / 100;
        var h = 1.85 * this.settings.cardSize / 100;
        var geo = new THREE.PlaneGeometry(w, h);
        for (var i = 0; i < count; i++) {
            var mat = new THREE.MeshBasicMaterial({ map: this._textures[i % this._textures.length], side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
            var card = new THREE.Mesh(geo, mat);
            var a = (i / count) * Math.PI * 2;
            card.position.set(Math.sin(a) * radius, 0, Math.cos(a) * radius);
            card.lookAt(0, 0, 0);
            card.userData = { angle: a };
            group.add(card);
        }
        group.rotation.x = -0.08;
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var spin = time * 0.22 * this.settings.speed / 100;
        var radius = this.settings.radius / 100;
        var count = this.group.children.length;
        for (var i = 0; i < count; i++) {
            var card = this.group.children[i];
            var a = card.userData.angle + spin;
            card.position.set(Math.sin(a) * radius, Math.sin(a * 2) * 0.08, Math.cos(a) * radius);
            card.lookAt(0, 0, 0);
            var front = (Math.cos(a) + 1) * 0.5;
            card.material.opacity = 1 - (1 - front) * this.settings.depthFade / 100;
            card.scale.setScalar(0.78 + front * 0.42);
            if (card.material.map && card.material.map.isVideoTexture) card.material.map.needsUpdate = true;
        }
    };

    EP.Registry.register(effect);
})();
