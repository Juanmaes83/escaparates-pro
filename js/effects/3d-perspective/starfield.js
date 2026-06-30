(function() {
    var effect = new EP.EffectBase('starfield', {
        name: 'Starfield',
        category: '3d-perspective',
        icon: '✨',
        description: 'Campo de estrellas infinito — las imagenes flotan entre particulas estelares como en un viaje por el espacio'
    }, [
        { key: 'starCount', type: 'range', min: 50, max: 500, default: 200, step: 10, label: 'Stars' },
        { key: 'travelSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Speed', unit: '%' },
        { key: 'imageSize', type: 'range', min: 20, max: 100, default: 50, label: 'Image Size', unit: '%' },
        { key: 'depth', type: 'range', min: 20, max: 100, default: 60, label: 'Depth', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000005', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var starCount = this.settings.starCount;
        var depth = 10 + 30 * this.settings.depth / 100;
        var imgSize = 0.5 + 2 * this.settings.imageSize / 100;

        var starGeo = new THREE.BufferGeometry();
        var positions = new Float32Array(starCount * 3);
        var sizes = new Float32Array(starCount);
        for (var s = 0; s < starCount; s++) {
            positions[s * 3] = (Math.random() - 0.5) * 20;
            positions[s * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[s * 3 + 2] = -Math.random() * depth;
            sizes[s] = 0.02 + Math.random() * 0.06;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        var starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.08,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        var stars = new THREE.Points(starGeo, starMat);
        stars.userData = { isStars: true };
        group.add(stars);

        this._starPositions = new Float32Array(positions);
        this._depth = depth;

        for (var img = 0; img < mediaList.length; img++) {
            var tex = null;
            var aspect = 1;
            if (mediaList[img].element) {
                tex = new THREE.Texture(mediaList[img].element);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || 1;
                aspect = ew / eh;
            }
            var w = imgSize * (aspect >= 1 ? 1 : aspect);
            var h = imgSize * (aspect >= 1 ? 1 / aspect : 1);

            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(w, h, 0.04) : new THREE.PlaneGeometry(w, h);
            var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });

            var mesh = new THREE.Mesh(geo, mat);
            var angle = (img / mediaList.length) * Math.PI * 2;
            var r = 2 + Math.random() * 3;
            mesh.position.set(
                Math.cos(angle) * r,
                Math.sin(angle) * r * 0.5,
                -(img / mediaList.length) * depth
            );
            mesh.userData = {
                isImage: true,
                imageIndex: img,
                baseX: mesh.position.x,
                baseY: mesh.position.y,
                baseZ: mesh.position.z,
                floatPhase: Math.random() * Math.PI * 2
            };
            group.add(mesh);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.travelSpeed / 100;
        var depth = this._depth;

        for (var i = 0; i < this.group.children.length; i++) {
            var child = this.group.children[i];

            if (child.userData.isStars) {
                var pos = child.geometry.attributes.position.array;
                var orig = this._starPositions;
                for (var s = 0; s < pos.length; s += 3) {
                    var z = orig[s + 2] + (time * speed * 3) % depth;
                    z = ((z % depth) + depth) % depth - depth;
                    pos[s + 2] = z;
                }
                child.geometry.attributes.position.needsUpdate = true;
            }

            if (child.userData.isImage) {
                var d = child.userData;
                var z = d.baseZ + (time * speed * 3) % depth;
                z = ((z % depth) + depth) % depth - depth;
                child.position.z = z;
                child.position.y = d.baseY + Math.sin(time * 0.5 + d.floatPhase) * 0.2;

                var dist = Math.abs(z);
                child.material.opacity = dist < 1 ? Math.max(0, 1 - (1 - dist)) : Math.max(0.1, 1 - dist / depth);

                if (child.material.map) child.material.map.needsUpdate = true;
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.15) * 0.5,
            Math.cos(time * 0.1) * 0.3,
            2
        );
        EP.Core.camera.lookAt(0, 0, -5);
    };

    effect.dispose = function() {
        if (this.group) {
            for (var i = 0; i < this.group.children.length; i++) {
                var m = this.group.children[i];
                if (m.material && m.material.map) m.material.map.dispose();
            }
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
