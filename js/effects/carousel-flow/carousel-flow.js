(function() {
    var effect = new EP.EffectBase('carousel-flow', {
        name: 'Carousel Flow',
        category: 'carousel-flow',
        icon: '↔️',
        description: 'Scroll lateral clasico con foco central'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 60, default: 40, label: 'Card Size', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 3, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 8, label: 'Corner Radius', unit: '%' },
        { key: 'stagger', type: 'range', min: 0, max: 2, default: 0, step: 0.05, label: 'Stagger', unit: 's' },
        { key: 'focusScale', type: 'range', min: 80, max: 150, default: 100, label: 'Focus Scale', unit: '%' },
        { key: 'dimAmount', type: 'range', min: 0, max: 100, default: 0, label: 'Dim Periféricos', unit: '%' },
        { key: 'tiltMode', type: 'select', options: [{ v: 'off', l: 'Off' }, { v: 'fan', l: 'Fan' }, { v: 'alternate', l: 'Alternate' }, { v: 'uniform', l: 'Uniform' }], default: 'off', label: 'Tilt Mode' },
        { key: 'tiltAmount', type: 'range', min: 0, max: 45, default: 15, label: 'Tilt Amount', unit: '°' },
        { key: 'surface', type: 'select', options: [{ v: 'flat', l: 'Flat' }, { v: 'cylinder', l: 'Cylinder' }], default: 'flat', label: 'Surface' },
        { key: 'drift', type: 'range', min: 0, max: 15, default: 0, step: 0.5, label: 'Drift', unit: 'px' },
        { key: 'selectorStroke', type: 'range', min: 0, max: 10, default: 0, step: 0.5, label: 'Selector Stroke' },
        { key: 'backface', type: 'select', options: [{ v: 'double', l: 'Doble cara' }, { v: 'single', l: 'Una cara' }], default: 'double', label: 'Backface' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'organic', 'aggressive', 'robotic', 'overshoot'], default: 'smooth', label: 'Easing' },
        { key: 'cardRatio', type: 'aspect', options: ['1:1', '4:3', '3:4', '16:9'], default: '4:3', label: 'Card Ratio' },
        { key: 'background', type: 'color', default: '#101014', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 3;
        var gap = this.settings.gap / 100 * 2;
        var ratioMap = { '1:1': 1, '4:3': 1.33, '3:4': 0.75, '16:9': 1.78 };
        var ar = ratioMap[this.settings.cardRatio] || 1;
        var w = cardScale * ar;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.5;
        var geo = EP.RoundedPlaneGeometry(w, cardScale, cr);
        var bgeo = EP.RoundedPlaneGeometry(w * 1.06, cardScale * 1.06, cr * 1.06);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { index: i, total: count, cardW: w + gap };

            // Selector stroke border (always built; opacity driven by settings in update)
            var bmat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
            var bmesh = new THREE.Mesh(bgeo, bmat);
            bmesh.position.z = -0.01;
            mesh.add(bmesh);
            mesh.userData.borderMesh = bmesh;

            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var staggerSec = this.settings.stagger || 0;
        var dimAmount = (this.settings.dimAmount || 0) / 100;
        var focusMult = (this.settings.focusScale || 100) / 100;
        var tiltMode = this.settings.tiltMode || 'off';
        var tiltAmt = (this.settings.tiltAmount || 15) * Math.PI / 180;
        var surface = this.settings.surface || 'flat';
        var driftAmt = (this.settings.drift || 0) * 0.003;
        var stroke = (this.settings.selectorStroke || 0) / 10;
        var matSide = this.settings.backface === 'single' ? THREE.FrontSide : THREE.DoubleSide;

        this.group.children.forEach(function(child) {
            var i = child.userData.index;
            var total = child.userData.total;
            var span = child.userData.cardW;
            var totalW = span * total;
            var isFocus, dist;

            if (surface === 'cylinder') {
                var radius = totalW / (2 * Math.PI);
                var cylAngle = (i / total - t) * Math.PI * 2;
                cylAngle = ((cylAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                if (cylAngle > Math.PI) cylAngle -= Math.PI * 2;

                child.position.x = Math.sin(cylAngle) * radius;
                child.position.z = (Math.cos(cylAngle) - 1) * radius;
                child.rotation.y = -cylAngle;
                dist = Math.abs(cylAngle) / Math.PI;
                isFocus = Math.abs(cylAngle) < (Math.PI / total);
            } else {
                var x = (i - t * total) * span;
                x = ((x % totalW) + totalW + totalW / 2) % totalW - totalW / 2;
                child.position.x = x;
                child.position.z = 0;
                child.rotation.y = 0;
                dist = Math.abs(x) / (totalW / 2);
                isFocus = dist < 0.5;
            }

            // Stagger: rolling Y-wave
            if (staggerSec > 0) {
                var phaseOffset = (i / total) * Math.PI * 2 * staggerSec * 2;
                child.position.y = Math.sin(time * Math.PI * 2 / loopDuration + phaseOffset) *
                    Math.min(staggerSec, 1) * 0.5;
            } else {
                child.position.y = 0;
            }

            // Drift: focused card floats sinusoidally
            if (isFocus && driftAmt > 0) {
                child.position.y += Math.sin(time * Math.PI * 2) * driftAmt;
            }

            // Z depth (flat only; cylinder computes its own z via cylindrical coords)
            if (surface !== 'cylinder') {
                child.position.z = isFocus ? 0.3 : -dist * 2;
            }

            // Tilt modes
            var tiltZ = 0;
            if (tiltMode === 'fan') {
                tiltZ = (child.position.x / (totalW / 2)) * tiltAmt * -1;
            } else if (tiltMode === 'alternate') {
                tiltZ = (i % 2 === 0 ? 1 : -1) * tiltAmt * 0.6;
            } else if (tiltMode === 'uniform') {
                tiltZ = tiltAmt * 0.5;
            }
            child.rotation.z = tiltZ;

            // Focus Scale
            child.scale.setScalar(isFocus ? focusMult : Math.max(0.2, 1 - dist * 0.3));

            // Backface culling
            if (child.material.side !== matSide) {
                child.material.side = matSide;
                child.material.needsUpdate = true;
            }

            // Dim Amount
            if (isFocus) {
                child.material.opacity = 1;
            } else {
                child.material.opacity = dimAmount > 0
                    ? Math.max(0.05, 1 - dimAmount)
                    : Math.max(0.1, 1 - dist * 0.4);
            }
            child.material.transparent = true;

            // Selector stroke: white halo behind focused card
            if (child.userData.borderMesh) {
                var targetOpacity = isFocus ? stroke : 0;
                if (child.userData.borderMesh.material.opacity !== targetOpacity) {
                    child.userData.borderMesh.material.opacity = targetOpacity;
                    child.userData.borderMesh.material.needsUpdate = true;
                }
            }
        });
    };

    EP.Registry.register(effect);
})();
