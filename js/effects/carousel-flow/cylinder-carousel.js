(function() {
    var effect = new EP.EffectBase('cylinder-carousel', {
        name: 'Cylinder Carousel',
        category: 'carousel-flow',
        icon: '🎠',
        description: 'Carrusel cilindrico 3D — las imagenes envuelven un cilindro giratorio tipo marquee Perspective'
    }, [
        { key: 'cylinderRadius', type: 'range', min: 20, max: 100, default: 60, label: 'Radius', unit: '%' },
        { key: 'cylinderHeight', type: 'range', min: 20, max: 100, default: 60, label: 'Height', unit: '%' },
        { key: 'rotSpeed', type: 'range', min: 10, max: 100, default: 40, label: 'Rotation Speed', unit: '%' },
        { key: 'tilt', type: 'range', min: 0, max: 45, default: 10, label: 'Tilt', unit: '°' },
        { key: 'segments', type: 'range', min: 3, max: 16, default: 8, step: 1, label: 'Faces' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a1a', label: 'Background' }
    ]);

    function buildCylinderTexture(mediaList, segW, segH) {
        var n = mediaList.length;
        var W = segW * n;
        var H = segH;
        var cvs = document.createElement('canvas');
        cvs.width = W;
        cvs.height = H;
        var ctx = cvs.getContext('2d');
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, W, H);

        for (var i = 0; i < n; i++) {
            var el = mediaList[i].element;
            if (!el) continue;
            var x = i * segW;
            var iw = el.videoWidth || el.naturalWidth || el.width || segW;
            var ih = el.videoHeight || el.naturalHeight || el.height || segH;
            var scale = Math.max(segW / iw, segH / ih);
            var dw = iw * scale;
            var dh = ih * scale;
            var ox = x + (segW - dw) / 2;
            var oy = (segH - dh) / 2;
            ctx.drawImage(el, ox, oy, dw, dh);

            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, 0, segW, segH);
        }

        var tex = new THREE.CanvasTexture(cvs);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        return tex;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var segW = 256;
        var segH = 384;
        var tex = buildCylinderTexture(mediaList, segW, segH);
        this._cylTex = tex;

        var radius = 2 + 3 * this.settings.cylinderRadius / 100;
        var height = 2 + 4 * this.settings.cylinderHeight / 100;
        var segs = Math.max(this.settings.segments, mediaList.length);

        var geo = new THREE.CylinderGeometry(radius, radius, height, segs * 4, 1, true);
        var mat = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide,
            transparent: true
        });

        var cylinder = new THREE.Mesh(geo, mat);
        cylinder.userData = { isCylinder: true };
        group.add(cylinder);

        var tiltRad = this.settings.tilt * Math.PI / 180;
        group.rotation.x = tiltRad;

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var rotSpeed = this.settings.rotSpeed / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var child = this.group.children[i];
            if (child.userData.isCylinder) {
                child.rotation.y = t * Math.PI * 2 * rotSpeed;
            }
        }

        var tiltRad = this.settings.tilt * Math.PI / 180;
        this.group.rotation.x = tiltRad;

        EP.Core.camera.position.set(
            Math.sin(t * Math.PI * 2) * 1.5,
            0.5 + Math.sin(time * 0.3) * 0.3,
            6
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this._cylTex) {
            this._cylTex.dispose();
            this._cylTex = null;
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
