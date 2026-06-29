(function() {
    var effect = new EP.EffectBase('squiggle-deformer', {
        name: 'Squiggle Deformer',
        category: 'motion',
        icon: '〰️',
        description: 'Deformacion ondulante tipo squiggle sobre imagenes — ondas sinusoidales animadas con ruido'
    }, [
        { key: 'amplitude', type: 'range', min: 1, max: 50, default: 12, label: 'Amplitude', unit: 'px' },
        { key: 'frequency', type: 'range', min: 1, max: 30, default: 8, label: 'Frequency' },
        { key: 'noise', type: 'range', min: 0, max: 100, default: 20, label: 'Noise', unit: '%' },
        { key: 'animSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Speed', unit: '%' },
        { key: 'direction', type: 'select', options: ['Horizontal', 'Vertical', 'Both'], default: 'Both', label: 'Direction' },
        { key: 'overlay', type: 'select', options: ['Off', 'Lines', 'Grid'], default: 'Off', label: 'Overlay' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function simplex2d(x, y) {
        var s = (x + y) * 0.3660254;
        var i = Math.floor(x + s);
        var j = Math.floor(y + s);
        var t = (i + j) * 0.2113249;
        var x0 = x - (i - t);
        var y0 = y - (j - t);
        return (Math.sin(x0 * 12.9898 + y0 * 78.233) * 43758.5453) % 1;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        for (var img = 0; img < mediaList.length; img++) {
            var mat = EP.Media.createMaterial(mediaList[img]);
            mat.transparent = true;
            var aspect = 1;
            if (mediaList[img].element) {
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || mediaList[img].element.width || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || mediaList[img].element.height || 1;
                aspect = ew / eh;
            }
            var w, h;
            if (aspect >= 1) { w = 8; h = 8 / aspect; }
            else { h = 8; w = 8 * aspect; }

            var geo = new THREE.PlaneGeometry(w, h);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            mesh.userData = { imageIndex: img, aspect: aspect };
            group.add(mesh);
        }

        this._squiggleCanvas = document.createElement('canvas');
        this._squiggleCtx = this._squiggleCanvas.getContext('2d');
        this._squiggleTexture = new THREE.CanvasTexture(this._squiggleCanvas);
        this._squiggleTexture.minFilter = THREE.LinearFilter;
        this._squiggleTexture.magFilter = THREE.LinearFilter;

        this._overlayCanvas = document.createElement('canvas');
        this._overlayCtx = this._overlayCanvas.getContext('2d');

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var meshes = [];
        for (var i = 0; i < this.group.children.length; i++) {
            if (this.group.children[i].userData.imageIndex !== undefined) meshes.push(this.group.children[i]);
        }
        var count = meshes.length;
        if (count === 0) return;
        var segDur = 1 / count;

        var amp = this.settings.amplitude;
        var freq = this.settings.frequency * 0.05;
        var noiseAmt = this.settings.noise / 100;
        var speed = this.settings.animSpeed / 100;
        var dir = this.settings.direction;
        var overlay = this.settings.overlay;

        for (var idx = 0; idx < count; idx++) {
            var mesh = meshes[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                mesh.visible = true;

                var media = null;
                try {
                    var mediaList = EP.Media.getAll ? EP.Media.getAll() : null;
                    if (mediaList && mediaList[idx]) media = mediaList[idx];
                } catch(e) {}

                if (media && media.element && this._squiggleCtx) {
                    var el = media.element;
                    var sw = el.videoWidth || el.naturalWidth || el.width || 200;
                    var sh = el.videoHeight || el.naturalHeight || el.height || 200;
                    var maxDim = 300;
                    var sc = Math.min(maxDim / sw, maxDim / sh, 1);
                    var dw = Math.floor(sw * sc);
                    var dh = Math.floor(sh * sc);

                    this._squiggleCanvas.width = dw;
                    this._squiggleCanvas.height = dh;

                    try {
                        this._squiggleCtx.drawImage(el, 0, 0, dw, dh);
                        var srcData = this._squiggleCtx.getImageData(0, 0, dw, dh);
                        var dstData = this._squiggleCtx.createImageData(dw, dh);
                        var src = srcData.data;
                        var dst = dstData.data;
                        var animT = time * speed * 2;

                        for (var py = 0; py < dh; py++) {
                            for (var px = 0; px < dw; px++) {
                                var nx = px / dw;
                                var ny = py / dh;
                                var noiseVal = simplex2d(nx * 5 + animT * 0.3, ny * 5) * noiseAmt;

                                var offX = 0, offY = 0;
                                if (dir === 'Horizontal' || dir === 'Both') {
                                    offX = Math.sin(ny * freq * 60 + animT) * amp * (1 + noiseVal);
                                }
                                if (dir === 'Vertical' || dir === 'Both') {
                                    offY = Math.sin(nx * freq * 60 + animT * 0.8) * amp * 0.7 * (1 + noiseVal);
                                }

                                var sx = Math.round(px + offX);
                                var sy = Math.round(py + offY);
                                sx = Math.max(0, Math.min(dw - 1, sx));
                                sy = Math.max(0, Math.min(dh - 1, sy));

                                var di = (py * dw + px) * 4;
                                var si = (sy * dw + sx) * 4;
                                dst[di] = src[si];
                                dst[di + 1] = src[si + 1];
                                dst[di + 2] = src[si + 2];
                                dst[di + 3] = src[si + 3];
                            }
                        }

                        this._squiggleCtx.putImageData(dstData, 0, 0);

                        if (overlay !== 'Off') {
                            this._squiggleCtx.strokeStyle = 'rgba(255,255,255,0.15)';
                            this._squiggleCtx.lineWidth = 1;
                            var step = overlay === 'Grid' ? 12 : 20;
                            for (var ly = 0; ly < dh; ly += step) {
                                this._squiggleCtx.beginPath();
                                for (var lx = 0; lx < dw; lx++) {
                                    var lnx = lx / dw;
                                    var lny = ly / dh;
                                    var loff = Math.sin(lny * freq * 60 + animT) * amp;
                                    if (lx === 0) this._squiggleCtx.moveTo(lx + loff, ly);
                                    else this._squiggleCtx.lineTo(lx + loff, ly);
                                }
                                this._squiggleCtx.stroke();
                            }
                            if (overlay === 'Grid') {
                                for (var lx2 = 0; lx2 < dw; lx2 += step) {
                                    this._squiggleCtx.beginPath();
                                    for (var ly2 = 0; ly2 < dh; ly2++) {
                                        var lnx2 = lx2 / dw;
                                        var lny2 = ly2 / dh;
                                        var loff2 = Math.sin(lnx2 * freq * 60 + animT * 0.8) * amp * 0.7;
                                        if (ly2 === 0) this._squiggleCtx.moveTo(lx2, ly2 + loff2);
                                        else this._squiggleCtx.lineTo(lx2, ly2 + loff2);
                                    }
                                    this._squiggleCtx.stroke();
                                }
                            }
                        }

                        this._squiggleTexture.needsUpdate = true;
                        mesh.material.map = this._squiggleTexture;
                        mesh.material.needsUpdate = true;
                    } catch(e) {}
                }

                var lt = (t - segStart) / segDur;
                var appear = lt < 0.12 ? lt / 0.12 : 1;
                var disappear = lt > 0.88 ? (lt - 0.88) / 0.12 : 0;
                mesh.material.opacity = appear * (1 - disappear);

                EP.Core.camera.position.z = 6;
                EP.Core.camera.position.x = 0;
                EP.Core.camera.position.y = 0;
                EP.Core.camera.lookAt(0, 0, 0);
            } else {
                mesh.visible = false;
            }
        }
    };

    effect.dispose = function() {
        if (this._squiggleTexture) this._squiggleTexture.dispose();
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
