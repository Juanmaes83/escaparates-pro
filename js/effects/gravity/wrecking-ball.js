(function() {
    var effect = new EP.EffectBase('wrecking-ball', {
        name: 'Wrecking Ball',
        category: 'gravity',
        icon: '🔨',
        description: 'Bola oscilante que golpea la imagen rompiéndola en fragmentos'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'ballSize', type: 'range', min: 20, max: 120, default: 55, step: 5, label: 'Tamaño bola', unit: 'px' },
        { key: 'ballColor', type: 'color', default: '#888899', label: 'Color bola' },
        { key: 'swingAngle', type: 'range', min: 10, max: 80, default: 45, step: 5, label: 'Ángulo oscilación', unit: '°' },
        { key: 'shatter', type: 'range', min: 4, max: 20, default: 8, step: 1, label: 'Fragmentos' }
    ]);

    function seededRand(s) { var x = Math.sin(s+1)*43758.5453; return x-Math.floor(x); }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        group.add(new THREE.Mesh(geo, mat));

        this._imgCvs = null;
        var m0 = mediaList && mediaList[0];
        var el0 = m0 && (m0.element || (m0.texture && m0.texture.image));
        if (el0) {
            var oc = document.createElement('canvas');
            oc.width = 1024; oc.height = 576;
            try { oc.getContext('2d').drawImage(el0, 0, 0, 1024, 576); this._imgCvs = oc; } catch(e) {}
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var t = (time % loopDuration) / loopDuration;

        // Swing: pivot at top-center, pendulum motion
        var maxAngle = (this.settings.swingAngle * Math.PI / 180);
        var swingT = Math.sin(t * Math.PI * 2 * 1.5); // 1.5 swings per loop
        var angle = swingT * maxAngle;
        var ropeLen = H * 0.55;
        var pivotX = W / 2; var pivotY = -H * 0.1;
        var ballX = pivotX + Math.sin(angle) * ropeLen;
        var ballY = pivotY + Math.cos(angle) * ropeLen;
        var ballR = this.settings.ballSize;

        // Shatter tiles fly when ball is near center
        var impactZone = Math.abs(angle) < 0.2;
        var numTiles = Math.round(this.settings.shatter);
        var tileW = W / numTiles; var tileH = H / numTiles;

        ctx.clearRect(0, 0, W, H);

        // Draw image tiles (with displacement near impact)
        for (var tx = 0; tx < numTiles; tx++) {
            for (var ty = 0; ty < numTiles; ty++) {
                var cx = tx * tileW + tileW / 2;
                var cy = ty * tileH + tileH / 2;
                var distFromBall = Math.sqrt(Math.pow(cx - ballX, 2) + Math.pow(cy - ballY, 2));
                var pushFactor = impactZone ? Math.max(0, 1 - distFromBall / (ballR * 3)) : 0;
                var seed = tx * 100 + ty;
                var pushX = (seededRand(seed) - 0.5) * 2 * pushFactor * 60;
                var pushY = (seededRand(seed + 1) - 0.5) * 2 * pushFactor * 60 + pushFactor * 30;

                ctx.save();
                ctx.translate(cx + pushX, cy + pushY);
                ctx.rotate(pushFactor * (seededRand(seed + 2) - 0.5) * 0.5);
                if (this._imgCvs) {
                    ctx.drawImage(this._imgCvs, tx * tileW, ty * tileH, tileW, tileH,
                        -tileW / 2, -tileH / 2, tileW, tileH);
                } else {
                    ctx.fillStyle = 'hsl(' + (seed * 37 % 360) + ',50%,30%)';
                    ctx.fillRect(-tileW/2, -tileH/2, tileW-1, tileH-1);
                }
                ctx.restore();
            }
        }

        // Draw rope
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(ballX, ballY);
        ctx.stroke();

        // Draw ball
        var bHex = this.settings.ballColor || '#888899';
        var grad = ctx.createRadialGradient(ballX - ballR*0.3, ballY - ballR*0.3, ballR*0.1, ballX, ballY, ballR);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, bHex);
        grad.addColorStop(1, '#222');
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null;
    };

    EP.Registry.register(effect);
})();
