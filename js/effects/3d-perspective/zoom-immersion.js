(function() {
    var effect = new EP.EffectBase('zoom-immersion', {
        name: 'Zoom Immersion',
        category: '3d-perspective',
        icon: '🔍',
        description: 'Zoom cinematografico que te sumerge de una imagen a la siguiente — efecto inmersivo de profundidad infinita'
    }, [
        { key: 'zoomDepth', type: 'range', min: 10, max: 100, default: 60, label: 'Zoom Depth', unit: '%' },
        { key: 'spiralAmount', type: 'range', min: 0, max: 100, default: 20, label: 'Spiral', unit: '%' },
        { key: 'fadeOverlap', type: 'range', min: 10, max: 80, default: 40, label: 'Fade Overlap', unit: '%' },
        { key: 'vignette', type: 'range', min: 0, max: 100, default: 50, label: 'Vignette', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

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
            var w = aspect >= 1 ? 8 : 8 * aspect;
            var h = aspect >= 1 ? 8 / aspect : 8;
            var geo = new THREE.PlaneGeometry(w, h);
            var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 1 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = -img * 15;
            mesh.userData = { imageIndex: img, isImage: true, baseZ: -img * 15 };
            group.add(mesh);
        }

        this.group = group;
        this._imageCount = mediaList.length;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this._imageCount;
        if (count === 0) return;

        var depth = this.settings.zoomDepth / 100;
        var spiral = this.settings.spiralAmount / 100;
        var fadeOverlap = this.settings.fadeOverlap / 100;

        var totalTravel = count * 15 * depth;
        var camZ = 5 - t * totalTravel;

        var camX = Math.sin(t * Math.PI * 2 * count) * spiral * 0.8;
        var camY = Math.cos(t * Math.PI * 2 * count * 0.7) * spiral * 0.5;

        EP.Core.camera.position.set(camX, camY, camZ);
        EP.Core.camera.lookAt(camX * 0.3, camY * 0.3, camZ - 10);

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            if (!mesh.userData.isImage) continue;

            var dist = mesh.userData.baseZ - camZ;
            if (dist > 10) {
                mesh.visible = false;
                continue;
            }
            if (dist < -2) {
                mesh.visible = false;
                continue;
            }

            mesh.visible = true;
            if (mesh.material.map) mesh.material.map.needsUpdate = true;

            if (dist > 8) {
                mesh.material.opacity = 1.0 - (dist - 8) / 2;
            } else if (dist < 0) {
                mesh.material.opacity = Math.max(0, 1.0 + dist / 2);
            } else {
                mesh.material.opacity = 1.0;
            }

            mesh.rotation.z = Math.sin(time * 0.3 + mesh.userData.imageIndex) * spiral * 0.05;
        }
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
