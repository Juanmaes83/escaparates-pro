(function() {
    var effect = new EP.EffectBase('shader-doodle-gradient-pro', {
        name: 'Shader Doodle Gradient PRO',
        category: 'shader-premium',
        icon: 'SD',
        description: 'Lienzo shader tipo doodle con gradiente animado, uniforms simples y salida final limpia'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'doodleScale', type: 'range', min: 20, max: 220, default: 100, step: 1, label: 'Doodle Scale', unit: '%' },
        { key: 'waveAmount', type: 'range', min: 0, max: 200, default: 120, step: 1, label: 'Wave Amount', unit: '%' },
        { key: 'grain', type: 'range', min: 0, max: 200, default: 45, step: 1, label: 'Grain', unit: '%' },
        { key: 'colorA', type: 'color', default: '#2b6cff', label: 'Color A' },
        { key: 'colorB', type: 'color', default: '#ff4fd8', label: 'Color B' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: false,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'low',
        minMedia: 0,
        exportSafe: true,
        hasErrorBoundary: true
    };

    var vertexShader = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
    var fragmentShader = [
        'uniform float uTime;',
        'uniform float uScale;',
        'uniform float uWave;',
        'uniform float uGrain;',
        'uniform vec2 uDirection;',
        'uniform vec3 uColorA;',
        'uniform vec3 uColorB;',
        'varying vec2 vUv;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }',
        'void main(){',
        '  vec2 st = vUv;',
        '  vec2 dir = length(uDirection) < 0.1 ? vec2(0.65, 0.35) : normalize(uDirection);',
        '  vec2 p = (st - 0.5) * uScale;',
        '  p += dir * uTime * 0.12;',
        '  float wave = sin(p.x*7.0 + uTime*1.2) + cos(p.y*6.0 - uTime*0.9);',
        '  wave += sin((p.x+p.y)*5.0 + uTime*0.55);',
        '  float mask = 0.5 + 0.5*sin(wave*uWave + length(p)*2.5);',
        '  vec3 col = mix(uColorA, uColorB, mask);',
        '  col += vec3(st.x, st.y, abs(sin(uTime))) * 0.22;',
        '  float lines = smoothstep(0.015, 0.0, abs(fract((p.x+p.y+uTime*.15)*8.0)-0.5)-0.44);',
        '  col = mix(col, vec3(1.0), lines*0.16);',
        '  col += (hash(gl_FragCoord.xy+uTime)-0.5) * 0.08 * uGrain;',
        '  col *= smoothstep(0.92, 0.12, length(st-0.5));',
        '  gl_FragColor = vec4(pow(max(col,0.0), vec3(0.9)), 1.0);',
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
                uScale: { value: this.settings.doodleScale / 100 },
                uWave: { value: this.settings.waveAmount / 100 },
                uGrain: { value: this.settings.grain / 100 },
                uDirection: { value: directionVector(this.settings.motionDirection) },
                uColorA: { value: new THREE.Color(this.settings.colorA) },
                uColorB: { value: new THREE.Color(this.settings.colorB) }
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
        u.uScale.value = this.settings.doodleScale / 100;
        u.uWave.value = this.settings.waveAmount / 100;
        u.uGrain.value = this.settings.grain / 100;
        u.uDirection.value.copy(directionVector(this.settings.motionDirection));
        u.uColorA.value.set(this.settings.colorA);
        u.uColorB.value.set(this.settings.colorB);
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
