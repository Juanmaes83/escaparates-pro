(function() {
    var effect = new EP.EffectBase('magazine-grid', {
        name: 'Magazine Grid',
        category: 'grid',
        icon: '📰',
        description: 'Editorial magazine layout — 1 large hero card left + 3 smaller cards stacked right, cycling through media groups with a slide transition'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 100, step: 10, label: 'Output Size', unit: '%' },
        { key: 'playbackMotion', type: 'select', options: [{ v: 'on', l: 'Motion On' }, { v: 'off', l: 'Motion Off' }], default: 'on', label: 'Playback Motion' },
        { key: 'playbackMotionSpeed', type: 'range', min: 0, max: 220, default: 100, step: 1, label: 'Playback Speed', unit: '%' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 3, step: 0.5, label: 'Gap', unit: '%' },
        { key: 'cornerRadius', type: 'range', min: 0, max: 20, default: 6, step: 0.5, label: 'Corner Radius', unit: '%' },
        { key: 'transitionSpeed', type: 'range', min: 10, max: 100, default: 50, step: 1, label: 'Transition Speed', unit: '%' },
        { key: 'easing', type: 'easing', options: ['smooth', 'linear'], default: 'smooth', label: 'Easing' },
        { key: 'background', type: 'color', default: '#0a0a0a', label: 'Background' }
    ]);

    effect.build = function(mediaList) {
        if (!mediaList || mediaList.length === 0) return new THREE.Group();
        var group = new THREE.Group();

        var gap = this.settings.gap / 100 * 2;
        var cr = this.settings.cornerRadius / 100 * 0.3;

        // Total layout dimensions (in world units)
        var totalW = 5.0;
        var totalH = 3.5;
        var heroW = totalW * 0.58 - gap * 0.5;
        var heroH = totalH;
        var smallW = totalW * 0.42 - gap * 0.5;
        var smallH = (totalH - gap * 2) / 3;

        // How many pages (groups of 4)
        var pageCount = Math.ceil(mediaList.length / 4);
        if (pageCount < 2) pageCount = 2; // always at least 2 for looping

        var pages = [];
        for (var p = 0; p < pageCount; p++) {
            var pageGroup = new THREE.Group();
            pageGroup.userData = { pageIndex: p };

            // Hero card (left side)
            var heroMedia = mediaList[(p * 4) % mediaList.length];
            var heroGeo = cr > 0 ? EP.RoundedPlaneGeometry(heroW, heroH, cr) : new THREE.PlaneGeometry(heroW, heroH);
            var heroMat = EP.Media.createMaterial(heroMedia);
            var heroMesh = new THREE.Mesh(heroGeo, heroMat);
            heroMesh.position.x = -(totalW * 0.5 - heroW * 0.5);
            heroMesh.position.y = 0;
            pageGroup.add(heroMesh);

            // 3 small cards (right side, stacked)
            var rightX = totalW * 0.5 - smallW * 0.5;
            for (var s = 0; s < 3; s++) {
                var sMedia = mediaList[(p * 4 + 1 + s) % mediaList.length];
                var sGeo = cr > 0 ? EP.RoundedPlaneGeometry(smallW, smallH, cr) : new THREE.PlaneGeometry(smallW, smallH);
                var sMat = EP.Media.createMaterial(sMedia);
                var sMesh = new THREE.Mesh(sGeo, sMat);
                sMesh.position.x = rightX;
                sMesh.position.y = (1 - s) * (smallH + gap);
                pageGroup.add(sMesh);
            }

            // Start off-screen to the right (except page 0)
            pageGroup.position.x = p === 0 ? 0 : totalW * 1.1;
            group.add(pageGroup);
            pages.push(pageGroup);
        }

        this._pages = pages;
        this._pageCount = pageCount;
        this._totalW = totalW * 1.1;
        this.group = group;
        return group;
    };

    effect.update = function(time, dt, loopDuration) {
        if (!this.group || !this._pages) return;
        var pages = this._pages;
        var pageCount = this._pageCount;
        var totalW = this._totalW;
        var transSpeed = this.settings.transitionSpeed / 100;

        // Each page occupies one full loopDuration segment
        // t goes 0→1 per full loop; pages advance by 1 per loop
        var t = time / loopDuration;

        // Current page index (fractional)
        var pageFrac = t * (pageCount / 1); // advance all pages over loop
        // Actually: cycle page every (loopDuration / pageCount) seconds
        var segDur = loopDuration / pageCount;
        var pageFloat = (time / segDur);
        var curPage = Math.floor(pageFloat) % pageCount;
        var pageT = pageFloat - Math.floor(pageFloat); // 0→1 within this segment

        // Transition happens over the last portion of the segment
        var transStart = 1 - transSpeed * 0.4;
        var transT = 0;
        if (pageT > transStart) {
            transT = (pageT - transStart) / (1 - transStart);
            // smoothstep
            transT = transT * transT * (3 - 2 * transT);
        }

        for (var p = 0; p < pageCount; p++) {
            var page = pages[p];
            var relIndex = ((p - curPage) % pageCount + pageCount) % pageCount;

            var targetX;
            if (relIndex === 0) {
                // Current page: slides out to the left during transition
                targetX = -transT * totalW;
            } else if (relIndex === 1) {
                // Next page: slides in from right
                targetX = totalW - transT * totalW;
            } else {
                // Other pages: hidden far right
                targetX = totalW * (relIndex);
            }
            page.position.x = targetX;
        }
    };

    EP.Registry.register(effect);
})();
