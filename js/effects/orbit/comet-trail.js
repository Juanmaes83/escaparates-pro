(function() {
    var effect = new EP.EffectBase('comet-trail', {
        name: 'Comet Trail',
        category: 'orbit',
        icon: '☄️',
        description: 'Cometa con estela luminosa que orbita revelando la imagen'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cometColor', type: 'color', default: '#ffcc44', label: 'Color cometa' },
        { key: 'trailLength', type: 'range', min: 10, max: 100, default: 45, step: 5, label: 'Longitud estela', unit: '%' },
        { key: 'orbitSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad' },
        { key: 'orbitEccentricity', type: 'range', min: 0, max: 80, default: 35, step: 5, label: 'Excentricidad', unit: '%' },
        { key: 'revealImage', type: 'select', options: [{ v: 'on', l: 'Revelar imagen' }, { v: 'off', l: 'Solo cometa' }], default: 'on', label: 'Revelar imagen' }
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

        this._imgCvs = null;
        var m0 = mediaList && mediaList[0];
        var el0 = m0 && (m0.element || (m0.texture && m0.texture.image));
        if (el0) {
            var oc = document.createElement('canvas');
            oc.width = 1024; oc.height = 576;
            try { oc.getContext('2d').drawImage(el0, 0, 0, 1024, 576); this._imgCvs = oc; } catch(e) {}
        }

        this._trail = []; // trail positions
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var cx = W/2; var cy = H/2;
        var spd = this.settings.orbitSpeed * 0.4;
        var ecc = this.settings.orbitEccentricity / 100;
        var trailPct = this.settings.trailLength / 100;

        // Elliptical orbit
        var rx = W * 0.42; var ry = H * 0.38 * (1 - ecc * 0.5);
        var angle = time * spd;
        var cometX = cx + Math.cos(angle) * rx;
        var cometY = cy + Math.sin(angle) * ry;

        // Add to trail
        this._trail.push({ x: cometX, y: cometY });
        var maxTrail = Math.round(trailPct * 80 + 10);
        if (this._trail.length > maxTrail) this._trail.shift();

        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#06060f';
        ctx.fillRect(0, 0, W, H);

        // Reveal image through comet path
        if (this._imgCvs && this.settings.revealImage === 'on') {
            ctx.save();
            // Clip to comet's swept area
            ctx.globalCompositeOperation = 'source-over';
            var sweepR = 60;
            this._trail.forEach(function(p) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, sweepR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fill();
            });
            // Draw image clipped to trail
            ctx.globalCompositeOperation = 'source-atop';
            ctx.drawImage(this._imgCvs, 0, 0, W, H);
            ctx.restore();
        }

        // Draw orbit path (faint)
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw trail gradient
        var hexC = this.settings.cometColor || '#ffcc44';
        var cr = parseInt(hexC.slice(1,3),16); var cg = parseInt(hexC.slice(3,5),16); var cb = parseInt(hexC.slice(5,7),16);

        for (var i = 1; i < this._trail.length; i++) {
            var t0 = this._trail[i-1]; var t1 = this._trail[i];
            var frac = i / this._trail.length;
            ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (frac * 0.8) + ')';
            ctx.lineWidth = frac * 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.stroke();
        }

        // Comet head glow
        var headGrad = ctx.createRadialGradient(cometX, cometY, 0, cometX, cometY, 25);
        headGrad.addColorStop(0, '#ffffff');
        headGrad.addColorStop(0.3, 'rgba(' + cr + ',' + cg + ',' + cb + ',0.9)');
        headGrad.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
        ctx.beginPath();
        ctx.arc(cometX, cometY, 25, 0, Math.PI * 2);
        ctx.fillStyle = headGrad;
        ctx.fill();

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null; this._trail = [];
    };

    EP.Registry.register(effect);
})();
