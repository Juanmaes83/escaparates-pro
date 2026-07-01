(function() {
    var effect = new EP.EffectBase('glass-showcase', {
        name: 'Glass Showcase',
        category: 'glassmorphism',
        icon: '💎',
        description: 'Cubo de cristal 3D con foto interior — refraccion, transparencia y rotacion multi-eje'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'shape', type: 'select', options: ['Cube', 'Sphere', 'Cylinder', 'Octahedron', 'Torus'], default: 'Cube', label: 'Shape' },
        { key: 'glassOpacity', type: 'range', min: 10, max: 90, default: 35, label: 'Glass Opacity', unit: '%' },
        { key: 'photoScale', type: 'range', min: 50, max: 150, default: 100, label: 'Photo Scale', unit: '%' },
        { key: 'rotSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Rotation', unit: '%' },
        { key: 'rotMode', type: 'select', options: ['Spin', 'Swing'], default: 'Spin', label: 'Mode' },
        { key: 'glassColor', type: 'color', default: '#aaccff', label: 'Glass Tint' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050505', label: 'Background' }
    ]);

    function createGlassGeometry(shape) {
        switch (shape) {
            case 'Sphere': return new THREE.SphereGeometry(1.2, 32, 32);
            case 'Cylinder': return new THREE.CylinderGeometry(1.0, 1.0, 1.8, 32);
            case 'Octahedron': return new THREE.OctahedronGeometry(1.3, 0);
            case 'Torus': return new THREE.TorusGeometry(1.0, 0.45, 16, 32);
            default: return new THREE.BoxGeometry(2.1, 2.1, 1.0, 4, 4, 4);
        }
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var containerGroup = new THREE.Group();
        containerGroup.userData = { isContainer: true };

        for (var img = 0; img < mediaList.length; img++) {
            var photoGroup = new THREE.Group();
            photoGroup.userData = { imageIndex: img };
            photoGroup.visible = false;

            var aspect = 1;
            if (mediaList[img].element) {
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || mediaList[img].element.width || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || mediaList[img].element.height || 1;
                aspect = ew / eh;
            }

            var photoScale = this.settings.photoScale / 100 * 1.2;
            var pw, ph;
            if (aspect > 1) { pw = photoScale; ph = photoScale / aspect; }
            else { ph = photoScale; pw = photoScale * aspect; }

            var photoGeo = new THREE.PlaneGeometry(pw, ph);
            var photoMat = EP.Media.createMaterial(mediaList[img]);
            photoMat.side = THREE.DoubleSide;
            photoMat.transparent = false;
            photoMat.depthWrite = true;
            var photoMesh = new THREE.Mesh(photoGeo, photoMat);
            photoMesh.renderOrder = 0;
            photoGroup.add(photoMesh);

            var glassGeo = createGlassGeometry(this.settings.shape);
            var glassColor = new THREE.Color(this.settings.glassColor);
            var glassMat = new THREE.MeshPhongMaterial({
                color: glassColor,
                transparent: true,
                opacity: this.settings.glassOpacity / 100,
                shininess: 100,
                specular: 0xffffff,
                reflectivity: 0.9,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            var glassMesh = new THREE.Mesh(glassGeo, glassMat);
            glassMesh.renderOrder = 1;
            photoGroup.add(glassMesh);

            containerGroup.add(photoGroup);
        }

        group.add(containerGroup);

        var ambLight = new THREE.AmbientLight(0xffffff, 1.0);
        ambLight.userData = { isLight: true };
        group.add(ambLight);
        var backLight = new THREE.DirectionalLight(0xffffff, 2.0);
        backLight.position.set(-5, 2, -10);
        backLight.userData = { isLight: true };
        group.add(backLight);
        var topLight = new THREE.DirectionalLight(0xffffff, 1.5);
        topLight.position.set(0, 10, 0);
        topLight.userData = { isLight: true };
        group.add(topLight);
        var frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
        frontLight.position.set(0, 2, 10);
        frontLight.userData = { isLight: true };
        group.add(frontLight);

        this._baseFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var rotSpeed = this.settings.rotSpeed / 100;
        var isSpin = this.settings.rotMode === 'Spin';

        var container = null;
        for (var c = 0; c < this.group.children.length; c++) {
            if (this.group.children[c].userData && this.group.children[c].userData.isContainer) {
                container = this.group.children[c];
                break;
            }
        }
        if (!container) return;

        var photoGroups = [];
        for (var i = 0; i < container.children.length; i++) {
            if (container.children[i].userData.imageIndex !== undefined) photoGroups.push(container.children[i]);
        }
        var count = photoGroups.length;
        if (count === 0) return;
        var segDur = 1 / count;

        for (var idx = 0; idx < count; idx++) {
            var pg = photoGroups[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                pg.visible = true;

                if (isSpin) {
                    pg.rotation.y += dt * rotSpeed * 2;
                } else {
                    var lt = (t - segStart) / segDur;
                    pg.rotation.y = Math.sin(lt * Math.PI * 2) * 0.6 * rotSpeed;
                }

                pg.rotation.x = Math.cos(time * 0.4 * rotSpeed) * 0.2;
                pg.rotation.z = Math.sin(time * 0.3 * rotSpeed * 0.7) * 0.1;

                var lt2 = (t - segStart) / segDur;
                var appear = lt2 < 0.1 ? lt2 / 0.1 : 1;
                var disappear = lt2 > 0.9 ? (lt2 - 0.9) / 0.1 : 0;
                var s = appear * (1 - disappear);
                pg.scale.setScalar(Math.max(0.01, s));
            } else {
                pg.visible = false;
            }
        }

        EP.Core.camera.position.set(0, 0, 5);
        EP.Core.camera.lookAt(0, 0, 0);
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
