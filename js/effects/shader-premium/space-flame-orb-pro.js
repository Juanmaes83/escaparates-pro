(function() {
    var effect = new EP.EffectBase('space-flame-orb-pro', {
        name: 'Space Flame Orb PRO',
        category: 'shader-premium',
        icon: 'SO',
        description: 'Orbe espacial de llama fluida con estrellas y mezcla opcional de imagen/video'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'orbSize', type: 'range', min: 35, max: 180, default: 92, step: 1, label: 'Orb Size', unit: '%' },
        { key: 'flamePower', type: 'range', min: 0, max: 260, default: 135, step: 1, label: 'Flame Power', unit: '%' },
        { key: 'turbulence', type: 'range', min: 0, max: 260, default: 120, step: 1, label: 'Turbulence', unit: '%' },
        { key: 'starDensity', type: 'range', min: 0, max: 200, default: 90, step: 1, label: 'Stars', unit: '%' },
        { key: 'mediaBlend', type: 'range', min: 0, max: 100, default: 18, step: 1, label: 'Media Blend', unit: '%' },
        { key: 'coreColor', type: 'color', default: '#ffffba', label: 'Core Color' },
        { key: 'flameColor', type: 'color', default: '#ff5b84', label: 'Flame Color' },
        { key: 'spaceColor', type: 'color', default: '#070817', label: 'Space Color' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'medium',
        minMedia: 0,
        exportSafe: true,
        hasErrorBoundary: true
    };

    var vertexShader = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
    var fragmentShader = [
        'uniform sampler2D uTexture;',
        'uniform float uHasTexture;',
        'uniform float uTime;',
        'uniform float uOrbSize;',
        'uniform float uFlamePower;',
        'uniform float uTurbulence;',
        'uniform float uStarDensity;',
        'uniform float uMediaBlend;',
        'uniform vec2 uDirection;',
        'uniform vec3 uCoreColor;',
        'uniform vec3 uFlameColor;',
        'uniform vec3 uSpaceColor;',
        'varying vec2 vUv;',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
        'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}',
        'float fbm(vec2 p){float v=0.0;float a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=0.52;}return v;}',
        'void main(){',
        '  vec2 uv=vUv*2.0-1.0;',
        '  uv.x*=1.777;',
        '  vec2 dir=length(uDirection)<0.1?vec2(0.45,0.22):normalize(uDirection);',
        '  float t=uTime;',
        '  vec2 flow=uv*(2.0+uTurbulence*1.25)+dir*t*0.45;',
        '  float n=fbm(flow+vec2(sin(t*.7),cos(t*.5))*0.45);',
        '  float n2=fbm(flow*2.3-vec2(t*.32,t*.18));',
        '  float r=length(uv);',
        '  float orbRadius=0.36+uOrbSize*0.34;',
        '  float body=smoothstep(orbRadius,orbRadius-0.22,r+n*.12);',
        '  float corona=smoothstep(orbRadius+0.42,orbRadius-0.02,r+n*.28+n2*.12);',
        '  float flame=max(0.0,corona-body)*(0.65+n2*1.25)*uFlamePower;',
        '  float core=pow(max(body,0.0),1.8);',
        '  vec3 col=mix(uSpaceColor,uFlameColor,flame);',
        '  col=mix(col,uCoreColor,core);',
        '  float ring=smoothstep(.02,.0,abs(r-orbRadius-n*.08));',
        '  col+=uCoreColor*ring*.45;',
        '  vec2 starUv=vUv+vec2(t*.004,-t*.006);',
        '  float stars=0.0;',
        '  for(int i=0;i<4;i++){',
        '    vec2 cell=floor(starUv*vec2(80.0+float(i)*31.0,45.0+float(i)*19.0));',
        '    float h=hash(cell+float(i));',
        '    stars+=smoothstep(0.9965,1.0,h)*(0.5+0.5*sin(t*1.7+h*12.0));',
        '  }',
        '  col+=vec3(stars*uStarDensity);',
        '  vec4 media=texture2D(uTexture,vUv);',
        '  col=mix(col,media.rgb*(0.45+col*0.85),uMediaBlend*uHasTexture);',
        '  col*=smoothstep(1.4,0.1,r);',
        '  gl_FragColor=vec4(pow(max(col,0.0),vec3(0.88)),1.0);',
        '}'
    ].join('\n');

    function fallbackTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 4; canvas.height = 4;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#070817';
        ctx.fillRect(0, 0, 4, 4);
        var tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    function directionVector(value) {
        if (value === 'ltr') return new THREE.Vector2(1, 0);
        if (value === 'rtl') return new THREE.Vector2(-1, 0);
        if (value === 'ttb') return new THREE.Vector2(0, -1);
        if (value === 'btt') return new THREE.Vector2(0, 1);
        return new THREE.Vector2(0, 0);
    }

    effect.build = function(mediaList) {
        var hasMedia = mediaList && mediaList.length && mediaList[0].element;
        var tex = hasMedia ? EP.Media.createTexture(mediaList[0]) : fallbackTexture();
        var material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: tex },
                uHasTexture: { value: hasMedia ? 1 : 0 },
                uTime: { value: 0 },
                uOrbSize: { value: this.settings.orbSize / 100 },
                uFlamePower: { value: this.settings.flamePower / 100 },
                uTurbulence: { value: this.settings.turbulence / 100 },
                uStarDensity: { value: this.settings.starDensity / 100 },
                uMediaBlend: { value: this.settings.mediaBlend / 100 },
                uDirection: { value: directionVector(this.settings.motionDirection) },
                uCoreColor: { value: new THREE.Color(this.settings.coreColor) },
                uFlameColor: { value: new THREE.Color(this.settings.flameColor) },
                uSpaceColor: { value: new THREE.Color(this.settings.spaceColor) }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
        var group = new THREE.Group();
        this._mesh = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 7.1), material);
        this._texture = tex;
        group.add(this._mesh);
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._mesh) return;
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var u = this._mesh.material.uniforms;
        EP.Media.updateTexture(u.uTexture.value);
        u.uTime.value = time * speed;
        u.uOrbSize.value = this.settings.orbSize / 100;
        u.uFlamePower.value = this.settings.flamePower / 100;
        u.uTurbulence.value = this.settings.turbulence / 100;
        u.uStarDensity.value = this.settings.starDensity / 100;
        u.uMediaBlend.value = this.settings.mediaBlend / 100;
        u.uDirection.value.copy(directionVector(this.settings.motionDirection));
        u.uCoreColor.value.set(this.settings.coreColor);
        u.uFlameColor.value.set(this.settings.flameColor);
        u.uSpaceColor.value.set(this.settings.spaceColor);
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.scene.background = new THREE.Color(this.settings.spaceColor);
        EP.Core.camera.position.set(0, 0, 10);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        this._mesh = null;
        this._texture = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
