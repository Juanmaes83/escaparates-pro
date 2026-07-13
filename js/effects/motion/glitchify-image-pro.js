(function() {
    var effect = new EP.EffectBase('glitchify-image-pro', {
        name: 'Glitchify Canvas Preview',
        category: 'motion',
        icon: 'GI',
        description: 'Preview ligero para canvas. El motor Glitchify fuente completo vive en Source Labs.'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'intensity', type: 'range', min: 0, max: 100, default: 44, label: 'Intensity', unit: '%' },
        { key: 'dataCorruption', type: 'range', min: 0, max: 100, default: 38, label: 'Data Corruption', unit: '%' },
        { key: 'redShift', type: 'range', min: 0, max: 36, default: 12, label: 'Red Shift', unit: 'px' },
        { key: 'blueShift', type: 'range', min: 0, max: 36, default: 16, label: 'Blue Shift', unit: 'px' },
        { key: 'waveDeform', type: 'range', min: 0, max: 100, default: 35, label: 'Wave Deform', unit: '%' },
        { key: 'dithering', type: 'range', min: 0, max: 100, default: 18, label: 'Dithering', unit: '%' },
        { key: 'paletteReduction', type: 'range', min: 2, max: 32, default: 12, label: 'Palette Reduction', unit: 'colors' },
        { key: 'pixelSort', type: 'select', options: [{ v: 'off', l: 'Pixel Sort Off' }, { v: 'brightness', l: 'Pixel Sort Brightness' }, { v: 'red', l: 'Pixel Sort Red channel' }], default: 'off', label: 'Pixel Sort' },
        { key: 'background', type: 'color', default: '#09070c', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true, supportsVideo: true, usesCamera: true,
        usesPostProcessing: false, usesParticlesShaders: false, mobileRisk: 'medium',
        minMedia: 1, exportSafe: true, hasErrorBoundary: true
    };

    function dimensions(el) {
        var w = el && (el.videoWidth || el.naturalWidth || el.width) || 1;
        var h = el && (el.videoHeight || el.naturalHeight || el.height) || 1;
        return { w: w, h: h, aspect: w / Math.max(1, h) };
    }

    function clamp(v, low, high) { return Math.max(low, Math.min(high, v)); }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._glitchCanvas = document.createElement('canvas');
        this._glitchCanvas.width = 480;
        this._glitchCanvas.height = 480;
        this._glitchCtx = this._glitchCanvas.getContext('2d', { willReadFrequently: true });
        this._glitchTexture = new THREE.CanvasTexture(this._glitchCanvas);
        this._glitchTexture.minFilter = THREE.LinearFilter;
        this._glitchTexture.magFilter = THREE.LinearFilter;
        this._glitchMaterial = new THREE.MeshBasicMaterial({ map: this._glitchTexture, transparent: true });
        this._glitchMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), this._glitchMaterial);
        group.add(this._glitchMesh);
        this._glitchMedia = mediaList || [];
        this._glitchLast = -1;
        this.group = group;
        return group;
    };

    effect._draw = function(time, loopDuration) {
        var media = this._glitchMedia || [];
        if (!media.length || !this._glitchCtx) return;
        var index = Math.min(media.length - 1, Math.floor((time / Math.max(0.01, loopDuration)) * media.length));
        var item = media[index];
        var el = item && item.element;
        if (!el) return;
        var size = dimensions(el);
        var max = (EP.DeviceProfile && EP.DeviceProfile.get().type !== 'desktop') ? 360 : 520;
        var w = Math.max(160, Math.round(Math.min(max, size.w)));
        var h = Math.max(120, Math.round(w / Math.max(0.2, size.aspect)));
        if (h > max) { h = max; w = Math.round(h * size.aspect); }
        if (this._glitchCanvas.width !== w || this._glitchCanvas.height !== h) {
            this._glitchCanvas.width = w;
            this._glitchCanvas.height = h;
        }
        var ctx = this._glitchCtx;
        ctx.fillStyle = this.settings.background;
        ctx.fillRect(0, 0, w, h);
        try { ctx.drawImage(el, 0, 0, w, h); } catch (e) { return; }
        var source;
        try { source = ctx.getImageData(0, 0, w, h); } catch (e2) { return; }
        var src = source.data;
        var output = ctx.createImageData(w, h);
        var dst = output.data;
        var intensity = this.settings.intensity / 100;
        var corruption = this.settings.dataCorruption / 100;
        var wave = this.settings.waveDeform / 100;
        var red = Math.round(this.settings.redShift * intensity);
        var blue = Math.round(this.settings.blueShift * intensity);
        var speed = this.settings.playbackMotion === 'on' ? this.settings.playbackMotionSpeed / 100 : 0;
        var phase = time * speed * 4;
        var levels = Math.max(2, this.settings.paletteReduction - Math.round(this.settings.dithering / 12));
        var dither = this.settings.dithering / 100;
        for (var y = 0; y < h; y++) {
            var lineShift = Math.sin(y * 0.11 + phase) * wave * 22;
            if ((y % 19) < Math.floor(corruption * 12)) lineShift += Math.sin(y * 3.1 + phase * 2) * corruption * 52;
            for (var x = 0; x < w; x++) {
                var sx = clamp(Math.round(x + lineShift), 0, w - 1);
                var rx = clamp(sx + red, 0, w - 1);
                var bx = clamp(sx - blue, 0, w - 1);
                var di = (y * w + x) * 4;
                var ri = (y * w + rx) * 4;
                var gi = (y * w + sx) * 4;
                var bi = (y * w + bx) * 4;
                var noise = (((x * 17 + y * 31 + Math.floor(phase * 13)) % 9) - 4) * dither * 12;
                dst[di] = clamp(Math.round(src[ri] / 255 * (levels - 1)) * 255 / (levels - 1) + noise, 0, 255);
                dst[di + 1] = clamp(Math.round(src[gi + 1] / 255 * (levels - 1)) * 255 / (levels - 1) + noise, 0, 255);
                dst[di + 2] = clamp(Math.round(src[bi + 2] / 255 * (levels - 1)) * 255 / (levels - 1) + noise, 0, 255);
                dst[di + 3] = src[gi + 3];
            }
        }
        if (this.settings.pixelSort !== 'off') {
            for (var row = 0; row < h; row += 9) {
                var start = ((row + Math.floor(phase * 3)) % h) * w * 4;
                var length = Math.min(w, 40 + Math.round(corruption * 120));
                var pixels = [];
                for (var p = 0; p < length; p++) pixels.push([dst[start + p * 4], dst[start + p * 4 + 1], dst[start + p * 4 + 2], dst[start + p * 4 + 3]]);
                pixels.sort(function(a, b) {
                    return this.settings.pixelSort === 'red' ? a[0] - b[0] : (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]);
                }.bind(this));
                for (var q = 0; q < pixels.length; q++) {
                    dst[start + q * 4] = pixels[q][0]; dst[start + q * 4 + 1] = pixels[q][1];
                    dst[start + q * 4 + 2] = pixels[q][2]; dst[start + q * 4 + 3] = pixels[q][3];
                }
            }
        }
        ctx.putImageData(output, 0, 0);
        this._glitchTexture.needsUpdate = true;
        var aspect = w / Math.max(1, h);
        this._glitchMesh.scale.set(aspect >= 1 ? 1 : aspect, aspect >= 1 ? 1 / aspect : 1, 1);
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._glitchMesh) return;
        if (this._glitchLast < 0 || time < this._glitchLast || time - this._glitchLast > 0.075 || this.settings.playbackMotion === 'off') {
            this._draw(time, loopDuration);
            this._glitchLast = time;
        }
        EP.Core.camera.position.set(0, 0, 7.2);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this._glitchTexture) this._glitchTexture.dispose();
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
