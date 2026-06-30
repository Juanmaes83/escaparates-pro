(function() {
    var effect = new EP.EffectBase('particle-stream', {
        name: 'Before/After Stream',
        category: 'motion',
        icon: '🌊',
        description: 'Particulas que fluyen y se ensamblan formando cada imagen — efecto stream cinematografico de construccion y deconstruccion'
    }, [
        { key: 'particleCount', type: 'range', min: 200, max: 2000, default: 800, step: 50, label: 'Particles' },
        { key: 'assembleSpeed', type: 'range', min: 10, max: 100, default: 50, label: 'Assemble Speed', unit: '%' },
        { key: 'scatter', type: 'range', min: 20, max: 100, default: 60, label: 'Scatter Range', unit: '%' },
        { key: 'holdTime', type: 'range', min: 10, max: 60, default: 30, label: 'Hold Time', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#050510', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var pCount = this.settings.particleCount;
        var scatter = this.settings.scatter / 100;

        var imgW = 6;
        var imgH = 4.5;

        var geo = new THREE.BufferGeometry();
        var positions = new Float32Array(pCount * 3);
        var colors = new Float32Array(pCount * 3);
        var homePositions = new Float32Array(pCount * 3);
        var scatterPositions = new Float32Array(pCount * 3);

        for (var p = 0; p < pCount; p++) {
            var hx = (Math.random() - 0.5) * imgW;
            var hy = (Math.random() - 0.5) * imgH;

            homePositions[p * 3] = hx;
            homePositions[p * 3 + 1] = hy;
            homePositions[p * 3 + 2] = 0;

            var angle = Math.random() * Math.PI * 2;
            var dist = 3 + Math.random() * 8 * scatter;
            scatterPositions[p * 3] = Math.cos(angle) * dist;
            scatterPositions[p * 3 + 1] = Math.sin(angle) * dist * 0.6;
            scatterPositions[p * 3 + 2] = (Math.random() - 0.5) * 5 * scatter;

            positions[p * 3] = scatterPositions[p * 3];
            positions[p * 3 + 1] = scatterPositions[p * 3 + 1];
            positions[p * 3 + 2] = scatterPositions[p * 3 + 2];

            colors[p * 3] = 0.6 + Math.random() * 0.4;
            colors[p * 3 + 1] = 0.6 + Math.random() * 0.4;
            colors[p * 3 + 2] = 0.8 + Math.random() * 0.2;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        var mat = new THREE.PointsMaterial({
            size: 0.04,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });

        var points = new THREE.Points(geo, mat);
        points.userData = { isParticles: true };
        group.add(points);

        this._homePos = homePositions;
        this._scatterPos = scatterPositions;
        this._pCount = pCount;

        for (var img = 0; img < mediaList.length; img++) {
            var tex = null;
            var aspect = 1;
            if (mediaList[img].element) {
                tex = new THREE.Texture(mediaList[img].element);
                tex.needsUpdate = true;
                tex.minFilter = THREE.LinearFilter;
                var ew = mediaList[img].element.videoWidth || mediaList[img].element.naturalWidth || 1;
                var eh = mediaList[img].element.videoHeight || mediaList[img].element.naturalHeight || 1;
                aspect = ew / eh;
            }
            var w = aspect >= 1 ? imgW : imgW * aspect;
            var h = aspect >= 1 ? imgW / aspect : imgW;
            var iMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 });
            var iMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), iMat);
            iMesh.position.z = -0.1;
            iMesh.visible = false;
            iMesh.userData = { isImage: true, imageIndex: img };
            group.add(iMesh);
        }

        this.group = group;
        this._imageCount = mediaList.length;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var count = this._imageCount;
        if (count === 0) return;
        var holdTime = this.settings.holdTime / 100;
        var segDur = 1 / count;

        var particles = null;
        var images = [];
        for (var c = 0; c < this.group.children.length; c++) {
            if (this.group.children[c].userData.isParticles) particles = this.group.children[c];
            if (this.group.children[c].userData.isImage) images.push(this.group.children[c]);
        }
        if (!particles) return;

        var currentIdx = Math.floor(t * count) % count;
        var lt = (t * count) % 1;

        var assembleEnd = 0.3;
        var holdEnd = assembleEnd + holdTime;

        var blend;
        if (lt < assembleEnd) {
            blend = lt / assembleEnd;
            blend = blend * blend * (3 - 2 * blend);
        } else if (lt < holdEnd) {
            blend = 1;
        } else {
            blend = 1 - (lt - holdEnd) / (1 - holdEnd);
            blend = blend * blend * (3 - 2 * blend);
        }

        var pos = particles.geometry.attributes.position.array;
        var home = this._homePos;
        var scat = this._scatterPos;

        for (var p = 0; p < this._pCount; p++) {
            var i3 = p * 3;
            pos[i3] = scat[i3] + (home[i3] - scat[i3]) * blend;
            pos[i3 + 1] = scat[i3 + 1] + (home[i3 + 1] - scat[i3 + 1]) * blend;
            pos[i3 + 2] = scat[i3 + 2] + (home[i3 + 2] - scat[i3 + 2]) * blend;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        for (var im = 0; im < images.length; im++) {
            if (im === currentIdx && blend > 0.8) {
                images[im].visible = true;
                images[im].material.opacity = (blend - 0.8) / 0.2 * 0.7;
                if (images[im].material.map) images[im].material.map.needsUpdate = true;
            } else {
                images[im].visible = false;
            }
        }

        EP.Core.camera.position.set(
            Math.sin(time * 0.2) * 0.5,
            Math.cos(time * 0.15) * 0.3,
            8
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
