(function() {
    var effect = new EP.EffectBase('cube-rain-transition-new', {
        name: 'Cube Rain Transition NEW',
        category: 'reveal-wipe',
        icon: 'CN',
        description: 'Codigo original adaptado: reticula DOM con capas imagen/video, keyframes aleatorios y lluvia 3D'
    }, [
        { key: 'outputSize', type: 'range', min: 50, max: 800, default: 130, step: 10, label: 'Output Size', unit: '%' },
        { key: 'rows', type: 'range', min: 8, max: 40, default: 20, step: 1, label: 'Filas' },
        { key: 'cols', type: 'range', min: 8, max: 40, default: 20, step: 1, label: 'Columnas' },
        { key: 'cellSize', type: 'range', min: 5, max: 30, default: 15, step: 1, label: 'Tamano celda' },
        { key: 'gap', type: 'range', min: 0, max: 10, default: 1, step: 1, label: 'Separacion' },
        { key: 'speed', type: 'range', min: 2, max: 20, default: 6, step: 0.5, label: 'Velocidad', unit: 's' },
        { key: 'depth', type: 'range', min: 10, max: 60, default: 35, step: 1, label: 'Profundidad', unit: 'vh' },
        { key: 'transitionPercent', type: 'range', min: 10, max: 90, default: 25, step: 1, label: 'Transicion', unit: '%' },
        { key: 'imgCount', type: 'range', min: 2, max: 6, default: 3, step: 1, label: 'Elementos' },
        {
            key: 'mediaGroups',
            type: 'slotGroups',
            label: 'Medios Cube Rain',
            default: { main: [0, 1, 2], background: null },
            groups: [
                { key: 'main', label: 'Imagenes/videos principales', mode: 'multi' },
                { key: 'background', label: 'Fondo imagen/video', mode: 'single' }
            ]
        },
        { key: 'backgroundType', type: 'select', options: [{ v: 'color', l: 'Color' }, { v: 'image', l: 'Imagen slot' }, { v: 'video', l: 'Video slot' }], default: 'color', label: 'Tipo fondo' },
        { key: 'backgroundSlot', type: 'range', min: 1, max: 15, default: 1, step: 1, label: 'Fondo slot' },
        { key: 'backgroundOpacity', type: 'range', min: 0, max: 100, default: 100, step: 1, label: 'Opacidad fondo', unit: '%' },
        { key: 'backgroundBlur', type: 'range', min: 0, max: 30, default: 0, step: 1, label: 'Blur fondo', unit: 'px' },
        { key: 'background', type: 'color', default: '#1a1a1a', label: 'Fondo' },
        { key: 'borderColor', type: 'color', default: '#666666', label: 'Bordes' }
    ]);

    effect.capabilities = {
        supportsMotionDirection: false,
        supportsVideo: true,
        usesCamera: false,
        usesPostProcessing: false,
        usesParticlesShaders: false,
        mobileRisk: 'high',
        minMedia: 1,
        exportSafe: false,
        hasErrorBoundary: true
    };

    function mediaSrc(media) {
        if (!media) return '';
        return media.url || (media.element && media.element.src) || '';
    }

    function pickFromGroup(all, groupValue) {
        if (!groupValue || !Array.isArray(groupValue.main) || groupValue.main.length === 0) return (all || []).filter(Boolean);
        return groupValue.main.map(function(idx) { return (all || [])[idx]; }).filter(Boolean);
    }

    effect.build = function(mediaList) {
        this.cleanup();
        this._allMedia = (EP.Media && EP.Media.slots) ? EP.Media.slots : (mediaList || []);
        this._mediaList = pickFromGroup(this._allMedia, this.settings.mediaGroups);
        var group = new THREE.Group();
        if (!this._mediaList.length) return group;
        this.group = group;

        var parent = EP.Core && EP.Core.renderer && EP.Core.renderer.domElement.parentElement;
        if (!parent) return group;
        var oldPos = window.getComputedStyle(parent).position;
        if (oldPos === 'static') parent.style.position = 'relative';

        var wrap = document.createElement('div');
        wrap.className = 'ep-cube-rain-new';
        wrap.style.cssText = [
            'position:absolute',
            'inset:0',
            'z-index:4',
            'overflow:hidden',
            'pointer-events:none',
            'background:' + this.settings.background,
            'perspective:80rem',
            'display:grid',
            'place-content:center'
        ].join(';');

        var bg = document.createElement('div');
        bg.className = 'ep-cube-rain-bg';
        bg.style.cssText = [
            'position:absolute',
            'inset:0',
            'z-index:0',
            'overflow:hidden',
            'background:' + this.settings.background
        ].join(';');
        wrap.appendChild(bg);

        var grid = document.createElement('div');
        grid.className = 'ep-cube-rain-grid';
        grid.style.cssText = [
            'position:relative',
            'z-index:1',
            'display:grid',
            'transform-style:preserve-3d',
            'transform:rotateX(50deg)'
        ].join(';');
        wrap.appendChild(grid);

        var style = document.createElement('style');
        wrap.appendChild(style);
        parent.appendChild(wrap);

        this._dom = { parent: parent, wrap: wrap, bg: bg, grid: grid, style: style, oldPos: oldPos };
        this._currentMediaIndex = 0;
        this._lastSwap = 0;
        this._raf = null;
        this._buildGrid();
        return group;
    };

    effect._applyBackground = function() {
        if (!this._dom || !this._dom.bg) return;
        var bg = this._dom.bg;
        bg.innerHTML = '';
        bg.style.background = this.settings.background;
        bg.style.opacity = String(Math.max(0, Math.min(1, this.settings.backgroundOpacity / 100)));
        bg.style.filter = 'blur(' + Math.max(0, this.settings.backgroundBlur || 0) + 'px)';
        var groupBg = this.settings.mediaGroups && this.settings.mediaGroups.background;
        var type = this.settings.backgroundType || 'color';
        if ((groupBg === null || groupBg === undefined) && type === 'color') return;
        var bgIndex = groupBg !== null && groupBg !== undefined ? groupBg : Math.floor(this.settings.backgroundSlot) - 1;
        var media = this._allMedia[Math.max(0, Math.min(this._allMedia.length - 1, bgIndex))];
        if (!media || !media.element) return;
        var el;
        if ((type === 'video' || groupBg !== null && groupBg !== undefined) && media.type === 'video') {
            el = document.createElement('video');
            el.src = media.url || media.element.src || '';
            el.muted = true;
            el.loop = true;
            el.playsInline = true;
            el.autoplay = true;
            el.play().catch(function() {});
        } else {
            el = document.createElement('img');
            el.src = media.url || media.element.src || '';
        }
        el.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
        bg.appendChild(el);
    };

    effect._getMedia = function(index) {
        var count = Math.max(2, Math.min(6, Math.floor(this.settings.imgCount || 3)));
        return this._mediaList[index % Math.min(count, this._mediaList.length)];
    };

    effect._buildGrid = function() {
        if (!this._dom) return;
        var grid = this._dom.grid;
        grid.innerHTML = '';
        var nRows = Math.floor(this.settings.rows);
        var nCols = Math.floor(this.settings.cols);
        var cellSize = this.settings.cellSize / 10;
        var gap = this.settings.gap / 10;
        var speed = this.settings.speed;
        var depth = this.settings.depth;
        var transitionPercent = this.settings.transitionPercent;
        var totalCells = nRows * nCols;
        var totalW = nCols * cellSize + (nCols - 1) * gap;
        var totalH = nRows * cellSize + (nRows - 1) * gap;

        this._dom.wrap.style.background = this.settings.background;
        this._applyBackground();
        grid.style.gridTemplate = 'repeat(' + nRows + ', ' + cellSize + 'rem) / repeat(' + nCols + ', ' + cellSize + 'rem)';
        grid.style.gap = gap + 'rem';
        grid.style.transform = 'rotateX(50deg) scale(' + Math.max(0.5, this.settings.outputSize / 100) + ')';

        var cssText = '.ep-cube-rain-new .ep-cell{width:' + cellSize + 'rem;height:' + cellSize + 'rem;position:relative;overflow:hidden;box-shadow:0 0 1px ' + this.settings.borderColor + ';background:#2c3e50;transform-style:preserve-3d}.ep-cube-rain-new .ep-layer{position:absolute;width:' + totalW + 'rem;height:' + totalH + 'rem;object-fit:cover;transition:opacity .3s ease}.ep-cube-rain-new img,.ep-cube-rain-new canvas{width:100%;height:100%;object-fit:cover;display:block}';
        this._randoms = [];
        for (var i = 0; i < totalCells; i++) {
            var pctStart = Math.random() * (100 - transitionPercent);
            var pctEnd = pctStart + transitionPercent;
            var delay = -Math.random() * speed;
            this._randoms.push({ pctStart: pctStart, pctEnd: pctEnd, delay: delay });
            cssText += '@keyframes epFallNew' + i + '{0%,' + pctStart + '%{transform:translateZ(0)}' + pctEnd + '%,100%{transform:translateZ(' + depth + 'vh)}}';
            cssText += '.ep-cube-rain-new .ep-cell:nth-child(' + (i + 1) + '){animation:epFallNew' + i + ' ' + speed + 's ease-in-out infinite alternate;animation-delay:' + delay + 's}';
        }
        this._dom.style.textContent = cssText;

        var primaryMedia = this._getMedia(this._currentMediaIndex);
        var secondaryMedia = this._getMedia((this._currentMediaIndex + 1) % Math.max(1, this._mediaList.length));
        this._videoFrames = [];
        for (var c = 0; c < totalCells; c++) {
            var row = Math.floor(c / nCols);
            var col = c % nCols;
            var offsetX = -col * (cellSize + gap);
            var offsetY = -row * (cellSize + gap);
            var cell = document.createElement('div');
            cell.className = 'ep-cell';
            cell.appendChild(this._createLayer(primaryMedia, offsetX, offsetY, this._currentMediaIndex, 1));
            cell.appendChild(this._createLayer(secondaryMedia, offsetX, offsetY, (this._currentMediaIndex + 1) % Math.max(1, this._mediaList.length), 0));
            grid.appendChild(cell);
        }
    };

    effect._createLayer = function(media, offsetX, offsetY, slotIndex, opacity) {
        var layer = document.createElement('div');
        layer.className = 'ep-layer';
        layer.dataset.slotIndex = String(slotIndex);
        layer.style.left = offsetX + 'rem';
        layer.style.top = offsetY + 'rem';
        layer.style.opacity = opacity;
        if (media && media.type === 'video' && media.element) {
            var canvas = document.createElement('canvas');
            canvas.className = 'ep-video-frame';
            layer.appendChild(canvas);
            this._videoFrames.push({ canvas: canvas, video: media.element });
        } else {
            var img = document.createElement('img');
            img.src = mediaSrc(media);
            layer.appendChild(img);
        }
        return layer;
    };

    effect._swapLayers = function() {
        if (!this._dom || !this._mediaList.length) return;
        var count = Math.min(Math.floor(this.settings.imgCount), this._mediaList.length);
        if (count < 2) return;
        var nextIndex = (this._currentMediaIndex + 1) % count;
        var nextNextIndex = count === 2 ? this._currentMediaIndex : (this._currentMediaIndex + 2) % count;
        var nextNextMedia = this._getMedia(nextNextIndex);
        var cells = this._dom.grid.querySelectorAll('.ep-cell');
        this._videoFrames = [];
        for (var i = 0; i < cells.length; i++) {
            var primary = cells[i].children[0];
            var secondary = cells[i].children[1];
            if (!primary || !secondary) continue;
            primary.style.opacity = '0';
            secondary.style.opacity = '1';
            this._replaceLayerContent(primary, nextNextMedia, nextNextIndex);
            cells[i].appendChild(primary);
        }
        this._currentMediaIndex = nextIndex;
    };

    effect._replaceLayerContent = function(layer, media, slotIndex) {
        layer.innerHTML = '';
        layer.dataset.slotIndex = String(slotIndex);
        if (media && media.type === 'video' && media.element) {
            var canvas = document.createElement('canvas');
            canvas.className = 'ep-video-frame';
            layer.appendChild(canvas);
            this._videoFrames.push({ canvas: canvas, video: media.element });
        } else {
            var img = document.createElement('img');
            img.src = mediaSrc(media);
            layer.appendChild(img);
        }
    };

    effect.update = function(time) {
        if (!this._dom) return;
        var selectedKey = JSON.stringify(this.settings.mediaGroups || {});
        if (selectedKey !== this._lastMediaGroupsKey) {
            this._lastMediaGroupsKey = selectedKey;
            this._mediaList = pickFromGroup(this._allMedia, this.settings.mediaGroups);
            this._currentMediaIndex = 0;
            this._buildGrid();
        }
        if (this._lastBgKey !== [this.settings.backgroundType, this.settings.backgroundSlot, this.settings.background, this.settings.backgroundOpacity, this.settings.backgroundBlur, JSON.stringify(this.settings.mediaGroups || {})].join('|')) {
            this._lastBgKey = [this.settings.backgroundType, this.settings.backgroundSlot, this.settings.background, this.settings.backgroundOpacity, this.settings.backgroundBlur, JSON.stringify(this.settings.mediaGroups || {})].join('|');
            this._applyBackground();
        }
        var halfDuration = Math.max(0.25, this.settings.speed / 2);
        if (time - this._lastSwap > halfDuration) {
            this._lastSwap = time;
            this._swapLayers();
        }
        var frames = this._dom.grid.querySelectorAll('.ep-video-frame');
        for (var i = 0; i < frames.length; i++) {
            var layer = frames[i].parentElement;
            var idx = parseInt(layer.dataset.slotIndex, 10);
            var media = this._getMedia(idx);
            if (!media || media.type !== 'video' || !media.element || media.element.readyState < 2) continue;
            var canvas = frames[i];
            canvas.width = media.element.videoWidth || 800;
            canvas.height = media.element.videoHeight || 600;
            try { canvas.getContext('2d').drawImage(media.element, 0, 0, canvas.width, canvas.height); } catch(e) {}
        }
    };

    effect.cleanup = effect.dispose = function() {
        if (this._dom && this._dom.wrap && this._dom.wrap.parentNode) this._dom.wrap.parentNode.removeChild(this._dom.wrap);
        if (this._dom && this._dom.parent && this._dom.oldPos === 'static') this._dom.parent.style.position = '';
        this._dom = null;
        EP.EffectBase.prototype.dispose.call(this);
    };

    EP.Registry.register(effect);
})();
