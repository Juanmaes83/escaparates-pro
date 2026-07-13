(function() {
    var effect = new EP.EffectBase('fur-texture-image-pro', {
        name: 'Fur Texture Canvas Preview',
        category: 'motion',
        icon: 'FU',
        description: 'Preview ligero para canvas. El motor Fur fuente completo vive en Source Labs.'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'hairsPerPixel', type: 'range', min: 1, max: 7, default: 3, label: 'Hairs / Pixel' },
        { key: 'hairLength', type: 'range', min: 2, max: 28, default: 11, label: 'Hair Length', unit: 'px' },
        { key: 'density', type: 'range', min: 15, max: 100, default: 62, label: 'Density', unit: '%' },
        { key: 'colorVariation', type: 'range', min: 0, max: 100, default: 28, label: 'Color Variation', unit: '%' },
        { key: 'wind', type: 'range', min: 0, max: 100, default: 24, label: 'Wind', unit: '%' },
        { key: 'direction', type: 'select', options: ['Natural', 'Left', 'Right', 'Up', 'Down'], default: 'Natural', label: 'Fur Direction' },
        { key: 'background', type: 'color', default: '#121014', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true, supportsVideo: true, usesCamera: true,
        usesPostProcessing: false, usesParticlesShaders: false, mobileRisk: 'high',
        minMedia: 1, exportSafe: true, hasErrorBoundary: true
    };

    function clamp(v, low, high) { return Math.max(low, Math.min(high, v)); }
    function random(x, y, seed) { return (Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453) % 1; }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._furCanvas = document.createElement('canvas');
        this._furCtx = this._furCanvas.getContext('2d', { willReadFrequently: true });
        this._furTexture = new THREE.CanvasTexture(this._furCanvas);
        this._furTexture.minFilter = THREE.LinearFilter;
        this._furTexture.magFilter = THREE.LinearFilter;
        this._furMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: this._furTexture, transparent: true }));
        group.add(this._furMesh);
        this._furMedia = mediaList || [];
        this._furLast = -1;
        this.group = group;
        return group;
    };

    effect._renderFur = function(time, loopDuration) {
        var media = this._furMedia || [];
        if (!media.length || !this._furCtx) return;
        var item = media[Math.min(media.length - 1, Math.floor((time / Math.max(0.01, loopDuration)) * media.length))];
        var el = item && item.element;
        if (!el) return;
        var sw = el.videoWidth || el.naturalWidth || el.width || 1;
        var sh = el.videoHeight || el.naturalHeight || el.height || 1;
        var mobile = EP.DeviceProfile && EP.DeviceProfile.get().type !== 'desktop';
        var outW = Math.min(mobile ? 360 : 520, Math.max(180, sw));
        var outH = Math.max(140, Math.round(outW * sh / sw));
        if (outH > (mobile ? 420 : 580)) { outH = mobile ? 420 : 580; outW = Math.round(outH * sw / sh); }
        var sampleW = Math.max(52, Math.round(outW / 4));
        var sampleH = Math.max(42, Math.round(outH / 4));
        var sample = document.createElement('canvas');
        sample.width = sampleW; sample.height = sampleH;
        var sctx = sample.getContext('2d', { willReadFrequently: true });
        try { sctx.drawImage(el, 0, 0, sampleW, sampleH); } catch (e) { return; }
        var data;
        try { data = sctx.getImageData(0, 0, sampleW, sampleH).data; } catch (e2) { return; }
        if (this._furCanvas.width !== outW || this._furCanvas.height !== outH) { this._furCanvas.width = outW; this._furCanvas.height = outH; }
        var ctx = this._furCtx;
        ctx.fillStyle = this.settings.background;
        ctx.fillRect(0, 0, outW, outH);
        ctx.globalAlpha = 0.25;
        try { ctx.drawImage(el, 0, 0, outW, outH); } catch (e3) {}
        ctx.globalAlpha = 1;
        ctx.lineCap = 'round';
        var scaleX = outW / sampleW, scaleY = outH / sampleH;
        var mobileHairs = EP.DeviceProfile && EP.DeviceProfile.isMobile ? 3 : 7;
        var hairs = Math.min(this.settings.hairsPerPixel, mobileHairs);
        var stride = Math.max(1, Math.round(7 - this.settings.density / 18));
        var variation = this.settings.colorVariation / 100;
        var speed = this.settings.playbackMotion === 'on' ? this.settings.playbackMotionSpeed / 100 : 0;
        var wind = this.settings.wind / 100;
        var phase = time * speed * 2.4;
        var baseAngle = this.settings.direction === 'Left' ? Math.PI : this.settings.direction === 'Right' ? 0 : this.settings.direction === 'Up' ? -Math.PI / 2 : this.settings.direction === 'Down' ? Math.PI / 2 : -0.35;
        for (var y = 0; y < sampleH; y += stride) {
            for (var x = 0; x < sampleW; x += stride) {
                var idx = (y * sampleW + x) * 4;
                var r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
                if (a < 20) continue;
                for (var h = 0; h < hairs; h++) {
                    var seed = h + x * 0.17 + y * 0.37;
                    var n = random(x, y, seed);
                    var px = (x + n) * scaleX;
                    var py = (y + random(y, x, seed + 3)) * scaleY;
                    var length = this.settings.hairLength * (0.45 + n) * (0.8 + this.settings.density / 500);
                    var angle = baseAngle + (random(x, y, seed + 5) - 0.5) * 1.6 + Math.sin(phase + y * 0.12) * wind * 0.7;
                    var tint = (random(x, y, seed + 9) - 0.5) * 100 * variation;
                    ctx.strokeStyle = 'rgba(' + clamp(Math.round(r + tint), 0, 255) + ',' + clamp(Math.round(g + tint), 0, 255) + ',' + clamp(Math.round(b + tint), 0, 255) + ',' + (0.2 + 0.55 * n) + ')';
                    ctx.lineWidth = Math.max(0.45, 1.7 - n);
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.quadraticCurveTo(px + Math.cos(angle + 0.5) * length * 0.45, py + Math.sin(angle + 0.5) * length * 0.45, px + Math.cos(angle) * length, py + Math.sin(angle) * length);
                    ctx.stroke();
                }
            }
        }
        this._furTexture.needsUpdate = true;
        var aspect = outW / Math.max(1, outH);
        this._furMesh.scale.set(aspect >= 1 ? 1 : aspect, aspect >= 1 ? 1 / aspect : 1, 1);
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._furMesh) return;
        if (this._furLast < 0 || time < this._furLast || time - this._furLast > 0.22 || this.settings.playbackMotion === 'off') {
            this._renderFur(time, loopDuration);
            this._furLast = time;
        }
        EP.Core.camera.position.set(0, 0, 7.2);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this._furTexture) this._furTexture.dispose();
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
