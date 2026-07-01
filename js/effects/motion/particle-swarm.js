(function() {
    var effect = new EP.EffectBase('particle-swarm', {
        name: 'Particle Swarm Formation',
        category: 'motion',
        icon: '✨',
        description: 'Miles de particulas que forman las imagenes como un enjambre y se dispersan'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 40, max: 85, default: 65, label: 'Card Size', unit: '%' },
        { key: 'particleDensity', type: 'range', min: 20, max: 100, default: 60, label: 'Density', unit: '%' },
        { key: 'disperseForce', type: 'range', min: 10, max: 100, default: 50, label: 'Disperse', unit: '%' },
        { key: 'formSpeed', type: 'range', min: 10, max: 100, default: 55, label: 'Form Speed', unit: '%' },
        { key: 'particleSize', type: 'range', min: 1, max: 8, default: 3, step: 0.5, label: 'Particle Size' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#030308', label: 'Background' }
    ]);

    function seededRandom(s) {
        var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    function sampleImageColors(mediaObj, sampleCount, w, h) {
        var canvas = document.createElement('canvas');
        var sW = 64, sH = Math.round(64 * (h / w));
        canvas.width = sW;
        canvas.height = sH;
        var ctx = canvas.getContext('2d');

        try {
            if (mediaObj.type === 'video') {
                ctx.drawImage(mediaObj.element, 0, 0, sW, sH);
            } else {
                ctx.drawImage(mediaObj.element, 0, 0, sW, sH);
            }
        } catch (e) {
            for (var i = 0; i < sW * sH * 4; i += 4) {
                ctx.fillStyle = 'hsl(' + ((i / 4) * 5 % 360) + ',60%,50%)';
                ctx.fillRect((i / 4) % sW, Math.floor((i / 4) / sW), 1, 1);
            }
        }

        var imgData = ctx.getImageData(0, 0, sW, sH);
        var pixels = imgData.data;
        var result = [];

        for (var i = 0; i < sampleCount; i++) {
            var px = Math.floor(seededRandom(i * 7.3) * sW);
            var py = Math.floor(seededRandom(i * 11.1) * sH);
            var idx = (py * sW + px) * 4;
            result.push({
                x: (px / sW - 0.5) * w,
                y: (0.5 - py / sH) * h,
                r: pixels[idx] / 255,
                g: pixels[idx + 1] / 255,
                b: pixels[idx + 2] / 255
            });
        }
        return result;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 5;
        var h = cardScale * 0.65;
        var density = this.settings.particleDensity / 100;
        var pSize = this.settings.particleSize;
        var totalParticles = Math.floor(800 + density * 2200);

        for (var img = 0; img < mediaList.length; img++) {
            var samples = sampleImageColors(mediaList[img], totalParticles, cardScale, h);

            var positions = new Float32Array(totalParticles * 3);
            var colors = new Float32Array(totalParticles * 3);
            var targetPositions = new Float32Array(totalParticles * 3);
            var dispersed = new Float32Array(totalParticles * 3);
            var delays = new Float32Array(totalParticles);

            for (var i = 0; i < totalParticles; i++) {
                var s = samples[i];
                targetPositions[i * 3] = s.x;
                targetPositions[i * 3 + 1] = s.y;
                targetPositions[i * 3 + 2] = 0;

                var dAngle = seededRandom(img * 1000 + i * 13.7) * Math.PI * 2;
                var dDist = 3 + seededRandom(img * 1000 + i * 17.1) * 8;
                dispersed[i * 3] = Math.cos(dAngle) * dDist;
                dispersed[i * 3 + 1] = Math.sin(dAngle) * dDist + (seededRandom(img * 1000 + i * 23.3) - 0.5) * 6;
                dispersed[i * 3 + 2] = (seededRandom(img * 1000 + i * 29.7) - 0.5) * 8;

                positions[i * 3] = dispersed[i * 3];
                positions[i * 3 + 1] = dispersed[i * 3 + 1];
                positions[i * 3 + 2] = dispersed[i * 3 + 2];

                colors[i * 3] = s.r;
                colors[i * 3 + 1] = s.g;
                colors[i * 3 + 2] = s.b;

                delays[i] = seededRandom(img * 1000 + i * 31.1) * 0.4;
            }

            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            var mat = new THREE.PointsMaterial({
                size: pSize * 0.02,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                sizeAttenuation: true
            });

            var points = new THREE.Points(geo, mat);
            points.userData = {
                imageIndex: img,
                targetPositions: targetPositions,
                dispersed: dispersed,
                delays: delays,
                totalParticles: totalParticles
            };
            points.visible = false;
            group.add(points);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var segDur = 1 / count;
        var disperse = this.settings.disperseForce / 100;
        var formSpd = this.settings.formSpeed / 100;

        for (var idx = 0; idx < count; idx++) {
            var points = this.group.children[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                points.visible = true;
                var lt = (t - segStart) / segDur;
                var d = points.userData;
                var pos = points.geometry.attributes.position.array;

                var formPhase, holdPhase, dispersePhase;
                if (lt < 0.35) {
                    formPhase = lt / 0.35;
                    holdPhase = 0;
                    dispersePhase = 0;
                } else if (lt < 0.65) {
                    formPhase = 1;
                    holdPhase = (lt - 0.35) / 0.3;
                    dispersePhase = 0;
                } else {
                    formPhase = 1;
                    holdPhase = 1;
                    dispersePhase = (lt - 0.65) / 0.35;
                }

                formPhase = Math.pow(formPhase, 1 / (0.5 + formSpd));
                dispersePhase = dispersePhase * dispersePhase;

                for (var i = 0; i < d.totalParticles; i++) {
                    var delay = d.delays[i];
                    var particleForm = Math.max(0, Math.min(1, (formPhase - delay) / (1 - delay)));
                    particleForm = particleForm * particleForm * (3 - 2 * particleForm);

                    var tx = d.targetPositions[i * 3];
                    var ty = d.targetPositions[i * 3 + 1];
                    var tz = d.targetPositions[i * 3 + 2];

                    var dx = d.dispersed[i * 3] * disperse;
                    var dy = d.dispersed[i * 3 + 1] * disperse;
                    var dz = d.dispersed[i * 3 + 2] * disperse;

                    if (dispersePhase > 0) {
                        var dp = Math.max(0, (dispersePhase - delay * 0.5) / (1 - delay * 0.5));
                        dp = Math.min(1, dp);
                        pos[i * 3] = tx + (dx - tx) * dp;
                        pos[i * 3 + 1] = ty + (dy - ty) * dp;
                        pos[i * 3 + 2] = tz + (dz - tz) * dp;
                    } else {
                        pos[i * 3] = dx + (tx - dx) * particleForm;
                        pos[i * 3 + 1] = dy + (ty - dy) * particleForm;
                        pos[i * 3 + 2] = dz + (tz - dz) * particleForm;
                    }

                    if (holdPhase > 0 && dispersePhase === 0) {
                        var jitter = 0.01 * (1 - particleForm * 0.8);
                        pos[i * 3] += Math.sin(t * 20 + i * 0.1) * jitter;
                        pos[i * 3 + 1] += Math.cos(t * 18 + i * 0.13) * jitter;
                    }
                }
                points.geometry.attributes.position.needsUpdate = true;

                points.material.opacity = dispersePhase > 0 ? Math.max(0, 0.9 - dispersePhase * 0.9) : Math.min(0.9, formPhase * 1.5);

                points.rotation.y = Math.sin(lt * Math.PI) * 0.15;
            } else {
                points.visible = false;
            }
        }
    };

    EP.Registry.register(effect);
})();
