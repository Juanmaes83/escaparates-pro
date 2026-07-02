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
    this.controlsDef = controlsDef || [];
    this.settings = {};
    this.group = null;
    this.controlsDef.forEach(function(c) {
        this.settings[c.key] = c.default !== undefined ? c.default : null;
    }.bind(this));
};

EP.EffectBase.prototype.build = function(mediaList) {
    return new THREE.Group();
};

EP.EffectBase.prototype.update = function(time, dt, loopDuration) {
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
    this.settings[key] = value;
};

EP.EffectBase.prototype.rebuild = function(mediaList) {
    this.dispose();
    this.group = this.build(mediaList);
    if (this.group && this.settings.outputSize !== undefined && !this._handlesOutputSize) {
        var outputScale = Math.max(0.1, this.settings.outputSize / 100);
        this.group.scale.setScalar(outputScale);
    }
    if (this.settings.outputSize !== undefined) {
        applyFamilyFraming(this.meta && this.meta.category, Math.max(0.1, this.settings.outputSize / 100));
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
