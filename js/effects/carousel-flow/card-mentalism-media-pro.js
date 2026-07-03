(function() {
    var effect = new EP.EffectBase('card-mentalism-media-pro', {
        name: 'Card Mentalism Media PRO',
        category: 'carousel-flow',
        icon: 'CM',
        description: 'Truco matematico interactivo: el usuario piensa una carta/media y el sistema la revela usando busqueda binaria'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 120, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Motion Enabled' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Motion Speed', unit: '%' },
        {
            key: 'mediaGroups',
            type: 'slotGroups',
            label: 'Medios del truco',
            default: { cards: [0, 1, 2, 3, 4, 5, 6, 7, 8], backs: null, background: null },
            groups: [
                { key: 'cards', label: 'Cartas / imagenes del truco', mode: 'multi' },
                { key: 'backs', label: 'Reverso de cartas', mode: 'single' },
                { key: 'background', label: 'Fondo imagen/video', mode: 'single' }
            ]
        },
        { key: 'cardCount', type: 'range', min: 8, max: 20, default: 20, step: 1, label: 'Cartas del truco' },
        { key: 'visibleGroup', type: 'range', min: 8, max: 16, default: 14, step: 1, label: 'Cartas por pregunta' },
        { key: 'cardSize', type: 'range', min: 50, max: 180, default: 100, step: 1, label: 'Tamano cartas', unit: '%' },
        { key: 'fanSpread', type: 'range', min: 60, max: 220, default: 150, step: 1, label: 'Apertura abanico', unit: '%' },
        { key: 'glow', type: 'range', min: 0, max: 100, default: 55, step: 1, label: 'Brillo reveal', unit: '%' },
        { key: 'backgroundColor', type: 'color', default: '#020813', label: 'Color fondo' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: false,
        supportsVideo: true,
        usesCamera: true,
        usesPostProcessing: false,
        usesParticlesShaders: false,
        mobileRisk: 'medium',
        minMedia: 1,
        exportSafe: true,
        hasErrorBoundary: true
    };

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function slotMedia(groups, key, all, fallback) {
        var value = groups && groups[key];
        if (Array.isArray(value) && value.length) {
            return value.map(function(idx) { return all[idx]; }).filter(Boolean);
        }
        if (typeof value === 'number') return all[value] ? [all[value]] : [];
        return fallback || [];
    }

    function makeLabelTexture(lines, accent) {
        var c = document.createElement('canvas');
        c.width = 1024;
        c.height = 256;
        var ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = 'rgba(0,0,0,0.01)';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 62px Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = accent || '#00d8ff';
        ctx.shadowBlur = 22;
        ctx.fillText(lines[0] || '', 512, lines.length > 1 ? 88 : 128);
        if (lines[1]) {
            ctx.font = '600 34px Arial, sans-serif';
            ctx.shadowBlur = 10;
            ctx.fillText(lines[1], 512, 168);
        }
        var tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }

    function makeBackMaterial(media) {
        if (media) return EP.Media.createMaterial(media, { opacity: 1, side: THREE.DoubleSide });
        var c = document.createElement('canvas');
        c.width = 512;
        c.height = 720;
        var ctx = c.getContext('2d');
        var grad = ctx.createLinearGradient(0, 0, 512, 720);
        grad.addColorStop(0, '#0b1e46');
        grad.addColorStop(1, '#060912');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 720);
        ctx.strokeStyle = '#e8f8ff';
        ctx.lineWidth = 22;
        ctx.strokeRect(36, 36, 440, 648);
        ctx.strokeStyle = '#00d8ff';
        ctx.lineWidth = 6;
        ctx.strokeRect(72, 72, 368, 576);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 76px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EP', 256, 360);
        return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.DoubleSide, transparent: true });
    }

    effect._makeTextPlane = function(lines, y, scale, accent) {
        var tex = makeLabelTexture(lines, accent);
        var mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(7.6 * scale, 1.9 * scale),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
        );
        mesh.position.set(0, y, 0.08);
        mesh.userData.isText = true;
        return mesh;
    };

    effect._makeButton = function(label, action, x, y, color) {
        var c = document.createElement('canvas');
        c.width = 512;
        c.height = 180;
        var ctx = c.getContext('2d');
        ctx.fillStyle = color || '#111827';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.strokeRect(18, 18, c.width - 36, c.height - 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 58px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, c.width / 2, c.height / 2);
        var tex = new THREE.CanvasTexture(c);
        var mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1.65, 0.58),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
        );
        mesh.position.set(x, y, 0.32);
        mesh.userData.action = action;
        mesh.userData.isButton = true;
        return mesh;
    };

    effect._makeCard = function(media, backMedia, idx, total, mode) {
        var size = this.settings.cardSize / 100;
        var w = 0.82 * size;
        var h = 1.18 * size;
        var card = new THREE.Group();
        card.userData.cardIndex = idx;
        card.userData.media = media;
        var geo = EP.RoundedPlaneGeometry(w, h, 0.055 * size);
        var frontMat = media ? EP.Media.createMaterial(media, { opacity: 1, side: THREE.FrontSide }) :
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide });
        var front = new THREE.Mesh(geo, frontMat);
        front.position.z = 0.012;
        var back = new THREE.Mesh(geo.clone(), makeBackMaterial(backMedia));
        back.rotation.y = Math.PI;
        back.position.z = -0.012;
        card.add(front);
        card.add(back);

        var center = (total - 1) / 2;
        var spread = this.settings.fanSpread / 100;
        var dist = idx - center;
        var absDist = Math.abs(dist);
        var rowLift = mode === 'question' ? Math.sin(idx * 1.7) * 0.18 : 0;
        var arcLift = -0.44 - absDist * 0.024 * spread + rowLift;
        card.position.x = dist * 0.54 * spread;
        card.position.y = arcLift;
        card.position.z = idx * 0.035 + (mode === 'question' ? (idx % 3) * 0.05 : 0);
        card.rotation.z = dist * 0.105 * spread;
        card.rotation.y = mode === 'question' ? Math.sin(idx * 0.7) * 0.16 : 0;
        card.rotation.x = mode === 'question' ? Math.cos(idx * 0.5) * 0.035 : 0;
        return card;
    };

    effect._clearScene = function() {
        while (this._stage.children.length) {
            var child = this._stage.children.pop();
            child.traverse(function(obj) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (obj.material.map) obj.material.map.dispose();
                    obj.material.dispose();
                }
            });
        }
    };

    effect._resetTrick = function() {
        this._phase = 'pick';
        this._currentBit = 0;
        this._answerBits = 0;
        this._revealedIndex = -1;
        this._lastPhaseKey = '';
        this._renderPhase(true);
    };

    effect._buildDeck = function() {
        var groups = this.settings.mediaGroups || {};
        var all = (EP.Media && EP.Media.slots) ? EP.Media.slots : [];
        var source = slotMedia(groups, 'cards', all, (all || []).filter(Boolean));
        if (!source.length) source = (EP.Media && EP.Media.getAll) ? EP.Media.getAll() : [];
        if (!source.length) source = [null];
        source = source.filter(function(media, index, arr) {
            return media === null || arr.indexOf(media) === index;
        });
        var requested = clamp(Math.floor(this.settings.cardCount || 20), 1, 20);
        var count = Math.min(requested, source.length || 1);
        this._deck = [];
        for (var i = 0; i < count; i++) {
            this._deck.push({
                media: source[i],
                binaryValue: i + 1
            });
        }
        this._maxBits = Math.ceil(Math.log(count + 1) / Math.log(2));
        this._extras = (all || []).filter(function(media) {
            return media && source.indexOf(media) === -1;
        });
        this._backMedia = slotMedia(groups, 'backs', all, [])[0] || null;
        this._bgMedia = slotMedia(groups, 'background', all, [])[0] || null;
    };

    effect._questionGroup = function() {
        var bit = 1 << this._currentBit;
        var group = this._deck.filter(function(card) { return (card.binaryValue & bit) !== 0; });
        var visible = clamp(Math.floor(this.settings.visibleGroup || 14), 8, 16);
        var extras = (this._extras || []).map(function(media, idx) {
            return { media: media, binaryValue: 1000 + idx };
        });
        var combined = group.slice();
        var i = 0;
        while (combined.length < visible && extras.length) {
            combined.push(extras[(i * 3 + this._currentBit) % extras.length]);
            i++;
        }
        return combined.sort(function(a, b) { return ((a.binaryValue * 7 + bit) % 23) - ((b.binaryValue * 7 + bit) % 23); });
    };

    effect._renderPhase = function(force) {
        if (!this._stage) return;
        this._buildDeck();
        var key = this._phase + '|' + this._currentBit + '|' + this._answerBits + '|' + JSON.stringify(this.settings.mediaGroups || {}) + '|' + this.settings.cardCount + '|' + this.settings.visibleGroup + '|' + this.settings.cardSize;
        if (!force && key === this._lastPhaseKey) return;
        this._lastPhaseKey = key;
        this._clearScene();

        var bgColor = new THREE.Color(this.settings.backgroundColor || '#020813');
        if (this._background) {
            if (this._background.material.map) {
                this._background.material.map.dispose();
                this._background.material.map = null;
            }
            this._background.material.color = bgColor;
            if (this._bgMedia) this._background.material.map = EP.Media.createTexture(this._bgMedia);
            this._background.material.needsUpdate = true;
        }

        if (this._phase === 'pick') {
            this._stage.add(this._makeTextPlane(['PIENSA UNA CARTA', 'Elige una de estas ' + this._deck.length + ' cartas'], 2.35, 0.75, '#00d8ff'));
            for (var i = 0; i < this._deck.length; i++) {
                this._stage.add(this._makeCard(this._deck[i].media, this._backMedia, i, this._deck.length, 'pick'));
            }
            this._stage.add(this._makeButton('EMPEZAR', 'start', 0, -2.35, '#0f766e'));
        } else if (this._phase === 'question') {
            this._stage.add(this._makeTextPlane(['VES TU CARTA?', 'Pregunta ' + (this._currentBit + 1) + ' de ' + this._maxBits], 2.35, 0.68, '#64ffda'));
            var cards = this._questionGroup();
            for (var j = 0; j < cards.length; j++) {
                this._stage.add(this._makeCard(cards[j].media, this._backMedia, j, cards.length, 'question'));
            }
            this._stage.add(this._makeButton('SI', 'yes', -1.15, -2.35, '#166534'));
            this._stage.add(this._makeButton('NO', 'no', 1.15, -2.35, '#7f1d1d'));
        } else {
            var idx = clamp(this._answerBits - 1, 0, this._deck.length - 1);
            var card = this._deck[idx];
            this._revealedIndex = idx;
            this._stage.add(this._makeTextPlane(['ESTABAS PENSANDO EN', 'Carta #' + (idx + 1)], 2.35, 0.72, '#a6ff00'));
            var reveal = this._makeCard(card.media, this._backMedia, 0, 1, 'reveal');
            reveal.userData.isReveal = true;
            reveal.position.set(0, -0.25, 0.25);
            reveal.scale.setScalar(2.15);
            this._stage.add(reveal);
            this._stage.add(this._makeButton('REINICIAR', 'reset', 0, -2.35, '#1d4ed8'));
        }
    };

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._stage = new THREE.Group();
        this._background = new THREE.Mesh(
            new THREE.PlaneGeometry(14, 8),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(this.settings.backgroundColor), side: THREE.DoubleSide, transparent: true, opacity: 1 })
        );
        this._background.position.z = -2.2;
        group.add(this._background);
        group.add(this._stage);

        this._pointerDown = function(e) {
            if (!EP.Core || !EP.Core.renderer) return;
            var rect = EP.Core.renderer.domElement.getBoundingClientRect();
            var mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            this._raycaster = this._raycaster || new THREE.Raycaster();
            this._raycaster.setFromCamera(mouse, EP.Core.camera);
            var hits = this._raycaster.intersectObjects(this._stage.children, true);
            var action = null;
            for (var i = 0; i < hits.length; i++) {
                var obj = hits[i].object;
                while (obj && obj !== this._stage) {
                    if (obj.userData && obj.userData.action) {
                        action = obj.userData.action;
                        break;
                    }
                    obj = obj.parent;
                }
                if (action) break;
            }
            if (!action) return;

            if (this._phase === 'pick' && action === 'start') {
                this._phase = 'question';
                this._currentBit = 0;
                this._answerBits = 0;
            } else if (this._phase === 'question' && (action === 'yes' || action === 'no')) {
                if (action === 'yes') this._answerBits += 1 << this._currentBit;
                this._currentBit++;
                if (this._currentBit >= this._maxBits) {
                    this._phase = 'reveal';
                }
            } else if (this._phase === 'reveal' && action === 'reset') {
                this._resetTrick();
                return;
            } else {
                return;
            }
            this._renderPhase(true);
        }.bind(this);
        if (EP.Core && EP.Core.renderer) {
            EP.Core.renderer.domElement.addEventListener('pointerdown', this._pointerDown);
        }
        this._resetTrick();
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = (this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100);
        this._renderPhase(false);
        this._stage.children.forEach(function(child) {
            if (child.userData && child.userData.cardIndex !== undefined) {
                var i = child.userData.cardIndex;
                child.position.y += Math.sin(time * 1.5 * speed + i * 0.55) * 0.0025 * speed;
                child.rotation.y += Math.sin(time * 0.9 * speed + i) * 0.0015 * speed;
            }
            if (child.userData && child.userData.isReveal) {
                var pulse = 1 + Math.sin(time * 2.4 * speed) * 0.035 * (effect.settings.glow / 100);
                child.scale.setScalar(2.15 * pulse);
                child.rotation.z = Math.sin(time * 0.8 * speed) * 0.04;
            }
            child.traverse(function(obj) {
                if (obj.material) EP.Media.updateMaterial(obj.material);
            });
        });
        if (this._background && this._background.material) EP.Media.updateMaterial(this._background.material);
        EP.Core.camera.position.set(0, 0.1, 7.8);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (EP.Core && EP.Core.renderer && this._pointerDown) {
            EP.Core.renderer.domElement.removeEventListener('pointerdown', this._pointerDown);
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
        this._stage = null;
        this._pointerDown = null;
    };

    EP.Registry.register(effect);
})();
