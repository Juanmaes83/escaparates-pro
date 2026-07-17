(function(){
'use strict';
window.EP=window.EP||{};

var ASSET_ROOT='assets/templates/luxury-beauty/eloria/';
var ELORIA_ASSETS={
  hero:ASSET_ROOT+'Hero%20Image.png',
  bottle:ASSET_ROOT+'Perfume%20Bottle.png',
  cloud:ASSET_ROOT+'Top%20Cloud.png',
  icon1:ASSET_ROOT+'Icon%201.png',
  icon2:ASSET_ROOT+'Icon%202.png',
  icon3:ASSET_ROOT+'Icon%203.png',
  icon4:ASSET_ROOT+'Icon%204.png',
  icon5:ASSET_ROOT+'Icon%205.png'
};
var BOTANICAL_ASSETS={
  hero:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1800&h=1200&fit=crop',
  bottle:'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=900&h=1200&fit=crop',
  cloud:'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&h=900&fit=crop'
};
var COLLECTION_FALLBACK=[ELORIA_ASSETS.bottle,ELORIA_ASSETS.bottle,ELORIA_ASSETS.bottle,ELORIA_ASSETS.bottle,ELORIA_ASSETS.bottle,ELORIA_ASSETS.bottle];
var MEDIA_SLOT_IDS=[
  'heroBackground','starProduct','topCloud','ingredientIcon1','ingredientIcon2','ingredientIcon3','ingredientIcon4','ingredientIcon5',
  'collectionProduct1','collectionProduct2','collectionProduct3','collectionProduct4','collectionProduct5','collectionProduct6','storyMedia','logo'
];

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function attr(value){return esc(value).replace(/`/g,'&#96;');}
function clamp(value,min,max,fallback){value=Number(value);return Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;}
function bool(value,fallback){if(value===true||value===false)return value;if(value==='true'||value===1||value==='1')return true;if(value==='false'||value===0||value==='0')return false;return fallback;}
function safeUrl(value,fallback){value=String(value||'').trim();return /^(https?:|mailto:|tel:|#)/i.test(value)?value:(fallback||'#');}
function mediaList(list){return (list||[]).map(function(item){return item?{type:item.type||'image',url:item.url||(item.element&&(item.element.currentSrc||item.element.src))||'',slot:item.slot||''}:null;});}
function mediaFor(media,id,index,fallback,type){var item=(media||[]).filter(Boolean).filter(function(candidate){return candidate.slot===id;})[0]||media[index]||null;return item&&item.url?item:{type:type||'image',url:fallback||''};}
function mediaTag(item,className,alt,loading){if(!item||!item.url)return '';if(item.type==='video')return '<video class="'+className+'" src="'+attr(item.url)+'" autoplay muted loop playsinline preload="metadata"></video>';return '<img class="'+className+'" src="'+attr(item.url)+'" alt="'+attr(alt||'')+'" loading="'+(loading||'lazy')+'">';
}
function normalizeItems(value,fallback,min,max){var items=Array.isArray(value)?value:fallback;return items.map(function(item){return Object.assign({},item||{});}).slice(0,max||12).filter(function(item,index){return index<(min||0)||Object.keys(item).some(function(key){return String(item[key]||'').trim();});});}
function sceneConfig(o,scene,defaults){
  return {
    x:clamp(o[scene+'ProductX'], -100, 100, defaults.x),
    y:clamp(o[scene+'ProductY'], -100, 100, defaults.y),
    scale:clamp(o[scene+'ProductScale'], .2, 1.8, defaults.scale),
    rotation:clamp(o[scene+'ProductRotation'], -20, 20, defaults.rotation),
    opacity:defaults.opacity==null?1:defaults.opacity,
    z:defaults.z==null?30:defaults.z,
    origin:defaults.origin||'50% 50%'
  };
}
function anchor(scene,config){return '<span class="eloria-anchor" data-product-anchor data-scene="'+scene+'" data-x="'+config.x+'" data-y="'+config.y+'" data-scale="'+config.scale+'" data-rotation="'+config.rotation+'" data-opacity="'+config.opacity+'" data-z="'+config.z+'" data-origin="'+attr(config.origin)+'"></span>';}
function languageItemsToMap(items){var out={};(Array.isArray(items)?items:[]).forEach(function(item){if(item&&item.key)out[item.key]=item.text||'';});return out;}
function languageMap(o){
  var advanced=o.languageContent&&typeof o.languageContent==='object'&&!Array.isArray(o.languageContent)?o.languageContent:{};
  return {
    es:Object.assign(languageItemsToMap(o.spanishContent),advanced.es||{}),
    en:Object.assign(languageItemsToMap(o.englishContent),advanced.en||{})
  };
}
function labelForLang(value,lang,key,fallback){var obj=value&&typeof value==='object'?value:null;return obj&&obj[lang]&&obj[lang][key]?obj[lang][key]:fallback;}

function build(mediaInput,raw){
  var media=mediaList(mediaInput);
  var o=Object.assign({},DEFAULTS,raw||{});
  var isEloria=o.presetId==='eloria-signature'||o.brand==='ELORIA';
  var hero=mediaFor(media,'heroBackground',0,isEloria?ELORIA_ASSETS.hero:BOTANICAL_ASSETS.hero,'image');
  var product=mediaFor(media,'starProduct',1,isEloria?ELORIA_ASSETS.bottle:BOTANICAL_ASSETS.bottle,'image');
  var cloud=mediaFor(media,'topCloud',2,isEloria?ELORIA_ASSETS.cloud:BOTANICAL_ASSETS.cloud,'image');
  var icons=[1,2,3,4,5].map(function(n){return mediaFor(media,'ingredientIcon'+n,2+n,ELORIA_ASSETS['icon'+n],'image');});
  var story=mediaFor(media,'storyMedia',14,isEloria?ELORIA_ASSETS.hero:BOTANICAL_ASSETS.hero,'image');
  var lang=String(o.defaultLanguage||'es').toLowerCase()==='en'?'en':'es';
  var languages=languageMap(o);
  var navStart=labelForLang(languages,lang,'start',lang==='en'?'Home':'Inicio');
  var navBuy=labelForLang(languages,lang,'buy',lang==='en'?'Buy Now':'Comprar Ahora');
  var navSearch=labelForLang(languages,lang,'search',lang==='en'?'Search':'Busqueda');
  var ctaPrimary=labelForLang(languages,lang,'discover',o.primaryCtaLabel);
  var scenes=[
    ['hero',sceneConfig(o,'hero',{x:31,y:7,scale:1.04,rotation:0,z:24,origin:'50% 56%'})],
    ['ingredients',sceneConfig(o,'ingredients',{x:-24,y:8,scale:.78,rotation:-6,z:18,origin:'46% 50%'})],
    ['collection',sceneConfig(o,'collection',{x:28,y:5,scale:.64,rotation:4,z:18,origin:'50% 50%'})],
    ['ritual',sceneConfig(o,'ritual',{x:-30,y:0,scale:.74,rotation:-3,z:18,origin:'50% 50%'})],
    ['story',sceneConfig(o,'story',{x:27,y:-2,scale:.7,rotation:6,z:18,origin:'50% 50%'})],
    ['final',sceneConfig(o,'final',{x:0,y:2,scale:.88,rotation:0,z:28,origin:'50% 50%'})]
  ];
  var sceneMap=scenes.reduce(function(acc,item){acc[item[0]]=item[1];return acc;},{});
  var ingredients=normalizeItems(o.ingredients,DEFAULTS.ingredients,3,8);
  var collection=normalizeItems(o.collectionProducts,DEFAULTS.collectionProducts,3,6).slice(0,6);
  var ritualSteps=normalizeItems(o.ritualSteps,DEFAULTS.ritualSteps,2,6);
  var brandFacts=normalizeItems(o.brandFacts,DEFAULTS.brandFacts,2,6);
  var collectionCards=collection.map(function(item,index){
    var img=mediaFor(media,'collectionProduct'+(index+1),8+index,COLLECTION_FALLBACK[index]||product.url,'image');
    return '<article class="eloria-product-card"><div>'+mediaTag(img,'eloria-card-img',item.name)+'</div><span>'+esc(item.volume||o.volume)+'</span><h3>'+esc(item.name||('Edition '+(index+1)))+'</h3><p>'+esc(item.note||'A collectible variation of the signature accord.')+'</p><button type="button" data-open-commercial data-product="'+attr(item.name||o.productName)+'">'+esc(o.productCardCtaLabel)+'</button></article>';
  }).join('');
  var ingredientCards=ingredients.map(function(item,index){
    var icon=icons[index%icons.length];
    return '<article class="eloria-ingredient"><img src="'+attr(icon.url)+'" alt=""><span>0'+(index+1)+'</span><h3>'+esc(item.name)+'</h3><p>'+esc(item.description)+'</p></article>';
  }).join('');
  var ritualHtml=ritualSteps.map(function(item,index){return '<li><span>0'+(index+1)+'</span><strong>'+esc(item.title)+'</strong><p>'+esc(item.text)+'</p></li>';}).join('');
  var factsHtml=brandFacts.map(function(item){return '<article><strong>'+esc(item.value)+'</strong><span>'+esc(item.label)+'</span></article>';}).join('');
  var productAnchors=scenes.map(function(item){return item[0];}).join(',');
  var showCollection=bool(o.showCollection,true),showRitual=bool(o.showRitual,true),showStory=bool(o.showBrandStory,true),showFinal=bool(o.showFinalCta,true);
  return '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(o.brand)+' | '+esc(o.productName)+'</title><meta name="ep-template-id" content="luxury-beauty-product-pro"><style>'+css(o)+'</style></head><body><div class="eloria-page" data-template="luxury-beauty-product-pro" data-product-anchor-order="'+productAnchors+'"><div id="eloriaStarProduct" aria-label="'+attr(o.productName)+'">'+mediaTag(product,'eloria-star-img',o.productName,'eager')+'</div><nav class="eloria-nav"><button class="eloria-menu" type="button" data-open-drawer aria-label="Menu"><span></span><span></span></button><a href="#eloriaHero" class="eloria-brand">'+esc(o.brand)+'</a><a href="#eloriaHero">'+esc(navStart)+'</a><button type="button" data-open-search>'+esc(navSearch)+'</button><button type="button" data-open-commercial>'+esc(navBuy)+'</button>'+(bool(o.enableLanguageSwitcher,true)?'<div class="eloria-lang"><button type="button" data-lang="es">ES</button><button type="button" data-lang="en">EN</button></div>':'')+'</nav><aside class="eloria-drawer" id="eloriaDrawer" aria-hidden="true"><button type="button" data-close-layer>Cerrar</button><a href="#eloriaHero">'+esc(navStart)+'</a><a href="#eloriaIngredients">'+esc(o.ingredientsTitle)+'</a><a href="#eloriaCollection">'+esc(o.collectionTitle)+'</a><a href="#eloriaFinal">'+esc(navBuy)+'</a></aside><section class="eloria-search" id="eloriaSearch" aria-hidden="true"><button type="button" data-close-layer>Cerrar</button><label>Buscar<input placeholder="'+attr(o.searchPlaceholder)+'"></label></section><main><section class="eloria-scene eloria-hero" id="eloriaHero">'+anchor('hero',sceneMap.hero)+'<div class="eloria-hero-bg">'+mediaTag(hero,'eloria-hero-img','ELORIA hero','eager')+'</div><img class="eloria-top-cloud" src="'+attr(cloud.url)+'" alt=""><div class="eloria-hero-copy"><span>'+esc(o.heroKicker)+'</span><h1><strong>'+esc(o.heroTitleLine1)+'</strong><em>'+esc(o.heroTitleLine2)+'</em></h1><p>'+esc(o.heroSubtitle)+'</p><button type="button" data-open-commercial>'+esc(ctaPrimary)+'</button></div><div class="eloria-hud"><span>'+esc(o.hudLabel)+'</span><strong>'+esc(o.hudValue)+'</strong></div><button class="eloria-volume" type="button" aria-label="Volume">VOL</button></section><section class="eloria-scene eloria-ingredients" id="eloriaIngredients">'+anchor('ingredients',sceneMap.ingredients)+'<div class="eloria-section-title"><span>'+esc(o.ingredientsEyebrow)+'</span><h2>'+esc(o.ingredientsTitle)+'</h2><p>'+esc(o.ingredientsSubtitle)+'</p></div><div class="eloria-ingredient-grid">'+ingredientCards+'</div></section>'+(showCollection?'<section class="eloria-scene eloria-collection" id="eloriaCollection">'+anchor('collection',sceneMap.collection)+'<div class="eloria-section-title"><span>'+esc(o.collectionEyebrow)+'</span><h2>'+esc(o.collectionTitle)+'</h2><p>'+esc(o.collectionSubtitle)+'</p></div><div class="eloria-product-grid">'+collectionCards+'</div></section>':'')+(showRitual?'<section class="eloria-scene eloria-ritual" id="eloriaRitual">'+anchor('ritual',sceneMap.ritual)+'<div><span>'+esc(o.ritualEyebrow)+'</span><h2>'+esc(o.ritualTitle)+'</h2></div><ol>'+ritualHtml+'</ol></section>':'')+(showStory?'<section class="eloria-scene eloria-story" id="eloriaStory">'+anchor('story',sceneMap.story)+'<div class="eloria-story-media">'+mediaTag(story,'eloria-story-img','')+'</div><div class="eloria-story-copy"><span>'+esc(o.storyEyebrow)+'</span><h2>'+esc(o.storyTitle)+'</h2><p>'+esc(o.storyText)+'</p><div class="eloria-facts">'+factsHtml+'</div></div></section>':'')+(showFinal?'<section class="eloria-scene eloria-final" id="eloriaFinal">'+anchor('final',sceneMap.final)+'<span>'+esc(o.finalEyebrow)+'</span><h2>'+esc(o.finalTitle)+'</h2><p>'+esc(o.finalText)+'</p><button type="button" data-open-commercial>'+esc(o.finalCtaLabel)+'</button></section>':'')+'</main><footer class="eloria-footer"><strong>'+esc(o.brand)+'</strong><span>'+esc(o.footerText)+'</span><a href="'+attr(safeUrl(o.primaryCtaUrl,'#eloriaFinal'))+'">'+esc(o.footerCtaLabel)+'</a></footer><section class="eloria-commercial" id="eloriaCommercial" role="dialog" aria-modal="true" aria-hidden="true"><div class="eloria-commercial-card"><button type="button" data-close-layer>Cerrar</button><img src="'+attr(product.url)+'" alt=""><span>'+esc(o.modalEyebrow)+'</span><h2 id="eloriaModalTitle">'+esc(o.modalTitle)+'</h2><p>'+esc(o.modalSubtitle)+'</p><div class="eloria-quantity"><button type="button" data-qty="-1">-</button><output id="eloriaQty">1</output><button type="button" data-qty="1">+</button></div><label>'+esc(o.engravingLabel)+'<input maxlength="'+clamp(o.engravingMaxLength,0,40,18)+'" placeholder="'+attr(o.engravingPlaceholder)+'"></label><strong>'+esc(o.currency)+' <span id="eloriaTotal">'+esc(o.price)+'</span></strong><a href="'+attr(safeUrl(o.checkoutUrl,'#'))+'" data-checkout>'+esc(o.checkoutLabel)+'</a><small>'+esc(o.demoDisclaimer)+'</small></div></section></div><script>'+journeyScript(o)+'</script></body></html>';
}

function css(o){
  return ':root{--plum:'+attr(o.primaryColor)+';--pink:'+attr(o.secondaryColor)+';--ink:'+attr(o.backgroundColor)+';--paper:'+attr(o.textColor)+';--soft:'+attr(o.surfaceColor)+';--muted:'+attr(o.mutedTextColor)+'}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--ink);color:var(--paper);font-family:"Anta","Cormorant Garamond",Georgia,serif;overflow-x:hidden}button,a,input{font:inherit}.eloria-page{min-height:100vh;background:var(--ink);overflow:hidden}.eloria-nav{position:fixed;z-index:80;inset:0 0 auto;height:78px;display:flex;align-items:center;gap:26px;padding:0 34px;color:#fff}.eloria-nav a,.eloria-nav button{color:#fff;text-decoration:none;background:transparent;border:0;text-transform:uppercase;letter-spacing:.1em;font-size:12px;cursor:pointer}.eloria-brand{font-size:22px!important;margin-right:auto;letter-spacing:.28em!important}.eloria-menu{width:42px;height:42px;border:1px solid rgba(255,255,255,.55)!important;border-radius:50%;display:grid;place-items:center}.eloria-menu span{width:17px;height:1px;background:#fff;display:block}.eloria-lang{display:flex;gap:8px}.eloria-drawer,.eloria-search{position:fixed;z-index:120;inset:0 auto 0 0;width:min(390px,100%);background:#fff6f6;color:#270f22;transform:translateX(-105%);transition:transform .36s;padding:34px;display:grid;align-content:start;gap:24px}.eloria-drawer.open,.eloria-search.open{transform:translateX(0)}.eloria-drawer a{color:inherit;text-decoration:none;font-size:36px}.eloria-search label{display:grid;gap:12px;font-size:34px}.eloria-search input{border:0;border-bottom:1px solid #270f22;background:transparent;padding:16px 0}.eloria-scene{position:relative;min-height:100vh;padding:120px 6vw}.eloria-anchor{position:absolute;top:50vh;left:50%;width:1px;height:1px;pointer-events:none}.eloria-hero{height:100vh;display:grid;place-items:center;text-align:center;padding:0 20px;overflow:hidden}.eloria-hero-bg,.eloria-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.eloria-hero-bg:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,rgba(255,175,211,.08),rgba(28,5,24,.58) 58%,rgba(20,2,17,.76))}.eloria-top-cloud{position:absolute;top:-3vw;left:50%;width:min(660px,72vw);transform:translateX(-50%);opacity:.92;mix-blend-mode:screen}.eloria-hero-copy{position:relative;z-index:12;display:grid;justify-items:center}.eloria-hero-copy span,.eloria-section-title span,.eloria-ritual span,.eloria-story-copy span,.eloria-final span,.eloria-commercial-card span{font-family:Anta,Arial,sans-serif;text-transform:uppercase;letter-spacing:.28em;font-size:12px;color:#fff}.eloria-hero h1{font-family:"Cormorant SC","Cormorant Garamond",Georgia,serif;font-size:clamp(60px,12vw,178px);line-height:.72;margin:18px 0;text-transform:uppercase;letter-spacing:.02em}.eloria-hero h1 strong,.eloria-hero h1 em{display:block;font-style:normal}.eloria-hero p{max-width:560px;font-size:18px;line-height:1.55;color:#ffe7f2}.eloria-hero button,.eloria-final button,.eloria-product-card button,.eloria-commercial-card a{border:1px solid rgba(255,255,255,.65);border-radius:999px;background:rgba(255,255,255,.14);color:#fff;padding:14px 22px;text-decoration:none;cursor:pointer}.eloria-hud{position:absolute;left:32px;bottom:28px;z-index:12;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.16em}.eloria-hud strong{display:block;font-size:22px;letter-spacing:.04em}.eloria-volume{position:absolute;right:32px;bottom:28px;z-index:12;width:54px;height:54px;border-radius:50%;border:1px solid rgba(255,255,255,.55);background:transparent;color:#fff}.eloria-star-img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 38px 58px rgba(0,0,0,.38))}#eloriaStarProduct{position:fixed;left:50%;top:50%;width:min(280px,34vw);height:min(520px,66vh);z-index:35;pointer-events:none;transform:translate3d(0,0,0);will-change:transform,opacity}.eloria-ingredients{background:linear-gradient(180deg,#f0a9bd,#efc1cb 55%,#3a0e2c);color:#300c25}.eloria-section-title{text-align:center;max-width:760px;margin:0 auto 56px}.eloria-section-title h2,.eloria-ritual h2,.eloria-story-copy h2,.eloria-final h2{font-family:"Cormorant SC","Cormorant Garamond",Georgia,serif;font-size:clamp(46px,7vw,110px);line-height:.82;text-transform:uppercase;margin:16px 0}.eloria-section-title p{font-size:18px;line-height:1.55}.eloria-ingredient-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;position:relative;z-index:8}.eloria-ingredient{min-height:310px;background:rgba(255,255,255,.34);border:1px solid rgba(255,255,255,.36);padding:22px;border-radius:8px;backdrop-filter:blur(18px)}.eloria-ingredient img{width:54px;height:54px;object-fit:contain}.eloria-ingredient span,.eloria-product-card span{display:block;margin-top:24px;font-family:Anta,Arial,sans-serif;font-size:12px;letter-spacing:.18em}.eloria-ingredient h3,.eloria-product-card h3{font-size:24px;margin:12px 0 8px}.eloria-ingredient p,.eloria-product-card p{line-height:1.55}.eloria-collection{background:#1b0717}.eloria-product-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;position:relative;z-index:8}.eloria-product-card{border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);padding:16px;border-radius:8px}.eloria-product-card div{aspect-ratio:3/4;background:#2c1024;display:grid;place-items:center;overflow:hidden}.eloria-card-img{width:100%;height:100%;object-fit:contain}.eloria-ritual{background:#f6d3db;color:#30101f;display:grid;grid-template-columns:.82fr 1.18fr;gap:7vw;align-items:center}.eloria-ritual ol{list-style:none;margin:0;padding:0;display:grid;gap:18px}.eloria-ritual li{border-top:1px solid rgba(48,16,31,.2);padding-top:18px}.eloria-ritual strong{display:block;font-size:30px}.eloria-story{background:#120410;display:grid;grid-template-columns:1.05fr .95fr;gap:7vw;align-items:center}.eloria-story-media{min-height:620px;overflow:hidden;border-radius:8px}.eloria-story-img{width:100%;height:100%;object-fit:cover}.eloria-story-copy p{font-size:18px;line-height:1.7;color:#f3c7d8}.eloria-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:34px;background:rgba(255,255,255,.16)}.eloria-facts article{background:#170716;padding:22px}.eloria-facts strong{display:block;font-size:28px}.eloria-facts span{font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:#f1b8cf}.eloria-final{min-height:90vh;display:grid;place-items:center;text-align:center;background:radial-gradient(circle at center,#8d2e63,#210819 72%)}.eloria-final p{max-width:560px;line-height:1.65}.eloria-footer{display:flex;justify-content:space-between;gap:20px;padding:36px 5vw;background:#0d030b;color:#f7c6d9;font-size:12px;text-transform:uppercase;letter-spacing:.14em}.eloria-footer a{color:#fff}.eloria-commercial{position:fixed;z-index:140;inset:0;background:rgba(14,2,11,.72);display:grid;place-items:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .25s}.eloria-commercial.open{opacity:1;pointer-events:auto}.eloria-commercial-card{width:min(440px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff6f7;color:#2b0d20;border-radius:10px;padding:24px;text-align:center}.eloria-commercial-card>button,.eloria-drawer button,.eloria-search button{justify-self:end;border:0;background:transparent;color:inherit;cursor:pointer}.eloria-commercial-card img{width:132px;height:230px;object-fit:contain}.eloria-quantity{display:flex;justify-content:center;align-items:center;gap:16px;margin:16px 0}.eloria-quantity button{width:38px;height:38px;border-radius:50%;border:1px solid #d7a9b9;background:#fff}.eloria-commercial-card label{display:grid;gap:8px;text-align:left;margin:16px 0}.eloria-commercial-card input{border:1px solid #e2bdca;border-radius:8px;padding:12px}.eloria-commercial-card a{display:block;background:#381026;color:#fff;border:0;margin-top:14px}@media(max-width:980px){.eloria-nav a:not(.eloria-brand),.eloria-nav>button:not(.eloria-menu),.eloria-lang{display:none}.eloria-ingredient-grid{grid-template-columns:repeat(2,1fr)}.eloria-product-grid{grid-template-columns:repeat(2,1fr)}.eloria-ritual,.eloria-story{grid-template-columns:1fr}#eloriaStarProduct{width:min(230px,42vw)}}@media(max-width:620px){.eloria-nav{padding:0 18px}.eloria-brand{font-size:16px!important}.eloria-hero h1{font-size:clamp(54px,18vw,84px)}.eloria-hero p{font-size:15px}.eloria-hud{left:18px}.eloria-volume{right:18px}.eloria-ingredient-grid,.eloria-product-grid,.eloria-facts{grid-template-columns:1fr}.eloria-scene{padding-left:22px;padding-right:22px}#eloriaStarProduct{width:160px;height:330px}.eloria-footer{display:grid}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}';
}

function journeyScript(o){
  return '(function(){var star=document.getElementById("eloriaStarProduct"),anchors=[].slice.call(document.querySelectorAll("[data-product-anchor]")),drawer=document.getElementById("eloriaDrawer"),search=document.getElementById("eloriaSearch"),commercial=document.getElementById("eloriaCommercial"),qty=document.getElementById("eloriaQty"),total=document.getElementById("eloriaTotal"),price='+JSON.stringify(Number(o.price)||0)+',q=1,raf=0,dirty=true,points=[],enabled='+JSON.stringify(bool(o.journeyEnabled,true))+',reduced='+JSON.stringify(o.journeyReducedMotion==='static'||o.journeyReducedMotion===true)+',smoothing='+JSON.stringify(clamp(o.journeySmoothing,0,1,.18))+',state=null;function read(anchor){return{x:Number(anchor.dataset.x)||0,y:Number(anchor.dataset.y)||0,scale:Number(anchor.dataset.scale)||1,rotation:Number(anchor.dataset.rotation)||0,opacity:Number(anchor.dataset.opacity||1),z:Number(anchor.dataset.z)||30,origin:anchor.dataset.origin||"50% 50%",top:anchor.getBoundingClientRect().top+scrollY}}function measure(){points=anchors.filter(function(a){return a.offsetParent!==null}).map(read).sort(function(a,b){return a.top-b.top});dirty=false}function mix(a,b,t,k){return a[k]+(b[k]-a[k])*t}function ease(t){var mode='+JSON.stringify(o.journeyEasing||'smoothstep')+';return mode==="linear"?t:t*t*(3-2*t)}function apply(next){if(!star||!next)return;if(!state)state=Object.assign({},next);var s=reduced?1:smoothing;Object.keys(next).forEach(function(k){if(k==="origin")state[k]=next[k];else state[k]=state[k]+(next[k]-state[k])*s});star.style.opacity=String(state.opacity);star.style.zIndex=String(Math.round(state.z));star.style.transformOrigin=state.origin;star.style.transform="translate3d(calc(-50% + "+state.x+"vw),calc(-50% + "+state.y+"vh),0) scale("+state.scale+") rotate("+state.rotation+"deg)"}function update(){raf=0;if(!enabled||!star)return;if(dirty)measure();if(!points.length)return;var y=scrollY+innerHeight*.5,a=points[0],b=points[points.length-1];for(var i=0;i<points.length-1;i++){if(y>=points[i].top&&y<=points[i+1].top){a=points[i];b=points[i+1];break}}var span=Math.max(1,b.top-a.top),t=Math.max(0,Math.min(1,(y-a.top)/span));t=ease(t);apply({x:mix(a,b,t,"x"),y:mix(a,b,t,"y"),scale:mix(a,b,t,"scale"),rotation:mix(a,b,t,"rotation"),opacity:mix(a,b,t,"opacity"),z:mix(a,b,t,"z"),origin:t<.5?a.origin:b.origin})}function request(){if(!raf)raf=requestAnimationFrame(update)}function openLayer(el){if(el){el.classList.add("open");el.setAttribute("aria-hidden","false")}}function closeLayers(){[drawer,search,commercial].forEach(function(el){if(el){el.classList.remove("open");el.setAttribute("aria-hidden","true")}})}addEventListener("scroll",request,{passive:true});addEventListener("resize",function(){dirty=true;request()});addEventListener("orientationchange",function(){dirty=true;request()});addEventListener("pagehide",function(){cancelAnimationFrame(raf);raf=0});document.querySelectorAll("[data-open-drawer]").forEach(function(b){b.addEventListener("click",function(){openLayer(drawer)})});document.querySelectorAll("[data-open-search]").forEach(function(b){b.addEventListener("click",function(){openLayer(search)})});document.querySelectorAll("[data-open-commercial]").forEach(function(b){b.addEventListener("click",function(){var title=document.getElementById("eloriaModalTitle");if(b.dataset.product&&title)title.textContent=b.dataset.product;openLayer(commercial)})});document.querySelectorAll("[data-close-layer]").forEach(function(b){b.addEventListener("click",closeLayers)});document.addEventListener("keydown",function(e){if(e.key==="Escape")closeLayers()});document.querySelectorAll("[data-qty]").forEach(function(b){b.addEventListener("click",function(){q=Math.max(1,q+Number(b.dataset.qty));if(qty)qty.textContent=q;if(total)total.textContent=String(Math.round(price*q*100)/100)})});document.querySelectorAll("[data-lang]").forEach(function(b){b.addEventListener("click",function(){document.documentElement.lang=b.dataset.lang})});measure();request();})();';
}

var DEFAULTS={
  presetId:'eloria-signature',
  brand:'ELORIA',
  productName:'Eloria Signature',
  heroKicker:'NUEVO LUJO',
  heroTitleLine1:'ELORIA',
  heroTitleLine2:'FRAGANCIA',
  heroSubtitle:'Un perfume digital de alta fidelidad: fondo original, nube rosa, botella protagonista y compra demo editable.',
  primaryCtaLabel:'Descubrir producto',
  primaryCtaUrl:'#eloriaCollection',
  productCardCtaLabel:'Descubrir producto',
  searchPlaceholder:'Buscar notas, rituales o producto',
  hudLabel:'Eloria mood',
  hudValue:'Nocturne 01',
  price:'148',
  currency:'EUR',
  volume:'50 ml',
  checkoutUrl:'#',
  checkoutLabel:'Continuar',
  modalEyebrow:'Compra demo',
  modalTitle:'Eloria Signature',
  modalSubtitle:'Selecciona cantidad, grabado y revisa el total. No se procesa ninguna compra real.',
  engravingLabel:'Grabado',
  engravingPlaceholder:'Iniciales',
  engravingMaxLength:18,
  demoDisclaimer:'Demo comercial. Conecta un checkout aprobado para venta real.',
  ingredientsEyebrow:'Ingredientes',
  ingredientsTitle:'Composicion luminosa',
  ingredientsSubtitle:'Cinco notas visuales sostienen el recorrido de la fragancia.',
  ingredients:[
    {name:'Rosa nocturna',description:'Un corazon floral profundo con brillo de ciruela.'},
    {name:'Pimienta rosa',description:'Chispa inicial para activar la composicion.'},
    {name:'Orquidea negra',description:'Sombra y volumen para una estela mas sofisticada.'},
    {name:'Vainilla resinosa',description:'Calidez cremosa sin perder elegancia.'},
    {name:'Almizcle blanco',description:'Un cierre limpio y envolvente.'}
  ],
  showCollection:true,
  collectionEyebrow:'Coleccion',
  collectionTitle:'Signature collection',
  collectionSubtitle:'Un repeater real de tres a seis productos, cada uno con slot propio.',
  collectionProducts:[
    {name:'Eloria Signature',volume:'50 ml',note:'La fragancia original con nube rosa y plum profundo.'},
    {name:'Eloria Veil',volume:'30 ml',note:'Una version ligera para ritual diario.'},
    {name:'Eloria Nuit',volume:'75 ml',note:'Mayor intensidad, mas sombra y una salida floral oscura.'}
  ],
  showRitual:true,
  ritualEyebrow:'Ritual',
  ritualTitle:'Aplicacion en tres gestos',
  ritualSteps:[
    {title:'Pulso',text:'Aplica en munecas sin frotar para mantener la arquitectura de salida.'},
    {title:'Nube',text:'Vaporiza a distancia y atraviesa suavemente la estela.'},
    {title:'Tela',text:'Una ultima nota sobre tejido permite que el perfume acompane el movimiento.'}
  ],
  showBrandStory:true,
  storyEyebrow:'Maison',
  storyTitle:'Una casa de perfume construida como una escena.',
  storyText:'ELORIA combina alta cosmetica visual con una experiencia de producto editable. La botella no se repite: viaja de escena a escena como un unico objeto.',
  brandFacts:[
    {value:'01',label:'Signature launch'},
    {value:'5',label:'Notas protagonistas'},
    {value:'100%',label:'Exportable'}
  ],
  showFinalCta:true,
  finalEyebrow:'Final',
  finalTitle:'Haz que el producto llegue al centro.',
  finalText:'Una escena final con CTA, modal comercial y persistencia de medios lista para Studio.',
  finalCtaLabel:'Comprar Ahora',
  footerText:'ELORIA Signature. Demo Custom PRO para Escaparates Pro.',
  footerCtaLabel:'Solicitar demo',
  enableLanguageSwitcher:true,
  defaultLanguage:'es',
  spanishContent:[{key:'start',text:'Inicio'},{key:'buy',text:'Comprar Ahora'},{key:'search',text:'Busqueda'},{key:'discover',text:'Descubrir producto'}],
  englishContent:[{key:'start',text:'Home'},{key:'buy',text:'Buy Now'},{key:'search',text:'Search'},{key:'discover',text:'Discover product'}],
  languageContent:{es:{start:'Inicio',buy:'Comprar Ahora',search:'Busqueda',discover:'Descubrir producto'},en:{start:'Home',buy:'Buy Now',search:'Search',discover:'Discover product'}},
  primaryColor:'#4b092f',
  secondaryColor:'#f0a9bd',
  backgroundColor:'#130310',
  surfaceColor:'#fff5f7',
  textColor:'#fff7fb',
  mutedTextColor:'#ffd9e7',
  journeyEnabled:true,
  journeyIntensity:72,
  journeySmoothing:.18,
  journeyDuration:900,
  journeyEasing:'smoothstep',
  journeyReducedMotion:'snap',
  heroProductX:31,heroProductY:7,heroProductScale:1.04,heroProductRotation:0,
  ingredientsProductX:-24,ingredientsProductY:8,ingredientsProductScale:.78,ingredientsProductRotation:-6,
  collectionProductX:28,collectionProductY:5,collectionProductScale:.64,collectionProductRotation:4,
  ritualProductX:-30,ritualProductY:0,ritualProductScale:.74,ritualProductRotation:-3,
  storyProductX:27,storyProductY:-2,storyProductScale:.7,storyProductRotation:6,
  finalProductX:0,finalProductY:2,finalProductScale:.88,finalProductRotation:0
};

function field(key,type,label,def,extra){return Object.assign({key:key,type:type,label:label,default:def,group:'Contenido'},extra||{});}
function sceneFields(scene,label,defaults){
  return [
    field(scene+'ProductX','range',label+' product X',defaults.x,{min:-100,max:100,step:1,group:'Star Product Journey'}),
    field(scene+'ProductY','range',label+' product Y',defaults.y,{min:-100,max:100,step:1,group:'Star Product Journey'}),
    field(scene+'ProductScale','range',label+' product scale',defaults.scale,{min:.2,max:1.8,step:.01,group:'Star Product Journey'}),
    field(scene+'ProductRotation','range',label+' product rotation',defaults.rotation,{min:-20,max:20,step:1,group:'Star Product Journey'})
  ];
}

build.id='luxury-beauty-product-pro';
build.schema=[
  field('presetId','text','Preset id',DEFAULTS.presetId,{visible:false,group:'Identity'}),
  field('brand','text','Brand',DEFAULTS.brand,{required:true,group:'Identity'}),
  field('productName','text','Product name',DEFAULTS.productName,{group:'Identity'}),
  field('heroKicker','text','Hero kicker',DEFAULTS.heroKicker,{group:'Hero'}),
  field('heroTitleLine1','text','Hero title line 1',DEFAULTS.heroTitleLine1,{group:'Hero'}),
  field('heroTitleLine2','text','Hero title line 2',DEFAULTS.heroTitleLine2,{group:'Hero'}),
  field('heroSubtitle','textarea','Hero subtitle',DEFAULTS.heroSubtitle,{group:'Hero'}),
  field('primaryCtaLabel','cta','Primary CTA label',DEFAULTS.primaryCtaLabel,{group:'CTA'}),
  field('primaryCtaUrl','url','Primary CTA URL',DEFAULTS.primaryCtaUrl,{group:'CTA'}),
  field('productCardCtaLabel','cta','Product card CTA label',DEFAULTS.productCardCtaLabel,{group:'CTA'}),
  field('finalCtaLabel','cta','Final CTA label',DEFAULTS.finalCtaLabel,{group:'CTA'}),
  field('checkoutUrl','url','Checkout URL',DEFAULTS.checkoutUrl,{group:'CTA'}),
  field('checkoutLabel','text','Checkout label',DEFAULTS.checkoutLabel,{group:'CTA'}),
  field('searchPlaceholder','text','Search placeholder',DEFAULTS.searchPlaceholder,{group:'Navigation'}),
  field('hudLabel','text','HUD label',DEFAULTS.hudLabel,{group:'Hero'}),
  field('hudValue','text','HUD value',DEFAULTS.hudValue,{group:'Hero'}),
  field('price','text','Price',DEFAULTS.price,{group:'Commerce'}),
  field('currency','text','Currency',DEFAULTS.currency,{group:'Commerce'}),
  field('volume','text','Volume',DEFAULTS.volume,{group:'Commerce'}),
  field('modalEyebrow','text','Modal eyebrow',DEFAULTS.modalEyebrow,{group:'Commerce'}),
  field('modalTitle','text','Modal title',DEFAULTS.modalTitle,{group:'Commerce'}),
  field('modalSubtitle','textarea','Modal subtitle',DEFAULTS.modalSubtitle,{group:'Commerce'}),
  field('engravingLabel','text','Engraving label',DEFAULTS.engravingLabel,{group:'Commerce'}),
  field('engravingPlaceholder','text','Engraving placeholder',DEFAULTS.engravingPlaceholder,{group:'Commerce'}),
  field('engravingMaxLength','number','Engraving max length',DEFAULTS.engravingMaxLength,{min:0,max:40,step:1,group:'Commerce'}),
  field('demoDisclaimer','textarea','Demo disclaimer',DEFAULTS.demoDisclaimer,{group:'Commerce'}),
  field('ingredientsEyebrow','text','Ingredients eyebrow',DEFAULTS.ingredientsEyebrow,{group:'Ingredients'}),
  field('ingredientsTitle','text','Ingredients title',DEFAULTS.ingredientsTitle,{group:'Ingredients'}),
  field('ingredientsSubtitle','textarea','Ingredients subtitle',DEFAULTS.ingredientsSubtitle,{group:'Ingredients'}),
  field('ingredients','repeater','Ingredients',DEFAULTS.ingredients,{itemFields:[{key:'name',label:'Name',type:'text'},{key:'description',label:'Description',type:'text'}],group:'Ingredients'}),
  field('showCollection','boolean','Show collection',DEFAULTS.showCollection,{group:'Collection'}),
  field('collectionEyebrow','text','Collection eyebrow',DEFAULTS.collectionEyebrow,{group:'Collection'}),
  field('collectionTitle','text','Collection title',DEFAULTS.collectionTitle,{group:'Collection'}),
  field('collectionSubtitle','textarea','Collection subtitle',DEFAULTS.collectionSubtitle,{group:'Collection'}),
  field('collectionProducts','repeater','Collection products',DEFAULTS.collectionProducts,{itemFields:[{key:'name',label:'Name',type:'text'},{key:'volume',label:'Volume',type:'text'},{key:'note',label:'Note',type:'text'}],minItems:3,maxItems:6,group:'Collection'}),
  field('showRitual','boolean','Show ritual',DEFAULTS.showRitual,{group:'Ritual'}),
  field('ritualEyebrow','text','Ritual eyebrow',DEFAULTS.ritualEyebrow,{group:'Ritual'}),
  field('ritualTitle','text','Ritual title',DEFAULTS.ritualTitle,{group:'Ritual'}),
  field('ritualSteps','repeater','Ritual steps',DEFAULTS.ritualSteps,{itemFields:[{key:'title',label:'Title',type:'text'},{key:'text',label:'Text',type:'text'}],group:'Ritual'}),
  field('showBrandStory','boolean','Show brand story',DEFAULTS.showBrandStory,{group:'Brand Story'}),
  field('storyEyebrow','text','Story eyebrow',DEFAULTS.storyEyebrow,{group:'Brand Story'}),
  field('storyTitle','text','Story title',DEFAULTS.storyTitle,{group:'Brand Story'}),
  field('storyText','textarea','Story text',DEFAULTS.storyText,{group:'Brand Story'}),
  field('brandFacts','repeater','Brand facts',DEFAULTS.brandFacts,{itemFields:[{key:'value',label:'Value',type:'text'},{key:'label',label:'Label',type:'text'}],group:'Brand Story'}),
  field('showFinalCta','boolean','Show final CTA',DEFAULTS.showFinalCta,{group:'Final CTA'}),
  field('finalEyebrow','text','Final eyebrow',DEFAULTS.finalEyebrow,{group:'Final CTA'}),
  field('finalTitle','text','Final title',DEFAULTS.finalTitle,{group:'Final CTA'}),
  field('finalText','textarea','Final text',DEFAULTS.finalText,{group:'Final CTA'}),
  field('footerText','text','Footer text',DEFAULTS.footerText,{group:'Footer'}),
  field('footerCtaLabel','cta','Footer CTA label',DEFAULTS.footerCtaLabel,{group:'Footer'}),
  field('enableLanguageSwitcher','boolean','Enable language switcher',DEFAULTS.enableLanguageSwitcher,{group:'Language'}),
  field('defaultLanguage','select','Default language',DEFAULTS.defaultLanguage,{options:[['es','Spanish'],['en','English']],group:'Language'}),
  field('spanishContent','repeater','Spanish content',DEFAULTS.spanishContent,{itemFields:[{key:'key',label:'Key',type:'text'},{key:'text',label:'Text',type:'text'}],group:'Language'}),
  field('englishContent','repeater','English content',DEFAULTS.englishContent,{itemFields:[{key:'key',label:'Key',type:'text'},{key:'text',label:'Text',type:'text'}],group:'Language'}),
  field('languageContent','object','Advanced language map',DEFAULTS.languageContent,{description:'Advanced JSON for additional translated UI labels.',group:'Language'}),
  field('primaryColor','color','Primary color',DEFAULTS.primaryColor,{group:'Style'}),
  field('secondaryColor','color','Secondary color',DEFAULTS.secondaryColor,{group:'Style'}),
  field('backgroundColor','color','Background color',DEFAULTS.backgroundColor,{group:'Style'}),
  field('surfaceColor','color','Surface color',DEFAULTS.surfaceColor,{group:'Style'}),
  field('textColor','color','Text color',DEFAULTS.textColor,{group:'Style'}),
  field('mutedTextColor','color','Muted text color',DEFAULTS.mutedTextColor,{group:'Style'}),
  field('headlineTypography','typography','Headline typography',{family:'Cormorant SC',weight:'700',size:128},{group:'Typography'}),
  field('bodyTypography','typography','Body typography',{family:'Anta',weight:'400',size:16},{group:'Typography'}),
  field('responsiveCopy','responsive','Responsive helper copy',{desktop:'Full ELORIA journey',tablet:'ELORIA tablet',mobile:'ELORIA mobile'},{group:'Responsive'}),
  field('journeyEnabled','boolean','Journey enabled',DEFAULTS.journeyEnabled,{group:'Star Product Journey'}),
  field('journeyIntensity','range','Journey intensity',DEFAULTS.journeyIntensity,{min:0,max:100,step:1,group:'Star Product Journey'}),
  field('journeySmoothing','range','Journey smoothing',DEFAULTS.journeySmoothing,{min:0,max:1,step:.01,group:'Star Product Journey'}),
  field('journeyDuration','range','Journey duration',DEFAULTS.journeyDuration,{min:0,max:3000,step:50,group:'Star Product Journey'}),
  field('journeyEasing','select','Journey easing',DEFAULTS.journeyEasing,{options:[['smoothstep','Smoothstep'],['linear','Linear']],group:'Star Product Journey'}),
  field('journeyReducedMotion','select','Reduced motion behavior',DEFAULTS.journeyReducedMotion,{options:[['snap','Snap'],['static','Static']],group:'Star Product Journey'})
].concat(sceneFields('hero','Hero',{x:31,y:7,scale:1.04,rotation:0}),sceneFields('ingredients','Ingredients',{x:-24,y:8,scale:.78,rotation:-6}),sceneFields('collection','Collection',{x:28,y:5,scale:.64,rotation:4}),sceneFields('ritual','Ritual',{x:-30,y:0,scale:.74,rotation:-3}),sceneFields('story','Story',{x:27,y:-2,scale:.7,rotation:6}),sceneFields('final','Final',{x:0,y:2,scale:.88,rotation:0}));

var MEDIA_SLOTS=[
  {id:'heroBackground',label:'ELORIA hero background',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.hero,recommendedAspectRatio:'16:9',semanticUse:'Original ELORIA hero background'},
  {id:'starProduct',label:'Star product bottle',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.bottle,recommendedAspectRatio:'3:5',semanticUse:'Single product image used by the Journey Engine'},
  {id:'topCloud',label:'Top pink cloud',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.cloud,recommendedAspectRatio:'16:9',semanticUse:'Original ELORIA pink cloud'},
  {id:'ingredientIcon1',label:'Ingredient icon 1',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.icon1,recommendedAspectRatio:'1:1'},
  {id:'ingredientIcon2',label:'Ingredient icon 2',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.icon2,recommendedAspectRatio:'1:1'},
  {id:'ingredientIcon3',label:'Ingredient icon 3',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.icon3,recommendedAspectRatio:'1:1'},
  {id:'ingredientIcon4',label:'Ingredient icon 4',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.icon4,recommendedAspectRatio:'1:1'},
  {id:'ingredientIcon5',label:'Ingredient icon 5',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.icon5,recommendedAspectRatio:'1:1'},
  {id:'collectionProduct1',label:'Collection product 1',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.bottle,recommendedAspectRatio:'3:4'},
  {id:'collectionProduct2',label:'Collection product 2',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.bottle,recommendedAspectRatio:'3:4'},
  {id:'collectionProduct3',label:'Collection product 3',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.bottle,recommendedAspectRatio:'3:4'},
  {id:'collectionProduct4',label:'Collection product 4',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.bottle,recommendedAspectRatio:'3:4'},
  {id:'collectionProduct5',label:'Collection product 5',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.bottle,recommendedAspectRatio:'3:4'},
  {id:'collectionProduct6',label:'Collection product 6',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.bottle,recommendedAspectRatio:'3:4'},
  {id:'storyMedia',label:'Brand story media',type:'image',accepts:['image/*'],fallback:ELORIA_ASSETS.hero,recommendedAspectRatio:'4:5'},
  {id:'logo',label:'Logo',type:'image',accepts:['image/*'],fallback:'',recommendedAspectRatio:'1:1'}
];

var botanicalDefaults=Object.assign({},DEFAULTS,{
  presetId:'botanical-editorial',
  brand:'WILD DAISY',
  productName:'Botanical Veil',
  heroKicker:'BOTANICAL EDITORIAL',
  heroTitleLine1:'SOFT',
  heroTitleLine2:'RITUAL',
  heroSubtitle:'A calmer editorial preset sharing the same Star Product Journey Engine.',
  primaryColor:'#1f1a17',
  secondaryColor:'#c49a4a',
  backgroundColor:'#f3eadc',
  surfaceColor:'#fffaf0',
  textColor:'#1b1714',
  mutedTextColor:'#6e6254',
  journeyIntensity:42,
  journeySmoothing:.12
});
var PRESETS=[
  {id:'default',label:'Default ELORIA base',visible:false,defaults:DEFAULTS,media:{}},
  {id:'eloria-signature',label:'ELORIA Signature',visible:true,defaults:DEFAULTS,media:{heroBackground:ELORIA_ASSETS.hero,starProduct:ELORIA_ASSETS.bottle,topCloud:ELORIA_ASSETS.cloud,ingredientIcon1:ELORIA_ASSETS.icon1,ingredientIcon2:ELORIA_ASSETS.icon2,ingredientIcon3:ELORIA_ASSETS.icon3,ingredientIcon4:ELORIA_ASSETS.icon4,ingredientIcon5:ELORIA_ASSETS.icon5,storyMedia:ELORIA_ASSETS.hero}},
  {id:'plum-signature',label:'Plum Signature (legacy alias)',visible:false,defaults:DEFAULTS,media:{heroBackground:ELORIA_ASSETS.hero,starProduct:ELORIA_ASSETS.bottle,topCloud:ELORIA_ASSETS.cloud,ingredientIcon1:ELORIA_ASSETS.icon1,ingredientIcon2:ELORIA_ASSETS.icon2,ingredientIcon3:ELORIA_ASSETS.icon3,ingredientIcon4:ELORIA_ASSETS.icon4,ingredientIcon5:ELORIA_ASSETS.icon5,storyMedia:ELORIA_ASSETS.hero}},
  {id:'botanical-editorial',label:'Botanical Editorial',visible:true,defaults:botanicalDefaults,media:{heroBackground:BOTANICAL_ASSETS.hero,starProduct:BOTANICAL_ASSETS.bottle,topCloud:BOTANICAL_ASSETS.cloud,storyMedia:BOTANICAL_ASSETS.hero}}
];

if(EP.SectorBlueprints&&EP.SectorBlueprints.register)EP.SectorBlueprints.register(build);
if(EP.StudioTemplateRegistry&&EP.StudioTemplateRegistry.register&&!EP.StudioTemplateRegistry.get('luxury-beauty-product-pro')){
  EP.StudioTemplateRegistry.register({
    id:'luxury-beauty-product-pro',
    familyId:'luxury-beauty-product',
    version:2,
    title:'Luxury Beauty Product',
    shortTitle:'Luxury Beauty',
    description:'ELORIA Signature Custom PRO with a single Star Product Journey Engine and editable beauty commerce scenes.',
    category:'Sector Blueprints',
    sector:'Beauty & Fragrance',
    status:'production',
    templateType:'custom-pro',
    templateKind:'blueprint',
    visible:true,
    builder:{kind:'blueprint',id:'luxury-beauty-product-pro'},
    sourceFaithfulReference:'https://juanmaes83.github.io/ELORIA-New-Luxury-Fragrance/',
    thumbnail:{label:'LB'},
    tags:['beauty','fragrance','eloria','custom-pro','journey-engine'],
    schema:build.schema,
    mediaSlots:MEDIA_SLOTS,
    presets:PRESETS
  });
}
})();
