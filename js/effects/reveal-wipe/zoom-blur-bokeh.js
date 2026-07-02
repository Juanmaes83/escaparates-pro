(function() {
    var effect = new EP.EffectBase('zoom-blur-bokeh', {
        name: 'Zoom Blur Bokeh',
        category: 'reveal-wipe',
        icon: '🔭',
        description: 'Zoom-in reveal con desenfoque bokeh — imagen aparece desde el centro nítida'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'zoomStart', type: 'range', min: 110, max: 300, default: 180, step: 5, label: 'Zoom inicial', unit: '%' },
        { key: 'blurMax', type: 'range', min: 0, max: 30, default: 12, step: 1, label: 'Blur máximo', unit: 'px' },
        { key: 'bokehCount', type: 'range', min: 0, max: 30, default: 12, step: 1, label: 'Partículas bokeh' },
        { key: 'bokehColor', type: 'color', default: '#ffffff', label: 'Color bokeh' },
        { key: 'holdTime', type: 'range', min: 10, max: 60, default: 30, step: 5, label: 'Tiempo en foco', unit: '%' },
        { key: 'background', type: 'color', default: '#000000', label: 'Fondo' }
    ]);

    function seededRand(s) { var x = Math.sin(s+1)*43758.5453; return x-Math.floor(x); }

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

        // Pre-generate bokeh particle positions (seeded, stable)
        this._bokeh = [];
        for (var i = 0; i < 30; i++) {
            this._bokeh.push({
                x: seededRand(i * 7) * 1024,
                y: seededRand(i * 13) * 576,
                r: 8 + seededRand(i * 17) * 28,
                speed: 0.3 + seededRand(i * 3) * 0.7,
                phase: seededRand(i * 11) * Math.PI * 2
            });
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var t = (time % loopDuration) / loopDuration;

        // Phase: 0..revealEnd = zoom in + blur clears, revealEnd..holdEnd = hold, holdEnd..1 = fade
        var holdFrac = this.settings.holdTime / 100;
        var revealEnd = (1 - holdFrac) * 0.55;
        var holdEnd = revealEnd + holdFrac;

        var revealT, alpha;
        if (t < revealEnd) {
            revealT = t / revealEnd;
            alpha = 1;
        } else if (t < holdEnd) {
            revealT = 1;
            alpha = 1;
        } else {
            revealT = 1;
            alpha = 1 - (t - holdEnd) / (1 - holdEnd);
        }

        // Ease in-out
        var eased = revealT < 0.5 ? 2*revealT*revealT : 1 - 2*(1-revealT)*(1-revealT);

        var ctx = this._ctx;
        var W = this._cvs.width; var H = this._cvs.height;
        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = this.settings.background;
        ctx.fillRect(0, 0, W, H);

        // Draw zoomed image with canvas scale trick
        if (this._imgCvs) {
            var zoomStart = this.settings.zoomStart / 100;
            var scale = zoomStart - (zoomStart - 1) * eased;
            var offX = (W - W * scale) / 2;
            var offY = (H - H * scale) / 2;

            ctx.save();
            ctx.globalAlpha = Math.max(0, alpha);

            // Simulate blur by drawing multiple offset copies at low alpha
            var blurPx = this.settings.blurMax * (1 - eased);
            if (blurPx > 0.5) {
                var passes = Math.min(6, Math.round(blurPx / 2));
                var passAlpha = 0.5 / passes;
                ctx.globalAlpha = passAlpha * alpha;
                for (var p = 0; p < passes; p++) {
                    var bx = (Math.random() - 0.5) * blurPx;
                    var by = (Math.random() - 0.5) * blurPx;
                    ctx.drawImage(this._imgCvs, offX + bx, offY + by, W * scale, H * scale);
                }
                ctx.globalAlpha = (1 - 0.5) * alpha;
            } else {
                ctx.globalAlpha = Math.max(0, alpha);
            }

            ctx.drawImage(this._imgCvs, offX, offY, W * scale, H * scale);
            ctx.restore();
        } else {
            ctx.fillStyle = '#334';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.fillText('ZOOM BOKEH', W/2, H/2);
            ctx.globalAlpha = 1;
        }

        // Bokeh particles — visible when blurry (start), fade as focus arrives
        var bokehAlpha = (1 - eased) * Math.max(0, alpha);
        if (bokehAlpha > 0.01) {
            var numBokeh = Math.round(this.settings.bokehCount);
            var bHex = this.settings.bokehColor || '#ffffff';
            var br = parseInt(bHex.slice(1,3),16);
            var bg = parseInt(bHex.slice(3,5),16);
            var bb = parseInt(bHex.slice(5,7),16);

            for (var i = 0; i < numBokeh && i < this._bokeh.length; i++) {
                var b = this._bokeh[i];
                var bx2 = b.x + Math.sin(time * b.speed + b.phase) * 20;
                var by2 = b.y + Math.cos(time * b.speed * 0.7 + b.phase) * 15;
                var grad = ctx.createRadialGradient(bx2, by2, 0, bx2, by2, b.r);
                grad.addColorStop(0, 'rgba(' + br + ',' + bg + ',' + bb + ',' + (bokehAlpha * 0.6) + ')');
                grad.addColorStop(0.5, 'rgba(' + br + ',' + bg + ',' + bb + ',' + (bokehAlpha * 0.15) + ')');
                grad.addColorStop(1, 'rgba(' + br + ',' + bg + ',' + bb + ',0)');
                ctx.beginPath();
                ctx.arc(bx2, by2, b.r, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null;
    };

    EP.Registry.register(effect);
})();
