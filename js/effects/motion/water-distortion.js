(function() {
    var effect = new EP.EffectBase('water-distortion', {
        name: 'Water Distortion',
        category: 'motion',
        icon: '🌊',
        description: 'Distorsion liquida tipo agua sobre imagenes — ondas, reflejos y efecto sumergido con shader GLSL'
    }, [
        { key: 'waveFreq', type: 'range', min: 1, max: 20, default: 7, label: 'Wave Frequency' },
        { key: 'waveAmp', type: 'range', min: 1, max: 50, default: 15, label: 'Wave Amplitude', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 50, label: 'Speed', unit: '%' },
        { key: 'blueish', type: 'range', min: 0, max: 100, default: 60, label: 'Blue Tint', unit: '%' },
        { key: 'surfaceDistortion', type: 'range', min: 0, max: 100, default: 40, label: 'Surface Distortion', unit: '%' },
        { key: 'illumination', type: 'range', min: 0, max: 100, default: 30, label: 'Illumination', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    var vertexShader = [
        'varying vec2 vUv;',
        'void main() {',
        '    vUv = uv;',
        '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var fragmentShader = [
        'precision mediump float;',
        'uniform sampler2D uTexture;',
        'uniform float uTime;',
        'uniform float uFreq;',
        'uniform float uAmp;',
        'uniform float uBlue;',
        'uniform float uSurface;',
        'uniform float uIllum;',
        'varying vec2 vUv;',
        '',
        'void main() {',
        '    vec2 uv = vUv;',
        '    float amp = uAmp * 0.01;',
        '    float surf = uSurface * 0.01;',
        '',
        '    float wave1 = sin(uv.y * uFreq + uTime * 2.0) * amp;',
        '    float wave2 = sin(uv.x * uFreq * 0.7 + uTime * 1.5) * amp * 0.6;',
        '    float wave3 = cos(uv.y * uFreq * 1.3 - uTime * 1.8) * amp * 0.4;',
        '',
        '    float surfWave = sin(uv.x * uFreq * 3.0 + uTime * 3.0) * surf * 0.02;',
        '    surfWave += cos(uv.y * uFreq * 2.5 - uTime * 2.5) * surf * 0.015;',
        '',
        '    uv.x += wave1 + wave3 + surfWave;',
        '    uv.y += wave2 + surfWave * 0.8;',
        '',
        '    uv = clamp(uv, 0.0, 1.0);',
        '    vec4 color = texture2D(uTexture, uv);',
        '',
        '    float blue = uBlue * 0.01;',
        '    color.r *= 1.0 - blue * 0.3;',
        '    color.g *= 1.0 - blue * 0.1;',
        '    color.b *= 1.0 + blue * 0.2;',
        '',
        '    float illum = uIllum * 0.01;',
        '    float caustic = sin(uv.x * 20.0 + uTime * 4.0) * sin(uv.y * 20.0 - uTime * 3.0);',
        '    caustic = max(0.0, caustic) * illum * 0.3;',
        '    color.rgb += caustic;',
        '',
        '    float edgeDark = 1.0 - smoothstep(0.3, 0.5, length(uv - 0.5));',
        '    color.rgb *= 0.85 + edgeDark * 0.15;',
        '',
        '    gl_FragColor = color;',
        '}'
    ].join('\n');

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        for (var img = 0; img < mediaList.length; img++) {
            var tex = null;
            if (mediaList[img].element) {
                tex = new THREE.Texture(mediaList[img].element);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
            }

            var aspect = 1;
            if (mediaList[img].element) {
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || mediaList[img].element.width || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || mediaList[img].element.height || 1;
                aspect = ew / eh;
            }

            var w, h;
            if (aspect >= 1) { w = 8; h = 8 / aspect; }
            else { h = 8; w = 8 * aspect; }

            var mat = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    uTexture: { value: tex },
                    uTime: { value: 0 },
                    uFreq: { value: this.settings.waveFreq },
                    uAmp: { value: this.settings.waveAmp },
                    uBlue: { value: this.settings.blueish },
                    uSurface: { value: this.settings.surfaceDistortion },
                    uIllum: { value: this.settings.illumination }
                },
                transparent: true
            });

            var geo = new THREE.PlaneGeometry(w, h);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            mesh.userData = { imageIndex: img, aspect: aspect, media: mediaList[img] };
            group.add(mesh);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speed = this.settings.speed / 100;
        var meshes = [];
        for (var i = 0; i < this.group.children.length; i++) {
            if (this.group.children[i].userData.imageIndex !== undefined) meshes.push(this.group.children[i]);
        }
        var count = meshes.length;
        if (count === 0) return;
        var segDur = 1 / count;

        for (var idx = 0; idx < count; idx++) {
            var mesh = meshes[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                mesh.visible = true;

                if (mesh.userData.media && mesh.userData.media.element) {
                    if (mesh.material.uniforms.uTexture.value) {
                        mesh.material.uniforms.uTexture.value.needsUpdate = true;
                    }
                }

                mesh.material.uniforms.uTime.value = time * speed;
                mesh.material.uniforms.uFreq.value = this.settings.waveFreq;
                mesh.material.uniforms.uAmp.value = this.settings.waveAmp;
                mesh.material.uniforms.uBlue.value = this.settings.blueish;
                mesh.material.uniforms.uSurface.value = this.settings.surfaceDistortion;
                mesh.material.uniforms.uIllum.value = this.settings.illumination;

                var lt = (t - segStart) / segDur;
                var appear = lt < 0.1 ? lt / 0.1 : 1;
                var disappear = lt > 0.9 ? (lt - 0.9) / 0.1 : 0;
                mesh.material.uniforms.uTexture.value && (mesh.material.opacity = appear * (1 - disappear));
            } else {
                mesh.visible = false;
            }
        }

        EP.Core.camera.position.set(0, 0, 6);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this.group) {
            for (var i = 0; i < this.group.children.length; i++) {
                var mesh = this.group.children[i];
                if (mesh.material && mesh.material.uniforms && mesh.material.uniforms.uTexture && mesh.material.uniforms.uTexture.value) {
                    mesh.material.uniforms.uTexture.value.dispose();
                }
            }
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
