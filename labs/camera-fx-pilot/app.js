(function() {
    var canvas = document.getElementById('fx-canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var sample = document.createElement('canvas');
    var sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    var motion = document.createElement('canvas');
    var motionCtx = motion.getContext('2d', { willReadFrequently: true });
    var sourceVideo = document.getElementById('source-video');
    var statusEl = document.getElementById('camera-status');
    var cameraSelect = document.getElementById('camera-select');
    var threeStage = document.getElementById('three-stage');

    var currentSource = null;
    var currentStream = null;
    var currentEffect = 'pixel';
    var currentObjectUrl = null;
    var previousFrame = null;
    var trailFrame = null;
    var pixelCache = {};
    var lastPixelKey = '';
    var renderer = null;
    var scene = null;
    var camera = null;
    var diceMesh = null;
    var diceRotations = [];
    var diceTargets = [];
    var diceCols = 0;
    var diceMaterials = null;
    var fallbackTick = 0;
    var redGame = {
        playing: false,
        startTime: 0,
        distance: 0,
        danger: 0,
        watching: true,
        phaseStarted: 0,
        phaseDuration: 2400,
        lastMotion: 0,
        outcome: ''
    };
    var airState = {
        audio: null,
        lastPickY: null,
        lastStrikeTime: 0,
        strumEnergy: 0,
        pitch: 0,
        poseNet: null,
        poseLoading: false,
        poseBusy: false,
        pose: null,
        poseError: ''
    };
    var pinMesh = null;
    var pinGrid = { cols: 0, rows: 0, size: 0 };
    var pinMaterial = null;

    var controls = {
        mirror: document.getElementById('mirror'),
        brightness: document.getElementById('brightness'),
        contrast: document.getElementById('contrast'),
        speed: document.getElementById('speed'),
        pixelWidth: document.getElementById('pixel-width'),
        pixelSize: document.getElementById('pixel-size'),
        pixelSpace: document.getElementById('pixel-space'),
        pixelAlpha: document.getElementById('pixel-alpha'),
        pixelRadius: document.getElementById('pixel-radius'),
        motionSensitivity: document.getElementById('motion-sensitivity'),
        motionTrail: document.getElementById('motion-trail'),
        motionThreshold: document.getElementById('motion-threshold'),
        motionSource: document.getElementById('motion-source'),
        diceCols: document.getElementById('dice-cols'),
        diceSize: document.getElementById('dice-size'),
        diceDepth: document.getElementById('dice-depth'),
        diceFraming: document.getElementById('dice-framing'),
        redDuration: document.getElementById('red-duration'),
        redSensitivity: document.getElementById('red-sensitivity'),
        redGoal: document.getElementById('red-goal'),
        redRisk: document.getElementById('red-risk'),
        airSensitivity: document.getElementById('air-sensitivity'),
        airStrings: document.getElementById('air-strings'),
        airGlow: document.getElementById('air-glow'),
        pinSize: document.getElementById('pin-size'),
        pinDepth: document.getElementById('pin-depth'),
        pinScale: document.getElementById('pin-scale'),
        pinFraming: document.getElementById('pin-framing')
    };

    var PI = Math.PI;
    var FACES = [
        { x: 0, y: PI / 2, z: 0 },
        { x: 0, y: 0, z: PI },
        { x: PI / 2, y: 0, z: 0 },
        { x: PI / 2, y: 0, z: PI },
        { x: PI, y: 0, z: 0 },
        { x: PI / 2, y: PI / 2, z: PI / 2 }
    ];

    function number(control) {
        return Number(control.value);
    }

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
            trailFrame = null;
        }
        if (renderer) renderer.setSize(w, h, false);
        if (camera) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            updateDiceCamera();
        }
    }

    function setStatus(text, live) {
        statusEl.textContent = text;
        statusEl.classList.toggle('live', !!live);
    }

    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(function(track) { track.stop(); });
        }
        currentStream = null;
    }

    function revokeCurrentUrl() {
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
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
            setStatus('Camara no soportada', false);
            return;
        }
        stopCamera();
        revokeCurrentUrl();
        var deviceId = cameraSelect.value;
        var constraints = {
            video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        };
        try {
            var stream = await navigator.mediaDevices.getUserMedia(constraints);
            currentStream = stream;
            sourceVideo.srcObject = stream;
            sourceVideo.removeAttribute('src');
            sourceVideo.muted = true;
            sourceVideo.playsInline = true;
            await sourceVideo.play();
            currentSource = sourceVideo;
            resetTemporalState();
            setStatus('Camara activa', true);
            await listCameras();
        } catch (err) {
            setStatus('Permiso de camara bloqueado', false);
        }
    }

    function loadFile(file) {
        stopCamera();
        revokeCurrentUrl();
        currentObjectUrl = URL.createObjectURL(file);
        if (file.type.indexOf('video/') === 0) {
            sourceVideo.srcObject = null;
            sourceVideo.src = currentObjectUrl;
            sourceVideo.loop = true;
            sourceVideo.muted = true;
            sourceVideo.playsInline = true;
            sourceVideo.play().catch(function() {});
            currentSource = sourceVideo;
            setStatus('Video cargado', true);
        } else {
            var img = new Image();
            img.onload = function() {
                currentSource = img;
                resetTemporalState();
                setStatus('Imagen cargada', true);
            };
            img.src = currentObjectUrl;
        }
        resetTemporalState();
    }

    function resetTemporalState() {
        previousFrame = null;
        trailFrame = null;
        pixelCache = {};
        lastPixelKey = '';
        redGame.lastMotion = 0;
        airState.lastPickY = null;
        airState.strumEnergy = 0;
    }

    function resetRedGame() {
        redGame.playing = true;
        redGame.startTime = performance.now();
        redGame.distance = 0;
        redGame.danger = 0;
        redGame.watching = false;
        redGame.phaseStarted = redGame.startTime;
        redGame.phaseDuration = 2800;
        redGame.outcome = '';
        previousFrame = null;
        trailFrame = null;
    }

    function sampleMotion(width, height, mirror) {
        sample.width = width;
        sample.height = height;
        drawSource(sampleCtx, width, height, mirror);
        var frame = sampleCtx.getImageData(0, 0, width, height);
        var data = frame.data;
        var motionTotal = 0;
        var motionCount = 0;
        var energyX = 0;
        var energyY = 0;
        if (previousFrame) {
            for (var i = 0; i < data.length; i += 4) {
                var diff = Math.abs(data[i] - previousFrame[i]) + Math.abs(data[i + 1] - previousFrame[i + 1]) + Math.abs(data[i + 2] - previousFrame[i + 2]);
                if (diff > 28) {
                    var p = i / 4;
                    var px = p % width;
                    var py = Math.floor(p / width);
                    motionTotal += diff;
                    motionCount++;
                    energyX += px * diff;
                    energyY += py * diff;
                }
            }
        }
        previousFrame = new Uint8ClampedArray(data);
        if (!motionCount) {
            return { amount: 0, x: width / 2, y: height / 2, frame: frame };
        }
        return {
            amount: motionTotal / (width * height * 765),
            x: energyX / motionTotal,
            y: energyY / motionTotal,
            frame: frame
        };
    }

    function drawSource(targetCtx, width, height, mirror) {
        if (!currentSource) {
            drawFallback(targetCtx, width, height);
            return;
        }
        targetCtx.save();
        try {
            targetCtx.clearRect(0, 0, width, height);
            var sourceW = currentSource.videoWidth || currentSource.naturalWidth || width;
            var sourceH = currentSource.videoHeight || currentSource.naturalHeight || height;
            var scale = Math.max(width / sourceW, height / sourceH);
            var drawW = sourceW * scale;
            var drawH = sourceH * scale;
            var dx = (width - drawW) / 2;
            var dy = (height - drawH) / 2;
            if (mirror) {
                targetCtx.translate(width, 0);
                targetCtx.scale(-1, 1);
                dx = -dx - drawW;
            }
            targetCtx.drawImage(currentSource, dx, dy, drawW, drawH);
        } catch (e) {
            targetCtx.restore();
            drawFallback(targetCtx, width, height);
            return;
        }
        targetCtx.restore();
    }

    function drawFallback(targetCtx, width, height) {
        fallbackTick += 0.03;
        var grd = targetCtx.createLinearGradient(0, 0, width, height);
        grd.addColorStop(0, '#101420');
        grd.addColorStop(0.5, '#080a10');
        grd.addColorStop(1, '#1b2030');
        targetCtx.fillStyle = grd;
        targetCtx.fillRect(0, 0, width, height);
        targetCtx.fillStyle = 'rgba(255,255,255,.06)';
        for (var i = 0; i < 44; i++) {
            var x = (Math.sin(i * 12.989 + fallbackTick) * 43758.5453) % 1;
            var y = (Math.sin(i * 78.233 + fallbackTick * 0.7) * 31841.113) % 1;
            targetCtx.beginPath();
            targetCtx.arc(Math.abs(x) * width, Math.abs(y) * height, 3 + (i % 9), 0, PI * 2);
            targetCtx.fill();
        }
        targetCtx.fillStyle = '#f3f6ff';
        targetCtx.font = '700 ' + Math.max(18, width * 0.035) + 'px Arial, sans-serif';
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        targetCtx.fillText('Activa camara o sube media', width / 2, height / 2);
    }

    function showCanvasMode() {
        canvas.style.display = 'block';
        threeStage.style.display = 'none';
    }

    function showThreeMode() {
        canvas.style.display = 'none';
        threeStage.style.display = 'block';
    }

    function roundedPath(targetCtx, x, y, w, h, r) {
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        targetCtx.beginPath();
        targetCtx.moveTo(x + r, y);
        targetCtx.lineTo(x + w - r, y);
        targetCtx.quadraticCurveTo(x + w, y, x + w, y + r);
        targetCtx.lineTo(x + w, y + h - r);
        targetCtx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        targetCtx.lineTo(x + r, y + h);
        targetCtx.quadraticCurveTo(x, y + h, x, y + h - r);
        targetCtx.lineTo(x, y + r);
        targetCtx.quadraticCurveTo(x, y, x + r, y);
        targetCtx.closePath();
    }

    function pixelSprite(color, size, radius, alpha, contrast, brightness) {
        var pColor = color / 255;
        pColor -= 0.5;
        pColor *= Math.pow((contrast + 100) / 100, 2);
        pColor += 0.5;
        pColor *= 255;
        pColor += brightness;
        pColor = Math.max(0, Math.min(255, Math.round(pColor)));
        var key = [pColor, size, radius, alpha].join(':');
        if (pixelCache[key]) return pixelCache[key];
        var c = document.createElement('canvas');
        var cctx = c.getContext('2d');
        c.width = size;
        c.height = size;
        var actualRadius = Math.min(radius, size / 2);
        cctx.beginPath();
        if (actualRadius >= size / 2 - 0.1) {
            cctx.arc(size / 2, size / 2, size / 2, 0, PI * 2);
        } else {
            roundedPath(cctx, 0, 0, size, size, actualRadius);
        }
        cctx.fillStyle = 'rgba(' + pColor + ',' + pColor + ',' + pColor + ',' + alpha + ')';
        cctx.fill();
        pixelCache[key] = c;
        return c;
    }

    function renderPixelation() {
        showCanvasMode();
        var width = number(controls.pixelWidth);
        var height = Math.round(width * 9 / 16);
        var size = number(controls.pixelSize);
        var space = number(controls.pixelSpace);
        var alpha = number(controls.pixelAlpha) / 100;
        var radius = Math.min(number(controls.pixelRadius), size / 2);
        var brightness = Math.round(255 * (number(controls.brightness) / 100));
        var contrast = number(controls.contrast);
        var cell = size + space;
        var factor = width / ((width * cell) - space);
        var sw = Math.max(8, Math.floor(width * factor));
        var sh = Math.max(8, Math.floor(height * factor));
        var key = [size, space, alpha, radius, brightness, contrast].join(':');
        if (key !== lastPixelKey) {
            pixelCache = {};
            lastPixelKey = key;
        }
        sample.width = sw;
        sample.height = sh;
        drawSource(sampleCtx, sw, sh, controls.mirror.checked);
        var data = sampleCtx.getImageData(0, 0, sw, sh).data;
        var xOffset = Math.round((canvas.width - (sw * cell - space)) / 2);
        var yOffset = Math.round((canvas.height - (sh * cell - space)) / 2);
        ctx.fillStyle = '#050608';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.shadowBlur = Math.max(0, size * 0.25);
        ctx.shadowColor = 'rgba(255,255,255,.12)';
        for (var i = 0; i < data.length; i += 4) {
            var px = i / 4;
            var gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            var x = (px % sw) * cell + xOffset;
            var y = Math.floor(px / sw) * cell + yOffset;
            ctx.drawImage(pixelSprite(gray, size, radius, alpha, contrast, brightness), x, y);
        }
        ctx.restore();
    }

    function renderMotionDetection() {
        showCanvasMode();
        var w = Math.max(240, Math.floor(canvas.width / 2));
        var h = Math.max(135, Math.floor(canvas.height / 2));
        sample.width = w;
        sample.height = h;
        motion.width = w;
        motion.height = h;
        drawSource(sampleCtx, w, h, controls.mirror.checked);
        var frame = sampleCtx.getImageData(0, 0, w, h);
        var data = frame.data;
        var out = motionCtx.createImageData(w, h);
        var dst = out.data;
        var sensitivity = number(controls.motionSensitivity) / 100;
        var threshold = number(controls.motionThreshold);
        var sourceMix = number(controls.motionSource) / 100;
        var trail = number(controls.motionTrail) / 100;
        for (var i = 0; i < data.length; i += 4) {
            var neutralR = 128;
            var neutralG = 128;
            var neutralB = 128;
            if (previousFrame) {
                var r = 0.5 * (255 - data[i]) + 0.5 * previousFrame[i];
                var g = 0.5 * (255 - data[i + 1]) + 0.5 * previousFrame[i + 1];
                var b = 0.5 * (255 - data[i + 2]) + 0.5 * previousFrame[i + 2];
                var delta = Math.abs(r - 128) + Math.abs(g - 128) + Math.abs(b - 128);
                if (delta > threshold) {
                    neutralR = 128 + (r - 128) * (1 + sensitivity * 2.4);
                    neutralG = 128 + (g - 128) * (1 + sensitivity * 2.4);
                    neutralB = 128 + (b - 128) * (1 + sensitivity * 2.4);
                }
            }
            var baseR = neutralR * (1 - sourceMix) + data[i] * sourceMix;
            var baseG = neutralG * (1 - sourceMix) + data[i + 1] * sourceMix;
            var baseB = neutralB * (1 - sourceMix) + data[i + 2] * sourceMix;
            if (trailFrame) {
                baseR = baseR * (1 - trail) + trailFrame[i] * trail;
                baseG = baseG * (1 - trail) + trailFrame[i + 1] * trail;
                baseB = baseB * (1 - trail) + trailFrame[i + 2] * trail;
            }
            dst[i] = Math.max(0, Math.min(255, baseR));
            dst[i + 1] = Math.max(0, Math.min(255, baseG));
            dst[i + 2] = Math.max(0, Math.min(255, baseB));
            dst[i + 3] = 255;
        }
        motionCtx.putImageData(out, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.fillStyle = '#050608';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(motion, 0, 0, canvas.width, canvas.height);
        previousFrame = new Uint8ClampedArray(data);
        trailFrame = new Uint8ClampedArray(dst);
    }

    function initThree() {
        if (renderer) return;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        threeStage.appendChild(renderer.domElement);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x080808, 1.15));
        var spot = new THREE.SpotLight(0xffffff, 0.75);
        spot.position.set(50, 50, 100);
        scene.add(spot);
        resize();
    }

    function makeDiceFace(face, normal) {
        var c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        var cctx = c.getContext('2d');
        cctx.fillStyle = normal ? '#8080ff' : '#f6f4ee';
        cctx.fillRect(0, 0, c.width, c.height);
        if (normal) {
            cctx.fillStyle = 'rgba(255,255,255,.18)';
            cctx.fillRect(14, 14, 100, 100);
        } else {
            cctx.strokeStyle = 'rgba(0,0,0,.12)';
            cctx.lineWidth = 8;
            roundedPath(cctx, 7, 7, 114, 114, 18);
            cctx.stroke();
            cctx.fillStyle = '#0a0a0d';
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
                cctx.arc(p[0], p[1], 10, 0, PI * 2);
                cctx.fill();
            });
        }
        var texture = new THREE.CanvasTexture(c);
        texture.needsUpdate = true;
        return texture;
    }

    function getDiceMaterials() {
        if (diceMaterials) return diceMaterials;
        diceMaterials = [];
        for (var i = 0; i < 6; i++) {
            diceMaterials.push(new THREE.MeshPhongMaterial({
                shininess: 100,
                specular: 0xcccccc,
                map: makeDiceFace(i, false),
                normalMap: makeDiceFace(i, true)
            }));
        }
        return diceMaterials;
    }

    function rebuildDices(cols) {
        initThree();
        if (diceMesh) scene.remove(diceMesh);
        diceCols = cols;
        diceRotations = [];
        diceTargets = [];
        var geometry = new THREE.BoxBufferGeometry(1, 1, 1);
        diceMesh = new THREE.InstancedMesh(geometry, getDiceMaterials(), cols * cols);
        diceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(diceMesh);
        for (var i = 0; i < cols * cols; i++) {
            diceRotations.push({ x: 0, y: 0, z: 0 });
            diceTargets.push({ x: 0, y: 0, z: 0 });
        }
        updateDiceCamera();
    }

    function updateDiceCamera() {
        if (!camera) return;
        var cols = diceCols || number(controls.diceCols);
        var framing = number(controls.diceFraming) / 100;
        camera.position.set(0, 0, Math.max(26, cols * 0.76 * framing));
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    function renderDices() {
        showThreeMode();
        initThree();
        if (pinMesh) pinMesh.visible = false;
        var cols = Math.max(18, Math.min(60, Math.round(number(controls.diceCols))));
        if (cols !== diceCols) rebuildDices(cols);
        if (diceMesh) diceMesh.visible = true;
        sample.width = cols;
        sample.height = cols;
        drawSource(sampleCtx, cols, cols, controls.mirror.checked);
        var data = sampleCtx.getImageData(0, 0, cols, cols).data;
        var matrix = new THREE.Matrix4();
        var euler = new THREE.Euler(0, 0, 0, 'XYZ');
        var offset = (cols - 1) / 2;
        var scale = number(controls.diceSize) / 100;
        var depth = number(controls.diceDepth) / 100;
        var speed = 0.055 + number(controls.speed) / 520;
        var i = 0;
        for (var x = 0; x < cols; x++) {
            for (var y = 0; y < cols; y++) {
                var index = y * cols + x;
                var p = index * 4;
                var value = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
                var rot = 5 - Math.floor(value * 6);
                rot = Math.min(5, Math.max(0, rot));
                var target = FACES[rot];
                var current = diceRotations[index];
                current.x += (target.x - current.x) * speed;
                current.y += (target.y - current.y) * speed;
                current.z += (target.z - current.z) * speed;
                euler.x = current.x;
                euler.y = current.y;
                euler.z = current.z;
                matrix.makeRotationFromEuler(euler);
                matrix.setPosition(offset - x, offset - y, (value - 0.5) * depth * 8);
                var s = scale * (0.82 + value * 0.18);
                matrix.scale(new THREE.Vector3(s, s, s));
                diceMesh.setMatrixAt(i, matrix);
                i++;
            }
        }
        diceMesh.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);
    }

    function drawHudText(text, x, y, size, color, align) {
        ctx.save();
        ctx.font = '800 ' + size + 'px Arial, sans-serif';
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(3, size * 0.12);
        ctx.strokeStyle = 'rgba(0,0,0,.72)';
        ctx.fillStyle = color || '#fff';
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    function renderRedLight(time) {
        showCanvasMode();
        var w = 160;
        var h = 90;
        var probe = sampleMotion(w, h, controls.mirror.checked);
        ctx.fillStyle = '#050608';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sample, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,.38)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (!redGame.playing && !redGame.outcome) {
            drawHudText('RED LIGHT GREEN LIGHT', canvas.width / 2, canvas.height * 0.28, Math.max(22, canvas.width * 0.045), '#fff', 'center');
            drawHudText('Pulsa "Iniciar partida". En verde muévete; en rojo quédate quieto.', canvas.width / 2, canvas.height * 0.42, Math.max(13, canvas.width * 0.018), '#dfe8ff', 'center');
            drawHudText('Basado en detección de movimiento de cámara.', canvas.width / 2, canvas.height * 0.50, Math.max(12, canvas.width * 0.016), '#aab5d1', 'center');
            return;
        }

        if (redGame.playing) {
            var elapsed = (time - redGame.startTime) / 1000;
            var maxTime = number(controls.redDuration);
            var phaseElapsed = time - redGame.phaseStarted;
            if (phaseElapsed > redGame.phaseDuration) {
                redGame.watching = !redGame.watching;
                redGame.phaseStarted = time;
                redGame.phaseDuration = redGame.watching ? 1500 + Math.random() * 1600 : 2100 + Math.random() * 2600;
                if (!redGame.watching) redGame.danger = Math.max(0, redGame.danger - 10);
            }
            var movement = Math.max(0, probe.amount * number(controls.redSensitivity) * 130);
            redGame.lastMotion = movement;
            if (redGame.watching) {
                redGame.danger += movement * 0.9;
            } else {
                redGame.distance += movement * 0.52;
                redGame.danger = Math.max(0, redGame.danger - 0.32);
            }
            if (redGame.danger >= number(controls.redRisk)) {
                redGame.playing = false;
                redGame.outcome = 'eliminado';
            }
            if (redGame.distance >= number(controls.redGoal)) {
                redGame.playing = false;
                redGame.outcome = 'victoria';
            }
            if (elapsed >= maxTime) {
                redGame.playing = false;
                redGame.outcome = 'tiempo';
            }
        }

        var isRed = redGame.watching;
        var band = canvas.height * 0.16;
        ctx.fillStyle = isRed ? 'rgba(214,20,54,.86)' : 'rgba(44,199,112,.86)';
        ctx.fillRect(0, 0, canvas.width, band);
        drawHudText(isRed ? 'RED LIGHT' : 'GREEN LIGHT', canvas.width / 2, band / 2, Math.max(26, canvas.width * 0.052), '#fff', 'center');

        var goal = number(controls.redGoal);
        var duration = number(controls.redDuration);
        var left = redGame.playing ? Math.max(0, duration - (time - redGame.startTime) / 1000) : 0;
        var progress = Math.min(1, redGame.distance / goal);
        var danger = Math.min(1, redGame.danger / number(controls.redRisk));
        ctx.fillStyle = 'rgba(255,255,255,.15)';
        ctx.fillRect(canvas.width * 0.08, canvas.height * 0.76, canvas.width * 0.84, 18);
        ctx.fillStyle = '#f7f7ff';
        ctx.fillRect(canvas.width * 0.08, canvas.height * 0.76, canvas.width * 0.84 * progress, 18);
        ctx.fillStyle = 'rgba(214,20,54,.22)';
        ctx.fillRect(canvas.width * 0.08, canvas.height * 0.82, canvas.width * 0.84, 12);
        ctx.fillStyle = '#d61436';
        ctx.fillRect(canvas.width * 0.08, canvas.height * 0.82, canvas.width * 0.84 * danger, 12);
        drawHudText(Math.round(progress * 100) + 'm / 100m', canvas.width * 0.08, canvas.height * 0.70, Math.max(16, canvas.width * 0.026), '#fff', 'left');
        drawHudText(Math.ceil(left) + 's', canvas.width * 0.92, canvas.height * 0.70, Math.max(16, canvas.width * 0.026), '#fff', 'right');
        drawHudText('movimiento ' + Math.round(redGame.lastMotion), canvas.width * 0.92, canvas.height * 0.88, Math.max(12, canvas.width * 0.017), '#ffccd5', 'right');

        if (redGame.outcome) {
            var msg = redGame.outcome === 'victoria' ? 'HAS GANADO' : redGame.outcome === 'tiempo' ? 'SIN TIEMPO' : 'ELIMINADO';
            drawHudText(msg, canvas.width / 2, canvas.height * 0.48, Math.max(34, canvas.width * 0.07), redGame.outcome === 'victoria' ? '#91ffbd' : '#ff4f6e', 'center');
            drawHudText('Pulsa "Iniciar partida" para repetir.', canvas.width / 2, canvas.height * 0.58, Math.max(14, canvas.width * 0.02), '#fff', 'center');
        }
    }

    function ensureAirAudio() {
        if (airState.audio) return airState.audio;
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        var audio = { ctx: new AudioCtx() };
        airState.audio = audio;
        return audio;
    }

    function loadScriptOnce(src, globalName) {
        return new Promise(function(resolve, reject) {
            if (globalName && window[globalName]) {
                resolve();
                return;
            }
            var existing = document.querySelector('script[data-src="' + src + '"]');
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }
            var script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.dataset.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function ensurePoseNet() {
        if (airState.poseNet || airState.poseLoading) return;
        airState.poseLoading = true;
        airState.poseError = '';
        loadScriptOnce('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js', 'tf')
            .then(function() {
                return loadScriptOnce('https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet@2.2.2/dist/posenet.min.js', 'posenet');
            })
            .then(function() {
                return window.posenet.load({
                    architecture: 'MobileNetV1',
                    outputStride: 16,
                    inputResolution: { width: 257, height: 257 },
                    multiplier: 0.5
                });
            })
            .then(function(net) {
                airState.poseNet = net;
                airState.poseLoading = false;
                setStatus('PoseNet Air Guitar activo', true);
            })
            .catch(function() {
                airState.poseLoading = false;
                airState.poseError = 'PoseNet no disponible';
            });
    }

    function estimateAirPose() {
        if (!airState.poseNet || airState.poseBusy || !currentSource) return;
        var sourceReady = currentSource.naturalWidth || currentSource.videoWidth;
        if (!sourceReady) return;
        airState.poseBusy = true;
        airState.poseNet.estimateSinglePose(currentSource, {
            flipHorizontal: !!controls.mirror.checked,
            decodingMethod: 'single-person'
        }).then(function(pose) {
            airState.pose = pose;
            airState.poseBusy = false;
        }).catch(function() {
            airState.poseBusy = false;
            airState.poseError = 'Pose no detectada';
        });
    }

    function playAirChord(pitch, energy) {
        var audio = ensureAirAudio();
        if (!audio) return;
        if (audio.ctx.state === 'suspended') audio.ctx.resume();
        var now = audio.ctx.currentTime;
        var base = 110 * Math.pow(2, pitch / 12);
        [1, 1.25, 1.5].forEach(function(mult, index) {
            var osc = audio.ctx.createOscillator();
            var gain = audio.ctx.createGain();
            var drive = audio.ctx.createWaveShaper();
            var curve = new Float32Array(256);
            for (var i = 0; i < curve.length; i++) {
                var x = i * 2 / curve.length - 1;
                curve[i] = Math.tanh(x * (2 + energy * 6));
            }
            drive.curve = curve;
            drive.oversample = '2x';
            osc.type = index === 0 ? 'sawtooth' : 'square';
            osc.frequency.value = base * mult;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.08 + energy * 0.14, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(drive);
            drive.connect(gain);
            gain.connect(audio.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.32);
        });
    }

    function renderAirGuitar(time) {
        showCanvasMode();
        if (!airState.poseNet && !airState.poseLoading && !airState.poseError) ensurePoseNet();
        estimateAirPose();
        var w = 128;
        var h = 72;
        var probe = sampleMotion(w, h, controls.mirror.checked);
        ctx.fillStyle = '#050608';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sample, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,.32)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var cx = canvas.width * 0.47;
        var cy = canvas.height * 0.58;
        var neckX1 = canvas.width * 0.18;
        var neckY1 = canvas.height * 0.36;
        var neckX2 = canvas.width * 0.82;
        var neckY2 = canvas.height * 0.68;
        var strings = Math.round(number(controls.airStrings));
        var motionX = probe.x / w * canvas.width;
        var motionY = probe.y / h * canvas.height;
        var fretX = motionX;
        if (airState.pose && airState.pose.keypoints) {
            var sourceW = currentSource.videoWidth || currentSource.naturalWidth || 640;
            var sourceH = currentSource.videoHeight || currentSource.naturalHeight || 480;
            var pickWrist = airState.pose.keypoints[10];
            var fretWrist = airState.pose.keypoints[9];
            if (pickWrist && pickWrist.score > 0.28) {
                motionX = pickWrist.position.x / sourceW * canvas.width;
                motionY = pickWrist.position.y / sourceH * canvas.height;
            }
            if (fretWrist && fretWrist.score > 0.28) {
                fretX = fretWrist.position.x / sourceW * canvas.width;
            }
        }
        var sensitivity = number(controls.airSensitivity) / 100;
        var glow = number(controls.airGlow) / 100;
        var strikeLineX = canvas.width * 0.54;
        var energy = Math.min(1, probe.amount * 80 * sensitivity);
        var pickY = motionY;
        var crossed = airState.lastPickY !== null && Math.abs(motionX - strikeLineX) < canvas.width * 0.22 && Math.abs(pickY - airState.lastPickY) > canvas.height * 0.055 && energy > 0.18;
        if (crossed && time - airState.lastStrikeTime > 180) {
            airState.pitch = Math.round((1 - Math.max(0, Math.min(1, (fretX - neckX1) / (neckX2 - neckX1)))) * 18);
            airState.strumEnergy = 1;
            airState.lastStrikeTime = time;
            playAirChord(airState.pitch, energy);
        }
        airState.lastPickY = pickY;
        airState.strumEnergy *= 0.9;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowBlur = 22 * glow + airState.strumEnergy * 28;
        ctx.shadowColor = '#8cc8ff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(neckX1, neckY1);
        ctx.lineTo(neckX2, neckY2);
        ctx.stroke();
        ctx.strokeStyle = '#4f80ff';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(cx - canvas.width * 0.15, cy + canvas.height * 0.12);
        ctx.lineTo(neckX1, neckY1);
        ctx.stroke();
        for (var s = 0; s < strings; s++) {
            var off = (s - (strings - 1) / 2) * canvas.height * 0.012;
            ctx.strokeStyle = s % 2 ? '#f7f7ff' : '#bcd7ff';
            ctx.lineWidth = 1.2 + airState.strumEnergy * 3;
            ctx.beginPath();
            ctx.moveTo(neckX1, neckY1 + off);
            ctx.lineTo(neckX2, neckY2 + off);
            ctx.stroke();
        }
        ctx.fillStyle = '#11131a';
        ctx.beginPath();
        ctx.ellipse(cx - canvas.width * 0.18, cy + canvas.height * 0.13, canvas.width * 0.13, canvas.height * 0.18, -0.42, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ff315a';
        ctx.beginPath();
        ctx.arc(motionX, motionY, 12 + energy * 20, 0, PI * 2);
        ctx.fill();
        ctx.restore();
        drawHudText('AIR GUITAR', canvas.width * 0.06, canvas.height * 0.10, Math.max(20, canvas.width * 0.038), '#fff', 'left');
        var poseLabel = airState.poseNet ? 'PoseNet activo' : airState.poseLoading ? 'Cargando PoseNet...' : 'modo movimiento';
        drawHudText('Rasguea cruzando las cuerdas. ' + poseLabel + '.', canvas.width * 0.06, canvas.height * 0.17, Math.max(12, canvas.width * 0.016), '#dfe8ff', 'left');
        drawHudText('pitch +' + airState.pitch, canvas.width * 0.94, canvas.height * 0.10, Math.max(14, canvas.width * 0.022), '#8cc8ff', 'right');
    }

    function rebuildPinScreen(cols, rows, pinSize) {
        initThree();
        if (diceMesh) diceMesh.visible = false;
        if (pinMesh) scene.remove(pinMesh);
        pinGrid = { cols: cols, rows: rows, size: pinSize };
        var geometry = new THREE.BoxBufferGeometry(1, 1, 1);
        pinMaterial = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, color: 0xffffff });
        pinMesh = new THREE.InstancedMesh(geometry, pinMaterial, cols * rows);
        pinMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(pinMesh);
    }

    function updatePinCamera(cols, rows) {
        if (!camera) return;
        var framing = number(controls.pinFraming) / 100;
        camera.position.set(cols / 2, rows / 2, Math.max(cols, rows) * 1.3 * framing);
        camera.lookAt(new THREE.Vector3(cols / 2, rows / 2, 0));
    }

    function renderPinScreen() {
        showThreeMode();
        initThree();
        if (diceMesh) diceMesh.visible = false;
        var pinSize = Math.round(number(controls.pinSize));
        var cols = Math.max(12, Math.floor(192 / pinSize));
        var rows = Math.max(8, Math.floor(108 / pinSize));
        if (!pinMesh || pinGrid.cols !== cols || pinGrid.rows !== rows || pinGrid.size !== pinSize) {
            rebuildPinScreen(cols, rows, pinSize);
        }
        pinMesh.visible = true;
        sample.width = cols;
        sample.height = rows;
        drawSource(sampleCtx, cols, rows, controls.mirror.checked);
        var data = sampleCtx.getImageData(0, 0, cols, rows).data;
        var matrix = new THREE.Matrix4();
        var scale = number(controls.pinScale) / 100;
        var depth = number(controls.pinDepth) / 100;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var index = y * cols + x;
                var p = index * 4;
                var lum = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
                var z = 0.15 + lum * depth * 9;
                matrix.identity();
                matrix.makeScale(0.82 * scale, 0.82 * scale, z);
                matrix.setPosition(x, rows - y, z / 2);
                pinMesh.setMatrixAt(index, matrix);
            }
        }
        pinMesh.instanceMatrix.needsUpdate = true;
        updatePinCamera(cols, rows);
        renderer.render(scene, camera);
    }

    function render() {
        resize();
        if (currentEffect === 'pixel') renderPixelation();
        else if (currentEffect === 'motion') renderMotionDetection();
        else if (currentEffect === 'dices') renderDices();
        else if (currentEffect === 'redlight') renderRedLight(performance.now());
        else if (currentEffect === 'airguitar') renderAirGuitar(performance.now());
        else if (currentEffect === 'pinscreen') renderPinScreen();
        requestAnimationFrame(render);
    }

    function setEffect(effect) {
        currentEffect = effect;
        resetTemporalState();
        document.querySelectorAll('.effect-btn').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.effect === effect);
        });
        document.querySelectorAll('.effect-settings').forEach(function(panel) {
            panel.hidden = panel.dataset.panel !== effect;
        });
    }

    document.getElementById('btn-camera').addEventListener('click', activateCamera);
    document.getElementById('file-input').addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) loadFile(e.target.files[0]);
    });
    document.getElementById('btn-reset').addEventListener('click', function() {
        stopCamera();
        revokeCurrentUrl();
        sourceVideo.pause();
        sourceVideo.removeAttribute('src');
        sourceVideo.srcObject = null;
        currentSource = null;
        resetTemporalState();
        setStatus('Camara inactiva', false);
    });
    document.getElementById('btn-shot').addEventListener('click', function() {
        var out = (currentEffect === 'dices' || currentEffect === 'pinscreen') && renderer ? renderer.domElement : canvas;
        var a = document.createElement('a');
        a.download = currentEffect + '-camera-fx-pro.png';
        a.href = out.toDataURL('image/png');
        a.click();
    });
    document.getElementById('red-start').addEventListener('click', resetRedGame);
    document.getElementById('air-audio').addEventListener('click', function() {
        var audio = ensureAirAudio();
        if (audio && audio.ctx.state === 'suspended') audio.ctx.resume();
        setStatus(audio ? 'Audio Air Guitar activo' : 'Audio no soportado', !!audio);
    });
    document.querySelectorAll('.effect-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { setEffect(btn.dataset.effect); });
    });
    cameraSelect.addEventListener('change', function() {
        if (currentStream) activateCamera();
    });
    window.addEventListener('resize', resize);
    Object.keys(controls).forEach(function(key) {
        controls[key].addEventListener('input', function() {
            if (key.indexOf('pixel') === 0 || key === 'brightness' || key === 'contrast') pixelCache = {};
            if (key === 'diceFraming') updateDiceCamera();
            if (key === 'pinFraming' && pinGrid.cols) updatePinCamera(pinGrid.cols, pinGrid.rows);
        });
    });

    listCameras().catch(function() {});
    setEffect('pixel');
    requestAnimationFrame(render);
})();
