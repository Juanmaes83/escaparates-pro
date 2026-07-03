(function() {
    var effect = new EP.EffectBase('image-to-text-2d', {
        name: 'Particle Morph · Imagen a Texto',
        category: 'particle-morph',
        icon: '💥',
        description: 'La imagen nítida del cliente estalla en partículas que conservan su color, forman el titular y explotan de vuelta reconstruyendo la imagen con nitidez total'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'mainText',   type: 'text', default: 'SOLD', label: 'Texto destino' },
        { key: 'fontSize',   type: 'range', min: 40, max: 200, default: 150, step: 10, label: 'Tamaño fuente', unit: 'px' },
        { key: 'textColor',  type: 'color', default: '#ff5577', label: 'Color texto' },
        { key: 'textHold',   type: 'range', min: 1, max: 5, default: 3, step: 1, label: 'Tiempo en texto', unit: 's' },
        { key: 'morphSpeed', type: 'range', min: 10, max: 500, default: 100, step: 10, label: 'Velocidad morph', unit: '%' },
        { key: 'noiseAmp',   type: 'range', min: 0, max: 200, default: 110, step: 10, label: 'Intensidad noise', unit: '%' },
        { key: 'repelRadius', type: 'range', min: 0, max: 200, default: 90, step: 10, label: 'Radio repulsión cursor', unit: '%' },
        { key: 'particleSize', type: 'range', min: 10, max: 300, default: 100, step: 10, label: 'Tamaño partícula', unit: '%' },
        { key: 'maxParticles', type: 'range', min: 10000, max: 150000, default: 50000, step: 5000, label: 'Máx. partículas' }
    ]);

    var SNOISE = [
        'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
        'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
        'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
        'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
        'float snoise(vec3 v){',
        '  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);',
        '  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);',
        '  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;',
        '  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);',
        '  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;',
        '  i=mod289(i);',
        '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
        '  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;',
        '  vec4 j=p-49.0*floor(p*ns.z*ns.z);',
        '  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);',
        '  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;',
        '  vec4 h=1.0-abs(x)-abs(y);',
        '  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);',
        '  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;',
        '  vec4 sh=-step(h,vec4(0.0));',
        '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
        '  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);',
        '  vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);',
        '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
        '  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
        '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);',
        '  m=m*m;',
        '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
        '}'
    ].join('\n');

    var _vert = [
        'attribute vec3 aPositionImage;',
        'attribute vec3 aPositionText;',
        'attribute vec3 aColorImage;',
        'attribute float aRand;',
        'uniform float uProgress;',       // 0 = image, 1 = text
        'uniform float uBurst;',          // extra scatter on the return leg
        'uniform float uTime;',
        'uniform vec2 uMouse;',
        'uniform float uRepelRadius;',
        'uniform float uSize;',
        'uniform float uNoiseAmp;',
        'uniform vec3 uColorText;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        SNOISE,
        'void main() {',
        '  float p = clamp(uProgress * (1.0 + aRand * 0.5) - aRand * 0.25, 0.0, 1.0);',
        '  float e = p * p * (3.0 - 2.0 * p);',
        '  vec3 pos = mix(aPositionImage, aPositionText, e);',
        '  float flight = sin(e * 3.14159265);',
        '  float amp = uNoiseAmp * (1.0 + uBurst * 1.6);',
        '  vec3 noff = vec3(',
        '    snoise(pos * 0.85 + vec3(uTime * 0.36, 0.0, aRand * 8.0)),',
        '    snoise(pos * 0.85 + vec3(19.7, uTime * 0.33, aRand * 8.0)),',
        '    snoise(pos * 0.85 + vec3(0.0, 41.3, uTime * 0.3 + aRand * 8.0))',
        '  );',
        '  pos += noff * amp * flight;',
        // Cursor repulsion
        '  vec2 d = pos.xy - uMouse;',
        '  float dist = length(d);',
        '  if (dist < uRepelRadius && dist > 0.0001) {',
        '    float force = (1.0 - dist / uRepelRadius);',
        '    pos.xy += normalize(d) * force * force * 0.9;',
        '    pos.z  += force * 0.4;',
        '  }',
        // Particles keep their image color in flight; snap to text color on arrival
        '  float colorMix = e * e * e;',
        '  vColor = mix(aColorImage, uColorText, colorMix);',
        '  vAlpha = 0.5 + 0.5 * aRand;',
        '  vec4 mv = modelViewMatrix * vec4(pos, 1.0);',
        '  gl_PointSize = uSize * (28.0 / -mv.z) * (0.6 + aRand * 0.8);',
        '  gl_Position = projectionMatrix * mv;',
        '}'
    ].join('\n');

    var _frag = [
        'uniform float uGlobalAlpha;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'void main() {',
        '  vec2 c = gl_PointCoord - 0.5;',
        '  float d = length(c);',
        '  if (d > 0.5) discard;',
        '  float core = smoothstep(0.5, 0.12, d);',
        '  float glow = exp(-d * d * 9.0);',
        '  vec3 col = vColor * (0.65 + glow * 0.45);',
        '  gl_FragColor = vec4(col, core * vAlpha * 0.42 * uGlobalAlpha);',
        '}'
    ].join('\n');

    function rasterTextPositions(text, fontPx, count) {
        var W = 1024, H = 512;
        var cvs = document.createElement('canvas');
        cvs.width = W; cvs.height = H;
        var ctx = cvs.getContext('2d');
        ctx.fillStyle = '#fff';
        var size = fontPx;
        ctx.font = '900 ' + size + 'px Arial, sans-serif';
        while (size > 20 && ctx.measureText(text).width > W * 0.9) {
            size -= 8;
            ctx.font = '900 ' + size + 'px Arial, sans-serif';
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, W / 2, H / 2);
        var data;
        try { data = ctx.getImageData(0, 0, W, H).data; } catch (e) { return null; }
        var cand = [];
        for (var y = 0; y < H; y += 2) {
            for (var x = 0; x < W; x += 2) {
                if (data[(y * W + x) * 4 + 3] > 128) cand.push(x, y);
            }
        }
        var n = cand.length / 2;
        if (!n) return null;
        var out = new Float32Array(count * 3);
        for (var i = 0; i < count; i++) {
            var pick = (Math.random() * n) | 0;
            out[i * 3]     = (cand[pick * 2] / W - 0.5) * 8 + (Math.random() - 0.5) * 0.02;
            out[i * 3 + 1] = -(cand[pick * 2 + 1] / H - 0.5) * 4.5 + (Math.random() - 0.5) * 0.02;
            out[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
        }
        return out;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._m0 = (mediaList && mediaList[0]) || null;
        // Real media plane — perfectly legible when the image reconstructs
        this._bgMat = null;
        if (this._m0) {
            var bgMat = EP.Media.createMaterial(this._m0);
            bgMat.opacity = 0.96;
            var bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), bgMat);
            bgMesh.position.z = -0.05;
            group.add(bgMesh);
            this._bgMat = bgMat;
        }
        this._points = null;
        this._uniforms = null;
        this._sig = '';
        this._mx = 0; this._my = 0;
        this._hasMouse = false;

        var self = this;
        var dom = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
        if (dom) {
            this._onMouseMove = function(e) {
                var r = dom.getBoundingClientRect();
                self._mx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
                self._my = -((e.clientY - r.top)  / r.height - 0.5) * 2;
                self._hasMouse = true;
            };
            dom.addEventListener('mousemove', this._onMouseMove);
            this._dom = dom;
        }

        this.group = group;
        return group;
    };

    effect._rebuildParticles = function() {
        var count = Math.max(1000, Math.round(this.settings.maxParticles));
        var textPos = rasterTextPositions(this.settings.mainText || 'SOLD', this.settings.fontSize, count);
        if (!textPos) return false;

        var imgPos = new Float32Array(count * 3);
        var imgCol = new Float32Array(count * 3);
        var mediaReady = false, el = null;
        if (this._m0 && this._m0.element) {
            el = this._m0.element;
            if (el.tagName === 'VIDEO') mediaReady = el.readyState >= 2;
            else if (el.tagName === 'IMG') mediaReady = el.complete && el.naturalHeight > 0;
            else mediaReady = true;
        }
        if (mediaReady) {
            var W = 480, H = 270;
            var cvs = document.createElement('canvas');
            cvs.width = W; cvs.height = H;
            var ctx = cvs.getContext('2d');
            var data = null;
            try {
                ctx.drawImage(el, 0, 0, W, H);
                data = ctx.getImageData(0, 0, W, H).data;
            } catch (e) { data = null; }
            if (data) {
                for (var i = 0; i < count; i++) {
                    var x = (Math.random() * W) | 0, y = (Math.random() * H) | 0;
                    var idx = (y * W + x) * 4;
                    var r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255;
                    var lum = 0.299 * r + 0.587 * g + 0.114 * b;
                    imgPos[i * 3]     = (x / W - 0.5) * 8;
                    imgPos[i * 3 + 1] = -(y / H - 0.5) * 4.5;
                    imgPos[i * 3 + 2] = (lum - 0.5) * 0.5;
                    imgCol[i * 3] = r; imgCol[i * 3 + 1] = g; imgCol[i * 3 + 2] = b;
                }
            } else mediaReady = false;
        }
        if (!mediaReady) {
            // Demo: cool-hued particle field
            for (var j = 0; j < count; j++) {
                imgPos[j * 3]     = (Math.random() - 0.5) * 8;
                imgPos[j * 3 + 1] = (Math.random() - 0.5) * 4.5;
                imgPos[j * 3 + 2] = (Math.random() - 0.5) * 0.6;
                var t = Math.random();
                imgCol[j * 3] = 0.2 + t * 0.3; imgCol[j * 3 + 1] = 0.5 + t * 0.4; imgCol[j * 3 + 2] = 0.9;
            }
        }
        this._mediaSampled = mediaReady;

        var rand = new Float32Array(count);
        for (var k = 0; k < count; k++) rand[k] = Math.random();

        if (this._points) {
            this.group.remove(this._points);
            this._points.geometry.dispose();
            this._points.material.dispose();
            this._points = null;
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(imgPos.slice(0), 3));
        geo.setAttribute('aPositionImage', new THREE.BufferAttribute(imgPos, 3));
        geo.setAttribute('aPositionText', new THREE.BufferAttribute(textPos, 3));
        geo.setAttribute('aColorImage', new THREE.BufferAttribute(imgCol, 3));
        geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));

        this._uniforms = {
            uProgress:    { value: 0 },
            uBurst:       { value: 0 },
            uTime:        { value: 0 },
            uMouse:       { value: new THREE.Vector2(99, 99) },
            uRepelRadius: { value: 0.9 },
            uSize:        { value: 1 },
            uNoiseAmp:    { value: 0.6 },
            uColorText:   { value: new THREE.Color(this.settings.textColor || '#ff5577') },
            uGlobalAlpha: { value: 1 }
        };
        var mat = new THREE.ShaderMaterial({
            vertexShader: _vert, fragmentShader: _frag,
            uniforms: this._uniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this._points = new THREE.Points(geo, mat);
        this.group.add(this._points);
        return true;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;

        var mediaState = 'none';
        if (this._m0 && this._m0.element) {
            var el = this._m0.element;
            if (el.tagName === 'VIDEO') mediaState = el.readyState >= 2 ? 'ready' : 'wait';
            else if (el.tagName === 'IMG') mediaState = (el.complete && el.naturalHeight > 0) ? 'ready' : 'wait';
            else mediaState = 'ready';
        }
        var sig = [this.settings.mainText, this.settings.fontSize,
                   this.settings.maxParticles, mediaState].join('|');
        if (sig !== this._sig) {
            if (mediaState !== 'wait' || !this._points) {
                if (this._rebuildParticles()) this._sig = sig;
            }
        }
        if (!this._points || !this._uniforms) return;

        var u = this._uniforms;
        u.uTime.value = time;
        u.uSize.value = (this.settings.particleSize / 100) * 3.2;
        u.uNoiseAmp.value = (this.settings.noiseAmp / 100) * 0.6;
        u.uRepelRadius.value = (this.settings.repelRadius / 100) * 1.1;
        u.uColorText.value.set(this.settings.textColor || '#ff5577');
        if (this._hasMouse) u.uMouse.value.set(this._mx * 4, this._my * 2.25);
        else u.uMouse.value.set(99, 99);

        // Cycle with configurable text hold: image → text (hold Ns) → burst back
        var speed = this.settings.morphSpeed / 100;
        var holdS = this.settings.textHold;
        var flyS = 2.2, imgS = 2.6;
        var total = (imgS + flyS + holdS + flyS) / speed;
        var tt = (time % total) * speed;
        var prog, burst = 0;
        if (tt < imgS)                    prog = 0;
        else if (tt < imgS + flyS)        prog = (tt - imgS) / flyS;
        else if (tt < imgS + flyS + holdS) prog = 1;
        else { prog = 1 - (tt - imgS - flyS - holdS) / flyS; burst = 1; }
        u.uProgress.value = prog;
        u.uBurst.value = burst;

        // Media plane: perfectly legible while the image is whole
        if (this._bgMat) {
            var hide = Math.min(1, prog * 2.4);
            this._bgMat.opacity = 0.96 * (1 - hide);
            u.uGlobalAlpha.value = 0.05 + 0.95 * hide;
        }
    };

    effect.dispose = function() {
        if (this._dom && this._onMouseMove) this._dom.removeEventListener('mousemove', this._onMouseMove);
        this._dom = null; this._onMouseMove = null;
        this._points = null; this._uniforms = null; this._bgMat = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
