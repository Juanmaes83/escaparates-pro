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
        description: 'Escultura y tela WebGPU con fisica Verlet, escenas premium y mapeo de imagen/video sobre la tela.',
        sourceFile: 'Juanmaes83/breeze · 0ab82342f9169f20e32b0e90babcc4707e694906 · additive derivative',
        mediaMap: 'Imagen/video sobre tela + Scale/X/Y + Scene/Camera/Physics + PNG/WebM/Preview Clean.',
        standalonePath: PATH,
        standaloneEditorNote: 'Modulo nuevo e independiente. Breeze preservado como motor; Banderolas no se modifica ni se usa como dependencia.',
        fields: [],
        build: function() {
            return '<!doctype html><html><body style="margin:0;background:#000"><iframe src="' + PATH + '" style="position:fixed;inset:0;width:100%;height:100%;border:0" allow="autoplay;fullscreen" allowfullscreen></iframe></body></html>';
        }
    });
})();
