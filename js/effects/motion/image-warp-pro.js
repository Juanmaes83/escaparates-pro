(function() {
    var effect = new EP.EffectBase('image-warp-pro', {
        name: 'Image Warp Pro',
        category: 'motion',
        icon: 'IW',
        description: 'Ondas direccionales sobre imagen o video con exportacion limpia y color natural'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 200, default: 50, step: 1, label: 'Motion', unit: '%' },
        { key: 'cardSize', type: 'range', min: 55, max: 150, default: 112, step: 1, label: 'Image Size', unit: '%' },
        { key: 'amplitude', type: 'range', min: 0, max: 60, default: 8, step: 1, label: 'Amplitude', unit: '%' },
        { key: 'frequency', type: 'range', min: 2, max: 80, default: 18, step: 1, label: 'Frequency' },
        { key: 'safeZone', type: 'range', min: 0, max: 100, default: 40, step: 1, label: 'Safe Zone', unit: '%' },
        { key: 'waveAngle', type: 'range', min: -180, max: 180, default: 122, step: 1, label: 'Wave Angle', unit: 'deg' },
        { key: 'maskAngle', type: 'range', min: -180, max: 180, default: -54, step: 1, label: 'Mask Angle', unit: 'deg' },
        { key: 'background', type: 'color', default: '#1a1a1a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var media = mediaList[0];
        var tex = EP.Media.createTexture(media);
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        var el = media.element;
        var aspect = (el.videoWidth || el.naturalWidth || el.width || 1) / (el.videoHeight || el.naturalHeight || el.height || 1);
        var size = this.settings.cardSize / 100 * 5.6;
        var w = aspect >= 1 ? size : size * aspect;
        var h = aspect >= 1 ? size / aspect : size;
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: tex },
                uTime: { value: 0 },
                uAmplitude: { value: this.settings.amplitude / 100 },
                uFrequency: { value: this.settings.frequency },
                uSpeed: { value: this.settings.motion / 100 },
                uYStart: { value: this.settings.safeZone / 100 },
                uMaskAngle: { value: THREE.MathUtils.degToRad(this.settings.maskAngle) },
                uWaveAngle: { value: THREE.MathUtils.degToRad(this.settings.waveAngle) }
            },
            vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: [
                'uniform sampler2D uTexture;uniform float uTime;uniform float uAmplitude;uniform float uFrequency;uniform float uSpeed;uniform float uYStart;uniform float uMaskAngle;uniform float uWaveAngle;varying vec2 vUv;',
                'mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}',
                'void main(){vec2 centered=vUv-0.5;vec2 maskUv=rot(uMaskAngle)*centered+0.5;vec2 waveUv=rot(uWaveAngle)*centered+0.5;float mask=smoothstep(uYStart,uYStart-0.22,maskUv.y);float wave=sin(waveUv.y*uFrequency+uTime*uSpeed);wave=sign(wave)*pow(abs(wave),4.0);vec2 dir=vec2(cos(uWaveAngle),sin(uWaveAngle));vec2 uv=vUv+dir*wave*uAmplitude*mask;gl_FragColor=texture2D(uTexture,uv);}'
            ].join(''),
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(EP.RoundedPlaneGeometry(w, h, 0.08), mat);
        group.add(mesh);
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var mesh = this.group.children[0];
        if (!mesh) return;
        mesh.scale.setScalar(this.settings.cardSize / 112);
        mesh.material.uniforms.uTime.value = time;
        mesh.material.uniforms.uAmplitude.value = this.settings.amplitude / 100;
        mesh.material.uniforms.uFrequency.value = this.settings.frequency;
        mesh.material.uniforms.uSpeed.value = this.settings.motion / 100;
        mesh.material.uniforms.uYStart.value = this.settings.safeZone / 100;
        mesh.material.uniforms.uMaskAngle.value = THREE.MathUtils.degToRad(this.settings.maskAngle);
        mesh.material.uniforms.uWaveAngle.value = THREE.MathUtils.degToRad(this.settings.waveAngle);
        if (mesh.material.uniforms.uTexture.value.isVideoTexture) mesh.material.uniforms.uTexture.value.needsUpdate = true;
    };

    EP.Registry.register(effect);
})();
