(function() {
    var effect = new EP.EffectBase('stained-glass', {
        name: 'Stained Glass',
        category: '3d-perspective',
        icon: '🪟',
        description: 'Vidriera procedural 3D — las imagenes se fragmentan en piezas de cristal con luz y reflejos'
    }, [
        { key: 'fragments', type: 'range', min: 8, max: 60, default: 24, step: 1, label: 'Fragments' },
        { key: 'gapSize', type: 'range', min: 0, max: 30, default: 8, label: 'Lead Width', unit: '%' },
        { key: 'depth', type: 'range', min: 0, max: 100, default: 30, label: '3D Depth', unit: '%' },
        { key: 'lightPulse', type: 'range', min: 0, max: 100, default: 50, label: 'Light Pulse', unit: '%' },
        { key: 'rotateSpeed', type: 'range', min: 0, max: 100, default: 30, label: 'Rotate', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a1a', label: 'Background' }
    ]);

    function generateVoronoiCells(count, w, h) {
        var seeds = [];
        for (var i = 0; i < count; i++) {
            seeds.push({ x: (Math.random() - 0.5) * w, y: (Math.random() - 0.5) * h });
        }
        var cells = [];
        for (var s = 0; s < seeds.length; s++) {
            var cx = seeds[s].x;
            var cy = seeds[s].y;
            var angles = [];
            for (var o = 0; o < seeds.length; o++) {
                if (o === s) continue;
                angles.push(Math.atan2(seeds[o].y - cy, seeds[o].x - cx));
            }
            var radius = w * 0.15 + Math.random() * w * 0.1;
            var verts = [];
            var sides = 5 + Math.floor(Math.random() * 4);
            for (var v = 0; v < sides; v++) {
                var a = (v / sides) * Math.PI * 2 + Math.random() * 0.3;
                var r = radius * (0.7 + Math.random() * 0.6);
                verts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
            }
            cells.push({ cx: cx, cy: cy, verts: verts });
        }
        return cells;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var imgW = 6;
        var imgH = 6;

        for (var img = 0; img < mediaList.length; img++) {
            var imgGroup = new THREE.Group();
            imgGroup.visible = false;
            imgGroup.userData = { imageIndex: img };

            var tex = null;
            if (mediaList[img].element) {
                tex = new THREE.Texture(mediaList[img].element);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var fragCount = this.settings.fragments;
            var cells = generateVoronoiCells(fragCount, imgW, imgH);
            var gap = this.settings.gapSize / 100 * 0.1;
            var depthVal = this.settings.depth / 100 * 0.5;

            for (var c = 0; c < cells.length; c++) {
                var cell = cells[c];
                var shape = new THREE.Shape();
                var scale = 1.0 - gap;
                shape.moveTo(
                    (cell.verts[0].x - cell.cx) * scale,
                    (cell.verts[0].y - cell.cy) * scale
                );
                for (var v = 1; v < cell.verts.length; v++) {
                    shape.lineTo(
                        (cell.verts[v].x - cell.cx) * scale,
                        (cell.verts[v].y - cell.cy) * scale
                    );
                }
                shape.closePath();

                var extrudeSettings = { depth: 0.02 + depthVal * Math.random(), bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 };
                var geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

                var mat;
                if (tex) {
                    mat = new THREE.MeshPhongMaterial({
                        map: tex.clone(),
                        transparent: true,
                        opacity: 0.9,
                        shininess: 80,
                        side: THREE.DoubleSide
                    });
                    mat.map.needsUpdate = true;
                    mat.map.offset.set(cell.cx / imgW + 0.5, cell.cy / imgH + 0.5);
                    mat.map.repeat.set(0.3, 0.3);
                } else {
                    var hue = Math.random();
                    mat = new THREE.MeshPhongMaterial({
                        color: new THREE.Color().setHSL(hue, 0.7, 0.5),
                        transparent: true,
                        opacity: 0.85,
                        shininess: 80,
                        side: THREE.DoubleSide
                    });
                }

                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(cell.cx, cell.cy, (Math.random() - 0.5) * depthVal);
                mesh.userData = { cellIndex: c, baseZ: mesh.position.z };
                imgGroup.add(mesh);
            }

            group.add(imgGroup);
        }

        var light1 = new THREE.PointLight(0xffffff, 1.5, 20);
        light1.position.set(0, 0, 5);
        light1.userData = { isLight: true };
        group.add(light1);

        var light2 = new THREE.PointLight(0x4488ff, 0.8, 15);
        light2.position.set(-3, 2, 3);
        light2.userData = { isLight: true };
        group.add(light2);

        var ambient = new THREE.AmbientLight(0x333344, 0.5);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var images = [];
        for (var i = 0; i < this.group.children.length; i++) {
            var c = this.group.children[i];
            if (c.userData.imageIndex !== undefined) images.push(c);
        }
        var count = images.length;
        if (count === 0) return;
        var segDur = 1 / count;

        for (var idx = 0; idx < count; idx++) {
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;
            if (t >= segStart && t < segEnd) {
                images[idx].visible = true;
                var lt = (t - segStart) / segDur;
                var rotSpeed = this.settings.rotateSpeed / 100;
                images[idx].rotation.y = Math.sin(lt * Math.PI * 2) * 0.15 * rotSpeed;

                var pulse = this.settings.lightPulse / 100;
                for (var j = 0; j < images[idx].children.length; j++) {
                    var frag = images[idx].children[j];
                    if (frag.userData.cellIndex !== undefined) {
                        frag.position.z = frag.userData.baseZ + Math.sin(time * 2 + frag.userData.cellIndex * 0.5) * 0.05 * pulse;
                    }
                }
            } else {
                images[idx].visible = false;
            }
        }

        for (var li = 0; li < this.group.children.length; li++) {
            var light = this.group.children[li];
            if (light.userData.isLight && light.position) {
                if (light.position.z > 2) {
                    var pulse2 = this.settings.lightPulse / 100;
                    light.intensity = 1.2 + Math.sin(time * 3) * 0.5 * pulse2;
                }
            }
        }

        EP.Core.camera.position.set(0, 0, 8);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
