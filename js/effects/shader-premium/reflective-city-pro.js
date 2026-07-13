// Reflective City PRO
// Rebuilt as a bounded raymarched city: real building faces and a reflective
// ground plane, while retaining the existing registry id and control contract.
(function() {
    var effect = new EP.EffectBase('reflective-city-pro', {
        name: 'Reflective City PRO',
        category: 'shader-premium',
        icon: 'RC',
        description: 'Ciudad procedural en profundidad con edificios raymarched, calles reflectantes y camara cinematica'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'auto', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'cityDensity', type: 'range', min: 25, max: 180, default: 96, step: 1, label: 'City Density', unit: '%' },
        { key: 'reflectionGlow', type: 'range', min: 0, max: 200, default: 115, step: 1, label: 'Reflection Glow', unit: '%' },
        { key: 'cameraAngle', type: 'range', min: 0, max: 200, default: 85, step: 1, label: 'Camera Angle', unit: '%' },
        { key: 'accentColor', type: 'color', default: '#8ff8ff', label: 'Accent Color' },
        { key: 'background', type: 'color', default: '#030712', label: 'Background' }
    ]);

    effect.capabilities = { supportsMotionDirection: true, supportsVideo: false, usesCamera: true, usesPostProcessing: false, usesParticlesShaders: true, mobileRisk: 'high', minMedia: 0, exportSafe: true, hasErrorBoundary: true };

    var vertexShader = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
    var fragmentShader = [
        'uniform float uTime,uDensity,uGlow,uAngle;',
        'uniform vec2 uDirection;',
        'uniform vec3 uAccent,uBackground;',
        'varying vec2 vUv;',
        'mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(27.609,57.583)))*43758.5453);}',
        'float box3(vec3 p,vec3 b){vec3 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,max(d.y,d.z)),0.);}',
        'float city(vec3 p){vec2 id=floor(p.xz);vec2 cell=fract(p.xz)-.5;float h=.42+hash(id)*2.35;float inset=.27+hash(id+5.3)*.08;return min(box3(vec3(cell.x,p.y-h*.5,cell.y),vec3(.5-inset,h*.5,.5-inset)),p.y);}',
        'vec3 normal(vec3 p){vec2 e=vec2(.003,0.);return normalize(vec3(city(p+e.xyy)-city(p-e.xyy),city(p+e.yxy)-city(p-e.yxy),city(p+e.yyx)-city(p-e.yyx)));}',
        'void main(){',
        ' vec2 uv=vUv*2.-1.;uv.x*=1.777;float angle=mix(.18,1.12,clamp(uAngle,0.,2.)*.5);vec2 dir=length(uDirection)<.1?vec2(1.,.35):normalize(uDirection);float density=mix(.72,1.9,clamp(uDensity,0.,1.8)/1.8);',
        ' vec3 ro=vec3(dir.x*uTime*.42,1.72+angle*.55,dir.y*uTime*.42);vec3 rd=normalize(vec3(uv.x*.82,uv.y*.36-.045,-1.35));rd.xz*=rot(-.34+dir.x*.18);float travel=.28;vec3 p=ro;float hit=0.;',
        ' for(int i=0;i<40;i++){p=ro+rd*travel;vec3 scaled=vec3(p.x*density,p.y*density,p.z*density);float d=city(scaled)/density;if(d<.008){hit=1.;break;}travel+=d*.72;if(travel>28.)break;}',
        ' vec3 sky=mix(uBackground,vec3(.055,.13,.19),smoothstep(-1.,1.,uv.y));vec3 col=sky;',
        ' if(hit>.5){vec3 n=normal(vec3(p.x*density,p.y*density,p.z*density));float fres=pow(1.-max(0.,dot(n,-rd)),3.);float light=max(.15,dot(n,normalize(vec3(-.5,.8,-.4))));vec2 block=floor(p.xz*density);float windows=step(.79,fract((p.y+block.x*2.1+block.y*1.3)*7.));vec3 concrete=mix(vec3(.025,.04,.055),uAccent,.16+fres*.34);col=concrete*light+uAccent*windows*uGlow*.34;if(p.y<.035){float shimmer=.5+.5*sin((p.x+p.z)*22.+uTime*3.);col=mix(col,uAccent*(.08+.16*shimmer)*uGlow,.62);}}',
        ' col=mix(col,sky,smoothstep(11.,27.,travel));col+=uAccent*.075*uGlow*pow(max(0.,1.-length(uv)),3.);col*=smoothstep(1.55,.15,length(uv));gl_FragColor=vec4(pow(max(col,0.),vec3(.78)),1.);',
        '}'
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
            uniforms: { uTime: { value: 0 }, uDensity: { value: this.settings.cityDensity / 100 }, uGlow: { value: this.settings.reflectionGlow / 100 }, uAngle: { value: this.settings.cameraAngle / 100 }, uDirection: { value: directionVector(this.settings.motionDirection) }, uAccent: { value: new THREE.Color(this.settings.accentColor) }, uBackground: { value: new THREE.Color(this.settings.background) } },
            vertexShader: vertexShader, fragmentShader: fragmentShader
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
        u.uDensity.value = this.settings.cityDensity / 100;
        u.uGlow.value = this.settings.reflectionGlow / 100;
        u.uAngle.value = this.settings.cameraAngle / 100;
        u.uDirection.value.copy(directionVector(this.settings.motionDirection));
        u.uAccent.value.set(this.settings.accentColor);
        u.uBackground.value.set(this.settings.background);
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.camera.position.set(0, 0, 10);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() { this._mesh = null; EP.EffectBase.prototype.dispose.call(this); };
    EP.Registry.register(effect);
})();
