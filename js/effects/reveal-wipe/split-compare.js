(function() {
    var effect = new EP.EffectBase('split-compare', {
        name: 'Split Compare',
        category: 'reveal-wipe',
        icon: '◧',
        description: 'Comparador antes/después — divisor que sigue al cursor o barre automáticamente dos imágenes'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'autoSweep', type: 'select', options: [{ v: 'on', l: 'Auto Sweep' }, { v: 'off', l: 'Mouse Only' }], default: 'on', label: 'Auto Sweep' },
        { key: 'sweepSpeed', type: 'range', min: 1, max: 20, default: 4, step: 1, label: 'Velocidad sweep' },
        { key: 'lineWidth', type: 'range', min: 1, max: 10, default: 3, step: 1, label: 'Grosor línea', unit: 'px' },
        { key: 'lineColor', type: 'color', default: '#ffffff', label: 'Color línea' },
        { key: 'label1', type: 'text', default: 'ANTES', label: 'Etiqueta izquierda' },
        { key: 'label2', type: 'text', default: 'DESPUÉS', label: 'Etiqueta derecha' }
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

        this._imgLeft = null; this._imgRight = null;
        var m0 = mediaList && mediaList[0];
        var m1 = mediaList && mediaList[1];
        var el0 = m0 && (m0.element || (m0.texture && m0.texture.image));
        var el1 = m1 && (m1.element || (m1.texture && m1.texture.image));
        if (el0) {
            var oc0 = document.createElement('canvas'); oc0.width = 1024; oc0.height = 576;
            try { oc0.getContext('2d').drawImage(el0, 0, 0, 1024, 576); this._imgLeft = oc0; } catch(e) {}
        }
        if (el1) {
            var oc1 = document.createElement('canvas'); oc1.width = 1024; oc1.height = 576;
            try { oc1.getContext('2d').drawImage(el1, 0, 0, 1024, 576); this._imgRight = oc1; } catch(e) {}
        }
        if (!this._imgRight && this._imgLeft) this._imgRight = this._imgLeft;

        this._divX = 512;
        this._targetX = 512;
        var self = this;
        this._onMouseMove = function(e) {
            var canvas = document.querySelector('canvas');
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            self._targetX = ((e.clientX - rect.left) / rect.width) * 1024;
        };
        window.addEventListener('mousemove', this._onMouseMove);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var lc = this.settings.lineColor || '#ffffff';
        var lw = this.settings.lineWidth;

        if (this.settings.autoSweep === 'on') {
            var spd = this.settings.sweepSpeed * 0.35;
            this._targetX = W * 0.5 + Math.sin(time * spd * 0.5) * W * 0.42;
        }
        this._divX += (this._targetX - this._divX) * 0.12;
        var dx = Math.round(this._divX);

        ctx.clearRect(0, 0, W, H);

        if (this._imgLeft) {
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, dx, H); ctx.clip();
            ctx.drawImage(this._imgLeft, 0, 0, W, H);
            ctx.restore();
        } else {
            ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, dx, H);
        }

        if (this._imgRight) {
            ctx.save();
            ctx.beginPath(); ctx.rect(dx, 0, W - dx, H); ctx.clip();
            ctx.drawImage(this._imgRight, 0, 0, W, H);
            ctx.restore();
        } else {
            ctx.fillStyle = '#16213e'; ctx.fillRect(dx, 0, W - dx, H);
        }

        // Divider line
        ctx.strokeStyle = lc; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, H); ctx.stroke();

        // Handle circle
        ctx.fillStyle = lc;
        ctx.beginPath(); ctx.arc(dx, H / 2, 18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('◀▶', dx, H / 2);

        // Labels
        ctx.font = 'bold 22px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.textAlign = 'left';
        ctx.fillText(String(this.settings.label1 || 'ANTES'), 18, 38);
        ctx.textAlign = 'right';
        ctx.fillText(String(this.settings.label2 || 'DESPUÉS'), W - 18, 38);
        ctx.shadowBlur = 0;

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgLeft = null; this._imgRight = null;
    };

    EP.Registry.register(effect);
})();
