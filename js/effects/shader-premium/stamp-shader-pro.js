(function() {
    var effect = new EP.EffectBase('stamp-shader-pro', {
        name: 'Stamp Shader Pro',
        category: 'shader-premium',
        icon: '🖋️',
        description: 'Sello / linograbado — umbral papel+tinta con textura de grano, distorsión edge, variantes offset y risograph, calidad ditther.com Stamp'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'threshold', type: 'range', min: 0, max: 100, default: 50, step: 1, label: 'Umbral tinta', unit: '%' },
        { key: 'inkColor', type: 'color', default: '#1a0a00', label: 'Color tinta' },
        { key: 'paperColor', type: 'color', default: '#f5e8c8', label: 'Color papel' },
        { key: 'grain', type: 'range', min: 0, max: 100, default: 40, step: 5, label: 'Grano papel', unit: '%' },
        { key: 'edgeBleed', type: 'range', min: 0, max: 10, default: 3, step: 1, label: 'Sangría de borde', unit: 'px' },
        { key: 'stampMode', type: 'select', options: [
            { v: 'classic', l: 'Clásico (b/n sello)' },
            { v: 'risograph', l: 'Risograph (2 tintas)' },
            { v: 'offset', l: 'Offset litografía (3 colores)' },
            { v: 'silkscreen', l: 'Serigrafía' }
        ], default: 'classic', label: 'Técnica' },
        { key: 'ink2Color', type: 'color', default: '#c00020', label: 'Tinta 2 (riso/offset)' },
        { key: 'animThreshold', type: 'select', options: [
            { v: 'on', l: 'Umbral pulsante' },
            { v: 'off', l: 'Umbral fijo' }
        ], default: 'off', label: 'Animación umbral' }
    ]);

    var _vert = [
        'varying vec2 vUv;',
        'void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}'
    ].join('\n');

    var _frag = [
        'uniform sampler2D uTex;',
        'uniform sampler2D uMedia;',
        'uniform bool uHasMedia;',
        'uniform float uThreshold;',
        'uniform vec3 uInkColor;',
        'uniform vec3 uPaperColor;',
        'uniform float uGrain;',
        'uniform float uEdgeBleed;',
        'uniform int uMode;',
        'uniform vec3 uInk2Color;',
        'uniform float uTime;',
        'varying vec2 vUv;',

        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);float a=hash(i);float b=hash(i+vec2(1.,0.));float c=hash(i+vec2(0.,1.));float d=hash(i+vec2(1.,1.));vec2 u=f*f*(3.-2.*f);return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;}',

        'void main(){',
        '  vec2 uv=vUv;',
        '  vec4 src;',
        '  if(uHasMedia){ src=texture2D(uMedia,uv); }',
        '  else{ src=vec4(noise(uv*4.+uTime*0.1)*0.8+0.1); src.a=1.; }',
        '  float lum=0.299*src.r+0.587*src.g+0.114*src.b;',

        // Paper grain
        '  float grainV=hash(uv*512.)*uGrain;',
        '  lum+=grainV*0.12-0.06;',

        // Edge bleed: slight smear toward neighbor pixels
        '  vec2 texel=vec2(uEdgeBleed/512.,uEdgeBleed/288.);',
        '  float lumN=0.299*texture2D(uMedia,uv+vec2(0.,texel.y)).r;',
        '  lum=mix(lum,max(lum,lumN*0.5),0.15);',

        '  float thr=uThreshold;',
        '  vec3 col;',

        '  if(uMode==0){',
        //   Classic b/w stamp
        '    float ink=step(thr,lum);',
        '    col=mix(uInkColor,uPaperColor,ink);',
        '  } else if(uMode==1){',
        //   Risograph: 2-color halftone
        '    float ink1=step(thr,lum);',
        '    float ink2=step(thr+0.2,lum);',
        '    col=uPaperColor;',
        '    if(ink1<0.5) col=uInkColor;',
        '    else if(ink2<0.5) col=uInk2Color;',
        '  } else if(uMode==2){',
        //   Offset litho: 3 channels separate
        '    float lumR=0.299*src.r; float lumG=0.587*src.g; float lumB=0.114*src.b;',
        '    float inks=step(thr,lumR+lumG+lumB);',
        '    float inkC=step(thr*0.8,lumB);',
        '    col=mix(mix(uInkColor,uInk2Color,inkC),uPaperColor,inks);',
        '  } else {',
        //   Silkscreen: flat color areas
        '    float l=floor(lum*4.)/4.;',
        '    float ink=step(thr,l);',
        '    col=mix(uInkColor,uPaperColor,ink);',
        '    col=mix(col,uInk2Color,step(0.5,l)*(1.-ink));',
        '  }',

        // Paper texture vignette
        '  float vign=1.-length((uv-0.5)*1.4);',
        '  col*=mix(0.88,1.,vign);',

        '  gl_FragColor=vec4(col,1.);',
        '}'
    ].join('\n');

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._mediaTexture = null;
        this._m0 = null;
        var m0 = mediaList && mediaList[0];
        if (m0) {
            this._m0 = m0;
            if (m0.texture && m0.texture.image) {
                this._mediaTexture = m0.texture;
            }
        }

        this._uniforms = {
            uMedia:     { value: this._mediaTexture || new THREE.Texture() },
            uHasMedia:  { value: !!this._mediaTexture },
            uThreshold: { value: 0.5 },
            uInkColor:  { value: new THREE.Color('#1a0a00') },
            uPaperColor:{ value: new THREE.Color('#f5e8c8') },
            uGrain:     { value: 0.4 },
            uEdgeBleed: { value: 3.0 },
            uMode:      { value: 0 },
            uInk2Color: { value: new THREE.Color('#c00020') },
            uTime:      { value: 0 }
        };
        var mat = new THREE.ShaderMaterial({
            vertexShader: _vert, fragmentShader: _frag,
            uniforms: this._uniforms, depthWrite: false
        });
        var geo = new THREE.PlaneGeometry(8, 4.5);
        group.add(new THREE.Mesh(geo, mat));
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._uniforms) return;
        // Poll for texture if not yet available at build time
        if (!this._mediaTexture && this._m0) {
            var t = this._m0.texture;
            if (t && t.image) {
                this._mediaTexture = t;
                this._uniforms.uMedia.value = t;
                this._uniforms.uHasMedia.value = true;
            }
        }
        // Keep video texture updated every frame
        if (this._mediaTexture && this._m0 && this._m0.element &&
                this._m0.element.tagName === 'VIDEO' && this._m0.element.readyState >= 2) {
            this._mediaTexture.needsUpdate = true;
        }
        var u = this._uniforms;
        var thr = this.settings.threshold / 100;
        if (this.settings.animThreshold === 'on') {
            thr = thr * (0.75 + 0.25 * Math.sin(time * 1.5));
        }
        u.uThreshold.value = thr;
        u.uInkColor.value.set(this.settings.inkColor || '#1a0a00');
        u.uPaperColor.value.set(this.settings.paperColor || '#f5e8c8');
        u.uGrain.value = this.settings.grain / 100;
        u.uEdgeBleed.value = this.settings.edgeBleed;
        u.uInk2Color.value.set(this.settings.ink2Color || '#c00020');
        u.uTime.value = time;
        var modeMap = { classic: 0, risograph: 1, offset: 2, silkscreen: 3 };
        u.uMode.value = modeMap[this.settings.stampMode] || 0;
    };

    effect.dispose = function() {
        this._uniforms = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
