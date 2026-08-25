window.CinematicFrameSequenceDefault = {
  brand: {
    name: 'Big Kahuna Burger',
    eyebrow: 'CINEMATIC PRODUCT HERO',
    headline: 'A burger reveal controlled by scroll.',
    subheadline: 'Transform any product sequence into a premium visual landing: frame by frame, chapter by chapter, CTA ready.',
    primary: '#f9b233',
    secondary: '#120707',
    accent: '#e2211c'
  },
  sequence: {
    baseUrl: 'https://raw.githubusercontent.com/Juanmaes83/MCDONALDS/main/public/mcdonalds_animations/',
    pattern: 'frame_###.jpg',
    frameCount: 822,
    preloadCount: 28,
    posterFrame: 1,
    mobileFrameStep: 3,
    scrollLength: 520,
    videoFallback: 'https://raw.githubusercontent.com/Juanmaes83/MCDONALDS/main/public/VIDEOHERO.mp4'
  },
  product: {
    title: 'Big Kahuna Burger',
    category: 'Food / Product / Campaign',
    ctaLabel: 'Launch product hero',
    ctaUrl: '#product-cta'
  },
  beats: [
    { id:'intro', at:0.08, label:'01', title:'The first hook', text:'Start with a strong poster frame. The user must understand the product before the scroll begins.' },
    { id:'build', at:0.34, label:'02', title:'Frame-by-frame appetite', text:'The sequence becomes a cinematic reveal: product, texture, movement and desire.' },
    { id:'impact', at:0.66, label:'03', title:'The brand moment', text:'Add a clear chapter where the brand, claim or product promise becomes memorable.' },
    { id:'cta', at:0.9, label:'04', title:'Convert the attention', text:'End with a direct action: order, reserve, buy, join, ask, discover or book.' }
  ],
  content: {
    sectionTitle: 'One visual mechanism. Many product launches.',
    sectionText: 'This Studio is not only a burger demo. It is a reusable frame sequence engine for food, beverage, cars, hotels, perfume, fashion, real estate and advertising campaigns.',
    cards: [
      { title:'Product cinema', text:'Turn still renders or video exports into a scroll-controlled cinematic sequence.' },
      { title:'Editable storytelling', text:'Change chapters, claim, CTA, frame source and motion without rebuilding the page.' },
      { title:'Reusable engine', text:'Use the same mechanic for many sectors once frames are prepared correctly.' }
    ]
  }
};
