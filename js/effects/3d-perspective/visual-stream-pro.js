(function() {
    var effect = new EP.EffectBase('visual-stream-pro', {
        name: 'Visual Stream Pro',
        category: '3d-perspective',
        icon: 'VS',
        description: 'Doble corriente 3D de tarjetas con logo central, escala amplia y ritmo controlado'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 35, max: 130, default: 82, step: 1, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 24, max: 160, default: 72, step: 2, label: 'Cards' },
        { key: 'speed', type: 'range', min: 0, max: 200, default: 70, step: 1, label: 'Motion', unit: '%' },
        { key: 'exposure', type: 'range', min: 8, max: 80, default: 34, step: 1, label: 'Exposure', unit: '%' },
        { key: 'spread', type: 'range', min: 10, max: 120, default: 58, step: 1, label: 'Spread', unit: '%' },
        { key: 'focusScale', type: 'range', min: 40, max: 180, default: 105, step: 1, label: 'Focus Size', unit: '%' },
        { key: 'lighting', type: 'select', options: [{ v: 'natural', l: 'Natural' }, { v: 'cinematic', l: 'Cinematic optional' }], default: 'natural', label: 'Lighting' },
        { key: 'background', type: 'color', default: '#050507', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var total = Math.max(2, Math.floor(this.settings.count));
        var half = Math.floor(total / 2);
        var cardBase = this.settings.cardSize / 100 * 1.55;
        var spread = this.settings.spread / 100;
        var exposure = this.settings.exposure / 100;
        var dim = this.settings.lighting === 'cinematic' ? 0.82 : 1;
        var cr = cardBase * 0.055;
        var geo = EP.RoundedPlaneGeometry(cardBase, cardBase * 1.22, cr);

        function add(side, i, count, media) {
            var mat = EP.Media.createMaterial(media);
            mat.opacity = dim;
            mat.color = new THREE.Color(dim, dim, dim);
            var mesh = new THREE.Mesh(geo, mat);
            var lane = i / count;
            var x = (side === -1 ? -1 : 1) * (lane * 12.5 + 0.35);
            var y = Math.sin(i * 1.73) * 2.8 * spread;
            var z = -Math.abs(x) * 0.08 + Math.cos(i * 0.9) * 0.7;
            mesh.position.set(x, y, z);
            mesh.rotation.z = side * THREE.MathUtils.degToRad(6 + (i % 5) * 1.7);
            mesh.userData = { side: side, lane: lane, seed: i * 13.37, exposure: exposure };
            group.add(mesh);
        }

        for (var l = 0; l < half; l++) add(-1, l, half, mediaList[l % mediaList.length]);
        for (var r = 0; r < total - half; r++) add(1, r, total - half, mediaList[(r + half) % mediaList.length]);

        var logoMedia = mediaList[0];
        var logoMat = EP.Media.createMaterial(logoMedia);
        logoMat.opacity = 0.96;
        var logo = new THREE.Mesh(EP.RoundedPlaneGeometry(cardBase * 1.25, cardBase * 1.25, cardBase * 0.12), logoMat);
        logo.position.z = 1.2;
        logo.userData = { isLogo: true };
        group.add(logo);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var phase = (time / loopDuration) % 1;
        var speed = this.settings.speed / 100;
        var focus = this.settings.focusScale / 100;
        this.group.children.forEach(function(mesh) {
            if (mesh.userData.isLogo) {
                mesh.rotation.z = Math.sin(time * 0.25) * 0.035;
                mesh.scale.setScalar(0.86 + Math.sin(phase * Math.PI * 2) * 0.035);
                return;
            }
            var side = mesh.userData.side;
            var p = (mesh.userData.lane + phase * speed) % 1;
            var dist = Math.abs(p - 0.5) * 2;
            var center = 1 - Math.min(1, dist / Math.max(0.08, mesh.userData.exposure));
            var x = side * ((p - 0.5) * 14.5);
            mesh.position.x = x;
            mesh.position.z = center * 2.2 - Math.abs(x) * 0.08;
            mesh.scale.setScalar((0.54 + center * 0.72) * focus);
            mesh.material.opacity = 0.35 + center * 0.62;
            if (mesh.material.map && mesh.material.map.isVideoTexture) mesh.material.map.needsUpdate = true;
        });
        EP.Core.camera.position.set(Math.sin(time * 0.15) * 0.45, Math.cos(time * 0.12) * 0.18, 11.5);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
