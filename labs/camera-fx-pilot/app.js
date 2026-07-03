(function() {
    var canvas = document.getElementById('fx-canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var sample = document.createElement('canvas');
    var sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    var sourceVideo = document.getElementById('source-video');
    var statusEl = document.getElementById('camera-status');
    var cameraSelect = document.getElementById('camera-select');
    var threeStage = document.getElementById('three-stage');
    var currentSource = null;
    var currentStream = null;
    var currentEffect = 'pixel';
    var previousFrame = null;
    var renderer = null;
    var scene = null;
    var camera = null;
    var diceGroup = null;
    var diceItems = [];
    var diceDensity = 0;
    var lastTime = 0;

    var controls = {
        intensity: document.getElementById('intensity'),
        density: document.getElementById('density'),
        contrast: document.getElementById('contrast'),
        speed: document.getElementById('speed'),
        mirror: document.getElementById('mirror')
    };

    function resize() {
        var stage = document.getElementById('stage');
        var bounds = stage.getBoundingClientRect();
        var w = Math.max(320, Math.floor(bounds.width));
        var h = Math.max(180, Math.floor(w * 9 / 16));
        if (h > bounds.height) {
            h = Math.floor(bounds.height);
            w = Math.floor(h * 16 / 9);
        }
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            previousFrame = null;
        }
        if (renderer) renderer.setSize(w, h, false);
        if (camera) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
    }

    function setStatus(text) {
        statusEl.textContent = text;
    }

    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(function(track) { track.stop(); });
        }
        currentStream = null;
    }

    async function listCameras() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        var devices = await navigator.mediaDevices.enumerateDevices();
        var cams = devices.filter(function(d) { return d.kind === 'videoinput'; });
        cameraSelect.innerHTML = '';
        cams.forEach(function(cam, index) {
            var opt = document.createElement('option');
            opt.value = cam.deviceId;
            opt.textContent = cam.label || ('Camara ' + (index + 1));
            cameraSelect.appendChild(opt);
        });
    }

    async function activateCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStatus('Camara no soportada');
            return;
        }
        stopCamera();
        var deviceId = cameraSelect.value;
        var constraints = {
            video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
            audio: false
        };
        try {
            var stream = await navigator.mediaDevices.getUserMedia(constraints);
            currentStream = stream;
            sourceVideo.srcObject = stream;
            sourceVideo.muted = true;
            sourceVideo.playsInline = true;
            await sourceVideo.play();
            currentSource = sourceVideo;
            setStatus('Camara activa');
            await listCameras();
        } catch (err) {
            setStatus('Permiso de camara bloqueado');
        }
    }

    function loadFile(file) {
        stopCamera();
        var url = URL.createObjectURL(file);
        if (file.type.indexOf('video/') === 0) {
            sourceVideo.srcObject = null;
            sourceVideo.src = url;
            sourceVideo.loop = true;
            sourceVideo.muted = true;
            sourceVideo.playsInline = true;
            sourceVideo.play().catch(function() {});
            currentSource = sourceVideo;
            setStatus('Video cargado');
        } else {
            var img = new Image();
            img.onload = function() {
                currentSource = img;
                setStatus('Imagen cargada');
            };
            img.src = url;
        }
        previousFrame = null;
    }

    function drawSource(targetCtx, width, height, mirror) {
        if (!currentSource) {
            drawFallback(targetCtx, width, height);
            return;
        }
        try {
            targetCtx.save();
            if (mirror) {
                targetCtx.translate(width, 0);
                targetCtx.scale(-1, 1);
            }
            targetCtx.drawImage(currentSource, 0, 0, width, height);
            targetCtx.restore();
        } catch (e) {
            targetCtx.restore();
            drawFallback(targetCtx, width, height);
        }
    }

    function drawFallback(targetCtx, width, height) {
        targetCtx.fillStyle = '#050608';
        targetCtx.fillRect(0, 0, width, height);
        targetCtx.fillStyle = '#f3f6ff';
        targetCtx.font = '700 ' + Math.max(18, width * 0.04) + 'px Arial, sans-serif';
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        targetCtx.fillText('Activa camara o sube media', width / 2, height / 2);
    }

    function roundedRect(x, y, w, h, r) {
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function renderPixel(time) {
        showCanvasMode();
        var density = Number(controls.density.value);
        var pixelSize = Math.max(5, Math.round(80 - density));
        var gap = Math.max(1, Math.round(pixelSize * 0.22));
        var cell = pixelSize + gap;
        var sw = Math.ceil(canvas.width / cell);
        var sh = Math.ceil(canvas.height / cell);
        sample.width = sw;
        sample.height = sh;
        drawSource(sampleCtx, sw, sh, controls.mirror.checked);
        var data = sampleCtx.getImageData(0, 0, sw, sh).data;
        var contrast = Number(controls.contrast.value) / 100;
        var pulse = 0.94 + 0.06 * Math.sin(time * Number(controls.speed.value) / 700);
        ctx.fillStyle = '#050608';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (var y = 0; y < sh; y++) {
            for (var x = 0; x < sw; x++) {
                var i = (y * sw + x) * 4;
                var gray = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
                gray = Math.max(0, Math.min(1, (gray - 0.5) * contrast + 0.5));
                var c = Math.round(gray * 255 * pulse);
                ctx.fillStyle = 'rgb(' + c + ',' + c + ',' + c + ')';
                roundedRect(x * cell, y * cell, pixelSize, pixelSize, Math.max(2, pixelSize * 0.22));
                ctx.fill();
            }
        }
    }

    function renderMotion() {
        showCanvasMode();
        var w = Math.max(240, Math.floor(canvas.width / 2));
        var h = Math.max(135, Math.floor(canvas.height / 2));
        sample.width = w;
        sample.height = h;
        drawSource(sampleCtx, w, h, controls.mirror.checked);
        var frame = sampleCtx.getImageData(0, 0, w, h);
        var data = frame.data;
        var out = sampleCtx.createImageData(w, h);
        var dst = out.data;
        var sensitivity = Number(controls.intensity.value) / 45;
        var sourceMix = 0.22;
        for (var i = 0; i < data.length; i += 4) {
            var diff = 0;
            if (previousFrame) {
                diff = Math.abs(data[i] - previousFrame[i]) + Math.abs(data[i + 1] - previousFrame[i + 1]) + Math.abs(data[i + 2] - previousFrame[i + 2]);
                diff = Math.max(0, diff - 14) * sensitivity / 255;
            }
            diff = Math.max(0, Math.min(1, diff));
            var hot = Math.round(255 * diff);
            dst[i] = Math.max(12, hot) + data[i] * sourceMix;
            dst[i + 1] = Math.max(12, hot) + data[i + 1] * sourceMix;
            dst[i + 2] = Math.max(18, hot) + data[i + 2] * sourceMix;
            dst[i + 3] = 255;
        }
        sampleCtx.putImageData(out, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.fillStyle = '#050608';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sample, 0, 0, canvas.width, canvas.height);
        previousFrame = new Uint8ClampedArray(data);
    }

    function initThree() {
        if (renderer) return;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        threeStage.appendChild(renderer.domElement);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
        camera.position.set(0, 0, 8);
        scene.add(new THREE.AmbientLight(0xffffff, 1.8));
        var light = new THREE.DirectionalLight(0xffffff, 1.1);
        light.position.set(3, 5, 8);
        scene.add(light);
        resize();
    }

    function makeDiceMaterial(face) {
        var c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        var cctx = c.getContext('2d');
        cctx.fillStyle = '#f7f7f7';
        cctx.fillRect(0, 0, 128, 128);
        cctx.fillStyle = '#050608';
        var dots = [
            [[64, 64]],
            [[42, 42], [86, 86]],
            [[38, 38], [64, 64], [90, 90]],
            [[38, 38], [90, 38], [38, 90], [90, 90]],
            [[38, 38], [90, 38], [64, 64], [38, 90], [90, 90]],
            [[36, 32], [92, 32], [36, 64], [92, 64], [36, 96], [92, 96]]
        ][face];
        dots.forEach(function(p) {
            cctx.beginPath();
            cctx.arc(p[0], p[1], 10, 0, Math.PI * 2);
            cctx.fill();
        });
        return new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) });
    }

    function rebuildDices(density) {
        initThree();
        if (diceGroup) scene.remove(diceGroup);
        diceItems = [];
        diceDensity = density;
        diceGroup = new THREE.Group();
        var geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
        var mats = [0, 1, 2, 3, 4, 5].map(makeDiceMaterial);
        var span = 7;
        for (var y = 0; y < density; y++) {
            for (var x = 0; x < density; x++) {
                var mesh = new THREE.Mesh(geo, mats);
                mesh.position.x = (x / (density - 1) - 0.5) * span;
                mesh.position.y = (0.5 - y / (density - 1)) * span;
                diceGroup.add(mesh);
                diceItems.push(mesh);
            }
        }
        scene.add(diceGroup);
    }

    function renderDices(time) {
        initThree();
        canvas.style.display = 'none';
        threeStage.style.display = 'block';
        var density = Math.max(12, Math.min(54, Math.floor(Number(controls.density.value))));
        if (density !== diceDensity) rebuildDices(density);
        sample.width = density;
        sample.height = density;
        drawSource(sampleCtx, density, density, controls.mirror.checked);
        var data = sampleCtx.getImageData(0, 0, density, density).data;
        var speed = Number(controls.speed.value) / 100;
        var depth = Number(controls.intensity.value) / 100;
        for (var i = 0; i < diceItems.length; i++) {
            var p = i * 4;
            var lum = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
            var face = 5 - Math.floor(lum * 6);
            face = Math.max(0, Math.min(5, face));
            var mesh = diceItems[i];
            mesh.rotation.x += ((face + 1) * Math.PI / 8 - mesh.rotation.x) * 0.16;
            mesh.rotation.y += (((face % 3) * Math.PI / 5) + time * 0.0002 * speed - mesh.rotation.y) * 0.16;
            mesh.position.z = (lum - 0.5) * depth * 1.4;
            mesh.scale.setScalar(0.72 + lum * 0.7);
        }
        renderer.render(scene, camera);
    }

    function showCanvasMode() {
        canvas.style.display = 'block';
        threeStage.style.display = 'none';
    }

    function loop(time) {
        resize();
        if (currentEffect === 'pixel') renderPixel(time);
        else if (currentEffect === 'motion') renderMotion();
        else renderDices(time);
        lastTime = time;
        requestAnimationFrame(loop);
    }

    document.getElementById('btn-camera').addEventListener('click', activateCamera);
    document.getElementById('file-input').addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) loadFile(e.target.files[0]);
    });
    document.getElementById('btn-reset').addEventListener('click', function() {
        stopCamera();
        sourceVideo.pause();
        sourceVideo.removeAttribute('src');
        sourceVideo.srcObject = null;
        currentSource = null;
        previousFrame = null;
        setStatus('Camara inactiva');
    });
    document.getElementById('btn-shot').addEventListener('click', function() {
        var out = currentEffect === 'dices' && renderer ? renderer.domElement : canvas;
        var a = document.createElement('a');
        a.download = 'camera-fx-pilot.png';
        a.href = out.toDataURL('image/png');
        a.click();
    });
    document.querySelectorAll('.effect-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.effect-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentEffect = btn.dataset.effect;
            previousFrame = null;
        });
    });
    cameraSelect.addEventListener('change', function() {
        if (currentStream) activateCamera();
    });
    window.addEventListener('resize', resize);
    listCameras().catch(function() {});
    requestAnimationFrame(loop);
})();
