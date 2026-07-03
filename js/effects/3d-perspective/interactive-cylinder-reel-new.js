(function() {
    var effect = new EP.EffectBase('interactive-cylinder-reel-new', {
        name: 'Interactive Cylinder Reel NEW',
        category: '3d-perspective',
        icon: 'IN',
        description: 'Codigo original adaptado: cilindro Three.js con CanvasTexture compuesta, tapas, aros, suelo e inercia'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 120, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'loopMode', type: 'select', options: [{ v: 'off', l: 'Bucle OFF' }, { v: 'on', l: 'Bucle ON' }], default: 'off', label: 'Loop Mode' },
        {
            key: 'mediaGroups',
            type: 'slotGroups',
            label: 'Medios Cylinder',
            default: { main: [0, 1, 2, 3, 4, 5], background: null },
            groups: [
                { key: 'main', label: 'Orden del cilindro', mode: 'multi' },
                { key: 'background', label: 'Fondo imagen/video', mode: 'single' }
            ]
        },
        { key: 'mediaStart', type: 'range', min: 1, max: 15, default: 1, step: 1, label: 'Primer slot' },
        { key: 'mediaCount', type: 'range', min: 1, max: 15, default: 15, step: 1, label: 'Numero medios' },
        { key: 'backgroundType', type: 'select', options: [{ v: 'color', l: 'Color' }, { v: 'image', l: 'Imagen slot' }, { v: 'video', l: 'Video slot' }], default: 'color', label: 'Tipo fondo' },
        { key: 'backgroundSlot', type: 'range', min: 1, max: 15, default: 1, step: 1, label: 'Fondo slot' },
        { key: 'backgroundOpacity', type: 'range', min: 0, max: 100, default: 100, step: 1, label: 'Opacidad fondo', unit: '%' },
        { key: 'radius', type: 'range', min: 60, max: 180, default: 100, step: 1, label: 'Radio', unit: '%' },
        { key: 'height', type: 'range', min: 60, max: 180, default: 100, step: 1, label: 'Altura', unit: '%' },
        { key: 'sensitivity', type: 'range', min: 10, max: 260, default: 100, step: 1, label: 'Sensibilidad', unit: '%' },
        { key: 'background', type: 'color', default: '#0a0a0c', label: 'Fondo' }
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

    function drawCover(ctx, el, x, y, w, h) {
        var iw = el.videoWidth || el.naturalWidth || el.width || 1;
        var ih = el.videoHeight || el.naturalHeight || el.height || 1;
        var aspectRatio = iw / ih || 1;
        var drawWidth = w;
        var drawHeight = drawWidth / aspectRatio;
        if (drawHeight > h) {
            drawHeight = h;
            drawWidth = drawHeight * aspectRatio;
        }
        var offsetX = x + (w - drawWidth) / 2;
        var offsetY = y + (h - drawHeight) / 2;
        ctx.drawImage(el, offsetX, offsetY, drawWidth, drawHeight);
    }

    function mediaSlice(all, start, count) {
        var s = Math.max(0, Math.floor(start || 1) - 1);
        return (all || []).slice(s, s + Math.max(1, Math.floor(count || 1))).filter(Boolean);
    }

    function pickMainMedia(all, settings) {
        var groups = settings.mediaGroups || {};
        if (Array.isArray(groups.main) && groups.main.length) {
            return groups.main.map(function(idx) { return (all || [])[idx]; }).filter(Boolean);
        }
        return mediaSlice(all || [], settings.mediaStart, settings.mediaCount);
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._allMedia = (EP.Media && EP.Media.slots) ? EP.Media.slots : (mediaList || []);
        this._mediaList = pickMainMedia(this._allMedia, this.settings);
        this._activeMediaKey = '';
        var radius = 1.2;
        var cylinderGroup = new THREE.Group();
        var cylinderGeo = new THREE.CylinderGeometry(radius, radius, 1.8, 64, 1, true);
        var cylinderMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.08, side: THREE.DoubleSide });
        this._cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
        cylinderGroup.add(this._cylinder);

        var capGeo = new THREE.CylinderGeometry(radius, radius, 0.05, 64);
        var capMat = new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.25, metalness: 0.45 });
        var topCap = new THREE.Mesh(capGeo, capMat);
        topCap.position.y = 0.925;
        var bottomCap = new THREE.Mesh(capGeo.clone(), capMat.clone());
        bottomCap.position.y = -0.925;
        cylinderGroup.add(topCap);
        cylinderGroup.add(bottomCap);

        var ringGeo = new THREE.TorusGeometry(1.22, 0.03, 16, 64);
        var ringMat = new THREE.MeshStandardMaterial({ color: 0x9a9aad, roughness: 0.2, metalness: 0.8 });
        var topRing = new THREE.Mesh(ringGeo, ringMat);
        topRing.position.y = 0.96;
        topRing.rotation.x = Math.PI / 2;
        var bottomRing = new THREE.Mesh(ringGeo.clone(), ringMat.clone());
        bottomRing.position.y = -0.96;
        bottomRing.rotation.x = Math.PI / 2;
        cylinderGroup.add(topRing);
        cylinderGroup.add(bottomRing);

        var floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.8, metalness: 0.1, transparent: true, opacity: 0.35 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.2;
        this._floor = floor;
        group.add(floor);
        group.add(cylinderGroup);
        this._backgroundPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(18, 10),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(this.settings.background), transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false })
        );
        this._backgroundPlane.position.set(0, 0, -3.5);
        group.add(this._backgroundPlane);

        this._cylinderGroup = cylinderGroup;
        this._targetRotation = 0;
        this._currentRotation = 0;
        this._velocity = 0;
        this._pointer = { down: false, lastX: 0, startX: 0 };
        this._onWheel = function(e) {
            this._velocity += e.deltaY * 0.004 * this.settings.sensitivity / 100;
        }.bind(this);
        this._onPointerDown = function(e) {
            this._pointer.down = true;
            this._pointer.lastX = e.clientX;
            this._pointer.startX = e.clientX;
        }.bind(this);
        this._onPointerMove = function(e) {
            if (!this._pointer.down) return;
            var dx = e.clientX - this._pointer.lastX;
            this._targetRotation += dx * 0.004 * this.settings.sensitivity / 100;
            this._velocity = dx * 0.002;
            this._pointer.lastX = e.clientX;
        }.bind(this);
        this._onPointerUp = function() { this._pointer.down = false; }.bind(this);
        if (EP.Core && EP.Core.renderer) {
            var dom = EP.Core.renderer.domElement;
            dom.addEventListener('wheel', this._onWheel, { passive: true });
            dom.addEventListener('pointerdown', this._onPointerDown);
            dom.addEventListener('pointermove', this._onPointerMove);
            dom.addEventListener('pointerup', this._onPointerUp);
            dom.addEventListener('pointerleave', this._onPointerUp);
        }
        this._updateCylinderTexture(true);
        this._updateBackground(true);
        this.group = group;
        return group;
    };

    effect._syncMediaSelection = function() {
        var next = pickMainMedia(this._allMedia || [], this.settings);
        var key = next.map(function(m) { return (m.name || '') + ':' + (m.type || '') + ':' + (m.url || ''); }).join('|') + '|' + this.settings.mediaStart + '|' + this.settings.mediaCount + '|' + JSON.stringify(this.settings.mediaGroups || {});
        if (key !== this._activeMediaKey) {
            this._activeMediaKey = key;
            this._mediaList = next;
            this._updateCylinderTexture(true);
        }
    };

    effect._updateBackground = function(force) {
        if (!this._backgroundPlane) return;
        var key = [this.settings.backgroundType, this.settings.backgroundSlot, this.settings.background, this.settings.backgroundOpacity].join('|');
        if (!force && key === this._bgKey && !(this._bgMedia && this._bgMedia.type === 'video')) return;
        this._bgKey = key;
        var mat = this._backgroundPlane.material;
        var groupBg = this.settings.mediaGroups && this.settings.mediaGroups.background;
        if ((groupBg === null || groupBg === undefined) && this.settings.backgroundType === 'color') {
            if (mat.map) { mat.map.dispose(); mat.map = null; }
            mat.color = new THREE.Color(this.settings.background);
            mat.opacity = this.settings.backgroundOpacity / 100;
            mat.needsUpdate = true;
            this._bgMedia = null;
            return;
        }
        var bgIndex = groupBg !== null && groupBg !== undefined ? groupBg : Math.floor(this.settings.backgroundSlot) - 1;
        var media = (this._allMedia || [])[Math.max(0, bgIndex)];
        this._bgMedia = media || null;
        if (!media) return;
        if (mat.map && force) { mat.map.dispose(); mat.map = null; }
        if (!mat.map || force || key !== this._bgKeyWithMedia) {
            this._bgKeyWithMedia = key;
            if (mat.map) mat.map.dispose();
            mat.map = EP.Media.createTexture(media);
        }
        mat.color = new THREE.Color('#ffffff');
        mat.opacity = this.settings.backgroundOpacity / 100;
        mat.needsUpdate = true;
        EP.Media.updateMaterial(mat);
    };

    effect._getCompositeCanvas = function() {
        var items = this._mediaList || [];
        if (!items.length) {
            var empty = document.createElement('canvas');
            empty.width = 2048;
            empty.height = 1024;
            var ectx = empty.getContext('2d');
            ectx.fillStyle = '#1a1a20';
            ectx.fillRect(0, 0, empty.width, empty.height);
            ectx.fillStyle = '#ffffff';
            ectx.font = 'bold 40px Inter, system-ui, sans-serif';
            ectx.textAlign = 'center';
            ectx.fillText('Arrastra imagenes aqui', empty.width / 2, empty.height / 2);
            return empty;
        }
        var height = 1024;
        var maxTextureWidth = 8192;
        var itemWidth = Math.min(512, Math.floor(maxTextureWidth / items.length));
        var canvas = document.createElement('canvas');
        canvas.width = items.length * itemWidth;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111116';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var x = i * itemWidth;
            if (item && item.element) {
                if (item.type === 'video') item.element.play().catch(function() {});
                try { drawCover(ctx, item.element, x, 0, itemWidth, height); } catch(e) {}
                if (i < items.length - 1) {
                    ctx.fillStyle = 'rgba(255,255,255,0.05)';
                    ctx.fillRect(x + itemWidth - 1, 0, 2, height);
                }
            }
        }
        return canvas;
    };

    effect._updateCylinderTexture = function(force) {
        if (!this._cylinder || (!force && !this._hasVideo)) return;
        this._hasVideo = (this._mediaList || []).some(function(m) { return m && m.type === 'video'; });
        var canvas = this._getCompositeCanvas();
        if (this._texture) this._texture.dispose();
        var texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        this._texture = texture;
        this._cylinder.material.map = texture;
        this._cylinder.material.needsUpdate = true;
        var circumference = 2 * Math.PI * 1.2;
        this._maxRotation = this.settings.loopMode === 'on' ? Math.PI * 200 : ((this._mediaList.length || 1) * 512) / circumference * Math.PI * 2;
    };

    effect.update = function(time, dt) {
        if (!this.group || !this._cylinderGroup) return;
        if (EP.Core && EP.Core.scene) EP.Core.scene.background = new THREE.Color(this.settings.background);
        this._syncMediaSelection();
        this._updateBackground(false);
        this._updateCylinderTexture(false);
        var motion = this.settings.playbackMotion !== 'off' ? this.settings.playbackMotionSpeed / 100 : 0;
        if (!this._pointer.down) {
            this._targetRotation += this._velocity;
            this._velocity *= 0.92;
            this._targetRotation += 0.01 * motion;
        }
        if (this.settings.loopMode !== 'on') {
            var minRot = -this._maxRotation * 0.02;
            var maxRot = this._maxRotation * 1.02;
            if (this._targetRotation < minRot) this._targetRotation += (minRot - this._targetRotation) * 0.3;
            if (this._targetRotation > maxRot) this._targetRotation += (maxRot - this._targetRotation) * 0.3;
        }
        var lerp = 1 - Math.exp(-10 * (dt || 0.016));
        this._currentRotation += (this._targetRotation - this._currentRotation) * lerp;
        this._cylinderGroup.rotation.y = this._currentRotation;
        this._cylinderGroup.scale.set(this.settings.radius / 100, this.settings.height / 100, this.settings.radius / 100);
        this.group.scale.setScalar(this.settings.outputSize / 100);
        if (EP.Core && EP.Core.camera) {
            EP.Core.camera.position.set(0, 0.2, 6);
            EP.Core.camera.lookAt(0, 0, 0);
            EP.Core.camera.updateProjectionMatrix();
        }
    };

    effect.dispose = function() {
        if (EP.Core && EP.Core.renderer) {
            var dom = EP.Core.renderer.domElement;
            dom.removeEventListener('wheel', this._onWheel);
            dom.removeEventListener('pointerdown', this._onPointerDown);
            dom.removeEventListener('pointermove', this._onPointerMove);
            dom.removeEventListener('pointerup', this._onPointerUp);
            dom.removeEventListener('pointerleave', this._onPointerUp);
        }
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
