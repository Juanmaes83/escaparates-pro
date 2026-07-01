(function() {
    var effect = new EP.EffectBase('floating-cloud', {
        name: 'Floating Cloud',
        category: 'motion',
        icon: '☁️',
        description: 'Tarjetas flotando en gravedad cero con movimiento organico'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 15, max: 50, default: 30, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 4, max: 20, default: 10, step: 1, label: 'Cards' },
        { key: 'spread', type: 'range', min: 2, max: 8, default: 4.5, step: 0.5, label: 'Spread' },
        { key: 'floatSpeed', type: 'range', min: 10, max: 100, default: 40, label: 'Float Speed', unit: '%' },
        { key: 'rotationAmount', type: 'range', min: 0, max: 100, default: 30, label: 'Rotation', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 10, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a14', label: 'Background' }
    ]);

    function noise(x, y, z) {
        var n = Math.sin(x * 12.9898 + y * 78.233 + z * 45.164) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    function smoothNoise(x, y, z) {
        return (Math.sin(x * 1.3 + z * 0.7) * 0.4 +
                Math.sin(y * 0.9 + z * 1.1) * 0.3 +
                Math.sin((x + y) * 0.8 + z * 0.5) * 0.3);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.count;
        var cardScale = this.settings.cardSize / 100 * 3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.5;
        var spread = this.settings.spread;
        var geo = EP.RoundedPlaneGeometry(cardScale, cardScale * 1.2, cr);

        for (var i = 0; i < count; i++) {
            var phi = Math.acos(1 - 2 * (i + 0.5) / count);
            var theta = Math.PI * (1 + Math.sqrt(5)) * i;
            var x = Math.sin(phi) * Math.cos(theta) * spread;
            var y = Math.sin(phi) * Math.sin(theta) * spread * 0.6;
            var z = Math.cos(phi) * spread * 0.5;

            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.transparent = true;
            mat.opacity = 0.88;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);

            mesh.userData = {
                baseX: x, baseY: y, baseZ: z,
                seed: i * 7.31,
                phaseX: Math.random() * Math.PI * 2,
                phaseY: Math.random() * Math.PI * 2,
                phaseZ: Math.random() * Math.PI * 2,
                freqX: 0.5 + Math.random() * 0.5,
                freqY: 0.7 + Math.random() * 0.4,
                freqZ: 0.3 + Math.random() * 0.6
            };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speed = this.settings.floatSpeed / 100;
        var rotAmt = this.settings.rotationAmount / 100;
        var tau = t * Math.PI * 2;

        this.group.rotation.y = t * Math.PI * 0.5 * speed;

        this.group.children.forEach(function(child) {
            var d = child.userData;
            var st = tau * speed;

            var dx = smoothNoise(d.seed, 0, st * d.freqX + d.phaseX) * 0.8;
            var dy = smoothNoise(0, d.seed, st * d.freqY + d.phaseY) * 0.6;
            var dz = smoothNoise(d.seed, d.seed, st * d.freqZ + d.phaseZ) * 0.4;

            child.position.x = d.baseX + dx;
            child.position.y = d.baseY + dy;
            child.position.z = d.baseZ + dz;

            child.rotation.x = Math.sin(st * 0.7 + d.phaseX) * 0.15 * rotAmt;
            child.rotation.y = Math.sin(st * 0.5 + d.phaseY) * 0.2 * rotAmt;
            child.rotation.z = Math.sin(st * 0.3 + d.phaseZ) * 0.1 * rotAmt;

            var breathe = 0.95 + Math.sin(st * 0.4 + d.seed) * 0.05;
            child.scale.setScalar(breathe);
        });
    };

    EP.Registry.register(effect);
})();
