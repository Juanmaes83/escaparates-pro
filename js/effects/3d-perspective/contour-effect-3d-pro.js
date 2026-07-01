(function() {
    var effect = new EP.EffectBase('contour-effect-3d-pro', {
        name: 'Contour Effect 3D Pro',
        category: '3d-perspective',
        icon: 'CE',
        description: 'Retrato o producto reconstruido con lineas 3D, brillo natural y rotacion controlada'
    }, [
        { key: 'cardSize', type: 'range', min: 55, max: 150, default: 108, step: 1, label: 'Effect Size', unit: '%' },
        { key: 'lines', type: 'range', min: 40, max: 360, default: 180, step: 5, label: 'Lines' },
        { key: 'resolution', type: 'range', min: 30, max: 260, default: 120, step: 5, label: 'Resolution' },
        { key: 'depth', type: 'range', min: 0, max: 160, default: 64, step: 1, label: 'Depth', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 200, default: 46, step: 1, label: 'Motion', unit: '%' },
        { key: 'colorBoost', type: 'range', min: 70, max: 180, default: 100, step: 1, label: 'Color Boost', unit: '%' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    function sampleCanvas(media, maxSize) {
        var el = media.element;
        var w = el.videoWidth || el.naturalWidth || el.width || 1;
        var h = el.videoHeight || el.naturalHeight || el.height || 1;
        var aspect = w / h;
        if (w > h) { w = maxSize; h = Math.max(1, Math.round(maxSize / aspect)); }
        else { h = maxSize; w = Math.max(1, Math.round(maxSize * aspect)); }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(el, 0, 0, w, h);
        return { data: ctx.getImageData(0, 0, w, h).data, width: w, height: h, aspect: aspect };
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var sample = sampleCanvas(mediaList[0], 420);
        var planeW = 7.2;
        var planeH = planeW / sample.aspect;
        var boost = this.settings.colorBoost / 100;
        var depth = this.settings.depth / 100;
        var mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.96 });
        var lines = Math.floor(this.settings.lines);
        var res = Math.floor(this.settings.resolution);
        for (var i = 0; i < lines; i++) {
            var positions = [];
            var colors = [];
            var y = (i / Math.max(1, lines - 1) - 0.5) * planeH;
            for (var j = 0; j < res; j++) {
                var u = j / Math.max(1, res - 1);
                var x = (u - 0.5) * planeW;
                var px = Math.max(0, Math.min(sample.width - 1, Math.floor(u * sample.width)));
                var py = Math.max(0, Math.min(sample.height - 1, Math.floor(i / Math.max(1, lines - 1) * sample.height)));
                var idx = (py * sample.width + px) * 4;
                var r = sample.data[idx] / 255;
                var g = sample.data[idx + 1] / 255;
                var b = sample.data[idx + 2] / 255;
                var lum = 0.299 * r + 0.587 * g + 0.114 * b;
                positions.push(x, y + lum * 0.26 * depth, lum * 1.8 * depth);
                colors.push(Math.min(1, r * boost), Math.min(1, g * boost), Math.min(1, b * boost));
            }
            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            group.add(new THREE.Line(geo, mat));
        }
        group.scale.setScalar(this.settings.cardSize / 100);
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var m = this.settings.motion / 100;
        this.group.scale.setScalar(this.settings.cardSize / 100);
        this.group.rotation.x = Math.sin(time * 0.28) * 0.18 * m;
        this.group.rotation.y = Math.cos(time * 0.24) * 0.28 * m;
    };

    EP.Registry.register(effect);
})();
