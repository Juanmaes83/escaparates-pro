(function() {
    var effect = new EP.EffectBase('media-blinds-pro', {
        name: 'Media Blinds PRO',
        category: 'motion',
        icon: 'BL',
        description: 'Persiana luminosa tipo blend/contrast, adaptada a imagenes y videos'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'bands', type: 'range', min: 4, max: 48, default: 16, step: 1, label: 'Bands' },
        { key: 'speed', type: 'range', min: 20, max: 240, default: 100, step: 1, label: 'Speed', unit: '%' },
        { key: 'whiteout', type: 'range', min: 0, max: 100, default: 80, step: 1, label: 'Whiteout', unit: '%' },
        { key: 'contrast', type: 'range', min: 20, max: 200, default: 110, step: 1, label: 'Contrast', unit: '%' },
        { key: 'background', type: 'color', default: '#ffffff', label: 'Background' }
    ]);

    function tex(media) {
        var t = EP.Media.createTexture(media);
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.needsUpdate = true;
        return t;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: tex(mediaList[0]) },
                uTime: { value: 0 },
                uBands: { value: this.settings.bands },
                uWhiteout: { value: this.settings.whiteout / 100 },
                uContrast: { value: this.settings.contrast / 100 }
            },
            vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: [
                'uniform sampler2D map;uniform float uTime;uniform float uBands;uniform float uWhiteout;uniform float uContrast;varying vec2 vUv;',
                'void main(){',
                'vec4 c=texture2D(map,vUv);',
                'c.rgb=(c.rgb-0.5)*uContrast+0.5;',
                'float band=fract(vUv.y*uBands);',
                'float sweep=(sin(uTime)+1.0)*0.5;',
                'float open=smoothstep(sweep-0.18,sweep+0.18,band);',
                'float mask=mix(1.0,open,uWhiteout);',
                'gl_FragColor=vec4(mix(c.rgb,vec3(1.0),mask*uWhiteout),c.a);',
                '}'
            ].join(''),
            transparent: true
        });
        group.add(new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), mat));
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group || !this.group.children[0]) return;
        var mat = this.group.children[0].material;
        mat.uniforms.uTime.value = time * this.settings.speed / 100;
        mat.uniforms.uBands.value = this.settings.bands;
        mat.uniforms.uWhiteout.value = this.settings.whiteout / 100;
        mat.uniforms.uContrast.value = this.settings.contrast / 100;
        if (mat.uniforms.map.value.isVideoTexture) mat.uniforms.map.value.needsUpdate = true;
    };

    EP.Registry.register(effect);
})();
