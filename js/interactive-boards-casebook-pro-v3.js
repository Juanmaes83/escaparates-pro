// Casebook PRO V3 — isolated clone baseline of approved V2.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.InteractiveBoards || !EP.InteractiveBoards.register) return;
    var PATH = 'labs/interactive-boards-source/casebook-pro-v3/index.html';
    EP.InteractiveBoards.register({
        id: 'casebook-pro-v3-clone',
        name: 'Casebook PRO V3 — Clone Baseline',
        shortName: 'Casebook PRO V3 Clone',
        icon: 'CB3',
        family: 'Interactive Boards / Spatial Worlds',
        description: 'Clon byte-exacto de Casebook PRO V2 aprobado. Baseline aislado para desarrollar V3 sin modificar V1.1, V2 ni el resto de Escaparates Pro.',
        path: PATH,
        sourceFile: PATH,
        sha256: '6e4ba33fea2a6d2b5b4fb3b226ae561c07680dc30b882d67c6945c8cde77b04d',
        presets: ['Detective / Investigation','Campaign Command Center','Fashion Creative Room','Project / Tasks','Strategy / Presentation','Agency Pitch Room'],
        outputs: ['JSON','HTML','ZIP','Embed','Preview','PNG','Viewer','WebM Exact','WebM Live']
    });
})();
