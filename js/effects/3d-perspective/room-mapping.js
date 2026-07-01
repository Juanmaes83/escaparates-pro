(function() {
    var effect = new EP.EffectBase('room-mapping', {
        name: '3D Room Mapping',
        category: '3d-perspective',
        icon: '🏠',
        description: 'Habitacion 3D con imagenes en paredes, suelo y techo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'roomSize', type: 'range', min: 3, max: 10, default: 5, step: 0.5, label: 'Room Size' },
        { key: 'roomHeight', type: 'range', min: 2, max: 6, default: 3, step: 0.5, label: 'Room Height' },
        { key: 'rotSpeed', type: 'range', min: 10, max: 100, default: 40, label: 'Rot Speed', unit: '%' },
        { key: 'ambientLight', type: 'range', min: 10, max: 100, default: 50, label: 'Ambient', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 15, default: 3, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a10', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var s = this.settings.roomSize;
        var h = this.settings.roomHeight;
        var hs = s / 2, hh = h / 2;

        var wallColor = 0x1e1e28;
        var createWall = function(w, wh, pos, rot) {
            var geo = new THREE.PlaneGeometry(w, wh);
            var mat = new THREE.MeshBasicMaterial({ color: wallColor, side: THREE.DoubleSide });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
            return mesh;
        };

        group.add(createWall(s, h, [0, 0, -hs], [0, 0, 0]));
        group.add(createWall(s, h, [0, 0, hs], [0, Math.PI, 0]));
        group.add(createWall(s, h, [-hs, 0, 0], [0, Math.PI/2, 0]));
        group.add(createWall(s, h, [hs, 0, 0], [0, -Math.PI/2, 0]));
        group.add(createWall(s, s, [0, -hh, 0], [Math.PI/2, 0, 0]));
        group.add(createWall(s, s, [0, hh, 0], [-Math.PI/2, 0, 0]));

        var faces = [
            { pos: [0, 0, -hs + 0.02], rot: [0, 0, 0], w: s * 0.7, h: h * 0.6 },
            { pos: [0, 0, hs - 0.02], rot: [0, Math.PI, 0], w: s * 0.7, h: h * 0.6 },
            { pos: [-hs + 0.02, 0, 0], rot: [0, Math.PI/2, 0], w: s * 0.7, h: h * 0.6 },
            { pos: [hs - 0.02, 0, 0], rot: [0, -Math.PI/2, 0], w: s * 0.7, h: h * 0.6 },
            { pos: [0, -hh + 0.02, 0], rot: [-Math.PI/2, 0, 0], w: s * 0.6, h: s * 0.6 },
            { pos: [0, hh - 0.02, 0], rot: [Math.PI/2, 0, 0], w: s * 0.6, h: s * 0.6 }
        ];

        var cr = this.settings.cornerRadius / 100;

        for (var i = 0; i < Math.min(faces.length, mediaList.length); i++) {
            var f = faces[i];
            var artCr = cr * Math.min(f.w, f.h) * 0.3;
            var artGeo = EP.RoundedPlaneGeometry(f.w, f.h, artCr);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.side = THREE.DoubleSide;
            var art = new THREE.Mesh(artGeo, mat);
            art.position.set(f.pos[0], f.pos[1], f.pos[2]);
            art.rotation.set(f.rot[0], f.rot[1], f.rot[2]);
            group.add(art);

            if (i < 4) {
                var frameGeo = EP.RoundedPlaneGeometry(f.w + 0.12, f.h + 0.12, artCr + 0.06);
                var frameMat = new THREE.MeshBasicMaterial({
                    color: 0x444450, side: THREE.DoubleSide
                });
                var frame = new THREE.Mesh(frameGeo, frameMat);
                frame.position.set(f.pos[0], f.pos[1], f.pos[2]);
                frame.rotation.set(f.rot[0], f.rot[1], f.rot[2]);
                if (f.rot[1] === 0 && f.rot[0] === 0) frame.position.z -= 0.005;
                else if (f.rot[1] === Math.PI) frame.position.z += 0.005;
                else if (f.rot[1] === Math.PI/2) frame.position.x -= 0.005;
                else if (f.rot[1] === -Math.PI/2) frame.position.x += 0.005;
                group.add(frame);
            }
        }

        var ambient = this.settings.ambientLight / 100;
        for (var li = 0; li < 4; li++) {
            var lAngle = (li / 4) * Math.PI * 2;
            var lx = Math.cos(lAngle) * s * 0.3;
            var lz = Math.sin(lAngle) * s * 0.3;
            var lightGeo = new THREE.SphereGeometry(0.06, 8, 8);
            var lightMat = new THREE.MeshBasicMaterial({
                color: 0xffffdd, transparent: true, opacity: 0.4 * ambient
            });
            var lightMesh = new THREE.Mesh(lightGeo, lightMat);
            lightMesh.position.set(lx, hh - 0.15, lz);
            lightMesh.userData = { isLight: true };
            group.add(lightMesh);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var speed = this.settings.rotSpeed / 100;

        var angle = t * Math.PI * 2 * speed;
        var camDist = 0.5;
        EP.Core.camera.position.x = Math.sin(angle) * camDist;
        EP.Core.camera.position.y = Math.sin(t * Math.PI * 4 * speed) * 0.3;
        EP.Core.camera.position.z = Math.cos(angle) * camDist;

        var lookX = Math.sin(angle + 0.3) * 2;
        var lookZ = Math.cos(angle + 0.3) * 2;
        EP.Core.camera.lookAt(lookX, 0, lookZ);

        this.group.children.forEach(function(child) {
            if (child.userData.isLight) {
                child.material.opacity = 0.3 + Math.sin(t * Math.PI * 8 + child.position.x * 5) * 0.15;
            }
        });
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
