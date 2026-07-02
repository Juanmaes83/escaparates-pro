(function() {
    var effect = new EP.EffectBase('infinity-machine-pro', {
        name: 'Infinity Machine PRO',
        category: 'shader-premium',
        icon: 'IM',
        description: 'Maquina infinita tipo SDF con estructura modular, profundidad transparente y movimiento mecanico'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'machineSpeed', type: 'range', min: 0, max: 220, default: 105, step: 1, label: 'Machine Speed', unit: '%' },
        { key: 'density', type: 'range', min: 20, max: 180, default: 86, step: 1, label: 'Density', unit: '%' },
        { key: 'depthGlow', type: 'range', min: 0, max: 200, default: 120, step: 1, label: 'Depth Glow', unit: '%' },
        { key: 'cameraDrift', type: 'range', min: 0, max: 200, default: 70, step: 1, label: 'Camera Drift', unit: '%' },
        { key: 'accentColor', type: 'color', default: '#78f7ff', label: 'Accent Color' },
        { key: 'background', type: 'color', default: '#020307', label: 'Background' }
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

    var vertexShader = [
        'varying vec2 vUv;',
        'void main(){',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var fragmentShader = [
        'uniform float uTime;',
        'uniform float uDensity;',
        'uniform float uGlow;',
        'uniform float uDrift;',
        'uniform vec3 uAccent;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }',
        'float box(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.0))+min(max(max(q.x,q.y),q.z),0.0); }',
        'float sphere(vec3 p, float r){ return length(p)-r; }',
        'float hash(vec3 p){ return fract(sin(dot(p, vec3(17.7, 41.3, 91.9))) * 43758.5453); }',
        'float mapMachine(vec3 p){',
        '  float cell = mix(2.8, 1.35, clamp(uDensity,0.0,1.0));',
        '  vec3 id = floor((p + cell * 0.5) / cell);',
        '  vec3 q = mod(p + cell * 0.5, cell) - cell * 0.5;',
        '  float h = hash(id);',
        '  q += vec3(sin(uTime+h*6.0), cos(uTime*0.8+h*3.0), sin(uTime*1.1+h))*0.10;',
        '  float railA = box(abs(q)-vec3(cell*.38,cell*.38,0.0), vec3(0.045,0.045,cell*.34));',
        '  float railB = box(abs(q)-vec3(cell*.38,0.0,cell*.38), vec3(0.045,cell*.34,0.045));',
        '  float railC = box(abs(q)-vec3(0.0,cell*.38,cell*.38), vec3(cell*.34,0.045,0.045));',
        '  float core = sphere(q, 0.11 + h*0.08);',
        '  return min(min(min(railA,railB),railC), core);',
        '}',
        'void main(){',
        '  vec2 uv = vUv * 2.0 - 1.0;',
        '  uv.x *= 1.777;',
        '  float drift = uDrift;',
        '  vec3 ro = vec3(sin(uTime*.18)*1.2*drift, cos(uTime*.15)*0.75*drift, -5.2);',
        '  vec3 rd = normalize(vec3(uv, 1.22));',
        '  rd.xz = rot(sin(uTime*.12)*0.22*drift) * rd.xz;',
        '  rd.yz = rot(cos(uTime*.11)*0.15*drift) * rd.yz;',
        '  float t = 0.0;',
        '  float glow = 0.0;',
        '  float hit = 0.0;',
        '  for(int i=0; i<58; i++){',
        '    vec3 p = ro + rd * t;',
        '    p.z += uTime * 2.4;',
        '    float d = mapMachine(p);',
        '    glow += 0.012 / (0.015 + abs(d));',
        '    if(d < 0.008){ hit = 1.0; break; }',
        '    t += clamp(abs(d) * 0.48, 0.018, 0.22);',
        '  }',
        '  vec3 col = uBackground;',
        '  col += uAccent * glow * 0.035 * uGlow;',
        '  col += vec3(hit) * mix(vec3(0.35), uAccent, 0.65);',
        '  col *= smoothstep(8.5, 1.2, t);',
        '  gl_FragColor = vec4(pow(col, vec3(0.85)), 1.0);',
        '}'
    ].join('\n');

    effect.build = function() {
        var group = new THREE.Group();
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uDensity: { value: this.settings.density / 100 },
                uGlow: { value: this.settings.depthGlow / 100 },
                uDrift: { value: this.settings.cameraDrift / 100 },
                uAccent: { value: new THREE.Color(this.settings.accentColor) },
                uBackground: { value: new THREE.Color(this.settings.background) }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 7.1), mat);
        group.add(mesh);
        this._mesh = mesh;
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._mesh) return;
        var enabled = this.settings.playbackMotion !== 'off';
        var speed = enabled ? this.settings.playbackMotionSpeed / 100 : 0;
        var m = this._mesh.material.uniforms;
        m.uTime.value = time * speed * this.settings.machineSpeed / 100;
        m.uDensity.value = this.settings.density / 100;
        m.uGlow.value = this.settings.depthGlow / 100;
        m.uDrift.value = this.settings.cameraDrift / 100;
        m.uAccent.value.set(this.settings.accentColor);
        m.uBackground.value.set(this.settings.background);
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.camera.position.set(0, 0, 10);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        this._mesh = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
    EP.Registry.get('infinity-machine-pro').capabilities.exportSafe = true;
})();
