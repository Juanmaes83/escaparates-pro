(function() {
    var effect = new EP.EffectBase('magnetic-cursor', {
        name: 'Magnetic Cursor',
        category: 'motion',
        icon: '🧲',
        description: 'Cursor magnético que atrae partículas y deforma la imagen al pasar'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'pullStrength', type: 'range', min: 5, max: 80, default: 35, step: 1, label: 'Fuerza atracción', unit: '%' },
        { key: 'pullRadius', type: 'range', min: 50, max: 400, default: 160, step: 10, label: 'Radio atracción', unit: 'px' },
        { key: 'particleCount', type: 'range', min: 10, max: 80, default: 35, step: 5, label: 'Partículas' },
        { key: 'particleColor', type: 'color', default: '#4f8cff', label: 'Color partículas' },
        { key: 'cursorGlow', type: 'range', min: 0, max: 100, default: 60, step: 5, label: 'Glow cursor', unit: '%' },
        { key: 'repel', type: 'select', options: [{ v: 'off', l: 'Atraer' }, { v: 'on', l: 'Repeler' }], default: 'off', label: 'Modo' }
    ]);

    function seededRand(s) { var x = Math.sin(s + 1) * 43758.5453; return x - Math.floor(x); }

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

        // Init particles with seeded positions
        var maxP = 80;
        this._particles = [];
        var W = this._cvs.width; var H = this._cvs.height;
        for (var i = 0; i < maxP; i++) {
            this._particles.push({
                ox: seededRand(i * 7) * W,   // origin X
                oy: seededRand(i * 13) * H,  // origin Y
                x: seededRand(i * 7) * W,
                y: seededRand(i * 13) * H,
                vx: 0, vy: 0,
                r: 2 + seededRand(i * 17) * 5
            });
        }

        // Mouse state (canvas coordinates)
        this._mouseX = W / 2; this._mouseY = H / 2;
        this._mouseActive = false;
        var self = this;
        this._onMouseMove = function(e) {
            var canvas = document.querySelector('canvas');
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            // Map screen coords to canvas texture coords
            self._mouseX = ((e.clientX - rect.left) / rect.width) * W;
            self._mouseY = ((e.clientY - rect.top) / rect.height) * H;
            self._mouseActive = true;
        };
        this._onMouseLeave = function() { self._mouseActive = false; };
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseleave', this._onMouseLeave);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx;
        var W = this._cvs.width; var H = this._cvs.height;

        var pull = this.settings.pullStrength / 100;
        var radius = this.settings.pullRadius;
        var numP = Math.round(this.settings.particleCount);
        var repel = this.settings.repel === 'on';
        var colorHex = this.settings.particleColor || '#4f8cff';
        var cr = parseInt(colorHex.slice(1,3),16);
        var cg = parseInt(colorHex.slice(3,5),16);
        var cb = parseInt(colorHex.slice(5,7),16);

        // Auto-animate cursor when mouse not active
        var mx, my;
        if (this._mouseActive) {
            mx = this._mouseX; my = this._mouseY;
        } else {
            mx = W/2 + Math.sin(time * 0.5) * W * 0.3;
            my = H/2 + Math.cos(time * 0.37) * H * 0.25;
        }

        ctx.clearRect(0, 0, W, H);

        // Update and draw particles
        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.85)';
        for (var i = 0; i < numP && i < this._particles.length; i++) {
            var p = this._particles[i];
            var dx = mx - p.x;
            var dy = my - p.y;
            var dist = Math.sqrt(dx*dx + dy*dy) || 1;

            if (dist < radius) {
                var force = (1 - dist / radius) * pull * 8;
                var dir = repel ? -1 : 1;
                p.vx += (dx / dist) * force * dir;
                p.vy += (dy / dist) * force * dir;
            }

            // Spring back to origin
            p.vx += (p.ox - p.x) * 0.04;
            p.vy += (p.oy - p.y) * 0.04;

            // Damping
            p.vx *= 0.88;
            p.vy *= 0.88;

            p.x += p.vx;
            p.y += p.vy;

            // Draw particle
            var alpha = Math.min(1, 0.5 + (dist < radius ? (1 - dist/radius) * 0.5 : 0));
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Cursor glow ring
        var gi = this.settings.cursorGlow / 100;
        if (gi > 0) {
            var grad = ctx.createRadialGradient(mx, my, 0, mx, my, 40);
            grad.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (gi * 0.8) + ')');
            grad.addColorStop(0.3, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (gi * 0.3) + ')');
            grad.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
            ctx.beginPath();
            ctx.arc(mx, my, 40, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Outer ring
            ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (gi * 0.6) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(mx, my, 20, 0, Math.PI * 2);
            ctx.stroke();
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
        if (this._onMouseLeave) window.removeEventListener('mouseleave', this._onMouseLeave);
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._particles = [];
    };

    EP.Registry.register(effect);
})();
