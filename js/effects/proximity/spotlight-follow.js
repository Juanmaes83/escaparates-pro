(function() {
    var effect = new EP.EffectBase('spotlight-follow', {
        name: 'Spotlight Follow',
        category: 'proximity',
        icon: '🔦',
        description: 'Foco de luz que sigue al cursor revelando la imagen en la oscuridad'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'spotRadius', type: 'range', min: 30, max: 300, default: 120, step: 10, label: 'Radio foco', unit: 'px' },
        { key: 'darkness', type: 'range', min: 30, max: 100, default: 85, step: 5, label: 'Oscuridad fondo', unit: '%' },
        { key: 'softness', type: 'range', min: 5, max: 80, default: 40, step: 5, label: 'Suavidad borde', unit: '%' },
        { key: 'smoothing', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Suavidad seguimiento' },
        { key: 'tintColor', type: 'color', default: '#ffeecc', label: 'Tinte luz' }
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

        this._curX = 512; this._curY = 288;
        this._targetX = 512; this._targetY = 288;
        var self = this;
        this._onMouseMove = function(e) {
            var canvas = document.querySelector('canvas');
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            self._targetX = ((e.clientX - rect.left) / rect.width) * 1024;
            self._targetY = ((e.clientY - rect.top) / rect.height) * 576;
        };
        window.addEventListener('mousemove', this._onMouseMove);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var smooth = Math.min(1, (this.settings.smoothing / 100) * (dt || 0.016) * 60);
        var spotR = this.settings.spotRadius;
        var darkness = this.settings.darkness / 100;
        var soft = this.settings.softness / 100;
        var hexT = this.settings.tintColor || '#ffeecc';
        var tr = parseInt(hexT.slice(1,3),16); var tg = parseInt(hexT.slice(3,5),16); var tb = parseInt(hexT.slice(5,7),16);

        // Auto-float when no direct mouse
        this._targetX += Math.sin(time * 0.4) * 1.5;
        this._targetY += Math.cos(time * 0.3) * 1.2;

        // Smooth follow
        this._curX += (this._targetX - this._curX) * smooth;
        this._curY += (this._targetY - this._curY) * smooth;
        var mx = this._curX; var my = this._curY;

        ctx.clearRect(0, 0, W, H);

        // Draw base image
        if (this._imgCvs) {
            ctx.drawImage(this._imgCvs, 0, 0, W, H);
        } else {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SPOTLIGHT', W/2, H/2);
        }

        // Dark overlay with spotlight hole using composite
        var outerR = spotR * (1 + soft);
        var darkGrad = ctx.createRadialGradient(mx, my, spotR * (1 - soft), mx, my, outerR);
        darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
        darkGrad.addColorStop(1, 'rgba(0,0,0,' + darkness.toFixed(2) + ')');

        ctx.fillStyle = 'rgba(0,0,0,' + darkness.toFixed(2) + ')';
        ctx.fillRect(0, 0, W, H);

        // Cut hole with composite
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        var holeGrad = ctx.createRadialGradient(mx, my, 0, mx, my, outerR);
        holeGrad.addColorStop(0, 'rgba(0,0,0,' + darkness.toFixed(2) + ')');
        holeGrad.addColorStop(1 - soft, 'rgba(0,0,0,' + darkness.toFixed(2) + ')');
        holeGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(mx, my, outerR, 0, Math.PI * 2);
        ctx.fillStyle = holeGrad;
        ctx.fill();
        ctx.restore();

        // Light tint in spotlight
        var lightGrad = ctx.createRadialGradient(mx, my, 0, mx, my, spotR);
        lightGrad.addColorStop(0, 'rgba(' + tr + ',' + tg + ',' + tb + ',0.15)');
        lightGrad.addColorStop(1, 'rgba(' + tr + ',' + tg + ',' + tb + ',0)');
        ctx.beginPath();
        ctx.arc(mx, my, spotR, 0, Math.PI * 2);
        ctx.fillStyle = lightGrad;
        ctx.fill();

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null;
    };

    EP.Registry.register(effect);
})();
