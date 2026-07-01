(function() {
    var effect = new EP.EffectBase('fan-carousel', {
        name: 'Fan Carousel',
        category: '3d-perspective',
        icon: '🪭',
        description: 'Carousel tipo abanico — las imagenes se despliegan y pliegan como un abanico con transiciones fluidas'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardCount', type: 'range', min: 5, max: 20, default: 10, step: 1, label: 'Cards' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 25, label: 'Fan Speed', unit: '%' },
        { key: 'fanSpread', type: 'range', min: 20, max: 100, default: 60, label: 'Fan Spread', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 55, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a1a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.cardCount;
        var cardScale = 1 + 2.5 * this.settings.cardSize / 100;
        var spread = 0.3 + 1.2 * this.settings.fanSpread / 100;
        var cw = cardScale * 1.2;
        var ch = cardScale * 1.6;

        var fanGroup = new THREE.Group();
        fanGroup.userData = { isFan: true };

        var pivotY = -ch * 0.55;

        for (var i = 0; i < count; i++) {
            var mi = i % mediaList.length;
            var tex = null;
            if (mediaList[mi].element) {
                tex = EP.Media.createTexture(mediaList[mi]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.05) : new THREE.PlaneGeometry(cw, ch);
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
            var mesh = new THREE.Mesh(geo, mat);

            var pivot = new THREE.Group();
            pivot.position.y = pivotY;
            mesh.position.y = ch / 2 - pivotY;
            mesh.position.z = -i * 0.02;
            pivot.add(mesh);

            pivot.userData = { isPivot: true, cardIndex: i, baseAngle: 0 };
            fanGroup.add(pivot);
        }

        group.add(fanGroup);

        this._count = count;
        this._spread = spread;
        this._ch = ch;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;
        var spread = this._spread;
        var count = this._count;

        var fanGroup = null;
        for (var i = 0; i < this.group.children.length; i++) {
            if (this.group.children[i].userData.isFan) { fanGroup = this.group.children[i]; break; }
        }
        if (!fanGroup) return;

        var cycle = time * speed * 0.15;
        var fanOpenAmount = 0.5 + 0.5 * Math.sin(cycle);
        var totalAngle = spread * fanOpenAmount * Math.PI;
        var halfAngle = totalAngle / 2;

        for (var j = 0; j < fanGroup.children.length; j++) {
            var pivot = fanGroup.children[j];
            if (!pivot.userData.isPivot) continue;
            var idx = pivot.userData.cardIndex;
            var frac = count > 1 ? idx / (count - 1) : 0.5;
            var targetAngle = -halfAngle + frac * totalAngle;

            pivot.rotation.z += (targetAngle - pivot.rotation.z) * Math.min(dt * 4, 1);

            var card = pivot.children[0];
            if (card && card.material && card.material.map) {
                card.material.map.needsUpdate = true;
            }
        }

        var camDist = 5 + this._ch;
        EP.Core.camera.position.set(
            Math.sin(time * 0.06) * 0.8,
            1 + Math.sin(time * 0.08) * 0.3,
            camDist
        );
        EP.Core.camera.lookAt(0, 0.5, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
