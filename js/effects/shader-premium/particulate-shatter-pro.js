(function() {
    var effect = new EP.EffectBase('particulate-shatter-pro', {
        name: 'Particulate Shatter PRO',
        category: 'shader-premium',
        icon: 'PS',
        description: 'Imagen o video convertido en particulas con explosion, recoleccion magnetica y profundidad cromatica'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'particleAmount', type: 'range', min: 900, max: 16000, default: 6400, step: 100, label: 'Particles' },
        { key: 'particleSize', type: 'range', min: 8, max: 70, default: 28, step: 1, label: 'Particle Size' },
        { key: 'shatterPower', type: 'range', min: 0, max: 240, default: 120, step: 1, label: 'Shatter Power', unit: '%' },
        { key: 'gatherPower', type: 'range', min: 0, max: 200, default: 80, step: 1, label: 'Gather Pull', unit: '%' },
        { key: 'depth', type: 'range', min: 0, max: 220, default: 95, step: 1, label: 'Depth', unit: '%' },
        { key: 'cycleMode', type: 'select', options: [{ v: 'cycle', l: 'Cycle' }, { v: 'blow', l: 'Blow' }, { v: 'gather', l: 'Gather' }, { v: 'freeze', l: 'Freeze' }], default: 'cycle', label: 'Motion Mode' },
        { key: 'background', type: 'color', default: '#050508', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'high',
        minMedia: 1,
        exportSafe: true,
        hasErrorBoundary: true
    };

    function sampleMedia(media, targetCount) {
        var el = media && media.element;
        var sourceW = el ? (el.videoWidth || el.naturalWidth || el.width || 1) : 1;
        var sourceH = el ? (el.videoHeight || el.naturalHeight || el.height || 1) : 1;
        var aspect = sourceW / Math.max(1, sourceH);
        var cols = Math.max(24, Math.round(Math.sqrt(targetCount * aspect)));
        var rows = Math.max(16, Math.round(cols / Math.max(0.2, aspect)));
        var canvas = document.createElement('canvas');
        canvas.width = cols;
        canvas.height = rows;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, cols, rows);
        if (el) {
            try { ctx.drawImage(el, 0, 0, cols, rows); } catch (e) {}
        }
        return {
            data: ctx.getImageData(0, 0, cols, rows).data,
            cols: cols,
            rows: rows,
            aspect: aspect
        };
    }

    function directionVector(value) {
        if (value === 'left-right') return { x: -1, y: 0 };
        if (value === 'right-left') return { x: 1, y: 0 };
        if (value === 'top-bottom') return { x: 0, y: 1 };
        if (value === 'bottom-top') return { x: 0, y: -1 };
        if (value === 'radial-in') return { x: 0, y: 0, radial: -1 };
        if (value === 'radial-out') return { x: 0, y: 0, radial: 1 };
        return { x: 0.35, y: -0.15, radial: 1 };
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var profile = EP.DeviceProfile && EP.DeviceProfile.get ? EP.DeviceProfile.get() : null;
        var mobileCap = profile && profile.type !== 'desktop' ? (profile.lowPower ? 900 : 1600) : 16000;
        var targetCount = Math.min(this.settings.particleAmount, mobileCap);
        var sample = sampleMedia(mediaList[0], targetCount);
        var count = sample.cols * sample.rows;
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        var homes = new Float32Array(count * 3);
        var seeds = new Float32Array(count * 4);
        var planeW = 8.2;
        var planeH = planeW / sample.aspect;
        var k = 0;
        for (var y = 0; y < sample.rows; y++) {
            for (var x = 0; x < sample.cols; x++) {
                var idx = (y * sample.cols + x) * 4;
                var px = (x / Math.max(1, sample.cols - 1) - 0.5) * planeW;
                var py = (0.5 - y / Math.max(1, sample.rows - 1)) * planeH;
                var lum = (sample.data[idx] * 0.299 + sample.data[idx + 1] * 0.587 + sample.data[idx + 2] * 0.114) / 255;
                homes[k * 3] = px;
                homes[k * 3 + 1] = py;
                homes[k * 3 + 2] = (lum - 0.5) * 0.4;
                positions[k * 3] = homes[k * 3];
                positions[k * 3 + 1] = homes[k * 3 + 1];
                positions[k * 3 + 2] = homes[k * 3 + 2];
                colors[k * 3] = sample.data[idx] / 255;
                colors[k * 3 + 1] = sample.data[idx + 1] / 255;
                colors[k * 3 + 2] = sample.data[idx + 2] / 255;
                var a = ((k * 12.9898) % 6.28318);
                seeds[k * 4] = Math.cos(a);
                seeds[k * 4 + 1] = Math.sin(a);
                seeds[k * 4 + 2] = ((k * 37) % 101) / 101;
                seeds[k * 4 + 3] = lum;
                k++;
            }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        var mat = new THREE.PointsMaterial({
            size: this.settings.particleSize / 100,
            vertexColors: true,
            transparent: true,
            opacity: 0.96,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        var points = new THREE.Points(geo, mat);
        points.userData.homes = homes;
        points.userData.seeds = seeds;
        group.add(points);
        var bg = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 7),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(this.settings.background), side: THREE.DoubleSide })
        );
        bg.position.z = -2.4;
        group.add(bg);
        this._points = points;
        this._sourceMedia = mediaList[0];
        this._lastVideoSampleAt = -Infinity;
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._points || !this.group) return;
        if (this._sourceMedia && this._sourceMedia.type === 'video' && time - this._lastVideoSampleAt > 0.08) {
            var freshSample = sampleMedia(this._sourceMedia, this._points.geometry.attributes.color.count);
            var colors = this._points.geometry.attributes.color.array;
            if (freshSample.cols * freshSample.rows === colors.length / 3) {
                for (var c = 0; c < colors.length / 3; c++) {
                    var ci = c * 4;
                    colors[c * 3] = freshSample.data[ci] / 255;
                    colors[c * 3 + 1] = freshSample.data[ci + 1] / 255;
                    colors[c * 3 + 2] = freshSample.data[ci + 2] / 255;
                }
                this._points.geometry.attributes.color.needsUpdate = true;
            }
            this._lastVideoSampleAt = time;
        }
        var enabled = this.settings.playbackMotion !== 'off';
        var speed = (this.settings.playbackMotionSpeed / 100) * (enabled ? 1 : 0);
        var mode = this.settings.cycleMode;
        var phase = mode === 'freeze' || !enabled ? 0 : (Math.sin(time * 0.72 * speed) + 1) * 0.5;
        if (mode === 'blow') phase = 1;
        if (mode === 'gather') phase = 0.18 + Math.sin(time * 1.2 * speed) * 0.08;
        var dir = directionVector(this.settings.motionDirection);
        var positions = this._points.geometry.attributes.position.array;
        var homes = this._points.userData.homes;
        var seeds = this._points.userData.seeds;
        var shatter = this.settings.shatterPower / 100;
        var gather = this.settings.gatherPower / 100;
        var depth = this.settings.depth / 100;
        for (var i = 0; i < positions.length / 3; i++) {
            var hx = homes[i * 3], hy = homes[i * 3 + 1], hz = homes[i * 3 + 2];
            var rx = seeds[i * 4], ry = seeds[i * 4 + 1], rz = seeds[i * 4 + 2] - 0.5;
            var radial = Math.sqrt(hx * hx + hy * hy) + 0.001;
            var rdx = dir.radial ? hx / radial * dir.radial : dir.x;
            var rdy = dir.radial ? hy / radial * dir.radial : dir.y;
            var drift = phase * shatter;
            var pull = (1 - phase) * gather * 0.24;
            positions[i * 3] = hx + (rx * 1.6 + rdx * 3.2) * drift - hx * pull;
            positions[i * 3 + 1] = hy + (ry * 1.6 + rdy * 3.2) * drift - hy * pull;
            positions[i * 3 + 2] = hz + (rz * 5.2 + Math.sin(time * 1.5 + i * 0.03) * 0.25) * drift * depth;
        }
        this._points.geometry.attributes.position.needsUpdate = true;
        this._points.material.size = this.settings.particleSize / 100;
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.camera.position.set(0, 0, 10.5);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        this._points = this._sourceMedia = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
    EP.Registry.get('particulate-shatter-pro').capabilities.exportSafe = true;
})();
