(function() {
    var effect = new EP.EffectBase('immersive-layers-pro', {
        name: 'Immersive Layers Pro',
        category: '3d-perspective',
        icon: 'IL',
        description: 'Tunel de capas inmersivas con profundidad, estela opcional y particulas suaves'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'layerSize', type: 'range', min: 70, max: 160, default: 118, step: 1, label: 'Layer Size', unit: '%' },
        { key: 'layers', type: 'range', min: 4, max: 18, default: 9, step: 1, label: 'Layers' },
        { key: 'speed', type: 'range', min: 0, max: 220, default: 80, step: 1, label: 'Depth Speed', unit: '%' },
        { key: 'depth', type: 'range', min: 120, max: 900, default: 420, step: 10, label: 'Depth' },
        { key: 'baseOpacity', type: 'range', min: 15, max: 100, default: 72, step: 1, label: 'Base Opacity', unit: '%' },
        { key: 'particles', type: 'range', min: 0, max: 1200, default: 420, step: 20, label: 'Particles' },
        { key: 'trail', type: 'select', options: [{ v: 'off', l: 'Natural' }, { v: 'on', l: 'Trail optional' }], default: 'off', label: 'Motion Trail' },
        { key: 'background', type: 'color', default: '#050508', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var size = this.settings.layerSize / 100 * 6.2;
        var depth = this.settings.depth / 100;
        var layerCount = Math.floor(this.settings.layers);
        var geo = EP.RoundedPlaneGeometry(size, size * 0.72, size * 0.025);
        for (var i = 0; i < layerCount; i++) {
            var media = mediaList[i % mediaList.length];
            var mat = EP.Media.createMaterial(media);
            mat.opacity = this.settings.baseOpacity / 100 * (1 - i / (layerCount * 1.45));
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = -i * depth;
            mesh.scale.setScalar(1 + i * 0.065);
            mesh.userData = { isLayer: true, lane: i, startZ: -i * depth };
            group.add(mesh);
        }
        var pCount = Math.floor(this.settings.particles);
        if (pCount > 0) {
            var pGeo = new THREE.BufferGeometry();
            var pos = new Float32Array(pCount * 3);
            var col = new Float32Array(pCount * 3);
            for (var p = 0; p < pCount; p++) {
                pos[p * 3] = (Math.random() - 0.5) * size * 1.5;
                pos[p * 3 + 1] = (Math.random() - 0.5) * size;
                pos[p * 3 + 2] = -Math.random() * depth * layerCount;
                col[p * 3] = 0.75 + Math.random() * 0.25;
                col[p * 3 + 1] = 0.75 + Math.random() * 0.25;
                col[p * 3 + 2] = 0.9 + Math.random() * 0.1;
            }
            pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            var points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true, opacity: 0.68 }));
            points.userData = { isParticles: true, depth: depth * layerCount };
            group.add(points);
        }
        this.group = group;
        EP.Core.setPostProcessing({ bloomEnabled: false, vignetteEnabled: this.settings.trail === 'on' });
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;
        var depth = this.settings.depth / 100;
        var totalDepth = depth * Math.max(1, this.settings.layers);
        this.group.children.forEach(function(child) {
            if (child.userData.isLayer) {
                var z = child.userData.startZ + (time * 18 * speed) % totalDepth;
                if (z > 5) z -= totalDepth;
                child.position.z = z;
                var near = 1 - Math.min(1, Math.abs(z) / totalDepth);
                child.material.opacity = (effect.settings.baseOpacity / 100) * (0.25 + near * 0.85);
                if (child.material.map && child.material.map.isVideoTexture) child.material.map.needsUpdate = true;
            } else if (child.userData.isParticles) {
                var arr = child.geometry.attributes.position.array;
                for (var i = 0; i < arr.length; i += 3) {
                    arr[i + 2] += 0.12 * speed;
                    if (arr[i + 2] > 5) arr[i + 2] -= child.userData.depth;
                }
                child.geometry.attributes.position.needsUpdate = true;
            }
        });
    };

    effect.dispose = function() {
        EP.Core.setPostProcessing({ bloomEnabled: false, vignetteEnabled: false });
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
