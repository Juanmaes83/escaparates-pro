(function() {
    var effect = new EP.EffectBase('icosahedron-lights', {
        name: 'Icosahedron Lights',
        category: 'orbit',
        icon: '💎',
        description: 'Icosaedros 3D con PointLights adjuntas — clusters de geometría brillante con sombras animadas'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'count', type: 'range', min: 3, max: 12, default: 6, step: 1, label: 'Número icosaedros' },
        { key: 'orbitRadius', type: 'range', min: 1, max: 8, default: 3, step: 1, label: 'Radio órbita' },
        { key: 'orbitSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad órbita' },
        { key: 'lightIntensity', type: 'range', min: 10, max: 100, default: 60, step: 5, label: 'Intensidad luz', unit: '%' },
        { key: 'scale', type: 'range', min: 10, max: 100, default: 35, step: 5, label: 'Tamaño icosaedro', unit: '%' },
        { key: 'bgColor', type: 'color', default: '#04080f', label: 'Color fondo' }
    ]);

    var CLUSTER_COLORS = [0xff2244, 0xff8800, 0x44ff88, 0x0088ff, 0xaa44ff, 0xff44cc, 0x00ffdd, 0xffdd00];

    function sr(s) { var r = (Math.sin(s + 1) * 43758.5453) % 1; return r < 0 ? r + 1 : r; }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var n = Math.round(this.settings.count);
        var sc = this.settings.scale / 100 * 0.6;
        var R = this.settings.orbitRadius * 0.5;
        var li = this.settings.lightIntensity / 100;
        var bgC = parseInt((this.settings.bgColor || '#04080f').replace('#',''), 16);

        // Dark background plane
        var bgGeo = new THREE.PlaneGeometry(8, 4.5);
        var bgMat = new THREE.MeshBasicMaterial({ color: bgC });
        group.add(new THREE.Mesh(bgGeo, bgMat));

        // Ambient
        var amb = new THREE.AmbientLight(0x111122, 0.5);
        group.add(amb);

        this._clusters = [];
        for (var i = 0; i < n; i++) {
            var color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
            var pivot = new THREE.Group();

            // Main icosahedron
            var geo = new THREE.IcosahedronGeometry(sc, 0);
            var mat = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.3,
                shininess: 120,
                transparent: true,
                opacity: 0.9
            });
            var mesh = new THREE.Mesh(geo, mat);
            pivot.add(mesh);

            // Attached point light
            var light = new THREE.PointLight(color, li * 2, 6);
            light.position.set(0, 0, 0.5);
            pivot.add(light);

            // Small satellite
            var sGeo = new THREE.IcosahedronGeometry(sc * 0.35, 0);
            var sMat = new THREE.MeshPhongMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 });
            var sat = new THREE.Mesh(sGeo, sMat);
            sat.position.set(sc * 1.6, 0, 0);
            pivot.add(sat);

            var baseAngle = (i / n) * Math.PI * 2;
            pivot.position.set(
                Math.cos(baseAngle) * R,
                Math.sin(baseAngle) * R * 0.65,
                (sr(i * 7) - 0.5) * 1.5
            );
            group.add(pivot);
            this._clusters.push({
                pivot: pivot, mesh: mesh, sat: sat,
                baseAngle: baseAngle, R: R,
                speed: 0.4 + sr(i * 13) * 0.6,
                selfSpeed: 0.8 + sr(i * 17) * 1.2,
                satAngle: sr(i * 11) * Math.PI * 2
            });
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._clusters) return;
        var spd = this.settings.orbitSpeed * 0.04;
        var R = this.settings.orbitRadius * 0.5;

        for (var i = 0; i < this._clusters.length; i++) {
            var cl = this._clusters[i];
            var a = cl.baseAngle + time * spd * cl.speed;
            cl.pivot.position.x = Math.cos(a) * R;
            cl.pivot.position.y = Math.sin(a) * R * 0.65;
            cl.mesh.rotation.x = time * cl.selfSpeed * 0.5;
            cl.mesh.rotation.y = time * cl.selfSpeed;
            cl.satAngle += 0.04 * cl.selfSpeed * (dt || 0.016) * 60;
            cl.sat.position.x = Math.cos(cl.satAngle) * 0.6 * (this.settings.scale / 100);
            cl.sat.position.y = Math.sin(cl.satAngle) * 0.3 * (this.settings.scale / 100);
        }
    };

    effect.dispose = function() { this._clusters = null; };

    EP.Registry.register(effect);
})();
