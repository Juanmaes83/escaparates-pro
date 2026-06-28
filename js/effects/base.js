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
