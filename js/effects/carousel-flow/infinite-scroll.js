(function() {
    var effect = new EP.EffectBase('infinite-scroll', {
        name: 'Infinite Scroll Gallery',
        category: 'carousel-flow',
        icon: '♾️',
        description: 'Galeria circular infinita con scroll automatico — las imagenes pasan en bucle continuo con profundidad y escala dinamica'
    }, [
        { key: 'columns', type: 'range', min: 1, max: 3, default: 2, step: 1, label: 'Columns' },
        { key: 'scrollSpeed', type: 'range', min: 10, max: 100, default: 40, label: 'Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 60, label: 'Card Size', unit: '%' },
        { key: 'depthEffect', type: 'range', min: 0, max: 100, default: 40, label: 'Depth Effect', unit: '%' },
        { key: 'gap', type: 'range', min: 10, max: 80, default: 30, label: 'Gap', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a14', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cols = this.settings.columns;
        var cardScale = 1 + 2 * this.settings.cardSize / 100;
        var gap = 0.2 + 0.6 * this.settings.gap / 100;

        var cardW = cardScale;
        var cardH = cardScale * 0.75;
        var totalPerCol = mediaList.length;
        var colSpacing = cardW + gap;

        for (var col = 0; col < cols; col++) {
            var colGroup = new THREE.Group();
            colGroup.position.x = (col - (cols - 1) / 2) * colSpacing;
            colGroup.userData = { isColumn: true, colIndex: col };

            for (var i = 0; i < totalPerCol; i++) {
                var tex = null;
                if (mediaList[i].element) {
                    tex = EP.Media.createTexture(mediaList[i]);
                    tex.needsUpdate = true;
                    tex.minFilter = THREE.LinearFilter;
                }

                var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cardW, cardH, 0.05) : new THREE.PlaneGeometry(cardW, cardH);
                var mat = new THREE.MeshPhongMaterial({
                    map: tex,
                    transparent: true,
                    shininess: 30,
                    specular: 0x222222
                });

                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.y = -i * (cardH + gap);
                mesh.userData = {
                    isCard: true,
                    cardIndex: i,
                    baseY: mesh.position.y,
                    colIndex: col
                };
                colGroup.add(mesh);
            }

            group.add(colGroup);
        }

        this._totalHeight = totalPerCol * (cardH + gap);
        this._cardH = cardH;
        this._gap = gap;

        var light1 = new THREE.PointLight(0xffffff, 0.9, 15);
        light1.position.set(2, 3, 6);
        light1.userData = { isLight: true };
        group.add(light1);

        var ambient = new THREE.AmbientLight(0x444455, 0.6);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.scrollSpeed / 100;
        var depthEffect = this.settings.depthEffect / 100;
        var totalH = this._totalHeight;

        for (var c = 0; c < this.group.children.length; c++) {
            var colGroup = this.group.children[c];
            if (!colGroup.userData.isColumn) continue;

            var direction = colGroup.userData.colIndex % 2 === 0 ? 1 : -1;
            var scrollOffset = time * speed * 1.5 * direction;

            for (var i = 0; i < colGroup.children.length; i++) {
                var card = colGroup.children[i];
                if (!card.userData.isCard) continue;

                var y = card.userData.baseY + scrollOffset;
                y = ((y % totalH) + totalH) % totalH;
                if (y > totalH * 0.5) y -= totalH;
                card.position.y = y;

                var distFromCenter = Math.abs(y) / (totalH * 0.3);
                card.position.z = -distFromCenter * depthEffect * 2;

                var scale = Math.max(0.6, 1.0 - distFromCenter * 0.2);
                card.scale.set(scale, scale, 1);
                card.material.opacity = Math.max(0.1, 1.0 - distFromCenter * 0.5);

                if (card.material.map) card.material.map.needsUpdate = true;
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.15) * 0.3,
            Math.cos(time * 0.1) * 0.2,
            6
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this.group) {
            for (var c = 0; c < this.group.children.length; c++) {
                var col = this.group.children[c];
                if (!col.children) continue;
                for (var i = 0; i < col.children.length; i++) {
                    var m = col.children[i];
                    if (m.material && m.material.map) m.material.map.dispose();
                }
            }
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
