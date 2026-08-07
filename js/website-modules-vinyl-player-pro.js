// Vinyl Player PRO V1 — standalone Website Modules bridge.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    var ID = 'vinyl-player-pro';
    var PATH = 'labs/website-modules-source/vinyl-player-pro/index.html';

    function escapeAttr(value) {
        return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function buildFallbackDocument() {
        var src = escapeAttr(PATH);
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vinyl Player PRO V1</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;background:#f6eddb}body{overflow:hidden}</style></head><body><iframe title="Vinyl Player PRO V1" src="' + src + '" allow="autoplay; fullscreen; display-capture" allowfullscreen></iframe></body></html>';
    }

    EP.WebsiteModules.register({
        id: ID,
        name: 'Vinyl Player PRO V1',
        icon: 'VP',
        family: '3D / Audio Experience',
        description: 'Tocadiscos Three.js interactivo con seis discos, imagen/video, audio personalizado, controles mecanicos y exportacion cliente.',
        sourceFile: PATH + ' · V1 aprobada · custom library + media/audio',
        mediaMap: 'Editor propio: marca, hero, paleta, fondo, 6 discos con imagen/video y audio, modos de biblioteca y entregables cliente.',
        standalonePath: PATH,
        standaloneEditorNote: 'Editor completo dentro del preview. Personaliza identidad, fondo, paleta y seis discos con portada imagen/video y audio propio. Custom Library evita que iTunes sobrescriba el contenido personalizado.',
        standaloneActions: {
            html: 'downloadHtmlBtn',
            zip: 'downloadZipBtn',
            embed: 'copyEmbedBtn'
        },
        fields: [],
        build: function() {
            return buildFallbackDocument();
        }
    });
})();
