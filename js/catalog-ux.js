EP.CatalogUX = (function() {
    var STORAGE_FAV = 'ep-favorites-v1';
    var STORAGE_REC = 'ep-recientes-v1';
    var MAX_RECIENTES = 8;
    var NEW_EFFECTS = ['scramble-text', 'type-writer', 'text-morph'];
    var favFilterActive = false;

    /* ── Storage helpers ──────────────────────────────────────── */
    function getFavs() {
        try { return JSON.parse(localStorage.getItem(STORAGE_FAV) || '[]'); } catch(e) { return []; }
    }
    function saveFavs(favs) {
        try { localStorage.setItem(STORAGE_FAV, JSON.stringify(favs)); } catch(e) {}
    }
    function getRecientes() {
        try { return JSON.parse(localStorage.getItem(STORAGE_REC) || '[]'); } catch(e) { return []; }
    }
    function saveRecientes(list) {
        try { localStorage.setItem(STORAGE_REC, JSON.stringify(list)); } catch(e) {}
    }

    /* ── Star / Favorites ─────────────────────────────────────── */
    function addStar(card, id) {
        var favs = getFavs();
        var isFav = favs.indexOf(id) !== -1;
        var btn = document.createElement('button');
        btn.className = 'ep-star-btn' + (isFav ? ' ep-starred' : '');
        btn.title = isFav ? 'Quitar de favoritos' : 'Añadir a favoritos';
        btn.textContent = isFav ? '★' : '☆';
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var f = getFavs();
            var idx = f.indexOf(id);
            if (idx === -1) {
                f.push(id);
                btn.textContent = '★'; btn.classList.add('ep-starred');
                btn.title = 'Quitar de favoritos';
            } else {
                f.splice(idx, 1);
                btn.textContent = '☆'; btn.classList.remove('ep-starred');
                btn.title = 'Añadir a favoritos';
            }
            saveFavs(f);
            updateFavChip();
            if (favFilterActive) applyFavFilter();
        });
        card.appendChild(btn);
    }

    /* ── NEW badge ────────────────────────────────────────────── */
    function addNewBadge(card, id) {
        if (NEW_EFFECTS.indexOf(id) === -1) return;
        if (card.querySelector('.ep-new-badge')) return;
        var badge = document.createElement('span');
        badge.className = 'ep-new-badge';
        badge.textContent = 'NEW';
        card.appendChild(badge);
    }

    function injectStarsAndBadges() {
        document.querySelectorAll('.effect-card[data-effect-id]').forEach(function(card) {
            var id = card.dataset.effectId;
            if (!card.querySelector('.ep-star-btn')) addStar(card, id);
            addNewBadge(card, id);
        });
    }

    /* ── Recientes section ────────────────────────────────────── */
    function buildRecientesSection() {
        var old = document.getElementById('ep-recientes-section');
        if (old) old.parentNode.removeChild(old);

        var list = getRecientes();
        if (list.length === 0) return;

        var container = document.getElementById('effects-categories');
        if (!container) return;

        var section = document.createElement('div');
        section.id = 'ep-recientes-section';
        section.className = 'effect-category';

        var header = document.createElement('div');
        header.className = 'category-header open';
        header.innerHTML = '<span class="arrow">▶</span><span class="cat-name">⏱ Recientes</span><span class="cat-count">' + list.length + '</span>';
        header.addEventListener('click', function() { this.classList.toggle('open'); });
        section.appendChild(header);

        var effectsList = document.createElement('div');
        effectsList.className = 'category-effects';

        list.forEach(function(id) {
            var eff = EP.Registry.get(id);
            if (!eff) return;
            var card = document.createElement('div');
            card.className = 'effect-card ep-rec-card';
            card.dataset.effectIdRec = id;
            card.innerHTML = '<div class="effect-icon">' + eff.meta.icon + '</div><div class="effect-info"><div class="effect-name">' + eff.meta.name + '</div><div class="effect-desc ep-rec-label">Usado recientemente</div></div>';
            card.addEventListener('click', function() { EP.UI.selectEffect(id); });
            effectsList.appendChild(card);
        });

        section.appendChild(effectsList);
        container.insertBefore(section, container.firstChild);
    }

    function trackReciente(id) {
        if (!id || id.indexOf('-rec') !== -1) return;
        var list = getRecientes();
        var idx = list.indexOf(id);
        if (idx !== -1) list.splice(idx, 1);
        list.unshift(id);
        if (list.length > MAX_RECIENTES) list = list.slice(0, MAX_RECIENTES);
        saveRecientes(list);
        buildRecientesSection();
    }

    /* ── Favorites filter chip ────────────────────────────────── */
    function buildFavFilterChip() {
        if (document.getElementById('ep-fav-chip')) return;
        var header = document.querySelector('#effects-panel .panel-header');
        if (!header) return;

        var chip = document.createElement('button');
        chip.id = 'ep-fav-chip';
        chip.className = 'ep-fav-chip';
        chip.textContent = '★ Favoritos';
        chip.title = 'Mostrar solo favoritos';
        chip.addEventListener('click', function() {
            favFilterActive = !favFilterActive;
            chip.classList.toggle('ep-active', favFilterActive);
            applyFavFilter();
        });
        header.appendChild(chip);
    }

    function updateFavChip() {
        var chip = document.getElementById('ep-fav-chip');
        if (!chip) return;
        var count = getFavs().length;
        chip.textContent = count > 0 ? '★ Favoritos (' + count + ')' : '★ Favoritos';
    }

    function applyFavFilter() {
        var favs = getFavs();
        var allCats = document.querySelectorAll('#effects-categories .effect-category');

        if (!favFilterActive) {
            allCats.forEach(function(c) { c.style.display = ''; });
            document.querySelectorAll('.effect-card[data-effect-id]').forEach(function(c) { c.style.display = ''; });
            return;
        }

        document.querySelectorAll('.effect-card[data-effect-id]').forEach(function(card) {
            card.style.display = favs.indexOf(card.dataset.effectId) !== -1 ? '' : 'none';
        });

        allCats.forEach(function(cat) {
            if (cat.id === 'ep-recientes-section') return;
            var visible = cat.querySelectorAll('.effect-card[data-effect-id][style=""], .effect-card[data-effect-id]:not([style])');
            cat.style.display = visible.length > 0 ? '' : 'none';
        });
    }

    /* ── Inline styles (self-contained, no panels.css touch) ──── */
    function injectStyles() {
        if (document.getElementById('ep-catalog-ux-styles')) return;
        var s = document.createElement('style');
        s.id = 'ep-catalog-ux-styles';
        s.textContent = [
            '.effect-card { position: relative; }',
            '.ep-star-btn { position: absolute; top: 5px; right: 5px; background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 13px; line-height: 1; padding: 0; z-index: 2; opacity: 0; transition: opacity 0.15s, color 0.15s; }',
            '.effect-card:hover .ep-star-btn { opacity: 1; }',
            '.ep-star-btn.ep-starred { opacity: 1; color: #fbbf24; }',
            '.ep-new-badge { position: absolute; bottom: 5px; right: 5px; background: var(--accent); color: #fff; font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 3px; letter-spacing: 0.5px; pointer-events: none; }',
            '.ep-fav-chip { display: block; width: 100%; margin-top: 6px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text-dim); padding: 5px 8px; border-radius: 5px; font-size: 10px; font-weight: 600; cursor: pointer; font-family: var(--font); text-align: left; transition: all 0.15s; letter-spacing: 0.3px; }',
            '.ep-fav-chip:hover { border-color: #fbbf24; color: #fbbf24; }',
            '.ep-fav-chip.ep-active { background: rgba(251,191,36,0.12); border-color: rgba(251,191,36,0.5); color: #fbbf24; }',
            '.ep-rec-label { color: rgba(100,200,255,0.55) !important; }'
        ].join('\n');
        document.head.appendChild(s);
    }

    /* ── Init ─────────────────────────────────────────────────── */
    function init() {
        injectStyles();
        buildFavFilterChip();
        updateFavChip();
        injectStarsAndBadges();
        buildRecientesSection();

        var origSelect = EP.UI.selectEffect;
        EP.UI.selectEffect = function(id) {
            origSelect.call(EP.UI, id);
            trackReciente(id);
        };
    }

    return { init: init };
})();
