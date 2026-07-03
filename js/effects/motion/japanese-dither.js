(function() {
    var effect = new EP.EffectBase('japanese-dither', {
        name: 'Japanese Dither',
        category: 'motion',
        icon: '🈳',
        description: 'Dithering japonés — kanji y kana como elementos de dithering por densidad visual, estilo ditther.com Japanese'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'fontSize', type: 'range', min: 6, max: 28, default: 12, step: 2, label: 'Tamaño carácter', unit: 'px' },
        { key: 'colorMode', type: 'select', options: [
            { v: 'mono', l: 'Monocromo' },
            { v: 'source', l: 'Color fuente' },
            { v: 'ink', l: 'Tinta roja sobre blanco' },
            { v: 'neon', l: 'Neón' }
        ], default: 'mono', label: 'Modo color' },
        { key: 'inkColor', type: 'color', default: '#00ff88', label: 'Color tinta/neón' },
        { key: 'bgColor', type: 'color', default: '#000000', label: 'Color fondo' },
        { key: 'charset', type: 'select', options: [
            { v: 'kanji', l: 'Kanji (densidad visual)' },
            { v: 'katakana', l: 'Katakana' },
            { v: 'mixed', l: 'Mixto kanji+kana' }
        ], default: 'kanji', label: 'Charset' },
        { key: 'animGlitch', type: 'select', options: [
            { v: 'off', l: 'Estático' },
            { v: 'on', l: 'Glitch chars aleatorio' }
        ], default: 'off', label: 'Animación glitch' }
    ]);

    // Characters ordered by approximate visual ink density (light → dark)
    var KANJI_DENSITY  = '一二三八入人力十大太天文日目田目国四五六七十百千万山川木水火金土心字体気'.split('');
    var KATAKANA_DENSITY = 'ｰｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ'.split('');
    var MIXED = '一ア二イ三ウ八エ人オ力カ十キ大ク太ケ天コ文サ日シ目ス田ス国セ四ソ五タ六チ七ツ'.split('');

    function sr(s) { var r=(Math.sin(s+1)*43758.5453)%1; return r<0?r+1:r; }

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
        if (m0) { var el = m0.element || (m0.texture && m0.texture.image); if (el) this._media = el; }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var fs = this.settings.fontSize;
        var colorMode = this.settings.colorMode;
        var inkC = this.settings.inkColor || '#00ff88';
        var bgC = this.settings.bgColor || '#000000';
        var csName = this.settings.charset;
        var animGlitch = this.settings.animGlitch === 'on';

        var inkR = parseInt(inkC.slice(1,3),16), inkG = parseInt(inkC.slice(3,5),16), inkB = parseInt(inkC.slice(5,7),16);

        var charset = csName === 'katakana' ? KATAKANA_DENSITY : (csName === 'mixed' ? MIXED : KANJI_DENSITY);

        var cellW = fs; var cellH = fs * 1.2;
        var cols = Math.floor(W / cellW); var rows = Math.floor(H / cellH);
        var sampW = cols; var sampH = rows;

        if (this._sampCvs.width !== sampW || this._sampCvs.height !== sampH) {
            this._sampCvs.width = sampW; this._sampCvs.height = sampH;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, sampW, sampH);
        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, sampW, sampH); } catch(e) {}
        } else {
            var grd = sc.createLinearGradient(0, 0, sampW, sampH);
            grd.addColorStop(0, 'hsl('+((time*25)%360)+',70%,65%)');
            grd.addColorStop(1, 'hsl('+((time*25+150)%360)+',80%,35%)');
            sc.fillStyle = grd; sc.fillRect(0, 0, sampW, sampH);
        }
        var imgData; try { imgData = sc.getImageData(0, 0, sampW, sampH); } catch(e){ return; }
        var data = imgData.data;

        if (colorMode === 'ink') {
            ctx.fillStyle = '#f0e8d0'; ctx.fillRect(0, 0, W, H);
        } else {
            ctx.fillStyle = bgC; ctx.fillRect(0, 0, W, H);
        }

        ctx.font = fs + 'px "MS Gothic", "Hiragino Kaku Gothic Pro", monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var idx = (row * sampW + col) * 4;
                var rd = data[idx], gd = data[idx+1], bd = data[idx+2];
                var lum = (0.299*rd + 0.587*gd + 0.114*bd) / 255;

                var charIdx = Math.floor(lum * (charset.length - 1));
                if (animGlitch && sr(col*7+row*11+Math.floor(time*3)) > 0.95) {
                    charIdx = Math.floor(Math.random() * charset.length);
                }
                var ch = charset[charIdx];

                var r, g, b, a;
                switch(colorMode) {
                    case 'source':
                        r = rd; g = gd; b = bd; a = 0.3 + lum * 0.7; break;
                    case 'ink':
                        r = 160; g = 10; b = 20; a = 0.15 + lum * 0.85; break;
                    case 'neon':
                        r = inkR; g = inkG; b = inkB; a = 0.1 + lum * 0.9;
                        if (lum > 0.6) { ctx.shadowColor = inkC; ctx.shadowBlur = 5; }
                        break;
                    default: // mono
                        r = inkR; g = inkG; b = inkB; a = 0.1 + lum * 0.9;
                }

                ctx.fillStyle = 'rgba('+r+','+g+','+b+','+a+')';
                ctx.fillText(ch, col * cellW, row * cellH);
                if (colorMode === 'neon') ctx.shadowBlur = 0;
            }
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._sampCvs = null; this._sampCtx = null;
    };

    EP.Registry.register(effect);
})();
