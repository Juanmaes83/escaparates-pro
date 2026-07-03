(function() {
    var effect = new EP.EffectBase('blur-dither', {
        name: 'Blur Dither',
        category: 'motion',
        icon: '🟫',
        description: 'Dithering Floyd-Steinberg con blur previo — convierte imagen a paleta reducida con difusión de error artística'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'paletteSize', type: 'select', options: [
            { v: '2', l: '2 colores (B&W puro)' },
            { v: '4', l: '4 colores' },
            { v: '8', l: '8 colores' },
            { v: '16', l: '16 colores — suave' }
        ], default: '4', label: 'Tamaño paleta' },
        { key: 'blurAmount', type: 'range', min: 0, max: 10, default: 2, step: 1, label: 'Blur previo', unit: 'px' },
        { key: 'ditherScale', type: 'range', min: 1, max: 6, default: 2, step: 1, label: 'Escala pixel dither', unit: 'px' },
        { key: 'colorMode', type: 'select', options: [
            { v: 'mono', l: 'Monocromo (grises)' },
            { v: 'color', l: 'Color' },
            { v: 'duo', l: 'Duotono' }
        ], default: 'color', label: 'Modo color' },
        { key: 'duoColor1', type: 'color', default: '#ff2244', label: 'Duotono color 1' },
        { key: 'duoColor2', type: 'color', default: '#2244ff', label: 'Duotono color 2' },
        { key: 'animSpeed', type: 'range', min: 0, max: 20, default: 5, step: 1, label: 'Velocidad ciclo paleta' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 256; this._cvs.height = 144;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        this._tex.magFilter = THREE.NearestFilter;
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, depthWrite: false });
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
        var W = this._cvs.width; var H = this._cvs.height;
        var pSz = parseInt(this.settings.paletteSize) || 4;
        var blurAmt = Math.round(this.settings.blurAmount);
        var scale = Math.max(1, Math.round(this.settings.ditherScale));
        var colorMode = this.settings.colorMode;
        var spd = this.settings.animSpeed * 0.1;
        var d1c = this.settings.duoColor1 || '#ff2244';
        var d2c = this.settings.duoColor2 || '#2244ff';
        var d1r = parseInt(d1c.slice(1,3),16), d1g = parseInt(d1c.slice(3,5),16), d1b = parseInt(d1c.slice(5,7),16);
        var d2r = parseInt(d2c.slice(1,3),16), d2g = parseInt(d2c.slice(3,5),16), d2b = parseInt(d2c.slice(5,7),16);

        // Work at reduced resolution (dither scale)
        var dW = Math.floor(W / scale); var dH = Math.floor(H / scale);
        if (this._sampCvs.width !== dW || this._sampCvs.height !== dH) {
            this._sampCvs.width = dW; this._sampCvs.height = dH;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, dW, dH);

        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, dW, dH); } catch(e) {}
        } else {
            // Animated gradient
            var t = time * 0.4;
            var grd = sc.createLinearGradient(0, 0, dW, dH);
            grd.addColorStop(0, 'hsl(' + ((t * 40) % 360) + ',80%,60%)');
            grd.addColorStop(0.5, 'hsl(' + ((t * 40 + 120) % 360) + ',70%,40%)');
            grd.addColorStop(1, 'hsl(' + ((t * 40 + 240) % 360) + ',80%,55%)');
            sc.fillStyle = grd; sc.fillRect(0, 0, dW, dH);
        }

        var imgData; try { imgData = sc.getImageData(0, 0, dW, dH); } catch(e) { return; }
        var data = imgData.data;

        // Convert to float working buffer
        var buf = new Float32Array(dW * dH * 3);
        for (var i = 0; i < dW * dH; i++) {
            buf[i*3]   = data[i*4];
            buf[i*3+1] = data[i*4+1];
            buf[i*3+2] = data[i*4+2];
        }

        // Box blur on buffer
        if (blurAmt > 0) {
            var tmp = new Float32Array(buf.length);
            for (var y = 0; y < dH; y++) {
                for (var x = 0; x < dW; x++) {
                    var sr2 = 0, sg = 0, sb = 0, cnt = 0;
                    for (var dy = -blurAmt; dy <= blurAmt; dy++) {
                        for (var dx = -blurAmt; dx <= blurAmt; dx++) {
                            var nx = Math.min(dW-1, Math.max(0, x+dx));
                            var ny = Math.min(dH-1, Math.max(0, y+dy));
                            var ni = (ny*dW+nx)*3;
                            sr2 += buf[ni]; sg += buf[ni+1]; sb += buf[ni+2]; cnt++;
                        }
                    }
                    var ti = (y*dW+x)*3;
                    tmp[ti] = sr2/cnt; tmp[ti+1] = sg/cnt; tmp[ti+2] = sb/cnt;
                }
            }
            buf = tmp;
        }

        // Floyd-Steinberg dithering
        var levels = pSz;
        var step = 255 / (levels - 1);

        for (var y = 0; y < dH; y++) {
            for (var x = 0; x < dW; x++) {
                var idx3 = (y * dW + x) * 3;
                var oldR = Math.max(0, Math.min(255, buf[idx3]));
                var oldG = Math.max(0, Math.min(255, buf[idx3+1]));
                var oldB = Math.max(0, Math.min(255, buf[idx3+2]));

                var newR, newG, newB;
                if (colorMode === 'mono') {
                    var lum = 0.299 * oldR + 0.587 * oldG + 0.114 * oldB;
                    var qLum = Math.round(lum / step) * step;
                    newR = newG = newB = qLum;
                } else if (colorMode === 'duo') {
                    var lum2 = (0.299 * oldR + 0.587 * oldG + 0.114 * oldB) / 255;
                    var t2 = Math.round(lum2 * (levels - 1)) / (levels - 1);
                    newR = d1r + (d2r - d1r) * t2;
                    newG = d1g + (d2g - d1g) * t2;
                    newB = d1b + (d2b - d1b) * t2;
                } else {
                    newR = Math.round(oldR / step) * step;
                    newG = Math.round(oldG / step) * step;
                    newB = Math.round(oldB / step) * step;
                }

                buf[idx3] = newR; buf[idx3+1] = newG; buf[idx3+2] = newB;

                var errR = oldR - newR, errG = oldG - newG, errB = oldB - newB;

                // Distribute error: right, bottom-left, bottom, bottom-right
                var distribute = function(tx, ty, factor) {
                    if (tx < 0 || tx >= dW || ty < 0 || ty >= dH) return;
                    var ni2 = (ty * dW + tx) * 3;
                    buf[ni2]   += errR * factor;
                    buf[ni2+1] += errG * factor;
                    buf[ni2+2] += errB * factor;
                };
                distribute(x+1, y,   7/16);
                distribute(x-1, y+1, 3/16);
                distribute(x,   y+1, 5/16);
                distribute(x+1, y+1, 1/16);
            }
        }

        // Write back to image data
        var outData = this._ctx.createImageData(dW, dH);
        var outD = outData.data;
        for (var i = 0; i < dW * dH; i++) {
            outD[i*4]   = Math.max(0, Math.min(255, Math.round(buf[i*3])));
            outD[i*4+1] = Math.max(0, Math.min(255, Math.round(buf[i*3+1])));
            outD[i*4+2] = Math.max(0, Math.min(255, Math.round(buf[i*3+2])));
            outD[i*4+3] = 255;
        }
        this._ctx.putImageData(outData, 0, 0);

        // Scale up to canvas size (nearest-neighbor via canvas drawImage)
        var tmpC = document.createElement('canvas');
        tmpC.width = dW; tmpC.height = dH;
        tmpC.getContext('2d').putImageData(outData, 0, 0);
        this._ctx.clearRect(0, 0, W, H);
        this._ctx.imageSmoothingEnabled = false;
        this._ctx.drawImage(tmpC, 0, 0, W, H);

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
