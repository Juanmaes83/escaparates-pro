(function() {
    var effect = new EP.EffectBase('infinity-truchets-pro', {
        name: 'Infinity Truchets PRO',
        category: 'shader-premium',
        icon: 'IT',
        description: 'Tunel log-polar de truchets infinitos con mosaico circular, dots y color premium'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'tunnelScale', type: 'range', min: 30, max: 220, default: 100, step: 1, label: 'Tunnel Scale', unit: '%' },
        { key: 'tileContrast', type: 'range', min: 0, max: 200, default: 105, step: 1, label: 'Tile Contrast', unit: '%' },
        { key: 'dotAmount', type: 'range', min: 0, max: 200, default: 90, step: 1, label: 'Dots', unit: '%' },
        { key: 'colorShift', type: 'range', min: 0, max: 200, default: 85, step: 1, label: 'Color Shift', unit: '%' },
        { key: 'background', type: 'color', default: '#03020b', label: 'Background' }
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
        'uniform float uContrast;',
        'uniform float uDots;',
        'uniform float uColor;',
        'uniform vec2 uDirection;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }',
        'float hash(vec2 a){ return fract(sin(dot(a, vec2(27.609,57.583))) * 43758.5453); }',
        'vec3 hue(float t){ return 0.42 + 0.425*cos(6.28318*t*(vec3(.95,.97,.98)*vec3(.957,.439,.043))); }',
        'void main(){',
        '  vec2 uv = vUv*2.0-1.0;',
        '  uv.x *= 1.777;',
        '  vec2 dir = length(uDirection) < 0.1 ? vec2(1.0, 0.0) : normalize(uDirection);',
        '  vec2 polar = uv * rot(uTime*0.025);',
        '  float r = max(length(polar), 0.002);',
        '  vec2 lp = vec2(log(r), atan(polar.y, polar.x)) * 3.5 * uScale;',
        '  lp.x += dot(dir, vec2(1.0,0.0)) * uTime * 0.25;',
        '  lp.y += dot(dir, vec2(0.0,1.0)) * uTime * 0.35;',
        '  vec2 id = floor(lp);',
        '  vec2 f = fract(lp)-0.5;',
        '  float rnd = hash(id);',
        '  float chk = mod(id.x+id.y,2.0);',
        '  if(rnd > 0.5) f.x *= -1.0;',
        '  float c1 = length(f-vec2(-0.5,0.5))-0.5;',
        '  float c2 = length(f-vec2(0.5,-0.5))-0.5;',
        '  float arcs = smoothstep(0.045, 0.0, abs(min(c1,c2))-0.035);',
        '  float fill = (rnd > 0.5 != chk > 0.5) ? smoothstep(0.0, 0.035, min(c1,c2)) : smoothstep(0.035, 0.0, min(c1,c2));',
        '  vec2 dp = fract((vec2(log(r), atan(uv.y,uv.x))*3.5 + uTime*0.075)*uScale)-0.5;',
        '  float dots = smoothstep(0.045, 0.0, abs(length(abs(dp)-vec2(0.5,0.0))-0.24)-0.012) * uDots;',
        '  vec3 col = hue(52.0 + id.x*0.15 + uColor + rnd*0.2);',
        '  col = mix(col, uBackground, clamp(fill*uContrast,0.0,1.0));',
        '  col = mix(col, col*0.55, clamp(arcs+dots,0.0,1.0));',
        '  col += hue(rnd+uColor+uTime*0.025) * arcs * 0.15;',
        '  col *= smoothstep(1.55, 0.04, length(uv));',
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
                uScale: { value: this.settings.tunnelScale / 100 },
                uContrast: { value: this.settings.tileContrast / 100 },
                uDots: { value: this.settings.dotAmount / 100 },
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
        u.uScale.value = this.settings.tunnelScale / 100;
        u.uContrast.value = this.settings.tileContrast / 100;
        u.uDots.value = this.settings.dotAmount / 100;
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
