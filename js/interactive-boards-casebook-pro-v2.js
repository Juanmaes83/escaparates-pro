// Casebook PRO V2 — Spatial Storytelling System.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.InteractiveBoards || !EP.InteractiveBoards.register) return;
    var PATH = 'labs/interactive-boards-source/casebook-pro-v2/index.html';
    EP.InteractiveBoards.register({
        id: 'casebook-pro-v2',
        name: 'Casebook PRO V2 — Spatial Storytelling System',
        shortName: 'Casebook PRO V2',
        icon: 'CB2',
        family: 'Interactive Boards / Spatial Storytelling',
        description: 'Sistema visual conectado que convierte un board en una historia espacial presentable y grabable: Board → Story → Presentation → Recording.',
        path: PATH,
        sourceFile: PATH,
        sha256: '6e4ba33fea2a6d2b5b4fb3b226ae561c07680dc30b882d67c6945c8cde77b04d',
        presets: ['Detective / Investigation','Campaign Command Center','Fashion Creative Room','Project / Tasks','Strategy / Presentation','Agency Pitch Room'],
        outputs: ['JSON','HTML','ZIP','Embed','Preview','PNG','Viewer','WebM Exact','WebM Live']
    });
})();
