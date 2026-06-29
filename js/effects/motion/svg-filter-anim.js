(function() {
    var effect = new EP.EffectBase('svg-filter-anim', {
        name: 'SVG Filter Animation',
        category: 'motion',
        icon: '✨',
        description: 'Filtros SVG animados sobre imagenes — turbulencia, desplazamiento y efectos de distorsion organica'
    }, [
        { key: 'filterType', type: 'select', options: ['Turbulence', 'Ripple', 'Smoke', 'Glitch', 'Morph'], default: 'Turbulence', label: 'Filter Type' },
        { key: 'intensity', type: 'range', min: 5, max: 100, default: 40, label: 'Intensity', unit: '%' },
        { key: 'frequency', type: 'range', min: 1, max: 20, default: 5, label: 'Frequency' },
        { key: 'animSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Speed', unit: '%' },
        { key: 'octaves', type: 'range', min: 1, max: 5, default: 2, step: 1, label: 'Octaves' },
        { key: 'colorShift', type: 'range', min: 0, max: 100, default: 0, label: 'Color Shift', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    var vertShader = [
        'varying vec2 vUv;',
        'void main() {',
        '    vUv = uv;',
        '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var fragShader = [
        'precision mediump float;',
        'uniform sampler2D uTexture;',
        'uniform float uTime;',
        'uniform float uIntensity;',
        'uniform float uFreq;',
        'uniform int uType;',
        'uniform int uOctaves;',
        'uniform float uColorShift;',
        'varying vec2 vUv;',
        '',
        'float hash(vec2 p) {',
        '    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
        '}',
        '',
        'float noise(vec2 p) {',
        '    vec2 i = floor(p);',
        '    vec2 f = fract(p);',
        '    f = f * f * (3.0 - 2.0 * f);',
        '    float a = hash(i);',
        '    float b = hash(i + vec2(1.0, 0.0));',
        '    float c = hash(i + vec2(0.0, 1.0));',
        '    float d = hash(i + vec2(1.0, 1.0));',
        '    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
        '}',
        '',
        'float fbm(vec2 p, int oct) {',
        '    float val = 0.0;',
        '    float amp = 0.5;',
        '    for (int i = 0; i < 5; i++) {',
        '        if (i >= oct) break;',
        '        val += noise(p) * amp;',
        '        p *= 2.0;',
        '        amp *= 0.5;',
        '    }',
        '    return val;',
        '}',
        '',
        'void main() {',
        '    vec2 uv = vUv;',
        '    float intensity = uIntensity * 0.01;',
        '    float freq = uFreq;',
        '',
        '    vec2 offset = vec2(0.0);',
        '',
        '    if (uType == 0) {',
        '        float n = fbm(uv * freq + uTime * 0.5, uOctaves);',
        '        offset = vec2(n - 0.5, n - 0.5) * intensity * 0.3;',
        '    } else if (uType == 1) {',
        '        float dist = length(uv - 0.5);',
        '        float ripple = sin(dist * freq * 10.0 - uTime * 3.0) * intensity * 0.05;',
        '        offset = normalize(uv - 0.5 + 0.001) * ripple;',
        '    } else if (uType == 2) {',
        '        float n1 = fbm(uv * freq * 0.5 + vec2(uTime * 0.3, uTime * 0.1), uOctaves);',
        '        float n2 = fbm(uv * freq * 0.5 + vec2(-uTime * 0.2, uTime * 0.15) + 100.0, uOctaves);',
        '        offset = vec2(n1 - 0.5, n2 - 0.5) * intensity * 0.25;',
        '    } else if (uType == 3) {',
        '        float glitchLine = step(0.98, hash(vec2(floor(uv.y * 40.0), floor(uTime * 8.0))));',
        '        float blockNoise = hash(vec2(floor(uv.x * 10.0), floor(uTime * 5.0)));',
        '        offset.x = glitchLine * (blockNoise - 0.5) * intensity * 0.4;',
        '        offset.y = step(0.995, hash(vec2(uTime * 3.0, floor(uv.y * 20.0)))) * intensity * 0.1;',
        '    } else {',
        '        float n = fbm(uv * freq + uTime * 0.4, uOctaves);',
        '        float n2 = fbm(uv * freq * 1.5 - uTime * 0.3 + 50.0, uOctaves);',
        '        offset = vec2(sin(n * 6.28) * intensity * 0.15, cos(n2 * 6.28) * intensity * 0.15);',
        '    }',
        '',
        '    uv = clamp(uv + offset, 0.0, 1.0);',
        '    vec4 color = texture2D(uTexture, uv);',
        '',
        '    if (uColorShift > 0.0) {',
        '        float shift = uColorShift * 0.01 * 0.02;',
        '        color.r = texture2D(uTexture, clamp(uv + vec2(shift, 0.0), 0.0, 1.0)).r;',
        '        color.b = texture2D(uTexture, clamp(uv - vec2(shift, 0.0), 0.0, 1.0)).b;',
        '    }',
        '',
        '    gl_FragColor = color;',
        '}'
    ].join('\n');

    var typeMap = { 'Turbulence': 0, 'Ripple': 1, 'Smoke': 2, 'Glitch': 3, 'Morph': 4 };

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
                vertexShader: vertShader,
                fragmentShader: fragShader,
                uniforms: {
                    uTexture: { value: tex },
                    uTime: { value: 0 },
                    uIntensity: { value: this.settings.intensity },
                    uFreq: { value: this.settings.frequency },
                    uType: { value: typeMap[this.settings.filterType] || 0 },
                    uOctaves: { value: this.settings.octaves },
                    uColorShift: { value: this.settings.colorShift }
                },
                transparent: true
            });

            var geo = new THREE.PlaneGeometry(w, h);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            mesh.userData = { imageIndex: img, media: mediaList[img] };
            group.add(mesh);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speed = this.settings.animSpeed / 100;
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
                mesh.material.uniforms.uIntensity.value = this.settings.intensity;
                mesh.material.uniforms.uFreq.value = this.settings.frequency;
                mesh.material.uniforms.uType.value = typeMap[this.settings.filterType] || 0;
                mesh.material.uniforms.uOctaves.value = this.settings.octaves;
                mesh.material.uniforms.uColorShift.value = this.settings.colorShift;

                var lt = (t - segStart) / segDur;
                var appear = lt < 0.1 ? lt / 0.1 : 1;
                var disappear = lt > 0.9 ? (lt - 0.9) / 0.1 : 0;
                mesh.material.opacity = appear * (1 - disappear);
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
