(function() {
    var effect = new EP.EffectBase('shiny-text', {
        name: 'Shiny Text',
        category: 'text',
        icon: '✨',
        description: 'Texto con destello de luz — barrido de reflejo animado sobre el texto, estilo react-bits ShinyText'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'text', type: 'text', default: 'Escaparates Pro', label: 'Texto principal' },
        { key: 'subtext', type: 'text', default: 'INMOBILIARIAS · PREMIUM', label: 'Subtexto' },
        { key: 'fontSize', type: 'range', min: 24, max: 120, default: 72, step: 2, label: 'Tamaño texto', unit: 'px' },
        { key: 'textColor', type: 'color', default: '#c8d8ff', label: 'Color base texto' },
        { key: 'bgColor', type: 'color', default: '#08080f', label: 'Color fondo' },
        { key: 'shineColor', type: 'color', default: '#ffffff', label: 'Color destello' },
        { key: 'shineWidth', type: 'range', min: 5, max: 60, default: 25, step: 5, label: 'Ancho destello', unit: '%' },
        { key: 'shineSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad destello' },
        { key: 'shineIntensity', type: 'range', min: 10, max: 100, default: 70, step: 5, label: 'Intensidad destello', unit: '%' },
        { key: 'shineAngle', type: 'range', min: -60, max: 60, default: 25, step: 5, label: 'Ángulo destello', unit: '°' },
        { key: 'fontFamily', type: 'select', options: [
            { v: 'serif', l: 'Serif elegante' },
            { v: 'sans', l: 'Sans-serif moderno' },
            { v: 'mono', l: 'Monospace' }
        ], default: 'serif', label: 'Fuente' }
    ]);

    var FONTS = {
        serif: '"Georgia", "Times New Roman", serif',
        sans: '"Arial", "Helvetica", sans-serif',
        mono: '"Courier New", monospace'
    };

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
        var txt = this.settings.text || 'Shiny Text';
        var sub = this.settings.subtext || '';
        var fs = this.settings.fontSize;
        var textC = this.settings.textColor || '#c8d8ff';
        var bgC = this.settings.bgColor || '#08080f';
        var shineC = this.settings.shineColor || '#ffffff';
        var shineW = this.settings.shineWidth / 100;
        var shineSpd = this.settings.shineSpeed;
        var shineInt = this.settings.shineIntensity / 100;
        var angle = this.settings.shineAngle * Math.PI / 180;
        var fontFam = FONTS[this.settings.fontFamily] || FONTS.serif;

        var sr = parseInt(shineC.slice(1,3),16);
        var sg = parseInt(shineC.slice(3,5),16);
        var sb = parseInt(shineC.slice(5,7),16);

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bgC;
        ctx.fillRect(0, 0, W, H);

        var cx = W / 2; var cy = H / 2;

        // --- Draw main text ---
        ctx.font = 'bold ' + fs + 'px ' + fontFam;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // Measure to get bounding box
        var metrics = ctx.measureText(txt);
        var tw = metrics.width;
        var th = fs;
        var textX = cx; var textY = cy - (sub ? fs * 0.6 : 0);

        // Draw base text
        ctx.fillStyle = textC;
        ctx.fillText(txt, textX, textY);

        // Subtexto
        if (sub) {
            ctx.font = Math.round(fs * 0.3) + 'px ' + fontFam;
            ctx.letterSpacing = '4px';
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = textC;
            ctx.fillText(sub, cx, cy + fs * 0.7);
            ctx.globalAlpha = 1;
            ctx.letterSpacing = '0px';
        }

        // --- Shine sweep ---
        // Shine moves from left to right, cycling
        var shineCycle = ((time * shineSpd * 0.15) % 1.4) - 0.2;
        var shineX = cx - tw * 0.6 + shineCycle * (tw * 1.2 + W * shineW);
        var shineHalfW = W * shineW * 0.5;

        // Build shine gradient at angle
        var dx = Math.cos(angle) * shineHalfW;
        var dy = Math.sin(angle) * shineHalfW;
        var shineGrad = ctx.createLinearGradient(
            shineX - dx, textY - dy,
            shineX + dx, textY + dy
        );
        shineGrad.addColorStop(0, 'rgba(' + sr + ',' + sg + ',' + sb + ',0)');
        shineGrad.addColorStop(0.35, 'rgba(' + sr + ',' + sg + ',' + sb + ',' + (shineInt * 0.5) + ')');
        shineGrad.addColorStop(0.5, 'rgba(' + sr + ',' + sg + ',' + sb + ',' + shineInt + ')');
        shineGrad.addColorStop(0.65, 'rgba(' + sr + ',' + sg + ',' + sb + ',' + (shineInt * 0.5) + ')');
        shineGrad.addColorStop(1, 'rgba(' + sr + ',' + sg + ',' + sb + ',0)');

        // Clip to text area and apply shine
        ctx.save();
        // Re-draw text path as clip
        ctx.font = 'bold ' + fs + 'px ' + fontFam;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // Expand clip region slightly for the glow
        var clipPad = shineHalfW * 0.3;
        ctx.beginPath();
        ctx.rect(cx - tw / 2 - clipPad, textY - th * 0.6, tw + clipPad * 2, th * 1.2);
        ctx.clip();

        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = shineGrad;
        ctx.fillRect(cx - tw / 2 - clipPad, textY - th * 0.6, tw + clipPad * 2, th * 1.2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        // Subtle underline separator
        var lineY = cy + (sub ? fs * 0.05 : -fs * 0.55);
        var lineGrad = ctx.createLinearGradient(cx - tw * 0.3, lineY, cx + tw * 0.3, lineY);
        lineGrad.addColorStop(0, 'rgba(' + sr + ',' + sg + ',' + sb + ',0)');
        lineGrad.addColorStop(0.5, 'rgba(' + sr + ',' + sg + ',' + sb + ',0.35)');
        lineGrad.addColorStop(1, 'rgba(' + sr + ',' + sg + ',' + sb + ',0)');
        ctx.fillStyle = lineGrad;
        ctx.fillRect(cx - tw * 0.3, lineY, tw * 0.6, 1);

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
