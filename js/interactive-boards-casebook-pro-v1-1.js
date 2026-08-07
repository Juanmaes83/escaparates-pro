// Casebook PRO V1.1 — first Interactive Boards module.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.InteractiveBoards || !EP.InteractiveBoards.register) return;
    var PATH = 'labs/interactive-boards-source/casebook-pro-v1-1/index.html';
    EP.InteractiveBoards.register({
        id: 'casebook-pro-v1-1',
        name: 'Casebook PRO — Creative Campaign Board V1.1',
        shortName: 'Casebook PRO V1.1',
        icon: 'CB',
        family: 'Interactive Boards / Creative Systems',
        description: 'Board 3D conectado para investigación, campañas 360, moda, proyectos y presentaciones estratégicas.',
        path: PATH,
        sourceFile: PATH,
        sha256: '96d5da228695c4b0d669e45251469608d4f8676e4c27a462654f6724fd780e63',
        presets: ['Detective / Investigation','Campaign 360','Fashion Campaign','Project / Tasks','Strategy / Presentation'],
        outputs: ['HTML','ZIP','Embed','Preview','PNG','Review Recording']
    });
})();
