(function(window, document) {
    'use strict';

    var HANDS_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
    var W = 1280;
    var H = 720;
    var SCENES = {
        stadium: { name: 'Festival Stadium', src: './assets/festival-stadium.png' },
        club: { name: 'Neon Club', src: './assets/neon-club.png' },
        launch: { name: 'Brand Launch', src: './assets/brand-launch.png' }
    };
    var STYLES = {
        rock: { wave: 'sawtooth', decay: 0.34, gain: 0.11, filter: 1200 },
        electro: { wave: 'square', decay: 0.22, gain: 0.08, filter: 2100 },
        funk: { wave: 'triangle', decay: 0.18, gain: 0.095, filter: 1500 }
    };
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
    var startBtn = document.getElementById('start');
    var restartBtn = document.getElementById('restart');
    var playBtn = document.getElementById('play-riff');
    var wavBtn = document.getElementById('download-wav');
    var jsonBtn = document.getElementById('download-json');
    var posterBtn = document.getElementById('download-poster');
    var signal = document.getElementById('signal');
    var signalLabel = signal.querySelector('span');
    var scoreEl = document.getElementById('score');
    var comboEl = document.getElementById('combo');
    var timerEl = document.getElementById('timer');
    var riffCountEl = document.getElementById('riff-count');
    var coachEl = document.getElementById('coach');
    var debugEl = document.getElementById('debug');
    var result = document.getElementById('result');
    var rankEl = document.getElementById('rank');
    var finalScoreEl = document.getElementById('final-score');
    var sensitivityEl = document.getElementById('sensitivity');
    var volumeEl = document.getElementById('volume');
    var mirrorEl = document.getElementById('mirror');
    var panEl = document.getElementById('pan');
    var styleEl = document.getElementById('style');
    var stepEls = {
        camera: document.getElementById('s-camera'),
        hands: document.getElementById('s-hands'),
        neck: document.getElementById('s-neck'),
        strum: document.getElementById('s-strum')
    };

    var sceneImages = {};
    var currentScene = 'stadium';
    var stream = null;
    var hands = null;
    var audioCtx = null;
    var masterGain = null;
    var running = false;
    var loading = false;
    var gameActive = false;
    var gameEnded = false;
    var startAt = 0;
    var endAt = 0;
    var score = 0;
    var combo = 1;
    var bestCombo = 1;
    var lastPick = null;
    var lastStrumAt = 0;
    var lastHands = [];
    var riffEvents = [];
    var particles = [];
    var flash = 0;
    var lastError = '';

    function boot() {
        canvas.width = W;
        canvas.height = H;
        loadScenes();
        drawIdle();
        setStartButtonState('idle');
        startBtn.addEventListener('click', start);
        restartBtn.addEventListener('click', resetGame);
        playBtn.addEventListener('click', playRiff);
        wavBtn.addEventListener('click', downloadWav);
        jsonBtn.addEventListener('click', downloadEvents);
        posterBtn.addEventListener('click', downloadPoster);
        document.querySelectorAll('.scene').forEach(function(btn) {
            btn.addEventListener('click', function() {
                currentScene = btn.dataset.scene;
                document.querySelectorAll('.scene').forEach(function(item) { item.classList.remove('active'); });
                btn.classList.add('active');
                redrawCurrentFrame();
                updateDebug();
            });
        });
        panEl.addEventListener('input', redrawCurrentFrame);
        setSignal('red', 'READY');
        updateDebug();
    }

    function loadScenes() {
        Object.keys(SCENES).forEach(function(key) {
            var img = new Image();
            img.src = SCENES[key].src;
            sceneImages[key] = img;
        });
    }

    function loadScript(src) {
        return new Promise(function(resolve, reject) {
            var old = document.querySelector('script[data-src="' + src + '"]');
            if (old) {
                if (old.dataset.loaded === 'true') resolve();
                else {
                    old.addEventListener('load', resolve, { once: true });
                    old.addEventListener('error', reject, { once: true });
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
            script.onerror = function() { reject(new Error('No se pudo cargar MediaPipe Hands')); };
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

    async function setupCamera() {
        if (stream) return;
        stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: 'user', width: { ideal: W }, height: { ideal: H } }
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
        hands.onResults(onResults);
    }

    function setStartButtonState(state) {
        startBtn.classList.remove('is-loading', 'is-active', 'is-error');
        if (state === 'loading') {
            startBtn.classList.add('is-loading');
            startBtn.textContent = 'Activando camara...';
        } else if (state === 'active') {
            startBtn.classList.add('is-active');
            startBtn.textContent = 'Camara activa';
        } else if (state === 'error') {
            startBtn.classList.add('is-error');
            startBtn.textContent = 'Reintentar camara';
        } else {
            startBtn.textContent = 'Activar camara y empezar';
        }
    }

    async function start() {
        if (loading) return;
        loading = true;
        startBtn.disabled = true;
        setStartButtonState('loading');
        setSignal('yellow', 'LOADING');
        coach('Activando camara primero. Despues cargamos manos y audio sin bloquear la imagen.');
        try {
            await setupCamera();
            stepEls.camera.classList.add('ok');
            setStartButtonState('active');
            setSignal('yellow', 'CAMERA ON');
            coach('Camara activa. Cargando deteccion de manos y audio.');
            resetGame();
            running = true;

            try {
                initAudio();
            } catch (audioError) {
                lastError = 'Audio opcional: ' + (audioError && audioError.message ? audioError.message : String(audioError));
            }

            previewLoop();

            try {
                await setupHands();
                setSignal('green', 'LIVE');
                coach('Camara y manos activas. Una mano al mastil y la otra rasguea la zona verde.');
                loop();
            } catch (handsError) {
                lastError = 'Manos no disponibles: ' + (handsError && handsError.message ? handsError.message : String(handsError));
                setSignal('yellow', 'CAMERA ONLY');
                coach('La camara funciona, pero no cargó MediaPipe. Revisa conexion/CDN; el visor queda activo para diagnostico.');
            }
        } catch (error) {
            lastError = error && error.message ? error.message : String(error);
            setStartButtonState('error');
            setSignal('red', 'ERROR');
            coach('No pudo iniciarse la camara. Revisa permisos y usa HTTPS o localhost.');
            drawIdle();
        } finally {
            loading = false;
            startBtn.disabled = false;
            updateDebug();
        }
    }

    function resetGame() {
        score = 0;
        combo = 1;
        bestCombo = 1;
        riffEvents = [];
        lastPick = null;
        lastStrumAt = 0;
        gameActive = true;
        gameEnded = false;
        startAt = performance.now();
        endAt = startAt + 30000;
        result.hidden = true;
        stepEls.strum.classList.remove('ok');
        updateScore();
        coach('Reto activo: una mano en el mastil, la otra cruza la zona verde para crear tu riff.');
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

    function previewLoop() {
        if (!running || hands) return;
        if (video.readyState >= 2) {
            render(video, lastHands);
            updateDebug();
        } else {
            drawIdle();
        }
        requestAnimationFrame(previewLoop);
    }

    function onResults(results) {
        lastHands = (results.multiHandLandmarks || []).map(normalizeHand);
        render(results.image || video, lastHands);
        process(lastHands);
        updateDebug();
    }

    function normalizeHand(landmarks) {
        var sx = 0;
        var sy = 0;
        landmarks.forEach(function(lm) { sx += lm.x; sy += lm.y; });
        function point(i) {
            var lm = landmarks[i];
            return {
                x: (mirrorEl.checked ? 1 - lm.x : lm.x) * W,
                y: lm.y * H,
                z: lm.z || 0
            };
        }
        return {
            palm: { x: (mirrorEl.checked ? 1 - sx / landmarks.length : sx / landmarks.length) * W, y: (sy / landmarks.length) * H },
            wrist: point(0),
            indexTip: point(8),
            middleTip: point(12),
            landmarks: landmarks.map(function(_, i) { return point(i); })
        };
    }

    function process(handData) {
        if (!gameActive || gameEnded) return;
        var now = performance.now();
        var remaining = Math.max(0, (endAt - now) / 1000);
        timerEl.textContent = remaining.toFixed(1);
        if (remaining <= 0) {
            finishGame();
            return;
        }
        if (handData.length < 2) {
            setSignal(handData.length ? 'yellow' : 'red', handData.length ? 'ONE HAND' : 'NO HANDS');
            stepEls.hands.classList.toggle('ok', handData.length >= 2);
            stepEls.neck.classList.remove('ok');
            combo = 1;
            updateScore();
            coach(handData.length ? 'Veo una mano. Muestra las dos para tocar.' : 'No veo manos. Entra en plano con buena luz.');
            return;
        }
        stepEls.hands.classList.add('ok');
        stepEls.neck.classList.add('ok');
        setSignal('green', 'PLAY');
        var sorted = handData.slice().sort(function(a, b) { return a.palm.x - b.palm.x; });
        var neck = sorted[0];
        var pickHand = sorted[1];
        var guitar = geometry(neck);
        var pick = pickHand.indexTip;
        var dist = distanceToSegment(pick, guitar.bridge, guitar.strumEnd);
        var moved = lastPick ? Math.hypot(pick.x - lastPick.x, pick.y - lastPick.y) : 0;
        if (dist < Number(sensitivityEl.value) && moved > 12 && now - lastStrumAt > 130) {
            strum(neck, pick, moved, now);
        } else {
            coach('Toca la zona verde con la mano derecha. Cada golpe correcto queda grabado en tu riff.');
        }
        lastPick = { x: pick.x, y: pick.y };
    }

    function strum(neck, pick, moved, now) {
        var chordIndex = Math.max(0, Math.min(CHORDS.length - 1, Math.floor((neck.palm.y / H) * CHORDS.length)));
        var chord = CHORDS[chordIndex];
        var intensity = Math.max(0.2, Math.min(1, moved / 90));
        var event = {
            t: Math.max(0, (now - startAt) / 1000),
            chord: chord.name,
            chordIndex: chordIndex,
            intensity: intensity,
            style: styleEl.value
        };
        riffEvents.push(event);
        lastStrumAt = now;
        combo = Math.min(16, combo + 1);
        bestCombo = Math.max(bestCombo, combo);
        score += Math.round(100 + intensity * 180 + combo * 22);
        stepEls.strum.classList.add('ok');
        flash = 1;
        spawn(pick, intensity);
        playChord(chord, intensity, styleEl.value, audioCtx, audioCtx ? audioCtx.currentTime : 0);
        updateScore();
        coach('Rasgueo grabado: ' + chord.name + '. Tu riff ya tiene ' + riffEvents.length + ' notas.');
    }

    function playChord(chord, intensity, styleKey, ctxTarget, when) {
        if (!ctxTarget) return;
        var style = STYLES[styleKey] || STYLES.rock;
        var liveContext = ctxTarget === audioCtx;
        if (liveContext && !masterGain) return;
        var destination = liveContext ? masterGain : ctxTarget.destination;
        chord.notes.forEach(function(freq, index) {
            var osc = ctxTarget.createOscillator();
            var gain = ctxTarget.createGain();
            var filter = ctxTarget.createBiquadFilter();
            osc.type = style.wave;
            osc.frequency.value = freq * (index === 0 ? 1 : 1 + intensity * 0.002);
            filter.type = 'lowpass';
            filter.frequency.value = style.filter + intensity * 900;
            gain.gain.setValueAtTime(0.0001, when);
            gain.gain.exponentialRampToValueAtTime(style.gain * intensity, when + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, when + style.decay);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destination);
            osc.start(when);
            osc.stop(when + style.decay + 0.04);
        });
    }

    function playRiff() {
        initAudio();
        if (!riffEvents.length) {
            coach('Todavia no hay riff grabado. Toca algunos rasgueos primero.');
            return;
        }
        var base = audioCtx.currentTime + 0.08;
        riffEvents.forEach(function(ev) {
            playChord(CHORDS[ev.chordIndex], ev.intensity, ev.style, audioCtx, base + ev.t);
        });
        coach('Reproduciendo tu riff de ' + riffEvents.length + ' notas.');
    }

    async function downloadWav() {
        if (!riffEvents.length) {
            coach('No hay riff para descargar. Toca primero.');
            return;
        }
        var OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!OfflineCtx) {
            coach('Este navegador no permite exportar WAV. Prueba en Chrome/Safari moderno o descarga eventos JSON.');
            return;
        }
        wavBtn.disabled = true;
        wavBtn.textContent = 'Generando audio...';
        coach('Generando audio WAV con tu riff.');
        try {
            var duration = Math.max(2, riffEvents[riffEvents.length - 1].t + 1);
            var offline = new OfflineCtx(2, Math.ceil(44100 * duration), 44100);
            riffEvents.forEach(function(ev) {
                playChord(CHORDS[ev.chordIndex], ev.intensity, ev.style, offline, ev.t);
            });
            var buffer = await offline.startRendering();
            var wav = encodeWav(buffer);
            downloadBlob(new Blob([wav], { type: 'audio/wav' }), 'air-guitar-riff.wav');
            coach('Audio WAV generado y descargado con tu riff.');
        } catch (error) {
            lastError = 'WAV export: ' + (error && error.message ? error.message : String(error));
            coach('No se pudo generar el WAV. Descarga eventos JSON y revisamos compatibilidad del navegador.');
        } finally {
            wavBtn.disabled = false;
            wavBtn.textContent = 'Descargar audio WAV';
            updateDebug();
        }
    }

    function finishGame() {
        gameActive = false;
        gameEnded = true;
        var rank = getRank(score);
        rankEl.textContent = rank;
        finalScoreEl.textContent = score + ' puntos / combo x' + bestCombo + ' / ' + riffEvents.length + ' notas';
        result.hidden = false;
        setSignal('yellow', 'FINISHED');
        coach('Reto terminado. Escucha tu riff, descarga audio o genera tu poster.');
    }

    function render(image, handsData) {
        drawScene();
        drawCamera(image);
        drawGuitar(handsData);
        handsData.forEach(drawHand);
        particles = particles.filter(function(p) { p.x += p.vx; p.y += p.vy; p.life -= 0.025; return p.life > 0; });
        particles.forEach(function(p) {
            ctx.fillStyle = 'rgba(255,211,77,' + p.life + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        if (flash > 0) {
            ctx.fillStyle = 'rgba(255,211,77,' + (flash * 0.2) + ')';
            ctx.fillRect(0, 0, W, H);
            flash *= 0.82;
        }
    }

    function drawScene() {
        var img = sceneImages[currentScene];
        if (!img || !img.complete) {
            ctx.fillStyle = '#070a10';
            ctx.fillRect(0, 0, W, H);
            return;
        }
        var scale = H / img.height;
        var sw = W / scale;
        var maxX = Math.max(0, img.width - sw);
        var pan = Number(panEl.value) / 100;
        if (lastHands.length) {
            var avg = lastHands.reduce(function(sum, h) { return sum + h.palm.x; }, 0) / lastHands.length;
            pan = Math.max(0, Math.min(1, (Number(panEl.value) / 100) * 0.72 + (avg / W) * 0.28));
        }
        ctx.drawImage(img, maxX * pan, 0, sw, img.height, 0, 0, W, H);
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.fillRect(0, 0, W, H);
    }

    function drawCamera(image) {
        ctx.save();
        ctx.globalAlpha = 0.42;
        if (mirrorEl.checked) {
            ctx.translate(W, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(image, 0, 0, W, H);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,.16)';
        ctx.fillRect(0, 0, W, H);
    }

    function geometry(neck) {
        var body = { x: W * 0.5, y: H * 0.64 };
        var neckEnd = neck ? { x: neck.palm.x, y: neck.palm.y } : { x: W * 0.25, y: H * 0.36 };
        var bridge = { x: body.x + W * 0.07, y: body.y - H * 0.02 };
        var strumEnd = { x: body.x - W * 0.1, y: body.y + H * 0.06 };
        return { body: body, neckEnd: neckEnd, bridge: bridge, strumEnd: strumEnd };
    }

    function drawGuitar(handsData) {
        var neck = handsData.length >= 2 ? handsData.slice().sort(function(a, b) { return a.palm.x - b.palm.x; })[0] : null;
        var g = geometry(neck);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(255,211,77,.8)';
        ctx.shadowBlur = 22;
        ctx.strokeStyle = 'rgba(255,211,77,.9)';
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(g.body.x, g.body.y);
        ctx.lineTo(g.neckEnd.x, g.neckEnd.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,49,88,.64)';
        ctx.strokeStyle = 'rgba(255,255,255,.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(g.body.x, g.body.y, 138, 82, -0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.88)';
        ctx.lineWidth = 3;
        for (var i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(g.bridge.x, g.bridge.y + i * 8);
            ctx.lineTo(g.neckEnd.x, g.neckEnd.y + i * 4);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(93,255,155,.95)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(g.bridge.x, g.bridge.y);
        ctx.lineTo(g.strumEnd.x, g.strumEnd.y);
        ctx.stroke();
        ctx.restore();
    }

    function drawHand(hand) {
        var links = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,.64)';
        ctx.lineWidth = 2;
        links.forEach(function(l) {
            var a = hand.landmarks[l[0]];
            var b = hand.landmarks[l[1]];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        });
        ctx.fillStyle = '#56a8ff';
        hand.landmarks.forEach(function(p) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.fillStyle = '#ffd34d';
        ctx.beginPath();
        ctx.arc(hand.indexTip.x, hand.indexTip.y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawIdle() {
        drawScene();
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '900 46px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Air Guitar Camera PRO V2', W / 2, H / 2 - 20);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '24px system-ui, sans-serif';
        ctx.fillText('Crea tu riff de marca en 30 segundos', W / 2, H / 2 + 30);
    }

    function redrawCurrentFrame() {
        if (running && video.readyState >= 2) {
            render(video, lastHands);
        } else {
            drawIdle();
        }
    }

    function spawn(origin, intensity) {
        for (var i = 0; i < 18; i++) {
            var a = Math.random() * Math.PI * 2;
            var s = 2 + Math.random() * 8 * intensity;
            particles.push({ x: origin.x, y: origin.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 4 + Math.random() * 10, life: 1 });
        }
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

    function updateScore() {
        scoreEl.textContent = String(score);
        comboEl.textContent = 'x' + combo;
        riffCountEl.textContent = String(riffEvents.length);
    }

    function getRank(value) {
        if (value >= 9500) return 'Legend';
        if (value >= 5600) return 'Headliner';
        if (value >= 2600) return 'Stage Pro';
        if (value >= 900) return 'Rookie';
        return 'Warm Up';
    }

    function setSignal(color, label) {
        signal.className = 'signal ' + (color === 'green' ? 'green' : color === 'yellow' ? 'yellow' : '');
        signalLabel.textContent = label;
    }

    function coach(text) {
        coachEl.textContent = text;
    }

    function downloadEvents() {
        var payload = {
            app: 'Air Guitar Camera PRO V2',
            scene: currentScene,
            score: score,
            bestCombo: bestCombo,
            events: riffEvents
        };
        downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), 'air-guitar-riff-events.json');
    }

    function downloadPoster() {
        capture.width = W;
        capture.height = H;
        captureCtx.drawImage(canvas, 0, 0, W, H);
        captureCtx.fillStyle = 'rgba(0,0,0,.68)';
        captureCtx.fillRect(0, H - 122, W, 122);
        captureCtx.fillStyle = '#fff';
        captureCtx.font = '900 44px system-ui, sans-serif';
        captureCtx.textAlign = 'left';
        captureCtx.fillText('Air Guitar Camera PRO V2', 42, H - 52);
        captureCtx.textAlign = 'right';
        captureCtx.fillStyle = '#ffd34d';
        captureCtx.fillText(getRank(score) + ' / ' + score + ' pts', W - 42, H - 52);
        var link = document.createElement('a');
        link.download = 'air-guitar-v2-poster.png';
        link.href = capture.toDataURL('image/png');
        link.click();
    }

    function encodeWav(buffer) {
        var length = buffer.length * buffer.numberOfChannels * 2 + 44;
        var view = new DataView(new ArrayBuffer(length));
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + buffer.length * buffer.numberOfChannels * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, buffer.numberOfChannels, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
        view.setUint16(32, buffer.numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, buffer.length * buffer.numberOfChannels * 2, true);
        var offset = 44;
        for (var i = 0; i < buffer.length; i++) {
            for (var ch = 0; ch < buffer.numberOfChannels; ch++) {
                var sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
                offset += 2;
            }
        }
        return view.buffer;
    }

    function writeString(view, offset, text) {
        for (var i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    }

    function downloadBlob(blob, name) {
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }

    function updateDebug() {
        debugEl.textContent = [
            'camera: ' + (stream ? 'active' : 'off'),
            'hands model: ' + (hands ? 'ready' : 'not loaded'),
            'hands detected: ' + lastHands.length,
            'audio: ' + (audioCtx ? audioCtx.state : 'off'),
            'scene: ' + currentScene,
            'style: ' + styleEl.value,
            'riff events: ' + riffEvents.length,
            'score: ' + score,
            'last error: ' + (lastError || 'none')
        ].join('\n');
    }

    boot();
}(window, document));
