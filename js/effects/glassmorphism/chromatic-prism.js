(function() {
    var effect = new EP.EffectBase('chromatic-prism', {
        name: 'Chromatic Prism Split',
        category: 'glassmorphism',
        icon: '🔻',
        description: 'Separacion prismatica RGB con efecto cristal iridiscente premium'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 35, max: 80, default: 60, label: 'Card Size', unit: '%' },
        { key: 'splitAmount', type: 'range', min: 10, max: 100, default: 50, label: 'Split Force', unit: '%' },
        { key: 'rotAmplitude', type: 'range', min: 5, max: 30, default: 12, label: 'Rotation', unit: '°' },
        { key: 'pulseSpeed', type: 'range', min: 10, max: 100, default: 40, label: 'Pulse Speed', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 5, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050508', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 4.5;
        var h = cardScale * 0.65;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.3;

        for (var img = 0; img < mediaList.length; img++) {
            var cardGroup = new THREE.Group();

            var channels = [
                { color: 0xff0000, blend: THREE.AdditiveBlending, opacity: 0.7, label: 'R' },
                { color: 0x00ff00, blend: THREE.AdditiveBlending, opacity: 0.7, label: 'G' },
                { color: 0x0000ff, blend: THREE.AdditiveBlending, opacity: 0.7, label: 'B' }
            ];

            for (var c = 0; c < 3; c++) {
                var geo = EP.RoundedPlaneGeometry(cardScale, h, cr);
                var mat = EP.Media.createMaterial(mediaList[img]);
                mat.transparent = true;
                mat.opacity = channels[c].opacity;
                mat.blending = channels[c].blend;
                var mesh = new THREE.Mesh(geo, mat);
                mesh.userData = { channel: c, channelColor: channels[c].color };
                cardGroup.add(mesh);
            }

            var baseGeo = EP.RoundedPlaneGeometry(cardScale, h, cr);
            var baseMat = EP.Media.createMaterial(mediaList[img]);
            baseMat.transparent = true;
            baseMat.depthWrite = false;
            var baseMesh = new THREE.Mesh(baseGeo, baseMat);
            baseMesh.position.z = -0.02;
            baseMesh.userData = { isBase: true };
            cardGroup.add(baseMesh);

            var glowGeo = EP.RoundedPlaneGeometry(cardScale * 1.08, h * 1.08, cr * 1.2);
            var glowMat = new THREE.MeshBasicMaterial({
                color: 0xffffff, transparent: true, opacity: 0.08,
                blending: THREE.AdditiveBlending, side: THREE.DoubleSide
            });
            var glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.z = -0.04;
            glow.userData = { isGlow: true };
            cardGroup.add(glow);

            cardGroup.userData = { imageIndex: img };
            cardGroup.visible = false;
            group.add(cardGroup);
        }

        this._mediaList = mediaList;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var segDur = 1 / count;
        var splitMax = this.settings.splitAmount / 100 * 0.5;
        var rotAmp = THREE.MathUtils.degToRad(this.settings.rotAmplitude);
        var pulseSpd = this.settings.pulseSpeed / 100;

        for (var idx = 0; idx < count; idx++) {
            var card = this.group.children[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                card.visible = true;
                var lt = (t - segStart) / segDur;

                var enterT = Math.min(1, lt / 0.15);
                var exitT = lt > 0.85 ? (lt - 0.85) / 0.15 : 0;

                var splitPulse = Math.sin(lt * Math.PI * 4 * (0.5 + pulseSpd)) * 0.5 + 0.5;
                var splitT = splitPulse * splitMax * enterT * (1 - exitT);

                var offsets = [
                    { x: -splitT, y: splitT * 0.6 },
                    { x: splitT * 0.3, y: -splitT * 0.8 },
                    { x: splitT * 0.7, y: splitT * 0.2 }
                ];

                card.children.forEach(function(child) {
                    if (child.userData.channel !== undefined) {
                        var c = child.userData.channel;
                        child.position.x = offsets[c].x;
                        child.position.y = offsets[c].y;
                        child.position.z = c * 0.01;
                        child.material.opacity = 0.5 + splitPulse * 0.3;
                    } else if (child.userData.isBase) {
                        child.material.opacity = 1 - splitT * 2;
                    } else if (child.userData.isGlow) {
                        var hue = (t * 0.5 + idx * 0.2) % 1;
                        child.material.color.setHSL(hue, 0.8, 0.6);
                        child.material.opacity = 0.06 + splitPulse * 0.08;
                    }
                });

                card.rotation.y = Math.sin(lt * Math.PI * 2) * rotAmp * enterT;
                card.rotation.x = Math.sin(lt * Math.PI * 3) * rotAmp * 0.3 * enterT;

                var scale = 0.3 + enterT * 0.7;
                if (exitT > 0) scale *= (1 - exitT * 0.5);
                card.scale.setScalar(scale);
            } else {
                card.visible = false;
            }
        }
    };

    EP.Registry.register(effect);
})();
