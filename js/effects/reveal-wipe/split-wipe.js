(function() {
    var effect = new EP.EffectBase('split-wipe', {
        name: 'Split Screen Wipe',
        category: 'reveal-wipe',
        icon: '🚪',
        description: 'Paneles que se abren como puertas revelando la siguiente imagen'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'panels', type: 'range', min: 2, max: 6, default: 2, step: 1, label: 'Panels' },
        { key: 'transitionSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Transition', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 4, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'snappy', 'overshoot'], default: 'snappy', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080810', label: 'Background' }
    ]);
    effect._handlesOutputSize = true;
    effect._handlesMotionControls = true;

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var outputScale = this.settings.outputSize / 100;
        var w = 7 * outputScale, h = 5 * outputScale;
        var panels = this.settings.panels;
        var cr = this.settings.cornerRadius / 100 * h * 0.3;

        for (var img = 0; img < mediaList.length; img++) {
            var imgGroup = new THREE.Group();
            var panelW = w / panels;
            for (var p = 0; p < panels; p++) {
                var geo = EP.RoundedPlaneGeometry(panelW - 0.02, h, cr);
                var mat = EP.Media.createMaterial(mediaList[img]);
                mat.transparent = true;
                var mesh = new THREE.Mesh(geo, mat);
                var offsetX = -w / 2 + panelW / 2 + p * panelW;
                mesh.position.set(offsetX, 0, 0);

                var uvAttr = geo.attributes.uv;
                for (var i = 0; i < uvAttr.count; i++) {
                    var u = uvAttr.getX(i);
                    uvAttr.setX(i, (u + p) / panels);
                }
                uvAttr.needsUpdate = true;

                mesh.userData = {
                    panelIndex: p,
                    totalPanels: panels,
                    baseX: offsetX,
                    openDistance: 4 * outputScale,
                    direction: p % 2 === 0 ? -1 : 1
                };
                imgGroup.add(mesh);
            }
            imgGroup.userData = { imageIndex: img, totalImages: mediaList.length };
            imgGroup.visible = false;
            group.add(imgGroup);
        }
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var motionOn = this.settings.playbackMotion !== 'off';
        var motionSpeed = motionOn ? this.settings.playbackMotionSpeed / 100 : 0;
        var t = motionOn ? (time * motionSpeed) / loopDuration : 0.5;
        t = t % 1;
        var count = this.group.children.length;
        var segDur = 1 / count;
        var transSpeed = this.settings.transitionSpeed / 100;
        var transDur = segDur * transSpeed * 0.5;

        this.group.children.forEach(function(imgGroup, idx) {
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;
            var showStart = segStart;
            var hideStart = segEnd - transDur;

            if (t >= showStart && t < segEnd) {
                imgGroup.visible = true;
                imgGroup.children.forEach(function(panel) {
                    var d = panel.userData;
                    var enterT = Math.max(0, Math.min(1, (t - showStart) / transDur));
                    var exitT = t >= hideStart ? Math.max(0, Math.min(1, (t - hideStart) / transDur)) : 0;
                    var openAmount = (1 - enterT) + exitT;
                    openAmount = Math.max(0, Math.min(1, openAmount));
                    panel.position.x = d.baseX + d.direction * openAmount * d.openDistance;
                    panel.rotation.y = d.direction * openAmount * Math.PI * 0.3;
                    panel.material.opacity = 1 - openAmount * 0.5;
                    EP.Media.updateMaterial(panel.material);
                });
            } else {
                imgGroup.visible = false;
            }
        });
    };

    EP.Registry.register(effect);
})();
