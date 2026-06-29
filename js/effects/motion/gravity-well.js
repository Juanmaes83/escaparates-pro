(function() {
    var effect = new EP.EffectBase('gravity-well', {
        name: 'Gravity Well',
        category: 'motion',
        icon: '🌀',
        description: 'Imagenes orbitando un punto gravitatorio con colapso y explosion'
    }, [
        { key: 'cardSize', type: 'range', min: 15, max: 45, default: 28, label: 'Card Size', unit: '%' },
        { key: 'orbitRadius', type: 'range', min: 2, max: 8, default: 4.5, step: 0.5, label: 'Orbit Radius' },
        { key: 'gravityPull', type: 'range', min: 10, max: 100, default: 60, label: 'Gravity', unit: '%' },
        { key: 'orbitSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Orbit Speed', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 8, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'elastic'], default: 'elastic', label: 'Easing' },
        { key: 'background', type: 'color', default: '#060610', label: 'Background' }
    ]);

    function seededRandom(s) {
        var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = mediaList.length;
        var cardScale = this.settings.cardSize / 100 * 3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.4;
        var radius = this.settings.orbitRadius;
        var geo = EP.RoundedPlaneGeometry(cardScale, cardScale * 1.2, cr);

        var coreGeo = new THREE.SphereGeometry(0.15, 16, 16);
        var coreMat = new THREE.MeshBasicMaterial({
            color: 0x8844ff, transparent: true, opacity: 0.6
        });
        var core = new THREE.Mesh(coreGeo, coreMat);
        core.userData = { isCore: true };
        group.add(core);

        var ringGeo = new THREE.RingGeometry(0.4, 0.45, 32);
        var ringMat = new THREE.MeshBasicMaterial({
            color: 0x6633cc, transparent: true, opacity: 0.2, side: THREE.DoubleSide
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.userData = { isRing: true };
        group.add(ring);

        for (var i = 0; i < count; i++) {
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);

            var angle = (i / count) * Math.PI * 2;
            var inclination = (seededRandom(i * 7.3) - 0.5) * 0.8;
            var orbitR = radius * (0.7 + seededRandom(i * 13.1) * 0.6);

            mesh.userData = {
                index: i,
                angle: angle,
                inclination: inclination,
                orbitR: orbitR,
                baseOrbitR: orbitR,
                seed: i * 17.3,
                velX: (seededRandom(i * 31.7) - 0.5) * 8,
                velY: (seededRandom(i * 41.1) - 0.5) * 6 + 3,
                velZ: (seededRandom(i * 53.3) - 0.5) * 8,
                rotVelX: (seededRandom(i * 61.7) - 0.5) * 10,
                rotVelY: (seededRandom(i * 71.1) - 0.5) * 10
            };
            group.add(mesh);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var gravity = this.settings.gravityPull / 100;
        var speed = this.settings.orbitSpeed / 100;

        var orbitPhase = t * 3 % 3;
        var phase;
        if (orbitPhase < 1.5) phase = 'orbit';
        else if (orbitPhase < 2.0) phase = 'collapse';
        else if (orbitPhase < 2.5) phase = 'explode';
        else phase = 'reform';

        var core = this.group.children[0];
        var ring = this.group.children[1];

        if (phase === 'collapse') {
            var ct = (orbitPhase - 1.5) / 0.5;
            core.material.opacity = 0.6 + ct * 0.4;
            core.scale.setScalar(1 + ct * 2);
            ring.material.opacity = 0.2 + ct * 0.3;
            ring.scale.setScalar(1 + ct * 3);
        } else if (phase === 'explode') {
            var et = (orbitPhase - 2.0) / 0.5;
            core.material.opacity = Math.max(0, 1 - et * 3);
            core.scale.setScalar(3 - et * 2);
            ring.material.opacity = Math.max(0, 0.5 - et);
            ring.scale.setScalar(4 - et * 3);
        } else {
            core.material.opacity = 0.6;
            core.scale.setScalar(1);
            ring.material.opacity = 0.2;
            ring.scale.setScalar(1);
        }
        core.material.color.setHSL((t * 0.3) % 1, 0.7, 0.5);
        ring.material.color.setHSL((t * 0.3 + 0.1) % 1, 0.6, 0.4);
        ring.rotation.z = t * Math.PI * 4;

        for (var i = 2; i < this.group.children.length; i++) {
            var child = this.group.children[i];
            var d = child.userData;

            if (phase === 'orbit') {
                var ot = orbitPhase / 1.5;
                var a = d.angle + t * Math.PI * 4 * speed;
                var r = d.baseOrbitR * (1 - ot * gravity * 0.5);
                child.position.x = Math.cos(a) * r;
                child.position.z = Math.sin(a) * r;
                child.position.y = Math.sin(a * 2 + d.inclination * 5) * r * 0.3 * d.inclination;
                child.rotation.y = -a;
                child.material.opacity = 0.9;
                child.scale.setScalar(1);
            } else if (phase === 'collapse') {
                var ct = (orbitPhase - 1.5) / 0.5;
                var pullT = ct * ct * gravity;
                var a = d.angle + t * Math.PI * 4 * speed * (1 + ct * 3);
                var r = d.baseOrbitR * (1 - pullT);
                r = Math.max(0.1, r);
                child.position.x = Math.cos(a) * r;
                child.position.z = Math.sin(a) * r;
                child.position.y = Math.sin(a * 2) * r * 0.2;
                child.rotation.y = -a + ct * Math.PI;
                child.scale.setScalar(1 - ct * 0.5);
                child.material.opacity = 0.9;
            } else if (phase === 'explode') {
                var et = (orbitPhase - 2.0) / 0.5;
                var et2 = et * et;
                child.position.x = d.velX * et * 1.5;
                child.position.y = d.velY * et - 8 * et2;
                child.position.z = d.velZ * et * 1.5;
                child.rotation.x = d.rotVelX * et;
                child.rotation.y = d.rotVelY * et;
                child.scale.setScalar(0.5 + et * 0.5);
                child.material.opacity = Math.max(0, 1 - et * 1.5);
            } else {
                var rt = (orbitPhase - 2.5) / 0.5;
                var smoothRT = rt * rt * (3 - 2 * rt);
                var targetA = d.angle + t * Math.PI * 4 * speed;
                var targetR = d.baseOrbitR;
                var tx = Math.cos(targetA) * targetR;
                var tz = Math.sin(targetA) * targetR;
                var ty = Math.sin(targetA * 2 + d.inclination * 5) * targetR * 0.3 * d.inclination;
                var fromX = d.velX * 1.5;
                var fromY = d.velY - 8;
                var fromZ = d.velZ * 1.5;
                child.position.x = fromX + (tx - fromX) * smoothRT;
                child.position.y = fromY + (ty - fromY) * smoothRT;
                child.position.z = fromZ + (tz - fromZ) * smoothRT;
                child.rotation.x *= (1 - smoothRT);
                child.rotation.y = -targetA * smoothRT + d.rotVelY * (1 - smoothRT);
                child.scale.setScalar(0.5 + smoothRT * 0.5);
                child.material.opacity = smoothRT * 0.9;
            }
        }
    };

    EP.Registry.register(effect);
})();
