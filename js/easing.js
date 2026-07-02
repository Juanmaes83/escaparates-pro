EP.Easing = {
    linear:    function(t) { return t; },
    smooth:    function(t) { return t * t * (3 - 2 * t); },
    snappy:    function(t) { return 1 - Math.pow(1 - t, 4); },
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
    // New presets
    robotic: function(t) {
        // Stepped mechanical movement — 4 discrete steps
        return Math.floor(t * 4) / 4 + (t >= 1 ? 0.25 : 0);
    },
    organic: function(t) {
        // Sine-based natural curve with micro-overshoot
        var base = Math.sin(t * Math.PI / 2);
        var wobble = Math.sin(t * Math.PI * 3) * 0.06 * (1 - t);
        return Math.min(1, base + wobble);
    },
    aggressive: function(t) {
        // Stays very low then snaps hard to finish
        return Math.pow(t, 4);
    },
    get: function(name) {
        return this[name] || this.smooth;
    },
    // Spanish label map
    LABELS: {
        smooth: 'Suave', elastic: 'Elástico', bounce: 'Rebote',
        aggressive: 'Agresivo', robotic: 'Robótico', organic: 'Orgánico',
        snappy: 'Snappy', overshoot: 'Overshoot', linear: 'Linear'
    },
    // Generate SVG polyline path from easing fn (w x h box, y-flipped)
    toPath: function(name, w, h) {
        var fn = this.get(name);
        var steps = 24;
        var pts = [];
        for (var i = 0; i <= steps; i++) {
            var t = i / steps;
            var y = Math.max(-0.4, Math.min(1.4, fn(t)));
            pts.push((t * w).toFixed(1) + ',' + ((1 - y) * h).toFixed(1));
        }
        return 'M ' + pts.join(' L ');
    }
};
