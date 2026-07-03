(function() {
    var effect = new EP.EffectBase('codrops-3d-scroll-rotations-new', {
        name: 'Codrops 3D Scroll Rotations NEW',
        category: '3d-perspective',
        icon: 'SR',
        description: 'Galeria tipo scroll con imagenes en onda, rotacion 3D, profundidad, blur/brightness y control por cursor'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 115, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 240, default: 90, step: 1, label: 'Playback Speed', unit: '%' },
        {
            key: 'mediaGroups',
            type: 'slotGroups',
            label: 'Medios Scroll 3D',
            default: { main: [0, 1, 2, 3, 4, 5, 6], background: null },
            groups: [
                { key: 'main', label: 'Orden scroll 1º, 2º, 3º', mode: 'multi' },
                { key: 'background', label: 'Fondo imagen/video', mode: 'single' }
            ]
        },
        { key: 'layout', type: 'select', options: [{ v: 'wave', l: 'Onda' }, { v: 'stack', l: 'Stack diagonal' }, { v: 'tunnel', l: 'Tunel suave' }], default: 'wave', label: 'Layout' },
        { key: 'cardSize', type: 'range', min: 80, max: 260, default: 145, step: 1, label: 'Tamano cards', unit: '%' },
        { key: 'spacing', type: 'range', min: 40, max: 220, default: 105, step: 1, label: 'Separacion', unit: '%' },
        { key: 'depth', type: 'range', min: 0, max: 260, default: 130, step: 1, label: 'Profundidad', unit: '%' },
        { key: 'rotation', type: 'range', min: 0, max: 220, default: 110, step: 1, label: 'Rotacion', unit: '%' },
        { key: 'velocityFx', type: 'range', min: 0, max: 180, default: 75, step: 1, label: 'Blur/brightness', unit: '%' },
        { key: 'background', type: 'color', default: '#0f1014', label: 'Fondo color' }
    ]);

    effect.capabilities = { supportsMotionDirection: true, supportsVideo: true, usesCamera: true, usesPostProcessing: false, usesParticlesShaders: false, mobileRisk: 'medium', minMedia: 1, exportSafe: true, hasErrorBoundary: true };

    function pick(media, groups) {
        var list = groups && Array.isArray(groups.main) && groups.main.length ? groups.main.map(function(i) { return media[i]; }) : media;
        return (list || []).filter(Boolean);
    }
    function aspect(media) {
        var el = media && media.element;
        return el ? (el.videoWidth || el.naturalWidth || el.width || 1) / Math.max(1, el.videoHeight || el.naturalHeight || el.height || 1) : 1;
    }

    effect.build = function(mediaList) {
        this._allMedia = (EP.Media && EP.Media.slots) ? EP.Media.slots : (mediaList || []);
        this._media = pick(this._allMedia, this.settings.mediaGroups);
        var group = new THREE.Group();
        this._cards = [];
        this._scroll = 0;
        this._velocity = 0;
        this._pointer = { x: 0, y: 0 };
        this._bgMedia = this.settings.mediaGroups && this.settings.mediaGroups.background !== null && this.settings.mediaGroups.background !== undefined ? this._allMedia[this.settings.mediaGroups.background] : null;
        if (this._bgMedia) {
            var bg = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), EP.Media.createMaterial(this._bgMedia, { opacity: 0.9, side: THREE.DoubleSide }));
            bg.position.z = -4;
            group.add(bg);
            this._bg = bg;
        }
        var count = Math.max(1, this._media.length);
        for (var i = 0; i < count; i++) {
            var media = this._media[i];
            var h = 1.8 * this.settings.cardSize / 145;
            var w = h * aspect(media);
            w = Math.max(1.05, Math.min(3.2, w));
            var mat = media ? EP.Media.createMaterial(media, { opacity: 0.98, side: THREE.DoubleSide }) : new THREE.MeshBasicMaterial({ color: 0xffffff });
            var mesh = new THREE.Mesh(EP.RoundedPlaneGeometry(w, h, 0.08), mat);
            mesh.userData = { index: i, width: w, height: h };
            group.add(mesh);
            this._cards.push(mesh);
        }
        this._onWheel = function(e) { this._velocity += e.deltaY * 0.0025; }.bind(this);
        this._onPointerMove = function(e) {
            var rect = EP.Core.renderer.domElement.getBoundingClientRect();
            this._pointer.x = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
            this._pointer.y = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
        }.bind(this);
        if (EP.Core && EP.Core.renderer) {
            EP.Core.renderer.domElement.addEventListener('wheel', this._onWheel, { passive: true });
            EP.Core.renderer.domElement.addEventListener('pointermove', this._onPointerMove);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._cards) return;
        var motion = this.settings.playbackMotion !== 'off' ? this.settings.playbackMotionSpeed / 100 : 0;
        this._velocity *= 0.9;
        this._scroll += (dt || 0.016) * motion * 0.7 + this._velocity * 0.025;
        var n = this._cards.length;
        var spacing = 1.35 * this.settings.spacing / 100;
        var depth = this.settings.depth / 100;
        var rot = this.settings.rotation / 100;
        for (var i = 0; i < n; i++) {
            var card = this._cards[i];
            var p = ((((i - this._scroll) % n) + n) % n);
            if (p > n / 2) p -= n;
            var x = p * spacing;
            var wave = Math.sin((p / Math.max(1, n)) * Math.PI * 2 + time * 0.4);
            var y = this.settings.layout === 'stack' ? -p * 0.22 : wave * 0.75;
            var z = -Math.abs(p) * 0.35 * depth + (this.settings.layout === 'tunnel' ? -Math.abs(wave) * 1.2 : 0);
            card.position.set(x + this._pointer.x * 0.18, y - this._pointer.y * 0.12, z);
            card.rotation.y = -p * 0.18 * rot + this._pointer.x * 0.15;
            card.rotation.x = wave * 0.35 * rot - this._pointer.y * 0.12;
            card.rotation.z = this.settings.layout === 'stack' ? -0.12 * p : wave * 0.08;
            var focus = Math.max(0, 1 - Math.abs(p) / Math.max(1, n * 0.45));
            card.scale.setScalar(0.72 + focus * 0.45);
            if (card.material) {
                EP.Media.updateMaterial(card.material);
                card.material.opacity = 0.45 + focus * 0.55;
                var fx = Math.abs(this._velocity) * this.settings.velocityFx / 100;
                card.material.color = new THREE.Color().setHSL(0, 0, Math.min(1, 0.72 + focus * 0.28 + fx * 0.05));
            }
        }
        if (this._bg && this._bg.material) EP.Media.updateMaterial(this._bg.material);
        this.group.scale.setScalar(this.settings.outputSize / 100);
        if (EP.Core && EP.Core.camera) {
            EP.Core.scene.background = new THREE.Color(this.settings.background);
            EP.Core.camera.position.set(0, 0.1, 7.2);
            EP.Core.camera.lookAt(0, 0, 0);
            EP.Core.camera.updateProjectionMatrix();
        }
    };

    effect.dispose = function() {
        if (EP.Core && EP.Core.renderer) {
            EP.Core.renderer.domElement.removeEventListener('wheel', this._onWheel);
            EP.Core.renderer.domElement.removeEventListener('pointermove', this._onPointerMove);
        }
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
