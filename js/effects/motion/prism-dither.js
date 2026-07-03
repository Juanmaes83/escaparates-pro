(function() {
    var effect = new EP.EffectBase('prism-dither', {
        name: 'Prism Dither',
        category: 'motion',
        icon: '🌈',
        description: 'Dithering prismático — aberración cromática por canales + Floyd-Steinberg por separado, dispersión espectral estilo ditther.com'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'chromaticShift', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Separación cromática', unit: 'px' },
        { key: 'ditherLevels', type: 'range', min: 2, max: 8, default: 4, step: 1, label: 'Niveles dithering' },
        { key: 'ditherStyle', type: 'select', options: [
            { v: 'floyd', l: 'Floyd-Steinberg' },
            { v: 'bayer', l: 'Bayer 4×4 ordenado' },
            { v: 'none', l: 'Solo aberración' }
        ], default: 'floyd', label: 'Algoritmo' },
        { key: 'prismAngle', type: 'range', min: 0, max: 360, default: 90, step: 15, label: 'Ángulo dispersión', unit: '°' },
        { key: 'animShift', type: 'select', options: [
            { v: 'off', l: 'Estático' },
            { v: 'pulse', l: 'Pulso' },
            { v: 'wave', l: 'Ola' }
        ], default: 'pulse', label: 'Animación' },
        { key: 'animSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad animación' }
    ]);

    var BAYER4_P = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];

    function floydSingleChannel(buf, W, H, levels) {
        var step = 255 / (levels - 1);
        for (var y = 0; y < H; y++) {
            for (var x = 0; x < W; x++) {
                var idx = y * W + x;
                var old = Math.max(0, Math.min(255, buf[idx]));
                var newV = Math.round(old / step) * step;
                buf[idx] = newV;
                var err = old - newV;
                if (x+1 < W)           buf[y*W+(x+1)]         += err * 7/16;
                if (x-1 >= 0 && y+1 < H) buf[(y+1)*W+(x-1)]   += err * 3/16;
                if (y+1 < H)            buf[(y+1)*W+x]          += err * 5/16;
                if (x+1 < W && y+1 < H) buf[(y+1)*W+(x+1)]     += err * 1/16;
            }
        }
        return buf;
    }

    function bayerSingleChannel(buf, W, H, levels) {
        var step = 255 / (levels - 1);
        for (var y = 0; y < H; y++) {
            for (var x = 0; x < W; x++) {
                var idx = y * W + x;
                var threshold = (BAYER4_P[y%4][x%4] / 16 - 0.5) * 64;
                var v = Math.max(0, Math.min(255, buf[idx] + threshold));
                buf[idx] = Math.round(v / step) * step;
            }
        }
        return buf;
    }

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
        this._m0 = null;
        var m0 = mediaList && mediaList[0];
        if (m0) {
            this._m0 = m0;
            var el = m0.element || (m0.texture && m0.texture.image);
            if (el) this._media = el;
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var W = this._cvs.width; var H = this._cvs.height;
        var ctx = this._ctx;
        var levels = Math.max(2, Math.round(this.settings.ditherLevels));
        var style = this.settings.ditherStyle;
        var angle = this.settings.prismAngle * Math.PI / 180;
        var animStyle = this.settings.animShift;
        var spd = this.settings.animSpeed;

        // Animated chromatic shift
        var baseShift = this.settings.chromaticShift;
        var shift;
        switch(animStyle) {
            case 'pulse': shift = baseShift * (0.5 + 0.5 * Math.abs(Math.sin(time * spd * 0.3))); break;
            case 'wave':  shift = baseShift * (0.5 + 0.5 * Math.sin(time * spd * 0.2)); break;
            default:      shift = baseShift;
        }

        var dxR =  Math.cos(angle) * shift;
        var dyR =  Math.sin(angle) * shift;
        var dxB = -Math.cos(angle) * shift;
        var dyB = -Math.sin(angle) * shift;

        // Poll for media element if not yet available
        if (this._m0 && !this._media) {
            var el2 = this._m0.element || (this._m0.texture && this._m0.texture.image);
            if (el2) this._media = el2;
        }

        // Check media readiness before drawImage
        var mediaReady = false;
        if (this._media) {
            var _el = this._media;
            if (_el.tagName === 'VIDEO') mediaReady = _el.readyState >= 2;
            else if (_el.tagName === 'IMG') mediaReady = _el.complete && _el.naturalHeight > 0;
            else mediaReady = true;
        }

        if (this._sampCvs.width !== W || this._sampCvs.height !== H) {
            this._sampCvs.width = W; this._sampCvs.height = H;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, W, H);
        if (mediaReady) {
            try { sc.drawImage(this._media, 0, 0, W, H); } catch(e) {}
        } else {
            // Demo gradient while no media or media loading
            var grd = sc.createLinearGradient(0, 0, W, H);
            grd.addColorStop(0, 'hsl('+((time*30)%360)+',80%,60%)');
            grd.addColorStop(0.5, 'hsl('+((time*30+100)%360)+',70%,50%)');
            grd.addColorStop(1, 'hsl('+((time*30+200)%360)+',80%,40%)');
            sc.fillStyle = grd; sc.fillRect(0, 0, W, H);
        }

        var imgData; try { imgData = sc.getImageData(0, 0, W, H); } catch(e){ return; }
        var data = imgData.data;

        // Extract channels with chromatic aberration shift
        var rBuf = new Float32Array(W * H);
        var gBuf = new Float32Array(W * H);
        var bBuf = new Float32Array(W * H);

        for (var y = 0; y < H; y++) {
            for (var x = 0; x < W; x++) {
                // Red channel shifted +
                var rxs = Math.round(x + dxR), rys = Math.round(y + dyR);
                rxs = Math.max(0, Math.min(W-1, rxs)); rys = Math.max(0, Math.min(H-1, rys));
                rBuf[y*W+x] = data[(rys*W+rxs)*4];

                // Green channel unshifted
                gBuf[y*W+x] = data[(y*W+x)*4+1];

                // Blue channel shifted -
                var bxs = Math.round(x + dxB), bys = Math.round(y + dyB);
                bxs = Math.max(0, Math.min(W-1, bxs)); bys = Math.max(0, Math.min(H-1, bys));
                bBuf[y*W+x] = data[(bys*W+bxs)*4+2];
            }
        }

        // Apply dithering to each channel
        if (style === 'floyd') {
            floydSingleChannel(rBuf, W, H, levels);
            floydSingleChannel(gBuf, W, H, levels);
            floydSingleChannel(bBuf, W, H, levels);
        } else if (style === 'bayer') {
            bayerSingleChannel(rBuf, W, H, levels);
            bayerSingleChannel(gBuf, W, H, levels);
            bayerSingleChannel(bBuf, W, H, levels);
        }

        // Recombine
        var outData = ctx.createImageData(W, H);
        var out = outData.data;
        for (var i = 0; i < W * H; i++) {
            out[i*4]   = Math.max(0, Math.min(255, Math.round(rBuf[i])));
            out[i*4+1] = Math.max(0, Math.min(255, Math.round(gBuf[i])));
            out[i*4+2] = Math.max(0, Math.min(255, Math.round(bBuf[i])));
            out[i*4+3] = 255;
        }
        ctx.putImageData(outData, 0, 0);
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
