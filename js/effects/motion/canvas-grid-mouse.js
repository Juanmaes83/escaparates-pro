// Canvas Grid Mouse Effect — adapted from the CodePen gist "Canvas Grid Mouse
// Effect" (source read & understood: the image is redrawn as a grid of
// square cells; for each cell, distance to the cursor determines a "zoom"
// factor — cells near the cursor sample an increasingly tiny, magnified
// sliver of the source image, producing a glitchy pixel-explosion right
// under the pointer, with optional dot overlay per cell — recreated with the
// client's own media element instead of a static image URL, smoothed with a
// simple lerp instead of GSAP quickTo).
(function() {
    var effect = new EP.EffectBase('canvas-grid-mouse', {
        name: 'Canvas Grid Mouse',
        category: 'motion',
        icon: '🔳',
        description: 'Rejilla de celdas que estalla en zoom bajo el cursor — cada celda muestra una porción cada vez más ampliada de la imagen cerca del ratón, con puntos opcionales encima; efecto motion glitch reactivo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'boxSize', type: 'range', min: 30, max: 160, default: 80, step: 5, label: 'Tamaño celda', unit: 'px' },
        { key: 'reach', type: 'range', min: 50, max: 300, default: 140, step: 10, label: 'Alcance', unit: '%' },
        { key: 'showDots', type: 'select', options: [{ v: 'on', l: 'Con puntos' }, { v: 'off', l: 'Sin puntos' }], default: 'on', label: 'Puntos' },
        { key: 'dotColor', type: 'color', default: '#ffffff', label: 'Color puntos' },
        { key: 'smoothing', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Suavidad seguimiento' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex });
        group.add(new THREE.Mesh(geo, mat));

        this._imgCvs = null;
        var m0 = mediaList && mediaList[0];
        var el0 = m0 && (m0.element || (m0.texture && m0.texture.image));
        if (el0) {
            var oc = document.createElement('canvas');
            oc.width = 1024; oc.height = 576;
            try { oc.getContext('2d').drawImage(el0, 0, 0, 1024, 576); this._imgCvs = oc; } catch (e) {}
        }
        this._m0 = m0;

        this._boxes = null;
        this._boxesAtSize = 0;
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
        var ctx = this._ctx, W = this._cvs.width, H = this._cvs.height;

        if (this._m0 && this._m0.type === 'video' && this._m0.element) {
            try { this._ctx0 = this._ctx0 || this._imgCvs.getContext('2d'); this._imgCvs.getContext('2d').drawImage(this._m0.element, 0, 0, W, H); } catch (e) {}
        }

        var boxSize = this.settings.boxSize;
        if (!this._boxes || this._boxesAtSize !== boxSize) {
            this._boxes = [];
            for (var x = 0; x <= W; x += boxSize) {
                for (var y = 0; y <= H; y += boxSize) this._boxes.push({ x: x, y: y });
            }
            this._boxesAtSize = boxSize;
        }

        // Auto-float when idle, so it always looks alive without a mouse
        this._targetX += Math.sin(time * 0.35) * 1.2;
        this._targetY += Math.cos(time * 0.28) * 1.0;

        var smooth = Math.min(1, (this.settings.smoothing / 100) * (dt || 0.016) * 60);
        this._curX += (this._targetX - this._curX) * smooth;
        this._curY += (this._targetY - this._curY) * smooth;
        var mx = this._curX, my = this._curY;
        var reach = (this.settings.reach / 100) * W;

        ctx.clearRect(0, 0, W, H);
        if (this._imgCvs) ctx.drawImage(this._imgCvs, 0, 0, W, H);
        else { ctx.fillStyle = '#1a1a1e'; ctx.fillRect(0, 0, W, H); }

        var showDots = this.settings.showDots === 'on';
        var hex = this.settings.dotColor || '#ffffff';
        ctx.fillStyle = hex;

        this._boxes.forEach(function(b) {
            var d = Math.hypot(b.x - mx, b.y - my);
            var s = 1 - Math.max(0, Math.min(1, d / reach));
            if (s < 0.001) return;
            var boxScaled = boxSize * s;
            var srcSize = Math.max(0.001, boxSize - boxScaled);
            if (this._imgCvs) {
                ctx.drawImage(this._imgCvs, b.x + boxScaled / 2, b.y + boxScaled / 2, srcSize, srcSize, b.x, b.y, boxSize, boxSize);
            }
            if (showDots) {
                ctx.beginPath();
                ctx.arc(b.x + boxSize / 2, b.y + boxSize / 2, boxSize * 0.15 * s, 0, Math.PI * 2);
                ctx.fill();
            }
        }.bind(this));

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
        this._cvs = null; this._ctx = null; this._tex = null; this._imgCvs = null; this._boxes = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
