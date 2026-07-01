(function() {
    var effect = new EP.EffectBase('photo-particles', {
        name: 'Photo Particles Flow',
        category: 'motion',
        icon: '✨',
        description: 'Flujo de particulas-foto en arco 3D — miles de sprites de imagenes fluyendo con GPU instancing'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'count', type: 'range', min: 500, max: 8000, default: 3000, step: 100, label: 'Particles' },
        { key: 'particleSize', type: 'range', min: 10, max: 100, default: 50, label: 'Size', unit: '%' },
        { key: 'flowSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Flow Speed', unit: '%' },
        { key: 'arcAmp', type: 'range', min: 0, max: 100, default: 60, label: 'Arc Amplitude', unit: '%' },
        { key: 'tubeRadius', type: 'range', min: 10, max: 100, default: 40, label: 'Spread', unit: '%' },
        { key: 'fadeRamp', type: 'range', min: 1, max: 20, default: 4, label: 'Fade Ramp', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    var vertShader = [
        'attribute float aS0;',
        'attribute vec3 aROffset;',
        'attribute vec2 aTile;',
        'attribute float aSize;',
        'varying vec2 vUvAtlas;',
        'varying float vFade;',
        'uniform float uTime;',
        'uniform float uSpeed;',
        'uniform float uStreamLen;',
        'uniform float uRadius;',
        'uniform float uArcAmp;',
        'uniform float uArcFreq;',
        'uniform float uBaseSize;',
        'uniform float uFadeRamp;',
        'uniform vec2 uTiles;',
        '',
        'vec3 arcPos(float s) {',
        '    float x = s - uStreamLen * 0.5;',
        '    float y = uArcAmp * sin(x * uArcFreq);',
        '    float z = 0.6 * uArcAmp * cos(x * uArcFreq * 0.7);',
        '    return vec3(x, y, z);',
        '}',
        '',
        'void main() {',
        '    float s = mod(aS0 + uTime * uSpeed, uStreamLen);',
        '    vec3 P = arcPos(s) + aROffset * uRadius;',
        '    vec4 mv = viewMatrix * vec4(P, 1.0);',
        '    float sz = uBaseSize * aSize;',
        '    mv.z += 0.5 * sz;',
        '    vec2 corner = position.xy;',
        '    mv.xyz += vec3(corner.x * sz, corner.y * sz, 0.0);',
        '    gl_Position = projectionMatrix * mv;',
        '    vUvAtlas = (uv + aTile) / uTiles;',
        '    float sn = s / uStreamLen;',
        '    float fi = smoothstep(0.0, uFadeRamp, sn);',
        '    float fo = 1.0 - smoothstep(1.0 - uFadeRamp, 1.0, sn);',
        '    vFade = min(fi, fo);',
        '}'
    ].join('\n');

    var fragShader = [
        'precision mediump float;',
        'uniform sampler2D uAtlas;',
        'uniform float uOpacity;',
        'varying vec2 vUvAtlas;',
        'varying float vFade;',
        'void main() {',
        '    vec4 tex = texture2D(uAtlas, vUvAtlas);',
        '    float alpha = tex.a * uOpacity * vFade;',
        '    if (alpha < 0.01) discard;',
        '    gl_FragColor = vec4(tex.rgb, alpha);',
        '}'
    ].join('\n');

    function randomInSphere(r) {
        var u = Math.random();
        var v = Math.random();
        var w = Math.random();
        var theta = 2 * Math.PI * u;
        var phi = Math.acos(2 * v - 1);
        var rr = r * Math.pow(w, 1 / 3);
        return new THREE.Vector3(
            rr * Math.sin(phi) * Math.cos(theta),
            rr * Math.sin(phi) * Math.sin(theta),
            rr * Math.cos(phi)
        );
    }

    function buildAtlas(mediaList, tileSize) {
        var n = mediaList.length;
        var cols = Math.ceil(Math.sqrt(n));
        var rows = Math.ceil(n / cols);
        var W = cols * tileSize;
        var H = rows * tileSize;

        var cvs = document.createElement('canvas');
        cvs.width = W;
        cvs.height = H;
        var ctx2d = cvs.getContext('2d');

        for (var i = 0; i < n; i++) {
            var media = mediaList[i];
            if (!media.element) continue;
            var cx = i % cols;
            var cy = Math.floor(i / cols);
            var x = cx * tileSize;
            var y = cy * tileSize;
            var el = media.element;
            var iw = el.videoWidth || el.naturalWidth || el.width || tileSize;
            var ih = el.videoHeight || el.naturalHeight || el.height || tileSize;
            var s = Math.max(tileSize / iw, tileSize / ih);
            var dw = iw * s;
            var dh = ih * s;
            var ox = x + (tileSize - dw) / 2;
            var oy = y + (tileSize - dh) / 2;
            ctx2d.drawImage(el, ox, oy, dw, dh);
        }

        var tex = new THREE.CanvasTexture(cvs);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;

        return { texture: tex, cols: cols, rows: rows };
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var tileSize = 128;
        var atlas = buildAtlas(mediaList, tileSize);
        this._atlas = atlas;

        var count = this.settings.count;
        var streamLen = 185;
        var tilesPerRow = atlas.cols;
        var tilesPerCol = atlas.rows;

        var base = new THREE.PlaneGeometry(1, 1, 1, 1);
        var geo = new THREE.InstancedBufferGeometry();
        geo.index = base.index;
        geo.setAttribute('position', base.getAttribute('position'));
        geo.setAttribute('uv', base.getAttribute('uv'));
        geo.instanceCount = count;

        var aS0 = new Float32Array(count);
        var aROffset = new Float32Array(count * 3);
        var aTile = new Float32Array(count * 2);
        var aSize = new Float32Array(count);

        for (var i = 0; i < count; i++) {
            aS0[i] = Math.random() * streamLen;
            var v = randomInSphere(1.0);
            aROffset[3 * i] = v.x;
            aROffset[3 * i + 1] = v.y;
            aROffset[3 * i + 2] = v.z;
            aTile[2 * i] = Math.floor(Math.random() * tilesPerRow);
            aTile[2 * i + 1] = Math.floor(Math.random() * tilesPerCol);
            aSize[i] = 0.75 + Math.random() * 0.5;
        }

        geo.setAttribute('aS0', new THREE.InstancedBufferAttribute(aS0, 1));
        geo.setAttribute('aROffset', new THREE.InstancedBufferAttribute(aROffset, 3));
        geo.setAttribute('aTile', new THREE.InstancedBufferAttribute(aTile, 2));
        geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 1));

        var mat = new THREE.ShaderMaterial({
            vertexShader: vertShader,
            fragmentShader: fragShader,
            transparent: true,
            depthWrite: true,
            depthTest: true,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uSpeed: { value: 7.3 * this.settings.flowSpeed / 50 },
                uStreamLen: { value: streamLen },
                uRadius: { value: 20 * this.settings.tubeRadius / 100 },
                uArcAmp: { value: 11.6 * this.settings.arcAmp / 100 },
                uArcFreq: { value: 0.05 },
                uBaseSize: { value: 0.9 * this.settings.particleSize / 50 },
                uFadeRamp: { value: this.settings.fadeRamp / 100 },
                uOpacity: { value: 1.0 },
                uAtlas: { value: atlas.texture },
                uTiles: { value: new THREE.Vector2(tilesPerRow, tilesPerCol) }
            }
        });

        var mesh = new THREE.Mesh(geo, mat);
        mesh.frustumCulled = false;
        mesh.userData = { isParticles: true };
        group.add(mesh);

        this._geo = geo;
        this._mat = mat;
        this._streamLen = streamLen;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._mat) return;

        this._mat.uniforms.uTime.value = time;
        this._mat.uniforms.uSpeed.value = 7.3 * this.settings.flowSpeed / 50;
        this._mat.uniforms.uRadius.value = 20 * this.settings.tubeRadius / 100;
        this._mat.uniforms.uArcAmp.value = 11.6 * this.settings.arcAmp / 100;
        this._mat.uniforms.uBaseSize.value = 0.9 * this.settings.particleSize / 50;
        this._mat.uniforms.uFadeRamp.value = this.settings.fadeRamp / 100;

        var t = time / loopDuration;
        var camAngle = t * Math.PI * 2;
        EP.Core.camera.position.set(
            Math.sin(camAngle) * 10 - 30,
            8 + Math.sin(t * Math.PI * 4) * 3,
            55 + Math.cos(camAngle) * 10
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this._atlas && this._atlas.texture) {
            this._atlas.texture.dispose();
        }
        if (this._geo) this._geo.dispose();
        if (this._mat) this._mat.dispose();
        this._atlas = null;
        this._geo = null;
        this._mat = null;
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
