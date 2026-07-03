(function() {
    var effect = new EP.EffectBase('confetti-3d', {
        name: 'Confetti 3D',
        category: 'gravity',
        icon: '🎊',
        description: 'Piezas de confeti cayendo en 3D — celebración con drift lateral y rotación libre'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'count', type: 'range', min: 50, max: 400, default: 180, step: 10, label: 'Cantidad confeti' },
        { key: 'fallSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad caída' },
        { key: 'drift', type: 'range', min: 0, max: 30, default: 10, step: 1, label: 'Deriva lateral' },
        { key: 'spread', type: 'range', min: 2, max: 16, default: 9, step: 1, label: 'Dispersión' },
        { key: 'size', type: 'range', min: 2, max: 20, default: 7, step: 1, label: 'Tamaño pieza' }
    ]);

    var COLORS = [0xff3355, 0x33dd66, 0x3366ff, 0xffdd00, 0xff33cc, 0x00ddff, 0xff8800, 0x88ff00];

    function sr(s) { var r = (Math.sin(s + 1) * 43758.5453) % 1; return r < 0 ? r + 1 : r; }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var n = Math.round(this.settings.count);
        var sz = this.settings.size * 0.04;
        var spread = this.settings.spread;

        this._pieces = [];
        for (var i = 0; i < n; i++) {
            var color = COLORS[Math.floor(sr(i * 7) * COLORS.length)];
            var geo = new THREE.PlaneGeometry(sz, sz * 0.5);
            var mat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.92, depthWrite: false });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                (sr(i * 3) - 0.5) * spread,
                (sr(i * 5)) * 10 - 5,
                (sr(i * 11) - 0.5) * 3
            );
            mesh.rotation.set(sr(i * 2) * Math.PI * 2, sr(i * 4) * Math.PI * 2, sr(i * 6) * Math.PI * 2);
            group.add(mesh);
            this._pieces.push({
                mesh: mesh,
                vy: -(0.4 + sr(i * 17) * 1.2),
                rx: (sr(i * 19) - 0.5) * 3,
                ry: (sr(i * 23) - 0.5) * 2,
                rz: (sr(i * 29) - 0.5) * 4,
                driftFreq: 0.4 + sr(i * 31) * 1.8,
                spread: spread
            });
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._pieces) return;
        var spd = this.settings.fallSpeed * 0.012;
        var driftAmt = this.settings.drift * 0.008;

        for (var i = 0; i < this._pieces.length; i++) {
            var p = this._pieces[i];
            p.mesh.position.y += p.vy * spd;
            p.mesh.position.x += Math.sin(time * p.driftFreq + i * 0.7) * driftAmt;
            p.mesh.rotation.x += p.rx * spd * 0.08;
            p.mesh.rotation.y += p.ry * spd * 0.08;
            p.mesh.rotation.z += p.rz * spd * 0.08;
            if (p.mesh.position.y < -5.5) {
                p.mesh.position.y = 5.5;
                p.mesh.position.x = (Math.random() - 0.5) * p.spread;
            }
        }
    };

    effect.dispose = function() { EP.EffectBase.prototype.dispose.call(this); this._pieces = null; };

    EP.Registry.register(effect);
})();
