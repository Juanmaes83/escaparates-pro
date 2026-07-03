(function(window, document) {
    'use strict';

    var GIFSHOT_URL = 'https://cdn.jsdelivr.net/npm/gifshot@0.4.5/build/gifshot.min.js';
    var SCALE = 512;
    var MAX_RECORD_SECONDS = 3;
    var DESKTOP_RATE = 1000 / 3;
    var MOBILE_RATE = 1000;

    var stage = document.getElementById('stage');
    var display = document.getElementById('display');
    var displayCtx = display.getContext('2d', { willReadFrequently: true });
    var rendered = document.getElementById('rendered');
    var video = document.getElementById('video');
    var workerCanvas = document.getElementById('worker-canvas');
    var workerCtx = workerCanvas.getContext('2d', { willReadFrequently: true });
    var workerImage = document.getElementById('worker-image');
    var errorEl = document.getElementById('error');
    var debugEl = document.getElementById('debug');
    var startBtn = document.getElementById('start-camera');
    var switchBtn = document.getElementById('switch-camera');
    var captureBtn = document.getElementById('capture');
    var discardBtn = document.getElementById('discard');
    var saveLink = document.getElementById('save');
    var downloadPngBtn = document.getElementById('download-png');
    var progress = document.getElementById('progress');
    var glitchLevelEl = document.getElementById('glitch-level');
    var jpegQualityEl = document.getElementById('jpeg-quality');
    var persistenceEl = document.getElementById('persistence');
    var mirrorEl = document.getElementById('mirror');

    var stream = null;
    var facingMode = 'user';
    var initiated = false;
    var lastGoodImage = null;
    var lastGoodUri = '';
    var glitchedUri = '';
    var isRecording = false;
    var isProcessing = false;
    var recordStartedAt = 0;
    var recordTimer = 0;
    var frames = [];
    var isTouch = false;
    var frameCount = 0;
    var corruptCount = 0;
    var lastError = '';

    function setDebug(message) {
        debugEl.textContent = [
            message || 'running',
            'camera: ' + (stream ? 'active' : 'off'),
            'facing: ' + facingMode,
            'glitch level: ' + glitchLevelEl.value + '%',
            'frames: ' + frameCount,
            'gif frames: ' + frames.length,
            'corrupt skipped: ' + corruptCount,
            'processing: ' + isProcessing,
            'last error: ' + (lastError || 'none')
        ].join('\n');
    }

    function showError(message) {
        lastError = message;
        errorEl.textContent = message;
        errorEl.classList.add('visible');
        setDebug(message);
    }

    function clearError() {
        errorEl.classList.remove('visible');
        errorEl.textContent = '';
        lastError = '';
    }

    function stopStream() {
        if (stream) {
            stream.getTracks().forEach(function(track) { track.stop(); });
        }
        stream = null;
    }

    function activateCamera() {
        clearError();
        stopStream();
        return navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        }).then(function(mediaStream) {
            stream = mediaStream;
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
            return waitVideoReady().then(function() {
                return video.play();
            });
        }).then(function() {
            if (!initiated) {
                initiated = true;
                requestAnimationFrame(loop);
            }
            setDebug('Camara activa');
        }).catch(function(error) {
            showError(error && error.message ? error.message : 'No se pudo activar la camara');
        });
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

    function drawVideoToWorker() {
        if (!video.videoWidth || !video.videoHeight) return false;
        var sourceW = video.videoWidth;
        var sourceH = video.videoHeight;
        var width = SCALE;
        var height = SCALE;
        if (sourceW > sourceH) {
            width = (sourceW / sourceH) * SCALE;
            height = SCALE;
        } else {
            height = (sourceH / sourceW) * SCALE;
            width = SCALE;
        }
        var x = -(width - SCALE) / 2;
        var y = -(height - SCALE) / 2;
        workerCtx.save();
        workerCtx.clearRect(0, 0, SCALE, SCALE);
        if (mirrorEl.checked) {
            workerCtx.translate(SCALE, 0);
            workerCtx.scale(-1, 1);
            workerCtx.drawImage(video, x, y, width, height);
        } else {
            workerCtx.drawImage(video, x, y, width, height);
        }
        workerCtx.restore();
        return true;
    }

    function glitchDataUri(dataURI) {
        var comma = dataURI.indexOf(',');
        var prefix = dataURI.substring(0, comma + 1);
        var image = dataURI.substring(comma + 1);
        var iterations = Math.floor((Number(glitchLevelEl.value) / 100) * 20);
        for (var i = 0; i < iterations; i++) {
            var point = Math.max(0, Math.min(image.length - 2, Math.round(Math.random() * image.length - 1)));
            image = image.substr(0, point) + image.charAt(point + 1) + image.charAt(point) + image.substr(point + 2);
        }
        return prefix + image;
    }

    function renderGlitchedFrame() {
        if (isProcessing || !stream) return;
        if (!drawVideoToWorker()) return;
        var quality = Number(jpegQualityEl.value) / 100;
        var sourceUri = workerCanvas.toDataURL('image/jpeg', quality);
        glitchedUri = glitchDataUri(sourceUri);
        workerImage.onload = function() {
            lastGoodImage = workerImage;
            lastGoodUri = glitchedUri;
            drawToDisplay(workerImage);
            frameCount++;
            setDebug('Glitch en vivo');
        };
        workerImage.onerror = function() {
            corruptCount++;
            if (lastGoodImage) drawToDisplay(lastGoodImage);
            setDebug('Frame corrupto descartado');
        };
        workerImage.src = glitchedUri;
    }

    function drawToDisplay(image) {
        var persistence = Number(persistenceEl.value) / 100;
        if (persistence > 0) {
            displayCtx.globalAlpha = persistence;
            displayCtx.drawImage(display, 0, 0);
            displayCtx.globalAlpha = 1;
        }
        displayCtx.drawImage(image, 0, 0, display.width, display.height);
    }

    function loop() {
        renderGlitchedFrame();
        requestAnimationFrame(loop);
    }

    function startRecording(event) {
        if (event) event.preventDefault();
        if (!stream || isProcessing || isRecording) return;
        isTouch = isTouch || !!(event && event.type.indexOf('touch') === 0);
        stage.classList.remove('rendered');
        captureBtn.classList.add('recording');
        frames = [];
        isRecording = true;
        recordStartedAt = Date.now();
        progress.style.width = '0%';
        recordTimer = setInterval(captureFrameForGif, isTouch ? MOBILE_RATE : DESKTOP_RATE);
        captureFrameForGif();
        recordingLoop();
    }

    function stopRecording(event) {
        if (event) event.preventDefault();
        if (!isRecording) return;
        isRecording = false;
        clearInterval(recordTimer);
        captureBtn.classList.remove('recording');
        buildGif();
    }

    function recordingLoop() {
        if (!isRecording) return;
        var elapsed = (Date.now() - recordStartedAt) / 1000;
        var percent = Math.min(100, (elapsed / MAX_RECORD_SECONDS) * 100);
        progress.style.width = percent + '%';
        if (elapsed >= MAX_RECORD_SECONDS) {
            stopRecording();
            return;
        }
        requestAnimationFrame(recordingLoop);
    }

    function captureFrameForGif() {
        if (lastGoodUri) frames.push(lastGoodUri);
    }

    function loadScript(src) {
        return new Promise(function(resolve, reject) {
            if (window.gifshot) {
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
            script.onerror = function() { reject(new Error('No se pudo cargar gifshot')); };
            document.head.appendChild(script);
        });
    }

    function buildGif() {
        if (!frames.length) {
            showError('No hay frames suficientes para GIF');
            return;
        }
        isProcessing = true;
        stage.classList.add('processing');
        setDebug('Construyendo GIF...');
        loadScript(GIFSHOT_URL).then(function() {
            window.gifshot.createGIF({
                images: frames,
                gifWidth: SCALE,
                gifHeight: SCALE,
                interval: isTouch ? 1 : 0.33,
                numFrames: frames.length
            }, function(compiled) {
                isProcessing = false;
                stage.classList.remove('processing');
                if (!compiled || compiled.error) {
                    showError(compiled && compiled.errorMsg ? compiled.errorMsg : 'No se pudo crear el GIF');
                    return;
                }
                rendered.src = compiled.image;
                saveLink.href = compiled.image;
                saveLink.setAttribute('aria-disabled', 'false');
                stage.classList.add('rendered');
                setDebug('GIF listo para descargar');
            });
        }).catch(function(error) {
            isProcessing = false;
            stage.classList.remove('processing');
            showError(error && error.message ? error.message : 'No se pudo cargar gifshot');
        });
    }

    function discardGif() {
        frames = [];
        rendered.removeAttribute('src');
        saveLink.removeAttribute('href');
        saveLink.setAttribute('aria-disabled', 'true');
        stage.classList.remove('rendered');
        progress.style.width = '0%';
        setDebug('Resultado descartado');
    }

    function downloadPng() {
        var link = document.createElement('a');
        link.download = 'glitch-camera-pro.png';
        link.href = display.toDataURL('image/png');
        link.click();
    }

    function switchCamera() {
        facingMode = facingMode === 'user' ? 'environment' : 'user';
        activateCamera();
    }

    function bind() {
        startBtn.addEventListener('click', activateCamera);
        switchBtn.addEventListener('click', switchCamera);
        captureBtn.addEventListener('mousedown', startRecording);
        captureBtn.addEventListener('touchstart', startRecording, { passive: false });
        window.addEventListener('mouseup', stopRecording);
        window.addEventListener('touchend', stopRecording);
        discardBtn.addEventListener('click', discardGif);
        downloadPngBtn.addEventListener('click', downloadPng);
        saveLink.setAttribute('aria-disabled', 'true');
        setDebug('Esperando camara');
    }

    bind();
}(window, document));
