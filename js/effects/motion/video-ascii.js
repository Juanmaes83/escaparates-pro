(function() {
    var effect = new EP.EffectBase('video-ascii', {
        name: 'Video ASCII Art',
        category: 'motion',
        icon: '⌨️',
        description: 'Convierte imagen o video en arte ASCII en tiempo real — luminancia mapeada a caracteres'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'resolution', type: 'range', min: 20, max: 120, default: 60, step: 5, label: 'Resolución ASCII', unit: 'cols' },
        { key: 'fontSize', type: 'range', min: 6, max: 24, default: 10, step: 1, label: 'Tamaño carácter', unit: 'px' },
        { key: 'colored', type: 'select', options: [{ v: 'on', l: 'Color' }, { v: 'off', l: 'Monocromo' }], default: 'on', label: 'Modo color' },
        { key: 'fgColor', type: 'color', default: '#00ff88', label: 'Color mono (foreground)' },
        { key: 'bgColor', type: 'color', default: '#000000', label: 'Color fondo' },
        { key: 'charset', type: 'select', options: [
            { v: 'standard', l: 'Standard (@#S%?*+;:,.)' },
            { v: 'blocks', l: 'Bloques (█▓▒░ )' },
            { v: 'binary', l: 'Binario (01)' },
            { v: 'matrix', l: 'Matrix (カナ)' }
        ], default: 'standard', label: 'Charset' },
        { key: 'canvasRes', type: 'select', options: [{ v: 'high', l: 'Alta (1024px)' }, { v: 'medium', l: 'Media (512px)' }, { v: 'low', l: 'Baja (256px) — GPU baja' }], default: 'medium', label: 'Resolución canvas' }
    ]);

    var CHARSETS = {
        standard: '@#S%?*+;:,. '.split(''),
        blocks: '█▓▒░ '.split(''),
        binary: '01 '.split(''),
        matrix: 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ '.split('')
    };

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
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
        var resMap = { high: 1024, medium: 512, low: 256 };
        var targetW = resMap[this.settings.canvasRes] || 512;
        var targetH = Math.round(targetW * 576 / 1024);
        if (this._cvs.width !== targetW) {
            this._cvs.width = targetW; this._cvs.height = targetH;
        }
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var cols = Math.round(this.settings.resolution);
        var fs = this.settings.fontSize;
        var colored = this.settings.colored === 'on';
        var fgC = this.settings.fgColor || '#00ff88';
        var bgC = this.settings.bgColor || '#000000';
        var chars = CHARSETS[this.settings.charset] || CHARSETS.standard;

        var cellW = W / cols;
        var rows = Math.round(H / (cellW * 1.8));
        var cellH = H / rows;

        // Sample at lower resolution
        this._sampCvs.width = cols;
        this._sampCvs.height = rows;
        var sc = this._sampCtx;
        sc.clearRect(0, 0, cols, rows);

        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, cols, rows); } catch(e) {}
        } else {
            // Animated gradient placeholder
            var grd = sc.createLinearGradient(0, 0, cols, rows);
            grd.addColorStop(0, 'hsl(' + ((time * 40) % 360) + ',80%,40%)');
            grd.addColorStop(1, 'hsl(' + ((time * 40 + 120) % 360) + ',80%,20%)');
            sc.fillStyle = grd; sc.fillRect(0, 0, cols, rows);
        }

        var imgData;
        try { imgData = sc.getImageData(0, 0, cols, rows); } catch(e) { return; }
        var data = imgData.data;

        ctx.fillStyle = bgC;
        ctx.fillRect(0, 0, W, H);

        ctx.font = fs + 'px "Share Tech Mono", monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var idx = (r * cols + c) * 4;
                var rd = data[idx]; var g = data[idx + 1]; var b = data[idx + 2];
                var lum = (0.299 * rd + 0.587 * g + 0.114 * b) / 255;
                var charIdx = Math.floor(lum * (chars.length - 1));
                var ch = chars[charIdx];
                if (colored) {
                    ctx.fillStyle = 'rgb(' + rd + ',' + g + ',' + b + ')';
                } else {
                    ctx.fillStyle = fgC;
                    ctx.globalAlpha = 0.3 + lum * 0.7;
                }
                ctx.fillText(ch, c * cellW, r * cellH);
            }
        }
        ctx.globalAlpha = 1;
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
