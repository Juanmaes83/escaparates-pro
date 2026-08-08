// Casebook PRO V3 — Spatial Worlds.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.InteractiveBoards || !EP.InteractiveBoards.register) return;
    var PATH = 'labs/interactive-boards-source/casebook-pro-v3/index.html';
    EP.InteractiveBoards.register({
        id: 'casebook-pro-v3-clone',
        name: 'Casebook PRO V3 — Spatial Worlds',
        shortName: 'Casebook PRO V3',
        icon: 'CB3',
        family: 'Interactive Boards / Spatial Worlds',
        description: 'Sistema para construir mundos visuales, conectarlos, narrarlos y explorarlos: World → Chapters → Hotspots → World Map → Guided Tour → Story → Presentation → Recording.',
        path: PATH,
        sourceFile: PATH,
        status: 'development-candidate',
        baseline: 'Casebook PRO V2 approved clone',
        capabilities: ['Multi-board / Chapters','Hotspots X/Y + visual placement','Info hotspots','Portal hotspots','Spatial transitions','World Map / Navigator','Guided Tour','V2 Story / Presentation / Recording'],
        presets: ['Detective / Investigation','Campaign Command Center','Fashion Creative Room','Project / Tasks','Strategy / Presentation','Agency Pitch Room'],
        outputs: ['JSON','HTML','ZIP','Embed','Preview','PNG','Viewer','WebM Exact','WebM Live']
    });
})();
