(function(window, document) {
    var sourceCanvas = document.getElementById('canvas');
    var finalCanvas = document.getElementById('canvasFinal');
    var video = document.getElementById('camStream');
    var empty = document.getElementById('empty-state');
    var debug = document.getElementById('debug');
    var sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    var finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
    var currentSource = null;
    var currentStream = null;
    var currentObjectUrl = '';
    var frameIndex = 0;
    var previousFrames = [];
    var paused = false;
    var pausedFrame = null;
    var frameCount = 0;
    var lastError = '';
    var outputWidth = 640;
    var outputHeight = 480;

    function setResolution(value) {
        var parts = value.split('x');
        outputWidth = Number(parts[0]);
        outputHeight = Number(parts[1]);
        sourceCanvas.width = outputWidth;
        sourceCanvas.height = outputHeight;
        finalCanvas.width = outputWidth;
        finalCanvas.height = outputHeight;
        previousFrames = [];
        pausedFrame = null;
    }

    function revokeObjectUrl() {
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = '';
    }

    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(function(track) { track.stop(); });
        }
        currentStream = null;
    }

    function setSource(source) {
        currentSource = source;
        empty.classList.toggle('hidden', !!source);
        previousFrames = [];
        frameCount = 0;
        lastError = '';
    }

    function drawSource() {
        if (!currentSource) return false;
        var sourceWidth = currentSource.videoWidth || currentSource.naturalWidth || currentSource.width || 0;
        var sourceHeight = currentSource.videoHeight || currentSource.naturalHeight || currentSource.height || 0;
        if (!sourceWidth || !sourceHeight) return false;
        sourceCtx.save();
        if (document.getElementById('mirror').checked) {
            sourceCtx.translate(outputWidth, 0);
            sourceCtx.scale(-1, 1);
        }
        sourceCtx.drawImage(currentSource, 0, 0, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
        sourceCtx.restore();
        return true;
    }

    function renderMotion() {
        if (!currentSource && !pausedFrame) {
            finalCtx.fillStyle = '#808080';
            finalCtx.fillRect(0, 0, outputWidth, outputHeight);
            updateDebug();
            return;
        }
        try {
            if (!paused) {
                if (!drawSource()) {
                    updateDebug();
                    return;
                }
                previousFrames[frameIndex] = sourceCtx.getImageData(0, 0, outputWidth, outputHeight);
                frameIndex = frameIndex === 0 ? 1 : 0;
                var currentFrame = sourceCtx.getImageData(0, 0, outputWidth, outputHeight);
                var previous = previousFrames[frameIndex];
                if (previous) {
                    applyOriginalAlgorithm(currentFrame, previous);
                    pausedFrame = currentFrame;
                    finalCtx.putImageData(currentFrame, 0, 0);
                    frameCount++;
                }
            } else if (pausedFrame) {
                finalCtx.putImageData(pausedFrame, 0, 0);
            }
        } catch (error) {
            lastError = error && error.message ? error.message : String(error);
        }
        updateDebug();
    }

    function applyOriginalAlgorithm(currentFrame, previousFrame) {
        var data = currentFrame.data;
        var previous = previousFrame.data;
        var trail = Number(document.getElementById('trail').value) / 100;
        for (var b = 0, length = data.length; b < length;) {
            // Original gist core:
            // output = 0.5 * (255 - current) + 0.5 * previous
            var r = 0.5 * (255 - data[b]) + 0.5 * previous[b];
            var g = 0.5 * (255 - data[b + 1]) + 0.5 * previous[b + 1];
            var blue = 0.5 * (255 - data[b + 2]) + 0.5 * previous[b + 2];
            if (trail && pausedFrame) {
                r = r * (1 - trail) + pausedFrame.data[b] * trail;
                g = g * (1 - trail) + pausedFrame.data[b + 1] * trail;
                blue = blue * (1 - trail) + pausedFrame.data[b + 2] * trail;
            }
            data[b] = r;
            data[b + 1] = g;
            data[b + 2] = blue;
            data[b + 3] = 255;
            b += 4;
        }
    }

    function loop() {
        renderMotion();
        requestAnimationFrame(loop);
    }

    async function activateCamera() {
        stopCamera();
        revokeObjectUrl();
        paused = false;
        try {
            var stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: outputWidth },
                    height: { ideal: outputHeight }
                },
                audio: false
            });
            currentStream = stream;
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
            await video.play();
            setSource(video);
        } catch (error) {
            lastError = error && error.message ? error.message : String(error);
            setSource(null);
        }
    }

    function loadFile(file) {
        stopCamera();
        revokeObjectUrl();
        paused = false;
        currentObjectUrl = URL.createObjectURL(file);
        if (file.type.indexOf('video/') === 0) {
            video.srcObject = null;
            video.src = currentObjectUrl;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.play().catch(function(error) {
                lastError = error && error.message ? error.message : String(error);
            });
            setSource(video);
            return;
        }
        var img = new Image();
        img.onload = function() {
            setSource(img);
        };
        img.onerror = function() {
            lastError = 'No se pudo cargar la imagen';
        };
        img.src = currentObjectUrl;
    }

    function updateDebug() {
        var sourceWidth = currentSource ? (currentSource.videoWidth || currentSource.naturalWidth || 0) : 0;
        var sourceHeight = currentSource ? (currentSource.videoHeight || currentSource.naturalHeight || 0) : 0;
        var tracks = currentStream ? currentStream.getVideoTracks() : [];
        var state = tracks[0] ? tracks[0].readyState : 'sin stream';
        debug.textContent = [
            'source: ' + (currentSource ? currentSource.tagName.toLowerCase() : 'none'),
            'source size: ' + sourceWidth + 'x' + sourceHeight,
            'output: ' + finalCanvas.width + 'x' + finalCanvas.height,
            'frames rendered: ' + frameCount,
            'camera track: ' + state,
            'paused: ' + paused,
            'algorithm: original neutral-gray frame difference',
            'last error: ' + (lastError || 'none')
        ].join('\n');
    }

    function downloadPng() {
        var link = document.createElement('a');
        link.download = 'motion-detection-camera-pro.png';
        link.href = finalCanvas.toDataURL('image/png');
        link.click();
    }

    document.getElementById('btn-camera').addEventListener('click', activateCamera);
    document.getElementById('btn-stop').addEventListener('click', function() {
        stopCamera();
        setSource(null);
    });
    document.getElementById('file-input').addEventListener('change', function(event) {
        if (event.target.files && event.target.files[0]) loadFile(event.target.files[0]);
    });
    document.getElementById('btn-pause').addEventListener('click', function() {
        paused = !paused;
        this.textContent = paused ? 'Resume' : 'Pause';
    });
    document.getElementById('btn-download').addEventListener('click', downloadPng);
    document.getElementById('resolution').addEventListener('change', function() {
        setResolution(this.value);
    });
    document.getElementById('mirror').addEventListener('change', function() {
        previousFrames = [];
    });

    setResolution(document.getElementById('resolution').value);
    requestAnimationFrame(loop);
}(window, document));
