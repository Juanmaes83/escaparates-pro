(function() {
    var effect = new EP.EffectBase('hyper-zoom', {
        name: 'Hyper Zoom',
        category: '3d-perspective',
        icon: '🚀',
        description: 'Zoom inmersivo hiperespacial — las imagenes se acercan a alta velocidad desde la profundidad con estrellas de fondo'
    }, [
        { key: 'cardCount', type: 'range', min: 15, max: 50, default: 25, step: 1, label: 'Photos' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 45, label: 'Zoom Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 100, default: 50, label: 'Photo Size', unit: '%' },
        { key: 'starCount', type: 'range', min: 50, max: 500, default: 200, step: 10, label: 'Stars' },
        { key: 'tunnelWidth', type: 'range', min: 20, max: 100, default: 60, label: 'Tunnel Width', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#020208', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.cardCount;
        var cardScale = 0.8 + 1.6 * this.settings.cardSize / 100;
        var spread = 2 + 6 * this.settings.tunnelWidth / 100;
        var depth = 80;
        var cw = cardScale * 1.5;
        var ch = cardScale;

        this._cards = [];

        for (var i = 0; i < count; i++) {
            var mi = i % mediaList.length;
            var tex = null;
            if (mediaList[mi].element) {
                tex = new THREE.Texture(mediaList[mi].element);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.04) : new THREE.PlaneGeometry(cw, ch);
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
            var mesh = new THREE.Mesh(geo, mat);

            mesh.position.set(
                (Math.random() - 0.5) * spread * 2,
                (Math.random() - 0.5) * spread * 1.5,
                -(Math.random() * depth)
            );
            mesh.userData = { isCard: true, origX: mesh.position.x, origY: mesh.position.y };
            group.add(mesh);
            this._cards.push(mesh);
        }

        var starCount = this.settings.starCount;
        var starPositions = new Float32Array(starCount * 3);
        for (var s = 0; s < starCount; s++) {
            starPositions[s * 3] = (Math.random() - 0.5) * spread * 4;
            starPositions[s * 3 + 1] = (Math.random() - 0.5) * spread * 3;
            starPositions[s * 3 + 2] = -(Math.random() * depth);
        }
        var starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        var starMat = new THREE.PointsMaterial({ color: 0xaaccff, size: 0.08, transparent: true, opacity: 0.7, sizeAttenuation: true });
        var stars = new THREE.Points(starGeo, starMat);
        stars.userData = { isStars: true };
        group.add(stars);

        this._depth = depth;
        this._spread = spread;
        this._origFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._cards) return;
        var speed = this.settings.speed / 100;
        var depth = this._depth;

        if (EP.Core.camera.fov !== 75) {
            EP.Core.camera.fov = 75;
            EP.Core.camera.updateProjectionMatrix();
        }

        var travel = speed * dt * 12;

        for (var i = 0; i < this._cards.length; i++) {
            var card = this._cards[i];
            card.position.z += travel;

            if (card.position.z > 5) {
                card.position.z = -depth + Math.random() * 5;
                card.position.x = (Math.random() - 0.5) * this._spread * 2;
                card.position.y = (Math.random() - 0.5) * this._spread * 1.5;
            }

            var dist = -card.position.z;
            var fade = Math.min(1, dist / 10);
            card.material.opacity = fade * 0.9;

            var scale = 1 + (5 - card.position.z) * 0.005;
            scale = Math.max(0.3, Math.min(2, scale));
            card.scale.set(scale, scale, 1);

            if (card.material.map) card.material.map.needsUpdate = true;
        }

        for (var j = 0; j < this.group.children.length; j++) {
            var child = this.group.children[j];
            if (child.userData.isStars) {
                var pos = child.geometry.attributes.position.array;
                for (var k = 0; k < pos.length / 3; k++) {
                    pos[k * 3 + 2] += travel * 0.5;
                    if (pos[k * 3 + 2] > 5) {
                        pos[k * 3 + 2] = -depth;
                        pos[k * 3] = (Math.random() - 0.5) * this._spread * 4;
                        pos[k * 3 + 1] = (Math.random() - 0.5) * this._spread * 3;
                    }
                }
                child.geometry.attributes.position.needsUpdate = true;
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.1) * 0.3,
            Math.cos(time * 0.08) * 0.2,
            3
        );
        EP.Core.camera.lookAt(0, 0, -20);
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
