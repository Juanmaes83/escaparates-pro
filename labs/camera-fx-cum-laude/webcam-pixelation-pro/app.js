var settings = {
    width: 640,
    brightness: 0,
    contrast: 0,
    size: 8,
    space: 2,
    alpha: 100,
    radius: 2
};

(function(window, document) {
    var MATH_PI_TIMES_TWO = 2 * Math.PI;
    var canvas = document.getElementById('pixel-canvas');
    var context = canvas.getContext('2d', { willReadFrequently: true });
    var video = document.getElementById('source-video');
    var empty = document.getElementById('empty-state');
    var debug = document.getElementById('debug');
    var inputCanvas = document.createElement('canvas');
    var inputContext = inputCanvas.getContext('2d', { willReadFrequently: true });
    var stillCanvas = document.createElement('canvas');
    var stillContext = stillCanvas.getContext('2d', { willReadFrequently: true });
    var imageCache = document.createElement('img');
    var currentSource = null;
    var currentStream = null;
    var currentObjectUrl = '';
    var paused = false;
    var imageData = null;
    var colorLookup = {};
    var frameCount = 0;
    var lastFrameAt = 0;
    var lastError = '';
    var options = {};
    var size = 0;
    var radius = 0;
    var width = 0;
    var height = 0;
    var xOffset = 0;
    var yOffset = 0;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
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
        imageData = null;
        frameCount = 0;
        lastError = '';
    }

    function onSettingsChanged() {
        colorLookup = {};
        options.width = settings.width;
        options.height = settings.width * 3 / 4;
        options.brightness = (255 * (settings.brightness / 100)) >> 0;
        options.contrast = Math.pow((settings.contrast + 100) / 100, 2);
        options.size = settings.size;
        options.space = settings.space;
        options.alpha = settings.alpha / 100;
        options.radius = Math.min(settings.radius, settings.size / 2);

        size = options.size + options.space;
        radius = options.size / 2;
        var factor = options.width / ((options.width * size) - options.space);
        width = (options.width * factor) >> 0;
        height = (options.height * factor) >> 0;
        xOffset = ((options.width - (options.width - (options.width % size)) + options.space) / 2) >> 0;
        yOffset = ((options.height - (options.height - (options.height % size)) + options.space) / 2) >> 0;

        inputCanvas.width = width;
        inputCanvas.height = height;
        stillCanvas.width = options.width;
        stillCanvas.height = options.height;
        imageCache.width = options.width;
        imageCache.height = options.height;
        canvas.width = options.width;
        canvas.height = options.height;
    }

    function drawSource(targetContext, targetWidth, targetHeight) {
        if (!currentSource) return false;
        var sourceWidth = currentSource.videoWidth || currentSource.naturalWidth || currentSource.width || 0;
        var sourceHeight = currentSource.videoHeight || currentSource.naturalHeight || currentSource.height || 0;
        if (!sourceWidth || !sourceHeight) return false;
        targetContext.save();
        targetContext.translate(targetWidth, 0);
        targetContext.scale(-1, 1);
        targetContext.drawImage(currentSource, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
        targetContext.restore();
        return true;
    }

    function createPixel(color) {
        if (!colorLookup[color]) {
            var pColor = color;
            var pCanvas = document.createElement('canvas');
            var pContext = pCanvas.getContext('2d');
            pCanvas.width = pCanvas.height = options.size;
            pColor /= 255;
            pColor -= 0.5;
            pColor *= options.contrast;
            pColor += 0.5;
            pColor *= 255;
            pColor = (pColor + 0.5) >> 0;
            pColor += options.brightness;
            pColor = clamp(pColor, 0, 255);
            pContext.beginPath();
            if (radius === options.radius) {
                pContext.arc(radius, radius, radius, 0, MATH_PI_TIMES_TWO, false);
            } else {
                pContext.moveTo(options.radius, 0);
                pContext.lineTo(options.size - options.radius, 0);
                pContext.quadraticCurveTo(options.size, 0, options.size, options.radius);
                pContext.lineTo(options.size, options.size - options.radius);
                pContext.quadraticCurveTo(options.size, options.size, options.size - options.radius, options.size);
                pContext.lineTo(options.radius, options.size);
                pContext.quadraticCurveTo(0, options.size, 0, options.size - options.radius);
                pContext.lineTo(0, options.radius);
                pContext.quadraticCurveTo(0, 0, options.radius, 0);
            }
            pContext.closePath();
            pContext.fillStyle = 'rgba(' + pColor + ', ' + pColor + ', ' + pColor + ', ' + options.alpha + ')';
            pContext.fill();
            colorLookup[color] = pCanvas;
        }
        return colorLookup[color];
    }

    function tick(now) {
        try {
            if (paused && imageCache.complete && imageCache.src) {
                inputContext.drawImage(imageCache, 0, 0, width, height);
            } else if (currentSource) {
                drawSource(inputContext, width, height);
            }
            context.clearRect(0, 0, options.width, options.height);
            if (currentSource || (paused && imageCache.src)) {
                imageData = inputContext.getImageData(0, 0, width, height);
            }
        } catch (error) {
            lastError = error && error.message ? error.message : String(error);
        }

        if (imageData) {
            var colorData = imageData.data;
            var i;
            var px;
            var x;
            var y;
            var color;
            for (i = 0; colorData[i] !== undefined; i += 4) {
                px = i / 4;
                color = (0.299 * colorData[i] + 0.587 * colorData[i + 1] + 0.114 * colorData[i + 2] + 0.5) >> 0;
                x = (px % width) * size + xOffset;
                y = ((px / width) >> 0) * size + yOffset;
                context.drawImage(colorLookup[color] || createPixel(color), x, y);
            }
            frameCount++;
            lastFrameAt = now;
        }

        updateDebug();
        requestAnimationFrame(tick);
    }

    function updateDebug() {
        var sourceWidth = currentSource ? (currentSource.videoWidth || currentSource.naturalWidth || 0) : 0;
        var sourceHeight = currentSource ? (currentSource.videoHeight || currentSource.naturalHeight || 0) : 0;
        var tracks = currentStream ? currentStream.getVideoTracks() : [];
        var state = tracks[0] ? tracks[0].readyState : 'sin stream';
        debug.textContent = [
            'source: ' + (currentSource ? currentSource.tagName.toLowerCase() : 'none'),
            'source size: ' + sourceWidth + 'x' + sourceHeight,
            'canvas: ' + canvas.width + 'x' + canvas.height,
            'sample: ' + width + 'x' + height,
            'frames rendered: ' + frameCount,
            'camera track: ' + state,
            'paused: ' + paused,
            'last error: ' + (lastError || 'none')
        ].join('\n');
    }

    async function activateCamera() {
        stopCamera();
        revokeObjectUrl();
        paused = false;
        try {
            var stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 960 }
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

    function pauseToggle() {
        if (!currentSource) return;
        if (paused) {
            imageCache.src = '';
            paused = false;
            document.getElementById('btn-pause').textContent = 'Pause';
            return;
        }
        stillContext.clearRect(0, 0, options.width, options.height);
        drawSource(stillContext, options.width, options.height);
        imageCache.src = stillCanvas.toDataURL('image/png');
        paused = true;
        document.getElementById('btn-pause').textContent = 'Resume';
    }

    function downloadPng() {
        var link = document.createElement('a');
        link.download = 'webcam-pixelation-pro.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function initializeSettings() {
        var definitions = {};
        Array.prototype.forEach.call(document.querySelectorAll('#console [data-setting]'), function(element) {
            var parameter = element.getAttribute('data-setting').split(':');
            var setting = parameter[0];
            var range = parameter[1].split(',');
            var stepping = parseFloat(range.pop());
            var min = parseFloat(range[0]);
            var max = parseFloat(range[1]);
            var previous = document.createElement('button');
            var value = document.createElement('span');
            var next = document.createElement('button');
            previous.type = 'button';
            next.type = 'button';
            previous.className = 'step';
            next.className = 'step';
            value.className = 'value';
            previous.textContent = '-';
            next.textContent = '+';
            value.textContent = settings[setting];
            previous.addEventListener('click', function() {
                settings[setting] = clamp(settings[setting] - stepping, min, max);
                value.textContent = settings[setting];
                onSettingsChanged();
            });
            next.addEventListener('click', function() {
                settings[setting] = clamp(settings[setting] + stepping, min, max);
                value.textContent = settings[setting];
                onSettingsChanged();
            });
            element.appendChild(previous);
            element.appendChild(value);
            element.appendChild(next);
            definitions[setting] = { min: min, max: max, stepping: stepping, value: value };
        });
        return definitions;
    }

    document.getElementById('btn-camera').addEventListener('click', activateCamera);
    document.getElementById('btn-stop').addEventListener('click', function() {
        stopCamera();
        setSource(null);
    });
    document.getElementById('file-input').addEventListener('change', function(event) {
        if (event.target.files && event.target.files[0]) loadFile(event.target.files[0]);
    });
    document.getElementById('btn-pause').addEventListener('click', pauseToggle);
    document.getElementById('btn-download').addEventListener('click', downloadPng);

    initializeSettings();
    onSettingsChanged();
    requestAnimationFrame(tick);
}(window, document));
