(function() {
    var effect = new EP.EffectBase('acid-rain', {
        name: 'Acid Rain',
        category: 'motion',
        icon: '☠️',
        description: 'Lluvia ácida — columnas de caracteres cayendo con paleta tóxica, efecto Matrix mejorado estilo ditther.com Acid Rain'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'density', type: 'range', min: 10, max: 100, default: 50, step: 5, label: 'Densidad columnas', unit: '%' },
        { key: 'fontSize', type: 'range', min: 8, max: 28, default: 14, step: 2, label: 'Tamaño char', unit: 'px' },
        { key: 'palette', type: 'select', options: [
            { v: 'acid', l: 'Ácido (verde tóxico + amarillo)' },
            { v: 'matrix', l: 'Matrix (verde puro)' },
            { v: 'blood', l: 'Sangre (rojo)' },
            { v: 'electric', l: 'Eléctrico (azul + cian)' },
            { v: 'venom', l: 'Veneno (púrpura + verde)' }
        ], default: 'acid', label: 'Paleta' },
        { key: 'charset', type: 'select', options: [
            { v: 'matrix', l: 'Matrix + Números' },
            { v: 'latin', l: 'Latin + Símbolos' },
            { v: 'kanji', l: 'Kanji japonés' },
            { v: 'binary', l: 'Binario' }
        ], default: 'matrix', label: 'Charset' },
        { key: 'fallSpeed', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Velocidad caída' },
        { key: 'trailLength', type: 'range', min: 3, max: 30, default: 12, step: 1, label: 'Longitud cola fosfor', unit: 'chars' },
        { key: 'bgOpacity', type: 'range', min: 10, max: 90, default: 30, step: 5, label: 'Opacidad fondo (trail)', unit: '%' }
    ]);

    var CHARSETS_A = {
        matrix: 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ0123456789@#$%&'.split(''),
        latin:  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*(){}[]|'.split(''),
        kanji:  '日月火水木金土山川田目口手力心生気空海風雨雲電光影闇命夢'.split(''),
        binary: '01'.split('')
    };

    var PALETTES_A = {
        acid:     { head: '#ffffff', trail: [[0xad,0xff,0x2f],[0x7f,0xff,0x00],[0xff,0xff,0x00],[0x00,0xff,0x00]] },
        matrix:   { head: '#ffffff', trail: [[0x00,0xff,0x41],[0x00,0xcc,0x33],[0x00,0x99,0x22],[0x00,0x66,0x11]] },
        blood:    { head: '#ffcccc', trail: [[0xff,0x22,0x22],[0xcc,0x00,0x00],[0x99,0x00,0x00],[0x66,0x00,0x00]] },
        electric: { head: '#ffffff', trail: [[0x00,0xcc,0xff],[0x00,0x88,0xee],[0x00,0x44,0xcc],[0x22,0x00,0xff]] },
        venom:    { head: '#eeffcc', trail: [[0x9b,0x59,0xb6],[0x00,0xff,0x00],[0x6c,0x35,0x8d],[0x22,0x88,0x22]] }
    };

    function sr(s) { var r=(Math.sin(s+1)*43758.5453)%1; return r<0?r+1:r; }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
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
        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, depthWrite: false, transparent: this._hasBg });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = this._hasBg ? 0.05 : 0;
        group.add(mesh);
        this._columns = null;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var fs = this.settings.fontSize;
        var density = this.settings.density / 100;
        var palName = this.settings.palette;
        var csName = this.settings.charset;
        var spd = this.settings.fallSpeed;
        var trailLen = Math.round(this.settings.trailLength);
        var bgOp = this.settings.bgOpacity / 100;

        var pal = PALETTES_A[palName] || PALETTES_A.acid;
        var chars = CHARSETS_A[csName] || CHARSETS_A.matrix;
        var colW = Math.round(fs * 0.7);
        var numCols = Math.floor(W / colW);

        // Init columns
        if (!this._columns || this._lastNumCols !== numCols) {
            this._lastNumCols = numCols;
            this._columns = [];
            for (var i = 0; i < numCols; i++) {
                if (sr(i * 7) > density) continue;
                this._columns.push({
                    x: i * colW,
                    y: -sr(i * 13) * H,
                    speed: (0.5 + sr(i * 17) * 1.5) * spd * 0.8,
                    chars: [],
                    nextChar: 0,
                    colorIdx: Math.floor(sr(i * 23) * pal.trail.length)
                });
            }
            if (!this._hasBg) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
        }

        // Trail fade: transparent overlay shows bg media; black overlay for solo mode
        if (this._hasBg) {
            ctx.clearRect(0, 0, W, H);
        } else {
            ctx.fillStyle = 'rgba(0,0,0,' + bgOp * 0.4 + ')';
            ctx.fillRect(0, 0, W, H);
        }

        ctx.font = 'bold ' + fs + 'px "Courier New", monospace';
        ctx.textAlign = 'left';

        var spd2 = spd * (dt || 0.016) * 60 * 0.5;

        for (var ci = 0; ci < this._columns.length; ci++) {
            var col = this._columns[ci];
            col.y += col.speed * spd2 * 0.5;

            // Reset when off screen
            if (col.y > H + trailLen * fs) {
                col.y = -sr(ci * 7 + time) * H * 0.5;
                col.speed = (0.5 + sr(ci * 17 + time) * 1.5) * spd * 0.8;
                col.chars = [];
            }

            // Update chars array
            var headRow = Math.floor(col.y / fs);
            while (col.chars.length < trailLen + 2) col.chars.push(chars[Math.floor(sr(ci * 31 + col.chars.length + time * 3) * chars.length)]);
            // Randomly mutate head char
            if (Math.random() < 0.08) col.chars[0] = chars[Math.floor(Math.random() * chars.length)];

            // Draw trail chars (head at y, older above)
            for (var j = 0; j < Math.min(trailLen, col.chars.length); j++) {
                var cy2 = col.y - j * fs;
                if (cy2 < -fs || cy2 > H + fs) continue;

                var trailFraction = j / trailLen;

                // Head char = bright white
                if (j === 0) {
                    ctx.fillStyle = pal.head;
                    ctx.shadowColor = pal.head;
                    ctx.shadowBlur = 8;
                } else {
                    var tc = pal.trail[Math.min(j, pal.trail.length-1)];
                    var alpha = Math.max(0.05, 1 - trailFraction * 0.85);
                    ctx.fillStyle = 'rgba('+tc[0]+','+tc[1]+','+tc[2]+','+alpha+')';
                    ctx.shadowColor = 'rgba('+tc[0]+','+tc[1]+','+tc[2]+',0.5)';
                    ctx.shadowBlur = j === 1 ? 6 : 0;
                }
                ctx.fillText(col.chars[j], col.x, cy2);
            }
        }
        ctx.shadowBlur = 0;
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._columns = null;
    };

    EP.Registry.register(effect);
})();
