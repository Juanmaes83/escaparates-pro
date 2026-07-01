(function() {
    var effect = new EP.EffectBase('model-marquee-gallery', {
        name: '3D Model Marquee Gallery',
        category: '3d-perspective',
        icon: 'MG',
        description: 'Galeria 3D con geometria editable y textura de texto en marquesina'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 200, default: 55, step: 1, label: 'Motion', unit: '%' },
        { key: 'text', type: 'text', default: 'GALLERY', label: 'Text', maxLength: 40 },
        { key: 'model', type: 'select', options: [{ v: 'torus', l: 'Torus' }, { v: 'sphere', l: 'Sphere' }, { v: 'box', l: 'Box' }, { v: 'cylinder', l: 'Cylinder' }, { v: 'knot', l: 'Knot' }, { v: 'crystal', l: 'Crystal' }], default: 'torus', label: 'Model' },
        { key: 'modelSize', type: 'range', min: 55, max: 160, default: 112, step: 1, label: 'Model Size', unit: '%' },
        { key: 'repeatX', type: 'range', min: 1, max: 14, default: 3, step: 1, label: 'Repeat X' },
        { key: 'repeatY', type: 'range', min: 1, max: 14, default: 6, step: 1, label: 'Repeat Y' },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Text Color' },
        { key: 'background', type: 'color', default: '#0f0f1a', label: 'Background' }
    ]);

    function makeTexture(settings) {
        var canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 512;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = settings.background || '#0f0f1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = settings.textColor || '#ffffff';
        ctx.font = '900 150px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var txt = ((settings.text || 'GALLERY') + ' ').toUpperCase();
        for (var y = 0; y < 3; y++) {
            for (var x = -1; x < 3; x++) {
                ctx.fillText(txt, canvas.width * (x * 0.7 + 0.5), canvas.height * (0.25 + y * 0.28));
            }
        }
        var tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(settings.repeatX, settings.repeatY);
        return tex;
    }

    function makeGeometry(type) {
        if (type === 'sphere') return new THREE.SphereGeometry(2.5, 64, 64);
        if (type === 'box') return new THREE.BoxGeometry(3.6, 3.6, 3.6, 24, 24, 24);
        if (type === 'cylinder') return new THREE.CylinderGeometry(1.8, 1.8, 4.2, 80, 12, true);
        if (type === 'knot') return new THREE.TorusKnotGeometry(1.45, 0.42, 220, 32);
        if (type === 'crystal') return new THREE.OctahedronGeometry(2.7, 1);
        return new THREE.TorusGeometry(2.1, 0.62, 48, 160);
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var tex = makeTexture(this.settings);
        var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
        var mesh = new THREE.Mesh(makeGeometry(this.settings.model), mat);
        mesh.scale.setScalar(this.settings.modelSize / 100);
        mesh.userData = { isModel: true };
        group.add(mesh);
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var mesh = this.group.children[0];
        if (!mesh) return;
        mesh.rotation.y = time * 0.35 * this.settings.motion / 100;
        mesh.rotation.x = Math.sin(time * 0.22) * 0.25 * this.settings.motion / 100;
        mesh.scale.setScalar(this.settings.modelSize / 100);
        if (mesh.material.map) {
            mesh.material.map.offset.x -= 0.0025 * this.settings.motion / 100;
            mesh.material.map.offset.y -= 0.0008 * this.settings.motion / 100;
        }
    };

    EP.Registry.register(effect);
})();
