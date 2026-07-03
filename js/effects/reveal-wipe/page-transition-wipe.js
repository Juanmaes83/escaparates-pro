(function() {
    var effect = new EP.EffectBase('page-transition-wipe', {
        name: 'Page Transition Wipe',
        category: 'reveal-wipe',
        icon: '🎬',
        description: 'Transición wipe entre imágenes — estilos cortinilla, diagonal, radial, persiana y tinta, inspirado en PageTransitions fork'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'wipeStyle', type: 'select', options: [
            { v: 'curtain', l: 'Cortinilla horizontal' },
            { v: 'diagonal', l: 'Diagonal 45°' },
            { v: 'radial', l: 'Circular radial' },
            { v: 'blinds', l: 'Persiana — strips' },
            { v: 'ink', l: 'Tinta — orgánico' },
            { v: 'cross', l: 'Aspa (cross)' }
        ], default: 'curtain', label: 'Estilo transición' },
        { key: 'transitionSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad transición' },
        { key: 'stripCount', type: 'range', min: 3, max: 20, default: 8, step: 1, label: 'Número strips (persiana)', unit: 'tiras' },
        { key: 'wipeColor', type: 'color', default: '#111111', label: 'Color banda de transición' },
        { key: 'holdTime', type: 'range', min: 1, max: 8, default: 3, step: 0.5, label: 'Tiempo hold por imagen', unit: 's' },
        { key: 'easing', type: 'select', options: [
            { v: 'smooth', l: 'Smooth (cubic)' },
            { v: 'linear', l: 'Linear' },
            { v: 'elastic', l: 'Elastic' }
        ], default: 'smooth', label: 'Easing' }
    ]);

    function easeInOut(t) { return t * t * (3 - 2 * t); }
    function easeLinear(t) { return t; }
    function easeElastic(t) {
        if (t === 0 || t === 1) return t;
        var p = 0.4;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, depthWrite: false });
        group.add(new THREE.Mesh(geo, mat));

        this._media = [];
        if (mediaList) {
            for (var i = 0; i < mediaList.length; i++) {
                var m = mediaList[i];
                var el = m && (m.element || (m.texture && m.texture.image));
                if (el) this._media.push(el);
            }
        }
        this._imgIndex = 0;
        this._nextIndex = 1;
        this._transPhase = 0; // 0=hold A, 0.5=wipe out, 1=hold B
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var style = this.settings.wipeStyle;
        var spd = this.settings.transitionSpeed * 0.3;
        var nStrips = Math.round(this.settings.stripCount);
        var wipeC = this.settings.wipeColor || '#111111';
        var holdT = this.settings.holdTime;
        var easingName = this.settings.easing;
        var media = this._media;

        var easeFunc = easingName === 'elastic' ? easeElastic : (easingName === 'linear' ? easeLinear : easeInOut);

        // Cycle timing: holdA | wipe-in | wipe-out | holdB | ...
        var cycleDur = holdT * 2 + 2 / spd;
        var t2 = time % cycleDur;
        var phase; // 0 = showing A, 1 = showing B fully
        var transInProgress = false;

        if (t2 < holdT) {
            phase = 0;
        } else if (t2 < holdT + 1 / spd) {
            phase = easeFunc(Math.min(1, (t2 - holdT) * spd));
            transInProgress = true;
        } else if (t2 < holdT + 2 / spd) {
            phase = 1;
        } else {
            phase = 0;
            // Advance image on new cycle if fresh start
        }

        // Which images?
        var cycleCount = Math.floor(time / cycleDur);
        var imgA, imgB;
        if (media.length >= 2) {
            var ai = cycleCount % media.length;
            var bi = (cycleCount + 1) % media.length;
            imgA = media[ai]; imgB = media[bi];
        } else if (media.length === 1) {
            imgA = imgB = media[0];
        }

        // Helper to draw an image or color fallback
        function drawImg(img, x, y, w, h, fallbackHue) {
            if (img) {
                try { ctx.drawImage(img, x, y, w, h); return; } catch(e) {}
            }
            var g = ctx.createLinearGradient(x, y, x+w, y+h);
            g.addColorStop(0, 'hsl(' + fallbackHue + ',60%,35%)');
            g.addColorStop(1, 'hsl(' + ((fallbackHue+80)%360) + ',70%,25%)');
            ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        }

        ctx.clearRect(0, 0, W, H);

        // Always draw A as base
        drawImg(imgA, 0, 0, W, H, 210);

        if (phase <= 0) { this._tex.needsUpdate = true; return; }

        // Draw B under clip region based on style, and/or cover with wipeC band
        switch(style) {
            case 'curtain':
                var wX = phase * W;
                // Draw B in the revealed region
                ctx.save();
                ctx.beginPath(); ctx.rect(0, 0, wX, H); ctx.clip();
                drawImg(imgB, 0, 0, W, H, 30);
                ctx.restore();
                // Transition band edge
                var bW = W * 0.04;
                var grd = ctx.createLinearGradient(wX - bW, 0, wX + bW, 0);
                grd.addColorStop(0, 'rgba(0,0,0,0)');
                grd.addColorStop(0.4, wipeC);
                grd.addColorStop(0.6, wipeC);
                grd.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grd;
                ctx.fillRect(wX - bW, 0, bW * 2, H);
                break;

            case 'diagonal':
                var diag = phase * (W + H);
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(0, 0); ctx.lineTo(diag, 0); ctx.lineTo(diag - H, H); ctx.lineTo(0, H);
                ctx.closePath(); ctx.clip();
                drawImg(imgB, 0, 0, W, H, 30);
                ctx.restore();
                // Diagonal edge line
                ctx.save();
                ctx.strokeStyle = wipeC; ctx.lineWidth = W * 0.025;
                ctx.beginPath(); ctx.moveTo(diag, 0); ctx.lineTo(diag - H, H); ctx.stroke();
                ctx.restore();
                break;

            case 'radial':
                var rad = phase * Math.sqrt(W * W + H * H) * 0.75;
                ctx.save();
                ctx.beginPath(); ctx.arc(W/2, H/2, rad, 0, Math.PI * 2); ctx.clip();
                drawImg(imgB, 0, 0, W, H, 30);
                ctx.restore();
                // Ring edge
                if (phase > 0.02 && phase < 0.98) {
                    ctx.save();
                    ctx.strokeStyle = wipeC; ctx.lineWidth = W * 0.02;
                    ctx.beginPath(); ctx.arc(W/2, H/2, rad, 0, Math.PI * 2); ctx.stroke();
                    ctx.restore();
                }
                break;

            case 'blinds':
                var stripH = H / nStrips;
                ctx.save();
                ctx.beginPath();
                for (var s = 0; s < nStrips; s++) {
                    var delay = s / nStrips * 0.4;
                    var stripPhase = Math.max(0, Math.min(1, (phase - delay) / (1 - delay)));
                    var sw = stripPhase * W;
                    ctx.rect(0, s * stripH, sw, stripH);
                }
                ctx.clip();
                drawImg(imgB, 0, 0, W, H, 30);
                ctx.restore();
                break;

            case 'ink':
                // Organic ink spread: multiple growing circles from random (seeded) positions
                var inkCount = 8;
                ctx.save();
                ctx.beginPath();
                for (var k = 0; k < inkCount; k++) {
                    var seed = (k * 17 + 1) % 100 / 100;
                    var seed2 = (k * 31 + 7) % 100 / 100;
                    var delay2 = seed * 0.3;
                    var ip = Math.max(0, Math.min(1, (phase - delay2) / 0.7));
                    ip = ip * ip;
                    var cx2 = seed * W * 0.8 + W * 0.1;
                    var cy2 = seed2 * H * 0.7 + H * 0.15;
                    var ir = ip * Math.sqrt(W * W + H * H) * 0.5 * (0.6 + seed * 0.4);
                    if (ir > 0.5) { ctx.arc(cx2, cy2, ir, 0, Math.PI * 2); ctx.closePath(); }
                }
                ctx.clip();
                drawImg(imgB, 0, 0, W, H, 30);
                ctx.restore();
                break;

            case 'cross':
                // Four quadrant wipe from center
                ctx.save();
                ctx.beginPath();
                var hw = phase * W / 2; var hh = phase * H / 2;
                // Top-left
                ctx.rect(W/2 - hw, H/2 - hh, hw, hh);
                // Top-right
                ctx.rect(W/2, H/2 - hh, hw, hh);
                // Bottom-left
                ctx.rect(W/2 - hw, H/2, hw, hh);
                // Bottom-right
                ctx.rect(W/2, H/2, hw, hh);
                ctx.clip();
                drawImg(imgB, 0, 0, W, H, 30);
                ctx.restore();
                break;
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
