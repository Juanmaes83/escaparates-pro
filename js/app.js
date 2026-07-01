// Escaparates Pro — Main bootstrap
(function() {
    function boot() {
        try { EP.Core.init(); } catch(e) { console.error('Core.init failed:', e); }
        try { EP.Timeline.init(); } catch(e) { console.error('Timeline.init failed:', e); }
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
                var easingName = effect.settings.easing || 'linear';
                var easeFn = EP.Easing.get(easingName);
                var t = time / loopDuration;
                var easedTime = easeFn(t % 1) * loopDuration;
                if (effect.settings.playbackMotion !== undefined && effect.settings.playbackMotionSpeed !== undefined && !effect._handlesMotionControls) {
                    if (effect.settings.playbackMotion === 'off') {
                        easedTime = loopDuration * 0.5;
                        dt = 0;
                    } else {
                        var motionSpeed = Math.max(0, effect.settings.playbackMotionSpeed / 100);
                        easedTime = (easedTime * motionSpeed) % loopDuration;
                        dt *= motionSpeed;
                    }
                }
                effect.update(easedTime, dt, loopDuration);
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
