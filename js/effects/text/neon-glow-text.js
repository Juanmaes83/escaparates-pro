(function() {
    var effect = new EP.EffectBase('neon-glow-text', {
        name: 'Neon Glow Text',
        category: 'text',
        icon: '💡',
        description: 'Texto neón con halo pulsante multicapa sobre imagen'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'textContent', type: 'text', default: 'LUXURY', label: 'Texto' },
        { key: 'fontSize', type: 'range', min: 30, max: 160, default: 100, step: 1, label: 'Tamaño fuente' },
        { key: 'neonColor', type: 'color', default: '#00ffcc', label: 'Color neón' },
        { key: 'glowIntensity', type: 'range', min: 1, max: 60, default: 28, step: 1, label: 'Intensidad halo' },
        { key: 'pulseSpeed', type: 'range', min: 0, max: 10, default: 3, step: 0.5, label: 'Velocidad pulso' },
        { key: 'background', type: 'color', default: '#060610', label: 'Fondo' }
    ]);

    function hexToRgb(hex) {
        var r = parseInt(hex.slice(1,3),16);
        var g = parseInt(hex.slice(3,5),16);
        var b = parseInt(hex.slice(5,7),16);
        return r+','+g+','+b;
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

        // Dark overlay to make neon pop
        var overlayGeo = new THREE.PlaneGeometry(8, 4.5);
        var overlayMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false });
        var overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
        overlayMesh.position.z = -0.02;
        group.add(overlayMesh);

        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 256;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);

        var geo = new THREE.PlaneGeometry(7.5, 1.875);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var fs = Math.round(this.settings.fontSize);
        var text = String(this.settings.textContent || 'NEON').toUpperCase();
        var pulse = this.settings.pulseSpeed > 0
            ? 0.6 + 0.4 * Math.sin(time * this.settings.pulseSpeed)
            : 1;
        var baseGlow = this.settings.glowIntensity * pulse;
        var rgb = hexToRgb(this.settings.neonColor || '#00ffcc');

        var cvs = this._cvs;
        var ctx = this._ctx;
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.font = 'bold ' + fs + 'px "Arial Black", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer glow layers
        var glows = [baseGlow * 2.5, baseGlow * 1.5, baseGlow * 0.8];
        var alphas = [0.12, 0.22, 0.45];
        glows.forEach(function(blur, i) {
            ctx.shadowColor = 'rgba(' + rgb + ',1)';
            ctx.shadowBlur = blur;
            ctx.fillStyle = 'rgba(' + rgb + ',' + alphas[i] + ')';
            ctx.fillText(text, cvs.width / 2, cvs.height / 2);
        });

        // Core text
        ctx.shadowBlur = baseGlow * 0.4;
        ctx.shadowColor = 'rgba(' + rgb + ',1)';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, cvs.width / 2, cvs.height / 2);
        ctx.shadowBlur = 0;

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
