(function() {
    var effect = new EP.EffectBase('gravity-fall', {
        name: 'Gravity Fall Cards',
        category: 'motion',
        icon: '🪨',
        description: 'Tarjetas que caen con fisica real, rebote, rotacion y apilamiento'
    }, [
        { key: 'cardSize', type: 'range', min: 20, max: 50, default: 32, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 4, max: 15, default: 8, step: 1, label: 'Cards' },
        { key: 'gravity', type: 'range', min: 10, max: 100, default: 60, label: 'Gravity', unit: '%' },
        { key: 'bounce', type: 'range', min: 10, max: 100, default: 50, label: 'Bounce', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 6, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'bounce', 'snappy'], default: 'bounce', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080810', label: 'Background' }
    ]);

    function seededRandom(s) {
        var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.count;
        var cardScale = this.settings.cardSize / 100 * 3;
        var h = cardScale * 1.3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.4;

        var floorGeo = new THREE.PlaneGeometry(14, 14);
        var floorMat = new THREE.MeshBasicMaterial({
            color: 0x12121a, transparent: true, opacity: 0.5, side: THREE.DoubleSide
        });
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -3;
        floor.userData = { isFloor: true };
        group.add(floor);

        for (var i = 0; i < count; i++) {
            var geo = EP.RoundedPlaneGeometry(cardScale, h, cr);
            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.transparent = true;
            mat.side = THREE.DoubleSide;
            var mesh = new THREE.Mesh(geo, mat);

            var shadowGeo = new THREE.PlaneGeometry(cardScale * 1.1, h * 0.15);
            var shadowMat = new THREE.MeshBasicMaterial({
                color: 0x000000, transparent: true, opacity: 0, side: THREE.DoubleSide
            });
            var shadow = new THREE.Mesh(shadowGeo, shadowMat);
            shadow.rotation.x = -Math.PI / 2;
            shadow.position.y = -2.99;
            shadow.userData = { isShadow: true };
            mesh.add(shadow);

            mesh.userData = {
                index: i,
                startX: (seededRandom(i * 7.3) - 0.5) * 8,
                startY: 5 + seededRandom(i * 13.1) * 4,
                startRotZ: (seededRandom(i * 17.7) - 0.5) * 1.5,
                startRotX: (seededRandom(i * 23.3) - 0.5) * 0.8,
                delay: i * 0.08 + seededRandom(i * 31.1) * 0.05,
                landX: (seededRandom(i * 41.7) - 0.5) * 5,
                landZ: (seededRandom(i * 51.3) - 0.5) * 2 - 1,
                landRotZ: (seededRandom(i * 61.7) - 0.5) * 0.6,
                bounceRand: 0.7 + seededRandom(i * 71.1) * 0.6
            };
            group.add(mesh);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var grav = this.settings.gravity / 100;
        var bounceF = this.settings.bounce / 100;
        var floorY = -3;

        var phase = (t * 2) % 2;
        var falling = phase < 1.3;

        for (var i = 1; i < this.group.children.length; i++) {
            var child = this.group.children[i];
            var d = child.userData;

            if (falling) {
                var ft = Math.max(0, (phase - d.delay) / (1.3 - d.delay));
                ft = Math.min(1, ft);

                var fallDur = 0.4 / grav;
                var fallT = Math.min(1, ft / fallDur);
                var rawY = d.startY - grav * 25 * fallT * fallT;
                var landY = floorY + (child.geometry ? 0.01 : 0) + d.index * 0.02;

                if (rawY <= landY) {
                    var overT = Math.max(0, ft - fallDur) / (1 - fallDur);
                    var bounceAmp = 1.5 * bounceF * d.bounceRand;
                    var b1 = Math.abs(Math.sin(overT * Math.PI * 3)) * bounceAmp * Math.exp(-overT * 4);
                    child.position.y = landY + b1;

                    child.position.x = d.startX + (d.landX - d.startX) * Math.min(1, ft * 1.5);
                    child.position.z = d.landZ;

                    var targetRotZ = d.landRotZ;
                    child.rotation.z = d.startRotZ + (targetRotZ - d.startRotZ) * Math.min(1, overT * 2);
                    child.rotation.x = d.startRotX * (1 - Math.min(1, overT * 3));
                    child.rotation.y = 0;

                    if (child.children[0] && child.children[0].userData.isShadow) {
                        child.children[0].material.opacity = 0.25 * (1 - b1 / bounceAmp);
                        child.children[0].position.y = landY - child.position.y - 0.01;
                    }
                } else {
                    child.position.y = rawY;
                    child.position.x = d.startX + (d.landX - d.startX) * ft * 0.5;
                    child.position.z = d.landZ * ft;
                    child.rotation.z = d.startRotZ + ft * 2;
                    child.rotation.x = d.startRotX;
                    if (child.children[0] && child.children[0].userData.isShadow) {
                        child.children[0].material.opacity = 0;
                    }
                }

                child.material.opacity = Math.min(1, ft * 5);
            } else {
                var riseT = (phase - 1.3) / 0.7;
                riseT = Math.min(1, Math.max(0, riseT));
                var smoothRise = riseT * riseT;
                child.position.y = (floorY + d.index * 0.02) + smoothRise * (d.startY - floorY);
                child.material.opacity = 1 - smoothRise;
                child.rotation.z = d.landRotZ + smoothRise * d.startRotZ;
                if (child.children[0] && child.children[0].userData.isShadow) {
                    child.children[0].material.opacity = 0.25 * (1 - smoothRise);
                }
            }
        }
    };

    EP.Registry.register(effect);
})();
