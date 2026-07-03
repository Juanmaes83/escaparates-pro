(function() {
    var effect = new EP.EffectBase('static-grain', {
        name: 'Static / Film Grain',
        category: 'motion',
        icon: '📺',
        description: 'Grano de película y estática TV — ruido visual animado sobre imagen, estilos film noir, color noise, TV static y VHS'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'intensity', type: 'range', min: 5, max: 100, default: 35, step: 5, label: 'Intensidad grano', unit: '%' },
        { key: 'grainSize', type: 'range', min: 1, max: 6, default: 1, step: 1, label: 'Tamaño grano', unit: 'px' },
        { key: 'grainStyle', type: 'select', options: [
            { v: 'mono', l: 'Film noir (mono)' },
            { v: 'color', l: 'Color noise' },
            { v: 'scanlines', l: 'TV Static + scanlines' },
            { v: 'vhs', l: 'VHS tracking' }
        ], default: 'mono', label: 'Estilo grano' },
        { key: 'flickerSpeed', type: 'range', min: 1, max: 20, default: 10, step: 1, label: 'Velocidad fluctuación' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (mediaList && mediaList.length > 0) {
            var bgGeo = new THREE.PlaneGeometry(8, 4.5);
            var bgMat = EP.Media.createMaterial(mediaList[0]);
            var bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -0.05;
            group.add(bgMesh);
        }
        this._cvs = document.createElement('canvas');
        this._cvs.width = 256; this._cvs.height = 144;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        this._tex.magFilter = THREE.NearestFilter;
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx;
        var W = this._cvs.width; var H = this._cvs.height;
        var intensity = this.settings.intensity / 100;
        var gs = Math.max(1, Math.round(this.settings.grainSize));
        var style = this.settings.grainStyle;
        var spd = this.settings.flickerSpeed;

        var imgData = ctx.createImageData(W, H);
        var d = imgData.data;

        if (style === 'scanlines') {
            var flicker = 0.65 + Math.sin(time * spd * 3.7) * 0.35;
            for (var y = 0; y < H; y++) {
                var scanA = (y % 3 === 0) ? 0.2 : 1;
                for (var x = 0; x < W; x++) {
                    var idx = (y * W + x) * 4;
                    var v = Math.random() * 255 * intensity * scanA * flicker;
                    d[idx] = d[idx+1] = d[idx+2] = v;
                    d[idx+3] = v * 1.2;
                }
            }
        } else if (style === 'vhs') {
            for (var y = 0; y < H; y++) {
                var tracking = (Math.sin(y * 0.25 + time * spd * 0.4) > 0.65) ? 1 : 0;
                var rowNoise = Math.random() * 100 * intensity * tracking;
                var rowShift = tracking > 0 ? Math.round(Math.sin(y + time * 10) * 8) : 0;
                for (var x = 0; x < W; x++) {
                    var sx = Math.min(W - 1, Math.max(0, x + rowShift));
                    var idx = (y * W + sx) * 4;
                    var v = rowNoise + Math.random() * 25 * intensity;
                    d[idx] = d[idx+1] = d[idx+2] = v;
                    d[idx+3] = Math.min(255, v * 1.8);
                }
            }
        } else {
            for (var y = 0; y < H; y += gs) {
                for (var x = 0; x < W; x += gs) {
                    var noise = Math.random();
                    var alpha = noise * intensity * 220;
                    var nr, ng, nb;
                    if (style === 'color') {
                        nr = Math.random() * 255;
                        ng = Math.random() * 255;
                        nb = Math.random() * 255;
                    } else {
                        var v = noise > 0.5 ? 200 + Math.random() * 55 : 10 + Math.random() * 40;
                        nr = ng = nb = v;
                    }
                    for (var dy = 0; dy < gs && y + dy < H; dy++) {
                        for (var dx = 0; dx < gs && x + dx < W; dx++) {
                            var idx = ((y + dy) * W + (x + dx)) * 4;
                            d[idx] = nr; d[idx+1] = ng; d[idx+2] = nb; d[idx+3] = alpha;
                        }
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
