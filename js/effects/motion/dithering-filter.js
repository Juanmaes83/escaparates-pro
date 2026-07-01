(function() {
    var effect = new EP.EffectBase('dithering-filter', {
        name: 'Dithering Filter',
        category: 'motion',
        icon: '🔳',
        description: 'Filtro de tramado retro con multiples patrones — Bayer, organic, halftone, art deco y mas'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'pattern', type: 'select', options: ['Bayer 4x4', 'Bayer 8x8', 'Organic', 'Clustered Dot', 'Art Deco', 'Halftone Circles', 'Halftone Lines', 'Spiral', 'Diagonal Wave', 'Moire'], default: 'Bayer 8x8', label: 'Pattern' },
        { key: 'patternScale', type: 'range', min: 1, max: 8, default: 2, step: 1, label: 'Pattern Scale' },
        { key: 'brightness', type: 'range', min: 0, max: 100, default: 50, label: 'Brightness', unit: '%' },
        { key: 'contrast', type: 'range', min: 10, max: 200, default: 100, label: 'Contrast', unit: '%' },
        { key: 'invert', type: 'select', options: ['Off', 'On'], default: 'Off', label: 'Invert' },
        { key: 'animSpeed', type: 'range', min: 0, max: 100, default: 30, label: 'Animation', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    var bayer4 = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(function(v) { return v / 16.0; });

    function generateBayer8() {
        var m2 = [[0,2],[3,1]];
        function expand(mat) {
            var n = mat.length;
            var res = [];
            for (var i = 0; i < n * 2; i++) {
                res[i] = [];
                for (var j = 0; j < n * 2; j++) res[i][j] = 0;
            }
            for (var ii = 0; ii < n; ii++) {
                for (var jj = 0; jj < n; jj++) {
                    var val = mat[ii][jj];
                    res[ii*2][jj*2] = 4*val;
                    res[ii*2][jj*2+1] = 4*val+2;
                    res[ii*2+1][jj*2] = 4*val+3;
                    res[ii*2+1][jj*2+1] = 4*val+1;
                }
            }
            return res;
        }
        var m4 = expand(m2);
        var m8 = expand(m4);
        var flat = [];
        for (var i = 0; i < 8; i++)
            for (var j = 0; j < 8; j++)
                flat.push(m8[i][j] / 64.0);
        return flat;
    }

    function generateRadialMap(size) {
        var total = size * size;
        var raw = [];
        var center = (size - 1) / 2;
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                var dx = (i - center) / (size / 2);
                var dy = (j - center) / (size / 2);
                var radius = Math.sqrt(dx * dx + dy * dy);
                raw.push(Math.max(0, 1 - radius));
            }
        }
        var indexed = raw.map(function(v, idx) { return { v: v, idx: idx }; });
        indexed.sort(function(a, b) { return a.v - b.v; });
        var result = new Array(total);
        for (var rank = 0; rank < total; rank++) result[indexed[rank].idx] = rank / (total - 1);
        return result;
    }

    function generatePatternMap(type, size) {
        var total = size * size;
        var map = [];
        var center = (size - 1) / 2;
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                var val;
                switch (type) {
                    case 'art_deco':
                        var diag = (i + j) % (size * 2);
                        var curve = Math.sin(i * 0.8) * Math.cos(j * 0.8);
                        val = (diag / (size * 2) + curve * 0.2) % 1.0;
                        break;
                    case 'halftone_circles':
                        var dx = i - center, dy = j - center;
                        var dist = Math.sqrt(dx*dx + dy*dy) / Math.sqrt(center*center + center*center);
                        val = Math.sin(dist * Math.PI * 1.2) * 0.7 + 0.3;
                        break;
                    case 'halftone_lines':
                        val = (Math.sin(i * 1.8) + 1) / 2 * 0.6 + (Math.cos(j * 1.5) + 1) / 2 * 0.4;
                        break;
                    case 'spiral':
                        var sdx = i - center, sdy = j - center;
                        var angle = Math.atan2(sdy, sdx);
                        var srad = Math.sqrt(sdx*sdx + sdy*sdy) / (center + 0.5);
                        val = (angle / (Math.PI * 2) + srad * 1.5) % 1.0;
                        break;
                    case 'diagonal_wave':
                        val = (i + j) / (size * 2) + (Math.sin(i * 1.2) + Math.cos(j * 1.2)) * 0.25;
                        break;
                    case 'moire':
                        var chess = ((i % 2 === 0) === (j % 2 === 0)) ? 0.2 : 0.8;
                        val = chess + Math.sin(i * 1.2) * 0.2 + Math.cos(j * 1.2) * 0.2;
                        break;
                    default:
                        val = (i * size + j) / total;
                }
                map.push(val);
            }
        }
        var min = Math.min.apply(null, map);
        var max = Math.max.apply(null, map);
        if (max - min > 0) {
            for (var k = 0; k < map.length; k++) map[k] = (map[k] - min) / (max - min);
        }
        return map;
    }

    var maps = {
        'Bayer 4x4': { data: bayer4, size: 4 },
        'Bayer 8x8': { data: generateBayer8(), size: 8 },
        'Organic': { data: generateRadialMap(8), size: 8 },
        'Clustered Dot': { data: generateRadialMap(6), size: 6 },
        'Art Deco': { data: generatePatternMap('art_deco', 8), size: 8 },
        'Halftone Circles': { data: generatePatternMap('halftone_circles', 8), size: 8 },
        'Halftone Lines': { data: generatePatternMap('halftone_lines', 8), size: 8 },
        'Spiral': { data: generatePatternMap('spiral', 8), size: 8 },
        'Diagonal Wave': { data: generatePatternMap('diagonal_wave', 8), size: 8 },
        'Moire': { data: generatePatternMap('moire', 8), size: 8 }
    };

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        for (var img = 0; img < mediaList.length; img++) {
            var mat = EP.Media.createMaterial(mediaList[img]);
            mat.transparent = true;
            var aspect = 1;
            if (mediaList[img].element) {
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || mediaList[img].element.width || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || mediaList[img].element.height || 1;
                aspect = ew / eh;
            }
            var w, h;
            if (aspect >= 1) { w = 8; h = 8 / aspect; }
            else { h = 8; w = 8 * aspect; }

            var geo = new THREE.PlaneGeometry(w, h);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            mesh.userData = { imageIndex: img, aspect: aspect };
            group.add(mesh);
        }

        this._ditherCanvas = document.createElement('canvas');
        this._ditherCtx = this._ditherCanvas.getContext('2d');
        this._ditherTexture = new THREE.CanvasTexture(this._ditherCanvas);
        this._ditherTexture.minFilter = THREE.NearestFilter;
        this._ditherTexture.magFilter = THREE.NearestFilter;

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var meshes = [];
        for (var i = 0; i < this.group.children.length; i++) {
            if (this.group.children[i].userData.imageIndex !== undefined) meshes.push(this.group.children[i]);
        }
        var count = meshes.length;
        if (count === 0) return;

        var segDur = 1 / count;
        var patternName = this.settings.pattern;
        var mapInfo = maps[patternName] || maps['Bayer 8x8'];
        var pScale = this.settings.patternScale;
        var brightness = (this.settings.brightness / 50 - 1) * 128;
        var contrast = this.settings.contrast / 100;
        var invert = this.settings.invert === 'On';
        var animSpeed = this.settings.animSpeed / 100;
        var thresholdOffset = Math.sin(time * animSpeed * 2) * 0.15 * animSpeed;

        for (var idx = 0; idx < count; idx++) {
            var mesh = meshes[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                mesh.visible = true;

                var media = null;
                try {
                    var mediaList = EP.Media.getAll ? EP.Media.getAll() : null;
                    if (mediaList && mediaList[idx]) media = mediaList[idx];
                } catch(e) {}

                if (media && media.element && this._ditherCtx) {
                    var el = media.element;
                    var sw = el.videoWidth || el.naturalWidth || el.width || 200;
                    var sh = el.videoHeight || el.naturalHeight || el.height || 200;
                    var maxDim = 256;
                    var scale = Math.min(maxDim / sw, maxDim / sh, 1);
                    var dw = Math.floor(sw * scale);
                    var dh = Math.floor(sh * scale);

                    this._ditherCanvas.width = dw;
                    this._ditherCanvas.height = dh;
                    try {
                        this._ditherCtx.drawImage(el, 0, 0, dw, dh);
                        var imgData = this._ditherCtx.getImageData(0, 0, dw, dh);
                        var pixels = imgData.data;
                        var mapData = mapInfo.data;
                        var mapSize = mapInfo.size;

                        for (var p = 0; p < pixels.length; p += 4) {
                            var r = pixels[p], g = pixels[p+1], b = pixels[p+2];
                            var gray = 0.299 * r + 0.587 * g + 0.114 * b;
                            gray = (gray - 128) * contrast + 128 + brightness;
                            gray = Math.max(0, Math.min(255, gray));
                            if (invert) gray = 255 - gray;

                            var px = (p / 4) % dw;
                            var py = Math.floor((p / 4) / dw);
                            var mx = Math.floor(px / pScale) % mapSize;
                            var my = Math.floor(py / pScale) % mapSize;
                            var threshold = mapData[my * mapSize + mx] + thresholdOffset;

                            var val = gray / 255 > threshold ? 255 : 0;
                            pixels[p] = val;
                            pixels[p+1] = val;
                            pixels[p+2] = val;
                        }

                        this._ditherCtx.putImageData(imgData, 0, 0);
                        this._ditherTexture.needsUpdate = true;
                        mesh.material.map = this._ditherTexture;
                        mesh.material.needsUpdate = true;
                    } catch(e) {}
                }

                var lt = (t - segStart) / segDur;
                var appearPhase = lt < 0.15 ? lt / 0.15 : 1;
                var disappearPhase = lt > 0.85 ? (lt - 0.85) / 0.15 : 0;
                mesh.material.opacity = appearPhase * (1 - disappearPhase);

                EP.Core.camera.position.z = 6;
                EP.Core.camera.position.x = 0;
                EP.Core.camera.position.y = 0;
                EP.Core.camera.lookAt(0, 0, 0);
            } else {
                mesh.visible = false;
            }
        }
    };

    effect.dispose = function() {
        if (this._ditherTexture) this._ditherTexture.dispose();
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
