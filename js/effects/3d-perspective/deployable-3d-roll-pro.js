(function() {
    var effect = new EP.EffectBase('deployable-3d-roll-pro', {
        name: 'Rollo 3D Desplegable PRO',
        category: '3d-perspective',
        icon: 'RD',
        description: 'Rollo 3D desplegable con anverso y reverso, logo, textos, CTA y respuesta al cursor'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 135, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 65, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'brand', type: 'text', default: 'NORTHDUNE', label: 'Brand' },
        { key: 'headline', type: 'text', default: 'Built for the in-between.', label: 'Headline' },
        { key: 'cta', type: 'text', default: 'Shop collection', label: 'CTA' },
        { key: 'logoSlot', type: 'range', min: 1, max: 15, default: 1, step: 1, label: 'Logo Slot' },
        { key: 'unroll', type: 'range', min: 5, max: 100, default: 72, step: 1, label: 'Deploy', unit: '%' },
        { key: 'curlRadius', type: 'range', min: 20, max: 160, default: 82, step: 1, label: 'Curl Radius', unit: '%' },
        { key: 'cursorPower', type: 'range', min: 0, max: 240, default: 130, step: 1, label: 'Cursor Deploy', unit: '%' },
        { key: 'height', type: 'range', min: 45, max: 150, default: 86, step: 1, label: 'Height', unit: '%' },
        { key: 'reverseDarkness', type: 'range', min: 0, max: 90, default: 46, step: 1, label: 'Reverse Darkness', unit: '%' },
        { key: 'background', type: 'color', default: '#dfe7eb', label: 'Background' }
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

    function makeCanvasTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 3072;
        canvas.height = 1024;
        var texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return { canvas: canvas, ctx: canvas.getContext('2d'), texture: texture };
    }

    function buildRollGeometry(width, height, progress, curlRadius, front) {
        var segs = 96;
        var positions = [];
        var uvs = [];
        var indices = [];
        var deployed = Math.max(0.05, Math.min(1, progress));
        var curlWidth = Math.max(0.55, Math.min(width * 0.48, width * (1 - deployed + 0.14)));
        var r = curlRadius;
        for (var i = 0; i <= segs; i++) {
            var u = i / segs;
            var xFlat = -width / 2 + width * u;
            var x = xFlat;
            var z = 0;
            if (u < curlWidth / width) {
                var cu = 1 - u / (curlWidth / width);
                var angle = cu * Math.PI * 1.38;
                x = -width / 2 + curlWidth - Math.sin(angle) * r;
                z = front ? (Math.cos(angle) - 1) * r : -(Math.cos(angle) - 1) * r - 0.025;
            } else {
                x = -width / 2 + (u * width);
                z = front ? 0 : -0.035;
            }
            positions.push(x, -height / 2, z, x, height / 2, z);
            uvs.push(u, 0, u, 1);
        }
        for (var s = 0; s < segs; s++) {
            var a = s * 2;
            indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._mediaList = mediaList || [];
        if (!this._mediaList.length) return group;
        this._front = makeCanvasTexture();
        this._back = makeCanvasTexture();
        this._frontMat = new THREE.MeshBasicMaterial({ map: this._front.texture, side: THREE.FrontSide, transparent: true, opacity: 0.98 });
        this._backMat = new THREE.MeshBasicMaterial({ map: this._back.texture, side: THREE.BackSide, transparent: true, opacity: 0.96 });
        this._frontMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this._frontMat);
        this._backMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this._backMat);
        group.add(this._backMesh);
        group.add(this._frontMesh);
        this._pointer = { x: 0, y: 0, boost: 0 };
        this._onPointerMove = function(ev) {
            var rect = EP.Core && EP.Core.renderer ? EP.Core.renderer.domElement.getBoundingClientRect() : { left: 0, top: 0, width: 1, height: 1 };
            this._pointer.x = (ev.clientX - rect.left) / Math.max(1, rect.width);
            this._pointer.y = ((ev.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
            this._pointer.boost = 1;
        }.bind(this);
        if (EP.Core && EP.Core.renderer) EP.Core.renderer.domElement.addEventListener('pointermove', this._onPointerMove);
        this.group = group;
        this._drawTextures(0, true);
        this._lastGeoKey = '';
        return group;
    };

    effect._drawTextures = function(time, force) {
        if (!this._front || (!force && time - (this._lastDraw || 0) < 0.07 && !this._hasVideo)) return;
        this._lastDraw = time;
        var media = this._mediaList || [];
        var canvases = [this._front, this._back];
        this._hasVideo = false;
        for (var ci = 0; ci < canvases.length; ci++) {
            var c = canvases[ci].canvas;
            var ctx = canvases[ci].ctx;
            ctx.fillStyle = ci ? '#101114' : '#f4f1ea';
            ctx.fillRect(0, 0, c.width, c.height);
            var panels = 4;
            for (var i = 0; i < panels; i++) {
                var item = media[(i + ci * panels) % media.length];
                var x = i * c.width / panels;
                var w = c.width / panels;
                ctx.fillStyle = (i + ci) % 2 ? '#ffffff' : '#e4ddd2';
                ctx.fillRect(x + 10, 90, w - 20, c.height - 150);
                if (item && item.element) {
                    if (item.type === 'video') this._hasVideo = true;
                    try {
                        var el = item.element;
                        var iw = el.videoWidth || el.naturalWidth || el.width || 1;
                        var ih = el.videoHeight || el.naturalHeight || el.height || 1;
                        var s = Math.max((w - 34) / iw, (c.height - 190) / ih);
                        var dw = iw * s;
                        var dh = ih * s;
                        ctx.drawImage(el, x + 17 + (w - 34 - dw) / 2, 110 + (c.height - 190 - dh) / 2, dw, dh);
                    } catch (e) {}
                }
                ctx.fillStyle = ci ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.08)';
                ctx.fillRect(x + 10, 90, w - 20, c.height - 150);
                ctx.strokeStyle = ci ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)';
                ctx.lineWidth = 5;
                ctx.strokeRect(x + 10, 90, w - 20, c.height - 150);
            }
            ctx.fillStyle = ci ? '#f6f6f6' : '#06070a';
            ctx.font = '900 62px Arial, sans-serif';
            ctx.letterSpacing = '8px';
            ctx.fillText(String(this.settings.brand || 'BRAND').toUpperCase(), 72, 72);
            ctx.font = '900 88px Arial, sans-serif';
            ctx.fillText(this.settings.headline || '', c.width * 0.48, c.height * 0.46);
            ctx.font = '700 42px Arial, sans-serif';
            ctx.fillText((this.settings.cta || '').toUpperCase(), c.width * 0.48, c.height * 0.58);
            ctx.fillStyle = ci ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
            ctx.fillRect(0, c.height - 58, c.width, 58);
            canvases[ci].texture.needsUpdate = true;
        }
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._frontMesh || !this._backMesh) return;
        if (EP.Core && EP.Core.scene) EP.Core.scene.background = new THREE.Color(this.settings.background || '#dfe7eb');
        this._drawTextures(time, false);
        var motion = this.settings.playbackMotion !== 'off' ? this.settings.playbackMotionSpeed / 100 : 0;
        this._pointer.boost *= 0.9;
        var auto = 0.5 + 0.5 * Math.sin(time * 0.33 * motion);
        var cursor = this._pointer.boost ? this._pointer.x : 0.5;
        var deploy = (this.settings.unroll / 100) * 0.72 + Math.max(auto, cursor) * this.settings.cursorPower / 100 * 0.28;
        deploy = Math.max(0.08, Math.min(1, deploy));
        var width = 8.8;
        var height = 3.85 * this.settings.height / 100;
        var r = 0.52 * this.settings.curlRadius / 100;
        var key = deploy.toFixed(3) + '/' + height.toFixed(2) + '/' + r.toFixed(2);
        if (key !== this._lastGeoKey) {
            if (this._frontMesh.geometry) this._frontMesh.geometry.dispose();
            if (this._backMesh.geometry) this._backMesh.geometry.dispose();
            this._frontMesh.geometry = buildRollGeometry(width, height, deploy, r, true);
            this._backMesh.geometry = buildRollGeometry(width, height, deploy, r, false);
            this._lastGeoKey = key;
        }
        this._backMat.opacity = 1 - this.settings.reverseDarkness / 170;
        this.group.position.x = 0.28;
        this.group.rotation.x = -0.05 + this._pointer.y * 0.035;
        this.group.rotation.y = -0.08;
        if (EP.Core && EP.Core.camera) {
            EP.Core.camera.position.set(0, 0.2, 10.5);
            EP.Core.camera.lookAt(0.05, 0, 0);
            EP.Core.camera.updateProjectionMatrix();
        }
    };

    effect.dispose = function() {
        if (EP.Core && EP.Core.renderer && this._onPointerMove) {
            EP.Core.renderer.domElement.removeEventListener('pointermove', this._onPointerMove);
        }
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
