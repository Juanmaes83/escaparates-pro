(function() {
    var effect = new EP.EffectBase('peel-me-panel', {
        name: 'Peel Me Panel',
        category: '3d-perspective',
        icon: 'PM',
        description: 'Panel 3D dividido en tiras que se pliegan como el proyecto Peel-me'
    }, [
        { key: 'width', type: 'range', min: 55, max: 180, default: 118, step: 1, label: 'Width', unit: '%' },
        { key: 'height', type: 'range', min: 35, max: 130, default: 72, step: 1, label: 'Height', unit: '%' },
        { key: 'strips', type: 'range', min: 8, max: 56, default: 26, step: 1, label: 'Strips' },
        { key: 'fold', type: 'range', min: 0, max: 160, default: 96, step: 1, label: 'Fold', unit: '%' },
        { key: 'speed', type: 'range', min: 20, max: 220, default: 80, step: 1, label: 'Speed', unit: '%' },
        { key: 'title', type: 'text', default: 'RUBIK SOTA', label: 'Title' },
        { key: 'textOpacity', type: 'range', min: 0, max: 100, default: 32, step: 1, label: 'Text Back', unit: '%' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function makeTexture(media) {
        var tex = EP.Media.createTexture(media);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        return tex;
    }

    function applyUv(geo, u0, u1) {
        var uv = geo.attributes.uv;
        for (var i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) === 0 ? u0 : u1);
        uv.needsUpdate = true;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        if (!mediaList || mediaList.length === 0) return group;
        var tex = makeTexture(mediaList[0]);
        var strips = Math.floor(this.settings.strips);
        var w = 7.4 * this.settings.width / 100;
        var h = 4.2 * this.settings.height / 100;
        var sw = w / strips;
        for (var i = 0; i < strips; i++) {
            var geo = new THREE.PlaneGeometry(sw * 1.02, h);
            applyUv(geo, i / strips, (i + 1) / strips);
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.96 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.x = -w / 2 + sw / 2 + i * sw;
            mesh.userData = { index: i, strips: strips, baseX: mesh.position.x };
            group.add(mesh);
        }
        var canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 256;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,' + (this.settings.textOpacity / 100) + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.settings.title || '', canvas.width / 2, canvas.height / 2);
        var labelTex = new THREE.CanvasTexture(canvas);
        var label = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, side: THREE.DoubleSide, opacity: 0.78 }));
        label.position.z = 0.02;
        group.add(label);
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var fold = this.settings.fold / 100;
        var speed = this.settings.speed / 100;
        var maxStrip = this.group.children.length - 1;
        for (var i = 0; i < maxStrip; i++) {
            var mesh = this.group.children[i];
            var local = (Math.sin(time * speed + mesh.userData.index * 0.18) + 1) * 0.5;
            mesh.rotation.y = -local * Math.PI * 0.72 * fold;
            mesh.position.z = Math.sin(local * Math.PI) * 1.1 * fold;
            if (mesh.material.map && mesh.material.map.isVideoTexture) mesh.material.map.needsUpdate = true;
        }
        this.group.rotation.x = -0.08 + Math.sin(time * 0.24) * 0.04;
    };

    EP.Registry.register(effect);
})();
