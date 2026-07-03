(function() {
    var effect = new EP.EffectBase('cyberspace-portal', {
        name: 'Cyberspace Portal',
        category: '3d-perspective',
        icon: '🌐',
        description: 'Portal ciberespacial — tunel de código flotante con partículas y curva Catmull-Rom'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'tunnelSpeed', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Velocidad tunel' },
        { key: 'particleCount', type: 'range', min: 100, max: 2000, default: 600, step: 50, label: 'Partículas código' },
        { key: 'tunnelColor', type: 'color', default: '#00ff88', label: 'Color tunel/código' },
        { key: 'bgColor', type: 'color', default: '#000408', label: 'Color fondo' },
        { key: 'tunnelRadius', type: 'range', min: 5, max: 30, default: 12, step: 1, label: 'Radio tunel' },
        { key: 'fov', type: 'range', min: 20, max: 90, default: 60, step: 5, label: 'Campo visual', unit: '°' },
        { key: 'glowIntensity', type: 'range', min: 0, max: 100, default: 50, step: 5, label: 'Intensidad glow', unit: '%' }
    ]);

    var CODE_CHARS = '01アイウエオカキクケコサシスセソ{}<>/|\\!@#$%^&*'.split('');

    function sr(s) { var r=(Math.sin(s+1)*43758.5453)%1; return r<0?r+1:r; }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var n = Math.round(this.settings.particleCount);
        var tc = parseInt((this.settings.tunnelColor||'#00ff88').replace('#',''),16);
        var bgC = parseInt((this.settings.bgColor||'#000408').replace('#',''),16);
        var radius = this.settings.tunnelRadius * 0.15;

        // Background plane in its own static group (not moved by camera animation)
        var bgGroup = new THREE.Group();
        bgGroup.add(new THREE.Mesh(
            new THREE.PlaneGeometry(8,4.5),
            new THREE.MeshBasicMaterial({color:bgC})
        ));
        group.add(bgGroup);
        this._bgGroup = bgGroup;

        // Content group (moved independently by camera animation)
        var contentGroup = new THREE.Group();
        group.add(contentGroup);
        this._contentGroup = contentGroup;

        // Catmull-Rom tunnel curve
        var curvePoints = [];
        for (var i=0;i<8;i++) {
            curvePoints.push(new THREE.Vector3(
                Math.sin(i*0.9)*radius*0.4,
                Math.cos(i*0.7)*radius*0.3,
                -i*2.5
            ));
        }
        var curve = new THREE.CatmullRomCurve3(curvePoints);
        var tubeGeo = new THREE.TubeBufferGeometry(curve, 80, radius, 12, false);
        var tubeMat = new THREE.MeshBasicMaterial({
            color: tc, wireframe: true, transparent: true, opacity: 0.15
        });
        var tube = new THREE.Mesh(tubeGeo, tubeMat);
        contentGroup.add(tube);
        this._tube = tube;
        this._curve = curve;

        // Code particles (points along tube)
        var positions = new Float32Array(n*3);
        var sizes = new Float32Array(n);
        this._particleData = [];
        for (var i=0;i<n;i++) {
            var t = sr(i*7);
            var pt = curve.getPoint(t);
            var angle = sr(i*11)*Math.PI*2;
            var pr = (0.1 + sr(i*13)*0.9)*radius;
            positions[i*3]   = pt.x + Math.cos(angle)*pr;
            positions[i*3+1] = pt.y + Math.sin(angle)*pr;
            positions[i*3+2] = pt.z;
            sizes[i] = 0.03 + sr(i*17)*0.06;
            this._particleData.push({
                t: t, angle: angle, pr: pr,
                speed: 0.3+sr(i*19)*0.7,
                char: CODE_CHARS[Math.floor(sr(i*23)*CODE_CHARS.length)]
            });
        }

        var pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
        pGeo.setAttribute('size', new THREE.BufferAttribute(sizes,1));
        var pMat = new THREE.PointsMaterial({
            color: tc, size: 0.08, transparent: true, opacity: 0.7,
            depthWrite: false, sizeAttenuation: true
        });
        this._points = new THREE.Points(pGeo, pMat);
        contentGroup.add(this._points);
        this._positions = positions;

        // Portal ring at entrance
        var ringGeo = new THREE.TorusGeometry(radius, 0.04, 8, 48);
        var ringMat = new THREE.MeshBasicMaterial({color:tc, transparent:true, opacity:0.8});
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.y = Math.PI/2;
        ring.position.z = -0.2;
        contentGroup.add(ring);
        this._ring = ring;

        // Glow ring
        var glowGeo = new THREE.TorusGeometry(radius*1.1, 0.15, 8, 48);
        var glowMat = new THREE.MeshBasicMaterial({color:tc, transparent:true, opacity:0.1, side:THREE.BackSide});
        var glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.y = Math.PI/2;
        glow.position.z = -0.2;
        contentGroup.add(glow);
        this._glow = glow;

        // Mouse tracking for particle speed modulation (M8)
        this._mouseX = 0;
        var self = this;
        this._onMouseMove = function(e) {
            var canvas = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            self._mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        };
        window.addEventListener('mousemove', this._onMouseMove);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._particleData || !this._positions) return;
        var spd = this.settings.tunnelSpeed * 0.02;
        var radius = this.settings.tunnelRadius * 0.15;
        var gi = this.settings.glowIntensity / 100;

        // Move particles along tube — cursor right = faster, left = slower (M8)
        var cursorBoost = 1 + (this._mouseX || 0) * 0.6;
        for (var i=0;i<this._particleData.length;i++) {
            var p = this._particleData[i];
            p.t = (p.t + spd*p.speed*(dt||0.016)*cursorBoost) % 1;
            var pt = this._curve.getPoint(p.t);
            this._positions[i*3]   = pt.x + Math.cos(p.angle + time*0.3)*p.pr;
            this._positions[i*3+1] = pt.y + Math.sin(p.angle + time*0.2)*p.pr;
            this._positions[i*3+2] = pt.z;
        }
        this._points.geometry.attributes.position.needsUpdate = true;

        // Rotate tube slowly
        if (this._tube) this._tube.rotation.z = time*0.1;

        // Pulse ring
        if (this._ring) {
            var pulse = 1 + Math.sin(time*3)*0.06;
            this._ring.scale.set(pulse,pulse,1);
            this._ring.material.opacity = 0.6+Math.sin(time*4)*0.2;
        }
        if (this._glow) {
            this._glow.material.opacity = 0.08*gi + Math.sin(time*2.5)*0.04*gi;
        }

        // Move content group along curve — background stays static (M3)
        var camT = (time*spd*0.5) % 1;
        var camPt = this._curve.getPoint(Math.min(0.95, camT));
        if (this._contentGroup) this._contentGroup.position.z = -camPt.z * 0.15;
    };

    effect.dispose = function() {
        if (this._onMouseMove) { window.removeEventListener('mousemove', this._onMouseMove); this._onMouseMove = null; }
        EP.EffectBase.prototype.dispose.call(this);
        this._particleData=null; this._positions=null;
        this._tube=null; this._points=null; this._ring=null; this._glow=null;
        this._contentGroup=null; this._bgGroup=null;
    };

    EP.Registry.register(effect);
})();
