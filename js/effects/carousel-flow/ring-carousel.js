(function() {
    var effect = new EP.EffectBase('ring-carousel', {
        name: 'Ring Carousel 3D',
        category: 'carousel-flow',
        icon: '💍',
        description: 'Anillo 3D de tarjetas girando — las imagenes flotan en un circulo tridimensional con perspectiva y rotacion continua'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 10, max: 100, default: 50, label: 'Card Size', unit: '%' },
        { key: 'ringRadius', type: 'range', min: 20, max: 100, default: 60, label: 'Ring Radius', unit: '%' },
        { key: 'tilt', type: 'range', min: 0, max: 45, default: 15, label: 'Tilt', unit: '°' },
        { key: 'cardGap', type: 'range', min: 0, max: 50, default: 10, label: 'Card Gap', unit: '%' },
        { key: 'roundness', type: 'range', min: 0, max: 50, default: 8, label: 'Roundness', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#1a1a2e', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var radius = 4 * this.settings.ringRadius / 100;
        var cardW = 2.5 * this.settings.cardSize / 100;
        var cardH = cardW * 1.4;
        var roundPct = this.settings.roundness / 100;

        for (var i = 0; i < count; i++) {
            var geo = EP.RoundedPlaneGeometry
                ? new EP.RoundedPlaneGeometry(cardW, cardH, roundPct * cardW * 0.5, 8)
                : new THREE.PlaneGeometry(cardW, cardH);

            var mat;
            if (mediaList[i].element) {
                mat = EP.Media.createMaterial(mediaList[i], { side: THREE.DoubleSide });
            } else {
                mat = new THREE.MeshBasicMaterial({ color: 0x444466, side: THREE.DoubleSide });
            }

            var mesh = new THREE.Mesh(geo, mat);
            var angle = (i / count) * Math.PI * 2;
            mesh.position.set(
                Math.sin(angle) * radius,
                0,
                Math.cos(angle) * radius
            );
            mesh.rotation.y = angle + Math.PI;
            mesh.userData = { imageIndex: i, baseAngle: angle };
            group.add(mesh);
        }

        var tiltRad = this.settings.tilt * Math.PI / 180;
        group.rotation.x = tiltRad;

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var rotSpeed = Math.PI * 2;
        this.group.rotation.y = t * rotSpeed;

        var tiltRad = this.settings.tilt * Math.PI / 180;
        this.group.rotation.x = tiltRad;

        var radius = 4 * this.settings.ringRadius / 100;
        var cardW = 2.5 * this.settings.cardSize / 100;
        var cardH = cardW * 1.4;
        var count = this.group.children.length;

        for (var i = 0; i < count; i++) {
            var mesh = this.group.children[i];
            if (mesh.userData.imageIndex === undefined) continue;
            var angle = (i / count) * Math.PI * 2;
            mesh.position.set(
                Math.sin(angle) * radius,
                0,
                Math.cos(angle) * radius
            );
            mesh.rotation.y = angle + Math.PI;
            mesh.scale.set(1, 1, 1);
        }

        EP.Core.camera.position.set(0, 1, 6);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
