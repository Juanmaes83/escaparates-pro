(function() {
    var effect = new EP.EffectBase('page-reveal', {
        name: 'Page Reveal 3D',
        category: '3d-perspective',
        icon: '📄',
        description: 'Bloques 3D que se abren revelando las imagenes debajo — efecto reveal cinematografico con perspectiva'
    }, [
        { key: 'gridCols', type: 'range', min: 2, max: 12, default: 6, step: 1, label: 'Columns' },
        { key: 'gridRows', type: 'range', min: 2, max: 8, default: 4, step: 1, label: 'Rows' },
        { key: 'blockThickness', type: 'range', min: 5, max: 50, default: 20, label: 'Thickness', unit: '%' },
        { key: 'revealSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Speed', unit: '%' },
        { key: 'blockColor', type: 'color', default: '#ffffff', label: 'Block Color' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#111111', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cols = this.settings.gridCols;
        var rows = this.settings.gridRows;
        var thickness = 0.05 + 0.3 * this.settings.blockThickness / 100;

        for (var img = 0; img < mediaList.length; img++) {
            var imgGroup = new THREE.Group();
            imgGroup.visible = false;
            imgGroup.userData = { imageIndex: img };

            var tex = null;
            var aspect = 1;
            if (mediaList[img].element) {
                tex = new THREE.Texture(mediaList[img].element);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || 1;
                aspect = ew / eh;
            }

            var totalW = 8;
            var totalH = totalW / aspect;
            if (totalH > 6) { totalH = 6; totalW = totalH * aspect; }

            var bgGeo = new THREE.PlaneGeometry(totalW, totalH);
            var bgMat = new THREE.MeshBasicMaterial({ map: tex });
            var bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -0.01;
            bgMesh.userData = { isBg: true };
            imgGroup.add(bgMesh);

            var cellW = totalW / cols;
            var cellH = totalH / rows;
            var blockColor = new THREE.Color(this.settings.blockColor);

            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    var geo = new THREE.BoxGeometry(cellW * 0.98, cellH * 0.98, thickness);
                    var mat = new THREE.MeshPhongMaterial({
                        color: blockColor,
                        shininess: 30
                    });
                    var block = new THREE.Mesh(geo, mat);
                    block.position.set(
                        -totalW / 2 + cellW * (c + 0.5),
                        -totalH / 2 + cellH * (r + 0.5),
                        thickness / 2
                    );
                    var dist = Math.sqrt(
                        Math.pow((c - cols / 2) / cols, 2) +
                        Math.pow((r - rows / 2) / rows, 2)
                    );
                    block.userData = {
                        isBlock: true,
                        col: c,
                        row: r,
                        delay: dist * 1.5 + Math.random() * 0.3,
                        flipAxis: Math.random() > 0.5 ? 'x' : 'y',
                        basePos: block.position.clone()
                    };
                    imgGroup.add(block);
                }
            }

            group.add(imgGroup);
        }

        var light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(2, 3, 5);
        light.userData = { isLight: true };
        group.add(light);

        var ambient = new THREE.AmbientLight(0x444444, 0.6);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var images = [];
        for (var i = 0; i < this.group.children.length; i++) {
            if (this.group.children[i].userData.imageIndex !== undefined) images.push(this.group.children[i]);
        }
        var count = images.length;
        if (count === 0) return;
        var segDur = 1 / count;
        var speed = this.settings.revealSpeed / 100;

        for (var idx = 0; idx < count; idx++) {
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;
            if (t >= segStart && t < segEnd) {
                images[idx].visible = true;
                var lt = (t - segStart) / segDur;
                if (images[idx].children[0] && images[idx].children[0].material.map) {
                    images[idx].children[0].material.map.needsUpdate = true;
                }

                for (var j = 0; j < images[idx].children.length; j++) {
                    var block = images[idx].children[j];
                    if (!block.userData.isBlock) continue;

                    var revealT = Math.max(0, Math.min(1, (lt * (1.5 + speed) - block.userData.delay) * (0.5 + speed)));
                    revealT = EP.Easing.apply(revealT, this.settings.easing);

                    if (block.userData.flipAxis === 'x') {
                        block.rotation.x = revealT * Math.PI * 0.5;
                    } else {
                        block.rotation.y = revealT * Math.PI * 0.5;
                    }
                    block.position.z = block.userData.basePos.z + revealT * 2;
                    block.material.opacity = 1 - revealT;
                    block.material.transparent = true;
                }
            } else {
                images[idx].visible = false;
            }
        }

        EP.Core.camera.position.set(0, 0, 7);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this.group) {
            for (var i = 0; i < this.group.children.length; i++) {
                var ig = this.group.children[i];
                if (ig.children && ig.children[0] && ig.children[0].material && ig.children[0].material.map) {
                    ig.children[0].material.map.dispose();
                }
            }
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
