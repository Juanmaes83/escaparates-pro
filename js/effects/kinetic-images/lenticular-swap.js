// Lenticular Swap — original reinterpretation of "two images revealed by
// viewing angle" (concept only, no code borrowed): the canvas is sliced into
// N thin vertical strips, alternating between image A and image B, each
// strip carrying a custom UV slice of its own full-resolution texture so the
// two source photos each reconstruct completely across their own strip set.
// Strips are alternately offset in depth; swaying the whole group shifts
// which strip set is more visible, mimicking a lenticular print.
(function() {
    var effect = new EP.EffectBase('lenticular-swap', {
        name: 'Lenticular Swap',
        category: 'kinetic-images',
        icon: '🪞',
        description: 'Dos imagenes entrelazadas en tiras finas que cambian de protagonismo al bascular, ideal para antes/despues o variantes de producto'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'stripCount', type: 'range', min: 6, max: 60, default: 24, step: 2, label: 'Numero de tiras' },
        { key: 'swayAngle', type: 'range', min: 5, max: 60, default: 26, step: 1, label: 'Angulo de balanceo', unit: 'deg' },
        { key: 'swaySpeed', type: 'range', min: 0, max: 200, default: 70, step: 5, label: 'Velocidad de balanceo', unit: '%' },
        { key: 'depth', type: 'range', min: 0, max: 100, default: 40, step: 5, label: 'Profundidad entre tiras' }
    ]);

    function buildStrip(w, h, uStart, uEnd) {
        var geo = new THREE.PlaneGeometry(w, h, 1, 1);
        var uvAttr = geo.attributes.uv;
        // corners order for PlaneGeometry: (0,1) (1,1) (0,0) (1,0)
        uvAttr.setXY(0, uStart, 1);
        uvAttr.setXY(1, uEnd, 1);
        uvAttr.setXY(2, uStart, 0);
        uvAttr.setXY(3, uEnd, 0);
        uvAttr.needsUpdate = true;
        return geo;
    }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var media = mediaList || [];

        if (media.length < 2) {
            // Fallback: not enough images for a lenticular pair, show one static plane.
            var single = media[0];
            var mat = single ? EP.Media.createMaterial(single) : new THREE.MeshBasicMaterial({ color: 0x24242c });
            var geo = new THREE.PlaneGeometry(8, 4.5);
            group.add(new THREE.Mesh(geo, mat));
            this._strips = null;
            this.group = group;
            return group;
        }

        var isMobile = (typeof window !== 'undefined') && window.innerWidth < 768;
        var count = Math.max(6, Math.min(this.settings.stripCount || 24, isMobile ? 16 : 60));
        var W = 8, H = 4.5;
        var stripW = W / count;
        var depthAmt = (this.settings.depth / 100) * 0.5;

        this._texA = EP.Media.createTexture(media[0]);
        this._texB = EP.Media.createTexture(media[1]);
        this._matA = new THREE.MeshBasicMaterial({ map: this._texA });
        this._matB = new THREE.MeshBasicMaterial({ map: this._texB });

        var strips = [];
        for (var i = 0; i < count; i++) {
            var uStart = i / count;
            var uEnd = (i + 1) / count;
            var geoStrip = buildStrip(stripW, H, uStart, uEnd);
            var isA = i % 2 === 0;
            var mesh = new THREE.Mesh(geoStrip, isA ? this._matA : this._matB);
            mesh.position.x = -W / 2 + stripW * (i + 0.5);
            mesh.position.z = isA ? depthAmt : -depthAmt;
            group.add(mesh);
            strips.push(mesh);
        }
        this._strips = strips;
        this._elapsed = 0;
        this.group = group;
        this._handlesOutputSize = false;
        return group;
    };

    effect.update = function(time, dt) {
        if (!this.group) return;
        if (this._texA) EP.Media.updateTexture(this._texA);
        if (this._texB) EP.Media.updateTexture(this._texB);
        if (!this._strips) return;

        var speedFactor = (this.settings.swaySpeed || 70) / 100;
        if (this.settings.playbackMotion !== 'off') {
            this._elapsed += (dt || 0.016) * speedFactor;
        }
        var swayRad = (this.settings.swayAngle || 26) * Math.PI / 180;
        this.group.rotation.y = Math.sin(this._elapsed) * swayRad;
    };

    effect.dispose = function() {
        if (this._texA && typeof this._texA.dispose === 'function') this._texA.dispose();
        if (this._texB && typeof this._texB.dispose === 'function') this._texB.dispose();
        this._texA = null;
        this._texB = null;
        this._strips = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
