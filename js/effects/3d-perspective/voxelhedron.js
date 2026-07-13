(function() {
    var effect = new EP.EffectBase('voxelhedron', {
        name: 'VoxelHedron',
        category: '3d-perspective',
        icon: '💎',
        description: 'Piramide doble 3D de bloques con imagenes — estructura tipo diamante voxel con rotacion multi-eje'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'layers', type: 'range', min: 3, max: 7, default: 5, step: 1, label: 'Layers' },
        { key: 'speed', type: 'range', min: 10, max: 100, default: 25, label: 'Rotation Speed', unit: '%' },
        { key: 'blockSize', type: 'range', min: 30, max: 100, default: 55, label: 'Block Size', unit: '%' },
        { key: 'spread', type: 'range', min: 20, max: 100, default: 50, label: 'Spread', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#080818', label: 'Background' }
    ]);

    effect.capabilities = { supportsMotionDirection: true, supportsVideo: true, usesCamera: true, usesPostProcessing: false, usesParticlesShaders: false, mobileRisk: 'medium', minMedia: 1, exportSafe: true, hasErrorBoundary: true };

    function directionVector(value) {
        if (value === 'right-left') return { x: -1, y: 0, z: -1 };
        if (value === 'top-bottom') return { x: 0, y: -1, z: 1 };
        if (value === 'bottom-top') return { x: 0, y: 1, z: -1 };
        return { x: 1, y: 0, z: 1 };
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var numLayers = this.settings.layers;
        var bSize = 0.4 + 0.8 * this.settings.blockSize / 100;
        var gap = 0.05 + 0.15 * this.settings.spread / 100;
        var stride = bSize + gap;

        var pyramidGroup = new THREE.Group();
        pyramidGroup.userData = { isPyramid: true };

        var imgIdx = 0;
        var textureCache = {};

        function textureFor(index) {
            if (textureCache[index]) return textureCache[index];
            var media = mediaList[index];
            if (!media || !media.element) return null;
            textureCache[index] = EP.Media && EP.Media.createTexture ?
                EP.Media.createTexture(media, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }) :
                new THREE.Texture(media.element);
            textureCache[index].needsUpdate = true;
            return textureCache[index];
        }

        for (var layer = 0; layer < numLayers * 2 - 1; layer++) {
            var distFromCenter = Math.abs(layer - (numLayers - 1));
            var blocksPerSide = numLayers - distFromCenter;
            var yPos = (layer - (numLayers - 1)) * stride;

            for (var bx = 0; bx < blocksPerSide; bx++) {
                for (var bz = 0; bz < blocksPerSide; bz++) {
                    var xPos = (bx - (blocksPerSide - 1) / 2) * stride;
                    var zPos = (bz - (blocksPerSide - 1) / 2) * stride;

                    var isEdge = bx === 0 || bx === blocksPerSide - 1 || bz === 0 || bz === blocksPerSide - 1;
                    if (!isEdge && blocksPerSide > 2) continue;

                    var mi = imgIdx % mediaList.length; imgIdx++;
                    var tex = textureFor(mi);

                    var boxGeo = new THREE.BoxGeometry(bSize, bSize, bSize);
                    var materials = [];
                    for (var f = 0; f < 6; f++) {
                        if (f === 4 || f === 5) {
                            materials.push(new THREE.MeshPhongMaterial({
                                map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.9
                            }));
                        } else {
                            materials.push(new THREE.MeshPhongMaterial({
                                color: 0x2244aa, transparent: true, opacity: 0.3,
                                shininess: 80, specular: 0x445566
                            }));
                        }
                    }

                    var mesh = new THREE.Mesh(boxGeo, materials);
                    mesh.position.set(xPos, yPos, zPos);
                    mesh.userData = { isBlock: true, blockIndex: imgIdx };
                    pyramidGroup.add(mesh);
                }
            }
        }

        var edgesGroup = new THREE.Group();
        pyramidGroup.traverse(function(child) {
            if (child.userData.isBlock) {
                var edgeGeo = new THREE.EdgesGeometry(child.geometry);
                var edgeMat = new THREE.LineBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.4 });
                var edges = new THREE.LineSegments(edgeGeo, edgeMat);
                edges.position.copy(child.position);
                edgesGroup.add(edges);
            }
        });
        pyramidGroup.add(edgesGroup);

        group.add(pyramidGroup);

        var light1 = new THREE.DirectionalLight(0xffffff, 1);
        light1.position.set(5, 5, 8);
        group.add(light1);
        var light2 = new THREE.DirectionalLight(0x4466aa, 0.5);
        light2.position.set(-5, -3, -5);
        group.add(light2);
        var ambient = new THREE.AmbientLight(0x223344, 0.4);
        group.add(ambient);

        this._numLayers = numLayers;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var enabled = this.settings.playbackMotion !== 'off';
        var speed = this.settings.speed / 100 * (enabled ? this.settings.playbackMotionSpeed / 100 : 0);
        var direction = directionVector(this.settings.motionDirection);

        for (var i = 0; i < this.group.children.length; i++) {
            var child = this.group.children[i];
            if (!child.userData.isPyramid) continue;

            child.rotation.y = time * speed * 0.2 * direction.x;
            child.rotation.x = Math.sin(time * 0.15 * speed) * 0.2 * (direction.y || 1);
            child.rotation.z = Math.sin(time * 0.1 * speed) * 0.1 * direction.z;

            var bob = Math.sin(time * 0.4 * speed) * 0.15 * (direction.y || 1);
            child.position.y = bob;

            child.traverse(function(block) {
                if (block.userData.isBlock && block.material) {
                    var mats = Array.isArray(block.material) ? block.material : [block.material];
                    for (var m = 0; m < mats.length; m++) {
                        if (mats[m].map && mats[m].map.isVideoTexture) mats[m].map.needsUpdate = true;
                    }
                }
            });
        }

        var camDist = 4 + this._numLayers * 1.5;
        EP.Core.camera.position.set(
            Math.sin(time * 0.1) * 1.5,
            Math.cos(time * 0.08) * 1,
            camDist
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this.group) {
            this.group.traverse(function(child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    var mats = Array.isArray(child.material) ? child.material : [child.material];
                    for (var m = 0; m < mats.length; m++) {
                        if (mats[m].map && mats[m].map.dispose) mats[m].map.dispose();
                        mats[m].dispose();
                    }
                }
            });
            if (this.group.parent) this.group.parent.remove(this.group);
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        this.group = null;
    };

    EP.Registry.register(effect);
})();
