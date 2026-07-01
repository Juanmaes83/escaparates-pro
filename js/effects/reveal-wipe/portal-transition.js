(function() {
    var effect = new EP.EffectBase('portal-transition', {
        name: 'Portal Transition',
        category: 'reveal-wipe',
        icon: '🌀',
        description: 'Portal circular que succiona la camara hacia la siguiente imagen tipo Doctor Strange'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 40, max: 90, default: 70, label: 'Card Size', unit: '%' },
        { key: 'portalRings', type: 'range', min: 3, max: 10, default: 5, step: 1, label: 'Rings' },
        { key: 'portalSpeed', type: 'range', min: 10, max: 100, default: 60, label: 'Speed', unit: '%' },
        { key: 'distortion', type: 'range', min: 10, max: 100, default: 50, label: 'Distortion', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 4, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'elastic'], default: 'snappy', label: 'Easing' },
        { key: 'background', type: 'color', default: '#030308', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 5;
        var h = cardScale * 0.65;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.3;
        var rings = this.settings.portalRings;

        for (var img = 0; img < mediaList.length; img++) {
            var scene = new THREE.Group();

            var artGeo = EP.RoundedPlaneGeometry(cardScale, h, cr);
            var artMat = EP.Media.createMaterial(mediaList[img]);
            artMat.transparent = true;
            var art = new THREE.Mesh(artGeo, artMat);
            art.position.z = -8;
            art.userData = { isArt: true };
            scene.add(art);

            var portalGroup = new THREE.Group();
            for (var r = 0; r < rings; r++) {
                var innerR = 0.3 + r * 0.5;
                var outerR = innerR + 0.08;
                var ringGeo = new THREE.RingGeometry(innerR, outerR, 48);
                var ringMat = new THREE.MeshBasicMaterial({
                    color: 0xff6600, transparent: true, opacity: 0.4,
                    side: THREE.DoubleSide, blending: THREE.AdditiveBlending
                });
                var ring = new THREE.Mesh(ringGeo, ringMat);
                ring.userData = { isRing: true, ringIndex: r, baseInner: innerR };
                portalGroup.add(ring);
            }

            var sparkCount = 30;
            for (var s = 0; s < sparkCount; s++) {
                var angle = (s / sparkCount) * Math.PI * 2;
                var sparkR = 0.5 + Math.random() * 2;
                var sparkGeo = new THREE.SphereGeometry(0.03, 4, 4);
                var sparkMat = new THREE.MeshBasicMaterial({
                    color: 0xff8833, transparent: true, opacity: 0.5,
                    blending: THREE.AdditiveBlending
                });
                var spark = new THREE.Mesh(sparkGeo, sparkMat);
                spark.position.set(Math.cos(angle) * sparkR, Math.sin(angle) * sparkR, 0);
                spark.userData = {
                    isSpark: true, angle: angle, baseR: sparkR,
                    speed: 0.5 + Math.random() * 1.5
                };
                portalGroup.add(spark);
            }

            var coreGeo = new THREE.CircleGeometry(0.25, 32);
            var coreMat = new THREE.MeshBasicMaterial({
                color: 0xffffff, transparent: true, opacity: 0.3,
                blending: THREE.AdditiveBlending
            });
            var core = new THREE.Mesh(coreGeo, coreMat);
            core.userData = { isCore: true };
            portalGroup.add(core);

            portalGroup.userData = { isPortal: true };
            scene.add(portalGroup);

            scene.userData = { imageIndex: img };
            scene.visible = false;
            group.add(scene);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var segDur = 1 / count;
        var speed = this.settings.portalSpeed / 100;
        var distortion = this.settings.distortion / 100;

        for (var idx = 0; idx < count; idx++) {
            var scene = this.group.children[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                scene.visible = true;
                var lt = (t - segStart) / segDur;

                var portalOpen = lt < 0.3 ? lt / 0.3 : 1;
                var flyThrough = lt > 0.3 && lt < 0.8 ? (lt - 0.3) / 0.5 : (lt >= 0.8 ? 1 : 0);
                var portalClose = lt > 0.8 ? (lt - 0.8) / 0.2 : 0;

                portalOpen = portalOpen * portalOpen * (3 - 2 * portalOpen);
                flyThrough = flyThrough * flyThrough * (3 - 2 * flyThrough);

                scene.children.forEach(function(child) {
                    if (child.userData.isArt) {
                        var artZ = -8 + flyThrough * 8.5;
                        child.position.z = artZ;
                        child.material.opacity = flyThrough;
                        var artScale = 0.3 + flyThrough * 0.7;
                        child.scale.setScalar(artScale);
                        child.rotation.z = (1 - flyThrough) * distortion * 0.5;
                    }
                    if (child.userData.isPortal) {
                        var portalScale = portalOpen * (1 - portalClose);
                        child.scale.setScalar(Math.max(0.01, portalScale));
                        child.rotation.z = t * Math.PI * 6 * speed;

                        child.children.forEach(function(part) {
                            if (part.userData.isRing) {
                                var ri = part.userData.ringIndex;
                                var pulse = Math.sin(t * Math.PI * 8 * speed + ri * 1.2) * 0.5 + 0.5;
                                var hue = (t * speed + ri * 0.15) % 1;
                                part.material.color.setHSL(hue, 0.9, 0.55);
                                part.material.opacity = (0.2 + pulse * 0.4) * portalScale;
                                part.scale.setScalar(1 + pulse * 0.15 * distortion);
                                part.rotation.z = -t * Math.PI * 4 * speed * (1 + ri * 0.3);
                            }
                            if (part.userData.isSpark) {
                                var sd = part.userData;
                                var sparkAngle = sd.angle + t * Math.PI * 4 * sd.speed * speed;
                                var sparkR = sd.baseR * (0.8 + Math.sin(t * Math.PI * 6 + sd.angle) * 0.3);
                                part.position.x = Math.cos(sparkAngle) * sparkR;
                                part.position.y = Math.sin(sparkAngle) * sparkR;
                                part.material.opacity = (0.3 + Math.sin(t * Math.PI * 10 + sd.angle) * 0.3) * portalScale;
                                var hue = (t * speed * 0.5 + sd.angle / (Math.PI * 2)) % 1;
                                part.material.color.setHSL(hue, 0.9, 0.6);
                            }
                            if (part.userData.isCore) {
                                part.material.opacity = (0.2 + Math.sin(t * Math.PI * 12 * speed) * 0.2) * portalScale;
                                part.scale.setScalar(1 + Math.sin(t * Math.PI * 8 * speed) * 0.3);
                            }
                        });
                    }
                });
            } else {
                scene.visible = false;
            }
        }
    };

    EP.Registry.register(effect);
})();
