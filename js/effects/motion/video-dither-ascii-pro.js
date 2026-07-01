(function() {
    var effect = new EP.EffectBase('video-dither-ascii-pro', {
        name: 'Video Dither ASCII Pro',
        category: 'motion',
        icon: 'DA',
        description: 'Dither, halftone y ASCII visual para video o imagen con color natural por defecto'
    }, [
        { key: 'cardSize', type: 'range', min: 55, max: 145, default: 112, step: 1, label: 'Canvas Size', unit: '%' },
        { key: 'cellSize', type: 'range', min: 6, max: 42, default: 16, step: 1, label: 'Cell Size' },
        { key: 'gap', type: 'range', min: 0, max: 16, default: 2, step: 0.5, label: 'Gap' },
        { key: 'contrast', type: 'range', min: 50, max: 170, default: 100, step: 1, label: 'Contrast', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 200, default: 42, step: 1, label: 'Motion', unit: '%' },
        { key: 'shape', type: 'select', options: [{ v: 'circle', l: 'Circle' }, { v: 'square', l: 'Square' }, { v: 'diamond', l: 'Diamond' }, { v: 'line', l: 'Line' }], default: 'circle', label: 'Shape' },
        { key: 'background', type: 'color', default: '#050505', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var tex = mediaList[0].type === 'video' ? EP.Media.createTexture(mediaList[0]) : EP.Media.createTexture(mediaList[0]);
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: tex },
                uCell: { value: this.settings.cellSize },
                uGap: { value: this.settings.gap },
                uContrast: { value: this.settings.contrast / 100 },
                uTime: { value: 0 },
                uShape: { value: 0 }
            },
            vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: [
                'uniform sampler2D uTexture;uniform float uCell;uniform float uGap;uniform float uContrast;uniform float uTime;uniform int uShape;varying vec2 vUv;',
                'float luma(vec3 c){return dot(c,vec3(0.299,0.587,0.114));}',
                'void main(){vec2 grid=vec2(96.0)/max(uCell,1.0);vec2 id=floor(vUv*grid);vec2 f=fract(vUv*grid)-0.5;vec2 uv=(id+0.5)/grid;vec3 col=texture2D(uTexture,uv).rgb;col=(col-0.5)*uContrast+0.5;col=clamp(col,0.0,1.0);float lum=luma(col);float radius=(0.48-uGap/max(uCell,1.0))*mix(0.22,1.0,lum);float d=length(f);',
                'if(uShape==1)d=max(abs(f.x),abs(f.y));else if(uShape==2)d=abs(f.x)+abs(f.y);else if(uShape==3)d=abs(f.y+sin(id.x*0.7+uTime)*0.18);',
                'float mask=1.0-smoothstep(radius,radius+0.035,d);vec3 bg=vec3(0.02);gl_FragColor=vec4(mix(bg,col,mask),1.0);}'
            ].join(''),
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(EP.RoundedPlaneGeometry(6.4, 3.8, 0.08), mat);
        mesh.userData = { isDither: true };
        mesh.scale.setScalar(this.settings.cardSize / 100);
        group.add(mesh);
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var mesh = this.group.children[0];
        if (!mesh) return;
        var shapeMap = { circle: 0, square: 1, diamond: 2, line: 3 };
        mesh.scale.setScalar(this.settings.cardSize / 100);
        mesh.material.uniforms.uCell.value = this.settings.cellSize;
        mesh.material.uniforms.uGap.value = this.settings.gap;
        mesh.material.uniforms.uContrast.value = this.settings.contrast / 100;
        mesh.material.uniforms.uTime.value = time * this.settings.motion / 100;
        mesh.material.uniforms.uShape.value = shapeMap[this.settings.shape] || 0;
        if (mesh.material.uniforms.uTexture.value.isVideoTexture) mesh.material.uniforms.uTexture.value.needsUpdate = true;
    };

    EP.Registry.register(effect);
})();
