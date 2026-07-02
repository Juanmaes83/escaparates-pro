EP.PipelinePro = (function() {

    var state = {
        grade: 'neutral',
        vignette: 0,
        grain: 0,
        chroma: 0
    };

    // Color grade preset adjustments (applied on top of user's existing pipeline values)
    var GRADES = {
        neutral: { brightness: 0, contrast: 0, saturation: 0, hue: 0, sepia: 0 },
        warm:    { brightness: 5, contrast: 5, saturation: 15, hue: 18, sepia: 0.12 },
        cool:    { brightness: 0, contrast: 8, saturation: -10, hue: -20, sepia: 0 },
        cinema:  { brightness: -5, contrast: 25, saturation: -20, hue: 0, sepia: 0.05 },
        fade:    { brightness: 15, contrast: -20, saturation: -15, hue: 5, sepia: 0 },
        moody:   { brightness: -10, contrast: 30, saturation: 10, hue: -10, sepia: 0 }
    };

    var _vignetteEl = null;
    var _grainEl = null;
    var _chromaSvgId = 'ep-chroma-svg';
    var _grainAnimId = null;

    // ─── DOM overlay helpers ──────────────────────────────────────────────────

    function getContainer() {
        return document.getElementById('canvas-container');
    }

    function ensureVignette() {
        if (_vignetteEl) return _vignetteEl;
        var el = document.createElement('div');
        el.id = 'ep-vignette-overlay';
        el.style.cssText = [
            'position:absolute', 'inset:0', 'pointer-events:none',
            'z-index:10', 'border-radius:inherit', 'transition:opacity 0.2s'
        ].join(';');
        var c = getContainer();
        if (c) { c.style.position = 'relative'; c.appendChild(el); }
        _vignetteEl = el;
        return el;
    }

    function ensureGrain() {
        if (_grainEl) return _grainEl;
        var el = document.createElement('canvas');
        el.id = 'ep-grain-overlay';
        el.style.cssText = [
            'position:absolute', 'inset:0', 'width:100%', 'height:100%',
            'pointer-events:none', 'z-index:11', 'opacity:0',
            'mix-blend-mode:screen', 'border-radius:inherit'
        ].join(';');
        var c = getContainer();
        if (c) { c.appendChild(el); }
        _grainEl = el;
        return el;
    }

    function ensureChromaSvg() {
        if (document.getElementById(_chromaSvgId)) return;
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = _chromaSvgId;
        svg.setAttribute('style', 'display:none;position:absolute;width:0;height:0');
        svg.innerHTML = [
            '<defs>',
            '<filter id="ep-chroma-filter" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">',
            '<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>',
            '<feOffset in="red" dx="__DX__" dy="0" result="redShift"/>',
            '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green"/>',
            '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>',
            '<feOffset in="blue" dx="__NDX__" dy="0" result="blueShift"/>',
            '<feBlend in="redShift" in2="green" mode="screen" result="rb"/>',
            '<feBlend in="rb" in2="blueShift" mode="screen"/>',
            '</filter>',
            '</defs>'
        ].join('');
        document.body.appendChild(svg);
    }

    function updateChromaFilter(px) {
        var f = document.getElementById('ep-chroma-filter');
        if (!f) return;
        var offsets = f.querySelectorAll('feOffset');
        if (offsets[0]) offsets[0].setAttribute('dx', px);
        if (offsets[1]) offsets[1].setAttribute('dx', -px);
    }

    // ─── Grain animation ──────────────────────────────────────────────────────

    function animateGrain() {
        var el = _grainEl;
        if (!el || state.grain <= 0) { _grainAnimId = null; return; }

        var W = el.offsetWidth || 320;
        var H = el.offsetHeight || 180;
        // Use small grain canvas for performance then stretch
        var gW = Math.min(W, 256); var gH = Math.min(H, 144);
        el.width = gW; el.height = gH;

        var ctx = el.getContext('2d');
        var imgData = ctx.createImageData(gW, gH);
        var data = imgData.data;
        var intensity = state.grain / 100;
        for (var i = 0; i < data.length; i += 4) {
            var v = Math.floor(Math.random() * 255 * intensity);
            data[i] = v; data[i+1] = v; data[i+2] = v;
            data[i+3] = Math.floor(180 * intensity);
        }
        ctx.putImageData(imgData, 0, 0);

        _grainAnimId = requestAnimationFrame(animateGrain);
    }

    function startGrain() {
        if (_grainAnimId) return;
        animateGrain();
    }

    function stopGrain() {
        if (_grainAnimId) { cancelAnimationFrame(_grainAnimId); _grainAnimId = null; }
        var el = _grainEl;
        if (el) { var ctx = el.getContext('2d'); if (ctx) ctx.clearRect(0,0,el.width,el.height); }
    }

    // ─── Apply functions ──────────────────────────────────────────────────────

    function applyGrade(gradeKey) {
        state.grade = gradeKey;
        var g = GRADES[gradeKey] || GRADES.neutral;
        // Nudge the existing VisualPipeline state — read current sliders, apply delta
        var vpState = EP.VisualPipeline && EP.VisualPipeline.state;

        // Mark grade deltas separately so reset can undo them
        var bEl = document.getElementById('vp-brightness');
        var cEl = document.getElementById('vp-contrast');
        var sEl = document.getElementById('vp-saturation');
        var hEl = document.getElementById('vp-hue');

        if (!bEl) return;

        // Store base values on first grade application
        if (!EP.PipelinePro._baseVP) {
            EP.PipelinePro._baseVP = {
                brightness: parseFloat(bEl.value),
                contrast: parseFloat(cEl ? cEl.value : 100),
                saturation: parseFloat(sEl ? sEl.value : 100),
                hue: parseFloat(hEl ? hEl.value : 0)
            };
        }

        var base = EP.PipelinePro._baseVP;

        function setSlider(id, valId, value, unit) {
            var el = document.getElementById(id);
            var valEl = document.getElementById(valId);
            if (!el) return;
            el.value = value;
            if (valEl) valEl.textContent = Math.round(value) + (unit || '');
            el.dispatchEvent(new Event('input'));
        }

        setSlider('vp-brightness', 'vp-brightness-val', Math.min(200, Math.max(0, base.brightness + g.brightness)), '%');
        setSlider('vp-contrast',   'vp-contrast-val',   Math.min(200, Math.max(0, base.contrast + g.contrast)),   '%');
        setSlider('vp-saturation', 'vp-saturation-val', Math.min(200, Math.max(0, base.saturation + g.saturation)), '%');
        setSlider('vp-hue',        'vp-hue-val',        Math.min(180, Math.max(-180, base.hue + g.hue)), '°');

        // Sepia toggle
        var sepiaBtn = document.getElementById('vp-sepia');
        if (sepiaBtn) {
            var wantSepia = g.sepia > 0;
            var hasSepia = sepiaBtn.classList.contains('vp-active');
            if (wantSepia !== hasSepia) sepiaBtn.click();
        }

        // Highlight active grade button
        document.querySelectorAll('.vp-grade-btn').forEach(function(btn) {
            btn.classList.toggle('vp-grade-active', btn.dataset.grade === gradeKey);
        });
    }

    function applyVignette(pct) {
        state.vignette = pct;
        var el = ensureVignette();
        if (pct <= 0) {
            el.style.background = 'none';
            return;
        }
        var alpha = pct / 100;
        var spread = 30 + pct * 0.4;
        el.style.background = 'radial-gradient(ellipse at center, transparent ' + (100 - spread) + '%, rgba(0,0,0,' + (alpha * 0.85).toFixed(2) + ') 100%)';
    }

    function applyGrain(pct) {
        state.grain = pct;
        var el = ensureGrain();
        if (pct <= 0) {
            el.style.opacity = '0';
            stopGrain();
            return;
        }
        el.style.opacity = (pct / 100 * 0.6).toFixed(2);
        startGrain();
    }

    function applyChroma(px) {
        state.chroma = px;
        ensureChromaSvg();
        var canvas = document.querySelector('#canvas-container canvas');
        if (!canvas) return;
        if (px <= 0) {
            canvas.style.filter = (canvas.style.filter || '').replace(/url\(#ep-chroma-filter\)\s*/g, '').trim();
            return;
        }
        updateChromaFilter(px);
        if (!(canvas.style.filter || '').includes('ep-chroma-filter')) {
            canvas.style.filter = (canvas.style.filter || '') + ' url(#ep-chroma-filter)';
        }
    }

    // ─── Bind controls ────────────────────────────────────────────────────────

    function bindControls() {
        // Color grade buttons
        document.querySelectorAll('.vp-grade-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                EP.PipelinePro._baseVP = null; // reset base on manual grade change
                applyGrade(this.dataset.grade);
            });
        });

        // Vignette
        var vigEl = document.getElementById('vp-vignette');
        var vigVal = document.getElementById('vp-vignette-val');
        if (vigEl) {
            vigEl.addEventListener('input', function() {
                applyVignette(parseFloat(this.value));
                if (vigVal) vigVal.textContent = this.value + '%';
            });
        }

        // Grain
        var grainEl = document.getElementById('vp-grain');
        var grainVal = document.getElementById('vp-grain-val');
        if (grainEl) {
            grainEl.addEventListener('input', function() {
                applyGrain(parseFloat(this.value));
                if (grainVal) grainVal.textContent = this.value + '%';
            });
        }

        // Chroma
        var chromaEl = document.getElementById('vp-chroma');
        var chromaVal = document.getElementById('vp-chroma-val');
        if (chromaEl) {
            chromaEl.addEventListener('input', function() {
                applyChroma(parseFloat(this.value));
                if (chromaVal) chromaVal.textContent = this.value + 'px';
            });
        }

        // Hook into existing VP Reset to also reset PRO filters
        var vpResetBtn = document.getElementById('vp-reset');
        if (vpResetBtn) {
            var origReset = vpResetBtn.onclick;
            vpResetBtn.addEventListener('click', function() {
                EP.PipelinePro._baseVP = null;
                state.grade = 'neutral';
                state.vignette = 0; state.grain = 0; state.chroma = 0;

                if (vigEl) { vigEl.value = 0; if (vigVal) vigVal.textContent = '0%'; }
                if (grainEl) { grainEl.value = 0; if (grainVal) grainVal.textContent = '0%'; }
                if (chromaEl) { chromaEl.value = 0; if (chromaVal) chromaVal.textContent = '0px'; }

                applyVignette(0); applyGrain(0); applyChroma(0);
                document.querySelectorAll('.vp-grade-btn').forEach(function(b) {
                    b.classList.toggle('vp-grade-active', b.dataset.grade === 'neutral');
                });
            });
        }
    }

    function injectStyles() {
        var style = document.createElement('style');
        style.textContent = [
            '.vp-pro-section { margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08); }',
            '.vp-pro-label { font-size:9px; font-weight:700; letter-spacing:1px; color:rgba(255,255,255,0.35); text-transform:uppercase; margin:8px 0 4px; padding:0 12px; }',
            '.vp-grade-row { display:flex; gap:4px; padding:4px 12px 8px; flex-wrap:wrap; }',
            '.vp-grade-btn { flex:1; min-width:48px; padding:4px 2px; border:1px solid rgba(255,255,255,0.15); background:transparent; color:rgba(255,255,255,0.55); font-size:10px; border-radius:4px; cursor:pointer; transition:all 0.15s; white-space:nowrap; }',
            '.vp-grade-btn:hover { border-color:rgba(255,255,255,0.4); color:#fff; }',
            '.vp-grade-active { background:rgba(79,140,255,0.25) !important; border-color:#4f8cff !important; color:#fff !important; }'
        ].join('\n');
        document.head.appendChild(style);
    }

    function init() {
        injectStyles();
        bindControls();
        // Set neutral as active by default
        var neutralBtn = document.querySelector('.vp-grade-btn[data-grade="neutral"]');
        if (neutralBtn) neutralBtn.classList.add('vp-grade-active');
    }

    return {
        init: init,
        applyGrade: applyGrade,
        applyVignette: applyVignette,
        applyGrain: applyGrain,
        applyChroma: applyChroma,
        get state() { return state; },
        _baseVP: null
    };
})();
