(function() {
    var effect = new EP.EffectBase('mutating-field-pro', {
        name: 'Mutating Field PRO',
        category: 'shader-premium',
        icon: 'MF',
        description: 'Imagen o video convertido en superficie 3D con profundidad por luminancia y wireframe luminoso'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 120, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 95, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'elevation', type: 'range', min: 0, max: 300, default: 35, step: 1, label: 'Elevation', unit: '%' },
        { key: 'noiseRange', type: 'range', min: 0, max: 300, default: 48, step: 1, label: 'Noise Range', unit: '%' },
        { key: 'mediaDepth', type: 'range', min: 0, max: 280, default: 185, step: 1, label: 'Media Depth', unit: '%' },
        { key: 'mediaOpacity', type: 'range', min: 0, max: 100, default: 100, step: 1, label: 'Media Opacity', unit: '%' },
        { key: 'wireOpacity', type: 'range', min: 0, max: 100, default: 34, step: 1, label: 'Wire Overlay', unit: '%' },
        { key: 'sombreroAmplitude', type: 'range', min: 0, max: 260, default: 38, step: 1, label: 'Sombrero Amp', unit: '%' },
        { key: 'sombreroFrequency', type: 'range', min: 10, max: 220, default: 105, step: 1, label: 'Sombrero Freq', unit: '%' },
        { key: 'lineColor', type: 'color', default: '#e25cfe', label: 'Line Color' },
        { key: 'background', type: 'color', default: '#03020a', label: 'Background' }
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

    var vertexShader = [
        'uniform float uTime;',
        'uniform float uElevation;',
        'uniform float uNoise;',
        'uniform float uSombreroAmp;',
        'uniform float uSombreroFreq;',
        'uniform float uMediaDepth;',
        'uniform float uHasTexture;',
        'uniform sampler2D uTexture;',
        'uniform vec2 uDirection;',
        'varying vec2 vUv;',
        'varying float vHeight;',
        'varying float vLuma;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }',
        'float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y); }',
        'void main(){',
        '  vUv = uv;',
        '  vec2 centered = uv - 0.5;',
        '  vec2 dir = length(uDirection) < 0.1 ? vec2(0.0, 1.0) : normalize(uDirection);',
        '  vec2 flow = centered * 5.5 + dir * uTime * 0.55;',
        '  float n = noise(flow) + 0.45*noise(flow*2.7 + uTime*0.3);',
        '  float d = length(centered);',
        '  float sombrero = sin((uTime*0.65 - d*uSombreroFreq) * 3.14159265) * uSombreroAmp;',
        '  float sinus = sin(position.x*0.8 - 1.5708) * uElevation;',
        '  vec3 tex = texture2D(uTexture, uv).rgb;',
        '  float luma = dot(tex, vec3(0.299, 0.587, 0.114));',
        '  float mediaZ = (luma - 0.5) * uMediaDepth * uHasTexture;',
        '  float z = n*uNoise + sombrero + sinus + mediaZ;',
        '  vHeight = z;',
        '  vLuma = luma;',
        '  vec3 p = position + vec3(0.0, 0.0, z);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
        '}'
    ].join('\n');

    var surfaceFragmentShader = [
        'uniform vec3 uLineColor;',
        'uniform vec3 uBackground;',
        'uniform float uHasTexture;',
        'uniform float uMediaOpacity;',
        'uniform sampler2D uTexture;',
        'varying vec2 vUv;',
        'varying float vHeight;',
        'varying float vLuma;',
        'void main(){',
        '  vec4 tex = texture2D(uTexture, vUv);',
        '  float light = 0.66 + 0.34 * smoothstep(-1.2, 1.8, vHeight);',
        '  vec3 procedural = mix(uBackground, uLineColor, 0.28 + 0.34 * vLuma);',
        '  vec3 mediaCol = tex.rgb * light;',
        '  vec3 col = mix(procedural, mediaCol, uHasTexture * uMediaOpacity);',
        '  float alpha = mix(0.82, tex.a, uHasTexture * 0.35);',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    var wireFragmentShader = [
        'uniform vec3 uLineColor;',
        'uniform float uWireOpacity;',
        'varying float vHeight;',
        'void main(){',
        '  float alpha = uWireOpacity * (0.52 + 0.34 * smoothstep(-0.5, 1.8, vHeight));',
        '  gl_FragColor = vec4(uLineColor, alpha);',
        '}'
    ].join('\n');

    function directionVector(value) {
        if (value === 'ltr') return new THREE.Vector2(1, 0);
        if (value === 'rtl') return new THREE.Vector2(-1, 0);
        if (value === 'ttb') return new THREE.Vector2(0, -1);
        if (value === 'btt') return new THREE.Vector2(0, 1);
        return new THREE.Vector2(0, 0);
    }

    function fallbackTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 2;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 2, 2);
        return new THREE.CanvasTexture(canvas);
    }

    function makeUniforms(effect, mediaList) {
        var media = mediaList && mediaList.length ? mediaList[0] : null;
        var texture = media ? EP.Media.createTexture(media) : fallbackTexture();
        return {
            uTime: { value: 0 },
            uElevation: { value: effect.settings.elevation / 100 },
            uNoise: { value: effect.settings.noiseRange / 100 },
            uSombreroAmp: { value: effect.settings.sombreroAmplitude / 100 },
            uSombreroFreq: { value: effect.settings.sombreroFrequency / 10 },
            uMediaDepth: { value: effect.settings.mediaDepth / 100 },
            uMediaOpacity: { value: effect.settings.mediaOpacity / 100 },
            uWireOpacity: { value: effect.settings.wireOpacity / 100 },
            uHasTexture: { value: media ? 1 : 0 },
            uTexture: { value: texture },
            uDirection: { value: directionVector(effect.settings.motionDirection) },
            uLineColor: { value: new THREE.Color(effect.settings.lineColor) },
            uBackground: { value: new THREE.Color(effect.settings.background) }
        };
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        mediaList = mediaList || [];
        var geometry = new THREE.PlaneGeometry(12, 12, 150, 150);
        var uniforms = makeUniforms(this, mediaList);
        var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: surfaceFragmentShader,
            transparent: true,
            depthWrite: true,
            side: THREE.DoubleSide
        });
        var wireMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: wireFragmentShader,
            wireframe: true,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this._mesh = new THREE.Mesh(geometry, material);
        this._mesh.rotation.x = -Math.PI / 4.2;
        this._mesh.rotation.z = -0.08;
        this._mesh.position.y = -0.7;
        this._wireMesh = new THREE.Mesh(geometry.clone(), wireMaterial);
        this._wireMesh.rotation.copy(this._mesh.rotation);
        this._wireMesh.position.copy(this._mesh.position);
        group.add(this._mesh);
        group.add(this._wireMesh);
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._mesh) return;
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var u = this._mesh.material.uniforms;
        u.uTime.value = time * speed;
        u.uElevation.value = this.settings.elevation / 100;
        u.uNoise.value = this.settings.noiseRange / 100;
        u.uMediaDepth.value = this.settings.mediaDepth / 100;
        u.uMediaOpacity.value = this.settings.mediaOpacity / 100;
        u.uWireOpacity.value = this.settings.wireOpacity / 100;
        u.uSombreroAmp.value = this.settings.sombreroAmplitude / 100;
        u.uSombreroFreq.value = this.settings.sombreroFrequency / 10;
        u.uDirection.value.copy(directionVector(this.settings.motionDirection));
        u.uLineColor.value.set(this.settings.lineColor);
        u.uBackground.value.set(this.settings.background);
        EP.Media.updateTexture(u.uTexture.value);
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.scene.background = new THREE.Color(this.settings.background);
        EP.Core.camera.position.set(0, 2.6, 8.6);
        EP.Core.camera.lookAt(0, -0.15, 0);
    };

    effect.dispose = function() {
        this._mesh = null;
        this._wireMesh = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
