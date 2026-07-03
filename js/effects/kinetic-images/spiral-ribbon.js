// Spiral Ribbon — procedural equivalent of the "Spiral" kinetic-image technique
// (source read & understood: github.com/Juanmaes83/codrops-kinetic-images →
// src/components/webgl/Spiral/Spiral.jsx). The original loads a pre-baked
// .glb helical ribbon and scrolls the texture across it (texture.offset.x).
// Here the helix ribbon is generated procedurally (parametric 3D curve swept
// into a flat strip, with a central rod for visual anchor and a default
// studio tilt so the ascent reads clearly in 3D) — turns/radius/rise/width
// are fully adjustable.
(function() {
    var effect = new EP.EffectBase('spiral-ribbon', {
        name: 'Spiral Ribbon',
        category: 'kinetic-images',
        icon: '🌀',
        description: 'Cinta en espiral ascendente 3D con luz de estudio y varilla central — la imagen o video del cliente se repite nítida en cada vuelta, con sombra de pliegue e inclinación reactiva al ratón'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'turns', type: 'range', min: 15, max: 60, default: 26, step: 1, label: 'Vueltas', unit: '/10' },
        { key: 'radius', type: 'range', min: 60, max: 250, default: 140, step: 5, label: 'Radio', unit: '%' },
        { key: 'ribbonWidth', type: 'range', min: 20, max: 100, default: 60, step: 5, label: 'Ancho de cinta', unit: '%' },
        { key: 'riseAmount', type: 'range', min: 40, max: 200, default: 120, step: 10, label: 'Altura del ascenso', unit: '%' },
        { key: 'scrollSpeed', type: 'range', min: 0, max: 200, default: 100, step: 10, label: 'Velocidad flujo textura', unit: '%' },
        { key: 'shadowDepth', type: 'range', min: 0, max: 100, default: 68, step: 5, label: 'Sombra del pliegue', unit: '%' },
        { key: 'rotSpeed', type: 'range', min: 0, max: 200, default: 45, step: 10, label: 'Rotación automática', unit: '%' },
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
        'uniform float uOffsetU;',
        'uniform float uShadow;',
        'uniform float uTime;',
        'varying vec2 vUv;',
        'varying vec3 vNormalW;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  vec2 uv = vec2(fract(vUv.x + uOffsetU), vUv.y);',
        '  vec4 col;',
        '  if (uHasMedia) {',
        '    col = texture2D(uMedia, uv);',
        '    col.rgb = (col.rgb - 0.5) * 1.12 + 0.5;',
        '    col.rgb *= 1.08;',
        '  } else {',
        '    float band = sin(uv.x * 30.0 - uTime * 0.8) * 0.5 + 0.5;',
        '    vec3 c1 = vec3(0.28, 0.5, 0.95);',
        '    vec3 c2 = vec3(0.88, 0.22, 0.6);',
        '    col = vec4(mix(c1, c2, band), 1.0);',
        '  }',
        '  if (!gl_FrontFacing) {',
        '    col.rgb = mix(col.rgb, vec3(0.05, 0.03, 0.05), uShadow);',
        '  }',
        '  vec3 n = normalize(vNormalW);',
        '  float key  = max(dot(n, normalize(vec3(0.45, 0.65, 0.6))), 0.0);',
        '  float fill = max(dot(n, normalize(vec3(-0.5, 0.1, -0.4))), 0.0) * 0.25;',
        '  float fres = pow(1.0 - max(dot(n, vViewDir), 0.0), 2.5);',
        '  float lighting = 0.4 + key * 0.65 + fill;',
        '  col.rgb *= lighting;',
        '  col.rgb += fres * 0.25 * vec3(0.85, 0.92, 1.0);',
        '  gl_FragColor = vec4(col.rgb, 1.0);',
        '}'
    ].join('\n');

    function buildSpiralGeometry(turns, radius, ribbonWidth, rise, segsPerTurn) {
        var totalSegs = Math.max(16, Math.round(turns * segsPerTurn));
        var positions = [];
        var uvs = [];
        var indices = [];

        var centerPts = [];
        for (var i = 0; i <= totalSegs; i++) {
            var t = i / totalSegs;
            var angle = t * turns * Math.PI * 2;
            var y = (t - 0.5) * rise;
            centerPts.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
        }

        var halfW = ribbonWidth * 0.5;
        for (i = 0; i <= totalSegs; i++) {
            var p = centerPts[i];
            var pPrev = centerPts[Math.max(0, i - 1)];
            var pNext = centerPts[Math.min(totalSegs, i + 1)];
            var tangent = new THREE.Vector3().subVectors(pNext, pPrev).normalize();
            var side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            var pA = new THREE.Vector3().copy(p).addScaledVector(side, halfW);
            var pB = new THREE.Vector3().copy(p).addScaledVector(side, -halfW);

            positions.push(pA.x, pA.y, pA.z);
            positions.push(pB.x, pB.y, pB.z);
            var uWrap = (i / segsPerTurn) % 1;
            uvs.push(uWrap, 0);
            uvs.push(uWrap, 1);
        }

        for (i = 0; i < totalSegs; i++) {
            var a = i * 2, b = a + 1, c = a + 2, d = a + 3;
            indices.push(a, b, c);
            indices.push(b, d, c);
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
        this._rod = null;
        // Default 3/4 studio angle so the vertical ascent reads clearly
        group.rotation.x = -0.4;
        group.rotation.z = 0.05;

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

        // Slim metallic-look center rod: gives the coil a visual axis to wind around
        var rodGeo = new THREE.CylinderGeometry(0.045, 0.045, 4.7, 16);
        var rodMat = new THREE.MeshBasicMaterial({ color: 0x2a2a30 });
        this._rod = new THREE.Mesh(rodGeo, rodMat);
        group.add(this._rod);

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
        var radius = 2.1 * (this.settings.radius / 140);
        var ribbonW = 1.5 * (this.settings.ribbonWidth / 60);
        var rise = 5.2 * (this.settings.riseAmount / 120);
        var key = turns.toFixed(1) + '_' + radius.toFixed(2) + '_' + ribbonW.toFixed(2) + '_' + rise.toFixed(2);

        if (!this._mesh || this._lastKey !== key) {
            if (this._mesh) { this.group.remove(this._mesh); this._mesh.geometry.dispose(); this._mesh.material.dispose(); }
            var geo = buildSpiralGeometry(turns, radius, ribbonW, rise, 10);
            this._uniforms = {
                uMedia:    { value: this._mediaTexture || new THREE.Texture() },
                uHasMedia: { value: !!this._mediaTexture },
                uOffsetU:  { value: 0 },
                uShadow:   { value: 0.68 },
                uTime:     { value: 0 }
            };
            var mat = new THREE.ShaderMaterial({
                vertexShader: _vert, fragmentShader: _frag,
                uniforms: this._uniforms, side: THREE.DoubleSide
            });
            this._mesh = new THREE.Mesh(geo, mat);
            this.group.add(this._mesh);
            this._lastKey = key;

            if (this._rod) { this._rod.geometry.dispose(); this._rod.geometry = new THREE.CylinderGeometry(0.045, 0.045, rise + 1.5, 16); }
        }

        if (this._texReady) {
            this._uniforms.uMedia.value = this._mediaTexture;
            this._uniforms.uHasMedia.value = true;
        }
        this._uniforms.uShadow.value = this.settings.shadowDepth / 100;
        this._uniforms.uTime.value = time;

        var scrollSpd = (this.settings.scrollSpeed / 100) * 0.38;
        this._uniforms.uOffsetU.value -= dt * scrollSpd;

        var rotSpd = (this.settings.rotSpeed / 100) * 0.35;
        this._mesh.rotation.y += dt * rotSpd;
        if (this._rod) this._rod.rotation.y += dt * rotSpd;

        var tiltAmt = this.settings.mouseTilt / 100;
        if (this._hasMouse) {
            var targetX = -0.4 + (-this._my * 0.28 * tiltAmt);
            var targetZ = 0.05 + (this._mx * 0.18 * tiltAmt);
            this.group.rotation.x += (targetX - this.group.rotation.x) * 0.06;
            this.group.rotation.z += (targetZ - this.group.rotation.z) * 0.06;
        }
    };

    effect.dispose = function() {
        if (this._dom && this._onMouseMove) this._dom.removeEventListener('mousemove', this._onMouseMove);
        this._dom = null; this._onMouseMove = null;
        this._mesh = null; this._uniforms = null; this._rod = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
