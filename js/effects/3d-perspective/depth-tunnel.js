(function() {
    var effect = new EP.EffectBase('depth-tunnel', {
        name: 'Infinite Depth Tunnel',
        category: '3d-perspective',
        icon: '🕳️',
        description: 'Tunel inmersivo donde las imagenes forman las paredes con profundidad infinita tipo Interstellar'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'tunnelRadius', type: 'range', min: 2, max: 6, default: 3.5, step: 0.5, label: 'Radius' },
        { key: 'tunnelLength', type: 'range', min: 20, max: 80, default: 50, label: 'Length' },
        { key: 'panelCount', type: 'range', min: 4, max: 10, default: 6, step: 1, label: 'Sides' },
        { key: 'flySpeed', type: 'range', min: 10, max: 100, default: 55, label: 'Fly Speed', unit: '%' },
        { key: 'twist', type: 'range', min: 0, max: 100, default: 30, label: 'Twist', unit: '%' },
        { key: 'glow', type: 'range', min: 10, max: 100, default: 40, label: 'Edge Glow', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 3, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#020208', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var radius = this.settings.tunnelRadius;
        var length = this.settings.tunnelLength;
        var sides = this.settings.panelCount;
        var cr = this.settings.cornerRadius / 100;
        var ringSpacing = 3;
        var ringCount = Math.ceil(length / ringSpacing);

        var panelW = 2 * radius * Math.sin(Math.PI / sides) * 0.92;
        var panelH = ringSpacing * 0.9;

        for (var r = 0; r < ringCount; r++) {
            var ringGroup = new THREE.Group();
            ringGroup.position.z = -r * ringSpacing;

            for (var s = 0; s < sides; s++) {
                var angle = (s / sides) * Math.PI * 2;
                var mediaIdx = (r * sides + s) % mediaList.length;

                var artCr = cr * Math.min(panelW, panelH) * 0.3;
                var geo = EP.RoundedPlaneGeometry(panelW, panelH, artCr);
                var mat = EP.Media.createMaterial(mediaList[mediaIdx]);
                mat.transparent = true;
                mat.side = THREE.DoubleSide;
                var mesh = new THREE.Mesh(geo, mat);

                mesh.position.x = Math.cos(angle) * radius;
                mesh.position.y = Math.sin(angle) * radius;

                var lookX = Math.cos(angle) * (radius + 1);
                var lookY = Math.sin(angle) * (radius + 1);
                mesh.lookAt(lookX, lookY, mesh.position.z);
                mesh.rotation.z = 0;

                mesh.userData = { side: s, ring: r, angle: angle };
                ringGroup.add(mesh);
            }

            var edgeCount = sides;
            for (var e = 0; e < edgeCount; e++) {
                var eAngle = (e / edgeCount) * Math.PI * 2 + Math.PI / edgeCount;
                var edgeGeo = new THREE.BoxGeometry(0.04, panelH, 0.04);
                var edgeMat = new THREE.MeshBasicMaterial({
                    color: 0x4488ff, transparent: true, opacity: 0.15,
                    blending: THREE.AdditiveBlending
                });
                var edge = new THREE.Mesh(edgeGeo, edgeMat);
                edge.position.x = Math.cos(eAngle) * radius;
                edge.position.y = Math.sin(eAngle) * radius;
                edge.userData = { isEdge: true };
                ringGroup.add(edge);
            }

            ringGroup.userData = { ringIndex: r, baseZ: -r * ringSpacing };
            group.add(ringGroup);
        }

        var lightCount = 8;
        for (var l = 0; l < lightCount; l++) {
            var lz = -l * (length / lightCount);
            var lightGeo = new THREE.RingGeometry(radius * 0.95, radius * 1.02, sides);
            var lightMat = new THREE.MeshBasicMaterial({
                color: 0x2244aa, transparent: true, opacity: 0.08,
                side: THREE.DoubleSide, blending: THREE.AdditiveBlending
            });
            var lightRing = new THREE.Mesh(lightGeo, lightMat);
            lightRing.position.z = lz;
            lightRing.userData = { isLight: true, baseLZ: lz };
            group.add(lightRing);
        }

        this._ringSpacing = ringSpacing;
        this._ringCount = ringCount;
        this._length = length;
        this._baseFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speed = this.settings.flySpeed / 100;
        var twist = this.settings.twist / 100;
        var glow = this.settings.glow / 100;
        var length = this._length;
        var ringSpacing = this._ringSpacing;

        var camZ = -(t * length * speed) % length;
        EP.Core.camera.position.z = camZ;
        EP.Core.camera.position.x = Math.sin(t * Math.PI * 4) * 0.4;
        EP.Core.camera.position.y = Math.cos(t * Math.PI * 3) * 0.3;

        var lookAhead = camZ - 8;
        EP.Core.camera.lookAt(
            Math.sin(t * Math.PI * 2) * 0.3,
            Math.cos(t * Math.PI * 1.5) * 0.2,
            lookAhead
        );

        EP.Core.camera.fov = 70 + Math.sin(t * Math.PI * 6) * 5;
        EP.Core.camera.updateProjectionMatrix();

        for (var i = 0; i < this.group.children.length; i++) {
            var child = this.group.children[i];

            if (child.userData.isLight) {
                var lz = child.userData.baseLZ;
                var distFromCam = Math.abs(lz - camZ);
                child.material.opacity = Math.max(0, 0.1 - distFromCam / length * 0.1) * glow;
                child.rotation.z = t * Math.PI * 2 * twist;
                continue;
            }

            if (child.userData.ringIndex !== undefined) {
                var ring = child;
                var ringZ = ring.userData.baseZ;

                var wrapZ = ringZ;
                while (wrapZ > camZ + ringSpacing) wrapZ -= this._ringCount * ringSpacing;
                while (wrapZ < camZ - this._ringCount * ringSpacing + ringSpacing) wrapZ += this._ringCount * ringSpacing;
                ring.position.z = wrapZ;

                ring.rotation.z = twist * Math.PI * 0.5 * (ring.userData.ringIndex * 0.1 + t * 2);

                var dist = Math.abs(wrapZ - camZ);
                var fade = Math.max(0, 1 - dist / (this._ringCount * ringSpacing * 0.8));

                ring.children.forEach(function(panel) {
                    if (panel.userData.isEdge) {
                        panel.material.opacity = 0.1 * glow * fade;
                        var pulse = Math.sin(t * Math.PI * 8 + ring.userData.ringIndex) * 0.5 + 0.5;
                        var hue = (t * 0.2 + ring.userData.ringIndex * 0.05) % 1;
                        panel.material.color.setHSL(hue, 0.7, 0.5 + pulse * 0.3);
                    } else {
                        panel.material.opacity = 0.85 * fade;
                    }
                });
            }
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
