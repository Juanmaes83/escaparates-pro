(function() {
    var effect = new EP.EffectBase('sand-dissolve', {
        name: 'Sand Dissolve',
        category: 'motion',
        icon: '⏳',
        description: 'La imagen se desintegra en granos de arena que caen con gravedad — efecto disolucion tipo reloj de arena'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'gridSize', type: 'range', min: 8, max: 30, default: 16, step: 1, label: 'Grain Grid' },
        { key: 'fallSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Fall Speed', unit: '%' },
        { key: 'scatter', type: 'range', min: 0, max: 100, default: 40, label: 'Scatter', unit: '%' },
        { key: 'holdTime', type: 'range', min: 10, max: 70, default: 35, label: 'Hold Time', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var grid = this.settings.gridSize;
        var totalGrains = grid * grid;

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
            var w = aspect >= 1 ? 7 : 7 * aspect;
            var h = aspect >= 1 ? 7 / aspect : 7;

            var imgGroup = new THREE.Group();
            imgGroup.visible = false;
            imgGroup.userData = { imageIndex: img, isImageGroup: true };

            var grainW = w / grid;
            var grainH = h / grid;

            for (var row = 0; row < grid; row++) {
                for (var col = 0; col < grid; col++) {
                    var grainGeo = new THREE.PlaneGeometry(grainW * 0.95, grainH * 0.95);

                    var uStart = col / grid;
                    var vStart = 1.0 - (row + 1) / grid;
                    var uSize = 1 / grid;
                    var vSize = 1 / grid;

                    var uvAttr = grainGeo.attributes.uv;
                    for (var vi = 0; vi < uvAttr.count; vi++) {
                        var uu = uvAttr.getX(vi);
                        var vv = uvAttr.getY(vi);
                        uvAttr.setXY(vi, uStart + uu * uSize, vStart + vv * vSize);
                    }

                    var grainMat = new THREE.MeshBasicMaterial({
                        map: tex,
                        transparent: true
                    });

                    var grain = new THREE.Mesh(grainGeo, grainMat);
                    var posX = -w / 2 + col * grainW + grainW / 2;
                    var posY = h / 2 - row * grainH - grainH / 2;
                    grain.position.set(posX, posY, 0);

                    var noiseVal = Math.sin(col * 3.7 + row * 7.3) * 0.5 + 0.5;
                    var topBias = 1.0 - (row / grid);
                    var dissolveOrder = noiseVal * 0.6 + topBias * 0.4;

                    grain.userData = {
                        grainIndex: row * grid + col,
                        homeX: posX,
                        homeY: posY,
                        dissolveOrder: dissolveOrder,
                        driftX: (Math.random() - 0.5) * 2,
                        spinSpeed: (Math.random() - 0.5) * 5,
                        fallDelay: Math.random() * 0.2
                    };
                    imgGroup.add(grain);
                }
            }
            group.add(imgGroup);
        }

        var ambient = new THREE.AmbientLight(0xffffff, 0.8);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var fallSpeed = this.settings.fallSpeed / 100;
        var scatter = this.settings.scatter / 100;
        var holdTime = this.settings.holdTime / 100;

        var imgGroups = [];
        for (var i = 0; i < this.group.children.length; i++) {
            if (this.group.children[i].userData.isImageGroup) imgGroups.push(this.group.children[i]);
        }
        var count = imgGroups.length;
        if (count === 0) return;
        var segDur = 1 / count;

        for (var idx = 0; idx < count; idx++) {
            var segStart = idx * segDur;
            var ig = imgGroups[idx];

            if (t >= segStart && t < segStart + segDur) {
                ig.visible = true;
                var lt = (t - segStart) / segDur;

                var dissolveStart = holdTime;
                var dissolveProgress = 0;
                if (lt > dissolveStart) {
                    dissolveProgress = (lt - dissolveStart) / (1.0 - dissolveStart);
                }
                dissolveProgress = Math.min(1, Math.max(0, dissolveProgress));

                for (var g = 0; g < ig.children.length; g++) {
                    var grain = ig.children[g];
                    var gd = grain.userData;
                    if (grain.material.map) grain.material.map.needsUpdate = true;

                    if (dissolveProgress <= 0 || gd.dissolveOrder > dissolveProgress * 1.2) {
                        grain.position.x = gd.homeX;
                        grain.position.y = gd.homeY;
                        grain.position.z = 0;
                        grain.rotation.z = 0;
                        grain.material.opacity = 1;
                        continue;
                    }

                    var grainT = (dissolveProgress * 1.2 - gd.dissolveOrder);
                    grainT = Math.min(1, Math.max(0, grainT)) * 3;

                    var fallT = Math.max(0, grainT - gd.fallDelay);
                    grain.position.x = gd.homeX + gd.driftX * scatter * fallT * 0.3;
                    grain.position.y = gd.homeY - fallT * fallT * fallSpeed * 2;
                    grain.position.z = Math.sin(fallT * 3 + gd.grainIndex) * scatter * 0.1;
                    grain.rotation.z = fallT * gd.spinSpeed;

                    var scale = Math.max(0, 1 - fallT * 0.4);
                    grain.scale.set(scale, scale, 1);
                    grain.material.opacity = Math.max(0, 1 - fallT * 0.6);
                }
            } else {
                ig.visible = false;
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
                var ig = this.group.children[i];
                if (!ig.children) continue;
                for (var j = 0; j < ig.children.length; j++) {
                    var m = ig.children[j];
                    if (m.material && m.material.map) m.material.map.dispose();
                }
            }
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
