(function() {
    var effect = new EP.EffectBase('editorial-text', {
        name: 'Editorial Text',
        category: 'text',
        icon: '📰',
        description: 'Tipografía editorial cinémica — layout de revista, mastheads, marquesinas y composición editorial sobre imagen/video de fondo'
    }, [
        { key: 'outputSize',  type: 'range',  min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'headline',  type: 'text',   default: 'EDITORIAL', label: 'Titular principal' },
        { key: 'subline',   type: 'text',   default: 'ISSUE NO. 1', label: 'Subtítulo' },
        { key: 'bodyText',  type: 'text',   default: 'DESIGN MATTERS', label: 'Texto cuerpo' },
        { key: 'layout', type: 'select', options: [
            { v: 'masthead', l: 'Masthead vertical' },
            { v: 'split',    l: 'Split horizontal' },
            { v: 'diagonal', l: 'Diagonal rotado' },
            { v: 'overlap',  l: 'Superposición capas' },
            { v: 'marquee',  l: 'Marquesina horizontal' }
        ], default: 'masthead', label: 'Layout' },
        { key: 'colorScheme', type: 'select', options: [
            { v: 'bw',       l: 'Blanco y negro (clásico)' },
            { v: 'redblack', l: 'Rojo + negro' },
            { v: 'invert',   l: 'Invertido (blanco sobre negro)' },
            { v: 'duotone',  l: 'Duotono cálido' },
            { v: 'neon',     l: 'Neon editorial' }
        ], default: 'bw', label: 'Esquema color' },
        { key: 'animStyle', type: 'select', options: [
            { v: 'slide',   l: 'Deslizamiento' },
            { v: 'flicker', l: 'Flicker tipográfico' },
            { v: 'fade',    l: 'Fade in/out' },
            { v: 'none',    l: 'Estático' }
        ], default: 'slide', label: 'Animación' },
        { key: 'fontWeight', type: 'select', options: [
            { v: '900', l: 'Ultra Bold (900)' },
            { v: '700', l: 'Bold (700)' },
            { v: '400', l: 'Regular (400)' },
            { v: '100', l: 'Thin (100)' }
        ], default: '900', label: 'Peso tipográfico' },
        { key: 'bgOverlay', type: 'range', min: 0, max: 90, default: 70, step: 5, label: 'Opacidad overlay fondo', unit: '%' }
    ]);

    effect.build = function(mediaList) {
        var group = new THREE.Group();

        // Background plane with user media at z=-0.05
        this._hasBg = false;
        var m0 = mediaList && mediaList[0];
        if (m0) {
            var bgGeo  = new THREE.PlaneGeometry(8, 4.5);
            var bgMat  = EP.Media.createMaterial(m0);
            var bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -0.05;
            group.add(bgMesh);
            this._hasBg = true;
        }

        // Typography canvas overlay
        this._cvs = document.createElement('canvas');
        this._cvs.width = 1024; this._cvs.height = 576;
        this._ctx = this._cvs.getContext('2d');
        // Initial fill so placeholder disappears immediately
        this._ctx.fillStyle = '#f5f0e8';
        this._ctx.fillRect(0, 0, 1024, 576);

        this._tex = new THREE.CanvasTexture(this._cvs);
        var geo = new THREE.PlaneGeometry(8, 4.5);
        // transparent only when we have bg media (to allow bg to show through overlay tint)
        var mat = new THREE.MeshBasicMaterial({
            map: this._tex,
            transparent: !!m0,
            depthWrite: false
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.05;
        group.add(mesh);
        this._overlayMat = mat;

        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this._ctx) return;
        var W   = this._cvs.width, H = this._cvs.height;
        var ctx = this._ctx;
        var layout    = this.settings.layout;
        var scheme    = this.settings.colorScheme;
        var animStyle = this.settings.animStyle;
        var fw        = this.settings.fontWeight || '900';
        var bgOvOp    = this.settings.bgOverlay / 100;
        var headline  = (this.settings.headline || 'EDITORIAL').toUpperCase();
        var subline   = (this.settings.subline  || 'ISSUE NO. 1').toUpperCase();
        var bodyText  = (this.settings.bodyText || 'DESIGN MATTERS').toUpperCase();

        // Color scheme
        var bg, fg, accent;
        switch(scheme) {
            case 'redblack': bg = '#f5f0e8'; fg = '#0a0a0a'; accent = '#cc0000'; break;
            case 'invert':   bg = '#0a0a0a'; fg = '#f0f0f0'; accent = '#ffffff'; break;
            case 'duotone':  bg = '#f5e8d0'; fg = '#3a2010'; accent = '#b05020'; break;
            case 'neon':     bg = '#000000'; fg = '#00ff88'; accent = '#ff0088'; break;
            default:         bg = '#f5f0e8'; fg = '#0a0a0a'; accent = '#111111';
        }

        // Draw background
        ctx.clearRect(0, 0, W, H);
        if (this._hasBg) {
            // Ensure minimum 70% opacity so dark text stays readable against background media
            var effectiveOp = (scheme === 'invert' || scheme === 'neon')
                ? Math.max(0.55, bgOvOp)
                : Math.max(0.70, bgOvOp);
            var tintColor = (scheme === 'invert' || scheme === 'neon')
                ? 'rgba(0,0,0,' + effectiveOp + ')'
                : 'rgba(245,240,232,' + effectiveOp + ')';
            ctx.fillStyle = tintColor;
        } else {
            ctx.fillStyle = bg;
        }
        ctx.fillRect(0, 0, W, H);

        // Animation modifiers
        var alpha  = 1, slideX = 0, slideY = 0;
        switch(animStyle) {
            case 'fade':
                alpha = 0.55 + 0.45 * Math.abs(Math.sin(time * 0.5)); break;
            case 'slide':
                slideX = Math.sin(time * 0.4) * 28; break;
            case 'flicker':
                alpha = (Math.random() > 0.05) ? 1 : 0.2; break;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(slideX, slideY);

        switch(layout) {
            case 'masthead': _masthead(ctx, W, H, headline, subline, bodyText, fg, accent, fw); break;
            case 'split':    _split(ctx, W, H, headline, subline, bodyText, fg, accent, fw);    break;
            case 'diagonal': _diagonal(ctx, W, H, headline, subline, bodyText, fg, accent, fw); break;
            case 'overlap':  _overlap(ctx, W, H, headline, subline, bodyText, fg, accent, fw);  break;
            case 'marquee':  _marquee(ctx, W, H, headline, subline, bodyText, fg, accent, fw, time); break;
        }

        ctx.restore();
        this._tex.needsUpdate = true;
    };

    // ── Layout functions ────────────────────────────────────────────

    function _masthead(ctx, W, H, headline, subline, body, fg, accent, fw) {
        // Top rule
        ctx.fillStyle = accent;
        ctx.fillRect(40, 38, W - 80, 3);
        // Subline
        ctx.font = '400 20px Arial, sans-serif';
        ctx.fillStyle = fg; ctx.textAlign = 'left';
        ctx.fillText(subline, 40, 78);
        // Giant headline
        ctx.font = fw + ' 150px Arial, sans-serif';
        ctx.fillStyle = accent;
        ctx.fillText(headline.substring(0, 9), 28, 270);
        // Body text
        ctx.font = '400 18px Arial, sans-serif';
        ctx.fillStyle = fg;
        ctx.fillText(body, 40, 355);
        // Bottom rule + vol
        ctx.fillRect(40, H - 62, W - 80, 1);
        ctx.font = '400 13px Arial, sans-serif';
        ctx.fillText('VOL. 01  —  2026', 40, H - 36);
    }

    function _split(ctx, W, H, headline, subline, body, fg, accent, fw) {
        // Left colored panel
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, W / 2, H);
        // Vertical headline in left panel
        var leftTextColor = (accent === '#111111' || accent === '#0a0a0a') ? '#f5f0e8' : '#f5f0e8';
        ctx.fillStyle = leftTextColor;
        ctx.font = fw + ' 88px Arial, sans-serif';
        ctx.save();
        ctx.translate(W * 0.25, H / 2 + 25);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(headline.substring(0, 8), 0, 0);
        ctx.restore();
        // Right panel text
        ctx.textAlign = 'left';
        ctx.fillStyle = fg;
        ctx.font = '400 17px Arial, sans-serif';
        ctx.fillText(subline, W / 2 + 36, 115);
        ctx.font = fw + ' 58px Arial, sans-serif';
        ctx.fillText(body.substring(0, 14), W / 2 + 36, 250);
        ctx.font = '300 13px Arial, sans-serif';
        ctx.fillText('EDITORIAL  —  2026', W / 2 + 36, H - 55);
    }

    function _diagonal(ctx, W, H, headline, subline, body, fg, accent, fw) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(-0.10);
        ctx.textAlign = 'center';
        ctx.font = fw + ' 120px Arial, sans-serif';
        ctx.fillStyle = accent;
        ctx.fillText(headline.substring(0, 9), 0, 10);
        ctx.font = '400 24px Arial, sans-serif';
        ctx.fillStyle = fg;
        ctx.fillText(subline, 0, 68);
        ctx.fillText(body, 0, -72);
        ctx.restore();
    }

    function _overlap(ctx, W, H, headline, subline, body, fg, accent, fw) {
        // Ghost letter background
        ctx.font = fw + ' 360px Arial, sans-serif';
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.textAlign = 'center';
        ctx.fillText(headline[0] || 'E', W / 2, H * 0.80);
        // Subline mid
        ctx.font = '500 42px Arial, sans-serif';
        ctx.fillStyle = accent;
        ctx.fillText(subline, W / 2, H * 0.32);
        // Main headline
        ctx.font = fw + ' 96px Arial, sans-serif';
        ctx.fillStyle = fg;
        ctx.fillText(headline.substring(0, 9), W / 2, H * 0.58);
        // Body
        ctx.font = '300 19px Arial, sans-serif';
        ctx.fillStyle = fg;
        ctx.fillText(body, W / 2, H - 48);
    }

    function _marquee(ctx, W, H, headline, subline, body, fg, accent, fw, t) {
        var str = '  ' + headline + '  ·  ' + subline + '  ·  ' + body + '  ·  ';
        // Top band
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, W, 110);
        ctx.font = fw + ' 56px Arial, sans-serif';
        ctx.fillStyle = (accent === '#111111' || accent === '#0a0a0a') ? '#ffffff' : '#ffffff';
        ctx.textAlign = 'left';
        var mw = ctx.measureText(str).width || 1;
        var ox = -((t * 60) % mw);
        ctx.fillText(str + str, ox, 80);
        // Center
        ctx.textAlign = 'center';
        ctx.font = fw + ' 110px Arial, sans-serif';
        ctx.fillStyle = fg;
        ctx.fillText(headline.substring(0, 9), W / 2, H / 2 + 40);
        // Bottom band
        ctx.fillStyle = fg;
        ctx.font = '400 26px Arial, sans-serif';
        ctx.textAlign = 'left';
        var ox2 = -((t * 40) % mw);
        ctx.fillText(str + str, ox2, H - 35);
    }

    effect.dispose = function() {
        if (this._tex) { this._tex.dispose(); this._tex = null; }
        this._cvs = null; this._ctx = null;
    };

    EP.Registry.register(effect);
})();
