(function() {
    var effect = new EP.EffectBase('infinite-falling-pro', {
        name: 'Infinite Falling PRO',
        category: 'shader-premium',
        icon: 'IF',
        description: 'Ilusion de caida infinita con bloques 3D, profundidad y patrones modulares'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'fallDepth', type: 'range', min: 20, max: 240, default: 125, step: 1, label: 'Fall Depth', unit: '%' },
        { key: 'tileDensity', type: 'range', min: 20, max: 200, default: 100, step: 1, label: 'Tile Density', unit: '%' },
        { key: 'reflection', type: 'range', min: 0, max: 200, default: 95, step: 1, label: 'Reflection', unit: '%' },
        { key: 'accentColor', type: 'color', default: '#f5d36b', label: 'Accent Color' },
        { key: 'background', type: 'color', default: '#070706', label: 'Background' }
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
        'uniform float uDepth;',
        'uniform float uDensity;',
        'uniform float uReflection;',
        'uniform vec2 uDirection;',
        'uniform vec3 uAccent;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(23.43,35.23))) * 4742.3523); }',
        'float box(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.0))+min(max(d.x,d.y),0.0); }',
        'void main(){',
        '  vec2 uv = vUv*2.0-1.0;',
        '  uv.x *= 1.777;',
        '  vec2 dir = length(uDirection) < 0.1 ? vec2(0.0,-1.0) : normalize(uDirection);',
        '  vec3 col = uBackground;',
        '  float glow = 0.0;',
        '  for(int i=0;i<18;i++){',
        '    float fi = float(i);',
        '    float z = fract(fi/18.0 + uTime*0.08*uDepth);',
        '    float scale = mix(0.18, 2.2, z);',
        '    vec2 p = uv/scale + dir*uTime*0.08 + vec2(sin(fi*2.1), cos(fi*1.7))*0.35;',
        '    p *= rot(fi*0.21 + uTime*0.05);',
        '    vec2 grid = p * (2.2 + uDensity*4.0);',
        '    vec2 id = floor(grid);',
        '    vec2 f = fract(grid)-0.5;',
        '    float h = hash(id+fi);',
        '    float arc = abs(length(f-vec2(sign(h-0.5)*0.5, -sign(h-0.5)*0.5))-0.48)-0.045;',
        '    float shape = smoothstep(0.03, 0.0, min(abs(box(f, vec2(0.42,0.12)))-0.02, arc));',
        '    vec3 tile = mix(vec3(0.10,0.09,0.08), uAccent, 0.35+0.55*h);',
        '    col += tile * shape * (1.0-z) * 0.18;',
        '    glow += shape * (1.0-z);',
        '  }',
        '  col += uAccent * glow * 0.04 * uReflection;',
        '  col *= smoothstep(1.45, 0.05, length(uv));',
        '  gl_FragColor = vec4(pow(max(col,0.0), vec3(0.82)), 1.0);',
        '}'
    ].join('\n');

    function directionVector(value) {
        if (value === 'ltr') return new THREE.Vector2(1, 0);
        if (value === 'rtl') return new THREE.Vector2(-1, 0);
        if (value === 'ttb') return new THREE.Vector2(0, -1);
        if (value === 'btt') return new THREE.Vector2(0, 1);
        return new THREE.Vector2(0, 0);
    }

    effect.build = function() {
        var group = new THREE.Group();
        this._mesh = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 7.1), new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uDepth: { value: this.settings.fallDepth / 100 },
                uDensity: { value: this.settings.tileDensity / 100 },
                uReflection: { value: this.settings.reflection / 100 },
                uDirection: { value: directionVector(this.settings.motionDirection) },
                uAccent: { value: new THREE.Color(this.settings.accentColor) },
                uBackground: { value: new THREE.Color(this.settings.background) }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        }));
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
        u.uDepth.value = this.settings.fallDepth / 100;
        u.uDensity.value = this.settings.tileDensity / 100;
        u.uReflection.value = this.settings.reflection / 100;
        u.uDirection.value.copy(directionVector(this.settings.motionDirection));
        u.uAccent.value.set(this.settings.accentColor);
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
})();
