// Liquid Fluid Reveal — adapted from the CodePen gist "WebGL liquid masking"
// by Ksenia Kondrashova (source read & understood: a real incompressible
// fluid simulation — velocity/dye advection, divergence, Jacobi pressure
// solve, gradient subtraction — driven by pointer splats; the sim's dye
// density is displayed inverted over a photo so the image starts hidden
// under a haze and the cursor "wipes" it clear like fog on glass, slowly
// fogging back over as the dye dissipates). Ported from raw WebGL1
// framebuffers to Three.js WebGLRenderTarget ping-pong buffers running on
// the platform's shared renderer (EP.Core.renderer) — this is the first
// effect in the codebase to do manual render-to-texture passes, so it
// carefully saves/restores the renderer's target state before handing
// control back to the main render loop.
(function() {
    var effect = new EP.EffectBase('liquid-fluid-reveal', {
        name: 'Liquid Fluid Reveal',
        category: 'shader-premium',
        icon: '💧',
        description: 'Simulación de fluidos real (Navier-Stokes) — la imagen aparece oculta bajo una niebla líquida que el cursor "limpia" como vaho en un cristal, volviendo a empañarse lentamente; nivel Awwwards, coste de render alto'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'hazeColor', type: 'color', default: '#f2f2f2', label: 'Color niebla' },
        { key: 'dissipation', type: 'range', min: 90, max: 99, default: 97, step: 1, label: 'Persistencia del rastro', unit: '%' },
        { key: 'splatRadius', type: 'range', min: 10, max: 100, default: 35, step: 5, label: 'Grosor del rastro' },
        { key: 'splatForce', type: 'range', min: 20, max: 300, default: 120, step: 10, label: 'Fuerza del arrastre' }
    ]);

    var SIM_RES = 128;
    var DYE_RES = 256;

    var VERT = 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

    var FRAG_ADVECTION = [
        'precision highp float;', 'uniform sampler2D uVelocity;', 'uniform sampler2D uSource;',
        'uniform vec2 uTexelSize;', 'uniform float uDt;', 'uniform float uDissipation;', 'varying vec2 vUv;',
        'void main(){', '  vec2 vel = texture2D(uVelocity, vUv).xy;',
        '  vec2 coord = vUv - uDt * vel * uTexelSize;',
        '  gl_FragColor = uDissipation * texture2D(uSource, coord);', '  gl_FragColor.a = 1.0;', '}'
    ].join('\n');

    var FRAG_SPLAT = [
        'precision highp float;', 'uniform sampler2D uTarget;', 'uniform float uAspectRatio;',
        'uniform vec3 uColor;', 'uniform vec2 uPoint;', 'uniform float uRadius;', 'varying vec2 vUv;',
        'void main(){', '  vec2 p = vUv - uPoint;', '  p.x *= uAspectRatio;',
        '  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;',
        '  vec3 base = texture2D(uTarget, vUv).xyz;', '  gl_FragColor = vec4(base + splat, 1.0);', '}'
    ].join('\n');

    var FRAG_DIVERGENCE = [
        'precision highp float;', 'uniform sampler2D uVelocity;', 'uniform vec2 uTexelSize;', 'varying vec2 vUv;',
        'void main(){',
        '  float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;',
        '  float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;',
        '  float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;',
        '  float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;',
        '  float div = 0.5 * (R - L + T - B);', '  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);', '}'
    ].join('\n');

    var FRAG_PRESSURE = [
        'precision highp float;', 'uniform sampler2D uPressure;', 'uniform sampler2D uDivergence;',
        'uniform vec2 uTexelSize;', 'varying vec2 vUv;',
        'void main(){',
        '  float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;',
        '  float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;',
        '  float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;',
        '  float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;',
        '  float divergence = texture2D(uDivergence, vUv).x;',
        '  float pressure = (L + R + B + T - divergence) * 0.25;',
        '  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);', '}'
    ].join('\n');

    var FRAG_GRADIENT_SUBTRACT = [
        'precision highp float;', 'uniform sampler2D uPressure;', 'uniform sampler2D uVelocity;',
        'uniform vec2 uTexelSize;', 'varying vec2 vUv;',
        'void main(){',
        '  float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;',
        '  float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;',
        '  float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;',
        '  float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;',
        '  vec2 velocity = texture2D(uVelocity, vUv).xy;',
        '  velocity -= vec2(R - L, T - B);', '  gl_FragColor = vec4(velocity, 0.0, 1.0);', '}'
    ].join('\n');

    var FRAG_DISPLAY = [
        'precision highp float;', 'uniform sampler2D uDensity;', 'uniform sampler2D uMedia;',
        'uniform bool uHasMedia;', 'uniform vec3 uHazeColor;', 'varying vec2 vUv;',
        'void main(){',
        '  vec3 d = texture2D(uDensity, vUv).rgb;',
        '  float a = clamp(max(d.r, max(d.g, d.b)), 0.0, 1.0);',
        '  vec3 mediaColor = uHasMedia ? texture2D(uMedia, vUv).rgb : vec3(0.15, 0.15, 0.18);',
        '  vec3 finalColor = mix(uHazeColor, mediaColor, a);',
        '  gl_FragColor = vec4(finalColor, 1.0);', '}'
    ].join('\n');

    function makeRT(w, h) {
        return new THREE.WebGLRenderTarget(w, h, {
            type: THREE.FloatType, format: THREE.RGBAFormat,
            minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, depthBuffer: false, stencilBuffer: false
        });
    }

    function makeDoubleFBO(w, h) {
        return {
            read: makeRT(w, h), write: makeRT(w, h),
            swap: function() { var t = this.read; this.read = this.write; this.write = t; }
        };
    }

    function hexToVec3(hex) {
        var v = parseInt((hex || '#ffffff').replace('#', ''), 16);
        return new THREE.Vector3(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var m0 = (mediaList && mediaList[0]) || null;
        this._mediaTex = m0 ? EP.Media.createTexture(m0) : null;

        var geo = new THREE.PlaneGeometry(8, 4.5);
        this._displayMat = new THREE.ShaderMaterial({
            vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragmentShader: FRAG_DISPLAY,
            uniforms: {
                uDensity: { value: null }, uMedia: { value: this._mediaTex }, uHasMedia: { value: !!this._mediaTex },
                uHazeColor: { value: hexToVec3(this.settings.hazeColor) }
            }
        });
        group.add(new THREE.Mesh(geo, this._displayMat));
        this.group = group;

        this._ready = false;
        try {
            this._velocity = makeDoubleFBO(SIM_RES, SIM_RES);
            this._density = makeDoubleFBO(DYE_RES, DYE_RES);
            this._divergence = makeRT(SIM_RES, SIM_RES);
            this._pressure = makeDoubleFBO(SIM_RES, SIM_RES);

            this._quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            this._quadScene = new THREE.Scene();
            this._quadGeo = new THREE.PlaneGeometry(2, 2);
            this._matAdvection = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG_ADVECTION, uniforms: { uVelocity: { value: null }, uSource: { value: null }, uTexelSize: { value: new THREE.Vector2() }, uDt: { value: 0.016 }, uDissipation: { value: 0.98 } }, depthTest: false, depthWrite: false });
            this._matSplat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG_SPLAT, uniforms: { uTarget: { value: null }, uAspectRatio: { value: 1 }, uColor: { value: new THREE.Vector3() }, uPoint: { value: new THREE.Vector2() }, uRadius: { value: 0.003 } }, depthTest: false, depthWrite: false });
            this._matDivergence = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG_DIVERGENCE, uniforms: { uVelocity: { value: null }, uTexelSize: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false });
            this._matPressure = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG_PRESSURE, uniforms: { uPressure: { value: null }, uDivergence: { value: null }, uTexelSize: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false });
            this._matGradSub = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG_GRADIENT_SUBTRACT, uniforms: { uPressure: { value: null }, uVelocity: { value: null }, uTexelSize: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false });
            this._quadMesh = new THREE.Mesh(this._quadGeo, this._matAdvection);
            this._quadScene.add(this._quadMesh);

            this._pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moved: false };
            var self = this;
            this._onMove = function(e) {
                var canvas = document.querySelector('canvas');
                if (!canvas) return;
                var rect = canvas.getBoundingClientRect();
                self._pointer.px = self._pointer.x; self._pointer.py = self._pointer.y;
                self._pointer.x = (e.clientX - rect.left) / rect.width;
                self._pointer.y = 1.0 - (e.clientY - rect.top) / rect.height;
                self._pointer.moved = true;
            };
            window.addEventListener('mousemove', this._onMove);

            this._ready = true;
        } catch (e) {
            this._ready = false;
        }

        return group;
    };

    effect.update = function(time, dt) {
        if (this._mediaTex) EP.Media.updateTexture(this._mediaTex);
        this._displayMat.uniforms.uHazeColor.value = hexToVec3(this.settings.hazeColor);

        if (!this._ready) return;
        var renderer = EP.Core && EP.Core.renderer;
        if (!renderer) return;

        var prevTarget = renderer.getRenderTarget();
        var W = 8, H = 4.5, aspect = W / H;
        var dtClamped = Math.min(dt || 0.016, 0.033);
        var dissipation = (this.settings.dissipation || 97) / 100;
        var radius = (this.settings.splatRadius || 35) / 100000;
        var force = (this.settings.splatForce || 120) / 40;

        function runPass(mat, target) {
            renderer.setRenderTarget(target);
            var prevMat = this._quadMesh.material;
            this._quadMesh.material = mat;
            renderer.render(this._quadScene, this._quadCamera);
            this._quadMesh.material = prevMat;
        }
        runPass = runPass.bind(this);

        var simTexel = new THREE.Vector2(1 / SIM_RES, 1 / SIM_RES);

        // Advect velocity by itself
        this._matAdvection.uniforms.uVelocity.value = this._velocity.read.texture;
        this._matAdvection.uniforms.uSource.value = this._velocity.read.texture;
        this._matAdvection.uniforms.uTexelSize.value = simTexel;
        this._matAdvection.uniforms.uDt.value = dtClamped;
        this._matAdvection.uniforms.uDissipation.value = 0.99;
        runPass(this._matAdvection, this._velocity.write);
        this._velocity.swap();

        // Advect density by velocity
        this._matAdvection.uniforms.uVelocity.value = this._velocity.read.texture;
        this._matAdvection.uniforms.uSource.value = this._density.read.texture;
        this._matAdvection.uniforms.uDissipation.value = dissipation;
        runPass(this._matAdvection, this._density.write);
        this._density.swap();

        // Splat on pointer movement
        if (this._pointer.moved) {
            var dx = (this._pointer.x - this._pointer.px) * force;
            var dy = (this._pointer.y - this._pointer.py) * force;
            this._matSplat.uniforms.uAspectRatio.value = aspect;
            this._matSplat.uniforms.uPoint.value.set(this._pointer.x, this._pointer.y);
            this._matSplat.uniforms.uRadius.value = radius;

            this._matSplat.uniforms.uTarget.value = this._velocity.read.texture;
            this._matSplat.uniforms.uColor.value.set(dx, dy, 0);
            runPass(this._matSplat, this._velocity.write);
            this._velocity.swap();

            this._matSplat.uniforms.uTarget.value = this._density.read.texture;
            this._matSplat.uniforms.uColor.value.set(1, 1, 1);
            runPass(this._matSplat, this._density.write);
            this._density.swap();

            this._pointer.moved = false;
        }

        // Divergence
        this._matDivergence.uniforms.uVelocity.value = this._velocity.read.texture;
        this._matDivergence.uniforms.uTexelSize.value = simTexel;
        runPass(this._matDivergence, this._divergence);

        // Pressure Jacobi iterations
        this._matPressure.uniforms.uDivergence.value = this._divergence.texture;
        this._matPressure.uniforms.uTexelSize.value = simTexel;
        for (var i = 0; i < 8; i++) {
            this._matPressure.uniforms.uPressure.value = this._pressure.read.texture;
            runPass(this._matPressure, this._pressure.write);
            this._pressure.swap();
        }

        // Gradient subtract
        this._matGradSub.uniforms.uPressure.value = this._pressure.read.texture;
        this._matGradSub.uniforms.uVelocity.value = this._velocity.read.texture;
        this._matGradSub.uniforms.uTexelSize.value = simTexel;
        runPass(this._matGradSub, this._velocity.write);
        this._velocity.swap();

        this._displayMat.uniforms.uDensity.value = this._density.read.texture;

        renderer.setRenderTarget(prevTarget);
    };

    effect.dispose = function() {
        if (this._onMove) window.removeEventListener('mousemove', this._onMove);
        ['_velocity', '_density', '_pressure'].forEach(function(k) {
            if (this[k]) { this[k].read.dispose(); this[k].write.dispose(); }
        }, this);
        if (this._divergence) this._divergence.dispose();
        this._mediaTex = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
