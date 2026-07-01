(function() {
    var effect = new EP.EffectBase('logo-skirt-cylinder', {
        name: 'Logos on a Skirt',
        category: '3d-perspective',
        icon: 'LC',
        description: 'Cilindro texturizado con logos y lineas en movimiento del proyecto del TXT'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'motion', type: 'range', min: 0, max: 220, default: 80, step: 1, label: 'Motion', unit: '%' },
        { key: 'logoText', type: 'text', default: 'ESCAPARATES PRO', label: 'Logo Text' },
        { key: 'size', type: 'range', min: 55, max: 160, default: 105, step: 1, label: 'Size', unit: '%' },
        { key: 'density', type: 'range', min: 10, max: 80, default: 34, step: 1, label: 'Lines' },
        { key: 'accent', type: 'color', default: '#ffffff', label: 'Accent' },
        { key: 'background', type: 'color', default: '#050505', label: 'Background' }
    ]);

    function draw(ctx, settings, t) {
        var w = ctx.canvas.width, h = ctx.canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 2;
        var lines = Math.floor(settings.density);
        for (var i = 0; i < lines; i++) {
            var y = (i / lines) * h;
            ctx.beginPath();
            ctx.moveTo(0, y + Math.sin(t + i) * 9);
            ctx.lineTo(w, y + Math.cos(t * 0.7 + i) * 9);
            ctx.stroke();
        }
        ctx.fillStyle = settings.accent;
        ctx.font = '900 54px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var text = settings.logoText || 'LOGO';
        for (var j = 0; j < 5; j++) {
            var x = ((j / 5) * w + (t * 80) % w) % w;
            ctx.save();
            ctx.translate(x, h * (0.25 + (j % 3) * 0.25));
            ctx.rotate(Math.sin(t + j) * 0.12);
            ctx.fillText(text, 0, 0);
            ctx.restore();
        }
    }

    effect.build = function() {
        var group = new THREE.Group();
        var canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 512;
        var ctx = canvas.getContext('2d');
        draw(ctx, this.settings, 0);
        var tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.96 });
        var geo = new THREE.CylinderGeometry(1.9, 2.45, 3.25, 96, 24, true);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { canvas: canvas, ctx: ctx, tex: tex };
        group.add(mesh);
        group.scale.setScalar(this.settings.size / 100);
        this.group = group;
        return group;
    };

    effect.update = function(time) {
        if (!this.group || !this.group.children[0]) return;
        var mesh = this.group.children[0];
        draw(mesh.userData.ctx, this.settings, time * this.settings.motion / 100);
        mesh.userData.tex.needsUpdate = true;
        mesh.rotation.y = time * 0.22 * this.settings.motion / 100;
        mesh.rotation.x = Math.sin(time * 0.18) * 0.08;
        this.group.scale.setScalar(this.settings.size / 100);
    };

    EP.Registry.register(effect);
})();
