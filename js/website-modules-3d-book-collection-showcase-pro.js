// 3D Book Collection Showcase PRO — standalone Website Modules bridge.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    var ID = '3d-book-collection-showcase-pro';
    var PATH = 'labs/website-modules-source/3d-book-collection-showcase-pro/index.html';

    function escapeAttr(value) {
        return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function buildFallbackDocument() {
        var src = escapeAttr(PATH);
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>3D Book Collection Showcase PRO</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;background:#141a32}body{overflow:hidden}</style></head><body><iframe title="3D Book Collection Showcase PRO" src="' + src + '" allow="autoplay; fullscreen; display-capture" allowfullscreen></iframe></body></html>';
    }

    EP.WebsiteModules.register({
        id: ID,
        name: '3D Book Collection Showcase PRO',
        icon: '3D',
        family: '3D / Editorial',
        description: 'Coleccion Three.js interactiva con portadas, seis paginas interiores y contraportadas personalizables en imagen, video y texto editorial.',
        sourceFile: PATH + ' · V2.2 aprobada',
        mediaMap: 'Editor propio: logo, fondo multimedia, 3 portadas, 3 contraportadas y 6 paginas independientes por libro.',
        standalonePath: PATH,
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
