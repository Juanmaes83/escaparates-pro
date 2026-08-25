window.AssemblyConfig = {
  meta: {
    id: 'puzzle-assembly-studio-pro',
    name: 'Puzzle Assembly Studio PRO',
    source: 'Juanmaes83/samurai-katana-alicante-landing',
    status: 'REVIEW'
  },
  brand: {
    eyebrow: 'Puzzle Assembly Studio PRO',
    title: 'SAMURAI KATANA',
    subtitle: 'Calibración visual de piezas hasta un encaje limpio.'
  },
  content: {
    heading: 'El puzzle sólo se aprueba cuando encaja.',
    body: 'Esta versión no oculta el fallo con una imagen final. Primero separa las piezas, después las calibra contra una guía sutil y sólo revela el samurái final cuando el ensamblaje ya está limpio.',
    cta: 'Reservar ritual',
    ctaUrl: 'tel:629554870'
  },
  assets: {
    baseUrl: 'https://raw.githubusercontent.com/Juanmaes83/samurai-katana-alicante-landing/main/assets/images/',
    baseImage: 'samurai1.png',
    finalImage: 'samurai2.png'
  },
  motion: {
    scrollMode: true,
    manualProgress: 18,
    ghostOpacity: 0.075,
    baseGuideOpacity: 0.045,
    finalRevealStart: 94,
    snapStrength: 0.9,
    stopMotion: 0.04,
    holdFinal: true
  },
  pieces: [
    { id: 'body', name: 'Body / Dō', file: 'body.png', z: 14, start: 8, end: 58, fromX: 0, fromY: 760, fromRot: 4, x: 0, y: 326, scale: 1.24, rotation: 0 },
    { id: 'shoulders', name: 'Shoulders / Sode', file: 'shoulders.png', z: 22, start: 18, end: 66, fromX: 0, fromY: -650, fromRot: -9, x: 0, y: 82, scale: 0.96, rotation: 0 },
    { id: 'helmet', name: 'Helmet / Kabuto', file: 'helmet.png', z: 18, start: 28, end: 74, fromX: 0, fromY: -820, fromRot: -13, x: 0, y: -82, scale: 0.86, rotation: 0 },
    { id: 'right-arm', name: 'Right arm', file: 'right_arm.png', z: 16, start: 38, end: 82, fromX: -640, fromY: 240, fromRot: -11, x: -100, y: 358, scale: 0.86, rotation: 0 },
    { id: 'left-arm', name: 'Left arm', file: 'left_arm2.png', z: 17, start: 38, end: 82, fromX: 640, fromY: 210, fromRot: 11, x: 150, y: 280, scale: 0.86, rotation: 0 }
  ]
};
