(function() {
    var effect = new EP.EffectBase('everything-is-fine-pro', {
        name: 'Everything Is Fine PRO',
        category: 'shader-premium',
        icon: 'EF',
        description: 'Anillo de energia tipo feedback fluid adaptado a shader single-pass exportable'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'ringEnergy', type: 'range', min: 20, max: 240, default: 130, step: 1, label: 'Ring Energy', unit: '%' },
        { key: 'fluidChaos', type: 'range', min: 0, max: 220, default: 110, step: 1, label: 'Fluid Chaos', unit: '%' },
        { key: 'heat', type: 'range', min: 0, max: 220, default: 125, step: 1, label: 'Heat', unit: '%' },
        { key: 'colorA', type: 'color', default: '#ff3b1f', label: 'Hot Color' },
        { key: 'colorB', type: 'color', default: '#ffe45c', label: 'Core Color' },
        { key: 'background', type: 'color', default: '#050207', label: 'Background' }
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
        'uniform float uEnergy;',
        'uniform float uChaos;',
        'uniform float uHeat;',
        'uniform vec2 uDirection;',
        'uniform vec3 uColorA;',
        'uniform vec3 uColorB;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }',
        'float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y); }',
        'void main(){',
        '  vec2 uv = vUv*2.0-1.0;',
        '  uv.x *= 1.777;',
        '  vec2 dir = length(uDirection) < 0.1 ? vec2(0.18, -0.32) : normalize(uDirection);',
        '  vec2 p = uv + dir*uTime*0.10;',
        '  float r = length(p);',
        '  float a = atan(p.y, p.x);',
        '  float turb = noise(vec2(a*3.0 + uTime*0.6, r*5.0-uTime*0.9));',
        '  turb += 0.5*noise(p*5.0 + uTime*0.35);',
        '  float ring = smoothstep(0.055, 0.0, abs(r - (0.42 + 0.05*sin(a*7.0+uTime))) - 0.02*uEnergy);',
        '  float inner = smoothstep(0.58, 0.08, r) * smoothstep(0.0, 0.48, r);',
        '  float flame = smoothstep(0.32, 1.25, turb*uChaos + ring*1.6 + inner*0.42);',
        '  vec3 col = uBackground;',
        '  col = mix(col, uColorA, flame*0.7*uHeat);',
        '  col = mix(col, uColorB, ring*0.85);',
        '  col += uColorA * pow(max(ring,0.0), 3.0) * 0.9;',
        '  col *= smoothstep(1.45, 0.10, length(uv));',
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
                uEnergy: { value: this.settings.ringEnergy / 100 },
                uChaos: { value: this.settings.fluidChaos / 100 },
                uHeat: { value: this.settings.heat / 100 },
                uDirection: { value: directionVector(this.settings.motionDirection) },
                uColorA: { value: new THREE.Color(this.settings.colorA) },
                uColorB: { value: new THREE.Color(this.settings.colorB) },
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
        u.uEnergy.value = this.settings.ringEnergy / 100;
        u.uChaos.value = this.settings.fluidChaos / 100;
        u.uHeat.value = this.settings.heat / 100;
        u.uDirection.value.copy(directionVector(this.settings.motionDirection));
        u.uColorA.value.set(this.settings.colorA);
        u.uColorB.value.set(this.settings.colorB);
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
