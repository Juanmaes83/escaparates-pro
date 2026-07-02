(function() {
    var effect = new EP.EffectBase('fiesta-truchets-pro', {
        name: 'Fiesta Truchets PRO',
        category: 'shader-premium',
        icon: 'FT',
        description: 'Patron Truchet/hexagonal premium con color festivo, extrusion falsa y movimiento procedural'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'tileScale', type: 'range', min: 20, max: 180, default: 82, step: 1, label: 'Tile Scale', unit: '%' },
        { key: 'colorSpeed', type: 'range', min: 0, max: 200, default: 80, step: 1, label: 'Color Speed', unit: '%' },
        { key: 'lineWeight', type: 'range', min: 10, max: 180, default: 72, step: 1, label: 'Line Weight', unit: '%' },
        { key: 'depthGlow', type: 'range', min: 0, max: 200, default: 96, step: 1, label: 'Depth Glow', unit: '%' },
        { key: 'background', type: 'color', default: '#050306', label: 'Background' }
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
        'uniform float uScale;',
        'uniform float uColorSpeed;',
        'uniform float uWeight;',
        'uniform float uGlow;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(27.609,57.583))) * 43758.5453); }',
        'vec3 hsv(float h, float s, float v){ vec3 rgb=clamp(abs(mod(h*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0); return v*mix(vec3(1.0),rgb,s); }',
        'float arc(vec2 p, vec2 c, float r, float w){ return smoothstep(w, 0.0, abs(length(p-c)-r)); }',
        'void main(){',
        '  vec2 uv = vUv * 2.0 - 1.0;',
        '  uv.x *= 1.777;',
        '  uv *= rot(uTime*0.045);',
        '  uv *= mix(3.0, 11.0, uScale);',
        '  vec2 id = floor(uv);',
        '  vec2 f = fract(uv) - 0.5;',
        '  float h = hash(id);',
        '  float choose = floor(h * 4.0);',
        '  if(choose < 1.0) f *= rot(1.5708);',
        '  else if(choose < 2.0) f *= rot(3.14159);',
        '  else if(choose < 3.0) f *= rot(-1.5708);',
        '  float w = mix(0.012, 0.08, uWeight);',
        '  float a1 = arc(f, vec2(-0.5,-0.5), 0.5, w);',
        '  float a2 = arc(f, vec2(0.5,0.5), 0.5, w);',
        '  float a3 = arc(f, vec2(-0.5,0.5), 0.5, w*0.75) * step(0.55, h);',
        '  float mask = clamp(a1+a2+a3, 0.0, 1.0);',
        '  float pulse = 0.5 + 0.5*sin(uTime*1.4 + h*6.28);',
        '  vec3 fiesta = hsv(h*0.65 + uTime*0.05*uColorSpeed, 0.92, 0.95);',
        '  vec3 col = mix(uBackground, fiesta, mask);',
        '  col += fiesta * mask * pulse * 0.25 * uGlow;',
        '  col += smoothstep(0.04, 0.0, abs(fract(uv.x+uv.y+uTime*.25)-.5)-.47) * fiesta * 0.06;',
        '  gl_FragColor = vec4(pow(col, vec3(0.82)), 1.0);',
        '}'
    ].join('\n');

    effect.build = function() {
        var group = new THREE.Group();
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: this.settings.tileScale / 100 },
                uColorSpeed: { value: this.settings.colorSpeed / 100 },
                uWeight: { value: this.settings.lineWeight / 100 },
                uGlow: { value: this.settings.depthGlow / 100 },
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
        u.uScale.value = this.settings.tileScale / 100;
        u.uColorSpeed.value = this.settings.colorSpeed / 100;
        u.uWeight.value = this.settings.lineWeight / 100;
        u.uGlow.value = this.settings.depthGlow / 100;
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
    EP.Registry.get('fiesta-truchets-pro').capabilities.exportSafe = true;
})();
