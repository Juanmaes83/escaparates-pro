(function() {
    var effect = new EP.EffectBase('image-to-3d-text', {
        name: 'Particle Morph · Imagen a Texto 3D',
        category: 'particle-morph',
        icon: '🔠',
        description: 'La imagen del cliente se disuelve en partículas que forman un texto 3D extruido que rota — hover infla las letras, y el ciclo devuelve la imagen con nitidez total'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'mainText',   type: 'text', default: 'LUXURY', label: 'Texto a formar' },
        { key: 'fontSize',   type: 'range', min: 40, max: 200, default: 140, step: 10, label: 'Tamaño fuente', unit: 'px' },
        { key: 'extrudeDepth', type: 'range', min: 10, max: 100, default: 45, step: 5, label: 'Profundidad extrusión', unit: '%' },
        { key: 'textColor',  type: 'color', default: '#ffd166', label: 'Color texto' },
        { key: 'morphSpeed', type: 'range', min: 10, max: 500, default: 100, step: 10, label: 'Velocidad morph', unit: '%' },
        { key: 'rotSpeed',   type: 'range', min: 0, max: 200, default: 70, step: 10, label: 'Velocidad rotación', unit: '%' },
        { key: 'inflateIntensity', type: 'range', min: 0, max: 200, default: 100, step: 10, label: 'Inflado hover', unit: '%' },
        { key: 'particleSize', type: 'range', min: 10, max: 300, default: 100, step: 10, label: 'Tamaño partícula', unit: '%' },
        { key: 'maxParticles', type: 'range', min: 10000, max: 200000, default: 60000, step: 5000, label: 'Máx. partículas' }
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
        'attribute float aDepthT;',       // 0 = back of extrusion, 1 = front face
        'uniform float uProgress;',       // 0 = image, 1 = 3D text formed
        'uniform float uTime;',
        'uniform float uRotY;',
        'uniform vec2 uMouse;',
        'uniform float uInflate;',
        'uniform float uSize;',
        'uniform vec3 uColorText;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        SNOISE,
        'void main() {',
        '  float p = clamp(uProgress * (1.0 + aRand * 0.5) - aRand * 0.25, 0.0, 1.0);',
        '  float e = p * p * (3.0 - 2.0 * p);',
        // Rotate the 3D text target around Y (image target stays flat)
        '  vec3 tp = aPositionText;',
        '  float ca = cos(uRotY), sa = sin(uRotY);',
        '  tp = vec3(tp.x * ca + tp.z * sa, tp.y, -tp.x * sa + tp.z * ca);',
        // Letter inflate near cursor (only when text is formed)
        '  vec2 dm = tp.xy - uMouse;',
        '  float md = length(dm);',
        '  if (md < 1.2) {',
        '    float f = (1.0 - md / 1.2);',
        '    tp.z += f * f * uInflate * e;',
        '  }',
        '  vec3 pos = mix(aPositionImage, tp, e);',
        // Organic flight noise, strongest mid-morph
        '  float flight = sin(e * 3.14159265);',
        '  vec3 noff = vec3(',
        '    snoise(pos * 0.9 + vec3(uTime * 0.34, 0.0, aRand * 9.0)),',
        '    snoise(pos * 0.9 + vec3(27.3, uTime * 0.31, aRand * 9.0)),',
        '    snoise(pos * 0.9 + vec3(0.0, 53.1, uTime * 0.28 + aRand * 9.0))',
        '  );',
        '  pos += noff * 0.7 * flight;',
        // Front-face particles glow brighter: fake extrusion lighting
        '  float faceLight = 0.55 + 0.45 * aDepthT;',
        '  vColor = mix(aColorImage, uColorText * faceLight, e);',
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
        '  vec3 col = vColor * (0.65 + glow * 0.5);',
        '  gl_FragColor = vec4(col, core * vAlpha * 0.45 * uGlobalAlpha);',
        '}'
    ].join('\n');

    function rasterText(text, fontPx) {
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
        return cand.length ? { cand: cand, W: W, H: H } : null;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._m0 = (mediaList && mediaList[0]) || null;
        // Real media plane — fully legible at image phase
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
        var raster = rasterText(this.settings.mainText || 'LUXURY', this.settings.fontSize);
        if (!raster) return false;
        var depth = (this.settings.extrudeDepth / 100) * 1.1;

        // Image origin positions + colors
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
                    imgPos[i * 3]     = (x / W - 0.5) * 8;
                    imgPos[i * 3 + 1] = -(y / H - 0.5) * 4.5;
                    imgPos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
                    imgCol[i * 3] = data[idx] / 255;
                    imgCol[i * 3 + 1] = data[idx + 1] / 255;
                    imgCol[i * 3 + 2] = data[idx + 2] / 255;
                }
            } else mediaReady = false;
        }
        if (!mediaReady) {
            // Demo: particles start scattered in a sphere with warm hues
            for (var j = 0; j < count; j++) {
                var a = Math.random() * Math.PI * 2, r2 = 1.5 + Math.random() * 2.2;
                imgPos[j * 3]     = Math.cos(a) * r2;
                imgPos[j * 3 + 1] = (Math.random() - 0.5) * 4;
                imgPos[j * 3 + 2] = Math.sin(a) * r2 * 0.4;
                var t = Math.random();
                imgCol[j * 3] = 0.9; imgCol[j * 3 + 1] = 0.4 + t * 0.4; imgCol[j * 3 + 2] = 0.2 + t * 0.3;
            }
        }
        this._mediaSampled = mediaReady;

        // 3D extruded text targets: raster XY + stacked Z layers
        var textPos = new Float32Array(count * 3);
        var depthT = new Float32Array(count);
        var rand = new Float32Array(count);
        var cand = raster.cand, n = cand.length / 2;
        for (var k = 0; k < count; k++) {
            var pick = (Math.random() * n) | 0;
            var dz = Math.random();                     // extrusion layer 0..1
            textPos[k * 3]     = (cand[pick * 2] / raster.W - 0.5) * 8 + (Math.random() - 0.5) * 0.015;
            textPos[k * 3 + 1] = -(cand[pick * 2 + 1] / raster.H - 0.5) * 4.5 + (Math.random() - 0.5) * 0.015;
            textPos[k * 3 + 2] = (dz - 0.5) * depth;
            depthT[k] = dz;
            rand[k] = Math.random();
        }

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
        geo.setAttribute('aDepthT', new THREE.BufferAttribute(depthT, 1));

        this._uniforms = {
            uProgress:    { value: 0 },
            uTime:        { value: 0 },
            uRotY:        { value: 0 },
            uMouse:       { value: new THREE.Vector2(99, 99) },
            uInflate:     { value: 1 },
            uSize:        { value: 1 },
            uColorText:   { value: new THREE.Color(this.settings.textColor || '#ffd166') },
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
        var sig = [this.settings.mainText, this.settings.fontSize, this.settings.extrudeDepth,
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
        u.uInflate.value = (this.settings.inflateIntensity / 100) * 0.8;
        u.uColorText.value.set(this.settings.textColor || '#ffd166');
        if (this._hasMouse) u.uMouse.value.set(this._mx * 4, this._my * 2.25);
        else u.uMouse.value.set(99, 99);

        // Cycle: image legible → dissolve to 3D text → rotate → return to image
        var speed = this.settings.morphSpeed / 100;
        var cyc = (time * speed * 0.12) % 1;
        var prog;
        if (cyc < 0.24)      prog = 0;
        else if (cyc < 0.48) prog = (cyc - 0.24) / 0.24;
        else if (cyc < 0.76) prog = 1;
        else                 prog = 1 - (cyc - 0.76) / 0.24;
        u.uProgress.value = prog;

        // Text rotation only while formed (scaled by progress)
        var rotSpd = this.settings.rotSpeed / 100;
        u.uRotY.value = Math.sin(time * rotSpd * 0.5) * 0.5 * prog;

        // Media plane fully legible at image phase, hidden while text is formed
        if (this._bgMat) {
            var hide = Math.min(1, prog * 2.2);
            this._bgMat.opacity = 0.96 * (1 - hide);
            // Particles nearly invisible while the real photo is on screen —
            // the crisp image is the hero at the endpoint
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
