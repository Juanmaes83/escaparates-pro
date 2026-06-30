(function() {
    var effect = new EP.EffectBase('snow-wind', {
        name: '3D Snow & Wind',
        category: '3d-perspective',
        icon: '❄️',
        description: 'Efecto atmosferico de nieve y viento 3D sobre las imagenes — particulas cayendo con turbulencia configurable'
    }, [
        { key: 'particleCount', type: 'range', min: 100, max: 2000, default: 800, step: 50, label: 'Snowflakes' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 40, label: 'Fall Speed', unit: '%' },
        { key: 'windStrength', type: 'range', min: 0, max: 100, default: 35, label: 'Wind', unit: '%' },
        { key: 'flakeSize', type: 'range', min: 10, max: 100, default: 40, label: 'Flake Size', unit: '%' },
        { key: 'photoLayout', type: 'range', min: 1, max: 4, default: 2, step: 1, label: 'Photo Columns' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0e1a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var count = this.settings.particleCount;
        var fSize = 0.02 + 0.08 * this.settings.flakeSize / 100;
        var cols = this.settings.photoLayout;

        var photoGroup = new THREE.Group();
        var total = Math.min(mediaList.length, cols * 2);
        var pw = 3.5 / cols;
        var ph = pw * 0.7;

        for (var i = 0; i < total; i++) {
            var tex = null;
            if (mediaList[i % mediaList.length].element) {
                tex = new THREE.Texture(mediaList[i % mediaList.length].element);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
            }
            var geo = EP.RoundedPlaneGeometry ? EP.RoundedPlaneGeometry(pw, ph, 0.03) : new THREE.PlaneGeometry(pw, ph);
            var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
            var mesh = new THREE.Mesh(geo, mat);
            var col = i % cols;
            var row = Math.floor(i / cols);
            mesh.position.x = (col - (cols - 1) / 2) * (pw + 0.15);
            mesh.position.y = -(row * (ph + 0.15)) + ph / 2;
            mesh.position.z = -1;
            mesh.userData = { isCard: true };
            photoGroup.add(mesh);
        }
        group.add(photoGroup);

        var positions = new Float32Array(count * 3);
        var velocities = new Float32Array(count * 3);
        var sizes = new Float32Array(count);
        var opacities = new Float32Array(count);
        var spreadX = 12, spreadY = 10, spreadZ = 8;

        for (var p = 0; p < count; p++) {
            positions[p * 3] = (Math.random() - 0.5) * spreadX;
            positions[p * 3 + 1] = (Math.random() - 0.5) * spreadY;
            positions[p * 3 + 2] = (Math.random() - 0.5) * spreadZ;
            velocities[p * 3] = (Math.random() - 0.5) * 0.3;
            velocities[p * 3 + 1] = -(0.5 + Math.random() * 1.5);
            velocities[p * 3 + 2] = (Math.random() - 0.5) * 0.2;
            sizes[p] = fSize * (0.5 + Math.random());
            opacities[p] = 0.4 + Math.random() * 0.6;
        }

        var particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('customSize', new THREE.BufferAttribute(sizes, 1));

        var particleMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: fSize * 15,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            sizeAttenuation: true
        });

        var particles = new THREE.Points(particleGeo, particleMat);
        particles.userData = { isSnow: true };
        group.add(particles);

        this._velocities = velocities;
        this._spreadX = spreadX;
        this._spreadY = spreadY;
        this._spreadZ = spreadZ;
        this._particles = particles;
        this._photoGroup = photoGroup;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._particles) return;
        var speed = this.settings.speed / 100;
        var wind = this.settings.windStrength / 100;

        var pos = this._particles.geometry.attributes.position.array;
        var vel = this._velocities;
        var sx = this._spreadX, sy = this._spreadY, sz = this._spreadZ;

        var windX = Math.sin(time * 0.3) * wind * 2;
        var windZ = Math.cos(time * 0.25) * wind * 0.5;

        for (var i = 0; i < pos.length / 3; i++) {
            var i3 = i * 3;
            pos[i3] += (vel[i3] + windX) * dt * speed;
            pos[i3 + 1] += vel[i3 + 1] * dt * speed;
            pos[i3 + 2] += (vel[i3 + 2] + windZ) * dt * speed;

            pos[i3] += Math.sin(time * 2 + i * 0.1) * 0.002;

            if (pos[i3 + 1] < -sy / 2) {
                pos[i3 + 1] = sy / 2;
                pos[i3] = (Math.random() - 0.5) * sx;
                pos[i3 + 2] = (Math.random() - 0.5) * sz;
            }
            if (pos[i3] > sx / 2) pos[i3] = -sx / 2;
            if (pos[i3] < -sx / 2) pos[i3] = sx / 2;
        }

        this._particles.geometry.attributes.position.needsUpdate = true;

        for (var j = 0; j < this._photoGroup.children.length; j++) {
            var card = this._photoGroup.children[j];
            if (card.material && card.material.map) {
                card.material.map.needsUpdate = true;
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.08) * 0.3,
            Math.cos(time * 0.06) * 0.2,
            6
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
