(function(){
  'use strict';
  window.EP=window.EP||{};
  var IDS=['real-estate-storytelling-custom-pro','product-storytelling-custom-pro','luxury-real-estate-custom-pro'];
  var FONT_PRESETS={
    original:{label:'Original de la plantilla',heading:'',body:'',url:''},
    editorial:{label:'Editorial Luxury',heading:'Instrument Serif',body:'Manrope',url:'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;600;700&display=swap'},
    architectural:{label:'Architectural',heading:'Bodoni Moda',body:'Manrope',url:'https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,600&family=Manrope:wght@300;400;500;600;700&display=swap'},
    modern:{label:'Modern Premium',heading:'Cormorant Garamond',body:'DM Sans',url:'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap'},
    technology:{label:'Technological',heading:'Space Grotesk',body:'Inter',url:'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap'},
    fashion:{label:'Fashion',heading:'Playfair Display',body:'Inter',url:'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap'},
    minimal:{label:'Minimal',heading:'Sora',body:'Inter',url:'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap'},
    automotive:{label:'Automotive',heading:'Barlow Condensed',body:'Manrope',url:'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700&display=swap'}
  };
  var EXTRA_SCHEMA=[
    {key:'themePreset',type:'select',label:'Tema visual',default:'original',options:[['original','Original'],['dark','Dark Premium'],['light','Light Editorial'],['warm','Warm Luxury'],['custom','Personalizado']]},
    {key:'fontPreset',type:'select',label:'Preset tipográfico',default:'original',options:Object.keys(FONT_PRESETS).map(function(k){return [k,FONT_PRESETS[k].label];})},
    {key:'headingFontCustom',type:'text',label:'Fuente de titulares personalizada',default:''},
    {key:'bodyFontCustom',type:'text',label:'Fuente de cuerpo personalizada',default:''},
    {key:'fontCssUrl',type:'text',label:'URL CSS de fuente',default:''},
    {key:'backgroundColor',type:'color',label:'Fondo principal',default:'#080808'},
    {key:'backgroundColor2',type:'color',label:'Fondo secundario',default:'#111111'},
    {key:'backgroundMode',type:'select',label:'Tipo de fondo',default:'solid',options:[['solid','Sólido'],['gradient','Gradiente']]},
    {key:'textPrimary',type:'color',label:'Texto principal',default:'#ffffff'},
    {key:'textSecondary',type:'color',label:'Texto secundario',default:'#a8a8a8'},
    {key:'navBackground',type:'color',label:'Fondo navegación',default:'#080808'},
    {key:'cardBackground',type:'color',label:'Fondo tarjetas',default:'#121212'},
    {key:'borderColor',type:'color',label:'Bordes',default:'#343434'},
    {key:'cardRadius',type:'range',label:'Radio de tarjetas',default:18,min:0,max:42,step:1,suffix:' px'},
    {key:'shadowStrength',type:'range',label:'Intensidad de sombras',default:55,min:0,max:100,step:1,suffix:'%'},
    {key:'headingTracking',type:'range',label:'Tracking titulares',default:-4,min:-10,max:20,step:1,suffix:'%'},
    {key:'headingLineHeight',type:'range',label:'Interlineado titulares',default:90,min:70,max:140,step:1,suffix:'%'},
    {key:'headingSizeDesktop',type:'range',label:'Titular desktop',default:100,min:48,max:190,step:2,suffix:' px'},
    {key:'headingSizeTablet',type:'range',label:'Titular tablet',default:76,min:38,max:130,step:2,suffix:' px'},
    {key:'headingSizeMobile',type:'range',label:'Titular móvil',default:52,min:28,max:92,step:2,suffix:' px'},
    {key:'contentAlign',type:'select',label:'Alineación de contenido',default:'center',options:[['left','Izquierda'],['center','Centro'],['right','Derecha']]},
    {key:'mediaFit',type:'select',label:'Ajuste de media',default:'cover',options:[['cover','Cubrir'],['contain','Contener']]},
    {key:'mediaFocalX',type:'range',label:'Foco horizontal',default:50,min:0,max:100,step:1,suffix:'%'},
    {key:'mediaFocalY',type:'range',label:'Foco vertical',default:50,min:0,max:100,step:1,suffix:'%'},
    {key:'mediaZoom',type:'range',label:'Zoom de media',default:100,min:80,max:150,step:1,suffix:'%'}
  ];
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function hex(v,f){return /^#[0-9a-f]{6}$/i.test(String(v||''))?v:f;}
  function num(v,min,max,d){v=Number(v);return isFinite(v)?Math.max(min,Math.min(max,v)):d;}
  function themeDefaults(o){
    var p=o.themePreset||'original';
    if(p==='light')return {bg:'#f1eee8',bg2:'#ffffff',text:'#111111',muted:'#625f59',nav:'#f1eee8',card:'#ffffff',border:'#d3cec4'};
    if(p==='warm')return {bg:'#17120d',bg2:'#241b12',text:'#f7efe2',muted:'#b9a993',nav:'#17120d',card:'#21180f',border:'#5d4932'};
    if(p==='dark')return {bg:'#070707',bg2:'#111111',text:'#f7f7f7',muted:'#9b9b9b',nav:'#070707',card:'#121212',border:'#303030'};
    return {bg:o.backgroundColor||'#080808',bg2:o.backgroundColor2||'#111111',text:o.textPrimary||'#ffffff',muted:o.textSecondary||'#a8a8a8',nav:o.navBackground||'#080808',card:o.cardBackground||'#121212',border:o.borderColor||'#343434'};
  }
  function apply(html,o,id){
    o=o||{};var fp=FONT_PRESETS[o.fontPreset]||FONT_PRESETS.original;var heading=(o.headingFontCustom||fp.heading||'').trim();var body=(o.bodyFontCustom||fp.body||'').trim();var fontUrl=(o.fontCssUrl||fp.url||'').trim();var t=themeDefaults(o);var bg=o.backgroundMode==='gradient'?'linear-gradient(135deg,'+hex(t.bg,'#080808')+','+hex(t.bg2,'#111111')+')':hex(t.bg,'#080808');
    var css='\n<style id="ep-phase1-theme">:root{--ep-bg:'+hex(t.bg,'#080808')+';--ep-bg2:'+hex(t.bg2,'#111111')+';--ep-text:'+hex(t.text,'#ffffff')+';--ep-muted:'+hex(t.muted,'#a8a8a8')+';--ep-nav:'+hex(t.nav,'#080808')+';--ep-card:'+hex(t.card,'#121212')+';--ep-border:'+hex(t.border,'#343434')+';--ep-radius:'+num(o.cardRadius,0,42,18)+'px;--ep-shadow:'+num(o.shadowStrength,0,100,55)/100+';--ep-heading-desktop:'+num(o.headingSizeDesktop,48,190,100)+'px;--ep-heading-tablet:'+num(o.headingSizeTablet,38,130,76)+'px;--ep-heading-mobile:'+num(o.headingSizeMobile,28,92,52)+'px}html,body{background:'+bg+'!important;color:var(--ep-text)!important}body{'+(body?'font-family:"'+esc(body)+'",Arial,sans-serif!important;':'')+'}.nav,nav{background:color-mix(in srgb,var(--ep-nav) 78%,transparent)!important}.feature,.property,.contact-card,.glass-card,.glass-card-strong{background:color-mix(in srgb,var(--ep-card) 82%,transparent)!important;border-color:var(--ep-border)!important;border-radius:var(--ep-radius)!important;box-shadow:0 28px 80px rgba(0,0,0,var(--ep-shadow))!important}.hero h1,.phase h1,.about h2,.properties h2,.services h2,.contact h2,h1,h2{'+(heading?'font-family:"'+esc(heading)+'",serif!important;':'')+'letter-spacing:'+num(o.headingTracking,-10,20,-4)/100+'em!important;line-height:'+num(o.headingLineHeight,70,140,90)/100+'!important}.hero h1,.phase h1{font-size:clamp(var(--ep-heading-mobile),8vw,var(--ep-heading-desktop))!important}.hero,.copy,.hero-content{text-align:'+(['left','center','right'].indexOf(o.contentAlign)>-1?o.contentAlign:'center')+'!important}.media,.hero-media,.cover,.about-media,.contact-media{object-fit:'+(o.mediaFit==='contain'?'contain':'cover')+'!important;object-position:'+num(o.mediaFocalX,0,100,50)+'% '+num(o.mediaFocalY,0,100,50)+'%!important;transform:scale('+num(o.mediaZoom,80,150,100)/100+')!important}p,.property-copy p,.feature p{color:var(--ep-muted)!important}@media(max-width:900px){.hero h1,.phase h1{font-size:clamp(var(--ep-heading-mobile),10vw,var(--ep-heading-tablet))!important}}@media(max-width:600px){.hero h1,.phase h1{font-size:var(--ep-heading-mobile)!important}}</style>\n';
    var link=fontUrl&&/^https:\/\//i.test(fontUrl)?'<link id="ep-phase1-font" rel="stylesheet" href="'+esc(fontUrl)+'">':'';
    return html.replace('</head>',link+css+'</head>');
  }
  function augmentSchema(schema){var existing={};(schema||[]).forEach(function(f){existing[f.key]=1;});return (schema||[]).concat(EXTRA_SCHEMA.filter(function(f){return !existing[f.key];}));}
  function patchScroll(){if(!EP.ScrollSections)return;IDS.slice(0,2).forEach(function(id){var tpl=EP.ScrollSections.get(id);if(!tpl||tpl.__phase1Patched)return;var original=tpl.build;tpl.schema=augmentSchema(tpl.schema||[]);tpl.build=function(media,o){return apply(original(media,o),o,id);};tpl.__phase1Patched=true;});}
  function patchBlueprint(){if(!EP.SectorBlueprints||EP.SectorBlueprints.__phase1Patched)return;var originalBuild=EP.SectorBlueprints.build,originalSchema=EP.SectorBlueprints.getSchema;EP.SectorBlueprints.build=function(id,media,o){var html=originalBuild(id,media,o);return id==='luxury-real-estate-custom-pro'?apply(html,o,id):html;};EP.SectorBlueprints.getSchema=function(id){var s=originalSchema(id);return id==='luxury-real-estate-custom-pro'?augmentSchema(s):s;};EP.SectorBlueprints.__phase1Patched=true;}
  function init(){patchScroll();patchBlueprint();}
  EP.Phase1ThemeEngine={init:init,apply:apply,fontPresets:FONT_PRESETS,extraSchema:EXTRA_SCHEMA.slice()};
  init();
})();
