(function() {
    var effect = new EP.EffectBase('deco-tile-pro', {
        name: 'Deco Tile PRO',
        category: 'shader-premium',
        icon: 'DT',
        description: 'Patron Art Deco log-polar con tunel ornamental, color suave y loop continuo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'warpScale', type: 'range', min: 20, max: 220, default: 100, step: 1, label: 'Warp Scale', unit: '%' },
        { key: 'tileRows', type: 'range', min: 3, max: 12, default: 6, step: 1, label: 'Tile Rows' },
        { key: 'ornament', type: 'range', min: 0, max: 200, default: 105, step: 1, label: 'Ornament', unit: '%' },
        { key: 'colorShift', type: 'range', min: 0, max: 200, default: 70, step: 1, label: 'Color Shift', unit: '%' },
        { key: 'background', type: 'color', default: '#07050a', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: false,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'medium',
        minMedia: 0,
        exportSafe: true,
        hasErrorBoundary: true
    };

    var vertexShader = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
    var fragmentShader = [
        'uniform float uTime;',
        'uniform float uWarp;',
        'uniform float uRows;',
        'uniform float uOrnament;',
        'uniform float uColorShift;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }',
        'float hash(vec2 a){ return fract(sin(dot(a, vec2(27.609, 57.583))) * 43758.5453); }',
        'vec3 hsv(float h, float s, float v){ vec3 rgb=clamp(abs(mod(h*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0); return v*mix(vec3(1.0),rgb,s); }',
        'float box(vec2 p, vec2 b){ vec2 q=abs(p)-b; return min(max(q.x,q.y),0.0)+length(max(q,0.0)); }',
        'void main(){',
        '  vec2 uv = vUv * 2.0 - 1.0;',
        '  uv.x *= 1.777;',
        '  uv *= rot(-uTime*0.08);',
        '  float r = max(0.002, length(uv));',
        '  vec2 lp = -vec2(log(r), atan(uv.y, uv.x)) / 3.14159;',
        '  lp *= uRows * uWarp;',
        '  lp.x += uTime * 0.38;',
        '  vec2 cell = floor(lp);',
        '  vec2 f = fract(lp) - 0.5;',
        '  float h = hash(cell);',
        '  float rail = smoothstep(0.04, 0.0, abs(box(f, vec2(0.44,0.18))) - 0.02);',
        '  float circle = smoothstep(0.045, 0.0, abs(length(f - vec2(0.28*sin(h*6.28+uTime),0.0)) - 0.22));',
        '  float stripe = smoothstep(0.03, 0.0, abs(abs(f.y)-0.28));',
        '  float mask = clamp(rail + circle*uOrnament + stripe*0.35, 0.0, 1.0);',
        '  vec3 pal = hsv(h*0.45 + uColorShift + uTime*0.015, 0.58, 0.92);',
        '  vec3 gold = vec3(1.0, 0.72, 0.34);',
        '  vec3 col = mix(uBackground, mix(pal, gold, 0.35), mask);',
        '  col *= smoothstep(1.55, 0.05, r);',
        '  col += gold * mask * 0.10;',
        '  gl_FragColor = vec4(pow(col, vec3(0.86)), 1.0);',
        '}'
    ].join('\n');

    effect.build = function() {
        var group = new THREE.Group();
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uWarp: { value: this.settings.warpScale / 100 },
                uRows: { value: this.settings.tileRows },
                uOrnament: { value: this.settings.ornament / 100 },
                uColorShift: { value: this.settings.colorShift / 100 },
                uBackground: { value: new THREE.Color(this.settings.background) }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
        this._mesh = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 7.1), mat);
        group.add(this._mesh);
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._mesh) return;
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var u = this._mesh.material.uniforms;
        u.uTime.value = time * speed;
        u.uWarp.value = this.settings.warpScale / 100;
        u.uRows.value = this.settings.tileRows;
        u.uOrnament.value = this.settings.ornament / 100;
        u.uColorShift.value = this.settings.colorShift / 100;
        u.uBackground.value.set(this.settings.background);
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.camera.position.set(0, 0, 10);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        this._mesh = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
    EP.Registry.get('deco-tile-pro').capabilities.exportSafe = true;
})();
