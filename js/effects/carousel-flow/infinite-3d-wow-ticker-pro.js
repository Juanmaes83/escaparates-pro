(function() {
    var effect = new EP.EffectBase('infinite-3d-wow-ticker-pro', {
        name: 'Infinite 3D Wow Ticker PRO',
        category: 'carousel-flow',
        icon: 'WT',
        description: 'Rollo 3D infinito tipo showcase web con anverso, reverso oscuro, marca, textos, CTA y despliegue por cursor'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 240, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }], default: 'rtl', label: 'Motion Direction' },
        { key: 'headline', type: 'text', default: 'NORTHDUNE', label: 'Logo / Marca', maxLength: 40 },
        { key: 'subheadline', type: 'text', default: 'BUILT FOR THE IN-BETWEEN.', label: 'Texto Principal', maxLength: 70 },
        { key: 'cta', type: 'text', default: 'SHOP COLLECTION', label: 'CTA', maxLength: 40 },
        { key: 'logoSlot', type: 'range', min: 0, max: 15, default: 0, step: 1, label: 'Logo Slot' },
        { key: 'logoSize', type: 'range', min: 8, max: 60, default: 22, step: 1, label: 'Logo Size', unit: '%' },
        { key: 'mediaHeight', type: 'range', min: 80, max: 420, default: 230, step: 5, label: 'Media Height', unit: '%' },
        { key: 'minItemWidth', type: 'range', min: 100, max: 460, default: 220, step: 5, label: 'Min Width', unit: '%' },
        { key: 'maxItemWidth', type: 'range', min: 160, max: 720, default: 520, step: 5, label: 'Max Width', unit: '%' },
        { key: 'visibleItems', type: 'range', min: 3, max: 18, default: 9, step: 1, label: 'Visible Items' },
        { key: 'gap', type: 'range', min: 0, max: 90, default: 8, step: 1, label: 'Gap', unit: '%' },
        { key: 'curveStart', type: 'range', min: -760, max: 60, default: -390, step: 5, label: 'Curve Start', unit: '%' },
        { key: 'curlRadius', type: 'range', min: 35, max: 240, default: 105, step: 1, label: 'Curl Radius', unit: '%' },
        { key: 'curlAngle', type: 'range', min: 70, max: 330, default: 160, step: 1, label: 'Curl Angle', unit: 'deg' },
        { key: 'reverseMode', type: 'select', options: [{ v: 'dark', l: 'Reverso oscuro' }, { v: 'mirror', l: 'Reverso espejo' }, { v: 'mono', l: 'Reverso mono' }], default: 'dark', label: 'Anverso / Reverso' },
        { key: 'edgeBands', type: 'select', options: [{ v: 'on', l: 'Bordes premium' }, { v: 'off', l: 'Sin bordes' }], default: 'on', label: 'Edge Bands' },
        { key: 'cursorBoost', type: 'range', min: 0, max: 240, default: 120, step: 1, label: 'Cursor Boost', unit: '%' },
        { key: 'perspective', type: 'range', min: 24, max: 70, default: 36, step: 1, label: 'FOV' },
        { key: 'cameraZ', type: 'range', min: 430, max: 1400, default: 820, step: 10, label: 'Camera Z', unit: '%' },
        { key: 'cameraY', type: 'range', min: -220, max: 220, default: 0, step: 5, label: 'Camera Y', unit: '%' },
        { key: 'background', type: 'color', default: '#dfe7eb', label: 'Background' },
        { key: 'edgeColor', type: 'color', default: '#050505', label: 'Edge Color' },
        { key: 'textColor', type: 'color', default: '#08090b', label: 'Text Color' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: false,
        mobileRisk: 'medium',
        minMedia: 1,
        exportSafe: true,
        hasErrorBoundary: true
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function wrapCentered(value, period) {
        if (!period || period <= 0) return value;
        return ((((value + period / 2) % period) + period) % period) - period / 2;
    }

    function mapCurl(x, cfg) {
        var curveLength = cfg.curlRadius * cfg.curlAngle;
        if (x >= cfg.curveStart) return { x: x, z: 0 };
        var dx = cfg.curveStart - x;
        var theta = clamp(dx / Math.max(0.001, cfg.curlRadius), 0, cfg.curlAngle);
        return {
            x: cfg.curveStart - Math.sin(theta) * cfg.curlRadius,
            z: cfg.curlRadius * (1 - Math.cos(theta))
        };
    }

    function makeCoverMaterial(media, opacity, tint, side) {
        var mat = media ? EP.Media.createMaterial(media, { side: side || THREE.FrontSide, opacity: opacity }) :
            new THREE.MeshBasicMaterial({ color: 0xf1f1f1, side: side || THREE.FrontSide, transparent: true, opacity: opacity });
        mat.toneMapped = false;
        if (tint) mat.color = new THREE.Color(tint);
        mat.transparent = true;
        mat.opacity = opacity;
        return mat;
    }

    function drawOverlayTexture(data, settings) {
        var canvas = data.canvas;
        var ctx = data.ctx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = settings.textColor;
        ctx.textBaseline = 'top';
        ctx.font = '900 58px Arial, sans-serif';
        ctx.letterSpacing = '10px';
        ctx.fillText(settings.headline || '', 72, 62);

        ctx.font = '800 52px Arial, sans-serif';
        ctx.fillText(settings.subheadline || '', 1260, 280);
        ctx.font = '500 24px Arial, sans-serif';
        ctx.fillText('Curated visual reel / images and videos', 1260, 352);

        var cta = settings.cta || '';
        if (cta) {
            ctx.fillStyle = settings.textColor;
            ctx.fillRect(1260, 440, 280, 54);
            ctx.fillStyle = '#ffffff';
            ctx.font = '800 20px Arial, sans-serif';
            ctx.fillText(cta, 1282, 457);
        }
        if (data.texture) data.texture.needsUpdate = true;
    }

    function makeOverlayTexture(settings) {
        var canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        var ctx = canvas.getContext('2d');
        var tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        var data = { canvas: canvas, ctx: ctx, texture: tex };
        drawOverlayTexture(data, settings);
        return data;
    }

    function createBand(y, h, cfg, color) {
        var geo = new THREE.PlaneGeometry(cfg.visibleSpan + 3, h, Math.max(24, cfg.segments * 2), 1);
        var pos = geo.attributes.position;
        var base = new Float32Array(pos.array);
        for (var i = 0; i < base.length; i += 3) base[i + 1] += y;
        var mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.DoubleSide, toneMapped: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.frustumCulled = false;
        return { mesh: mesh, base: base };
    }

    function updateBand(band, cfg) {
        var pos = band.mesh.geometry.attributes.position;
        var arr = pos.array;
        for (var i = 0; i < arr.length; i += 3) {
            var mapped = mapCurl(band.base[i], cfg);
            arr[i] = mapped.x;
            arr[i + 1] = band.base[i + 1];
            arr[i + 2] = mapped.z + 0.018;
        }
        pos.needsUpdate = true;
    }

    function createItem(media, width, height, center, cfg, reverseMode) {
        var frontGeo = new THREE.PlaneGeometry(width, height, cfg.segments, 1);
        var backGeo = new THREE.PlaneGeometry(width, height, cfg.segments, 1);
        var frontMat = makeCoverMaterial(media, 0.98, null, THREE.FrontSide);
        var backTint = reverseMode === 'mono' ? '#6d7174' : '#202225';
        var backOpacity = reverseMode === 'mirror' ? 0.58 : 0.78;
        var backMat = makeCoverMaterial(media, backOpacity, backTint, THREE.BackSide);
        var group = new THREE.Group();
        var front = new THREE.Mesh(frontGeo, frontMat);
        var back = new THREE.Mesh(backGeo, backMat);
        front.frustumCulled = false;
        back.frustumCulled = false;
        group.add(front);
        group.add(back);
        var base = new Float32Array(frontGeo.attributes.position.array);
        return { mesh: group, front: front, back: back, media: media, width: width, height: height, baseCenterX: center, base: base };
    }

    function updateItem(item, offset, totalWidth, cfg) {
        var frontPos = item.front.geometry.attributes.position;
        var backPos = item.back.geometry.attributes.position;
        var frontArr = frontPos.array;
        var backArr = backPos.array;
        var curveMinX = cfg.curveStart - cfg.curlRadius * cfg.curlAngle;
        var centerX = wrapCentered(item.baseCenterX - offset, totalWidth);
        var right = centerX + item.width / 2;
        var left = centerX - item.width / 2;
        item.mesh.visible = right > curveMinX - item.width * 0.3 && left < cfg.visibleSpan / 2 + item.width;

        for (var i = 0; i < frontArr.length; i += 3) {
            var localX = item.base[i];
            var localY = item.base[i + 1];
            var xWorld = centerX + localX;
            var mapped = mapCurl(xWorld, cfg);
            frontArr[i] = mapped.x;
            frontArr[i + 1] = localY;
            frontArr[i + 2] = mapped.z + 0.006;
            backArr[i] = mapped.x;
            backArr[i + 1] = localY;
            backArr[i + 2] = mapped.z - 0.006;
        }
        frontPos.needsUpdate = true;
        backPos.needsUpdate = true;
    }

    effect.build = function(mediaList) {
        mediaList = mediaList || [];
        var group = new THREE.Group();
        this._items = [];
        this._bands = [];
        this._offset = 0;
        this._velocity = 0;
        this._pointerBoost = 0;
        this._lastPointerX = null;
        this._mediaList = mediaList;
        this._handlesOutputSize = true;

        var cfg = this._getConfig();
        var usableMedia = mediaList.length ? mediaList : [{ type: 'image', element: null, name: 'Demo' }];
        var sourceLimit = Math.max(1, Math.min(usableMedia.length, Math.round(this.settings.visibleItems)));
        var originals = [];
        for (var i = 0; i < sourceLimit; i++) {
            var m = usableMedia[i];
            var aspect = 16 / 9;
            if (m && m.element) {
                aspect = (m.element.videoWidth || m.element.naturalWidth || m.element.width || 1600) /
                    Math.max(1, (m.element.videoHeight || m.element.naturalHeight || m.element.height || 900));
            }
            var w = clamp(cfg.mediaHeight * aspect, cfg.minItemWidth, cfg.maxItemWidth);
            originals.push({ media: m, width: w, height: cfg.mediaHeight });
        }

        var originalWidth = 0;
        originals.forEach(function(item) { originalWidth += item.width + cfg.gap; });
        var copies = Math.max(4, Math.ceil((cfg.visibleSpan * 3.4) / Math.max(0.001, originalWidth)) + 2);
        var cursor = 0;
        for (var copy = 0; copy < copies; copy++) {
            for (var oi = 0; oi < originals.length; oi++) {
                var original = originals[oi];
                var item = createItem(original.media, original.width, original.height, cursor + original.width / 2, cfg, this.settings.reverseMode);
                this._items.push(item);
                group.add(item.mesh);
                cursor += original.width + cfg.gap;
            }
        }
        this._totalWidth = Math.max(cursor, 0.001);
        this._items.forEach(function(item) { item.baseCenterX -= this._totalWidth / 2; }.bind(this));

        if (this.settings.edgeBands === 'on') {
            var bandH = Math.max(0.055, cfg.mediaHeight * 0.052);
            this._bands = [
                createBand(cfg.mediaHeight / 2 + bandH / 2, bandH, cfg, this.settings.edgeColor),
                createBand(-cfg.mediaHeight / 2 - bandH / 2, bandH, cfg, this.settings.edgeColor)
            ];
            this._bands.forEach(function(b) { group.add(b.mesh); });
        }

        this._overlayData = makeOverlayTexture(this.settings);
        this._overlayKey = '';
        this._overlay = new THREE.Mesh(
            new THREE.PlaneGeometry(12.6, 6.3),
            new THREE.MeshBasicMaterial({ map: this._overlayData.texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
        );
        this._overlay.position.set(0, 0.12, 0.72);
        group.add(this._overlay);

        this._logo = null;
        var logoIndex = Math.round(this.settings.logoSlot) - 1;
        if (logoIndex >= 0 && mediaList[logoIndex]) {
            var logoMat = EP.Media.createMaterial(mediaList[logoIndex], { side: THREE.DoubleSide, opacity: 0.98 });
            this._logo = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), logoMat);
            this._logo.position.set(-5.4, 2.55, 0.86);
            group.add(this._logo);
        }

        this._bindPointer();
        this.group = group;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect._getConfig = function() {
        return {
            mediaHeight: this.settings.mediaHeight / 100,
            minItemWidth: this.settings.minItemWidth / 100,
            maxItemWidth: this.settings.maxItemWidth / 100,
            gap: this.settings.gap / 100,
            visibleSpan: 15.8,
            curveStart: this.settings.curveStart / 100,
            curlRadius: this.settings.curlRadius / 100,
            curlAngle: this.settings.curlAngle * Math.PI / 180,
            segments: 36
        };
    };

    effect._bindPointer = function() {
        this._unbindPointer();
        var renderer = EP.Core && EP.Core.renderer;
        if (!renderer || !renderer.domElement) return;
        var self = this;
        this._onPointerMove = function(event) {
            var rect = renderer.domElement.getBoundingClientRect();
            var nx = rect.width ? (event.clientX - rect.left) / rect.width : 0.5;
            self._pointerBoost = (nx - 0.5) * self.settings.cursorBoost / 100;
            if (self._lastPointerX !== null) {
                self._velocity += (event.clientX - self._lastPointerX) * 0.0035 * self.settings.cursorBoost / 100;
            }
            self._lastPointerX = event.clientX;
        };
        this._onPointerLeave = function() {
            self._lastPointerX = null;
            self._pointerBoost *= 0.25;
        };
        renderer.domElement.addEventListener('pointermove', this._onPointerMove);
        renderer.domElement.addEventListener('pointerleave', this._onPointerLeave);
    };

    effect._unbindPointer = function() {
        var renderer = EP.Core && EP.Core.renderer;
        if (!renderer || !renderer.domElement) return;
        if (this._onPointerMove) renderer.domElement.removeEventListener('pointermove', this._onPointerMove);
        if (this._onPointerLeave) renderer.domElement.removeEventListener('pointerleave', this._onPointerLeave);
        this._onPointerMove = null;
        this._onPointerLeave = null;
    };

    effect.update = function(time, dt) {
        if (!this.group || !this._items) return;
        dt = Math.min(0.05, dt || 0.016);
        var cfg = this._getConfig();
        var dir = this.settings.motionDirection === 'ltr' ? -1 : 1;
        var motion = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var speed = 0.62 * motion * dir + this._pointerBoost;
        this._offset += speed * dt + this._velocity * dt;
        this._velocity *= Math.pow(0.9, dt * 60);
        this._pointerBoost *= Math.pow(0.88, dt * 60);

        for (var i = 0; i < this._items.length; i++) {
            var item = this._items[i];
            if (item.media && item.media.type === 'video') {
                EP.Media.updateMaterial(item.front.material);
                EP.Media.updateMaterial(item.back.material);
            }
            updateItem(item, this._offset, this._totalWidth, cfg);
        }
        for (var b = 0; b < this._bands.length; b++) {
            this._bands[b].mesh.material.color.set(this.settings.edgeColor);
            updateBand(this._bands[b], cfg);
        }

        if (this._overlay) {
            var overlayKey = [this.settings.headline, this.settings.subheadline, this.settings.cta, this.settings.textColor].join('|');
            if (this._overlayData && overlayKey !== this._overlayKey) {
                drawOverlayTexture(this._overlayData, this.settings);
                this._overlayKey = overlayKey;
            }
            this._overlay.position.z = 0.72 + Math.sin(time * 0.4) * 0.01;
        }
        if (this._logo) {
            var logoScale = this.settings.logoSize / 22;
            this._logo.scale.setScalar(logoScale);
        }

        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.scene.background = new THREE.Color(this.settings.background);
        EP.Core.camera.fov = this.settings.perspective;
        EP.Core.camera.position.set(0, this.settings.cameraY / 100, this.settings.cameraZ / 100);
        EP.Core.camera.lookAt(0, 0, 0.15);
        EP.Core.camera.updateProjectionMatrix();
    };

    effect.dispose = function() {
        this._unbindPointer();
        this._items = null;
        this._bands = null;
        this._overlayData = null;
        this._overlay = null;
        this._logo = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
