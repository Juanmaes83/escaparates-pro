(function() {
    var effect = new EP.EffectBase('video-3d-form', {
        name: 'Video in 3D Form',
        category: '3d-perspective',
        icon: 'VF',
        description: 'Video o imagen sobre formas 3D con textura sin costuras y bloom opcional'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 220, default: 62, step: 1, label: 'Spin', unit: '%' },
        { key: 'shape', type: 'select', options: [{ v: 'chamfer', l: 'Chamfer Cylinder' }, { v: 'sphere', l: 'Sphere' }, { v: 'torus', l: 'Torus' }, { v: 'cone', l: 'Cone' }, { v: 'box', l: 'Box' }, { v: 'knot', l: 'Knot' }], default: 'chamfer', label: 'Shape' },
        { key: 'objectSize', type: 'range', min: 55, max: 165, default: 112, step: 1, label: 'Object Size', unit: '%' },
        { key: 'repeatX', type: 'range', min: 1, max: 8, default: 5, step: 0.1, label: 'Repeat X' },
        { key: 'repeatY', type: 'range', min: 1, max: 6, default: 1, step: 0.1, label: 'Repeat Y' },
        { key: 'opacity', type: 'range', min: 20, max: 100, default: 96, step: 1, label: 'Opacity', unit: '%' },
        { key: 'lighting', type: 'select', options: [{ v: 'natural', l: 'Natural' }, { v: 'bloom', l: 'Bloom optional' }], default: 'natural', label: 'Lighting' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    function geometry(shape) {
        if (shape === 'sphere') return new THREE.SphereGeometry(2.25, 72, 72);
        if (shape === 'torus') return new THREE.TorusGeometry(1.85, 0.58, 40, 128);
        if (shape === 'cone') return new THREE.ConeGeometry(1.9, 3.7, 72, 8, true);
        if (shape === 'box') return new THREE.BoxGeometry(3.3, 3.3, 3.3, 14, 14, 14);
        if (shape === 'knot') return new THREE.TorusKnotGeometry(1.35, 0.42, 220, 36);
        return new THREE.CylinderGeometry(1.55, 1.55, 3.3, 5, 1, true);
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var tex = EP.Media.createTexture(mediaList[0]);
        tex.needsUpdate = true;
        tex.wrapS = THREE.MirroredRepeatWrapping;
        tex.wrapT = THREE.MirroredRepeatWrapping;
        tex.repeat.set(this.settings.repeatX, this.settings.repeatY);
        var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: this.settings.opacity / 100 });
        var mesh = new THREE.Mesh(geometry(this.settings.shape), mat);
        mesh.scale.setScalar(this.settings.objectSize / 100);
        group.add(mesh);
        this.group = group;
        EP.Core.setPostProcessing({ bloomEnabled: this.settings.lighting === 'bloom', vignetteEnabled: false, bloomStrength: 0.18, bloomRadius: 0.12, bloomThreshold: 0.08 });
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var mesh = this.group.children[0];
        if (!mesh) return;
        mesh.rotation.y = time * 0.3 * this.settings.motion / 100;
        mesh.rotation.x = Math.sin(time * 0.2) * 0.18 * this.settings.motion / 100;
        mesh.scale.setScalar(this.settings.objectSize / 100);
        mesh.material.opacity = this.settings.opacity / 100;
        if (mesh.material.map) {
            mesh.material.map.repeat.set(this.settings.repeatX, this.settings.repeatY);
            if (mesh.material.map.isVideoTexture) mesh.material.map.needsUpdate = true;
        }
    };

    effect.dispose = function() {
        EP.Core.setPostProcessing({ bloomEnabled: false, vignetteEnabled: false });
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
