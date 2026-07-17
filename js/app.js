// Escaparates Pro — Main bootstrap
(function() {
    function loadProjectCloudProduct() {
        if (document.querySelector('script[data-project-cloud-product]')) return;
        var script = document.createElement('script');
        script.src = 'js/projects/product-integration.js';
        script.async = false;
        script.setAttribute('data-project-cloud-product', 'true');
        script.onload = function() {
            try { if (EP.ProjectCloudProduct) EP.ProjectCloudProduct.init(); }
            catch (e) { console.error('ProjectCloudProduct.init failed:', e); }
        };
        script.onerror = function() { console.error('Project Cloud product integration could not be loaded'); };
        document.head.appendChild(script);
    }

    function boot() {
        try { EP.Core.init(); } catch(e) { console.error('Core.init failed:', e); }
        try { EP.Timeline.init(); } catch(e) { console.error('Timeline.init failed:', e); }
        try { if (EP.PerformancePath) EP.PerformancePath.init(); } catch(e) { console.error('PerformancePath.init failed:', e); }
        try { if (EP.PlanGate) EP.PlanGate.bindUI(); } catch(e) { console.error('PlanGate.bindUI failed:', e); }
        try { if (EP.AuthClient) EP.AuthClient.init(); } catch(e) { console.error('AuthClient.init failed:', e); }
        try { EP.Media.init(); } catch(e) { console.error('Media.init failed:', e); }
        try { EP.UI.init(); } catch(e) { console.error('UI.init failed:', e); }
        try { EP.Overlay.init(); } catch(e) { console.error('Overlay.init failed:', e); }
        try { if (EP.Audio) EP.Audio.init(); } catch(e) { console.error('Audio.init failed:', e); }
        try { EP.Export.init(); } catch(e) { console.error('Export.init failed:', e); }
        try { if (EP.DemoAssets) EP.DemoAssets.init(); } catch(e) { console.error('DemoAssets.init failed:', e); }
        try { if (EP.TimelineVisual) EP.TimelineVisual.init(); } catch(e) { console.error('TimelineVisual.init failed:', e); }
        try { if (EP.VisualPipeline) EP.VisualPipeline.init(); } catch(e) { console.error('VisualPipeline.init failed:', e); }
        try { if (EP.CatalogUX) EP.CatalogUX.init(); } catch(e) { console.error('CatalogUX.init failed:', e); }
        try { if (EP.PipelinePro) EP.PipelinePro.init(); } catch(e) { console.error('PipelinePro.init failed:', e); }
        try { if (EP.ScrollSectionsUI) EP.ScrollSectionsUI.init(); } catch(e) { console.error('ScrollSectionsUI.init failed:', e); }
        try { if (EP.RubikToolsUI) EP.RubikToolsUI.init(); } catch(e) { console.error('RubikToolsUI.init failed:', e); }
        try { if (EP.WebsiteModulesUI) EP.WebsiteModulesUI.init(); } catch(e) { console.error('WebsiteModulesUI.init failed:', e); }
        try { if (EP.SectorBlueprintsUI) EP.SectorBlueprintsUI.init(); } catch(e) { console.error('SectorBlueprintsUI.init failed:', e); }
        try { if (EP.SourceLabsUI) EP.SourceLabsUI.init(); } catch(e) { console.error('SourceLabsUI.init failed:', e); }
        try { if (EP.PlatformInfo) EP.PlatformInfo.init(); } catch(e) { console.error('PlatformInfo.init failed:', e); }
        loadProjectCloudProduct();

        EP.Media.onChange(function() {
            EP.UI.rebuildCurrent();
            if (EP.UI.refreshCurrentControls) EP.UI.refreshCurrentControls();
            if (EP.WebsiteModulesUI && EP.WebsiteModulesUI.refresh) EP.WebsiteModulesUI.refresh();
            if (EP.SourceLabsUI && EP.SourceLabsUI.refresh) EP.SourceLabsUI.refresh();
        });

        EP.Timeline.onTick(function(time, dt, loopDuration) {
            var effect = EP.UI.getCurrentEffect();
            if (effect) {
                if (EP.Audio && EP.Audio.isActive()) EP.Audio.analyzeFrame();
                var audioMult = EP.Audio ? EP.Audio.getEnergyMultiplier() : 1;
                EP.RenderPipeline.updateEffect(effect, time, dt * audioMult, loopDuration);
            }
        });

        setTimeout(function() {
            EP.UI.selectEffect('showcase-stream');
            EP.Timeline.play();
        }, 500);

        document.addEventListener('keydown', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.code === 'Space') { e.preventDefault(); EP.Timeline.toggle(); }
        });

        var btnSZ = document.getElementById('btn-safe-zone');
        var szOverlay = document.getElementById('safe-zone-overlay');
        if (btnSZ && szOverlay) {
            btnSZ.addEventListener('click', function() {
                var active = szOverlay.style.display !== 'none';
                szOverlay.style.display = active ? 'none' : 'block';
                btnSZ.classList.toggle('active', !active);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();