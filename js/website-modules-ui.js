// Website Modules Lab UI — fourth mode for isolated cinematic web sections.
(function() {
    window.EP = window.EP || {};

    var state = {
        active: false,
        activeId: null,
        options: {}
    };
    var renderTimer = null;

    function getSchema(id) {
        return EP.WebsiteModules ? EP.WebsiteModules.getSchema(id) : [];
    }

    function ensureOptions(id) {
        if (state.options[id]) return state.options[id];
        var opts = {};
        getSchema(id).forEach(function(field) { opts[field.key] = field.default; });
        state.options[id] = opts;
        return opts;
    }

    function getMediaList() {
        return (EP.Media && EP.Media.getAll) ? EP.Media.getAll() : [];
    }

    function buildCurrentDocument() {
        var mod = EP.WebsiteModules && EP.WebsiteModules.get(state.activeId);
        if (!mod) return '';
        return mod.build(getMediaList(), ensureOptions(state.activeId));
    }

    function makeCard(mod) {
        var card = document.createElement('div');
        card.className = 'ss-template-card' + (mod.id === state.activeId ? ' active' : '');
        card.setAttribute('data-website-module', mod.id);
        card.innerHTML =
            '<span class="ss-icon">' + mod.icon + '</span>' +
            '<div><div class="ss-name">' + mod.name + '</div>' +
            '<div class="ss-desc">' + mod.family + ' — ' + mod.description + '</div></div>';
        card.addEventListener('click', function() { selectModule(mod.id); });
        return card;
    }

    function renderCatalog() {
        var catalog = document.getElementById('website-modules-catalog');
        if (!catalog || !EP.WebsiteModules) return;
        catalog.innerHTML = '';
        var header = document.createElement('div');
        header.className = 'ss-catalog-section-header';
        header.textContent = 'Website Modules Lab - Premium ' + EP.WebsiteModules.getAll().length;
        catalog.appendChild(header);
        var featured = EP.WebsiteModules.get('logo-wheel-pro');
        if (featured) {
            var quickOpen = document.createElement('button');
            quickOpen.type = 'button';
            quickOpen.className = 'wm-featured-open' + (featured.id === state.activeId ? ' active' : '');
            quickOpen.innerHTML = '<span>NUEVO</span><strong>Logo Wheel PRO</strong><small>Abrir orbita de logos</small>';
            quickOpen.addEventListener('click', function() { selectModule(featured.id); });
            catalog.appendChild(quickOpen);
        }
        EP.WebsiteModules.getAll().forEach(function(mod) {
            catalog.appendChild(makeCard(mod));
        });
        filterCatalog((document.getElementById('effects-search') || {}).value || '');
    }

    function renderModulePicker() {
        var picker = document.getElementById('wm-module-picker');
        if (!picker || !EP.WebsiteModules) return;
        picker.innerHTML = '';
        EP.WebsiteModules.getAll().forEach(function(mod) {
            var option = document.createElement('option');
            option.value = mod.id;
            option.textContent = mod.name + ' - ' + mod.family;
            picker.appendChild(option);
        });
        if (state.activeId) picker.value = state.activeId;
    }

    function renderFields() {
        var wrap = document.getElementById('wm-props-fields');
        var titleEl = document.getElementById('wm-props-title');
        var noteEl = document.getElementById('wm-source-note');
        var mod = EP.WebsiteModules && EP.WebsiteModules.get(state.activeId);
        if (!wrap || !mod) return;
        var opts = ensureOptions(mod.id);
        wrap.innerHTML = '';
        if (titleEl) titleEl.textContent = mod.name.toUpperCase();
        getSchema(mod.id).forEach(function(field) {
            var row = document.createElement('div');
            row.className = 'wm-field';
            var label = document.createElement('label');
            label.textContent = field.label;
            row.appendChild(label);
            var input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.value = opts[field.key] || '';
            } else if (field.type === 'select') {
                input = document.createElement('select');
                (field.options || []).forEach(function(opt) {
                    var option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    input.appendChild(option);
                });
                input.value = opts[field.key] || field.default;
            } else {
                input = document.createElement('input');
                input.type = field.type === 'url' ? 'url' : field.type;
                input.value = opts[field.key] || field.default || '';
            }
            if (field.type === 'range') {
                input.min = field.min;
                input.max = field.max;
                input.step = field.step;
                var value = document.createElement('span');
                value.className = 'wm-range-value';
                value.textContent = input.value;
                var rangeWrap = document.createElement('div');
                rangeWrap.className = 'wm-range-row';
                rangeWrap.appendChild(input);
                rangeWrap.appendChild(value);
                input.addEventListener('input', function() {
                    opts[field.key] = parseFloat(input.value);
                    value.textContent = input.value;
                    scheduleRender();
                });
                row.appendChild(rangeWrap);
            } else {
                input.addEventListener('input', function() {
                    opts[field.key] = input.value;
                    scheduleRender();
                });
                input.addEventListener('change', function() {
                    opts[field.key] = input.value;
                    scheduleRender();
                });
                row.appendChild(input);
            }
            wrap.appendChild(row);
        });
        if (noteEl) {
            noteEl.innerHTML = 'Modulo premium aislado en iframe. <strong>Referencia:</strong> ' + mod.sourceFile + '. <br><strong>Media:</strong> ' + (mod.mediaMap || 'usa los slots de media disponibles.') + '<br>Export final sin editor.';
        }
    }

    function scheduleRender() {
        if (renderTimer) clearTimeout(renderTimer);
        renderTimer = setTimeout(renderPreview, 180);
    }

    function renderPreview() {
        if (!state.active) return;
        var frame = document.getElementById('wm-preview-frame');
        if (!frame) return;
        frame.onload = function() {
            try {
                if (frame.contentWindow) frame.contentWindow.scrollTo(0, 0);
            } catch (err) {}
        };
        frame.srcdoc = buildCurrentDocument();
    }

    function selectModule(id) {
        if (!EP.WebsiteModules || !EP.WebsiteModules.get(id)) return;
        state.activeId = id;
        ensureOptions(id);
        renderCatalog();
        renderModulePicker();
        renderFields();
        renderPreview();
        var embed = document.getElementById('wm-embed-result');
        if (embed) embed.style.display = 'none';
    }

    function deactivateRubikSurface() {
        document.body.classList.remove('mode-rubik-tools');
        var rubikStage = document.getElementById('rubik-tools-stage');
        var rubikBtn = document.getElementById('mode-btn-rubik-tools');
        if (rubikStage) rubikStage.classList.remove('active');
        if (rubikBtn) rubikBtn.classList.remove('active');
    }

    function activate() {
        if (state.active) return;
        state.active = true;
        if (EP.ScrollSectionsUI && EP.ScrollSectionsUI.setMode) EP.ScrollSectionsUI.setMode('effects');
        deactivateRubikSurface();
        document.body.classList.add('mode-website-modules');
        document.body.classList.remove('mode-scroll-sections');
        var stage = document.getElementById('website-modules-stage');
        var btn = document.getElementById('mode-btn-website-modules');
        var btnEffects = document.getElementById('mode-btn-effects');
        var btnScroll = document.getElementById('mode-btn-scroll-sections');
        var catalog = document.getElementById('website-modules-catalog');
        var effectsBody = document.getElementById('effects-catalog-body');
        var scrollCatalog = document.getElementById('scroll-sections-catalog');
        var props = document.getElementById('website-modules-props');
        var scrollProps = document.getElementById('scroll-sections-props');
        if (stage) stage.classList.add('active');
        if (btn) btn.classList.add('active');
        if (btnEffects) btnEffects.classList.remove('active');
        if (btnScroll) btnScroll.classList.remove('active');
        if (catalog) catalog.style.display = 'block';
        if (effectsBody) effectsBody.style.display = 'none';
        if (scrollCatalog) scrollCatalog.style.display = 'none';
        if (props) props.style.display = 'block';
        if (scrollProps) scrollProps.style.display = 'none';
        if (EP.Timeline && EP.Timeline.pause) EP.Timeline.pause();
        if (!state.activeId) {
            var first = EP.WebsiteModules && EP.WebsiteModules.getAll()[0];
            if (first) selectModule(first.id);
        } else {
            renderCatalog();
            renderModulePicker();
            renderFields();
            renderPreview();
        }
    }

    function deactivate() {
        if (!state.active) return;
        state.active = false;
        document.body.classList.remove('mode-website-modules');
        var stage = document.getElementById('website-modules-stage');
        var btn = document.getElementById('mode-btn-website-modules');
        var catalog = document.getElementById('website-modules-catalog');
        var props = document.getElementById('website-modules-props');
        if (stage) stage.classList.remove('active');
        if (btn) btn.classList.remove('active');
        if (catalog) catalog.style.display = 'none';
        if (props) props.style.display = 'none';
    }

    function download(filename, content, type) {
        var blob = new Blob([content], { type: type || 'text/html' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
    }

    function exportHTML() {
        if (!state.activeId) return;
        download('website-module-' + state.activeId + '.html', buildCurrentDocument(), 'text/html');
        if (EP.UI && EP.UI.toast) EP.UI.toast('Website module HTML descargado');
    }

    function exportZIP() {
        if (typeof JSZip === 'undefined') {
            if (EP.UI && EP.UI.toast) EP.UI.toast('ZIP no disponible: JSZip no esta cargado');
            return;
        }
        var zip = new JSZip();
        zip.file('index.html', buildCurrentDocument());
        zip.file('README.txt', [
            'Escaparates Pro - Website Modules Lab',
            'Modulo: ' + state.activeId,
            'Abrir index.html o subir la carpeta a cualquier hosting.',
            'Fuente MIT: cinematic-site-components by Jay from RoboLabs / RoboNuggets.',
            'Este ZIP contiene el resultado final, no el editor.'
        ].join('\n'));
        zip.generateAsync({ type: 'blob' }).then(function(blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'website-module-' + state.activeId + '.zip';
            a.click();
            setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
            if (EP.UI && EP.UI.toast) EP.UI.toast('ZIP descargado');
        });
    }

    function copyEmbed() {
        var html = buildCurrentDocument();
        var embed = '<iframe title="Escaparates Pro Website Module" loading="lazy" style="width:100%;min-height:100vh;border:0;display:block;overflow:auto;" srcdoc="' +
            String(html).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '"></iframe>';
        var target = document.getElementById('wm-embed-result');
        if (target) {
            target.value = embed;
            target.style.display = 'block';
            target.select();
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(embed).catch(function() {});
        }
        if (EP.UI && EP.UI.toast) EP.UI.toast('Embed final generado');
    }

    function normalizeSearchText(str) {
        return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function filterCatalog(query) {
        var catalog = document.getElementById('website-modules-catalog');
        if (!catalog) return;
        var q = normalizeSearchText(query);
        Array.prototype.forEach.call(catalog.querySelectorAll('.ss-template-card'), function(card) {
            var text = normalizeSearchText(card.textContent || '');
            card.style.display = (!q || text.indexOf(q) !== -1) ? '' : 'none';
        });
    }

    function bindSearch() {
        var search = document.getElementById('effects-search');
        var clear = document.getElementById('effects-search-clear');
        if (!search) return;
        search.addEventListener('input', function() {
            if (state.active) filterCatalog(search.value);
        });
        if (clear) clear.addEventListener('click', function() {
            if (state.active) filterCatalog('');
        });
    }

    function init() {
        renderCatalog();
        renderModulePicker();
        bindSearch();
        var btn = document.getElementById('mode-btn-website-modules');
        var btnEffects = document.getElementById('mode-btn-effects');
        var btnScroll = document.getElementById('mode-btn-scroll-sections');
        var btnRubik = document.getElementById('mode-btn-rubik-tools');
        if (btn) btn.addEventListener('click', activate);
        if (btnEffects) btnEffects.addEventListener('click', deactivate);
        if (btnScroll) btnScroll.addEventListener('click', deactivate);
        if (btnRubik) btnRubik.addEventListener('click', deactivate);
        var htmlBtn = document.getElementById('wm-export-html-btn');
        var zipBtn = document.getElementById('wm-export-zip-btn');
        var embedBtn = document.getElementById('wm-copy-embed-btn');
        if (htmlBtn) htmlBtn.addEventListener('click', exportHTML);
        if (zipBtn) zipBtn.addEventListener('click', exportZIP);
        if (embedBtn) embedBtn.addEventListener('click', copyEmbed);
        var picker = document.getElementById('wm-module-picker');
        if (picker) picker.addEventListener('change', function() { selectModule(picker.value); });
    }

    EP.WebsiteModulesUI = {
        init: init,
        activate: activate,
        deactivate: deactivate,
        selectModule: selectModule,
        refresh: function() { if (state.active) renderPreview(); }
    };
})();
