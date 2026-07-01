(function() {
    var effect = new EP.EffectBase('extruded-tube-journey', {
        name: 'Extruded Tube with Holes',
        category: '3d-perspective',
        icon: 'TJ',
        description: 'Viaje por tubo curvo con textura rayada, adaptado del proyecto del TXT'
    }, [
        { key: 'radius', type: 'range', min: 30, max: 120, default: 62, step: 1, label: 'Tube Radius', unit: '%' },
        { key: 'stripe', type: 'range', min: 4, max: 48, default: 18, step: 1, label: 'Stripes' },
        { key: 'speed', type: 'range', min: 10, max: 180, default: 60, step: 1, label: 'Speed', unit: '%' },
        { key: 'colorA', type: 'color', default: '#ffffff', label: 'Stripe A' },
        { key: 'colorB', type: 'color', default: '#111111', label: 'Stripe B' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function stripeTexture(a, b, count) {
        var canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 64;
        var ctx = canvas.getContext('2d');
        drawStripes(ctx, a, b, count);
        var tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(8, 2);
        tex.userData = { canvas: canvas, ctx: ctx, colorA: a, colorB: b, count: count };
        return tex;
    }

    function drawStripes(ctx, a, b, count) {
        var canvas = ctx.canvas;
        for (var i = 0; i < count; i++) {
            ctx.fillStyle = i % 2 ? b : a;
            ctx.fillRect(i * canvas.width / count, 0, canvas.width / count + 1, canvas.height);
        }
    }

    effect.build = function() {
        var group = new THREE.Group();
        var points = [
            new THREE.Vector3(0, 0, 5),
            new THREE.Vector3(0, 0, 1.5),
            new THREE.Vector3(-2.4, 1.1, -1.2),
            new THREE.Vector3(1.7, -1.1, -3.4),
            new THREE.Vector3(0, 0, -6)
        ];
        var curve = new THREE.CatmullRomCurve3(points);
        var tex = stripeTexture(this.settings.colorA, this.settings.colorB, Math.floor(this.settings.stripe));
        var geo = new THREE.TubeGeometry(curve, 180, this.settings.radius / 100, 32, false);
        var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
        var tube = new THREE.Mesh(geo, mat);
        tube.userData = { tex: tex };
        group.add(tube);
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group || !this.group.children[0]) return;
        var tube = this.group.children[0];
        tube.rotation.z = Math.sin(time * 0.12) * 0.2;
        tube.rotation.y = time * 0.08 * this.settings.speed / 100;
        tube.position.z = Math.sin(time * 0.32 * this.settings.speed / 100) * 1.4;
        if (tube.userData.tex) {
            var data = tube.userData.tex.userData;
            var count = Math.floor(this.settings.stripe);
            if (data.colorA !== this.settings.colorA || data.colorB !== this.settings.colorB || data.count !== count) {
                drawStripes(data.ctx, this.settings.colorA, this.settings.colorB, count);
                data.colorA = this.settings.colorA;
                data.colorB = this.settings.colorB;
                data.count = count;
                tube.userData.tex.needsUpdate = true;
            }
            tube.userData.tex.offset.x = -time * 0.08 * this.settings.speed / 100;
        }
    };

    EP.Registry.register(effect);
})();
