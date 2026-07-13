(function() {
    var effect = new EP.EffectBase('stained-glass-panels', {
        name: 'Stained Glass Panels',
        category: 'glassmorphism',
        icon: '🪟',
        description: 'Vitral iluminado — paneles circulares semitransparentes con spotlights de color rotantes'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'panelCount', type: 'range', min: 2, max: 8, default: 5, step: 1, label: 'Paneles vitral' },
        { key: 'rotateSpeed', type: 'range', min: 1, max: 20, default: 4, step: 1, label: 'Velocidad rotación' },
        { key: 'glassOpacity', type: 'range', min: 10, max: 90, default: 45, step: 5, label: 'Opacidad cristal', unit: '%' },
        { key: 'lightIntensity', type: 'range', min: 10, max: 100, default: 60, step: 5, label: 'Intensidad luz', unit: '%' },
        { key: 'lightCount', type: 'range', min: 1, max: 4, default: 3, step: 1, label: 'Fuentes de luz' },
        { key: 'panelSize', type: 'range', min: 20, max: 80, default: 45, step: 5, label: 'Tamaño panel', unit: '%' }
    ]);

    var GLASS_COLORS = [
        0xff2244, 0xff8800, 0xffdd00, 0x44ff88, 0x0088ff, 0x8844ff, 0xff44cc, 0x00ffdd
    ];

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var n = Math.round(this.settings.panelCount);
        var sz = (this.settings.panelSize / 100) * 2.5;
        var opacity = this.settings.glassOpacity / 100;

        // Background
        if (mediaList && mediaList.length > 0) {
            var bgGeo = new THREE.PlaneGeometry(8, 4.5);
            var bgMat = EP.Media.createMaterial(mediaList[0]);
            var bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -0.1;
            group.add(bgMesh);
        } else {
            var bgGeo2 = new THREE.PlaneGeometry(8, 4.5);
            var bgMat2 = new THREE.MeshBasicMaterial({ color: 0x050510 });
            group.add(new THREE.Mesh(bgGeo2, bgMat2));
        }

        // Glass panels
        this._panels = [];
        for (var i = 0; i < n; i++) {
            var color = GLASS_COLORS[i % GLASS_COLORS.length];
            var geo = new THREE.CircleGeometry(sz * (0.5 + (i % 3) * 0.25), 32);
            var mat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            var mesh = new THREE.Mesh(geo, mat);
            var angle = (i / n) * Math.PI * 2;
            var r = 1.5 + (i % 2) * 0.8;
            mesh.position.set(Math.cos(angle) * r, Math.sin(angle) * r * 0.7, 0.05 + i * 0.01);
            group.add(mesh);
            this._panels.push({ mesh: mesh, baseAngle: angle, r: r, speed: 0.5 + (i % 3) * 0.3 });
        }

        // Lights (point lights)
        this._lights = [];
        var lightN = Math.round(this.settings.lightCount);
        var LIGHT_COLORS = [0xffffff, 0xffaaaa, 0xaaffaa, 0xaaaaff];
        for (var j = 0; j < lightN; j++) {
            var light = new THREE.PointLight(LIGHT_COLORS[j % LIGHT_COLORS.length], this.settings.lightIntensity / 50, 8);
            var la = (j / lightN) * Math.PI * 2;
            light.position.set(Math.cos(la) * 2.5, Math.sin(la) * 1.8, 1.5);
            group.add(light);
            this._lights.push({ light: light, baseAngle: la, r: 2.5, speed: 0.6 + j * 0.2 });
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._panels) return;
        var spd = this.settings.rotateSpeed * 0.08;

        for (var i = 0; i < this._panels.length; i++) {
            var p = this._panels[i];
            var a = p.baseAngle + time * spd * p.speed;
            p.mesh.position.x = Math.cos(a) * p.r;
            p.mesh.position.y = Math.sin(a) * p.r * 0.7;
            p.mesh.rotation.z = time * spd * 0.5 * p.speed;
        }

        for (var j = 0; j < this._lights.length; j++) {
            var l = this._lights[j];
            var la = l.baseAngle + time * spd * l.speed * 1.3;
            l.light.position.x = Math.cos(la) * l.r;
            l.light.position.y = Math.sin(la) * l.r * 0.8;
        }
    };

    effect.dispose = function() {
        EP.EffectBase.prototype.dispose.call(this);
        this._panels = null; this._lights = null;
    };

    EP.Registry.register(effect);
})();
