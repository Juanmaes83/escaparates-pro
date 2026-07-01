(function() {
    var effect = new EP.EffectBase('photo-cube-v2', {
        name: 'Photo Cube V2',
        category: '3d-perspective',
        icon: '📦',
        description: 'Cubo 3D mejorado con 6 caras de imagenes — rotacion dinamica multi-eje con HUD informativo y transiciones'
    }, [
        { key: 'cubeSize', type: 'range', min: 30, max: 100, default: 65, label: 'Cube Size', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 30, label: 'Rotation Speed', unit: '%' },
        { key: 'autoSwitch', type: 'range', min: 10, max: 100, default: 50, label: 'Face Switch Rate', unit: '%' },
        { key: 'edgeGlow', type: 'range', min: 0, max: 100, default: 60, label: 'Edge Glow', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080818', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var S = 2.5 + 4 * this.settings.cubeSize / 100;
        var edgeOp = this.settings.edgeGlow / 100;

        var cubeGroup = new THREE.Group();
        cubeGroup.userData = { isCube: true };

        var faces = [
            { pos: [0, 0, S / 2], rot: [0, 0, 0] },
            { pos: [0, 0, -S / 2], rot: [0, Math.PI, 0] },
            { pos: [S / 2, 0, 0], rot: [0, Math.PI / 2, 0] },
            { pos: [-S / 2, 0, 0], rot: [0, -Math.PI / 2, 0] },
            { pos: [0, S / 2, 0], rot: [-Math.PI / 2, 0, 0] },
            { pos: [0, -S / 2, 0], rot: [Math.PI / 2, 0, 0] }
        ];

        for (var f = 0; f < faces.length; f++) {
            var mi = f % mediaList.length;
            var tex = null;
            if (mediaList[mi].element) {
                tex = EP.Media.createTexture(mediaList[mi]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var faceS = S * 0.98;
            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(faceS, faceS, 0.05) : new THREE.PlaneGeometry(faceS, faceS);
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(faces[f].pos[0], faces[f].pos[1], faces[f].pos[2]);
            mesh.rotation.set(faces[f].rot[0], faces[f].rot[1], faces[f].rot[2]);
            mesh.userData = { isCard: true, faceIndex: f };
            cubeGroup.add(mesh);
        }

        if (edgeOp > 0.01) {
            var boxGeo = new THREE.BoxGeometry(S, S, S);
            var edgesGeo = new THREE.EdgesGeometry(boxGeo);
            var edgeMat = new THREE.LineBasicMaterial({ color: 0x44aaff, transparent: true, opacity: edgeOp * 0.7 });
            cubeGroup.add(new THREE.LineSegments(edgesGeo, edgeMat));

            var glowMat = new THREE.LineBasicMaterial({ color: 0x2266cc, transparent: true, opacity: edgeOp * 0.3, linewidth: 2 });
            var glowEdges = new THREE.LineSegments(edgesGeo.clone(), glowMat);
            glowEdges.scale.multiplyScalar(1.01);
            cubeGroup.add(glowEdges);
        }

        group.add(cubeGroup);

        var light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(5, 5, 8);
        group.add(light1);
        var ambient = new THREE.AmbientLight(0x334466, 0.4);
        group.add(ambient);

        this._S = S;
        this._targetRotX = 0;
        this._targetRotY = 0;
        this._lastSwitch = 0;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.speed / 100;
        var switchRate = 2 + 8 * (1 - this.settings.autoSwitch / 100);

        for (var i = 0; i < this.group.children.length; i++) {
            var child = this.group.children[i];
            if (!child.userData.isCube) continue;

            if (time - this._lastSwitch > switchRate) {
                this._lastSwitch = time;
                var faceAngles = [
                    { x: 0, y: 0 }, { x: 0, y: Math.PI },
                    { x: 0, y: Math.PI / 2 }, { x: 0, y: -Math.PI / 2 },
                    { x: -Math.PI / 2, y: 0 }, { x: Math.PI / 2, y: 0 }
                ];
                var pick = Math.floor(Math.random() * faceAngles.length);
                this._targetRotX = faceAngles[pick].x + Math.floor(child.rotation.x / (Math.PI * 2)) * Math.PI * 2;
                this._targetRotY = faceAngles[pick].y + Math.floor(child.rotation.y / (Math.PI * 2)) * Math.PI * 2;
            }

            var continuous = time * speed * 0.08;
            child.rotation.x += (this._targetRotX + continuous - child.rotation.x) * dt * 1.5;
            child.rotation.y += (this._targetRotY + continuous * 1.3 - child.rotation.y) * dt * 1.5;

            var bob = Math.sin(time * 0.4) * 0.2;
            child.position.y = bob;

            for (var j = 0; j < child.children.length; j++) {
                var card = child.children[j];
                if (card.userData.isCard && card.material && card.material.map) {
                    card.material.map.needsUpdate = true;
                }
            }
        }

        var camDist = this._S + 6;
        EP.Core.camera.position.set(
            Math.sin(time * 0.1) * 1,
            Math.cos(time * 0.08) * 0.6,
            camDist
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
