(function() {
    var effect = new EP.EffectBase('glitch-rgb', {
        name: 'Glitch RGB',
        category: 'flicker',
        icon: '🌈',
        description: 'Glitch con separación de canales RGB — aberración cromática digital con tiras distorsionadas'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'rgbShift', type: 'range', min: 0, max: 40, default: 8, step: 1, label: 'Desplazamiento RGB', unit: 'px' },
        { key: 'glitchRate', type: 'range', min: 1, max: 30, default: 8, step: 1, label: 'Frecuencia glitch' },
        { key: 'glitchIntensity', type: 'range', min: 10, max: 100, default: 60, step: 5, label: 'Intensidad', unit: '%' },
        { key: 'sliceCount', type: 'range', min: 1, max: 15, default: 5, step: 1, label: 'Tiras distorsión' },
        { key: 'sliceShift', type: 'range', min: 0, max: 80, default: 25, step: 5, label: 'Desplaz. tiras', unit: 'px' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 512; this._cvs.height = 288;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        group.add(new THREE.Mesh(geo, mat));

        this._imgCvs = null;
        var m0 = mediaList && mediaList[0];
        var el0 = m0 && (m0.element || (m0.texture && m0.texture.image));
        if (el0) {
            var oc = document.createElement('canvas'); oc.width = 512; oc.height = 288;
            try { oc.getContext('2d').drawImage(el0, 0, 0, 512, 288); this._imgCvs = oc; } catch(e) {}
        }
        this._glitchOn = false;
        this._nextGlitch = 0;
        this._glitchEnd = 0;
        this._slices = [];
        this._offCvs = document.createElement('canvas');
        this._offCvs.width = 512; this._offCvs.height = 288;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var shift = this.settings.rgbShift;
        var rate = this.settings.glitchRate;
        var intensity = this.settings.glitchIntensity / 100;
        var sliceN = Math.round(this.settings.sliceCount);
        var sliceShift = this.settings.sliceShift;

        if (time > this._nextGlitch) {
            this._glitchOn = Math.random() < intensity;
            if (this._glitchOn) {
                this._glitchEnd = time + 0.04 + Math.random() * 0.12;
                this._slices = [];
                for (var i = 0; i < sliceN; i++) {
                    this._slices.push({
                        y: Math.random() * H,
                        h: 1 + Math.random() * 18,
                        x: (Math.random() - 0.5) * sliceShift
                    });
                }
            }
            this._nextGlitch = time + 0.08 / rate + Math.random() * 0.15 / rate;
        }
        if (time > this._glitchEnd) this._glitchOn = false;

        ctx.clearRect(0, 0, W, H);

        if (this._imgCvs) {
            var offCtx = this._offCvs.getContext('2d');
            offCtx.clearRect(0, 0, W, H);
            offCtx.drawImage(this._imgCvs, 0, 0, W, H);

            if (this._glitchOn) {
                for (var j = 0; j < this._slices.length; j++) {
                    var sl = this._slices[j];
                    try {
                        var sly = Math.floor(sl.y);
                        var slh = Math.max(1, Math.ceil(sl.h));
                        if (sly + slh <= H) {
                            var imgSlice = offCtx.getImageData(0, sly, W, slh);
                            offCtx.clearRect(0, sly, W, slh);
                            offCtx.putImageData(imgSlice, Math.round(sl.x), sly);
                        }
                    } catch(e) {}
                }
            }

            var s = this._glitchOn ? shift : shift * 0.15;
            var id = offCtx.getImageData(0, 0, W, H);
            var src = id.data;
            var outId = ctx.createImageData(W, H);
            var out = outId.data;
            var rShift = Math.round(s);
            var bShift = -Math.round(s * 0.65);

            for (var y = 0; y < H; y++) {
                for (var x = 0; x < W; x++) {
                    var base = (y * W + x) * 4;
                    var rx = Math.min(W - 1, Math.max(0, x + rShift));
                    var bx = Math.min(W - 1, Math.max(0, x + bShift));
                    var rIdx = (y * W + rx) * 4;
                    var bIdx = (y * W + bx) * 4;
                    out[base]     = src[rIdx];
                    out[base + 1] = src[base + 1];
                    out[base + 2] = src[bIdx + 2];
                    out[base + 3] = src[base + 3];
                }
            }
            ctx.putImageData(outId, 0, 0);
        } else {
            ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = this._glitchOn ? '#ff0044' : '#eeeeee';
            ctx.font = 'bold 44px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            var gx = this._glitchOn ? (Math.random() - 0.5) * 18 : 0;
            ctx.fillText('GLITCH', W / 2 + gx, H / 2);
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null; this._offCvs = null;
    };

    EP.Registry.register(effect);
})();
