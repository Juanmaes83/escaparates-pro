// Peel Sticker Badge — original vertex-shader curl (concept only, no code
// borrowed): a circular disc is masked from a subdivided plane (UV-distance
// discard), and a hinge line sweeps across it lifting/rolling every vertex
// past the hinge into a small cylinder, exposing a tinted underside
// (gl_FrontFacing switch, same trick used elsewhere in this codebase for
// paper backfaces). A soft blob shadow grows underneath as the sticker lifts.
(function() {
    var effect = new EP.EffectBase('peel-sticker-badge', {
        name: 'Peel Sticker Badge',
        category: 'reveal-wipe',
        icon: '🏷️',
        description: 'Insignia circular que se despega revelando un reverso tintado, con sombra creciente; efecto de sello o pegatina premium'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'peelSpeed', type: 'range', min: 10, max: 200, default: 55, step: 5, label: 'Velocidad de despegue', unit: '%' },
        { key: 'curlRadius', type: 'range', min: 5, max: 40, default: 16, step: 1, label: 'Curvatura del rizo', unit: '%' },
        { key: 'backTint', type: 'color', default: '#1a1410', label: 'Color del reverso' },
        { key: 'shadowStrength', type: 'range', min: 0, max: 100, default: 55, step: 5, label: 'Fuerza de sombra' }
    ]);

    var VERT = [
        'uniform float uHinge;',
        'uniform float uCurlRadius;',
        'varying vec2 vUv;',
        'varying float vShade;',
        'void main() {',
        '  vUv = uv;',
        '  vec3 pos = position;',
        '  float d = pos.x - uHinge;',
        '  float shade = 0.0;',
        '  if (d > 0.0) {',
        '    float r = max(uCurlRadius, 0.001);',
        '    float maxArc = 3.14159;',
        '    float angle = min(d / r, maxArc);',
        '    pos.x = uHinge + r * sin(angle);',
        '    pos.z = r * (1.0 - cos(angle));',
        '    shade = angle / maxArc;',
        '  }',
        '  vShade = shade;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
        '}'
    ].join('\n');

    var FRAG = [
        'precision highp float;',
        'uniform sampler2D uMedia;',
        'uniform bool uHasMedia;',
        'uniform vec3 uBackTint;',
        'varying vec2 vUv;',
        'varying float vShade;',
        'void main() {',
        '  vec2 c = vUv - 0.5;',
        '  if (dot(c, c) > 0.25) discard;',
        '  vec3 color;',
        '  if (gl_FrontFacing) {',
        '    color = uHasMedia ? texture2D(uMedia, vUv).rgb : vec3(0.85, 0.82, 0.75);',
        '    color *= (1.0 - vShade * 0.35);',
        '  } else {',
        '    color = uBackTint * (1.0 - vShade * 0.25);',
        '  }',
        '  gl_FragColor = vec4(color, 1.0);',
        '}'
    ].join('\n');

    function hexToVec3(hex) {
        var v = parseInt((hex || '#1a1410').replace('#', ''), 16);
        return new THREE.Vector3(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var media = mediaList && mediaList[0];
        this._tex = media ? EP.Media.createTexture(media) : null;

        var geo = new THREE.PlaneGeometry(4, 4, 48, 48);
        this._mat = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            vertexShader: VERT,
            fragmentShader: FRAG,
            uniforms: {
                uMedia: { value: this._tex },
                uHasMedia: { value: !!this._tex },
                uHinge: { value: 1.2 },
                uCurlRadius: { value: this.settings.curlRadius / 100 },
                uBackTint: { value: hexToVec3(this.settings.backTint) }
            }
        });
        var mesh = new THREE.Mesh(geo, this._mat);
        group.add(mesh);

        var shadowGeo = new THREE.CircleGeometry(2.1, 40);
        this._shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
        var shadowMesh = new THREE.Mesh(shadowGeo, this._shadowMat);
        shadowMesh.position.z = -0.08;
        group.add(shadowMesh);

        this._elapsed = 0;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt) {
        if (!this._mat) return;
        if (this._tex) EP.Media.updateTexture(this._tex);
        var speedFactor = (this.settings.peelSpeed || 55) / 100;
        if (this.settings.playbackMotion !== 'off') {
            this._elapsed += (dt || 0.016) * speedFactor;
        }
        var t = this._elapsed % 4;
        var tri = t < 2 ? (t / 2) : (2 - (t - 2)) / 2;
        var hinge = 1.2 - tri * 2.4;
        this._mat.uniforms.uHinge.value = hinge;
        this._mat.uniforms.uCurlRadius.value = this.settings.curlRadius / 100;
        this._mat.uniforms.uBackTint.value = hexToVec3(this.settings.backTint);

        var liftAmount = Math.max(0, Math.min(1, (1.2 - hinge) / 2.4));
        this._shadowMat.opacity = liftAmount * (this.settings.shadowStrength / 100) * 0.6;
    };

    effect.dispose = function() {
        if (this._tex && typeof this._tex.dispose === 'function') this._tex.dispose();
        this._tex = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
