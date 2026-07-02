EP.UI = (function() {
    var currentEffect = null;
    var toastTimer = null;
    var activeTags = [];

    function init() {
        buildEffectsLibrary();
        buildTagFilters();
        bindOutputPreset();
        bindAspectSelector();
        bindEffectsSearch();
        bindCopyCode();
    }

    function buildEffectsLibrary() {
        var container = document.getElementById('effects-categories');
        container.innerHTML = '';
        // Empty state appended AFTER categories so it lives inside the scrollable container
        var emptyDiv = document.createElement('div');
        emptyDiv.id = 'search-empty-state';
        emptyDiv.style.display = 'none';
        // will be appended after categories loop
        var categories = EP.Registry.getCategories();

        categories.forEach(function(cat, ci) {
            var effects = EP.Registry.getByCategory(cat.id);
            if (effects.length === 0) return;

            var catDiv = document.createElement('div');
            catDiv.className = 'effect-category';

            var header = document.createElement('div');
            header.className = 'category-header' + (ci === 0 ? ' open' : '');
            header.innerHTML = '<span class="arrow">▶</span><span class="cat-name">' + cat.icon + ' ' + cat.name + '</span><span class="cat-count">' + effects.length + '</span>';
            header.addEventListener('click', function() { this.classList.toggle('open'); });
            catDiv.appendChild(header);

            var effectsList = document.createElement('div');
            effectsList.className = 'category-effects';

            effects.forEach(function(eff) {
                var card = document.createElement('div');
                card.className = 'effect-card';
                card.dataset.effectId = eff.id;
                card.innerHTML = '<div class="effect-icon">' + eff.meta.icon + '</div><div class="effect-info"><div class="effect-name">' + eff.meta.name + '</div><div class="effect-desc">' + eff.meta.description + '</div></div>';
                card.addEventListener('click', function() { selectEffect(eff.id); });
                effectsList.appendChild(card);
            });

            catDiv.appendChild(effectsList);
            container.appendChild(catDiv);
        });

        container.appendChild(emptyDiv);
    }

    function selectEffect(id) {
        var effect = EP.Registry.get(id);
        if (!effect) return;

        // Show transition overlay while the effect builds
        var overlay = document.getElementById('effect-loading-overlay');
        if (overlay) {
            var iconEl = overlay.querySelector('.elo-icon');
            var nameEl = overlay.querySelector('.elo-name');
            if (iconEl) iconEl.textContent = effect.meta.icon || '✨';
            if (nameEl) nameEl.textContent = effect.meta.name;
            overlay.classList.add('active');
        }

        document.querySelectorAll('.effect-card').forEach(function(c) { c.classList.remove('active'); });
        var card = document.querySelector('[data-effect-id="' + id + '"]');
        if (card) {
            card.classList.add('active');
            var header = card.closest('.effect-category').querySelector('.category-header');
            if (!header.classList.contains('open')) header.classList.add('open');
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (currentEffect) {
            if (typeof currentEffect.exit === 'function') currentEffect.exit();
            else currentEffect.dispose();
        }
        currentEffect = effect;

        EP.Core.resetGlobalState({ clearDisplay: true });
        if (EP.Timeline && typeof EP.Timeline.resetTemporal === 'function') EP.Timeline.resetTemporal();
        if (effect.settings.background) EP.Core.setBackground(effect.settings.background);

        var mediaList = EP.Media.getAll();
        var group = typeof effect.enter === 'function' ? effect.enter(mediaList) : effect.rebuild(mediaList);
        EP.Core.setDisplayGroup(group);
        buildControlsPanel(effect);
        EP.Core.render();

        // Fade out overlay once the effect is rendered
        if (overlay) {
            setTimeout(function() { overlay.classList.remove('active'); }, 550);
        }

        toast(effect.meta.name + ' activado');
    }

    function buildControlsPanel(effect) {
        var container = document.getElementById('effect-controls');
        var title = document.getElementById('effect-controls-title');
        container.innerHTML = '';
        title.textContent = effect.meta.name.toUpperCase();

        effect.controlsDef.forEach(function(ctrl) {
            var row = document.createElement('div');
            row.className = 'control-row';

            var label = document.createElement('label');
            label.textContent = ctrl.label;
            row.appendChild(label);

            if (ctrl.type === 'range') {
                var input = document.createElement('input');
                input.type = 'range';
                input.min = ctrl.min;
                input.max = ctrl.max;
                input.step = ctrl.step || 1;
                input.value = effect.settings[ctrl.key];
                var val = document.createElement('span');
                val.className = 'val';
                val.textContent = effect.settings[ctrl.key] + (ctrl.unit || '');
                input.addEventListener('input', function() {
                    var v = parseFloat(this.value);
                    var clean = effect.setSetting(ctrl.key, v);
                    this.value = clean;
                    val.textContent = clean + (ctrl.unit || '');
                    rebuildCurrent();
                });
                row.appendChild(input);
                row.appendChild(val);
            } else if (ctrl.type === 'color') {
                var colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = effect.settings[ctrl.key];
                colorInput.addEventListener('input', function() {
                    var clean = effect.setSetting(ctrl.key, this.value);
                    this.value = clean;
                    if (ctrl.key === 'background') EP.Core.setBackground(clean);
                });
                row.appendChild(colorInput);
            } else if (ctrl.type === 'select') {
                var select = document.createElement('select');
                ctrl.options.forEach(function(opt) {
                    var option = document.createElement('option');
                    option.value = opt.v;
                    option.textContent = opt.l;
                    if (opt.v === effect.settings[ctrl.key]) option.selected = true;
                    select.appendChild(option);
                });
                select.addEventListener('change', function() {
                    this.value = effect.setSetting(ctrl.key, this.value);
                    rebuildCurrent();
                });
                row.appendChild(select);
            } else if (ctrl.type === 'text') {
                var textInput = document.createElement('input');
                textInput.type = 'text';
                textInput.value = effect.settings[ctrl.key] || '';
                textInput.maxLength = ctrl.maxLength || 80;
                textInput.addEventListener('input', function() {
                    this.value = effect.setSetting(ctrl.key, this.value);
                    rebuildCurrent();
                });
                row.appendChild(textInput);
            } else if (ctrl.type === 'easing') {
                var easingRow = document.createElement('div');
                easingRow.className = 'easing-row';
                ctrl.options.forEach(function(name) {
                    var btn = document.createElement('button');
                    btn.className = 'easing-btn' + (name === effect.settings[ctrl.key] ? ' active' : '');
                    btn.textContent = name.charAt(0).toUpperCase() + name.slice(1);
                    btn.addEventListener('click', function() {
                        easingRow.querySelectorAll('.easing-btn').forEach(function(b) { b.classList.remove('active'); });
                        this.classList.add('active');
                        effect.setSetting(ctrl.key, name);
                    });
                    easingRow.appendChild(btn);
                });
                row.appendChild(easingRow);
            } else if (ctrl.type === 'aspect') {
                var aspectRow = document.createElement('div');
                aspectRow.className = 'aspect-row';
                ctrl.options.forEach(function(ratio) {
                    var btn = document.createElement('button');
                    btn.className = 'aspect-ctrl-btn' + (ratio === effect.settings[ctrl.key] ? ' active' : '');
                    btn.textContent = ratio;
                    btn.addEventListener('click', function() {
                        aspectRow.querySelectorAll('.aspect-ctrl-btn').forEach(function(b) { b.classList.remove('active'); });
                        this.classList.add('active');
                        effect.setSetting(ctrl.key, ratio);
                        rebuildCurrent();
                    });
                    aspectRow.appendChild(btn);
                });
                row.appendChild(aspectRow);
            }

            container.appendChild(row);
        });
    }

    function rebuildCurrent() {
        if (!currentEffect) return;
        EP.Core.resetGlobalState();
        if (currentEffect.settings.background) EP.Core.setBackground(currentEffect.settings.background);
        var mediaList = EP.Media.getAll();
        var group = typeof currentEffect.reconstruct === 'function' ? currentEffect.reconstruct(mediaList) : currentEffect.rebuild(mediaList);
        EP.Core.setDisplayGroup(group);
        EP.Core.render();
    }

    function bindAspectSelector() {
        var aspectMap = { '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1, '4:5': 4 / 5, '9:16': 9 / 16 };
        document.querySelectorAll('.aspect-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.aspect-btn').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                var ratio = this.dataset.aspect;
                if (EP.OutputPresets) {
                    var presetSelect = document.getElementById('output-preset');
                    var presetId = EP.OutputPresets.fromAspect(ratio);
                    if (presetSelect) presetSelect.value = presetId;
                    EP.OutputPresets.apply(presetId);
                } else {
                    EP.Core.setAspectRatio(aspectMap[ratio] || 16 / 9);
                }
                toast('Aspect ratio: ' + ratio);
            });
        });
    }

    function bindOutputPreset() {
        var select = document.getElementById('output-preset');
        if (!select || !EP.OutputPresets) return;

        select.addEventListener('change', function() {
            var preset = EP.OutputPresets.apply(this.value);
            syncAspectButtons(preset);
            toast('Formato: ' + preset.label);
        });

        syncAspectButtons(EP.OutputPresets.apply(select.value));
    }

    function syncAspectButtons(preset) {
        if (!preset) return;
        var aspect = preset.embedRatio.replace(/\s/g, '').replace('/', ':');
        document.querySelectorAll('.aspect-btn').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.aspect === aspect);
        });
    }

    function buildTagFilters() {
        var row = document.getElementById('tag-chips-row');
        var activeBar = document.getElementById('tag-active-bar');
        var countEl = document.getElementById('tag-active-count');
        var clearBtn = document.getElementById('tag-clear-btn');
        if (!row || !EP.Tags) return;

        var counts = EP.Registry.getTagCounts();
        var defs = EP.Tags.getDefs();
        var lastGroup = null;

        defs.forEach(function(def) {
            if (!(counts[def.id] > 0)) return;

            if (def.group !== lastGroup) {
                var sep = document.createElement('span');
                sep.className = 'tag-group-sep';
                sep.textContent = def.group.toUpperCase();
                row.appendChild(sep);
                lastGroup = def.group;
            }

            var chip = document.createElement('button');
            chip.className = 'tag-chip';
            chip.dataset.tagId = def.id;
            chip.title = counts[def.id] + ' efectos';
            chip.innerHTML = '<span class="tc-icon">' + def.icon + '</span><span class="tc-label">' + def.label + '</span><span class="tc-count">' + counts[def.id] + '</span>';

            chip.addEventListener('click', function() {
                var idx = activeTags.indexOf(def.id);
                if (idx === -1) {
                    activeTags.push(def.id);
                    chip.classList.add('active');
                } else {
                    activeTags.splice(idx, 1);
                    chip.classList.remove('active');
                }
                applyTagFilter();
                document.getElementById('effects-search').dispatchEvent(new Event('input'));
            });

            row.appendChild(chip);
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                activeTags = [];
                row.querySelectorAll('.tag-chip').forEach(function(c) { c.classList.remove('active'); });
                applyTagFilter();
                document.getElementById('effects-search').dispatchEvent(new Event('input'));
            });
        }
    }

    function applyTagFilter() {
        var activeBar = document.getElementById('tag-active-bar');
        var countEl = document.getElementById('tag-active-count');

        if (activeTags.length === 0) {
            // Show all cards
            document.querySelectorAll('.effect-card').forEach(function(c) { c.dataset.tagHidden = ''; });
            document.querySelectorAll('.effect-category').forEach(function(c) { c.dataset.tagHidden = ''; });
            if (activeBar) activeBar.style.display = 'none';
            return;
        }

        var matchingIds = {};
        EP.Registry.getByTags(activeTags).forEach(function(e) { matchingIds[e.id] = true; });
        var total = 0;

        document.querySelectorAll('.effect-category').forEach(function(catDiv) {
            var visibleInCat = 0;
            catDiv.querySelectorAll('.effect-card').forEach(function(card) {
                var id = card.dataset.effectId;
                if (matchingIds[id]) {
                    card.dataset.tagHidden = '';
                    visibleInCat++;
                } else {
                    card.dataset.tagHidden = 'true';
                }
            });
            catDiv.dataset.tagHidden = visibleInCat === 0 ? 'true' : '';
            total += visibleInCat;
        });

        if (activeBar) {
            activeBar.style.display = 'flex';
            if (countEl) countEl.textContent = total + ' efectos';
        }
    }

    function normalizeText(str) {
        return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function bindEffectsSearch() {
        var search = document.getElementById('effects-search');
        var clearBtn = document.getElementById('effects-search-clear');
        var emptyState = document.getElementById('search-empty-state');
        if (!search) return;

        function applyFilter() {
            var raw = search.value.trim();
            var q = normalizeText(raw);
            var totalVisible = 0;

            if (clearBtn) clearBtn.style.display = q ? '' : 'none';

            document.querySelectorAll('.effect-category').forEach(function(catDiv) {
                var catTagHidden = catDiv.dataset.tagHidden === 'true';
                if (catTagHidden && !q) {
                    catDiv.style.display = 'none';
                    return;
                }

                var catNameEl = catDiv.querySelector('.cat-name');
                var catName = catNameEl ? normalizeText(catNameEl.textContent) : '';
                var catMatchesQuery = q && catName.indexOf(q) !== -1;
                var visibleInCat = 0;

                catDiv.querySelectorAll('.effect-card').forEach(function(card) {
                    var tagHidden = card.dataset.tagHidden === 'true';
                    var name = normalizeText(card.querySelector('.effect-name').textContent);
                    var desc = normalizeText(card.querySelector('.effect-desc').textContent);
                    var textMatch = !q || catMatchesQuery || name.indexOf(q) !== -1 || desc.indexOf(q) !== -1;
                    var show = textMatch && !tagHidden;
                    card.style.display = show ? '' : 'none';
                    if (show) visibleInCat++;
                });

                var catVisible = visibleInCat > 0;
                catDiv.style.display = catVisible ? '' : 'none';
                if (q && visibleInCat > 0) {
                    catDiv.querySelector('.category-header').classList.add('open');
                }
                totalVisible += visibleInCat;
            });

            if (emptyState) {
                var show = q !== '' && totalVisible === 0;
                emptyState.style.display = show ? 'block' : 'none';
                if (show) {
                    emptyState.innerHTML = '<div class="sem-icon">🔍</div><div class="sem-msg">Sin resultados para &ldquo;<strong>' + raw + '</strong>&rdquo;</div><div class="sem-hint">Prueba en inglés o revisa la ortografía</div>';
                }
            }
        }

        search.addEventListener('input', applyFilter);

        search.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                applyFilter();
                this.blur();
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                search.value = '';
                applyFilter();
                search.focus();
            });
        }
    }

    function bindCopyCode() {
        var btn = document.getElementById('btn-copy-code');
        var popover = document.getElementById('code-popover');
        var snippet = document.getElementById('code-snippet');
        var copyBtn = document.getElementById('btn-copy-snippet');
        var closeBtn = document.getElementById('btn-close-popover');
        if (!btn || !popover) return;

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (popover.classList.contains('open')) {
                popover.classList.remove('open');
                return;
            }
            var effect = currentEffect;
            if (!effect) { toast('Selecciona un efecto primero'); return; }

            var config = {
                effect: effect.id,
                name: effect.meta.name,
                category: effect.meta.category,
                settings: JSON.parse(JSON.stringify(effect.settings || {})),
                loopDuration: EP.Timeline ? EP.Timeline.loopDuration : 12,
                background: effect.settings.background || '#101014'
            };

            var code = JSON.stringify(config, null, 2);
            snippet.textContent = code;
            popover.classList.add('open');
        });

        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                var text = snippet.textContent;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function() {
                        toast('Código copiado al portapapeles');
                        popover.classList.remove('open');
                    });
                } else {
                    var ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    toast('Código copiado al portapapeles');
                    popover.classList.remove('open');
                }
            });
        }

        if (closeBtn) closeBtn.addEventListener('click', function() { popover.classList.remove('open'); });

        document.addEventListener('click', function(e) {
            if (popover.classList.contains('open') && !popover.contains(e.target) && e.target !== btn) {
                popover.classList.remove('open');
            }
        });
    }

    function toast(msg) {
        var el = document.getElementById('toast');
        el.textContent = msg;
        el.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function() { el.classList.remove('show'); }, 2000);
    }

    function getCurrentEffect() { return currentEffect; }

    return {
        init: init,
        selectEffect: selectEffect,
        toast: toast,
        getCurrentEffect: getCurrentEffect,
        rebuildCurrent: rebuildCurrent
    };
})();
