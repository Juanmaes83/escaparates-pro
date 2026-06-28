EP.Timeline = (function() {
    var playing = false;
    var currentTime = 0;
    var loopDuration = 12;
    var speed = 1;
    var lastFrameTime = 0;
    var animFrameId = null;
    var onTickCallback = null;

    var btnPlay, iconPlay, iconPause, timeCurrent, timeTotal;
    var track, progress, scrubber;
    var scrubbing = false;

    function init() {
        btnPlay = document.getElementById('btn-play');
        iconPlay = document.getElementById('icon-play');
        iconPause = document.getElementById('icon-pause');
        timeCurrent = document.getElementById('time-current');
        timeTotal = document.getElementById('time-total');
        track = document.getElementById('timeline-track');
        progress = document.getElementById('timeline-progress');
        scrubber = document.getElementById('timeline-scrubber');

        btnPlay.addEventListener('click', toggle);

        track.addEventListener('mousedown', startScrub);
        document.addEventListener('mousemove', moveScrub);
        document.addEventListener('mouseup', endScrub);

        var durationSlider = document.getElementById('loop-duration');
        var durationVal = document.getElementById('loop-duration-val');
        if (durationSlider) {
            durationSlider.addEventListener('input', function() {
                loopDuration = parseFloat(this.value);
                durationVal.textContent = loopDuration + 's';
                timeTotal.textContent = loopDuration.toFixed(1) + 's';
            });
        }
        timeTotal.textContent = loopDuration.toFixed(1) + 's';

        var speedSlider = document.getElementById('speed-multiplier');
        var speedVal = document.getElementById('speed-val');
        if (speedSlider) {
            speedSlider.addEventListener('input', function() {
                speed = parseFloat(this.value);
                speedVal.textContent = speed.toFixed(1) + 'x';
            });
        }
    }

    function toggle() {
        playing ? pause() : play();
    }

    function play() {
        if (playing) return;
        playing = true;
        lastFrameTime = performance.now();
        iconPlay.style.display = 'none';
        iconPause.style.display = '';
        tick();
    }

    function pause() {
        playing = false;
        iconPlay.style.display = '';
        iconPause.style.display = 'none';
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    function tick() {
        if (!playing) return;
        animFrameId = requestAnimationFrame(tick);
        var now = performance.now();
        var dt = (now - lastFrameTime) / 1000;
        lastFrameTime = now;

        if (!scrubbing) {
            currentTime += dt * speed;
            if (currentTime >= loopDuration) currentTime -= loopDuration;
            if (currentTime < 0) currentTime += loopDuration;
        }

        updateUI();
        if (onTickCallback) onTickCallback(currentTime, dt * speed, loopDuration);
        EP.Core.render();
    }

    function updateUI() {
        var pct = (currentTime / loopDuration) * 100;
        progress.style.width = pct + '%';
        scrubber.style.left = pct + '%';
        timeCurrent.textContent = currentTime.toFixed(1) + 's';
    }

    function startScrub(e) {
        scrubbing = true;
        setScrubPosition(e);
    }
    function moveScrub(e) {
        if (!scrubbing) return;
        setScrubPosition(e);
    }
    function endScrub() {
        scrubbing = false;
    }
    function setScrubPosition(e) {
        var rect = track.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        currentTime = pct * loopDuration;
        updateUI();
        if (onTickCallback) onTickCallback(currentTime, 0, loopDuration);
        EP.Core.render();
    }

    function onTick(fn) {
        onTickCallback = fn;
    }

    function setTime(t) {
        currentTime = t;
        updateUI();
    }

    return {
        init: init,
        play: play,
        pause: pause,
        toggle: toggle,
        onTick: onTick,
        setTime: setTime,
        get playing() { return playing; },
        get currentTime() { return currentTime; },
        get loopDuration() { return loopDuration; },
        get speed() { return speed; }
    };
})();
