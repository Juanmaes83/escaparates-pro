(function() {
    var effect = new EP.EffectBase('reflective-city-pro', {
        name: 'Reflective City PRO',
        category: 'shader-premium',
        icon: 'RC',
        description: 'Ciudad reflectante procedural con calles infinitas, brillo controlado y camara cinematica'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'cityDensity', type: 'range', min: 25, max: 180, default: 96, step: 1, label: 'City Density', unit: '%' },
        { key: 'reflectionGlow', type: 'range', min: 0, max: 200, default: 115, step: 1, label: 'Reflection Glow', unit: '%' },
        { key: 'cameraAngle', type: 'range', min: 0, max: 200, default: 85, step: 1, label: 'Camera Angle', unit: '%' },
        { key: 'accentColor', type: 'color', default: '#8ff8ff', label: 'Accent Color' },
        { key: 'background', type: 'color', default: '#030712', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: false,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'high',
        minMedia: 0,
        exportSafe: true,
        hasErrorBoundary: true
    };

    var vertexShader = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
    var fragmentShader = [
        'uniform float uTime;',
        'uniform float uDensity;',
        'uniform float uGlow;',
        'uniform float uAngle;',
        'uniform vec2 uDirection;',
        'uniform vec3 uAccent;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(27.609,57.583))) * 43758.5453); }',
        'float box(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.0))+min(max(d.x,d.y),0.0); }',
        'void main(){',
        '  vec2 uv = vUv*2.0-1.0;',
        '  uv.x *= 1.777;',
        '  float angle = mix(0.18, 1.12, clamp(uAngle,0.0,2.0)*0.5);',
        '  vec2 dir = length(uDirection) < 0.1 ? vec2(1.0,0.35) : normalize(uDirection);',
        '  vec2 p = uv;',
        '  p.y += angle;',
        '  p *= rot(0.14*sin(uTime*0.17));',
        '  p += dir * uTime * 0.23;',
        '  float scale = mix(3.4, 8.0, clamp(uDensity,0.0,1.8)/1.8);',
        '  vec2 grid = p * scale;',
        '  vec2 id = floor(grid);',
        '  vec2 f = fract(grid)-0.5;',
        '  float h = hash(id);',
        '  float height = 0.10 + h*0.48;',
        '  float tower = smoothstep(0.03, 0.0, box(f, vec2(0.24, height)));',
        '  float windowRows = smoothstep(0.015, 0.0, abs(fract((f.y+0.5)*8.0)-0.5)-0.18);',
        '  float windowCols = smoothstep(0.015, 0.0, abs(fract((f.x+0.5)*5.0)-0.5)-0.20);',
        '  float windows = windowRows * windowCols * tower;',
        '  float street = smoothstep(0.025, 0.0, abs(f.x)-0.46) + smoothstep(0.025, 0.0, abs(f.y)-0.46);',
        '  float horizon = smoothstep(1.1, -0.25, uv.y);',
        '  float refl = smoothstep(0.85, -0.8, uv.y) * (0.45 + 0.55*sin((uv.x+uTime)*18.0));',
        '  vec3 base = mix(uBackground, vec3(0.015,0.028,0.055), horizon);',
        '  vec3 glass = mix(vec3(0.04,0.07,0.09), uAccent, 0.42 + h*0.32);',
        '  vec3 col = base;',
        '  col = mix(col, glass, tower*horizon);',
        '  col += uAccent * windows * 0.45 * uGlow;',
        '  col += uAccent * street * 0.08 * uGlow;',
        '  col += uAccent * tower * refl * 0.08 * uGlow;',
        '  col *= smoothstep(1.7, 0.15, length(uv*vec2(0.75,1.0)));',
        '  gl_FragColor = vec4(pow(col, vec3(0.82)), 1.0);',
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
                uDensity: { value: this.settings.cityDensity / 100 },
                uGlow: { value: this.settings.reflectionGlow / 100 },
                uAngle: { value: this.settings.cameraAngle / 100 },
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
        u.uDensity.value = this.settings.cityDensity / 100;
        u.uGlow.value = this.settings.reflectionGlow / 100;
        u.uAngle.value = this.settings.cameraAngle / 100;
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
