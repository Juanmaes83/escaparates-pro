(function() {
    var effect = new EP.EffectBase('spaceship-horde-pro', {
        name: 'A Horde of 25k Spaceships PRO',
        category: '3d-perspective',
        icon: 'SH',
        description: 'Horda de naves instanciadas orbitando un planeta con el GLB original craft_miner'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'count', type: 'range', min: 1000, max: 25000, default: 25000, step: 500, label: 'Spaceships' },
        { key: 'orbitScale', type: 'range', min: 55, max: 180, default: 100, step: 1, label: 'Orbit Scale', unit: '%' },
        { key: 'speed', type: 'range', min: 10, max: 260, default: 100, step: 1, label: 'Speed', unit: '%' },
        { key: 'shipScale', type: 'range', min: 8, max: 60, default: 24, step: 1, label: 'Ship Size', unit: '%' },
        { key: 'planetSize', type: 'range', min: 40, max: 180, default: 100, step: 1, label: 'Planet', unit: '%' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    function rnd(min, max) {
        return min + Math.random() * (max - min);
    }

    function findMesh(root) {
        var found = null;
        root.traverse(function(child) {
            if (!found && child.isMesh && child.geometry) found = child;
        });
        return found;
    }

    function fallbackShipGeometry() {
        var geometry = new THREE.ConeGeometry(0.24, 0.82, 4);
        geometry.rotateX(Math.PI * 0.5);
        return geometry;
    }

    function addHorde(self, geometry, fallback) {
        if (!self.group || !geometry) return;
        var count = Math.floor(self.settings.count);
        var material = new THREE.MeshPhongMaterial({
            flatShading: true,
            shininess: 100,
            vertexColors: true
        });
        var horde = new THREE.InstancedMesh(geometry.clone(), material, count);
        horde.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        horde.scale.setScalar(self.settings.shipScale / 100);
        horde.userData.fallbackGeometry = !!fallback;
        self.spaceships = [];
        var color = new THREE.Color();
        for (var i = 0; i < count; i++) {
            self.spaceships.push({
                radius: rnd(20, 200) + rnd(20, 200),
                offset: rnd(0, Math.PI * 2),
                speed: rnd(0.01, 0.1)
            });
            color.setHSL(Math.random(), 1, 0.5 + 0.5 * Math.random());
            horde.setColorAt(i, color);
        }
        if (horde.instanceColor) horde.instanceColor.needsUpdate = true;
        self.horde = horde;
        self.group.add(horde);
    }

    effect.build = function() {
        var group = new THREE.Group();
        var earth = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.45, 5),
            new THREE.MeshLambertMaterial({ color: new THREE.Color('royalblue') })
        );
        earth.userData.isPlanet = true;
        group.add(earth);

        group.add(new THREE.AmbientLight(0xffffff, 0.5));
        var light = new THREE.DirectionalLight(0xffffff, 0.65);
        light.position.set(1, 1, 1);
        light.userData.isFollowLight = true;
        group.add(light);

        this.group = group;
        this.horde = null;
        this.spaceships = [];
        this.tmpMatrix = new THREE.Matrix4();
        this.tmpEuler = new THREE.Euler();
        this.tmpPosition = new THREE.Vector3();
        this.loadToken = (this.loadToken || 0) + 1;

        if (typeof THREE.GLTFLoader !== 'function') {
            addHorde(this, fallbackShipGeometry(), true);
            return group;
        }

        var token = this.loadToken;
        var self = this;
        new THREE.GLTFLoader().load('assets/effects/craft-miner.glb', function(gltf) {
            if (token !== self.loadToken || !self.group) return;
            var source = findMesh(gltf.scene);
            addHorde(self, source ? source.geometry : fallbackShipGeometry(), !source);
        }, undefined, function(err) {
            if (token === self.loadToken && self.group && !self.horde) addHorde(self, fallbackShipGeometry(), true);
        });

        return group;
    };

    effect.update = function(time) {
        if (!this.group) return;
        var scale = 0.011 * this.settings.orbitScale / 100;
        var speedMult = this.settings.speed / 100;
        var planet = this.group.children[0];
        if (planet) {
            planet.scale.setScalar(this.settings.planetSize / 100);
            planet.rotation.y = time * 0.12;
        }
        var camera = EP.Core.camera;
        this.group.children.forEach(function(child) {
            if (child.userData && child.userData.isFollowLight && camera) child.position.copy(camera.position).normalize();
        });
        if (!this.horde) return;
        this.horde.scale.setScalar(this.settings.shipScale / 100);
        for (var i = 0; i < this.spaceships.length; i++) {
            var ship = this.spaceships[i];
            this.tmpPosition.setFromSphericalCoords(ship.radius * scale, i, ship.speed * time * speedMult + ship.offset);
            this.tmpEuler.setFromVector3(this.tmpPosition, 'XYZ');
            this.tmpMatrix.makeRotationFromEuler(this.tmpEuler);
            this.tmpMatrix.setPosition(this.tmpPosition);
            this.horde.setMatrixAt(i, this.tmpMatrix);
        }
        this.horde.instanceMatrix.needsUpdate = true;
        this.group.rotation.y = time * 0.025 * speedMult;
    };

    effect.dispose = function() {
        this.loadToken = (this.loadToken || 0) + 1;
        this.horde = null;
        this.spaceships = [];
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
