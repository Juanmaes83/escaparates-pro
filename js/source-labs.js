EP.SourceLabs = (function() {
    var labs = [
        {
            id: 'glitchify-image-pro', icon: 'GI', name: 'Glitchify Image PRO', family: 'Image Engine',
            description: 'Motor fuente completo: color shift, wave, displacement, palettes, pixel sort y data corruption.',
            path: 'labs/source-experiences/glitchify-image-pro/',
            note: 'Motor original completo en iframe. Sus controles nativos viven dentro de la experiencia. Slot 1 reemplaza la imagen; un video se convierte en su primer frame para el motor fuente.'
        },
        {
            id: 'fur-texture-image-pro', icon: 'FU', name: 'Fur Texture Image PRO', family: 'Image Engine',
            description: 'Motor fuente completo con procesado incremental, detener proceso, limpieza y PNG final.',
            path: 'labs/source-experiences/fur-texture-image-pro/',
            note: 'Motor original completo en iframe. Mantiene sus controles, demos, procesamiento por lotes y descarga PNG. Slot 1 reemplaza la imagen; un video aporta su primer frame.'
        },
        {
            id: 'agency-studio-pro', icon: 'AS', name: 'Agency Studio Blueprint PRO', family: 'Website Blueprint',
            description: 'Portfolio editorial fuente: mosaico de 128 piezas, wave reveal, servicios, detalle y transiciones.',
            path: 'labs/source-experiences/agency-studio-pro/',
            note: 'Fuente completa aislada. Panel Escaparates: marca, titular, CTA, color y assets. Conserva el mosaico, el detalle y las interacciones originales.',
            fields: [
                { key: 'brand', label: 'Marca', type: 'text', default: 'Escaparates Pro' },
                { key: 'headline', label: 'Titular editorial', type: 'text', default: 'Forma sigue a la friccion.' },
                { key: 'subtitle', label: 'Narrativa', type: 'textarea', default: 'Una experiencia digital construida para ser recordada, compartida y convertida en accion.' },
                { key: 'cta', label: 'CTA', type: 'text', default: 'Ver proyectos' },
                { key: 'url', label: 'URL CTA', type: 'url', default: '#index' },
                { key: 'accent', label: 'Color de marca', type: 'color', default: '#d6ff35' }
            ]
        },
        {
            id: 'particulate-image-pro', icon: 'PT', name: 'Particulate Image PRO', family: 'Particle Image Engine',
            description: 'Motor fuente completo: imagen rota en miles de particulas fisicas, Blow, Gather, Freeze y paleta Median Cut.',
            path: 'labs/source-experiences/particulate-image-pro/',
            note: 'Fuente completa aislada. Conserva los tres modos de interaccion, el reensamblaje, paleta dominante y copias CSS/SVG. Slot 1 alimenta el cargador nativo; un video aporta su primer frame.'
        },
        {
            id: 'canvas-squiggle-deformer-pro', icon: 'SQ', name: 'Canvas Squiggle Deformer PRO', family: 'Motion Image Engine',
            description: 'Motor fuente completo con Worker: ondas, ruido Simplex, deformacion horizontal/vertical, overlays y control Tweakpane.',
            path: 'labs/source-experiences/canvas-squiggle-deformer-pro/',
            note: 'Fuente completa aislada. Mantiene su Worker, modos de borde, amplitud, frecuencia, ruido, velocidad y overlay. Slot 1 se carga en el uploader nativo; un video se convierte en su primer frame.'
        },
        {
            id: 'grass-image-processing-pro', icon: 'GR', name: 'Grass Image Processing PRO', family: 'Procedural Image Engine',
            description: 'Motor fuente completo: convierte una imagen en textura vegetal procedural, procesada por lotes, con detener proceso y PNG.',
            path: 'labs/source-experiences/grass-image-processing-pro/',
            note: 'Fuente completa aislada. Conserva demos, densidad de briznas, proceso por lotes, cancelacion, limpieza y descarga PNG. Slot 1 reemplaza la entrada; un video aporta su primer frame.'
        },
        {
            id: 'zoetrope-media-pro', icon: 'ZO', name: 'Zoetrope Media PRO', family: 'Sequence / 3D Media Engine',
            description: 'Tambor 3D fuente con ranuras, ahora alimentado por secuencias de imagenes propias o frames extraidos de video.',
            path: 'labs/source-experiences/zoetrope-media-pro/',
            note: 'Fuente completa aislada. El adaptador convierte los assets en una secuencia propia, reconstruye tambor y ranuras, y mantiene el movimiento 3D. Para video extrae frames localmente en el navegador; no se sube contenido.',
            fields: [
                { key: 'frameCount', label: 'Frames por vuelta', type: 'range', min: 6, max: 24, step: 1, default: 12, suffix: '' },
                { key: 'spinDuration', label: 'Duracion de vuelta', type: 'range', min: 200, max: 2000, step: 50, default: 600, suffix: ' ms' },
                { key: 'direction', label: 'Direccion', type: 'select', default: 'normal', options: ['normal', 'reverse'] },
                { key: 'radius', label: 'Tamano del tambor', type: 'range', min: 28, max: 54, step: 1, default: 50, suffix: ' vmin' }
            ]
        },
        {
            id: 'vits-narration-lab', icon: 'VO', name: 'VITS Narration Lab', family: 'Optional narration engine',
            description: 'Motor de voz local bajo demanda con ONNX/OPFS. No se carga ni participa en el render de efectos o Scroll Sections.',
            path: 'labs/narration/vits-web-lab/',
            note: 'Laboratorio aislado basado en @diffusionstudio/vits-web (MIT). La carga del motor y del modelo ocurre solamente cuando la persona pulsa generar. El WAV se genera localmente y puede descargarse.',
            fields: [
                { key: 'text', label: 'Texto de narración', type: 'textarea', default: 'Tu historia comienza aquí. Explora, descubre y comparte una experiencia creada para recordar.' },
                { key: 'voiceId', label: 'Voice ID VITS', type: 'text', default: 'en_US-hfc_female-medium' },
                { key: 'brand', label: 'Marca / campaña', type: 'text', default: 'Escaparates Pro' }
            ]
        }
    ];
    function get(id) { return labs.filter(function(lab) { return lab.id === id; })[0] || null; }
    return { getAll: function() { return labs.slice(); }, get: get };
})();
