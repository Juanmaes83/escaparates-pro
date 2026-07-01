(function() {
    var effect = new EP.EffectBase('parallax-wall', {
        name: 'Parallax Wall',
        category: 'parallax',
        icon: '🧱',
        description: 'Muro parallax de 5 capas — las imagenes flotan a distintas profundidades con movimiento cinematografico tipo galeria infinita'
    }, [
        { key: 'layerCount', type: 'range', min: 2, max: 5, default: 4, step: 1, label: 'Layers' },
        { key: 'depthSpread', type: 'range', min: 10, max: 100, default: 50, label: 'Depth Spread', unit: '%' },
        { key: 'scrollSpeed', type: 'range', min: 10, max: 100, default: 40, label: 'Scroll Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 100, default: 55, label: 'Card Size', unit: '%' },
        { key: 'imagesPerLayer', type: 'range', min: 2, max: 6, default: 3, step: 1, label: 'Per Layer' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a14', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var layers = this.settings.layerCount;
        var depthSpread = this.settings.depthSpread / 100;
        var cardScale = 0.8 + 2.0 * this.settings.cardSize / 100;
        var perLayer = this.settings.imagesPerLayer;

        var imgIdx = 0;
        for (var layer = 0; layer < layers; layer++) {
            var layerGroup = new THREE.Group();
            var z = -layer * 3 * depthSpread;
            layerGroup.position.z = z;
            layerGroup.userData = { isLayer: true, layerIndex: layer, layerZ: z };

            var layerScale = 1.0 + layer * 0.3 * depthSpread;
            var spreadX = 5 * layerScale;
            var spreadY = 3 * layerScale;

            for (var c = 0; c < perLayer; c++) {
                var mi = imgIdx % mediaList.length;
                imgIdx++;

                var tex = null;
                if (mediaList[mi].element) {
                    tex = EP.Media.createTexture(mediaList[mi]);
                    tex.needsUpdate = true;
                    tex.minFilter = THREE.LinearFilter;
                }

                var cw = cardScale * (0.8 + Math.random() * 0.4);
                var ch = cw * (0.7 + Math.random() * 0.3);
                var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.06) : new THREE.PlaneGeometry(cw, ch);

                var opacity = 1.0 - layer * 0.15;
                var mat = new THREE.MeshPhongMaterial({
                    map: tex,
                    transparent: true,
                    opacity: opacity,
                    shininess: 20,
                    specular: 0x222222
                });

                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    (Math.random() - 0.5) * spreadX * 2,
                    (Math.random() - 0.5) * spreadY * 2,
                    Math.random() * 0.5
                );
                mesh.userData = {
                    cardIndex: c,
                    baseX: mesh.position.x,
                    baseY: mesh.position.y,
                    scrollMult: 1.0 - layer * 0.2
                };
                layerGroup.add(mesh);
            }

            group.add(layerGroup);
        }

        var light1 = new THREE.PointLight(0xffffff, 1.0, 25);
        light1.position.set(3, 4, 8);
        light1.userData = { isLight: true };
        group.add(light1);

        var light2 = new THREE.PointLight(0x6677cc, 0.5, 18);
        light2.position.set(-4, -2, 5);
        light2.userData = { isLight: true };
        group.add(light2);

        var ambient = new THREE.AmbientLight(0x333344, 0.5);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var scrollSpeed = this.settings.scrollSpeed / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var layerGroup = this.group.children[i];
            if (!layerGroup.userData.isLayer) continue;

            var scrollMult = 1.0 - layerGroup.userData.layerIndex * 0.25;
            var scrollX = time * scrollSpeed * scrollMult;

            for (var j = 0; j < layerGroup.children.length; j++) {
                var card = layerGroup.children[j];
                var cd = card.userData;

                var wrapRange = 12;
                var newX = cd.baseX - scrollX;
                newX = ((newX % wrapRange) + wrapRange) % wrapRange - wrapRange / 2;
                card.position.x = newX;

                card.position.y = cd.baseY + Math.sin(time * 0.5 + cd.cardIndex * 1.5) * 0.1;

                if (card.material.map) card.material.map.needsUpdate = true;
            }
        }

        var t = time / loopDuration;
        EP.Core.camera.position.set(
            Math.sin(time * 0.15) * 0.5,
            Math.cos(time * 0.1) * 0.3,
            8
        );
        EP.Core.camera.lookAt(0, 0, -2);
    };

    effect.dispose = function() {
        if (this.group) {
            for (var i = 0; i < this.group.children.length; i++) {
                var lg = this.group.children[i];
                if (!lg.children) continue;
                for (var j = 0; j < lg.children.length; j++) {
                    var m = lg.children[j];
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
