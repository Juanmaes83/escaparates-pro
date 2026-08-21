// Living Art PRO — standalone Website Modules bridge.
// Painterly + Living Marks capability family from Museum Living Art donors.
// Donor provenance: wet-paint-flow (MIT) + van-gogh-crows (MIT code).
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    var ID = 'living-art-pro';
    var PATH = 'labs/website-modules-source/living-art-pro/index.html';

    function escapeAttr(value) {
        return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function buildFallbackDocument() {
        var src = escapeAttr(PATH);
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Living Art PRO</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;background:#0a0908}body{overflow:hidden}</style></head><body><iframe title="Living Art PRO" src="' + src + '" allow="autoplay; fullscreen" allowfullscreen></iframe></body></html>';
    }

    EP.WebsiteModules.register({
        id: ID,
        name: 'Living Art PRO',
        icon: 'LA',
        family: 'Painterly / Living',
        description: 'Pintura viva interactiva con trazos Bezier impasto, marcas boid reactivas al cursor y controles semanticos de intensidad, escala, humedad y movimiento.',
        sourceFile: PATH + ' · Museum Living Art donors (MIT)',
        mediaMap: 'Editor propio: imagen de origen, controles de pintura, impasto, movimiento y respuesta al cursor.',
        standalonePath: PATH,
        standaloneEditorNote: 'Editor completo dentro del preview. Arrastra una imagen para transformarla en pintura viva con trazos Bezier, material impasto y marcas de flock reactivas. Controles semanticos: intensidad, escala, humedad, impasto, cantidad viva, caracter de movimiento y respuesta.',
        standaloneActions: {
            html: 'downloadHtml',
            zip: 'downloadZip',
            embed: 'copyEmbed'
        },
        fields: [],
        build: function() {
            return buildFallbackDocument();
        }
    });
})();
