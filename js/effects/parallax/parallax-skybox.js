(function() {
    var effect = new EP.EffectBase('parallax-skybox', {
        name: 'Parallax Skybox',
        category: 'parallax',
        icon: '🌄',
        description: 'Parallax 3D automatico tipo skybox — las imagenes cobran profundidad con movimiento de camara cinematografico sin scroll'
    }, [
        { key: 'depthAmount', type: 'range', min: 5, max: 100, default: 50, label: 'Depth', unit: '%' },
        { key: 'cameraRange', type: 'range', min: 10, max: 100, default: 40, label: 'Camera Range', unit: '%' },
        { key: 'zoomPulse', type: 'range', min: 0, max: 100, default: 30, label: 'Zoom Pulse', unit: '%' },
        { key: 'layers', type: 'range', min: 2, max: 5, default: 3, step: 1, label: 'Layers' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear', 'elastic'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#000000', label: 'Background' }
    ]);

    var depthVert = [
        'varying vec2 vUv;',
        'void main() {',
        '    vUv = uv;',
        '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var depthFrag = [
        'precision mediump float;',
        'uniform sampler2D uTexture;',
        'uniform vec2 uOffset;',
        'uniform float uScale;',
        'uniform float uDepthLayer;',
        'varying vec2 vUv;',
        'void main() {',
        '    vec2 uv = (vUv - 0.5) / uScale + 0.5;',
        '    uv += uOffset * uDepthLayer;',
        '    vec4 tex = texture2D(uTexture, clamp(uv, 0.0, 1.0));',
        '    float edgeFade = smoothstep(0.0, 0.05, uv.x) * smoothstep(0.0, 0.05, 1.0 - uv.x);',
        '    edgeFade *= smoothstep(0.0, 0.05, uv.y) * smoothstep(0.0, 0.05, 1.0 - uv.y);',
        '    gl_FragColor = vec4(tex.rgb, tex.a * edgeFade);',
        '}'
    ].join('\n');

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();
        var layerCount = this.settings.layers;

        for (var img = 0; img < mediaList.length; img++) {
            var imgGroup = new THREE.Group();
            imgGroup.visible = false;
            imgGroup.userData = { imageIndex: img };

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

            var w, h;
            if (aspect >= 1) { w = 8; h = 8 / aspect; } else { h = 8; w = 8 * aspect; }

            for (var layer = 0; layer < layerCount; layer++) {
                var depthLayer = layer / Math.max(layerCount - 1, 1);
                var layerScale = 1.0 + depthLayer * 0.3;
                var mat = new THREE.ShaderMaterial({
                    vertexShader: depthVert,
                    fragmentShader: depthFrag,
                    transparent: true,
                    uniforms: {
                        uTexture: { value: tex },
                        uOffset: { value: new THREE.Vector2(0, 0) },
                        uScale: { value: layerScale },
                        uDepthLayer: { value: depthLayer }
                    }
                });

                var geo = new THREE.PlaneGeometry(w * layerScale, h * layerScale);
                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.z = -layer * 0.3 * (this.settings.depthAmount / 100);
                mesh.userData = { layerIndex: layer, depthLayer: depthLayer };
                imgGroup.add(mesh);
            }

            group.add(imgGroup);
        }

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group) return;
        var t = time / loopDuration;
        var images = [];
        for (var i = 0; i < this.group.children.length; i++) {
            if (this.group.children[i].userData.imageIndex !== undefined) images.push(this.group.children[i]);
        }
        var count = images.length;
        if (count === 0) return;
        var segDur = 1 / count;

        var camRange = this.settings.cameraRange / 100;
        var offsetX = Math.sin(time * 0.8) * 0.03 * camRange;
        var offsetY = Math.cos(time * 0.6) * 0.02 * camRange;

        for (var idx = 0; idx < count; idx++) {
            var segStart = idx * segDur;
            var segEnd = segStart + segDur;
            if (t >= segStart && t < segEnd) {
                images[idx].visible = true;
                for (var j = 0; j < images[idx].children.length; j++) {
                    var layer = images[idx].children[j];
                    if (layer.material.uniforms) {
                        layer.material.uniforms.uOffset.value.set(offsetX, offsetY);
                        if (layer.material.uniforms.uTexture.value) {
                            layer.material.uniforms.uTexture.value.needsUpdate = true;
                        }
                    }
                }
            } else {
                images[idx].visible = false;
            }
        }

        var zoomPulse = this.settings.zoomPulse / 100;
        var zoom = 6 - Math.sin(time * 0.5) * 0.5 * zoomPulse;
        EP.Core.camera.position.set(
            Math.sin(time * 0.4) * 0.3 * camRange,
            Math.cos(time * 0.3) * 0.2 * camRange,
            zoom
        );
        EP.Core.camera.lookAt(0, 0, 0);
    };

    effect.dispose = function() {
        if (this.group) {
            for (var i = 0; i < this.group.children.length; i++) {
                var ig = this.group.children[i];
                if (!ig.children) continue;
                for (var j = 0; j < ig.children.length; j++) {
                    var m = ig.children[j];
                    if (m.material && m.material.uniforms && m.material.uniforms.uTexture && m.material.uniforms.uTexture.value) {
                        m.material.uniforms.uTexture.value.dispose();
                    }
                }
            }
        }
        EP.Core.camera.position.set(0, 0, 12);
        EP.Core.camera.lookAt(0, 0, 0);
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
