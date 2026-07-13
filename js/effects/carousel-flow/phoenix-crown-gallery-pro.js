// Phoenix Crown Gallery PRO - adapted from Chinese-PhoenixCrown.
// Keeps the source's three-piece crown gallery, luminous ink curtain and
// focused central scene while allowing every crown panel to be client media.
(function() {
    var effect = new EP.EffectBase('phoenix-crown-gallery-pro', {
        name: 'Phoenix Crown Gallery PRO',
        category: 'carousel-flow',
        icon: 'PC',
        description: 'Galeria ceremonial de tres coronas: medio propio, tinta luminosa y foco editorial central'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'gallerySize', type: 'range', min: 45, max: 125, default: 88, step: 1, label: 'Tamano de galeria', unit: '%' },
        { key: 'gallerySpread', type: 'range', min: 40, max: 180, default: 100, step: 1, label: 'Separacion lateral', unit: '%' },
        { key: 'focusLift', type: 'range', min: 0, max: 100, default: 52, step: 1, label: 'Elevacion central', unit: '%' },
        { key: 'cardRatio', type: 'aspect', options: ['3:4', '4:5', '1:1', '16:9'], default: '3:4', label: 'Proporcion de coronas' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 8, step: 1, label: 'Radio de marco', unit: '%' },
        { key: 'curtainText', type: 'text', default: '凤 凰 金 玉 云 霞 珠 光 ESCAPARATES PRO ', label: 'Texto de tinta', maxLength: 180 },
        { key: 'curtainDensity', type: 'range', min: 20, max: 100, default: 64, step: 1, label: 'Densidad de tinta', unit: '%' },
        { key: 'inkOpacity', type: 'range', min: 10, max: 100, default: 76, step: 1, label: 'Opacidad de tinta', unit: '%' },
        { key: 'inkPalette', type: 'select', options: [{ v: 'imperial', l: 'Oro imperial' }, { v: 'jade', l: 'Jade y turquesa' }, { v: 'opera', l: 'Opera rubi' }, { v: 'ice', l: 'Plata y zafiro' }], default: 'imperial', label: 'Paleta de tinta' },
        { key: 'cardBorder', type: 'range', min: 0, max: 100, default: 56, step: 1, label: 'Brillo del marco', unit: '%' },
        { key: 'background', type: 'color', default: '#07101c', label: 'Fondo ceremonial' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: false, supportsVideo: true, usesCamera: false,
        usesPostProcessing: false, usesParticlesShaders: false, mobileRisk: 'medium',
        minMedia: 0, exportSafe: true, hasErrorBoundary: true
    };

    var palettes = {
        imperial: ['#f6d475', '#d89a35', '#fff0bf', '#bd692d'],
        jade: ['#5ed5ae', '#59bdda', '#f2d07c', '#b6f2dc'],
        opera: ['#e7be5f', '#d84e5a', '#61c9df', '#f9ecdb'],
        ice: ['#b8d7ff', '#f4f7ff', '#6d93e7', '#d8be6a']
    };
    var fallbackImages = [
        'assets/phoenix-crown/crown-fengguan.png',
        'assets/phoenix-crown/crown-opera.png',
        'assets/phoenix-crown/crown-jade.png'
    ];

    function ratioFor(value) {
        return { '3:4': 0.75, '4:5': 0.8, '1:1': 1, '16:9': 1.777 }[value] || 0.75;
    }

    function makeInkTexture(text, density, paletteKey) {
        var c = document.createElement('canvas');
        c.width = 768; c.height = 1024;
        var ctx = c.getContext('2d');
        var colors = palettes[paletteKey] || palettes.imperial;
        var chars = String(text || '凤 凰 金 玉').replace(/\s+/g, '') || '凤';
        var gap = Math.max(10, 34 - density * 0.22);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '600 ' + Math.max(12, gap * 0.72) + 'px serif';
        for (var x = gap; x < c.width; x += gap) {
            for (var y = gap; y < c.height; y += gap) {
                var wave = Math.sin(x * 0.027 + y * 0.011) * 8;
                var index = Math.floor((x + y * 1.7) / gap) % chars.length;
                ctx.fillStyle = colors[Math.floor((x / gap + y / gap) % colors.length)];
                ctx.globalAlpha = 0.56 + ((Math.sin(x * 0.09 + y * 0.04) + 1) * 0.12);
                ctx.save(); ctx.translate(x + wave, y); ctx.rotate(Math.sin(y * 0.014 + x) * 0.05);
                ctx.fillText(chars.charAt(index), 0, 0); ctx.restore();
            }
        }
        ctx.globalAlpha = 1;
        var texture = new THREE.CanvasTexture(c);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
    }

    function makeHaloTexture() {
        var c = document.createElement('canvas'); c.width = c.height = 512;
        var ctx = c.getContext('2d');
        var g = ctx.createRadialGradient(256, 256, 10, 256, 256, 256);
        g.addColorStop(0, 'rgba(248,209,111,.32)');
        g.addColorStop(.4, 'rgba(222,148,45,.12)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
        return new THREE.CanvasTexture(c);
    }

    function fallbackMaterial(path) {
        var mat = new THREE.MeshBasicMaterial({ color: 0x171e2a, transparent: true, opacity: 1 });
        new THREE.TextureLoader().load(path, function(texture) {
            mat.map = texture; mat.needsUpdate = true;
        });
        return mat;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var background = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), new THREE.MeshBasicMaterial({ color: this.settings.background }));
        background.position.z = -0.2; group.add(background); this._background = background;

        var halo = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.4), new THREE.MeshBasicMaterial({ map: makeHaloTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        halo.position.set(0, 0.18, -0.13); group.add(halo); this._halo = halo;

        this._inkTexture = makeInkTexture(this.settings.curtainText, this.settings.curtainDensity, this.settings.inkPalette);
        this._cards = [];
        var ar = ratioFor(this.settings.cardRatio);
        var h = 2.55, w = h * ar;
        var positions = [-1, 0, 1];
        for (var i = 0; i < 3; i++) {
            var cardGroup = new THREE.Group();
            var radius = w * this.settings.cornerRadius / 100 * 0.25;
            var glow = new THREE.Mesh(EP.RoundedPlaneGeometry(w + 0.18, h + 0.18, radius + 0.04), new THREE.MeshBasicMaterial({ color: 0xf2c75c, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending }));
            glow.position.z = -0.03; cardGroup.add(glow);
            var frame = new THREE.Mesh(EP.RoundedPlaneGeometry(w + 0.08, h + 0.08, radius + 0.02), new THREE.MeshBasicMaterial({ color: 0xe8bd52, transparent: true, opacity: this.settings.cardBorder / 100 }));
            frame.position.z = -0.015; cardGroup.add(frame);
            var medium = mediaList && mediaList.length ? mediaList[i % mediaList.length] : null;
            var art = new THREE.Mesh(EP.RoundedPlaneGeometry(w, h, radius), medium ? EP.Media.createMaterial(medium) : fallbackMaterial(fallbackImages[i]));
            art.position.z = 0; cardGroup.add(art);
            var ink = new THREE.Mesh(EP.RoundedPlaneGeometry(w, h, radius), new THREE.MeshBasicMaterial({ map: this._inkTexture, transparent: true, opacity: this.settings.inkOpacity / 100, depthWrite: false, blending: THREE.AdditiveBlending }));
            ink.position.z = 0.012; cardGroup.add(ink);
            cardGroup.userData = { index: i, frame: frame, ink: ink, baseX: positions[i], baseW: w, baseH: h };
            group.add(cardGroup); this._cards.push(cardGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._cards) return;
        if (this._background) this._background.material.color.set(this.settings.background);
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var scale = this.settings.gallerySize / 88;
        var spread = this.settings.gallerySpread / 100 * 2.25;
        var lift = this.settings.focusLift / 100 * 0.55;
        var phase = (time / Math.max(1, loopDuration)) * Math.PI * 2 * speed;
        for (var i = 0; i < this._cards.length; i++) {
            var card = this._cards[i];
            var x = (i - 1) * spread;
            var focus = i === 1 ? 1 : 0;
            card.position.x = x + Math.sin(phase + i * 1.7) * 0.055;
            card.position.y = focus * lift + Math.cos(phase * 1.35 + i) * 0.035;
            card.position.z = focus * 0.18 - Math.abs(i - 1) * 0.1;
            card.scale.setScalar(scale * (focus ? 1 : 0.76));
            card.rotation.y = (i - 1) * -0.25 + Math.sin(phase + i) * 0.025;
            card.rotation.z = (i - 1) * -0.035 + Math.cos(phase + i) * 0.01;
            card.userData.frame.material.opacity = this.settings.cardBorder / 100;
            card.userData.ink.material.opacity = this.settings.inkOpacity / 100 * (focus ? 1 : 0.68);
        }
        if (this._halo) this._halo.material.opacity = 0.55 + Math.sin(phase) * 0.12;
    };

    effect.dispose = function() {
        if (this._inkTexture) this._inkTexture.dispose();
        EP.EffectBase.prototype.dispose.call(this);
        this._cards = null; this._background = null; this._halo = null; this._inkTexture = null;
    };

    EP.Registry.register(effect);
})();
