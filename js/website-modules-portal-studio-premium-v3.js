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

// Hanging Media Studio — immutable standalone versions registered additively.
(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;

    function registerStandalone(id, name, icon, description, sourceFile, mediaMap, path) {
        EP.WebsiteModules.register({
            id: id,
            name: name,
            icon: icon,
            family: 'Interactive Media / Dynamic Fabric',
            description: description,
            sourceFile: sourceFile,
            mediaMap: mediaMap,
            standalonePath: path,
            standaloneEditorNote: 'Editor original preservado. Escaparates Pro lo registra como modulo standalone y no reconstruye su motor ni su panel.',
            fields: [],
            build: function() {
                return '<!doctype html><html><body style="margin:0;background:#111"><iframe src="' + path + '" style="position:fixed;inset:0;width:100%;height:100%;border:0" allow="autoplay;fullscreen;clipboard-write;display-capture" allowfullscreen></iframe></body></html>';
            }
        });
    }

    registerStandalone(
        'hanging-media-studio-v1',
        'Hanging Media Studio V1',
        'H1',
        'Galeria de media colgante interactiva con cloth, cuerda, pinzas, drag, scroll, iluminacion y authoring propio.',
        'Juanmaes83/PONER-A-SECAR-LA-COLADA-INTERACTIVA-PERSONALIZADA · agent/hanging-media-studio-v1 · 481f0f731e8af85f06572937d462a6f369009278',
        'Imagen/video multiple; carousel; cloth/fabric; lighting; wall/scene; presets; persistencia.',
        'labs/website-modules-source/hanging-media-studio-v1/index.html'
    );

    registerStandalone(
        'hanging-media-studio-v2',
        'Hanging Media Studio V2 — Creative Surfaces',
        'H2',
        'Evolucion con superficies creativas, edicion global/por pieza, fondos, materiales, sombras, audio y hardware configurable.',
        'Juanmaes83/PONER-A-SECAR-LA-COLADA-INTERACTIVA-PERSONALIZADA · agent/hanging-media-studio-v2 · 376883d6366d834600354d993a8b2e266fa66914',
        'Imagen/video; formas poster/flag/banner/polaroid/torn/tshirt/dress/tote/pennant; fondos imagen/video; audio; fisica; luces; sombras.',
        'labs/website-modules-source/hanging-media-studio-v2/index.html'
    );

    registerStandalone(
        'hanging-media-studio-v3',
        'Hanging Media Studio V3 — Production Studio',
        'H3',
        'Studio de produccion con proyectos, versiones, branding por capas y pipeline de entregables portable.',
        'Juanmaes83/PONER-A-SECAR-LA-COLADA-INTERACTIVA-PERSONALIZADA · agent/hanging-media-studio-v3 · 445c0fe30096b3f75b3e0b9e287309f9d46e8e37',
        'V2 completo + proyectos/piezas; texto/logo; versiones; PNG; WebM; JSON; HTML portable; ZIP cliente; Embed.',
        'labs/website-modules-source/hanging-media-studio-v3/index.html'
    );

    registerStandalone(
        'hanging-media-studio-v4-1-1',
        'Hanging Media Studio V4.1.1 — Narrative Character',
        'H4',
        'Production Studio con Narrative Character Layer: personaje editorial sincronizado con la cuerda, esfuerzo, release y satisfaccion.',
        'Juanmaes83/PONER-A-SECAR-LA-COLADA-INTERACTIVA-PERSONALIZADA · agent/hanging-media-studio-v4-1-1 · 5c798611a3a779826808812d94a4b4f95a10f995',
        'V3 completo + AYA character ON/OFF; motion intensity; grab/pull/release/satisfaction; mano alineada con cuerda real.',
        'labs/website-modules-source/hanging-media-studio-v4-1-1/index.html'
    );
})();
