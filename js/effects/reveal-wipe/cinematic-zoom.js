(function() {
    var effect = new EP.EffectBase('cinematic-zoom', {
        name: 'Cinematic Zoom',
        category: 'reveal-wipe',
        icon: '🎬',
        description: 'Zoom cinematográfico sobre imagen — barras letterbox que se abren con título y subtítulo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'zoomStart', type: 'range', min: 105, max: 200, default: 140, step: 5, label: 'Zoom inicial', unit: '%' },
        { key: 'zoomEnd', type: 'range', min: 100, max: 140, default: 108, step: 2, label: 'Zoom final', unit: '%' },
        { key: 'barHeight', type: 'range', min: 0, max: 25, default: 12, step: 1, label: 'Alto barras', unit: '%' },
        { key: 'revealEnd', type: 'range', min: 15, max: 60, default: 35, step: 5, label: 'Fin reveal', unit: '%' },
        { key: 'title', type: 'text', default: 'BIENVENIDO', label: 'Título' },
        { key: 'subtitle', type: 'text', default: '', label: 'Subtítulo' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Color texto' }
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
            var oc = document.createElement('canvas'); oc.width = 1024; oc.height = 576;
            try { oc.getContext('2d').drawImage(el0, 0, 0, 1024, 576); this._imgCvs = oc; } catch(e) {}
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var dur = loopDuration || 9;
        var t = (time % dur) / dur;
        var revealEnd = this.settings.revealEnd / 100;
        var zoomStart = this.settings.zoomStart / 100;
        var zoomEnd = this.settings.zoomEnd / 100;
        var barFrac = this.settings.barHeight / 100;
        var title = String(this.settings.title || '');
        var sub = String(this.settings.subtitle || '');
        var tc = this.settings.textColor || '#ffffff';
        var tr = parseInt(tc.slice(1, 3) || 'ff', 16);
        var tg = parseInt(tc.slice(3, 5) || 'ff', 16);
        var tb = parseInt(tc.slice(5, 7) || 'ff', 16);

        // Zoom easing
        var zoomT = Math.min(1, t / revealEnd);
        var eased = 1 - Math.pow(1 - zoomT, 2.5);
        var scale = zoomStart + (zoomEnd - zoomStart) * eased;

        // Text alpha curve
        var fadeInStart = revealEnd * 0.45;
        var fadeOutStart = 0.8;
        var textA = 0;
        if (t >= fadeInStart && t < revealEnd) {
            textA = (t - fadeInStart) / (revealEnd - fadeInStart);
        } else if (t >= revealEnd && t < fadeOutStart) {
            textA = 1;
        } else if (t >= fadeOutStart) {
            textA = Math.max(0, 1 - (t - fadeOutStart) / (1 - fadeOutStart));
        }

        // Bar size: closes from full to 0 during zoom
        var barH = barFrac * H * (1 - eased);

        ctx.clearRect(0, 0, W, H);

        // Zoomed image
        if (this._imgCvs) {
            var sw = W * scale; var sh = H * scale;
            ctx.drawImage(this._imgCvs, (W - sw) / 2, (H - sh) / 2, sw, sh);
        } else {
            ctx.fillStyle = '#08080f'; ctx.fillRect(0, 0, W, H);
        }

        // Letterbox bars
        if (barH > 0.5) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, W, barH);
            ctx.fillRect(0, H - barH, W, barH);
        }

        // Title
        if (textA > 0.01 && title) {
            ctx.globalAlpha = textA;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 20;

            var cy = H / 2 - (sub ? 34 : 0);
            ctx.font = 'bold 58px Arial, sans-serif';
            ctx.fillStyle = 'rgba(' + tr + ',' + tg + ',' + tb + ',1)';
            ctx.fillText(title, W / 2, cy);

            if (sub) {
                ctx.font = '30px Arial';
                ctx.fillStyle = 'rgba(' + tr + ',' + tg + ',' + tb + ',0.82)';
                ctx.fillText(sub, W / 2, H / 2 + 32);
            }
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null;
    };

    EP.Registry.register(effect);
})();
