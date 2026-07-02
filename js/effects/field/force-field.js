(function() {
    var effect = new EP.EffectBase('force-field', {
        name: 'Force Field',
        category: 'field',
        icon: '⚡',
        description: 'Campo de fuerza con líneas de flujo animadas sobre la imagen'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'lineCount', type: 'range', min: 10, max: 60, default: 28, step: 2, label: 'Líneas de campo' },
        { key: 'lineColor', type: 'color', default: '#00cfff', label: 'Color campo' },
        { key: 'lineOpacity', type: 'range', min: 10, max: 100, default: 55, step: 5, label: 'Opacidad', unit: '%' },
        { key: 'speed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad' },
        { key: 'fieldType', type: 'select', options: [{ v: 'flow', l: 'Flujo' }, { v: 'radial', l: 'Radial' }, { v: 'vortex', l: 'Vórtice' }], default: 'flow', label: 'Tipo campo' }
    ]);

    function seededRand(s) { var x = Math.sin(s+1)*43758.5453; return x-Math.floor(x); }

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

        // Seed particle start positions
        this._particles = [];
        for (var i = 0; i < 60; i++) {
            this._particles.push({ x: seededRand(i*7)*1024, y: seededRand(i*13)*576, age: seededRand(i*3) });
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var spd = this.settings.speed * 0.5;
        var n = Math.round(this.settings.lineCount);
        var fieldType = this.settings.fieldType;
        var hexC = this.settings.lineColor || '#00cfff';
        var r = parseInt(hexC.slice(1,3),16); var g = parseInt(hexC.slice(3,5),16); var b = parseInt(hexC.slice(5,7),16);
        var alpha = this.settings.lineOpacity / 100;

        ctx.clearRect(0, 0, W, H);
        if (this._imgCvs) ctx.drawImage(this._imgCvs, 0, 0, W, H);
        else { ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H); }

        // Animate field lines as flowing particles
        var dtEff = dt || 0.016;
        for (var i = 0; i < n && i < this._particles.length; i++) {
            var p = this._particles[i];
            p.age += dtEff * spd * 0.5;
            if (p.age > 1) {
                p.age = 0;
                p.x = Math.random() * W;
                p.y = Math.random() * H;
            }

            // Field vector at this point
            var cx = W/2; var cy = H/2;
            var dx = p.x - cx; var dy = p.y - cy;
            var dist = Math.sqrt(dx*dx + dy*dy) || 1;
            var vx, vy;

            if (fieldType === 'flow') {
                vx = Math.cos(time * spd * 0.3 + p.y / H * Math.PI * 2) * 3;
                vy = Math.sin(time * spd * 0.2 + p.x / W * Math.PI * 2) * 1.5;
            } else if (fieldType === 'radial') {
                vx = dx / dist * 2.5;
                vy = dy / dist * 2.5;
            } else { // vortex
                vx = -dy / dist * 3;
                vy = dx / dist * 3;
            }

            // Draw trail
            var len = 20 + Math.random() * 30;
            var tailAlpha = alpha * (1 - p.age);
            ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + tailAlpha.toFixed(2) + ')';
            ctx.lineWidth = 1 + Math.random();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - vx * len * 0.3, p.y - vy * len * 0.3);
            ctx.stroke();

            // Move
            p.x += vx * dtEff * 30;
            p.y += vy * dtEff * 30;

            // Wrap
            if (p.x < 0) p.x += W; if (p.x > W) p.x -= W;
            if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null;
    };

    EP.Registry.register(effect);
})();
