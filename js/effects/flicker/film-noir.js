(function() {
    var effect = new EP.EffectBase('film-noir', {
        name: 'Film Noir Flicker',
        category: 'flicker',
        icon: '🎞️',
        description: 'Proyección de película vintage con parpadeo, jitter y daño de celuloide'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 90, default: 60, label: 'Card Size', unit: '%' },
        { key: 'flickerRate', type: 'range', min: 0, max: 100, default: 40, label: 'Flicker Rate', unit: '%' },
        { key: 'jitterAmount', type: 'range', min: 0, max: 100, default: 30, label: 'Jitter', unit: '%' },
        { key: 'frameDuration', type: 'range', min: 1, max: 6, default: 2.5, step: 0.5, label: 'Frame Hold', unit: 's' },
        { key: 'background', type: 'color', default: '#080808', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardW = 3.5 * this.settings.cardSize / 100;
        var cardH = cardW * 1.4;

        for (var i = 0; i < count; i++) {
            var geo = new THREE.PlaneGeometry(cardW, cardH);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            mat.opacity = 0;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i, total: count };
            group.add(mesh);
        }
        this.group = group;
        this._lastFrameT = -1;
        this._flickerState = 1;
        this._jitterX = 0;
        this._jitterY = 0;
        return group;
    };

    // Deterministic noise (same seed = same result, varies per frame time bucket)
    function noise(t, seed) {
        var v = Math.sin(t * 127.3 + seed * 311.7) * 43758.5;
        return v - Math.floor(v);
    }

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var count = this.group.children.length;
        if (!count) return;

        var frameDur = this.settings.frameDuration || 2.5;
        var flickerRate = (this.settings.flickerRate || 40) / 100;
        var jitter = (this.settings.jitterAmount || 30) / 100 * 0.08;
        var speedMult = (this.settings.playbackMotionSpeed || 100) / 100;
        var t = time * speedMult;

        // Which frame is showing
        var frameIdx = Math.floor(t / frameDur) % count;

        // Flicker: rapid random opacity drop within the frame
        var subT = (t % frameDur) / frameDur;
        var flickerSeed = Math.floor(t * 24); // 24 per second bucket
        var flickerNoise = noise(flickerSeed, 7);
        var isFlickered = flickerNoise < flickerRate * 0.3;

        // Jitter: random positional shake
        var jX = (noise(flickerSeed, 13) - 0.5) * jitter;
        var jY = (noise(flickerSeed, 19) - 0.5) * jitter;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            if (i === frameIdx) {
                child.material.opacity = isFlickered ? (noise(flickerSeed * 3, i) < 0.4 ? 0 : 0.6) : 1;
                child.position.set(jX, jY, 0);
                child.visible = true;
            } else {
                // Ghost frames: very occasionally show previous frame as ghost
                var ghostChance = noise(flickerSeed + i, 31);
                if (ghostChance < 0.015 && flickerRate > 0.2) {
                    child.material.opacity = 0.08;
                    child.visible = true;
                } else {
                    child.material.opacity = 0;
                    child.visible = false;
                }
                child.position.set(0, 0, 0);
            }
        });
    };

    EP.Registry.register(effect);
})();
