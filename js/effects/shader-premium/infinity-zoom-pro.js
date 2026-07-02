(function() {
    var effect = new EP.EffectBase('infinity-zoom-pro', {
        name: 'Infinity Zoom PRO',
        category: 'shader-premium',
        icon: 'IZ',
        description: 'Fondo shader premium con zoom log-polar, tunel infinito y mezcla opcional de imagen/video'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'zoomSpeed', type: 'range', min: 0, max: 220, default: 96, step: 1, label: 'Zoom Speed', unit: '%' },
        { key: 'tunnelScale', type: 'range', min: 25, max: 220, default: 100, step: 1, label: 'Tunnel Scale', unit: '%' },
        { key: 'complexity', type: 'range', min: 1, max: 8, default: 4, step: 1, label: 'Complexity' },
        { key: 'colorShift', type: 'range', min: 0, max: 200, default: 72, step: 1, label: 'Color Shift', unit: '%' },
        { key: 'mediaBlend', type: 'range', min: 0, max: 100, default: 18, step: 1, label: 'Media Blend', unit: '%' },
        { key: 'background', type: 'color', default: '#040409', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'medium',
        minMedia: 0,
        exportSafe: true,
        hasErrorBoundary: true
    };

    var vertexShader = [
        'varying vec2 vUv;',
        'void main(){',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var fragmentShader = [
        'uniform sampler2D uTexture;',
        'uniform float uHasTexture;',
        'uniform float uTime;',
        'uniform float uZoomSpeed;',
        'uniform float uTunnelScale;',
        'uniform float uComplexity;',
        'uniform float uColorShift;',
        'uniform float uMediaBlend;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }',
        'float tile(vec2 p){',
        '  vec2 q = fract(p) - 0.5;',
        '  float box = max(abs(q.x), abs(q.y));',
        '  float line = smoothstep(0.045, 0.018, abs(box - 0.38));',
        '  float crossA = smoothstep(0.035, 0.01, abs(q.x)) + smoothstep(0.035, 0.01, abs(q.y));',
        '  return clamp(line + crossA * 0.35, 0.0, 1.0);',
        '}',
        'void main(){',
        '  vec2 uv = vUv * 2.0 - 1.0;',
        '  uv.x *= 1.777;',
        '  float r = length(uv) + 0.0005;',
        '  float a = atan(uv.y, uv.x);',
        '  float z = -log(r) * uTunnelScale + uTime * uZoomSpeed;',
        '  vec2 p = vec2(a / 6.28318 * uComplexity + sin(z * 0.25) * 0.35, z);',
        '  p *= rot(sin(uTime * 0.13) * 0.22);',
        '  float acc = 0.0;',
        '  float glow = 0.0;',
        '  for(int i=0; i<5; i++){',
        '    float fi = float(i);',
        '    vec2 pp = p * (1.0 + fi * 0.18) + vec2(fi * 0.37, -fi * 0.21);',
        '    float v = tile(pp);',
        '    acc += v / (1.0 + fi);',
        '    glow += smoothstep(0.06, 0.0, abs(fract(pp.y) - 0.5)) / (1.5 + fi);',
        '  }',
        '  float fog = smoothstep(1.45, 0.05, r);',
        '  vec3 palette = 0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + acc * 5.0 + uColorShift + z * 0.12);',
        '  vec3 col = mix(uBackground, palette, clamp(acc, 0.0, 1.0));',
        '  col += glow * palette * 0.55;',
        '  col *= fog;',
        '  vec4 media = texture2D(uTexture, vUv);',
        '  col = mix(col, media.rgb * (0.75 + palette * 0.55), uMediaBlend * uHasTexture);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    function makeFallbackTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 4;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 4, 4);
        var tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var hasMedia = mediaList && mediaList.length && mediaList[0].element;
        var tex = hasMedia ? EP.Media.createTexture(mediaList[0], { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }) : makeFallbackTexture();
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: tex },
                uHasTexture: { value: hasMedia ? 1 : 0 },
                uTime: { value: 0 },
                uZoomSpeed: { value: this.settings.zoomSpeed / 100 },
                uTunnelScale: { value: this.settings.tunnelScale / 100 },
                uComplexity: { value: this.settings.complexity },
                uColorShift: { value: this.settings.colorShift / 100 },
                uMediaBlend: { value: this.settings.mediaBlend / 100 },
                uBackground: { value: new THREE.Color(this.settings.background) }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 7.1), mat);
        group.add(mesh);
        this._mesh = mesh;
        this._texture = tex;
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._mesh || !this._mesh.material) return;
        var enabled = this.settings.playbackMotion !== 'off';
        var speed = enabled ? this.settings.playbackMotionSpeed / 100 : 0;
        var mat = this._mesh.material;
        if (this._texture && this._texture.isVideoTexture) this._texture.needsUpdate = true;
        mat.uniforms.uTime.value = time * speed;
        mat.uniforms.uZoomSpeed.value = this.settings.zoomSpeed / 100;
        mat.uniforms.uTunnelScale.value = this.settings.tunnelScale / 100;
        mat.uniforms.uComplexity.value = this.settings.complexity;
        mat.uniforms.uColorShift.value = this.settings.colorShift / 100;
        mat.uniforms.uMediaBlend.value = this.settings.mediaBlend / 100;
        mat.uniforms.uBackground.value.set(this.settings.background);
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.camera.position.set(0, 0, 10);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        this._mesh = null;
        this._texture = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
    EP.Registry.get('infinity-zoom-pro').capabilities.exportSafe = true;
})();
