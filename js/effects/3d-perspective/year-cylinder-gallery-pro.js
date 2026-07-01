(function() {
    var effect = new EP.EffectBase('year-cylinder-gallery-pro', {
        name: 'Year Cylinder Gallery PRO',
        category: '3d-perspective',
        icon: 'YC',
        description: 'Cilindro de anos y galeria cilndrica con textura canvas, imagenes y videos'
    }, [
        { key: 'years', type: 'text', default: '2025,2024,2023,2022', label: 'Years' },
        { key: 'radius', type: 'range', min: 60, max: 190, default: 105, step: 1, label: 'Radius', unit: '%' },
        { key: 'height', type: 'range', min: 50, max: 180, default: 120, step: 1, label: 'Height', unit: '%' },
        { key: 'speed', type: 'range', min: -220, max: 220, default: -60, step: 1, label: 'Spin', unit: '%' },
        { key: 'imageSize', type: 'range', min: 8, max: 28, default: 15, step: 1, label: 'Image Size', unit: '%' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function buildCanvasTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 2048;
        var texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return { canvas: canvas, ctx: canvas.getContext('2d'), texture: texture };
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        this._mediaList = mediaList || [];
        this._yearTex = buildCanvasTexture();
        this._galleryTex = buildCanvasTexture();
        var yearMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(1.25, 1.25, 3.8, 64, 1, true),
            new THREE.MeshBasicMaterial({ map: this._yearTex.texture, side: THREE.DoubleSide, transparent: true, alphaTest: 0.08 })
        );
        var galleryMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(3.0, 3.0, 5.8, 72, 1, true),
            new THREE.MeshBasicMaterial({ map: this._galleryTex.texture, side: THREE.DoubleSide, transparent: true, alphaTest: 0.04 })
        );
        galleryMesh.position.y = -0.45;
        group.add(galleryMesh);
        group.add(yearMesh);
        this.group = group;
        this._lastDraw = -1;
        this._drawTextures(0, true);
        return group;
    };

    effect._drawTextures = function(time, force) {
        if (!this._yearTex || !this._galleryTex) return;
        if (!force && time - this._lastDraw < 0.08 && !this._hasVideo) return;
        this._lastDraw = time;
        var years = (this.settings.years || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        if (years.length === 0) years = ['2025', '2024', '2023', '2022'];
        var yc = this._yearTex.canvas, yctx = this._yearTex.ctx;
        yctx.clearRect(0, 0, yc.width, yc.height);
        yctx.fillStyle = '#ffffff';
        yctx.strokeStyle = '#000000';
        yctx.lineWidth = 8;
        yctx.font = '900 180px Arial';
        yctx.textAlign = 'center';
        yctx.textBaseline = 'middle';
        years.forEach(function(year, i) {
            var x = (i + 0.5) * (yc.width / years.length);
            yctx.strokeText(year, x, yc.height / 2);
            yctx.fillText(year, x, yc.height / 2);
        });
        this._yearTex.texture.needsUpdate = true;

        var gc = this._galleryTex.canvas, gctx = this._galleryTex.ctx;
        gctx.clearRect(0, 0, gc.width, gc.height);
        gctx.fillStyle = 'rgba(0,0,0,0.02)';
        gctx.fillRect(0, 0, gc.width, gc.height);
        var media = this._mediaList || [];
        this._hasVideo = false;
        var count = Math.max(media.length, 1);
        var cols = Math.ceil(Math.sqrt(count * 2));
        var rows = Math.ceil(count / cols);
        var imgSize = this.settings.imageSize / 100;
        for (var i = 0; i < media.length; i++) {
            var el = media[i].element;
            if (!el) continue;
            if (media[i].type === 'video') this._hasVideo = true;
            if (media[i].type === 'video' && el.readyState < 2) continue;
            var col = i % cols, row = Math.floor(i / cols);
            var w = gc.width * imgSize;
            var h = gc.width * imgSize * 0.72;
            var x = gc.width * (0.06 + col * (0.88 / cols));
            var y = gc.height * (0.26 + row * (0.5 / Math.max(rows, 1)));
            try { gctx.drawImage(el, x, y, w, h); } catch(e) {}
            gctx.fillStyle = 'rgba(0,0,0,0.45)';
            for (var sy = y; sy < y + h; sy += 6) gctx.fillRect(x, sy, w, 1);
            gctx.strokeStyle = 'rgba(255,255,255,0.45)';
            gctx.lineWidth = 3;
            gctx.strokeRect(x, y, w, h);
        }
        this._galleryTex.texture.needsUpdate = true;
    };

    effect.update = function(time) {
        if (!this.group) return;
        this._drawTextures(time, false);
        var scale = this.settings.radius / 100;
        this.group.children[0].scale.set(scale, this.settings.height / 100, scale);
        this.group.children[1].scale.set(scale, this.settings.height / 100, scale);
        this.group.rotation.y = time * 0.18 * this.settings.speed / 100;
    };

    EP.Registry.register(effect);
})();
