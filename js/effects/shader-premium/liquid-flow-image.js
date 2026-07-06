// Liquid Flow Image — original take on "distort a photo like heat-haze/liquid
// glass" (concept only, no code borrowed): a single custom ShaderMaterial
// samples the client's image through a time-driven, two-octave sine warp of
// the UV coordinates, with a subtle per-channel color drift so the flow reads
// as translucent liquid rather than a cheap wobble. Cheaper than a full fluid
// sim (no render-to-texture passes) so it stays smooth even on mid-range GPUs.
(function() {
    var effect = new EP.EffectBase('liquid-flow-image', {
        name: 'Liquid Flow Image',
        category: 'shader-premium',
        icon: '🌊',
        description: 'La imagen del cliente fluye como liquido o cristal caliente mediante un shader propio de distorsion de UV, con leve deriva de color'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'speed', type: 'range', min: 0, max: 200, default: 100, step: 5, label: 'Velocidad del flujo', unit: '%' },
        { key: 'intensity', type: 'range', min: 0, max: 100, default: 45, step: 5, label: 'Intensidad de distorsion', unit: '%' },
        { key: 'flowScale', type: 'range', min: 1, max: 40, default: 10, step: 1, label: 'Escala del patron' },
        { key: 'colorShift', type: 'range', min: 0, max: 100, default: 20, step: 5, label: 'Deriva de color', unit: '%' }
    ]);

    var VERT = 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

    var FRAG = [
        'precision highp float;',
        'uniform sampler2D uMedia;',
        'uniform bool uHasMedia;',
        'uniform float uTime;',
        'uniform float uIntensity;',
        'uniform float uFlowScale;',
        'uniform float uColorShift;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 uv = vUv;',
        '  float wobbleX = sin(uv.y * uFlowScale + uTime) + 0.5 * sin(uv.y * uFlowScale * 2.3 - uTime * 1.7);',
        '  float wobbleY = cos(uv.x * uFlowScale - uTime * 1.15) + 0.5 * cos(uv.x * uFlowScale * 1.8 + uTime * 0.8);',
        '  vec2 flow = vec2(wobbleX, wobbleY) * uIntensity;',
        '  vec2 dUv = clamp(uv + flow, 0.001, 0.999);',
        '  vec3 color;',
        '  if (uHasMedia) {',
        '    float shiftAmt = uColorShift * 0.02;',
        '    float r = texture2D(uMedia, clamp(dUv + vec2(shiftAmt, 0.0), 0.001, 0.999)).r;',
        '    float g = texture2D(uMedia, dUv).g;',
        '    float b = texture2D(uMedia, clamp(dUv - vec2(shiftAmt, 0.0), 0.001, 0.999)).b;',
        '    color = vec3(r, g, b);',
        '  } else {',
        '    vec3 c1 = vec3(0.10, 0.35, 0.55);',
        '    vec3 c2 = vec3(0.55, 0.20, 0.45);',
        '    color = mix(c1, c2, 0.5 + 0.5 * sin(dUv.x * 6.0 + uTime));',
        '  }',
        '  gl_FragColor = vec4(color, 1.0);',
        '}'
    ].join('\n');

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var media = mediaList && mediaList[0];
        this._tex = media ? EP.Media.createTexture(media) : null;

        var geo = new THREE.PlaneGeometry(8, 4.5, 1, 1);
        this._mat = new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            uniforms: {
                uMedia: { value: this._tex },
                uHasMedia: { value: !!this._tex },
                uTime: { value: 0 },
                uIntensity: { value: this.settings.intensity / 1000 },
                uFlowScale: { value: this.settings.flowScale },
                uColorShift: { value: this.settings.colorShift }
            }
        });
        var mesh = new THREE.Mesh(geo, this._mat);
        group.add(mesh);
        this._elapsed = 0;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt) {
        if (!this._mat) return;
        if (this._tex) EP.Media.updateTexture(this._tex);
        var speedFactor = (this.settings.speed || 100) / 100;
        if (this.settings.playbackMotion !== 'off') {
            this._elapsed += (dt || 0.016) * speedFactor;
        }
        this._mat.uniforms.uTime.value = this._elapsed;
        this._mat.uniforms.uIntensity.value = this.settings.intensity / 1000;
        this._mat.uniforms.uFlowScale.value = this.settings.flowScale;
        this._mat.uniforms.uColorShift.value = this.settings.colorShift;
    };

    effect.dispose = function() {
        if (this._tex && typeof this._tex.dispose === 'function') this._tex.dispose();
        this._tex = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
