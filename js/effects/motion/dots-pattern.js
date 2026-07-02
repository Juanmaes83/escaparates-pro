(function() {
    var effect = new EP.EffectBase('dots-pattern', {
        name: 'Dots Pattern',
        category: 'motion',
        icon: '⚫',
        description: 'Puntos que se expanden formando patrones geométricos — transición fluida entre figuras'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'dotCount', type: 'range', min: 9, max: 49, default: 25, step: 4, label: 'Número de puntos' },
        { key: 'dotSize', type: 'range', min: 5, max: 30, default: 14, step: 1, label: 'Tamaño punto', unit: 'px' },
        { key: 'color1', type: 'color', default: '#00ffcc', label: 'Color interior' },
        { key: 'color2', type: 'color', default: '#ff0055', label: 'Color exterior' },
        { key: 'bgColor', type: 'color', default: '#0a0a14', label: 'Color fondo' },
        { key: 'animSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad animación' },
        { key: 'pattern', type: 'select', options: [
            { v: 'expand', l: 'Expansión radial' },
            { v: 'wave', l: 'Onda horizontal' },
            { v: 'spiral', l: 'Espiral' },
            { v: 'grid', l: 'Grid pulsante' }
        ], default: 'expand', label: 'Patrón' }
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
        var n = Math.round(Math.sqrt(this.settings.dotCount));
        var totalDots = n * n;
        var ds = this.settings.dotSize;
        var c1 = this.settings.color1 || '#00ffcc';
        var c2 = this.settings.color2 || '#ff0055';
        var bgC = this.settings.bgColor || '#0a0a14';
        var spd = this.settings.animSpeed * 0.4;
        var pattern = this.settings.pattern;
        var r1=parseInt(c1.slice(1,3),16), g1=parseInt(c1.slice(3,5),16), b1=parseInt(c1.slice(5,7),16);
        var r2=parseInt(c2.slice(1,3),16), g2=parseInt(c2.slice(3,5),16), b2=parseInt(c2.slice(5,7),16);
        var cx = W / 2; var cy = H / 2;
        var spacingX = W / (n + 1); var spacingY = H / (n + 1);
        var maxDist = Math.sqrt(cx * cx + cy * cy);

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bgC;
        ctx.fillRect(0, 0, W, H);

        for (var row = 0; row < n; row++) {
            for (var col = 0; col < n; col++) {
                var x = (col + 1) * spacingX;
                var y = (row + 1) * spacingY;
                var dx = x - cx; var dy = y - cy;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var t = dist / maxDist; // 0=center, 1=edge

                var phase;
                switch(pattern) {
                    case 'expand':
                        phase = Math.sin(time * spd - t * 4); break;
                    case 'wave':
                        phase = Math.sin(time * spd + col * 0.5); break;
                    case 'spiral':
                        var angle = Math.atan2(dy, dx);
                        phase = Math.sin(time * spd + angle * 2 + t * 3); break;
                    case 'grid':
                        phase = Math.sin(time * spd + col * 0.8) * Math.cos(time * spd * 0.7 + row * 0.8); break;
                    default:
                        phase = Math.sin(time * spd);
                }

                var p = (phase + 1) / 2; // 0..1
                var radius = Math.max(2, ds * 0.3 + ds * 0.7 * p);
                var r = Math.round(r1 + (r2 - r1) * t);
                var g = Math.round(g1 + (g2 - g1) * t);
                var b = Math.round(b1 + (b2 - b1) * t);
                var alpha = 0.5 + p * 0.5;

                ctx.globalAlpha = alpha;
                ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                ctx.shadowColor = 'rgb(' + r + ',' + g + ',' + b + ')';
                ctx.shadowBlur = radius * 1.5 * p;
                ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
