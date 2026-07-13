(function() {
    var effect = new EP.EffectBase('immersive-layers-pro', {
        name: 'Immersive Layers Pro', category: '3d-perspective', icon: 'IL',
        description: 'Capas de luminancia inmersivas con profundidad, estela real y particulas con LOD seguro'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'layerSize', type: 'range', min: 70, max: 160, default: 118, step: 1, label: 'Layer Size', unit: '%' },
        { key: 'layers', type: 'range', min: 3, max: 18, default: 9, step: 1, label: 'Luminance Layers' },
        { key: 'speed', type: 'range', min: 0, max: 220, default: 80, step: 1, label: 'Depth Speed', unit: '%' },
        { key: 'depth', type: 'range', min: 120, max: 900, default: 420, step: 10, label: 'Depth' },
        { key: 'fadeStart', type: 'range', min: 0, max: 100, default: 72, step: 1, label: 'Fade Start', unit: '%' },
        { key: 'staticDarkLayers', type: 'range', min: 0, max: 80, default: 28, step: 1, label: 'Static Dark Layers', unit: '%' },
        { key: 'baseOpacity', type: 'range', min: 10, max: 100, default: 76, step: 1, label: 'Layer Opacity', unit: '%' },
        { key: 'particles', type: 'range', min: 0, max: 30000, default: 2600, step: 100, label: 'Particles' },
        { key: 'particleSize', type: 'range', min: 1, max: 120, default: 25, step: 1, label: 'Particle Size', unit: '%' },
        { key: 'particleBrightness', type: 'range', min: 20, max: 200, default: 100, step: 1, label: 'Particle Brightness', unit: '%' },
        { key: 'trail', type: 'select', options: [{ v: 'off', l: 'Natural' }, { v: 'on', l: 'Afterimage trail' }], default: 'off', label: 'Motion Trail' },
        { key: 'trailDamp', type: 'range', min: 0, max: 98, default: 91, step: 1, label: 'Trail Persistence', unit: '%' },
        { key: 'background', type: 'color', default: '#050508', label: 'Background' }
    ]);
    effect.capabilities = Object.assign(effect.capabilities, { supportsVideo: true, usesPostProcessing: true, mobileRisk: 'high' });

    function lumaTexture(media, from, to, maxSide) {
        var el = media.element, sourceW = el.videoWidth || el.naturalWidth || el.width || 1, sourceH = el.videoHeight || el.naturalHeight || el.height || 1;
        var scale = Math.min(1, maxSide / Math.max(sourceW, sourceH)), w = Math.max(1, Math.round(sourceW * scale)), h = Math.max(1, Math.round(sourceH * scale));
        var canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(el, 0, 0, w, h);
        var image = ctx.getImageData(0, 0, w, h), d = image.data;
        for (var i = 0; i < d.length; i += 4) {
            var lum = (.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]) / 255;
            var softness = .075, alpha = Math.min(1, Math.max(0, Math.min((lum - from + softness) / softness, (to - lum + softness) / softness)));
            d[i + 3] = Math.round(alpha * 255);
        }
        ctx.putImageData(image, 0, 0); var texture = new THREE.CanvasTexture(canvas); texture.needsUpdate = true; return texture;
    }
    function applyPost(effectInstance) {
        var s = effectInstance.settings, sig = [s.trail, s.trailDamp].join('|');
        if (effectInstance._postSignature === sig) return;
        effectInstance._postSignature = sig;
        EP.Core.setPostProcessing({ bloomEnabled: false, vignetteEnabled: false, afterimageEnabled: s.trail === 'on', afterimageDamp: s.trailDamp / 100 });
    }
    effect.build = function(mediaList) {
        var group = new THREE.Group(); if (!mediaList || !mediaList.length) return group;
        var media = mediaList[0], s = this.settings, profile = EP.DeviceProfile ? EP.DeviceProfile.get() : null;
        var count = Math.floor(s.layers), sourceMax = profile && profile.lowPower ? 280 : 560, size = s.layerSize / 100 * 6.2, depth = s.depth / 100;
        var geometry = EP.RoundedPlaneGeometry(size, size * .72, size * .025);
        for (var i = 0; i < count; i++) {
            var from = i / count, to = (i + 1) / count, tex = lumaTexture(media, from, to, sourceMax);
            var material = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: s.baseOpacity / 100 });
            var layer = new THREE.Mesh(geometry, material); layer.position.z = -i * depth; layer.scale.setScalar(1 + i * .065);
            layer.userData = { isLayer: true, lane: i, startZ: -i * depth, isStatic: i / Math.max(1, count - 1) < s.staticDarkLayers / 100 };
            group.add(layer);
        }
        if (media.type === 'video') {
            var live = new THREE.Mesh(geometry, EP.Media.createMaterial(media, { opacity: .55 }));
            live.position.z = .02; live.userData = { isLiveVideo: true }; group.add(live);
        }
        var requested = Math.floor(s.particles), cap = profile && profile.lowPower ? 1800 : 18000, particleCount = Math.min(requested, cap);
        if (particleCount) {
            var particleGeo = new THREE.BufferGeometry(), pos = new Float32Array(particleCount * 3), color = new Float32Array(particleCount * 3), brightness = s.particleBrightness / 100;
            for (var p = 0; p < particleCount; p++) {
                pos[p * 3] = (Math.random() - .5) * size * 1.5; pos[p * 3 + 1] = (Math.random() - .5) * size; pos[p * 3 + 2] = -Math.random() * depth * count;
                color[p * 3] = Math.min(1, .75 * brightness); color[p * 3 + 1] = Math.min(1, .78 * brightness); color[p * 3 + 2] = Math.min(1, .95 * brightness);
            }
            particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); particleGeo.setAttribute('color', new THREE.BufferAttribute(color, 3));
            var points = new THREE.Points(particleGeo, new THREE.PointsMaterial({ size: s.particleSize / 100, vertexColors: true, transparent: true, opacity: .72, depthWrite: false }));
            points.userData = { isParticles: true, depth: depth * count }; group.add(points);
        }
        this.group = group; this._postSignature = null; applyPost(this); return group;
    };
    effect.update = function(time) {
        if (!this.group) return;
        var s = this.settings, active = s.playbackMotion !== 'off', speed = s.speed / 100 * s.playbackMotionSpeed / 100, depth = s.depth / 100, total = depth * Math.max(1, s.layers), fadeStart = s.fadeStart / 100;
        this.group.children.forEach(function(child) {
            if (child.userData.isLayer) {
                var z = child.userData.isStatic || !active ? child.userData.startZ : child.userData.startZ + (time * 18 * speed) % total;
                if (z > 5) z -= total; child.position.z = z;
                var progress = Math.min(1, Math.abs(z) / total), fade = progress > fadeStart ? 1 - (progress - fadeStart) / Math.max(.01, 1 - fadeStart) : 1;
                child.material.opacity = (s.baseOpacity / 100) * (.22 + (1 - progress) * .78) * fade;
            } else if (child.userData.isLiveVideo) { if (child.material.map) child.material.map.needsUpdate = true; }
            else if (child.userData.isParticles) {
                child.material.size = s.particleSize / 100;
                if (active) { var a = child.geometry.attributes.position.array; for (var i = 0; i < a.length; i += 3) { a[i + 2] += .12 * speed; if (a[i + 2] > 5) a[i + 2] -= child.userData.depth; } child.geometry.attributes.position.needsUpdate = true; }
            }
        });
        applyPost(this);
    };
    effect.dispose = function() { EP.Core.setPostProcessing({ bloomEnabled: false, vignetteEnabled: false, afterimageEnabled: false }); EP.EffectBase.prototype.dispose.call(this); };
    EP.Registry.register(effect);
})();
