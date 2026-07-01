(function() {
    var effect = new EP.EffectBase('rising-cell-grid', {
        name: '3D Rising Cell Grid',
        category: 'grid',
        icon: 'CG',
        description: 'Reticula 3D de celdas animadas basada en el proyecto PUG/SCSS del TXT'
    }, [
        { key: 'rows', type: 'range', min: 8, max: 35, default: 22, step: 1, label: 'Rows' },
        { key: 'cols', type: 'range', min: 8, max: 35, default: 22, step: 1, label: 'Columns' },
        { key: 'height', type: 'range', min: 10, max: 180, default: 78, step: 1, label: 'Height', unit: '%' },
        { key: 'speed', type: 'range', min: 20, max: 220, default: 90, step: 1, label: 'Speed', unit: '%' },
        { key: 'colorA', type: 'color', default: '#E2A9E5', label: 'Color A' },
        { key: 'colorB', type: 'color', default: '#632C65', label: 'Color B' },
        { key: 'background', type: 'color', default: '#4B384C', label: 'Background' }
    ]);

    effect.build = function() {
        var group = new THREE.Group();
        var rows = Math.floor(this.settings.rows), cols = Math.floor(this.settings.cols);
        var totalW = 7.5, totalH = 4.4, cw = totalW / cols, ch = totalH / rows;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var geo = new THREE.BoxGeometry(cw * 0.74, ch * 0.74, 0.08);
                var color = ((x + y) % 2 === 0) ? this.settings.colorA : this.settings.colorB;
                var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.92 }));
                mesh.position.set(-totalW / 2 + cw / 2 + x * cw, totalH / 2 - ch / 2 - y * ch, 0);
                mesh.userData = { x: x, y: y, cols: cols, rows: rows };
                group.add(mesh);
            }
        }
        group.rotation.x = -0.82;
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var h = this.settings.height / 100;
        var speed = this.settings.speed / 100;
        this.group.children.forEach(function(cell) {
            var wave = Math.sin(time * speed + cell.userData.x * 0.36 + cell.userData.y * 0.2);
            cell.position.z = (wave + 1) * 0.55 * h;
            cell.scale.z = 1 + (wave + 1) * 3.8 * h;
            cell.material.color.set(((cell.userData.x + cell.userData.y) % 2 === 0) ? effect.settings.colorA : effect.settings.colorB);
        });
        this.group.rotation.z = Math.sin(time * 0.08) * 0.05;
    };

    EP.Registry.register(effect);
})();
