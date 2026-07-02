(function() {
    var effect = new EP.EffectBase('quadtree-eyes-pro', {
        name: 'Quadtree Eyes PRO',
        category: 'shader-premium',
        icon: 'QE',
        description: 'Patron quadtree con ojos/rings animados, hatch procedural y color reactivo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'treeDepth', type: 'range', min: 1, max: 5, default: 4, step: 1, label: 'Tree Depth' },
        { key: 'eyeSize', type: 'range', min: 30, max: 180, default: 100, step: 1, label: 'Eye Size', unit: '%' },
        { key: 'hatchMix', type: 'range', min: 0, max: 200, default: 100, step: 1, label: 'Hatch Mix', unit: '%' },
        { key: 'colorShift', type: 'range', min: 0, max: 200, default: 95, step: 1, label: 'Color Shift', unit: '%' },
        { key: 'background', type: 'color', default: '#05030a', label: 'Background' }
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
        'uniform float uEye;',
        'uniform float uHatch;',
        'uniform float uColor;',
        'uniform vec2 uDirection;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(26.34,45.32))) * 4324.23); }',
        'vec3 hue(float t){ return 0.48 + 0.45*cos(6.28318*(t+vec3(0.00,0.33,0.66))); }',
        'float box(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.0))+min(max(d.x,d.y),0.0); }',
        'void main(){',
        '  vec2 uv = vUv*2.0-1.0;',
        '  uv.x *= 1.777;',
        '  vec2 dir = length(uDirection) < 0.1 ? vec2(0.35,1.0) : normalize(uDirection);',
        '  vec2 p = uv * (2.0 + 0.22*sin(uTime*0.17));',
        '  p *= rot(0.32*sin(uTime*0.12));',
        '  p += dir * uTime * 0.18;',
        '  float level = 1.0;',
        '  vec3 col = uBackground;',
        '  float chosen = 0.0;',
        '  for(int k=0; k<5; k++){',
        '    vec2 id = floor(p*level);',
        '    float rnd = hash(id);',
        '    if(rnd > 0.42 || float(k) >= uDepth-1.0){',
        '      vec2 cell = fract(p*level)-0.5;',
        '      float chk = mod(id.x+id.y, 2.0);',
        '      float hatch = clamp(sin((cell.x-cell.y)*38.0)*0.5+0.5, 0.0, 1.0);',
        '      vec3 base = mix(hue(rnd+uColor), vec3(0.01), hatch*uHatch);',
        '      float ring = smoothstep(0.018, 0.0, abs(length(cell)-0.31*uEye));',
        '      float pupil = smoothstep(0.025, 0.0, length(cell + vec2(0.08*sin(uTime+rnd*6.0), 0.05*cos(uTime*1.4+rnd)))-0.075*uEye);',
        '      float shine = smoothstep(0.02, 0.0, length(cell-vec2(0.11,0.12))-0.026);',
        '      float frame = smoothstep(0.02, 0.0, abs(box(cell, vec2(0.45)))-0.01);',
        '      col = mix(base, vec3(0.02), pupil);',
        '      col += hue(rnd*0.7+uColor+uTime*0.03) * ring * 0.65;',
        '      col += vec3(0.95) * shine;',
        '      col += frame * vec3(0.18);',
        '      chosen = 1.0;',
        '      break;',
        '    }',
        '    level *= 2.0;',
        '  }',
        '  col = mix(uBackground, col, chosen);',
        '  col *= smoothstep(1.65, 0.2, length(uv));',
        '  gl_FragColor = vec4(pow(col, vec3(0.88)), 1.0);',
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
                uDepth: { value: this.settings.treeDepth },
                uEye: { value: this.settings.eyeSize / 100 },
                uHatch: { value: this.settings.hatchMix / 100 },
                uColor: { value: this.settings.colorShift / 100 },
                uDirection: { value: directionVector(this.settings.motionDirection) },
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
        u.uDepth.value = this.settings.treeDepth;
        u.uEye.value = this.settings.eyeSize / 100;
        u.uHatch.value = this.settings.hatchMix / 100;
        u.uColor.value = this.settings.colorShift / 100;
        u.uDirection.value.copy(directionVector(this.settings.motionDirection));
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
