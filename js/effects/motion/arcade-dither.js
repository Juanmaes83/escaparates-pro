(function() {
    var effect = new EP.EffectBase('arcade-dither', {
        name: 'Arcade Dither',
        category: 'motion',
        icon: '🕹️',
        description: 'Dithering Arcade retro — dithering ordenado Bayer con paletas retro GameBoy/CGA/NES, pixel art auténtico estilo ditther.com'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'palette', type: 'select', options: [
            { v: 'gameboy', l: 'GameBoy (verde)' },
            { v: 'gameboy_pocket', l: 'GameBoy Pocket (gris)' },
            { v: 'cga', l: 'CGA 4 colores' },
            { v: 'nes', l: 'NES 4 colores' },
            { v: 'amiga', l: 'Amiga 8 colores' },
            { v: 'synthwave', l: 'Synthwave (custom)' }
        ], default: 'gameboy', label: 'Paleta' },
        { key: 'pixelScale', type: 'range', min: 1, max: 8, default: 3, step: 1, label: 'Escala pixel', unit: 'px' },
        { key: 'ditherMatrix', type: 'select', options: [
            { v: 'bayer2', l: 'Bayer 2×2' },
            { v: 'bayer4', l: 'Bayer 4×4' },
            { v: 'bayer8', l: 'Bayer 8×8 (suave)' },
            { v: 'clustered', l: 'Clustered' }
        ], default: 'bayer4', label: 'Matriz dithering' },
        { key: 'animPalette', type: 'select', options: [
            { v: 'off', l: 'Estático' },
            { v: 'cycle', l: 'Ciclo de paleta' },
            { v: 'shift', l: 'Turno de paleta' }
        ], default: 'off', label: 'Animación paleta' }
    ]);

    var PALETTES = {
        gameboy:        [[0x0f,0x38,0x0f],[0x30,0x62,0x30],[0x8b,0xac,0x0f],[0x9b,0xbc,0x0f]],
        gameboy_pocket: [[0x1b,0x1b,0x1b],[0x49,0x49,0x49],[0x91,0x91,0x91],[0xff,0xff,0xff]],
        cga:            [[0x00,0x00,0x00],[0x55,0xff,0xff],[0xff,0x55,0xff],[0xff,0xff,0xff]],
        nes:            [[0x00,0x00,0x00],[0x55,0x55,0xff],[0xff,0x55,0x55],[0xff,0xff,0xff]],
        amiga:          [[0x00,0x00,0x00],[0xaa,0x00,0x00],[0x00,0xaa,0x00],[0xaa,0x55,0x00],[0x00,0x00,0xaa],[0xaa,0x00,0xaa],[0x00,0xaa,0xaa],[0xaa,0xaa,0xaa]],
        synthwave:      [[0x0d,0x02,0x16],[0x6a,0x0e,0x75],[0xe0,0x0b,0x6c],[0xf0,0x72,0x18],[0xfe,0xf0,0x8f]]
    };

    var BAYER2 = [[0,2],[3,1]];
    var BAYER4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
    var BAYER8 = [
        [0,32,8,40,2,34,10,42],[48,16,56,24,50,18,58,26],[12,44,4,36,14,46,6,38],[60,28,52,20,62,30,54,22],
        [3,35,11,43,1,33,9,41],[51,19,59,27,49,17,57,25],[15,47,7,39,13,45,5,37],[63,31,55,23,61,29,53,21]
    ];
    var CLUSTERED4 = [[0,12,3,15],[8,4,11,7],[2,14,1,13],[10,6,9,5]];

    function getBayer(name, x, y) {
        switch(name) {
            case 'bayer2': return BAYER2[y%2][x%2] / 4;
            case 'bayer8': return BAYER8[y%8][x%8] / 64;
            case 'clustered': return CLUSTERED4[y%4][x%4] / 16;
            default: return BAYER4[y%4][x%4] / 16; // bayer4
        }
    }

    function nearestPalette(r, g, b, palette) {
        var best = 0, bestDist = Infinity;
        for (var i = 0; i < palette.length; i++) {
            var dr = r - palette[i][0], dg = g - palette[i][1], db = b - palette[i][2];
            var dist = dr*dr + dg*dg + db*db;
            if (dist < bestDist) { bestDist = dist; best = i; }
        }
        return palette[best];
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 320; this._cvs.height = 180;
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
        if (m0) { var el = m0.element || (m0.texture && m0.texture.image); if (el) this._media = el; }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ps = Math.max(1, Math.round(this.settings.pixelScale));
        var targetW = Math.floor(320 / ps); var targetH = Math.floor(180 / ps);

        if (this._cvs.width !== targetW * ps || this._cvs.height !== targetH * ps) {
            this._cvs.width = targetW * ps; this._cvs.height = targetH * ps;
        }
        var W = this._cvs.width; var H = this._cvs.height;
        var ctx = this._ctx;
        var palName = this.settings.palette;
        var matrix = this.settings.ditherMatrix;
        var animPal = this.settings.animPalette;

        var palette = PALETTES[palName] || PALETTES.gameboy;

        // Animated palette shift
        if (animPal === 'cycle' || animPal === 'shift') {
            var shift = Math.floor(time * 2) % palette.length;
            var rotated = [];
            for (var i = 0; i < palette.length; i++) rotated.push(palette[(i+shift)%palette.length]);
            palette = rotated;
        }

        if (this._sampCvs.width !== targetW || this._sampCvs.height !== targetH) {
            this._sampCvs.width = targetW; this._sampCvs.height = targetH;
        }
        var sc = this._sampCtx;
        sc.clearRect(0, 0, targetW, targetH);
        if (this._media) {
            try { sc.drawImage(this._media, 0, 0, targetW, targetH); } catch(e) {}
        } else {
            var grd = sc.createLinearGradient(0, 0, targetW, targetH);
            grd.addColorStop(0, 'hsl('+((time*30)%360)+',80%,55%)');
            grd.addColorStop(1, 'hsl('+((time*30+180)%360)+',70%,30%)');
            sc.fillStyle = grd; sc.fillRect(0, 0, targetW, targetH);
        }
        var imgData; try { imgData = sc.getImageData(0, 0, targetW, targetH); } catch(e){ return; }
        var data = imgData.data;

        // Apply ordered dithering and render as scaled pixels
        for (var y = 0; y < targetH; y++) {
            for (var x = 0; x < targetW; x++) {
                var idx = (y * targetW + x) * 4;
                var r = data[idx], g = data[idx+1], b = data[idx+2];
                var threshold = getBayer(matrix, x, y) - 0.5;
                var tr = Math.max(0, Math.min(255, r + threshold * 64));
                var tg = Math.max(0, Math.min(255, g + threshold * 64));
                var tb2 = Math.max(0, Math.min(255, b + threshold * 64));
                var pc = nearestPalette(tr, tg, tb2, palette);
                ctx.fillStyle = 'rgb('+pc[0]+','+pc[1]+','+pc[2]+')';
                ctx.fillRect(x * ps, y * ps, ps, ps);
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
