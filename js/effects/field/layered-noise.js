(function() {
    var effect = new EP.EffectBase('layered-noise', {
        name: 'Layered Noise',
        category: 'field',
        icon: '🌊',
        description: 'Capas de ruido apiladas con gradientes de color evolutivos — fondo animado hipnótico'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'layers', type: 'range', min: 3, max: 12, default: 6, step: 1, label: 'Capas' },
        { key: 'noiseScale', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Escala ruido' },
        { key: 'flowSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad flujo' },
        { key: 'colorSpeed', type: 'range', min: 1, max: 30, default: 8, step: 1, label: 'Ciclo color' },
        { key: 'saturation', type: 'range', min: 20, max: 100, default: 75, step: 5, label: 'Saturación', unit: '%' },
        { key: 'layerAlpha', type: 'range', min: 10, max: 80, default: 35, step: 5, label: 'Opacidad capa', unit: '%' },
        { key: 'resolution', type: 'range', min: 2, max: 16, default: 6, step: 1, label: 'Resolución (+ = + rápido)' }
    ]);

    function noise2d(x, y, seed) {
        var s = seed || 0;
        return (Math.sin(x * 1.7 + s) * Math.cos(y * 1.3 + s * 0.7) +
                Math.sin(x * 0.5 - s * 0.3) * Math.cos(y * 2.1 + s * 0.4) +
                Math.sin(x * 3.1 + y * 1.1 + s)) / 3;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 256; this._cvs.height = 144;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        this._tex.magFilter = THREE.LinearFilter;
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: false, depthWrite: true });
        group.add(new THREE.Mesh(geo, mat));
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx;
        var W = this._cvs.width; var H = this._cvs.height;
        var nLayers = Math.round(this.settings.layers);
        var scale = this.settings.noiseScale * 0.08;
        var fspd = this.settings.flowSpeed * 0.15;
        var cspd = this.settings.colorSpeed * 5;
        var sat = this.settings.saturation;
        var alpha = this.settings.layerAlpha / 100;
        var res = Math.max(1, Math.round(this.settings.resolution));

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);

        for (var l = 0; l < nLayers; l++) {
            var layerSeed = l * 3.7 + time * fspd * (0.5 + l * 0.2);
            var hueBase = (time * cspd + l * (360 / nLayers)) % 360;
            ctx.globalAlpha = alpha;

            for (var y = 0; y < H; y += res) {
                for (var x = 0; x < W; x += res) {
                    var nx = x * scale - l * 1.3;
                    var ny = y * scale + l * 0.9;
                    var n = (noise2d(nx, ny, layerSeed) + 1) / 2;
                    if (n < 0.35) continue; // skip near-zero for transparency effect
                    var hue = (hueBase + n * 60) % 360;
                    var bri = 30 + n * 55;
                    ctx.fillStyle = 'hsl(' + hue + ',' + sat + '%,' + bri + '%)';
                    ctx.fillRect(x, y, res, res);
                }
            }
        }
        ctx.globalAlpha = 1;
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
