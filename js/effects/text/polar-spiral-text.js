(function() {
    var effect = new EP.EffectBase('polar-spiral-text', {
        name: 'Polar Spiral Text',
        category: 'text',
        icon: '🌀',
        description: 'Tipografía orbital en espiral polar logarítmica — letras en órbita con color HSL cíclico'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'text', type: 'text', default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', label: 'Caracteres' },
        { key: 'orbitSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad órbita' },
        { key: 'spiralTight', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Espiral compresión' },
        { key: 'fontSize', type: 'range', min: 10, max: 80, default: 28, step: 2, label: 'Tamaño fuente', unit: 'px' },
        { key: 'colorCycle', type: 'range', min: 1, max: 30, default: 8, step: 1, label: 'Ciclo color' },
        { key: 'bgColor', type: 'color', default: '#000814', label: 'Color fondo' },
        { key: 'saturation', type: 'range', min: 20, max: 100, default: 80, step: 5, label: 'Saturación', unit: '%' },
        { key: 'brightness', type: 'range', min: 20, max: 100, default: 65, step: 5, label: 'Brillo', unit: '%' }
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
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
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
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var chars = String(this.settings.text || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        var spd = this.settings.orbitSpeed * 0.3;
        var tight = this.settings.spiralTight;
        var fs = this.settings.fontSize * (W / 512);
        var cc = this.settings.colorCycle;
        var bgC = this.settings.bgColor || '#000814';
        var sat = this.settings.saturation;
        var bri = this.settings.brightness;
        var n = chars.length;
        var cx = W / 2; var cy = H / 2;
        var maxR = Math.min(W, H) * 0.45;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bgC;
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold ' + fs + 'px "Share Tech Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        for (var i = 0; i < n; i++) {
            var angle = (i / n) * Math.PI * 2 + time * spd * 0.2;
            // Logarithmic spiral: r = a * e^(b*theta)
            var t = i / n;
            var r = maxR * Math.pow(t * (tight / 10) + 0.1, 0.6);
            var hue = ((i / n) * 360 + time * cc * 10) % 360;
            var x = cx + Math.cos(angle) * r;
            var y = cy + Math.sin(angle) * r * 0.65; // flatten to ellipse

            var alpha = 0.4 + 0.6 * t;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'hsl(' + hue + ',' + sat + '%,' + bri + '%)';
            ctx.shadowColor = 'hsl(' + hue + ',' + sat + '%,' + (bri + 20) + '%)';
            ctx.shadowBlur = 10;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + Math.PI / 2);
            ctx.fillText(chars[i], 0, 0);
            ctx.restore();
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
