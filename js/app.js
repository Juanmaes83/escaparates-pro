// Escaparates Pro — Main bootstrap
(function() {
    function boot() {
        try { EP.Core.init(); } catch(e) { console.error('Core.init failed:', e); }
        try { EP.Timeline.init(); } catch(e) { console.error('Timeline.init failed:', e); }
        try { if (EP.PlanGate) EP.PlanGate.bindUI(); } catch(e) { console.error('PlanGate.bindUI failed:', e); }
        try { EP.Media.init(); } catch(e) { console.error('Media.init failed:', e); }
        try { EP.UI.init(); } catch(e) { console.error('UI.init failed:', e); }
        try { EP.Overlay.init(); } catch(e) { console.error('Overlay.init failed:', e); }
        try { if (EP.Audio) EP.Audio.init(); } catch(e) { console.error('Audio.init failed:', e); }
        try { EP.Export.init(); } catch(e) { console.error('Export.init failed:', e); }
        try { if (EP.DemoAssets) EP.DemoAssets.init(); } catch(e) { console.error('DemoAssets.init failed:', e); }

        EP.Media.onChange(function() {
            EP.UI.rebuildCurrent();
        });

        EP.Timeline.onTick(function(time, dt, loopDuration) {
            var effect = EP.UI.getCurrentEffect();
            if (effect) {
                if (EP.Audio && EP.Audio.isActive()) EP.Audio.analyzeFrame();
                var audioMult = EP.Audio ? EP.Audio.getEnergyMultiplier() : 1;
                EP.RenderPipeline.updateEffect(effect, time, dt * audioMult, loopDuration);
            }
        });

        setTimeout(function() {
            EP.UI.selectEffect('showcase-stream');
            EP.Timeline.play();
        }, 500);

        document.addEventListener('keydown', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.code === 'Space') { e.preventDefault(); EP.Timeline.toggle(); }
        });

        // Safe Zone toggle
        var btnSZ = document.getElementById('btn-safe-zone');
        var szOverlay = document.getElementById('safe-zone-overlay');
        if (btnSZ && szOverlay) {
            btnSZ.addEventListener('click', function() {
                var active = szOverlay.style.display !== 'none';
                szOverlay.style.display = active ? 'none' : 'block';
                btnSZ.classList.toggle('active', !active);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
