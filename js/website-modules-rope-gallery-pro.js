// Rope Gallery PRO V1.5 — standalone Website Modules bridge.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    var ID = 'rope-gallery-pro';
    var PATH = 'labs/website-modules-source/rope-gallery-pro/index.html';

    function escapeAttr(value) {
        return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function buildFallbackDocument() {
        var src = escapeAttr(PATH);
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rope Gallery PRO V1.5</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;background:#faf8f4}body{overflow:hidden}</style></head><body><iframe title="Rope Gallery PRO V1.5" src="' + src + '" allow="autoplay; fullscreen; display-capture" allowfullscreen></iframe></body></html>';
    }

    EP.WebsiteModules.register({
        id: ID,
        name: 'Rope Gallery PRO V1.5',
        icon: 'RG',
        family: '3D / Interactive Gallery',
        description: 'Galeria Three.js sobre cuerda fisica con pinzas, inercia, imagen/video por ficha y Focus editorial independiente.',
        sourceFile: PATH + ' · V1.5 aprobada · clean media + focus',
        mediaMap: 'Editor propio: logo, hero, navegacion, fondo, 8 fichas imagen/video, descripcion ampliada, CTA y entregables cliente.',
        standalonePath: PATH,
        standaloneEditorNote: 'Editor completo dentro del preview. Personaliza identidad, colores, fondo y ocho fichas con imagen/video, descripcion y CTA. El Focus final abre cada ficha en primer termino sin recortar el canvas.',
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
