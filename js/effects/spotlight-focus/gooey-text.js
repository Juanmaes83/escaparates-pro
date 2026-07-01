(function() {
    var effect = new EP.EffectBase('gooey-text', {
        name: 'Gooey Text',
        category: 'spotlight-focus',
        icon: 'GT',
        description: 'Transicion viscosa entre dos textos con blur y contraste controlado'
    }, [
        { key: 'textA', type: 'text', default: 'RUBIK SOTA', label: 'Text A', maxLength: 40 },
        { key: 'textB', type: 'text', default: '629554870', label: 'Text B', maxLength: 40 },
        { key: 'fontSize', type: 'range', min: 40, max: 180, default: 112, step: 1, label: 'Text Size', unit: '%' },
        { key: 'gooey', type: 'range', min: 0, max: 100, default: 72, step: 1, label: 'Gooey', unit: '%' },
        { key: 'exposure', type: 'range', min: 10, max: 90, default: 46, step: 1, label: 'Exposure', unit: '%' },
        { key: 'motion', type: 'range', min: 20, max: 220, default: 100, step: 1, label: 'Speed', unit: '%' },
        { key: 'textColor', type: 'color', default: '#111111', label: 'Text Color' },
        { key: 'background', type: 'color', default: '#ffffff', label: 'Background' }
    ]);

    function makeTextTexture(settings) {
        var canvas = document.createElement('canvas');
        canvas.width = 1600; canvas.height = 900;
        var ctx = canvas.getContext('2d');
        var t = effect._phase || 0;
        var exposure = settings.exposure / 100;
        var fade = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
        fade = Math.max(0, Math.min(1, (fade - (0.5 - exposure / 2)) / Math.max(0.01, exposure)));
        ctx.fillStyle = settings.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.filter = 'blur(' + (settings.gooey * 0.16) + 'px) contrast(' + (1 + settings.gooey * 0.22) + ')';
        ctx.font = '900 ' + Math.round(settings.fontSize / 100 * 165) + 'px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = settings.textColor;
        ctx.globalAlpha = 1 - fade;
        ctx.fillText(settings.textA || 'RUBIK SOTA', canvas.width / 2, canvas.height / 2);
        ctx.globalAlpha = fade;
        ctx.fillText(settings.textB || '629554870', canvas.width / 2, canvas.height / 2);
        ctx.restore();
        var tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    effect.build = function() {
        var group = new THREE.Group();
        this._phase = 0;
        var tex = makeTextTexture(this.settings);
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 4.2), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
        mesh.userData = { isText: true };
        group.add(mesh);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        this._phase = ((time / loopDuration) * this.settings.motion / 100) % 1;
        var mesh = this.group.children[0];
        if (!mesh) return;
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.map = makeTextTexture(this.settings);
        mesh.material.needsUpdate = true;
    };

    EP.Registry.register(effect);
})();
