(function() {
    var effect = new EP.EffectBase('video-visualizer-3d-pro', {
        name: 'Video Visualizer 3D Pro', category: '3d-perspective', icon: 'V3',
        description: 'Imagen o video mapeado sobre geometria 3D con material fisico y bloom regulable'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 220, default: 58, step: 1, label: 'Rotation', unit: '%' },
        { key: 'objectSize', type: 'range', min: 55, max: 155, default: 104, step: 1, label: 'Object Size', unit: '%' },
        { key: 'exposure', type: 'range', min: 25, max: 120, default: 72, step: 1, label: 'Texture Exposure', unit: '%' },
        { key: 'repeatX', type: 'range', min: 1, max: 8, default: 3, step: 0.1, label: 'Repeat X' },
        { key: 'repeatY', type: 'range', min: 1, max: 8, default: 1, step: 0.1, label: 'Repeat Y' },
        { key: 'offsetX', type: 'range', min: -100, max: 100, default: 0, step: 1, label: 'Texture X', unit: '%' },
        { key: 'offsetY', type: 'range', min: -100, max: 100, default: 0, step: 1, label: 'Texture Y', unit: '%' },
        { key: 'textureRotation', type: 'range', min: -180, max: 180, default: 0, step: 1, label: 'Texture Rotation', unit: 'deg' },
        { key: 'roughness', type: 'range', min: 0, max: 100, default: 38, step: 1, label: 'Roughness', unit: '%' },
        { key: 'metalness', type: 'range', min: 0, max: 100, default: 12, step: 1, label: 'Metalness', unit: '%' },
        { key: 'clearcoat', type: 'range', min: 0, max: 100, default: 20, step: 1, label: 'Clearcoat', unit: '%' },
        { key: 'clearcoatRoughness', type: 'range', min: 0, max: 100, default: 22, step: 1, label: 'Clearcoat Roughness', unit: '%' },
        { key: 'geometry', type: 'select', options: [{ v: 'cylinder', l: 'Beveled Cylinder' }, { v: 'sphere', l: 'Sphere' }, { v: 'box', l: 'Box' }, { v: 'torus', l: 'Torus' }, { v: 'plane', l: 'Plane' }], default: 'cylinder', label: 'Geometry' },
        { key: 'bloom', type: 'select', options: [{ v: 'off', l: 'Natural' }, { v: 'on', l: 'Bloom optional' }], default: 'off', label: 'Bloom' },
        { key: 'bloomStrength', type: 'range', min: 0, max: 200, default: 35, step: 1, label: 'Bloom Strength', unit: '%' },
        { key: 'bloomRadius', type: 'range', min: 0, max: 100, default: 18, step: 1, label: 'Bloom Radius', unit: '%' },
        { key: 'bloomThreshold', type: 'range', min: 0, max: 100, default: 12, step: 1, label: 'Bloom Threshold', unit: '%' },
        { key: 'videoSpeed', type: 'range', min: 25, max: 300, default: 100, step: 5, label: 'Video Speed', unit: '%' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);
    effect.capabilities = Object.assign(effect.capabilities, { supportsVideo: true, usesPostProcessing: true, mobileRisk: 'high' });

    function geometry(type) {
        if (type === 'sphere') return new THREE.SphereGeometry(2.2, 64, 64);
        if (type === 'box') return new THREE.BoxGeometry(3.2, 3.2, 3.2, 18, 18, 18);
        if (type === 'torus') return new THREE.TorusGeometry(1.8, 0.58, 40, 128);
        if (type === 'plane') return EP.RoundedPlaneGeometry(5.8, 3.4, 0.12);
        return new THREE.CylinderGeometry(1.65, 1.65, 3.6, 72, 8, true);
    }
    function applyTexture(texture, settings) {
        texture.wrapS = THREE.MirroredRepeatWrapping; texture.wrapT = THREE.MirroredRepeatWrapping;
        texture.repeat.set(settings.repeatX, settings.repeatY);
        texture.offset.set(settings.offsetX / 100, settings.offsetY / 100);
        texture.center.set(0.5, 0.5);
        texture.rotation = THREE.MathUtils.degToRad(settings.textureRotation);
        texture.needsUpdate = true;
    }
    function post(settings) {
        var sig = [settings.bloom, settings.bloomStrength, settings.bloomRadius, settings.bloomThreshold].join('|');
        if (effect._postSignature === sig) return;
        effect._postSignature = sig;
        EP.Core.setPostProcessing({
            bloomEnabled: settings.bloom === 'on', vignetteEnabled: false,
            bloomStrength: settings.bloomStrength / 100,
            bloomRadius: settings.bloomRadius / 100,
            bloomThreshold: settings.bloomThreshold / 100
        });
    }
    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || !mediaList.length) return group;
        var texture = EP.Media.createTexture(mediaList[0]);
        applyTexture(texture, this.settings);
        var material = new THREE.MeshPhysicalMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: this.settings.exposure / 100 });
        var mesh = new THREE.Mesh(geometry(this.settings.geometry), material);
        mesh.userData.isVisualizer = true;
        group.add(mesh); this.group = group; this._postSignature = null; post(this.settings); return group;
    };
    effect.update = function(time) {
        if (!this.group || !this.group.children[0]) return;
        var mesh = this.group.children[0], material = mesh.material, settings = this.settings;
        mesh.scale.setScalar(settings.objectSize / 100);
        material.opacity = settings.exposure / 100;
        material.roughness = settings.roughness / 100;
        material.metalness = settings.metalness / 100;
        material.clearcoat = settings.clearcoat / 100;
        material.clearcoatRoughness = settings.clearcoatRoughness / 100;
        if (material.map) {
            applyTexture(material.map, settings);
            if (material.map.isVideoTexture) { material.map.image.playbackRate = settings.videoSpeed / 100; material.map.needsUpdate = true; }
        }
        var t = settings.playbackMotion === 'off' ? 0 : time * settings.playbackMotionSpeed / 100;
        mesh.rotation.y = t * 0.28 * settings.motion / 100;
        mesh.rotation.x = Math.sin(t * 0.18) * 0.2 * settings.motion / 100;
        post(settings);
    };
    effect.dispose = function() { EP.Core.setPostProcessing({ bloomEnabled: false, vignetteEnabled: false }); EP.EffectBase.prototype.dispose.call(this); };
    EP.Registry.register(effect);
})();
