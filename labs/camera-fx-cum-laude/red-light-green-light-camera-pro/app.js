(function(window, document) {
    'use strict';

    var MAX_TIME = 60;
    var FINISH_DISTANCE = 100;
    var IN_GAME_MAX_DISTANCE = 4000;
    var BASE_MAX_MOVEMENT = 180;
    var CASCADE_URL = 'https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder';
    var DOLL_AUDIO_URL = 'https://assets.codepen.io/127738/squid-game-sound.mp3';
    var SHOT_URL = 'https://assets.codepen.io/127738/shotgun.mp3';
    var SIGH_URL = 'https://assets.codepen.io/127738/sigh.mp3';
    var DOLL_MODEL_URL = 'https://assets.codepen.io/127738/Squid_game_doll.gltf';
    var DOLL_BG_URL = 'https://assets.codepen.io/127738/Squid_Game_Doll_bg.jpg';
    var PICO_URL = 'https://assets.codepen.io/127738/pico.js';
    var GSAP_URL = 'https://unpkg.com/gsap@3/dist/gsap.min.js';
    var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.133.1/build/three.min.js';
    var GLTF_URL = 'https://cdn.jsdelivr.net/npm/three@0.133.1/examples/js/loaders/GLTFLoader.js';

    var container = document.getElementById('container');
    var game = document.getElementById('game');
    var webcam = document.getElementById('webcam');
    var webcamCtx = webcam.getContext('2d', { willReadFrequently: true });
    var capture = document.getElementById('capture');
    var captureCtx = capture.getContext('2d');
    var video = document.getElementById('camera');
    var howto = document.getElementById('howto');
    var deadPanel = document.getElementById('dead');
    var winPanel = document.getElementById('win');
    var startBtn = document.getElementById('start');
    var downloadIntro = document.getElementById('download-intro');
    var distanceEl = document.getElementById('distance');
    var timeEl = document.getElementById('time');
    var movementEl = document.getElementById('movement');
    var phaseEl = document.getElementById('phase');
    var debugEl = document.getElementById('debug');
    var sensitivityEl = document.getElementById('sensitivity');
    var fallbackDoll = document.getElementById('fallback-doll');

    var distance = 0;
    var isWatching = true;
    var pos = { x: -1, y: -1 };
    var prevPos = { x: -1, y: -1 };
    var distanceSinceWatching = 0;
    var playing = false;
    var started = false;
    var startTime = 0;
    var stream = null;
    var switchTimer = 0;
    var updateMemory = null;
    var facefinderClassifyRegion = function() { return -1.0; };
    var cascadeReady = false;
    var cascadePromise = null;
    var lastDetectionScore = 0;
    var lastMotion = 0;
    var lastError = '';
    var renderer = null;
    var scene = null;
    var camera = null;
    var head = null;
    var audioDoll = new Audio();
    var shotGun = new Audio();
    var sigh = new Audio();
    var audioDollDuration = 5.433469;
    audioDoll.preload = 'none';
    shotGun.preload = 'none';
    sigh.preload = 'none';
    shotGun.volume = 0.2;

    function ensureAudio() {
        if (!audioDoll.src) audioDoll.src = DOLL_AUDIO_URL;
        if (!shotGun.src) shotGun.src = SHOT_URL;
        if (!sigh.src) sigh.src = SIGH_URL;
    }

    function loadScript(src, timeoutMs) {
        return new Promise(function(resolve, reject) {
            if (document.querySelector('script[data-loaded-src="' + src + '"]')) {
                resolve();
                return;
            }
            var script = document.createElement('script');
            var done = false;
            var timer = window.setTimeout(function() {
                if (done) return;
                done = true;
                script.remove();
                reject(new Error('Timeout cargando ' + src));
            }, timeoutMs || 12000);
            script.src = src;
            script.async = true;
            script.dataset.loadedSrc = src;
            script.onload = function() {
                if (done) return;
                done = true;
                window.clearTimeout(timer);
                resolve();
            };
            script.onerror = function() {
                if (done) return;
                done = true;
                window.clearTimeout(timer);
                reject(new Error('No se pudo cargar ' + src));
            };
            document.head.appendChild(script);
        });
    }

    function pad(value, size) {
        var text = String(Math.max(0, Math.floor(value)));
        while (text.length < size) text = '0' + text;
        return text;
    }

    function setDebug(message) {
        debugEl.textContent = [
            message || 'running',
            'cascade ready: ' + cascadeReady,
            'face score: ' + Math.round(lastDetectionScore),
            'motion: ' + Math.round(lastMotion),
            'distance raw: ' + Math.round(distance),
            'red meter raw: ' + Math.round(distanceSinceWatching),
            'last error: ' + (lastError || 'none')
        ].join('\n');
    }

    function rgbaToGrayscale(rgba, nrows, ncols) {
        var gray = new Uint8Array(nrows * ncols);
        for (var r = 0; r < nrows; ++r) {
            for (var c = 0; c < ncols; ++c) {
                gray[r * ncols + c] =
                    (2 * rgba[r * 4 * ncols + 4 * c] +
                    7 * rgba[r * 4 * ncols + 4 * c + 1] +
                    rgba[r * 4 * ncols + 4 * c + 2]) / 10;
            }
        }
        return gray;
    }

    function loadCascade() {
        if (cascadePromise) return cascadePromise;
        if (!window.pico) {
            lastError = 'pico.js no esta cargado';
            setDebug('Falta pico.js');
            return Promise.resolve(false);
        }
        updateMemory = window.pico.instantiate_detection_memory(5);
        cascadePromise = fetch(CASCADE_URL)
            .then(function(response) { return response.arrayBuffer(); })
            .then(function(buffer) {
                facefinderClassifyRegion = window.pico.unpack_cascade(new Int8Array(buffer));
                cascadeReady = true;
                setDebug('Cascade cargada');
                return true;
            })
            .catch(function(error) {
                lastError = error && error.message ? error.message : String(error);
                setDebug('Error cargando cascade');
                return false;
            });
        return cascadePromise;
    }

    function detectFace() {
        if (!cascadeReady || !updateMemory) return null;
        var rgba = webcamCtx.getImageData(0, 0, webcam.width, webcam.height).data;
        var image = {
            pixels: rgbaToGrayscale(rgba, webcam.height, webcam.width),
            nrows: webcam.height,
            ncols: webcam.width,
            ldim: webcam.width
        };
        var params = {
            shiftfactor: 0.1,
            minsize: 100,
            maxsize: 1000,
            scalefactor: 1.1
        };
        var dets = window.pico.run_cascade(image, facefinderClassifyRegion, params);
        dets = updateMemory(dets);
        dets = window.pico.cluster_detections(dets, 0.2);
        if (!dets.length || dets[0][3] <= 50.0) {
            lastDetectionScore = dets.length ? dets[0][3] : 0;
            return null;
        }
        lastDetectionScore = dets[0][3];
        return dets[0];
    }

    function updateFaceAndGame() {
        if (!video.videoWidth || !video.videoHeight) {
            setDebug('Esperando dimensiones de camara');
            return;
        }
        webcamCtx.save();
        webcamCtx.setTransform(-1, 0, 0, 1, webcam.width, 0);
        webcamCtx.drawImage(video, 0, 0, webcam.width, webcam.height);
        webcamCtx.restore();
        var det = detectFace();
        if (!det) {
            lastMotion = 0;
            drawFaceHint(false);
            return;
        }
        prevPos.x = pos.x;
        prevPos.y = pos.y;
        pos.x = det[1];
        pos.y = det[0];
        var movement = prevPos.x === -1 ? 0 : Math.hypot(pos.x - prevPos.x, pos.y - prevPos.y);
        lastMotion = movement;
        drawFaceHint(true, det);
        if (!playing) return;
        if (!isWatching) {
            distance += movement;
            if (distance > IN_GAME_MAX_DISTANCE) reachedEnd();
        } else {
            distanceSinceWatching += movement;
            if (distanceSinceWatching > maxMovement()) dead();
        }
        updateMeters();
    }

    function drawFaceHint(found, det) {
        if (!found || !det) {
            webcamCtx.strokeStyle = 'rgba(255,255,255,.45)';
            webcamCtx.lineWidth = 4;
            webcamCtx.strokeRect(8, 8, webcam.width - 16, webcam.height - 16);
            return;
        }
        webcamCtx.beginPath();
        webcamCtx.lineWidth = 5;
        webcamCtx.strokeStyle = isWatching ? '#d7213c' : '#36d67a';
        webcamCtx.arc(det[1], det[0], det[2] / 2, 0, Math.PI * 2);
        webcamCtx.stroke();
    }

    function maxMovement() {
        return BASE_MAX_MOVEMENT * (Number(sensitivityEl.value) / 180);
    }

    function updateMeters() {
        var formattedDistance = Math.round((distance / IN_GAME_MAX_DISTANCE) * FINISH_DISTANCE);
        distanceEl.textContent = pad(Math.min(FINISH_DISTANCE, formattedDistance), 3);
        var movingDistance = Math.floor(distanceSinceWatching / maxMovement() * 100);
        movementEl.textContent = pad(Math.min(100, movingDistance), 2) + '%';
        updateTimer(MAX_TIME - (Date.now() - startTime) / 1000);
    }

    function updateTimer(timeLeft) {
        if (timeLeft < 0) timeLeft = 0;
        timeEl.textContent = pad(timeLeft / 60, 2) + ':' + pad(timeLeft % 60, 2);
    }

    function setWatching(nextWatching, duration) {
        isWatching = nextWatching;
        container.classList.toggle('is-red', isWatching);
        container.classList.toggle('is-green', !isWatching);
        phaseEl.textContent = isWatching ? 'RED LIGHT' : 'GREEN LIGHT';
        if (window.gsap && head) {
            window.gsap.to(head.rotation, { y: isWatching ? 0 : -Math.PI, duration: 0.4 });
        }
        if (!isWatching) {
            distanceSinceWatching = 0;
            try {
                ensureAudio();
                audioDoll.currentTime = 0;
                audioDoll.playbackRate = Math.max(0.65, (audioDollDuration - 0.5) / duration);
                audioDoll.play();
            } catch (error) {}
        } else {
            try { audioDoll.pause(); } catch (error) {}
        }
    }

    function scheduleNextLight() {
        if (!playing) return;
        var duration = isWatching ? (Math.random() * 3500 + 2500) : (Math.random() * 2000 + 2000);
        window.clearTimeout(switchTimer);
        switchTimer = window.setTimeout(function() {
            setWatching(!isWatching, duration / 1000);
            scheduleNextLight();
        }, duration);
    }

    function frameLoop() {
        if (started) {
            updateFaceAndGame();
            if (playing && (Date.now() - startTime) / 1000 > MAX_TIME) timeOut();
            setDebug(playing ? (isWatching ? 'RED: quieto' : 'GREEN: avanza') : 'pausado');
        }
        window.requestAnimationFrame(frameLoop);
    }

    function show(panel) {
        howto.classList.remove('is-visible');
        deadPanel.classList.remove('is-visible');
        winPanel.classList.remove('is-visible');
        if (panel) panel.classList.add('is-visible');
    }

    function startGame() {
        distance = 0;
        distanceSinceWatching = 0;
        pos = { x: -1, y: -1 };
        prevPos = { x: -1, y: -1 };
        playing = true;
        started = true;
        startTime = Date.now();
        updateMeters();
        container.classList.add('is-playing');
        show(null);
        setWatching(true, 2.5);
        scheduleNextLight();
    }

    function stopGame() {
        playing = false;
        window.clearTimeout(switchTimer);
        try { audioDoll.pause(); } catch (error) {}
    }

    function reachedEnd() {
        stopGame();
        try {
            ensureAudio();
            sigh.currentTime = 0;
            sigh.play();
        } catch (error) {}
        container.classList.remove('is-playing');
        show(winPanel);
    }

    function timeOut() {
        dead();
    }

    function dead() {
        stopGame();
        try {
            ensureAudio();
            shotGun.currentTime = 0;
            shotGun.play();
        } catch (error) {}
        container.classList.remove('is-playing');
        show(deadPanel);
    }

    function activateCamera() {
        return navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        }).then(function(mediaStream) {
            stream = mediaStream;
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
            return waitVideoReady().then(function() {
                return video.play();
            });
        });
    }

    function waitVideoReady() {
        return new Promise(function(resolve) {
            if (video.videoWidth && video.videoHeight) {
                resolve();
                return;
            }
            video.onloadedmetadata = function() { resolve(); };
            window.setTimeout(resolve, 2500);
        });
    }

    function initThree() {
        if (!window.THREE) {
            lastError = 'THREE no cargado';
            return;
        }
        scene = new window.THREE.Scene();
        camera = new window.THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
        renderer = new window.THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        document.getElementById('doll-stage').appendChild(renderer.domElement);
        camera.position.y = 2.8;
        camera.position.z = 11;
        scene.add(new window.THREE.HemisphereLight(0xffffbb, 0x080820, 1));
        scene.add(new window.THREE.AmbientLight(0x404040, 1.2));
        var spotLight = new window.THREE.SpotLight(0xffffff);
        spotLight.position.set(100, 1000, 100);
        scene.add(spotLight);
        head = new window.THREE.Group();
        scene.add(head);
        resizeThree();
        if (window.THREE.GLTFLoader) {
            var loader = new window.THREE.GLTFLoader();
            loader.load(DOLL_MODEL_URL, function(gltf) {
                scene.add(gltf.scene);
                try {
                    var root = gltf.scene.children[0].children[0].children[0];
                    var childA = root.children[1];
                    var childB = root.children[2];
                    var childC = root.children[3];
                    head.add(childA);
                    head.add(childB);
                    if (childC) head.add(childC);
                    head.children.forEach(function(child) {
                        child.position.y = -8;
                        child.position.z = 1;
                        child.scale.setScalar(1);
                    });
                    head.position.y = 8;
                    head.position.z = -1;
                    fallbackDoll.classList.add('is-hidden');
                } catch (error) {
                    lastError = 'Modelo cargado con estructura distinta; usando fallback';
                }
            }, null, function(error) {
                lastError = error && error.message ? error.message : 'No se pudo cargar modelo 3D';
            });
        }
        renderer.setAnimationLoop(function() {
            renderer.render(scene, camera);
        });
    }

    function resizeThree() {
        if (!renderer || !camera) return;
        var rect = game.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
    }

    function downloadPng() {
        var rect = game.getBoundingClientRect();
        capture.width = 1280;
        capture.height = Math.round(1280 * rect.height / rect.width);
        captureCtx.fillStyle = isWatching ? '#b82035' : '#2fae62';
        captureCtx.fillRect(0, 0, capture.width, capture.height);
        captureCtx.drawImage(webcam, capture.width * 0.66, capture.height * 0.04, capture.width * 0.28, capture.height * 0.21);
        captureCtx.fillStyle = 'rgba(0,0,0,.72)';
        captureCtx.fillRect(0, 0, capture.width, 118);
        captureCtx.fillRect(0, capture.height - 118, capture.width, 118);
        captureCtx.fillStyle = '#fff';
        captureCtx.font = '900 54px system-ui, sans-serif';
        captureCtx.textAlign = 'center';
        captureCtx.fillText('Red Light Green Light Camera PRO', capture.width / 2, 76);
        captureCtx.font = '800 44px ui-monospace, monospace';
        captureCtx.fillText(phaseEl.textContent + '  |  ' + distanceEl.textContent + '/100  |  ' + movementEl.textContent, capture.width / 2, capture.height - 44);
        var link = document.createElement('a');
        link.download = 'red-light-green-light-camera-pro.png';
        link.href = capture.toDataURL('image/png');
        link.click();
    }

    function boot() {
        startBtn.disabled = false;
        startBtn.textContent = 'Start';
        setDebug('Listo para iniciar');
        window.addEventListener('resize', resizeThree);
        startBtn.addEventListener('click', function() {
            startBtn.disabled = true;
            startBtn.textContent = 'Loading camera...';
            setDebug('Cargando detector y activando camara...');
            loadScript(PICO_URL, 14000)
                .then(loadCascade)
                .then(function(ok) {
                    if (!ok) throw new Error('Detector facial no disponible');
                    return activateCamera();
                })
                .then(startGame)
                .catch(function(error) {
                    lastError = error && error.message ? error.message : String(error);
                    show(howto);
                    setDebug('No se pudo activar camara');
                })
                .finally(function() {
                    startBtn.disabled = false;
                    startBtn.textContent = 'Start';
                });
        });
        Array.prototype.forEach.call(document.querySelectorAll('.replay'), function(button) {
            button.addEventListener('click', startGame);
        });
        Array.prototype.forEach.call(document.querySelectorAll('.download'), function(button) {
            button.addEventListener('click', downloadPng);
        });
        downloadIntro.addEventListener('click', downloadPng);
        frameLoop();
        updateMeters();
        window.addEventListener('load', function() {
            window.setTimeout(function() {
                var bg = new Image();
                bg.onload = function() { game.classList.add('has-original-bg'); };
                bg.src = DOLL_BG_URL;
                loadScript(GSAP_URL, 10000)
                    .catch(function() {})
                    .then(function() { return loadScript(THREE_URL, 10000); })
                    .then(function() { return loadScript(GLTF_URL, 10000); })
                    .then(initThree)
                    .catch(function(error) {
                        lastError = error && error.message ? error.message : String(error);
                        setDebug('3D externo no disponible; fallback activo');
                    });
            }, 700);
        });
    }

    boot();
}(window, document));
