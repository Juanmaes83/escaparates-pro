(function() {
    var effect = new EP.EffectBase('particles-brightness-gamma', {
        name: 'Particles Brightness Gamma',
        category: 'motion',
        icon: 'PG',
        description: 'Imagen principal con borde de particulas, color natural por defecto y gamma opcional'
    }, [
        { key: 'cardSize', type: 'range', min: 45, max: 145, default: 96, step: 1, label: 'Image Size', unit: '%' },
        { key: 'particles', type: 'range', min: 200, max: 2400, default: 900, step: 50, label: 'Particles' },
        { key: 'motion', type: 'range', min: 0, max: 200, default: 65, step: 1, label: 'Motion', unit: '%' },
        { key: 'exposure', type: 'range', min: 10, max: 90, default: 50, step: 1, label: 'Exposure', unit: '%' },
        { key: 'brightness', type: 'range', min: 50, max: 160, default: 100, step: 1, label: 'Brightness', unit: '%' },
        { key: 'gamma', type: 'range', min: 50, max: 180, default: 100, step: 1, label: 'Gamma', unit: '%' },
        { key: 'background', type: 'color', default: '#f7f7f4', label: 'Background' }
    ]);

    function textureFromMedia(media) {
        var tex = media.type === 'video' ? new THREE.VideoTexture(media.element) : new THREE.Texture(media.element);
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return tex;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var media = mediaList[0];
        var tex = textureFromMedia(media);
        var el = media.element;
        var aspect = (el.videoWidth || el.naturalWidth || el.width || 1) / (el.videoHeight || el.naturalHeight || el.height || 1);
        var size = this.settings.cardSize / 100 * 5.2;
        var w = aspect >= 1 ? size : size * aspect;
        var h = aspect >= 1 ? size / aspect : size;
        var imgMat = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: tex },
                uBrightness: { value: this.settings.brightness / 100 },
                uGamma: { value: this.settings.gamma / 100 }
            },
            vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: 'uniform sampler2D uTexture;uniform float uBrightness;uniform float uGamma;varying vec2 vUv;void main(){vec4 c=texture2D(uTexture,vUv);c.rgb*=uBrightness;c.rgb=pow(max(c.rgb,vec3(0.0)),vec3(1.0/max(uGamma,0.01)));gl_FragColor=c;}',
            transparent: true,
            side: THREE.DoubleSide
        });
        var image = new THREE.Mesh(EP.RoundedPlaneGeometry(w, h, 0.09), imgMat);
        image.userData = { isImage: true };
        group.add(image);

        var count = Math.floor(this.settings.particles);
        var geo = new THREE.BufferGeometry();
        var pos = new Float32Array(count * 3);
        var color = new Float32Array(count * 3);
        var seeds = new Float32Array(count);
        for (var i = 0; i < count; i++) {
            var edge = i % 4;
            var u = Math.random();
            var x = edge < 2 ? (u - 0.5) * w : (edge === 2 ? -w / 2 : w / 2);
            var y = edge < 2 ? (edge === 0 ? -h / 2 : h / 2) : (u - 0.5) * h;
            pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = 0.1;
            color[i * 3] = 0.35 + Math.random() * 0.65;
            color[i * 3 + 1] = 0.35 + Math.random() * 0.65;
            color[i * 3 + 2] = 0.35 + Math.random() * 0.65;
            seeds[i] = Math.random() * Math.PI * 2;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(color, 3));
        var points = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.038, vertexColors: true, transparent: true, opacity: 0.86 }));
        points.userData = { isParticles: true, base: pos.slice(0), seeds: seeds };
        group.add(points);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var motion = this.settings.motion / 100;
        var exposure = this.settings.exposure / 100;
        this.group.children.forEach(function(child) {
            if (child.userData.isImage) {
                child.material.uniforms.uBrightness.value = effect.settings.brightness / 100;
                child.material.uniforms.uGamma.value = effect.settings.gamma / 100;
                if (child.material.uniforms.uTexture.value.isVideoTexture) child.material.uniforms.uTexture.value.needsUpdate = true;
                child.scale.setScalar(0.92 + exposure * 0.14 + Math.sin(time * 0.6) * 0.015 * motion);
            }
            if (child.userData.isParticles) {
                var arr = child.geometry.attributes.position.array;
                var base = child.userData.base;
                var seeds = child.userData.seeds;
                for (var i = 0; i < seeds.length; i++) {
                    arr[i * 3] = base[i * 3] + Math.sin(time * 1.4 * motion + seeds[i]) * 0.18 * motion;
                    arr[i * 3 + 1] = base[i * 3 + 1] + Math.cos(time * 1.1 * motion + seeds[i]) * 0.12 * motion;
                    arr[i * 3 + 2] = base[i * 3 + 2] + Math.sin(time * 1.8 * motion + seeds[i]) * 0.55 * motion;
                }
                child.geometry.attributes.position.needsUpdate = true;
            }
        });
    };

    EP.Registry.register(effect);
})();
