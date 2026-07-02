(function() {
    var effect = new EP.EffectBase('video-dither-glyph-pro', {
        name: 'Video Dither Glyph PRO',
        category: 'shader-premium',
        icon: 'DG',
        description: 'Imagen o video convertido en glifos/dither de alto contraste con color opcional y movimiento exportable'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'glyphScale', type: 'range', min: 20, max: 180, default: 72, step: 1, label: 'Glyph Scale' },
        { key: 'contrast', type: 'range', min: 50, max: 220, default: 125, step: 1, label: 'Contrast', unit: '%' },
        { key: 'brightness', type: 'range', min: 0, max: 200, default: 100, step: 1, label: 'Brightness', unit: '%' },
        { key: 'mixOriginal', type: 'range', min: 0, max: 100, default: 18, step: 1, label: 'Original Mix', unit: '%' },
        { key: 'colorMode', type: 'select', options: [{ v: 'mono', l: 'Mono' }, { v: 'source', l: 'Source Color' }, { v: 'neon', l: 'Neon' }], default: 'source', label: 'Color Mode' },
        { key: 'foreground', type: 'color', default: '#f7f4df', label: 'Foreground' },
        { key: 'background', type: 'color', default: '#050608', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'medium',
        minMedia: 1,
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
        'uniform float uTime;',
        'uniform float uGlyphScale;',
        'uniform float uContrast;',
        'uniform float uBrightness;',
        'uniform float uMixOriginal;',
        'uniform int uColorMode;',
        'uniform vec3 uForeground;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
        'float glyph(vec2 f, float lum){',
        '  vec2 c = abs(f - 0.5);',
        '  float crossA = smoothstep(0.13, 0.10, c.x) + smoothstep(0.13, 0.10, c.y);',
        '  float diag = smoothstep(0.09, 0.04, abs(f.x - f.y));',
        '  float ring = smoothstep(0.24, 0.20, length(c)) - smoothstep(0.12, 0.16, length(c));',
        '  float dotp = smoothstep(0.22, 0.02, length(c));',
        '  if(lum < 0.25) return dotp;',
        '  if(lum < 0.50) return max(dotp, diag * 0.75);',
        '  if(lum < 0.75) return max(ring, crossA * 0.45);',
        '  return max(crossA, ring);',
        '}',
        'void main(){',
        '  vec2 uv = vUv;',
        '  vec2 grid = floor(uv * uGlyphScale);',
        '  vec2 f = fract(uv * uGlyphScale);',
        '  vec2 suv = (grid + 0.5) / uGlyphScale;',
        '  vec4 src = texture2D(uTexture, suv);',
        '  float lum = clamp((luma(src.rgb) - 0.5) * uContrast + 0.5, 0.0, 1.0) * uBrightness;',
        '  float n = hash(grid + floor(uTime * 8.0));',
        '  float mask = glyph(f, lum);',
        '  mask *= step(n * 0.18, lum + 0.08);',
        '  vec3 ink = uForeground;',
        '  if(uColorMode == 1) ink = src.rgb;',
        '  if(uColorMode == 2) ink = 0.55 + 0.45 * cos(vec3(0.0, 2.1, 4.2) + lum * 6.283 + uTime);',
        '  vec3 col = mix(uBackground, ink, mask);',
        '  col = mix(col, src.rgb, uMixOriginal);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var media = mediaList[0];
        var tex = EP.Media.createTexture(media, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
        var el = media.element;
        var aspect = (el.videoWidth || el.naturalWidth || el.width || 16) / Math.max(1, (el.videoHeight || el.naturalHeight || el.height || 9));
        var w = aspect >= 1 ? 8.4 : 8.4 * aspect;
        var h = aspect >= 1 ? 8.4 / aspect : 8.4;
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: tex },
                uTime: { value: 0 },
                uGlyphScale: { value: this.settings.glyphScale },
                uContrast: { value: this.settings.contrast / 100 },
                uBrightness: { value: this.settings.brightness / 100 },
                uMixOriginal: { value: this.settings.mixOriginal / 100 },
                uColorMode: { value: 1 },
                uForeground: { value: new THREE.Color(this.settings.foreground) },
                uBackground: { value: new THREE.Color(this.settings.background) }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        group.add(mesh);
        this._mesh = mesh;
        this._texture = tex;
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._mesh || !this._mesh.material) return;
        var mat = this._mesh.material;
        if (this._texture && this._texture.isVideoTexture) this._texture.needsUpdate = true;
        var enabled = this.settings.playbackMotion !== 'off';
        var speed = enabled ? this.settings.playbackMotionSpeed / 100 : 0;
        mat.uniforms.uTime.value = time * speed;
        mat.uniforms.uGlyphScale.value = this.settings.glyphScale;
        mat.uniforms.uContrast.value = this.settings.contrast / 100;
        mat.uniforms.uBrightness.value = this.settings.brightness / 100;
        mat.uniforms.uMixOriginal.value = this.settings.mixOriginal / 100;
        mat.uniforms.uColorMode.value = this.settings.colorMode === 'mono' ? 0 : (this.settings.colorMode === 'neon' ? 2 : 1);
        mat.uniforms.uForeground.value.set(this.settings.foreground);
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
    EP.Registry.get('video-dither-glyph-pro').capabilities.exportSafe = true;
})();
