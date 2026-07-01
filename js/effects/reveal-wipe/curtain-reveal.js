(function() {
    var effect = new EP.EffectBase('curtain-reveal', {
        name: 'Curtain Reveal',
        category: 'reveal-wipe',
        icon: '🎭',
        description: 'Cortinas de teatro que se abren revelando cada imagen con fisica de tela'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 40, max: 90, default: 70, label: 'Card Size', unit: '%' },
        { key: 'curtainColor', type: 'color', default: '#8b0000', label: 'Curtain Color' },
        { key: 'folds', type: 'range', min: 3, max: 12, default: 6, step: 1, label: 'Folds' },
        { key: 'swayAmount', type: 'range', min: 10, max: 100, default: 50, label: 'Sway', unit: '%' },
        { key: 'openSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Speed', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 4, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a12', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 5;
        var h = cardScale * 0.65;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.3;
        var folds = this.settings.folds;
        var curtainHex = parseInt(this.settings.curtainColor.replace('#', ''), 16);

        for (var img = 0; img < mediaList.length; img++) {
            var scene = new THREE.Group();

            var artGeo = EP.RoundedPlaneGeometry(cardScale, h, cr);
            var artMat = EP.Media.createMaterial(mediaList[img]);
            artMat.transparent = true;
            var art = new THREE.Mesh(artGeo, artMat);
            art.position.z = -0.05;
            art.userData = { isArt: true };
            scene.add(art);

            for (var side = 0; side < 2; side++) {
                var curtainGroup = new THREE.Group();
                var foldW = (cardScale / 2) / folds;
                for (var f = 0; f < folds; f++) {
                    var foldGeo = new THREE.PlaneGeometry(foldW, h, 1, 12);
                    var shade = 0.7 + (f % 2) * 0.3;
                    var r = ((curtainHex >> 16) & 0xff) / 255 * shade;
                    var g = ((curtainHex >> 8) & 0xff) / 255 * shade;
                    var b = (curtainHex & 0xff) / 255 * shade;
                    var foldMat = new THREE.MeshBasicMaterial({
                        color: new THREE.Color(r, g, b),
                        side: THREE.DoubleSide, transparent: true
                    });
                    var foldMesh = new THREE.Mesh(foldGeo, foldMat);
                    var xOff = side === 0
                        ? -cardScale / 4 + f * foldW + foldW / 2
                        : cardScale / 4 - f * foldW - foldW / 2;
                    foldMesh.position.x = xOff;
                    foldMesh.position.z = (f % 2) * 0.03;
                    foldMesh.userData = { foldIndex: f, foldW: foldW, side: side, baseX: xOff };
                    curtainGroup.add(foldMesh);
                }
                curtainGroup.userData = { isCurtain: true, side: side };
                scene.add(curtainGroup);
            }

            var rod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, cardScale * 1.2, 8),
                new THREE.MeshBasicMaterial({ color: 0xccaa44 })
            );
            rod.rotation.z = Math.PI / 2;
            rod.position.y = h / 2 + 0.06;
            rod.position.z = 0.04;
            scene.add(rod);

            for (var rb = 0; rb < 2; rb++) {
                var ball = new THREE.Mesh(
                    new THREE.SphereGeometry(0.06, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xccaa44 })
                );
                ball.position.set(rb === 0 ? -cardScale * 0.6 : cardScale * 0.6, h / 2 + 0.06, 0.04);
                scene.add(ball);
            }

            scene.userData = { imageIndex: img };
            scene.visible = false;
            group.add(scene);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var segDur = 1 / count;
        var sway = this.settings.swayAmount / 100;
        var speed = this.settings.openSpeed / 100;

        for (var idx = 0; idx < count; idx++) {
            var scene = this.group.children[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                scene.visible = true;
                var lt = (t - segStart) / segDur;

                var closePhase = 0.15;
                var openPhase = 0.5;
                var holdPhase = 0.85;
                var openT;

                if (lt < closePhase) {
                    openT = 0;
                } else if (lt < openPhase) {
                    openT = (lt - closePhase) / (openPhase - closePhase);
                    openT = openT * openT * (3 - 2 * openT);
                } else if (lt < holdPhase) {
                    openT = 1;
                } else {
                    openT = 1 - (lt - holdPhase) / (1 - holdPhase);
                    openT = openT * openT * (3 - 2 * openT);
                }

                openT = Math.pow(openT, 1 / (0.5 + speed));

                scene.children.forEach(function(child) {
                    if (child.userData.isCurtain) {
                        var dir = child.userData.side === 0 ? -1 : 1;
                        var slide = openT * 3;
                        child.position.x = dir * slide;

                        child.children.forEach(function(fold) {
                            var d = fold.userData;
                            var swayAmt = Math.sin(t * Math.PI * 12 + d.foldIndex * 1.5) * 0.04 * sway;
                            var openSway = Math.sin(openT * Math.PI) * 0.06 * sway * (d.foldIndex + 1);
                            var posArr = fold.geometry.attributes.position.array;
                            for (var v = 0; v < posArr.length; v += 3) {
                                var ny = (posArr[v + 1] + fold.geometry.parameters.height / 2) / fold.geometry.parameters.height;
                                posArr[v + 2] = (swayAmt + openSway) * Math.sin(ny * Math.PI * 2) * ny;
                            }
                            fold.geometry.attributes.position.needsUpdate = true;
                            fold.material.opacity = 1;
                        });
                    }
                    if (child.userData.isArt) {
                        child.material.opacity = openT;
                    }
                });
            } else {
                scene.visible = false;
            }
        }
    };

    EP.Registry.register(effect);
})();
