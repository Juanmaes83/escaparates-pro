(function() {
    'use strict';
    window.EP = window.EP || {};
    if (!EP.WebsiteModules || !EP.WebsiteModules.register) return;
    var PATH = 'labs/website-modules-source/breeze-studio-pro/index.html';
    EP.WebsiteModules.register({
        id: 'breeze-studio-pro',
        name: 'Breeze Studio PRO',
        icon: 'BR',
        family: 'Interactive Media / Dynamic Fabric',
        description: 'Escultura y tela WebGPU con Experiences, fondos, media en tela, grading visual y biblioteca 3D reemplazable.',
        sourceFile: 'Juanmaes83/breeze · 0ab82342f9169f20e32b0e90babcc4707e694906 · additive derivative V4',
        mediaMap: 'SUBIR > CARGADO > START; fondo image/video; cloth image/video + opacity/brightness/contrast/saturation; CC0 3D library; GLB/GLTF/OBJ; Physics; PNG/WebM.',
        standalonePath: PATH,
        standaloneEditorNote: 'Modulo nuevo e independiente. Breeze preservado como motor; Banderolas permanece intacto y solo sirve como patron funcional probado.',
        fields: [],
        build: function() {
            return '<!doctype html><html><body style="margin:0;background:#000"><iframe src="' + PATH + '" style="position:fixed;inset:0;width:100%;height:100%;border:0" allow="autoplay;fullscreen" allowfullscreen></iframe></body></html>';
        }
    });
})();
