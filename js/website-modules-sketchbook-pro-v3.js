// Sketchbook PRO V3 — standalone Website Modules bridge.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    var ID = 'sketchbook-pro-v3';
    var PATH = 'labs/website-modules-source/sketchbook-pro-v3/index.html';

    function escapeAttr(value) {
        return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function buildFallbackDocument() {
        var src = escapeAttr(PATH);
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sketchbook PRO V3</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;background:#ece7dc}body{overflow:hidden}</style></head><body><iframe title="Sketchbook PRO V3" src="' + src + '" allow="autoplay; fullscreen; display-capture" allowfullscreen></iframe></body></html>';
    }

    EP.WebsiteModules.register({
        id: ID,
        name: 'Sketchbook PRO V3',
        icon: 'SB',
        family: 'Editorial / Interactive',
        description: 'Sketchbook de nueve spreads con paso de pagina curvo, lupa, parallax, branding y paginas personalizables con imagen o video.',
        sourceFile: PATH + ' · V3 aprobada · descargas corregidas',
        mediaMap: 'Editor propio: logo, identidad, paleta, 9 paginas imagen/video, titulos de placas, contacto y entregables cliente.',
        standalonePath: PATH,
        standaloneEditorNote: 'Editor completo dentro del preview. Personaliza marca, logo, paleta, nueve paginas con imagen/video, titulos, contacto y exportaciones desde el panel propio del Sketchbook.',
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
