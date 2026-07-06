(function() {
    var effect = new EP.EffectBase('split-text', {
        name: 'Split Text',
        category: 'text',
        icon: '✂️',
        description: 'Texto dividido animado — caracteres/palabras se dispersan y reensamblan con física de spring, inspirado en react-bits SplitText'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'text', type: 'text', default: 'SPLIT TEXT', label: 'Texto principal' },
        { key: 'subText', type: 'text', default: 'Escaparates Pro', label: 'Subtexto' },
        { key: 'fontSize', type: 'range', min: 30, max: 140, default: 80, step: 2, label: 'Tamaño texto', unit: 'px' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Color texto' },
        { key: 'bgColor', type: 'color', default: '#070712', label: 'Color fondo' },
        { key: 'splitMode', type: 'select', options: [
            { v: 'scatter', l: 'Dispersión aleatoria' },
            { v: 'fromBelow', l: 'Desde abajo' },
            { v: 'fromLeft', l: 'Desde izquierda' },
            { v: 'explode', l: 'Explosión radial' },
            { v: 'rain', l: 'Lluvia desde arriba' }
        ], default: 'scatter', label: 'Modo animación' },
        { key: 'stagger', type: 'range', min: 0, max: 200, default: 60, step: 10, label: 'Stagger entre chars', unit: 'ms' },
        { key: 'holdTime', type: 'range', min: 0.5, max: 6, default: 2, step: 0.5, label: 'Hold compuesto', unit: 's' },
        { key: 'spring', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Rigidez spring' }
    ]);

    function sr(s) { var r = (Math.sin(s+1)*43758.5453)%1; return r<0?r+1:r; }

    function smoothstep(t) { return t*t*(3-2*t); }

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

        this._phase = 'assemble'; // assemble | hold | scatter
        this._phaseStart = -1;
        this._chars = null; // will be initialized in update
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var txt = (this.settings.text || 'SPLIT TEXT').toUpperCase();
        var sub = this.settings.subText || '';
        var fs = this.settings.fontSize;
        var textC = this.settings.textColor || '#ffffff';
        var bgC = this.settings.bgColor || '#070712';
        var mode = this.settings.splitMode;
        var stagger = this.settings.stagger / 1000;
        var holdT = this.settings.holdTime;
        var spring = this.settings.spring * 0.1;

        var tr = parseInt(textC.slice(1,3),16), tg = parseInt(textC.slice(3,5),16), tb = parseInt(textC.slice(5,7),16);

        // Initialize char data
        if (!this._chars || this._lastText !== txt || this._lastMode !== mode) {
            this._lastText = txt; this._lastMode = mode;
            ctx.font = 'bold ' + fs + 'px "Arial", sans-serif';
            ctx.textBaseline = 'alphabetic';
            var chars = txt.split('');
            var totalW = 0;
            var widths = [];
            for (var i = 0; i < chars.length; i++) {
                var w = ctx.measureText(chars[i]).width;
                widths.push(w);
                totalW += w;
            }
            var startX = (W - totalW) / 2;
            var baseY = H / 2 - fs * 0.05;

            this._chars = chars.map(function(c, i) {
                var cx = 0;
                for (var j = 0; j < i; j++) cx += widths[j];
                cx += startX + widths[i] / 2;
                var targetX = cx;
                var targetY = baseY;

                // Scatter origin based on mode
                var ox, oy;
                switch(mode) {
                    case 'fromBelow':  ox = targetX; oy = H + fs; break;
                    case 'fromLeft':   ox = -fs * 2; oy = targetY; break;
                    case 'rain':       ox = targetX + (sr(i*7)-0.5)*W*0.3; oy = -fs*2; break;
                    case 'explode': {
                        var angle = sr(i*11)*Math.PI*2;
                        var dist = 200+sr(i*13)*300;
                        ox = W/2 + Math.cos(angle)*dist; oy = H/2 + Math.sin(angle)*dist;
                        break;
                    }
                    default: // scatter
                        ox = (sr(i*17)-0.5)*W*1.5+W/2;
                        oy = (sr(i*23)-0.5)*H*1.5+H/2;
                }
                return {
                    char: c, width: widths[i],
                    targetX: targetX, targetY: targetY,
                    ox: ox, oy: oy,
                    x: ox, y: oy,
                    vx: 0, vy: 0,
                    delay: i * stagger,
                    alpha: 0, rot: (sr(i*7)-0.5)*Math.PI*0.8
                };
            });
            this._phase = 'assemble';
            this._phaseStart = time;
        }

        // State machine
        if (this._phaseStart < 0) this._phaseStart = time;
        var elapsed = time - this._phaseStart;

        var numChars = this._chars.length;
        var totalAnim = numChars * stagger + 0.8;

        if (this._phase === 'assemble' && elapsed > totalAnim + holdT) {
            this._phase = 'scatter';
            this._phaseStart = time;
            // Set velocities for scatter
            for (var i = 0; i < numChars; i++) {
                var c = this._chars[i];
                c.delay = (numChars - 1 - i) * stagger;
            }
        } else if (this._phase === 'scatter' && elapsed > totalAnim + holdT) {
            this._phase = 'assemble';
            this._phaseStart = time;
            for (var i = 0; i < numChars; i++) {
                var c = this._chars[i];
                c.delay = i * stagger;
                // Randomize new scatter origin
                switch(mode) {
                    case 'fromBelow':  c.ox = c.targetX; c.oy = H + fs; break;
                    case 'fromLeft':   c.ox = -fs*2; c.oy = c.targetY; break;
                    case 'rain':       c.ox = c.targetX+(sr(i*7+time)-0.5)*W*0.3; c.oy=-fs*2; break;
                    case 'explode': {
                        var a2 = sr(i*11+time)*Math.PI*2;
                        var d2 = 200+sr(i*13+time)*300;
                        c.ox = W/2+Math.cos(a2)*d2; c.oy = H/2+Math.sin(a2)*d2;
                        break;
                    }
                    default:
                        c.ox = (sr(i*17+time)-0.5)*W*1.5+W/2;
                        c.oy = (sr(i*23+time)-0.5)*H*1.5+H/2;
                }
                c.x = c.targetX; c.y = c.targetY;
            }
        }

        // Physics update per char
        for (var i = 0; i < numChars; i++) {
            var c = this._chars[i];
            var charElapsed = elapsed - c.delay;
            var progress = Math.max(0, Math.min(1, charElapsed / 0.7));
            progress = smoothstep(progress);

            if (this._phase === 'assemble') {
                c.x = c.ox + (c.targetX - c.ox) * progress;
                c.y = c.oy + (c.targetY - c.oy) * progress;
                c.alpha = progress;
                c.rot = c.rot * (1 - progress);
            } else { // scatter
                c.x = c.targetX + (c.ox - c.targetX) * progress;
                c.y = c.targetY + (c.oy - c.targetY) * progress;
                c.alpha = 1 - progress;
                c.rot = progress * ((i % 2 === 0 ? 1 : -1) * Math.PI * 0.5);
            }
        }

        ctx.fillStyle = bgC;
        ctx.fillRect(0, 0, W, H);

        // Draw chars
        for (var i = 0; i < numChars; i++) {
            var c = this._chars[i];
            if (c.alpha < 0.01) continue;
            ctx.save();
            ctx.globalAlpha = c.alpha;
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);
            ctx.font = 'bold ' + fs + 'px "Arial", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = textC;
            if (c.alpha > 0.5) {
                ctx.shadowColor = textC;
                ctx.shadowBlur = 8 * (c.alpha - 0.5) * 2;
            }
            ctx.fillText(c.char, 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Subtexto
        if (sub) {
            var subAlpha = this._phase === 'assemble' ? Math.max(0, Math.min(1, (elapsed - totalAnim + 0.2) / 0.5)) : Math.max(0, 1 - Math.max(0, elapsed - holdT) / 0.4);
            if (subAlpha > 0.01) {
                ctx.save();
                ctx.globalAlpha = subAlpha * 0.6;
                ctx.font = Math.round(fs * 0.28) + 'px "Arial", sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillStyle = textC;
                ctx.fillText(sub, W/2, H/2 + fs * 0.55);
                ctx.restore();
            }
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._chars = null;
    };

    EP.Registry.register(effect);
})();
