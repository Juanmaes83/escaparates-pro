(function() {
    var effect = new EP.EffectBase('morph-gallery', {
        name: 'Morph Gallery',
        category: 'reveal-wipe',
        icon: '🔄',
        description: 'Transicion morph suave entre imagenes — cada foto se deforma y fluye hacia la siguiente con distorsion organica'
    }, [
        { key: 'morphSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Morph Speed', unit: '%' },
        { key: 'distortion', type: 'range', min: 10, max: 100, default: 50, label: 'Distortion', unit: '%' },
        { key: 'waveCount', type: 'range', min: 1, max: 8, default: 3, step: 1, label: 'Waves' },
        { key: 'holdTime', type: 'range', min: 10, max: 70, default: 40, label: 'Hold Time', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080810', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

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

            var geo = new THREE.PlaneGeometry(w, h, 32, 32);
            var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            mesh.userData = { imageIndex: img, isImage: true, w: w, h: h };

            var origPos = new Float32Array(geo.attributes.position.array);
            mesh.userData.origPos = origPos;

            group.add(mesh);
        }

        this.group = group;
        this._imageCount = mediaList.length;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this._imageCount;
        if (count === 0) return;

        var distortion = this.settings.distortion / 100;
        var waveCount = this.settings.waveCount;
        var holdTime = this.settings.holdTime / 100;
        var segDur = 1 / count;

        for (var idx = 0; idx < this.group.children.length; idx++) {
            var mesh = this.group.children[idx];
            if (!mesh.userData.isImage) continue;

            var segStart = mesh.userData.imageIndex * segDur;
            if (t >= segStart && t < segStart + segDur) {
                mesh.visible = true;
                if (mesh.material.map) mesh.material.map.needsUpdate = true;

                var lt = (t - segStart) / segDur;
                var morphIn = 0;
                var morphOut = 0;

                var transInEnd = (1 - holdTime) * 0.4;
                var holdEnd = transInEnd + holdTime;

                if (lt < transInEnd) {
                    morphIn = 1.0 - lt / transInEnd;
                    morphIn = morphIn * morphIn;
                } else if (lt > holdEnd) {
                    morphOut = (lt - holdEnd) / (1.0 - holdEnd);
                    morphOut = morphOut * morphOut;
                }

                var morphAmount = Math.max(morphIn, morphOut);
                var arr = mesh.geometry.attributes.position.array;
                var orig = mesh.userData.origPos;

                for (var v = 0; v < arr.length; v += 3) {
                    var ox = orig[v];
                    var oy = orig[v + 1];

                    if (morphAmount > 0.01) {
                        var wave = Math.sin(ox * waveCount + time * 3) * Math.cos(oy * waveCount * 0.7 + time * 2);
                        arr[v] = ox + wave * distortion * morphAmount * 0.5;
                        arr[v + 1] = oy + Math.cos(ox * waveCount * 1.3 + oy + time * 2.5) * distortion * morphAmount * 0.4;
                        arr[v + 2] = wave * distortion * morphAmount * 0.8;
                    } else {
                        arr[v] = ox;
                        arr[v + 1] = oy;
                        arr[v + 2] = 0;
                    }
                }
                mesh.geometry.attributes.position.needsUpdate = true;

                mesh.material.opacity = Math.max(0, 1.0 - morphAmount * 0.8);
            } else {
                mesh.visible = false;
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.2) * 0.3,
            Math.cos(time * 0.15) * 0.2,
            7
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
