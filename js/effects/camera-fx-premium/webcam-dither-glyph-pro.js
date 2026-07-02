(function() {
    var effect = new EP.EffectBase('webcam-dither-glyph-pro', {
        name: 'Webcam Dither Glyph PRO',
        category: 'camera-fx-premium',
        icon: 'WG',
        description: 'Webcam o media convertida en glifos dither WebGL con estilos Glitch, Hash, Hearts y ASCII'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'sourceMode', type: 'select', options: [{ v: 'media', l: 'Media subida' }, { v: 'webcam', l: 'Webcam directa' }, { v: 'webcam-media', l: 'Webcam + fallback media' }], default: 'media', label: 'Source Mode' },
        { key: 'glyphStyle', type: 'select', options: [{ v: 'glitch', l: 'Glitch' }, { v: 'hash', l: 'Hash' }, { v: 'hearts', l: 'Hearts' }, { v: 'ascii', l: 'ASCII' }], default: 'glitch', label: 'Glyph Style' },
        { key: 'colorMode', type: 'select', options: [{ v: 'source', l: 'Source Color' }, { v: 'hue', l: 'Hue Gradient' }, { v: 'mono', l: 'Mono' }], default: 'source', label: 'Color Mode' },
        { key: 'glyphSize', type: 'range', min: 2, max: 40, default: 7, step: 1, label: 'Glyph Size' },
        { key: 'threshold', type: 'range', min: -60, max: 60, default: 0, step: 1, label: 'Threshold', unit: '%' },
        { key: 'contrast', type: 'range', min: 40, max: 260, default: 135, step: 1, label: 'Contrast', unit: '%' },
        { key: 'saturation', type: 'range', min: 0, max: 160, default: 100, step: 1, label: 'Saturation', unit: '%' },
        { key: 'hue', type: 'range', min: 0, max: 628, default: 225, step: 1, label: 'Hue', unit: '' },
        { key: 'mirror', type: 'select', options: [{ v: 'on', l: 'Mirror On' }, { v: 'off', l: 'Mirror Off' }], default: 'on', label: 'Camera Mirror' },
        { key: 'foreground', type: 'color', default: '#f7f4df', label: 'Foreground' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: false,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'high',
        minMedia: 0,
        exportSafe: true,
        hasErrorBoundary: true,
        usesWebcam: true
    };

    var vertexShader = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
    var fragmentShader = [
        'uniform sampler2D uTexture;',
        'uniform float uTime;',
        'uniform float uGlyphSize;',
        'uniform float uStyle;',
        'uniform float uColorMode;',
        'uniform float uHue;',
        'uniform float uSaturation;',
        'uniform float uContrast;',
        'uniform float uThreshold;',
        'uniform float uMirror;',
        'uniform vec2 uResolution;',
        'uniform vec3 uForeground;',
        'uniform vec3 uBackground;',
        'varying vec2 vUv;',
        'vec3 hsv(vec3 c){vec3 rgb=clamp(abs(mod(c.x*2.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);return c.z*mix(vec3(1.0),rgb,c.y);}',
        'float character(float n, vec2 p){',
        '  p=floor(p*vec2(-4.0,4.0)+2.5);',
        '  if(clamp(p.x,0.0,4.0)==p.x&&clamp(p.y,0.0,4.0)==p.y){',
        '    float a=floor(p.x+5.0*p.y);',
        '    return mod(floor(n/pow(2.0,a)),2.0);',
        '  }',
        '  return 0.0;',
        '}',
        'float glyphCode(float gray, float style){',
        '  float n=4096.0;',
        '  if(style<0.5){',
        '    if(gray>.023)n=128.0;if(gray>.046)n=131200.0;if(gray>.069)n=4329476.0;if(gray>.093)n=459200.0;if(gray>.116)n=4591748.0;if(gray>.139)n=12652620.0;if(gray>.162)n=14749828.0;if(gray>.186)n=18393220.0;if(gray>.209)n=15239300.0;if(gray>.232)n=17318431.0;if(gray>.255)n=32641156.0;if(gray>.279)n=18393412.0;if(gray>.302)n=18157905.0;if(gray>.325)n=17463428.0;if(gray>.348)n=14954572.0;if(gray>.372)n=13177118.0;if(gray>.395)n=18405034.0;if(gray>.418)n=16269839.0;if(gray>.441)n=15018318.0;if(gray>.465)n=18400814.0;if(gray>.488)n=33081316.0;if(gray>.511)n=15255086.0;if(gray>.534)n=32045584.0;if(gray>.558)n=6566222.0;if(gray>.581)n=15022158.0;if(gray>.604)n=18444881.0;if(gray>.627)n=16272942.0;if(gray>.651)n=18415153.0;if(gray>.674)n=32641183.0;if(gray>.697)n=32540207.0;if(gray>.720)n=18732593.0;if(gray>.744)n=18667121.0;if(gray>.767)n=16267326.0;if(gray>.790)n=32575775.0;if(gray>.814)n=15022414.0;if(gray>.837)n=15255537.0;if(gray>.860)n=32032318.0;if(gray>.883)n=32045617.0;if(gray>.907)n=33061392.0;if(gray>.930)n=33061407.0;if(gray>.953)n=32045630.0;if(gray>.976)n=11512810.0;',
        '  }else if(style<1.5){',
        '    if(gray>.185)n=65792.0;if(gray>.225)n=102168.0;if(gray>.325)n=18157905.0;if(gray>.455)n=22369621.0;if(gray>.525)n=22511061.0;if(gray>.675)n=33412991.0;if(gray>.725)n=33222335.0;if(gray>.825)n=33550335.0;if(gray>.925)n=33554431.0;',
        '  }else if(style<2.5){',
        '    if(gray>.1)n=4096.0;if(gray>.3)n=342144.0;if(gray>.4)n=359876.0;if(gray>.5)n=11533764.0;if(gray>.6)n=33212287.0;if(gray>.7)n=29360110.0;if(gray>.9)n=33544063.0;',
        '  }else{',
        '    if(gray>.05)n=4.0;if(gray>.15)n=69905.0;if(gray>.25)n=992.0;if(gray>.35)n=1050625.0;if(gray>.45)n=33488896.0;if(gray>.55)n=16843009.0;if(gray>.65)n=164836.0;if(gray>.75)n=2236962.0;if(gray>.85)n=2113665.0;if(gray>.95)n=1118481.0;',
        '  }',
        '  return n;',
        '}',
        'void main(){',
        '  vec2 uv=vUv;',
        '  if(uMirror>0.5) uv.x=1.0-uv.x;',
        '  float size=max(2.0,uGlyphSize);',
        '  vec2 res=max(uResolution,vec2(1.0));',
        '  vec2 grid=floor(gl_FragCoord.xy/size)*size;',
        '  vec2 suv=grid/res;',
        '  suv=clamp(suv,0.0,1.0);',
        '  if(uMirror>0.5) suv.x=1.0-suv.x;',
        '  vec3 col=texture2D(uTexture,suv).rgb;',
        '  col=pow(max(col,0.0),vec3(2.2));',
        '  float gray=dot(col,vec3(.3,.6,.1));',
        '  gray=clamp((gray-0.5)*uContrast+0.5+uThreshold,0.0,1.0);',
        '  float n=glyphCode(gray,uStyle);',
        '  vec2 p=mod(gl_FragCoord.xy/size,1.0)-0.5;',
        '  if(uStyle<0.5) p=mod(gl_FragCoord.xy/size,2.0)-vec2(1.0);',
        '  float mask=character(n,p);',
        '  vec3 ink=uForeground;',
        '  if(uColorMode<0.5) ink=mix(vec3(gray),col,uSaturation);',
        '  else if(uColorMode<1.5) ink=hsv(vec3(uHue+gray*.85,uSaturation,.84));',
        '  vec3 outCol=mix(uBackground,ink,mask);',
        '  gl_FragColor=vec4(pow(max(outCol,0.0),vec3(.4545)),1.0);',
        '}'
    ].join('\n');

    function fallbackCanvasTexture(label) {
        var canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f7f4df';
        ctx.font = '600 42px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label || 'WEBCAM / MEDIA', canvas.width / 2, canvas.height / 2);
        var tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    function createHiddenVideo() {
        if (typeof document === 'undefined') return null;
        var video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.loop = true;
        video.style.display = 'none';
        return video;
    }

    function styleValue(style) {
        if (style === 'glitch') return 1;
        if (style === 'hearts') return 2;
        if (style === 'hash') return 3;
        return 0;
    }

    function colorModeValue(mode) {
        if (mode === 'hue') return 1;
        if (mode === 'mono') return 2;
        return 0;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._sourceType = 'fallback';
        this._webcamStream = null;
        this._webcamVideo = null;
        var hasMedia = !!(mediaList && mediaList.length && mediaList[0].element);
        var fallbackTexture = hasMedia
            ? EP.Media.createTexture(mediaList[0], { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter })
            : fallbackCanvasTexture('ACTIVA WEBCAM O SUBE MEDIA');
        var texture = fallbackTexture;

        var wantsWebcam = this.settings.sourceMode === 'webcam' || this.settings.sourceMode === 'webcam-media';
        if (this.settings.sourceMode === 'media') {
            this._sourceType = hasMedia ? 'media' : 'fallback';
        }
        if (wantsWebcam && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            var video = createHiddenVideo();
            this._webcamVideo = video;
            var webcamTexture = new THREE.VideoTexture(video);
            webcamTexture.minFilter = THREE.LinearFilter;
            webcamTexture.magFilter = THREE.LinearFilter;
            webcamTexture.generateMipmaps = false;
            this._sourceType = hasMedia ? 'webcam-pending-media' : 'webcam-pending';
            navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function(stream) {
                effect._webcamStream = stream;
                video.srcObject = stream;
                video.play().catch(function() {});
                effect._texture = webcamTexture;
                if (effect._mesh && effect._mesh.material && effect._mesh.material.uniforms) {
                    effect._mesh.material.uniforms.uTexture.value = webcamTexture;
                }
                effect._sourceType = 'webcam';
            }).catch(function() {
                effect._sourceType = hasMedia ? 'media-fallback' : 'webcam-denied';
                if (effect._mesh && effect._mesh.material && effect._mesh.material.uniforms) {
                    effect._mesh.material.uniforms.uTexture.value = fallbackTexture;
                }
            });
        }

        this._texture = texture;
        this._fallbackTexture = fallbackTexture;
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: texture },
                uTime: { value: 0 },
                uGlyphSize: { value: this.settings.glyphSize },
                uStyle: { value: styleValue(this.settings.glyphStyle) },
                uColorMode: { value: colorModeValue(this.settings.colorMode) },
                uHue: { value: this.settings.hue / 100 },
                uSaturation: { value: this.settings.saturation / 100 },
                uContrast: { value: this.settings.contrast / 100 },
                uThreshold: { value: this.settings.threshold / 100 },
                uMirror: { value: this.settings.mirror === 'on' ? 1 : 0 },
                uResolution: { value: new THREE.Vector2(1280, 720) },
                uForeground: { value: new THREE.Color(this.settings.foreground) },
                uBackground: { value: new THREE.Color(this.settings.background) }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        this._mesh = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 7.1), mat);
        group.add(this._mesh);
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._mesh) return;
        var mat = this._mesh.material;
        EP.Media.updateTexture(mat.uniforms.uTexture.value);
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        mat.uniforms.uTime.value = time * speed;
        mat.uniforms.uGlyphSize.value = this.settings.glyphSize;
        mat.uniforms.uStyle.value = styleValue(this.settings.glyphStyle);
        mat.uniforms.uColorMode.value = colorModeValue(this.settings.colorMode);
        mat.uniforms.uHue.value = this.settings.hue / 100;
        mat.uniforms.uSaturation.value = this.settings.saturation / 100;
        mat.uniforms.uContrast.value = this.settings.contrast / 100;
        mat.uniforms.uThreshold.value = this.settings.threshold / 100;
        mat.uniforms.uMirror.value = this.settings.mirror === 'on' ? 1 : 0;
        if (EP.Core.renderer && EP.Core.renderer.domElement) {
            mat.uniforms.uResolution.value.set(
                EP.Core.renderer.domElement.width || 1280,
                EP.Core.renderer.domElement.height || 720
            );
        }
        mat.uniforms.uForeground.value.set(this.settings.foreground);
        mat.uniforms.uBackground.value.set(this.settings.background);
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.scene.background = new THREE.Color(this.settings.background);
        EP.Core.camera.position.set(0, 0, 10);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this._webcamStream) {
            this._webcamStream.getTracks().forEach(function(track) { track.stop(); });
        }
        if (this._webcamVideo) {
            this._webcamVideo.pause();
            this._webcamVideo.srcObject = null;
        }
        this._webcamStream = null;
        this._webcamVideo = null;
        this._mesh = null;
        this._texture = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
