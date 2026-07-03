(function() {
    var effect = new EP.EffectBase('denim', {
        name: 'Denim',
        category: 'motion',
        icon: '🧵',
        description: 'Textura tejido denim — trama diagonal de hilos entrelazados sobre imagen, estilo tela vaquera'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'threadSize', type: 'range', min: 2, max: 12, default: 4, step: 1, label: 'Grosor hilo', unit: 'px' },
        { key: 'threadColor', type: 'color', default: '#2255aa', label: 'Color hilo' },
        { key: 'overlayOpacity', type: 'range', min: 10, max: 90, default: 55, step: 5, label: 'Opacidad trama', unit: '%' },
        { key: 'weaveStyle', type: 'select', options: [
            { v: 'diagonal', l: 'Diagonal clásico' },
            { v: 'twill', l: 'Sarga (twill)' },
            { v: 'cross', l: 'Cruzado' }
        ], default: 'diagonal', label: 'Estilo trama' },
        { key: 'animate', type: 'select', options: [
            { v: 'off', l: 'Estático' },
            { v: 'shimmer', l: 'Destello sutil' }
        ], default: 'shimmer', label: 'Animación' }
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
        this._cvs.width = 512; this._cvs.height = 288;
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
        var ts = Math.max(2, Math.round(this.settings.threadSize));
        var tc = this.settings.threadColor || '#2255aa';
        var op = this.settings.overlayOpacity / 100;
        var style = this.settings.weaveStyle;
        var animate = this.settings.animate;

        var tr = parseInt(tc.slice(1,3),16);
        var tg = parseInt(tc.slice(3,5),16);
        var tb = parseInt(tc.slice(5,7),16);

        ctx.clearRect(0, 0, W, H);

        var shimmer = (animate === 'shimmer') ? Math.sin(time * 1.2) * 0.08 : 0;
        var baseOp = op + shimmer;

        if (style === 'diagonal' || style === 'twill') {
            var gap = ts * 2;
            var offset = (style === 'twill') ? ts : 0;

            // Draw diagonal threads (NE direction)
            ctx.save();
            ctx.lineWidth = ts;
            var totalLen = W + H;
            for (var i = -H; i < totalLen; i += gap) {
                var shimLine = (animate === 'shimmer') ? Math.sin(time * 2 + i * 0.05) * 0.12 : 0;
                var lineOp = baseOp + shimLine;
                ctx.strokeStyle = 'rgba(' + tr + ',' + tg + ',' + tb + ',' + Math.max(0.05, Math.min(1, lineOp)) + ')';
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + H, H);
                ctx.stroke();
            }
            // Draw crossing threads (NW direction)
            for (var i = 0; i < W + H; i += gap) {
                var shimLine2 = (animate === 'shimmer') ? Math.sin(time * 2.3 + i * 0.04) * 0.10 : 0;
                var lineOp2 = (baseOp * 0.7) + shimLine2;
                ctx.strokeStyle = 'rgba(' + tr + ',' + tg + ',' + tb + ',' + Math.max(0.03, Math.min(1, lineOp2)) + ')';
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i - H, H);
                ctx.stroke();
            }
            ctx.restore();
        } else {
            // Cross: pure perpendicular grid
            ctx.lineWidth = ts;
            // Horizontal threads
            for (var y = 0; y < H; y += ts * 2) {
                var shimH = (animate === 'shimmer') ? Math.sin(time * 1.8 + y * 0.03) * 0.1 : 0;
                ctx.strokeStyle = 'rgba(' + tr + ',' + tg + ',' + tb + ',' + Math.max(0.05, baseOp + shimH) + ')';
                ctx.beginPath(); ctx.moveTo(0, y + ts * 0.5); ctx.lineTo(W, y + ts * 0.5); ctx.stroke();
            }
            // Vertical threads (slightly lighter)
            for (var x = 0; x < W; x += ts * 2) {
                var shimV = (animate === 'shimmer') ? Math.sin(time * 2.1 + x * 0.04) * 0.08 : 0;
                ctx.strokeStyle = 'rgba(' + tr + ',' + tg + ',' + tb + ',' + Math.max(0.03, baseOp * 0.7 + shimV) + ')';
                ctx.beginPath(); ctx.moveTo(x + ts * 0.5, 0); ctx.lineTo(x + ts * 0.5, H); ctx.stroke();
            }
        }

        // Subtle dark vignette to enhance fabric depth
        var vigGrad = ctx.createRadialGradient(W/2, H/2, W * 0.25, W/2, H/2, W * 0.75);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
