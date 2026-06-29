(function() {
    var effect = new EP.EffectBase('fibonacci-sphere', {
        name: 'Fibonacci Sphere',
        category: '3d-perspective',
        icon: '🌐',
        description: 'Esfera 3D con imagenes distribuidas en espiral Fibonacci — rotacion orbital inmersiva'
    }, [
        { key: 'cardSize', type: 'range', min: 20, max: 60, default: 35, label: 'Card Size', unit: '%' },
        { key: 'radius', type: 'range', min: 2, max: 8, default: 4.5, step: 0.5, label: 'Radius' },
        { key: 'cardCount', type: 'range', min: 8, max: 30, default: 18, step: 1, label: 'Cards' },
        { key: 'rotSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Rotation', unit: '%' },
        { key: 'tilt', type: 'range', min: 0, max: 100, default: 35, label: 'Tilt', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 5, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050510', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cardScale = this.settings.cardSize / 100 * 2;
        var radius = this.settings.radius;
        var cardCount = this.settings.cardCount;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.4;

        var sphereGroup = new THREE.Group();
        var goldenAngle = Math.PI * (1 + Math.sqrt(5));

        for (var i = 0; i < cardCount; i++) {
            var mediaIdx = i % mediaList.length;
            var w = cardScale;
            var h = cardScale * 0.7;
            var geo = EP.RoundedPlaneGeometry(w, h, cr);
            var mat = EP.Media.createMaterial(mediaList[mediaIdx]);
            mat.transparent = true;
            mat.side = THREE.DoubleSide;
            var mesh = new THREE.Mesh(geo, mat);

            var phi = Math.acos(1 - (2 * (i + 0.5)) / cardCount);
            var theta = goldenAngle * i;

            var x = radius * Math.cos(theta) * Math.sin(phi);
            var y = radius * Math.sin(theta) * Math.sin(phi);
            var z = radius * Math.cos(phi);

            mesh.position.set(x, y, z);
            mesh.lookAt(0, 0, 0);
            mesh.rotation.z = 0;

            var borderGeo = EP.RoundedPlaneGeometry(w + 0.06, h + 0.06, cr + 0.03);
            var borderMat = new THREE.MeshBasicMaterial({
                color: 0x222233, side: THREE.DoubleSide,
                transparent: true, opacity: 0.5
            });
            var border = new THREE.Mesh(borderGeo, borderMat);
            border.position.z = -0.02;
            mesh.add(border);

            mesh.userData = {
                index: i,
                phi: phi,
                theta: theta,
                baseX: x, baseY: y, baseZ: z
            };
            sphereGroup.add(mesh);
        }

        var particleCount = 40;
        for (var p = 0; p < particleCount; p++) {
            var pPhi = Math.acos(1 - 2 * Math.random());
            var pTheta = Math.random() * Math.PI * 2;
            var pR = radius * (0.9 + Math.random() * 0.3);
            var pGeo = new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 4, 4);
            var pMat = new THREE.MeshBasicMaterial({
                color: 0x6688cc, transparent: true,
                opacity: 0.1 + Math.random() * 0.15
            });
            var particle = new THREE.Mesh(pGeo, pMat);
            particle.position.set(
                pR * Math.cos(pTheta) * Math.sin(pPhi),
                pR * Math.sin(pTheta) * Math.sin(pPhi),
                pR * Math.cos(pPhi)
            );
            particle.userData = { isParticle: true, speed: 0.3 + Math.random() * 0.7 };
            sphereGroup.add(particle);
        }

        sphereGroup.userData = { isSphere: true };
        group.add(sphereGroup);

        this._baseFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var rotSpeed = this.settings.rotSpeed / 100;
        var tilt = this.settings.tilt / 100;
        var radius = this.settings.radius;

        var sphereGroup = this.group.children[0];
        if (!sphereGroup) return;

        sphereGroup.rotation.y = t * Math.PI * 4 * rotSpeed;
        sphereGroup.rotation.x = Math.sin(t * Math.PI * 2) * tilt * 0.5;

        var camDist = radius * 2.8;
        var camAngle = t * Math.PI * 2 * rotSpeed * 0.3;
        EP.Core.camera.position.x = Math.sin(camAngle) * camDist * 0.2;
        EP.Core.camera.position.y = Math.sin(t * Math.PI * 3) * camDist * 0.1;
        EP.Core.camera.position.z = camDist;
        EP.Core.camera.lookAt(0, 0, 0);

        for (var i = 0; i < sphereGroup.children.length; i++) {
            var child = sphereGroup.children[i];

            if (child.userData.isParticle) {
                child.material.opacity = 0.08 + Math.sin(t * Math.PI * 6 + i * 0.5) * 0.08;
                continue;
            }

            var worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);
            var distToCam = worldPos.distanceTo(EP.Core.camera.position);
            var maxDist = camDist + radius;
            var closeness = 1 - Math.min(distToCam / maxDist, 1);

            child.material.opacity = 0.4 + closeness * 0.6;

            var pulse = Math.sin(t * Math.PI * 4 + child.userData.index * 0.3) * 0.03;
            var s = 1 + closeness * 0.15 + pulse;
            child.scale.setScalar(s);
        }
    };

    effect.dispose = function() {
        if (this._baseFov) {
            EP.Core.camera.fov = this._baseFov;
            EP.Core.camera.updateProjectionMatrix();
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
