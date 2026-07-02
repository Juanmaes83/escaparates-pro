var EP = window.EP || {};
window.EP = EP;

EP.Core = (function() {
    var scene, camera, renderer, composer, bloomPass, vignettePass, controls;
    var displayGroup = null;
    var container;
    var aspectRatio = 16 / 9;
    var settings = {
        backgroundColor: '#101014',
        bloomEnabled: false,
        bloomStrength: 0.6,
        bloomRadius: 0.3,
        bloomThreshold: 0.7,
        vignetteEnabled: false
    };

    function init() {
        container = document.getElementById('canvas-container');
        scene = new THREE.Scene();
        scene.background = new THREE.Color(settings.backgroundColor);

        camera = new THREE.PerspectiveCamera(45, getAspect(), 0.1, 100);
        camera.position.set(0, 0, 12);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0x404040, 1.5));
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(1, 1, 1);
        scene.add(dirLight);

        if (typeof THREE.OrbitControls === 'function') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.enablePan = true;
            controls.enableZoom = true;
            controls.minDistance = 3;
            controls.maxDistance = 40;
        }

        if (typeof THREE.EffectComposer === 'function') {
            composer = new THREE.EffectComposer(renderer);
            rebuildComposer();
        }

        updateSize();
        window.addEventListener('resize', updateSize);
    }

    function getAspect() {
        if (!container) return aspectRatio;
        return container.clientWidth / container.clientHeight;
    }

    function updateSize() {
        if (!container || !renderer) return;
        var boundsW = container.clientWidth;
        var boundsH = container.clientHeight;
        if (boundsW === 0 || boundsH === 0) return;
        var w = boundsW;
        var h = Math.round(w / aspectRatio);
        if (h > boundsH) {
            h = boundsH;
            w = Math.round(h * aspectRatio);
        }
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = w + 'px';
        renderer.domElement.style.height = h + 'px';
        if (composer) composer.setSize(w, h);
    }

    function rebuildComposer() {
        if (!composer) return;
        composer.passes = [];
        composer.addPass(new THREE.RenderPass(scene, camera));

        if (settings.bloomEnabled) {
            var size = renderer ? new THREE.Vector2(renderer.domElement.width, renderer.domElement.height) : new THREE.Vector2(1920, 1080);
            bloomPass = new THREE.UnrealBloomPass(size, settings.bloomStrength, settings.bloomRadius, settings.bloomThreshold);
            composer.addPass(bloomPass);
        } else {
            bloomPass = null;
        }

        if (settings.vignetteEnabled) {
            vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
            vignettePass.uniforms['offset'].value = 0.95;
            vignettePass.uniforms['darkness'].value = 1.6;
            vignettePass.renderToScreen = true;
            composer.addPass(vignettePass);
        } else {
            vignettePass = null;
            if (composer.passes.length > 0) {
                composer.passes[composer.passes.length - 1].renderToScreen = true;
            }
        }
    }

    function setBackground(color) {
        settings.backgroundColor = color;
        if (scene) scene.background = new THREE.Color(color);
    }

    function setPostProcessing(opts) {
        opts = opts || {};
        if (typeof opts.bloomEnabled === 'boolean') settings.bloomEnabled = opts.bloomEnabled;
        if (typeof opts.vignetteEnabled === 'boolean') settings.vignetteEnabled = opts.vignetteEnabled;
        if (typeof opts.bloomStrength === 'number') settings.bloomStrength = opts.bloomStrength;
        if (typeof opts.bloomRadius === 'number') settings.bloomRadius = opts.bloomRadius;
        if (typeof opts.bloomThreshold === 'number') settings.bloomThreshold = opts.bloomThreshold;
        rebuildComposer();
    }

    function setDisplayGroup(group) {
        if (displayGroup) {
            scene.remove(displayGroup);
            disposeGroup(displayGroup);
        }
        displayGroup = group;
        if (displayGroup) scene.add(displayGroup);
    }

    function disposeGroup(group) {
        group.traverse(function(child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                var mats = Array.isArray(child.material) ? child.material : [child.material];
                for (var m = 0; m < mats.length; m++) {
                    if (mats[m].map && typeof mats[m].map.dispose === 'function') mats[m].map.dispose();
                    mats[m].dispose();
                }
            }
        });
    }

    function render() {
        if (controls) controls.update();
        if (composer) composer.render();
        else if (renderer && scene && camera) renderer.render(scene, camera);
    }

    function setAspectRatio(ratio) {
        aspectRatio = ratio;
        updateSize();
    }

    return {
        init: init,
        render: render,
        setDisplayGroup: setDisplayGroup,
        setBackground: setBackground,
        setPostProcessing: setPostProcessing,
        setAspectRatio: setAspectRatio,
        rebuildComposer: rebuildComposer,
        get scene() { return scene; },
        get camera() { return camera; },
        get renderer() { return renderer; },
        get displayGroup() { return displayGroup; },
        get settings() { return settings; },
        updateSize: updateSize
    };
})();
