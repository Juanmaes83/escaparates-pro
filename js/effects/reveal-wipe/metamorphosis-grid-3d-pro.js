(function() {
    var effect = new EP.EffectBase('metamorphosis-grid-3d-pro', {
        name: 'Ciclo 3D Metamorfosis PRO',
        category: 'reveal-wipe',
        icon: 'MP',
        description: 'Version PRO del ciclo 3D: cuadricula que cae y alterna entre 2 a 6 imagenes o videos'
    }, [
        { key: 'rows', type: 'range', min: 8, max: 40, default: 20, step: 1, label: 'Rows' },
        { key: 'cols', type: 'range', min: 8, max: 40, default: 20, step: 1, label: 'Columns' },
        { key: 'mediaCount', type: 'range', min: 2, max: 6, default: 3, step: 1, label: 'Media Count' },
        { key: 'gap', type: 'range', min: 0, max: 12, default: 4, step: 1, label: 'Gap', unit: '%' },
        { key: 'depth', type: 'range', min: 20, max: 240, default: 130, step: 1, label: 'Depth', unit: '%' },
        { key: 'spread', type: 'range', min: 0, max: 60, default: 22, step: 1, label: 'Spread', unit: '%' },
        { key: 'speed', type: 'range', min: 20, max: 220, default: 100, step: 1, label: 'Cycle Speed', unit: '%' },
        { key: 'background', type: 'color', default: '#1a1a1a', label: 'Background' }
    ]);

    function makeTexture(media) {
        var t = media.type === 'video' ? new THREE.VideoTexture(media.element) : new THREE.Texture(media.element);
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.needsUpdate = true;
        return t;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var usable = mediaList.slice(0, Math.min(Math.floor(this.settings.mediaCount), mediaList.length));
        while (usable.length < 2) usable.push(usable[0]);
        this._textures = usable.map(makeTexture);
        this._activeCycle = -1;

        var rows = Math.floor(this.settings.rows);
        var cols = Math.floor(this.settings.cols);
        var totalW = 8;
        var totalH = 4.5;
        var cw = totalW / cols;
        var ch = totalH / rows;
        var gap = this.settings.gap / 100;

        var bg = new THREE.Mesh(new THREE.PlaneGeometry(totalW, totalH), new THREE.MeshBasicMaterial({ map: this._textures[1], side: THREE.DoubleSide }));
        bg.userData.isBackground = true;
        group.add(bg);

        var holder = new THREE.Group();
        holder.rotation.x = -0.62;
        holder.position.z = 0.08;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var geo = new THREE.PlaneGeometry(cw * (1 - gap), ch * (1 - gap));
                var uv = geo.attributes.uv;
                for (var i = 0; i < uv.count; i++) {
                    uv.setX(i, (x + uv.getX(i)) / cols);
                    uv.setY(i, 1 - (y + 1 - uv.getY(i)) / rows);
                }
                uv.needsUpdate = true;
                var tile = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this._textures[0], side: THREE.DoubleSide, transparent: true }));
                tile.position.set(-totalW / 2 + cw / 2 + x * cw, totalH / 2 - ch / 2 - y * ch, 0.03);
                tile.userData = { x: x, y: y, rows: rows, cols: cols, delay: Math.random() * this.settings.spread / 100 };
                holder.add(tile);
            }
        }
        group.add(holder);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._textures || this._textures.length < 2) return;
        var speed = this.settings.speed / 100;
        var cycleFloat = (time / loopDuration) * Math.max(0.05, speed) * this._textures.length;
        var cycle = Math.floor(cycleFloat);
        var local = cycleFloat - cycle;
        var current = cycle % this._textures.length;
        var next = (current + 1) % this._textures.length;

        if (cycle !== this._activeCycle) {
            this._activeCycle = cycle;
            var bg = this.group.children[0];
            bg.material.map = this._textures[next];
            bg.material.needsUpdate = true;
            this.group.children[1].children.forEach(function(tile) {
                tile.material.map = effect._textures[current];
                tile.material.opacity = 1;
                tile.material.needsUpdate = true;
            });
        }

        var holder = this.group.children[1];
        var fall = local < 0.5 ? local * 2 : (1 - local) * 2;
        var depth = this.settings.depth / 100;
        holder.position.y = -fall * 1.05 * depth;
        holder.children.forEach(function(tile) {
            var order = (tile.userData.x / tile.userData.cols + tile.userData.y / tile.userData.rows) * 0.5;
            var shifted = Math.max(0, Math.min(1, (fall - order * effect.settings.spread / 100) / Math.max(0.12, 1 - effect.settings.spread / 100)));
            tile.position.z = Math.pow(shifted, 2) * 2.25 * depth;
            tile.rotation.x = shifted * Math.PI * 0.2;
            tile.material.opacity = 1 - shifted * 0.72;
            if (tile.material.map && tile.material.map.isVideoTexture) tile.material.map.needsUpdate = true;
        });
        this._textures.forEach(function(t) { if (t.isVideoTexture) t.needsUpdate = true; });
    };

    EP.Registry.register(effect);
})();
