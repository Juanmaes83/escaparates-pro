// Kinetic Cube Bumper — adapted from the CodePen gist "Code Driven Animation"
// (source read & understood: 19 cloned "die" bars stacked into a tall
// column, each a 4-sided horizontal prism continuously flipping on its Y
// axis with a per-instance phase offset so the flips cascade down the wall
// like a rolling shutter; each face's text is tinted with a hue that shifts
// per reel forming a gradient; the whole stack gently rocks left/right and
// breathes in scale, auto-scaled to fill the viewport height). Recreated in
// Three.js as a looping EP.EffectBase — a brand/intro bumper rather than a
// full section, per its source's own single-screen scope — with the
// client's own title words baked onto the prism faces instead of the
// hardcoded "CODE / DRIVEN / ANIMATION".
(function() {
    var effect = new EP.EffectBase('kinetic-cube-bumper', {
        name: 'Kinetic Cube Bumper',
        category: 'text',
        icon: '🎰',
        description: 'Muro de barras 3D girando en cascada tipo rodillo, con texto de marca en cada cara y degradado de color — bumper de marca cinético, ideal como intro/loader corto'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'word1', type: 'text', default: 'ESCAPARATE', label: 'Palabra cara 1' },
        { key: 'word2', type: 'text', default: 'PREMIUM', label: 'Palabra cara 2' },
        { key: 'word3', type: 'text', default: 'INMOBILIARIA', label: 'Palabra cara 3' },
        { key: 'reelCount', type: 'range', min: 6, max: 24, default: 16, step: 1, label: 'Nº de barras' },
        { key: 'hueBase', type: 'range', min: 0, max: 360, default: 160, step: 5, label: 'Tono base', unit: '°' },
        { key: 'hueRange', type: 'range', min: 0, max: 300, default: 90, step: 5, label: 'Rango de tono', unit: '°' },
        { key: 'rockAmount', type: 'range', min: 0, max: 30, default: 12, step: 1, label: 'Balanceo', unit: '°' }
    ]);

    function makeWordTexture(word, color) {
        var cvs = document.createElement('canvas');
        cvs.width = 1024; cvs.height = 160;
        var ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.font = '900 110px Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color || '#ffffff';
        ctx.fillText(word, cvs.width / 2, cvs.height / 2 + 8);
        var tex = new THREE.CanvasTexture(cvs);
        tex.needsUpdate = true;
        return tex;
    }

    function hslToHex(h, s, l) {
        h = ((h % 360) + 360) % 360;
        s /= 100; l /= 100;
        var c = (1 - Math.abs(2 * l - 1)) * s;
        var x = c * (1 - Math.abs((h / 60) % 2 - 1));
        var m = l - c / 2;
        var r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        return new THREE.Color(r + m, g + m, b + m);
    }

    effect.build = function() {
        var group = new THREE.Group();
        var tray = new THREE.Group();
        group.add(tray);
        this._tray = tray;

        var words = [this.settings.word1 || 'ESCAPARATE', this.settings.word2 || 'PREMIUM', this.settings.word3 || 'INMOBILIARIA'];
        var texA = makeWordTexture(words[0]);
        var texB = makeWordTexture(words[1]);
        var texC = makeWordTexture(words[2]);
        var faceTextures = [texA, texB, texC, texA];

        var n = Math.round(this.settings.reelCount);
        var barW = 5.2, barH = 5.4 / n, barD = 0.5;
        var geo = new THREE.BoxGeometry(barW, barH * 0.86, barD);

        this._reels = [];
        for (var i = 0; i < n; i++) {
            var hue = this.settings.hueBase + (i / Math.max(1, n - 1)) * this.settings.hueRange;
            var col = hslToHex(hue, 62, 55 + 15 * Math.sin(i * 1.7));
            var mats = [
                new THREE.MeshBasicMaterial({ map: faceTextures[0], color: col, transparent: true }), // +x
                new THREE.MeshBasicMaterial({ map: faceTextures[2], color: col, transparent: true }), // -x
                new THREE.MeshBasicMaterial({ color: col }), // +y (top, rarely seen)
                new THREE.MeshBasicMaterial({ color: col }), // -y
                new THREE.MeshBasicMaterial({ map: faceTextures[1], color: col, transparent: true }), // +z (front)
                new THREE.MeshBasicMaterial({ map: faceTextures[3], color: col, transparent: true })  // -z (back)
            ];
            var mesh = new THREE.Mesh(geo, mats);
            mesh.position.y = ((n - 1) / 2 - i) * barH;
            mesh.userData.phase = (i / n) * Math.PI * 2;
            tray.add(mesh);
            this._reels.push(mesh);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt) {
        if (!this._tray) return;
        var speed = (this.settings.playbackMotionSpeed || 100) / 100;
        var t = time * speed;

        this._reels.forEach(function(mesh) {
            mesh.rotation.y = t * 0.9 + mesh.userData.phase;
        });

        var rock = (this.settings.rockAmount / 100);
        this._tray.rotation.z = Math.sin(t * 0.35) * rock;
        this._tray.rotation.x = Math.sin(t * 0.5) * 0.03;
        var breathe = 1 + Math.sin(t * 0.4) * 0.06;
        this._tray.scale.set(breathe, breathe, breathe);
    };

    effect.dispose = function() {
        this._tray = null; this._reels = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
