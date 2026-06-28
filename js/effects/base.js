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
    return this.group;
};

EP.EffectBase.prototype.getExportSettings = function() {
    return {
        id: this.id,
        meta: this.meta,
        settings: Object.assign({}, this.settings)
    };
};
