EP.RoundedPlaneGeometry = function(w, h, r) {
    if (!r || r <= 0) return new THREE.PlaneGeometry(w, h);
    var hw = w / 2, hh = h / 2;
    r = Math.min(r, hw, hh);
    var shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    var geo = new THREE.ShapeGeometry(shape, 8);
    geo.computeBoundingBox();
    var bb = geo.boundingBox;
    var uvAttr = geo.attributes.uv;
    for (var i = 0; i < uvAttr.count; i++) {
        uvAttr.setX(i, (geo.attributes.position.getX(i) - bb.min.x) / w);
        uvAttr.setY(i, (geo.attributes.position.getY(i) - bb.min.y) / h);
    }
    return geo;
};

EP.EffectBase = function(id, meta, controlsDef) {
    this.id = id;
    this.meta = meta;
    this.controlsDef = EP.ControlSchema ? EP.ControlSchema.normalizeControls(controlsDef || []) : (controlsDef || []);
    this.settings = {};
    this.defaultSettings = {};
    this.group = null;
    this.lastError = null;
    this.capabilities = {
        supportsMotionDirection: false,
        supportsVideo: false,
        usesCamera: false,
        usesPostProcessing: false,
        mobileRisk: 'medium',
        minMedia: 1,
        exportSafe: true,
        hasErrorBoundary: true
    };
    this.controlsDef.forEach(function(c) {
        var value = c.default !== undefined ? c.default : null;
        this.settings[c.key] = value;
        this.defaultSettings[c.key] = value;
    }.bind(this));
};

EP.EffectBase.prototype.build = function(mediaList) {
    return new THREE.Group();
};

EP.EffectBase.prototype.update = function(time, dt, loopDuration) {
};

EP.EffectBase.prototype.enter = function(mediaList) {
    return this.reconstruct(mediaList);
};

EP.EffectBase.prototype.reconstruct = function(mediaList) {
    return this.rebuild(mediaList);
};

EP.EffectBase.prototype.exit = function() {
    this.dispose();
};

EP.EffectBase.prototype.cleanup = function() {
    this.dispose();
};

EP.EffectBase.prototype.dispose = function() {
    if (this.group) {
        this.group.traverse(function(child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        });
        this.group = null;
    }
};

EP.EffectBase.prototype.setSetting = function(key, value) {
    if (EP.ControlSchema) {
        var next = Object.assign({}, this.settings);
        next[key] = value;
        this.settings = EP.ControlSchema.validateSettings(this, next);
    } else {
        this.settings[key] = value;
    }
    return this.settings[key];
};

EP.EffectBase.prototype.rebuild = function(mediaList) {
    this.dispose();
    this.lastError = null;
    this._runtimeFailed = false;
    if (EP.DeviceProfile) EP.DeviceProfile.applyEffectLOD(this);
    try {
        this.group = this.build(mediaList);
        if (this.group && this.settings.outputSize !== undefined && !this._handlesOutputSize) {
            var outputScale = Math.max(0.1, this.settings.outputSize / 100);
            this.group.scale.setScalar(outputScale);
        }
        if (this.settings.outputSize !== undefined) {
            applyFamilyFraming(this.meta && this.meta.category, Math.max(0.1, this.settings.outputSize / 100));
        }
    } catch (err) {
        this.lastError = err;
        console.error('Effect rebuild failed:', this.id, err);
        this.group = createFallbackGroup(this.meta && this.meta.name ? this.meta.name : this.id);
    }
    return this.group;
};

EP.EffectBase.prototype.getExportSettings = function() {
    return {
        id: this.id,
        meta: this.meta,
        settings: Object.assign({}, this.settings)
    };
};

function applyFamilyFraming(category, outputScale) {
    if (!EP.Core || !EP.Core.camera || outputScale <= 1) return;

    var camera = EP.Core.camera;
    var needsCameraRoom = category === '3d-perspective' ||
        category === 'carousel-flow' ||
        category === 'parallax' ||
        category === 'motion' ||
        category === 'glassmorphism';

    if (!needsCameraRoom) {
        camera.position.set(0, 0, 12);
        camera.fov = 45;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        return;
    }

    var safeScale = Math.min(outputScale, 8);
    var cameraZ = 12 + Math.max(0, safeScale - 1) * 1.35;
    camera.position.set(0, 0, cameraZ);
    camera.fov = Math.min(62, 45 + Math.max(0, safeScale - 1) * 1.8);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
}

function createFallbackGroup(label) {
    var group = new THREE.Group();
    var geo = new THREE.PlaneGeometry(5.6, 3.2);
    var mat = new THREE.MeshBasicMaterial({
        color: 0x15151c,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    if (typeof document !== 'undefined') {
        var canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#15151c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 10;
        ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 42px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Effect fallback', canvas.width / 2, 220);
        ctx.font = '28px Arial, sans-serif';
        ctx.fillText(label || 'Unknown effect', canvas.width / 2, 278);
        var tex = new THREE.CanvasTexture(canvas);
        mesh.material.map = tex;
        mesh.material.needsUpdate = true;
    }

    group.userData.isFallback = true;
    return group;
}
