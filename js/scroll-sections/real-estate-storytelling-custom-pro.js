(function(){
  var DEMO_VIDEO='https://cdn.jiro.build/Sumon/Main%20hotel%20video.mp4';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});}
  function safeUrl(v,fallback){v=String(v||'').trim();return /^(https?:|mailto:|tel:|#)/i.test(v)?v:(fallback||'#');}
  function bool(v,d){if(v===true||v===false)return v;if(v===1||v==='1'||v==='true')return true;if(v===0||v==='0'||v==='false')return false;return d;}
  function build(mediaList,raw){
    var media=EP.ScrollSections.normalizeMedia(mediaList||[]);
    var o=Object.assign({
      brand:'RUBIK SOTA',footer:'IDEA BY RUBIK SOTA 629554870',languageLabel:'ES',
      phase1Title:'¿Deseas ver tu hogar más de cerca?',phase1Subtitle:'Acércate a tu nueva vida.',
      phase2Title:'Desciende y entra.',phase2Subtitle:'El lujo te abre sus puertas.',
      phase3Title:'Genial ¿no?',phase3Subtitle:'Así podría ser tu día a día.',
      phase4Title:'Llámanos, te la enseñamos.',phase4Subtitle:'629554870 · Podrás quedarte allí por siempre...',
      ctaLabel:'Solicitar visita',ctaUrl:'#contacto',accent:'#ffffff',overlayStrength:62,
      scrollLength:600,smoothing:8,playbackMode:'forward-reverse',showIndicators:1,showDirection:1
    },raw||{});
    var slots={
      hero:media[0]||{type:'video',url:DEMO_VIDEO},
      poster:media[1]||null,
      logo:media[2]||null
    };
    var cfg={
      brand:String(o.brand||''),footer:String(o.footer||''),languageLabel:String(o.languageLabel||'ES'),
      phases:[
        {title:String(o.phase1Title||''),subtitle:String(o.phase1Subtitle||'')},
        {title:String(o.phase2Title||''),subtitle:String(o.phase2Subtitle||'')},
        {title:String(o.phase3Title||''),subtitle:String(o.phase3Subtitle||'')},
        {title:String(o.phase4Title||''),subtitle:String(o.phase4Subtitle||'')}
      ],
      ctaLabel:String(o.ctaLabel||''),ctaUrl:safeUrl(o.ctaUrl,'#contacto'),accent:String(o.accent||'#ffffff'),
      overlayStrength:Math.max(0,Math.min(90,Number(o.overlayStrength)||62)),
      scrollLength:Math.max(300,Math.min(900,Number(o.scrollLength)||600)),
      smoothing:Math.max(2,Math.min(24,Number(o.smoothing)||8)),
      playbackMode:String(o.playbackMode||'forward-reverse'),
      showIndicators:bool(o.showIndicators,true),showDirection:bool(o.showDirection,true)
    };
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(cfg.brand)} — Storytelling inmobiliario</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Antonio:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>
:root{--accent:${esc(cfg.accent)};--overlay:${cfg.overlayStrength/100}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#080808;color:#fff;font-family:Inter,Arial,sans-serif;overflow-x:hidden}.story{height:${cfg.scrollLength}vh;position:relative;background:#080808}.stage{position:sticky;top:0;height:100vh;overflow:hidden;isolation:isolate}.media,.poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.015)}.poster{z-index:-1}.shade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.64),transparent 35%,rgba(0,0,0,.82));z-index:2}.nav{position:absolute;z-index:5;top:0;left:0;right:0;padding:28px clamp(22px,5vw,72px);display:flex;align-items:center;justify-content:space-between}.brand{font-family:Antonio,sans-serif;font-size:clamp(18px,2vw,28px);font-weight:600;letter-spacing:.25em;text-transform:uppercase;display:flex;align-items:center;gap:14px}.brand img{width:42px;height:42px;object-fit:contain}.lang{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:white;font-weight:800}.copy{position:absolute;z-index:4;inset:auto 0 0;padding:0 24px clamp(70px,10vh,116px);text-align:center}.phase{max-width:1100px;margin:auto;transition:opacity .42s,transform .58s cubic-bezier(.16,1,.3,1);opacity:0;transform:translateY(30px);position:absolute;left:24px;right:24px;bottom:clamp(76px,11vh,130px);pointer-events:none}.phase.active{opacity:1;transform:none;pointer-events:auto}.phase h1{font:700 clamp(36px,6.5vw,94px)/.98 Antonio,sans-serif;text-transform:uppercase;letter-spacing:.02em;margin:0 0 14px;text-shadow:0 12px 45px rgba(0,0,0,.65)}.phase p{margin:0;color:rgba(255,255,255,.68);font-size:clamp(13px,1.2vw,18px);letter-spacing:.08em}.cta{display:inline-flex;margin-top:26px;padding:14px 22px;border-radius:999px;background:var(--accent);color:#090909;text-decoration:none;font-weight:900;letter-spacing:.04em;pointer-events:auto}.dots{position:absolute;z-index:6;bottom:48px;left:50%;transform:translateX(-50%);display:flex;gap:9px}.dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.3);transition:.35s}.dot.active{background:var(--accent);transform:scale(1.35)}.direction{position:absolute;z-index:6;bottom:18px;left:50%;transform:translateX(-50%);font-size:18px;color:rgba(255,255,255,.58);animation:bob 1.8s infinite}.footer{position:absolute;z-index:7;bottom:0;left:0;right:0;padding:10px 20px;text-align:right;font-size:10px;letter-spacing:.18em;color:rgba(255,255,255,.38)}.progress{position:absolute;z-index:6;left:0;bottom:0;height:2px;width:0;background:var(--accent)}@keyframes bob{50%{transform:translate(-50%,7px)}}@media(max-width:640px){.nav{padding:22px}.brand{letter-spacing:.16em}.phase{bottom:94px}.phase h1{font-size:clamp(34px,11vw,58px)}.footer{text-align:center}.copy{padding-left:16px;padding-right:16px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.story{height:100vh}.phase{transition:none}.direction{animation:none}.media{display:none}.poster{z-index:0}}
</style></head><body><main class="story" id="story"><section class="stage"><div id="mediaLayer"></div><div class="shade"></div><header class="nav"><div class="brand" id="brand"></div><button class="lang" aria-label="Idioma">${esc(cfg.languageLabel)}</button></header><div class="copy" id="phases"></div><div class="dots" id="dots"></div><div class="direction" id="direction" aria-hidden="true">⌄</div><div class="footer">${esc(cfg.footer)}</div><div class="progress" id="progress"></div></section></main><script>
(function(){var cfg=${JSON.stringify(cfg)};var slots=${JSON.stringify(slots)};var story=document.getElementById('story'),layer=document.getElementById('mediaLayer'),brand=document.getElementById('brand'),phases=document.getElementById('phases'),dots=document.getElementById('dots'),direction=document.getElementById('direction'),progress=document.getElementById('progress');var mediaEl=null;if(slots.hero&&slots.hero.type==='video'){mediaEl=document.createElement('video');mediaEl.className='media';mediaEl.src=slots.hero.url;mediaEl.muted=true;mediaEl.playsInline=true;mediaEl.preload='auto';if(slots.poster)mediaEl.poster=slots.poster.url;}else{mediaEl=document.createElement('img');mediaEl.className='media poster';mediaEl.src=(slots.hero&&slots.hero.url)||(slots.poster&&slots.poster.url)||'';mediaEl.alt='';}layer.appendChild(mediaEl);if(slots.logo&&slots.logo.url){brand.innerHTML='<img alt="" src="'+slots.logo.url.replace(/"/g,'&quot;')+'"><span></span>';brand.querySelector('span').textContent=cfg.brand;}else brand.textContent=cfg.brand;cfg.phases.forEach(function(p,i){var d=document.createElement('article');d.className='phase'+(i===0?' active':'');d.innerHTML='<h1></h1><p></p>'+(i===3&&cfg.ctaLabel?'<a class="cta"></a>':'');d.querySelector('h1').textContent=p.title;d.querySelector('p').textContent=p.subtitle;var a=d.querySelector('a');if(a){a.textContent=cfg.ctaLabel;a.href=cfg.ctaUrl;}phases.appendChild(d);var dot=document.createElement('i');dot.className='dot'+(i===0?' active':'');dots.appendChild(dot);});if(!cfg.showIndicators)dots.style.display='none';if(!cfg.showDirection)direction.style.display='none';var target=0,current=0,lastPhase=-1,raf=0;function mapVideo(p){if(cfg.playbackMode==='forward')return p;if(cfg.playbackMode==='loop')return (p*2)%1;return p<=.5?p*2:(1-p)*2;}function onScroll(){var rect=story.getBoundingClientRect();var total=rect.height-innerHeight;target=Math.max(0,Math.min(1,total>0?-rect.top/total:0));}function frame(){current+=(target-current)*(cfg.smoothing/100);var phase=Math.min(3,Math.floor(current*4));if(phase!==lastPhase){document.querySelectorAll('.phase').forEach(function(el,i){el.classList.toggle('active',i===phase)});document.querySelectorAll('.dot').forEach(function(el,i){el.classList.toggle('active',i===phase)});direction.textContent=phase<3?'⌄':'⌃';lastPhase=phase;}progress.style.width=(current*100)+'%';if(mediaEl.tagName==='VIDEO'&&isFinite(mediaEl.duration)&&mediaEl.duration>0&&!mediaEl.seeking){var t=mapVideo(current)*Math.max(.01,mediaEl.duration-.05);if(Math.abs(mediaEl.currentTime-t)>.02)mediaEl.currentTime=t;}else if(mediaEl.tagName==='IMG'){mediaEl.style.transform='scale('+(1.015+current*.12)+') translateY('+(current*-2)+'%)';}raf=requestAnimationFrame(frame);}addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();raf=requestAnimationFrame(frame);addEventListener('pagehide',function(){cancelAnimationFrame(raf)});})();
<\/script></body></html>`;
  }
  EP.ScrollSections.register({
    id:'real-estate-storytelling-custom-pro',name:'Real Estate Storytelling — Custom PRO',icon:'RC',badge:'original-top',
    description:'La experiencia inmobiliaria original convertida en plantilla editable: vídeo, cuatro fases, marca, CTA, colores y movimiento.',
    mediaSlots:['Vídeo hero','Poster / fallback','Logotipo'],
    schema:[
      {key:'brand',type:'text',label:'Marca / agencia',default:'RUBIK SOTA'},
      {key:'footer',type:'text',label:'Créditos / footer',default:'IDEA BY RUBIK SOTA 629554870'},
      {key:'phase1Title',type:'text',label:'Fase 1 · titular',default:'¿Deseas ver tu hogar más de cerca?'},
      {key:'phase1Subtitle',type:'text',label:'Fase 1 · subtítulo',default:'Acércate a tu nueva vida.'},
      {key:'phase2Title',type:'text',label:'Fase 2 · titular',default:'Desciende y entra.'},
      {key:'phase2Subtitle',type:'text',label:'Fase 2 · subtítulo',default:'El lujo te abre sus puertas.'},
      {key:'phase3Title',type:'text',label:'Fase 3 · titular',default:'Genial ¿no?'},
      {key:'phase3Subtitle',type:'text',label:'Fase 3 · subtítulo',default:'Así podría ser tu día a día.'},
      {key:'phase4Title',type:'text',label:'Fase 4 · titular',default:'Llámanos, te la enseñamos.'},
      {key:'phase4Subtitle',type:'text',label:'Fase 4 · subtítulo',default:'629554870 · Podrás quedarte allí por siempre...'},
      {key:'ctaLabel',type:'cta',label:'CTA final',default:'Solicitar visita'},
      {key:'ctaUrl',type:'url',label:'URL del CTA',default:'#contacto'},
      {key:'accent',type:'text',label:'Color de acento (HEX)',default:'#ffffff'},
      {key:'overlayStrength',type:'range',label:'Oscurecimiento',min:0,max:90,step:1,default:62,suffix:'%'},
      {key:'scrollLength',type:'range',label:'Longitud de scroll',min:300,max:900,step:25,default:600,suffix:' vh'},
      {key:'smoothing',type:'range',label:'Suavizado de scrub',min:2,max:24,step:1,default:8},
      {key:'playbackMode',type:'text',label:'Modo: forward / forward-reverse / loop',default:'forward-reverse'},
      {key:'showIndicators',type:'range',label:'Mostrar puntos (0/1)',min:0,max:1,step:1,default:1},
      {key:'showDirection',type:'range',label:'Mostrar dirección (0/1)',min:0,max:1,step:1,default:1}
    ],build:build
  });
})();
