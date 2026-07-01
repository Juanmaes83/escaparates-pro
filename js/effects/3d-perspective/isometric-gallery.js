(function() {
    var effect = new EP.EffectBase('isometric-gallery', {
        name: '3D Isometric Gallery',
        category: '3d-perspective',
        icon: '💎',
        description: 'Grid isometrico 3D — las imagenes se muestran como cards en perspectiva isometrica con animacion de entrada'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'cols', type: 'range', min: 2, max: 6, default: 3, step: 1, label: 'Columns' },
        { key: 'rows', type: 'range', min: 2, max: 5, default: 3, step: 1, label: 'Rows' },
        { key: 'tiltAngle', type: 'range', min: 10, max: 60, default: 35, label: 'Tilt Angle' },
        { key: 'cardGap', type: 'range', min: 10, max: 100, default: 50, label: 'Gap', unit: '%' },
        { key: 'elevation', type: 'range', min: 0, max: 100, default: 40, label: 'Elevation', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0e0e1a', label: 'Background' }
    ]);
    effect._handlesOutputSize = true;
    effect._handlesMotionControls = true;

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var cols = this.settings.cols;
        var rows = this.settings.rows;
        var gap = 0.1 + 0.3 * this.settings.cardGap / 100;
        var elevation = this.settings.elevation / 100;
        var outputScale = this.settings.outputSize / 100;
        var total = cols * rows;

        var cardW = 1.6 * outputScale;
        var cardH = 1.2 * outputScale;
        gap *= Math.max(1, outputScale * 0.55);

        for (var i = 0; i < total; i++) {
            var mi = i % mediaList.length;
            var tex = null;
            if (mediaList[mi].element) {
                tex = EP.Media.createTexture(mediaList[mi]);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }

            var col = i % cols;
            var row = Math.floor(i / cols);

            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(cardW, cardH, 0.06) : new THREE.PlaneGeometry(cardW, cardH);
            var mat = new THREE.MeshPhongMaterial({
                map: tex,
                shininess: 40,
                specular: 0x333333,
                side: THREE.DoubleSide
            });

            var mesh = new THREE.Mesh(geo, mat);

            var xOff = (col - (cols - 1) / 2) * (cardW + gap);
            var yOff = ((rows - 1) / 2 - row) * (cardH + gap);

            mesh.position.set(xOff, yOff, 0);

            mesh.userData = {
                cardIndex: i,
                isCard: true,
                col: col,
                row: row,
                homeX: xOff,
                homeY: yOff,
                stagger: (col + row) * 0.1
            };
            group.add(mesh);
        }

        var tiltRad = this.settings.tiltAngle * Math.PI / 180;
        group.rotation.x = -tiltRad * 0.5;
        group.rotation.y = Math.PI / 6;
        group.position.y = -elevation * 1.5;

        var light1 = new THREE.DirectionalLight(0xffffff, 1.0);
        light1.position.set(3, 5, 5);
        light1.userData = { isLight: true };
        group.add(light1);

        var light2 = new THREE.PointLight(0x6688ff, 0.5, 15);
        light2.position.set(-3, 2, 3);
        light2.userData = { isLight: true };
        group.add(light2);

        var ambient = new THREE.AmbientLight(0x444455, 0.5);
        ambient.userData = { isLight: true };
        group.add(ambient);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var motionOn = this.settings.playbackMotion !== 'off';
        var speed = motionOn ? this.settings.playbackMotionSpeed / 100 : 0;
        var t = (time * speed) / loopDuration;
        var outputScale = this.settings.outputSize / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            if (!mesh.userData.isCard) continue;

            var d = mesh.userData;
            if (mesh.material.map) mesh.material.map.needsUpdate = true;

            var wave = Math.sin(time * 0.8 * speed + d.stagger * 3) * 0.15 * outputScale;
            mesh.position.z = wave;

            var pulse = Math.sin(time * 0.5 * speed + d.cardIndex * 0.7) * 0.03 * speed;
            var s = 1.0 + pulse;
            mesh.scale.set(s, s, 1);
        }

        var camSwayX = Math.sin(t * Math.PI * 2) * 0.8;
        var camSwayY = Math.cos(t * Math.PI * 2 * 0.7) * 0.4;
        var cameraZ = 8 + Math.max(0, outputScale - 1) * 1.8;
        EP.Core.camera.position.set(
            camSwayX,
            3 + camSwayY,
            cameraZ
        );
        EP.Core.camera.lookAt(0, -0.5, 0);
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
