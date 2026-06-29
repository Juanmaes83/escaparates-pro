(function() {
    var effect = new EP.EffectBase('neon-accordion', {
        name: 'Neon Accordion',
        category: 'reveal-wipe',
        icon: '🎆',
        description: 'Galeria acordeon cinematica con paneles expandibles, bordes neon y modo ambiente'
    }, [
        { key: 'panelCount', type: 'range', min: 3, max: 9, default: 5, step: 1, label: 'Panels' },
        { key: 'expandRatio', type: 'range', min: 30, max: 80, default: 55, label: 'Expand Ratio', unit: '%' },
        { key: 'neonIntensity', type: 'range', min: 0, max: 100, default: 60, label: 'Neon Glow', unit: '%' },
        { key: 'neonColor', type: 'color', default: '#00eaff', label: 'Neon Color' },
        { key: 'ambientMode', type: 'select', options: ['Off', 'Pulse', 'Breathe'], default: 'Pulse', label: 'Ambient Mode' },
        { key: 'gap', type: 'range', min: 0, max: 20, default: 4, label: 'Gap', unit: 'px' },
        { key: 'transitionSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Transition', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#05070c', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var panels = this.settings.panelCount;
        var totalWidth = 10;
        var panelHeight = 5;
        var gapVal = this.settings.gap / 100;

        for (var i = 0; i < panels; i++) {
            var panelGroup = new THREE.Group();
            panelGroup.userData = { panelIndex: i, currentWidth: 0, targetWidth: 0 };

            var imgIdx = i % mediaList.length;
            var geo = new THREE.PlaneGeometry(1, panelHeight);
            var mat = EP.Media.createMaterial(mediaList[imgIdx]);
            mat.transparent = true;
            var mesh = new THREE.Mesh(geo, mat);
            mesh.userData = { isImage: true };
            panelGroup.add(mesh);

            var neonColor = new THREE.Color(this.settings.neonColor);
            var edgeMat = new THREE.MeshBasicMaterial({
                color: neonColor,
                transparent: true,
                opacity: 0,
                depthWrite: false
            });

            var leftEdge = new THREE.Mesh(new THREE.PlaneGeometry(0.03, panelHeight), edgeMat.clone());
            leftEdge.position.z = 0.01;
            leftEdge.userData = { isEdge: true, side: 'left' };
            panelGroup.add(leftEdge);

            var rightEdge = new THREE.Mesh(new THREE.PlaneGeometry(0.03, panelHeight), edgeMat.clone());
            rightEdge.position.z = 0.01;
            rightEdge.userData = { isEdge: true, side: 'right' };
            panelGroup.add(rightEdge);

            var topEdge = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.03), edgeMat.clone());
            topEdge.position.z = 0.01;
            topEdge.position.y = panelHeight / 2;
            topEdge.userData = { isEdge: true, side: 'top' };
            panelGroup.add(topEdge);

            var botEdge = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.03), edgeMat.clone());
            botEdge.position.z = 0.01;
            botEdge.position.y = -panelHeight / 2;
            botEdge.userData = { isEdge: true, side: 'bottom' };
            panelGroup.add(botEdge);

            group.add(panelGroup);
        }

        this._totalWidth = totalWidth;
        this._panelHeight = panelHeight;
        this._activeIndex = 0;
        this._lastSwitch = 0;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var panels = this.settings.panelCount;
        var expandRatio = this.settings.expandRatio / 100;
        var neonIntensity = this.settings.neonIntensity / 100;
        var ambientMode = this.settings.ambientMode;
        var gapVal = this.settings.gap * 0.01;
        var transSpeed = this.settings.transitionSpeed / 100;
        var totalWidth = this._totalWidth;

        var panelGroups = [];
        for (var c = 0; c < this.group.children.length; c++) {
            if (this.group.children[c].userData.panelIndex !== undefined) {
                panelGroups.push(this.group.children[c]);
            }
        }
        var count = panelGroups.length;
        if (count === 0) return;

        var activeIdx = Math.floor(t * count * 2) % count;
        var collapsedWidth = totalWidth * (1 - expandRatio) / (count - 1);
        var expandedWidth = totalWidth * expandRatio;
        var lerpFactor = 0.05 + transSpeed * 0.1;

        var totalGap = gapVal * (count - 1);
        var availWidth = totalWidth - totalGap;

        var xPos = -totalWidth / 2;

        for (var i = 0; i < count; i++) {
            var pg = panelGroups[i];
            var isActive = (i === activeIdx);
            var targetW = isActive ? availWidth * expandRatio : availWidth * (1 - expandRatio) / (count - 1);

            pg.userData.targetWidth = targetW;
            pg.userData.currentWidth += (pg.userData.targetWidth - pg.userData.currentWidth) * lerpFactor;
            var w = pg.userData.currentWidth;

            pg.position.x = xPos + w / 2;
            xPos += w + gapVal;

            for (var j = 0; j < pg.children.length; j++) {
                var child = pg.children[j];
                if (child.userData.isImage) {
                    child.scale.x = w;
                    child.material.opacity = isActive ? 1.0 : 0.4;
                } else if (child.userData.isEdge) {
                    var glow = isActive ? neonIntensity : neonIntensity * 0.15;

                    if (ambientMode === 'Pulse') {
                        glow *= 0.7 + Math.sin(time * 3 + i * 0.5) * 0.3;
                    } else if (ambientMode === 'Breathe') {
                        glow *= 0.5 + Math.sin(time * 1.5) * 0.5;
                    }

                    child.material.opacity = glow;

                    if (child.userData.side === 'left') {
                        child.position.x = -w / 2;
                    } else if (child.userData.side === 'right') {
                        child.position.x = w / 2;
                    } else if (child.userData.side === 'top' || child.userData.side === 'bottom') {
                        child.scale.x = w;
                    }
                }
            }

            pg.position.z = isActive ? 0.2 : 0;

            var tiltX = isActive ? Math.sin(time * 0.5) * 0.02 : 0;
            var tiltY = isActive ? Math.cos(time * 0.4) * 0.03 : 0;
            pg.rotation.x = tiltX;
            pg.rotation.y = tiltY;
        }

        EP.Core.camera.position.set(0, 0, 7);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
