// Paper Scroll — procedural equivalent of the "Paper" kinetic-image technique
// (source read & understood: github.com/Juanmaes83/codrops-kinetic-images →
// src/components/webgl/Paper/Paper.jsx + MeshImageMaterial.js).
// The original loads a pre-baked .glb "rolled paper" mesh and scrolls the
// user's texture across it (texture.offset.y), darkening back faces for a
// natural fold shadow. Here the rolled-paper surface is generated procedurally
// (Archimedean spiral cross-section swept vertically, with per-turn ridge
// grooves and repeating image wrap so each coil layer reads as full art) —
// turns/height/radius are fully adjustable, no external 3D asset required.
(function() {
    var effect = new EP.EffectBase('paper-scroll', {
        name: 'Paper Scroll',
        category: 'kinetic-images',
        icon: '📜',
        description: 'Pergamino de papel enrollado en 3D con capas visibles y luz de estudio — la imagen o video del cliente se repite nítida en cada vuelta del rollo, con sombra de pliegue y giro reactivo al ratón'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'turns', type: 'range', min: 10, max: 40, default: 20, step: 1, label: 'Vueltas del rollo', unit: '/10' },
        { key: 'outerRadius', type: 'range', min: 100, max: 250, default: 160, step: 5, label: 'Radio exterior', unit: '%' },
        { key: 'innerRadius', type: 'range', min: 10, max: 100, default: 35, step: 5, label: 'Radio interior', unit: '%' },
        { key: 'scrollSpeed', type: 'range', min: 0, max: 200, default: 90, step: 10, label: 'Velocidad flujo textura', unit: '%' },
        { key: 'shadowDepth', type: 'range', min: 0, max: 100, default: 72, step: 5, label: 'Sombra del pliegue', unit: '%' },
        { key: 'ridgeDepth', type: 'range', min: 0, max: 100, default: 45, step: 5, label: 'Relieve de capas', unit: '%' },
        { key: 'rotSpeed', type: 'range', min: 0, max: 200, default: 35, step: 10, label: 'Rotación automática', unit: '%' },
        { key: 'mouseTilt', type: 'range', min: 0, max: 100, default: 60, step: 10, label: 'Inclinación con ratón', unit: '%' }
    ]);

    var _vert = [
        'varying vec2 vUv;',
        'varying vec3 vNormalW;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  vUv = uv;',
        '  vNormalW = normalize(mat3(modelMatrix) * normal);',
        '  vec4 worldPos = modelMatrix * vec4(position, 1.0);',
        '  vViewDir = normalize(cameraPosition - worldPos.xyz);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var _frag = [
        'uniform sampler2D uMedia;',
        'uniform bool uHasMedia;',
        'uniform float uOffsetV;',
        'uniform float uShadow;',
        'uniform float uTime;',
        'varying vec2 vUv;',
        'varying vec3 vNormalW;',
        'varying vec3 vViewDir;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }',
        'void main() {',
        '  vec2 uv = vec2(vUv.x, fract(vUv.y + uOffsetV));',
        '  vec4 col;',
        '  if (uHasMedia) {',
        '    col = texture2D(uMedia, uv);',
        '    col.rgb = (col.rgb - 0.5) * 1.12 + 0.5;',      // gentle contrast lift
        '    col.rgb *= 1.08;',                              // slight vividness boost
        '  } else {',
        '    float band = sin(uv.x * 26.0 + uTime * 0.6) * 0.5 + 0.5;',
        '    vec3 c1 = vec3(0.88, 0.74, 0.48);',
        '    vec3 c2 = vec3(0.52, 0.32, 0.62);',
        '    col = vec4(mix(c1, c2, band * uv.y), 1.0);',
        '  }',
        // Paper fiber grain
        '  float grain = hash(floor(uv * vec2(512.0, 256.0))) * 0.05;',
        '  col.rgb += grain - 0.025;',
        // Backface = inside of the coil: darker, warmer shadow
        '  if (!gl_FrontFacing) {',
        '    col.rgb = mix(col.rgb, vec3(0.05, 0.03, 0.02), uShadow);',
        '  }',
        // Three-point studio lighting: key + fill + rim (fresnel)
        '  vec3 n = normalize(vNormalW);',
        '  float key  = max(dot(n, normalize(vec3(0.45, 0.65, 0.6))), 0.0);',
        '  float fill = max(dot(n, normalize(vec3(-0.5, 0.1, -0.4))), 0.0) * 0.25;',
        '  float fres = pow(1.0 - max(dot(n, vViewDir), 0.0), 2.5);',
        '  float lighting = 0.42 + key * 0.62 + fill;',
        '  col.rgb *= lighting;',
        '  col.rgb += fres * 0.22 * vec3(1.0, 0.97, 0.9);',   // warm rim highlight on the curl edge
        '  gl_FragColor = vec4(col.rgb, 1.0);',
        '}'
    ].join('\n');

    function buildPaperGeometry(turns, outerR, innerR, height, segsPerTurn, heightSegs, ridgeAmp) {
        var totalSegs = Math.max(8, Math.round(turns * segsPerTurn));
        var positions = [];
        var uvs = [];
        var indices = [];

        var ring = [];
        for (var i = 0; i <= totalSegs; i++) {
            var t = i / totalSegs;
            var angle = t * turns * Math.PI * 2;
            var radius = outerR + (innerR - outerR) * t;
            // Subtle sawtooth ridge per revolution — reads as visible rolled layers
            radius += Math.sin(angle) * ridgeAmp * (1 - t * 0.6);
            var uWrap = (t * turns) % 1;
            ring.push([Math.cos(angle) * radius, Math.sin(angle) * radius, uWrap]);
        }

        var rows = heightSegs + 1;
        for (var h = 0; h < rows; h++) {
            var vY = h / heightSegs;
            var y = (vY - 0.5) * height;
            for (i = 0; i <= totalSegs; i++) {
                var p = ring[i];
                positions.push(p[0], y, p[1]);
                uvs.push(p[2], vY);
            }
        }

        var rowLen = totalSegs + 1;
        for (h = 0; h < heightSegs; h++) {
            for (i = 0; i < totalSegs; i++) {
                var a = h * rowLen + i;
                var b = a + 1;
                var c = a + rowLen;
                var d = c + 1;
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }

        var geo = new THREE.BufferGeometry();
        geo.setIndex(indices);
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.computeVertexNormals();
        return geo;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._m0 = (mediaList && mediaList[0]) || null;
        this._mediaTexture = null;
        this._texReady = false;
        this._mx = 0; this._my = 0;
        this._hasMouse = false;
        this._lastKey = '';
        this._mesh = null;
        // Default 3/4 studio angle so the coil's depth reads immediately
        group.rotation.x = -0.32;
        group.rotation.z = 0.12;

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

        if (this._m0 && this._m0.element && EP.Media && EP.Media.createTexture) {
            this._mediaTexture = EP.Media.createTexture(this._m0);
            this._texReady = !!this._mediaTexture;
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;

        if (!this._texReady && this._m0 && this._m0.element && EP.Media && EP.Media.createTexture) {
            this._mediaTexture = EP.Media.createTexture(this._m0);
            this._texReady = !!this._mediaTexture;
        }
        if (this._texReady && EP.Media && EP.Media.updateTexture) {
            EP.Media.updateTexture(this._mediaTexture);
        }

        var turns = this.settings.turns / 10;
        var outerR = 2.2 * (this.settings.outerRadius / 160);
        var innerR = 0.6 * (this.settings.innerRadius / 35);
        var ridgeAmp = (this.settings.ridgeDepth / 100) * 0.05;
        var key = turns.toFixed(1) + '_' + outerR.toFixed(2) + '_' + innerR.toFixed(2) + '_' + ridgeAmp.toFixed(3);

        if (!this._mesh || this._lastKey !== key) {
            if (this._mesh) { this.group.remove(this._mesh); this._mesh.geometry.dispose(); this._mesh.material.dispose(); }
            var geo = buildPaperGeometry(turns, outerR, innerR, 3.2, 12, 56, ridgeAmp);
            this._uniforms = {
                uMedia:    { value: this._mediaTexture || new THREE.Texture() },
                uHasMedia: { value: !!this._mediaTexture },
                uOffsetV:  { value: 0 },
                uShadow:   { value: 0.72 },
                uTime:     { value: 0 }
            };
            var mat = new THREE.ShaderMaterial({
                vertexShader: _vert, fragmentShader: _frag,
                uniforms: this._uniforms, side: THREE.DoubleSide
            });
            this._mesh = new THREE.Mesh(geo, mat);
            this.group.add(this._mesh);
            this._lastKey = key;
        }

        if (this._texReady) {
            this._uniforms.uMedia.value = this._mediaTexture;
            this._uniforms.uHasMedia.value = true;
        }
        this._uniforms.uShadow.value = this.settings.shadowDepth / 100;
        this._uniforms.uTime.value = time;

        var scrollSpd = (this.settings.scrollSpeed / 100) * 0.32;
        this._uniforms.uOffsetV.value += dt * scrollSpd;

        var rotSpd = (this.settings.rotSpeed / 100) * 0.4;
        this._mesh.rotation.y += dt * rotSpd;

        var tiltAmt = this.settings.mouseTilt / 100;
        if (this._hasMouse) {
            var targetX = -0.32 + (-this._my * 0.3 * tiltAmt);
            var targetZ = 0.12 + (this._mx * 0.22 * tiltAmt);
            this.group.rotation.x += (targetX - this.group.rotation.x) * 0.06;
            this.group.rotation.z += (targetZ - this.group.rotation.z) * 0.06;
        }
    };

    effect.dispose = function() {
        if (this._dom && this._onMouseMove) this._dom.removeEventListener('mousemove', this._onMouseMove);
        this._dom = null; this._onMouseMove = null;
        this._mesh = null; this._uniforms = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
