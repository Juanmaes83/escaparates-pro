(function() {
    var effect = new EP.EffectBase('kaleidoscope', {
        name: 'Kaleidoscope',
        category: '3d-perspective',
        icon: '🔮',
        description: 'Caleidoscopio 3D — la imagen se fragmenta en tiles simetricos que rotan y reflejan creando patrones hipnoticos'
    }, [
        { key: 'segments', type: 'range', min: 3, max: 12, default: 6, step: 1, label: 'Segments' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 30, label: 'Rotation Speed', unit: '%' },
        { key: 'zoom', type: 'range', min: 20, max: 100, default: 50, label: 'Zoom', unit: '%' },
        { key: 'layers', type: 'range', min: 1, max: 4, default: 2, step: 1, label: 'Rings' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050510', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var segs = this.settings.segments;
        var rings = this.settings.layers;
        var zoomScale = 0.5 + 1.5 * this.settings.zoom / 100;

        this._rings = [];
        var imgIdx = 0;

        for (var r = 0; r < rings; r++) {
            var ringGroup = new THREE.Group();
            var ringRadius = 1.5 + r * 2.2;
            var segCount = segs + r * 2;
            var tileW = (2 * Math.PI * ringRadius / segCount) * 0.9 * zoomScale;
            var tileH = 1.8 * zoomScale;

            for (var s = 0; s < segCount; s++) {
                var mi = imgIdx % mediaList.length; imgIdx++;
                var tex = null;
                if (mediaList[mi].element) {
                    tex = EP.Media.createTexture(mediaList[mi]);
                    tex.needsUpdate = true;
                    tex.minFilter = THREE.LinearFilter;
                }

                var geo = new THREE.PlaneGeometry(tileW, tileH);
                var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
                var mesh = new THREE.Mesh(geo, mat);

                var angle = (s / segCount) * Math.PI * 2;
                mesh.position.x = Math.cos(angle) * ringRadius;
                mesh.position.y = Math.sin(angle) * ringRadius;
                mesh.rotation.z = angle + Math.PI / 2;

                if (s % 2 === 1) {
                    mesh.scale.x = -1;
                }

                mesh.userData = { isCard: true, baseAngle: angle, ring: r };
                ringGroup.add(mesh);
            }

            ringGroup.userData = { isRing: true, ringIndex: r };
            group.add(ringGroup);
            this._rings.push(ringGroup);
        }

        var centerMi = imgIdx % mediaList.length;
        var centerTex = null;
        if (mediaList[centerMi].element) {
            centerTex = EP.Media.createTexture(mediaList[centerMi]);
            centerTex.needsUpdate = true;
            centerTex.minFilter = THREE.LinearFilter;
        }
        var centerSize = 2 * zoomScale;
        var centerGeo = new THREE.CircleGeometry(centerSize, segs);
        var centerMat = new THREE.MeshBasicMaterial({ map: centerTex, side: THREE.DoubleSide, transparent: true });
        var centerMesh = new THREE.Mesh(centerGeo, centerMat);
        centerMesh.userData = { isCenter: true };
        group.add(centerMesh);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._rings) return;
        var speed = this.settings.speed / 100;

        for (var i = 0; i < this._rings.length; i++) {
            var ring = this._rings[i];
            var dir = (i % 2 === 0) ? 1 : -1;
            ring.rotation.z = time * speed * 0.15 * dir * (1 + i * 0.3);

            for (var j = 0; j < ring.children.length; j++) {
                var card = ring.children[j];
                if (card.material && card.material.map) {
                    card.material.map.needsUpdate = true;
                }
            }
        }

        for (var c = 0; c < this.group.children.length; c++) {
            var child = this.group.children[c];
            if (child.userData.isCenter) {
                child.rotation.z = -time * speed * 0.05;
                if (child.material && child.material.map) child.material.map.needsUpdate = true;
            }
        }

        var camDist = 8 + this._rings.length * 2;
        EP.Core.camera.position.set(
            Math.sin(time * 0.07) * 0.5,
            Math.cos(time * 0.05) * 0.3,
            camDist
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
