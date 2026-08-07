// Kinetic Letter Curtain PRO V1.1 — standalone Website Modules bridge.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    var ID = 'kinetic-letter-curtain-pro';
    var PATH = 'labs/website-modules-source/kinetic-letter-curtain-pro/index.html';

    function escapeAttr(value) {
        return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function buildFallbackDocument() {
        var src = escapeAttr(PATH);
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kinetic Letter Curtain PRO V1.1</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;background:#eee7da}body{overflow:hidden}</style></head><body><iframe title="Kinetic Letter Curtain PRO V1.1" src="' + src + '" allow="autoplay; fullscreen; display-capture" allowfullscreen></iframe></body></html>';
    }

    EP.WebsiteModules.register({
        id: ID,
        name: 'Kinetic Letter Curtain PRO V1.1',
        icon: 'KL',
        family: 'Canvas / Physical Typography',
        description: 'Cortina tipografica fisica interactiva con cuatro escenas, entorno imagen/video, image color-map y logo integrado en las letras.',
        sourceFile: PATH + ' · V1.1 aprobada · long curtain + full interface copy',
        mediaMap: 'Editor propio: branding, textos, 4 escenas, sky/wall/plaster/canopy imagen-video, contenido fisico, patrones de color, image-map y logo en cortina.',
        standalonePath: PATH,
        standaloneEditorNote: 'Editor completo dentro del preview. Personaliza toda la interfaz visible, cuatro escenas y sus fondos, paredes, plaster, canopy, palabras, colores, imagen como mapa de color y logo integrado en la cortina fisica.',
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
