// Casebook PRO V4 — Fashion Pearl Spatial World.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.InteractiveBoards || !EP.InteractiveBoards.register) return;
    var PATH = 'labs/interactive-boards-source/casebook-pro-v3-fashion-lab/index.html';
    EP.InteractiveBoards.register({
        id: 'casebook-pro-v4-fashion-pearl',
        name: 'Casebook PRO V4 — Fashion Pearl Spatial World',
        shortName: 'Casebook PRO V4',
        icon: 'C4',
        family: 'Interactive Boards / Spatial Worlds / Fashion',
        description: 'Evolución V4 de Casebook dentro de Boards: Fashion Pearl Spatial World con escena couture 3D, cámara libre en Author Mode, Fit Scene, Chapters, Hotspots, World Map / Route y Guided Experience.',
        path: PATH,
        sourceFile: PATH,
        status: 'approved-v4-board',
        baseline: 'Casebook PRO V3 Fashion Pearl checkpoint @ cc792a1fef0386645806cf0d90e729e76cf673fa',
        capabilities: ['Fashion Pearl Spatial Scene System','Multi-board / Chapters','Free Camera + Fit Scene','Hotspots X/Y + 3D anchors','Portal hotspots','Pearl couture scene composer','Fashion camera language','Editorial transitions','World Map / Navigator','Guided Tour','Story / Presentation / Recording'],
        presets: ['Fashion — Pearl Runway','Fashion — White Editorial Studio','Fashion — Campaign Wall','Fashion — Material Library'],
        outputs: ['JSON','HTML','ZIP','Embed','Preview','PNG','Viewer','WebM Exact','WebM Live']
    });
})();
