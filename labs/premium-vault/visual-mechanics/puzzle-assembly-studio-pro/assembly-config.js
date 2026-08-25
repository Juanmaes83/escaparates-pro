window.AssemblyConfig = {
  meta: {
    id: 'armor-reveal-scroll-studio-pro',
    legacyId: 'puzzle-assembly-studio-pro',
    name: 'Armor Reveal Scroll Studio PRO',
    source: 'Juanmaes83/SAMURAI-KATANA-ALICANTE./public + Prompts_SAMURAI.md',
    status: 'REVIEW'
  },
  brand: {
    eyebrow: 'Armor Reveal Scroll Studio PRO',
    title: 'SAMURAI KATANA',
    subtitle: 'Desorden visual. Atracción magnética. Revelado final.'
  },
  content: {
    heading: 'No es puzzle exacto: es revelado cinematográfico de armadura.',
    body: 'La fuente original define piezas off-screen, atracción progresiva, snap visual y crossfade final a samurai2.png. Esta reconstrucción sigue esa verdad para que la experiencia tenga intención, movimiento y recompensa visual sin fingir un encaje matemático que los assets no garantizan.',
    cta: 'Reservar ritual',
    ctaUrl: 'tel:629554870'
  },
  assets: {
    baseUrl: 'https://raw.githubusercontent.com/Juanmaes83/SAMURAI-KATANA-ALICANTE./main/public/',
    baseImage: 'samurai1.png',
    finalImage: 'samurai2.png'
  },
  motion: {
    mode: 'animate',
    scrollMode: true,
    manualProgress: 0,
    heroHeightVh: 280,
    floatAmount: 14,
    finalRevealStart: 85,
    snapStart: 70,
    snapEnd: 85,
    snapStrength: 0.86,
    holdFinal: true,
    finalScale: 1.05,
    baseOpacity: 1,
    finalShadow: 1
  },
  pieces: [
    { id: 'body', name: 'Body / Dō', file: 'body.png', z: 14, start: 15, end: 70, fromX: 0, fromY: 118, fromRot: 4, x: 0, y: 330, scale: 1.25, rotation: 0, floatSeed: 0.1 },
    { id: 'shoulders', name: 'Shoulders / Sode', file: 'shoulders.png', z: 24, start: 18, end: 74, fromX: 0, fromY: -110, fromRot: -10, x: 0, y: 80, scale: 0.95, rotation: 0, floatSeed: 1.7 },
    { id: 'helmet', name: 'Helmet / Kabuto', file: 'helmet.png', z: 7, start: 20, end: 76, fromX: 0, fromY: -120, fromRot: -15, x: 0, y: -80, scale: 0.85, rotation: 0, floatSeed: 2.8 },
    { id: 'right-arm', name: 'Right arm', file: 'right_arm.png', z: 16, start: 22, end: 82, fromX: -150, fromY: 20, fromRot: -15, x: -100, y: 360, scale: 0.85, rotation: 0, floatSeed: 3.3 },
    { id: 'left-arm', name: 'Left arm', file: 'left_arm2.png', z: 17, start: 22, end: 82, fromX: 150, fromY: 20, fromRot: 15, x: 150, y: 280, scale: 0.85, rotation: 0, floatSeed: 4.4 }
  ],
  cards: [
    { title: 'Kabuto', tag: 'Protección y Honor', file: 'helmet.png', body: 'El casco marca la identidad del guerrero y prepara el primer golpe visual.' },
    { title: 'Dō', tag: 'El núcleo de hierro', file: 'body.png', body: 'La coraza sostiene la composición y da peso al ensamblaje.' },
    { title: 'Kote', tag: 'Precisión del corte', file: 'left_arm.png', body: 'Las mangas blindadas dan dirección, gesto y energía al movimiento.' },
    { title: 'Sode', tag: 'Manto de acero', file: 'shoulders.png', body: 'Los hombros cierran la silueta y convierten la figura en presencia.' }
  ]
};
