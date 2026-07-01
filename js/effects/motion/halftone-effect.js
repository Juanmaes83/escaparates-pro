(function() {
    var effect = new EP.EffectBase('halftone-effect', {
        name: 'Halftone Effect',
        category: 'motion',
        icon: '🔘',
        description: 'Efecto halftone/dither retro — las imagenes se convierten en patrones de puntos animados tipo impresion offset'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'dotSize', type: 'range', min: 3, max: 20, default: 8, step: 1, label: 'Dot Size' },
        { key: 'contrast', type: 'range', min: 10, max: 100, default: 60, label: 'Contrast', unit: '%' },
        { key: 'colorMode', type: 'range', min: 1, max: 3, default: 1, step: 1, label: 'Color (1=BW, 2=CMYK, 3=RGB)' },
        { key: 'animate', type: 'range', min: 0, max: 100, default: 30, label: 'Animate', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#f5f5f0', label: 'Background' }
    ]);

    function buildHalftoneCanvas(width, height) {
        var cvs = document.createElement('canvas');
        cvs.width = width;
        cvs.height = height;
        var ctx = cvs.getContext('2d');
        var tex = new THREE.CanvasTexture(cvs);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return { canvas: cvs, ctx: ctx, texture: tex };
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var halftone = buildHalftoneCanvas(512, 512);
        this._halftone = halftone;

        for (var img = 0; img < mediaList.length; img++) {
            var aspect = 1;
            if (mediaList[img].element) {
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || 1;
                aspect = ew / eh;
            }
            var w = aspect >= 1 ? 8 : 8 * aspect;
            var h = aspect >= 1 ? 8 / aspect : 8;

            var mat = new THREE.MeshBasicMaterial({ map: halftone.texture, transparent: true });
            var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
            mesh.visible = false;
            mesh.userData = { imageIndex: img, isImage: true, aspect: aspect, w: w, h: h };
            group.add(mesh);
        }

        this._srcCanvas = document.createElement('canvas');
        this._srcCanvas.width = 512;
        this._srcCanvas.height = 512;
        this._srcCtx = this._srcCanvas.getContext('2d');

        this.group = group;
        this._mediaList = mediaList;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._halftone) return;
        var t = time / loopDuration;
        var dotSize = this.settings.dotSize;
        var contrast = this.settings.contrast / 100;
        var colorMode = this.settings.colorMode;
        var animate = this.settings.animate / 100;

        var images = [];
        for (var i = 0; i < this.group.children.length; i++) {
            if (this.group.children[i].userData.isImage) images.push(this.group.children[i]);
        }
        var count = images.length;
        if (count === 0) return;
        var segDur = 1 / count;

        for (var idx = 0; idx < count; idx++) {
            var segStart = idx * segDur;
            if (t >= segStart && t < segStart + segDur) {
                images[idx].visible = true;

                var el = this._mediaList[idx].element;
                if (!el) continue;

                var cvs = this._halftone.canvas;
                var ctx = this._halftone.ctx;
                var W = cvs.width;
                var H = cvs.height;

                this._srcCtx.drawImage(el, 0, 0, W, H);
                var srcData = this._srcCtx.getImageData(0, 0, W, H).data;

                var bgColor = this.settings.background;
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, W, H);

                var step = dotSize;
                var maxR = step * 0.5;
                var timeOffset = time * animate * 2;

                for (var y = 0; y < H; y += step) {
                    for (var x = 0; x < W; x += step) {
                        var sx = Math.min(x + Math.floor(step / 2), W - 1);
                        var sy = Math.min(y + Math.floor(step / 2), H - 1);
                        var pi = (sy * W + sx) * 4;

                        var r = srcData[pi];
                        var g = srcData[pi + 1];
                        var b = srcData[pi + 2];

                        var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                        lum = Math.pow(lum, 1.0 / (0.5 + contrast));

                        var pulse = Math.sin(timeOffset + x * 0.02 + y * 0.02) * animate * 0.15;
                        var radius = maxR * (1.0 - lum) + pulse;
                        radius = Math.max(0.5, Math.min(maxR, radius));

                        var cx = x + step / 2;
                        var cy = y + step / 2;

                        if (colorMode === 1) {
                            ctx.fillStyle = '#000000';
                            ctx.beginPath();
                            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                            ctx.fill();
                        } else if (colorMode === 2) {
                            var cR = maxR * (1.0 - r / 255) * 0.6;
                            var cG = maxR * (1.0 - g / 255) * 0.6;
                            var cB = maxR * (1.0 - b / 255) * 0.6;

                            ctx.globalAlpha = 0.7;
                            ctx.fillStyle = '#00ffff';
                            ctx.beginPath(); ctx.arc(cx - 1, cy, Math.max(0.5, cR), 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = '#ff00ff';
                            ctx.beginPath(); ctx.arc(cx + 0.5, cy - 1, Math.max(0.5, cG), 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = '#ffff00';
                            ctx.beginPath(); ctx.arc(cx + 0.5, cy + 0.5, Math.max(0.5, cB), 0, Math.PI * 2); ctx.fill();
                            ctx.globalAlpha = 1;
                        } else {
                            ctx.globalAlpha = 0.8;
                            ctx.fillStyle = 'rgb(' + r + ',0,0)';
                            ctx.beginPath(); ctx.arc(cx - 1, cy, radius * 0.7, 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = 'rgb(0,' + g + ',0)';
                            ctx.beginPath(); ctx.arc(cx + 0.5, cy - 0.5, radius * 0.7, 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = 'rgb(0,0,' + b + ')';
                            ctx.beginPath(); ctx.arc(cx + 0.5, cy + 0.5, radius * 0.7, 0, Math.PI * 2); ctx.fill();
                            ctx.globalAlpha = 1;
                        }
                    }
                }

                this._halftone.texture.needsUpdate = true;
            } else {
                images[idx].visible = false;
            }
        }

        EP.Core.camera.position.set(0, 0, 7);
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this._halftone) this._halftone.texture.dispose();
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
