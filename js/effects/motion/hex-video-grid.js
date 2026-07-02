(function() {
    var effect = new EP.EffectBase('hex-video-grid', {
        name: 'Hex Video Grid',
        category: 'motion',
        icon: '⬡',
        description: 'Grid hexagonal reactivo a imagen — tamaño de cada hex responde a la luminancia del pixel'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'hexSize', type: 'range', min: 8, max: 50, default: 20, step: 2, label: 'Tamaño hex base', unit: 'px' },
        { key: 'reactivity', type: 'range', min: 0, max: 100, default: 70, step: 5, label: 'Reactividad lum.', unit: '%' },
        { key: 'animSpeed', type: 'range', min: 0, max: 20, default: 5, step: 1, label: 'Velocidad animación' },
        { key: 'colorMode', type: 'select', options: [
            { v: 'source', l: 'Color de imagen' },
            { v: 'hsl', l: 'HSL cíclico' },
            { v: 'mono', l: 'Monocromo' }
        ], default: 'source', label: 'Color' },
        { key: 'monoColor', type: 'color', default: '#00ffcc', label: 'Color mono' },
        { key: 'bgColor', type: 'color', default: '#000000', label: 'Color fondo' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 2, step: 1, label: 'Separación', unit: 'px' }
    ]);

    function hexPath(ctx, x, y, r) {
        ctx.beginPath();
        for (var i = 0; i < 6; i++) {
            var a = Math.PI / 180 * (60 * i - 30);
            var px = x + r * Math.cos(a);
            var py = y + r * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 512; this._cvs.height = 288;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        group.add(new THREE.Mesh(geo, mat));

        this._sampCvs = document.createElement('canvas');
        this._sampCtx = this._sampCvs.getContext('2d');
        this._media = null;
        var m0 = mediaList && mediaList[0];
        if (m0) {
            var el = m0.element || (m0.texture && m0.texture.image);
            if (el) this._media = el;
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var hexBase = this.settings.hexSize;
        var reactivity = this.settings.reactivity / 100;
        var spd = this.settings.animSpeed * 0.3;
        var colorMode = this.settings.colorMode;
        var monoC = this.settings.monoColor || '#00ffcc';
        var bgC = this.settings.bgColor || '#000000';
        var gap = this.settings.gap;
        var mr = parseInt(monoC.slice(1,3),16), mg = parseInt(monoC.slice(3,5),16), mb = parseInt(monoC.slice(5,7),16);

        // Sample image at reduced resolution
        var sampW = Math.round(W / hexBase * 1.5);
        var sampH = Math.round(H / hexBase * 1.5);
        this._sampCvs.width = sampW; this._sampCvs.height = sampH;
        var sc = this._sampCtx;
        sc.clearRect(0, 0, sampW, sampH);

        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, sampW, sampH); } catch(e) {}
        } else {
            var grd = sc.createLinearGradient(0, 0, sampW, sampH);
            grd.addColorStop(0, 'hsl(' + ((time * 40) % 360) + ',80%,50%)');
            grd.addColorStop(0.5, 'hsl(' + ((time * 40 + 120) % 360) + ',80%,40%)');
            grd.addColorStop(1, 'hsl(' + ((time * 40 + 240) % 360) + ',80%,30%)');
            sc.fillStyle = grd; sc.fillRect(0, 0, sampW, sampH);
        }

        var imgData;
        try { imgData = sc.getImageData(0, 0, sampW, sampH); } catch(e) { return; }
        var data = imgData.data;

        ctx.fillStyle = bgC;
        ctx.fillRect(0, 0, W, H);

        // Hex grid
        var hexW = hexBase * Math.sqrt(3);
        var hexH = hexBase * 2;
        var cols = Math.ceil(W / hexW) + 2;
        var rows = Math.ceil(H / (hexH * 0.75)) + 2;

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var hx = col * hexW + (row % 2 === 0 ? 0 : hexW / 2) - hexW / 2;
                var hy = row * hexH * 0.75 - hexH / 2;

                // Sample luminance from corresponding image region
                var sx = Math.min(sampW - 1, Math.floor(hx / W * sampW));
                var sy = Math.min(sampH - 1, Math.floor(hy / H * sampH));
                if (sx < 0) sx = 0; if (sy < 0) sy = 0;
                var idx = (sy * sampW + sx) * 4;
                var rd = data[idx]; var gd = data[idx+1]; var bd = data[idx+2];
                var lum = (0.299*rd + 0.587*gd + 0.114*bd) / 255;

                // Animate lum with time
                var animLum = lum + Math.sin(time * spd + col * 0.5 + row * 0.3) * 0.15 * spd;
                animLum = Math.min(1, Math.max(0.05, animLum));

                var r = hexBase * (1 - gap / hexBase) * (0.2 + reactivity * animLum + (1 - reactivity) * 0.5);
                if (r < 1) continue;

                var fillStyle;
                switch(colorMode) {
                    case 'source':
                        fillStyle = 'rgb(' + rd + ',' + gd + ',' + bd + ')'; break;
                    case 'hsl':
                        var hue = (lum * 240 + time * 30) % 360;
                        fillStyle = 'hsl(' + hue + ',80%,' + (30 + lum * 40) + '%)'; break;
                    case 'mono':
                        fillStyle = 'rgba(' + mr + ',' + mg + ',' + mb + ',' + (0.3 + lum * 0.7) + ')'; break;
                    default: fillStyle = '#fff';
                }
                ctx.fillStyle = fillStyle;
                hexPath(ctx, hx, hy, r);
                ctx.fill();
            }
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
