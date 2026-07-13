// Dithering Grid Pro — adapted from the Codrops repo
// "visualizing-dithering-codrops" (source read & understood: an instanced
// grid of small boxes, each sampling the source image's luminance at its
// row/column position and comparing it against a Bayer/halftone/void-cluster
// threshold matrix value baked in per-instance — classic ordered dithering,
// visualized cell by cell; cells reveal with a staggered z-pop + scale-in,
// the stagger order selectable — cell index / row / column / random /
// corner-to-corner — matching the original repo's delay-type options).
// Reused here as a looping EP.EffectBase canvas effect (InstancedMesh +
// custom ShaderMaterial, Three.js r128) instead of the original Vite/ESM app,
// with the client's own media as the source image and a smooth ping-pong
// reveal driven by the effect's own loop clock instead of a Tweakpane slider.
(function() {
    var effect = new EP.EffectBase('dithering-grid-pro', {
        name: 'Dithering Grid Pro',
        category: 'shader-premium',
        icon: '▦',
        description: 'Rejilla de celdas 3D que revela la imagen mediante ordered dithering (Bayer/halftone), con aparición escalonada por celda/fila/columna/aleatoria/esquina — visualización premium del proceso de tramado'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'resolution', type: 'range', min: 30, max: 140, default: 80, step: 5, label: 'Densidad rejilla', unit: 'celdas' },
        { key: 'thresholdMap', type: 'select', options: [
            { v: 'bayer4x4', l: 'Bayer 4x4' },
            { v: 'bayer8x8', l: 'Bayer 8x8' },
            { v: 'halftone', l: 'Halftone' },
            { v: 'voidAndCluster', l: 'Void and Cluster' }
        ], default: 'bayer4x4', label: 'Matriz de tramado' },
        { key: 'delayType', type: 'select', options: [
            { v: '1', l: 'Por celda' },
            { v: '2', l: 'Por fila' },
            { v: '3', l: 'Por columna' },
            { v: '4', l: 'Aleatorio' },
            { v: '5', l: 'Esquina a esquina' }
        ], default: '5', label: 'Orden de aparición' },
        { key: 'cellColor', type: 'color', default: '#ffffff', label: 'Color celda (tinta)' },
        { key: 'bgColor', type: 'color', default: '#0a0a0c', label: 'Color fondo' },
        { key: 'depthPop', type: 'range', min: 0, max: 60, default: 22, step: 1, label: 'Profundidad Z', unit: 'u' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: false,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'high',
        minMedia: 1,
        exportSafe: true,
        hasErrorBoundary: true
    };

    var THRESHOLD_MAPS = {
        bayer4x4: { rows: 4, columns: 4, data: [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5] },
        halftone: { rows: 8, columns: 8, data: [24,10,12,26,35,47,49,37,8,0,2,14,45,59,61,51,22,6,4,16,43,57,63,53,30,20,18,28,33,41,55,39,34,46,48,36,25,11,13,27,44,58,60,50,9,1,3,15,42,56,62,52,23,7,5,17,32,40,54,38,31,21,19,29] },
        bayer8x8: { rows: 8, columns: 8, data: [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21] },
        voidAndCluster: { rows: 14, columns: 14, data: [131,187,8,78,50,18,134,89,155,102,29,95,184,73,22,86,113,171,142,105,34,166,9,60,151,128,40,110,168,137,45,28,64,188,82,54,124,189,80,13,156,56,7,61,186,121,154,6,108,177,24,100,38,176,93,123,83,148,96,17,88,133,44,145,69,161,139,72,30,181,115,27,163,47,178,65,164,14,120,48,5,127,153,52,190,58,126,81,116,21,106,77,173,92,191,63,99,12,76,144,4,185,37,149,192,39,135,23,117,31,170,132,35,172,103,66,129,79,3,97,57,159,70,141,53,94,114,20,49,158,19,146,169,122,183,11,104,180,2,165,152,87,182,118,91,42,67,25,84,147,43,85,125,68,16,136,71,10,193,112,160,138,51,111,162,26,194,46,174,107,41,143,33,74,1,101,195,15,75,140,109,90,32,62,157,98,167,119,179,59,36,130,175,55,0,150] }
    };

    var _vert = [
        'uniform float uAnimationProgress;',
        'uniform float uAnimationMinDelay;',
        'uniform float uAnimationMaxDelay;',
        'uniform vec3 uCellColor;',
        'uniform sampler2D uMedia;',
        'uniform bool uHasMedia;',
        'uniform float uDepthPop;',
        'attribute float aRowIdNormalized;',
        'attribute float aColumnIdNormalized;',
        'attribute float aCellIdNormalized;',
        'attribute float aDitheringThreshold;',
        'varying vec3 vColor;',
        'varying float vLit;',

        'float random(vec2 st){ return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123); }',

        'void main(){',
        '  float delayFactor;',
        '  #if DELAY_TYPE == 1',
        '    delayFactor = aCellIdNormalized;',
        '  #elif DELAY_TYPE == 2',
        '    delayFactor = aRowIdNormalized;',
        '  #elif DELAY_TYPE == 3',
        '    delayFactor = aColumnIdNormalized;',
        '  #elif DELAY_TYPE == 4',
        '    delayFactor = random(vec2(aColumnIdNormalized, aRowIdNormalized));',
        '  #elif DELAY_TYPE == 5',
        '    delayFactor = smoothstep(0.0, 1.42, distance(vec2(aRowIdNormalized, aColumnIdNormalized), vec2(0.0)));',
        '  #else',
        '    delayFactor = 0.0;',
        '  #endif',

        '  float animationStart = mix(uAnimationMinDelay, uAnimationMaxDelay, delayFactor);',
        '  float animationDuration = 1.0 - uAnimationMaxDelay;',
        '  float animationEnd = animationStart + animationDuration;',
        '  float revealProgress = smoothstep(animationStart, animationEnd, uAnimationProgress);',

        '  float imageColor = uHasMedia ? texture2D(uMedia, vec2(aColumnIdNormalized, 1.0 - aRowIdNormalized)).r : (0.35 + 0.3*aRowIdNormalized);',
        '  float dithered = step(aDitheringThreshold, imageColor);',
        '  vLit = dithered;',
        '  vColor = uCellColor * (0.25 + dithered * 0.9);',

        '  vec3 localPos = position * mix(0.0, 1.0, revealProgress);',
        '  vec4 worldPos = modelMatrix * instanceMatrix * vec4(localPos, 1.0);',
        '  worldPos.z += mix(-uDepthPop, 0.0, revealProgress) * (1.0 - dithered * 0.4);',
        '  gl_Position = projectionMatrix * viewMatrix * worldPos;',
        '}'
    ].join('\n');

    var _frag = [
        'varying vec3 vColor;',
        'varying float vLit;',
        'uniform vec3 uBgColor;',
        'void main(){',
        '  gl_FragColor = vec4(mix(uBgColor, vColor, 0.15 + vLit*0.85), 1.0);',
        '}'
    ].join('\n');

    function hexToVec3(hex) {
        var v = parseInt(hex.replace('#', ''), 16);
        return new THREE.Vector3(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
    }

    function getSafeResolution(requested) {
        var profile = EP.DeviceProfile && EP.DeviceProfile.get ? EP.DeviceProfile.get() : null;
        if (!profile || profile.type === 'desktop') return requested;
        return Math.min(requested, profile.lowPower ? 48 : 64);
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._m0 = (mediaList && mediaList[0]) || null;
        this._tex = this._m0 ? EP.Media.createTexture(this._m0) : null;

        var cells = getSafeResolution(Math.round(this.settings.resolution));
        var cellSize = 5.6 / cells;
        var geometry = new THREE.BoxGeometry(cellSize * 0.92, cellSize * 0.92, 0.4);
        var count = cells * cells;

        var mapCfg = THRESHOLD_MAPS[this.settings.thresholdMap] || THRESHOLD_MAPS.bayer4x4;
        var aCellId = new Float32Array(count);
        var aRowId = new Float32Array(count);
        var aColId = new Float32Array(count);
        var aThresh = new Float32Array(count);

        for (var i = 0; i < count; i++) {
            var rowId = Math.floor(i / cells);
            var colId = i % cells;
            aCellId[i] = i / (count - 1);
            aRowId[i] = rowId / (cells - 1);
            aColId[i] = colId / (cells - 1);
            var mr = rowId % mapCfg.rows, mc = colId % mapCfg.columns;
            var idx = mc + mr * mapCfg.columns;
            aThresh[i] = mapCfg.data[idx] / mapCfg.data.length;
        }

        geometry.setAttribute('aCellIdNormalized', new THREE.InstancedBufferAttribute(aCellId, 1));
        geometry.setAttribute('aRowIdNormalized', new THREE.InstancedBufferAttribute(aRowId, 1));
        geometry.setAttribute('aColumnIdNormalized', new THREE.InstancedBufferAttribute(aColId, 1));
        geometry.setAttribute('aDitheringThreshold', new THREE.InstancedBufferAttribute(aThresh, 1));

        var material = new THREE.ShaderMaterial({
            vertexShader: _vert,
            fragmentShader: _frag,
            defines: { DELAY_TYPE: parseInt(this.settings.delayType, 10) || 5 },
            uniforms: {
                uAnimationProgress: { value: 0 },
                uAnimationMinDelay: { value: 0.0 },
                uAnimationMaxDelay: { value: 0.85 },
                uCellColor: { value: hexToVec3(this.settings.cellColor) },
                uBgColor: { value: hexToVec3(this.settings.bgColor) },
                uDepthPop: { value: this.settings.depthPop },
                uMedia: { value: this._tex },
                uHasMedia: { value: !!this._tex }
            }
        });

        var mesh = new THREE.InstancedMesh(geometry, material, count);
        for (var j = 0; j < count; j++) {
            var rowId2 = Math.floor(j / cells);
            var colId2 = j % cells;
            var x = (colId2 - (cells - 1) / 2) * cellSize;
            var y = (-rowId2 + (cells - 1) / 2) * cellSize;
            var obj = new THREE.Object3D();
            obj.position.set(x, y, 0);
            obj.updateMatrix();
            mesh.setMatrixAt(j, obj.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;

        group.add(mesh);
        this._mesh = mesh;
        this._material = material;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._material) return;
        if (this._tex) EP.Media.updateTexture(this._tex);
        if (this.settings.playbackMotion === 'off') {
            this._material.uniforms.uAnimationProgress.value = 1;
            return;
        }
        var t = ((time * (this.settings.playbackMotionSpeed / 100)) % loopDuration) / loopDuration;
        var progress = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
        this._material.uniforms.uAnimationProgress.value = progress;
    };

    effect.dispose = function() {
        this._mesh = null; this._material = null; this._tex = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
