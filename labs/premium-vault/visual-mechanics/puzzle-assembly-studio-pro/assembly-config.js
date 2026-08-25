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
    subtitle: 'Una imagen final construida pieza a pieza con precisión visual.'
  },
  content: {
    heading: 'El ensamblaje no se oculta: se calibra.',
    body: 'Este laboratorio usa las piezas reales del repo Samurai como fuente, pero añade ghost final, snap, z-index y controles de posición para corregir el encaje visual antes de declarar el módulo completo.',
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
    manualProgress: 72,
    ghostOpacity: 0.28,
    finalRevealStart: 88,
    snapStrength: 0.72,
    stopMotion: 0.08
  },
  pieces: [
    { id: 'helmet', name: 'Helmet / Kabuto', file: 'helmet.png', z: 18, start: 0, end: 38, fromX: 0, fromY: -460, fromRot: -14, x: 0, y: -82, scale: 0.86, rotation: 0 },
    { id: 'body', name: 'Body / Dō', file: 'body.png', z: 14, start: 12, end: 48, fromX: 0, fromY: 520, fromRot: 5, x: 0, y: 326, scale: 1.24, rotation: 0 },
    { id: 'shoulders', name: 'Shoulders / Sode', file: 'shoulders.png', z: 22, start: 20, end: 56, fromX: 0, fromY: -390, fromRot: -8, x: 0, y: 82, scale: 0.96, rotation: 0 },
    { id: 'right-arm', name: 'Right arm', file: 'right_arm.png', z: 16, start: 28, end: 66, fromX: -360, fromY: 120, fromRot: -10, x: -100, y: 358, scale: 0.86, rotation: 0 },
    { id: 'left-arm', name: 'Left arm', file: 'left_arm2.png', z: 17, start: 28, end: 66, fromX: 360, fromY: 120, fromRot: 10, x: 150, y: 280, scale: 0.86, rotation: 0 }
  ]
};
