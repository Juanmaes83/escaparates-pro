(function() {
    var effect = new EP.EffectBase('frames-gallery', {
        name: 'Frames Gallery',
        category: 'grid',
        icon: '🖼️',
        description: 'Scattered polaroid-style photo frames pinned to a board — each tilted at a unique angle, floating gently'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 50, default: 35, label: 'Card Size', unit: '%' },
        { key: 'frameWidth', type: 'range', min: 0, max: 20, default: 10, step: 1, label: 'Frame Width', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 10, default: 2, step: 0.5, label: 'Corner Radius', unit: '%' },
        { key: 'scatter', type: 'range', min: 0, max: 100, default: 70, step: 1, label: 'Scatter', unit: '%' },
        { key: 'floatAmount', type: 'range', min: 0, max: 10, default: 5, step: 0.5, label: 'Float Amount', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#1a1612', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var cardScale = this.settings.cardSize / 100 * 3;
        var frameRatio = 1 + this.settings.frameWidth / 100 * 0.3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.3;
        var scatter = this.settings.scatter / 100;
        var maxRot = THREE.MathUtils.degToRad(15);
        var n = Math.max(mediaList.length, 4);
        var cardFrames = [];

        for (var i = 0; i < n; i++) {
            var media = mediaList[i % mediaList.length];

            // Deterministic scatter using trig
            var xOff = Math.sin(i * 2.3 + 1.0) * scatter * 2.5;
            var yOff = Math.cos(i * 1.7 + 0.5) * scatter * 1.8;
            var rotZ = Math.sin(i * 3.1) * maxRot;

            // Frame mesh (slightly larger, cream colored, behind image)
            var frameW = cardScale * frameRatio;
            var frameH = cardScale * 1.3 * frameRatio;
            var frameGeo = cr > 0 ? EP.RoundedPlaneGeometry(frameW, frameH, cr) : new THREE.PlaneGeometry(frameW, frameH);
            var frameMat = new THREE.MeshBasicMaterial({ color: 0xf5f0e8 });
            var frameMesh = new THREE.Mesh(frameGeo, frameMat);
            frameMesh.position.z = -0.02;

            // Image mesh on top
            var imgW = cardScale;
            var imgH = cardScale * 1.3;
            var imgGeo = cr > 0 ? EP.RoundedPlaneGeometry(imgW, imgH, cr) : new THREE.PlaneGeometry(imgW, imgH);
            var imgMat = EP.Media.createMaterial(media);
            var imgMesh = new THREE.Mesh(imgGeo, imgMat);
            imgMesh.position.z = 0.01;

            // Container for frame + image
            var cardGroup = new THREE.Group();
            cardGroup.add(frameMesh);
            cardGroup.add(imgMesh);
            cardGroup.position.set(xOff, yOff, i * 0.01);
            cardGroup.rotation.z = rotZ;
            cardGroup.userData = {
                baseX: xOff,
                baseY: yOff,
                phaseOffset: i * 1.3
            };
            group.add(cardGroup);
            cardFrames.push(cardGroup);
        }

        this._cards = cardFrames;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._cards) return;
        var floatAmt = this.settings.floatAmount / 100 * 0.3;
        var cards = this._cards;

        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var d = card.userData;
            var floatY = Math.sin(time * 0.6 + d.phaseOffset) * floatAmt;
            card.position.x = d.baseX;
            card.position.y = d.baseY + floatY;
        }
    };

    EP.Registry.register(effect);
})();
