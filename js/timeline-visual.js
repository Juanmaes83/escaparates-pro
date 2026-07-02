EP.TimelineVisual = (function() {
    var visual, blocksEl, rulerEl, playheadEl;
    var rafId = null;
    var scrubbing = false;
    var draggingHandle = null; // index 0 = boundary between Intro/Main, 1 = Main/Outro

    var ZONES = [
        { label: 'Intro', from: 0,   to: 0.2,  color: 'rgba(139,92,246,0.45)',  text: '#c4b5fd' },
        { label: 'Main',  from: 0.2, to: 0.8,  color: 'rgba(79,140,255,0.3)',   text: '#93c5fd' },
        { label: 'Outro', from: 0.8, to: 1.0,  color: 'rgba(245,158,11,0.45)', text: '#fcd34d' }
    ];

    function init() {
        visual     = document.getElementById('tl-visual');
        blocksEl   = document.getElementById('tl-blocks');
        rulerEl    = document.getElementById('tl-ruler');
        playheadEl = document.getElementById('tl-playhead');

        if (!visual) return;

        renderBlocks();
        renderRuler();
        startLoop();

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        var durationSlider = document.getElementById('loop-duration');
        if (durationSlider) {
            durationSlider.addEventListener('input', renderRuler);
        }
    }

    function onMouseMove(e) {
        if (draggingHandle !== null) {
            moveHandle(e);
        } else if (scrubbing) {
            scrubTo(e);
        }
    }

    function onMouseUp() {
        draggingHandle = null;
        scrubbing = false;
        visual.style.cursor = '';
    }

    function renderBlocks() {
        blocksEl.innerHTML = '';
        var duration = EP.Timeline ? EP.Timeline.loopDuration : 12;

        ZONES.forEach(function(z, zi) {
            var div = document.createElement('div');
            div.className = 'tl-block';
            div.style.left  = (z.from * 100) + '%';
            div.style.width = ((z.to - z.from) * 100) + '%';
            div.style.background = z.color;

            var timeFrom = (z.from * duration).toFixed(1);
            var timeTo   = (z.to   * duration).toFixed(1);
            var label = document.createElement('span');
            label.className = 'tl-block-label';
            label.style.color = z.text;
            label.textContent = z.label + ' ' + timeFrom + '–' + timeTo + 's';
            div.appendChild(label);

            // Drag handle on the RIGHT edge (except last block)
            if (zi < ZONES.length - 1) {
                var handle = document.createElement('div');
                handle.className = 'tl-handle';
                handle.dataset.handleIdx = zi;
                handle.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                    draggingHandle = parseInt(this.dataset.handleIdx);
                    visual.style.cursor = 'col-resize';
                });
                div.appendChild(handle);
            }

            // Click on block = scrub (only if not on handle)
            div.addEventListener('mousedown', function(e) {
                if (e.target.classList.contains('tl-handle')) return;
                scrubbing = true;
                scrubTo(e);
            });

            blocksEl.appendChild(div);
        });
    }

    function moveHandle(e) {
        var rect = visual.getBoundingClientRect();
        var pct = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
        var idx = draggingHandle;

        // Clamp: handle[0] between 0.05 and handle[1]-0.05, handle[1] between handle[0]+0.05 and 0.95
        if (idx === 0) {
            pct = Math.max(0.05, Math.min(ZONES[1].to - 0.05, pct));
            ZONES[0].to   = pct;
            ZONES[1].from = pct;
        } else if (idx === 1) {
            pct = Math.max(ZONES[1].from + 0.05, Math.min(0.95, pct));
            ZONES[1].to   = pct;
            ZONES[2].from = pct;
        }
        renderBlocks();
    }

    function renderRuler() {
        rulerEl.innerHTML = '';
        var duration = EP.Timeline ? EP.Timeline.loopDuration : 12;
        var step = duration > 20 ? 2 : 1;
        for (var t = 0; t <= duration; t += step) {
            var pct = (t / duration) * 100;
            var tick = document.createElement('div');
            tick.className = 'tl-tick';
            tick.style.left = pct + '%';
            rulerEl.appendChild(tick);

            if (t > 0 && t < duration) {
                var lbl = document.createElement('span');
                lbl.className = 'tl-tick-label';
                lbl.style.left = pct + '%';
                lbl.textContent = t + 's';
                rulerEl.appendChild(lbl);
            }
        }
        renderBlocks();
    }

    function startLoop() {
        function frame() {
            if (EP.Timeline && playheadEl) {
                var pct = (EP.Timeline.currentTime / EP.Timeline.loopDuration) * 100;
                playheadEl.style.left = pct + '%';
            }
            rafId = requestAnimationFrame(frame);
        }
        rafId = requestAnimationFrame(frame);
    }

    function scrubTo(e) {
        var rect = visual.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (EP.Timeline) {
            EP.Timeline.setTime(pct * EP.Timeline.loopDuration);
            EP.Core.render();
        }
    }

    function getZones() { return ZONES; }

    return { init: init, getZones: getZones };
})();
