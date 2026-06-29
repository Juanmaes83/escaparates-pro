(function() {
    var effect = new EP.EffectBase('spatial-gallery', {
        name: '3D Spatial Gallery',
        category: '3d-perspective',
        icon: '🪟',
        description: 'Galeria espacial tipo Samsung Spatial — imagenes flotando con parallax 3D real'
    }, [
        { key: 'cardSize', type: 'range', min: 20, max: 50, default: 32, label: 'Card Size', unit: '%' },
        { key: 'count', type: 'range', min: 5, max: 15, default: 9, step: 1, label: 'Cards' },
        { key: 'depthSpread', type: 'range', min: 2, max: 12, default: 6, step: 0.5, label: 'Depth' },
        { key: 'parallaxForce', type: 'range', min: 10, max: 100, default: 60, label: 'Parallax', unit: '%' },
        { key: 'floatAmount', type: 'range', min: 10, max: 100, default: 40, label: 'Float', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 6, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#060610', label: 'Background' }
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
        var depthSpread = this.settings.depthSpread;
        var cr = this.settings.cornerRadius / 100 * cardScale * 0.4;

        for (var i = 0; i < count; i++) {
            var aspect = 0.8 + seededRandom(i * 5.3) * 0.8;
            var w = cardScale * (0.7 + seededRandom(i * 3.1) * 0.6);
            var h = w * aspect;
            var geo = EP.RoundedPlaneGeometry(w, h, cr);
            var mat = EP.Media.createMaterial(mediaList[i % mediaList.length]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);

            var shadowGeo = new THREE.PlaneGeometry(w * 1.05, h * 1.05);
            var shadowMat = new THREE.MeshBasicMaterial({
                color: 0x000000, transparent: true, opacity: 0.15,
                side: THREE.DoubleSide
            });
            var shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
            shadowMesh.position.z = -0.05;
            shadowMesh.position.x = 0.08;
            shadowMesh.position.y = -0.08;
            mesh.add(shadowMesh);

            var borderGeo = EP.RoundedPlaneGeometry(w + 0.08, h + 0.08, cr + 0.04);
            var borderMat = new THREE.MeshBasicMaterial({
                color: 0x222233, side: THREE.DoubleSide, transparent: true, opacity: 0.6
            });
            var border = new THREE.Mesh(borderGeo, borderMat);
            border.position.z = -0.02;
            mesh.add(border);

            var px = (seededRandom(i * 7.7) - 0.5) * 8;
            var py = (seededRandom(i * 11.3) - 0.5) * 4;
            var pz = (seededRandom(i * 13.7) - 0.5) * depthSpread;

            mesh.position.set(px, py, pz);
            mesh.userData = {
                index: i,
                baseX: px, baseY: py, baseZ: pz,
                floatPhase: seededRandom(i * 17.1) * Math.PI * 2,
                floatAmpX: 0.1 + seededRandom(i * 23.3) * 0.2,
                floatAmpY: 0.15 + seededRandom(i * 29.7) * 0.25,
                depthLayer: pz / depthSpread
            };
            group.add(mesh);
        }

        var ambientCount = 20;
        for (var p = 0; p < ambientCount; p++) {
            var pGeo = new THREE.SphereGeometry(0.02 + seededRandom(p * 47.1) * 0.03, 4, 4);
            var pMat = new THREE.MeshBasicMaterial({
                color: 0x4466aa, transparent: true, opacity: 0.15 + seededRandom(p * 53.3) * 0.15
            });
            var particle = new THREE.Mesh(pGeo, pMat);
            particle.position.set(
                (seededRandom(p * 61.7) - 0.5) * 12,
                (seededRandom(p * 67.1) - 0.5) * 8,
                (seededRandom(p * 71.3) - 0.5) * depthSpread
            );
            particle.userData = {
                isParticle: true,
                speed: 0.5 + seededRandom(p * 79.7) * 1
            };
            group.add(particle);
        }

        this._baseFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var parallax = this.settings.parallaxForce / 100;
        var floatAmt = this.settings.floatAmount / 100;

        var camAngle = t * Math.PI * 2;
        var camRadius = 1.5 * parallax;
        EP.Core.camera.position.x = Math.sin(camAngle) * camRadius;
        EP.Core.camera.position.y = Math.sin(camAngle * 0.7) * camRadius * 0.5;
        EP.Core.camera.position.z = 10 + Math.cos(camAngle * 0.5) * camRadius * 0.5;
        EP.Core.camera.lookAt(0, 0, 0);

        for (var i = 0; i < this.group.children.length; i++) {
            var child = this.group.children[i];

            if (child.userData.isParticle) {
                child.position.y += dt * child.userData.speed * 0.3;
                if (child.position.y > 5) child.position.y = -5;
                child.material.opacity = 0.1 + Math.sin(t * Math.PI * 4 + i) * 0.1;
                continue;
            }

            var d = child.userData;
            var floatTime = t * Math.PI * 2;

            child.position.x = d.baseX + Math.sin(floatTime + d.floatPhase) * d.floatAmpX * floatAmt;
            child.position.y = d.baseY + Math.cos(floatTime * 1.3 + d.floatPhase) * d.floatAmpY * floatAmt;

            var depthParallax = d.depthLayer * parallax;
            child.position.x += Math.sin(camAngle) * depthParallax * 0.5;
            child.position.y += Math.sin(camAngle * 0.7) * depthParallax * 0.3;

            child.rotation.y = Math.sin(floatTime * 0.5 + d.floatPhase) * 0.08;
            child.rotation.x = Math.cos(floatTime * 0.3 + d.floatPhase) * 0.05;

            var distFromCenter = Math.sqrt(d.baseX * d.baseX + d.baseY * d.baseY);
            child.material.opacity = 0.7 + (1 - distFromCenter / 6) * 0.3;
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
