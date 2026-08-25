window.LuxuryRealEstateConfig = {
  version: '0.1.0-phase2',
  brand: {
    name: 'Rubik Sota',
    mark: 'R',
    lang: 'es',
    accent: '#c9a96e',
    ink: '#080807',
    text: '#f5efe5',
    credits: 'IDEA BY RUBIK SOTA 629554870'
  },
  nav: {
    es: { home: 'INICIO', about: 'NOSOTROS', properties: 'PROPIEDADES', services: 'SERVICIOS', contact: 'CONTACTO' },
    en: { home: 'HOME', about: 'ABOUT', properties: 'PROPERTIES', services: 'SERVICES', contact: 'CONTACT' }
  },
  hero: {
    kicker: 'INMOBILIARIA PREMIUM',
    line1: 'Vive Sin',
    line2: 'Límites',
    subtitle: 'Una experiencia inmobiliaria inmersiva para presentar propiedades de alto valor con atmósfera, movimiento y decisión.',
    ctaLabel: 'Ver propiedades',
    ctaUrl: '#properties',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260703_055342_32b0f5da-a9f6-4e7b-82b2-891b700fa6d9.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&h=1200&fit=crop'
  },
  about: {
    kicker: 'SOBRE NOSOTROS',
    title: 'Transformamos espacios en experiencias.',
    text: 'Cada propiedad cuenta una historia de diseño, lujo y confort. Esta web no enseña inmuebles como fichas: los convierte en una escena de deseo, confianza y decisión.'
  },
  properties: {
    kicker: 'COLECCIÓN PRIVADA',
    title: 'Propiedades Exclusivas',
    intro: 'Una selección editorial de viviendas premium preparada para activar deseo, contexto y contacto cualificado.',
    items: [
      { enabled: true, title: 'Villa Mediterránea', location: 'Marbella, España', price: '€4.200.000', cta: 'Ver propiedad', url: '#contact', mediaType: 'image', mediaUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&h=650&fit=crop', description: 'Arquitectura blanca, privacidad y luz mediterránea.' },
      { enabled: true, title: 'Penthouse Dubai', location: 'Dubai, EAU', price: '€7.800.000', cta: 'Ver propiedad', url: '#contact', mediaType: 'image', mediaUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&h=650&fit=crop', description: 'Altura, skyline y una experiencia residencial internacional.' },
      { enabled: true, title: 'Chalet Alpino', location: 'Gstaad, Suiza', price: '€5.100.000', cta: 'Ver propiedad', url: '#contact', mediaType: 'image', mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=650&fit=crop', description: 'Madera, nieve, silencio y refugio de alto nivel.' }
    ]
  },
  services: {
    kicker: 'SERVICIOS PREMIUM',
    title: 'Una agencia del lado de la decisión.',
    itemsText: 'Compra/Venta\nAlquiler de lujo\nGestión de activos\nConsultoría privada',
    items: ['Compra/Venta', 'Alquiler de lujo', 'Gestión de activos', 'Consultoría privada']
  },
  contact: {
    kicker: 'CONTACTO PRIVADO',
    title: 'Solicite una consulta privada',
    text: 'Cuéntenos qué está buscando. Preparamos una selección personalizada y una visita con criterio.',
    primaryLabel: 'Contactar ahora',
    primaryUrl: 'mailto:hello@example.com',
    secondaryLabel: 'WhatsApp',
    secondaryUrl: 'https://wa.me/34629554870'
  },
  motion: {
    overlayStrength: 62,
    videoScale: 135,
    smoothing: 8,
    scrubMode: 'progress',
    mouseParallax: 'true',
    reducedMode: 'auto',
    glassBlur: 72,
    glassOpacity: 24
  }
};
