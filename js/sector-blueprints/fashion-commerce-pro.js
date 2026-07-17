(function(){
'use strict';
window.EP=window.EP||{};

var VIDEO_BASE='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/';
var RUBIK_MEDIA={
  heroVideo:VIDEO_BASE+'hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4',
  campaignVideo1:VIDEO_BASE+'hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4',
  campaignVideo2:VIDEO_BASE+'hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4',
  campaignVideo3:VIDEO_BASE+'hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4',
  campaignVideo4:VIDEO_BASE+'hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4',
  heroPoster:'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1920&q=80',
  product1:'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900&q=80',
  product2:'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=900&q=80',
  product3:'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80',
  product4:'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&q=80',
  product5:'https://images.unsplash.com/photo-1533050487297-09b450131914?w=900&q=80',
  product6:'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&q=80',
  product7:'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=900&q=80',
  product8:'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&q=80',
  product9:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80',
  product10:'https://images.unsplash.com/photo-1544441893-675973e31985?w=900&q=80'
};

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function attr(value){return esc(value).replace(/`/g,'&#96;');}
function bool(value,fallback){if(value===true||value===false)return value;if(value==='true'||value===1||value==='1')return true;if(value==='false'||value===0||value==='0')return false;return fallback;}
function clamp(value,min,max,fallback){value=Number(value);return Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;}
function safeUrl(value,fallback){value=String(value||'').trim();return /^(https?:|mailto:|tel:|#)/i.test(value)?value:(fallback||'#');}
function money(value,currency,locale){var n=Number(value);if(!Number.isFinite(n))n=0;try{return new Intl.NumberFormat(locale||'es-ES',{style:'currency',currency:currency||'EUR'}).format(n);}catch(e){return (currency||'EUR')+' '+n.toFixed(2);}}
function normalizeMedia(list){return (list||[]).filter(Boolean).map(function(item){return {slot:item.slot||'',type:item.type||'image',url:item.url||(item.element&&(item.element.currentSrc||item.element.src))||''};});}
function mediaFor(media,id,fallback,type){var item=media.filter(function(candidate){return candidate.slot===id;})[0]||null;return item&&item.url?item:{slot:id,type:type||'image',url:fallback||''};}
function products(value){var source=Array.isArray(value)?value:DEFAULTS.products;var list=source.slice(0,10).map(function(item,index){return Object.assign({},DEFAULTS.products[index%DEFAULTS.products.length],item||{});});while(list.length<4)list.push(Object.assign({},DEFAULTS.products[list.length]));return list;}
function objectValue(value,fallback){return Object.assign({},fallback,value&&typeof value==='object'?value:{});}
function responsiveConfig(value){
  var defaults={desktop:{minHeight:100,contentAlign:'center',titleScale:1,videoPosition:'center center',overlayStrength:78},tablet:{minHeight:92,contentAlign:'center',titleScale:.82,videoPosition:'center center',overlayStrength:82},mobile:{minHeight:86,contentAlign:'end',titleScale:.58,videoPosition:'center center',overlayStrength:88,navigationMode:'overlay'}};
  var source=value&&typeof value==='object'?value:{};
  ['desktop','tablet','mobile'].forEach(function(viewport){
    if(typeof source[viewport]==='string')source[viewport]=Object.assign({},defaults[viewport],{note:source[viewport]});
    source[viewport]=Object.assign({},defaults[viewport],source[viewport]||{});
  });
  return source;
}
function alignValue(value){return /^(start|center|end)$/i.test(String(value||''))?String(value).toLowerCase():'center';}
function pxPercent(value,min,max,fallback){return clamp(value,min,max,fallback);}
function i18n(o){
  var es={
    volumeLabel:o.volumeLabel,navHero:o.navHero,navGallery:o.navGallery,navLookbook:o.navLookbook,navVideos:o.navVideos,navMenu:'Menú',navClose:'Cerrar menú',languageLabel:'Cambiar idioma',heroEyebrow:o.heroEyebrow,heroTitle:o.heroTitle,heroSubtitleLine:[o.heroSubtitle,o.season].filter(Boolean).join(' · '),heroCtaLabel:o.heroCtaLabel,galleryEyebrow:o.galleryEyebrow,galleryTitle:o.galleryTitle,runwayLabel:o.runwayLabel,runwayStopLabel:o.runwayStopLabel,lookbookLabel:'02 / LOOKBOOK',lookbookTitle:o.lookbookTitle,lookbookIntro:o.lookbookIntro,lookbookCtaLabel:o.lookbookCtaLabel,videosLabel:'03 / CAMPAIGN FILMS',floatingCtaLabel:o.floatingCtaLabel,wishlistLabel:o.wishlistLabel,cartLabel:o.cartLabel,demoDisclaimer:o.demoDisclaimer,modalClose:'Cerrar',wishlistToast:'Añadido a deseos: ',cartToast:'Añadido al carrito demo: ',cartTitle:'Carrito demo',wishlistTitle:'Lista de deseos',emptyCart:'Tu carrito demo está vacío.',emptyWishlist:'Tu wishlist está vacía.',subtotalLabel:'Subtotal demo',removeLabel:'Eliminar',qtyLabel:'Cantidad',openCartLabel:'Abrir carrito',openWishlistLabel:'Abrir deseos',sizeLabel:'Talla',colorLabel:'Color',sectionHero:'Hero',sectionGallery:'Galería',sectionLookbook:'Lookbook',sectionVideos:'Videos',skipIntro:'Saltar intro',backToTop:'Volver arriba',dragHint:'Arrastra'};
  var en={
    volumeLabel:'VOLUME 01',navHero:'HERO',navGallery:'GALLERY',navLookbook:'LOOKBOOK',navVideos:'VIDEOS',navMenu:'Menu',navClose:'Close menu',languageLabel:'Change language',heroEyebrow:'COLLECTION / VOLUME 01',heroTitle:'DISRUPTION',heroSubtitleLine:[o.heroSubtitle==='VOLUMEN 01'?'VOLUME 01':o.heroSubtitle,o.season==='INVIERNO 2025'?'WINTER 2025':o.season].filter(Boolean).join(' · '),heroCtaLabel:o.heroCtaLabel==='Ver la colección'?'View collection':o.heroCtaLabel,galleryEyebrow:'GALLERY',galleryTitle:o.galleryTitle==='La calle no espera.'?'The street does not wait.':o.galleryTitle,runwayLabel:o.runwayLabel.indexOf('MODO PASARELA')>-1?'▶ RUNWAY MODE':o.runwayLabel,runwayStopLabel:o.runwayStopLabel==='DETENER PASARELA'?'STOP RUNWAY':o.runwayStopLabel,lookbookLabel:'02 / LOOKBOOK',lookbookTitle:o.lookbookTitle==='Lookbook editorial'?'Editorial lookbook':o.lookbookTitle,lookbookIntro:'A sequence of looks, materials and urban attitude that keeps the brutalist pulse of the source.',lookbookCtaLabel:o.lookbookCtaLabel==='Explorar galería'?'Explore gallery':o.lookbookCtaLabel,videosLabel:'03 / CAMPAIGN FILMS',floatingCtaLabel:o.floatingCtaLabel==='CONSIGUE LA COLECCIÓN'?'GET THE COLLECTION':o.floatingCtaLabel,wishlistLabel:o.wishlistLabel==='Deseos'?'Wishlist':o.wishlistLabel,cartLabel:o.cartLabel==='Añadir al carrito'?'Add to cart':o.cartLabel,demoDisclaimer:'Local demo. It does not process real payments, stock or reservations.',modalClose:'Close',wishlistToast:'Added to wishlist: ',cartToast:'Added to demo cart: ',cartTitle:'Demo cart',wishlistTitle:'Wishlist',emptyCart:'Your demo cart is empty.',emptyWishlist:'Your wishlist is empty.',subtotalLabel:'Demo subtotal',removeLabel:'Remove',qtyLabel:'Quantity',openCartLabel:'Open cart',openWishlistLabel:'Open wishlist',sizeLabel:'Size',colorLabel:'Color',sectionHero:'Hero',sectionGallery:'Gallery',sectionLookbook:'Lookbook',sectionVideos:'Videos',skipIntro:'Skip intro',backToTop:'Back to top',dragHint:'Drag'};
  return {es:es,en:en};
}
function mediaImage(item,className,alt,loading){return '<img class="'+className+'" src="'+attr(item.url)+'" alt="'+attr(alt||'')+'" loading="'+(loading||'lazy')+'">';}
function mediaVideo(item,className,poster){return '<video class="'+className+'" autoplay loop muted playsinline preload="metadata" poster="'+attr(poster||'')+'"><source src="'+attr(item.url)+'" type="video/mp4"></video>';}

function build(mediaInput,raw){
  var media=normalizeMedia(mediaInput);
  var o=Object.assign({},DEFAULTS,raw||{});
  var lang=String(o.language||'es')==='en'?'en':'es';
  var list=products(o.products);
  var heroVideo=mediaFor(media,'heroVideo',RUBIK_MEDIA.heroVideo,'video');
  var heroPoster=mediaFor(media,'heroPoster',RUBIK_MEDIA.heroPoster,'image');
  var logo=mediaFor(media,'logo','','image');
  var responsive=responsiveConfig(o.responsiveHero);
  var dictionary=i18n(o);
  var gallery=list.map(function(product,index){
    var image=mediaFor(media,'product'+(index+1)+'Primary',RUBIK_MEDIA['product'+(index+1)],'image');
    return '<article class="rs-card" data-product-index="'+index+'"><button class="rs-media-button" type="button" data-open-product="'+index+'">'+mediaImage(image,'rs-card-img',product.name)+'<span class="rs-card-number">'+String(index+1).padStart(2,'0')+'</span></button><div class="rs-card-copy"><span>'+esc(product.eyebrow||product.category)+'</span><h3>'+esc(product.name)+'</h3><strong>'+esc(money(product.price,o.currency,o.priceLocale))+'</strong><button type="button" data-open-product="'+index+'">'+esc(product.ctaLabel||o.productCtaLabel)+'</button></div></article>';
  }).join('');
  var navItems=[['section0','navHero'],['section1','navGallery'],['section2','navLookbook'],['section3','navVideos']];
  var nav=navItems.map(function(item){return '<button type="button" class="rs-nav-link" data-scroll="'+item[0]+'" data-nav-target="'+item[0]+'" data-i18n="'+item[1]+'">'+esc(dictionary[lang][item[1]])+'</button>';}).join('');
  var glitch=String(o.heroTitle||'DISRUPCIÓN').split('').map(function(char){return '<span class="rs-glitch-char">'+esc(char)+'</span>';}).join('');
  var videos=['campaignVideo1','campaignVideo2','campaignVideo3','campaignVideo4'].map(function(slot,index){
    return '<article class="rs-video-tile">'+mediaVideo(mediaFor(media,slot,RUBIK_MEDIA[slot],'video'),'rs-video','')+'<span>0'+(index+1)+'</span></article>';
  }).join('');
  var heroSubtitle=[o.heroSubtitle,o.season].filter(Boolean).join(' · ');
  var brandMark=logo.url?'<img class="rs-logo" src="'+attr(logo.url)+'" alt="'+attr(o.brand)+' logo">':'<strong>'+esc(o.brand)+'</strong>';
  var m=objectValue(o.motionProfile,{intensity:70,duration:650,reducedMotion:false});
  var dataJson=JSON.stringify({
    presetId:o.presetId,
    products:list,
    currency:o.currency,
    priceLocale:o.priceLocale,
    language:lang,
    i18n:dictionary,
    responsiveHero:responsive,
    mediaSlots:MEDIA_SLOTS.map(function(slot){return slot.id;})
  }).replace(/</g,'\\u003c');
  var responsiveAttrs=' data-hero-desktop-min="'+attr(responsive.desktop.minHeight)+'" data-hero-tablet-min="'+attr(responsive.tablet.minHeight)+'" data-hero-mobile-min="'+attr(responsive.mobile.minHeight)+'" data-hero-desktop-align="'+attr(responsive.desktop.contentAlign)+'" data-hero-tablet-align="'+attr(responsive.tablet.contentAlign)+'" data-hero-mobile-align="'+attr(responsive.mobile.contentAlign)+'" data-mobile-navigation="'+attr(responsive.mobile.navigationMode)+'"';
  return '<!doctype html><html lang="'+attr(lang)+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(o.brand)+' | '+esc(o.collectionName)+'</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;700;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"><style>'+css(o,responsive)+'</style></head><body class="'+(m.reducedMotion?'motion-reduced':'')+'"><div class="rs-page" data-template="fashion-commerce-pro" data-preset="'+attr(o.presetId)+'" data-state="boot" data-language="'+attr(lang)+'"'+responsiveAttrs+'><div class="rs-progress" id="rsProgress"></div><div class="rs-grain" aria-hidden="true"></div><div class="rs-scanner" aria-hidden="true"></div><div class="rs-film-burn" aria-hidden="true"></div><div class="rs-cursor" id="rsCursor" aria-hidden="true"><span data-i18n="dragHint">'+esc(dictionary[lang].dragHint)+'</span></div>'+(bool(o.teaserEnabled,true)?'<section class="rs-teaser" id="rsTeaser" aria-label="Teaser"><div><span></span><h1>'+esc(o.brand)+'</h1><span></span><p data-i18n="volumeLabel">'+esc(dictionary[lang].volumeLabel)+'</p></div></section>':'')+(bool(o.preloaderEnabled,true)?'<section class="rs-preloader" id="rsPreloader"><strong id="rsPreloaderText"></strong></section>':'')+'<nav class="rs-nav" id="rsNav">'+brandMark+'<button type="button" class="rs-menu" id="rsMenu" aria-controls="rsNavPanel" aria-expanded="false" data-i18n-aria="navMenu"><span></span><span></span></button><div class="rs-nav-links">'+nav+'</div><button type="button" class="rs-lang" id="rsLanguage" data-i18n-aria="languageLabel" aria-label="'+attr(dictionary[lang].languageLabel)+'">'+esc(lang.toUpperCase())+'</button><button type="button" class="rs-audio" id="rsAudio" aria-pressed="false">MUTE</button><button type="button" class="rs-commerce-trigger" id="rsWishlistOpen" data-i18n-aria="openWishlistLabel" aria-label="'+attr(dictionary[lang].openWishlistLabel)+'">♡ <b id="rsWishlistCount">0</b></button><button type="button" class="rs-commerce-trigger" id="rsCartOpen" data-i18n-aria="openCartLabel" aria-label="'+attr(dictionary[lang].openCartLabel)+'">BAG <b id="rsCartCount">0</b></button><a class="rs-nav-cta" href="'+attr(safeUrl(o.heroCtaUrl,'#section1'))+'" data-i18n="heroCtaLabel">'+esc(dictionary[lang].heroCtaLabel)+'</a></nav><div class="rs-nav-panel" id="rsNavPanel" aria-hidden="true">'+nav+'<button type="button" class="rs-panel-close" id="rsPanelClose" data-i18n="navClose" data-i18n-aria="navClose">'+esc(dictionary[lang].navClose)+'</button></div><main><section class="rs-hero" id="section0">'+mediaVideo(heroVideo,'rs-hero-video',heroPoster.url)+'<div class="rs-hero-overlay"></div><div class="rs-hero-copy"><span data-i18n="heroEyebrow">'+esc(dictionary[lang].heroEyebrow)+'</span><h1 class="rs-glitch" data-i18n-glitch="heroTitle" aria-label="'+attr(dictionary[lang].heroTitle)+'">'+glitch+'</h1><p data-i18n="heroSubtitleLine">'+esc(dictionary[lang].heroSubtitleLine)+'</p></div></section><section class="rs-gallery" id="section1"><div class="rs-gallery-head"><div><span><b>01 / </b><em data-i18n="galleryEyebrow">'+esc(dictionary[lang].galleryEyebrow)+'</em></span><h2 data-i18n="galleryTitle">'+esc(dictionary[lang].galleryTitle)+'</h2></div><div class="rs-gallery-controls"><button type="button" id="rsTrackPrev" aria-label="Anterior">←</button><button type="button" id="rsRunway" data-i18n="runwayLabel">'+esc(dictionary[lang].runwayLabel)+'</button><button type="button" id="rsTrackNext" aria-label="Siguiente">→</button></div></div><div class="rs-track-shell" id="rsTrackShell" tabindex="0" aria-label="'+attr(dictionary[lang].galleryTitle)+'"><div class="rs-track" id="rsTrack">'+gallery+'</div></div><div class="rs-runway-progress" id="rsRunwayProgress" aria-hidden="true"></div></section><section class="rs-lookbook" id="section2"><span data-i18n="lookbookLabel">'+esc(dictionary[lang].lookbookLabel)+'</span><h2 data-i18n="lookbookTitle">'+esc(dictionary[lang].lookbookTitle)+'</h2><p data-i18n="lookbookIntro">'+esc(dictionary[lang].lookbookIntro)+'</p><button type="button" data-scroll="section1" data-i18n="lookbookCtaLabel">'+esc(dictionary[lang].lookbookCtaLabel)+'</button></section><section class="rs-videos" id="section3"><span data-i18n="videosLabel">'+esc(dictionary[lang].videosLabel)+'</span><div class="rs-video-grid">'+videos+'</div></section></main><button class="rs-floating" type="button" id="rsFloating" data-i18n="floatingCtaLabel">'+esc(dictionary[lang].floatingCtaLabel)+'</button><section class="rs-modal" id="rsModal" aria-hidden="true" role="dialog" aria-modal="true"><div class="rs-modal-card"><button type="button" id="rsClose" data-i18n-aria="modalClose" aria-label="'+attr(dictionary[lang].modalClose)+'">×</button><div id="rsModalMedia"></div><div><span id="rsModalEyebrow"></span><h2 id="rsModalTitle"></h2><p id="rsModalDescription"></p><strong id="rsModalPrice"></strong><div class="rs-product-options"><label><span data-i18n="sizeLabel">'+esc(dictionary[lang].sizeLabel)+'</span><select id="rsSize"><option>S</option><option selected>M</option><option>L</option><option>XL</option></select></label><label><span data-i18n="colorLabel">'+esc(dictionary[lang].colorLabel)+'</span><select id="rsColor"><option>Black</option><option>Raw denim</option><option>Concrete</option></select></label></div><div class="rs-modal-actions"><button type="button" id="rsWishlist" data-i18n="wishlistLabel">'+esc(dictionary[lang].wishlistLabel)+'</button><button type="button" id="rsCart" data-i18n="cartLabel">'+esc(dictionary[lang].cartLabel)+'</button></div><small data-i18n="demoDisclaimer">'+esc(dictionary[lang].demoDisclaimer)+'</small></div></div></section><aside class="rs-commerce-panel" id="rsCommercePanel" aria-hidden="true"><header><h2 id="rsCommerceTitle">'+esc(dictionary[lang].cartTitle)+'</h2><button type="button" id="rsCommerceClose" data-i18n-aria="modalClose" aria-label="'+attr(dictionary[lang].modalClose)+'">×</button></header><div id="rsCommerceItems" class="rs-commerce-items"></div><footer><span data-i18n="subtotalLabel">'+esc(dictionary[lang].subtotalLabel)+'</span><strong id="rsCommerceSubtotal">0</strong><small data-i18n="demoDisclaimer">'+esc(dictionary[lang].demoDisclaimer)+'</small></footer></aside><script type="application/json" id="rsData">'+dataJson+'</script><script>'+runtimeScript(o)+'</script></div></body></html>';
}

function css(o,responsive){
  responsive=responsive||responsiveConfig(o.responsiveHero);
  var m=objectValue(o.motionProfile,{intensity:70,duration:650,reducedMotion:false});
  var headline=objectValue(o.headlineTypography,{family:'Bebas Neue',weight:'400',size:160});
  var body=objectValue(o.bodyTypography,{family:'Inter',weight:'400',size:16});
  var intensity=clamp(m.intensity,0,100,70)/100;
  return ':root{--orange:'+attr(o.accentColor)+';--black:'+attr(o.backgroundColor)+';--white:'+attr(o.textColor)+';--gray:#151515;--line:rgba(255,255,255,.18);--dur:'+clamp(m.duration,0,5000,650)+'ms;--motion:'+intensity+';--headline-family:"'+attr(headline.family)+'",Impact,sans-serif;--headline-weight:'+attr(headline.weight)+';--headline-size:'+clamp(headline.size,36,220,160)+'px;--body-family:"'+attr(body.family)+'",Arial,sans-serif;--body-weight:'+attr(body.weight)+';--body-size:'+clamp(body.size,12,28,16)+'px;--hero-min:'+pxPercent(responsive.desktop.minHeight,60,120,100)+'vh;--hero-align:'+alignValue(responsive.desktop.contentAlign)+';--hero-title-scale:'+clamp(responsive.desktop.titleScale,.45,1.4,1)+';--hero-video-position:'+attr(responsive.desktop.videoPosition)+';--hero-overlay:'+clamp(responsive.desktop.overlayStrength,0,100,78)/100+'}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--black);color:var(--white);font-family:var(--body-family);font-weight:var(--body-weight);font-size:var(--body-size);overflow-x:hidden}body.motion-reduced,body.motion-reduced *{scroll-behavior:auto!important;animation:none!important;transition:none!important}button,a{font:inherit}.rs-page{background:var(--black);min-height:100vh}.rs-progress{position:fixed;z-index:200;left:0;top:0;height:3px;width:0;background:var(--orange)}.rs-grain,.rs-scanner,.rs-film-burn{position:fixed;z-index:75;inset:0;pointer-events:none;mix-blend-mode:screen}.rs-grain{opacity:calc(.18 * var(--motion));background-image:radial-gradient(circle at 20% 30%,rgba(255,255,255,.28) 0 1px,transparent 1px),radial-gradient(circle at 80% 70%,rgba(255,92,0,.2) 0 1px,transparent 1px);background-size:6px 6px,9px 9px;animation:rsGrain .7s steps(2,end) infinite}.rs-scanner{opacity:calc(.34 * var(--motion));background:linear-gradient(180deg,transparent 0 48%,rgba(255,92,0,.2) 50%,transparent 52%);transform:translateY(-100%);animation:rsScan calc(4.8s / max(var(--motion),.25)) linear infinite}.rs-film-burn{opacity:0;background:radial-gradient(circle at 8% 20%,rgba(255,92,0,.42),transparent 24%),linear-gradient(100deg,transparent,rgba(255,255,255,.18),transparent);animation:rsBurn 9s linear infinite}.rs-cursor{position:fixed;z-index:240;left:0;top:0;width:84px;height:84px;border:1px solid var(--orange);border-radius:50%;display:grid;place-items:center;color:var(--orange);font-family:"Space Mono";font-size:9px;letter-spacing:.12em;text-transform:uppercase;pointer-events:none;opacity:0;transform:translate3d(-50%,-50%,0) scale(.8);transition:opacity .2s,transform .16s}.rs-cursor.drag{opacity:1;transform:translate3d(-50%,-50%,0) scale(1)}@keyframes rsGrain{0%{transform:translate(0)}50%{transform:translate(-2px,2px)}100%{transform:translate(2px,-1px)}}@keyframes rsScan{to{transform:translateY(100%)}}@keyframes rsBurn{0%,78%,100%{opacity:0}82%{opacity:calc(.38 * var(--motion))}86%{opacity:calc(.12 * var(--motion))}}.rs-teaser,.rs-preloader{position:fixed;z-index:180;inset:0;background:#000;display:grid;place-items:center;text-align:center;transition:opacity .55s,visibility .55s}.rs-page[data-state="ready"] .rs-teaser,.rs-page[data-state="ready"] .rs-preloader,.rs-teaser.hide,.rs-preloader.hide{opacity:0;visibility:hidden;pointer-events:none}.rs-teaser h1,.rs-preloader strong{font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:clamp(48px,9vw,112px);letter-spacing:.18em;margin:0}.rs-teaser span{display:block;height:2px;width:min(420px,70vw);background:var(--orange);margin:12px auto}.rs-teaser p,.rs-hero-copy span,.rs-gallery-head span,.rs-lookbook span,.rs-videos span,.rs-card-copy span,.rs-modal-card span{font-family:"Space Mono",monospace;text-transform:uppercase;letter-spacing:.22em;font-size:11px;color:var(--orange)}.rs-preloader strong{border-right:3px solid var(--orange);padding-right:12px}.rs-nav{position:fixed;z-index:90;top:0;left:0;right:0;height:72px;display:flex;align-items:center;gap:18px;padding:0 28px;background:rgba(0,0,0,.62);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}.rs-nav strong{font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:26px;letter-spacing:.1em;margin-right:auto}.rs-logo{width:42px;height:42px;object-fit:contain;margin-right:auto}.rs-nav-links{display:flex;gap:8px;flex-wrap:wrap}.rs-menu{display:none;width:44px;height:40px;border:1px solid var(--line);background:#000;color:#fff;align-items:center;justify-content:center;gap:5px;flex-direction:column;cursor:pointer}.rs-menu span{display:block;width:18px;height:2px;background:#fff}.rs-nav-panel{position:fixed;z-index:88;inset:72px 0 auto auto;width:min(360px,100%);padding:24px;background:rgba(0,0,0,.94);border-left:1px solid var(--line);border-bottom:1px solid var(--line);display:grid;gap:12px;transform:translateX(105%);transition:transform .28s;visibility:hidden}.rs-page.nav-open .rs-nav-panel{transform:none;visibility:visible}.rs-panel-close{border:1px solid var(--orange);background:var(--orange);color:#050505;padding:12px 14px;text-transform:uppercase;font-family:"Space Mono";font-size:11px;cursor:pointer}.rs-nav-link,.rs-nav a,.rs-lang,.rs-audio,.rs-commerce-trigger{background:none;border:0;color:rgba(255,255,255,.75);text-decoration:none;text-transform:uppercase;font-family:"Space Mono";font-size:11px;letter-spacing:.12em;cursor:pointer}.rs-nav-link.active{color:#fff;border-bottom:1px solid var(--orange)}.rs-nav a{border:1px solid var(--orange);padding:10px 14px;color:#fff}.rs-lang,.rs-audio,.rs-commerce-trigger{border:1px solid var(--line);height:36px;color:#fff}.rs-commerce-trigger{display:inline-flex;align-items:center;gap:6px;padding:0 10px}.rs-commerce-trigger b{display:inline-grid;place-items:center;min-width:18px;height:18px;background:var(--orange);color:#050505;border-radius:999px;font-size:10px}.rs-lang{width:42px}.rs-audio{min-width:62px}.rs-audio[aria-pressed="true"]{border-color:var(--orange);color:var(--orange)}.rs-hero{min-height:var(--hero-min);position:relative;display:grid;align-items:var(--hero-align);justify-items:center;overflow:hidden;text-align:center;padding:92px 0 46px}.rs-hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:var(--hero-video-position);filter:grayscale(1) contrast(1.32)}.rs-hero-overlay{position:absolute;inset:0;background:radial-gradient(circle at center,rgba(255,92,0,.06),rgba(0,0,0,var(--hero-overlay)) 72%)}.rs-hero-copy{position:relative;z-index:2;padding:0 18px}.rs-glitch{display:flex;justify-content:center;flex-wrap:wrap;font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:clamp(68px,calc(15vw * var(--hero-title-scale)),calc(var(--headline-size) * var(--hero-title-scale)));line-height:.78;letter-spacing:.01em;margin:18px 0;text-shadow:4px 4px 0 rgba(0,0,0,.82)}.rs-glitch-char{display:inline-block;transition:transform .18s,color .18s;animation:rsGlitch 4.5s infinite}.rs-glitch-char:nth-child(3n){animation-delay:.2s}.rs-glitch-char:nth-child(4n){animation-delay:.6s}.rs-glitch-char:hover,.rs-page.glitch-pulse .rs-glitch-char:nth-child(2n){color:var(--orange);transform:translate(calc(6px * var(--motion)),calc(-6px * var(--motion))) skew(calc(-12deg * var(--motion)))}@keyframes rsGlitch{0%,92%,100%{transform:none;color:inherit}94%{transform:translate(calc(-4px * var(--motion)),calc(3px * var(--motion))) skew(8deg);color:var(--orange)}96%{transform:translate(calc(3px * var(--motion)),calc(-2px * var(--motion))) skew(-5deg)}}.rs-hero-copy p{font-family:"Space Mono";font-size:clamp(12px,1.5vw,18px);letter-spacing:.28em}.rs-gallery{min-height:100vh;padding:104px 0;background:#030303}.rs-gallery-head{display:flex;align-items:end;justify-content:space-between;padding:0 5vw 28px;gap:24px}.rs-gallery-head h2,.rs-lookbook h2{font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:clamp(52px,8vw,132px);line-height:.82;margin:12px 0 0}.rs-gallery-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.rs-gallery-controls button,.rs-lookbook button,.rs-card-copy button,.rs-modal-actions button{background:var(--orange);color:#050505;border:0;padding:13px 17px;font-family:var(--headline-family);font-size:18px;letter-spacing:.06em;cursor:pointer}.rs-gallery-controls button:first-child,.rs-gallery-controls button:last-child{width:46px}.rs-track-shell{overflow:auto;padding:0 5vw 28px;scrollbar-color:var(--orange) #222;cursor:grab;scroll-snap-type:x mandatory;scroll-padding:5vw;outline:none}.rs-track-shell.dragging{cursor:grabbing;user-select:none}.rs-track-shell:focus{box-shadow:inset 0 0 0 1px var(--orange)}.rs-track{display:flex;gap:18px;width:max-content}.rs-card{width:min(390px,82vw);background:#111;border:1px solid var(--line);scroll-snap-align:center}.rs-runway-progress{height:2px;width:0;background:var(--orange);margin:0 5vw;transition:width .25s}.rs-page.runway-on .rs-runway-progress{width:calc(var(--runway-progress,0) * 1%)}.rs-media-button{position:relative;display:block;width:100%;aspect-ratio:3/4;border:0;padding:0;overflow:hidden;background:#222;cursor:pointer}.rs-card-img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.18);transition:filter var(--dur),transform var(--dur)}.rs-card:hover .rs-card-img,.rs-card.runway-active .rs-card-img{filter:grayscale(0) contrast(1);transform:scale(calc(1 + (.045 * var(--motion))))}.rs-card-number{position:absolute;left:14px;top:12px;font-family:var(--headline-family);font-size:54px;color:#fff;text-shadow:2px 2px #000}.rs-card-copy{padding:18px;display:grid;gap:8px}.rs-card-copy h3{font-family:var(--headline-family);font-size:38px;line-height:.9;margin:0}.rs-card-copy strong{color:var(--orange);font-family:"Space Mono"}.rs-lookbook{min-height:70vh;padding:110px 8vw;background:#171717;display:grid;align-content:center;justify-items:start}.rs-lookbook p{max-width:620px;line-height:1.65;color:rgba(255,255,255,.7)}.rs-videos{min-height:100vh;padding:100px 5vw;background:#000}.rs-video-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin-top:24px}.rs-video-tile{position:relative;aspect-ratio:16/9;overflow:hidden;background:#111}.rs-video{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.2)}.rs-video-tile span{position:absolute;left:12px;bottom:10px;font-family:var(--headline-family);font-size:42px}.rs-floating{position:fixed;z-index:80;right:22px;bottom:22px;border:1px solid var(--orange);background:#000;color:#fff;padding:15px 22px;border-radius:999px;font-family:var(--headline-family);font-size:19px;letter-spacing:.08em;opacity:0;transform:translateY(24px);transition:opacity .35s,transform .35s;cursor:pointer}.rs-floating.show{opacity:1;transform:none}.rs-modal{position:fixed;z-index:130;inset:0;background:rgba(0,0,0,.82);display:grid;place-items:center;padding:20px;opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}.rs-modal.open{opacity:1;visibility:visible}.rs-modal-card{position:relative;width:min(900px,96vw);max-height:88vh;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:24px;background:#111;border:1px solid var(--orange);padding:22px}.rs-modal-card #rsClose{position:absolute;right:12px;top:10px;background:none;border:1px solid var(--line);color:#fff;width:38px;height:38px;cursor:pointer}.rs-modal-card img{width:100%;height:100%;max-height:520px;object-fit:cover}.rs-modal-card h2{font-family:var(--headline-family);font-size:54px;line-height:.9;margin:12px 0}.rs-modal-card p{line-height:1.55;color:rgba(255,255,255,.72)}.rs-modal-card strong{display:block;color:var(--orange);font-family:"Space Mono";font-size:20px;margin:16px 0}.rs-product-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}.rs-product-options label{display:grid;gap:6px}.rs-product-options select{width:100%;background:#050505;color:#fff;border:1px solid var(--line);padding:10px;font:inherit}.rs-modal-actions{display:flex;gap:10px;flex-wrap:wrap}.rs-commerce-panel{position:fixed;z-index:140;right:0;top:0;width:min(420px,100%);height:100dvh;background:#0a0a0a;border-left:1px solid var(--orange);box-shadow:-28px 0 70px rgba(0,0,0,.45);transform:translateX(105%);transition:transform .28s;display:grid;grid-template-rows:auto 1fr auto;color:#fff}.rs-commerce-panel.open{transform:none}.rs-commerce-panel header,.rs-commerce-panel footer{padding:20px;border-bottom:1px solid var(--line)}.rs-commerce-panel footer{border-top:1px solid var(--line);border-bottom:0;display:grid;gap:8px}.rs-commerce-panel h2{font-family:var(--headline-family);font-size:42px;line-height:.9;margin:0}.rs-commerce-panel header{display:flex;justify-content:space-between;align-items:start}.rs-commerce-panel header button,.rs-commerce-remove,.rs-commerce-qty button{background:none;border:1px solid var(--line);color:#fff;cursor:pointer}.rs-commerce-panel header button{width:38px;height:38px}.rs-commerce-items{overflow:auto;padding:10px 20px}.rs-commerce-empty{color:rgba(255,255,255,.66);font-family:"Space Mono";font-size:12px}.rs-commerce-item{display:grid;grid-template-columns:1fr auto;gap:10px;padding:16px 0;border-bottom:1px solid var(--line)}.rs-commerce-item h3{font-family:var(--headline-family);font-size:26px;margin:0;line-height:.9}.rs-commerce-meta{color:rgba(255,255,255,.62);font-family:"Space Mono";font-size:11px}.rs-commerce-qty{display:flex;align-items:center;gap:8px}.rs-commerce-qty button{width:28px;height:28px}.rs-commerce-remove{padding:7px 9px;font-size:11px}.rs-commerce-panel footer strong{color:var(--orange);font-family:"Space Mono";font-size:20px}@media(max-width:1024px){:root{--hero-min:'+pxPercent(responsive.tablet.minHeight,60,120,92)+'vh;--hero-align:'+alignValue(responsive.tablet.contentAlign)+';--hero-title-scale:'+clamp(responsive.tablet.titleScale,.45,1.4,.82)+';--hero-video-position:'+attr(responsive.tablet.videoPosition)+';--hero-overlay:'+clamp(responsive.tablet.overlayStrength,0,100,82)/100+'}}@media(max-width:820px){:root{--hero-min:'+pxPercent(responsive.mobile.minHeight,60,120,86)+'vh;--hero-align:'+alignValue(responsive.mobile.contentAlign)+';--hero-title-scale:'+clamp(responsive.mobile.titleScale,.45,1.4,.58)+';--hero-video-position:'+attr(responsive.mobile.videoPosition)+';--hero-overlay:'+clamp(responsive.mobile.overlayStrength,0,100,88)/100+'}.rs-nav{height:auto;min-height:66px;padding:10px 18px}.rs-nav-links{display:none}.rs-menu{display:flex}.rs-nav strong{font-size:21px}.rs-nav a{padding:8px 10px}.rs-page[data-mobile-navigation="inline"] .rs-nav-links{display:flex;width:100%;order:5}.rs-page[data-mobile-navigation="inline"] .rs-menu{display:none}.rs-gallery-head{display:block}.rs-gallery-controls{margin-top:18px}.rs-video-grid,.rs-modal-card{grid-template-columns:1fr}.rs-hero-copy p{letter-spacing:.12em}.rs-card{width:78vw}.rs-floating{left:16px;right:16px;border-radius:0}.rs-cursor{display:none}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.rs-card-img,.rs-glitch-char,.rs-floating,.rs-teaser,.rs-preloader,.rs-nav-panel{transition:none;animation:none}.rs-hero-video,.rs-video,.rs-grain,.rs-scanner,.rs-film-burn{animation:none}.rs-cursor{display:none}}';
}

function runtimeScript(o){
  var teaserMs=clamp(o.teaserDuration,0,5000,1200),runwayMs=clamp(o.runwayInterval,1200,9000,2500),preloader=String(o.preloaderText||'RUBIK SOTA');
  return `(function(){
var $=function(s){return document.querySelector(s)},$$=function(s){return [].slice.call(document.querySelectorAll(s))};
var data=JSON.parse($("#rsData").textContent),products=data.products,modal=$("#rsModal"),runway=$("#rsRunway"),floating=$("#rsFloating"),progress=$("#rsProgress"),page=$(".rs-page"),menu=$("#rsMenu"),panel=$("#rsNavPanel"),panelClose=$("#rsPanelClose"),langButton=$("#rsLanguage"),audio=$("#rsAudio"),cursor=$("#rsCursor"),trackShell=$("#rsTrackShell"),trackPrev=$("#rsTrackPrev"),trackNext=$("#rsTrackNext"),commercePanel=$("#rsCommercePanel"),commerceTitle=$("#rsCommerceTitle"),commerceItems=$("#rsCommerceItems"),commerceSubtotal=$("#rsCommerceSubtotal"),cartOpen=$("#rsCartOpen"),wishlistOpen=$("#rsWishlistOpen"),cartCount=$("#rsCartCount"),wishlistCount=$("#rsWishlistCount"),commerceClose=$("#rsCommerceClose"),runwayTimer=null,runwayIndex=0,dragging=false,dragStartX=0,dragStartScroll=0,raf=0,cursorRaf=0,scrollDirty=true,timers=[],lastFocus=null,activeProduct=null,activePanel="cart",storageScope="ep:fashion-commerce:"+(data.presetId||"default")+":",cartKey=storageScope+"cart",wishlistKey=storageScope+"wishlist",langKey="ep:fashion-commerce:language",langUserKey="ep:fashion-commerce:language:user",savedLang=localStorage.getItem(langKey),lang=(localStorage.getItem(langUserKey)==="1"&&data.i18n[savedLang]?savedLang:(data.language||"es"));
var wishlist=readList(wishlistKey),cart=readList(cartKey);
if(!data.i18n[lang])lang=data.language||"es";
function later(fn,ms){var id=setTimeout(fn,ms);timers.push(id);return id}
function money(v){try{return new Intl.NumberFormat(data.priceLocale||"es-ES",{style:"currency",currency:data.currency||"EUR"}).format(Number(v)||0)}catch(e){return (data.currency||"EUR")+" "+v}}
function reduced(){return document.body.classList.contains("motion-reduced")||(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)}
function state(next){if(page)page.dataset.state=next}
function pack(){return data.i18n[lang]||data.i18n.es}
function readList(key){try{var parsed=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(parsed)?parsed:[]}catch(e){return []}}
function saveCommerce(){localStorage.setItem(cartKey,JSON.stringify(cart));localStorage.setItem(wishlistKey,JSON.stringify(wishlist));updateCommerce()}
function byId(id){return products.filter(function(p){return p.id===id})[0]||null}
function cartUnits(){return cart.reduce(function(total,item){return total+(Number(item.qty)||0)},0)}
function spanify(value){return String(value||"").split("").map(function(char){return "<span class=\"rs-glitch-char\">"+char.replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]})+"</span>"}).join("")}
function applyLang(next,persist){if(next&&data.i18n[next])lang=next;var p=pack();document.documentElement.lang=lang;page.dataset.language=lang;if(persist){localStorage.setItem(langKey,lang);localStorage.setItem(langUserKey,"1")}if(langButton)langButton.textContent=lang.toUpperCase();$$('[data-i18n]').forEach(function(el){var key=el.dataset.i18n;if(p[key]!=null)el.textContent=p[key]});$$('[data-i18n-aria]').forEach(function(el){var key=el.dataset.i18nAria;if(p[key]!=null)el.setAttribute('aria-label',p[key])});$$('[data-i18n-placeholder]').forEach(function(el){var key=el.dataset.i18nPlaceholder;if(p[key]!=null)el.setAttribute('placeholder',p[key])});$$('[data-i18n-glitch]').forEach(function(el){var key=el.dataset.i18nGlitch;if(p[key]!=null){el.innerHTML=spanify(p[key]);el.setAttribute('aria-label',p[key])}});if(runway)runway.textContent=runwayTimer?p.runwayStopLabel:p.runwayLabel;renderCommerce(activePanel)}
function scrollToId(id){var el=document.getElementById(id);if(el)el.scrollIntoView({behavior:reduced()?"auto":"smooth"})}
function closeMenu(){if(!page)return;page.classList.remove("nav-open");if(panel)panel.setAttribute("aria-hidden","true");if(menu)menu.setAttribute("aria-expanded","false");if(lastFocus&&document.contains(lastFocus))lastFocus.focus()}
function openMenu(){lastFocus=document.activeElement;if(!page)return;page.classList.add("nav-open");if(panel)panel.setAttribute("aria-hidden","false");if(menu)menu.setAttribute("aria-expanded","true");var first=panel&&panel.querySelector("button,a");if(first)first.focus()}
function toggleMenu(){page.classList.contains("nav-open")?closeMenu():openMenu()}
$$('[data-scroll]').forEach(function(b){b.addEventListener('click',function(){closeMenu();scrollToId(b.dataset.scroll)})});
if(menu)menu.addEventListener('click',toggleMenu);if(panelClose)panelClose.addEventListener('click',closeMenu);
document.addEventListener('keydown',function(e){if(e.key==="Escape"){closeMenu();closeProduct();closeCommerce();stopRunway()}if(e.key==="Tab"&&page.classList.contains("nav-open")&&panel){var focusable=$$("button,a").filter(function(el){return panel.contains(el)&&!el.disabled});if(focusable.length){var first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}});
function setActive(){var sections=["section0","section1","section2","section3"],active=sections[0];sections.forEach(function(id){var el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<innerHeight*.45)active=id});$$('[data-nav-target]').forEach(function(item){item.classList.toggle('active',item.dataset.navTarget===active)})}
function openProduct(i){var p=products[i];if(!p)return;activeProduct=p;stopRunway();var card=$$('[data-product-index]')[i],img=card&&card.querySelector('img');$("#rsModalMedia").innerHTML=img?'<img src="'+img.src+'" alt="'+p.name.replace(/"/g,"&quot;")+'">':"";$("#rsModalEyebrow").textContent=p.eyebrow||p.category||"";$("#rsModalTitle").textContent=p.name;$("#rsModalDescription").textContent=p.description||"";$("#rsModalPrice").textContent=money(p.price);modal.classList.add("open");modal.setAttribute("aria-hidden","false");$("#rsClose").focus()}
function closeProduct(){if(!modal)return;modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
function addWishlist(product){if(!product)return;if(wishlist.indexOf(product.id)===-1)wishlist.push(product.id);saveCommerce();toast(pack().wishlistToast+product.name)}
function addCart(product){if(!product)return;var item=cart.filter(function(row){return row.id===product.id})[0];if(item)item.qty+=1;else cart.push({id:product.id,qty:1});saveCommerce();toast(pack().cartToast+product.name)}
function updateQty(id,delta){cart=cart.map(function(item){return item.id===id?Object.assign({},item,{qty:Math.max(0,(Number(item.qty)||0)+delta)}):item}).filter(function(item){return item.qty>0});saveCommerce();renderCommerce("cart")}
function removeItem(mode,id){if(mode==="wishlist")wishlist=wishlist.filter(function(item){return item!==id});else cart=cart.filter(function(item){return item.id!==id});saveCommerce();renderCommerce(mode)}
function updateCommerce(){if(cartCount)cartCount.textContent=String(cartUnits());if(wishlistCount)wishlistCount.textContent=String(wishlist.length)}
function renderCommerce(mode){if(!commercePanel||!commerceItems)return;activePanel=mode||activePanel;var p=pack(),rows=activePanel==="wishlist"?wishlist.map(function(id){return {product:byId(id),qty:1}}):cart.map(function(item){return {product:byId(item.id),qty:item.qty}});rows=rows.filter(function(row){return row.product});if(commerceTitle)commerceTitle.textContent=activePanel==="wishlist"?p.wishlistTitle:p.cartTitle;if(!rows.length){commerceItems.innerHTML='<p class="rs-commerce-empty">'+(activePanel==="wishlist"?p.emptyWishlist:p.emptyCart)+'</p>'}else{commerceItems.innerHTML=rows.map(function(row){var product=row.product,total=(Number(product.price)||0)*(Number(row.qty)||1);return '<article class="rs-commerce-item" data-commerce-id="'+product.id+'"><div><h3>'+product.name+'</h3><p class="rs-commerce-meta">'+(product.eyebrow||product.category||'')+' - '+money(product.price)+'</p>'+(activePanel==="cart"?'<div class="rs-commerce-qty" aria-label="'+p.qtyLabel+'"><button type="button" data-cart-dec="'+product.id+'">-</button><span>'+row.qty+'</span><button type="button" data-cart-inc="'+product.id+'">+</button></div>':'')+'</div><div><strong>'+money(total)+'</strong><button class="rs-commerce-remove" type="button" data-remove-'+activePanel+'="'+product.id+'">'+p.removeLabel+'</button></div></article>'}).join('')}if(commerceSubtotal)commerceSubtotal.textContent=money(activePanel==="cart"?cart.reduce(function(total,item){var product=byId(item.id);return total+(product?(Number(product.price)||0)*(Number(item.qty)||0):0)},0):0);commerceItems.querySelectorAll('[data-cart-inc]').forEach(function(button){button.onclick=function(){updateQty(button.dataset.cartInc,1)}});commerceItems.querySelectorAll('[data-cart-dec]').forEach(function(button){button.onclick=function(){updateQty(button.dataset.cartDec,-1)}});commerceItems.querySelectorAll('[data-remove-cart]').forEach(function(button){button.onclick=function(){removeItem('cart',button.dataset.removeCart)}});commerceItems.querySelectorAll('[data-remove-wishlist]').forEach(function(button){button.onclick=function(){removeItem('wishlist',button.dataset.removeWishlist)}})}
function openCommerce(mode){renderCommerce(mode);if(commercePanel){commercePanel.classList.add('open');commercePanel.setAttribute('aria-hidden','false')}}
function closeCommerce(){if(commercePanel){commercePanel.classList.remove('open');commercePanel.setAttribute('aria-hidden','true')}}
$$('[data-open-product]').forEach(function(b){b.addEventListener('click',function(){openProduct(Number(b.dataset.openProduct))})});
if($("#rsClose"))$("#rsClose").addEventListener('click',closeProduct);if(modal)modal.addEventListener('click',function(e){if(e.target===modal)closeProduct()});if($("#rsWishlist"))$("#rsWishlist").addEventListener('click',function(){addWishlist(activeProduct);openCommerce('wishlist')});if($("#rsCart"))$("#rsCart").addEventListener('click',function(){addCart(activeProduct);openCommerce('cart')});if(cartOpen)cartOpen.addEventListener('click',function(){openCommerce('cart')});if(wishlistOpen)wishlistOpen.addEventListener('click',function(){openCommerce('wishlist')});if(commerceClose)commerceClose.addEventListener('click',closeCommerce);
function clampScroll(value){if(!trackShell)return 0;return Math.max(0,Math.min(trackShell.scrollWidth-trackShell.clientWidth,value))}
function scrollTrack(delta){if(!trackShell)return;trackShell.scrollTo({left:clampScroll(trackShell.scrollLeft+delta),behavior:reduced()?"auto":"smooth"})}
function setRunway(i){var cards=$$('[data-product-index]');runwayIndex=(i+products.length)%products.length;cards.forEach(function(card,n){card.classList.toggle('runway-active',n===runwayIndex)});if(page)page.style.setProperty('--runway-progress',String(((runwayIndex+1)/products.length*100).toFixed(2)));if(cards[runwayIndex])cards[runwayIndex].scrollIntoView({behavior:reduced()?"auto":"smooth",inline:"center",block:"nearest"})}
function stopRunway(){clearInterval(runwayTimer);runwayTimer=null;if(page){page.classList.remove('runway-on');page.style.setProperty('--runway-progress','0')}if(runway)runway.textContent=pack().runwayLabel}
function startRunway(){stopRunway();if(page)page.classList.add('runway-on');runway.textContent=pack().runwayStopLabel;setRunway(runwayIndex);if(reduced())return;runwayTimer=setInterval(function(){setRunway(runwayIndex+1)},${runwayMs})}
if(runway)runway.addEventListener('click',function(){runwayTimer||page.classList.contains('runway-on')?stopRunway():startRunway()});if(trackPrev)trackPrev.addEventListener('click',function(){scrollTrack(-Math.max(280,innerWidth*.45));stopRunway()});if(trackNext)trackNext.addEventListener('click',function(){scrollTrack(Math.max(280,innerWidth*.45));stopRunway()});
if(trackShell){trackShell.addEventListener('keydown',function(e){if(e.key==="ArrowRight"){e.preventDefault();scrollTrack(Math.max(260,innerWidth*.4))}if(e.key==="ArrowLeft"){e.preventDefault();scrollTrack(-Math.max(260,innerWidth*.4))}});trackShell.addEventListener('pointerdown',function(e){dragging=true;dragStartX=e.clientX;dragStartScroll=trackShell.scrollLeft;trackShell.classList.add('dragging');trackShell.setPointerCapture&&trackShell.setPointerCapture(e.pointerId)});trackShell.addEventListener('pointermove',function(e){if(!dragging)return;trackShell.scrollLeft=clampScroll(dragStartScroll-(e.clientX-dragStartX));});["pointerup","pointercancel","pointerleave"].forEach(function(type){trackShell.addEventListener(type,function(){dragging=false;trackShell.classList.remove('dragging')})})}
function draw(){raf=0;scrollDirty=false;var max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?Math.min(100,scrollY/max*100):0)+"%";floating.classList.toggle('show',scrollY>innerHeight*.7);setActive()}
function requestDraw(){scrollDirty=true;if(!raf)raf=requestAnimationFrame(draw)}
function moveCursor(e){if(!cursor||reduced())return;var over=trackShell&&trackShell.contains(e.target);cursor.classList.toggle('drag',over);if(!cursorRaf)cursorRaf=requestAnimationFrame(function(){cursorRaf=0;cursor.style.left=e.clientX+"px";cursor.style.top=e.clientY+"px"})}
function pulseGlitch(){if(!page||reduced())return;page.classList.add('glitch-pulse');later(function(){page.classList.remove('glitch-pulse')},180)}
function setupMagnet(){if(reduced())return;$$('.rs-nav-cta,.rs-floating,.rs-gallery-head button,.rs-card-copy button,.rs-commerce-trigger').forEach(function(el){el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)*.16,y=(e.clientY-r.top-r.height/2)*.16;el.style.transform="translate("+x+"px,"+y+"px)"});el.addEventListener('pointerleave',function(){el.style.transform=""})})}
window.addEventListener('scroll',requestDraw,{passive:true});window.addEventListener('resize',requestDraw);window.addEventListener('pointermove',moveCursor,{passive:true});floating.addEventListener('click',function(){scrollToId('section1')});if(audio)audio.addEventListener('click',function(){var on=audio.getAttribute('aria-pressed')!=="true";audio.setAttribute('aria-pressed',String(on));audio.textContent=on?"SOUND":"MUTE";page.classList.toggle('audio-on',on)});if(langButton)langButton.addEventListener('click',function(){applyLang(lang==="es"?"en":"es",true)});
function toast(text){var el=document.createElement('div');el.textContent=text;el.style.cssText="position:fixed;z-index:220;left:50%;bottom:26px;transform:translateX(-50%);background:#ff5c00;color:#050505;padding:12px 18px;font-family:Space Mono,monospace;font-size:12px";document.body.appendChild(el);later(function(){el.remove()},1800)}
function runIntro(){var teaser=$("#rsTeaser"),pre=$("#rsPreloader"),preText=$("#rsPreloaderText"),word="${esc(preloader)}",i=0;if(reduced()||(!teaser&&!pre)){state('skipped');later(function(){state('ready')},0);return}if(teaser){state('teaser');later(function(){teaser.classList.add('hide');showPreloader()},${teaserMs})}else showPreloader();function showPreloader(){if(!pre){state('ready');return}state('preloader');type()}function type(){if(!preText){state('ready');return}if(i<=word.length){preText.textContent=word.slice(0,i++);later(type,70)}else later(function(){pre.classList.add('hide');state('ready')},450)}}
window.addEventListener('pagehide',cleanup);window.addEventListener('beforeunload',cleanup);function cleanup(){stopRunway();if(raf)cancelAnimationFrame(raf);if(cursorRaf)cancelAnimationFrame(cursorRaf);timers.forEach(clearTimeout);window.removeEventListener('scroll',requestDraw);window.removeEventListener('resize',requestDraw);window.removeEventListener('pointermove',moveCursor)}
applyLang(lang,false);setupMagnet();updateCommerce();later(pulseGlitch,900);later(pulseGlitch,2600);requestDraw();runIntro()})();`;
}

var DEFAULTS={
  presetId:'rubik-sota-disruption',
  brand:'RUBIK SOTA',
  collectionName:'Volumen 01',
  volumeLabel:'VOLUMEN 01',
  season:'INVIERNO 2025',
  language:'es',
  currency:'EUR',
  priceLocale:'es-ES',
  heroEyebrow:'COLECCIÓN / VOLUMEN 01',
  heroTitle:'DISRUPCIÓN',
  heroSubtitle:'VOLUMEN 01',
  heroCtaLabel:'Ver la colección',
  heroCtaUrl:'#section1',
  galleryEyebrow:'GALERÍA',
  galleryTitle:'La calle no espera.',
  runwayLabel:'▶ MODO PASARELA',
  runwayStopLabel:'DETENER PASARELA',
  runwayInterval:2500,
  productCtaLabel:'Ver prenda',
  lookbookTitle:'Lookbook editorial',
  lookbookIntro:'Una secuencia de looks, materiales y actitud urbana que conserva el pulso brutalista de la fuente.',
  lookbookCtaLabel:'Explorar galería',
  floatingCtaLabel:'CONSIGUE LA COLECCIÓN',
  wishlistLabel:'Deseos',
  cartLabel:'Añadir al carrito',
  demoDisclaimer:'Demostración local. No procesa pagos, stock ni reservas reales.',
  teaserEnabled:true,
  teaserDuration:1200,
  preloaderEnabled:true,
  preloaderText:'RUBIK SOTA',
  navHero:'HERO',
  navGallery:'GALERÍA',
  navLookbook:'LOOKBOOK',
  navVideos:'VIDEOS',
  accentColor:'#FF5C00',
  backgroundColor:'#000000',
  textColor:'#FFFFFF',
  headlineTypography:{family:'Bebas Neue',weight:'400',size:160},
  bodyTypography:{family:'Inter',weight:'400',size:16},
  responsiveHero:{
    desktop:{minHeight:100,contentAlign:'center',titleScale:1,videoPosition:'center center',overlayStrength:78},
    tablet:{minHeight:92,contentAlign:'center',titleScale:.82,videoPosition:'center center',overlayStrength:82},
    mobile:{minHeight:86,contentAlign:'end',titleScale:.58,videoPosition:'center center',overlayStrength:88,navigationMode:'overlay'}
  },
  motionProfile:{intensity:70,duration:650,reducedMotion:false},
  products:[
    {id:'jacket-industrial',name:'CHAQUETA INDUSTRIAL',category:'Outerwear',eyebrow:'DROP 01',description:'Chaqueta de volumen técnico con presencia de campaña.',price:189,ctaLabel:'Ver prenda'},
    {id:'pantalon-cargo',name:'PANTALÓN CARGO',category:'Pants',eyebrow:'DROP 01',description:'Pantalón cargo urbano con estructura amplia y bolsillos protagonistas.',price:129,ctaLabel:'Ver prenda'},
    {id:'camiseta-oversized',name:'CAMISETA OVERSIZED',category:'Top',eyebrow:'BASE',description:'Camiseta amplia con corte editorial y caída pesada.',price:79,ctaLabel:'Ver prenda'},
    {id:'sudadera',name:'SUDADERA',category:'Top',eyebrow:'VOLUMEN',description:'Sudadera de silueta limpia para capas de invierno.',price:149,ctaLabel:'Ver prenda'},
    {id:'abrigo-largo',name:'ABRIGO LARGO',category:'Coat',eyebrow:'HERO PIECE',description:'Abrigo largo con peso visual y contraste brutalista.',price:249,ctaLabel:'Ver prenda'},
    {id:'jeans-rotos',name:'JEANS ROTOS',category:'Denim',eyebrow:'STREET',description:'Denim roto con actitud de backstage y corte recto.',price:109,ctaLabel:'Ver prenda'},
    {id:'chaleco-tecnico',name:'CHALECO TÉCNICO',category:'Vest',eyebrow:'UTILITY',description:'Chaleco técnico con bolsillos y lenguaje funcional.',price:159,ctaLabel:'Ver prenda'},
    {id:'camisa-blanca',name:'CAMISA BLANCA',category:'Shirt',eyebrow:'ESSENTIAL',description:'Camisa blanca de contraste para equilibrar la colección.',price:99,ctaLabel:'Ver prenda'},
    {id:'parka-urbana',name:'PARKA URBANA',category:'Outerwear',eyebrow:'WINTER',description:'Parka urbana para cerrar la secuencia de abrigo y volumen.',price:219,ctaLabel:'Ver prenda'},
    {id:'bermuda-cargo',name:'BERMUDA CARGO',category:'Utility',eyebrow:'DROP 02',description:'Bermuda cargo de contraste táctico para estilismos de transición.',price:89,ctaLabel:'Ver prenda'}
  ]
};

function field(key,type,label,def,extra){return Object.assign({key:key,type:type,label:label,default:def,group:'Contenido'},extra||{});}
build.id='fashion-commerce-pro';
build.schema=[
  field('presetId','text','Preset id',DEFAULTS.presetId,{visible:false,group:'Identidad'}),
  field('brand','text','Marca',DEFAULTS.brand,{required:true,group:'Identidad'}),
  field('collectionName','text','Colección',DEFAULTS.collectionName,{group:'Identidad'}),
  field('volumeLabel','text','Volumen',DEFAULTS.volumeLabel,{group:'Identidad'}),
  field('season','text','Temporada',DEFAULTS.season,{group:'Identidad'}),
  field('language','select','Idioma',DEFAULTS.language,{options:[['es','Español'],['en','English']],group:'Identidad'}),
  field('currency','text','Moneda',DEFAULTS.currency,{group:'Comercio demo'}),
  field('priceLocale','text','Locale de precios',DEFAULTS.priceLocale,{group:'Comercio demo'}),
  field('heroEyebrow','text','Hero eyebrow',DEFAULTS.heroEyebrow,{group:'Hero'}),
  field('heroTitle','text','Hero titular',DEFAULTS.heroTitle,{group:'Hero'}),
  field('heroSubtitle','text','Hero subtítulo',DEFAULTS.heroSubtitle,{group:'Hero'}),
  field('heroCtaLabel','text','Hero CTA label',DEFAULTS.heroCtaLabel,{group:'Hero'}),
  field('heroCtaUrl','url','Hero CTA URL',DEFAULTS.heroCtaUrl,{group:'Hero'}),
  field('teaserEnabled','boolean','Mostrar teaser',DEFAULTS.teaserEnabled,{group:'Teaser'}),
  field('teaserDuration','range','Duración teaser',DEFAULTS.teaserDuration,{min:0,max:5000,step:100,suffix:' ms',group:'Teaser'}),
  field('preloaderEnabled','boolean','Mostrar preloader',DEFAULTS.preloaderEnabled,{group:'Preloader'}),
  field('preloaderText','text','Texto preloader',DEFAULTS.preloaderText,{group:'Preloader'}),
  field('navHero','text','Nav Hero',DEFAULTS.navHero,{group:'Navegación'}),
  field('navGallery','text','Nav Galería',DEFAULTS.navGallery,{group:'Navegación'}),
  field('navLookbook','text','Nav Lookbook',DEFAULTS.navLookbook,{group:'Navegación'}),
  field('navVideos','text','Nav Videos',DEFAULTS.navVideos,{group:'Navegación'}),
  field('galleryEyebrow','text','Galería eyebrow',DEFAULTS.galleryEyebrow,{group:'Galería'}),
  field('galleryTitle','text','Galería título',DEFAULTS.galleryTitle,{group:'Galería'}),
  field('runwayLabel','text','Pasarela label',DEFAULTS.runwayLabel,{group:'Galería'}),
  field('runwayStopLabel','text','Pasarela detener',DEFAULTS.runwayStopLabel,{group:'Galería'}),
  field('runwayInterval','range','Pasarela intervalo',DEFAULTS.runwayInterval,{min:1200,max:9000,step:100,suffix:' ms',group:'Galería'}),
  field('products','repeater','Productos',DEFAULTS.products,{minItems:4,maxItems:10,group:'Productos',itemFields:[{key:'id',label:'ID',type:'text'},{key:'name',label:'Nombre',type:'text'},{key:'category',label:'Categoría',type:'text'},{key:'eyebrow',label:'Eyebrow',type:'text'},{key:'description',label:'Descripción',type:'text'},{key:'price',label:'Precio',type:'number'},{key:'ctaLabel',label:'CTA label',type:'text'}]}),
  field('productCtaLabel','text','CTA producto fallback',DEFAULTS.productCtaLabel,{group:'Productos'}),
  field('lookbookTitle','text','Lookbook título',DEFAULTS.lookbookTitle,{group:'Lookbook'}),
  field('lookbookIntro','textarea','Lookbook intro',DEFAULTS.lookbookIntro,{group:'Lookbook'}),
  field('lookbookCtaLabel','text','Lookbook CTA label',DEFAULTS.lookbookCtaLabel,{group:'Lookbook'}),
  field('floatingCtaLabel','text','CTA flotante label',DEFAULTS.floatingCtaLabel,{group:'CTA'}),
  field('wishlistLabel','text','Wishlist label',DEFAULTS.wishlistLabel,{group:'Comercio demo'}),
  field('cartLabel','text','Carrito label',DEFAULTS.cartLabel,{group:'Comercio demo'}),
  field('demoDisclaimer','textarea','Aviso demo',DEFAULTS.demoDisclaimer,{group:'Comercio demo'}),
  field('accentColor','color','Color naranja',DEFAULTS.accentColor,{group:'Estilo'}),
  field('backgroundColor','color','Color fondo',DEFAULTS.backgroundColor,{group:'Estilo'}),
  field('textColor','color','Color texto',DEFAULTS.textColor,{group:'Estilo'}),
  field('headlineTypography','typography','Tipografía titular',DEFAULTS.headlineTypography,{group:'Tipografía'}),
  field('bodyTypography','typography','Tipografía cuerpo',DEFAULTS.bodyTypography,{group:'Tipografía'}),
  field('responsiveHero','responsive','Hero responsive',DEFAULTS.responsiveHero,{group:'Responsive'}),
  field('motionProfile','motion','Movimiento',DEFAULTS.motionProfile,{group:'Movimiento'})
];

var MEDIA_SLOTS=[
  {id:'heroVideo',label:'Hero video autorizado',type:'video',accepts:['video/mp4','video/webm'],fallback:RUBIK_MEDIA.heroVideo,recommendedAspectRatio:'16:9',semanticUse:'Video hero B/N de RUBIK SOTA',usageStatus:'approved-by-owner'},
  {id:'heroPoster',label:'Hero poster',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.heroPoster,recommendedAspectRatio:'16:9',semanticUse:'Poster del hero',usageStatus:'approved-unsplash'},
  {id:'product1Primary',label:'Producto 1',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.product1,recommendedAspectRatio:'3:4',usageStatus:'approved-unsplash'},
  {id:'product2Primary',label:'Producto 2',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.product2,recommendedAspectRatio:'3:4',usageStatus:'approved-unsplash'},
  {id:'product3Primary',label:'Producto 3',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.product3,recommendedAspectRatio:'3:4',usageStatus:'approved-unsplash'},
  {id:'product4Primary',label:'Producto 4',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.product4,recommendedAspectRatio:'3:4',usageStatus:'approved-unsplash'},
  {id:'product5Primary',label:'Producto 5',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.product5,recommendedAspectRatio:'3:4',usageStatus:'approved-unsplash'},
  {id:'product6Primary',label:'Producto 6',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.product6,recommendedAspectRatio:'3:4',usageStatus:'approved-unsplash'},
  {id:'product7Primary',label:'Producto 7',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.product7,recommendedAspectRatio:'3:4',usageStatus:'approved-unsplash'},
  {id:'product8Primary',label:'Producto 8',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.product8,recommendedAspectRatio:'3:4',usageStatus:'approved-unsplash'},
  {id:'product9Primary',label:'Producto 9',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.product9,recommendedAspectRatio:'3:4',usageStatus:'approved-unsplash'},
  {id:'product10Primary',label:'Producto 10',type:'image',accepts:['image/*'],fallback:RUBIK_MEDIA.product10,recommendedAspectRatio:'3:4',usageStatus:'approved-unsplash'},
  {id:'campaignVideo1',label:'Campaign video 1',type:'video',accepts:['video/mp4','video/webm'],fallback:RUBIK_MEDIA.campaignVideo1,recommendedAspectRatio:'16:9',usageStatus:'approved-by-owner'},
  {id:'campaignVideo2',label:'Campaign video 2',type:'video',accepts:['video/mp4','video/webm'],fallback:RUBIK_MEDIA.campaignVideo2,recommendedAspectRatio:'16:9',usageStatus:'approved-by-owner'},
  {id:'campaignVideo3',label:'Campaign video 3',type:'video',accepts:['video/mp4','video/webm'],fallback:RUBIK_MEDIA.campaignVideo3,recommendedAspectRatio:'16:9',usageStatus:'approved-by-owner'},
  {id:'campaignVideo4',label:'Campaign video 4',type:'video',accepts:['video/mp4','video/webm'],fallback:RUBIK_MEDIA.campaignVideo4,recommendedAspectRatio:'16:9',usageStatus:'approved-by-owner'},
  {id:'logo',label:'Logo',type:'image',accepts:['image/*'],fallback:'',recommendedAspectRatio:'1:1',usageStatus:'pending-metadata'}
];
var PRESETS=[
  {id:'default',label:'Default RUBIK SOTA base',visible:false,defaults:DEFAULTS,media:{}},
  {id:'rubik-sota-disruption',label:'RUBIK SOTA — DISRUPCIÓN',visible:true,defaults:DEFAULTS,media:{heroVideo:RUBIK_MEDIA.heroVideo,heroPoster:RUBIK_MEDIA.heroPoster,campaignVideo1:RUBIK_MEDIA.campaignVideo1,campaignVideo2:RUBIK_MEDIA.campaignVideo2,campaignVideo3:RUBIK_MEDIA.campaignVideo3,campaignVideo4:RUBIK_MEDIA.campaignVideo4}}
];

if(EP.SectorBlueprints&&EP.SectorBlueprints.register)EP.SectorBlueprints.register(build);
if(EP.StudioTemplateRegistry&&EP.StudioTemplateRegistry.register&&!EP.StudioTemplateRegistry.get('fashion-commerce-pro')){
  EP.StudioTemplateRegistry.register({
    id:'fashion-commerce-pro',
    familyId:'fashion-commerce',
    version:1,
    title:'Fashion Commerce',
    shortTitle:'Fashion Commerce',
    description:'RUBIK SOTA — DISRUPCIÓN Custom PRO beta with teaser, video hero, horizontal gallery and runway mode under Core Fidelity V1 review.',
    category:'Sector Blueprints',
    sector:'Fashion & Apparel',
    status:'beta',
    templateType:'custom-pro',
    templateKind:'blueprint',
    visible:true,
    builder:{kind:'blueprint',id:'fashion-commerce-pro'},
    sourceFaithfulReference:'https://juanmaes83.github.io/WEB-PREMIUM-MODA-CON-CLAUDE/',
    thumbnail:{label:'FC'},
    tags:['fashion','commerce','rubik-sota','custom-pro'],
    schema:build.schema,
    mediaSlots:MEDIA_SLOTS,
    presets:PRESETS
  });
}
})();
