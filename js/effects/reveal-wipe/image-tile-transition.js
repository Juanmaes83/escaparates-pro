(function() {
    var effect = new EP.EffectBase('image-tile-transition', {
        name: '3D Image Tile Transition',
        category: 'reveal-wipe',
        icon: 'IT',
        description: 'Transicion 3D por mosaico de imagenes inspirada en navegacion con rueda'
    }, [
        { key: 'tileSize', type: 'range', min: 6, max: 28, default: 12, step: 1, label: 'Tile Size' },
        { key: 'depth', type: 'range', min: 20, max: 220, default: 90, step: 1, label: 'Depth', unit: '%' },
        { key: 'motion', type: 'range', min: 20, max: 220, default: 100, step: 1, label: 'Motion', unit: '%' },
        { key: 'exposure', type: 'range', min: 20, max: 90, default: 48, step: 1, label: 'Exposure', unit: '%' },
        { key: 'tilt', type: 'range', min: 0, max: 100, default: 35, step: 1, label: 'Mouse Tilt', unit: '%' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var cols = Math.max(4, Math.floor(96 / this.settings.tileSize));
        var rows = Math.max(3, Math.floor(cols * 9 / 16));
        var totalW = 7.2, totalH = 4.05;
        var tw = totalW / cols, th = totalH / rows;
        var texA = EP.Media.createTexture(mediaList[0]);
        var texB = EP.Media.createTexture(mediaList[Math.min(1, mediaList.length - 1)]);
        texA.needsUpdate = true; texB.needsUpdate = true;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var mat = new THREE.ShaderMaterial({
                    uniforms: {
                        mapA: { value: texA },
                        mapB: { value: texB },
                        uProgress: { value: 0 },
                        uUvMin: { value: new THREE.Vector2(x / cols, y / rows) },
                        uUvMax: { value: new THREE.Vector2((x + 1) / cols, (y + 1) / rows) }
                    },
                    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
                    fragmentShader: 'uniform sampler2D mapA;uniform sampler2D mapB;uniform float uProgress;uniform vec2 uUvMin;uniform vec2 uUvMax;varying vec2 vUv;void main(){vec2 uv=mix(uUvMin,uUvMax,vUv);vec4 a=texture2D(mapA,uv);vec4 b=texture2D(mapB,uv);gl_FragColor=mix(a,b,uProgress);}',
                    transparent: true,
                    side: THREE.DoubleSide
                });
                var mesh = new THREE.Mesh(new THREE.PlaneGeometry(tw * 1.01, th * 1.01), mat);
                mesh.position.set(-totalW / 2 + tw / 2 + x * tw, totalH / 2 - th / 2 - y * th, 0);
                mesh.userData = { isTile: true, x: x, y: y, cols: cols, rows: rows, seed: Math.random() };
                group.add(mesh);
            }
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var progress = ((time / loopDuration) * this.settings.motion / 100) % 1;
        var eased = progress * progress * (3 - 2 * progress);
        var depth = this.settings.depth / 100;
        this.group.rotation.x = Math.sin(time * 0.25) * 0.12 * this.settings.tilt / 100;
        this.group.rotation.y = Math.cos(time * 0.2) * 0.16 * this.settings.tilt / 100;
        this.group.children.forEach(function(tile) {
            var wave = (tile.userData.x / tile.userData.cols + tile.userData.y / tile.userData.rows) * 0.5;
            var local = Math.max(0, Math.min(1, (eased - wave * 0.55) / 0.45));
            tile.material.uniforms.uProgress.value = local;
            tile.rotation.x = local * Math.PI * 0.75;
            tile.position.z = Math.sin(local * Math.PI) * 1.6 * depth;
            if (tile.material.uniforms.mapA.value.isVideoTexture) tile.material.uniforms.mapA.value.needsUpdate = true;
            if (tile.material.uniforms.mapB.value.isVideoTexture) tile.material.uniforms.mapB.value.needsUpdate = true;
        });
    };

    EP.Registry.register(effect);
})();
