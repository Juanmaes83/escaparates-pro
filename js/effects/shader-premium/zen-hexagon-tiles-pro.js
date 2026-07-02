(function() {
    var effect = new EP.EffectBase('zen-hexagon-tiles-pro', {
        name: 'Zen Hexagon Tiles PRO',
        category: 'shader-premium',
        icon: 'ZH',
        description: 'Patron hexagonal zen con log-polar, lineas truchet y color animado'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'tileScale', type: 'range', min: 25, max: 220, default: 100, step: 1, label: 'Tile Scale', unit: '%' },
        { key: 'lineWeight', type: 'range', min: 10, max: 180, default: 100, step: 1, label: 'Line Weight', unit: '%' },
        { key: 'colorShift', type: 'range', min: 0, max: 200, default: 75, step: 1, label: 'Color Shift', unit: '%' },
        { key: 'background', type: 'color', default: '#030409', label: 'Background' }
    ]);

    effect.capabilities = { supportsMotionDirection: true, supportsVideo: false, usesCamera: true, usesPostProcessing: false, usesParticlesShaders: true, mobileRisk: 'low', minMedia: 0, exportSafe: true, hasErrorBoundary: true };

    var vertexShader = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
    var fragmentShader = [
        'uniform float uTime; uniform float uScale; uniform float uLine; uniform float uColor; uniform vec2 uDirection; uniform vec3 uBackground; varying vec2 vUv;',
        'mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }',
        'float hash(vec2 p){ return fract(sin(dot(p,vec2(26.37,45.93)))*4374.23); }',
        'vec3 hsv(float h,float s,float v){ vec3 rgb=clamp(abs(mod(h*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0); return v*mix(vec3(1),rgb,s); }',
        'vec4 hexgrid(vec2 uv){ vec2 p1=floor(uv/vec2(1.732,1.0))+0.5; vec2 p2=floor((uv-vec2(1.0,0.5))/vec2(1.732,1.0))+0.5; vec2 h1=uv-p1*vec2(1.732,1.0); vec2 h2=uv-(p2+0.5)*vec2(1.732,1.0); return dot(h1,h1)<dot(h2,h2)?vec4(h1,p1):vec4(h2,p2+0.5); }',
        'void main(){ vec2 uv=vUv*2.0-1.0; uv.x*=1.777; vec2 dir=length(uDirection)<0.1?vec2(1.0,0.35):normalize(uDirection);',
        '  vec2 lp=-vec2(log(max(length(uv),0.002)), atan(uv.y,uv.x)); lp*=uScale*1.45; lp+=dir*uTime*0.16;',
        '  vec4 H=hexgrid(lp*3.0); vec2 p=H.xy; vec2 id=H.zw; float hs=hash(id); if(hs<0.5) p*=rot(hs<0.25?-1.047:1.047);',
        '  float border=max(abs(p.x)*0.866025+abs(p.y)*0.5,abs(p.y))-0.48; float px=0.018*uLine;',
        '  vec2 p0=p-vec2(-0.288,0.5); vec2 p1=p-vec2(0.577,0.0); vec2 p2=p-vec2(-0.288,-0.5); float d=min(min(abs(length(p0)-0.288),abs(length(p1)-0.288)),abs(length(p2)-0.288));',
        '  float line=smoothstep(px,0.0,d-0.025*uLine); float edge=smoothstep(px,0.0,abs(border)-0.012);',
        '  vec3 col=mix(uBackground, vec3(0.05), smoothstep(px,0.0,border)); col+=hsv(lp.x*0.09+hs*0.2+uColor+uTime*0.025,0.74,0.85)*(line+edge*0.45);',
        '  col*=smoothstep(1.6,0.04,length(uv)); gl_FragColor=vec4(pow(max(col,0.0),vec3(0.86)),1.0); }'
    ].join('\n');

    function directionVector(value) {
        if (value === 'ltr') return new THREE.Vector2(1, 0);
        if (value === 'rtl') return new THREE.Vector2(-1, 0);
        if (value === 'ttb') return new THREE.Vector2(0, -1);
        if (value === 'btt') return new THREE.Vector2(0, 1);
        return new THREE.Vector2(0, 0);
    }

    effect.build = function() {
        var group = new THREE.Group();
        this._mesh = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 7.1), new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: this.settings.tileScale / 100 },
                uLine: { value: this.settings.lineWeight / 100 },
                uColor: { value: this.settings.colorShift / 100 },
                uDirection: { value: directionVector(this.settings.motionDirection) },
                uBackground: { value: new THREE.Color(this.settings.background) }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        }));
        group.add(this._mesh);
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._mesh) return;
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var u = this._mesh.material.uniforms;
        u.uTime.value = time * speed;
        u.uScale.value = this.settings.tileScale / 100;
        u.uLine.value = this.settings.lineWeight / 100;
        u.uColor.value = this.settings.colorShift / 100;
        u.uDirection.value.copy(directionVector(this.settings.motionDirection));
        u.uBackground.value.set(this.settings.background);
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.camera.position.set(0, 0, 10);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        this._mesh = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
