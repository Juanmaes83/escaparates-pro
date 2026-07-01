(function() {
    var effect = new EP.EffectBase('cylindrix', {
        name: 'Cylindrix Belt',
        category: '3d-perspective',
        icon: '🎞️',
        description: 'Cinta infinita cilindrica — las imagenes se deforman sobre un cilindro virtual con scroll continuo tipo pelicula'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'radius', type: 'range', min: 20, max: 100, default: 50, label: 'Cylinder Radius', unit: '%' },
        { key: 'cardCount', type: 'range', min: 4, max: 16, default: 8, step: 1, label: 'Cards' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 35, label: 'Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 60, label: 'Card Size', unit: '%' },
        { key: 'bendAmount', type: 'range', min: 0, max: 100, default: 60, label: 'Bend', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardCount = this.settings.cardCount;
        var R = 2 + 4 * this.settings.radius / 100;
        var cardScale = 1 + 2 * this.settings.cardSize / 100;
        var cw = cardScale * 1.2;
        var ch = cardScale * 0.9;
        var gap = 0.15;
        var totalArc = cardCount * (cw + gap);

        for (var i = 0; i < cardCount; i++) {
            var mi = i % mediaList.length;
            var tex = null;
            if (mediaList[mi].element) {
                tex = EP.Media.createTexture(mediaList[mi]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var segsX = 24;
            var geo = new THREE.PlaneGeometry(cw, ch, segsX, 1);
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true });
            var mesh = new THREE.Mesh(geo, mat);

            var origPos = new Float32Array(geo.attributes.position.array);
            mesh.userData = {
                isCard: true,
                cardIndex: i,
                origPos: origPos,
                cardWidth: cw,
                segsX: segsX
            };
            group.add(mesh);
        }

        this._R = R;
        this._totalArc = totalArc;
        this._cardCount = cardCount;
        this._cw = cw;
        this._gap = gap;
        this._origFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;
        var bendAmount = this.settings.bendAmount / 100;
        var R = this._R;
        var totalArc = this._totalArc;
        var cw = this._cw;
        var gap = this._gap;
        var cardCount = this._cardCount;

        if (EP.Core.camera.fov !== 50) {
            EP.Core.camera.fov = 50;
            EP.Core.camera.updateProjectionMatrix();
        }

        var scroll = (time * speed * 1.5) % totalArc;

        for (var c = 0; c < this.group.children.length; c++) {
            var mesh = this.group.children[c];
            if (!mesh.userData.isCard) continue;

            var idx = mesh.userData.cardIndex;
            var orig = mesh.userData.origPos;
            var segsX = mesh.userData.segsX;

            var beltPos = idx * (cw + gap) - scroll;
            beltPos = ((beltPos % totalArc) + totalArc) % totalArc;
            if (beltPos > totalArc * 0.5) beltPos -= totalArc;

            var arr = mesh.geometry.attributes.position.array;
            var centerTheta = beltPos / R;

            for (var v = 0; v < arr.length; v += 3) {
                var localX = orig[v];
                var localY = orig[v + 1];

                var theta = centerTheta + (localX / R) * bendAmount;
                var x = R * Math.sin(theta);
                var z = -(R * Math.cos(theta) - R);

                arr[v] = x;
                arr[v + 1] = localY;
                arr[v + 2] = z * bendAmount;
            }
            mesh.geometry.attributes.position.needsUpdate = true;

            var centerDist = Math.abs(beltPos);
            mesh.material.opacity = Math.max(0.2, 1.0 - centerDist / (totalArc * 0.4));

            if (mesh.material.map) mesh.material.map.needsUpdate = true;
        }

        EP.Core.camera.position.set(0, 0, R + 3);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this._origFov) {
            EP.Core.camera.fov = this._origFov;
            EP.Core.camera.updateProjectionMatrix();
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
