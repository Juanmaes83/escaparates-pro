(function() {
    var effect = new EP.EffectBase('radial-mask-gallery', {
        name: 'Galeria con Mascara Radial',
        category: 'reveal-wipe',
        icon: 'RM',
        description: 'Transicion por puntos radiales inspirada en Galeria con Mascara RadiaL'
    }, [
        { key: 'dotSize', type: 'range', min: 8, max: 48, default: 22, step: 1, label: 'Dot Grid' },
        { key: 'speed', type: 'range', min: 20, max: 220, default: 90, step: 1, label: 'Speed', unit: '%' },
        { key: 'feather', type: 'range', min: 1, max: 40, default: 10, step: 1, label: 'Feather', unit: '%' },
        { key: 'exposure', type: 'range', min: 40, max: 160, default: 100, step: 1, label: 'Exposure', unit: '%' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function textureFrom(media) {
        var tex = EP.Media.createTexture(media);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        return tex;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var a = textureFrom(mediaList[0]);
        var b = textureFrom(mediaList[Math.min(1, mediaList.length - 1)]);
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                mapA: { value: a },
                mapB: { value: b },
                uProgress: { value: 0 },
                uGrid: { value: this.settings.dotSize },
                uFeather: { value: this.settings.feather / 100 },
                uExposure: { value: this.settings.exposure / 100 }
            },
            vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: [
                'uniform sampler2D mapA;uniform sampler2D mapB;uniform float uProgress;uniform float uGrid;uniform float uFeather;uniform float uExposure;varying vec2 vUv;',
                'void main(){',
                'vec2 cell=fract(vUv*uGrid)-0.5;',
                'float d=length(cell)*2.0;',
                'float r=smoothstep(0.0,1.0,uProgress);',
                'float m=1.0-smoothstep(r-uFeather,r+uFeather,d);',
                'vec4 ca=texture2D(mapA,vUv);',
                'vec4 cb=texture2D(mapB,vUv);',
                'vec4 col=mix(ca,cb,m);',
                'col.rgb*=uExposure;',
                'gl_FragColor=col;',
                '}'
            ].join(''),
            transparent: true
        });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), mat);
        group.add(mesh);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this.group.children[0]) return;
        var mat = this.group.children[0].material;
        var p = ((time / loopDuration) * this.settings.speed / 100) % 1;
        mat.uniforms.uProgress.value = p < 0.5 ? p * 2 : (1 - p) * 2;
        mat.uniforms.uGrid.value = this.settings.dotSize;
        mat.uniforms.uFeather.value = this.settings.feather / 100;
        mat.uniforms.uExposure.value = this.settings.exposure / 100;
        if (mat.uniforms.mapA.value.isVideoTexture) mat.uniforms.mapA.value.needsUpdate = true;
        if (mat.uniforms.mapB.value.isVideoTexture) mat.uniforms.mapB.value.needsUpdate = true;
    };

    EP.Registry.register(effect);
})();
