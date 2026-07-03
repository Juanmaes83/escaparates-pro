(function() {
    var effect = new EP.EffectBase('text-pressure-3d', {
        name: 'TextPressure 3D',
        category: 'text',
        icon: '🫸',
        description: 'Texto volumétrico de partículas que se hunde o se atrae bajo la presión del cursor con retorno elástico — la imagen o video del cliente permanece legible detrás'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'mainText',   type: 'text', default: 'PRESSURE', label: 'Texto' },
        { key: 'fontSize',   type: 'range', min: 40, max: 200, default: 150, step: 10, label: 'Tamaño fuente', unit: 'px' },
        { key: 'colorBase',  type: 'color', default: '#e8f0ff', label: 'Color base' },
        { key: 'colorPress', type: 'color', default: '#ff3366', label: 'Color bajo presión' },
        { key: 'pressMode', type: 'select', options: [
            { v: 'repel',   l: 'Repeler (hundir)' },
            { v: 'attract', l: 'Atraer (imán)' }
        ], default: 'repel', label: 'Modo presión' },
        { key: 'influenceRadius', type: 'range', min: 20, max: 250, default: 110, step: 10, label: 'Radio influencia', unit: '%' },
        { key: 'maxPressure', type: 'range', min: 10, max: 300, default: 130, step: 10, label: 'Presión máxima', unit: '%' },
        { key: 'elasticity', type: 'range', min: 1, max: 30, default: 10, step: 1, label: 'Elasticidad' },
        { key: 'particleSize', type: 'range', min: 10, max: 300, default: 100, step: 10, label: 'Tamaño partícula', unit: '%' },
        { key: 'bgOverlay', type: 'range', min: 0, max: 90, default: 30, step: 5, label: 'Oscurecer fondo', unit: '%' },
        { key: 'maxParticles', type: 'range', min: 10000, max: 120000, default: 40000, step: 5000, label: 'Máx. partículas' }
    ]);

    var _vert = [
        'attribute float aRand;',
        'attribute float aDepthT;',
        'uniform float uTime;',
        'uniform vec2 uMouse;',
        'uniform float uRadius;',
        'uniform float uPressure;',
        'uniform float uMode;',           // 1 = repel, -1 = attract
        'uniform float uSize;',
        'varying float vPress;',
        'varying float vRand;',
        'void main() {',
        '  vec3 pos = position;',
        // Idle breathing so the text is alive without input
        '  pos.z += sin(uTime * 0.8 + pos.x * 1.7 + aRand * 6.28) * 0.03;',
        // Pressure field around the (smoothed) cursor
        '  vec2 d = pos.xy - uMouse;',
        '  float dist = length(d);',
        '  float press = 0.0;',
        '  if (dist < uRadius) {',
        '    float f = 1.0 - dist / uRadius;',
        '    press = f * f * uPressure;',
        '    vec2 dir = (dist > 0.0001) ? normalize(d) : vec2(0.0);',
        '    pos.xy += dir * press * 0.55 * uMode;',
        '    pos.z  -= press * 1.1 * uMode;',       // repel sinks, attract lifts
        '  }',
        '  vPress = clamp(press, 0.0, 1.0);',
        '  vRand = aRand;',
        '  vec4 mv = modelViewMatrix * vec4(pos, 1.0);',
        '  gl_PointSize = uSize * (26.0 / -mv.z) * (0.65 + aRand * 0.7) * (1.0 + vPress * 0.8);',
        '  gl_Position = projectionMatrix * mv;',
        '}'
    ].join('\n');

    var _frag = [
        'uniform vec3 uColorBase;',
        'uniform vec3 uColorPress;',
        'varying float vPress;',
        'varying float vRand;',
        'void main() {',
        '  vec2 c = gl_PointCoord - 0.5;',
        '  float d = length(c);',
        '  if (d > 0.5) discard;',
        '  float core = smoothstep(0.5, 0.15, d);',
        '  float glow = exp(-d * d * 8.0);',
        '  vec3 col = mix(uColorBase, uColorPress, vPress);',
        '  col *= (0.7 + glow * 0.5);',
        '  gl_FragColor = vec4(col, core * (0.4 + 0.35 * vRand + vPress * 0.3));',
        '}'
    ].join('\n');

    function rasterTextPoints(text, fontPx, count) {
        var W = 1024, H = 512;
        var cvs = document.createElement('canvas');
        cvs.width = W; cvs.height = H;
        var ctx = cvs.getContext('2d');
        ctx.fillStyle = '#fff';
        var size = fontPx;
        ctx.font = '900 ' + size + 'px Arial, sans-serif';
        while (size > 20 && ctx.measureText(text).width > W * 0.9) {
            size -= 8;
            ctx.font = '900 ' + size + 'px Arial, sans-serif';
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, W / 2, H / 2);
        var data;
        try { data = ctx.getImageData(0, 0, W, H).data; } catch (e) { return null; }
        var cand = [];
        for (var y = 0; y < H; y += 2) {
            for (var x = 0; x < W; x += 2) {
                if (data[(y * W + x) * 4 + 3] > 128) cand.push(x, y);
            }
        }
        var n = cand.length / 2;
        if (!n) return null;
        var pos = new Float32Array(count * 3);
        var rand = new Float32Array(count);
        var depthT = new Float32Array(count);
        for (var i = 0; i < count; i++) {
            var pick = (Math.random() * n) | 0;
            var dz = Math.random();
            pos[i * 3]     = (cand[pick * 2] / W - 0.5) * 8 + (Math.random() - 0.5) * 0.015;
            pos[i * 3 + 1] = -(cand[pick * 2 + 1] / H - 0.5) * 4.5 + (Math.random() - 0.5) * 0.015;
            pos[i * 3 + 2] = (dz - 0.5) * 0.35;
            rand[i] = Math.random();
            depthT[i] = dz;
        }
        return { pos: pos, rand: rand, depthT: depthT };
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._m0 = (mediaList && mediaList[0]) || null;
        // Media stays legible behind the text at all times
        this._overlayMat = null;
        if (this._m0) {
            var bgMat = EP.Media.createMaterial(this._m0);
            bgMat.opacity = 1.0;
            var bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), bgMat);
            bgMesh.position.z = -0.1;
            group.add(bgMesh);
            // Subtle darkening scrim for text contrast (user-controllable)
            var ovMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false });
            var ovMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), ovMat);
            ovMesh.position.z = -0.05;
            group.add(ovMesh);
            this._overlayMat = ovMat;
        }
        this._points = null;
        this._uniforms = null;
        this._sig = '';
        this._mx = 0; this._my = 0;
        this._smx = 99; this._smy = 99;   // smoothed (elastic) cursor
        this._hasMouse = false;

        var self = this;
        var dom = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
        if (dom) {
            this._onMouseMove = function(e) {
                var r = dom.getBoundingClientRect();
                self._mx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
                self._my = -((e.clientY - r.top)  / r.height - 0.5) * 2;
                if (!self._hasMouse) { self._smx = self._mx * 4; self._smy = self._my * 2.25; }
                self._hasMouse = true;
            };
            dom.addEventListener('mousemove', this._onMouseMove);
            this._dom = dom;
        }

        this.group = group;
        return group;
    };

    effect._rebuildParticles = function() {
        var count = Math.max(1000, Math.round(this.settings.maxParticles));
        var r = rasterTextPoints(this.settings.mainText || 'PRESSURE', this.settings.fontSize, count);
        if (!r) return false;

        if (this._points) {
            this.group.remove(this._points);
            this._points.geometry.dispose();
            this._points.material.dispose();
            this._points = null;
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(r.pos, 3));
        geo.setAttribute('aRand', new THREE.BufferAttribute(r.rand, 1));
        geo.setAttribute('aDepthT', new THREE.BufferAttribute(r.depthT, 1));

        this._uniforms = {
            uTime:       { value: 0 },
            uMouse:      { value: new THREE.Vector2(99, 99) },
            uRadius:     { value: 1.1 },
            uPressure:   { value: 1.3 },
            uMode:       { value: 1 },
            uSize:       { value: 1 },
            uColorBase:  { value: new THREE.Color(this.settings.colorBase || '#e8f0ff') },
            uColorPress: { value: new THREE.Color(this.settings.colorPress || '#ff3366') }
        };
        var mat = new THREE.ShaderMaterial({
            vertexShader: _vert, fragmentShader: _frag,
            uniforms: this._uniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this._points = new THREE.Points(geo, mat);
        this._points.position.z = 0.1;
        this.group.add(this._points);
        return true;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        dt = Math.min(dt || 0.016, 0.05);

        var sig = [this.settings.mainText, this.settings.fontSize, this.settings.maxParticles].join('|');
        if (sig !== this._sig) {
            if (this._rebuildParticles()) this._sig = sig;
        }
        if (!this._points || !this._uniforms) return;

        // Elastic cursor: smoothed position lags behind the real one
        if (this._hasMouse) {
            var ease = Math.min(1, dt * this.settings.elasticity);
            this._smx += (this._mx * 4    - this._smx) * ease;
            this._smy += (this._my * 2.25 - this._smy) * ease;
        }

        var u = this._uniforms;
        u.uTime.value = time;
        u.uMouse.value.set(this._smx, this._smy);
        u.uRadius.value = (this.settings.influenceRadius / 100) * 1.3;
        u.uPressure.value = (this.settings.maxPressure / 100) * 1.0;
        u.uMode.value = this.settings.pressMode === 'attract' ? -1 : 1;
        u.uSize.value = (this.settings.particleSize / 100) * 3.4;
        u.uColorBase.value.set(this.settings.colorBase || '#e8f0ff');
        u.uColorPress.value.set(this.settings.colorPress || '#ff3366');

        if (this._overlayMat) this._overlayMat.opacity = this.settings.bgOverlay / 100;
    };

    effect.dispose = function() {
        if (this._dom && this._onMouseMove) this._dom.removeEventListener('mousemove', this._onMouseMove);
        this._dom = null; this._onMouseMove = null;
        this._points = null; this._uniforms = null; this._overlayMat = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
