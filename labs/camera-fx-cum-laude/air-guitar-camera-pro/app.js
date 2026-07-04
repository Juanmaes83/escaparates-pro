(function(window, document) {
    'use strict';

    var CONTENT_WIDTH = 640;
    var CONTENT_HEIGHT = 480;
    var TF_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.7.4/dist/tf.min.js';
    var POSENET_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet@2.2.2/dist/posenet.min.js';
    var TONE_URL = 'https://unpkg.com/tone@14.8.49/build/Tone.js';
    var SAMPLE_URL = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/67732/open-e-down.m4a';

    var indexes = {
        pickWrist: 10,
        pickElbow: 8,
        fretWrist: 9,
        leftShoulder: 5,
        leftHip: 11,
        rightHip: 12
    };

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var capture = document.getElementById('capture');
    var captureCtx = capture.getContext('2d');
    var video = document.getElementById('video');
    var debugEl = document.getElementById('debug');
    var statusPill = document.getElementById('status-pill');
    var chordEl = document.getElementById('chord');
    var strumsEl = document.getElementById('strums');
    var pulseEl = document.getElementById('pulse');
    var btnStart = document.getElementById('btn-start');
    var btnSwitch = document.getElementById('btn-switch');
    var btnPause = document.getElementById('btn-pause');
    var btnPng = document.getElementById('btn-png');
    var sensitivityEl = document.getElementById('strum-sensitivity');
    var distortionEl = document.getElementById('distortion');
    var volumeEl = document.getElementById('volume');
    var mirrorEl = document.getElementById('mirror');

    var net = null;
    var stream = null;
    var facingMode = 'user';
    var running = false;
    var paused = false;
    var loading = false;
    var loopStarted = false;
    var lastPickPos = null;
    var lastStrikeAt = 0;
    var strumCount = 0;
    var lastPoseScore = 0;
    var lastChord = '--';
    var lastError = '';
    var audioReady = false;
    var player = null;
    var pitchShift = null;
    var dist = null;
    var synth = null;
    var gain = null;

    function setDebug(message) {
        debugEl.textContent = [
            message || 'running',
            'camera: ' + (stream ? 'active' : 'off'),
            'model: ' + (net ? 'posenet ready' : 'not loaded'),
            'audio: ' + (audioReady ? 'ready' : 'not ready'),
            'facing: ' + facingMode,
            'pose score: ' + Math.round(lastPoseScore * 100) + '%',
            'last chord: ' + lastChord,
            'strums: ' + strumCount,
            'last error: ' + (lastError || 'none')
        ].join('\n');
    }

    function setStatus(text) {
        statusPill.textContent = text;
    }

    function loadScript(src) {
        return new Promise(function(resolve, reject) {
            var existing = document.querySelector('script[data-src="' + src + '"]');
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                if (existing.dataset.loaded === 'true') resolve();
                return;
            }
            var script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.dataset.src = src;
            script.onload = function() {
                script.dataset.loaded = 'true';
                resolve();
            };
            script.onerror = function() {
                reject(new Error('No se pudo cargar ' + src));
            };
            document.head.appendChild(script);
        });
    }

    function stopStream() {
        if (stream) stream.getTracks().forEach(function(track) { track.stop(); });
        stream = null;
    }

    async function setupCamera() {
        stopStream();
        stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: facingMode,
                width: { ideal: CONTENT_WIDTH },
                height: { ideal: CONTENT_HEIGHT }
            }
        });
        video.srcObject = stream;
        video.width = CONTENT_WIDTH;
        video.height = CONTENT_HEIGHT;
        video.muted = true;
        video.playsInline = true;
        await waitVideoReady();
        await video.play();
    }

    function waitVideoReady() {
        return new Promise(function(resolve) {
            if (video.videoWidth && video.videoHeight) {
                resolve();
                return;
            }
            video.onloadedmetadata = function() { resolve(); };
            setTimeout(resolve, 2500);
        });
    }

    async function setupModel() {
        if (net) return;
        setStatus('LOADING AI');
        await loadScript(TF_URL);
        await loadScript(POSENET_URL);
        if (!window.posenet) throw new Error('PoseNet no disponible');
        net = await window.posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: CONTENT_WIDTH, height: CONTENT_HEIGHT },
            multiplier: 0.75
        });
    }

    async function setupAudio() {
        try {
            await loadScript(TONE_URL);
            if (!window.Tone) throw new Error('Tone.js no disponible');
            await window.Tone.start();
            dist = new window.Tone.Distortion(Number(distortionEl.value) / 100).toDestination();
            gain = new window.Tone.Gain(Math.max(0.001, Number(volumeEl.value) / 100)).connect(dist);
            pitchShift = new window.Tone.PitchShift({ pitch: 0 }).connect(gain);
            synth = new window.Tone.PolySynth(window.Tone.Synth).connect(gain);
            try {
                player = new window.Tone.Player({ url: SAMPLE_URL, autostart: false }).connect(pitchShift);
            } catch (sampleError) {
                player = null;
                lastError = 'Sample remoto no disponible; usando synth';
            }
            if (gain && gain.gain) gain.gain.value = Math.max(0.001, Number(volumeEl.value) / 100);
            if (dist) dist.distortion = Number(distortionEl.value) / 100;
            audioReady = true;
            setDebug('Audio listo');
        } catch (error) {
            audioReady = false;
            player = null;
            lastError = 'Audio no disponible; modo visual activo';
            setDebug('Audio opcional no disponible');
        }
    }

    function intersects(a, b, c, d, p, q, r, s) {
        var det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) return false;
        var lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        var gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }

    function findNewPoint(x, y, radians, distance) {
        return {
            x: Math.round(Math.cos(radians) * distance + x),
            y: Math.round(Math.sin(radians) * distance + y)
        };
    }

    function getRadians(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    function mapPoint(point) {
        if (!mirrorEl.checked) return { x: point.x, y: point.y };
        return { x: CONTENT_WIDTH - point.x, y: point.y };
    }

    function line(x1, y1, x2, y2, strokeStyle, strokeWidth) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    function ellipse(x, y, radius, fill) {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawVideo() {
        ctx.save();
        ctx.clearRect(0, 0, CONTENT_WIDTH, CONTENT_HEIGHT);
        if (mirrorEl.checked) {
            ctx.translate(CONTENT_WIDTH, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, CONTENT_WIDTH, CONTENT_HEIGHT);
        ctx.restore();
    }

    function drawGuide(text) {
        ctx.fillStyle = 'rgba(0,0,0,.58)';
        ctx.fillRect(0, 0, CONTENT_WIDTH, 72);
        ctx.fillStyle = '#fff';
        ctx.font = '800 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, CONTENT_WIDTH / 2, 44);
    }

    function playChord(pitch, pick) {
        var now = Date.now();
        var minGap = Number(sensitivityEl.value);
        if (now - lastStrikeAt < minGap) return;
        lastStrikeAt = now;
        strumCount++;
        var chordNames = ['E', 'F#', 'G', 'A', 'B', 'C#', 'D'];
        var chord = chordNames[Math.max(0, Math.min(chordNames.length - 1, Math.round((pitch + 12) / 5)))];
        lastChord = chord;
        chordEl.textContent = chord;
        strumsEl.textContent = strumCount + ' strums';
        pulseEl.classList.remove('hit');
        pulseEl.style.left = Math.max(0, Math.min(window.innerWidth, pick.x / CONTENT_WIDTH * canvas.getBoundingClientRect().width + canvas.getBoundingClientRect().left - 80)) + 'px';
        pulseEl.style.top = Math.max(0, Math.min(window.innerHeight, pick.y / CONTENT_HEIGHT * canvas.getBoundingClientRect().height + canvas.getBoundingClientRect().top - 80)) + 'px';
        void pulseEl.offsetWidth;
        pulseEl.classList.add('hit');
        if (!audioReady) return;
        if (pitchShift) pitchShift.pitch = pitch;
        if (dist) dist.distortion = Number(distortionEl.value) / 100;
        if (gain && gain.gain) gain.gain.value = Math.max(0.001, Number(volumeEl.value) / 100);
        try {
            if (player && player.loaded) {
                player.stop();
                player.start();
            } else if (synth) {
                synth.triggerAttackRelease(chordToNotes(chord), '8n');
            }
        } catch (error) {
            lastError = error && error.message ? error.message : String(error);
        }
    }

    function chordToNotes(chord) {
        var map = {
            E: ['E3', 'B3', 'E4'],
            'F#': ['F#3', 'C#4', 'F#4'],
            G: ['G3', 'D4', 'G4'],
            A: ['A3', 'E4', 'A4'],
            B: ['B3', 'F#4', 'B4'],
            'C#': ['C#4', 'G#4', 'C#5'],
            D: ['D4', 'A4', 'D5']
        };
        return map[chord] || map.E;
    }

    function playGuitar(points) {
        drawVideo();
        var fret = points[indexes.fretWrist];
        var pickWrist = points[indexes.pickWrist];
        var pickElbow = points[indexes.pickElbow];
        var shoulder = points[indexes.leftShoulder];
        var leftHip = points[indexes.leftHip];
        var rightHip = points[indexes.rightHip];
        lastPoseScore = Math.min(fret.score, pickWrist.score, pickElbow.score, shoulder.score, leftHip.score, rightHip.score);
        if (lastPoseScore <= 0.38) {
            drawGuide('Muestra torso y ambos brazos');
            lastPickPos = null;
            return;
        }

        var wrist = mapPoint(fret.position);
        var pickForearm = {
            x1: mapPoint(pickElbow.position).x,
            y1: mapPoint(pickElbow.position).y,
            x2: mapPoint(pickWrist.position).x,
            y2: mapPoint(pickWrist.position).y
        };
        var shoulderPoint = mapPoint(shoulder.position);
        var leftHipPoint = mapPoint(leftHip.position);
        var rightHipPoint = mapPoint(rightHip.position);

        var pickRatio = Math.hypot(pickForearm.x2 - pickForearm.x1, pickForearm.y2 - pickForearm.y1) * 0.005;
        var pick = {
            x: pickForearm.x2 + (pickForearm.x2 - pickForearm.x1) * pickRatio,
            y: pickForearm.y2 + (pickForearm.y2 - pickForearm.y1) * pickRatio
        };

        var torsoHeight = leftHipPoint.y - shoulderPoint.y;
        var hipCenter = {
            x: (leftHipPoint.x + rightHipPoint.x) / 2,
            y: (leftHipPoint.y + rightHipPoint.y) / 2 - torsoHeight * 0.2
        };
        var neckAngle = getRadians(hipCenter.x, hipCenter.y, wrist.x, wrist.y);
        var neckStart = findNewPoint(hipCenter.x, hipCenter.y, neckAngle, torsoHeight * 0.3);
        var neckEnd = findNewPoint(hipCenter.x, hipCenter.y, neckAngle, torsoHeight * 1.5);
        var bridge = findNewPoint(hipCenter.x, hipCenter.y, neckAngle, torsoHeight * -0.5);

        line(neckStart.x, neckStart.y, neckEnd.x, neckEnd.y, 'rgba(255,255,255,.96)', 5);
        line(bridge.x, bridge.y, neckStart.x, neckStart.y, 'rgba(84,168,255,.95)', 6);
        for (var i = 1; i < 5; i++) {
            var t = i / 5;
            line(
                bridge.x + (neckStart.x - bridge.x) * t,
                bridge.y + (neckStart.y - bridge.y) * t,
                neckEnd.x,
                neckEnd.y,
                'rgba(255,211,77,.22)',
                1.5
            );
        }
        ellipse(pick.x, pick.y, 12, '#ff365c');
        ellipse(wrist.x, wrist.y, 12, '#ffd34d');

        if (lastPickPos) {
            var strummed = intersects(pick.x, pick.y, lastPickPos.x, lastPickPos.y, neckEnd.x, neckEnd.y, bridge.x, bridge.y);
            var movedEnough = Math.hypot(pick.x - lastPickPos.x, pick.y - lastPickPos.y) > 8;
            if (strummed && movedEnough && pick.y < lastPickPos.y) {
                var neckLen = Math.hypot(neckEnd.x - neckStart.x, neckEnd.y - neckStart.y);
                var handLen = Math.hypot(wrist.x - neckStart.x, wrist.y - neckStart.y);
                var pitch = Math.round((1 - handLen / Math.max(1, neckLen)) * 22);
                pitch = Math.max(-12, Math.min(12, pitch));
                playChord(pitch, pick);
            }
        }
        lastPickPos = pick;
    }

    async function poseLoop() {
        if (!running) return;
        if (!paused && net && video.readyState >= 2) {
            try {
                var pose = await net.estimateSinglePose(video, {
                    flipHorizontal: false,
                    decodingMethod: 'single-person'
                });
                playGuitar(pose.keypoints);
                setStatus(lastPoseScore > 0.38 ? 'PLAYING' : 'POSE LOST');
            } catch (error) {
                lastError = error && error.message ? error.message : String(error);
                drawVideo();
                drawGuide('Error de pose. Reintenta.');
            }
            setDebug(paused ? 'Pausado' : 'Air Guitar activo');
        }
        requestAnimationFrame(poseLoop);
    }

    async function start() {
        if (loading) return;
        loading = true;
        btnStart.disabled = true;
        setStatus('LOADING');
        setDebug('Cargando IA, camara y audio...');
        try {
            canvas.width = CONTENT_WIDTH;
            canvas.height = CONTENT_HEIGHT;
            await setupModel();
            await setupCamera();
            await setupAudio();
            running = true;
            paused = false;
            setStatus('PLAYING');
            if (!loopStarted) {
                loopStarted = true;
                poseLoop();
            }
        } catch (error) {
            lastError = error && error.message ? error.message : String(error);
            setStatus('ERROR');
            setDebug('Error al iniciar');
        } finally {
            loading = false;
            btnStart.disabled = false;
        }
    }

    function switchCamera() {
        facingMode = facingMode === 'user' ? 'environment' : 'user';
        if (running) setupCamera().catch(function(error) {
            lastError = error && error.message ? error.message : String(error);
            setDebug('Error cambiando camara');
        });
    }

    function togglePause() {
        paused = !paused;
        btnPause.textContent = paused ? 'Resume' : 'Pause';
        setStatus(paused ? 'PAUSED' : 'PLAYING');
    }

    function downloadPng() {
        capture.width = 1280;
        capture.height = 960;
        captureCtx.drawImage(canvas, 0, 0, capture.width, capture.height);
        captureCtx.fillStyle = 'rgba(0,0,0,.62)';
        captureCtx.fillRect(0, capture.height - 110, capture.width, 110);
        captureCtx.fillStyle = '#fff';
        captureCtx.font = '900 46px system-ui, sans-serif';
        captureCtx.textAlign = 'left';
        captureCtx.fillText('Air Guitar Camera PRO', 42, capture.height - 42);
        captureCtx.textAlign = 'right';
        captureCtx.fillText(lastChord + ' / ' + strumCount + ' strums', capture.width - 42, capture.height - 42);
        var link = document.createElement('a');
        link.download = 'air-guitar-camera-pro.png';
        link.href = capture.toDataURL('image/png');
        link.click();
    }

    function boot() {
        canvas.width = CONTENT_WIDTH;
        canvas.height = CONTENT_HEIGHT;
        ctx.fillStyle = '#0d1118';
        ctx.fillRect(0, 0, CONTENT_WIDTH, CONTENT_HEIGHT);
        drawGuide('Pulsa activar y coloca torso + brazos en camara');
        btnStart.addEventListener('click', start);
        btnSwitch.addEventListener('click', switchCamera);
        btnPause.addEventListener('click', togglePause);
        btnPng.addEventListener('click', downloadPng);
        distortionEl.addEventListener('input', function() {
            if (dist) dist.distortion = Number(distortionEl.value) / 100;
        });
        volumeEl.addEventListener('input', function() {
            if (gain && gain.gain) gain.gain.value = Math.max(0.001, Number(volumeEl.value) / 100);
        });
        setDebug('Esperando inicio');
    }

    boot();
}(window, document));
