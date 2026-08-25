window.EventCampaignConfig = {
  projectName: 'Pepsi Night — Event Campaign Sequence PRO',
  brand: {
    name: 'PEPSI NIGHT',
    eyebrow: 'LA FIESTA UNIVERSITARIA',
    headline: 'Una noche que empieza con scroll y termina en recuerdo.',
    subheadline: 'Una campaña secuencial para eventos, activaciones y lanzamientos de marca.',
    primary: '#e11b22',
    secondary: '#0a1f44',
    accent: '#f5f5f5'
  },
  sequence: {
    mode: 'frames',
    baseUrl: 'https://juanmaes83.github.io/WEBPEPSI/public/pepsi_animations',
    pattern: 'frame_{###}.jpg',
    frameCount: 366,
    preloadCount: 36,
    scrollLength: 460,
    posterFrame: 1,
    mobileFrameStep: 3,
    videoFallback: 'https://juanmaes83.github.io/WEBPEPSI/public/VIDEOHERO.mp4'
  },
  event: {
    title: 'PEPSI NIGHT',
    date: 'Viernes · 23:00',
    location: 'Campus Club · Valencia',
    ctaLabel: 'Reservar acceso',
    ctaUrl: '#tickets'
  },
  moments: [
    { id: 'start', at: 0.08, label: '01', title: 'La señal', text: 'La ciudad baja la luz. La campaña empieza.' },
    { id: 'arrival', at: 0.32, label: '02', title: 'La llegada', text: 'El evento se convierte en punto de encuentro.' },
    { id: 'peak', at: 0.62, label: '03', title: 'El momento', text: 'Marca, música y gente dentro de una misma escena.' },
    { id: 'cta', at: 0.88, label: '04', title: 'La invitación', text: 'Una experiencia lista para reservar, compartir y recordar.' }
  ],
  content: {
    sectionTitle: 'Campaña secuencial para activar una marca.',
    sectionText: 'Este preset convierte WEBPEPSI en una mecánica reusable: una marca, evento o producto puede narrarse mediante frames, scroll y momentos editables.',
    cards: [
      { title: 'Evento', text: 'Fecha, lugar, claim, energía y acceso.' },
      { title: 'Secuencia', text: 'Frames sincronizados con el scroll.' },
      { title: 'Conversión', text: 'CTA final para entradas, reserva o landing.' }
    ]
  }
};
