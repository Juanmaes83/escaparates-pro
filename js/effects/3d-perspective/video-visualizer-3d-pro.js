(function() {
    var effect = new EP.EffectBase('video-visualizer-3d-pro', {
        name: 'Video Visualizer 3D Pro',
        category: '3d-perspective',
        icon: 'V3',
        description: 'Video o imagen proyectado en geometria 3D con rotacion y bloom opcional'
    }, [
        { key: 'objectSize', type: 'range', min: 55, max: 155, default: 104, step: 1, label: 'Object Size', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 220, default: 58, step: 1, label: 'Rotation', unit: '%' },
        { key: 'exposure', type: 'range', min: 25, max: 120, default: 72, step: 1, label: 'Texture Exposure', unit: '%' },
        { key: 'repeatX', type: 'range', min: 1, max: 8, default: 3, step: 0.1, label: 'Repeat X' },
        { key: 'geometry', type: 'select', options: [{ v: 'cylinder', l: 'Cylinder' }, { v: 'sphere', l: 'Sphere' }, { v: 'box', l: 'Box' }, { v: 'torus', l: 'Torus' }, { v: 'plane', l: 'Plane' }], default: 'cylinder', label: 'Geometry' },
        { key: 'lighting', type: 'select', options: [{ v: 'natural', l: 'Natural' }, { v: 'bloom', l: 'Bloom optional' }], default: 'natural', label: 'Lighting' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    function makeTexture(media) {
        var tex = EP.Media.createTexture(media);
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.MirroredRepeatWrapping;
        tex.wrapT = THREE.MirroredRepeatWrapping;
        return tex;
    }

    function makeGeometry(type) {
        if (type === 'sphere') return new THREE.SphereGeometry(2.2, 64, 64);
        if (type === 'box') return new THREE.BoxGeometry(3.2, 3.2, 3.2, 18, 18, 18);
        if (type === 'torus') return new THREE.TorusGeometry(1.8, 0.58, 40, 128);
        if (type === 'plane') return EP.RoundedPlaneGeometry(5.8, 3.4, 0.12);
        return new THREE.CylinderGeometry(1.65, 1.65, 3.6, 72, 8, true);
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var tex = makeTexture(mediaList[0]);
        tex.repeat.set(this.settings.repeatX, 1);
        var mat = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this.settings.exposure / 100
        });
        var mesh = new THREE.Mesh(makeGeometry(this.settings.geometry), mat);
        mesh.userData = { isVisualizer: true };
        mesh.scale.setScalar(this.settings.objectSize / 100);
        group.add(mesh);
        this.group = group;
        EP.Core.setPostProcessing({
            bloomEnabled: this.settings.lighting === 'bloom',
            vignetteEnabled: false,
            bloomStrength: 0.22,
            bloomRadius: 0.16,
            bloomThreshold: 0.12
        });
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var mesh = this.group.children[0];
        if (!mesh) return;
        mesh.scale.setScalar(this.settings.objectSize / 100);
        mesh.material.opacity = this.settings.exposure / 100;
        if (mesh.material.map) {
            mesh.material.map.repeat.x = this.settings.repeatX;
            if (mesh.material.map.isVideoTexture) mesh.material.map.needsUpdate = true;
        }
        mesh.rotation.y = time * 0.28 * this.settings.motion / 100;
        mesh.rotation.x = Math.sin(time * 0.18) * 0.2 * this.settings.motion / 100;
    };

    effect.dispose = function() {
        EP.Core.setPostProcessing({ bloomEnabled: false, vignetteEnabled: false });
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
