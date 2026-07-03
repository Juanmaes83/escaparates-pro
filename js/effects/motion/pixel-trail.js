(function() {
    var effect = new EP.EffectBase('pixel-trail', {
        name: 'Pixel Trail',
        category: 'motion',
        icon: '🖱️',
        description: 'Rastro de píxeles — cursor deja estela colorida de píxeles cuadrados que se desvanecen, máxima fidelidad al original react-bits PixelTrail'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'pixelSize', type: 'range', min: 2, max: 24, default: 8, step: 2, label: 'Tamaño píxel', unit: 'px' },
        { key: 'trailLength', type: 'range', min: 20, max: 300, default: 120, step: 10, label: 'Longitud estela', unit: 'pts' },
        { key: 'colorMode', type: 'select', options: [
            { v: 'rainbow', l: 'Arcoíris' },
            { v: 'fire', l: 'Fuego' },
            { v: 'neon', l: 'Neón' },
            { v: 'mono', l: 'Monocromo' },
            { v: 'ocean', l: 'Océano' }
        ], default: 'rainbow', label: 'Paleta color' },
        { key: 'trailColor', type: 'color', default: '#ffffff', label: 'Color mono' },
        { key: 'fadeSpeed', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Velocidad desvanecimiento' },
        { key: 'bgOpacity', type: 'range', min: 0, max: 100, default: 85, step: 5, label: 'Opacidad fondo oscuro', unit: '%' },
        { key: 'autoMove', type: 'select', options: [
            { v: 'lissajous', l: 'Lissajous (demo)' },
            { v: 'spiral', l: 'Espiral (demo)' },
            { v: 'cursor', l: 'Cursor real' }
        ], default: 'lissajous', label: 'Modo movimiento' }
    ]);

    function hueToRgb(h) {
        h = h % 360;
        var s = 1, l = 0.6;
        var c = (1 - Math.abs(2*l - 1)) * s;
        var x = c * (1 - Math.abs((h/60) % 2 - 1));
        var m = l - c/2;
        var r, g, b;
        if (h < 60)      { r=c; g=x; b=0; }
        else if (h < 120){ r=x; g=c; b=0; }
        else if (h < 180){ r=0; g=c; b=x; }
        else if (h < 240){ r=0; g=x; b=c; }
        else if (h < 300){ r=x; g=0; b=c; }
        else             { r=c; g=0; b=x; }
        return [Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255)];
    }

    function getColor(mode, hue, monoC) {
        switch(mode) {
            case 'fire': {
                var t = (hue % 360) / 360;
                if (t < 0.33) return [255, Math.round(t*3*165), 0];
                if (t < 0.66) return [255, Math.round(165+(t-0.33)*3*90), 0];
                return [255, 255, Math.round((t-0.66)*3*255)];
            }
            case 'neon': {
                var h2 = (hue * 2.5) % 360;
                var rgb = hueToRgb(h2);
                return rgb;
            }
            case 'ocean': {
                var t2 = (hue % 360) / 360;
                return [0, Math.round(100+t2*155), Math.round(180+t2*75)];
            }
            case 'mono': {
                var mc = monoC || '#ffffff';
                return [parseInt(mc.slice(1,3),16), parseInt(mc.slice(3,5),16), parseInt(mc.slice(5,7),16)];
            }
            default: return hueToRgb(hue);
        }
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._hasBg = !!(mediaList && mediaList.length > 0);
        if (this._hasBg) {
            var bgGeo = new THREE.PlaneGeometry(8, 4.5);
            var bgMat = EP.Media.createMaterial(mediaList[0]);
            var bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -0.05;
            group.add(bgMesh);
        }
        this._cvs = document.createElement('canvas');
        this._cvs.width = 512; this._cvs.height = 288;
        this._ctx = this._cvs.getContext('2d');
        if (!this._hasBg) {
            this._ctx.fillStyle = '#000000';
            this._ctx.fillRect(0, 0, 512, 288);
        }
        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);

        // Trail ring buffer
        this._trail = [];
        this._hueOffset = 0;
        this._mouseX = 0.5; this._mouseY = 0.5;

        var self = this;
        this._onMouseMove = function(e) {
            var canvas = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            self._mouseX = (e.clientX - rect.left) / rect.width;
            self._mouseY = (e.clientY - rect.top) / rect.height;
        };
        window.addEventListener('mousemove', this._onMouseMove);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var ps = Math.max(2, Math.round(this.settings.pixelSize));
        var maxLen = Math.round(this.settings.trailLength);
        var mode = this.settings.colorMode;
        var monoC = this.settings.trailColor;
        var fade = this.settings.fadeSpeed;
        var bgOp = this.settings.bgOpacity / 100;
        var autoMode = this.settings.autoMove;

        // Auto-move cursor for demo
        var mx, my;
        if (autoMode === 'lissajous') {
            mx = (Math.sin(time * 1.3) * 0.4 + 0.5);
            my = (Math.sin(time * 2.1) * 0.4 + 0.5);
        } else if (autoMode === 'spiral') {
            var r = 0.35 * (0.5 + 0.5 * Math.sin(time * 0.5));
            mx = 0.5 + r * Math.cos(time * 2.2);
            my = 0.5 + r * Math.sin(time * 2.2) * 0.7;
        } else {
            mx = this._mouseX; my = this._mouseY;
        }

        // Snap cursor to grid
        var gx = Math.round(mx * W / ps) * ps;
        var gy = Math.round(my * H / ps) * ps;

        // Add point if position changed
        var last = this._trail[this._trail.length - 1];
        var hue = (time * 120 + this._hueOffset) % 360;
        var rgb = getColor(mode, hue, monoC);

        if (!last || last.gx !== gx || last.gy !== gy) {
            this._trail.push({ gx: gx, gy: gy, life: 1, r: rgb[0], g: rgb[1], b: rgb[2] });
            this._hueOffset += 2.5;
        }
        if (this._trail.length > maxLen) {
            this._trail.splice(0, this._trail.length - maxLen);
        }

        // Fade: transparent when bg media present, black when solo
        if (this._hasBg) {
            ctx.clearRect(0, 0, W, H);
        } else {
            ctx.fillStyle = 'rgba(0,0,0,' + bgOp * 0.15 + ')';
            ctx.fillRect(0, 0, W, H);
        }

        // Draw trail from oldest to newest
        for (var i = 0; i < this._trail.length; i++) {
            var pt = this._trail[i];
            var t = i / this._trail.length;
            var alpha = t * t * pt.life;
            ctx.fillStyle = 'rgba(' + pt.r + ',' + pt.g + ',' + pt.b + ',' + alpha + ')';
            ctx.fillRect(pt.gx, pt.gy, ps, ps);
            pt.life -= (dt || 0.016) * fade * 0.5;
        }

        // Remove dead points
        this._trail = this._trail.filter(function(p){ return p.life > 0.01; });

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._onMouseMove) { window.removeEventListener('mousemove', this._onMouseMove); this._onMouseMove = null; }
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._trail = null;
    };

    EP.Registry.register(effect);
})();
