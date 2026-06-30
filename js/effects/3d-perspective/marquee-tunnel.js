(function() {
    var effect = new EP.EffectBase('marquee-tunnel', {
        name: 'Marquee Tunnel',
        category: '3d-perspective',
        icon: '🚇',
        description: 'Tunel cuadrado 3D con imagenes desplazandose por las paredes internas — efecto marquee inmersivo'
    }, [
        { key: 'scrollSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Scroll Speed', unit: '%' },
        { key: 'tunnelDepth', type: 'range', min: 20, max: 100, default: 60, label: 'Tunnel Depth', unit: '%' },
        { key: 'wallSize', type: 'range', min: 20, max: 100, default: 70, label: 'Wall Size', unit: '%' },
        { key: 'sway', type: 'range', min: 0, max: 100, default: 30, label: 'Camera Sway', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function buildWallTexture(mediaList, tileSize) {
        var n = mediaList.length;
        var cols = n;
        var rows = 1;
        var W = cols * tileSize;
        var H = tileSize;

        var cvs = document.createElement('canvas');
        cvs.width = W;
        cvs.height = H;
        var ctx = cvs.getContext('2d');

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, W, H);

        for (var i = 0; i < n; i++) {
            var media = mediaList[i];
            if (!media.element) continue;
            var x = i * tileSize;
            var el = media.element;
            var iw = el.videoWidth || el.naturalWidth || el.width || tileSize;
            var ih = el.videoHeight || el.naturalHeight || el.height || tileSize;
            var s = Math.max(tileSize / iw, tileSize / ih);
            var dw = iw * s;
            var dh = ih * s;
            var ox = x + (tileSize - dw) / 2;
            var oy = (tileSize - dh) / 2;
            ctx.drawImage(el, ox, oy, dw, dh);
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

        var tileSize = 256;
        var tex = buildWallTexture(mediaList, tileSize);
        this._wallTex = tex;

        var depth = 8 * this.settings.tunnelDepth / 100;
        var wallW = 3 * this.settings.wallSize / 100;

        var walls = [
            { pos: [0, wallW, -depth / 2], rot: [Math.PI / 2, 0, 0], size: [wallW * 2, depth] },
            { pos: [0, -wallW, -depth / 2], rot: [-Math.PI / 2, 0, 0], size: [wallW * 2, depth] },
            { pos: [-wallW, 0, -depth / 2], rot: [0, Math.PI / 2, 0], size: [depth, wallW * 2] },
            { pos: [wallW, 0, -depth / 2], rot: [0, -Math.PI / 2, 0], size: [depth, wallW * 2] }
        ];

        for (var w = 0; w < walls.length; w++) {
            var wallTex = tex.clone();
            wallTex.needsUpdate = true;
            wallTex.wrapS = THREE.RepeatWrapping;
            wallTex.wrapT = THREE.RepeatWrapping;
            wallTex.repeat.set(mediaList.length, 1);

            var mat = new THREE.MeshBasicMaterial({
                map: wallTex,
                side: THREE.DoubleSide
            });

            var geo = new THREE.PlaneGeometry(walls[w].size[0], walls[w].size[1]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(walls[w].pos[0], walls[w].pos[1], walls[w].pos[2]);
            mesh.rotation.set(walls[w].rot[0], walls[w].rot[1], walls[w].rot[2]);
            mesh.userData = { wallIndex: w, direction: w % 2 === 0 ? 1 : -1 };
            group.add(mesh);
        }

        var backGeo = new THREE.PlaneGeometry(wallW * 2, wallW * 2);
        var backMat = new THREE.MeshBasicMaterial({ color: 0x111122, side: THREE.DoubleSide });
        var backPlane = new THREE.Mesh(backGeo, backMat);
        backPlane.position.set(0, 0, -depth);
        backPlane.userData = { isBack: true };
        group.add(backPlane);

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var speed = this.settings.scrollSpeed / 100;
        var sway = this.settings.sway / 100;

        for (var i = 0; i < this.group.children.length; i++) {
            var mesh = this.group.children[i];
            if (mesh.userData.wallIndex !== undefined && mesh.material.map) {
                var dir = mesh.userData.direction;
                mesh.material.map.offset.x = time * speed * 0.1 * dir;
            }
        }

        var t = time / loopDuration;
        EP.Core.camera.position.set(
            Math.sin(t * Math.PI * 2) * 0.3 * sway,
            Math.cos(t * Math.PI * 4) * 0.15 * sway,
            0.5
        );
        EP.Core.camera.lookAt(0, 0, -4);
    };

    effect.dispose = function() {
        if (this._wallTex) {
            this._wallTex.dispose();
            this._wallTex = null;
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
