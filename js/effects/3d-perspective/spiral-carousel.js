(function() {
    var effect = new EP.EffectBase('spiral-carousel', {
        name: 'Spiral Carousel',
        category: '3d-perspective',
        icon: '🌀',
        description: 'Espiral 3D infinita de imagenes con scroll automatico — las fotos giran en helicoide continuo'
    }, [
        { key: 'spiralRadius', type: 'range', min: 2, max: 8, default: 3.5, step: 0.5, label: 'Radius' },
        { key: 'spiralTurns', type: 'range', min: 1, max: 5, default: 2.5, step: 0.5, label: 'Turns' },
        { key: 'spiralHeight', type: 'range', min: 6, max: 20, default: 12, step: 1, label: 'Height' },
        { key: 'cardSize', type: 'range', min: 20, max: 60, default: 40, label: 'Card Size', unit: '%' },
        { key: 'scrollSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Speed', unit: '%' },
        { key: 'tiltX', type: 'range', min: -30, max: 30, default: -10, label: 'Tilt X' },
        { key: 'tiltZ', type: 'range', min: -30, max: 30, default: 7, label: 'Tilt Z' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 4, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050508', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.3;
        var radius = this.settings.spiralRadius;
        var turns = this.settings.spiralTurns;
        var height = this.settings.spiralHeight;
        var count = mediaList.length;

        var tiltGroup = new THREE.Group();
        tiltGroup.rotation.x = this.settings.tiltX * Math.PI / 180;
        tiltGroup.rotation.z = this.settings.tiltZ * Math.PI / 180;
        tiltGroup.userData = { isTiltGroup: true };

        for (var i = 0; i < count; i++) {
            var t = i / count;
            var angle = t * Math.PI * 2 * turns;
            var r = radius * (1 - t * 0.12);
            var px = Math.sin(angle) * r;
            var pz = Math.cos(angle) * r;
            var py = (t - 0.5) * height;

            var w = cardScale;
            var h = cardScale * 0.65;
            var geo = EP.RoundedPlaneGeometry(w, h, cr);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            mat.side = THREE.DoubleSide;
            var mesh = new THREE.Mesh(geo, mat);

            mesh.position.set(px, py, pz);

            var tangentAngle = angle + Math.PI / 2;
            mesh.rotation.y = tangentAngle;

            mesh.userData = {
                index: i,
                baseY: py,
                angle: angle,
                radius: r,
                t: t
            };

            var borderGeo = EP.RoundedPlaneGeometry(w + 0.05, h + 0.05, cr + 0.02);
            var borderMat = new THREE.MeshBasicMaterial({
                color: 0x181822, side: THREE.DoubleSide,
                transparent: true, opacity: 0.4
            });
            var border = new THREE.Mesh(borderGeo, borderMat);
            border.position.z = -0.02;
            mesh.add(border);

            tiltGroup.add(mesh);
        }

        group.add(tiltGroup);

        var ambLight = new THREE.AmbientLight(0xffffff, 0.7);
        ambLight.userData = { isLight: true };
        group.add(ambLight);
        var dirL = new THREE.DirectionalLight(0xffffff, 0.5);
        dirL.position.set(5, 8, 5);
        dirL.userData = { isLight: true };
        group.add(dirL);

        this._baseFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speed = this.settings.scrollSpeed / 100;
        var radius = this.settings.spiralRadius;
        var turns = this.settings.spiralTurns;
        var height = this.settings.spiralHeight;

        var tiltGroup = null;
        for (var c = 0; c < this.group.children.length; c++) {
            if (this.group.children[c].userData && this.group.children[c].userData.isTiltGroup) {
                tiltGroup = this.group.children[c];
                break;
            }
        }
        if (!tiltGroup) return;

        var scrollOffset = t * speed;

        for (var i = 0; i < tiltGroup.children.length; i++) {
            var mesh = tiltGroup.children[i];
            var d = mesh.userData;
            if (d.index === undefined) continue;

            var newT = d.t + scrollOffset;
            newT = newT - Math.floor(newT);

            var angle = newT * Math.PI * 2 * turns;
            var r = radius * (1 - newT * 0.12);
            var px = Math.sin(angle) * r;
            var pz = Math.cos(angle) * r;
            var py = (newT - 0.5) * height;

            mesh.position.set(px, py, pz);
            mesh.rotation.y = angle + Math.PI / 2;

            var distFromCenter = Math.abs(newT - 0.5);
            var opacity = 1 - distFromCenter * 1.6;
            opacity = Math.max(0.1, Math.min(1, opacity));
            mesh.material.opacity = opacity;

            var scale = 1 - distFromCenter * 0.4;
            scale = Math.max(0.6, Math.min(1.1, scale));
            mesh.scale.setScalar(scale);
        }

        var camDist = radius * 2.6;
        var camAngle = t * Math.PI * 2 * speed * 0.15;
        EP.Core.camera.position.x = Math.sin(camAngle) * camDist * 0.15;
        EP.Core.camera.position.y = height * 0.35 + Math.sin(t * Math.PI * 2) * height * 0.05;
        EP.Core.camera.position.z = camDist;
        EP.Core.camera.lookAt(0, height * 0.1, 0);
    };

    effect.dispose = function() {
        if (this._baseFov) {
            EP.Core.camera.fov = this._baseFov;
            EP.Core.camera.updateProjectionMatrix();
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
