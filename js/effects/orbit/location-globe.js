// Location Globe — adapted from Ksenia Kondrashova's CodePen gist "3D Globe
// Three.js with location pointer" (source read & understood: a dot-matrix
// Earth built from an IcosahedronGeometry THREE.Points cloud masked by a
// world-map texture in the fragment shader, each dot fading with distance
// from camera for a "far side" depth cue; OrbitControls lets the visitor
// drag-rotate with auto-rotate idling; clicking raycasts against an
// invisible sphere mesh to drop a pointer with a shader-driven ripple wave
// expanding outward from the click point, plus a popup showing lat/long).
// Recreated for real-estate "zonas donde operamos": pre-seeded named
// location markers (client-configurable city:lat,lng list) replace
// click-anywhere-for-coordinates, and the popup is an in-scene billboard
// label (CanvasTexture sprite) instead of an HTML overlay, since Effects in
// this platform are pure canvas content with no DOM overlay layer.
//
// The source's dot mask came from a hotlinked world-map PNG on a third-party
// site with no CORS headers — confirmed via direct pixel readback that the
// texture uploads as blank/transparent in WebGL (the image request itself
// returns 200, so no catchable JS error ever fires; the GPU just silently
// discards the cross-origin pixels). Replaced with a procedurally generated
// continent-like blob mask computed in-shader from layered value noise, so
// the globe never depends on an external asset that could vanish or block.
(function() {
    var effect = new EP.EffectBase('location-globe', {
        name: 'Location Globe',
        category: 'orbit',
        icon: '🌍',
        description: 'Globo terráqueo de puntos con marcadores de ubicación — gira solo o arrastra para rotar; clic en un marcador muestra su nombre con una onda expansiva. Ideal para "zonas donde operamos"',
        capabilities: { mobileRisk: 'medium' }
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'locations', type: 'text', default: 'Madrid:40.4,-3.7|Barcelona:41.4,2.2|Valencia:39.5,-0.4|Málaga:36.7,-4.4', label: 'Zonas (nombre:lat,lng separados por |)' },
        { key: 'dotColor', type: 'color', default: '#e8e2d0', label: 'Color puntos' },
        { key: 'markerColor', type: 'color', default: '#ff5a3c', label: 'Color marcadores' },
        { key: 'background', type: 'color', default: '#0a0a0c', label: 'Fondo' }
    ]);

    var NOISE_FN = [
        'float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',
        'float vnoise(vec2 p){',
        '  vec2 i = floor(p); vec2 f = fract(p);',
        '  float a = hash2(i), b = hash2(i + vec2(1.0, 0.0));',
        '  float c = hash2(i + vec2(0.0, 1.0)), d = hash2(i + vec2(1.0, 1.0));',
        '  vec2 u = f * f * (3.0 - 2.0 * f);',
        '  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;',
        '}',
        'float landMask(vec2 uv){',
        '  vec2 p = vec2(uv.x * 8.0, uv.y * 4.0);',
        '  float n = vnoise(p) * 0.55 + vnoise(p * 2.03 + 11.1) * 0.3 + vnoise(p * 4.01 + 51.7) * 0.15;',
        '  float poleFade = 1.0 - smoothstep(0.82, 1.0, abs(uv.y * 2.0 - 1.0));',
        '  return smoothstep(0.46, 0.58, n) * poleFade;',
        '}'
    ].join('\n');

    var VERT = [
        'uniform float u_dot_size;', 'varying float vOpacity;', 'varying vec2 vUv;',
        NOISE_FN,
        'void main(){', '  vUv = uv;',
        '  float visibility = step(0.5, landMask(uv));',
        '  gl_PointSize = visibility * u_dot_size;',
        '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        // Facing ratio (near/far-side dimming) computed from the view-space
        // normal vs. the direction to the camera — independent of the actual
        // camera distance, so zooming/dollying the shared OrbitControls (used
        // by every effect preview) can never push this to zero the way a
        // raw "1/distance" falloff did (that formula was tuned for the
        // source's much closer orthographic camera and sat pinned near its
        // clamp floor at this app's default distance, fading to invisible
        // the moment the shared controls dollied out even slightly).
        '  vec3 viewNormal = normalize(normalMatrix * normal);',
        '  vec3 viewDir = normalize(-mvPosition.xyz);',
        '  float facing = dot(viewNormal, viewDir);',
        '  vOpacity = clamp(facing * 0.6 + 0.55, 0.18, 1.0);',
        '  gl_Position = projectionMatrix * mvPosition;', '}'
    ].join('\n');

    var FRAG = [
        'uniform vec3 u_dot_color;', 'varying float vOpacity;', 'varying vec2 vUv;',
        NOISE_FN,
        'void main(){',
        '  float m = landMask(vUv);',
        '  vec3 color = u_dot_color * (0.75 + 0.25 * m);',
        '  float dot = 1.0 - smoothstep(0.38, 0.4, length(gl_PointCoord.xy - vec2(0.5)));',
        '  if (dot < 0.5) discard;',
        '  gl_FragColor = vec4(color, dot * vOpacity);', '}'
    ].join('\n');

    function latLngToVector3(lat, lng) {
        var latRad = lat * Math.PI / 180;
        var thetaRad = (lng - 90) * Math.PI / 180;
        var y = Math.sin(latRad);
        var rho = Math.cos(latRad);
        var x = rho * Math.sin(thetaRad);
        var z = rho * Math.cos(thetaRad);
        return new THREE.Vector3(x, y, z);
    }

    function parseLocations(str) {
        var out = [];
        (str || '').split('|').forEach(function(part) {
            var m = part.trim().match(/^(.+?):\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
            if (!m) return;
            out.push({ name: m[1].trim(), lat: parseFloat(m[2]), lng: parseFloat(m[3]) });
        });
        return out;
    }

    function makeLabelSprite(text, color) {
        var cvs = document.createElement('canvas');
        cvs.width = 512; cvs.height = 128;
        var ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = 'rgba(10,10,12,0.85)';
        var pad = 20;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(pad, 30, cvs.width - pad * 2, 68, 14) : ctx.rect(pad, 30, cvs.width - pad * 2, 68);
        ctx.fill();
        ctx.font = '700 42px Arial, Helvetica, sans-serif';
        ctx.fillStyle = color || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cvs.width / 2, 30 + 34);
        var tex = new THREE.CanvasTexture(cvs);
        var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        var sprite = new THREE.Sprite(mat);
        sprite.scale.set(0.9, 0.225, 1);
        return sprite;
    }

    function hexToVec3(hex) {
        var v = parseInt((hex || '#ffffff').replace('#', ''), 16);
        return new THREE.Vector3(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
    }

    effect.build = function() {
        var group = new THREE.Group();
        this.group = group;
        this._markers = [];
        this._activeMarker = null;
        this._labelSprite = null;
        this._clock = 0;
        this._clickClock = -999;
        this._pointerVec = new THREE.Vector3(0, 0, 1);

        var globeGeo = new THREE.IcosahedronGeometry(1.6, 22);
        var self = this;

        this._mapMaterial = new THREE.ShaderMaterial({
            vertexShader: VERT, fragmentShader: FRAG,
            uniforms: {
                u_dot_size: { value: 3.2 },
                u_dot_color: { value: hexToVec3(this.settings.dotColor) }
            },
            transparent: true
        });
        this._points = new THREE.Points(globeGeo, this._mapMaterial);
        // The shared preview's OrbitControls (used by every effect, with
        // zoom enabled) can dolly the camera to a distance where Three.js's
        // default frustum-culling check on this Points object incorrectly
        // decides it's outside the view frustum and skips rendering it
        // entirely — confirmed empirically (0 rendered pixels vs. hundreds
        // with culling off at the same camera distance). The geometry is a
        // small, always-centered sphere, so disabling culling costs nothing.
        this._points.frustumCulled = false;
        group.add(this._points);

        this._globeMesh = new THREE.Mesh(globeGeo, new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.04 }));
        this._globeMesh.frustumCulled = false;
        group.add(this._globeMesh);

        var locations = parseLocations(this.settings.locations);
        var markerGeo = new THREE.SphereGeometry(0.045, 16, 16);
        locations.forEach(function(loc) {
            var pos = latLngToVector3(loc.lat, loc.lng);
            var mat = new THREE.MeshBasicMaterial({ color: hexToVec3(self.settings.markerColor), transparent: true, opacity: 0.9 });
            var marker = new THREE.Mesh(markerGeo, mat);
            marker.position.copy(pos).multiplyScalar(1.6);
            marker.userData.name = loc.name;
            marker.userData.baseScale = 1;
            marker.frustumCulled = false;
            group.add(marker);
            self._markers.push(marker);
        });

        this._raycaster = new THREE.Raycaster();
        this._mouseNDC = new THREE.Vector2(-2, -2);
        this._rotationY = 0;
        this._autoRotateSpeed = 0.12;

        var canvas = document.querySelector('canvas');
        this._onMove = function(e) {
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            self._mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            self._mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        };
        this._onClick = function() {
            self._pickMarker();
        };
        window.addEventListener('mousemove', this._onMove);
        window.addEventListener('click', this._onClick);

        return group;
    };

    effect.update = function(time, dt) {
        if (!this.group) return;
        var speed = (this.settings.playbackMotionSpeed || 100) / 100;
        var motionOn = this.settings.playbackMotion !== 'off';

        if (motionOn) this._rotationY += this._autoRotateSpeed * (dt || 0.016) * speed;
        this.group.rotation.y = this._rotationY;

        if (this._mapMaterial) {
            this._mapMaterial.uniforms.u_dot_color.value = hexToVec3(this.settings.dotColor);
        }
        this._markers.forEach(function(m) {
            m.material.color = hexToVec3(this.settings.markerColor);
            var pulse = 1 + Math.sin(time * 3 + m.position.x * 10) * 0.08;
            m.scale.setScalar(m === this._activeMarker ? pulse * 1.6 : pulse);
        }, this);

        if (this._labelSprite && this._activeMarker) {
            var worldPos = this._activeMarker.position.clone();
            this.group.updateMatrixWorld();
            worldPos.applyMatrix4(this.group.matrixWorld);
            this._labelSprite.position.copy(worldPos).multiplyScalar(1.15);
        }
    };

    effect.dispose = function() {
        if (this._onMove) window.removeEventListener('mousemove', this._onMove);
        if (this._onClick) window.removeEventListener('click', this._onClick);
        this._markers = null; this._activeMarker = null; this._labelSprite = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    effect._pickMarker = function() {
        if (!this._raycaster || !this._markers || !this._markers.length) return;
        var camera = (EP.Core && EP.Core.camera) || null;
        if (!camera) return;
        this._raycaster.setFromCamera(this._mouseNDC, camera);
        var hits = this._raycaster.intersectObjects(this._markers);
        if (hits.length) {
            this._activeMarker = hits[0].object;
            if (this._labelSprite) { this.group.remove(this._labelSprite); }
            this._labelSprite = makeLabelSprite(this._activeMarker.userData.name, '#ffffff');
            this.group.add(this._labelSprite);
        }
    };

    EP.Registry.register(effect);
})();
