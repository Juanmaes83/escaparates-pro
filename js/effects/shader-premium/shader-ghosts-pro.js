(function() {
    var effect = new EP.EffectBase('shader-ghosts-pro', {
        name: 'Shader Ghosts PRO',
        category: 'shader-premium',
        icon: 'SG',
        description: 'Escena de fantasmas shader con tiles oscuros, ojos brillantes y movimiento suave'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'ghostCount', type: 'range', min: 3, max: 18, default: 9, step: 1, label: 'Ghost Count' },
        { key: 'glow', type: 'range', min: 0, max: 220, default: 135, step: 1, label: 'Glow', unit: '%' },
        { key: 'tileDarkness', type: 'range', min: 0, max: 200, default: 110, step: 1, label: 'Tile Darkness', unit: '%' },
        { key: 'ghostColor', type: 'color', default: '#3aa8ff', label: 'Ghost Color' },
        { key: 'background', type: 'color', default: '#03020a', label: 'Background' }
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
        'uniform float uCount;',
        'uniform float uGlow;',
        'uniform float uDark;',
        'uniform vec2 uDirection;',
        'uniform vec3 uGhost;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(23.43,84.21))) * 4832.3234); }',
        'float body(vec2 p){',
        '  float head = length(p-vec2(0.0,0.22))-0.28;',
        '  float torso = max(abs(p.x)-0.28, abs(p.y+0.08)-0.34);',
        '  float wave = 0.045*sin((p.x+0.4)*24.0);',
        '  float cut = p.y + 0.42 + wave;',
        '  return max(min(head, torso), cut);',
        '}',
        'void main(){',
        '  vec2 uv = vUv*2.0-1.0;',
        '  uv.x *= 1.777;',
        '  vec2 dir = length(uDirection) < 0.1 ? vec2(0.18,1.0) : normalize(uDirection);',
        '  vec3 col = uBackground;',
        '  vec2 tile = floor((uv + dir*uTime*0.08) * 5.0);',
        '  float checker = mod(tile.x+tile.y,2.0);',
        '  col = mix(col, col + vec3(0.04,0.02,0.08), checker * (uDark*0.35));',
        '  float glowSum = 0.0;',
        '  for(int i=0;i<18;i++){',
        '    if(float(i) >= uCount) break;',
        '    float fi = float(i);',
        '    float h = hash(vec2(fi, fi*3.1));',
        '    vec2 c = vec2(fract(h*7.31+uTime*0.035)-0.5, fract(h*3.13)-0.5) * vec2(2.4,1.15);',
        '    c += dir * sin(uTime*0.55 + fi) * 0.10;',
        '    vec2 p = (uv - c) * (1.4 + 0.45*sin(fi));',
        '    p.y += sin(uTime*1.4 + fi)*0.08;',
        '    float d = body(p);',
        '    float mask = smoothstep(0.018, 0.0, d);',
        '    float eyeA = smoothstep(0.018,0.0,length(p-vec2(-0.09,0.24))-0.026);',
        '    float eyeB = smoothstep(0.018,0.0,length(p-vec2(0.09,0.24))-0.026);',
        '    float localGlow = smoothstep(0.32,0.0,abs(d));',
        '    vec3 ghost = mix(uGhost*0.25, uGhost, 0.4+0.6*h);',
        '    col = mix(col, ghost, mask*0.72);',
        '    col += vec3(0.85,0.96,1.0)*(eyeA+eyeB)*uGlow;',
        '    glowSum += localGlow*(0.25+0.75*h);',
        '  }',
        '  col += uGhost * glowSum * 0.035 * uGlow;',
        '  col *= smoothstep(1.55,0.05,length(uv));',
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
                uCount: { value: this.settings.ghostCount },
                uGlow: { value: this.settings.glow / 100 },
                uDark: { value: this.settings.tileDarkness / 100 },
                uDirection: { value: directionVector(this.settings.motionDirection) },
                uGhost: { value: new THREE.Color(this.settings.ghostColor) },
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
        u.uCount.value = this.settings.ghostCount;
        u.uGlow.value = this.settings.glow / 100;
        u.uDark.value = this.settings.tileDarkness / 100;
        u.uDirection.value.copy(directionVector(this.settings.motionDirection));
        u.uGhost.value.set(this.settings.ghostColor);
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
