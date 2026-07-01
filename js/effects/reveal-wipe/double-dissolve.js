(function() {
    var effect = new EP.EffectBase('double-dissolve', {
        name: 'Double Dissolve',
        category: 'reveal-wipe',
        icon: '🌫️',
        description: 'Disolucion doble capa — la imagen se disuelve con dos capas superpuestas en tiempos desfasados creando un efecto etéreo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'dissolveSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Speed', unit: '%' },
        { key: 'phaseOffset', type: 'range', min: 5, max: 50, default: 20, label: 'Phase Offset', unit: '%' },
        { key: 'noiseScale', type: 'range', min: 10, max: 100, default: 40, label: 'Noise Scale', unit: '%' },
        { key: 'glowColor', type: 'color', default: '#4488ff', label: 'Glow Color' },
        { key: 'holdTime', type: 'range', min: 10, max: 70, default: 35, label: 'Hold Time', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050510', label: 'Background' }
    ]);

    function createDissolveMask(size) {
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

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var mask1 = createDissolveMask(256);
        var mask2 = createDissolveMask(256);
        this._mask1 = mask1;
        this._mask2 = mask2;

        this._noiseGrid = [];
        for (var ny = 0; ny < 256; ny++) {
            for (var nx = 0; nx < 256; nx++) {
                this._noiseGrid.push(Math.random());
            }
        }

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

            var layerA = new THREE.Mesh(
                new THREE.PlaneGeometry(w, h),
                new THREE.MeshBasicMaterial({ map: tex, alphaMap: mask1.texture, transparent: true })
            );
            layerA.position.z = 0.02;
            layerA.userData = { imageIndex: img, isLayerA: true };
            layerA.visible = false;
            group.add(layerA);

            var layerB = new THREE.Mesh(
                new THREE.PlaneGeometry(w, h),
                new THREE.MeshBasicMaterial({ map: tex, alphaMap: mask2.texture, transparent: true, opacity: 0.6 })
            );
            layerB.position.z = 0.01;
            layerB.userData = { imageIndex: img, isLayerB: true };
            layerB.visible = false;
            group.add(layerB);

            var backMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(w, h),
                new THREE.MeshBasicMaterial({ map: tex, transparent: true })
            );
            backMesh.position.z = -0.02;
            backMesh.userData = { imageIndex: img, isBack: true };
            backMesh.visible = false;
            group.add(backMesh);
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

        var holdTime = this.settings.holdTime / 100;
        var phaseOffset = this.settings.phaseOffset / 100;
        var noiseScale = Math.max(1, Math.floor(this.settings.noiseScale / 100 * 8) + 1);
        var segDur = 1 / count;

        for (var idx = 0; idx < count; idx++) {
            var segStart = idx * segDur;
            var nextIdx = (idx + 1) % count;
            var inSegment = (t >= segStart && t < segStart + segDur);

            for (var c = 0; c < this.group.children.length; c++) {
                var ch = this.group.children[c];
                if (ch.userData.imageIndex === idx && ch.userData.isLayerA) ch.visible = inSegment;
                if (ch.userData.imageIndex === idx && ch.userData.isLayerB) ch.visible = inSegment;
                if (ch.userData.imageIndex === nextIdx && ch.userData.isBack) ch.visible = inSegment;
            }

            if (!inSegment) continue;
            var lt = (t - segStart) / segDur;

            var dissolveStart = holdTime;
            var progress1 = 0;
            var progress2 = 0;
            if (lt > dissolveStart) {
                progress1 = (lt - dissolveStart) / (1.0 - dissolveStart);
                progress2 = Math.max(0, progress1 - phaseOffset);
            }
            progress1 = Math.min(1, Math.max(0, progress1));
            progress2 = Math.min(1, Math.max(0, progress2));

            var s = 256;
            var ctx1 = this._mask1.ctx;
            var ctx2 = this._mask2.ctx;

            ctx1.fillStyle = '#ffffff';
            ctx1.fillRect(0, 0, s, s);
            ctx2.fillStyle = '#ffffff';
            ctx2.fillRect(0, 0, s, s);

            if (progress1 > 0 || progress2 > 0) {
                var imgData1 = ctx1.getImageData(0, 0, s, s);
                var imgData2 = ctx2.getImageData(0, 0, s, s);
                var d1 = imgData1.data;
                var d2 = imgData2.data;

                for (var py = 0; py < s; py++) {
                    for (var px = 0; px < s; px++) {
                        var nIdx = (Math.floor(py / noiseScale) * Math.floor(s / noiseScale) + Math.floor(px / noiseScale)) % this._noiseGrid.length;
                        var noise = this._noiseGrid[nIdx];
                        var pi = (py * s + px) * 4;

                        if (progress1 > 0 && noise < progress1 * 1.1) {
                            d1[pi + 3] = 0;
                        }
                        if (progress2 > 0 && noise < progress2 * 1.1) {
                            d2[pi + 3] = 0;
                        }
                    }
                }
                ctx1.putImageData(imgData1, 0, 0);
                ctx2.putImageData(imgData2, 0, 0);
            }

            this._mask1.texture.needsUpdate = true;
            this._mask2.texture.needsUpdate = true;

            for (var c2 = 0; c2 < this.group.children.length; c2++) {
                var mesh = this.group.children[c2];
                if (mesh.userData.imageIndex === idx) {
                    if (mesh.material.map) mesh.material.map.needsUpdate = true;
                }
                if (mesh.userData.imageIndex === nextIdx && mesh.userData.isBack) {
                    if (mesh.material.map) mesh.material.map.needsUpdate = true;
                }
            }
        }

        EP.Core.camera.position.set(0, 0, 7);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this._mask1) this._mask1.texture.dispose();
        if (this._mask2) this._mask2.texture.dispose();
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
