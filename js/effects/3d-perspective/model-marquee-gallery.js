(function() {
    var effect = new EP.EffectBase('model-marquee-gallery', {
        name: '3D Model Marquee Gallery', category: '3d-perspective', icon: 'MG',
        description: 'Modelo 3D con marquesina tipografica, UV editable, iluminacion e importacion OBJ o FBX'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 200, default: 55, step: 1, label: 'Rotation', unit: '%' },
        { key: 'text', type: 'text', default: 'GALLERY', label: 'Marquee Text', maxLength: 40 },
        { key: 'textColor', type: 'color', default: '#ffffff', label: 'Text Color' },
        { key: 'flipHorizontal', type: 'select', options: [{ v: 'on', l: 'Flip horizontal' }, { v: 'off', l: 'Natural' }], default: 'on', label: 'Text Direction' },
        { key: 'flipVertical', type: 'select', options: [{ v: 'off', l: 'Natural' }, { v: 'on', l: 'Flip vertical' }], default: 'off', label: 'Text Vertical' },
        { key: 'offsetLine', type: 'range', min: -50, max: 50, default: 0, step: 1, label: 'Line Offset', unit: '%' },
        { key: 'fontSize', type: 'range', min: 10, max: 100, default: 72, step: 1, label: 'Font Size' },
        { key: 'speedX', type: 'range', min: -50, max: 50, default: 3, step: 1, label: 'Scroll X', unit: '%' },
        { key: 'speedY', type: 'range', min: -50, max: 50, default: 1, step: 1, label: 'Scroll Y', unit: '%' },
        { key: 'model', type: 'select', options: [{ v: 'torus', l: 'Torus' }, { v: 'sphere', l: 'Sphere' }, { v: 'box', l: 'Box' }, { v: 'cylinder', l: 'Cylinder' }, { v: 'knot', l: 'Knot' }, { v: 'crystal', l: 'Crystal' }, { v: 'uploaded', l: 'Uploaded model' }], default: 'torus', label: 'Model' },
        { key: 'modelFile', type: 'file', default: '', accept: '.obj,.fbx', label: 'Import OBJ / FBX' },
        { key: 'modelSize', type: 'range', min: 55, max: 160, default: 112, step: 1, label: 'Model Size', unit: '%' },
        { key: 'repeatX', type: 'range', min: 1, max: 20, default: 3, step: 1, label: 'Repeat X' },
        { key: 'repeatY', type: 'range', min: 1, max: 20, default: 6, step: 1, label: 'Repeat Y' },
        { key: 'uvMapping', type: 'select', options: [{ v: 'original', l: 'Original UV' }, { v: 'cylindrical', l: 'Cylindrical UV' }, { v: 'spherical', l: 'Spherical UV' }, { v: 'planar', l: 'Planar UV' }], default: 'cylindrical', label: 'UV Mapping' },
        { key: 'ambientIntensity', type: 'range', min: 0, max: 200, default: 120, step: 1, label: 'Ambient Light', unit: '%' },
        { key: 'directionalIntensity', type: 'range', min: 0, max: 200, default: 80, step: 1, label: 'Directional Light', unit: '%' },
        { key: 'background', type: 'color', default: '#0f0f1a', label: 'Background' }
    ]);
    effect.capabilities = Object.assign(effect.capabilities, { mobileRisk: 'high', exportSafe: true });

    function textTexture(s) {
        var canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512;
        var ctx = canvas.getContext('2d'); ctx.fillStyle = s.background; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save(); var sx = s.flipHorizontal === 'on' ? -1 : 1, sy = s.flipVertical === 'on' ? -1 : 1;
        ctx.translate(sx < 0 ? canvas.width : 0, sy < 0 ? canvas.height : 0); ctx.scale(sx, sy);
        ctx.fillStyle = s.textColor; ctx.font = '900 ' + (s.fontSize * 2) + 'px Inter,Arial,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var words = (s.text || 'GALLERY') + ' ', offset = s.offsetLine / 100 * canvas.width;
        function row(y, x) { ctx.fillText(words, canvas.width / 2 + x, y); ctx.fillText(words, canvas.width / 2 + x - canvas.width, y); ctx.fillText(words, canvas.width / 2 + x + canvas.width, y); }
        row(canvas.height * .25, 0); row(canvas.height * .75, offset); ctx.restore();
        var texture = new THREE.CanvasTexture(canvas); texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(s.repeatX, s.repeatY); texture.encoding = THREE.sRGBEncoding; return texture;
    }
    function procedural(type) {
        if (type === 'sphere') return new THREE.SphereGeometry(2.5, 64, 64);
        if (type === 'box') return new THREE.BoxGeometry(3.6, 3.6, 3.6, 24, 24, 24);
        if (type === 'cylinder') return new THREE.CylinderGeometry(1.8, 1.8, 4.2, 80, 12, true);
        if (type === 'knot') return new THREE.TorusKnotGeometry(1.45, .42, 220, 32);
        if (type === 'crystal') return new THREE.OctahedronGeometry(2.7, 1);
        return new THREE.TorusGeometry(2.1, .62, 48, 160);
    }
    function assignUV(mesh, mode) {
        if (!mesh || !mesh.geometry || mode === 'original') return;
        var base = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone(); base.computeBoundingBox();
        var box = base.boundingBox, size = new THREE.Vector3(), center = new THREE.Vector3(); box.getSize(size); box.getCenter(center);
        var pos = base.attributes.position, uv = new Float32Array(pos.count * 2);
        for (var i = 0; i < pos.count; i++) {
            var x = pos.getX(i) - center.x, y = pos.getY(i) - center.y, z = pos.getZ(i) - center.z, u, v;
            if (mode === 'spherical') { var len = Math.max(.00001, Math.sqrt(x * x + y * y + z * z)); u = .5 + Math.atan2(z, x) / (Math.PI * 2); v = .5 - Math.asin(y / len) / Math.PI; }
            else if (mode === 'planar') { u = (pos.getX(i) - box.min.x) / Math.max(.00001, size.x); v = (pos.getY(i) - box.min.y) / Math.max(.00001, size.y); }
            else { u = .5 + Math.atan2(z, x) / (Math.PI * 2); v = (pos.getY(i) - box.min.y) / Math.max(.00001, size.y); }
            uv[i * 2] = u; uv[i * 2 + 1] = v;
        }
        base.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); mesh.geometry = base;
    }
    function material(texture) { return new THREE.MeshStandardMaterial({ map: texture, roughness: .3, metalness: .1, side: THREE.DoubleSide }); }
    effect._addModel = function(object) {
        if (!this.group) return;
        var previous = this.group.getObjectByName('marquee-model'); if (previous) this.group.remove(previous);
        var texture = textTexture(this.settings), container = new THREE.Group(); container.name = 'marquee-model';
        object.traverse(function(child) { if (!child.isMesh) return; assignUV(child, effect.settings.uvMapping); child.material = material(texture); });
        var bounds = new THREE.Box3().setFromObject(object), size = bounds.getSize(new THREE.Vector3()), largest = Math.max(size.x, size.y, size.z, .01), scale = 5 / largest;
        object.scale.setScalar(scale); object.updateMatrixWorld(true); bounds.setFromObject(object); var center = bounds.getCenter(new THREE.Vector3()); object.position.sub(center); container.add(object); this.group.add(container);
    };
    effect._loadModel = function(file) {
        var self = this; if (!file || file.size > 25 * 1024 * 1024) { EP.UI.toast('El modelo debe ser OBJ o FBX y pesar menos de 25 MB.'); return; }
        var url = URL.createObjectURL(file), lower = file.name.toLowerCase(), loader = lower.endsWith('.fbx') && THREE.FBXLoader ? new THREE.FBXLoader() : (lower.endsWith('.obj') && THREE.OBJLoader ? new THREE.OBJLoader() : null);
        if (!loader) { URL.revokeObjectURL(url); EP.UI.toast('Formato no disponible. Usa OBJ o FBX.'); return; }
        loader.load(url, function(object) { URL.revokeObjectURL(url); self._addModel(object); }, undefined, function() { URL.revokeObjectURL(url); EP.UI.toast('No se pudo abrir ese modelo 3D.'); });
    };
    effect.handleFileControl = function(key, file) { if (key !== 'modelFile') return; this._modelFile = file; this.settings.model = 'uploaded'; this._loadModel(file); };
    effect.build = function() {
        var group = new THREE.Group(), texture = textTexture(this.settings), model;
        var ambient = new THREE.AmbientLight(0xffffff, this.settings.ambientIntensity / 100), light = new THREE.DirectionalLight(0xffffff, this.settings.directionalIntensity / 100); light.position.set(6, 8, 8); ambient.userData.isMarqueeLight = true; light.userData.isMarqueeLight = true; group.add(ambient); group.add(light);
        if (this.settings.model === 'uploaded' && this._modelFile) { this.group = group; this._loadModel(this._modelFile); return group; }
        model = new THREE.Mesh(procedural(this.settings.model), material(texture)); model.name = 'marquee-model'; group.add(model); this.group = group; return group;
    };
    effect.update = function(time) {
        if (!this.group) return;
        var s = this.settings, model = this.group.getObjectByName('marquee-model'), activeTime = s.playbackMotion === 'off' ? 0 : time * s.playbackMotionSpeed / 100;
        if (!model) return;
        model.rotation.y = activeTime * .35 * s.motion / 100; model.rotation.x = Math.sin(activeTime * .22) * .25 * s.motion / 100; model.scale.setScalar(s.modelSize / 100);
        model.traverse(function(child) { if (!child.isMesh || !child.material.map) return; child.material.map.offset.x -= .0008 * s.speedX * (s.playbackMotion === 'off' ? 0 : 1); child.material.map.offset.y -= .0008 * s.speedY * (s.playbackMotion === 'off' ? 0 : 1); });
        this.group.children.forEach(function(child) { if (child.isAmbientLight) child.intensity = s.ambientIntensity / 100; if (child.isDirectionalLight) child.intensity = s.directionalIntensity / 100; });
    };
    EP.Registry.register(effect);
})();
