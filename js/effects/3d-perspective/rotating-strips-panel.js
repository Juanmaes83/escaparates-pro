(function() {
    var effect = new EP.EffectBase('rotating-strips-panel', {
        name: 'Rotating Strips Panel',
        category: '3d-perspective',
        icon: 'RS',
        description: 'Imagen dividida en tiras giratorias con volumen 3D y controles de tamano'
    }, [
        { key: 'width', type: 'range', min: 55, max: 160, default: 112, step: 1, label: 'Width', unit: '%' },
        { key: 'height', type: 'range', min: 45, max: 140, default: 92, step: 1, label: 'Height', unit: '%' },
        { key: 'strips', type: 'range', min: 8, max: 48, default: 24, step: 1, label: 'Strips' },
        { key: 'speed', type: 'range', min: 0, max: 200, default: 70, step: 1, label: 'Rotation', unit: '%' },
        { key: 'depth', type: 'range', min: 0, max: 180, default: 72, step: 1, label: 'Depth', unit: '%' },
        { key: 'border', type: 'range', min: 0, max: 100, default: 25, step: 1, label: 'Border', unit: '%' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var media = mediaList[0];
        var tex = EP.Media.createTexture(media);
        tex.needsUpdate = true;
        var strips = Math.floor(this.settings.strips);
        var totalW = this.settings.width / 100 * 7.2;
        var totalH = this.settings.height / 100 * 4.4;
        var stripW = totalW / strips;
        for (var i = 0; i < strips; i++) {
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.96 });
            mat.map = tex;
            var geo = new THREE.PlaneGeometry(stripW, totalH);
            var uv = geo.attributes.uv;
            var u0 = i / strips;
            var u1 = (i + 1) / strips;
            for (var j = 0; j < uv.count; j++) {
                uv.setX(j, uv.getX(j) === 0 ? u0 : u1);
            }
            uv.needsUpdate = true;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.x = -totalW / 2 + stripW / 2 + i * stripW;
            mesh.userData = { isStrip: true, index: i, strips: strips, baseX: mesh.position.x };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var depth = this.settings.depth / 100;
        var speed = this.settings.speed / 100;
        this.group.children.forEach(function(mesh) {
            var phase = time * speed + mesh.userData.index * 0.12;
            mesh.rotation.y = Math.sin(phase) * Math.PI * 0.42 * depth;
            mesh.position.z = Math.cos(phase) * 0.9 * depth;
            mesh.material.opacity = 0.72 + Math.cos(phase) * 0.2;
            if (mesh.material.map && mesh.material.map.isVideoTexture) mesh.material.map.needsUpdate = true;
        });
    };

    EP.Registry.register(effect);
})();
