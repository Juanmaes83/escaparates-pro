(function() {
    var effect = new EP.EffectBase('sphere-projection', {
        name: 'Sphere Projection',
        category: '3d-perspective',
        icon: '🌐',
        description: 'Grid esferico infinito — las imagenes se distribuyen en una esfera proyectada con scroll automatico tipo globo interactivo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'gridCols', type: 'range', min: 3, max: 8, default: 5, step: 1, label: 'Columns' },
        { key: 'gridRows', type: 'range', min: 2, max: 6, default: 3, step: 1, label: 'Rows' },
        { key: 'sphereRadius', type: 'range', min: 20, max: 100, default: 60, label: 'Radius', unit: '%' },
        { key: 'rotSpeed', type: 'range', min: 10, max: 100, default: 40, label: 'Rotation', unit: '%' },
        { key: 'cardSize', type: 'range', min: 20, max: 100, default: 60, label: 'Card Size', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080818', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cols = this.settings.gridCols;
        var rows = this.settings.gridRows;
        var radius = 3 + 4 * this.settings.sphereRadius / 100;
        var cardScale = 0.5 + 1.5 * this.settings.cardSize / 100;
        var total = cols * rows;

        for (var i = 0; i < total; i++) {
            var imgIdx = i % mediaList.length;
            var tex = null;
            if (mediaList[imgIdx].element) {
                tex = EP.Media.createTexture(mediaList[imgIdx]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var col = i % cols;
            var row = Math.floor(i / cols);

            var phi = (Math.PI * 0.15) + (row / (rows - 1 || 1)) * (Math.PI * 0.7);
            var theta = (col / cols) * Math.PI * 2;

            var x = radius * Math.sin(phi) * Math.cos(theta);
            var y = radius * Math.cos(phi);
            var z = radius * Math.sin(phi) * Math.sin(theta);

            var cw = cardScale;
            var ch = cardScale * 0.75;
            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cw, ch, 0.05) : new THREE.PlaneGeometry(cw, ch);
            var mat = new THREE.MeshPhongMaterial({
                map: tex,
                side: THREE.DoubleSide,
                shininess: 30,
                specular: 0x222222
            });

            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            mesh.lookAt(0, 0, 0);
            mesh.userData = {
                cardIndex: i,
                basePhi: phi,
                baseTheta: theta,
                radius: radius
            };
            group.add(mesh);
        }

        var light1 = new THREE.PointLight(0xffffff, 1.0, 20);
        light1.position.set(0, 5, 8);
        light1.userData = { isLight: true };
        group.add(light1);

        var light2 = new THREE.PointLight(0x6688ff, 0.5, 15);
        light2.position.set(-5, -3, 5);
        light2.userData = { isLight: true };
        group.add(light2);

        var ambient = new THREE.AmbientLight(0x333344, 0.6);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var rotSpeed = this.settings.rotSpeed / 100;
        var thetaOffset = time * rotSpeed * 0.5;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            if (mesh.userData.cardIndex === undefined) continue;

            var d = mesh.userData;
            var theta = d.baseTheta + thetaOffset;
            var r = d.radius;

            mesh.position.x = r * Math.sin(d.basePhi) * Math.cos(theta);
            mesh.position.z = r * Math.sin(d.basePhi) * Math.sin(theta);

            mesh.lookAt(0, 0, 0);

            if (mesh.material.map) mesh.material.map.needsUpdate = true;
        }

        var t = time / loopDuration;
        EP.Core.camera.position.set(
            Math.sin(t * Math.PI * 2) * 2,
            1 + Math.sin(time * 0.3) * 0.5,
            8 + Math.sin(time * 0.2) * 0.5
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this.group) {
            for (var i = 0; i < this.group.children.length; i++) {
                var m = this.group.children[i];
                if (m.material && m.material.map) m.material.map.dispose();
            }
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
