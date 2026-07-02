(function() {
    var effect = new EP.EffectBase('ripple-touch', {
        name: 'Ripple Touch',
        category: 'proximity',
        icon: '💧',
        description: 'Ondas concéntricas desde el cursor — efecto agua interactivo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'rippleColor', type: 'color', default: '#4f8cff', label: 'Color ondas' },
        { key: 'rippleSpeed', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Velocidad onda' },
        { key: 'rippleCount', type: 'range', min: 2, max: 8, default: 4, step: 1, label: 'Número de ondas' },
        { key: 'rippleWidth', type: 'range', min: 1, max: 10, default: 3, step: 1, label: 'Grosor onda', unit: 'px' },
        { key: 'distortion', type: 'range', min: 0, max: 30, default: 10, step: 1, label: 'Distorsión imagen', unit: 'px' }
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

        // Mouse tracking
        this._mouseX = 512; this._mouseY = 288;
        var self = this;
        this._onMouseMove = function(e) {
            var canvas = document.querySelector('canvas');
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            self._mouseX = ((e.clientX - rect.left) / rect.width) * 1024;
            self._mouseY = ((e.clientY - rect.top) / rect.height) * 576;
        };
        window.addEventListener('mousemove', this._onMouseMove);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var spd = this.settings.rippleSpeed;
        var n = Math.round(this.settings.rippleCount);
        var hexC = this.settings.rippleColor || '#4f8cff';
        var cr = parseInt(hexC.slice(1,3),16); var cg = parseInt(hexC.slice(3,5),16); var cb = parseInt(hexC.slice(5,7),16);
        var lw = this.settings.rippleWidth;
        var dist = this.settings.distortion;

        // Auto-animate ripple center when no mouse
        var mx = this._mouseX + Math.sin(time * 0.3) * 50;
        var my = this._mouseY + Math.cos(time * 0.25) * 30;

        ctx.clearRect(0, 0, W, H);

        // Draw image with subtle distortion near ripple center
        if (this._imgCvs) {
            if (dist > 0) {
                // Draw rows with ripple-based offset
                var sliceH = 3;
                for (var y = 0; y < H; y += sliceH) {
                    var dy = y - my;
                    var maxR = Math.sqrt(W*W + H*H);
                    var r0 = Math.sqrt(Math.pow(W/2 - mx, 2) + dy*dy);
                    var wave = Math.sin(r0 * 0.05 - time * spd) * dist * Math.exp(-r0 / (W * 0.4));
                    ctx.drawImage(this._imgCvs, 0, y, W, sliceH, wave, y, W, sliceH);
                }
            } else {
                ctx.drawImage(this._imgCvs, 0, 0, W, H);
            }
        } else {
            ctx.fillStyle = '#0a1628';
            ctx.fillRect(0, 0, W, H);
        }

        // Draw ripple rings
        var maxRadius = Math.sqrt(W*W + H*H) * 0.7;
        for (var i = 0; i < n; i++) {
            var phase = (time * spd * 0.15 + i / n) % 1;
            var radius = phase * maxRadius;
            var alpha = (1 - phase) * 0.7;

            ctx.beginPath();
            ctx.arc(mx, my, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + alpha.toFixed(2) + ')';
            ctx.lineWidth = lw * (1 - phase * 0.5);
            ctx.stroke();
        }

        // Cursor dot
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.9)';
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
