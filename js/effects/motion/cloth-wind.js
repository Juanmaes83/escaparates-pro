(function() {
    var effect = new EP.EffectBase('cloth-wind', {
        name: 'Cloth Wind',
        category: 'motion',
        icon: '🏴',
        description: 'Lona ondulante con viento — las imagenes se muestran como tela 3D meciendose con efecto cloth simulation'
    }, [
        { key: 'windForce', type: 'range', min: 5, max: 100, default: 40, label: 'Wind Force', unit: '%' },
        { key: 'waveSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Wave Speed', unit: '%' },
        { key: 'gravity', type: 'range', min: 0, max: 100, default: 30, label: 'Gravity Sag', unit: '%' },
        { key: 'pinStyle', type: 'range', min: 1, max: 3, default: 2, step: 1, label: 'Pin Points (2=corners, 3=top edge)' },
        { key: 'shadowDepth', type: 'range', min: 0, max: 100, default: 50, label: 'Shadow', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#111111', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var SEGS = 40;

        for (var img = 0; img < mediaList.length; img++) {
            var tex = null;
            var aspect = 1;
            if (mediaList[img].element) {
                tex = EP.Media.createTexture(mediaList[img]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || 1;
                aspect = ew / eh;
            }

            var w = aspect >= 1 ? 6 : 6 * aspect;
            var h = aspect >= 1 ? 6 / aspect : 6;
            if (w < 1) w = 4;
            if (h < 1) h = 4;

            var geo = new THREE.PlaneGeometry(w, h, SEGS, SEGS);
            var origPos = new Float32Array(geo.attributes.position.array);

            var mat = new THREE.MeshPhongMaterial({
                map: tex,
                side: THREE.DoubleSide,
                shininess: 15,
                specular: 0x222222
            });

            var mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            mesh.userData = {
                imageIndex: img,
                isCloth: true,
                origPos: origPos,
                w: w,
                h: h
            };
            group.add(mesh);
        }

        var light1 = new THREE.PointLight(0xffeedd, 1.0, 15);
        light1.position.set(2, 3, 5);
        light1.userData = { isLight: true };
        group.add(light1);

        var light2 = new THREE.PointLight(0x8899cc, 0.4, 12);
        light2.position.set(-3, -1, 4);
        light2.userData = { isLight: true };
        group.add(light2);

        var ambient = new THREE.AmbientLight(0x444444, 0.6);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var wind = this.settings.windForce / 100;
        var speed = this.settings.waveSpeed / 100;
        var grav = this.settings.gravity / 100;
        var pinStyle = this.settings.pinStyle;

        var clothMeshes = [];
        for (var i = 0; i < this.group.children.length; i++) {
            if (this.group.children[i].userData.isCloth) clothMeshes.push(this.group.children[i]);
        }
        var count = clothMeshes.length;
        if (count === 0) return;
        var segDur = 1 / count;

        for (var idx = 0; idx < count; idx++) {
            var segStart = idx * segDur;
            var mesh = clothMeshes[idx];

            if (t >= segStart && t < segStart + segDur) {
                mesh.visible = true;
                if (mesh.material.map) mesh.material.map.needsUpdate = true;

                var pos = mesh.geometry.attributes.position;
                var arr = pos.array;
                var orig = mesh.userData.origPos;
                var w = mesh.userData.w;
                var h = mesh.userData.h;
                var hw = w * 0.5;
                var hh = h * 0.5;

                for (var vi = 0; vi < pos.count; vi++) {
                    var ix = vi * 3;
                    var iy = ix + 1;
                    var iz = ix + 2;

                    var ox = orig[ix];
                    var oy = orig[iy];

                    var u = (ox + hw) / w;
                    var v = (oy + hh) / h;

                    var hangFactor = 1.0 - v;

                    var pinned = false;
                    if (pinStyle >= 3) {
                        pinned = v > 0.95;
                    } else if (pinStyle === 2) {
                        pinned = v > 0.92 && (u < 0.08 || u > 0.92);
                    } else {
                        pinned = v > 0.95 && u > 0.4 && u < 0.6;
                    }

                    if (pinned) {
                        arr[ix] = ox;
                        arr[iy] = oy;
                        arr[iz] = 0;
                        continue;
                    }

                    var wave1 = Math.sin(ox * 2.5 + time * speed * 3.0) * 0.3;
                    var wave2 = Math.sin(oy * 1.8 + time * speed * 2.2 + 1.5) * 0.2;
                    var wave3 = Math.sin((ox + oy) * 3.0 + time * speed * 5.0) * 0.08;

                    var zDisp = (wave1 + wave2 + wave3) * wind * hangFactor;
                    var sagY = hangFactor * hangFactor * grav * 0.3;

                    arr[ix] = ox + Math.sin(time * speed * 2.0 + oy * 2.0) * wind * 0.04 * hangFactor;
                    arr[iy] = oy - sagY;
                    arr[iz] = zDisp;
                }

                pos.needsUpdate = true;
            } else {
                mesh.visible = false;
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.3) * 0.4,
            0.2 + Math.sin(time * 0.2) * 0.15,
            7
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this.group) {
            for (var i = 0; i < this.group.children.length; i++) {
                var m = this.group.children[i];
                if (m.userData.isCloth && m.material && m.material.map) m.material.map.dispose();
            }
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
