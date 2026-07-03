(function() {
    var effect = new EP.EffectBase('ascii-premium', {
        name: 'ASCII Premium',
        category: 'motion',
        icon: '⌨️',
        description: 'ASCII art de máxima calidad — convierte imagen/video en arte ASCII con colormaps espectaculares, glow y barrido de luz animado'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cols', type: 'range', min: 40, max: 160, default: 80, step: 5, label: 'Densidad columnas' },
        { key: 'charset', type: 'select', options: [
            { v: 'dense',  l: 'Denso (@#&$%8BEX*+;:,. )' },
            { v: 'blocks', l: 'Bloques (█▓▒░ )' },
            { v: 'matrix', l: 'Matrix カナ' },
            { v: 'braille',l: 'Braille ⣿⣷⣶' },
            { v: 'dots',   l: 'Puntos · . ° ˙ ' }
        ], default: 'dense', label: 'Charset' },
        { key: 'colormap', type: 'select', options: [
            { v: 'source', l: 'Color fuente (imagen)' },
            { v: 'fire',   l: 'Fire gradient' },
            { v: 'plasma', l: 'Plasma' },
            { v: 'viridis',l: 'Viridis' },
            { v: 'neon',   l: 'Neón monocromo' },
            { v: 'vapor',  l: 'Vaporwave' }
        ], default: 'source', label: 'Colormap' },
        { key: 'monoColor',   type: 'color', default: '#00ff88', label: 'Color neón' },
        { key: 'bgDark',      type: 'range', min: 0, max: 100, default: 88, step: 4, label: 'Oscuridad fondo', unit: '%' },
        { key: 'glowStrength',type: 'range', min: 0, max: 20, default: 5, step: 1, label: 'Intensidad glow' },
        { key: 'charAnim',    type: 'select', options: [{ v: 'on', l: 'Chars animados' }, { v: 'off', l: 'Chars estáticos' }], default: 'on', label: 'Animación chars' },
        { key: 'scanSpeed',   type: 'range', min: 0, max: 20, default: 5, step: 1, label: 'Velocidad barrido luz' }
    ]);

    var CHARSETS = {
        dense:  '@#&$%8BEX*+=^~;:,. '.split(''),
        blocks: '█▓▒░ '.split(''),
        matrix: 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ01 '.split(''),
        braille:'⣿⣷⣶⣦⣤⣄⡀⠀'.split(''),
        dots:   '●•·˙ '.split('')
    };

    function applyColormap(name, lum, rd, gd, bd, monoC) {
        switch(name) {
            case 'fire': {
                if (lum < 0.33) return [Math.round(lum * 3 * 255), 0, 0];
                if (lum < 0.66) return [255, Math.round((lum - 0.33) * 3 * 165), 0];
                return [255, Math.round(165 + (lum - 0.66) * 3 * 90), Math.round((lum - 0.66) * 3 * 200)];
            }
            case 'plasma': {
                var r2 = Math.sin(lum * Math.PI * 2)         * 0.5 + 0.5;
                var g2 = Math.sin(lum * Math.PI * 2 + 2.094) * 0.5 + 0.5;
                var b2 = Math.sin(lum * Math.PI * 2 + 4.189) * 0.5 + 0.5;
                return [Math.round(r2 * 255), Math.round(g2 * 255), Math.round(b2 * 255)];
            }
            case 'viridis': {
                return [
                    Math.round((0.267 + lum * 0.560) * 255),
                    Math.round(lum * 0.860 * 255),
                    Math.round((0.329 - lum * 0.200 + (1 - lum) * lum * 0.8) * 255)
                ];
            }
            case 'vapor': {
                return [Math.round((lum * 0.5 + 0.3) * 255), Math.round(lum * 0.3 * 255), Math.round((lum * 0.4 + 0.5) * 255)];
            }
            case 'neon': {
                var mc = monoC || '#00ff88';
                var nr = parseInt(mc.slice(1, 3), 16), ng = parseInt(mc.slice(3, 5), 16), nb = parseInt(mc.slice(5, 7), 16);
                var a = 0.3 + lum * 0.7;
                return [Math.round(nr * a), Math.round(ng * a), Math.round(nb * a)];
            }
            default: // source
                return [rd, gd, bd];
        }
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();

        // Background plane: original media at z=-0.05
        this._hasBg = false;
        var m0 = mediaList && mediaList[0];
        if (m0) {
            var bgGeo = new THREE.PlaneGeometry(8, 4.5);
            var bgMat = EP.Media.createMaterial(m0);
            var bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -0.05;
            group.add(bgMesh);
            this._hasBg = true;
        }

        // ASCII overlay canvas
        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        // Fill black initially so placeholder disappears
        this._ctx.fillStyle = '#000';
        this._ctx.fillRect(0, 0, 1024, 576);

        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);

        this._sampCvs = document.createElement('canvas');
        this._sampCtx = this._sampCvs.getContext('2d');
        this._media = null;
        if (m0) { var el = m0.element || (m0.texture && m0.texture.image); if (el) this._media = el; }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx;
        var W = this._cvs.width, H = this._cvs.height;
        var cols       = Math.round(this.settings.cols);
        var cset       = CHARSETS[this.settings.charset] || CHARSETS.dense;
        var cmapName   = this.settings.colormap;
        var monoC      = this.settings.monoColor;
        var bgDark     = this.settings.bgDark / 100;
        var glow       = this.settings.glowStrength;
        var charAnim   = this.settings.charAnim === 'on';
        var scanSpd    = this.settings.scanSpeed;

        var fs   = Math.max(6, Math.round(W / cols));
        var rows = Math.max(1, Math.round(H / (fs * 1.5)));
        var cellW = W / cols, cellH = H / rows;
        var sampW = cols, sampH = rows;

        if (this._sampCvs.width !== sampW || this._sampCvs.height !== sampH) {
            this._sampCvs.width = sampW; this._sampCvs.height = sampH;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, sampW, sampH);
        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, sampW, sampH); } catch(e) {}
        } else {
            // Animated rainbow gradient as demo when no media
            var g = sc.createLinearGradient(0, 0, sampW, sampH);
            g.addColorStop(0,    'hsl(' + ((time * 40) % 360) + ',95%,60%)');
            g.addColorStop(0.33, 'hsl(' + ((time * 40 + 120) % 360) + ',85%,50%)');
            g.addColorStop(0.66, 'hsl(' + ((time * 40 + 240) % 360) + ',90%,55%)');
            g.addColorStop(1,    'hsl(' + ((time * 40 + 330) % 360) + ',95%,60%)');
            sc.fillStyle = g; sc.fillRect(0, 0, sampW, sampH);
        }
        var imgData; try { imgData = sc.getImageData(0, 0, sampW, sampH); } catch(e) { return; }
        var data = imgData.data;

        // Background: dark overlay (allows background media plane to show through slightly)
        var bgAlpha = this._hasBg ? bgDark * 0.92 : 1.0;
        ctx.fillStyle = 'rgba(0,0,0,' + bgAlpha + ')';
        ctx.fillRect(0, 0, W, H);

        ctx.font = fs + 'px "Courier New", monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';

        var sweepCol = (scanSpd > 0) ? ((time * scanSpd * 2) % (cols * 2)) : -9999;
        var sweepW   = cols * 0.12;

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var idx = (row * sampW + col) * 4;
                var rd = data[idx], gd = data[idx + 1], bd = data[idx + 2];
                var lum = (0.299 * rd + 0.587 * gd + 0.114 * bd) / 255;

                // Skip very dark cells (show background through)
                if (lum < 0.05) continue;

                // Character selection
                var charIdx = Math.floor(lum * (cset.length - 1));
                if (charAnim && lum > 0.15) {
                    if (Math.sin(time * (lum * 5 + 1) + col * 0.7 + row * 0.5) > 0.75) {
                        charIdx = (charIdx + 1) % cset.length;
                    }
                }
                var ch = cset[charIdx];

                var rgb = applyColormap(cmapName, lum, rd, gd, bd, monoC);
                var r = rgb[0], g2 = rgb[1], b = rgb[2];

                // Sweep light boost
                var distS = Math.abs(col - sweepCol);
                if (distS < sweepW) {
                    var boost = Math.round((1 - distS / sweepW) * 100);
                    r  = Math.min(255, r  + boost);
                    g2 = Math.min(255, g2 + boost);
                    b  = Math.min(255, b  + boost);
                }

                var alpha = 0.5 + lum * 0.5;
                if (glow > 0 && lum > 0.5) {
                    ctx.shadowColor = 'rgba(' + r + ',' + g2 + ',' + b + ',0.8)';
                    ctx.shadowBlur  = glow * lum;
                }
                ctx.fillStyle = 'rgba(' + r + ',' + g2 + ',' + b + ',' + alpha + ')';
                ctx.fillText(ch, col * cellW, row * cellH);
                if (glow > 0) ctx.shadowBlur = 0;
            }
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
        this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
