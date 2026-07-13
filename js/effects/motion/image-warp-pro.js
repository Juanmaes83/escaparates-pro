(function() {
    var effect = new EP.EffectBase('image-warp-pro', {
        name: 'Image Warp Pro', category: 'motion', icon: 'IW',
        description: 'Onda direccional compleja sobre imagen o video con mascara, banda y separador regulables'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motion', type: 'range', min: -100, max: 200, default: 50, step: 1, label: 'Wave Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 55, max: 150, default: 112, step: 1, label: 'Image Size', unit: '%' },
        { key: 'amplitude', type: 'range', min: 0, max: 100, default: 6, step: 1, label: 'Amplitude', unit: '%' },
        { key: 'frequency', type: 'range', min: 1, max: 100, default: 18, step: 1, label: 'Frequency' },
        { key: 'complexity', type: 'range', min: 0, max: 500, default: 0, step: 5, label: 'Secondary Wave', unit: '%' },
        { key: 'sharpness', type: 'range', min: 1, max: 20, default: 5, step: .5, label: 'Band Sharpness' },
        { key: 'safeZone', type: 'range', min: 0, max: 100, default: 40, step: 1, label: 'Safe Zone', unit: '%' },
        { key: 'waveAngle', type: 'range', min: -180, max: 180, default: 122, step: 1, label: 'Wave Angle', unit: 'deg' },
        { key: 'maskAngle', type: 'range', min: -180, max: 180, default: -54, step: 1, label: 'Mask Angle', unit: 'deg' },
        { key: 'spacerY', type: 'range', min: 0, max: 100, default: 100, step: 1, label: 'Separator Position', unit: '%' },
        { key: 'spacerSize', type: 'range', min: 0, max: 50, default: 8, step: 1, label: 'Separator Size', unit: '%' },
        { key: 'spacerFeather', type: 'range', min: 1, max: 50, default: 5, step: 1, label: 'Separator Feather', unit: '%' },
        { key: 'videoSpeed', type: 'range', min: 25, max: 300, default: 100, step: 5, label: 'Video Speed', unit: '%' },
        { key: 'background', type: 'color', default: '#1a1a1a', label: 'Background' }
    ]);
    effect.capabilities = Object.assign(effect.capabilities, { supportsVideo: true, supportsMotionDirection: true, mobileRisk: 'medium' });
    effect.build = function(mediaList) {
        var group = new THREE.Group(); if (!mediaList || !mediaList.length) return group;
        var media = mediaList[0], texture = EP.Media.createTexture(media); texture.needsUpdate = true; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
        var el = media.element, aspect = (el.videoWidth || el.naturalWidth || el.width || 1) / (el.videoHeight || el.naturalHeight || el.height || 1), size = 5.6;
        var w = aspect >= 1 ? size : size * aspect, h = aspect >= 1 ? size / aspect : size;
        var material = new THREE.ShaderMaterial({
            uniforms: { uTexture: { value: texture }, uTime: { value: 0 }, uAmplitude: { value: .06 }, uFrequency: { value: 18 }, uComplexity: { value: 0 }, uSharpness: { value: 5 }, uSpeed: { value: .5 }, uYStart: { value: .4 }, uMaskAngle: { value: 0 }, uWaveAngle: { value: 0 }, uSpacerY: { value: 1 }, uSpacerSize: { value: .08 }, uSpacerFeather: { value: .05 } },
            vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: [
                'uniform sampler2D uTexture;uniform float uTime,uAmplitude,uFrequency,uComplexity,uSharpness,uSpeed,uYStart,uMaskAngle,uWaveAngle,uSpacerY,uSpacerSize,uSpacerFeather;varying vec2 vUv;',
                'mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}',
                'void main(){vec2 centered=vUv-.5;vec2 maskUv=rot(uMaskAngle)*centered+.5;vec2 waveUv=rot(uWaveAngle)*centered+.5;float top=smoothstep(uYStart,uYStart-.2,maskUv.y);float distanceToSpacer=abs(maskUv.y-uSpacerY);float spacer=smoothstep(uSpacerSize*.5,uSpacerSize*.5+uSpacerFeather,distanceToSpacer);float mainWave=sin(waveUv.y*uFrequency+uTime*uSpeed);mainWave=sign(mainWave)*pow(abs(mainWave),uSharpness);float second=sin(waveUv.y*uFrequency*max(.001,uComplexity)-uTime*uSpeed*.8);second=sign(second)*pow(abs(second),uSharpness*1.5)*.4;vec2 direction=vec2(cos(uWaveAngle),sin(uWaveAngle));vec2 uv=vUv+direction*(mainWave+second)*uAmplitude*top*spacer;gl_FragColor=texture2D(uTexture,uv);}'
            ].join(''), side: THREE.DoubleSide
        });
        group.add(new THREE.Mesh(EP.RoundedPlaneGeometry(w, h, .08), material)); this.group = group; return group;
    };
    effect.update = function(time) {
        if (!this.group || !this.group.children[0]) return;
        var mesh = this.group.children[0], u = mesh.material.uniforms, s = this.settings;
        mesh.scale.setScalar(s.cardSize / 112);
        u.uTime.value = s.playbackMotion === 'off' ? 0 : time * s.playbackMotionSpeed / 100;
        u.uAmplitude.value = s.amplitude / 100; u.uFrequency.value = s.frequency; u.uComplexity.value = s.complexity / 100; u.uSharpness.value = s.sharpness; u.uSpeed.value = s.motion / 100;
        u.uYStart.value = s.safeZone / 100; u.uMaskAngle.value = THREE.MathUtils.degToRad(s.maskAngle); u.uWaveAngle.value = THREE.MathUtils.degToRad(s.waveAngle);
        u.uSpacerY.value = s.spacerY / 100; u.uSpacerSize.value = s.spacerSize / 100; u.uSpacerFeather.value = s.spacerFeather / 100;
        if (u.uTexture.value.isVideoTexture) { u.uTexture.value.image.playbackRate = s.videoSpeed / 100; u.uTexture.value.needsUpdate = true; }
    };
    EP.Registry.register(effect);
})();
