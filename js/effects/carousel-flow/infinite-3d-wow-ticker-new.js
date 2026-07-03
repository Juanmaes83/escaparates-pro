(function() {
    var base = EP.Registry.get('infinite-3d-wow-ticker-pro');
    if (!base) return;
    var effect = new EP.EffectBase('infinite-3d-wow-ticker-new', {
        name: 'Infinite 3D Wow Ticker NEW',
        category: 'carousel-flow',
        icon: 'WN',
        description: 'Port del ticker 3D infinito con orden visual de slots, fondo, logo, texto y CTA'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 115, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 240, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        {
            key: 'mediaGroups',
            type: 'slotGroups',
            label: 'Medios Wow Ticker',
            default: { main: [0, 1, 2, 3, 4, 5], background: null, logo: null },
            groups: [
                { key: 'main', label: 'Orden ticker 1º, 2º, 3º', mode: 'multi' },
                { key: 'background', label: 'Fondo imagen/video', mode: 'single' },
                { key: 'logo', label: 'Logo', mode: 'single' }
            ]
        },
        { key: 'motionDirection', type: 'select', options: [{ v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }], default: 'rtl', label: 'Motion Direction' },
        { key: 'headline', type: 'text', default: 'NORTHDUNE', label: 'Logo / Marca', maxLength: 40 },
        { key: 'subheadline', type: 'text', default: 'BUILT FOR THE IN-BETWEEN.', label: 'Texto Principal', maxLength: 70 },
        { key: 'cta', type: 'text', default: 'SHOP COLLECTION', label: 'CTA', maxLength: 40 },
        { key: 'mediaHeight', type: 'range', min: 80, max: 420, default: 230, step: 5, label: 'Media Height', unit: '%' },
        { key: 'visibleItems', type: 'range', min: 3, max: 18, default: 9, step: 1, label: 'Visible Items' },
        { key: 'gap', type: 'range', min: 0, max: 90, default: 8, step: 1, label: 'Gap', unit: '%' },
        { key: 'curlRadius', type: 'range', min: 35, max: 240, default: 105, step: 1, label: 'Curl Radius', unit: '%' },
        { key: 'cursorBoost', type: 'range', min: 0, max: 240, default: 120, step: 1, label: 'Cursor Boost', unit: '%' },
        { key: 'background', type: 'color', default: '#dfe7eb', label: 'Background' },
        { key: 'textColor', type: 'color', default: '#08090b', label: 'Text Color' }
    ]);

    Object.keys(base).forEach(function(k) {
        if (typeof base[k] === 'function' && !effect[k]) effect[k] = base[k];
    });
    effect.capabilities = Object.assign({}, base.capabilities || {}, { supportsVideo: true, exportSafe: true });
    effect._ensureWowDefaults = function() {
        var defaults = {
            logoSlot: 0,
            logoSize: 22,
            minItemWidth: 220,
            maxItemWidth: 520,
            curveStart: -390,
            curlAngle: 160,
            reverseMode: 'dark',
            edgeBands: 'on',
            perspective: 36,
            cameraZ: 820,
            cameraY: 0,
            edgeColor: '#050505'
        };
        Object.keys(defaults).forEach(function(key) {
            if (this.settings[key] === undefined || this.settings[key] === null || this.settings[key] !== this.settings[key]) {
                this.settings[key] = defaults[key];
            }
        }, this);
    };
    effect.build = function(mediaList) {
        this._ensureWowDefaults();
        this._allMedia = (EP.Media && EP.Media.slots) ? EP.Media.slots : (mediaList || []);
        var groups = this.settings.mediaGroups || {};
        var selected = Array.isArray(groups.main) && groups.main.length ? groups.main.map(function(i) { return this._allMedia[i]; }, this).filter(Boolean) : (mediaList || []);
        var group = base.build.call(this, selected);
        this._bgMedia = groups.background !== null && groups.background !== undefined ? this._allMedia[groups.background] : null;
        this._logoMedia = groups.logo !== null && groups.logo !== undefined ? this._allMedia[groups.logo] : null;
        this._addNewBackground(group);
        this._patchLogo();
        return group;
    };
    effect._addNewBackground = function(group) {
        if (!this._bgMedia) return;
        var mat = EP.Media.createMaterial(this._bgMedia, { opacity: 0.9, side: THREE.DoubleSide });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.8), mat);
        mesh.position.z = -1.2;
        mesh.userData.isWowNewBackground = true;
        group.add(mesh);
    };
    effect._patchLogo = function() {
        if (!this._logoMedia || !this.group) return;
        var mat = EP.Media.createMaterial(this._logoMedia, { opacity: 0.98, side: THREE.DoubleSide });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), mat);
        mesh.position.set(-4.5, 1.9, 0.55);
        this.group.add(mesh);
    };
    var oldUpdate = base.update;
    effect.update = function(time, dt, loopDuration) {
        this._ensureWowDefaults();
        oldUpdate.call(this, time, dt, loopDuration);
        if (this.group) {
            this.group.traverse(function(child) {
                if (child.material) EP.Media.updateMaterial(child.material);
            });
        }
    };
    EP.Registry.register(effect);
})();
