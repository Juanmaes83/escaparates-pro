// Banderolas Dinamicas — Output V2. Canonical standalone Website Modules bridge.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    var ID = 'banderolas-dinamicas-output-v2';
    var PATH = 'labs/website-modules-source/banderolas-dinamicas-output-v2/index-output-v2.html';

    function escapeAttr(value) {
        return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function buildFallbackDocument() {
        var src = escapeAttr(PATH);
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Banderolas Dinamicas — Output V2</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;background:#000}body{overflow:hidden}</style></head><body><iframe title="Banderolas Dinamicas — Output V2" src="' + src + '" allow="autoplay; fullscreen; clipboard-write; display-capture" allowfullscreen></iframe></body></html>';
    }

    EP.WebsiteModules.register({
        id: ID,
        name: 'Banderolas Dinamicas — Output V2',
        icon: 'BD',
        family: 'Interactive Media / Dynamic Fabric',
        description: 'Banderola WebGL con fisica cloth/Verlet, imagen o video, controles de composicion y pipeline Output V2.',
        sourceFile: 'Juanmaes83/BANDEROLAS-DINAMICAS · preview-output-v2 · 538146f7ec2ddbd056b55da0ed0eb8a1cf96ef83',
        mediaMap: 'Editor propio Output V2: texto, imagen/video, Media Size/X/Y, Save/Restore, PNG, WebM 30/60 FPS, Preview Clean, Standalone HTML y Embed.',
        standalonePath: PATH,
        standaloneEditorNote: 'Editor Output V2 original preservado. Personaliza y exporta desde su propio panel; Escaparates Pro solo lo registra y carga como standalone local.',
        fields: [],
        build: function() {
            return buildFallbackDocument();
        }
    });
})();
