(function() {
    var effect = new EP.EffectBase('old-tv', {
        name: 'Old TV',
        category: 'flicker',
        icon: '📺',
        description: 'Imagen en televisor antiguo — curvatura CRT, vignette y señal con interferencias'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'scanlineIntensity', type: 'range', min: 0, max: 100, default: 55, step: 5, label: 'Scanlines', unit: '%' },
        { key: 'noiseIntensity', type: 'range', min: 0, max: 100, default: 25, step: 5, label: 'Ruido', unit: '%' },
        { key: 'rollSpeed', type: 'range', min: 0, max: 20, default: 0, step: 1, label: 'Velocidad roll' },
        { key: 'signalLoss', type: 'range', min: 0, max: 100, default: 20, step: 5, label: 'Pérdida señal', unit: '%' },
        { key: 'phosphorColor', type: 'color', default: '#33ff33', label: 'Fósforo (sin imagen)' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 512; this._cvs.height = 384; // 4:3 ratio like old TV
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        this._tex.magFilter = THREE.NearestFilter;
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        group.add(new THREE.Mesh(geo, mat));

        this._imgCvs = null;
        var m0 = mediaList && mediaList[0];
        var el0 = m0 && (m0.element || (m0.texture && m0.texture.image));
        if (el0) {
            var oc = document.createElement('canvas');
            oc.width = 512; oc.height = 384;
            try { oc.getContext('2d').drawImage(el0, 0, 0, 512, 384); this._imgCvs = oc; } catch(e) {}
        }
        this._rollOffset = 0;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var sl = this.settings.scanlineIntensity / 100;
        var noise = this.settings.noiseIntensity / 100;
        var rollSpd = this.settings.rollSpeed;
        var signalLoss = this.settings.signalLoss / 100;
        var phosphorHex = this.settings.phosphorColor || '#33ff33';

        // Roll offset
        this._rollOffset = (this._rollOffset + rollSpd * (dt || 0.016) * 100) % H;

        ctx.clearRect(0, 0, W, H);

        // Draw image with roll
        if (this._imgCvs) {
            var roll = Math.round(this._rollOffset);
            ctx.drawImage(this._imgCvs, 0, roll, W, H - roll, 0, 0, W, H - roll);
            ctx.drawImage(this._imgCvs, 0, 0, W, roll, 0, H - roll, W, roll);
        } else {
            // Phosphor test pattern
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = phosphorHex;
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('NO SIGNAL', W/2, H/2 - 20);
            // Horizontal lines test pattern
            for (var i = 0; i < 8; i++) {
                ctx.fillStyle = 'hsl(' + (i*45) + ',100%,50%)';
                ctx.fillRect(i * W/8, H*0.7, W/8, H*0.1);
            }
        }

        // Signal loss — random horizontal bars
        if (signalLoss > 0 && Math.random() < signalLoss * 0.4) {
            var barY = Math.random() * H;
            var barH = 2 + Math.random() * 20;
            var shift = (Math.random() - 0.5) * W * signalLoss * 0.5;
            var imgData = ctx.getImageData(0, Math.floor(barY), W, Math.ceil(barH));
            ctx.clearRect(0, Math.floor(barY), W, Math.ceil(barH));
            ctx.putImageData(imgData, Math.round(shift), Math.floor(barY));
        }

        // Scanlines
        if (sl > 0) {
            ctx.fillStyle = 'rgba(0,0,0,' + (sl * 0.6) + ')';
            for (var y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
        }

        // Noise
        if (noise > 0) {
            var imgD = ctx.getImageData(0, 0, W, H);
            var data = imgD.data;
            var step = Math.max(1, Math.round(3 / noise));
            for (var i = 0; i < data.length; i += 4 * step) {
                var n2 = (Math.random() - 0.5) * 255 * noise * 0.4;
                data[i] = Math.min(255, Math.max(0, data[i] + n2));
                data[i+1] = Math.min(255, Math.max(0, data[i+1] + n2));
                data[i+2] = Math.min(255, Math.max(0, data[i+2] + n2));
            }
            ctx.putImageData(imgD, 0, 0);
        }

        // CRT vignette
        var vig = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, W*0.7);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);

        // Phosphor glow tint
        if (!this._imgCvs) {
            var pr = parseInt(phosphorHex.slice(1,3),16);
            var pg = parseInt(phosphorHex.slice(3,5),16);
            var pb = parseInt(phosphorHex.slice(5,7),16);
            ctx.fillStyle = 'rgba(' + pr + ',' + pg + ',' + pb + ',0.08)';
            ctx.fillRect(0, 0, W, H);
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null;
    };

    EP.Registry.register(effect);
})();
