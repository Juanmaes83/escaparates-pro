// Portal Studio Premium V3 — Lucy Live AI. Canonical standalone Website Modules bridge.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    var PATH = 'labs/website-modules-source/portal-studio-premium-v3/premium-v3/index.html';

    EP.WebsiteModules.register({
        id: 'portal-studio-premium-v3',
        name: 'Portal Studio Premium V3 — Lucy Live AI',
        icon: 'PS',
        family: 'Interactive Media / Gesture Portals',
        description: 'Portal interactivo por gestos con MediaPipe, imagen/video/HLS/WebRTC y Lucy 2.5 realtime AI como proveedor opcional.',
        sourceFile: 'Juanmaes83/finger-frame-effect-ai · preview-premium-v3 · fbbbd5db0f6b85fd0d0288887c03e7350fa85bf5',
        mediaMap: 'Camera/gesture video; portal media image/video; screen share; HLS; WebRTC; ORIGINAL/AI/SPLIT; Lucy styles; Preview Clean; PNG/WebM.',
        standalonePath: PATH,
        standaloneEditorNote: 'Premium V3 aprobado preservado con su core V2.1.1 y dependencias V2/V2.1. Escaparates Pro solo lo registra como modulo standalone local.',
        fields: [],
        build: function() {
            return '<!doctype html><html><body style="margin:0;background:#000"><iframe src="' + PATH + '" style="position:fixed;inset:0;width:100%;height:100%;border:0" allow="camera;microphone;display-capture;autoplay;fullscreen;clipboard-write" allowfullscreen></iframe></body></html>';
        }
    });
})();
