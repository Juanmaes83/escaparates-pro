// Casebook PRO V3 — Fashion Spatial Scene Lab.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.InteractiveBoards || !EP.InteractiveBoards.register) return;
    var PATH = 'labs/interactive-boards-source/casebook-pro-v3-fashion-lab/index.html';
    EP.InteractiveBoards.register({
        id: 'casebook-pro-v3-fashion-lab',
        name: 'Casebook PRO V3 — Fashion Spatial Scene Lab',
        shortName: 'V3 Fashion Lab',
        icon: 'F3',
        family: 'Interactive Boards / Spatial Worlds / Fashion',
        description: 'Laboratorio aislado de Fase 3 para exprimir Fashion como primer Spatial Scene Kit: World → Spaces → Hotspots → World Map / Route → Guided Experience.',
        path: PATH,
        sourceFile: PATH,
        status: 'isolated-development-lab',
        baseline: 'Casebook PRO V3 Phase 2 @ a7776bf8ad0e653c96c8dad6da3cbabb64d86bca',
        capabilities: ['Fashion Spatial Scene System','Multi-board / Chapters','Hotspots X/Y + 3D anchors','Portal hotspots','Fashion camera language','Editorial transitions','World Map / Navigator','Guided Tour','Story / Presentation / Recording'],
        presets: ['Fashion — Black Runway','Fashion — White Editorial Studio','Fashion — Campaign Wall','Fashion — Material Library'],
        outputs: ['JSON','HTML','ZIP','Embed','Preview','PNG','Viewer','WebM Exact','WebM Live']
    });
})();
