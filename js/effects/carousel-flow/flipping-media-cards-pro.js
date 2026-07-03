(function() {
    var effect = new EP.EffectBase('flipping-media-cards-pro', {
        name: 'Flipping Media Cards PRO',
        category: 'carousel-flow',
        icon: 'FC',
        description: 'Cascada 3D de cartas giratorias con anversos y reversos personalizables por imagen o video'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 115, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Motion Enabled' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Motion Speed', unit: '%' },
        {
            key: 'mediaGroups',
            type: 'slotGroups',
            label: 'Cartas personalizadas',
            default: { fronts: [0, 1, 2, 3, 4, 5, 6, 7, 8], backs: [9], background: null },
            groups: [
                { key: 'fronts', label: 'Anversos carta 1, 2, 3...', mode: 'multi' },
                { key: 'backs', label: 'Reversos carta 1, 2, 3...', mode: 'multi' },
                { key: 'background', label: 'Fondo imagen/video', mode: 'single' }
            ]
        },
        { key: 'cards', type: 'range', min: 1, max: 36, default: 36, step: 1, label: 'Numero de cartas' },
        { key: 'cardSize', type: 'range', min: 40, max: 180, default: 100, step: 1, label: 'Tamano carta', unit: '%' },
        { key: 'stagger', type: 'range', min: 80, max: 900, default: 300, step: 10, label: 'Retardo cascada', unit: 'ms' },
        { key: 'tiltX', type: 'range', min: -70, max: 70, default: 28, step: 1, label: 'Inclinacion X', unit: 'deg' },
        { key: 'tiltY', type: 'range', min: -70, max: 70, default: -42, step: 1, label: 'Inclinacion Y', unit: 'deg' },
        { key: 'tiltZ', type: 'range', min: -70, max: 70, default: -30, step: 1, label: 'Inclinacion Z', unit: 'deg' },
        { key: 'spread', type: 'range', min: 0, max: 220, default: 115, step: 1, label: 'Expansion cascada', unit: '%' },
        { key: 'breath', type: 'range', min: 0, max: 160, default: 100, step: 1, label: 'Abrir y cerrar', unit: '%' },
        { key: 'backgroundColor', type: 'color', default: '#111114', label: 'Color fondo' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: false,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: false,
        mobileRisk: 'medium',
        minMedia: 1,
        exportSafe: true,
        hasErrorBoundary: true
    };

    function slotList(groups, key, all, fallback) {
        var value = groups && groups[key];
        if (Array.isArray(value) && value.length) {
            return value.map(function(idx) { return all[idx]; }).filter(Boolean);
        }
        if (typeof value === 'number' && all[value]) return [all[value]];
        return fallback || [];
    }

    function makeDefaultBack() {
        var c = document.createElement('canvas');
        c.width = 512;
        c.height = 720;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#151525';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.strokeStyle = '#f6f7ff';
        ctx.lineWidth = 18;
        ctx.strokeRect(34, 34, 444, 652);
        ctx.strokeStyle = '#4f7cff';
        ctx.lineWidth = 8;
        for (var i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.arc(256, 360, 40 + i * 22, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 72px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PRO', 256, 382);
        return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.FrontSide, transparent: true });
    }

    effect._resolveMedia = function(mediaList) {
        var all = (EP.Media && EP.Media.slots) ? EP.Media.slots : (mediaList || []);
        var groups = this.settings.mediaGroups || {};
        var fallback = (EP.Media && EP.Media.getAll) ? EP.Media.getAll() : (mediaList || []);
        this._fronts = slotList(groups, 'fronts', all, fallback);
        this._backs = slotList(groups, 'backs', all, []);
        this._bgMedia = slotList(groups, 'background', all, [])[0] || null;
        if (!this._fronts.length) this._fronts = [null];
    };

    effect._makeCard = function(index) {
        var size = this.settings.cardSize / 100;
        var w = 1.15 * size;
        var h = 1.62 * size;
        var group = new THREE.Group();
        group.userData.cardIndex = index;
        var frontMedia = this._fronts[index % this._fronts.length];
        var backMedia = this._backs.length ? this._backs[index % this._backs.length] : null;
        var geo = EP.RoundedPlaneGeometry(w, h, 0.075 * size);
        var frontMat = frontMedia ? EP.Media.createMaterial(frontMedia, { opacity: 1, side: THREE.FrontSide }) :
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide });
        var front = new THREE.Mesh(geo, frontMat);
        front.position.z = 0.014;
        var back = new THREE.Mesh(geo.clone(), backMedia ? EP.Media.createMaterial(backMedia, { opacity: 1, side: THREE.FrontSide }) : makeDefaultBack());
        back.rotation.y = Math.PI;
        back.position.z = -0.014;
        group.add(front);
        group.add(back);
        group.rotation.z = Math.PI / 2;
        return group;
    };

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._resolveMedia(mediaList);
        this._rig = new THREE.Group();
        this._cards = [];
        this._background = new THREE.Mesh(
            new THREE.PlaneGeometry(16, 9),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(this.settings.backgroundColor), transparent: true, opacity: 1, side: THREE.DoubleSide })
        );
        this._background.position.z = -4;
        if (this._bgMedia) this._background.material.map = EP.Media.createTexture(this._bgMedia);
        group.add(this._background);

        var count = Math.max(1, Math.min(36, Math.floor(this.settings.cards || 36)));
        for (var i = 0; i < count; i++) {
            var card = this._makeCard(i);
            this._cards.push(card);
            this._rig.add(card);
        }
        this._rig.rotation.x = this.settings.tiltX * Math.PI / 180;
        this._rig.rotation.y = this.settings.tiltY * Math.PI / 180;
        this._rig.rotation.z = this.settings.tiltZ * Math.PI / 180;
        group.add(this._rig);
        this.group = group;
        return group;
    };

    effect._syncSettings = function() {
        if (!this._rig) return;
        this._rig.rotation.x = this.settings.tiltX * Math.PI / 180;
        this._rig.rotation.y = this.settings.tiltY * Math.PI / 180;
        this._rig.rotation.z = this.settings.tiltZ * Math.PI / 180;
        if (this._background) {
            this._background.material.color = new THREE.Color(this.settings.backgroundColor);
            EP.Media.updateMaterial(this._background.material);
        }
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._cards) return;
        this._syncSettings();
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var duration = Math.max(0.5, loopDuration || 10);
        var count = this._cards.length || 1;
        var stagger = (this.settings.stagger || 300) / 1000;
        var spread = this.settings.spread / 100;
        var breath = this.settings.breath / 100;
        var globalCycle = (Math.sin(time * speed * 0.85) + 1) / 2;
        var openClose = 0.18 + 0.82 * globalCycle * breath;
        if (this.settings.playbackMotion === 'off') openClose = 0.72 * breath;
        for (var i = 0; i < count; i++) {
            var card = this._cards[i];
            var local = ((time * speed + i * stagger) % duration) / duration;
            var angle = (1 - local) * Math.PI * 2;
            var center = (count - 1) / 2;
            var dist = i - center;
            var normalized = center ? dist / center : 0;
            var wave = Math.sin(local * Math.PI * 2);
            card.rotation.x = angle;
            card.rotation.y = normalized * 0.35 * openClose;
            card.rotation.z = Math.PI / 2 + normalized * 0.22 * openClose;
            card.position.x = normalized * 3.4 * spread * openClose;
            card.position.y = Math.sin(normalized * Math.PI) * 0.9 * spread * openClose + wave * 0.06 * spread;
            card.position.z = dist * 0.035 * spread + Math.abs(normalized) * 0.45 * spread * openClose;
            var s = 0.9 + Math.sin(local * Math.PI) * 0.08;
            card.scale.setScalar(s);
            card.traverse(function(obj) {
                if (obj.material) EP.Media.updateMaterial(obj.material);
            });
        }
        if (this._background && this._background.material) EP.Media.updateMaterial(this._background.material);
        EP.Core.camera.position.set(0, 0, 6.2);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
        this._cards = null;
        this._rig = null;
    };

    EP.Registry.register(effect);
})();
