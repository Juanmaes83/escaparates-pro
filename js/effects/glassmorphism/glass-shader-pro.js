(function() {
    var effect = new EP.EffectBase('glass-shader-pro', {
        name: 'Glass Shader Pro',
        category: 'glassmorphism',
        icon: 'GS',
        description: 'Refraccion de cristal con lente, bordes y video controlable sin oscurecimiento forzado'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motion', type: 'range', min: -100, max: 100, default: 18, step: 1, label: 'Glass Motion', unit: '%' },
        { key: 'cardSize', type: 'range', min: 60, max: 150, default: 112, step: 1, label: 'Image Size', unit: '%' },
        { key: 'frequency', type: 'range', min: 1, max: 50, default: 9, step: 0.5, label: 'Frequency' },
        { key: 'distortion', type: 'range', min: 0, max: 30, default: 5, step: 0.5, label: 'Distortion', unit: '%' },
        { key: 'curvePower', type: 'range', min: 1, max: 300, default: 42, step: 1, label: 'Lens Curve', unit: '%' },
        { key: 'lineWidth', type: 'range', min: 0, max: 100, default: 15, step: 1, label: 'Line Width', unit: '%' },
        { key: 'lineGlow', type: 'range', min: 0, max: 100, default: 8, step: 1, label: 'Edge Glow', unit: '%' },
        { key: 'angle', type: 'range', min: -180, max: 180, default: 136, step: 1, label: 'Angle', unit: 'deg' },
        { key: 'videoSpeed', type: 'range', min: 25, max: 300, default: 100, step: 5, label: 'Video Speed', unit: '%' },
        { key: 'lighting', type: 'select', options: [{ v: 'natural', l: 'Natural' }, { v: 'prism', l: 'Prism optional' }], default: 'natural', label: 'Lighting' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.capabilities = Object.assign(effect.capabilities, { supportsVideo: true, supportsMotionDirection: true, mobileRisk: 'medium' });

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || !mediaList.length) return group;
        var media = mediaList[0];
        var texture = EP.Media.createTexture(media);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        var el = media.element;
        var aspect = (el.videoWidth || el.naturalWidth || el.width || 1) / (el.videoHeight || el.naturalHeight || el.height || 1);
        var size = 5.3;
        var width = aspect >= 1 ? size : size * aspect;
        var height = aspect >= 1 ? size / aspect : size;
        var material = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: texture }, uTime: { value: 0 }, uFrequency: { value: 9 },
                uRotation: { value: 0 }, uDistortion: { value: 0.05 }, uCurvePower: { value: 0.42 },
                uLineWidth: { value: 0.015 }, uLineIntensity: { value: 0.08 }, uPrism: { value: 0 }
            },
            vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: [
                'uniform sampler2D tDiffuse;uniform float uTime,uFrequency,uRotation,uDistortion,uCurvePower,uLineWidth,uLineIntensity,uPrism;varying vec2 vUv;',
                'mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}',
                'void main(){vec2 centered=vUv-.5;vec2 ruv=rot(uRotation)*centered;float phase=ruv.x*uFrequency+uTime;float p=fract(phase);float shaped=pow(max(p,.0001),uCurvePower);float displacement=(shaped-.5)*uDistortion;vec2 off=rot(-uRotation)*vec2(displacement,0.);float prism=uPrism*.003;vec3 col=vec3(texture2D(tDiffuse,vUv+off+vec2(prism,0.)).r,texture2D(tDiffuse,vUv+off).g,texture2D(tDiffuse,vUv+off-vec2(prism,0.)).b);float edge=smoothstep(1.-max(.001,uLineWidth),1.,p)*uLineIntensity;gl_FragColor=vec4(col+edge,1.);}'
            ].join(''),
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(EP.RoundedPlaneGeometry(width, height, 0.08), material);
        mesh.userData.isGlass = true;
        group.add(mesh);
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group || !this.group.children[0]) return;
        var mesh = this.group.children[0];
        var u = mesh.material.uniforms;
        var enabled = this.settings.playbackMotion !== 'off';
        var speed = this.settings.playbackMotionSpeed / 100;
        u.uTime.value = enabled ? time * speed * this.settings.motion / 100 : 0;
        u.uFrequency.value = this.settings.frequency;
        u.uRotation.value = THREE.MathUtils.degToRad(this.settings.angle);
        u.uDistortion.value = this.settings.distortion / 100;
        u.uCurvePower.value = Math.max(0.01, this.settings.curvePower / 100);
        u.uLineWidth.value = this.settings.lineWidth / 1000;
        u.uLineIntensity.value = this.settings.lineGlow / 100;
        u.uPrism.value = this.settings.lighting === 'prism' ? 1 : 0;
        mesh.scale.setScalar(this.settings.cardSize / 112);
        var tex = u.tDiffuse.value;
        if (tex && tex.isVideoTexture) {
            if (tex.image) tex.image.playbackRate = this.settings.videoSpeed / 100;
            tex.needsUpdate = true;
        }
    };

    EP.Registry.register(effect);
})();
