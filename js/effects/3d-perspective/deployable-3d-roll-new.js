(function() {
    var effect = new EP.EffectBase('deployable-3d-roll-new', {
        name: 'Rollo 3D Desplegable NEW',
        category: '3d-perspective',
        icon: 'RN',
        description: 'Codigo original adaptado: anverso/reverso, textura compuesta, cilindro, geometria buildSheetGeometry y branding'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 135, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 70, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'brandTitle', type: 'text', default: 'Coleccion Otono 2026', label: 'Titulo' },
        { key: 'brandSubtitle', type: 'text', default: 'Descubre la nueva linea de disenos exclusivos.', label: 'Subtitulo' },
        { key: 'ctaText', type: 'text', default: 'Explorar coleccion', label: 'CTA' },
        { key: 'progress', type: 'range', min: 0, max: 100, default: 50, step: 1, label: 'Desenrolle', unit: '%' },
        { key: 'loopMode', type: 'select', options: [{ v: 'off', l: 'Bucle OFF' }, { v: 'on', l: 'Bucle ON' }], default: 'off', label: 'Loop' },
        { key: 'speedFine', type: 'range', min: 1, max: 800, default: 50, step: 1, label: 'Velocidad fina' },
        {
            key: 'mediaGroups',
            type: 'slotGroups',
            label: 'Medios Rollo 3D',
            default: { front: [0, 1, 2, 3], back: [4, 5, 6, 7], background: null, logo: null },
            groups: [
                { key: 'front', label: 'Anverso orden 1º, 2º, 3º', mode: 'multi' },
                { key: 'back', label: 'Reverso orden 1º, 2º, 3º', mode: 'multi' },
                { key: 'background', label: 'Fondo imagen/video', mode: 'single' },
                { key: 'logo', label: 'Logo', mode: 'single' }
            ]
        },
        { key: 'frontStart', type: 'range', min: 1, max: 15, default: 1, step: 1, label: 'Anverso inicio' },
        { key: 'frontCount', type: 'range', min: 1, max: 15, default: 4, step: 1, label: 'Anverso cantidad' },
        { key: 'backStart', type: 'range', min: 1, max: 15, default: 5, step: 1, label: 'Reverso inicio' },
        { key: 'backCount', type: 'range', min: 1, max: 15, default: 4, step: 1, label: 'Reverso cantidad' },
        { key: 'backgroundType', type: 'select', options: [{ v: 'color', l: 'Color' }, { v: 'image', l: 'Imagen slot' }, { v: 'video', l: 'Video slot' }], default: 'color', label: 'Tipo fondo' },
        { key: 'backgroundSlot', type: 'range', min: 1, max: 15, default: 9, step: 1, label: 'Fondo slot' },
        { key: 'backgroundOpacity', type: 'range', min: 0, max: 100, default: 100, step: 1, label: 'Opacidad fondo', unit: '%' },
        { key: 'logoSlot', type: 'range', min: 0, max: 15, default: 0, step: 1, label: 'Logo slot 0=off' },
        { key: 'sheetHeight', type: 'range', min: 60, max: 170, default: 100, step: 1, label: 'Altura hoja', unit: '%' },
        { key: 'background', type: 'color', default: '#0a0a0e', label: 'Fondo' }
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

    function smoothstep(edge0, edge1, x) {
        var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    function createBumpTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < imageData.data.length; i += 4) {
            var val = 128 + (Math.random() - 0.5) * 30;
            imageData.data[i] = val;
            imageData.data[i + 1] = val;
            imageData.data[i + 2] = val;
            imageData.data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        for (var y = 0; y < canvas.height; y += 8) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y + Math.sin(y) * 2);
            ctx.stroke();
        }
        var tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    function pickRange(media, start, count) {
        var s = Math.max(0, Math.floor(start || 1) - 1);
        return (media || []).slice(s, s + Math.max(1, Math.floor(count || 1))).filter(Boolean);
    }

    function pickGroup(media, settings, key, fallbackStart, fallbackCount) {
        var groups = settings.mediaGroups || {};
        if (Array.isArray(groups[key]) && groups[key].length) {
            return groups[key].map(function(idx) { return (media || [])[idx]; }).filter(Boolean);
        }
        return pickRange(media, fallbackStart, fallbackCount);
    }

    function rangeKey(items) {
        return (items || []).map(function(m) { return (m.name || '') + ':' + (m.type || '') + ':' + (m.url || ''); }).join('|');
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._mediaList = (EP.Media && EP.Media.slots) ? EP.Media.slots : (mediaList || []);
        this._state = {
            progress: this.settings.progress / 100,
            targetProgress: this.settings.progress / 100,
            velocity: 0,
            cylinderRadius: 0.55,
            sheetHeight: 2.2,
            totalSheetLength: 6.4,
            transitionLength: 0.6,
            segments: 160,
            bumpTexture: createBumpTexture()
        };
        this._createCylinder(group);
        this._frontItems = pickGroup(this._mediaList, this.settings, 'front', this.settings.frontStart, this.settings.frontCount);
        this._backItems = pickGroup(this._mediaList, this.settings, 'back', this.settings.backStart, this.settings.backCount);
        if (!this._backItems.length) this._backItems = this._frontItems.slice().reverse();
        this._sidesKey = '';
        this._frontTexture = this._createTexture(this._frontItems);
        this._backTexture = this._createTexture(this._backItems);
        this._frontMesh = new THREE.Mesh(this._buildSheetGeometry(this._state.progress, true), this._createParchmentMaterial(this._frontTexture));
        this._backMesh = new THREE.Mesh(this._buildSheetGeometry(this._state.progress, false), this._createParchmentMaterial(this._backTexture));
        group.add(this._frontMesh);
        group.add(this._backMesh);
        this._createBackground(group);
        this._createBrandOverlay(group);
        this._pointer = { down: false, lastX: 0 };
        this._onWheel = function(e) {
            this._state.velocity += e.deltaY * 0.0005 * this.settings.speedFine / 50;
        }.bind(this);
        this._onPointerDown = function(e) { this._pointer.down = true; this._pointer.lastX = e.clientX; }.bind(this);
        this._onPointerMove = function(e) {
            if (!this._pointer.down) return;
            var dx = e.clientX - this._pointer.lastX;
            this._state.targetProgress += dx * 0.0009;
            this._state.velocity = dx * 0.00035;
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
        this.group = group;
        return group;
    };

    effect._syncSideSelection = function(force) {
        var front = pickGroup(this._mediaList, this.settings, 'front', this.settings.frontStart, this.settings.frontCount);
        var back = pickGroup(this._mediaList, this.settings, 'back', this.settings.backStart, this.settings.backCount);
        if (!back.length) back = front.slice().reverse();
        var key = [
            this.settings.frontStart, this.settings.frontCount,
            this.settings.backStart, this.settings.backCount,
            rangeKey(front), rangeKey(back), JSON.stringify(this.settings.mediaGroups || {})
        ].join('|');
        if (!force && key === this._sidesKey) return;
        this._sidesKey = key;
        this._frontItems = front;
        this._backItems = back;
        if (this._frontTexture) this._frontTexture.dispose();
        if (this._backTexture) this._backTexture.dispose();
        this._frontTexture = this._createTexture(this._frontItems);
        this._backTexture = this._createTexture(this._backItems);
        if (this._frontMesh) {
            this._frontMesh.material.map = this._frontTexture;
            this._frontMesh.material.needsUpdate = true;
        }
        if (this._backMesh) {
            this._backMesh.material.map = this._backTexture;
            this._backMesh.material.needsUpdate = true;
        }
        var maxItems = Math.max(this._frontItems.length, this._backItems.length, 1);
        this._state.totalSheetLength = Math.max(0.5, maxItems * 1.6);
    };

    effect._createBackground = function(group) {
        this._backgroundPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(18, 10),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(this.settings.background), transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false })
        );
        this._backgroundPlane.position.set(2.5, 0, -3.2);
        group.add(this._backgroundPlane);
        this._updateBackground(true);
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
        var media = (this._mediaList || [])[Math.max(0, bgIndex)];
        this._bgMedia = media || null;
        if (!media) return;
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

    effect._createCylinder = function(group) {
        var R = this._state.cylinderRadius;
        var h = this._state.sheetHeight;
        var cylGroup = new THREE.Group();
        var geo = new THREE.CylinderGeometry(R, R, h, 64);
        var mat = new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.4, metalness: 0.6 });
        cylGroup.add(new THREE.Mesh(geo, mat));
        var capGeo = new THREE.CylinderGeometry(R, R, 0.03, 64);
        var capMat = new THREE.MeshStandardMaterial({ color: 0x3a3a45, roughness: 0.3, metalness: 0.7 });
        var topCap = new THREE.Mesh(capGeo, capMat);
        topCap.position.y = h / 2;
        var bottomCap = new THREE.Mesh(capGeo.clone(), capMat.clone());
        bottomCap.position.y = -h / 2;
        cylGroup.add(topCap);
        cylGroup.add(bottomCap);
        var ringGeo = new THREE.TorusGeometry(R + 0.02, 0.015, 16, 64);
        var ringMat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.2, metalness: 0.8 });
        var topRing = new THREE.Mesh(ringGeo, ringMat);
        topRing.position.y = h / 2;
        topRing.rotation.x = Math.PI / 2;
        var bottomRing = new THREE.Mesh(ringGeo.clone(), ringMat.clone());
        bottomRing.position.y = -h / 2;
        bottomRing.rotation.x = Math.PI / 2;
        cylGroup.add(topRing);
        cylGroup.add(bottomRing);
        group.add(cylGroup);
    };

    effect._buildSheetGeometry = function(progress, isFront) {
        var state = this._state;
        var R = state.cylinderRadius;
        var totalLength = Math.max(0.5, state.totalSheetLength);
        var unrolledLength = progress * totalLength;
        var geom = new THREE.PlaneGeometry(1, 1, state.segments, 1);
        var pos = geom.attributes.position;
        var uv = geom.attributes.uv;
        for (var i = 0; i < pos.count; i++) {
            var u = pos.getX(i);
            var yLocal = pos.getY(i);
            var s = (u + 0.5) * totalLength;
            var maxAngle = Math.PI * 1.5;
            var angle = Math.min(maxAngle, s / R);
            var rolledX = R * Math.cos(angle);
            var rolledZ = (isFront ? 1 : -1) * R * Math.sin(angle);
            var rolledY = yLocal * state.sheetHeight;
            var flatX = R + (isFront ? 1 : -1) * s;
            var flatZ = 0;
            var flatY = yLocal * state.sheetHeight;
            var distToDetach = s - unrolledLength;
            var wx, wy, wz;
            if (distToDetach < -state.transitionLength / 2) {
                wx = flatX; wy = flatY; wz = flatZ;
            } else if (distToDetach > state.transitionLength / 2) {
                wx = rolledX; wy = rolledY; wz = rolledZ;
            } else {
                var t = smoothstep(-state.transitionLength / 2, state.transitionLength / 2, distToDetach);
                wx = flatX + (rolledX - flatX) * t;
                wy = flatY + (rolledY - flatY) * t;
                wz = flatZ + (rolledZ - flatZ) * t;
            }
            pos.setXYZ(i, wx, wy, wz);
            uv.setXY(i, s / totalLength, yLocal + 0.5);
        }
        geom.computeVertexNormals();
        return geom;
    };

    effect._createCompositeCanvas = function(items) {
        var stripHeight = 2048;
        var itemWidth = 2048;
        if (!items || items.length === 0) {
            var empty = document.createElement('canvas');
            empty.width = itemWidth;
            empty.height = stripHeight;
            var ectx = empty.getContext('2d');
            ectx.fillStyle = 'rgba(255,255,255,0.04)';
            ectx.fillRect(0, 0, empty.width, empty.height);
            ectx.fillStyle = '#ffffff';
            ectx.font = '48px Inter, sans-serif';
            ectx.textAlign = 'center';
            ectx.fillText('Sin contenido', empty.width / 2, empty.height / 2);
            return empty;
        }
        var totalWidth = items.length * itemWidth;
        var maxTexWidth = 8192;
        var width = Math.min(totalWidth, maxTexWidth);
        var scaleX = width / totalWidth;
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = stripHeight;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        items.forEach(function(item, idx) {
            var el = item && item.element;
            if (!el) return;
            if (item.type === 'video') el.play().catch(function() {});
            var sw = item.type === 'video' ? el.videoWidth : el.naturalWidth;
            var sh = item.type === 'video' ? el.videoHeight : el.naturalHeight;
            if (!sw || !sh) return;
            var slotW = itemWidth * scaleX;
            var slotH = stripHeight;
            var dx = idx * slotW;
            var scale = Math.max(slotW / sw, slotH / sh);
            var destW = sw * scale;
            var destH = sh * scale;
            var destX = dx + (slotW - destW) / 2;
            var destY = (slotH - destH) / 2;
            try { ctx.drawImage(el, 0, 0, sw, sh, destX, destY, destW, destH); } catch(e) {}
        });
        return canvas;
    };

    effect._createTexture = function(items) {
        var tex = new THREE.CanvasTexture(this._createCompositeCanvas(items));
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        return tex;
    };

    effect._createParchmentMaterial = function(texture) {
        var mat = new THREE.MeshStandardMaterial({
            map: texture,
            bumpMap: this._state.bumpTexture,
            bumpScale: 0.015,
            roughness: 0.5,
            metalness: 0.02,
            side: THREE.DoubleSide
        });
        mat.toneMapped = false;
        return mat;
    };

    effect._createBrandOverlay = function(group) {
        var canvas = document.createElement('canvas');
        canvas.width = 1536;
        canvas.height = 512;
        this._brandCanvas = canvas;
        this._brandCtx = canvas.getContext('2d');
        var tex = new THREE.CanvasTexture(canvas);
        this._brandTex = tex;
        var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.7), mat);
        mesh.position.set(-1.25, 1.4, 1.5);
        group.add(mesh);
        this._drawBrand();
    };

    effect._drawBrand = function() {
        if (!this._brandCtx) return;
        var ctx = this._brandCtx;
        var c = this._brandCanvas;
        ctx.clearRect(0, 0, c.width, c.height);
        var groupLogo = this.settings.mediaGroups && this.settings.mediaGroups.logo;
        var logoIndex = groupLogo !== null && groupLogo !== undefined ? groupLogo : Math.floor(this.settings.logoSlot || 0) - 1;
        var logo = logoIndex >= 0 ? this._mediaList[logoIndex] : null;
        if (logo && logo.element) {
            try {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(40, 34, 92, 92, 20) : ctx.rect(40, 34, 92, 92);
                ctx.clip();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(40, 34, 92, 92);
                ctx.drawImage(logo.element, 40, 34, 92, 92);
                ctx.restore();
            } catch(e) {}
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 82px Arial, sans-serif';
        ctx.fillText(this.settings.brandTitle || '', logo ? 158 : 40, 130);
        ctx.font = '400 34px Arial, sans-serif';
        ctx.fillText(this.settings.brandSubtitle || '', 44, 200);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(44, 250, 390, 86);
        ctx.fillStyle = '#000000';
        ctx.font = '800 34px Arial, sans-serif';
        ctx.fillText((this.settings.ctaText || '').toUpperCase(), 75, 305);
        this._brandTex.needsUpdate = true;
    };

    effect.update = function(time, dt) {
        if (!this.group || !this._frontMesh || !this._backMesh) return;
        if (EP.Core && EP.Core.scene) EP.Core.scene.background = new THREE.Color(this.settings.background);
        this._syncSideSelection(false);
        this._updateBackground(false);
        this._drawBrand();
        var state = this._state;
        state.sheetHeight = 2.2 * this.settings.sheetHeight / 100;
        var motion = this.settings.playbackMotion !== 'off' ? this.settings.playbackMotionSpeed / 100 : 0;
        if (this.settings.loopMode === 'on') {
            state.targetProgress = (state.targetProgress + 0.004 * motion * this.settings.speedFine / 50) % 1;
        } else if (!this._pointer.down) {
            state.targetProgress += state.velocity;
            state.velocity *= 0.92;
            state.targetProgress += ((this.settings.progress / 100) - state.targetProgress) * 0.015;
            state.targetProgress = Math.max(-0.02, Math.min(1.02, state.targetProgress));
        }
        var lerp = 1 - Math.exp(-8 * (dt || 0.016));
        state.progress += (state.targetProgress - state.progress) * lerp;
        if (this._frontMesh.geometry) this._frontMesh.geometry.dispose();
        if (this._backMesh.geometry) this._backMesh.geometry.dispose();
        this._frontMesh.geometry = this._buildSheetGeometry(state.progress, true);
        this._backMesh.geometry = this._buildSheetGeometry(state.progress, false);
        if (this._frontItems.concat(this._backItems).some(function(m) { return m.type === 'video'; })) {
            this._frontTexture.dispose();
            this._backTexture.dispose();
            this._frontTexture = this._createTexture(this._frontItems);
            this._backTexture = this._createTexture(this._backItems);
            this._frontMesh.material.map = this._frontTexture;
            this._backMesh.material.map = this._backTexture;
            this._frontMesh.material.needsUpdate = true;
            this._backMesh.material.needsUpdate = true;
        }
        this.group.scale.setScalar(this.settings.outputSize / 100);
        if (EP.Core && EP.Core.camera) {
            EP.Core.camera.position.set(0, 0.1, 7.5);
            EP.Core.camera.lookAt(1.15, 0, 0);
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
