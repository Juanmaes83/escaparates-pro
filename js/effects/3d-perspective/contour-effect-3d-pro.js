(function() {
    var effect = new EP.EffectBase('contour-effect-3d-pro', {
        name: 'Contour Effect 3D Pro', category: '3d-perspective', icon: 'CE',
        description: 'Imagen o video reconstruido con lineas 3D, filtros tonales y actualizacion dinamica'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 200, default: 46, step: 1, label: 'Motion', unit: '%' },
        { key: 'cardSize', type: 'range', min: 55, max: 150, default: 108, step: 1, label: 'Effect Size', unit: '%' },
        { key: 'lines', type: 'range', min: 20, max: 500, default: 180, step: 5, label: 'Lines' },
        { key: 'resolution', type: 'range', min: 30, max: 420, default: 150, step: 5, label: 'Resolution' },
        { key: 'displacementY', type: 'range', min: 0, max: 200, default: 28, step: 1, label: 'Vertical Relief', unit: '%' },
        { key: 'displacementZ', type: 'range', min: 0, max: 200, default: 64, step: 1, label: 'Depth Relief', unit: '%' },
        { key: 'lineWidth', type: 'range', min: 1, max: 10, default: 1, step: 1, label: 'Line Width' },
        { key: 'lineOpacity', type: 'range', min: 5, max: 100, default: 96, step: 1, label: 'Line Opacity', unit: '%' },
        { key: 'lineAngle', type: 'range', min: -180, max: 180, default: 0, step: 1, label: 'Line Angle', unit: 'deg' },
        { key: 'colorBoost', type: 'range', min: 50, max: 200, default: 100, step: 1, label: 'Color Boost', unit: '%' },
        { key: 'contrast', type: 'range', min: 20, max: 220, default: 100, step: 1, label: 'Contrast', unit: '%' },
        { key: 'saturation', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Saturation', unit: '%' },
        { key: 'monochrome', type: 'select', options: [{ v: 'off', l: 'Full color' }, { v: 'on', l: 'Black and white' }], default: 'off', label: 'Color Mode' },
        { key: 'invert', type: 'select', options: [{ v: 'off', l: 'Natural' }, { v: 'on', l: 'Invert colors' }], default: 'off', label: 'Invert' },
        { key: 'videoRefresh', type: 'select', options: [{ v: 'on', l: 'Live video contours' }, { v: 'off', l: 'Poster frame' }], default: 'on', label: 'Video Refresh' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);
    effect.capabilities = Object.assign(effect.capabilities, { supportsVideo: true, mobileRisk: 'high' });

    function sample(media, maxSide) {
        var el = media.element, w = el.videoWidth || el.naturalWidth || el.width || 1, h = el.videoHeight || el.naturalHeight || el.height || 1;
        var aspect = w / h, scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(el, 0, 0, w, h);
        return { data: ctx.getImageData(0, 0, w, h).data, width: w, height: h, aspect: aspect };
    }
    function tunedColor(r, g, b, s) {
        var contrast = s.contrast / 100, saturation = s.saturation / 100;
        r = (r - .5) * contrast + .5; g = (g - .5) * contrast + .5; b = (b - .5) * contrast + .5;
        var l = .299 * r + .587 * g + .114 * b;
        r = l + (r - l) * saturation; g = l + (g - l) * saturation; b = l + (b - l) * saturation;
        if (s.monochrome === 'on') r = g = b = l;
        if (s.invert === 'on') { r = 1 - r; g = 1 - g; b = 1 - b; }
        return [Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, b))];
    }
    effect._buildLines = function(media) {
        if (!this.group || !media) return;
        while (this.group.children.length) {
            var old = this.group.children.pop(); old.geometry.dispose(); if (old.material) old.material.dispose();
        }
        var profile = EP.DeviceProfile ? EP.DeviceProfile.get() : null;
        var cap = profile && profile.lowPower ? 220 : 420;
        var s = this.settings, data = sample(media, cap), planeW = 7.2, planeH = planeW / data.aspect;
        var lineCount = Math.floor(s.lines), resolution = Math.floor(s.resolution);
        if (profile && profile.lowPower) { lineCount = Math.min(lineCount, 140); resolution = Math.min(resolution, 120); }
        var material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: s.lineOpacity / 100, linewidth: s.lineWidth });
        var boost = s.colorBoost / 100, yRelief = s.displacementY / 100, zRelief = s.displacementZ / 100;
        for (var i = 0; i < lineCount; i++) {
            var pos = [], colors = [], y = (i / Math.max(1, lineCount - 1) - .5) * planeH;
            for (var j = 0; j < resolution; j++) {
                var u = j / Math.max(1, resolution - 1), px = Math.min(data.width - 1, Math.floor(u * data.width)), py = Math.min(data.height - 1, Math.floor(i / Math.max(1, lineCount - 1) * data.height));
                var idx = (py * data.width + px) * 4, c = tunedColor(data.data[idx] / 255, data.data[idx + 1] / 255, data.data[idx + 2] / 255, s);
                var lum = .299 * c[0] + .587 * c[1] + .114 * c[2];
                pos.push((u - .5) * planeW, y + lum * .26 * yRelief, lum * 1.8 * zRelief);
                colors.push(Math.min(1, c[0] * boost), Math.min(1, c[1] * boost), Math.min(1, c[2] * boost));
            }
            var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            this.group.add(new THREE.Line(geo, material));
        }
        this.group.rotation.z = THREE.MathUtils.degToRad(s.lineAngle);
    };
    effect.build = function(mediaList) {
        var group = new THREE.Group(); this.group = group; this._sourceMedia = mediaList && mediaList[0]; this._lastContourFrame = -Infinity;
        if (this._sourceMedia) this._buildLines(this._sourceMedia);
        return group;
    };
    effect.update = function(time) {
        if (!this.group) return;
        var s = this.settings, t = s.playbackMotion === 'off' ? 0 : time * s.playbackMotionSpeed / 100, m = s.motion / 100;
        this.group.scale.setScalar(s.cardSize / 108);
        this.group.rotation.x = Math.sin(t * .28) * .18 * m;
        this.group.rotation.y = Math.cos(t * .24) * .28 * m;
        this.group.rotation.z = THREE.MathUtils.degToRad(s.lineAngle);
        this.group.children.forEach(function(line) { line.material.opacity = s.lineOpacity / 100; line.material.linewidth = s.lineWidth; });
        if (this._sourceMedia && this._sourceMedia.type === 'video' && s.videoRefresh === 'on' && s.playbackMotion !== 'off' && time - this._lastContourFrame > .14) {
            this._lastContourFrame = time; this._buildLines(this._sourceMedia);
        }
    };
    EP.Registry.register(effect);
})();
