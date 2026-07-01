(function() {
    var effect = new EP.EffectBase('multimedia-book-3d', {
        name: 'Libros 3D',
        category: '3d-perspective',
        icon: 'BK',
        description: 'Libro 3D con paginas multimedia y hojeo fluido'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'pages', type: 'range', min: 3, max: 9, default: 7, step: 1, label: 'Pages' },
        { key: 'progress', type: 'range', min: 0, max: 100, default: 50, step: 1, label: 'Page Turn', unit: '%' },
        { key: 'auto', type: 'select', options: [{ v: 'on', l: 'Auto' }, { v: 'off', l: 'Manual' }], default: 'on', label: 'Motion' },
        { key: 'speed', type: 'range', min: 10, max: 180, default: 60, step: 1, label: 'Speed', unit: '%' },
        { key: 'size', type: 'range', min: 60, max: 150, default: 105, step: 1, label: 'Size', unit: '%' },
        { key: 'background', type: 'color', default: '#2a2a2a', label: 'Background' }
    ]);

    function materialFor(media) {
        var t = EP.Media.createTexture(media);
        t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
        return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, transparent: true, opacity: 0.98 });
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var count = Math.floor(this.settings.pages);
        var pageW = 2.1, pageH = 3;
        group.rotation.x = -0.12;
        for (var i = 0; i < count; i++) {
            var page = new THREE.Group();
            page.position.x = 0;
            page.position.z = -i * 0.018;
            var front = new THREE.Mesh(new THREE.PlaneGeometry(pageW, pageH), materialFor(mediaList[i % mediaList.length]));
            front.position.x = pageW / 2;
            front.position.z = 0.01;
            var back = new THREE.Mesh(new THREE.PlaneGeometry(pageW, pageH), materialFor(mediaList[(i + 1) % mediaList.length]));
            back.position.x = pageW / 2;
            back.rotation.y = Math.PI;
            back.position.z = -0.01;
            page.add(front);
            page.add(back);
            page.userData = { index: i, count: count };
            group.add(page);
        }
        var cover = new THREE.Mesh(new THREE.PlaneGeometry(pageW * 2.05, pageH * 1.06), new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide, transparent: true, opacity: 0.32 }));
        cover.position.z = -count * 0.025;
        group.add(cover);
        group.scale.setScalar(this.settings.size / 100);
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var pageCount = Math.floor(this.settings.pages);
        var t = this.settings.auto === 'on' ? (Math.sin(time * this.settings.speed / 100) + 1) * 0.5 : this.settings.progress / 100;
        var smooth = t * t * (3 - 2 * t);
        var continuous = smooth * (pageCount - 1);
        var active = Math.floor(continuous);
        var frac = continuous - active;
        for (var i = 0; i < pageCount; i++) {
            var page = this.group.children[i];
            if (!page) continue;
            if (i < active) page.rotation.y = -Math.PI;
            else if (i === active) page.rotation.y = -frac * Math.PI;
            else page.rotation.y = 0;
            page.children.forEach(function(face) {
                if (face.material.map && face.material.map.isVideoTexture) face.material.map.needsUpdate = true;
            });
        }
        this.group.scale.setScalar(this.settings.size / 100);
        this.group.rotation.y = Math.sin(time * 0.16) * 0.12;
    };

    EP.Registry.register(effect);
})();
