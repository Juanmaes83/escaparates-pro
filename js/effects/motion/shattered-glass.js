(function() {
    var effect = new EP.EffectBase('shattered-glass', {
        name: 'Shattered Glass',
        category: 'motion',
        icon: '💥',
        description: 'La imagen se rompe en fragmentos triangulares que caen con fisica'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cardSize', type: 'range', min: 40, max: 85, default: 65, label: 'Card Size', unit: '%' },
        { key: 'fragments', type: 'range', min: 8, max: 40, default: 20, step: 1, label: 'Fragments' },
        { key: 'gravity', type: 'range', min: 10, max: 100, default: 60, label: 'Gravity', unit: '%' },
        { key: 'explosionForce', type: 'range', min: 10, max: 100, default: 50, label: 'Explosion', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'bounce'], default: 'snappy', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080810', label: 'Background' }
    ]);

    function seededRandom(s) {
        var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    function generateTriangles(w, h, count) {
        var points = [];
        points.push([-w/2, -h/2], [w/2, -h/2], [w/2, h/2], [-w/2, h/2]);
        for (var i = 0; i < count - 4; i++) {
            points.push([(seededRandom(i * 13.7) - 0.5) * w, (seededRandom(i * 29.3) - 0.5) * h]);
        }

        var tris = [];
        var step = Math.max(1, Math.floor(points.length / count));
        for (var i = 0; i < points.length - 2; i += step) {
            var j = (i + 1) % points.length;
            var k = (i + 2) % points.length;
            tris.push([points[i], points[j], points[k]]);
        }

        for (var i = 0; i < count * 2 && tris.length < count; i++) {
            var a = [
                (seededRandom(i * 7.1 + 100) - 0.5) * w,
                (seededRandom(i * 11.3 + 200) - 0.5) * h
            ];
            var size = w * 0.15;
            var angle1 = seededRandom(i * 5.7) * Math.PI * 2;
            var angle2 = angle1 + 1.2 + seededRandom(i * 3.1) * 1.5;
            var b = [a[0] + Math.cos(angle1) * size, a[1] + Math.sin(angle1) * size];
            var c = [a[0] + Math.cos(angle2) * size, a[1] + Math.sin(angle2) * size];
            tris.push([a, b, c]);
        }

        return tris;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 5;
        var h = cardScale * 0.65;
        var fragCount = this.settings.fragments;

        for (var img = 0; img < mediaList.length; img++) {
            var imgGroup = new THREE.Group();

            var solidGeo = new THREE.PlaneGeometry(cardScale, h);
            var solidMat = EP.Media.createMaterial(mediaList[img]);
            solidMat.transparent = true;
            var solid = new THREE.Mesh(solidGeo, solidMat);
            solid.userData = { isSolid: true };
            imgGroup.add(solid);

            var triangles = generateTriangles(cardScale, h, fragCount);

            triangles.forEach(function(tri, fi) {
                var cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
                var cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;

                var verts = new Float32Array(9);
                var uvs = new Float32Array(6);
                for (var v = 0; v < 3; v++) {
                    verts[v * 3] = tri[v][0] - cx;
                    verts[v * 3 + 1] = tri[v][1] - cy;
                    verts[v * 3 + 2] = 0;
                    uvs[v * 2] = (tri[v][0] + cardScale / 2) / cardScale;
                    uvs[v * 2 + 1] = (tri[v][1] + h / 2) / h;
                }

                var geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
                geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                var mat = EP.Media.createMaterial(mediaList[img]);
                mat.transparent = true;
                mat.side = THREE.DoubleSide;
                var frag = new THREE.Mesh(geo, mat);
                frag.position.set(cx, cy, 0.01);

                frag.userData = {
                    isFragment: true,
                    baseX: cx, baseY: cy,
                    velX: (seededRandom(img * 100 + fi * 7.1) - 0.5) * 4,
                    velY: seededRandom(img * 100 + fi * 11.3) * 3 + 1,
                    velZ: (seededRandom(img * 100 + fi * 3.7) - 0.5) * 3,
                    rotVelX: (seededRandom(img * 100 + fi * 17.1) - 0.5) * 8,
                    rotVelY: (seededRandom(img * 100 + fi * 23.3) - 0.5) * 8,
                    rotVelZ: (seededRandom(img * 100 + fi * 31.7) - 0.5) * 6,
                    delay: seededRandom(img * 100 + fi * 41.1) * 0.3
                };
                frag.visible = false;
                imgGroup.add(frag);
            });

            imgGroup.userData = { imageIndex: img, totalImages: mediaList.length };
            imgGroup.visible = false;
            group.add(imgGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this.group.children.length;
        var segDur = 1 / count;
        var gravity = this.settings.gravity / 100 * 15;
        var explosion = this.settings.explosionForce / 100;

        this.group.children.forEach(function(imgGroup, idx) {
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                imgGroup.visible = true;
                var localT = (t - segStart) / segDur;
                var shatterStart = 0.4;
                var shatterT = localT < shatterStart ? 0 : Math.min(1, (localT - shatterStart) / 0.5);

                imgGroup.children.forEach(function(child) {
                    if (child.userData.isSolid) {
                        child.visible = shatterT < 0.1;
                        child.material.opacity = 1;
                    } else if (child.userData.isFragment) {
                        var d = child.userData;
                        if (shatterT > d.delay) {
                            child.visible = true;
                            var ft = Math.min(1, (shatterT - d.delay) / (1 - d.delay));
                            var ft2 = ft * ft;
                            child.position.x = d.baseX + d.velX * ft * explosion * 2;
                            child.position.y = d.baseY + d.velY * ft * explosion - gravity * ft2;
                            child.position.z = 0.01 + d.velZ * ft * explosion;
                            child.rotation.x = d.rotVelX * ft * explosion;
                            child.rotation.y = d.rotVelY * ft * explosion;
                            child.rotation.z = d.rotVelZ * ft * explosion;
                            child.material.opacity = Math.max(0, 1 - ft * 1.5);
                        } else {
                            child.visible = false;
                        }
                    }
                });
            } else {
                imgGroup.visible = false;
            }
        });
    };

    EP.Registry.register(effect);
})();
