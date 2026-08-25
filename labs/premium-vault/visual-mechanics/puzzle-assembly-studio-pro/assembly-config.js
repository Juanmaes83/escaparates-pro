window.AssemblyConfig = {
  meta: {
    id: 'puzzle-assembly-studio-pro',
    name: 'Puzzle Assembly Studio PRO',
    source: 'Juanmaes83/samurai-katana-alicante-landing + SAMURAI-KATANA-ALICANTE.',
    status: 'REVIEW'
  },
  brand: {
    eyebrow: 'Puzzle Assembly Studio PRO',
    title: 'SAMURAI KATANA',
    subtitle: 'Primero el orden perfecto. Después se diseña el desorden.'
  },
  content: {
    heading: 'Primero ensamblar perfecto. Luego dispersar. Luego invertir.',
    body: 'Esta fase no empieza por la animación. Empieza por el Estado B: las piezas reales deben encajar sobre samurai2.png. Sólo cuando el final sea limpio se diseñará el Estado A y la transición de desorden a orden.',
    cta: 'Reservar ritual',
    ctaUrl: 'tel:629554870'
  },
  assets: {
    baseUrl: 'https://raw.githubusercontent.com/Juanmaes83/samurai-katana-alicante-landing/main/assets/images/',
    baseImage: 'samurai1.png',
    finalImage: 'samurai2.png'
  },
  motion: {
    mode: 'calibrate-final',
    scrollMode: false,
    manualProgress: 100,
    ghostOpacity: 0.12,
    finalReferenceOpacity: 0.32,
    baseGuideOpacity: 0,
    finalRevealStart: 94,
    snapStrength: 0.92,
    stopMotion: 0.02,
    holdFinal: true
  },
  pieces: [
    { id: 'body', name: 'Body / Dō', file: 'body.png', z: 14, start: 8, end: 58, fromX: 0, fromY: 760, fromRot: 4, fromScale: 1, x: 0, y: 0, scale: 1, rotation: 0 },
    { id: 'shoulders', name: 'Shoulders / Sode', file: 'shoulders.png', z: 22, start: 18, end: 66, fromX: 0, fromY: -650, fromRot: -9, fromScale: 1, x: 0, y: 0, scale: 1, rotation: 0 },
    { id: 'helmet', name: 'Helmet / Kabuto', file: 'helmet.png', z: 18, start: 28, end: 74, fromX: 0, fromY: -820, fromRot: -13, fromScale: 1, x: 0, y: 0, scale: 1, rotation: 0 },
    { id: 'right-arm', name: 'Right arm', file: 'right_arm.png', z: 16, start: 38, end: 82, fromX: -640, fromY: 240, fromRot: -11, fromScale: 1, x: 0, y: 0, scale: 1, rotation: 0 },
    { id: 'left-arm', name: 'Left arm', file: 'left_arm2.png', z: 17, start: 38, end: 82, fromX: 640, fromY: 210, fromRot: 11, fromScale: 1, x: 0, y: 0, scale: 1, rotation: 0 }
  ]
};
