(function(window, document) {
    'use strict';

    var HANDS_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
    var CONTENT_WIDTH = 1280;
    var CONTENT_HEIGHT = 720;
    var CHORDS = [
        { name: 'E', notes: [164.81, 246.94, 329.63] },
        { name: 'G', notes: [196.00, 293.66, 392.00] },
        { name: 'A', notes: [220.00, 329.63, 440.00] },
        { name: 'B', notes: [246.94, 369.99, 493.88] },
        { name: 'D', notes: [146.83, 220.00, 293.66] }
    ];

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var capture = document.getElementById('capture');
    var captureCtx = capture.getContext('2d');
    var video = document.getElementById('video');
    var btnStart = document.getElementById('btn-start');
    var btnRestart = document.getElementById('btn-restart');
    var btnPng = document.getElementById('btn-png');
    var traffic = document.getElementById('traffic');
    var trafficLabel = document.getElementById('traffic-label');
    var scoreEl = document.getElementById('score');
    var comboEl = document.getElementById('combo');
    var timerEl = document.getElementById('timer');
    var rankEl = document.getElementById('rank');
    var resultCard = document.getElementById('result-card');
    var resultRank = document.getElementById('result-rank');
    var resultScore = document.getElementById('result-score');
    var coachText = document.getElementById('coach-text');
    var debugEl = document.getElementById('debug');
    var sensitivityEl = document.getElementById('sensitivity');
    var volumeEl = document.getElementById('volume');
    var energyEl = document.getElementById('energy');
    var mirrorEl = document.getElementById('mirror');

    var steps = {
        camera: document.getElementById('step-camera'),
        hands: document.getElementById('step-hands'),
        neck: document.getElementById('step-neck'),
        strum: document.getElementById('step-strum')
    };

    var hands = null;
    var stream = null;
    var running = false;
    var loading = false;
    var sessionActive = false;
    var sessionEnded = false;
    var endAt = 0;
    var score = 0;
    var combo = 1;
    var bestCombo = 1;
    var strums = 0;
    var lastPick = null;
    var lastStrumAt = 0;
    var lastHands = [];
    var particles = [];
    var flash = 0;
    var audioCtx = null;
    var masterGain = null;
    var lastError = '';
    var lastChord = '--';

    function loadScript(src) {
        return new Promise(function(resolve, reject) {
            var existing = document.querySelector('script[data-src="' + src + '"]');
            if (existing) {
                if (existing.dataset.loaded === 'true') resolve();
                else {
                    existing.addEventListener('load', resolve, { once: true });
                    existing.addEventListener('error', reject, { once: true });
                }
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
                reject(new Error('No se pudo cargar MediaPipe Hands'));
            };
            document.head.appendChild(script);
        });
    }

    function initAudio() {
        if (audioCtx) {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            return;
        }
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = Number(volumeEl.value) / 100;
        masterGain.connect(audioCtx.destination);
    }

    function playChord(chord, power) {
        if (!audioCtx || !masterGain) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        masterGain.gain.setTargetAtTime(Number(volumeEl.value) / 100, audioCtx.currentTime, 0.03);
        chord.notes.forEach(function(freq, index) {
            var osc = audioCtx.createOscillator();
            var gain = audioCtx.createGain();
            var filter = audioCtx.createBiquadFilter();
            osc.type = index === 0 ? 'sawtooth' : 'square';
            osc.frequency.value = freq;
            filter.type = 'lowpass';
            filter.frequency.value = 980 + power * 12;
            gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.08 + power * 0.0012, audioCtx.currentTime + 0.018);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.28);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.34);
        });
    }

    async function setupCamera() {
        if (stream) return;
        stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: 'user',
                width: { ideal: CONTENT_WIDTH },
                height: { ideal: CONTENT_HEIGHT }
            }
        });
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await new Promise(function(resolve) {
            if (video.videoWidth) resolve();
            video.onloadedmetadata = resolve;
            setTimeout(resolve, 2200);
        });
        await video.play();
    }

    async function setupHands() {
        if (hands) return;
        await loadScript(HANDS_URL);
        if (!window.Hands) throw new Error('MediaPipe Hands no disponible');
        hands = new window.Hands({
            locateFile: function(file) {
                return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/' + file;
            }
        });
        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.68,
            minTrackingConfidence: 0.55
        });
        hands.onResults(onHandResults);
    }

    async function start() {
        if (loading) return;
        loading = true;
        btnStart.disabled = true;
        resultCard.hidden = true;
        setTraffic('yellow', 'LOADING');
        setCoach('Cargando camara y manos. Si el movil pide permiso, acepta la camara.');
        try {
            canvas.width = CONTENT_WIDTH;
            canvas.height = CONTENT_HEIGHT;
            initAudio();
            await setupHands();
            await setupCamera();
            resetSession();
            running = true;
            steps.camera.classList.add('ok');
            loop();
        } catch (error) {
            lastError = error && error.message ? error.message : String(error);
            setTraffic('red', 'ERROR');
            setCoach('No puedo iniciar camara o MediaPipe. Revisa permisos y usa HTTPS o localhost.');
            drawIdle();
        } finally {
            loading = false;
            btnStart.disabled = false;
            updateDebug();
        }
    }

    function resetSession() {
        score = 0;
        combo = 1;
        bestCombo = 1;
        strums = 0;
        lastPick = null;
        lastStrumAt = 0;
        lastChord = '--';
        sessionActive = true;
        sessionEnded = false;
        endAt = performance.now() + 30000;
        resultCard.hidden = true;
        updateScore();
    }

    async function loop() {
        if (!running || !hands) return;
        try {
            if (video.readyState >= 2) await hands.send({ image: video });
        } catch (error) {
            lastError = error && error.message ? error.message : String(error);
        }
        requestAnimationFrame(loop);
    }

    function onHandResults(results) {
        var image = results.image || video;
        var rawHands = results.multiHandLandmarks || [];
        lastHands = rawHands.map(function(landmarks) {
            return normalizeHand(landmarks);
        });
        render(image, lastHands);
        processGame(lastHands);
        updateDebug();
    }

    function normalizeHand(landmarks) {
        var sx = 0;
        var sy = 0;
        landmarks.forEach(function(lm) {
            sx += lm.x;
            sy += lm.y;
        });
        var palm = { x: sx / landmarks.length, y: sy / landmarks.length };
        function point(index) {
            var lm = landmarks[index];
            var x = mirrorEl.checked ? 1 - lm.x : lm.x;
            return { x: x * canvas.width, y: lm.y * canvas.height, z: lm.z || 0 };
        }
        return {
            palm: {
                x: (mirrorEl.checked ? 1 - palm.x : palm.x) * canvas.width,
                y: palm.y * canvas.height
            },
            wrist: point(0),
            indexTip: point(8),
            middleTip: point(12),
            landmarks: landmarks.map(function(_, i) { return point(i); })
        };
    }

    function processGame(handData) {
        var now = performance.now();
        if (!sessionActive || sessionEnded) return;
        var remaining = Math.max(0, (endAt - now) / 1000);
        timerEl.textContent = remaining.toFixed(1);
        if (remaining <= 0) {
            endSession();
            return;
        }

        if (handData.length < 2) {
            setTraffic(handData.length ? 'yellow' : 'red', handData.length ? 'ONE HAND' : 'NO HANDS');
            steps.hands.classList.toggle('ok', handData.length >= 2);
            steps.neck.classList.remove('ok');
            steps.strum.classList.remove('ok');
            setCoach(handData.length ? 'Veo una mano. Muestra las dos: una al mastil y otra para rasguear.' : 'No veo manos. Entra en plano con buena luz.');
            combo = 1;
            updateScore();
            return;
        }

        steps.hands.classList.add('ok');
        var sorted = handData.slice().sort(function(a, b) { return a.palm.x - b.palm.x; });
        var neckHand = sorted[0];
        var strumHand = sorted[1];
        var guitar = getGuitarGeometry(neckHand);
        var pick = strumHand.indexTip;
        var dist = distanceToSegment(pick, guitar.bridge, guitar.strumEnd);
        var moved = lastPick ? Math.hypot(pick.x - lastPick.x, pick.y - lastPick.y) : 0;
        var cooldownReady = now - lastStrumAt > 135;
        var sensitivity = Number(sensitivityEl.value);
        var crossed = dist < sensitivity && moved > 12;

        steps.neck.classList.add('ok');
        setTraffic('green', 'PLAYABLE');
        setCoach('Bien. Cruza la mano derecha por la zona luminosa de cuerdas. Cada golpe suma combo.');

        if (crossed && cooldownReady) {
            registerStrum(neckHand, pick, moved);
        }
        lastPick = { x: pick.x, y: pick.y };
    }

    function registerStrum(neckHand, pick, moved) {
        var now = performance.now();
        lastStrumAt = now;
        strums++;
        combo = Math.min(12, combo + 1);
        bestCombo = Math.max(bestCombo, combo);
        var chordIndex = Math.max(0, Math.min(CHORDS.length - 1, Math.floor((neckHand.palm.y / canvas.height) * CHORDS.length)));
        var chord = CHORDS[chordIndex];
        lastChord = chord.name;
        score += Math.round(90 + moved * 2 + combo * 18);
        flash = 1;
        steps.strum.classList.add('ok');
        setCoach('Rasgueo correcto: ' + chord.name + '. Sigue, estas en combo x' + combo + '.');
        spawnParticles(pick, Number(energyEl.value));
        playChord(chord, Number(energyEl.value));
        updateScore();
    }

    function updateScore() {
        scoreEl.textContent = String(score);
        comboEl.textContent = 'x' + combo;
        rankEl.textContent = getRank(score);
    }

    function getRank(value) {
        if (value >= 9000) return 'Legend';
        if (value >= 5600) return 'Headliner';
        if (value >= 3000) return 'Stage Pro';
        if (value >= 900) return 'Rookie';
        return '--';
    }

    function endSession() {
        sessionActive = false;
        sessionEnded = true;
        setTraffic('yellow', 'FINISHED');
        setCoach('Reto terminado. Descarga el poster o reinicia para mejorar la marca.');
        resultRank.textContent = getRank(score) === '--' ? 'Try Again' : getRank(score);
        resultScore.textContent = score + ' points / best combo x' + bestCombo;
        resultCard.hidden = false;
    }

    function getGuitarGeometry(neckHand) {
        var body = { x: canvas.width * 0.5, y: canvas.height * 0.64 };
        var neckEnd = {
            x: Math.max(canvas.width * 0.12, Math.min(canvas.width * 0.88, neckHand.palm.x)),
            y: Math.max(canvas.height * 0.18, Math.min(canvas.height * 0.72, neckHand.palm.y))
        };
        var bridge = { x: body.x + canvas.width * 0.08, y: body.y - canvas.height * 0.02 };
        var strumEnd = { x: body.x - canvas.width * 0.1, y: body.y + canvas.height * 0.06 };
        return { body: body, neckEnd: neckEnd, bridge: bridge, strumEnd: strumEnd };
    }

    function render(image, handData) {
        drawVideo(image);
        drawStageOverlay();
        var guitar = handData.length >= 2 ? getGuitarGeometry(handData.slice().sort(function(a, b) { return a.palm.x - b.palm.x; })[0]) : getGuitarGeometry({ palm: { x: canvas.width * 0.25, y: canvas.height * 0.42 } });
        drawGuitar(guitar);
        handData.forEach(drawHand);
        updateParticles();
        drawParticles();
        if (flash > 0) {
            ctx.fillStyle = 'rgba(255, 211, 77,' + (flash * 0.22) + ')';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            flash *= 0.82;
        }
    }

    function drawVideo(image) {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (mirrorEl.checked) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        ctx.fillStyle = 'rgba(2,4,8,.34)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawStageOverlay() {
        var grd = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.55, 80, canvas.width * 0.5, canvas.height * 0.55, canvas.width * 0.7);
        grd.addColorStop(0, 'rgba(255,49,88,.12)');
        grd.addColorStop(0.55, 'rgba(86,168,255,.08)');
        grd.addColorStop(1, 'rgba(0,0,0,.32)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawGuitar(guitar) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(255,211,77,.85)';
        ctx.shadowBlur = 26;
        ctx.strokeStyle = 'rgba(255,211,77,.88)';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.moveTo(guitar.body.x, guitar.body.y);
        ctx.lineTo(guitar.neckEnd.x, guitar.neckEnd.y);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255,49,88,.72)';
        ctx.strokeStyle = 'rgba(255,255,255,.82)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(guitar.body.x, guitar.body.y, 140, 88, -0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,.84)';
        ctx.lineWidth = 3;
        for (var i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(guitar.bridge.x, guitar.bridge.y + i * 8);
            ctx.lineTo(guitar.neckEnd.x, guitar.neckEnd.y + i * 4);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(93,255,155,.9)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(guitar.bridge.x, guitar.bridge.y);
        ctx.lineTo(guitar.strumEnd.x, guitar.strumEnd.y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0,0,0,.58)';
        ctx.beginPath();
        ctx.arc(guitar.body.x + 22, guitar.body.y - 2, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawHand(hand) {
        var links = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,.62)';
        ctx.lineWidth = 2;
        links.forEach(function(link) {
            var a = hand.landmarks[link[0]];
            var b = hand.landmarks[link[1]];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        });
        ctx.fillStyle = '#56a8ff';
        hand.landmarks.forEach(function(point) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.fillStyle = '#ffd34d';
        ctx.beginPath();
        ctx.arc(hand.indexTip.x, hand.indexTip.y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function spawnParticles(origin, energy) {
        for (var i = 0; i < 18; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 2 + Math.random() * energy * 0.08;
            particles.push({
                x: origin.x,
                y: origin.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: 4 + Math.random() * 10
            });
        }
    }

    function updateParticles() {
        particles = particles.filter(function(p) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.02;
            p.life -= 0.025;
            return p.life > 0;
        });
    }

    function drawParticles() {
        particles.forEach(function(p) {
            ctx.fillStyle = 'rgba(255,211,77,' + p.life + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function distanceToSegment(p, a, b) {
        var x = a.x;
        var y = a.y;
        var dx = b.x - x;
        var dy = b.y - y;
        if (dx !== 0 || dy !== 0) {
            var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
            t = Math.max(0, Math.min(1, t));
            x += dx * t;
            y += dy * t;
        }
        return Math.hypot(p.x - x, p.y - y);
    }

    function setTraffic(color, label) {
        var lamp = traffic.querySelector('.lamp');
        lamp.className = 'lamp ' + (color === 'green' ? 'green' : color === 'yellow' ? 'yellow' : 'red');
        trafficLabel.textContent = label;
    }

    function setCoach(message) {
        coachText.textContent = message;
    }

    function drawIdle() {
        ctx.fillStyle = '#090c12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '900 40px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Air Guitar Camera PRO', canvas.width / 2, canvas.height / 2 - 18);
        ctx.fillStyle = 'rgba(255,255,255,.68)';
        ctx.font = '22px system-ui, sans-serif';
        ctx.fillText('Pulsa activar para iniciar el reto festival', canvas.width / 2, canvas.height / 2 + 28);
    }

    function updateDebug() {
        debugEl.textContent = [
            'camera: ' + (stream ? 'active' : 'off'),
            'hands model: ' + (hands ? 'ready' : 'not loaded'),
            'hands detected: ' + lastHands.length,
            'audio: ' + (audioCtx ? audioCtx.state : 'off'),
            'score: ' + score,
            'combo: ' + combo,
            'strums: ' + strums,
            'last chord: ' + lastChord,
            'last error: ' + (lastError || 'none')
        ].join('\n');
    }

    function downloadPng() {
        capture.width = 1280;
        capture.height = 720;
        captureCtx.drawImage(canvas, 0, 0, capture.width, capture.height);
        captureCtx.fillStyle = 'rgba(0,0,0,.64)';
        captureCtx.fillRect(0, capture.height - 120, capture.width, 120);
        captureCtx.fillStyle = '#fff';
        captureCtx.font = '900 44px system-ui, sans-serif';
        captureCtx.fillText('Air Guitar Camera PRO Festival', 42, capture.height - 50);
        captureCtx.textAlign = 'right';
        captureCtx.fillStyle = '#ffd34d';
        captureCtx.fillText(getRank(score) + ' / ' + score + ' pts', capture.width - 42, capture.height - 50);
        var link = document.createElement('a');
        link.download = 'air-guitar-camera-pro-festival.png';
        link.href = capture.toDataURL('image/png');
        link.click();
    }

    function boot() {
        canvas.width = CONTENT_WIDTH;
        canvas.height = CONTENT_HEIGHT;
        btnStart.addEventListener('click', start);
        btnRestart.addEventListener('click', resetSession);
        btnPng.addEventListener('click', downloadPng);
        volumeEl.addEventListener('input', function() {
            if (masterGain) masterGain.gain.setTargetAtTime(Number(volumeEl.value) / 100, audioCtx.currentTime, 0.03);
        });
        drawIdle();
        updateDebug();
    }

    boot();
}(window, document));
