(function() {
    var effect = new EP.EffectBase('metamorphosis-grid-3d', {
        name: 'Ciclo 3D Metamorfosis',
        category: 'reveal-wipe',
        icon: 'MG',
        description: 'Cuadricula 3D que cae y revela una segunda imagen'
    }, [
        { key: 'rows', type: 'range', min: 8, max: 32, default: 18, step: 1, label: 'Rows' },
        { key: 'cols', type: 'range', min: 8, max: 36, default: 22, step: 1, label: 'Columns' },
        { key: 'gap', type: 'range', min: 0, max: 12, default: 3, step: 1, label: 'Gap', unit: '%' },
        { key: 'depth', type: 'range', min: 20, max: 220, default: 118, step: 1, label: 'Depth', unit: '%' },
        { key: 'spread', type: 'range', min: 0, max: 90, default: 32, step: 1, label: 'Spread', unit: '%' },
        { key: 'speed', type: 'range', min: 20, max: 200, default: 100, step: 1, label: 'Speed', unit: '%' },
        { key: 'background', type: 'color', default: '#1a1a1a', label: 'Background' }
    ]);

    function tex(media) {
        var t = EP.Media.createTexture(media);
        t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
        return t;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var top = tex(mediaList[0]);
        var bottom = tex(mediaList[Math.min(1, mediaList.length - 1)]);
        group.add(new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), new THREE.MeshBasicMaterial({ map: bottom, side: THREE.DoubleSide })));
        var rows = Math.floor(this.settings.rows), cols = Math.floor(this.settings.cols);
        var totalW = 8, totalH = 4.5, gap = this.settings.gap / 100;
        var cw = totalW / cols, ch = totalH / rows;
        var holder = new THREE.Group();
        holder.rotation.x = -0.65;
        holder.position.z = 0.12;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var geo = new THREE.PlaneGeometry(cw * (1 - gap), ch * (1 - gap));
                var uv = geo.attributes.uv;
                for (var i = 0; i < uv.count; i++) {
                    uv.setX(i, (x + uv.getX(i)) / cols);
                    uv.setY(i, 1 - (y + 1 - uv.getY(i)) / rows);
                }
                uv.needsUpdate = true;
                var tile = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: top, side: THREE.DoubleSide, transparent: true }));
                tile.position.set(-totalW / 2 + cw / 2 + x * cw, totalH / 2 - ch / 2 - y * ch, 0.03);
                tile.userData = { x: x, y: y, rows: rows, cols: cols, seed: Math.random() };
                holder.add(tile);
            }
        }
        group.add(holder);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var holder = this.group.children[1];
        var p = ((time / loopDuration) * this.settings.speed / 100) % 1;
        var eased = p < 0.5 ? p * 2 : (1 - p) * 2;
        var depth = this.settings.depth / 100;
        var spread = this.settings.spread / 100;
        holder.position.y = -eased * 1.15 * depth;
        holder.children.forEach(function(tile) {
            var order = (tile.userData.x / tile.userData.cols + tile.userData.y / tile.userData.rows) * 0.5;
            var local = Math.max(0, Math.min(1, (eased - order * spread) / Math.max(0.08, 1 - spread)));
            tile.position.z = Math.pow(local, 2) * 2.2 * depth;
            tile.rotation.x = local * Math.PI * 0.18;
            tile.material.opacity = 1 - local * 0.7;
            if (tile.material.map && tile.material.map.isVideoTexture) tile.material.map.needsUpdate = true;
        });
        if (this.group.children[0].material.map && this.group.children[0].material.map.isVideoTexture) this.group.children[0].material.map.needsUpdate = true;
    };

    EP.Registry.register(effect);
})();
