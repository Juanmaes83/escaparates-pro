EP.Audio = (function() {
    var audioCtx = null;
    var analyser = null;
    var gainNode = null;
    var sourceNode = null;
    var audioEl = null;
    var dataArray = null;
    var bufferLength = 0;

    var mode = 'off'; // 'off' | 'play' | 'energy' | 'bpm'
    var volume = 0.7;
    var energyMultiplier = 1;
    var smoothedEnergy = 0;

    // BPM detection state
    var energyHistory = [];
    var peakTimes = [];
    var lastPeakTime = 0;
    var detectedBpm = 0;
    var manualBpm = 0;

    // For export
    var audioBase64 = null;
    var audioMimeType = null;
    var audioFileName = '';

    var onBpmUpdate = null;

    function ensureContext() {
        if (audioCtx) return true;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.8;
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            gainNode = audioCtx.createGain();
            gainNode.gain.value = volume;
            analyser.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            return true;
        } catch (e) {
            console.warn('EP.Audio: Web Audio API not available', e);
            return false;
        }
    }

    function load(file, callback) {
        if (!file) return;
        audioFileName = file.name;
        audioMimeType = file.type || 'audio/mpeg';

        // Read as base64 for export
        var reader = new FileReader();
        reader.onload = function(e) {
            audioBase64 = e.target.result;
        };
        reader.readAsDataURL(file);

        // Disconnect previous source
        if (sourceNode) {
            try { sourceNode.disconnect(); } catch (ex) {}
            sourceNode = null;
        }
        if (audioEl) {
            audioEl.pause();
            audioEl.src = '';
        }

        audioEl = new Audio();
        audioEl.loop = true;
        audioEl.preload = 'auto';
        audioEl.src = URL.createObjectURL(file);

        audioEl.addEventListener('loadedmetadata', function() {
            if (typeof callback === 'function') callback({
                name: audioFileName,
                duration: audioEl.duration
            });
        });

        // Wire to Web Audio for analysis
        if (mode === 'energy' || mode === 'bpm') {
            wireAnalyser();
        }

        if (mode !== 'off') {
            audioEl.volume = volume;
        }
    }

    function wireAnalyser() {
        if (!ensureContext()) return;
        if (!audioEl) return;
        if (sourceNode) {
            try { sourceNode.disconnect(); } catch (ex) {}
        }
        try {
            // Resume context if suspended (browser autoplay policy)
            if (audioCtx.state === 'suspended') audioCtx.resume();
            sourceNode = audioCtx.createMediaElementSource(audioEl);
            sourceNode.connect(analyser);
        } catch (e) {
            // MediaElementSource can only be created once per element
            console.warn('EP.Audio wireAnalyser:', e);
        }
    }

    function play() {
        if (!audioEl) return;
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        audioEl.volume = volume;
        var promise = audioEl.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function() {});
        }
    }

    function pause() {
        if (audioEl) audioEl.pause();
    }

    function setVolume(v) {
        volume = Math.max(0, Math.min(1, v));
        if (audioEl) audioEl.volume = volume;
        if (gainNode) gainNode.gain.value = volume;
    }

    function setMode(newMode) {
        mode = newMode;
        if (mode === 'off') {
            pause();
            energyMultiplier = 1;
            return;
        }
        if (mode === 'energy' || mode === 'bpm') {
            wireAnalyser();
        }
        if (audioEl) play();
    }

    // Called every animation frame from app.js onTick
    function analyzeFrame() {
        if (!analyser || !dataArray || mode === 'off' || mode === 'play') return;

        analyser.getByteFrequencyData(dataArray);

        // Bass energy: bins 0..15 ≈ 0..650Hz at 44100Hz with fftSize=1024
        var bassSum = 0;
        var bassBins = 16;
        for (var i = 0; i < bassBins; i++) bassSum += dataArray[i];
        var bassEnergy = bassSum / (bassBins * 255);

        // Exponential moving average for smooth modulation
        smoothedEnergy = 0.75 * smoothedEnergy + 0.25 * bassEnergy;

        // Map 0–1 energy to 0.6–1.6 speed multiplier (center at 1.0 for silence)
        energyMultiplier = 0.6 + smoothedEnergy * 2.0;
        energyMultiplier = Math.max(0.5, Math.min(2.0, energyMultiplier));

        // Update energy bar if visible
        var fill = document.getElementById('audio-energy-fill');
        if (fill) fill.style.width = Math.round(smoothedEnergy * 100) + '%';

        if (mode === 'bpm') detectBeat(bassEnergy);
    }

    function detectBeat(rawEnergy) {
        var now = performance.now();

        // Maintain rolling energy history (last 43 frames ≈ ~700ms at 60fps)
        energyHistory.push(rawEnergy);
        if (energyHistory.length > 43) energyHistory.shift();

        // Need enough history
        if (energyHistory.length < 10) return;

        // Calculate mean
        var mean = 0;
        for (var i = 0; i < energyHistory.length; i++) mean += energyHistory[i];
        mean /= energyHistory.length;

        // Beat threshold: mean + variance factor
        var threshold = mean * 1.4;
        var minInterval = 250; // max ~240 BPM

        if (rawEnergy > threshold && (now - lastPeakTime) > minInterval) {
            lastPeakTime = now;
            peakTimes.push(now);
            if (peakTimes.length > 16) peakTimes.shift();
            estimateBpm();
        }
    }

    function estimateBpm() {
        if (peakTimes.length < 3) return;
        var intervals = [];
        for (var i = 1; i < peakTimes.length; i++) {
            intervals.push(peakTimes[i] - peakTimes[i - 1]);
        }
        intervals.sort(function(a, b) { return a - b; });
        // Use median interval
        var median = intervals[Math.floor(intervals.length / 2)];
        if (median < 200 || median > 2000) return; // sanity: 30–300 BPM range
        var bpmEstimate = Math.round(60000 / median);

        // Smooth BPM estimate (don't jump around)
        if (detectedBpm === 0) {
            detectedBpm = bpmEstimate;
        } else {
            detectedBpm = Math.round(detectedBpm * 0.7 + bpmEstimate * 0.3);
        }

        var display = document.getElementById('audio-bpm-display');
        if (display) display.textContent = detectedBpm;

        if (typeof onBpmUpdate === 'function') onBpmUpdate(detectedBpm);
    }

    function syncLoopToBpm(beats) {
        var bpmToUse = manualBpm || detectedBpm;
        if (!bpmToUse) return;
        beats = beats || 4;
        var beatDuration = 60 / bpmToUse;
        var loopSec = beatDuration * beats;
        loopSec = Math.max(2, Math.min(30, Math.round(loopSec * 10) / 10));

        var slider = document.getElementById('loop-duration');
        var val = document.getElementById('loop-duration-val');
        if (slider) {
            slider.value = loopSec;
            slider.dispatchEvent(new Event('input'));
        }
        if (val) val.textContent = loopSec + 's';
    }

    function init() {
        var modeSelect = document.getElementById('audio-mode');
        var audioContent = document.getElementById('audio-content');
        var uploadBtn = document.getElementById('audio-upload-btn');
        var fileInput = document.getElementById('audio-file-input');
        var filenameEl = document.getElementById('audio-filename');
        var volumeSlider = document.getElementById('audio-volume');
        var volumeVal = document.getElementById('audio-volume-val');
        var energyInfo = document.getElementById('audio-energy-info');
        var bpmInfo = document.getElementById('audio-bpm-info');
        var bpmManual = document.getElementById('audio-bpm-manual');
        var syncLoopBtn = document.getElementById('audio-sync-loop');

        if (!modeSelect) return;

        modeSelect.addEventListener('change', function() {
            setMode(this.value);
            if (audioContent) audioContent.style.display = this.value === 'off' ? 'none' : '';
            if (energyInfo) energyInfo.style.display = (this.value === 'energy' || this.value === 'bpm') ? '' : 'none';
            if (bpmInfo) bpmInfo.style.display = this.value === 'bpm' ? '' : 'none';
        });

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', function() {
                // Require user gesture to init AudioContext
                ensureContext();
                fileInput.click();
            });
            fileInput.addEventListener('change', function() {
                var file = this.files[0];
                if (!file) return;
                load(file, function(info) {
                    if (filenameEl) {
                        var mins = Math.floor(info.duration / 60);
                        var secs = Math.floor(info.duration % 60);
                        filenameEl.textContent = info.name + ' (' + mins + ':' + (secs < 10 ? '0' : '') + secs + ')';
                    }
                    if (mode !== 'off') play();
                });
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', function() {
                setVolume(this.value / 100);
                if (volumeVal) volumeVal.textContent = this.value + '%';
            });
        }

        if (bpmManual) {
            bpmManual.addEventListener('input', function() {
                manualBpm = parseInt(this.value) || 0;
            });
        }

        if (syncLoopBtn) {
            syncLoopBtn.addEventListener('click', function() { syncLoopToBpm(4); });
        }
    }

    function isActive() {
        return mode !== 'off' && audioEl !== null;
    }

    function getEnergyMultiplier() {
        if (mode !== 'energy' && mode !== 'bpm') return 1;
        return energyMultiplier;
    }

    function getExportData() {
        if (!audioBase64 || mode === 'off') return null;
        return {
            base64: audioBase64,
            mime: audioMimeType,
            name: audioFileName,
            loop: true,
            volume: volume
        };
    }

    function getMode() { return mode; }
    function getDetectedBpm() { return detectedBpm; }

    // Independent read path for effects that want raw frequency-band data
    // (e.g. an audio visualizer), regardless of the current reactive mode.
    function getFrequencyData() {
        if (!analyser || !dataArray) return null;
        analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    function createExportStream() {
        if (!ensureContext() || !gainNode) return null;
        if (!audioEl || audioEl.readyState < 2) return null;
        try {
            var dest = audioCtx.createMediaStreamDestination();
            gainNode.connect(dest);
            // Restart audio so it syncs with recording start
            audioEl.currentTime = 0;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            var promise = audioEl.play();
            if (promise && typeof promise.catch === 'function') promise.catch(function() {});
            return dest.stream;
        } catch (e) {
            console.warn('EP.Audio createExportStream:', e);
            return null;
        }
    }

    function hasAudio() {
        return !!audioEl && audioEl.readyState >= 2 && mode !== 'off';
    }

    return {
        init: init,
        load: load,
        play: play,
        pause: pause,
        setMode: setMode,
        setVolume: setVolume,
        analyzeFrame: analyzeFrame,
        isActive: isActive,
        hasAudio: hasAudio,
        createExportStream: createExportStream,
        getEnergyMultiplier: getEnergyMultiplier,
        getExportData: getExportData,
        getMode: getMode,
        getDetectedBpm: getDetectedBpm,
        getFrequencyData: getFrequencyData
    };
})();
