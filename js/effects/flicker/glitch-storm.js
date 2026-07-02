(function() {
    var effect = new EP.EffectBase('glitch-storm', {
        name: 'Glitch Storm',
        category: 'flicker',
        icon: '⚡',
        description: 'Tormenta de glitch digital — imágenes desplazadas, cortadas y corruptas'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 30, max: 90, default: 55, label: 'Card Size', unit: '%' },
        { key: 'glitchIntensity', type: 'range', min: 0, max: 100, default: 60, label: 'Glitch Intensity', unit: '%' },
        { key: 'glitchSpeed', type: 'range', min: 1, max: 10, default: 4, step: 1, label: 'Glitch Speed' },
        { key: 'layers', type: 'range', min: 1, max: 4, default: 3, step: 1, label: 'Layers' },
        { key: 'background', type: 'color', default: '#020204', label: 'Background' }
    ]);

    function hash(n) {
        n = Math.sin(n) * 43758.5453;
        return n - Math.floor(n);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var layers = Math.min(this.settings.layers || 3, 4);
        var cardW = 3.2 * this.settings.cardSize / 100;
        var cardH = cardW * 1.4;

        for (var i = 0; i < count; i++) {
            // Main card
            var geo = new THREE.PlaneGeometry(cardW, cardH);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i, total: count, layer: 0 };
            group.add(mesh);

            // Glitch clone layers (RGB channel split look)
            for (var l = 1; l < layers; l++) {
                var geoL = new THREE.PlaneGeometry(cardW, cardH);
                var matL = EP.Media.createMaterial(mediaList[i]);
                matL.transparent = true;
                matL.opacity = 0.3 + (l * 0.1);
                if (matL.color) {
                    if (l === 1) matL.color.setRGB(1, 0.2, 0.2); // red shift
                    if (l === 2) matL.color.setRGB(0.2, 0.2, 1); // blue shift
                    if (l === 3) matL.color.setRGB(0.2, 1, 0.2); // green shift
                }
                var meshL = new THREE.Mesh(geoL, matL);
                meshL.userData = { index: i, total: count, layer: l };
                group.add(meshL);
            }
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var totalChildren = this.group.children.length;
        if (!totalChildren) return;

        var intensity = (this.settings.glitchIntensity || 60) / 100;
        var glitchSpeed = this.settings.glitchSpeed || 4;
        var speedMult = (this.settings.playbackMotionSpeed || 100) / 100;
        var layers = this.settings.layers || 3;
        var count = Math.ceil(totalChildren / layers);
        var t = time * speedMult;

        // Determine active card based on time
        var frameDur = loopDuration / count / speedMult;
        var activeIdx = Math.floor(t / frameDur) % count;

        // Glitch timing: events at irregular intervals
        var glitchFrame = Math.floor(t * glitchSpeed * 12);
        var isGlitchFrame = hash(glitchFrame * 7.3) < intensity * 0.4;
        var glitchOffsetX = (hash(glitchFrame * 3.1) - 0.5) * intensity * 0.4;
        var glitchOffsetY = (hash(glitchFrame * 5.7) - 0.5) * intensity * 0.15;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var layer = child.userData.layer;
            var isActive = i === activeIdx;

            if (!isActive) {
                child.material.opacity = 0;
                child.visible = false;
                return;
            }

            child.visible = true;

            if (layer === 0) {
                // Main: show with glitch position
                var gX = isGlitchFrame ? glitchOffsetX : 0;
                var gY = isGlitchFrame ? glitchOffsetY : 0;
                child.position.set(gX, gY, 0);
                child.material.opacity = isGlitchFrame && hash(glitchFrame) < 0.2 ? 0 : 1;
            } else {
                // Clone layer: offset by channel split amount
                var splitAmt = isGlitchFrame ? intensity * 0.25 : intensity * 0.04;
                var offsetX = (layer % 2 === 0 ? 1 : -1) * splitAmt * (layer * 0.5);
                var offsetY = (layer === 2 ? 1 : -1) * splitAmt * 0.3;
                child.position.set(offsetX + (isGlitchFrame ? glitchOffsetX * 0.5 : 0), offsetY, -0.01 * layer);
                var baseOp = 0.25 + layer * 0.05;
                child.material.opacity = isGlitchFrame ? baseOp * 1.5 : baseOp * 0.5;
            }
        });
    };

    EP.Registry.register(effect);
})();
