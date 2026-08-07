// Escaparates Pro — Interactive Boards first-level workspace.
(function() {
    'use strict';
    window.EP = window.EP || {};
    var state = { active: false, activeId: null };

    function board() { return EP.InteractiveBoards && state.activeId ? EP.InteractiveBoards.get(state.activeId) : null; }
    function frame() { return document.getElementById('interactive-boards-frame'); }
    function stage() { return document.getElementById('interactive-boards-stage'); }

    function renderCatalog() {
        var catalog = document.getElementById('interactive-boards-catalog');
        if (!catalog || !EP.InteractiveBoards) return;
        var boards = EP.InteractiveBoards.getAll();
        catalog.innerHTML = '';

        var head = document.createElement('div');
        head.className = 'ib-catalog-head';
        head.innerHTML = '<span>ESCAPARATES PRO</span><strong>Interactive Boards</strong><small>' + boards.length + ' board' + (boards.length === 1 ? '' : 's') + '</small>';
        catalog.appendChild(head);

        var list = document.createElement('div');
        list.className = 'ib-catalog-list';
        boards.forEach(function(item) {
            var card = document.createElement('button');
            card.type = 'button';
            card.className = 'ib-board-card' + (item.id === state.activeId ? ' active' : '');
            card.setAttribute('data-interactive-board', item.id);
            card.innerHTML = '<span class="ib-board-icon">' + item.icon + '</span><span class="ib-board-copy"><strong>' + item.shortName + '</strong><small>' + item.description + '</small></span>';
            card.addEventListener('click', function() { select(item.id); });
            list.appendChild(card);
        });
        catalog.appendChild(list);

        var current = board();
        if (current) {
            var meta = document.createElement('div');
            meta.className = 'ib-catalog-meta';
            meta.innerHTML = '<span>Presets</span><strong>' + current.presets.length + '</strong><span>Outputs</span><strong>' + current.outputs.length + '</strong>';
            catalog.appendChild(meta);

            var open = document.createElement('a');
            open.className = 'ib-open-direct';
            open.href = current.path;
            open.target = '_blank';
            open.rel = 'noopener';
            open.textContent = 'Abrir módulo directo ↗';
            catalog.appendChild(open);
        }
    }

    function select(id) {
        if (!EP.InteractiveBoards) return;
        var item = EP.InteractiveBoards.get(id);
        if (!item) return;
        state.activeId = id;
        renderCatalog();
        var target = frame();
        if (!target) return;
        if (target.getAttribute('data-board-id') !== id) {
            target.setAttribute('data-board-id', id);
            target.src = item.path;
        }
    }

    function clearOtherModeButtons() {
        ['mode-btn-effects','mode-btn-scroll-sections','mode-btn-website-modules','mode-btn-sector-blueprints','mode-btn-source-labs','mode-btn-rubik-tools'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
    }

    function deactivateRubikSafely() {
        if (!document.body.classList.contains('mode-rubik-tools')) return;
        if (EP.RubikToolsUI && EP.RubikToolsUI.deactivate) {
            try { EP.RubikToolsUI.deactivate(); return; } catch (e) {}
        }
        // RUBIK's current controller keeps its `active` flag private. Clicking the
        // existing Effects route invokes RUBIK's own registered deactivate handler,
        // keeping its private state coherent without modifying that subsystem.
        var effectsButton = document.getElementById('mode-btn-effects');
        if (effectsButton) effectsButton.click();
        else {
            document.body.classList.remove('mode-rubik-tools');
            var rubikStage = document.getElementById('rubik-tools-stage');
            var rubikButton = document.getElementById('mode-btn-rubik-tools');
            if (rubikStage) rubikStage.classList.remove('active');
            if (rubikButton) rubikButton.classList.remove('active');
        }
    }

    function deactivateOtherModes() {
        deactivateRubikSafely();
        try { if (EP.WebsiteModulesUI && EP.WebsiteModulesUI.deactivate) EP.WebsiteModulesUI.deactivate(); } catch (e) {}
        try { if (EP.SectorBlueprintsUI && EP.SectorBlueprintsUI.deactivate) EP.SectorBlueprintsUI.deactivate(); } catch (e) {}
        try { if (EP.SourceLabsUI && EP.SourceLabsUI.deactivate) EP.SourceLabsUI.deactivate(); } catch (e) {}
        try { if (EP.ScrollSectionsUI && EP.ScrollSectionsUI.setMode) EP.ScrollSectionsUI.setMode('effects'); } catch (e) {}
        document.body.classList.remove('mode-rubik-tools','mode-website-modules','mode-sector-blueprints','mode-source-labs','mode-scroll-sections');
        var rubikStage = document.getElementById('rubik-tools-stage');
        if (rubikStage) rubikStage.classList.remove('active');
        clearOtherModeButtons();
    }

    function activate() {
        if (state.active) return;
        // Keep state false while other modes deactivate: some of them use the
        // Effects button as their public exit route and that button also listens
        // to our own deactivate handler.
        deactivateOtherModes();
        state.active = true;
        document.body.classList.add('mode-interactive-boards');
        var targetStage = stage();
        if (targetStage) targetStage.classList.add('active');
        var button = document.getElementById('mode-btn-interactive-boards');
        if (button) button.classList.add('active');
        if (EP.Timeline && EP.Timeline.pause) EP.Timeline.pause();
        if (!state.activeId) {
            var first = EP.InteractiveBoards && EP.InteractiveBoards.getAll()[0];
            if (first) select(first.id);
        } else {
            renderCatalog();
            select(state.activeId);
        }
    }

    function deactivate() {
        if (!state.active) return;
        state.active = false;
        document.body.classList.remove('mode-interactive-boards');
        var targetStage = stage();
        if (targetStage) targetStage.classList.remove('active');
        var button = document.getElementById('mode-btn-interactive-boards');
        if (button) button.classList.remove('active');
        // Effects is the neutral/base surface. Specific mode controllers that are
        // being clicked next will immediately replace this active state themselves.
        var effectsButton = document.getElementById('mode-btn-effects');
        if (effectsButton) effectsButton.classList.add('active');
    }

    function init() {
        var button = document.getElementById('mode-btn-interactive-boards');
        if (!button || !EP.InteractiveBoards) return;
        button.addEventListener('click', activate);
        ['mode-btn-effects','mode-btn-scroll-sections','mode-btn-website-modules','mode-btn-sector-blueprints','mode-btn-source-labs','mode-btn-rubik-tools'].forEach(function(id) {
            var other = document.getElementById(id);
            if (other) other.addEventListener('click', deactivate);
        });
        renderCatalog();
    }

    EP.InteractiveBoardsUI = { init: init, activate: activate, deactivate: deactivate, select: select };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
