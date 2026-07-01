(function() {
    var effect = new EP.EffectBase('theater-curtain', {
        name: 'Theater Curtain',
        category: 'reveal-wipe',
        icon: '🎭',
        description: 'Cortina de teatro roja que se abre revelando las imagenes — intro cinematografica tipo pelicula'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'curtainColor', type: 'color', default: '#8b0000', label: 'Curtain Color' },
        { key: 'foldCount', type: 'range', min: 3, max: 20, default: 10, label: 'Folds' },
        { key: 'revealSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Reveal Speed', unit: '%' },
        { key: 'waveAmp', type: 'range', min: 0, max: 100, default: 40, label: 'Cloth Ripple', unit: '%' },
        { key: 'holdTime', type: 'range', min: 10, max: 80, default: 50, label: 'Hold Time', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    function buildCurtainPanel(folds, height, color) {
        var group = new THREE.Group();
        var foldW = 4.5 / folds;
        for (var f = 0; f < folds; f++) {
            var geo = new THREE.PlaneGeometry(foldW, height, 1, 8);
            var shade = 0.6 + 0.4 * Math.abs(Math.sin(f * Math.PI / folds));
            var c = color.clone().multiplyScalar(shade);
            var mat = new THREE.MeshPhongMaterial({
                color: c,
                side: THREE.DoubleSide,
                shininess: 20,
                specular: 0x331111
            });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.x = f * foldW;
            mesh.position.z = Math.sin(f * 0.8) * 0.06;
            mesh.userData = { foldIndex: f };
            group.add(mesh);
        }
        return group;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var folds = this.settings.foldCount;
        var cc = new THREE.Color(this.settings.curtainColor);

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
            imgMesh.position.z = -0.15;
            imgMesh.visible = false;
            imgMesh.userData = { imageIndex: img, isImage: true };
            group.add(imgMesh);
        }

        var leftPanel = buildCurtainPanel(folds, 8, cc);
        leftPanel.position.set(-4.5 / 2, 0, 0.05);
        leftPanel.userData = { isCurtain: true, side: 'left' };
        group.add(leftPanel);

        var rightPanel = buildCurtainPanel(folds, 8, cc);
        rightPanel.position.set(0, 0, 0.05);
        rightPanel.userData = { isCurtain: true, side: 'right' };
        group.add(rightPanel);

        var topGeo = new THREE.PlaneGeometry(10, 1.5);
        var topMat = new THREE.MeshPhongMaterial({ color: cc.clone().multiplyScalar(0.3), shininess: 10 });
        var topBar = new THREE.Mesh(topGeo, topMat);
        topBar.position.set(0, 4.5, 0.1);
        topBar.userData = { isDecor: true };
        group.add(topBar);

        var light = new THREE.PointLight(0xffddaa, 1.0, 15);
        light.position.set(0, 3, 4);
        light.userData = { isLight: true };
        group.add(light);

        var ambient = new THREE.AmbientLight(0x332222, 0.5);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var images = [];
        var curtainLeft = null;
        var curtainRight = null;

        for (var i = 0; i < this.group.children.length; i++) {
            var c = this.group.children[i];
            if (c.userData.isImage) images.push(c);
            if (c.userData.isCurtain && c.userData.side === 'left') curtainLeft = c;
            if (c.userData.isCurtain && c.userData.side === 'right') curtainRight = c;
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
                var openPhase = 0.25;
                var closeStart = 1.0 - openPhase;

                var openVal = 0;
                if (lt < openPhase) {
                    openVal = EP.Easing.apply(lt / openPhase, this.settings.easing);
                } else if (lt < closeStart) {
                    openVal = 1.0;
                } else {
                    openVal = 1.0 - EP.Easing.apply((lt - closeStart) / openPhase, this.settings.easing);
                }

                var slideX = openVal * 4.5;
                var wave = this.settings.waveAmp / 100;
                var scrunch = 1.0 - openVal * 0.7;

                if (curtainLeft) {
                    curtainLeft.position.x = -4.5 / 2 - slideX;
                    curtainLeft.scale.x = Math.max(scrunch, 0.15);
                    for (var fi = 0; fi < curtainLeft.children.length; fi++) {
                        var fold = curtainLeft.children[fi];
                        fold.position.z = Math.sin(time * 3 + fi * 1.2) * 0.08 * wave * (1.0 - openVal * 0.8);
                    }
                }
                if (curtainRight) {
                    curtainRight.position.x = slideX;
                    curtainRight.scale.x = Math.max(scrunch, 0.15);
                    for (var fj = 0; fj < curtainRight.children.length; fj++) {
                        var fold2 = curtainRight.children[fj];
                        fold2.position.z = Math.sin(time * 3 + fj * 1.2 + 2) * 0.08 * wave * (1.0 - openVal * 0.8);
                    }
                }
            } else {
                images[idx].visible = false;
            }
        }

        EP.Core.camera.position.set(0, 0, 7);
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
