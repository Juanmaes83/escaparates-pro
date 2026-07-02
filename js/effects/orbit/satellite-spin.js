(function() {
    var effect = new EP.EffectBase('satellite-spin', {
        name: 'Satellite Spin',
        category: 'orbit',
        icon: '🛸',
        description: 'Thumbnails de imágenes orbitando alrededor de la imagen principal'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'orbitRadius', type: 'range', min: 50, max: 250, default: 140, step: 10, label: 'Radio órbita', unit: 'px' },
        { key: 'satellites', type: 'range', min: 2, max: 6, default: 3, step: 1, label: 'Satélites' },
        { key: 'satSize', type: 'range', min: 40, max: 160, default: 90, step: 10, label: 'Tamaño satélite', unit: 'px' },
        { key: 'orbitSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad órbita' },
        { key: 'tilt', type: 'range', min: 0, max: 60, default: 20, step: 5, label: 'Inclinación órbita', unit: '°' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        group.add(new THREE.Mesh(geo, mat));

        // Cache up to 4 media images
        this._imgs = [];
        var maxImgs = Math.min(mediaList ? mediaList.length : 0, 7);
        for (var i = 0; i < maxImgs; i++) {
            var m = mediaList[i];
            var el = m && (m.element || (m.texture && m.texture.image));
            if (el) {
                var oc = document.createElement('canvas');
                oc.width = 200; oc.height = 200;
                try { oc.getContext('2d').drawImage(el, 0, 0, 200, 200); this._imgs.push(oc); } catch(e) {}
            }
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var cx = W / 2; var cy = H / 2;
        var orbitR = this.settings.orbitRadius;
        var n = Math.round(this.settings.satellites);
        var satS = this.settings.satSize;
        var spd = this.settings.orbitSpeed * 0.2;
        var tiltRad = this.settings.tilt * Math.PI / 180;

        ctx.clearRect(0, 0, W, H);

        // Draw central image
        if (this._imgs[0]) {
            var centralS = Math.min(W, H) * 0.35;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, centralS / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(this._imgs[0], cx - centralS/2, cy - centralS/2, centralS, centralS);
            ctx.restore();
            // Ring shadow
            ctx.beginPath();
            ctx.arc(cx, cy, centralS / 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.fillStyle = '#2a2a3e';
            ctx.beginPath();
            ctx.arc(cx, cy, 100, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4f8cff';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('MAIN', cx, cy);
        }

        // Draw orbit ellipse
        ctx.beginPath();
        ctx.ellipse(cx, cy, orbitR, orbitR * Math.cos(tiltRad), 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw satellites sorted by Y for depth
        var sats = [];
        for (var i = 0; i < n; i++) {
            var angle = (i / n) * Math.PI * 2 + time * spd;
            var sx = cx + Math.cos(angle) * orbitR;
            var sy = cy + Math.sin(angle) * orbitR * Math.cos(tiltRad);
            var depth = Math.sin(angle); // -1=back, +1=front
            sats.push({ sx: sx, sy: sy, depth: depth, imgIdx: (i + 1) % Math.max(1, this._imgs.length) });
        }
        sats.sort(function(a, b) { return a.depth - b.depth; });

        sats.forEach(function(s) {
            var scale = 0.7 + s.depth * 0.3;
            var size = satS * scale;
            ctx.save();
            ctx.globalAlpha = 0.6 + s.depth * 0.4;
            ctx.beginPath();
            ctx.arc(s.sx, s.sy, size / 2, 0, Math.PI * 2);
            ctx.clip();
            if (this._imgs[s.imgIdx]) {
                ctx.drawImage(this._imgs[s.imgIdx], s.sx - size/2, s.sy - size/2, size, size);
            } else {
                ctx.fillStyle = 'rgba(79,140,255,0.6)';
                ctx.fill();
            }
            ctx.restore();
        }.bind(this));

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgs = [];
    };

    EP.Registry.register(effect);
})();
