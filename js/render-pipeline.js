EP.RenderPipeline = (function() {
    function resolveFrame(effect, time, dt, loopDuration) {
        loopDuration = Math.max(0.1, loopDuration || 12);
        time = normalizeTime(time, loopDuration);
        dt = isFinite(dt) ? dt : 0;

        var easingName = effect && effect.settings ? effect.settings.easing || 'linear' : 'linear';
        var easeFn = EP.Easing && EP.Easing.get ? EP.Easing.get(easingName) : function(t) { return t; };
        var frameTime = easeFn((time / loopDuration) % 1) * loopDuration;
        var frameDt = dt;

        if (effect && effect.settings && effect.settings.playbackMotion !== undefined && effect.settings.playbackMotionSpeed !== undefined && !effect._handlesMotionControls) {
            if (effect.settings.playbackMotion === 'off') {
                frameTime = loopDuration * 0.5;
                frameDt = 0;
            } else {
                var motionSpeed = Math.max(0, effect.settings.playbackMotionSpeed / 100);
                frameTime = normalizeTime(frameTime * motionSpeed, loopDuration);
                frameDt *= motionSpeed;
                if (isReverseDirection(effect.settings.motionDirection)) {
                    frameTime = normalizeTime(loopDuration - frameTime, loopDuration);
                    frameDt *= -1;
                }
            }
        }

        return { time: frameTime, dt: frameDt, loopDuration: loopDuration };
    }

    function updateEffect(effect, time, dt, loopDuration) {
        if (!effect || effect._runtimeFailed) return false;
        var frame = resolveFrame(effect, time, dt, loopDuration);
        try {
            effect.update(frame.time, frame.dt, frame.loopDuration);
            return true;
        } catch (err) {
            effect.lastError = err;
            effect._runtimeFailed = true;
            console.error('Effect update failed:', effect.id, err);
            if (typeof effect.exit === 'function') effect.exit();
            var fallback = effect.rebuild([]);
            if (EP.Core && EP.Core.resetGlobalState) EP.Core.resetGlobalState({ background: false });
            if (EP.Core && EP.Core.setDisplayGroup) EP.Core.setDisplayGroup(fallback);
            return false;
        }
    }

    function renderFrame(effect, time, dt, loopDuration) {
        updateEffect(effect, time, dt, loopDuration);
        if (EP.Core && EP.Core.render) EP.Core.render();
    }

    function normalizeTime(time, loopDuration) {
        if (!isFinite(time)) return 0;
        return ((time % loopDuration) + loopDuration) % loopDuration;
    }

    function isReverseDirection(direction) {
        return direction === 'right-left' || direction === 'bottom-top' || direction === 'radial-in';
    }

    return {
        resolveFrame: resolveFrame,
        updateEffect: updateEffect,
        renderFrame: renderFrame,
        normalizeTime: normalizeTime,
        isReverseDirection: isReverseDirection
    };
})();
