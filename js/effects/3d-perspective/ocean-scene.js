(function() {
    var effect = new EP.EffectBase('ocean-scene', {
        name: 'Ocean Scene',
        category: '3d-perspective',
        icon: '🌊',
        description: 'Escena oceanica procedural con cielo, sol, olas y estrellas — fondo animado espectacular'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'scene', type: 'select', options: ['Sunset', 'Day', 'Fire', 'Night', 'Storm'], default: 'Sunset', label: 'Scene' },
        { key: 'waveAmp', type: 'range', min: 10, max: 100, default: 50, label: 'Wave Height', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 40, label: 'Speed', unit: '%' },
        { key: 'fogDensity', type: 'range', min: 0, max: 100, default: 50, label: 'Fog', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    var sceneColors = {
        Sunset: {
            skyTop: [0.18, 0.06, 0.24], skyHori: [0.92, 0.48, 0.18],
            sunCol: [1.0, 0.62, 0.22], seaDeep: [0.08, 0.05, 0.12],
            seaShallow: [0.28, 0.17, 0.24], fog: [0.80, 0.50, 0.30]
        },
        Day: {
            skyTop: [0.05, 0.24, 0.68], skyHori: [0.42, 0.62, 0.90],
            sunCol: [1.0, 0.96, 0.80], seaDeep: [0.03, 0.14, 0.34],
            seaShallow: [0.09, 0.38, 0.60], fog: [0.58, 0.72, 0.90]
        },
        Fire: {
            skyTop: [0.26, 0.06, 0.04], skyHori: [0.88, 0.32, 0.04],
            sunCol: [1.0, 0.38, 0.05], seaDeep: [0.10, 0.06, 0.04],
            seaShallow: [0.24, 0.13, 0.06], fog: [0.70, 0.28, 0.05]
        },
        Night: {
            skyTop: [0.01, 0.01, 0.05], skyHori: [0.03, 0.05, 0.14],
            sunCol: [0.70, 0.75, 0.94], seaDeep: [0.00, 0.01, 0.03],
            seaShallow: [0.04, 0.06, 0.16], fog: [0.02, 0.03, 0.08]
        },
        Storm: {
            skyTop: [0.04, 0.05, 0.09], skyHori: [0.15, 0.17, 0.23],
            sunCol: [0.26, 0.28, 0.34], seaDeep: [0.03, 0.04, 0.07],
            seaShallow: [0.07, 0.10, 0.14], fog: [0.12, 0.14, 0.18]
        }
    };

    var vertexShader = [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = vec4(position, 1.0);',
        '}'
    ].join('\n');

    var fragmentShader = [
        'precision highp float;',
        'uniform vec2 uResolution;',
        'uniform float uTime;',
        'uniform float uWaveAmp;',
        'uniform float uFog;',
        'uniform vec3 uSkyTop;',
        'uniform vec3 uSkyHori;',
        'uniform vec3 uSunCol;',
        'uniform vec3 uSeaDeep;',
        'uniform vec3 uSeaShallow;',
        'uniform vec3 uFogCol;',
        'varying vec2 vUv;',
        '',
        'float hash(vec2 p) {',
        '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
        '}',
        '',
        'float noise(vec2 p) {',
        '  vec2 i = floor(p);',
        '  vec2 f = fract(p);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  float a = hash(i);',
        '  float b = hash(i + vec2(1.0, 0.0));',
        '  float c = hash(i + vec2(0.0, 1.0));',
        '  float d = hash(i + vec2(1.0, 1.0));',
        '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
        '}',
        '',
        'float waveH(vec2 p, float t) {',
        '  float h = 0.0;',
        '  h += uWaveAmp * 0.66 * sin(dot(p, vec2(1.0, 0.28)) * 0.42 + t * 0.38);',
        '  h += uWaveAmp * 0.22 * sin(dot(p, vec2(1.0, 0.28)) * 0.94 - t * 0.62);',
        '  h += uWaveAmp * 0.14 * sin(dot(p, vec2(-0.48, 0.88)) * 1.18 - t * 0.82);',
        '  h += uWaveAmp * 0.09 * sin(dot(p, vec2(0.82, -0.16)) * 1.82 + t * 1.04);',
        '  h += uWaveAmp * 0.11 * sin(p.x * 1.45 - t * 0.76 + p.y * 0.66);',
        '  h += uWaveAmp * 0.07 * sin(p.x * 2.85 + t * 1.06 - p.y * 0.52);',
        '  float micro = noise(p * 14.0 + vec2(t * 0.18, t * 0.06)) - 0.5;',
        '  h += micro * uWaveAmp * 0.01;',
        '  return h;',
        '}',
        '',
        'vec3 waveNorm(vec2 p, float t) {',
        '  float e = 0.018;',
        '  float hL = waveH(p - vec2(e, 0.0), t);',
        '  float hR = waveH(p + vec2(e, 0.0), t);',
        '  float hD = waveH(p - vec2(0.0, e), t);',
        '  float hU = waveH(p + vec2(0.0, e), t);',
        '  return normalize(vec3(-(hR - hL) / (2.0 * e), 1.0, -(hU - hD) / (2.0 * e)));',
        '}',
        '',
        'float starField(vec2 uv) {',
        '  vec2 gv = floor(uv);',
        '  vec2 lv = fract(uv) - 0.5;',
        '  float h = hash(gv);',
        '  float size = mix(0.012, 0.0025, h);',
        '  float d = length(lv + vec2(hash(gv + 3.1) - 0.5, hash(gv + 7.3) - 0.5) * 0.25);',
        '  float star = smoothstep(size, 0.0, d);',
        '  star *= smoothstep(0.82, 1.0, h);',
        '  return star;',
        '}',
        '',
        'void main() {',
        '  vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / uResolution.y;',
        '  float t = uTime;',
        '',
        '  vec3 ro = vec3(0.0, 1.1, 0.05);',
        '  vec3 rd = normalize(vec3(uv.x, uv.y - 0.1, -1.4));',
        '',
        '  vec3 sky = mix(uSkyHori, uSkyTop, clamp(uv.y * 2.0 + 0.5, 0.0, 1.0));',
        '',
        '  vec2 sunDir = vec2(0.0, 0.12);',
        '  float sunDist = length(uv - sunDir);',
        '  float sun = smoothstep(0.15, 0.0, sunDist);',
        '  float glow = smoothstep(0.8, 0.0, sunDist) * 0.4;',
        '  sky += uSunCol * (sun + glow);',
        '',
        '  float stars = starField(uv * 60.0) + starField(uv * 30.0 + 100.0) * 0.5;',
        '  float nightFactor = 1.0 - clamp(length(uSkyTop) * 3.0, 0.0, 1.0);',
        '  sky += vec3(stars) * nightFactor;',
        '',
        '  vec3 col = sky;',
        '',
        '  if (rd.y < 0.0) {',
        '    float dist = -ro.y / rd.y;',
        '    vec2 hitPos = ro.xz + rd.xz * dist;',
        '    float wh = waveH(hitPos, t);',
        '    vec3 wn = waveNorm(hitPos, t);',
        '',
        '    vec3 seaCol = mix(uSeaDeep, uSeaShallow, clamp(wh * 2.0 + 0.5, 0.0, 1.0));',
        '',
        '    vec3 reflDir = reflect(rd, wn);',
        '    float fresnel = pow(1.0 - max(dot(-rd, wn), 0.0), 4.0);',
        '    vec3 reflCol = mix(uSkyHori, uSkyTop, clamp(reflDir.y, 0.0, 1.0));',
        '    reflCol += uSunCol * pow(max(dot(reflDir, normalize(vec3(0.0, 0.12, -1.0))), 0.0), 64.0);',
        '',
        '    seaCol = mix(seaCol, reflCol, fresnel * 0.7);',
        '',
        '    float fogAmount = 1.0 - exp(-dist * 0.08 * uFog);',
        '    seaCol = mix(seaCol, uFogCol, clamp(fogAmount, 0.0, 1.0));',
        '',
        '    col = seaCol;',
        '  }',
        '',
        '  col = pow(col, vec3(0.9));',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var colors = sceneColors[this.settings.scene] || sceneColors.Sunset;

        this._uniforms = {
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uTime: { value: 0 },
            uWaveAmp: { value: this.settings.waveAmp / 100 },
            uFog: { value: this.settings.fogDensity / 100 },
            uSkyTop: { value: new THREE.Vector3(colors.skyTop[0], colors.skyTop[1], colors.skyTop[2]) },
            uSkyHori: { value: new THREE.Vector3(colors.skyHori[0], colors.skyHori[1], colors.skyHori[2]) },
            uSunCol: { value: new THREE.Vector3(colors.sunCol[0], colors.sunCol[1], colors.sunCol[2]) },
            uSeaDeep: { value: new THREE.Vector3(colors.seaDeep[0], colors.seaDeep[1], colors.seaDeep[2]) },
            uSeaShallow: { value: new THREE.Vector3(colors.seaShallow[0], colors.seaShallow[1], colors.seaShallow[2]) },
            uFogCol: { value: new THREE.Vector3(colors.fog[0], colors.fog[1], colors.fog[2]) }
        };

        var mat = new THREE.ShaderMaterial({
            uniforms: this._uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            depthTest: false,
            depthWrite: false
        });

        var geo = new THREE.PlaneGeometry(2, 2);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.frustumCulled = false;
        group.add(mesh);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._uniforms) return;
        var speed = this.settings.speed / 100;
        this._uniforms.uTime.value = time * speed;
        this._uniforms.uWaveAmp.value = this.settings.waveAmp / 100;
        this._uniforms.uFog.value = this.settings.fogDensity / 100;

        var colors = sceneColors[this.settings.scene] || sceneColors.Sunset;
        this._uniforms.uSkyTop.value.set(colors.skyTop[0], colors.skyTop[1], colors.skyTop[2]);
        this._uniforms.uSkyHori.value.set(colors.skyHori[0], colors.skyHori[1], colors.skyHori[2]);
        this._uniforms.uSunCol.value.set(colors.sunCol[0], colors.sunCol[1], colors.sunCol[2]);
        this._uniforms.uSeaDeep.value.set(colors.seaDeep[0], colors.seaDeep[1], colors.seaDeep[2]);
        this._uniforms.uSeaShallow.value.set(colors.seaShallow[0], colors.seaShallow[1], colors.seaShallow[2]);
        this._uniforms.uFogCol.value.set(colors.fog[0], colors.fog[1], colors.fog[2]);

        var w = EP.Core.renderer.domElement.width;
        var h = EP.Core.renderer.domElement.height;
        this._uniforms.uResolution.value.set(w, h);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
