(function() {
    var effect = new EP.EffectBase('pergamino-interactivo-3d-new', {
        name: 'Pergamino Interactivo 3D NEW',
        category: '3d-perspective',
        icon: 'PG',
        description: 'Pergamino frontal 3D con anverso, reverso, logo, textos, video y fondo seleccionados por slots'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 135, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 55, step: 1, label: 'Playback Speed', unit: '%' },
        {
            key: 'mediaGroups',
            type: 'slotGroups',
            label: 'Medios Pergamino',
            default: { front: [0, 1, 2], back: [3, 4, 5], background: null, logo: null },
            groups: [
                { key: 'front', label: 'Anverso orden 1º, 2º, 3º', mode: 'multi' },
                { key: 'back', label: 'Reverso orden 1º, 2º, 3º', mode: 'multi' },
                { key: 'background', label: 'Fondo imagen/video', mode: 'single' },
                { key: 'logo', label: 'Logo', mode: 'single' }
            ]
        },
        { key: 'title', type: 'text', default: 'Coleccion Otono 2026', label: 'Titulo', maxLength: 70 },
        { key: 'subtitle', type: 'text', default: 'Desliza para explorar el pergamino.', label: 'Subtitulo', maxLength: 110 },
        { key: 'cta', type: 'text', default: 'Explorar coleccion', label: 'CTA', maxLength: 50 },
        { key: 'progress', type: 'range', min: 0, max: 100, default: 50, step: 1, label: 'Desenrolle', unit: '%' },
        { key: 'loopMode', type: 'select', options: [{ v: 'off', l: 'Bucle OFF' }, { v: 'on', l: 'Bucle ON' }], default: 'off', label: 'Bucle' },
        { key: 'sensitivity', type: 'range', min: 1, max: 220, default: 75, step: 1, label: 'Sensibilidad', unit: '%' },
        { key: 'sheetHeight', type: 'range', min: 60, max: 180, default: 100, step: 1, label: 'Altura hoja', unit: '%' },
        { key: 'curlRadius', type: 'range', min: 35, max: 140, default: 70, step: 1, label: 'Radio rollo', unit: '%' },
        { key: 'background', type: 'color', default: '#0a0a0e', label: 'Fondo color' }
    ]);

    effect.capabilities = { supportsMotionDirection: false, supportsVideo: true, usesCamera: true, usesPostProcessing: false, usesParticlesShaders: false, mobileRisk: 'medium', minMedia: 1, exportSafe: true, hasErrorBoundary: true };

    function pickSlots(media, indexes) {
        return (indexes || []).map(function(i) { return (media || [])[i]; }).filter(Boolean);
    }
    function mediaAspect(media) {
        var el = media && media.element;
        return el ? (el.videoWidth || el.naturalWidth || el.width || 1) / Math.max(1, el.videoHeight || el.naturalHeight || el.height || 1) : 1;
    }
    function drawCover(ctx, media, x, y, w, h) {
        if (!media || !media.element) return;
        var el = media.element;
        if (media.type === 'video') el.play().catch(function() {});
        var iw = el.videoWidth || el.naturalWidth || el.width || 1;
        var ih = el.videoHeight || el.naturalHeight || el.height || 1;
        var scale = Math.max(w / iw, h / ih);
        var dw = iw * scale, dh = ih * scale;
        try { ctx.drawImage(el, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); } catch(e) {}
    }
    function smoothstep(a, b, x) {
        var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
    }

    effect.build = function(mediaList) {
        this._allMedia = (EP.Media && EP.Media.slots) ? EP.Media.slots : (mediaList || []);
        var group = new THREE.Group();
        this._state = { progress: this.settings.progress / 100, target: this.settings.progress / 100, velocity: 0, totalLength: 4.2, radius: 0.45, segments: 260 };
        this._syncGroups(true);
        this._createBackground(group);
        this._createCylinder(group);
        this._frontTex = this._makeTexture(this._frontItems, 'ANVERSO');
        this._backTex = this._makeTexture(this._backItems, 'REVERSO');
        this._frontMesh = new THREE.Mesh(this._buildSheetGeometry(this._state.progress, true), this._makeMaterial(this._frontTex));
        this._backMesh = new THREE.Mesh(this._buildSheetGeometry(this._state.progress, false), this._makeMaterial(this._backTex));
        group.add(this._frontMesh);
        group.add(this._backMesh);
        this._createBrand(group);
        this._pointer = { down: false, x: 0 };
        this._onWheel = function(e) { this._state.velocity += e.deltaY * 0.00055 * this.settings.sensitivity / 75; }.bind(this);
        this._onDown = function(e) { this._pointer.down = true; this._pointer.x = e.clientX; }.bind(this);
        this._onMove = function(e) {
            if (!this._pointer.down) return;
            var dx = e.clientX - this._pointer.x;
            this._state.target += dx * 0.0011 * this.settings.sensitivity / 75;
            this._state.velocity = dx * 0.00035;
            this._pointer.x = e.clientX;
        }.bind(this);
        this._onUp = function() { this._pointer.down = false; }.bind(this);
        if (EP.Core && EP.Core.renderer) {
            var dom = EP.Core.renderer.domElement;
            dom.addEventListener('wheel', this._onWheel, { passive: true });
            dom.addEventListener('pointerdown', this._onDown);
            dom.addEventListener('pointermove', this._onMove);
            dom.addEventListener('pointerup', this._onUp);
            dom.addEventListener('pointerleave', this._onUp);
        }
        this.group = group;
        return group;
    };

    effect._syncGroups = function(force) {
        var g = this.settings.mediaGroups || {};
        var key = JSON.stringify(g);
        if (!force && key === this._groupsKey) return false;
        this._groupsKey = key;
        this._frontItems = pickSlots(this._allMedia, g.front || [0, 1, 2]);
        this._backItems = pickSlots(this._allMedia, g.back || [3, 4, 5]);
        if (!this._backItems.length) this._backItems = this._frontItems.slice().reverse();
        this._bgMedia = g.background !== null && g.background !== undefined ? this._allMedia[g.background] : null;
        this._logoMedia = g.logo !== null && g.logo !== undefined ? this._allMedia[g.logo] : null;
        this._state.totalLength = Math.max(2.2, Math.max(this._frontItems.length, this._backItems.length, 1) * 1.45);
        return true;
    };

    effect._createBackground = function(group) {
        this._bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(this.settings.background), side: THREE.DoubleSide, transparent: true, opacity: 1, depthWrite: false }));
        this._bgPlane.position.z = -2.8;
        group.add(this._bgPlane);
        this._updateBackground(true);
    };

    effect._updateBackground = function(force) {
        if (!this._bgPlane) return;
        var mat = this._bgPlane.material;
        var key = (this._bgMedia ? this._bgMedia.url + this._bgMedia.type : 'color') + this.settings.background;
        if (!force && key === this._bgKey && !(this._bgMedia && this._bgMedia.type === 'video')) return;
        this._bgKey = key;
        if (!this._bgMedia) {
            if (mat.map) { mat.map.dispose(); mat.map = null; }
            mat.color = new THREE.Color(this.settings.background);
        } else {
            if (!mat.map || force) {
                if (mat.map) mat.map.dispose();
                mat.map = EP.Media.createTexture(this._bgMedia);
            }
            mat.color = new THREE.Color('#ffffff');
            EP.Media.updateMaterial(mat);
        }
        mat.needsUpdate = true;
    };

    effect._createCylinder = function(group) {
        var r = this._state.radius;
        var h = 1.3 * this.settings.sheetHeight / 100;
        var cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64), new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.32, metalness: 0.6 }));
        group.add(cyl);
    };

    effect._buildSheetGeometry = function(progress, front) {
        var r = this._state.radius * this.settings.curlRadius / 70;
        var total = this._state.totalLength;
        var unrolled = progress * total;
        var height = 1.3 * this.settings.sheetHeight / 100;
        var geom = new THREE.PlaneGeometry(1, 1, this._state.segments, 1);
        var pos = geom.attributes.position, uv = geom.attributes.uv;
        for (var i = 0; i < pos.count; i++) {
            var u = pos.getX(i), yl = pos.getY(i);
            var s = (u + 0.5) * total;
            var wx, wy = yl * height, wz;
            if (s <= unrolled) {
                var d = unrolled - s;
                wx = r + (front ? 1 : -1) * d;
                wz = 0;
            } else {
                var remain = Math.max(0.001, total - unrolled);
                var angle = (s - unrolled) / remain * Math.PI;
                wx = r * Math.cos(angle);
                wz = (front ? 1 : -1) * r * Math.sin(angle);
            }
            var blend = smoothstep(unrolled - 0.08, unrolled + 0.08, s);
            pos.setXYZ(i, wx, wy, wz + blend * 0.012 * (front ? 1 : -1));
            uv.setXY(i, s / total, yl + 0.5);
        }
        geom.computeVertexNormals();
        return geom;
    };

    effect._makeTexture = function(items, label) {
        var c = document.createElement('canvas');
        c.width = Math.min(8192, Math.max(1, items.length) * 1536);
        c.height = 1536;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#0c0c10';
        ctx.fillRect(0, 0, c.width, c.height);
        var w = c.width / Math.max(1, items.length);
        if (!items.length) {
            ctx.fillStyle = '#fff';
            ctx.font = '80px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, c.width / 2, c.height / 2);
        }
        items.forEach(function(media, i) {
            drawCover(ctx, media, i * w, 0, w, c.height);
            ctx.fillStyle = 'rgba(0,0,0,.35)';
            ctx.fillRect(i * w, 0, 130, 80);
            ctx.fillStyle = '#fff';
            ctx.font = '48px Arial';
            ctx.fillText((i + 1) + 'º', i * w + 24, 56);
        });
        var tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        return tex;
    };

    effect._makeMaterial = function(tex) {
        return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.48, metalness: 0.02, side: THREE.DoubleSide, toneMapped: false });
    };

    effect._createBrand = function(group) {
        var c = document.createElement('canvas');
        c.width = 1536; c.height = 512;
        this._brandCanvas = c; this._brandCtx = c.getContext('2d');
        this._brandTex = new THREE.CanvasTexture(c);
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.6), new THREE.MeshBasicMaterial({ map: this._brandTex, transparent: true, depthTest: false }));
        mesh.position.set(-1.35, 1.45, 1.1);
        group.add(mesh);
        this._drawBrand();
    };

    effect._drawBrand = function() {
        var ctx = this._brandCtx, c = this._brandCanvas;
        if (!ctx) return;
        ctx.clearRect(0, 0, c.width, c.height);
        if (this._logoMedia && this._logoMedia.element) {
            try { ctx.drawImage(this._logoMedia.element, 44, 42, 88, 88); } catch(e) {}
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 74px Arial';
        ctx.fillText(this.settings.title || '', this._logoMedia ? 160 : 44, 112);
        ctx.font = '36px Arial';
        ctx.fillText(this.settings.subtitle || '', 48, 190);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(48, 246, 360, 76);
        ctx.fillStyle = '#000';
        ctx.font = '800 30px Arial';
        ctx.fillText((this.settings.cta || '').toUpperCase(), 74, 292);
        this._brandTex.needsUpdate = true;
    };

    effect.update = function(time, dt) {
        if (!this.group) return;
        var changed = this._syncGroups(false);
        if (changed) {
            if (this._frontTex) this._frontTex.dispose();
            if (this._backTex) this._backTex.dispose();
            this._frontTex = this._makeTexture(this._frontItems, 'ANVERSO');
            this._backTex = this._makeTexture(this._backItems, 'REVERSO');
            this._frontMesh.material.map = this._frontTex;
            this._backMesh.material.map = this._backTex;
            this._frontMesh.material.needsUpdate = true;
            this._backMesh.material.needsUpdate = true;
        }
        this._updateBackground(false);
        this._drawBrand();
        var moving = this.settings.playbackMotion !== 'off' ? this.settings.playbackMotionSpeed / 100 : 0;
        if (this.settings.loopMode === 'on') this._state.target = (this._state.target + 0.0035 * moving) % 1;
        else if (!this._pointer.down) {
            this._state.target += this._state.velocity;
            this._state.velocity *= 0.92;
            this._state.target += (this.settings.progress / 100 - this._state.target) * 0.018;
        }
        this._state.target = Math.max(0, Math.min(1, this._state.target));
        this._state.progress += (this._state.target - this._state.progress) * (1 - Math.exp(-8 * (dt || 0.016)));
        this._frontMesh.geometry.dispose();
        this._backMesh.geometry.dispose();
        this._frontMesh.geometry = this._buildSheetGeometry(this._state.progress, true);
        this._backMesh.geometry = this._buildSheetGeometry(this._state.progress, false);
        if (this._frontItems.concat(this._backItems).some(function(m) { return m.type === 'video'; })) {
            this._frontTex.dispose(); this._backTex.dispose();
            this._frontTex = this._makeTexture(this._frontItems, 'ANVERSO');
            this._backTex = this._makeTexture(this._backItems, 'REVERSO');
            this._frontMesh.material.map = this._frontTex;
            this._backMesh.material.map = this._backTex;
        }
        this.group.scale.setScalar(this.settings.outputSize / 100);
        if (EP.Core && EP.Core.camera) {
            EP.Core.camera.position.set(0, 0, 7.5);
            EP.Core.camera.lookAt(0.45, 0, 0);
            EP.Core.camera.updateProjectionMatrix();
            EP.Core.scene.background = new THREE.Color(this.settings.background);
        }
    };

    effect.dispose = function() {
        if (EP.Core && EP.Core.renderer) {
            var d = EP.Core.renderer.domElement;
            d.removeEventListener('wheel', this._onWheel);
            d.removeEventListener('pointerdown', this._onDown);
            d.removeEventListener('pointermove', this._onMove);
            d.removeEventListener('pointerup', this._onUp);
            d.removeEventListener('pointerleave', this._onUp);
        }
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
