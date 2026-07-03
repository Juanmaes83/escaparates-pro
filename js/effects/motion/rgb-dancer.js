(function() {
    var effect = new EP.EffectBase('rgb-dancer', {
        name: 'RGB Dancer',
        category: 'motion',
        icon: '🎭',
        description: 'Triple capa RGB con separación cromática — aberración de canal por cursor o tiempo'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'separation', type: 'range', min: 0, max: 60, default: 15, step: 1, label: 'Separación RGB', unit: 'px' },
        { key: 'mouseInfluence', type: 'range', min: 0, max: 100, default: 60, step: 5, label: 'Influencia cursor', unit: '%' },
        { key: 'autoSway', type: 'range', min: 0, max: 20, default: 6, step: 1, label: 'Movimiento auto' },
        { key: 'blendMode', type: 'select', options: [{ v: 'additive', l: 'Aditivo (screen)' }, { v: 'normal', l: 'Normal' }], default: 'additive', label: 'Blend mode' },
        { key: 'channelOpacity', type: 'range', min: 30, max: 100, default: 75, step: 5, label: 'Opacidad canal', unit: '%' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var m0 = mediaList && mediaList[0];
        var blending = this.settings.blendMode === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending;
        var op = this.settings.channelOpacity / 100;

        // Three layers: R, G, B channels tinted
        var CHANNEL_COLORS = [0xff2200, 0x00ff44, 0x0044ff];
        this._layers = [];
        for (var i = 0; i < 3; i++) {
            var mat;
            if (m0) {
                mat = EP.Media.createMaterial(m0);
                mat.color.setHex(CHANNEL_COLORS[i]);
                mat.blending = blending;
                mat.transparent = true;
                mat.opacity = op;
                mat.depthWrite = false;
            } else {
                mat = new THREE.MeshBasicMaterial({
                    color: CHANNEL_COLORS[i],
                    transparent: true,
                    opacity: op,
                    blending: blending,
                    depthWrite: false
                });
            }
            var geo = new THREE.PlaneGeometry(8, 4.5);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = 0.001 * i;
            group.add(mesh);
            this._layers.push(mesh);
        }

        this._mouseX = 0; this._mouseY = 0;
        var self = this;
        this._onMouseMove = function(e) {
            var canvas = (EP.Core && EP.Core.renderer) ? EP.Core.renderer.domElement : document.querySelector('canvas');
            if (!canvas) return;
            var rect = canvas.getBoundingClientRect();
            self._mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            self._mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        };
        window.addEventListener('mousemove', this._onMouseMove);
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._layers) return;
        var sep = this.settings.separation * 0.003;
        var mi = this.settings.mouseInfluence / 100;
        var autoSpd = this.settings.autoSway * 0.08;
        var mx = this._mouseX * mi + Math.sin(time * autoSpd * 0.3) * (1 - mi);
        var my = this._mouseY * mi + Math.cos(time * autoSpd * 0.25) * (1 - mi);

        // R channel: offset right + up slightly
        this._layers[0].position.x = mx * sep * 1.2;
        this._layers[0].position.y = my * sep * 0.8;
        // G channel: center (slight sway)
        this._layers[1].position.x = Math.sin(time * autoSpd * 0.15) * sep * 0.3;
        this._layers[1].position.y = Math.cos(time * autoSpd * 0.1) * sep * 0.2;
        // B channel: offset left + down
        this._layers[2].position.x = -mx * sep * 1.0;
        this._layers[2].position.y = -my * sep * 0.6;
    };

    effect.dispose = function() {
        if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
        this._layers = null;
    };

    EP.Registry.register(effect);
})();
