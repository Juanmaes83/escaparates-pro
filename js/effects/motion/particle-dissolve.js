(function() {
    var effect = new EP.EffectBase('particle-dissolve', {
        name: 'Particle Dissolve',
        category: 'motion',
        icon: '✨',
        description: 'La imagen se descompone en particulas tipo Thanos snap'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 40, max: 85, default: 65, label: 'Card Size', unit: '%' },
        { key: 'particleDensity', type: 'range', min: 20, max: 100, default: 60, label: 'Density', unit: '%' },
        { key: 'dissolveSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Speed', unit: '%' },
        { key: 'windForce', type: 'range', min: 0, max: 100, default: 40, label: 'Wind', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080810', label: 'Background' }
    ]);

    function seededRandom(s) {
        var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 5;
        var h = cardScale * 0.65;
        var density = this.settings.particleDensity / 100;
        var gridX = Math.floor(30 * density) + 10;
        var gridY = Math.floor(20 * density) + 8;

        for (var img = 0; img < mediaList.length; img++) {
            var imgGroup = new THREE.Group();

            var solidGeo = new THREE.PlaneGeometry(cardScale, h);
            var solidMat = EP.Media.createMaterial(mediaList[img]);
            solidMat.transparent = true;
            var solid = new THREE.Mesh(solidGeo, solidMat);
            solid.userData = { isSolid: true };
            imgGroup.add(solid);

            var count = gridX * gridY;
            var positions = new Float32Array(count * 3);
            var origPositions = new Float32Array(count * 3);
            var uvs = new Float32Array(count * 2);
            var seeds = new Float32Array(count * 3);
            var thresholds = new Float32Array(count);

            for (var gy = 0; gy < gridY; gy++) {
                for (var gx = 0; gx < gridX; gx++) {
                    var idx = gy * gridX + gx;
                    var px = (gx / (gridX - 1) - 0.5) * cardScale;
                    var py = (gy / (gridY - 1) - 0.5) * h;
                    positions[idx * 3] = px;
                    positions[idx * 3 + 1] = py;
                    positions[idx * 3 + 2] = 0;
                    origPositions[idx * 3] = px;
                    origPositions[idx * 3 + 1] = py;
                    origPositions[idx * 3 + 2] = 0;
                    uvs[idx * 2] = gx / (gridX - 1);
                    uvs[idx * 2 + 1] = gy / (gridY - 1);
                    var sd = img * 1000 + idx;
                    seeds[idx * 3] = (seededRandom(sd) - 0.5) * 6;
                    seeds[idx * 3 + 1] = (seededRandom(sd + 100) - 0.5) * 4 + 2;
                    seeds[idx * 3 + 2] = (seededRandom(sd + 200) - 0.5) * 4;
                    thresholds[idx] = seededRandom(sd + 300) * 0.6 + (gx / gridX) * 0.4;
                }
            }

            var pGeo = new THREE.BufferGeometry();
            pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            var pMat = new THREE.PointsMaterial({
                size: cardScale / gridX * 1.8,
                color: 0xffffff,
                transparent: true,
                opacity: 0,
                sizeAttenuation: true
            });
            var points = new THREE.Points(pGeo, pMat);
            points.userData = {
                isParticles: true,
                origPositions: origPositions,
                seeds: seeds,
                thresholds: thresholds,
                count: count
            };
            imgGroup.add(points);

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
        var speed = this.settings.dissolveSpeed / 100;
        var wind = this.settings.windForce / 100;

        this.group.children.forEach(function(imgGroup, idx) {
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                imgGroup.visible = true;
                var localT = (t - segStart) / segDur;
                var dissolveStart = 0.3;
                var dissolveT = localT < dissolveStart ? 0 : Math.min(1, (localT - dissolveStart) / (0.6 * (1 / speed)));
                dissolveT = Math.min(dissolveT, 1);

                imgGroup.children.forEach(function(child) {
                    if (child.userData.isSolid) {
                        child.material.opacity = Math.max(0, 1 - dissolveT * 2);
                        child.visible = dissolveT < 0.8;
                    } else if (child.userData.isParticles) {
                        var d = child.userData;
                        child.material.opacity = dissolveT > 0 ? Math.min(1, dissolveT * 3) * (1 - Math.max(0, dissolveT - 0.5) * 2) : 0;
                        var pos = child.geometry.attributes.position;

                        for (var i = 0; i < d.count; i++) {
                            var thresh = d.thresholds[i];
                            var particleT = Math.max(0, Math.min(1, (dissolveT - thresh * 0.5) / 0.5));

                            if (particleT > 0) {
                                var sx = d.seeds[i * 3];
                                var sy = d.seeds[i * 3 + 1];
                                var sz = d.seeds[i * 3 + 2];
                                var ease = particleT * particleT;
                                pos.setXYZ(i,
                                    d.origPositions[i * 3] + sx * ease + wind * ease * 3,
                                    d.origPositions[i * 3 + 1] + sy * ease,
                                    d.origPositions[i * 3 + 2] + sz * ease
                                );
                            } else {
                                pos.setXYZ(i,
                                    d.origPositions[i * 3],
                                    d.origPositions[i * 3 + 1],
                                    d.origPositions[i * 3 + 2]
                                );
                            }
                        }
                        pos.needsUpdate = true;
                    }
                });
            } else {
                imgGroup.visible = false;
            }
        });
    };

    EP.Registry.register(effect);
})();
