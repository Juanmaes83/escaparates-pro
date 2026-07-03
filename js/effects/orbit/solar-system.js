(function() {
    var effect = new EP.EffectBase('solar-system', {
        name: 'Solar System',
        category: 'orbit',
        icon: '🌍',
        description: 'Sistema solar procedural — esferas texturizadas con imágenes orbitando una estrella central'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'planetCount', type: 'range', min: 2, max: 8, default: 5, step: 1, label: 'Planetas' },
        { key: 'orbitSpeed', type: 'range', min: 1, max: 20, default: 5, step: 1, label: 'Velocidad órbita' },
        { key: 'starColor', type: 'color', default: '#ffcc00', label: 'Color estrella' },
        { key: 'starSize', type: 'range', min: 5, max: 50, default: 20, step: 5, label: 'Tamaño estrella', unit: '%' },
        { key: 'tiltAngle', type: 'range', min: 0, max: 60, default: 20, step: 5, label: 'Inclinación sistema', unit: '°' },
        { key: 'bgColor', type: 'color', default: '#00010a', label: 'Color espacio' }
    ]);

    var PLANET_COLORS = [0x4488ff, 0xff6644, 0x88ffaa, 0xffcc44, 0xaa66ff, 0x44ffdd, 0xff4488, 0xccaa44];

    function sr(s) { var r = (Math.sin(s + 1) * 43758.5453) % 1; return r < 0 ? r + 1 : r; }

    effect.build = function(mediaList) {
        var group = new THREE.Group();
        var ml = mediaList || [];
        var n = Math.round(this.settings.planetCount);
        var starC = parseInt((this.settings.starColor || '#ffcc00').replace('#',''), 16);
        var bgC = parseInt((this.settings.bgColor || '#00010a').replace('#',''), 16);
        var starSz = this.settings.starSize / 100 * 0.8;
        var tilt = this.settings.tiltAngle * Math.PI / 180;

        // Background
        var bgGeo = new THREE.PlaneGeometry(8, 4.5);
        var bgMat = new THREE.MeshBasicMaterial({ color: bgC });
        group.add(new THREE.Mesh(bgGeo, bgMat));

        // Stars (point cloud background)
        var starGeo = new THREE.BufferGeometry();
        var starPos = new Float32Array(300 * 3);
        for (var s = 0; s < 300; s++) {
            starPos[s*3]   = (sr(s*3) - 0.5) * 8;
            starPos[s*3+1] = (sr(s*3+1) - 0.5) * 5;
            starPos[s*3+2] = (sr(s*3+2) - 0.5) * 2 - 0.5;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.7, depthWrite: false });
        group.add(new THREE.Points(starGeo, starMat));

        // System group (tilted)
        var sysGroup = new THREE.Group();
        sysGroup.rotation.x = tilt;
        group.add(sysGroup);

        // Central star
        var sunGeo = new THREE.SphereGeometry(starSz, 24, 16);
        var sunMat = new THREE.MeshBasicMaterial({ color: starC });
        var sun = new THREE.Mesh(sunGeo, sunMat);
        sysGroup.add(sun);
        this._sun = sun;

        // Sun glow
        var glowGeo = new THREE.SphereGeometry(starSz * 1.5, 16, 12);
        var glowMat = new THREE.MeshBasicMaterial({ color: starC, transparent: true, opacity: 0.2, side: THREE.BackSide, depthWrite: false });
        sun.add(new THREE.Mesh(glowGeo, glowMat));

        // Sun light
        var sunLight = new THREE.PointLight(starC, 2, 12);
        sysGroup.add(sunLight);

        // Planets
        this._planets = [];
        var minOrbit = starSz * 1.8;
        var maxOrbit = 3.2;
        for (var i = 0; i < n; i++) {
            var planetR = 0.12 + sr(i * 7) * 0.25;
            var orbitR = minOrbit + (i / (n - 1 || 1)) * (maxOrbit - minOrbit);
            var color = PLANET_COLORS[i % PLANET_COLORS.length];

            var geo;
            var mat;
            if (ml.length > 0) {
                geo = new THREE.SphereGeometry(planetR, 24, 16);
                var baseMat = EP.Media.createMaterial(ml[i % ml.length]);
                if (baseMat.map) {
                    mat = new THREE.MeshPhongMaterial({ map: baseMat.map, shininess: 40 });
                    baseMat.dispose();
                } else {
                    mat = baseMat;
                }
            } else {
                geo = new THREE.SphereGeometry(planetR, 24, 16);
                mat = new THREE.MeshPhongMaterial({ color: color, shininess: 40 });
            }
            var planet = new THREE.Mesh(geo, mat);

            // Orbit ring
            var ringGeo = new THREE.TorusGeometry(orbitR, 0.005, 4, 64);
            var ringMat = new THREE.MeshBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.4 });
            sysGroup.add(new THREE.Mesh(ringGeo, ringMat));

            var pivot = new THREE.Group();
            planet.position.x = orbitR;
            pivot.add(planet);
            sysGroup.add(pivot);
            this._planets.push({
                pivot: pivot, planet: planet,
                speed: (0.3 + sr(i * 11) * 0.7) * (1 / (i + 1) * 2),
                phase: sr(i * 5) * Math.PI * 2,
                selfSpeed: 0.5 + sr(i * 13)
            });
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._planets) return;
        var spd = this.settings.orbitSpeed * 0.04;

        if (this._sun) {
            this._sun.rotation.y = time * 0.3;
            var pulse = 1 + Math.sin(time * 2) * 0.05;
            this._sun.scale.set(pulse, pulse, pulse);
        }

        for (var i = 0; i < this._planets.length; i++) {
            var p = this._planets[i];
            p.pivot.rotation.y = p.phase + time * spd * p.speed;
            p.planet.rotation.y = time * p.selfSpeed;
        }
    };

    effect.dispose = function() { this._planets = null; this._sun = null; };

    EP.Registry.register(effect);
})();
