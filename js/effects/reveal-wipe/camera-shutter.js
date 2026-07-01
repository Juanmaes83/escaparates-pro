(function() {
    var effect = new EP.EffectBase('camera-shutter', {
        name: 'Camera Shutter',
        category: 'reveal-wipe',
        icon: '📷',
        description: 'Obturador de camara — aspas poligonales se abren y cierran revelando cada imagen como una foto profesional'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'bladeCount', type: 'range', min: 4, max: 12, default: 8, step: 1, label: 'Blades' },
        { key: 'openSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Open Speed', unit: '%' },
        { key: 'bladeColor', type: 'color', default: '#1a1a1a', label: 'Blade Color' },
        { key: 'metallic', type: 'range', min: 0, max: 100, default: 70, label: 'Metallic', unit: '%' },
        { key: 'holdTime', type: 'range', min: 10, max: 80, default: 50, label: 'Hold Time', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function createBladeMesh(angle, radius, bladeColor, metallic) {
        var bladeW = radius * 1.1;
        var bladeH = radius * 0.65;
        var shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(bladeW, bladeH * 0.15);
        shape.lineTo(bladeW * 0.95, bladeH);
        shape.lineTo(bladeW * 0.1, bladeH * 0.85);
        shape.lineTo(0, 0);

        var geo = new THREE.ShapeGeometry(shape);
        var c = new THREE.Color(bladeColor);
        var mat = new THREE.MeshPhongMaterial({
            color: c,
            shininess: 20 + metallic * 0.8,
            specular: new THREE.Color().setHSL(0, 0, 0.1 + metallic / 100 * 0.5),
            side: THREE.DoubleSide
        });

        var mesh = new THREE.Mesh(geo, mat);
        var pivot = new THREE.Group();
        pivot.add(mesh);

        pivot.rotation.z = angle;
        pivot.position.z = 0.05;
        pivot.userData = {
            isBlade: true,
            baseAngle: angle,
            bladeRef: mesh
        };
        return pivot;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var bladeCount = this.settings.bladeCount;
        var metallic = this.settings.metallic;
        var bladeColor = this.settings.bladeColor;

        for (var img = 0; img < mediaList.length; img++) {
            var tex = null;
            var aspect = 1;
            if (mediaList[img].element) {
                tex = EP.Media.createTexture(mediaList[img]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || 1;
                aspect = ew / eh;
            }
            var w, h;
            if (aspect >= 1) { w = 7; h = 7 / aspect; } else { h = 7; w = 7 * aspect; }
            var imgGeo = new THREE.PlaneGeometry(w, h);
            var imgMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
            var imgMesh = new THREE.Mesh(imgGeo, imgMat);
            imgMesh.position.z = -0.1;
            imgMesh.visible = false;
            imgMesh.userData = { imageIndex: img, isImage: true };
            group.add(imgMesh);
        }

        var shutterGroup = new THREE.Group();
        shutterGroup.userData = { isShutter: true };
        var radius = 4.5;

        for (var b = 0; b < bladeCount; b++) {
            var angle = (b / bladeCount) * Math.PI * 2;
            var blade = createBladeMesh(angle, radius, bladeColor, metallic);
            shutterGroup.add(blade);
        }
        group.add(shutterGroup);

        var ringGeo = new THREE.RingGeometry(radius * 0.98, radius * 1.05, 64);
        var ringMat = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 80,
            specular: 0x666666,
            side: THREE.DoubleSide
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.z = 0.06;
        ring.userData = { isDecor: true };
        group.add(ring);

        var light = new THREE.PointLight(0xffffff, 1.0, 15);
        light.position.set(0, 0, 6);
        light.userData = { isLight: true };
        group.add(light);

        var ambient = new THREE.AmbientLight(0x444444, 0.6);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;

        var images = [];
        var shutterGroup = null;
        for (var i = 0; i < this.group.children.length; i++) {
            var c = this.group.children[i];
            if (c.userData.isImage) images.push(c);
            if (c.userData.isShutter) shutterGroup = c;
        }
        var count = images.length;
        if (count === 0) return;
        var segDur = 1 / count;

        for (var idx = 0; idx < count; idx++) {
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                images[idx].visible = true;
                if (images[idx].material.map) images[idx].material.map.needsUpdate = true;

                var lt = (t - segStart) / segDur;
                var openPhase = 0.2;
                var holdPortion = this.settings.holdTime / 100;
                var closeStart = openPhase + holdPortion * (1.0 - 2 * openPhase);
                var closeEnd = closeStart + openPhase;
                if (closeEnd > 1.0) closeEnd = 1.0;

                var openVal = 0;
                if (lt < openPhase) {
                    openVal = EP.Easing.apply(lt / openPhase, this.settings.easing);
                } else if (lt < closeStart) {
                    openVal = 1.0;
                } else if (lt < closeEnd) {
                    openVal = 1.0 - EP.Easing.apply((lt - closeStart) / (closeEnd - closeStart), this.settings.easing);
                } else {
                    openVal = 0;
                }

                if (shutterGroup) {
                    var rotAmount = openVal * (Math.PI / this.settings.bladeCount) * 1.8;
                    for (var b = 0; b < shutterGroup.children.length; b++) {
                        var blade = shutterGroup.children[b];
                        if (!blade.userData.isBlade) continue;
                        blade.rotation.z = blade.userData.baseAngle + rotAmount;

                        var bladeRef = blade.userData.bladeRef;
                        if (bladeRef) {
                            bladeRef.position.x = openVal * 1.5;
                        }
                    }
                }
            } else {
                images[idx].visible = false;
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.2) * 0.3,
            Math.cos(time * 0.15) * 0.2,
            8
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this.group) {
            for (var i = 0; i < this.group.children.length; i++) {
                var c = this.group.children[i];
                if (c.userData.isImage && c.material && c.material.map) c.material.map.dispose();
            }
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
