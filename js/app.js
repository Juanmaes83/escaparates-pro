// Escaparates Pro — Main bootstrap
(function() {
    function boot() {
        try { EP.Core.init(); } catch(e) { console.error('Core.init failed:', e); }
        try { EP.Timeline.init(); } catch(e) { console.error('Timeline.init failed:', e); }
        try { if (EP.PlanGate) EP.PlanGate.bindUI(); } catch(e) { console.error('PlanGate.bindUI failed:', e); }
        try { EP.Media.init(); } catch(e) { console.error('Media.init failed:', e); }
        try { EP.UI.init(); } catch(e) { console.error('UI.init failed:', e); }
        try { EP.Overlay.init(); } catch(e) { console.error('Overlay.init failed:', e); }
        try { EP.Export.init(); } catch(e) { console.error('Export.init failed:', e); }

        EP.Media.onChange(function() {
            EP.UI.rebuildCurrent();
        });

        EP.Timeline.onTick(function(time, dt, loopDuration) {
            var effect = EP.UI.getCurrentEffect();
            if (effect) {
                EP.RenderPipeline.updateEffect(effect, time, dt, loopDuration);
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
