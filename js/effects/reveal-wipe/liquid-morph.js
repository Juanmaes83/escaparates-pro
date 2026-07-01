(function() {
    var effect = new EP.EffectBase('liquid-morph', {
        name: 'Liquid Morph',
        category: 'reveal-wipe',
        icon: '💧',
        description: 'Transicion liquida con distorsion Perlin entre imagenes'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 40, max: 90, default: 70, label: 'Card Size', unit: '%' },
        { key: 'distortion', type: 'range', min: 10, max: 100, default: 60, label: 'Distortion', unit: '%' },
        { key: 'waveScale', type: 'range', min: 1, max: 10, default: 4, step: 0.5, label: 'Wave Scale' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 4, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080810', label: 'Background' }
    ]);

    function noise2d(x, y) {
        var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    function smoothNoise(x, y) {
        var ix = Math.floor(x), iy = Math.floor(y);
        var fx = x - ix, fy = y - iy;
        fx = fx * fx * (3 - 2 * fx);
        fy = fy * fy * (3 - 2 * fy);
        var a = noise2d(ix, iy), b = noise2d(ix + 1, iy);
        var c = noise2d(ix, iy + 1), d = noise2d(ix + 1, iy + 1);
        return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }

    function fbm(x, y) {
        return smoothNoise(x, y) * 0.5 + smoothNoise(x * 2, y * 2) * 0.3 + smoothNoise(x * 4, y * 4) * 0.2;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 6;
        var h = cardScale * 0.6;
        var segs = 40;

        for (var img = 0; img < mediaList.length; img++) {
            var geo = new THREE.PlaneGeometry(cardScale, h, segs, segs);
            var mat = EP.Media.createMaterial(mediaList[img]);
            mat.transparent = true;
            mat.side = THREE.DoubleSide;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = {
                imageIndex: img,
                totalImages: mediaList.length,
                origPositions: new Float32Array(geo.attributes.position.array)
            };
            mesh.visible = false;
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var segDur = 1 / count;
        var dist = this.settings.distortion / 100;
        var wScale = this.settings.waveScale;

        this.group.children.forEach(function(mesh, idx) {
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                mesh.visible = true;
                var localT = (t - segStart) / segDur;
                var transIn = Math.min(1, localT * 3);
                var transOut = localT > 0.7 ? (localT - 0.7) / 0.3 : 0;
                var morphPhase = transIn < 1 ? (1 - transIn) : transOut;
                var morph = morphPhase * dist;

                var pos = mesh.geometry.attributes.position;
                var orig = mesh.userData.origPositions;
                var timeOff = t * 10;

                for (var i = 0; i < pos.count; i++) {
                    var ox = orig[i * 3];
                    var oy = orig[i * 3 + 1];
                    var nx = fbm(ox * wScale * 0.3 + timeOff, oy * wScale * 0.3) * morph * 1.5;
                    var ny = fbm(ox * wScale * 0.3, oy * wScale * 0.3 + timeOff) * morph * 1.5;
                    var nz = fbm(ox * wScale * 0.2 + timeOff * 0.5, oy * wScale * 0.2 + timeOff * 0.5) * morph * 0.8;
                    pos.setXYZ(i, ox + nx, oy + ny, nz);
                }
                pos.needsUpdate = true;

                mesh.material.opacity = 1 - morph * 0.3;
            } else {
                mesh.visible = false;
            }
        });
    };

    EP.Registry.register(effect);
})();
