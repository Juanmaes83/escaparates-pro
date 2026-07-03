(function() {
    var effect = new EP.EffectBase('hologram', {
        name: 'Hologram',
        category: 'motion',
        icon: '👁️',
        description: 'Holograma escáner — scanlines HUD, barrido de luz, aberración cromática, detección de bordes, flicker estilo ditther.com'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'holoColor', type: 'color', default: '#00eeff', label: 'Color holograma' },
        { key: 'scanlineGap', type: 'range', min: 2, max: 10, default: 3, step: 1, label: 'Espacio scanlines', unit: 'px' },
        { key: 'scanSpeed', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Velocidad barrido' },
        { key: 'edgeGlow', type: 'range', min: 0, max: 100, default: 60, step: 5, label: 'Glow de bordes', unit: '%' },
        { key: 'chromAberration', type: 'range', min: 0, max: 12, default: 4, step: 1, label: 'Aberración cromática', unit: 'px' },
        { key: 'flicker', type: 'range', min: 0, max: 100, default: 30, step: 5, label: 'Intensidad flicker', unit: '%' },
        { key: 'tintStrength', type: 'range', min: 0, max: 100, default: 70, step: 5, label: 'Tinte holográfico', unit: '%' },
        { key: 'glitchLines', type: 'select', options: [
            { v: 'on', l: 'Con glitch lines' },
            { v: 'off', l: 'Sin glitch' }
        ], default: 'on', label: 'Glitch horizontal' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 512; this._cvs.height = 288;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, depthWrite: false });
        group.add(new THREE.Mesh(geo, mat));
        this._sampCvs = document.createElement('canvas');
        this._sampCtx = this._sampCvs.getContext('2d');
        this._media = null;
        var m0 = mediaList && mediaList[0];
        if (m0) { var el = m0.element || (m0.texture && m0.texture.image); if (el) this._media = el; }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var hc = this.settings.holoColor || '#00eeff';
        var scanGap = Math.max(2, Math.round(this.settings.scanlineGap));
        var scanSpd = this.settings.scanSpeed;
        var edgeG = this.settings.edgeGlow / 100;
        var chrom = Math.round(this.settings.chromAberration);
        var flickInt = this.settings.flicker / 100;
        var tint = this.settings.tintStrength / 100;
        var glitch = this.settings.glitchLines === 'on';

        var hr = parseInt(hc.slice(1,3),16), hg = parseInt(hc.slice(3,5),16), hb = parseInt(hc.slice(5,7),16);

        if (this._sampCvs.width !== W || this._sampCvs.height !== H) {
            this._sampCvs.width = W; this._sampCvs.height = H;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, W, H);
        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, W, H); } catch(e) {}
        } else {
            var grd = sc.createLinearGradient(0, 0, W, H);
            grd.addColorStop(0, 'hsl(190,80%,50%)');
            grd.addColorStop(1, 'hsl(250,70%,30%)');
            sc.fillStyle = grd; sc.fillRect(0, 0, W, H);
        }

        var imgData; try { imgData = sc.getImageData(0, 0, W, H); } catch(e){ return; }
        var data = imgData.data;

        // Flicker factor
        var flicker = 1 - flickInt * Math.random() * 0.4;

        // Glitch: occasional horizontal shift
        var glitchY = -1, glitchShift = 0;
        if (glitch && Math.random() < 0.03) {
            glitchY = Math.floor(Math.random() * H);
            glitchShift = Math.floor((Math.random() - 0.5) * 30);
        }

        // Build output pixel by pixel
        var outData = ctx.createImageData(W, H);
        var out = outData.data;

        for (var y = 0; y < H; y++) {
            for (var x = 0; x < W; x++) {
                var sx = x;
                // Apply glitch shift
                if (glitch && Math.abs(y - glitchY) < 4) sx = Math.max(0, Math.min(W-1, x + glitchShift));

                var idx = (y * W + sx) * 4;
                var rd = data[idx], gd = data[idx+1], bd = data[idx+2];

                // Chromatic aberration on R and B
                var rxs = Math.max(0, Math.min(W-1, sx + chrom));
                var bxs = Math.max(0, Math.min(W-1, sx - chrom));
                var rdShift = data[(y*W+rxs)*4];
                var bdShift = data[(y*W+bxs)*4+2];

                // Tint toward hologram color
                var tr2 = rd + (hr - rd) * tint * 0.7;
                var tg2 = gd + (hg - gd) * tint * 0.7;
                var tb2 = bd + (hb - bd) * tint * 0.7;

                // Edge detection (simple Sobel approx on luminance)
                var edge = 0;
                if (edgeG > 0 && x > 0 && x < W-1 && y > 0 && y < H-1) {
                    var l00 = 0.299*data[((y-1)*W+(sx-1))*4] + 0.587*data[((y-1)*W+(sx-1))*4+1] + 0.114*data[((y-1)*W+(sx-1))*4+2];
                    var l02 = 0.299*data[((y-1)*W+(sx+1))*4] + 0.587*data[((y-1)*W+(sx+1))*4+1] + 0.114*data[((y-1)*W+(sx+1))*4+2];
                    var l20 = 0.299*data[((y+1)*W+(sx-1))*4] + 0.587*data[((y+1)*W+(sx-1))*4+1] + 0.114*data[((y+1)*W+(sx-1))*4+2];
                    var l22 = 0.299*data[((y+1)*W+(sx+1))*4] + 0.587*data[((y+1)*W+(sx+1))*4+1] + 0.114*data[((y+1)*W+(sx+1))*4+2];
                    var lc  = 0.299*rd + 0.587*gd + 0.114*bd;
                    var gx = l22+2*data[(y*W+(sx+1))*4]+l02 - l20-2*data[(y*W+(sx-1))*4]-l00;
                    var gy2 = l20+2*data[((y+1)*W+sx)*4]+l22 - l00-2*data[((y-1)*W+sx)*4]-l02;
                    edge = Math.min(1, Math.sqrt(gx*gx+gy2*gy2) / 300) * edgeG;
                }

                var finalR = Math.min(255, tr2 + edge * hr * 0.8);
                var finalG = Math.min(255, tg2 + edge * hg * 0.8);
                var finalB = Math.min(255, tb2 + edge * hb * 0.8);

                out[(y*W+x)*4]   = finalR * flicker;
                out[(y*W+x)*4+1] = finalG * flicker;
                out[(y*W+x)*4+2] = finalB * flicker;
                out[(y*W+x)*4+3] = 255;
            }
        }

        ctx.putImageData(outData, 0, 0);

        // Scanlines overlay
        for (var sy = 0; sy < H; sy += scanGap) {
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(0, sy, W, 1);
        }

        // Moving scan line
        var scanY = ((time * scanSpd * 0.5) % 1.2 - 0.1) * H;
        var scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
        scanGrad.addColorStop(0, 'rgba('+hr+','+hg+','+hb+',0)');
        scanGrad.addColorStop(0.5, 'rgba('+hr+','+hg+','+hb+',0.35)');
        scanGrad.addColorStop(1, 'rgba('+hr+','+hg+','+hb+',0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 20, W, 40);

        // Vignette
        var vigGrad = ctx.createRadialGradient(W/2,H/2,W*0.2,W/2,H/2,W*0.75);
        vigGrad.addColorStop(0,'rgba(0,0,0,0)');
        vigGrad.addColorStop(1,'rgba(0,0,0,0.5)');
        ctx.fillStyle = vigGrad; ctx.fillRect(0,0,W,H);

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
