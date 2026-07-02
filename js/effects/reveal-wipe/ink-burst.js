(function() {
    var effect = new EP.EffectBase('ink-burst', {
        name: 'Ink Burst',
        category: 'reveal-wipe',
        icon: '🎨',
        description: 'Explosión de tinta desde el centro que revela la imagen — color splash'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'inkColor', type: 'color', default: '#ff3366', label: 'Color tinta' },
        { key: 'drops', type: 'range', min: 6, max: 40, default: 18, step: 1, label: 'Gotas de tinta' },
        { key: 'spread', type: 'range', min: 10, max: 100, default: 60, step: 5, label: 'Expansión', unit: '%' },
        { key: 'revealImage', type: 'select', options: [{ v: 'on', l: 'Revelar imagen' }, { v: 'off', l: 'Solo tinta' }], default: 'on', label: 'Revelar imagen' },
        { key: 'background', type: 'color', default: '#ffffff', label: 'Fondo' }
    ]);

    function seededRand(seed) {
        var x = Math.sin(seed + 1) * 43758.5453;
        return x - Math.floor(x);
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();

        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);

        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);

        // Cache media image
        this._imgCvs = null;
        var m0 = mediaList && mediaList[0];
        var el0 = m0 && (m0.element || (m0.texture && m0.texture.image));
        if (el0) {
            var oc = document.createElement('canvas');
            oc.width = 1024; oc.height = 576;
            try { oc.getContext('2d').drawImage(el0, 0, 0, 1024, 576); this._imgCvs = oc; } catch(e) {}
        }

        // Generate stable drop positions (seeded so they don't jump each frame)
        this._drops = [];
        var maxDrops = 40;
        for (var i = 0; i < maxDrops; i++) {
            var angle = seededRand(i * 7) * Math.PI * 2;
            this._drops.push({
                angle: angle,
                radiusFrac: 0.3 + seededRand(i * 13) * 0.7,
                sizeFrac: 0.4 + seededRand(i * 17) * 0.6,
                delay: seededRand(i * 3) * 0.35
            });
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var t = (time % loopDuration) / loopDuration;
        var spread = this.settings.spread / 100;
        var numDrops = Math.round(this.settings.drops);

        var cvs = this._cvs; var ctx = this._ctx;
        var W = cvs.width; var H = cvs.height;
        var cx = W / 2; var cy = H / 2;
        var maxR = Math.sqrt(cx * cx + cy * cy);

        // Background
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = this.settings.background;
        ctx.fillRect(0, 0, W, H);

        // Ink drops expanding from center
        var inkColor = this.settings.inkColor || '#ff3366';
        ctx.fillStyle = inkColor;

        var showImage = this.settings.revealImage === 'on' && this._imgCvs;

        for (var i = 0; i < numDrops && i < this._drops.length; i++) {
            var drop = this._drops[i];
            var dropT = Math.max(0, Math.min(1, (t - drop.delay) / (1 - drop.delay)));
            var eased = 1 - Math.pow(1 - dropT, 3);

            var dist = maxR * spread * eased * drop.radiusFrac;
            var dropR = (20 + 80 * drop.sizeFrac) * eased;

            var dx = cx + Math.cos(drop.angle) * dist;
            var dy = cy + Math.sin(drop.angle) * dist;

            if (showImage) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(dx, dy, dropR * 1.8, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(this._imgCvs, 0, 0, W, H);
                ctx.restore();
            }

            ctx.beginPath();
            ctx.arc(dx, dy, dropR, 0, Math.PI * 2);
            ctx.globalAlpha = 0.7 * (1 - eased * 0.3);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Center burst
        var burstR = maxR * 0.15 * Math.min(1, t * 4);
        ctx.beginPath();
        ctx.arc(cx, cy, burstR, 0, Math.PI * 2);
        ctx.fill();

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null;
    };

    EP.Registry.register(effect);
})();
