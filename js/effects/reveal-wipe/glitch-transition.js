(function() {
    var effect = new EP.EffectBase('glitch-transition', {
        name: 'Glitch Transition',
        category: 'reveal-wipe',
        icon: '⚡',
        description: 'Transicion glitch digital con RGB shift y fragmentacion'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 40, max: 90, default: 70, label: 'Card Size', unit: '%' },
        { key: 'glitchIntensity', type: 'range', min: 10, max: 100, default: 60, label: 'Glitch Force', unit: '%' },
        { key: 'slices', type: 'range', min: 3, max: 15, default: 8, step: 1, label: 'Slices' },
        { key: 'rgbShift', type: 'range', min: 0, max: 100, default: 50, label: 'RGB Shift', unit: '%' },
        { key: 'easing', type: 'easing', options: ['snappy', 'smooth', 'linear'], default: 'snappy', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050505', label: 'Background' }
    ]);

    function pseudoRandom(seed) {
        var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 6;
        var h = cardScale * 0.6;
        var slices = this.settings.slices;

        for (var img = 0; img < mediaList.length; img++) {
            var imgGroup = new THREE.Group();
            var sliceH = h / slices;

            for (var s = 0; s < slices; s++) {
                var geo = new THREE.PlaneGeometry(cardScale, sliceH);
                var mat = EP.Media.createMaterial(mediaList[img]);
                mat.transparent = true;
                var mesh = new THREE.Mesh(geo, mat);

                var yPos = h / 2 - sliceH / 2 - s * sliceH;
                mesh.position.set(0, yPos, 0);

                var uvAttr = geo.attributes.uv;
                for (var i = 0; i < uvAttr.count; i++) {
                    var uy = uvAttr.getY(i);
                    uvAttr.setY(i, (uy + (slices - 1 - s)) / slices);
                }
                uvAttr.needsUpdate = true;

                mesh.userData = {
                    sliceIndex: s,
                    baseY: yPos,
                    seed: img * 100 + s * 7.3
                };
                imgGroup.add(mesh);
            }

            var rgbShift = this.settings.rgbShift / 100;
            if (rgbShift > 0) {
                var redGeo = new THREE.PlaneGeometry(cardScale, h);
                var redMat = new THREE.MeshBasicMaterial({
                    color: 0xff0000, transparent: true, opacity: 0, side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending
                });
                var redPlane = new THREE.Mesh(redGeo, redMat);
                redPlane.position.z = 0.01;
                redPlane.userData = { isRGB: 'red' };
                imgGroup.add(redPlane);

                var cyanGeo = new THREE.PlaneGeometry(cardScale, h);
                var cyanMat = new THREE.MeshBasicMaterial({
                    color: 0x00ffff, transparent: true, opacity: 0, side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending
                });
                var cyanPlane = new THREE.Mesh(cyanGeo, cyanMat);
                cyanPlane.position.z = 0.01;
                cyanPlane.userData = { isRGB: 'cyan' };
                imgGroup.add(cyanPlane);
            }

            imgGroup.userData = { imageIndex: img, totalImages: mediaList.length };
            imgGroup.visible = false;
            group.add(imgGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var segDur = 1 / count;
        var intensity = this.settings.glitchIntensity / 100;
        var rgbAmt = this.settings.rgbShift / 100;

        this.group.children.forEach(function(imgGroup, idx) {
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                imgGroup.visible = true;
                var localT = (t - segStart) / segDur;
                var transIn = Math.min(1, localT * 5);
                var transOut = localT > 0.8 ? (localT - 0.8) / 0.2 : 0;
                var glitchPhase = transIn < 1 ? (1 - transIn) : transOut;
                var glitch = glitchPhase * intensity;

                imgGroup.children.forEach(function(child) {
                    if (child.userData.isRGB) {
                        var shift = glitch * rgbAmt * 0.3;
                        child.material.opacity = glitch * 0.15 * rgbAmt;
                        if (child.userData.isRGB === 'red') {
                            child.position.x = shift * (pseudoRandom(t * 100) - 0.5) * 4;
                        } else {
                            child.position.x = -shift * (pseudoRandom(t * 200) - 0.5) * 4;
                        }
                        return;
                    }
                    var d = child.userData;
                    var sliceGlitch = pseudoRandom(d.seed + Math.floor(t * 20)) > 0.4 ? 1 : 0;
                    child.position.x = glitch * sliceGlitch * (pseudoRandom(d.seed + Math.floor(t * 15)) - 0.5) * 3;
                    child.position.y = d.baseY;
                    child.material.opacity = 1 - glitch * 0.3 * (1 - sliceGlitch);

                    if (glitch > 0.3 && sliceGlitch) {
                        child.scale.x = 1 + (pseudoRandom(d.seed + Math.floor(t * 25)) - 0.5) * glitch * 0.3;
                    } else {
                        child.scale.x = 1;
                    }
                });
            } else {
                imgGroup.visible = false;
            }
        });
    };

    EP.Registry.register(effect);
})();
