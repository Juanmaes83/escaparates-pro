(function() {
    var effect = new EP.EffectBase('glass-shader-pro', {
        name: 'Glass Shader Pro',
        category: 'glassmorphism',
        icon: 'GS',
        description: 'Refraccion tipo cristal sobre imagen o video, sin oscurecer por defecto'
    }, [
        { key: 'cardSize', type: 'range', min: 60, max: 150, default: 112, step: 1, label: 'Image Size', unit: '%' },
        { key: 'frequency', type: 'range', min: 2, max: 42, default: 9, step: 0.5, label: 'Frequency' },
        { key: 'distortion', type: 'range', min: 0, max: 40, default: 7, step: 1, label: 'Distortion', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 200, default: 38, step: 1, label: 'Motion', unit: '%' },
        { key: 'lineGlow', type: 'range', min: 0, max: 100, default: 8, step: 1, label: 'Edge Glow', unit: '%' },
        { key: 'angle', type: 'range', min: -180, max: 180, default: 136, step: 1, label: 'Angle', unit: 'deg' },
        { key: 'lighting', type: 'select', options: [{ v: 'natural', l: 'Natural' }, { v: 'prism', l: 'Prism optional' }], default: 'natural', label: 'Lighting' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var media = mediaList[0];
        var tex = media.type === 'video' ? new THREE.VideoTexture(media.element) : new THREE.Texture(media.element);
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        var el = media.element;
        var aspect = (el.videoWidth || el.naturalWidth || el.width || 1) / (el.videoHeight || el.naturalHeight || el.height || 1);
        var size = this.settings.cardSize / 100 * 5.3;
        var w = aspect >= 1 ? size : size * aspect;
        var h = aspect >= 1 ? size / aspect : size;
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: tex },
                uTime: { value: 0 },
                uFrequency: { value: this.settings.frequency },
                uRotation: { value: THREE.MathUtils.degToRad(this.settings.angle) },
                uDistortion: { value: this.settings.distortion / 100 },
                uLineIntensity: { value: this.settings.lineGlow / 100 },
                uPrism: { value: this.settings.lighting === 'prism' ? 1 : 0 }
            },
            vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: [
                'uniform sampler2D tDiffuse;uniform float uTime;uniform float uFrequency;uniform float uRotation;uniform float uDistortion;uniform float uLineIntensity;uniform float uPrism;varying vec2 vUv;',
                'mat2 r2(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}',
                'void main(){vec2 c=vUv-0.5;vec2 rot=r2(uRotation)*c;float phase=rot.x*uFrequency+uTime;float p=fract(phase);float wave=(pow(p,0.42)-0.5)*uDistortion;vec2 off=r2(-uRotation)*vec2(wave,0.0);',
                'float prism=uPrism*0.003;float r=texture2D(tDiffuse,vUv+off+vec2(prism,0.0)).r;float g=texture2D(tDiffuse,vUv+off).g;float b=texture2D(tDiffuse,vUv+off-vec2(prism,0.0)).b;vec3 col=vec3(r,g,b);float edge=smoothstep(0.985,1.0,p)*uLineIntensity;gl_FragColor=vec4(col+edge,1.0);}'
            ].join(''),
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(EP.RoundedPlaneGeometry(w, h, 0.08), mat);
        mesh.userData = { isGlass: true };
        group.add(mesh);
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var mesh = this.group.children[0];
        if (!mesh) return;
        mesh.material.uniforms.uTime.value = time * this.settings.motion / 100;
        mesh.material.uniforms.uFrequency.value = this.settings.frequency;
        mesh.material.uniforms.uRotation.value = THREE.MathUtils.degToRad(this.settings.angle);
        mesh.material.uniforms.uDistortion.value = this.settings.distortion / 100;
        mesh.material.uniforms.uLineIntensity.value = this.settings.lineGlow / 100;
        mesh.material.uniforms.uPrism.value = this.settings.lighting === 'prism' ? 1 : 0;
        if (mesh.material.uniforms.tDiffuse.value.isVideoTexture) mesh.material.uniforms.tDiffuse.value.needsUpdate = true;
    };

    EP.Registry.register(effect);
})();
