(function() {
    var effect = new EP.EffectBase('star-border', {
        name: 'Star Border',
        category: 'text',
        icon: '✦',
        description: 'Borde animado de estrellas — partículas brillantes que orbitan el texto, inspirado en react-bits StarBorder'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'text', type: 'text', default: 'ESCAPARATES PRO', label: 'Texto' },
        { key: 'fontSize', type: 'range', min: 24, max: 120, default: 60, step: 2, label: 'Tamaño texto', unit: 'px' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Color texto' },
        { key: 'bgColor', type: 'color', default: '#0a0a14', label: 'Color fondo' },
        { key: 'starColor', type: 'color', default: '#ffcc00', label: 'Color estrellas' },
        { key: 'starCount', type: 'range', min: 8, max: 60, default: 24, step: 4, label: 'Número de estrellas' },
        { key: 'starSize', type: 'range', min: 2, max: 16, default: 6, step: 1, label: 'Tamaño estrella', unit: 'px' },
        { key: 'orbitSpeed', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Velocidad órbita' },
        { key: 'orbitPadding', type: 'range', min: 10, max: 60, default: 25, step: 5, label: 'Espacio borde-texto', unit: 'px' },
        { key: 'glowIntensity', type: 'range', min: 0, max: 30, default: 12, step: 2, label: 'Intensidad glow' },
        { key: 'starShape', type: 'select', options: [
            { v: 'star4', l: '✦ Estrella 4 puntas' },
            { v: 'star6', l: '✶ Estrella 6 puntas' },
            { v: 'dot', l: '● Punto' },
            { v: 'diamond', l: '◆ Diamante' }
        ], default: 'star4', label: 'Forma estrella' }
    ]);

    function drawStar4(ctx, x, y, r, rot) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        ctx.beginPath();
        for (var i = 0; i < 4; i++) {
            var a = i * Math.PI / 2;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.lineTo(Math.cos(a + Math.PI/4) * r * 0.38, Math.sin(a + Math.PI/4) * r * 0.38);
        }
        ctx.closePath(); ctx.fill(); ctx.restore();
    }

    function drawStar6(ctx, x, y, r, rot) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        ctx.beginPath();
        for (var i = 0; i < 6; i++) {
            var a = i * Math.PI / 3;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.lineTo(Math.cos(a + Math.PI/6) * r * 0.4, Math.sin(a + Math.PI/6) * r * 0.4);
        }
        ctx.closePath(); ctx.fill(); ctx.restore();
    }

    function drawDiamond(ctx, x, y, r, rot) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(r * 0.55, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.55, 0);
        ctx.closePath(); ctx.fill(); ctx.restore();
    }

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
        var txt = (this.settings.text || 'STAR BORDER').toUpperCase();
        var fs = this.settings.fontSize;
        var textC = this.settings.textColor || '#ffffff';
        var bgC = this.settings.bgColor || '#0a0a14';
        var starC = this.settings.starColor || '#ffcc00';
        var nStars = Math.round(this.settings.starCount);
        var starSz = this.settings.starSize;
        var spd = this.settings.orbitSpeed * 0.5;
        var pad = this.settings.orbitPadding;
        var glow = this.settings.glowIntensity;
        var shape = this.settings.starShape;

        var sr = parseInt(starC.slice(1,3),16);
        var sg = parseInt(starC.slice(3,5),16);
        var sb = parseInt(starC.slice(5,7),16);

        ctx.clearRect(0, 0, W, H);

        // Background
        if (!this._media || true) {
            ctx.fillStyle = bgC;
            ctx.fillRect(0, 0, W, H);
        }

        // Measure text
        ctx.font = 'bold ' + fs + 'px "Arial", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var metrics = ctx.measureText(txt);
        var tw = metrics.width;
        var th = fs * 1.1;
        var tx = W / 2; var ty = H / 2;

        // Draw text with glow
        if (glow > 0) {
            ctx.shadowColor = textC;
            ctx.shadowBlur = glow * 0.5;
        }
        ctx.fillStyle = textC;
        ctx.fillText(txt, tx, ty);
        ctx.shadowBlur = 0;

        // Define orbit rectangle
        var rx = tx - tw / 2 - pad; var ry = ty - th / 2 - pad;
        var rw = tw + pad * 2; var rh = th + pad * 2;

        // Perimeter of rectangle
        var perimeter = 2 * (rw + rh);

        // Draw stars along perimeter
        for (var i = 0; i < nStars; i++) {
            var t = ((i / nStars) + time * spd * 0.02) % 1;
            var dist = t * perimeter;

            // Map dist to x,y on rect perimeter
            var px, py;
            if (dist < rw) {
                px = rx + dist; py = ry;
            } else if (dist < rw + rh) {
                px = rx + rw; py = ry + (dist - rw);
            } else if (dist < rw * 2 + rh) {
                px = rx + rw - (dist - rw - rh); py = ry + rh;
            } else {
                px = rx; py = ry + rh - (dist - rw * 2 - rh);
            }

            // Pulse size
            var pulseSz = starSz * (0.7 + Math.sin(time * 4 + i * 0.8) * 0.3);
            var alpha = 0.6 + Math.sin(time * 3 + i * 1.2) * 0.4;
            var rot = time * 2 + i * 0.4;

            // Glow halo
            if (glow > 0) {
                var radGrad = ctx.createRadialGradient(px, py, 0, px, py, pulseSz * 3);
                radGrad.addColorStop(0, 'rgba(' + sr + ',' + sg + ',' + sb + ',' + (alpha * 0.6) + ')');
                radGrad.addColorStop(1, 'rgba(' + sr + ',' + sg + ',' + sb + ',0)');
                ctx.fillStyle = radGrad;
                ctx.beginPath(); ctx.arc(px, py, pulseSz * 3, 0, Math.PI * 2); ctx.fill();
            }

            ctx.fillStyle = 'rgba(' + sr + ',' + sg + ',' + sb + ',' + alpha + ')';

            if (shape === 'dot') {
                ctx.beginPath(); ctx.arc(px, py, pulseSz * 0.6, 0, Math.PI * 2); ctx.fill();
            } else if (shape === 'diamond') {
                drawDiamond(ctx, px, py, pulseSz, rot);
            } else if (shape === 'star6') {
                drawStar6(ctx, px, py, pulseSz, rot);
            } else {
                drawStar4(ctx, px, py, pulseSz, rot);
            }
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
