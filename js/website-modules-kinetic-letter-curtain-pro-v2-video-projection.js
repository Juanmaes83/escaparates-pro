// Kinetic Letter Curtain PRO V2 — Video Projection — standalone Website Modules bridge.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    var ID = 'kinetic-letter-curtain-pro-v2-video-projection';
    var PATH = 'labs/website-modules-source/kinetic-letter-curtain-pro-v2-video-projection/index.html';

    function escapeAttr(value) {
        return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function buildFallbackDocument() {
        var src = escapeAttr(PATH);
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kinetic Letter Curtain PRO V2 — Video Projection</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;background:#eee7da}body{overflow:hidden}</style></head><body><iframe title="Kinetic Letter Curtain PRO V2 — Video Projection" src="' + src + '" allow="autoplay; fullscreen; display-capture" allowfullscreen></iframe></body></html>';
    }

    EP.WebsiteModules.register({
        id: ID,
        name: 'Kinetic Letter Curtain PRO V2 — Video Projection',
        icon: 'V2',
        family: 'Canvas / Video Projection Typography',
        description: 'Cortina tipografica fisica con video proyectado dentro de las letras, malla visual de alta densidad y perfiles de rendimiento.',
        sourceFile: PATH + ' · V2 aprobada · SHA-256 4b96f27ccc328a4d5c9173872abf17410abceceb5ffea0f2e14facc3a435497c',
        mediaMap: 'Editor propio: todo V1.1 + video projection por escena, densidad visual, glyph scale/weight, FPS, sampling, fit y correccion de imagen.',
        standalonePath: PATH,
        standaloneEditorNote: 'Modulo V2 independiente. Mantiene V1.1 intacta y añade Video Projection: OFF, Static Image, Balanced y High Quality, con malla visual desacoplada de la fisica y limites automaticos en movil.',
        standaloneActions: {
            html: 'downloadFinalHtmlBtn',
            zip: 'downloadClientZipBtn',
            embed: 'copyEmbedBtn'
        },
        fields: [],
        build: function() {
            return buildFallbackDocument();
        }
    });
})();
