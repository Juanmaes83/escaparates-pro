(function() {
    var effect = new EP.EffectBase('card-flip-3d', {
        name: '3D Card Flip',
        category: '3d-perspective',
        icon: '🃏',
        description: 'Slideshow de cards con rotacion 3D perspective — giro, volteo y profundidad cinematica'
    }, [
        { key: 'cardSize', type: 'range', min: 40, max: 100, default: 70, label: 'Card Size', unit: '%' },
        { key: 'flipStyle', type: 'select', options: ['Horizontal', 'Vertical', 'Diagonal', 'Random'], default: 'Horizontal', label: 'Flip Style' },
        { key: 'depth', type: 'range', min: 10, max: 100, default: 50, label: 'Depth', unit: '%' },
        { key: 'rotSpeed', type: 'range', min: 10, max: 100, default: 40, label: 'Rotation Speed', unit: '%' },
        { key: 'perspective', type: 'range', min: 20, max: 100, default: 60, label: 'Perspective', unit: '%' },
        { key: 'shadow', type: 'select', options: ['Off', 'Soft', 'Hard'], default: 'Soft', label: 'Shadow' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 5, label: 'Corner Radius', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var scale = this.settings.cardSize / 100 * 4;
        var cr = this.settings.cornerRadius / 100 * scale * 0.15;

        for (var i = 0; i < mediaList.length; i++) {
            var cardGroup = new THREE.Group();
            cardGroup.userData = { imageIndex: i };
            cardGroup.visible = false;

            var aspect = 1;
            if (mediaList[i].element) {
                var ew = mediaList[i].element.videoWidth || mediaList[i].element.naturalWidth || mediaList[i].element.width || 1;
                var eh = mediaList[i].element.videoHeight || mediaList[i].element.naturalHeight || mediaList[i].element.height || 1;
                aspect = ew / eh;
            }

            var w, h;
            if (aspect >= 1) { w = scale; h = scale / aspect; }
            else { h = scale; w = scale * aspect; }

            var geo = EP.RoundedPlaneGeometry(w, h, cr);
            var mat = EP.Media.createMaterial(mediaList[i]);
            mat.side = THREE.DoubleSide;
            var frontMesh = new THREE.Mesh(geo, mat);
            cardGroup.add(frontMesh);

            var backGeo = EP.RoundedPlaneGeometry(w, h, cr);
            var backMat = new THREE.MeshBasicMaterial({
                color: 0x1a1a2e,
                side: THREE.DoubleSide
            });
            var backMesh = new THREE.Mesh(backGeo, backMat);
            backMesh.rotation.y = Math.PI;
            backMesh.position.z = -0.01;
            cardGroup.add(backMesh);

            if (this.settings.shadow !== 'Off') {
                var shadowGeo = new THREE.PlaneGeometry(w * 1.1, h * 0.15);
                var shadowMat = new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: this.settings.shadow === 'Hard' ? 0.4 : 0.2,
                    depthWrite: false
                });
                var shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
                shadowMesh.position.y = -h / 2 - 0.2;
                shadowMesh.position.z = -0.5;
                shadowMesh.rotation.x = -Math.PI / 6;
                cardGroup.add(shadowMesh);
            }

            group.add(cardGroup);
        }

        var ambLight = new THREE.AmbientLight(0xffffff, 1.0);
        ambLight.userData = { isLight: true };
        group.add(ambLight);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var flipStyle = this.settings.flipStyle;
        var depth = this.settings.depth / 100;
        var rotSpeed = this.settings.rotSpeed / 100;
        var perspective = this.settings.perspective / 100;

        var cards = [];
        for (var c = 0; c < this.group.children.length; c++) {
            if (this.group.children[c].userData && this.group.children[c].userData.imageIndex !== undefined) {
                cards.push(this.group.children[c]);
            }
        }
        var count = cards.length;
        if (count === 0) return;
        var segDur = 1 / count;

        for (var idx = 0; idx < count; idx++) {
            var card = cards[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                card.visible = true;
                var lt = (t - segStart) / segDur;

                var enterPhase = Math.min(1, lt / 0.25);
                var exitPhase = Math.max(0, (lt - 0.75) / 0.25);
                enterPhase = enterPhase * enterPhase * (3 - 2 * enterPhase);
                exitPhase = exitPhase * exitPhase * (3 - 2 * exitPhase);

                var enterAngle, exitAngle;
                var style = flipStyle;
                if (style === 'Random') {
                    var styles = ['Horizontal', 'Vertical', 'Diagonal'];
                    style = styles[idx % 3];
                }

                if (style === 'Horizontal') {
                    card.rotation.y = (1 - enterPhase) * Math.PI + exitPhase * (-Math.PI);
                    card.rotation.x = Math.sin(lt * Math.PI) * 0.1 * rotSpeed;
                    card.rotation.z = 0;
                } else if (style === 'Vertical') {
                    card.rotation.x = (1 - enterPhase) * Math.PI + exitPhase * (-Math.PI);
                    card.rotation.y = Math.sin(lt * Math.PI) * 0.1 * rotSpeed;
                    card.rotation.z = 0;
                } else {
                    card.rotation.y = (1 - enterPhase) * Math.PI * 0.7 + exitPhase * (-Math.PI * 0.7);
                    card.rotation.x = (1 - enterPhase) * Math.PI * 0.5 + exitPhase * (-Math.PI * 0.5);
                    card.rotation.z = Math.sin(lt * Math.PI) * 0.05;
                }

                var zBounce = Math.sin(lt * Math.PI) * depth * 2;
                card.position.z = zBounce;
                card.position.x = 0;
                card.position.y = 0;

                var s = enterPhase * (1 - exitPhase);
                card.scale.setScalar(Math.max(0.01, s));
            } else {
                card.visible = false;
            }
        }

        var camDist = 6 + (1 - perspective) * 4;
        EP.Core.camera.position.set(
            Math.sin(t * Math.PI * 2) * 0.3,
            Math.cos(t * Math.PI * 1.5) * 0.2,
            camDist
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
