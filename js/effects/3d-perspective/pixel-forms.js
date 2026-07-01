(function() {
    var effect = new EP.EffectBase('pixel-forms', {
        name: 'Pixel Forms 3D',
        category: '3d-perspective',
        icon: '🧊',
        description: 'Convierte imagenes en miles de formas 3D coloreadas por pixel — cubos, diamantes, hexagonos'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'shape', type: 'select', options: ['Cube', 'Pyramid', 'Hexagon', 'Octahedron', 'Diamond', 'Ring'], default: 'Cube', label: 'Shape' },
        { key: 'resolution', type: 'range', min: 10, max: 80, default: 40, step: 1, label: 'Resolution' },
        { key: 'shapeScale', type: 'range', min: 20, max: 100, default: 70, label: 'Shape Size', unit: '%' },
        { key: 'rotationSpeed', type: 'range', min: 0, max: 100, default: 40, label: 'Rotation', unit: '%' },
        { key: 'elevation', type: 'range', min: 0, max: 100, default: 30, label: 'Elevation', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'snappy'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a12', label: 'Background' }
    ]);

    var geometries = {};

    function getGeometries() {
        if (geometries.Cube) return geometries;
        geometries.Cube = new THREE.BoxGeometry(1, 1, 1);
        var pyGeo = new THREE.CylinderGeometry(0, 0.7, 1, 4);
        pyGeo.rotateY(Math.PI / 4);
        geometries.Pyramid = pyGeo;
        geometries.Hexagon = new THREE.CylinderGeometry(0.6, 0.6, 1, 6);
        geometries.Octahedron = new THREE.OctahedronGeometry(0.7);
        var diaGeo = new THREE.OctahedronGeometry(0.5);
        diaGeo.scale(1, 2, 1);
        geometries.Diamond = diaGeo;
        geometries.Ring = new THREE.TorusGeometry(0.5, 0.2, 16, 32);
        return geometries;
    }

    function sampleColors(mediaObj, gridW, gridH) {
        var canvas = document.createElement('canvas');
        canvas.width = gridW;
        canvas.height = gridH;
        var ctx = canvas.getContext('2d');
        try {
            ctx.drawImage(mediaObj.element, 0, 0, gridW, gridH);
        } catch (e) {
            for (var y = 0; y < gridH; y++) {
                for (var x = 0; x < gridW; x++) {
                    var hue = ((y * gridW + x) * 7) % 360;
                    ctx.fillStyle = 'hsl(' + hue + ',60%,50%)';
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        return ctx.getImageData(0, 0, gridW, gridH).data;
    }

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var geos = getGeometries();
        var maxRes = this.settings.resolution;
        var scale = this.settings.shapeScale / 100 * 0.9;
        var shapeName = this.settings.shape;
        var geo = geos[shapeName] || geos.Cube;

        var mat = new THREE.MeshStandardMaterial({
            roughness: 0.3,
            metalness: 0.2
        });

        for (var img = 0; img < mediaList.length; img++) {
            var media = mediaList[img];
            var aspect = 1;
            if (media.element) {
                var ew = media.element.videoWidth || media.element.naturalWidth || media.element.width || 1;
                var eh = media.element.videoHeight || media.element.naturalHeight || media.element.height || 1;
                aspect = ew / eh;
            }

            var gridW, gridH;
            if (aspect >= 1) {
                gridW = maxRes;
                gridH = Math.max(1, Math.floor(maxRes / aspect));
            } else {
                gridH = maxRes;
                gridW = Math.max(1, Math.floor(maxRes * aspect));
            }

            var pixelData = sampleColors(media, gridW, gridH);
            var instanceCount = gridW * gridH;
            var instMesh = new THREE.InstancedMesh(geo, mat.clone(), instanceCount);
            var dummy = new THREE.Object3D();

            var cellSize = 1.0;
            var offsetX = (gridW * cellSize) / 2 - cellSize / 2;
            var offsetY = (gridH * cellSize) / 2 - cellSize / 2;
            var tempColor = new THREE.Color();
            var positions = [];
            var idx = 0;

            for (var y = 0; y < gridH; y++) {
                for (var x = 0; x < gridW; x++) {
                    var posX = x * cellSize - offsetX;
                    var posY = -(y * cellSize - offsetY);
                    positions.push(posX, posY, 0);
                    dummy.position.set(posX, posY, 0);
                    dummy.scale.setScalar(scale);
                    dummy.updateMatrix();
                    instMesh.setMatrixAt(idx, dummy.matrix);

                    var pi = (y * gridW + x) * 4;
                    tempColor.setRGB(pixelData[pi] / 255, pixelData[pi + 1] / 255, pixelData[pi + 2] / 255);
                    instMesh.setColorAt(idx, tempColor);
                    idx++;
                }
            }

            instMesh.instanceMatrix.needsUpdate = true;
            instMesh.instanceColor.needsUpdate = true;
            instMesh.visible = false;

            instMesh.userData = {
                imageIndex: img,
                gridW: gridW,
                gridH: gridH,
                positions: positions,
                instanceCount: instanceCount
            };
            group.add(instMesh);
        }

        var ambLight = new THREE.AmbientLight(0xffffff, 0.8);
        ambLight.userData = { isLight: true };
        group.add(ambLight);
        var dirL = new THREE.DirectionalLight(0xffffff, 0.6);
        dirL.position.set(20, 20, 30);
        dirL.userData = { isLight: true };
        group.add(dirL);

        this._baseFov = EP.Core.camera.fov;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var meshes = [];
        for (var i = 0; i < this.group.children.length; i++) {
            if (!this.group.children[i].userData.isLight) meshes.push(this.group.children[i]);
        }
        var count = meshes.length;
        if (count === 0) return;
        var segDur = 1 / count;
        var rotSpeed = this.settings.rotationSpeed / 100 * 2;
        var scale = this.settings.shapeScale / 100 * 0.9;
        var elevation = this.settings.elevation / 100;
        var dummy = new THREE.Object3D();

        for (var idx = 0; idx < count; idx++) {
            var mesh = meshes[idx];
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;

            if (t >= segStart && t < segEnd) {
                mesh.visible = true;
                var lt = (t - segStart) / segDur;
                var d = mesh.userData;

                var appearPhase = lt < 0.2 ? lt / 0.2 : 1;
                var disappearPhase = lt > 0.85 ? (lt - 0.85) / 0.15 : 0;
                appearPhase = appearPhase * appearPhase * (3 - 2 * appearPhase);

                for (var i = 0; i < d.instanceCount; i++) {
                    var px = d.positions[i * 3];
                    var py = d.positions[i * 3 + 1];
                    var pz = d.positions[i * 3 + 2];

                    var elevZ = Math.sin(lt * Math.PI) * elevation * 2;
                    var waveZ = Math.sin(time * 3 + px * 0.5 + py * 0.5) * elevZ * 0.3;

                    dummy.position.set(px, py, pz + waveZ);
                    dummy.rotation.x = time * rotSpeed + i * 0.001;
                    dummy.rotation.y = time * rotSpeed + i * 0.002;
                    dummy.rotation.z = time * rotSpeed * 0.5;

                    var s = scale * appearPhase * (1 - disappearPhase);
                    dummy.scale.setScalar(Math.max(0.001, s));
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i, dummy.matrix);
                }
                mesh.instanceMatrix.needsUpdate = true;

                var maxDim = Math.max(d.gridW, d.gridH);
                EP.Core.camera.position.z = maxDim * 1.1;
                EP.Core.camera.position.x = Math.sin(lt * Math.PI * 2) * maxDim * 0.15;
                EP.Core.camera.position.y = Math.cos(lt * Math.PI * 1.5) * maxDim * 0.1;
                EP.Core.camera.lookAt(0, 0, 0);
            } else {
                mesh.visible = false;
            }
        }
    };

    effect.dispose = function() {
        if (this._baseFov) {
            EP.Core.camera.fov = this._baseFov;
            EP.Core.camera.updateProjectionMatrix();
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
