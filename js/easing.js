EP.Easing = {
    linear: function(t) { return t; },
    smooth: function(t) { return t * t * (3 - 2 * t); },
    snappy: function(t) { return 1 - Math.pow(1 - t, 4); },
    overshoot: function(t) { var s = 1.70158; return (t = t - 1) * t * ((s + 1) * t + s) + 1; },
    bounce: function(t) {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
        if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
        t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
    },
    elastic: function(t) {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
    },
    get: function(name) {
        return this[name] || this.smooth;
    }
};
