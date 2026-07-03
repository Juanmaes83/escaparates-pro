(function() {
    var effect = new EP.EffectBase('lego-cubes', {
        name: 'Cubos LEGO',
        category: 'motion',
        icon: '🟥',
        description: 'Construcción LEGO por píxel — cubos con bevel de plástico y stud circular, paleta LEGO de 24 colores, animación de construcción con caída escalonada'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'gridSize', type: 'range', min: 8, max: 36, default: 22, step: 2, label: 'Resolución grid', unit: 'celdas' },
        { key: 'voxelGap', type: 'range', min: 0, max: 40, default: 4, step: 2, label: 'Separación cubos', unit: '%' },
        { key: 'buildAnim', type: 'select', options: [
            { v: 'drop',    l: 'Caída con rebote (construcción)' },
            { v: 'emerge',  l: 'Emergencia desde plano' },
            { v: 'explode', l: 'Explosión y reconstrucción' },
            { v: 'still',   l: 'Estático' }
        ], default: 'drop', label: 'Animación construcción' },
        { key: 'colorMode', type: 'select', options: [
            { v: 'lego-palette', l: 'Paleta LEGO (24 colores)' },
            { v: 'source',       l: 'Color fuente exacto' },
            { v: 'mono',         l: 'Escala de grises' }
        ], default: 'lego-palette', label: 'Modo color' },
        { key: 'studScale', type: 'range', min: 50, max: 120, default: 100, step: 5, label: 'Tamaño stud', unit: '%' },
        { key: 'animSpeed', type: 'range', min: 1, max: 20, default: 8, step: 1, label: 'Velocidad animación' },
        { key: 'bevelIntensity', type: 'range', min: 0, max: 100, default: 55, step: 5, label: 'Intensidad bevel', unit: '%' }
    ]);

    // 24 classic LEGO colors (RGB precomputed 0..1)
    var LEGO_HEX = ['#C91A09','#0055BF','#F2CD37','#237841','#FFFFFF','#1B2A34',
                    '#E4CD9E','#FC97AC','#5A93DB','#6B96C1','#AA7F2E','#582A12',
                    '#F4F4F4','#6D6E5C','#D77659','#DE7C41','#EAB03B','#008F9B',
                    '#469BC3','#00B0F0','#B40000','#4B9F4A','#720012','#C870A0'];
    var LEGO_RGB = [];
    (function() {
        for (var i = 0; i < LEGO_HEX.length; i++) {
            var h = LEGO_HEX[i];
            LEGO_RGB.push([
                parseInt(h.substring(1, 3), 16) / 255,
                parseInt(h.substring(3, 5), 16) / 255,
                parseInt(h.substring(5, 7), 16) / 255
            ]);
        }
    })();

    function nearestLego(r, g, b) {
        var best = 0, bestD = 1e9;
        for (var i = 0; i < LEGO_RGB.length; i++) {
            var c = LEGO_RGB[i];
            var dr = r - c[0], dg = g - c[1], db = b - c[2];
            var d = dr * dr + dg * dg + db * db;
            if (d < bestD) { bestD = d; best = i; }
        }
        return LEGO_RGB[best];
    }

    var _dummy = new THREE.Object3D();

    function easeOutBounce(t) {
        var n1 = 7.5625, d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
        if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
        t -= 2.625 / d1; return n1 * t * t + 0.984375;
    }

    // Plastic shader: instance color + UV-edge bevel darkening + fixed-light lambert
    var _vert = [
        'varying vec2 vUv;',
        'varying vec3 vNormal2;',
        'varying vec3 vColor2;',
        'void main() {',
        '  vUv = uv;',
        '  vec3 nrm = normal;',
        '  vec4 pos = vec4(position, 1.0);',
        '  #ifdef USE_INSTANCING',
        '    pos = instanceMatrix * pos;',
        '    nrm = mat3(instanceMatrix) * nrm;',
        '  #endif',
        '  vColor2 = vec3(1.0);',
        '  #ifdef USE_INSTANCING_COLOR',
        '    vColor2 = instanceColor;',
        '  #endif',
        '  vNormal2 = normalize(normalMatrix * nrm);',
        '  gl_Position = projectionMatrix * modelViewMatrix * pos;',
        '}'
    ].join('\n');

    var _fragBox = [
        'uniform float uBevel;',
        'varying vec2 vUv;',
        'varying vec3 vNormal2;',
        'varying vec3 vColor2;',
        'void main() {',
        // Fixed key light upper-left-front for plastic look
        '  vec3 lightDir = normalize(vec3(-0.4, 0.75, 1.0));',
        '  float lambert = max(dot(normalize(vNormal2), lightDir), 0.0);',
        '  float light = 0.62 + 0.38 * lambert;',
        // Bevel: darken near UV edges (chamfered plastic edge illusion)
        '  float bw = 0.06 + uBevel * 0.10;',
        '  float ex = min(smoothstep(0.0, bw, vUv.x), smoothstep(1.0, 1.0 - bw, vUv.x));',
        '  float ey = min(smoothstep(0.0, bw, vUv.y), smoothstep(1.0, 1.0 - bw, vUv.y));',
        '  float bevel = mix(1.0 - uBevel * 0.55, 1.0, min(ex, ey));',
        // Specular highlight band for glossy ABS plastic
        '  float spec = pow(lambert, 24.0) * 0.35;',
        '  vec3 col = vColor2 * light * bevel + vec3(spec);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    var _fragStud = [
        'varying vec2 vUv;',
        'varying vec3 vNormal2;',
        'varying vec3 vColor2;',
        'void main() {',
        '  vec3 lightDir = normalize(vec3(-0.4, 0.75, 1.0));',
        '  float lambert = max(dot(normalize(vNormal2), lightDir), 0.0);',
        '  float light = 0.58 + 0.42 * lambert;',
        '  float spec = pow(lambert, 32.0) * 0.5;',
        '  vec3 col = vColor2 * light + vec3(spec);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._sampCvs = document.createElement('canvas');
        this._sampCtx = this._sampCvs.getContext('2d');
        this._m0 = (mediaList && mediaList[0]) || null;
        this._media = this._m0 ? this._m0.element : null;
        this._cubes = null;
        this._studs = null;
        this._lastKey = '';
        this._mx = 0; this._my = 0;
        this._buildStart = null;

        var self = this;
        var dom = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
        if (dom) {
            this._onMouseMove = function(e) {
                var r = dom.getBoundingClientRect();
                self._mx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
                self._my = -((e.clientY - r.top)  / r.height - 0.5) * 2;
            };
            dom.addEventListener('mousemove', this._onMouseMove);
            this._dom = dom;
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        if (this._buildStart === null) this._buildStart = time;
        if (this._m0 && !this._media) this._media = this._m0.element;

        var gridN = Math.max(6, Math.round(this.settings.gridSize));
        var gap = 1 - this.settings.voxelGap / 100;
        var buildAnim = this.settings.buildAnim;
        var colorMode = this.settings.colorMode;
        var studScale = this.settings.studScale / 100;
        var spd = this.settings.animSpeed;
        var bevel = this.settings.bevelIntensity / 100;

        var sH = Math.max(1, Math.round(gridN * (4.5 / 8)));
        var count = gridN * sH;
        var key = gridN + '_' + studScale.toFixed(2);

        // Rebuild instanced meshes when structural settings change
        if (this._cubes && this._lastKey !== key) {
            this.group.remove(this._cubes); this.group.remove(this._studs);
            this._cubes.geometry.dispose(); this._cubes.material.dispose();
            this._studs.geometry.dispose(); this._studs.material.dispose();
            this._cubes = null; this._studs = null;
        }
        if (!this._cubes) {
            this._lastKey = key;
            var side = (8 / gridN) * gap;
            var boxGeo = new THREE.BoxGeometry(side, side, side);
            var boxMat = new THREE.ShaderMaterial({
                vertexShader: _vert, fragmentShader: _fragBox,
                uniforms: { uBevel: { value: bevel } }
            });
            this._cubes = new THREE.InstancedMesh(boxGeo, boxMat, count);
            this._cubes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
            this.group.add(this._cubes);

            var studR = side * 0.35 * studScale;
            var studH = side * 0.22 * studScale;
            var studGeo = new THREE.CylinderGeometry(studR, studR, studH, 20);
            // Cylinder axis is Y; rotate so stud points toward camera (+Z)
            studGeo.rotateX(Math.PI / 2);
            var studMat = new THREE.ShaderMaterial({
                vertexShader: _vert, fragmentShader: _fragStud,
                uniforms: {}
            });
            this._studs = new THREE.InstancedMesh(studGeo, studMat, count);
            this._studs.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
            this.group.add(this._studs);

            this._side = side;
            this._studH = studH;
            this._buildStart = time;
        }
        this._cubes.material.uniforms.uBevel.value = bevel;

        // Sample media at grid resolution
        if (this._sampCvs.width !== gridN || this._sampCvs.height !== sH) {
            this._sampCvs.width = gridN; this._sampCvs.height = sH;
        }
        var sc = this._sampCtx;
        var mediaReady = false;
        if (this._media) {
            var el = this._media;
            if (el.tagName === 'VIDEO') mediaReady = el.readyState >= 2;
            else if (el.tagName === 'IMG') mediaReady = el.complete && el.naturalHeight > 0;
            else mediaReady = true;
        }
        var data = null;
        if (mediaReady) {
            try {
                sc.drawImage(this._media, 0, 0, gridN, sH);
                data = sc.getImageData(0, 0, gridN, sH).data;
            } catch (e) { data = null; }
        }

        // Mouse tilt
        this.group.rotation.y += ((this._mx * 0.34) - this.group.rotation.y) * 0.08;
        this.group.rotation.x += ((-this._my * 0.2) - this.group.rotation.x) * 0.08;

        var cellW = 8 / gridN;
        var cellH = 4.5 / sH;
        var startX = -4 + cellW * 0.5;
        var startY = 2.25 - cellH * 0.5;
        var side2 = this._side;
        var studZ = side2 * 0.5 + this._studH * 0.5;
        var buildT = (time - this._buildStart) * spd * 0.14;
        var inst = 0;

        for (var row = 0; row < sH; row++) {
            for (var col = 0; col < gridN; col++) {
                var fr, fg, fb;
                if (data) {
                    var idx = (row * gridN + col) * 4;
                    var r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255;
                    if (colorMode === 'lego-palette') {
                        var lc = nearestLego(r, g, b);
                        fr = lc[0]; fg = lc[1]; fb = lc[2];
                    } else if (colorMode === 'mono') {
                        var lum = 0.299 * r + 0.587 * g + 0.114 * b;
                        fr = lum; fg = lum; fb = lum;
                    } else { fr = r; fg = g; fb = b; }
                } else {
                    // Demo: rotating LEGO palette diagonal bands
                    var pi = Math.abs(Math.floor(col * 0.7 + row * 0.7 + time * spd * 0.35)) % LEGO_RGB.length;
                    var pc = LEGO_RGB[pi];
                    fr = pc[0]; fg = pc[1]; fb = pc[2];
                }

                var bx = startX + col * cellW;
                var by = startY - row * cellH;
                var bz = 0;
                var vis = 1;

                if (buildAnim === 'drop') {
                    // Column-staggered drop from above with bounce
                    var delay = col * 0.05 + ((row * 7919) % 13) * 0.012;
                    var p = Math.max(0, Math.min(1, (buildT - delay) * 0.9));
                    if (p <= 0) { vis = 0; }
                    var eB = easeOutBounce(p);
                    by = by + (1 - eB) * (3.2 + row * 0.12);
                    bz = (1 - eB) * 0.6;
                } else if (buildAnim === 'emerge') {
                    var st = (col + row) / (gridN + sH);
                    var pe = Math.max(0, Math.min(1, buildT * 1.4 - st * 0.7));
                    pe = 1 - Math.pow(1 - pe, 3);
                    if (pe <= 0) vis = 0;
                    bz = (1 - pe) * -2.5;
                } else if (buildAnim === 'explode') {
                    var phase = (Math.sin(time * spd * 0.16) + 1) * 0.5;
                    bz = Math.sin(col * 37.1 + row * 17.3) * 2.2 * phase;
                    bx += Math.sin(col * 23.7 + row * 11.9) * phase * 1.3;
                    by += Math.cos(col * 13.1 + row * 29.7) * phase * 1.3;
                }

                var scl = vis > 0 ? 1 : 0.0001;
                _dummy.position.set(bx, by, bz);
                _dummy.rotation.set(0, 0, 0);
                _dummy.scale.set(scl, scl, scl);
                _dummy.updateMatrix();
                this._cubes.setMatrixAt(inst, _dummy.matrix);
                this._cubes.instanceColor.setXYZ(inst, fr, fg, fb);

                _dummy.position.set(bx, by, bz + studZ);
                _dummy.updateMatrix();
                this._studs.setMatrixAt(inst, _dummy.matrix);
                this._studs.instanceColor.setXYZ(inst, fr, fg, fb);
                inst++;
            }
        }

        this._cubes.count = inst;
        this._studs.count = inst;
        this._cubes.instanceMatrix.needsUpdate = true;
        this._cubes.instanceColor.needsUpdate = true;
        this._studs.instanceMatrix.needsUpdate = true;
        this._studs.instanceColor.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._dom && this._onMouseMove) this._dom.removeEventListener('mousemove', this._onMouseMove);
        this._dom = null; this._onMouseMove = null;
        this._cubes = null; this._studs = null;
        this._sampCvs = null; this._sampCtx = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
