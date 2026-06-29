(function() {
    var effect = new EP.EffectBase('jelly-physics', {
        name: 'Jelly Physics',
        category: 'motion',
        icon: '🫠',
        description: 'Tarjetas con fisica de gelatina — squish, bounce y deformacion elastica viral'
    }, [
        { key: 'cardSize', type: 'range', min: 25, max: 60, default: 42, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 3, max: 12, default: 6, step: 1, label: 'Cards' },
        { key: 'squishForce', type: 'range', min: 10, max: 100, default: 70, label: 'Squish Force', unit: '%' },
        { key: 'wobbleSpeed', type: 'range', min: 10, max: 100, default: 60, label: 'Wobble Speed', unit: '%' },
        { key: 'elasticity', type: 'range', min: 10, max: 100, default: 65, label: 'Elasticity', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 30, default: 12, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['elastic', 'bounce', 'smooth'], default: 'elastic', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080812', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.count;
        var cardScale = this.settings.cardSize / 100 * 3.5;
        var h = cardScale * 1.3;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.4;
        var segsX = 20, segsY = 26;

        for (var i = 0; i < count; i++) {
            var geo = new THREE.PlaneGeometry(cardScale, h, segsX, segsY);
            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.transparent = true;
            mat.side = THREE.DoubleSide;
            var mesh = new THREE.Mesh(geo, mat);

            var origPos = new Float32Array(geo.attributes.position.array.length);
            origPos.set(geo.attributes.position.array);

            var shadowGeo = new THREE.PlaneGeometry(cardScale * 0.9, h * 0.12);
            var shadowMat = new THREE.MeshBasicMaterial({
                color: 0x000000, transparent: true, opacity: 0.2, side: THREE.DoubleSide
            });
            var shadow = new THREE.Mesh(shadowGeo, shadowMat);
            shadow.rotation.x = -Math.PI / 2;
            shadow.position.y = -h / 2 - 0.3;
            mesh.add(shadow);

            mesh.userData = {
                index: i,
                origPos: origPos,
                w: cardScale,
                h: h,
                phase: i * 1.3,
                bounceY: 0,
                velY: 0
            };
            group.add(mesh);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var squish = this.settings.squishForce / 100;
        var wobbleSpd = this.settings.wobbleSpeed / 100;
        var elastic = this.settings.elasticity / 100;
        var count = this.group.children.length;

        var cycle = (t * 3) % 3;

        for (var i = 0; i < count; i++) {
            var mesh = this.group.children[i];
            var d = mesh.userData;

            var spacing = 3.2;
            var totalW = (count - 1) * spacing;
            var baseX = -totalW / 2 + i * spacing;

            var cardCycle = (cycle + d.phase) % 3;
            var squishT, stretchT, wobbleT;

            if (cardCycle < 0.5) {
                var dropT = cardCycle / 0.5;
                dropT = dropT * dropT;
                mesh.position.y = 3 * (1 - dropT);
                squishT = 0;
                stretchT = dropT * 0.3;
            } else if (cardCycle < 0.8) {
                var impactT = (cardCycle - 0.5) / 0.3;
                mesh.position.y = 0;
                squishT = Math.sin(impactT * Math.PI) * squish;
                stretchT = 0;
            } else if (cardCycle < 2.0) {
                var wobT = (cardCycle - 0.8) / 1.2;
                mesh.position.y = Math.abs(Math.sin(wobT * Math.PI * 3)) * 1.5 * elastic * Math.exp(-wobT * 3);
                squishT = Math.sin(wobT * Math.PI * 6) * squish * 0.4 * Math.exp(-wobT * 3);
                stretchT = 0;
            } else {
                var riseT = (cardCycle - 2.0) / 1.0;
                riseT = Math.min(1, riseT);
                mesh.position.y = riseT * riseT * 4;
                squishT = 0;
                stretchT = riseT * 0.2;
                mesh.material.opacity = 1 - riseT;
            }

            if (cardCycle < 2.0) mesh.material.opacity = 1;

            mesh.position.x = baseX + Math.sin(t * Math.PI * 4 * wobbleSpd + d.phase) * 0.15;

            var pos = mesh.geometry.attributes.position.array;
            var orig = d.origPos;

            for (var v = 0; v < pos.length; v += 3) {
                var ox = orig[v];
                var oy = orig[v + 1];
                var nx = (ox + d.w / 2) / d.w;
                var ny = (oy + d.h / 2) / d.h;

                var squishX = ox * (1 + squishT * 0.5 * (1 - ny));
                var squishY = oy * (1 - squishT * 0.4) + squishT * d.h * 0.05 * ny;

                var wobble = Math.sin(t * Math.PI * 8 * wobbleSpd + ny * 4 + d.phase) * 0.05 * elastic;
                var jiggle = Math.sin(t * Math.PI * 12 * wobbleSpd + nx * 3 + d.phase * 2) * 0.03 * elastic;

                pos[v] = squishX + wobble * (1 - Math.abs(nx - 0.5) * 2);
                pos[v + 1] = squishY + jiggle * ny;
                pos[v + 2] = Math.sin(nx * Math.PI) * Math.sin(ny * Math.PI) * squishT * 0.15;
            }
            mesh.geometry.attributes.position.needsUpdate = true;

            if (mesh.children[0]) {
                mesh.children[0].scale.x = 1 + squishT * 0.6;
                mesh.children[0].material.opacity = 0.2 * (1 - mesh.position.y / 4);
            }
        }
    };

    EP.Registry.register(effect);
})();
