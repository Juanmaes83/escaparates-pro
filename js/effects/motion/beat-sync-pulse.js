(function() {
    var effect = new EP.EffectBase('beat-sync-pulse', {
        name: 'Beat Sync Pulse',
        category: 'motion',
        icon: '🥁',
        description: 'Imagen que pulsa al ritmo — escala + glow sincronizados con audio o BPM'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'bpm', type: 'range', min: 60, max: 200, default: 120, step: 1, label: 'BPM' },
        { key: 'pulseScale', type: 'range', min: 1, max: 30, default: 12, step: 1, label: 'Intensidad pulso', unit: '%' },
        { key: 'glowColor', type: 'color', default: '#ff3366', label: 'Color glow' },
        { key: 'glowIntensity', type: 'range', min: 0, max: 100, default: 60, step: 5, label: 'Intensidad glow', unit: '%' },
        { key: 'beats', type: 'range', min: 1, max: 8, default: 4, step: 1, label: 'Beats por loop' },
        { key: 'waveform', type: 'select', options: [{ v: 'sine', l: 'Suave' }, { v: 'punch', l: 'Punch' }, { v: 'bounce', l: 'Bounce' }], default: 'punch', label: 'Forma de onda' }
    ]);

    function hexToRgb(hex) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return { r: r, g: g, b: b };
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();

        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        this._tex = new THREE.CanvasTexture(this._cvs);

        var geo = new THREE.PlaneGeometry(8, 4.5);
        var mat = new THREE.MeshBasicMaterial({ map: this._tex, transparent: true, depthWrite: false });
        this._mesh = new THREE.Mesh(geo, mat);
        group.add(this._mesh);

        // Cache media
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
        if (!this._ctx || !this._mesh) return;

        var beats = Math.round(this.settings.beats);
        var beatPeriod = loopDuration / beats;
        var beatPhase = (time % beatPeriod) / beatPeriod; // 0..1 per beat

        // Waveform shapes
        var pulse;
        var wf = this.settings.waveform;
        if (wf === 'sine') {
            pulse = (1 - Math.cos(beatPhase * Math.PI * 2)) / 2;
        } else if (wf === 'punch') {
            // Sharp attack, exponential decay
            pulse = beatPhase < 0.1 ? beatPhase / 0.1 : Math.pow(1 - (beatPhase - 0.1) / 0.9, 2);
        } else { // bounce
            pulse = beatPhase < 0.15 ? beatPhase / 0.15 : Math.abs(Math.sin((beatPhase - 0.15) / 0.85 * Math.PI * 2.5)) * Math.pow(1 - beatPhase, 1.5);
        }

        var scaleBoost = 1 + (this.settings.pulseScale / 100) * pulse;
        this._mesh.scale.set(scaleBoost, scaleBoost, 1);

        var cvs = this._cvs; var ctx = this._ctx;
        var W = cvs.width; var H = cvs.height;
        ctx.clearRect(0, 0, W, H);

        if (this._imgCvs) {
            ctx.drawImage(this._imgCvs, 0, 0, W, H);
        } else {
            ctx.fillStyle = '#101014';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('BEAT SYNC PULSE', W / 2, H / 2);
        }

        // Glow overlay on beat
        var gi = (this.settings.glowIntensity / 100) * pulse;
        if (gi > 0.01) {
            var rgb = hexToRgb(this.settings.glowColor || '#ff3366');
            var grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
            grad.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (gi * 0.5) + ')');
            grad.addColorStop(0.5, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (gi * 0.2) + ')');
            grad.addColorStop(1, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        this._tex.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null; this._imgCvs = null; this._mesh = null;
    };

    EP.Registry.register(effect);
})();
