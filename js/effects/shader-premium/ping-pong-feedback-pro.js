// Ping Pong Feedback PRO
// Two small WebGL render targets feed the previous frame back into the next
// one. The source media remains optional; the effect still has a procedural
// fallback when a client has not uploaded a video or image yet.
(function() {
    var effect = new EP.EffectBase('ping-pong-feedback-pro', {
        name: 'Ping Pong Feedback PRO',
        category: 'shader-premium',
        icon: 'PP',
        description: 'Video o imagen con feedback recursivo, refraccion hexagonal y estela cromatica controlable'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'feedback', type: 'range', min: 45, max: 96, default: 82, step: 1, label: 'Feedback Trail', unit: '%' },
        { key: 'hexScale', type: 'range', min: 10, max: 140, default: 58, step: 1, label: 'Hexagon Scale' },
        { key: 'drift', type: 'range', min: 0, max: 180, default: 58, step: 1, label: 'Feedback Drift', unit: '%' },
        { key: 'chroma', type: 'range', min: 0, max: 100, default: 35, step: 1, label: 'Chromatic Split', unit: '%' },
        { key: 'sourceMix', type: 'range', min: 0, max: 100, default: 48, step: 1, label: 'Source Mix', unit: '%' },
        { key: 'accentColor', type: 'color', default: '#b8ffea', label: 'Feedback Accent' },
        { key: 'background', type: 'color', default: '#07070d', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'high',
        minMedia: 0,
        exportSafe: true,
        hasErrorBoundary: true
    };

    var passVertex = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
    var displayVertex = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
    var passFragment = [
        'precision mediump float;',
        'uniform sampler2D uPrev; uniform sampler2D uMedia; uniform bool uHasMedia;',
        'uniform float uTime,uFeedback,uHex,uDrift,uChroma,uSourceMix;',
        'uniform vec2 uPointer; uniform vec3 uAccent,uBackground; varying vec2 vUv;',
        'vec2 hash2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}',
        'float hex(vec2 p){p=abs(p);return max(dot(p,vec2(.866,.5)),p.y);}',
        'void main(){',
        ' vec2 uv=vUv; vec2 q=uv-.5; q.x*=1.777;',
        ' float cells=max(2.0,uHex*.22); vec2 g=q*cells; vec2 id=floor(g); vec2 f=fract(g)-.5;',
        ' float mask=smoothstep(.48,.31,hex(f)); vec2 jitter=(hash2(id)-.5)*.028*mask;',
        ' vec2 orbit=vec2(cos(uTime*.21),sin(uTime*.17))*uDrift*.0015;',
        ' vec2 push=(uPointer-.5)*.028; vec2 prevUv=.5+(q*(1.0-.006*uFeedback)-orbit-push+jitter);',
        ' float split=uChroma*.0007; vec3 previous=vec3(texture2D(uPrev,prevUv+vec2(split,0.)).r,texture2D(uPrev,prevUv).g,texture2D(uPrev,prevUv-vec2(split,0.)).b);',
        ' vec3 source=uHasMedia?texture2D(uMedia,uv+jitter*.35).rgb:(.11+.10*cos(vec3(0.,2.,4.)+uTime+q.xyx*4.));',
        ' vec3 feedback=mix(previous,source,uSourceMix); feedback*=mix(.90,1.05,mask);',
        ' float glow=smoothstep(.42,.02,abs(hex(f)-.34)); feedback+=uAccent*glow*.12;',
        ' vec3 col=mix(uBackground,feedback,clamp(mask+.18,0.,1.)); gl_FragColor=vec4(col,1.);',
        '}'
    ].join('\n');
    var displayFragment = 'precision mediump float;uniform sampler2D uTexture;varying vec2 vUv;void main(){gl_FragColor=texture2D(uTexture,vUv);}';

    function createTarget(size) {
        return new THREE.WebGLRenderTarget(size, size, {
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
            depthBuffer: false, stencilBuffer: false
        });
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var media = mediaList && mediaList[0];
        this._mediaTexture = media ? EP.Media.createTexture(media, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }) : null;
        var profile = EP.DeviceProfile && EP.DeviceProfile.get ? EP.DeviceProfile.get() : null;
        var size = profile && profile.type !== 'desktop' ? (profile.lowPower ? 192 : 256) : 512;
        this._read = createTarget(size);
        this._write = createTarget(size);
        this._quadScene = new THREE.Scene();
        this._quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this._passMaterial = new THREE.ShaderMaterial({
            vertexShader: passVertex, fragmentShader: passFragment, depthTest: false, depthWrite: false,
            uniforms: {
                uPrev: { value: this._read.texture }, uMedia: { value: this._mediaTexture }, uHasMedia: { value: !!this._mediaTexture },
                uTime: { value: 0 }, uFeedback: { value: .82 }, uHex: { value: 58 }, uDrift: { value: .58 },
                uChroma: { value: .35 }, uSourceMix: { value: .48 }, uPointer: { value: new THREE.Vector2(.5, .5) },
                uAccent: { value: new THREE.Color(this.settings.accentColor) }, uBackground: { value: new THREE.Color(this.settings.background) }
            }
        });
        this._quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this._passMaterial));
        this._displayMaterial = new THREE.ShaderMaterial({ vertexShader: displayVertex, fragmentShader: displayFragment, uniforms: { uTexture: { value: this._read.texture } } });
        this._mesh = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 4.95), this._displayMaterial);
        group.add(this._mesh);
        this._pointer = new THREE.Vector2(.5, .5);
        var self = this;
        this._onPointer = function(event) {
            var canvas = EP.Core && EP.Core.renderer && EP.Core.renderer.domElement;
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            self._pointer.set((event.clientX - rect.left) / Math.max(1, rect.width), 1 - (event.clientY - rect.top) / Math.max(1, rect.height));
        };
        window.addEventListener('pointermove', this._onPointer, { passive: true });
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._mesh || !this._passMaterial || !EP.Core || !EP.Core.renderer) return;
        if (this._mediaTexture) EP.Media.updateTexture(this._mediaTexture);
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var u = this._passMaterial.uniforms;
        u.uPrev.value = this._read.texture;
        u.uTime.value = time * speed;
        u.uFeedback.value = this.settings.feedback / 100;
        u.uHex.value = this.settings.hexScale;
        u.uDrift.value = this.settings.drift / 100;
        u.uChroma.value = this.settings.chroma / 100;
        u.uSourceMix.value = this.settings.sourceMix / 100;
        u.uPointer.value.copy(this._pointer);
        u.uAccent.value.set(this.settings.accentColor);
        u.uBackground.value.set(this.settings.background);
        var renderer = EP.Core.renderer;
        var previous = renderer.getRenderTarget();
        renderer.setRenderTarget(this._write);
        renderer.render(this._quadScene, this._quadCamera);
        renderer.setRenderTarget(previous);
        var swap = this._read; this._read = this._write; this._write = swap;
        this._displayMaterial.uniforms.uTexture.value = this._read.texture;
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.camera.position.set(0, 0, 10);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this._onPointer) window.removeEventListener('pointermove', this._onPointer);
        if (this._read) this._read.dispose();
        if (this._write) this._write.dispose();
        if (this._passMaterial) this._passMaterial.dispose();
        if (this._displayMaterial) this._displayMaterial.dispose();
        if (this._quadScene && this._quadScene.children[0] && this._quadScene.children[0].geometry) this._quadScene.children[0].geometry.dispose();
        this._read = this._write = this._mediaTexture = this._mesh = this._passMaterial = null;
        this._displayMaterial = this._quadScene = this._quadCamera = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
