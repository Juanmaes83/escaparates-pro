EP.UI = (function() {
    var currentEffect = null;
    var toastTimer = null;
    var activeTags = [];

    function init() {
        buildEffectsLibrary();
        buildTagFilters();
        buildPresetsSection();
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
        if (EP.PerformancePath && typeof EP.PerformancePath.resetBases === 'function') EP.PerformancePath.resetBases();
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

    function buildPresetsSection() {
        var section = document.getElementById('presets-section');
        var list = document.getElementById('presets-list');
        var countEl = document.getElementById('presets-count');
        var header = document.getElementById('presets-header');
        if (!section || !list || !EP.Presets) return;

        var presets = EP.Presets.getAll();
        list.innerHTML = '';

        if (presets.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = '';
        if (countEl) countEl.textContent = presets.length;

        presets.forEach(function(preset) {
            var card = document.createElement('div');
            card.className = 'effect-card preset-card';
            card.innerHTML =
                '<div class="effect-icon">' + (preset.meta.icon || '🔖') + '</div>' +
                '<div class="effect-info">' +
                    '<div class="effect-name">' + preset.name + '</div>' +
                    '<div class="effect-desc">' + (preset.meta.name || preset.effectId) + '</div>' +
                '</div>' +
                '<button class="preset-del-btn" title="Eliminar preset">×</button>';

            card.addEventListener('click', function(e) {
                if (e.target.classList.contains('preset-del-btn')) {
                    EP.Presets.remove(preset.id);
                    buildPresetsSection();
                    toast('Preset eliminado');
                    return;
                }
                var eff = EP.Registry.get(preset.effectId);
                if (!eff) { toast('Efecto no disponible'); return; }
                selectEffect(preset.effectId);
                setTimeout(function() {
                    Object.keys(preset.settings).forEach(function(k) {
                        eff.setSetting(k, preset.settings[k]);
                    });
                    rebuildCurrent();
                    buildControlsPanel(eff);
                    toast('Preset: ' + preset.name);
                }, 120);
            });

            list.appendChild(card);
        });

        if (header && !header._presetToggled) {
            header._presetToggled = true;
            header.classList.add('open');
            header.addEventListener('click', function() { this.classList.toggle('open'); });
        }
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
            } else if (ctrl.type === 'slotGroups') {
                row.className = 'control-row semantic-media-row';
                row.removeChild(label);
                var picker = buildSlotGroupsControl(effect, ctrl);
                row.appendChild(picker);
            } else if (ctrl.type === 'easing') {
                var easingRow = document.createElement('div');
                easingRow.className = 'easing-row easing-grid';
                ctrl.options.forEach(function(name) {
                    var btn = document.createElement('button');
                    btn.className = 'easing-btn easing-curve-btn' + (name === effect.settings[ctrl.key] ? ' active' : '');
                    // SVG curve thumbnail
                    var W = 44, H = 28;
                    var path = EP.Easing.toPath(name, W, H);
                    var label = (EP.Easing.LABELS && EP.Easing.LABELS[name]) || (name.charAt(0).toUpperCase() + name.slice(1));
                    btn.innerHTML =
                        '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" class="easing-svg">' +
                        '<path d="' + path + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
                        '</svg>' +
                        '<span class="easing-label">' + label + '</span>';
                    btn.title = label;
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

        // Save Preset button
        if (EP.Presets) {
            var saveRow = document.createElement('div');
            saveRow.className = 'preset-save-row';
            var saveBtn = document.createElement('button');
            saveBtn.className = 'save-preset-btn';
            saveBtn.textContent = '🔖 Guardar como Preset';
            saveBtn.addEventListener('click', function() {
                var name = window.prompt('Nombre del preset:', effect.meta.name);
                if (!name || !name.trim()) return;
                EP.Presets.save(name.trim(), effect.id, effect.settings, {
                    icon: effect.meta.icon,
                    name: effect.meta.name
                });
                buildPresetsSection();
                toast('✓ Preset guardado');
            });
            saveRow.appendChild(saveBtn);
            container.appendChild(saveRow);
        }
    }

    function buildSlotGroupsControl(effect, ctrl) {
        var wrap = document.createElement('div');
        wrap.className = 'semantic-media-control';
        wrap.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:10px;';

        var title = document.createElement('div');
        title.style.cssText = 'font-size:10px;font-weight:700;color:var(--text);letter-spacing:.08em;text-transform:uppercase;';
        title.textContent = ctrl.label || 'Medios del efecto';
        wrap.appendChild(title);

        var slots = (EP.Media && EP.Media.slots) ? EP.Media.slots : [];
        var current = cloneSlotGroups(effect.settings[ctrl.key] || ctrl.default || {});
        var groups = ctrl.groups || [];

        groups.forEach(function(groupDef) {
            if (current[groupDef.key] === undefined) {
                current[groupDef.key] = groupDef.mode === 'single' ? null : [];
            }
            var block = document.createElement('div');
            block.className = 'semantic-media-block';
            block.style.cssText = 'border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px;background:rgba(255,255,255,.03);display:flex;flex-direction:column;gap:7px;';

            var head = document.createElement('div');
            head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;';
            var labelEl = document.createElement('strong');
            labelEl.style.cssText = 'font-size:11px;color:#d9d9e3;';
            labelEl.textContent = groupDef.label;
            var clear = document.createElement('button');
            clear.type = 'button';
            clear.textContent = groupDef.mode === 'single' ? 'Quitar' : 'Limpiar';
            clear.style.cssText = 'font-size:10px;padding:4px 7px;border-radius:6px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#bfc3d6;cursor:pointer;';
            clear.addEventListener('click', function() {
                current[groupDef.key] = groupDef.mode === 'single' ? null : [];
                effect.setSetting(ctrl.key, cloneSlotGroups(current));
                buildControlsPanel(effect);
                rebuildCurrent();
            });
            head.appendChild(labelEl);
            head.appendChild(clear);
            block.appendChild(head);

            var selected = document.createElement('div');
            selected.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;min-height:22px;';
            var selectedIndexes = groupDef.mode === 'single'
                ? (current[groupDef.key] === null || current[groupDef.key] === undefined ? [] : [current[groupDef.key]])
                : (Array.isArray(current[groupDef.key]) ? current[groupDef.key] : []);
            if (selectedIndexes.length === 0) {
                var empty = document.createElement('span');
                empty.style.cssText = 'font-size:10px;color:#777;';
                empty.textContent = 'Sin seleccion';
                selected.appendChild(empty);
            } else {
                selectedIndexes.forEach(function(slotIndex, orderIndex) {
                    var pill = document.createElement('span');
                    pill.style.cssText = 'font-size:10px;padding:3px 6px;border-radius:999px;background:rgba(70,120,255,.18);color:#dce6ff;border:1px solid rgba(90,140,255,.32);';
                    pill.textContent = (groupDef.mode === 'single' ? '' : (orderIndex + 1) + 'º ') + 'Slot ' + (slotIndex + 1);
                    selected.appendChild(pill);
                });
            }
            block.appendChild(selected);

            var grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;';
            for (var i = 0; i < 15; i++) {
                grid.appendChild(createSlotButton(i, slots[i], groupDef, current, ctrl, effect));
            }
            block.appendChild(grid);
            wrap.appendChild(block);
        });

        return wrap;
    }

    function createSlotButton(index, media, groupDef, current, ctrl, effect) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.title = 'Slot ' + (index + 1);
        var active = groupDef.mode === 'single'
            ? current[groupDef.key] === index
            : (Array.isArray(current[groupDef.key]) && current[groupDef.key].indexOf(index) !== -1);
        btn.style.cssText = [
            'height:42px',
            'border-radius:7px',
            'border:1px solid ' + (active ? 'rgba(80,140,255,.95)' : 'rgba(255,255,255,.12)'),
            'background:' + (active ? 'rgba(70,120,255,.22)' : 'rgba(255,255,255,.045)'),
            'color:#fff',
            'font-size:10px',
            'cursor:pointer',
            'overflow:hidden',
            'position:relative',
            'padding:0'
        ].join(';');

        if (media && media.element) {
            var thumb = media.type === 'video' ? document.createElement('video') : document.createElement('img');
            thumb.src = media.url || media.element.src || '';
            if (media.type === 'video') {
                thumb.muted = true;
                thumb.loop = true;
                thumb.playsInline = true;
            }
            thumb.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;opacity:.82;';
            btn.appendChild(thumb);
        } else {
            var emptyLabel = document.createElement('span');
            emptyLabel.style.cssText = 'display:flex;width:100%;height:100%;align-items:center;justify-content:center;text-align:center;font-size:9px;color:#8d93aa;line-height:1.1;padding:4px;';
            emptyLabel.textContent = 'Subir';
            btn.appendChild(emptyLabel);
        }

        var badge = document.createElement('span');
        badge.style.cssText = 'position:absolute;left:3px;top:3px;background:rgba(0,0,0,.68);border-radius:4px;padding:1px 4px;font-size:9px;';
        badge.textContent = String(index + 1);
        btn.appendChild(badge);

        if (active && groupDef.mode !== 'single') {
            var order = current[groupDef.key].indexOf(index) + 1;
            var orderBadge = document.createElement('span');
            orderBadge.style.cssText = 'position:absolute;right:3px;bottom:3px;background:rgba(55,115,255,.92);border-radius:4px;padding:1px 4px;font-size:9px;';
            orderBadge.textContent = order + 'º';
            btn.appendChild(orderBadge);
        }

        btn.addEventListener('click', function() {
            if (groupDef.mode === 'single') {
                current[groupDef.key] = current[groupDef.key] === index ? null : index;
            } else {
                var list = Array.isArray(current[groupDef.key]) ? current[groupDef.key].slice() : [];
                var pos = list.indexOf(index);
                if (pos === -1) list.push(index);
                else list.splice(pos, 1);
                current[groupDef.key] = list;
            }
            effect.setSetting(ctrl.key, cloneSlotGroups(current));
            if (!media && EP.Media && typeof EP.Media.openSlot === 'function') {
                EP.Media.openSlot(index);
            }
            buildControlsPanel(effect);
            rebuildCurrent();
        });
        return btn;
    }

    function cloneSlotGroups(value) {
        try {
            return JSON.parse(JSON.stringify(value || {}));
        } catch (e) {
            return {};
        }
    }

    function rebuildCurrent() {
        if (!currentEffect) return;
        EP.Core.resetGlobalState();
        if (EP.PerformancePath && typeof EP.PerformancePath.resetBases === 'function') EP.PerformancePath.resetBases();
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

    function refreshCurrentControls() {
        if (currentEffect) buildControlsPanel(currentEffect);
    }

    return {
        init: init,
        selectEffect: selectEffect,
        toast: toast,
        getCurrentEffect: getCurrentEffect,
        rebuildCurrent: rebuildCurrent,
        refreshCurrentControls: refreshCurrentControls
    };
})();
