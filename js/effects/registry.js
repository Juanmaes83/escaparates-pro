EP.Registry = (function() {
    var effects = {};
    var duplicateIds = [];
    var categories = [
        { id: '3d-perspective', name: '3D & Perspective', icon: '🎲' },
        { id: 'carousel-flow', name: 'Carousel & Flow', icon: '🎠' },
        { id: 'grid', name: 'Grid', icon: '⊞' },
        { id: 'stack-scatter', name: 'Stack & Scatter', icon: '🃏' },
        { id: 'spotlight-focus', name: 'Spotlight & Focus', icon: '🔦' },
        { id: 'reveal-wipe', name: 'Reveal & Wipe', icon: '✨' },
        { id: 'glassmorphism', name: 'Glassmorphism', icon: '💎' },
        { id: 'parallax', name: 'Parallax', icon: '🏔️' },
        { id: 'motion', name: 'Motion', icon: '☁️' }
    ];

    function normalizeControls(effect) {
        if (!effect || !effect.controlsDef) return effect;

        var hasMotionDirection = false;
        var hasRecordDefaultMotion = false;
        var capabilities = effect.capabilities || {};

        effect.controlsDef.forEach(function(ctrl) {
            if (ctrl.key === 'playbackMotion') {
                ctrl.label = 'Motion Enabled';
            } else if (ctrl.key === 'playbackMotionSpeed') {
                ctrl.label = 'Motion Speed';
            } else if (ctrl.key === 'motionDirection') {
                hasMotionDirection = true;
            } else if (ctrl.key === 'recordDefaultMotion') {
                hasRecordDefaultMotion = true;
            }
        });

        if (!hasMotionDirection && capabilities.supportsMotionDirection) {
            effect.controlsDef.splice(Math.min(3, effect.controlsDef.length), 0, {
                key: 'motionDirection',
                type: 'select',
                options: [
                    { v: 'auto', l: 'Auto / Original' },
                    { v: 'left-right', l: 'Izquierda a derecha' },
                    { v: 'right-left', l: 'Derecha a izquierda' },
                    { v: 'top-bottom', l: 'Arriba a abajo' },
                    { v: 'bottom-top', l: 'Abajo a arriba' },
                    { v: 'radial-in', l: 'Entrada radial' },
                    { v: 'radial-out', l: 'Salida radial' }
                ],
                default: 'auto',
                label: 'Motion Direction'
            });
            effect.settings.motionDirection = effect.settings.motionDirection || 'auto';
        }

        if (!hasRecordDefaultMotion) {
            effect.controlsDef.splice(Math.min(4, effect.controlsDef.length), 0, {
                key: 'recordDefaultMotion',
                type: 'select',
                options: [
                    { v: 'on', l: 'Grabar movimiento' },
                    { v: 'off', l: 'No grabar' }
                ],
                default: 'on',
                label: 'Record Default Motion'
            });
            effect.settings.recordDefaultMotion = effect.settings.recordDefaultMotion || 'on';
        }

        return effect;
    }

    function inferCapabilities(effect) {
        var caps = Object.assign({
            supportsMotionDirection: false,
            supportsVideo: false,
            usesCamera: false,
            usesPostProcessing: false,
            usesParticlesShaders: false,
            mobileRisk: 'medium',
            minMedia: 1,
            exportSafe: true,
            hasErrorBoundary: true
        }, effect.capabilities || {});

        var text = '';
        try {
            text += effect.build ? effect.build.toString() : '';
            text += effect.update ? effect.update.toString() : '';
            text += effect.dispose ? effect.dispose.toString() : '';
        } catch (e) {}

        var controls = (effect.controlsDef || []).map(function(c) { return c.key; }).join(' ');
        var metaCategory = effect.meta && effect.meta.category;
        caps.usesCamera = caps.usesCamera || /\bEP\.Core\.camera\b|camera\.position|camera\.fov|lookAt\s*\(/.test(text);
        caps.usesPostProcessing = caps.usesPostProcessing || /setPostProcessing|postProcessing|bloom|vignette|EffectComposer|ShaderPass/i.test(text);
        caps.usesParticlesShaders = caps.usesParticlesShaders || /ShaderMaterial|Points\s*\(|PointsMaterial|InstancedMesh|particle|particles|vertexShader|fragmentShader|gl_FragColor|uniforms\s*:/i.test(text);
        caps.supportsVideo = caps.supportsVideo || /VideoTexture|type\s*===\s*['"]video['"]|mediaObj\.type\s*===\s*['"]video['"]|EP\.Media\.createMaterial|createTexture/i.test(text);
        caps.supportsMotionDirection = caps.supportsMotionDirection || /motionDirection|direction/.test(text + controls);
        caps.exportSafe = caps.exportSafe && !/localStorage|sessionStorage/.test(text);

        var riskScore = 0;
        if (caps.usesCamera || metaCategory === '3d-perspective') riskScore += 2;
        if (caps.usesPostProcessing) riskScore += 2;
        if (caps.usesParticlesShaders) riskScore += 2;
        if (caps.supportsVideo) riskScore += 1;
        if (/count|density|segments|particles|layers|photosPerLayer|imagesPerLayer/i.test(controls + text)) riskScore += 1;
        caps.mobileRisk = riskScore >= 6 ? 'high' : riskScore >= 3 ? 'medium' : 'low';

        effect.capabilities = caps;
        return caps;
    }

    function resolveDuplicateId(effect) {
        if (!effects[effect.id]) return;
        var originalId = effect.id;
        var suffix = effect.meta && effect.meta.category ? effect.meta.category : 'copy';
        var nextId = originalId + '-' + suffix;
        var idx = 2;
        while (effects[nextId]) {
            nextId = originalId + '-' + suffix + '-' + idx;
            idx++;
        }
        duplicateIds.push({ originalId: originalId, resolvedId: nextId });
        console.warn('Duplicate effect id resolved:', originalId, '->', nextId);
        effect.id = nextId;
    }

    function register(effect) {
        if (typeof document !== 'undefined' && document.currentScript && !effect.sourcePath) {
            effect.sourcePath = document.currentScript.getAttribute('src') || document.currentScript.src || '';
        }
        resolveDuplicateId(effect);
        inferCapabilities(effect);
        normalizeControls(effect);
        if (EP.ControlSchema) {
            effect.controlsDef = EP.ControlSchema.normalizeControls(effect.controlsDef);
            effect.settings = EP.ControlSchema.validateSettings(effect, effect.settings);
        }
        effects[effect.id] = effect;
    }

    function get(id) {
        return effects[id] || null;
    }

    function getAll() {
        return effects;
    }

    function getDuplicateIds() {
        return duplicateIds.slice();
    }

    function getByCategory(catId) {
        var result = [];
        for (var id in effects) {
            if (effects[id].meta.category === catId) result.push(effects[id]);
        }
        return result;
    }

    function getCategories() {
        return categories;
    }

    function search(query) {
        query = query.toLowerCase();
        var result = [];
        for (var id in effects) {
            var e = effects[id];
            if (e.meta.name.toLowerCase().indexOf(query) !== -1 ||
                e.meta.description.toLowerCase().indexOf(query) !== -1) {
                result.push(e);
            }
        }
        return result;
    }

    return {
        register: register,
        get: get,
        getAll: getAll,
        getDuplicateIds: getDuplicateIds,
        getByCategory: getByCategory,
        getCategories: getCategories,
        search: search
    };
})();
