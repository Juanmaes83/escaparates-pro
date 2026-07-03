(function() {
    var effect = new EP.EffectBase('terminal-pro', {
        name: 'Terminal Pro',
        category: 'motion',
        icon: '💻',
        description: 'Terminal CRT mejorado — fósforo verde vintage, scanlines, cursor parpadeante y efecto bezel de monitor antiguo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'resolution', type: 'range', min: 30, max: 100, default: 55, step: 5, label: 'Resolución ASCII', unit: 'cols' },
        { key: 'phosphorColor', type: 'color', default: '#00ff41', label: 'Color fósforo' },
        { key: 'bgColor', type: 'color', default: '#000800', label: 'Color fondo CRT' },
        { key: 'scanlineOpacity', type: 'range', min: 0, max: 80, default: 30, step: 5, label: 'Opacidad scanlines', unit: '%' },
        { key: 'glowStrength', type: 'range', min: 0, max: 20, default: 8, step: 1, label: 'Intensidad glow fósforo' },
        { key: 'showBezel', type: 'select', options: [{ v: 'on', l: 'Con bezel monitor' }, { v: 'off', l: 'Sin bezel' }], default: 'on', label: 'Bezel CRT' },
        { key: 'cursorStyle', type: 'select', options: [
            { v: 'block', l: 'Bloque parpadeante' },
            { v: 'line', l: 'Línea' },
            { v: 'none', l: 'Sin cursor' }
        ], default: 'block', label: 'Cursor' },
        { key: 'charset', type: 'select', options: [
            { v: 'standard', l: 'Standard' },
            { v: 'blocks', l: 'Bloques' },
            { v: 'matrix', l: 'Matrix (カナ)' }
        ], default: 'standard', label: 'Charset' }
    ]);

    var CHARSETS = {
        standard: '@#S%?*+;:,. '.split(''),
        blocks: '█▓▒░ '.split(''),
        matrix: 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ '.split('')
    };

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
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
        this._cursorRow = 0; this._cursorCol = 0;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var cols = Math.round(this.settings.resolution);
        var pc = this.settings.phosphorColor || '#00ff41';
        var bgC = this.settings.bgColor || '#000800';
        var scanOp = this.settings.scanlineOpacity / 100;
        var glowStr = this.settings.glowStrength;
        var showBezel = this.settings.showBezel === 'on';
        var cursorStyle = this.settings.cursorStyle;
        var chars = CHARSETS[this.settings.charset] || CHARSETS.standard;

        var pr = parseInt(pc.slice(1,3),16);
        var pg = parseInt(pc.slice(3,5),16);
        var pb = parseInt(pc.slice(5,7),16);

        var fs = Math.max(6, Math.round(W / cols));
        var rows = Math.round(H / (fs * 1.6));
        var cellW = W / cols; var cellH = H / rows;

        // Inner CRT area
        var padX = showBezel ? W * 0.05 : 0;
        var padY = showBezel ? H * 0.06 : 0;
        var innerW = W - padX * 2; var innerH = H - padY * 2;

        // Sample source image
        var sampW = cols; var sampH = rows;
        if (this._sampCvs.width !== sampW || this._sampCvs.height !== sampH) {
            this._sampCvs.width = sampW; this._sampCvs.height = sampH;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, sampW, sampH);
        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, sampW, sampH); } catch(e) {}
        } else {
            // Generate fake terminal output pattern
            sc.fillStyle = '#888';
            sc.fillRect(0, 0, sampW, sampH);
            sc.fillStyle = '#fff';
            for (var row = 0; row < sampH; row++) {
                for (var col2 = 0; col2 < sampW; col2++) {
                    if (Math.sin(col2 * 0.8 + time * 1.5) * Math.cos(row * 0.6 + time) > 0.3) {
                        sc.fillRect(col2, row, 1, 1);
                    }
                }
            }
        }

        var imgData; try { imgData = sc.getImageData(0, 0, sampW, sampH); } catch(e) { return; }
        var data = imgData.data;

        // Clear background
        ctx.fillStyle = bgC;
        ctx.fillRect(0, 0, W, H);

        // Bezel gradient frame
        if (showBezel) {
            var bezelGrad = ctx.createRadialGradient(W/2, H/2, innerW*0.3, W/2, H/2, W*0.7);
            bezelGrad.addColorStop(0, 'rgba(0,0,0,0)');
            bezelGrad.addColorStop(0.85, 'rgba(0,0,0,0)');
            bezelGrad.addColorStop(1, 'rgba(0,0,0,0.92)');
            ctx.fillStyle = bezelGrad;
            ctx.fillRect(0, 0, W, H);
        }

        // ASCII render with phosphor glow
        ctx.save();
        ctx.translate(padX, padY);
        ctx.font = 'bold ' + fs + 'px "Courier New", monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';

        // Glow via shadow
        if (glowStr > 0) {
            ctx.shadowColor = pc;
            ctx.shadowBlur = glowStr;
        }

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var idx = (row * sampW + col) * 4;
                var lum = (0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2]) / 255;
                var charIdx = Math.floor(lum * (chars.length - 1));
                var ch = chars[charIdx];
                var alpha = 0.25 + lum * 0.75;
                ctx.fillStyle = 'rgba(' + pr + ',' + pg + ',' + pb + ',' + alpha + ')';
                ctx.fillText(ch, col * cellW, row * cellH);
            }
        }
        ctx.shadowBlur = 0;

        // Blinking cursor
        if (cursorStyle !== 'none' && Math.floor(time * 2) % 2 === 0) {
            var cRow = Math.floor(((time * 3) % rows));
            var cCol = Math.floor(((time * 7.3) % cols));
            ctx.fillStyle = pc;
            if (cursorStyle === 'block') {
                ctx.fillRect(cCol * cellW, cRow * cellH, cellW, cellH * 0.85);
            } else {
                ctx.fillRect(cCol * cellW, cRow * cellH + cellH * 0.85, cellW, cellH * 0.12);
            }
        }

        ctx.restore();

        // Scanlines overlay
        if (scanOp > 0) {
            for (var sy = padY; sy < H - padY; sy += 3) {
                ctx.fillStyle = 'rgba(0,0,0,' + scanOp + ')';
                ctx.fillRect(padX, sy, innerW, 1.5);
            }
        }

        // Subtle vignette inside CRT
        var vigGrad = ctx.createRadialGradient(W/2, H/2, innerW * 0.25, W/2, H/2, innerW * 0.75);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(padX, padY, innerW, innerH);

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
