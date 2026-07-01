(function() {
    var effect = new EP.EffectBase('parallax-wall', {
        name: 'Parallax Wall',
        category: '3d-perspective',
        icon: '🧱',
        description: 'Muro inmersivo de fotos en 5 capas de profundidad con parallax — las capas mas lejanas se mueven mas lento'
    }, [
        { key: 'layers', type: 'range', min: 3, max: 7, default: 5, step: 1, label: 'Depth Layers' },
        { key: 'photosPerLayer', type: 'range', min: 6, max: 16, default: 10, step: 1, label: 'Photos/Layer' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 30, label: 'Scroll Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 50, label: 'Photo Size', unit: '%' },
        { key: 'depthSpread', type: 'range', min: 20, max: 100, default: 60, label: 'Depth Spread', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#111111', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var numLayers = this.settings.layers;
        var perLayer = this.settings.photosPerLayer;
        var cardScale = 0.8 + 1.8 * this.settings.cardSize / 100;
        var depthRange = 2 + 10 * this.settings.depthSpread / 100;

        this._layers = [];
        var imgIdx = 0;

        for (var L = 0; L < numLayers; L++) {
            var layerGroup = new THREE.Group();
            var zPos = -L * (depthRange / numLayers);
            layerGroup.position.z = zPos;

            var layerScale = 1 + L * 0.3;
            var cw = cardScale * 1.4 * layerScale;
            var ch = cardScale * layerScale;
            var gap = 0.3 * layerScale;
            var totalW = perLayer * (cw + gap);
            var ySpread = 2 + L * 1.5;

            for (var p = 0; p < perLayer * 2; p++) {
                var mi = imgIdx % mediaList.length; imgIdx++;
                var tex = null;
                if (mediaList[mi].element) {
                    tex = EP.Media.createTexture(mediaList[mi]);
                    tex.needsUpdate = true;
                    tex.minFilter = THREE.LinearFilter;
                }

                var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.03) : new THREE.PlaneGeometry(cw, ch);
                var opacity = 0.95 - L * 0.08;
                var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: opacity });
                var mesh = new THREE.Mesh(geo, mat);

                mesh.position.x = p * (cw + gap) - totalW;
                mesh.position.y = (Math.random() - 0.5) * ySpread;
                mesh.userData = { isCard: true };
                layerGroup.add(mesh);
            }

            var speedFactor = 1 / (1 + L * 0.6);
            layerGroup.userData = { isLayer: true, layerIndex: L, speedFactor: speedFactor, totalWidth: totalW, cardStride: cw + gap };
            group.add(layerGroup);
            this._layers.push(layerGroup);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._layers) return;
        var speed = this.settings.speed / 100;

        for (var i = 0; i < this._layers.length; i++) {
            var layer = this._layers[i];
            var sf = layer.userData.speedFactor;
            var tw = layer.userData.totalWidth;

            for (var j = 0; j < layer.children.length; j++) {
                var card = layer.children[j];
                card.position.x -= speed * sf * dt * 2.5;

                if (card.position.x < -tw - 2) {
                    card.position.x += tw * 2;
                }

                if (card.material && card.material.map) {
                    card.material.map.needsUpdate = true;
                }
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.05) * 0.8,
            Math.sin(time * 0.03) * 0.4,
            10
        );
        EP.Core.camera.lookAt(0, 0, -3);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
