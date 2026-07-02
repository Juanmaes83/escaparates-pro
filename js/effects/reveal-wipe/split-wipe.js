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
        { key: 'direction', type: 'select', options: [{ v: 'horizontal', l: 'Horizontal' }, { v: 'vertical', l: 'Vertical' }, { v: 'diagonal', l: 'Diagonal' }], default: 'horizontal', label: 'Dirección' },
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
            var panelH = h / panels;
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
                    baseY: 0,
                    openDistanceH: 4 * outputScale,
                    openDistanceV: 3 * outputScale,
                    directionH: p % 2 === 0 ? -1 : 1,
                    directionV: p % 2 === 0 ? 1 : -1
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
        var dir = this.settings.direction || 'horizontal';

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

                    if (dir === 'horizontal') {
                        // Original: panels open left/right like doors
                        panel.position.x = d.baseX + d.directionH * openAmount * d.openDistanceH;
                        panel.position.y = d.baseY;
                        panel.rotation.y = d.directionH * openAmount * Math.PI * 0.3;
                        panel.rotation.x = 0;
                    } else if (dir === 'vertical') {
                        // Panels open up/down as horizontal strips
                        panel.position.x = d.baseX;
                        panel.position.y = d.baseY + d.directionV * openAmount * d.openDistanceV;
                        panel.rotation.x = d.directionV * openAmount * Math.PI * 0.25;
                        panel.rotation.y = 0;
                    } else if (dir === 'diagonal') {
                        // Diagonal: odd panels slide up-left, even slide down-right
                        var diagDir = d.panelIndex % 2 === 0 ? 1 : -1;
                        panel.position.x = d.baseX + diagDir * openAmount * d.openDistanceH * 0.7;
                        panel.position.y = d.baseY + diagDir * openAmount * d.openDistanceV * 0.7;
                        panel.rotation.y = diagDir * openAmount * Math.PI * 0.2;
                        panel.rotation.x = diagDir * openAmount * Math.PI * 0.15;
                    }

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
