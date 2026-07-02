var EP = window.EP || {};
window.EP = EP;

EP.DeviceProfile = (function() {
    var cachedWebGL = null;

    function detect() {
        var nav = typeof navigator !== 'undefined' ? navigator : {};
        var width = typeof window !== 'undefined' ? window.innerWidth : 1920;
        var height = typeof window !== 'undefined' ? window.innerHeight : 1080;
        var pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        var touch = !!(nav.maxTouchPoints && nav.maxTouchPoints > 0);
        var memory = nav.deviceMemory || null;
        var cores = nav.hardwareConcurrency || null;
        var mobile = width <= 768 || touch && Math.min(width, height) <= 900;
        var tablet = !mobile && touch && Math.min(width, height) <= 1100;
        var lowMemory = memory !== null && memory <= 4;
        var lowCores = cores !== null && cores <= 4;
        var lowPower = mobile && (lowMemory || lowCores || pixelRatio > 2.5);

        return {
            width: width,
            height: height,
            pixelRatio: pixelRatio,
            touch: touch,
            memoryGB: memory,
            cores: cores,
            type: mobile ? 'mobile' : tablet ? 'tablet' : 'desktop',
            lowPower: !!lowPower,
            pixelRatioCap: lowPower ? 1.25 : mobile ? 1.5 : 2,
            previewTextureMax: lowPower ? 1024 : mobile ? 1536 : 2048,
            previewParticlesCap: lowPower ? 150 : mobile ? 250 : 600
        };
    }

    function hasWebGL() {
        if (cachedWebGL !== null) return cachedWebGL;
        try {
            var canvas = document.createElement('canvas');
            var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            cachedWebGL = !!gl;
            if (gl && gl.getExtension) {
                var lose = gl.getExtension('WEBGL_lose_context');
                if (lose) lose.loseContext();
            }
            canvas.width = 1;
            canvas.height = 1;
            return cachedWebGL;
        } catch (e) {
            cachedWebGL = false;
            return cachedWebGL;
        }
    }

    function get() {
        var profile = detect();
        profile.webgl = hasWebGL();
        return profile;
    }

    function isMobileLike() {
        var type = detect().type;
        return type === 'mobile' || type === 'tablet';
    }

    function applyEffectLOD(effect) {
        if (!effect || !effect.settings) return;
        var profile = detect();
        if (profile.type === 'desktop') return;

        Object.keys(effect.settings).forEach(function(key) {
            var value = effect.settings[key];
            if (typeof value !== 'number') return;
            if (/particles|density|segments|count/i.test(key)) {
                effect.settings[key] = Math.min(value, profile.previewParticlesCap);
            }
        });

        if (effect.capabilities && effect.capabilities.mobileRisk === 'high' && effect.settings.outputSize !== undefined) {
            effect.settings.outputSize = Math.min(effect.settings.outputSize, profile.lowPower ? 300 : 400);
        }
    }

    return {
        get: get,
        detect: detect,
        isMobileLike: isMobileLike,
        applyEffectLOD: applyEffectLOD
    };
})();
