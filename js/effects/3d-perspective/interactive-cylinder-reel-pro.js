(function() {
    var effect = new EP.EffectBase('interactive-cylinder-reel-pro', {
        name: 'Interactive Cylinder Reel PRO',
        category: '3d-perspective',
        icon: 'IC',
        description: 'Cilindro interactivo con textura compuesta de imagenes y videos, inercia, cursor y loop exportable'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 130, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 80, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'left-right', l: 'Izquierda a derecha' }, { v: 'right-left', l: 'Derecha a izquierda' }], default: 'right-left', label: 'Motion Direction' },
        { key: 'radius', type: 'range', min: 60, max: 220, default: 120, step: 1, label: 'Radius', unit: '%' },
        { key: 'height', type: 'range', min: 45, max: 190, default: 92, step: 1, label: 'Height', unit: '%' },
        { key: 'panelCount', type: 'range', min: 4, max: 18, default: 9, step: 1, label: 'Panels' },
        { key: 'focusWindow', type: 'range', min: 10, max: 95, default: 48, step: 1, label: 'Front Window', unit: '%' },
        { key: 'cursorPower', type: 'range', min: 0, max: 220, default: 110, step: 1, label: 'Cursor Boost', unit: '%' },
        { key: 'background', type: 'color', default: '#dfe7eb', label: 'Background' }
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

    function makeStripTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        var texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return { canvas: canvas, ctx: canvas.getContext('2d'), texture: texture };
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._mediaList = mediaList || [];
        if (!this._mediaList.length) return group;
        this._strip = makeStripTexture();
        var mat = new THREE.MeshBasicMaterial({ map: this._strip.texture, side: THREE.DoubleSide, transparent: true, opacity: 0.98 });
        var geo = new THREE.CylinderGeometry(2.4, 2.4, 3.4, 128, 1, true, Math.PI * 0.12, Math.PI * 1.76);
        this._mesh = new THREE.Mesh(geo, mat);
        this._mesh.rotation.z = Math.PI / 2;
        this._mesh.rotation.x = Math.PI / 2;
        group.add(this._mesh);
        this._pointer = { x: 0, y: 0, boost: 0 };
        this._onPointerMove = function(ev) {
            var rect = EP.Core && EP.Core.renderer ? EP.Core.renderer.domElement.getBoundingClientRect() : { left: 0, top: 0, width: 1, height: 1 };
            this._pointer.x = ((ev.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
            this._pointer.y = ((ev.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
            this._pointer.boost = 1;
        }.bind(this);
        if (EP.Core && EP.Core.renderer) EP.Core.renderer.domElement.addEventListener('pointermove', this._onPointerMove);
        this.group = group;
        this._drawStrip(0, true);
        return group;
    };

    effect._drawStrip = function(time, force) {
        if (!this._strip || (!force && time - (this._lastDraw || 0) < 0.05 && !this._hasVideo)) return;
        this._lastDraw = time;
        var c = this._strip.canvas;
        var ctx = this._strip.ctx;
        var media = this._mediaList || [];
        var count = Math.max(1, Math.min(media.length || 1, Math.floor(this.settings.panelCount)));
        ctx.fillStyle = '#f5f6f1';
        ctx.fillRect(0, 0, c.width, c.height);
        this._hasVideo = false;
        for (var i = 0; i < count; i++) {
            var item = media[i % media.length];
            var x = i * c.width / count;
            var w = c.width / count;
            ctx.fillStyle = i % 2 ? '#111111' : '#eeeeee';
            ctx.fillRect(x, 0, w, c.height);
            if (item && item.element) {
                if (item.type === 'video') this._hasVideo = true;
                try {
                    var el = item.element;
                    var iw = el.videoWidth || el.naturalWidth || el.width || 1;
                    var ih = el.videoHeight || el.naturalHeight || el.height || 1;
                    var s = Math.max(w / iw, c.height / ih);
                    var dw = iw * s;
                    var dh = ih * s;
                    ctx.drawImage(el, x + (w - dw) / 2, (c.height - dh) / 2, dw, dh);
                } catch (e) {}
            }
            ctx.strokeStyle = 'rgba(255,255,255,0.72)';
            ctx.lineWidth = 8;
            ctx.strokeRect(x + 8, 8, w - 16, c.height - 16);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(0, 0, c.width, 54);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 32px Arial, sans-serif';
        ctx.fillText('INTERACTIVE REEL', 42, 38);
        this._strip.texture.needsUpdate = true;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._mesh) return;
        if (EP.Core && EP.Core.scene) EP.Core.scene.background = new THREE.Color(this.settings.background || '#dfe7eb');
        this._drawStrip(time, false);
        var radius = this.settings.radius / 100;
        var height = this.settings.height / 100;
        this._mesh.scale.set(radius, height, radius);
        var motion = this.settings.playbackMotion !== 'off' ? this.settings.playbackMotionSpeed / 100 : 0;
        var dir = this.settings.motionDirection === 'left-right' ? 1 : -1;
        this._pointer.boost *= 0.88;
        var cursor = this._pointer.x * this.settings.cursorPower / 100 * this._pointer.boost;
        this.group.rotation.y = time * 0.42 * motion * dir + cursor;
        this.group.rotation.x = -0.18 + this._pointer.y * 0.08;
        this.group.position.z = Math.sin(time * 0.35) * 0.12;
        if (EP.Core && EP.Core.camera) {
            EP.Core.camera.position.z = 9.5;
            EP.Core.camera.lookAt(0, 0, 0);
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
