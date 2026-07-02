(function() {
    var effect = new EP.EffectBase('shader-clock-pro', {
        name: 'Shader Clock PRO',
        category: 'shader-premium',
        icon: 'SC',
        description: 'Reloj procedural con diales circulares, segmentos luminosos y tiempo exportable'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'dialSpread', type: 'range', min: 40, max: 180, default: 100, step: 1, label: 'Dial Spread', unit: '%' },
        { key: 'glow', type: 'range', min: 0, max: 220, default: 120, step: 1, label: 'Glow', unit: '%' },
        { key: 'segmentCount', type: 'range', min: 6, max: 24, default: 12, step: 1, label: 'Segments' },
        { key: 'accentColor', type: 'color', default: '#39f59b', label: 'Accent Color' },
        { key: 'background', type: 'color', default: '#05070a', label: 'Background' }
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
        'uniform float uSpread;',
        'uniform float uGlow;',
        'uniform float uSegments;',
        'uniform vec2 uDirection;',
        'uniform vec3 uAccent;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'float ring(vec2 p, float r, float w){ return smoothstep(w, 0.0, abs(length(p)-r)); }',
        'float seg(vec2 p, float value, float count){ float a=atan(p.y,p.x)/6.28318+0.5; float s=fract(a*count-value); return smoothstep(0.10,0.0,abs(s-0.5)-0.32); }',
        'void main(){',
        '  vec2 uv = vUv*2.0-1.0;',
        '  uv.x *= 1.777;',
        '  vec2 dir = length(uDirection) < 0.1 ? vec2(0.0,0.0) : normalize(uDirection);',
        '  uv += dir * sin(uTime*0.35) * 0.06;',
        '  vec3 col = uBackground;',
        '  float values[6];',
        '  values[0]=fract(uTime/12.0); values[1]=fract(uTime/6.0); values[2]=fract(uTime/3.0);',
        '  values[3]=fract(uTime*0.75); values[4]=fract(uTime*1.25); values[5]=fract(uTime*2.0);',
        '  for(int i=0;i<6;i++){',
        '    float fi=float(i);',
        '    vec2 c = vec2((fi-2.5)*0.42*uSpread, sin(fi*1.7)*0.08);',
        '    vec2 p = uv-c;',
        '    float base = ring(p, 0.18, 0.018);',
        '    float activeSeg = base * seg(p, values[i], uSegments);',
        '    vec3 dial = mix(vec3(0.12), uAccent, 0.35+0.1*fi);',
        '    col += dial*base*0.18;',
        '    col += uAccent*activeSeg*uGlow;',
        '    col += vec3(1.0)*smoothstep(0.018,0.0,length(p)-0.035)*activeSeg;',
        '  }',
        '  col *= smoothstep(1.55,0.1,length(uv));',
        '  gl_FragColor = vec4(pow(max(col,0.0), vec3(0.86)), 1.0);',
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
                uSpread: { value: this.settings.dialSpread / 100 },
                uGlow: { value: this.settings.glow / 100 },
                uSegments: { value: this.settings.segmentCount },
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
        u.uSpread.value = this.settings.dialSpread / 100;
        u.uGlow.value = this.settings.glow / 100;
        u.uSegments.value = this.settings.segmentCount;
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
