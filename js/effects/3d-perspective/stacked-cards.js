(function() {
    var effect = new EP.EffectBase('stacked-cards', {
        name: 'Stacked Cards',
        category: '3d-perspective',
        icon: '🃏',
        description: 'Carousel de tarjetas apiladas 3D — las cards se apilan y desapilan con rotacion y profundidad'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardCount', type: 'range', min: 5, max: 20, default: 8, step: 1, label: 'Cards' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 30, label: 'Transition Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 40, max: 100, default: 65, label: 'Card Size', unit: '%' },
        { key: 'stackDepth', type: 'range', min: 10, max: 100, default: 50, label: 'Stack Depth', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a18', label: 'Background' }
    ]);

    effect.capabilities = { supportsMotionDirection: true, supportsVideo: true, usesCamera: true, usesPostProcessing: false, usesParticlesShaders: false, mobileRisk: 'medium', minMedia: 1, exportSafe: true, hasErrorBoundary: true };

    function directionVector(value) {
        if (value === 'right-left') return { x: -1, y: 0 };
        if (value === 'top-bottom') return { x: 0, y: -1 };
        if (value === 'bottom-top') return { x: 0, y: 1 };
        return { x: 1, y: 0 };
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.cardCount;
        var cardScale = 1.5 + 3 * this.settings.cardSize / 100;
        var depthStep = 0.1 + 0.4 * this.settings.stackDepth / 100;
        var cw = cardScale * 1.3;
        var ch = cardScale * 1.7;

        this._cards = [];
        var textureCache = {};

        function textureFor(index) {
            if (textureCache[index]) return textureCache[index];
            var media = mediaList[index];
            if (!media || !media.element) return null;
            textureCache[index] = EP.Media && EP.Media.createTexture ?
                EP.Media.createTexture(media, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }) :
                new THREE.Texture(media.element);
            textureCache[index].needsUpdate = true;
            return textureCache[index];
        }

        for (var i = 0; i < count; i++) {
            var mi = i % mediaList.length;
            var tex = textureFor(mi);

            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.08) : new THREE.PlaneGeometry(cw, ch);
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
            var mesh = new THREE.Mesh(geo, mat);

            mesh.position.set(0, 0, -i * depthStep);
            mesh.userData = {
                isCard: true,
                cardIndex: i,
                stackPos: i,
                targetX: 0, targetY: 0, targetZ: -i * depthStep,
                targetRotZ: 0
            };
            group.add(mesh);
            this._cards.push(mesh);
        }

        this._count = count;
        this._depthStep = depthStep;
        this._cw = cw;
        this._ch = ch;
        this._cycleTime = 0;
        this._currentTop = 0;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._cards) return;
        var enabled = this.settings.playbackMotion !== 'off';
        var speed = this.settings.speed / 100 * (enabled ? this.settings.playbackMotionSpeed / 100 : 0);
        var direction = directionVector(this.settings.motionDirection);
        var count = this._count;
        var depthStep = this._depthStep;

        var cycleDuration = 2 + 4 * (1 - speed);
        this._cycleTime += dt * (enabled ? this.settings.playbackMotionSpeed / 100 : 0);

        if (this._cycleTime > cycleDuration) {
            this._cycleTime = 0;
            this._currentTop = (this._currentTop + 1) % count;
        }

        var progress = Math.min(this._cycleTime / (cycleDuration * 0.4), 1);
        var eased = progress < 1 ? 1 - Math.pow(1 - progress, 3) : 1;

        for (var i = 0; i < count; i++) {
            var card = this._cards[i];
            var relIdx = (i - this._currentTop + count) % count;

            if (relIdx === 0 && progress < 1) {
                var throwX = eased * 8 * direction.x;
                var throwRot = eased * 0.3;
                card.userData.targetX = throwX;
                card.userData.targetY = eased * 2 * direction.y;
                card.userData.targetZ = 0;
                card.userData.targetRotZ = -throwRot;
                card.material.opacity = 0.95 * (1 - eased * 0.5);
            } else {
                var stackIdx = relIdx === 0 ? count - 1 : relIdx - 1;
                card.userData.targetX = 0;
                card.userData.targetY = 0;
                card.userData.targetZ = -stackIdx * depthStep;
                card.userData.targetRotZ = (Math.random() - 0.5) * 0.02 * stackIdx;
                card.material.opacity = Math.max(0.3, 0.95 - stackIdx * 0.07);
            }

            var interpolation = enabled ? Math.min(dt * 5, 1) : 0;
            card.position.x += (card.userData.targetX - card.position.x) * interpolation;
            card.position.y += (card.userData.targetY - card.position.y) * interpolation;
            card.position.z += (card.userData.targetZ - card.position.z) * interpolation;
            card.rotation.z += (card.userData.targetRotZ - card.rotation.z) * (enabled ? Math.min(dt * 4, 1) : 0);

            if (card.material.map && card.material.map.isVideoTexture) card.material.map.needsUpdate = true;
        }

        var camDist = 5 + this._ch;
        EP.Core.camera.position.set(
            Math.sin(time * 0.07 * (enabled ? 1 : 0)) * 0.5,
            0.5 + Math.sin(time * 0.05 * (enabled ? 1 : 0)) * 0.2,
            camDist
        );
        EP.Core.camera.lookAt(0.5, 0, -1);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
