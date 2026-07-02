var EP = window.EP || {};
window.EP = EP;

EP.PlanGate = (function() {
    var plans = {
        demo: {
            id: 'demo',
            label: 'Demo',
            maxUserAssets: 0,
            maxAssetMB: 0,
            maxVideoSeconds: 0,
            maxResolution: 1200,
            canUploadAssets: false,
            canUploadLogo: false,
            canExport: false,
            canPublish: false,
            canUseDemoAssets: true,
            message: 'Modo demo: puedes probar efectos con assets de ejemplo, pero no subir ni exportar.'
        },
        free: {
            id: 'free',
            label: 'Free',
            maxUserAssets: 3,
            maxAssetMB: 5,
            maxVideoSeconds: 10,
            maxResolution: 1920,
            canUploadAssets: true,
            canUploadLogo: false,
            canExport: true,
            canPublish: false,
            canUseDemoAssets: true,
            message: 'Plan Free: 3 assets propios, export final descargable, sin logo ni publicar URL.'
        },
        pro: {
            id: 'pro',
            label: 'Pro',
            maxUserAssets: 15,
            maxAssetMB: 50,
            maxVideoSeconds: 60,
            maxResolution: 4096,
            canUploadAssets: true,
            canUploadLogo: true,
            canExport: true,
            canPublish: true,
            canUseDemoAssets: true,
            message: 'Plan Pro: assets, logo, export y publicacion habilitados.'
        },
        blocked: {
            id: 'blocked',
            label: 'Bloqueado',
            maxUserAssets: 0,
            maxAssetMB: 0,
            maxVideoSeconds: 0,
            maxResolution: 0,
            canUploadAssets: false,
            canUploadLogo: false,
            canExport: false,
            canPublish: false,
            canUseDemoAssets: false,
            message: 'Cuenta bloqueada: contacta soporte o actualiza el plan para continuar.'
        },
        'limit-reached': {
            id: 'limit-reached',
            label: 'Limite alcanzado',
            maxUserAssets: 3,
            maxAssetMB: 5,
            maxVideoSeconds: 10,
            maxResolution: 1920,
            canUploadAssets: false,
            canUploadLogo: false,
            canExport: true,
            canPublish: false,
            canUseDemoAssets: true,
            message: 'Limite alcanzado: puedes exportar lo actual, pero no subir mas assets.'
        }
    };

    var currentId = readPlanId();
    var userAssetCount = 0;
    var listeners = [];

    function readPlanId() {
        try {
            var params = new URLSearchParams(window.location.search || '');
            var fromUrl = params.get('plan');
            var fromStorage = window.localStorage && localStorage.getItem('ep-plan');
            return plans[fromUrl] ? fromUrl : plans[fromStorage] ? fromStorage : 'pro';
        } catch (e) {
            return 'pro';
        }
    }

    function getPlan() {
        return plans[currentId] || plans.pro;
    }

    function setPlan(id) {
        if (!plans[id]) id = 'pro';
        currentId = id;
        try { localStorage.setItem('ep-plan', id); } catch (e) {}
        notify();
        return getPlan();
    }

    function setUserAssetCount(count) {
        userAssetCount = Math.max(0, count || 0);
        notify();
    }

    function getState() {
        var plan = getPlan();
        return {
            plan: plan,
            userAssetCount: userAssetCount,
            remainingAssets: Math.max(0, plan.maxUserAssets - userAssetCount),
            uploadAssets: plan.canUploadAssets && userAssetCount < plan.maxUserAssets,
            uploadLogo: !!plan.canUploadLogo,
            exportFinal: !!plan.canExport,
            publish: !!plan.canPublish
        };
    }

    function can(feature) {
        var state = getState();
        if (feature === 'upload-assets') return state.uploadAssets;
        if (feature === 'upload-logo') return state.uploadLogo;
        if (feature === 'publish') return state.publish;
        if (feature === 'export') return state.exportFinal;
        return true;
    }

    function reason(feature) {
        var plan = getPlan();
        if (plan.id === 'blocked') return plan.message;
        if (feature === 'upload-assets' && !plan.canUploadAssets) return 'Tu plan no permite subir assets propios. Puedes probar con assets demo.';
        if (feature === 'upload-assets' && userAssetCount >= plan.maxUserAssets) return 'Has alcanzado el limite de assets del plan ' + plan.label + '.';
        if (feature === 'upload-logo' && !plan.canUploadLogo) return 'Subir logo requiere plan Pro.';
        if (feature === 'publish' && !plan.canPublish) return 'Publicar URL requiere plan Pro.';
        if (feature === 'export' && !plan.canExport) return 'Exportar resultado requiere activar un plan.';
        return plan.message;
    }

    function validateFile(file, metadata, kind) {
        var plan = getPlan();
        metadata = metadata || {};
        kind = kind || 'asset';
        var errors = [];
        var warnings = [];

        if (kind === 'logo' && !can('upload-logo')) errors.push(reason('upload-logo'));
        if (kind !== 'logo' && !can('upload-assets')) errors.push(reason('upload-assets'));

        var mb = file && file.size ? file.size / (1024 * 1024) : 0;
        if (plan.maxAssetMB && mb > plan.maxAssetMB) errors.push('El archivo pesa ' + mb.toFixed(1) + ' MB; limite del plan: ' + plan.maxAssetMB + ' MB.');

        var width = metadata.width || 0;
        var height = metadata.height || 0;
        if (plan.maxResolution && Math.max(width, height) > plan.maxResolution) {
            errors.push('Resolucion ' + width + 'x' + height + ' supera el limite del plan: ' + plan.maxResolution + ' px por lado.');
        }

        if (metadata.duration && plan.maxVideoSeconds && metadata.duration > plan.maxVideoSeconds) {
            errors.push('Video de ' + metadata.duration.toFixed(1) + 's supera el limite del plan: ' + plan.maxVideoSeconds + 's.');
        }

        if (file && kind !== 'logo' && !/^image\/|^video\//.test(file.type || '')) errors.push('Codec/tipo no compatible: ' + (file.type || 'desconocido') + '.');
        if (file && kind === 'logo' && !/^image\//.test(file.type || '')) errors.push('El logo debe ser una imagen.');
        if (metadata.duration && !/^video\//.test(file.type || '')) warnings.push('Duracion detectada en un archivo no marcado como video.');

        return { ok: errors.length === 0, errors: errors, warnings: warnings };
    }

    function onChange(fn) {
        listeners.push(fn);
    }

    function notify() {
        listeners.forEach(function(fn) { fn(getState()); });
    }

    function renderStatus() {
        var el = document.getElementById('plan-status');
        if (!el) return;
        var state = getState();
        var plan = state.plan;
        el.innerHTML =
            '<div class="plan-row"><strong>' + escapeHTML(plan.label) + '</strong><span>' + state.userAssetCount + '/' + plan.maxUserAssets + ' assets</span></div>' +
            '<div class="plan-message">' + escapeHTML(plan.message) + '</div>' +
            '<div class="plan-grid">' +
            '<span class="' + (state.uploadAssets ? 'ok' : 'locked') + '">Assets</span>' +
            '<span class="' + (state.uploadLogo ? 'ok' : 'locked') + '">Logo</span>' +
            '<span class="' + (state.exportFinal ? 'ok' : 'locked') + '">Export</span>' +
            '<span class="' + (state.publish ? 'ok' : 'locked') + '">Publicar</span>' +
            '</div>';

        var select = document.getElementById('plan-simulator');
        if (select && select.value !== plan.id) select.value = plan.id;
        syncControls(state);
    }

    function syncControls(state) {
        var exportBtn = document.getElementById('btn-export');
        if (exportBtn) {
            exportBtn.disabled = !state.exportFinal;
            exportBtn.title = state.exportFinal ? 'Exportar pieza' : reason('export');
        }
        var logoBtn = document.getElementById('upload-logo-btn');
        if (logoBtn) {
            logoBtn.disabled = !state.uploadLogo;
            logoBtn.title = state.uploadLogo ? 'Subir logo' : reason('upload-logo');
        }
    }

    function bindUI() {
        var select = document.getElementById('plan-simulator');
        if (select) {
            select.value = getPlan().id;
            select.addEventListener('change', function() { setPlan(this.value); });
        }
        onChange(renderStatus);
        renderStatus();
    }

    function escapeHTML(s) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(String(s || '')));
        return d.innerHTML;
    }

    return {
        bindUI: bindUI,
        can: can,
        getPlan: getPlan,
        getState: getState,
        setPlan: setPlan,
        setUserAssetCount: setUserAssetCount,
        reason: reason,
        validateFile: validateFile,
        onChange: onChange
    };
})();
