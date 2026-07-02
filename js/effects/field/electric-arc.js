(function() {
    var effect = new EP.EffectBase('electric-arc', {
        name: 'Electric Arc',
        category: 'field',
        icon: '⚡',
        description: 'Arcos eléctricos que saltan por la imagen — efecto rayos Tesla'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'arcCount', type: 'range', min: 2, max: 12, default: 5, step: 1, label: 'Número de arcos' },
        { key: 'arcColor', type: 'color', default: '#88ccff', label: 'Color arco' },
        { key: 'intensity', type: 'range', min: 10, max: 100, default: 70, step: 5, label: 'Intensidad', unit: '%' },
        { key: 'chaos', type: 'range', min: 5, max: 60, default: 25, step: 5, label: 'Caos del arco', unit: 'px' }
    ]);

    function zigzag(ctx, x1, y1, x2, y2, chaos, segments) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        var dx = (x2 - x1) / segments;
        var dy = (y2 - y1) / segments;
        for (var i = 1; i < segments; i++) {
            var px = x1 + dx * i + (Math.random() - 0.5) * chaos * 2;
            var py = y1 + dy * i + (Math.random() - 0.5) * chaos * 2;
            ctx.lineTo(px, py);
        }
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

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

        // Fixed arc endpoints (seeded)
        this._arcPoints = [];
        for (var i = 0; i < 12; i++) {
            this._arcPoints.push({
                x1: Math.random() * 1024, y1: Math.random() * 576,
                x2: Math.random() * 1024, y2: Math.random() * 576
            });
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var n = Math.round(this.settings.arcCount);
        var chaos = this.settings.chaos;
        var intensity = this.settings.intensity / 100;
        var hexC = this.settings.arcColor || '#88ccff';
        var r = parseInt(hexC.slice(1,3),16); var g = parseInt(hexC.slice(3,5),16); var b = parseInt(hexC.slice(5,7),16);

        ctx.clearRect(0, 0, W, H);
        if (this._imgCvs) ctx.drawImage(this._imgCvs, 0, 0, W, H);
        else { ctx.fillStyle = '#040810'; ctx.fillRect(0, 0, W, H); }

        for (var i = 0; i < n && i < this._arcPoints.length; i++) {
            var ap = this._arcPoints[i];
            // Flicker: random visibility
            if (Math.random() > intensity) continue;

            var alpha = 0.5 + Math.random() * 0.5;
            // Core bright arc
            ctx.strokeStyle = 'rgba(255,255,255,' + (alpha * 0.9) + ')';
            ctx.lineWidth = 1.5;
            zigzag(ctx, ap.x1, ap.y1, ap.x2, ap.y2, chaos * 0.6, 12);

            // Glow arc
            ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha * 0.5) + ')';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(' + r + ',' + g + ',' + b + ',0.8)';
            zigzag(ctx, ap.x1, ap.y1, ap.x2, ap.y2, chaos, 10);
            ctx.shadowBlur = 0;
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null;
    };

    EP.Registry.register(effect);
})();
