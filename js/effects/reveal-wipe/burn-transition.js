(function() {
    var effect = new EP.EffectBase('burn-transition', {
        name: 'Burn Transition',
        category: 'reveal-wipe',
        icon: '🔥',
        description: 'La imagen se quema revelando la siguiente — efecto fuego con borde incandescente y cenizas'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'burnSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Burn Speed', unit: '%' },
        { key: 'burnDirection', type: 'range', min: 1, max: 4, default: 1, step: 1, label: 'Direction (1=bottom, 2=top, 3=left, 4=center)' },
        { key: 'edgeGlow', type: 'range', min: 0, max: 100, default: 70, label: 'Edge Glow', unit: '%' },
        { key: 'ashAmount', type: 'range', min: 0, max: 100, default: 40, label: 'Ash Particles', unit: '%' },
        { key: 'holdTime', type: 'range', min: 10, max: 80, default: 40, label: 'Hold Time', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    function createBurnMask(size) {
        var cvs = document.createElement('canvas');
        cvs.width = size;
        cvs.height = size;
        var ctx = cvs.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        var tex = new THREE.CanvasTexture(cvs);
        tex.minFilter = THREE.LinearFilter;
        return { canvas: cvs, ctx: ctx, texture: tex };
    }

    function simpleNoise(x, y) {
        var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var burnMask = createBurnMask(256);
        this._burnMask = burnMask;

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
            var w = aspect >= 1 ? 8 : 8 * aspect;
            var h = aspect >= 1 ? 8 / aspect : 8;

            var backMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
            var backMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), backMat);
            backMesh.position.z = -0.05;
            backMesh.visible = false;
            backMesh.userData = { imageIndex: img, isBack: true };
            group.add(backMesh);

            var frontMat = new THREE.MeshBasicMaterial({
                map: tex,
                alphaMap: burnMask.texture,
                transparent: true
            });
            var frontMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), frontMat);
            frontMesh.position.z = 0.05;
            frontMesh.visible = false;
            frontMesh.userData = { imageIndex: img, isFront: true };
            group.add(frontMesh);
        }

        var ashGroup = new THREE.Group();
        ashGroup.userData = { isAsh: true };
        var ashGeo = new THREE.PlaneGeometry(0.06, 0.06);
        for (var a = 0; a < 80; a++) {
            var ashMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.08, 0.8, 0.15 + Math.random() * 0.3),
                transparent: true,
                opacity: 0
            });
            var ash = new THREE.Mesh(ashGeo, ashMat);
            ash.userData = {
                ashIndex: a,
                startX: (Math.random() - 0.5) * 6,
                startY: (Math.random() - 0.5) * 4,
                driftX: (Math.random() - 0.5) * 2,
                riseSpeed: 0.5 + Math.random() * 1.5,
                phase: Math.random()
            };
            ashGroup.add(ash);
        }
        group.add(ashGroup);

        var light = new THREE.PointLight(0xff6600, 0, 10);
        light.position.set(0, -2, 3);
        light.userData = { isFireLight: true };
        group.add(light);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var burnDir = this.settings.burnDirection;
        var edgeGlow = this.settings.edgeGlow / 100;
        var ashAmount = this.settings.ashAmount / 100;
        var holdTime = this.settings.holdTime / 100;

        var fronts = [];
        var backs = [];
        var ashGroup = null;
        var fireLight = null;

        for (var i = 0; i < this.group.children.length; i++) {
            var c = this.group.children[i];
            if (c.userData.isFront) fronts.push(c);
            if (c.userData.isBack) backs.push(c);
            if (c.userData.isAsh) ashGroup = c;
            if (c.userData.isFireLight) fireLight = c;
        }

        var count = fronts.length;
        if (count === 0) return;
        var segDur = 1 / count;

        for (var idx = 0; idx < count; idx++) {
            var segStart = idx * segDur;
            var nextIdx = (idx + 1) % count;

            if (t >= segStart && t < segStart + segDur) {
                var lt = (t - segStart) / segDur;

                fronts[idx].visible = true;
                backs[nextIdx].visible = true;
                if (fronts[idx].material.map) fronts[idx].material.map.needsUpdate = true;
                if (backs[nextIdx].material.map) backs[nextIdx].material.map.needsUpdate = true;

                var burnPhase = 0.3;
                var holdEnd = burnPhase + holdTime * (1 - burnPhase);
                var burnProgress = 0;

                if (lt < burnPhase) {
                    burnProgress = 0;
                } else if (lt < holdEnd) {
                    burnProgress = 0;
                } else {
                    burnProgress = (lt - holdEnd) / (1.0 - holdEnd);
                }
                burnProgress = Math.min(1, Math.max(0, burnProgress));

                var cvs = this._burnMask.canvas;
                var ctx = this._burnMask.ctx;
                var s = cvs.width;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, s, s);

                if (burnProgress > 0) {
                    var imgData = ctx.getImageData(0, 0, s, s);
                    var data = imgData.data;

                    for (var py = 0; py < s; py++) {
                        for (var px = 0; px < s; px++) {
                            var u = px / s;
                            var v = py / s;
                            var threshold;

                            if (burnDir === 1) threshold = 1.0 - v;
                            else if (burnDir === 2) threshold = v;
                            else if (burnDir === 3) threshold = u;
                            else {
                                var dx = u - 0.5, dy = v - 0.5;
                                threshold = 1.0 - Math.sqrt(dx * dx + dy * dy) * 2;
                            }

                            var noise = simpleNoise(px * 0.05, py * 0.05) * 0.3;
                            threshold += noise;

                            var pidx = (py * s + px) * 4;
                            if (threshold < burnProgress * 1.3) {
                                data[pidx + 3] = 0;
                            } else if (threshold < burnProgress * 1.3 + 0.08) {
                                data[pidx] = 255;
                                data[pidx + 1] = Math.floor(100 + edgeGlow * 100);
                                data[pidx + 2] = 0;
                                data[pidx + 3] = 255;
                            }
                        }
                    }
                    ctx.putImageData(imgData, 0, 0);
                }

                this._burnMask.texture.needsUpdate = true;

                if (fireLight) {
                    fireLight.intensity = burnProgress * edgeGlow * 2;
                    fireLight.color.setHSL(0.08, 1, 0.5);
                }

                if (ashGroup && burnProgress > 0.1) {
                    for (var ai = 0; ai < ashGroup.children.length; ai++) {
                        var ash = ashGroup.children[ai];
                        var ad = ash.userData;
                        if (ad.phase > burnProgress) {
                            ash.material.opacity = 0;
                            continue;
                        }
                        var at = (burnProgress - ad.phase) * 3;
                        ash.position.x = ad.startX + ad.driftX * at;
                        ash.position.y = ad.startY + at * ad.riseSpeed;
                        ash.position.z = 0.2;
                        ash.material.opacity = Math.max(0, (1 - at) * ashAmount);
                        ash.rotation.z = time * 2 + ai;
                    }
                }
            } else {
                fronts[idx].visible = false;
                backs[idx].visible = false;
            }
        }

        EP.Core.camera.position.set(0, 0, 7);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this.group) {
            for (var i = 0; i < this.group.children.length; i++) {
                var m = this.group.children[i];
                if (m.material && m.material.map) m.material.map.dispose();
            }
        }
        if (this._burnMask) this._burnMask.texture.dispose();
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
