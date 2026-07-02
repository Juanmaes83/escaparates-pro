(function() {
    var effect = new EP.EffectBase('infinite-spiral', {
        name: 'Infinite Spiral',
        category: '3d-perspective',
        icon: '🌀',
        description: 'Espiral infinita 3D de imagenes — las fotos giran en una helice continua que se adentra en profundidad'
    }, [
        { key: 'cardCount', type: 'range', min: 15, max: 60, default: 30, step: 1, label: 'Photos' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 30, label: 'Spiral Speed', unit: '%' },
        { key: 'radius', type: 'range', min: 20, max: 100, default: 55, label: 'Radius', unit: '%' },
        { key: 'pitch', type: 'range', min: 10, max: 100, default: 50, label: 'Pitch', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 50, label: 'Photo Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050510', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.cardCount;
        var R = 2 + 5 * this.settings.radius / 100;
        var pitchVal = 0.3 + 1.2 * this.settings.pitch / 100;
        var cardScale = 0.6 + 1.4 * this.settings.cardSize / 100;
        var cw = cardScale * 1.4;
        var ch = cardScale;

        var spiralGroup = new THREE.Group();
        spiralGroup.userData = { isSpiral: true };

        for (var i = 0; i < count; i++) {
            var mi = i % mediaList.length;
            var tex = null;
            if (mediaList[mi].element) {
                tex = new THREE.Texture(mediaList[mi].element);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.04) : new THREE.PlaneGeometry(cw, ch);
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
            var mesh = new THREE.Mesh(geo, mat);

            var t = i / count;
            var angle = t * Math.PI * 6;
            var z = -t * count * pitchVal;

            mesh.position.set(
                Math.cos(angle) * R,
                Math.sin(angle) * R,
                z
            );
            mesh.lookAt(0, 0, z);

            mesh.userData = { isCard: true, cardIndex: i, baseT: t, baseAngle: angle, baseZ: z };
            spiralGroup.add(mesh);
        }

        group.add(spiralGroup);

        this._R = R;
        this._pitchVal = pitchVal;
        this._count = count;
        this._totalDepth = count * pitchVal;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;
        var totalDepth = this._totalDepth;
        var R = this._R;

        var spiralGroup = null;
        for (var i = 0; i < this.group.children.length; i++) {
            if (this.group.children[i].userData.isSpiral) { spiralGroup = this.group.children[i]; break; }
        }
        if (!spiralGroup) return;

        var travel = time * speed * 2;

        for (var j = 0; j < spiralGroup.children.length; j++) {
            var card = spiralGroup.children[j];
            if (!card.userData.isCard) continue;

            var z = card.userData.baseZ + travel;
            z = ((z % totalDepth) + totalDepth) % totalDepth;
            if (z > totalDepth * 0.5) z -= totalDepth;

            var progress = (z + totalDepth / 2) / totalDepth;
            var angle = card.userData.baseAngle + time * speed * 0.3;

            card.position.set(
                Math.cos(angle) * R,
                Math.sin(angle) * R,
                z
            );
            card.lookAt(0, 0, z);

            var fade = 1 - Math.abs(z) / (totalDepth * 0.5);
            fade = Math.max(0.1, Math.min(1, fade));
            card.material.opacity = fade * 0.92;

            if (card.material.map) card.material.map.needsUpdate = true;
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.08) * 0.5,
            Math.cos(time * 0.06) * 0.3,
            8
        );
        EP.Core.camera.lookAt(0, 0, -5);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
