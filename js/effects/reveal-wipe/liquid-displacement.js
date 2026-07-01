(function() {
    var effect = new EP.EffectBase('liquid-displacement', {
        name: 'Liquid Displacement',
        category: 'reveal-wipe',
        icon: '💧',
        description: 'Deformacion liquida con ondas radiales y transicion fluida entre imagenes'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 40, max: 90, default: 72, label: 'Card Size', unit: '%' },
        { key: 'waveStrength', type: 'range', min: 10, max: 100, default: 60, label: 'Wave Force', unit: '%' },
        { key: 'waveFreq', type: 'range', min: 2, max: 20, default: 8, step: 1, label: 'Wave Freq' },
        { key: 'rippleSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Ripple Speed', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 4, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#060612', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 5;
        var h = cardScale * 0.65;
        var segsX = 60, segsY = 40;

        for (var i = 0; i < mediaList.length; i++) {
            var geo = new THREE.PlaneGeometry(cardScale, h, segsX, segsY);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            mat.side = THREE.DoubleSide;
            var mesh = new THREE.Mesh(geo, mat);

            var origPos = new Float32Array(geo.attributes.position.array.length);
            origPos.set(geo.attributes.position.array);
            mesh.userData = {
                imageIndex: i,
                origPos: origPos,
                w: cardScale,
                h: h
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
        var strength = this.settings.waveStrength / 100 * 0.8;
        var freq = this.settings.waveFreq;
        var rSpeed = this.settings.rippleSpeed / 100;

        for (var idx = 0; idx < count; idx++) {
            var mesh = this.group.children[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                mesh.visible = true;
                var lt = (t - segStart) / segDur;
                var d = mesh.userData;
                var pos = mesh.geometry.attributes.position.array;
                var orig = d.origPos;

                var enterT = Math.min(1, lt / 0.2);
                var exitT = lt > 0.8 ? (lt - 0.8) / 0.2 : 0;
                var transitionWave = Math.sin(enterT * Math.PI) * (1 - exitT);

                var rippleTime = t * Math.PI * 8 * rSpeed;

                for (var v = 0; v < pos.length; v += 3) {
                    var ox = orig[v];
                    var oy = orig[v + 1];

                    var nx = (ox + d.w / 2) / d.w;
                    var ny = (oy + d.h / 2) / d.h;

                    var cx = nx - 0.5;
                    var cy = ny - 0.5;
                    var dist = Math.sqrt(cx * cx + cy * cy);

                    var wave1 = Math.sin(dist * freq * Math.PI - rippleTime) * strength * transitionWave;
                    var wave2 = Math.sin(nx * freq * 1.5 + rippleTime * 0.7) * strength * 0.3 * transitionWave;
                    var wave3 = Math.cos(ny * freq * 1.3 - rippleTime * 0.5) * strength * 0.2 * transitionWave;

                    pos[v] = ox + Math.sin(dist * freq * 2 - rippleTime) * strength * 0.15 * transitionWave;
                    pos[v + 1] = oy + Math.cos(dist * freq * 2 - rippleTime * 1.2) * strength * 0.1 * transitionWave;
                    pos[v + 2] = wave1 + wave2 + wave3;
                }
                mesh.geometry.attributes.position.needsUpdate = true;

                mesh.material.opacity = Math.min(1, enterT * 3) * Math.max(0, 1 - exitT * 2);

                mesh.rotation.y = Math.sin(lt * Math.PI) * 0.05;
                mesh.rotation.x = Math.cos(lt * Math.PI * 1.5) * 0.03;
            } else {
                mesh.visible = false;
            }
        }
    };

    EP.Registry.register(effect);
})();
