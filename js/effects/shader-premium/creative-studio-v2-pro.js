(function() {
    var effect = new EP.EffectBase('creative-studio-v2-pro', {
        name: 'Creative Studio V2 PRO',
        category: 'shader-premium',
        icon: 'V2',
        description: 'Impregnacion animada sobre imagen o video: Matrix, proporcion aurea, contadores, lineas y simbolos dinamicos'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motionDirection', type: 'select', options: [{ v: 'auto', l: 'Auto / Original' }, { v: 'ltr', l: 'Izquierda a derecha' }, { v: 'rtl', l: 'Derecha a izquierda' }, { v: 'ttb', l: 'Arriba a abajo' }, { v: 'btt', l: 'Abajo a arriba' }], default: 'ttb', label: 'Motion Direction' },
        { key: 'recordDefaultMotion', type: 'select', options: [{ v: 'on', l: 'Grabar movimiento' }, { v: 'off', l: 'Imagen estatica' }], default: 'on', label: 'Record Default Motion' },
        { key: 'effectMode', type: 'select', options: [{ v: 'matrix', l: 'Lluvia Matrix' }, { v: 'golden', l: 'Proporcion aurea viva' }, { v: 'counters', l: 'Contadores vivos' }, { v: 'connectors', l: 'Lineas y nodos' }, { v: 'kafka', l: 'Kafka symbols' }, { v: 'studio', l: 'Todo mezclado' }], default: 'matrix', label: 'Effect Mode' },
        { key: 'headline', type: 'text', default: 'CREATIVE STUDIO', label: 'Titular', maxLength: 64 },
        { key: 'cta', type: 'text', default: 'LIVE SIGNAL', label: 'CTA', maxLength: 48 },
        { key: 'techText', type: 'text', default: 'SYS // FRAME // SIGNAL', label: 'Codigo', maxLength: 80 },
        { key: 'textScale', type: 'range', min: 40, max: 180, default: 78, step: 1, label: 'Text Size', unit: '%' },
        { key: 'effectStrength', type: 'range', min: 0, max: 180, default: 100, step: 1, label: 'Effect Strength', unit: '%' },
        { key: 'elementScale', type: 'range', min: 50, max: 420, default: 150, step: 5, label: 'Element Size', unit: '%' },
        { key: 'elementCount', type: 'range', min: 1, max: 80, default: 22, step: 1, label: 'Element Count' },
        { key: 'lineThickness', type: 'range', min: 1, max: 14, default: 3, step: 1, label: 'Line Thickness' },
        { key: 'density', type: 'range', min: 25, max: 240, default: 115, step: 1, label: 'Density', unit: '%' },
        { key: 'overlayOpacity', type: 'range', min: 10, max: 100, default: 82, step: 1, label: 'Overlay Opacity', unit: '%' },
        { key: 'vignette', type: 'range', min: 0, max: 100, default: 0, step: 1, label: 'Vignette', unit: '%' },
        { key: 'matrixCharset', type: 'select', options: [{ v: 'numbers', l: 'Numeros' }, { v: 'binary', l: 'Binario' }, { v: 'letters', l: 'Letras' }, { v: 'symbols', l: 'Simbolos' }, { v: 'tech', l: 'Codigo tecnico' }], default: 'symbols', label: 'Matrix Glyphs' },
        { key: 'customGlyphText', type: 'text', default: 'ESCAPARATES PRO / VISUAL SIGNAL / DATA FLOW', label: 'Frases / Letras', maxLength: 120 },
        { key: 'goldColor', type: 'color', default: '#d4af37', label: 'Primary Color' },
        { key: 'accentColor', type: 'color', default: '#44ffcc', label: 'Accent Color' },
        { key: 'background', type: 'color', default: '#08080d', label: 'Background' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: true,
        supportsVideo: true,
        usesCamera: false,
        usesPostProcessing: false,
        usesParticlesShaders: true,
        mobileRisk: 'medium',
        minMedia: 0,
        exportSafe: true,
        hasErrorBoundary: true
    };

    var vertexShader = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
    var bgFragmentShader = [
        'uniform sampler2D uTexture;',
        'uniform float uHasTexture;',
        'uniform float uTime;',
        'uniform float uDistort;',
        'uniform vec2 uDirection;',
        'uniform vec3 uBackground;',
        'uniform float uVignette;',
        'varying vec2 vUv;',
        'void main(){',
        '  vec2 uv=vUv;',
        '  vec2 dir=length(uDirection)<0.1?vec2(1.0,0.0):normalize(uDirection);',
        '  float ripple=sin(dot(uv,dir.yx)*42.0+uTime*2.2)*0.008*uDistort;',
        '  uv+=dir*ripple;',
        '  vec4 media=texture2D(uTexture,clamp(uv,0.0,1.0));',
        '  vec3 col=mix(uBackground,media.rgb,uHasTexture);',
        '  float vignette=smoothstep(0.88,0.18,length(vUv-.5));',
        '  col*=mix(1.0,0.78+0.22*vignette,uVignette);',
        '  gl_FragColor=vec4(col,1.0);',
        '}'
    ].join('\n');

    function directionVector(value) {
        if (value === 'ltr') return new THREE.Vector2(1, 0);
        if (value === 'rtl') return new THREE.Vector2(-1, 0);
        if (value === 'ttb') return new THREE.Vector2(0, -1);
        if (value === 'btt') return new THREE.Vector2(0, 1);
        return new THREE.Vector2(0.65, -1);
    }

    function fallbackTexture(color) {
        var canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        var ctx = canvas.getContext('2d');
        var grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, color || '#08080d');
        grad.addColorStop(1, '#111827');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '700 42px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SUBE IMAGEN O VIDEO', canvas.width / 2, canvas.height / 2);
        var tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    function modeIs(instance, name) {
        return instance.settings.effectMode === name || instance.settings.effectMode === 'studio';
    }

    function charsFor(value) {
        var custom = String(effect.settings.customGlyphText || '').replace(/\s+/g, ' ').trim();
        if (custom) return custom;
        if (value === 'numbers') return '01234567890123456789';
        if (value === 'binary') return '0101010011010110';
        if (value === 'letters') return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (value === 'tech') return '{}[]</>01_SYS_FRAME_RUN_EXEC_DELTA_NODE';
        return '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/=<>{}[]$#%&';
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function point(i, t, w, h, speed) {
        return {
            x: w * (0.14 + 0.72 * (0.5 + 0.5 * Math.sin(i * 1.73 + t * (0.28 + speed)))),
            y: h * (0.16 + 0.68 * (0.5 + 0.5 * Math.cos(i * 2.17 + t * (0.24 + speed * 0.7))))
        };
    }

    function roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function drawMatrixRain(ctx, settings, t, w, h, alpha, density, dir, scale, count) {
        var chars = charsFor(settings.matrixCharset);
        var fontSize = clamp(Math.round(16 * density * scale), 10, 86);
        var step = fontSize * 1.3;
        var streams = clamp(Math.round(count * density), 2, 120);
        ctx.save();
        ctx.font = '700 ' + fontSize + 'px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = settings.accentColor;
        ctx.shadowBlur = 12 * alpha;
        for (var i = 0; i < streams; i++) {
            var offset = (t * 135 * density + i * 57) % (h + w + 260) - 160;
            var base = i * step;
            for (var j = 0; j < 12; j++) {
                var fade = alpha * Math.max(0, 1 - j / 12);
                ctx.globalAlpha = fade;
                ctx.fillStyle = j === 0 ? '#ffffff' : settings.accentColor;
                var ch = chars.charAt((i * 13 + j * 7 + Math.floor(t * 18)) % chars.length);
                var x = base;
                var y = offset - j * step;
                if (settings.motionDirection === 'ltr' || settings.motionDirection === 'rtl') {
                    x = settings.motionDirection === 'rtl' ? w - offset + j * step : offset - j * step;
                    y = base;
                } else if (settings.motionDirection === 'btt') {
                    y = h - offset + j * step;
                }
                ctx.fillText(ch, x, y);
            }
        }
        ctx.restore();
    }

    function drawGoldenSystems(ctx, settings, t, w, h, alpha, density, scale, elementCount) {
        var count = clamp(Math.round(elementCount * 0.32 * density), 1, 32);
        ctx.save();
        ctx.strokeStyle = settings.goldColor;
        ctx.fillStyle = settings.goldColor;
        ctx.lineWidth = settings.lineThickness;
        ctx.shadowColor = settings.goldColor;
        ctx.shadowBlur = 14 * alpha;
        for (var i = 0; i < count; i++) {
            var p = point(i, t, w, h, 0.08);
            var bounce = Math.sin(t * 1.4 + i) * 18;
            var size = (44 + (i % 4) * 24) * scale;
            ctx.globalAlpha = alpha * (0.42 + (i % 3) * 0.16);
            ctx.save();
            ctx.translate(p.x, p.y + bounce);
            ctx.rotate(t * 0.18 + i);
            ctx.beginPath();
            var phi = 1.618;
            for (var a = 0; a < Math.PI * 2.8; a += 0.08) {
                var r = size * Math.exp(a / (Math.PI * 2 * phi)) / 3.2;
                var x = Math.cos(a) * r;
                var y = Math.sin(a) * r;
                if (a === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha *= 0.75;
            ctx.strokeRect(-size * 0.55, -size * 0.34, size, size / phi);
            ctx.restore();
        }
        ctx.restore();
    }

    function drawCounters(ctx, settings, t, w, h, alpha, density, scale, elementCount) {
        var count = clamp(Math.round(elementCount * 0.5 * density), 1, 50);
        ctx.save();
        ctx.font = '700 ' + clamp(Math.round(18 * scale), 12, 64) + 'px Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.lineWidth = Math.max(1, settings.lineThickness * 0.75);
        for (var i = 0; i < count; i++) {
            var p = point(i + 23, t, w, h, 0.18);
            var value = Math.floor(((Math.sin(t * (0.7 + i * 0.04) + i) + 1) * 0.5) * 9999);
            var label = (i % 3 === 0 ? 'COUNT ' : i % 3 === 1 ? 'SCAN ' : 'IDX ') + String(value).padStart(4, '0');
            var bw = (138 + (i % 4) * 26) * scale;
            var bh = 42 * scale;
            ctx.globalAlpha = alpha * (0.46 + 0.22 * Math.sin(t * 2 + i));
            ctx.strokeStyle = i % 2 ? settings.goldColor : settings.accentColor;
            ctx.fillStyle = 'rgba(0,0,0,.34)';
            roundedRect(ctx, p.x - bw / 2, p.y - bh / 2, bw, bh, 10);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha;
            ctx.fillText(label, p.x - bw / 2 + 14 * scale, p.y + 7 * scale);
        }
        ctx.restore();
    }

    function drawConnectors(ctx, settings, t, w, h, alpha, density, scale, elementCount) {
        var count = clamp(Math.round(elementCount * 0.55 * density), 2, 60);
        var pts = [];
        for (var i = 0; i < count; i++) pts.push(point(i + 47, t, w, h, 0.14));
        ctx.save();
        ctx.lineWidth = settings.lineThickness;
        ctx.shadowColor = settings.accentColor;
        ctx.shadowBlur = 10 * alpha;
        for (var a = 0; a < pts.length; a++) {
            for (var b = a + 1; b < pts.length; b++) {
                var dx = pts[a].x - pts[b].x;
                var dy = pts[a].y - pts[b].y;
                var d = Math.sqrt(dx * dx + dy * dy);
            var maxDistance = 230 * scale;
            if (d < maxDistance) {
                ctx.globalAlpha = alpha * (1 - d / maxDistance) * 0.62;
                    ctx.strokeStyle = (a + b) % 2 ? settings.goldColor : settings.accentColor;
                    ctx.beginPath();
                    ctx.moveTo(pts[a].x, pts[a].y);
                    ctx.lineTo(pts[b].x, pts[b].y);
                    ctx.stroke();
                }
            }
        }
        for (var n = 0; n < pts.length; n++) {
            var pulse = (8 + Math.sin(t * 2.8 + n) * 5) * scale;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = n % 2 ? settings.goldColor : settings.accentColor;
            ctx.beginPath();
            ctx.arc(pts[n].x, pts[n].y, Math.max(3, pulse), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = alpha * 0.34;
            ctx.beginPath();
            ctx.arc(pts[n].x, pts[n].y, 24 * scale + pulse * 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawKafkaSymbols(ctx, settings, t, w, h, alpha, density, scale, elementCount) {
        var custom = String(settings.customGlyphText || '').trim();
        var words = custom ? custom.split(/[\/,;|]+|\s{2,}/).filter(Boolean) : ['K', 'META', 'VOID', 'TRACE', 'ECHO', 'FORM', 'NODE', 'SHIFT'];
        var count = clamp(Math.round(elementCount * density), 1, 80);
        ctx.save();
        ctx.font = '800 ' + clamp(Math.round(30 * scale), 14, 110) + 'px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = settings.goldColor;
        ctx.shadowBlur = 18 * alpha;
        for (var i = 0; i < count; i++) {
            var p = point(i + 71, t, w, h, 0.2);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.sin(t + i) * 0.42);
            ctx.globalAlpha = alpha * (0.25 + 0.45 * Math.abs(Math.sin(t * 1.7 + i)));
            ctx.fillStyle = i % 2 ? settings.goldColor : '#ffffff';
            ctx.fillText(words[i % words.length], 0, 0);
            ctx.restore();
        }
        ctx.restore();
    }

    function drawTextPlate(ctx, settings, t, w, h) {
        if (!settings.headline && !settings.cta && !settings.techText) return;
        var scale = settings.textScale / 100;
        ctx.save();
        ctx.globalAlpha = 0.82;
        ctx.shadowColor = 'rgba(0,0,0,0.78)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 ' + Math.round(42 * scale) + 'px Arial, sans-serif';
        ctx.fillText(settings.headline, w * 0.055, h * 0.81);
        ctx.font = '700 ' + Math.round(17 * scale) + 'px Consolas, monospace';
        ctx.fillStyle = settings.goldColor;
        ctx.fillText(settings.cta, w * 0.058, h * 0.875);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.fillText(settings.techText, w - 34, h - 34);
        ctx.restore();
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var hasMedia = mediaList && mediaList.length && mediaList[0].element;
        var mediaTex = hasMedia ? EP.Media.createTexture(mediaList[0]) : fallbackTexture(this.settings.background);
        var bgMat = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: mediaTex },
                uHasTexture: { value: hasMedia ? 1 : 0 },
                uTime: { value: 0 },
                uDistort: { value: 0 },
                uDirection: { value: directionVector(this.settings.motionDirection) },
                uBackground: { value: new THREE.Color(this.settings.background) },
                uVignette: { value: Number(this.settings.vignette || 0) / 100 }
            },
            vertexShader: vertexShader,
            fragmentShader: bgFragmentShader
        });
        this._bg = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 7.1), bgMat);
        group.add(this._bg);

        this._overlayCanvas = document.createElement('canvas');
        this._overlayCanvas.width = 1280;
        this._overlayCanvas.height = 720;
        this._overlayCtx = this._overlayCanvas.getContext('2d');
        this._overlayTexture = new THREE.CanvasTexture(this._overlayCanvas);
        this._overlayTexture.needsUpdate = true;
        this._overlay = new THREE.Mesh(
            new THREE.PlaneGeometry(12.5, 7.1),
            new THREE.MeshBasicMaterial({
                map: this._overlayTexture,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        this._overlay.position.z = 0.02;
        group.add(this._overlay);

        this._mediaTexture = mediaTex;
        this._handlesOutputSize = true;
        group.scale.setScalar(this.settings.outputSize / 100);
        return group;
    };

    effect.update = function(time) {
        if (!this._bg || !this._overlayCanvas) return;
        var speed = this.settings.playbackMotion === 'off' ? 0 : this.settings.playbackMotionSpeed / 100;
        var t = time * speed;
        var u = this._bg.material.uniforms;
        EP.Media.updateTexture(u.uTexture.value);
        u.uTime.value = t;
        u.uDistort.value = modeIs(this, 'kafka') ? this.settings.effectStrength / 120 : 0;
        u.uDirection.value.copy(directionVector(this.settings.motionDirection));
        u.uBackground.value.set(this.settings.background);
        u.uVignette.value = Number(this.settings.vignette || 0) / 100;

        var ctx = this._overlayCtx;
        var w = this._overlayCanvas.width;
        var h = this._overlayCanvas.height;
        var strength = this.settings.effectStrength / 100;
        var alpha = clamp(strength * this.settings.overlayOpacity / 100, 0, 1.8);
        var density = this.settings.density / 100;
        var elementScale = this.settings.elementScale / 100;
        var elementCount = this.settings.elementCount;
        var dir = directionVector(this.settings.motionDirection);
        ctx.clearRect(0, 0, w, h);

        if (modeIs(this, 'matrix')) drawMatrixRain(ctx, this.settings, t, w, h, alpha, density, dir, elementScale, elementCount);
        if (modeIs(this, 'golden')) drawGoldenSystems(ctx, this.settings, t, w, h, alpha, density, elementScale, elementCount);
        if (modeIs(this, 'counters')) drawCounters(ctx, this.settings, t, w, h, alpha, density, elementScale, elementCount);
        if (modeIs(this, 'connectors')) drawConnectors(ctx, this.settings, t, w, h, alpha, density, elementScale, elementCount);
        if (modeIs(this, 'kafka')) drawKafkaSymbols(ctx, this.settings, t, w, h, alpha, density, elementScale, elementCount);
        drawTextPlate(ctx, this.settings, t, w, h);

        this._overlayTexture.needsUpdate = true;
        this.group.scale.setScalar(this.settings.outputSize / 100);
        EP.Core.scene.background = new THREE.Color(this.settings.background);
        EP.Core.camera.position.set(0, 0, 10);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        this._bg = null;
        this._overlay = null;
        this._overlayCanvas = null;
        this._overlayCtx = null;
        this._overlayTexture = null;
        this._mediaTexture = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
