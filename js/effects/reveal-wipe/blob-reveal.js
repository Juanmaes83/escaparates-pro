(function() {
    var effect = new EP.EffectBase('blob-reveal', {
        name: 'Blob Reveal',
        category: 'reveal-wipe',
        icon: '🫧',
        description: 'Blob orgánico que crece desde el centro revelando imagen — estilo liquid morph'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'blobPoints', type: 'range', min: 4, max: 16, default: 8, step: 1, label: 'Puntos blob' },
        { key: 'organicness', type: 'range', min: 0, max: 100, default: 55, step: 1, label: 'Organicidad', unit: '%' },
        { key: 'blobColor', type: 'color', default: '#4f8cff', label: 'Color blob' },
        { key: 'holdTime', type: 'range', min: 10, max: 80, default: 40, step: 5, label: 'Tiempo visible', unit: '%' },
        { key: 'background', type: 'color', default: '#101014', label: 'Fondo' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();

        // Two images to transition between
        this._mediaList = mediaList && mediaList.length > 0 ? mediaList : [];

        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);

        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);

        // Pre-render media to offscreen canvases
        this._imgCanvases = [];
        var self = this;
        if (mediaList && mediaList.length > 0) {
            mediaList.slice(0, 2).forEach(function(m, i) {
                var oc = document.createElement('canvas');
                oc.width = 1024; oc.height = 576;
                var octx = oc.getContext('2d');
                var el = m && (m.element || (m.texture && m.texture.image));
                if (el) {
                    try { octx.drawImage(el, 0, 0, 1024, 576); } catch(e) {}
                } else {
                    octx.fillStyle = i === 0 ? '#202030' : '#203020';
                    octx.fillRect(0, 0, 1024, 576);
                }
                self._imgCanvases.push(oc);
            });
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var t = (time % loopDuration) / loopDuration;
        var holdFrac = this.settings.holdTime / 100;
        var growEnd = (1 - holdFrac) / 2;
        var holdEnd = growEnd + holdFrac;

        // Phase: 0..growEnd = blob grows, growEnd..holdEnd = hold full, holdEnd..1 = shrink
        var blobScale;
        if (t < growEnd) {
            blobScale = growEnd > 0 ? t / growEnd : 1;
        } else if (t < holdEnd) {
            blobScale = 1;
        } else {
            blobScale = holdEnd < 1 ? 1 - (t - holdEnd) / (1 - holdEnd) : 0;
        }

        var eased = blobScale < 0.5
            ? 2 * blobScale * blobScale
            : 1 - 2 * (1 - blobScale) * (1 - blobScale);

        var cvs = this._cvs; var ctx = this._ctx;
        var W = cvs.width; var H = cvs.height;
        var cx = W / 2; var cy = H / 2;
        var maxR = Math.sqrt(cx * cx + cy * cy) * 1.1;

        ctx.clearRect(0, 0, W, H);

        // Draw bg image (image 0)
        if (this._imgCanvases[0]) {
            ctx.drawImage(this._imgCanvases[0], 0, 0, W, H);
        } else {
            ctx.fillStyle = this.settings.background;
            ctx.fillRect(0, 0, W, H);
        }

        // Draw blob clip for image 1
        var pts = Math.round(this.settings.blobPoints);
        var organic = this.settings.organicness / 100;
        var r = maxR * eased;

        ctx.save();
        ctx.beginPath();
        for (var i = 0; i <= pts; i++) {
            var angle = (i / pts) * Math.PI * 2;
            var noise = 1 + (Math.sin(angle * 3 + time * 2) * 0.3 + Math.cos(angle * 5 + time * 1.5) * 0.2) * organic;
            var pr = r * noise;
            var px = cx + Math.cos(angle) * pr;
            var py = cy + Math.sin(angle) * pr;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.clip();

        if (this._imgCanvases[1]) {
            ctx.drawImage(this._imgCanvases[1], 0, 0, W, H);
        } else {
            ctx.fillStyle = this.settings.blobColor;
            ctx.fill();
        }
        ctx.restore();

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCanvases = [];
    };

    EP.Registry.register(effect);
})();
