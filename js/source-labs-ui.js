(function() {
    var state = { active: false, id: null, options: {} };
    var channel = 'escaparates-pro-source-lab';

    function lab() { return EP.SourceLabs && EP.SourceLabs.get(state.id); }
    function options(id) {
        if (state.options[id]) return state.options[id];
        var source = EP.SourceLabs.get(id);
        var values = {};
        (source.fields || []).forEach(function(field) { values[field.key] = field.default || ''; });
        state.options[id] = values;
        return values;
    }
    function assets() {
        return (EP.Media && EP.Media.getAll ? EP.Media.getAll() : []).map(function(item) {
            return item ? { url: item.url || (item.element && item.element.src) || '', type: item.type || 'image', name: item.name || 'asset' } : null;
        }).filter(Boolean);
    }
    function frame() { return document.getElementById('sl-preview-frame'); }
    function sendConfig() {
        var target = frame();
        var source = lab();
        if (!target || !target.contentWindow || !source) return;
        target.contentWindow.postMessage({ channel: channel, type: 'source-lab-config', payload: { config: options(source.id), assets: assets() } }, '*');
    }
    function renderCatalog() {
        var box = document.getElementById('source-labs-catalog');
        if (!box || !EP.SourceLabs) return;
        box.innerHTML = '<div class="ss-catalog-section-header">Source Labs - motores completos</div>';
        EP.SourceLabs.getAll().forEach(function(source) {
            var card = document.createElement('div');
            card.className = 'ss-template-card' + (source.id === state.id ? ' active' : '');
            card.setAttribute('data-source-lab', source.id);
            card.innerHTML = '<span class="ss-icon">' + source.icon + '</span><div><div class="ss-name">' + source.name + '</div><div class="ss-desc">' + source.family + ' - ' + source.description + '</div></div>';
            card.onclick = function() { select(source.id); };
            box.appendChild(card);
        });
    }
    function renderFields() {
        var source = lab();
        var box = document.getElementById('sl-props-fields');
        var title = document.getElementById('sl-props-title');
        var note = document.getElementById('sl-source-note');
        if (!source || !box) return;
        box.innerHTML = '';
        if (title) title.textContent = source.name.toUpperCase();
        (source.fields || []).forEach(function(field) {
            var row = document.createElement('div');
            row.className = 'wm-field';
            var label = document.createElement('label');
            label.textContent = field.label;
            var input = document.createElement(field.type === 'textarea' ? 'textarea' : field.type === 'select' ? 'select' : 'input');
            if (field.type !== 'textarea' && field.type !== 'select') input.type = field.type;
            if (field.type === 'select') {
                (field.options || []).forEach(function(optionValue) {
                    var option = document.createElement('option');
                    option.value = optionValue;
                    option.textContent = optionValue;
                    input.appendChild(option);
                });
            }
            if (field.type === 'range') {
                input.min = field.min;
                input.max = field.max;
                input.step = field.step;
            }
            input.value = options(source.id)[field.key];
            input.oninput = function() { options(source.id)[field.key] = field.type === 'range' ? Number(input.value) : input.value; sendConfig(); };
            input.onchange = input.oninput;
            row.appendChild(label);
            if (field.type === 'range') {
                var rangeRow = document.createElement('div');
                rangeRow.className = 'wm-range-row';
                var output = document.createElement('span');
                output.className = 'wm-range-value';
                output.textContent = input.value + (field.suffix || '');
                input.addEventListener('input', function() { output.textContent = input.value + (field.suffix || ''); });
                rangeRow.appendChild(input); rangeRow.appendChild(output); row.appendChild(rangeRow);
            } else {
                row.appendChild(input);
            }
            box.appendChild(row);
        });
        if (note) note.textContent = source.note;
    }
    function select(id) {
        var source = EP.SourceLabs.get(id);
        if (!source) return;
        state.id = id; options(id); renderCatalog(); renderFields();
        var target = frame();
        target.onload = function() { sendConfig(); };
        target.src = source.path + '?v=' + Date.now();
    }
    function deactivateOtherModes() {
        if (EP.WebsiteModulesUI) EP.WebsiteModulesUI.deactivate();
        if (EP.SectorBlueprintsUI) EP.SectorBlueprintsUI.deactivate();
        if (EP.ScrollSectionsUI) EP.ScrollSectionsUI.setMode('effects');
        document.body.classList.remove('mode-rubik-tools');
        var rubik = document.getElementById('rubik-tools-stage');
        if (rubik) rubik.classList.remove('active');
        var rubikButton = document.getElementById('mode-btn-rubik-tools');
        if (rubikButton) rubikButton.classList.remove('active');
    }
    function activate() {
        if (state.active) return;
        state.active = true; deactivateOtherModes();
        document.body.classList.add('mode-source-labs');
        ['mode-btn-effects','mode-btn-scroll-sections','mode-btn-website-modules','mode-btn-sector-blueprints'].forEach(function(id) { var button = document.getElementById(id); if (button) button.classList.remove('active'); });
        document.getElementById('mode-btn-source-labs').classList.add('active');
        document.getElementById('source-labs-stage').classList.add('active');
        document.getElementById('source-labs-props').style.display = 'block';
        var heading = document.querySelector('#effects-panel .panel-header h2');
        if (heading) heading.textContent = 'Source Labs';
        if (EP.Timeline && EP.Timeline.pause) EP.Timeline.pause();
        if (!state.id) select('glitchify-image-pro'); else { renderCatalog(); renderFields(); select(state.id); }
    }
    function deactivate() {
        if (!state.active) return;
        state.active = false;
        document.body.classList.remove('mode-source-labs');
        document.getElementById('source-labs-stage').classList.remove('active');
        document.getElementById('source-labs-props').style.display = 'none';
        document.getElementById('mode-btn-source-labs').classList.remove('active');
        var heading = document.querySelector('#effects-panel .panel-header h2');
        if (heading) heading.textContent = 'Efectos';
    }
    function init() {
        var button = document.getElementById('mode-btn-source-labs');
        if (!button) return;
        button.onclick = activate;
        ['mode-btn-effects','mode-btn-scroll-sections','mode-btn-website-modules','mode-btn-sector-blueprints','mode-btn-rubik-tools'].forEach(function(id) { var item = document.getElementById(id); if (item) item.addEventListener('click', deactivate); });
        document.getElementById('sl-refresh-asset-btn').onclick = sendConfig;
        window.addEventListener('message', function(event) {
            var message = event.data || {};
            if (message.channel === channel && message.type === 'source-lab-ready' && state.active) sendConfig();
        });
    }
    EP.SourceLabsUI = { init: init, activate: activate, deactivate: deactivate, refresh: sendConfig };
})();
