(function() {
    var effect = new EP.EffectBase('neon-flicker', {
        name: 'Neon Flicker',
        category: 'flicker',
        icon: '💡',
        description: 'Parpadeo de luz de neón — buzz eléctrico con glitches de encendido'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'neonColor', type: 'color', default: '#ff0066', label: 'Color neón' },
        { key: 'flickerRate', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Velocidad parpadeo' },
        { key: 'flickerIntensity', type: 'range', min: 10, max: 100, default: 60, step: 5, label: 'Intensidad', unit: '%' },
        { key: 'buzzNoise', type: 'range', min: 0, max: 100, default: 30, step: 5, label: 'Ruido eléctrico', unit: '%' },
        { key: 'text', type: 'text', default: 'OPEN', label: 'Texto neón' }
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

        this._flickerState = 1;
        this._nextFlicker = 0;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var ctx = this._ctx; var W = this._cvs.width; var H = this._cvs.height;
        var rate = this.settings.flickerRate;
        var intensity = this.settings.flickerIntensity / 100;
        var buzz = this.settings.buzzNoise / 100;
        var hexC = this.settings.neonColor || '#ff0066';
        var cr = parseInt(hexC.slice(1,3),16); var cg = parseInt(hexC.slice(3,5),16); var cb = parseInt(hexC.slice(5,7),16);
        var txt = String(this.settings.text || 'OPEN').toUpperCase();

        // Flicker state machine
        if (time > this._nextFlicker) {
            var r = Math.random();
            if (r < 0.15 * intensity) {
                this._flickerState = 0; // off
                this._nextFlicker = time + 0.05 + Math.random() * 0.1;
            } else if (r < 0.25 * intensity) {
                this._flickerState = 0.4 + Math.random() * 0.3; // dim
                this._nextFlicker = time + 0.03 + Math.random() * 0.08;
            } else {
                this._flickerState = 1;
                this._nextFlicker = time + 0.1 / rate + Math.random() * 0.3 / rate;
            }
        }

        var fl = this._flickerState;

        ctx.clearRect(0, 0, W, H);

        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);

        if (fl > 0.01) {
            var fs = 140;
            ctx.font = 'bold ' + fs + 'px "Arial Black", Impact, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Outer glow layers
            var glowAlpha = fl * 0.6;
            ctx.globalAlpha = glowAlpha;
            ctx.shadowBlur = 60; ctx.shadowColor = hexC;
            ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.3)';
            ctx.fillText(txt, W/2, H/2);

            ctx.shadowBlur = 25; ctx.shadowColor = '#ffffff';
            ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + fl + ')';
            ctx.fillText(txt, W/2, H/2);

            ctx.shadowBlur = 8;
            ctx.fillStyle = 'rgba(255,255,255,' + (fl * 0.9) + ')';
            ctx.fillText(txt, W/2, H/2);

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;

            // Buzz noise lines
            if (buzz > 0 && fl > 0.3) {
                var noiseLines = Math.round(buzz * 8);
                ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (buzz * 0.4) + ')';
                ctx.lineWidth = 1;
                for (var i = 0; i < noiseLines; i++) {
                    var ny = H/2 - fs/2 + Math.random() * fs;
                    var nx1 = W/2 - 250 + Math.random() * 30;
                    var nx2 = nx1 + Math.random() * 40;
                    ctx.beginPath();
                    ctx.moveTo(nx1, ny); ctx.lineTo(nx2, ny);
                    ctx.stroke();
                }
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
