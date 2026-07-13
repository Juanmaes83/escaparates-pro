// Text Curtain PRO - based on create-text-curtain (MIT).
// Each vertical character strand keeps the pinned-top, tension and damping
// simulation from the source while the platform supplies media and export.
(function() {
    var effect = new EP.EffectBase('text-curtain-pro', {
        name: 'Text Curtain PRO',
        category: 'text',
        icon: 'TC',
        description: 'Cortina tipografica fisica: columnas de caracteres que se apartan con raton o tactil sobre imagen o video'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'text', type: 'text', default: 'ESCAPARATES PRO VISUAL STORIES MADE TO MOVE ', label: 'Texto de la cortina', maxLength: 220 },
        { key: 'fontFamily', type: 'select', options: [{ v: 'sans-serif', l: 'Sans' }, { v: 'serif', l: 'Serif' }, { v: 'monospace', l: 'Mono' }], default: 'sans-serif', label: 'Familia tipografica' },
        { key: 'fontWeight', type: 'select', options: [{ v: '400', l: 'Regular' }, { v: '600', l: 'Semibold' }, { v: '800', l: 'Extra bold' }], default: '600', label: 'Peso tipografico' },
        { key: 'textColor', type: 'color', default: '#fff5e6', label: 'Color texto' },
        { key: 'textOpacity', type: 'range', min: 10, max: 100, default: 94, step: 1, label: 'Opacidad texto', unit: '%' },
        { key: 'strandDensity', type: 'range', min: 20, max: 100, default: 56, step: 1, label: 'Densidad de hebras', unit: '%' },
        { key: 'rowSpacing', type: 'range', min: 12, max: 34, default: 20, step: 1, label: 'Espacio vertical', unit: 'px' },
        { key: 'tension', type: 'range', min: 2, max: 28, default: 12, step: 1, label: 'Tension de la cortina', unit: '%' },
        { key: 'damping', type: 'range', min: 84, max: 99, default: 98, step: 1, label: 'Amortiguacion', unit: '%' },
        { key: 'pointerRadius', type: 'range', min: 24, max: 140, default: 58, step: 2, label: 'Radio de interaccion', unit: 'px' },
        { key: 'interactionForce', type: 'range', min: 20, max: 220, default: 100, step: 5, label: 'Fuerza del gesto', unit: '%' },
        { key: 'ambientWind', type: 'range', min: 0, max: 100, default: 0, step: 1, label: 'Brisa automatica', unit: '%' },
        { key: 'windDirection', type: 'select', options: [{ v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'alternate', l: 'Alterna' }], default: 'alternate', label: 'Direccion de brisa' },
        { key: 'cardSize', type: 'range', min: 35, max: 100, default: 68, step: 1, label: 'Tamano del card superior', unit: '%' },
        { key: 'cardHeight', type: 'range', min: 45, max: 120, default: 68, step: 1, label: 'Proporcion del card', unit: '%' },
        { key: 'cardY', type: 'range', min: 10, max: 62, default: 36, step: 1, label: 'Altura del card', unit: '%' },
        { key: 'cardRadius', type: 'range', min: 0, max: 24, default: 8, step: 1, label: 'Radio del card', unit: '%' },
        { key: 'cardBorder', type: 'range', min: 0, max: 100, default: 28, step: 1, label: 'Borde del card', unit: '%' },
        { key: 'mediaOpacity', type: 'range', min: 10, max: 100, default: 100, step: 1, label: 'Opacidad imagen/video', unit: '%' },
        { key: 'background', type: 'color', default: '#0c0d12', label: 'Fondo sin medio' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: true,
        usesCamera: false,
        usesPostProcessing: false,
        usesParticlesShaders: false,
        mobileRisk: 'low',
        minMedia: 0,
        exportSafe: true,
        hasErrorBoundary: true
    };

    var W = 1024;
    var H = 576;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function cleanText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim() || 'ESCAPARATES PRO ';
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var medium = mediaList && mediaList[0];
        var bgGeo = new THREE.PlaneGeometry(8, 4.5);
        var bgMat = new THREE.MeshBasicMaterial({ color: this.settings.background });
        this._backgroundMaterial = bgMat;
        var bgMesh = new THREE.Mesh(bgGeo, bgMat);
        bgMesh.position.z = -0.02;
        group.add(bgMesh);

        // The uploaded asset is a deliberate editorial card, not a full-frame
        // background. This preserves the curtain as the primary movement.
        var cardGroup = new THREE.Group();
        var cardW = 5.44 * (this.settings.cardSize / 68);
        var cardH = cardW * (this.settings.cardHeight / 100);
        var radius = cardW * (this.settings.cardRadius / 100) * 0.28;
        var shadow = new THREE.Mesh(
            EP.RoundedPlaneGeometry(cardW + 0.18, cardH + 0.18, radius + 0.05),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.36 })
        );
        shadow.position.set(0.08, -0.1, 0);
        cardGroup.add(shadow);
        var border = new THREE.Mesh(
            EP.RoundedPlaneGeometry(cardW + 0.08, cardH + 0.08, radius + 0.025),
            new THREE.MeshBasicMaterial({ color: 0xfff5e6, transparent: true, opacity: this.settings.cardBorder / 100 })
        );
        border.position.z = 0.01;
        cardGroup.add(border);
        var cardMat = medium ? EP.Media.createMaterial(medium) : new THREE.MeshBasicMaterial({ color: 0x20222c });
        cardMat.transparent = !!medium;
        if (medium) cardMat.opacity = this.settings.mediaOpacity / 100;
        var card = new THREE.Mesh(EP.RoundedPlaneGeometry(cardW, cardH, radius), cardMat);
        card.position.z = 0.025;
        cardGroup.add(card);
        cardGroup.position.y = 1.55 - (this.settings.cardY / 100) * 3.1;
        cardGroup.position.z = 0.12;
        cardGroup.userData = { baseW: cardW, baseH: cardH };
        group.add(cardGroup);
        this._cardGroup = cardGroup;
        this._cardMediaMaterial = cardMat;
        this._cardBorder = border;

        this._canvas = document.createElement('canvas');
        this._canvas.width = W;
        this._canvas.height = H;
        this._ctx = this._canvas.getContext('2d');
        this._texture = new THREE.CanvasTexture(this._canvas);
        this._texture.minFilter = THREE.LinearFilter;
        this._texture.magFilter = THREE.LinearFilter;
        var curtainMat = new THREE.MeshBasicMaterial({
            map: this._texture,
            transparent: true,
            depthWrite: false
        });
        var curtainMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), curtainMat);
        curtainMesh.position.z = 0.05;
        group.add(curtainMesh);

        this._pointer = { x: W * 0.5, y: H * 0.5, visible: false, previous: null, previousTime: 0 };
        this._strands = [];
        this._lastLayoutKey = '';
        this._lastWindTime = 0;
        this._buildCurtain();

        var self = this;
        this._onPointerMove = function(event) {
            if (!self._pointer || self.settings.playbackMotion === 'off') return;
            var canvas = EP.Core && EP.Core.renderer ? EP.Core.renderer.domElement : null;
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            var point = {
                x: clamp((event.clientX - rect.left) / rect.width * W, 0, W),
                y: clamp((event.clientY - rect.top) / rect.height * H, 0, H)
            };
            self._strikeCurtain(point, event.timeStamp || Date.now());
        };
        this._onPointerLeave = function() {
            if (!self._pointer) return;
            self._pointer.visible = false;
            self._pointer.previous = null;
        };
        var rendererCanvas = EP.Core && EP.Core.renderer ? EP.Core.renderer.domElement : null;
        if (rendererCanvas) {
            rendererCanvas.addEventListener('pointermove', this._onPointerMove, { passive: true });
            rendererCanvas.addEventListener('pointerleave', this._onPointerLeave, { passive: true });
            this._interactionCanvas = rendererCanvas;
        }

        this.group = group;
        return group;
    };

    effect._layoutKey = function() {
        return [this.settings.text, this.settings.strandDensity, this.settings.rowSpacing].join('|');
    };

    effect._buildCurtain = function() {
        if (!this._strands) return;
        var density = this.settings.strandDensity / 100;
        var gapX = clamp(32 - density * 24, 8, 28);
        var gapY = this.settings.rowSpacing;
        var marginX = clamp(gapX * 1.7, 18, 38);
        var marginY = clamp(gapY * 1.4, 22, 42);
        var columns = Math.max(6, Math.floor((W - marginX * 2) / gapX));
        var rows = Math.max(4, Math.floor((H - marginY * 2) / gapY));
        var copy = cleanText(this.settings.text);
        var index = 0;
        this._strands = [];
        this._layout = { gapX: gapX, gapY: gapY, marginX: marginX, marginY: marginY };

        for (var column = 0; column < columns; column++) {
            var strand = { x: marginX + column * gapX, phase: Math.sin(column * 19.73) || 1, beads: [], accelerations: new Float32Array(rows) };
            for (var row = 0; row < rows; row++) {
                strand.beads.push({
                    offset: 0,
                    velocity: 0,
                    drawX: strand.x,
                    drawY: marginY + row * gapY,
                    rotation: 0,
                    character: copy[index % copy.length]
                });
                index++;
            }
            this._strands.push(strand);
        }
        this._lastLayoutKey = this._layoutKey();
    };

    effect._strikeCurtain = function(point, eventTime) {
        var pointer = this._pointer;
        if (!pointer) return;
        if (!pointer.previous) {
            pointer.previous = point;
            pointer.previousTime = eventTime;
            pointer.x = point.x;
            pointer.y = point.y;
            pointer.visible = true;
            return;
        }
        var elapsed = clamp(eventTime - pointer.previousTime || 16, 8, 34);
        var frameScale = 16.67 / elapsed;
        var moveX = clamp((point.x - pointer.previous.x) * frameScale, -18, 18);
        var moveY = clamp((point.y - pointer.previous.y) * frameScale, -18, 18);
        var speed = Math.hypot(moveX, moveY);
        var layout = this._layout;
        var radius = this.settings.pointerRadius;
        var force = this.settings.interactionForce / 100;

        for (var s = 0; s < this._strands.length; s++) {
            var strand = this._strands[s];
            var approximateRow = Math.round((point.y - layout.marginY) / layout.gapY);
            var firstRow = Math.max(1, approximateRow - 4);
            var lastRow = Math.min(strand.beads.length - 1, approximateRow + 4);
            for (var row = firstRow; row <= lastRow; row++) {
                var bead = strand.beads[row];
                var dx = strand.x + bead.offset - point.x;
                var dy = bead.drawY - point.y;
                var distance = Math.hypot(dx, dy);
                if (distance >= radius) continue;
                var influence = Math.pow(1 - distance / radius, 2);
                var fallback = Math.sign(strand.x - point.x) || Math.sign(strand.phase);
                var direction = Math.abs(moveX) > 0.35 ? Math.sign(moveX) : fallback;
                var impulse = (moveX * 0.16 + fallback * (speed * 0.1 + 0.45)) * influence * force;
                bead.velocity += impulse;
                for (var reach = 1; reach <= 3; reach++) {
                    var spread = impulse * Math.pow(0.38, reach);
                    if (strand.beads[row - reach]) strand.beads[row - reach].velocity += spread * direction;
                    if (strand.beads[row + reach]) strand.beads[row + reach].velocity += spread * direction;
                }
            }
        }
        pointer.previous = point;
        pointer.previousTime = eventTime;
        pointer.x = point.x;
        pointer.y = point.y;
        pointer.visible = true;
    };

    effect._simulateStrand = function(strand, motionScale) {
        var beads = strand.beads;
        var accelerations = strand.accelerations;
        var tension = this.settings.tension / 100;
        var damping = Math.pow(this.settings.damping / 100, motionScale);
        var gapY = this._layout.gapY;
        for (var row = 1; row < beads.length; row++) {
            var bead = beads[row];
            var previousOffset = row === 1 ? 0 : beads[row - 1].offset;
            var nextOffset = row === beads.length - 1 ? bead.offset : beads[row + 1].offset;
            var stringTension = (previousOffset + nextOffset - bead.offset * 2) * tension;
            var lengthRatio = row / Math.max(1, beads.length - 1);
            var gravity = -bead.offset * (0.0062 - lengthRatio * 0.0028);
            var nonlinearLimit = -Math.sign(bead.offset) * Math.pow(Math.abs(bead.offset) / 220, 3) * 0.7;
            accelerations[row] = stringTension + gravity + nonlinearLimit;
        }
        beads[0].offset = 0;
        beads[0].velocity = 0;
        for (var index = 1; index < beads.length; index++) {
            var movingBead = beads[index];
            movingBead.velocity = (movingBead.velocity + accelerations[index] * motionScale) * damping;
            movingBead.velocity = clamp(movingBead.velocity, -6, 6);
            movingBead.offset = clamp(movingBead.offset + movingBead.velocity * motionScale, -Math.min(76, W * 0.1), Math.min(76, W * 0.1));
        }
        var previousX = strand.x;
        var previousY = this._layout.marginY;
        beads[0].drawX = previousX;
        beads[0].drawY = previousY;
        beads[0].rotation = 0;
        for (var drawRow = 1; drawRow < beads.length; drawRow++) {
            var drawBead = beads[drawRow];
            var desiredX = strand.x + drawBead.offset;
            var segmentX = desiredX - previousX;
            var constrainedX = clamp(segmentX, -gapY * 0.91, gapY * 0.91);
            var segmentY = Math.sqrt(Math.max(1, gapY * gapY - constrainedX * constrainedX));
            drawBead.drawX = previousX + constrainedX;
            drawBead.drawY = previousY + segmentY;
            drawBead.rotation = Math.atan2(constrainedX, segmentY) * 0.72;
            previousX = drawBead.drawX;
            previousY = drawBead.drawY;
        }
    };

    effect._applyWind = function(time) {
        var amount = this.settings.ambientWind / 100;
        if (!amount || time - this._lastWindTime < 0.11) return;
        this._lastWindTime = time;
        var direction = this.settings.windDirection;
        var sign = direction === 'rtl' ? -1 : direction === 'ltr' ? 1 : Math.sign(Math.sin(time * 0.65)) || 1;
        for (var s = 0; s < this._strands.length; s++) {
            var strand = this._strands[s];
            for (var row = 1; row < strand.beads.length; row++) {
                var phase = Math.sin(time * 1.5 + s * 0.37 + row * 0.18);
                strand.beads[row].velocity += phase * sign * amount * 0.085;
            }
        }
    };

    effect.update = function(time, dt) {
        if (!this._ctx || !this._texture) return;
        var key = this._layoutKey();
        if (key !== this._lastLayoutKey) this._buildCurtain();
        if (this._backgroundMaterial && this._backgroundMaterial.color) this._backgroundMaterial.color.set(this.settings.background);
        if (this._cardMediaMaterial && this._cardMediaMaterial.opacity !== undefined) this._cardMediaMaterial.opacity = this.settings.mediaOpacity / 100;
        if (this._cardBorder) this._cardBorder.material.opacity = this.settings.cardBorder / 100;
        if (this._cardGroup) {
            this._cardGroup.position.y = 1.55 - (this.settings.cardY / 100) * 3.1;
            var sizeScale = this.settings.cardSize / 68;
            this._cardGroup.scale.set(sizeScale, sizeScale * (this.settings.cardHeight / 68), 1);
        }
        var enabled = this.settings.playbackMotion !== 'off';
        var motionScale = enabled ? clamp((dt || 0.016) * 60 * (this.settings.playbackMotionSpeed / 100), 0, 2.2) : 0;
        if (enabled) {
            this._applyWind(time);
            for (var index = 0; index < this._strands.length; index++) this._simulateStrand(this._strands[index], motionScale);
        }

        var ctx = this._ctx;
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        ctx.globalAlpha = this.settings.textOpacity / 100;
        ctx.fillStyle = this.settings.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = this.settings.fontWeight + ' ' + clamp(this._layout.gapX * 0.82, 11, 26) + 'px ' + this.settings.fontFamily;
        ctx.shadowColor = 'rgba(0,0,0,0.36)';
        ctx.shadowBlur = 3;
        for (var strandIndex = 0; strandIndex < this._strands.length; strandIndex++) {
            var current = this._strands[strandIndex];
            for (var rowIndex = 0; rowIndex < current.beads.length; rowIndex++) {
                var bead = current.beads[rowIndex];
                ctx.save();
                ctx.translate(bead.drawX, bead.drawY);
                ctx.rotate(bead.rotation);
                ctx.fillText(bead.character, 0, 0);
                ctx.restore();
            }
        }
        ctx.restore();
        this._texture.needsUpdate = true;
    };

    effect.dispose = function() {
        if (this._interactionCanvas) {
            this._interactionCanvas.removeEventListener('pointermove', this._onPointerMove);
            this._interactionCanvas.removeEventListener('pointerleave', this._onPointerLeave);
        }
        EP.EffectBase.prototype.dispose.call(this);
        this._interactionCanvas = null;
        this._onPointerMove = null;
        this._onPointerLeave = null;
        this._backgroundMaterial = null;
        this._cardGroup = null;
        this._cardMediaMaterial = null;
        this._cardBorder = null;
        this._canvas = null;
        this._ctx = null;
        this._texture = null;
        this._strands = null;
    };

    EP.Registry.register(effect);
})();
