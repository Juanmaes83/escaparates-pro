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
function objectValue(value,fallback){return Object.assign({},fallback,value&&typeof value==='object'?value:{});}
function listValue(value){if(Array.isArray(value))return value.slice();return String(value||'').split(',').map(function(s){return s.trim();}).filter(Boolean);}
function colorListValue(value){
  if(Array.isArray(value))return value.map(function(item){return typeof item==='object'?{name:String(item.name||''),hex:String(item.hex||'#111111')}:{name:String(item||''),hex:'#111111'};}).filter(function(c){return c.name;});
  return String(value||'').split(',').map(function(pair){var parts=pair.split(':');return {name:(parts[0]||'').trim(),hex:(parts[1]||'').trim()||'#111111'};}).filter(function(c){return c.name;});
}
function normalizeProduct(item,fallback){
  var merged=Object.assign({},fallback,item||{});
  merged.sizes=listValue(merged.sizes&&merged.sizes.length?merged.sizes:fallback.sizes);
  merged.colors=colorListValue(merged.colors&&(Array.isArray(merged.colors)?merged.colors.length:String(merged.colors).length)?merged.colors:fallback.colors);
  merged.lookIds=listValue(merged.lookIds&&merged.lookIds.length?merged.lookIds:fallback.lookIds);
  merged.stockMode=/^(in-stock|low-stock|sold-out)$/.test(merged.stockMode)?merged.stockMode:'in-stock';
  merged.reservationEnabled=bool(merged.reservationEnabled,true);
  merged.wishlistEnabled=bool(merged.wishlistEnabled,true);
  merged.cartEnabled=bool(merged.cartEnabled,true);
  merged.compareAtPrice=Number(merged.compareAtPrice)||0;
  return merged;
}
function products(value){
  var source=Array.isArray(value)?value:DEFAULTS.products;
  var list=source.slice(0,10).map(function(item,index){return normalizeProduct(item,DEFAULTS.products[index%DEFAULTS.products.length]);});
  while(list.length<4)list.push(normalizeProduct({},DEFAULTS.products[list.length]));
  return list;
}
function normalizeLook(item,fallback){
  var merged=Object.assign({},fallback,item||{});
  merged.productIds=listValue(merged.productIds&&merged.productIds.length?merged.productIds:fallback.productIds);
  merged.reservationEnabled=bool(merged.reservationEnabled,true);
  merged.layout=/^(image-left|image-right)$/.test(merged.layout)?merged.layout:'image-left';
  return merged;
}
function looksValue(value){
  var source=Array.isArray(value)&&value.length?value:DEFAULTS.looks;
  return source.map(function(item,index){return normalizeLook(item,DEFAULTS.looks[index%DEFAULTS.looks.length]);});
}
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
function mediaImage(item,className,alt,loading){return '<img class="'+className+'" src="'+attr(item.url)+'" alt="'+attr(alt||'')+'" loading="'+(loading||'lazy')+'">';}
function mediaVideo(item,className,poster){return '<video class="'+className+'" autoplay loop muted playsinline preload="metadata" poster="'+attr(poster||'')+'"><source src="'+attr(item.url)+'" type="video/mp4"></video>';}

var HOTSPOT_POS=[[25,30],[40,50],[55,35],[30,55],[45,32],[60,48],[28,42],[50,38],[35,52],[42,45]];

function build(mediaInput,raw){
  var media=normalizeMedia(mediaInput);
  var o=Object.assign({},DEFAULTS,raw||{});
  var lang='es';
  var list=products(o.products);
  var looks=looksValue(o.looks);
  var heroVideo=mediaFor(media,'heroVideo',RUBIK_MEDIA.heroVideo,'video');
  var heroPoster=mediaFor(media,'heroPoster',RUBIK_MEDIA.heroPoster,'image');
  var logo=mediaFor(media,'logo','','image');
  var responsive=responsiveConfig(o.responsiveHero);
  var byId={};
  list.forEach(function(p){byId[p.id]=p;});
  var gallery=list.map(function(product,index){
    var image=mediaFor(media,'product'+(index+1)+'Primary',RUBIK_MEDIA['product'+(index+1)],'image');
    var pos=HOTSPOT_POS[index%HOTSPOT_POS.length];
    var tipPos=[Math.max(6,pos[0]-6),Math.min(72,pos[1]+6)];
    return '<article class="rs-card" data-product-index="'+index+'">'
      +'<button class="rs-media-button" type="button" data-open-product="'+index+'" aria-label="Ver '+attr(product.name)+'">'
      +mediaImage(image,'rs-card-img',product.name)
      +'<span class="rs-hotspot" style="top:'+pos[0]+'%;left:'+pos[1]+'%" aria-hidden="true"></span>'
      +'<span class="rs-hotspot-tip" style="top:'+tipPos[0]+'%;left:'+tipPos[1]+'%" aria-hidden="true"><b>'+esc(product.name)+'</b><br><em>'+esc(money(product.price,o.currency,o.priceLocale))+'</em></span>'
      +'</button></article>';
  }).join('');
  var navItems=[['section0',o.navHero],['section1',o.navGallery],['section2',o.navLookbook],['section3',o.navVideos]];
  var nav=navItems.map(function(item){return '<button type="button" class="rs-nav-link" data-scroll="'+item[0]+'" data-nav-target="'+item[0]+'">'+esc(item[1])+'</button>';}).join('');
  var glitch=String(o.heroTitle||'DISRUPCIÓN').split('').map(function(char){return '<span class="rs-glitch-char">'+esc(char)+'</span>';}).join('');
  var videos=['campaignVideo1','campaignVideo2','campaignVideo3','campaignVideo4'].map(function(slot,index){
    return '<article class="rs-video-tile">'+mediaVideo(mediaFor(media,slot,RUBIK_MEDIA[slot],'video'),'rs-video','')+'<span>0'+(index+1)+'</span></article>';
  }).join('');
  var heroSubtitle=[o.heroSubtitle,o.season].filter(Boolean).join(' · ');
  var brandMark=logo.url?'<img class="rs-logo" src="'+attr(logo.url)+'" alt="'+attr(o.brand)+' logo">':'<strong>'+esc(o.brand)+'</strong>';
  var m=objectValue(o.motionProfile,{intensity:70,duration:650,reducedMotion:false});
  var looksHtml=looks.map(function(look,index){
    var media0=mediaFor(media,'look'+(index+1)+'Media',RUBIK_MEDIA['product'+((index*3+1))]||RUBIK_MEDIA.product1,'image');
    var productChips=(look.productIds||[]).map(function(pid){var p=byId[pid];return p?'<span class="rs-look-chip">'+esc(p.name)+'</span>':'';}).join('');
    return '<article class="rs-look rs-look-'+look.layout+'" id="look-'+attr(look.id)+'" data-look-index="'+index+'" data-look-id="'+attr(look.id)+'">'
      +'<div class="rs-look-media">'+mediaImage(media0,'rs-look-img',look.title)+'</div>'
      +'<div class="rs-look-copy">'
      +'<span class="rs-look-model">'+esc(look.model||'')+'</span>'
      +'<h3>'+esc(look.title)+'</h3>'
      +'<p class="rs-look-desc">'+esc(look.description||'')+'</p>'
      +'<div class="rs-look-chips">'+productChips+'</div>'
      +'<p class="rs-look-credit">'+esc(look.credit||'')+'</p>'
      +'<div class="rs-look-shop" data-look-shop="'+attr(look.id)+'" hidden></div>'
      +'<button type="button" class="rs-look-cta" data-toggle-shop="'+attr(look.id)+'">'+esc(look.ctaLabel||'Ver productos del look')+'</button>'
      +'</div></article>';
  }).join('');
  var dataJson=JSON.stringify({
    presetId:o.presetId,
    projectId:o.projectId,
    products:list,
    looks:looks,
    currency:o.currency,
    priceLocale:o.priceLocale,
    runwayLabel:o.runwayLabel,
    runwayStopLabel:o.runwayStopLabel,
    demoDisclaimer:o.demoDisclaimer,
    reservationCtaLabel:o.reservationCtaLabel,
    reservationExternalUrl:o.reservationExternalUrl,
    responsiveHero:responsive,
    mediaSlots:MEDIA_SLOTS.map(function(slot){return slot.id;})
  }).replace(/</g,'\\u003c');
  var responsiveAttrs=' data-hero-desktop-min="'+attr(responsive.desktop.minHeight)+'" data-hero-tablet-min="'+attr(responsive.tablet.minHeight)+'" data-hero-mobile-min="'+attr(responsive.mobile.minHeight)+'" data-hero-desktop-align="'+attr(responsive.desktop.contentAlign)+'" data-hero-tablet-align="'+attr(responsive.tablet.contentAlign)+'" data-hero-mobile-align="'+attr(responsive.mobile.contentAlign)+'" data-mobile-navigation="'+attr(responsive.mobile.navigationMode)+'"';
  return '<!doctype html><html lang="'+attr(lang)+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(o.brand)+' | '+esc(o.collectionName)+'</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;700;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"><style>'+css(o,responsive)+'</style></head><body class="'+(m.reducedMotion?'motion-reduced':'')+'"><div class="rs-page" data-template="fashion-commerce-pro" data-preset="'+attr(o.presetId)+'" data-state="boot"'+responsiveAttrs+'>'
    +'<div class="rs-progress" id="rsProgress"></div><div class="rs-grain" aria-hidden="true"></div><div class="rs-scanner" aria-hidden="true"></div><div class="rs-film-burn" aria-hidden="true"></div><div class="rs-cursor" id="rsCursor" aria-hidden="true"><span>Arrastra</span></div>'
    +(bool(o.teaserEnabled,true)?'<section class="rs-teaser" id="rsTeaser" aria-label="Teaser"><div class="rs-teaser-content"><div class="rs-teaser-stamp"><span class="rs-teaser-line"></span><h1 class="rs-teaser-logo">'+esc(o.brand)+'</h1><span class="rs-teaser-line"></span></div><p class="rs-teaser-volume">'+esc(o.volumeLabel)+'</p><div class="rs-teaser-spark" aria-hidden="true"></div></div></section>':'')
    +(bool(o.preloaderEnabled,true)?'<section class="rs-preloader" id="rsPreloader"><strong id="rsPreloaderText"></strong></section>':'')
    +'<button type="button" class="rs-replay-intro" id="rsReplayIntro" hidden>Reproducir introducción</button>'
    +'<nav class="rs-nav" id="rsNav">'+brandMark+'<button type="button" class="rs-menu" id="rsMenu" aria-controls="rsNavPanel" aria-expanded="false" aria-label="Menú"><span></span><span></span></button><div class="rs-nav-links">'+nav+'</div><button type="button" class="rs-audio" id="rsAudio" aria-pressed="false">MUTE</button><button type="button" class="rs-commerce-trigger" id="rsWishlistOpen" aria-label="Abrir deseos">♡ <b id="rsWishlistCount">0</b></button><button type="button" class="rs-commerce-trigger" id="rsCartOpen" aria-label="Abrir carrito">BAG <b id="rsCartCount">0</b></button><a class="rs-nav-cta" href="'+attr(safeUrl(o.heroCtaUrl,'#section1'))+'">'+esc(o.heroCtaLabel)+'</a></nav>'
    +'<div class="rs-nav-panel" id="rsNavPanel" aria-hidden="true">'+nav+'<button type="button" class="rs-panel-close" id="rsPanelClose">Cerrar menú</button></div>'
    +'<main><section class="rs-hero" id="section0">'+mediaVideo(heroVideo,'rs-hero-video',heroPoster.url)+'<div class="rs-hero-overlay"></div><div class="rs-hero-copy"><span>'+esc(o.heroEyebrow)+'</span><h1 class="rs-glitch" aria-label="'+attr(o.heroTitle)+'">'+glitch+'</h1><p>'+esc(heroSubtitle)+'</p></div></section>'
    +'<section class="rs-gallery" id="section1"><button type="button" class="rs-runway-toggle" id="rsRunway">'+esc(o.runwayLabel)+'</button><span class="rs-runway-indicator" id="rsRunwayIndicator" aria-hidden="true"></span><div class="rs-track-shell" id="rsTrackShell" tabindex="0" aria-label="Galería de producto"><div class="rs-track" id="rsTrack">'+gallery+'</div></div><div class="rs-runway-progress" id="rsRunwayProgress" aria-hidden="true"></div></section>'
    +'<section class="rs-lookbook" id="section2"><div class="rs-lookbook-head"><div><span>02 / LOOKBOOK</span><h2>'+esc(o.lookbookTitle)+'</h2><p>'+esc(o.lookbookIntro)+'</p></div><button type="button" class="rs-view-toggle" id="rsViewToggle" aria-pressed="false">VISTA TIENDA</button></div><div class="rs-looks" id="rsLooks">'+looksHtml+'</div></section>'
    +'<section class="rs-videos" id="section3"><span>03 / CAMPAIGN FILMS</span><div class="rs-video-grid">'+videos+'</div></section></main>'
    +'<button class="rs-floating" type="button" id="rsFloating">'+esc(o.floatingCtaLabel)+'</button>'
    +'<section class="rs-modal" id="rsModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="rsModalTitle"><div class="rs-modal-card"><button type="button" id="rsClose" aria-label="Cerrar">×</button><div id="rsModalMedia"></div><div><span id="rsModalEyebrow"></span><h2 id="rsModalTitle"></h2><p id="rsModalDescription"></p><div id="rsModalPriceRow"><strong id="rsModalPrice"></strong><s id="rsModalCompareAt"></s></div><small id="rsModalMeta" class="rs-modal-meta"></small><div class="rs-product-options"><label><span>Talla</span><select id="rsSize"></select></label><label><span>Color</span><select id="rsColor"></select></label></div><div class="rs-modal-actions"><button type="button" id="rsWishlist">'+esc(o.wishlistLabel)+'</button><button type="button" id="rsCart">'+esc(o.cartLabel)+'</button><button type="button" id="rsReserve" class="rs-reserve-link">'+esc(o.reservationCtaLabel)+'</button></div><small>'+esc(o.demoDisclaimer)+'</small></div></div></section>'
    +'<aside class="rs-commerce-panel" id="rsCommercePanel" aria-hidden="true"><header><h2 id="rsCommerceTitle">Carrito demo</h2><button type="button" id="rsCommerceClose" aria-label="Cerrar">×</button></header><div id="rsCommerceItems" class="rs-commerce-items"></div><footer><span>Subtotal demo</span><strong id="rsCommerceSubtotal">0</strong><small>'+esc(o.demoDisclaimer)+'</small></footer></aside>'
    +'<section class="rs-reservation" id="rsReservation" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="rsReservationTitle"><div class="rs-reservation-card"><button type="button" id="rsReservationClose" aria-label="Cerrar">×</button><h2 id="rsReservationTitle">Reserva demo</h2><p id="rsReservationItem" class="rs-reservation-item"></p><form id="rsReservationForm" novalidate><label><span>Nombre</span><input type="text" id="rsReservationName" required></label><label><span>Email (opcional)</span><input type="email" id="rsReservationEmail"></label><p class="rs-reservation-error" id="rsReservationError" hidden>Escribe tu nombre para continuar.</p><button type="submit">Confirmar reserva demo</button></form><div class="rs-reservation-confirm" id="rsReservationConfirm" hidden><p>Reserva demo confirmada. No se ha procesado ningún pago ni reserva real.</p><a id="rsReservationExternal" class="rs-reservation-external" target="_blank" rel="noopener" hidden>Continuar</a></div></div></section>'
    +'<script type="application/json" id="rsData">'+dataJson+'</script><script>'+runtimeScript(o)+'</script></div></body></html>';
}

function css(o,responsive){
  responsive=responsive||responsiveConfig(o.responsiveHero);
  var m=objectValue(o.motionProfile,{intensity:70,duration:650,reducedMotion:false});
  var headline=objectValue(o.headlineTypography,{family:'Bebas Neue',weight:'400',size:160});
  var body=objectValue(o.bodyTypography,{family:'Inter',weight:'400',size:16});
  var intensity=clamp(m.intensity,0,100,70)/100;
  return ':root{--orange:'+attr(o.accentColor)+';--black:'+attr(o.backgroundColor)+';--white:'+attr(o.textColor)+';--gray:#151515;--line:rgba(255,255,255,.18);--dur:'+clamp(m.duration,0,5000,650)+'ms;--motion:'+intensity+';--headline-family:"'+attr(headline.family)+'",Impact,sans-serif;--headline-weight:'+attr(headline.weight)+';--headline-size:'+clamp(headline.size,36,220,160)+'px;--body-family:"'+attr(body.family)+'",Arial,sans-serif;--body-weight:'+attr(body.weight)+';--body-size:'+clamp(body.size,12,28,16)+'px;--hero-min:'+pxPercent(responsive.desktop.minHeight,60,120,100)+'vh;--hero-align:'+alignValue(responsive.desktop.contentAlign)+';--hero-title-scale:'+clamp(responsive.desktop.titleScale,.45,1.4,1)+';--hero-video-position:'+attr(responsive.desktop.videoPosition)+';--hero-overlay:'+clamp(responsive.desktop.overlayStrength,0,100,78)/100+'}*{box-sizing:border-box}html{scroll-behavior:smooth}html.rs-scroll-lock{overflow:hidden}body{margin:0;background:var(--black);color:var(--white);font-family:var(--body-family);font-weight:var(--body-weight);font-size:var(--body-size);overflow-x:hidden}body.motion-reduced,body.motion-reduced *{scroll-behavior:auto!important;animation:none!important;transition:none!important}button,a{font:inherit}.rs-page{background:var(--black);min-height:100vh}.rs-progress{position:fixed;z-index:200;left:0;top:0;height:3px;width:0;background:var(--orange)}.rs-grain,.rs-scanner,.rs-film-burn{position:fixed;z-index:75;inset:0;pointer-events:none;mix-blend-mode:screen}.rs-grain{opacity:calc(.18 * var(--motion));background-image:radial-gradient(circle at 20% 30%,rgba(255,255,255,.28) 0 1px,transparent 1px),radial-gradient(circle at 80% 70%,rgba(255,92,0,.2) 0 1px,transparent 1px);background-size:6px 6px,9px 9px;animation:rsGrain .7s steps(2,end) infinite}.rs-scanner{opacity:calc(.34 * var(--motion));background:linear-gradient(180deg,transparent 0 48%,rgba(255,92,0,.2) 50%,transparent 52%);transform:translateY(-100%);animation:rsScan calc(4.8s / max(var(--motion),.25)) linear infinite}.rs-film-burn{opacity:0;background:radial-gradient(circle at 8% 20%,rgba(255,92,0,.42),transparent 24%),linear-gradient(100deg,transparent,rgba(255,255,255,.18),transparent);animation:rsBurn 9s linear infinite}.rs-cursor{position:fixed;z-index:240;left:0;top:0;width:84px;height:84px;border:1px solid var(--orange);border-radius:50%;display:grid;place-items:center;color:var(--orange);font-family:"Space Mono";font-size:9px;letter-spacing:.12em;text-transform:uppercase;pointer-events:none;opacity:0;transform:translate3d(-50%,-50%,0) scale(.8);transition:opacity .2s,transform .16s}.rs-cursor.drag{opacity:1;transform:translate3d(-50%,-50%,0) scale(1)}@keyframes rsGrain{0%{transform:translate(0)}50%{transform:translate(-2px,2px)}100%{transform:translate(2px,-1px)}}@keyframes rsScan{to{transform:translateY(100%)}}@keyframes rsBurn{0%,78%,100%{opacity:0}82%{opacity:calc(.38 * var(--motion))}86%{opacity:calc(.12 * var(--motion))}}.rs-teaser,.rs-preloader{position:fixed;inset:0;background:#000;display:grid;place-items:center;text-align:center}.rs-teaser{z-index:181;transition:opacity .8s ease,transform .8s ease}.rs-preloader{z-index:180;transition:opacity .6s ease}.rs-page[data-state="ready"] .rs-teaser,.rs-teaser.hide{opacity:0;visibility:hidden;pointer-events:none;transform:scale(1.1)}.rs-page[data-state="ready"] .rs-preloader,.rs-preloader.hide{opacity:0;visibility:hidden;pointer-events:none}.rs-teaser-logo,.rs-preloader strong{font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:clamp(48px,9vw,112px);letter-spacing:.18em;margin:0}.rs-teaser-stamp{display:flex;align-items:center;gap:20px;justify-content:center}.rs-teaser-line{width:60px;height:2px;background:var(--orange);transform-origin:center;animation:rsTeaserLineExpand .8s ease-out forwards}@keyframes rsTeaserLineExpand{0%{transform:scaleX(0);opacity:0}100%{transform:scaleX(1);opacity:1}}.rs-teaser-logo{animation:rsTeaserStamp .6s cubic-bezier(.22,1,.36,1) .3s both}@keyframes rsTeaserStamp{0%{transform:scale(2);opacity:0;filter:blur(10px)}60%{transform:scale(.95)}100%{transform:scale(1);opacity:1;filter:blur(0)}}.rs-teaser-volume{margin-top:1rem;animation:rsTeaserFadeIn .6s ease-out .8s both}@keyframes rsTeaserFadeIn{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}.rs-teaser-spark{width:80px;height:80px;margin:2rem auto 0;border:1px solid var(--orange);border-radius:50%;opacity:0;animation:rsTeaserSpark .4s ease-out 1s both,rsTeaserPulse .6s ease-in-out 1.5s}@keyframes rsTeaserSpark{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:.8}}@keyframes rsTeaserPulse{0%{box-shadow:0 0 0 var(--orange)}100%{box-shadow:0 0 40px var(--orange);opacity:0;transform:scale(1.5)}}.rs-teaser-volume,.rs-hero-copy>span,.rs-lookbook-head span,.rs-videos>span,.rs-modal-card span,.rs-look-model{font-family:"Space Mono",monospace;text-transform:uppercase;letter-spacing:.22em;font-size:11px;color:var(--orange)}.rs-preloader strong{border-right:3px solid var(--orange);padding-right:12px;animation:rsBlink .6s step-end infinite}@keyframes rsBlink{50%{border-color:transparent}}.rs-replay-intro{position:fixed;z-index:190;left:16px;bottom:16px;border:1px solid var(--orange);background:#000;color:#fff;padding:10px 16px;font-family:"Space Mono";font-size:11px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.rs-replay-intro[hidden]{display:none}.rs-nav{position:fixed;z-index:90;top:0;left:0;right:0;height:72px;display:flex;align-items:center;gap:18px;padding:0 28px;background:rgba(0,0,0,.62);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);transform:translateY(-100%);transition:transform .6s ease}.rs-page[data-state="ready"] .rs-nav,.rs-page[data-state="skipped"] .rs-nav{transform:translateY(0)}.rs-nav strong{font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:26px;letter-spacing:.1em;margin-right:auto}.rs-logo{width:42px;height:42px;object-fit:contain;margin-right:auto}.rs-nav-links{display:flex;gap:8px;flex-wrap:wrap}.rs-menu{display:none;width:44px;height:40px;border:1px solid var(--line);background:#000;color:#fff;align-items:center;justify-content:center;gap:5px;flex-direction:column;cursor:pointer}.rs-menu span{display:block;width:18px;height:2px;background:#fff}.rs-nav-panel{position:fixed;z-index:88;inset:72px 0 auto auto;width:min(360px,100%);padding:24px;background:rgba(0,0,0,.94);border-left:1px solid var(--line);border-bottom:1px solid var(--line);display:grid;gap:12px;transform:translateX(105%);transition:transform .28s;visibility:hidden}.rs-page.nav-open .rs-nav-panel{transform:none;visibility:visible}.rs-panel-close{border:1px solid var(--orange);background:var(--orange);color:#050505;padding:12px 14px;text-transform:uppercase;font-family:"Space Mono";font-size:11px;cursor:pointer}.rs-nav-link,.rs-nav a,.rs-audio,.rs-commerce-trigger{background:none;border:0;color:rgba(255,255,255,.75);text-decoration:none;text-transform:uppercase;font-family:"Space Mono";font-size:11px;letter-spacing:.12em;cursor:pointer}.rs-nav-link.active{color:#fff;border-bottom:1px solid var(--orange)}.rs-nav a{border:1px solid var(--orange);padding:10px 14px;color:#fff}.rs-audio,.rs-commerce-trigger{border:1px solid var(--line);height:36px;color:#fff}.rs-commerce-trigger{display:inline-flex;align-items:center;gap:6px;padding:0 10px}.rs-commerce-trigger b{display:inline-grid;place-items:center;min-width:18px;height:18px;background:var(--orange);color:#050505;border-radius:999px;font-size:10px}.rs-audio{min-width:62px}.rs-audio[aria-pressed="true"]{border-color:var(--orange);color:var(--orange)}.rs-hero{min-height:var(--hero-min);position:relative;display:grid;align-items:var(--hero-align);justify-items:center;overflow:hidden;text-align:center;padding:92px 0 46px}.rs-hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:var(--hero-video-position);filter:grayscale(1) contrast(1.32)}.rs-hero-overlay{position:absolute;inset:0;background:radial-gradient(circle at center,rgba(255,92,0,.06),rgba(0,0,0,var(--hero-overlay)) 72%)}.rs-hero-copy{position:relative;z-index:2;padding:0 18px}.rs-hero-copy>span{display:block;margin-bottom:10px}.rs-glitch{display:flex;justify-content:center;flex-wrap:wrap;font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:clamp(68px,calc(15vw * var(--hero-title-scale)),calc(var(--headline-size) * var(--hero-title-scale)));line-height:.78;letter-spacing:.01em;margin:18px 0;text-shadow:4px 4px 0 rgba(0,0,0,.82)}.rs-glitch-char{display:inline-block;transition:transform .1s ease,color .1s ease}.rs-glitch-char:hover{color:var(--orange);transform:translate(-3px,2px) skew(-5deg)}.rs-hero-copy p{font-family:"Space Mono";font-size:clamp(12px,1.5vw,18px);letter-spacing:.28em}.rs-gallery{position:relative;height:100vh;overflow:hidden;background:#030303}.rs-runway-toggle{position:absolute;top:100px;right:20px;z-index:35;background:#000;border:1px solid var(--orange);color:#fff;padding:8px 16px;border-radius:20px;font-family:"Space Mono";font-size:11px;letter-spacing:.06em;cursor:pointer}.rs-runway-toggle.active,.rs-page.runway-on .rs-runway-toggle{background:var(--orange);color:#050505}.rs-runway-indicator{position:absolute;top:100px;left:20px;z-index:35;font-family:"Space Mono";font-size:12px;color:var(--orange);opacity:0;transition:opacity .2s}.rs-page.runway-on .rs-runway-indicator{opacity:1}.rs-track-shell{height:100%;overflow:auto;scrollbar-width:none;cursor:grab;scroll-snap-type:x mandatory;outline:none}.rs-track-shell::-webkit-scrollbar{display:none}.rs-track-shell.dragging{cursor:grabbing;user-select:none}.rs-track-shell:focus-visible{box-shadow:inset 0 0 0 2px var(--orange)}.rs-track{display:flex;height:100%;width:max-content}.rs-card{width:min(360px,86vw);height:100%;background:#111;scroll-snap-align:center;flex-shrink:0}.rs-card.wishlisted{box-shadow:inset 0 0 0 3px var(--orange)}.rs-runway-progress{position:absolute;left:0;bottom:0;height:3px;width:0;background:var(--orange);z-index:36;transition:width .25s}.rs-page.runway-on .rs-runway-progress{width:calc(var(--runway-progress,0) * 1%)}.rs-media-button{position:relative;display:block;width:100%;height:100%;border:0;padding:0;overflow:hidden;background:#222;cursor:pointer}.rs-card-img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.18);transition:filter var(--dur),transform var(--dur)}.rs-card:hover .rs-card-img,.rs-card.runway-active .rs-card-img,.rs-card-img.color-pop{filter:grayscale(0) contrast(1);transform:scale(calc(1 + (.03 * var(--motion))))}.rs-hotspot{position:absolute;width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.5);transition:all .2s;pointer-events:none}.rs-media-button:hover .rs-hotspot{background:var(--orange);border-color:var(--orange);box-shadow:0 0 16px var(--orange);transform:scale(1.3)}.rs-hotspot-tip{position:absolute;background:#000;border:1px solid var(--orange);color:#fff;padding:8px 12px;font-family:"Space Mono";font-size:11px;pointer-events:none;opacity:0;transition:opacity .2s;white-space:nowrap;border-radius:4px;z-index:5}.rs-media-button:hover .rs-hotspot-tip{opacity:1}.rs-lookbook{padding:110px 8vw;background:#171717}.rs-lookbook-head{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:56px;flex-wrap:wrap}.rs-lookbook-head h2{font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:clamp(52px,7vw,110px);line-height:.86;margin:10px 0}.rs-lookbook-head p{max-width:520px;line-height:1.6;color:rgba(255,255,255,.7)}.rs-view-toggle{background:var(--orange);color:#050505;border:0;padding:13px 20px;font-family:var(--headline-family);font-size:16px;letter-spacing:.06em;cursor:pointer;white-space:nowrap}.rs-view-toggle[aria-pressed="true"]{background:#000;color:var(--orange);border:1px solid var(--orange)}.rs-look{display:grid;grid-template-columns:1.1fr 1fr;gap:48px;align-items:center;margin-bottom:80px}.rs-look-image-right{direction:rtl}.rs-look-image-right>*{direction:ltr}.rs-look-media{aspect-ratio:4/5;overflow:hidden;background:#000}.rs-look-img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.1)}.rs-look-copy h3{font-family:var(--headline-family);font-size:clamp(36px,4.5vw,64px);line-height:.9;margin:10px 0}.rs-look-desc{line-height:1.65;color:rgba(255,255,255,.72);max-width:52ch}.rs-look-chips{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.rs-look-chip{border:1px solid var(--line);padding:6px 10px;font-family:"Space Mono";font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.7)}.rs-look-credit{font-family:"Space Mono";font-size:11px;color:rgba(255,255,255,.45)}.rs-look-cta{margin-top:12px;background:none;border:1px solid var(--orange);color:var(--orange);padding:11px 18px;font-family:"Space Mono";font-size:11px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.rs-look-shop{display:grid;gap:12px;margin:16px 0}.rs-look-shop-item{border:1px solid var(--line);padding:14px;display:grid;gap:8px}.rs-look-shop-item h4{margin:0;font-family:var(--headline-family);font-size:22px}.rs-look-shop-item .rs-look-shop-price{color:var(--orange);font-family:"Space Mono";font-size:14px}.rs-look-shop-actions{display:flex;gap:8px;flex-wrap:wrap}.rs-look-shop-actions button,.rs-look-shop-actions select{background:#000;border:1px solid var(--line);color:#fff;padding:8px 10px;font-family:"Space Mono";font-size:11px;cursor:pointer}.rs-videos{min-height:100vh;padding:100px 5vw;background:#000}.rs-video-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin-top:24px}.rs-video-tile{position:relative;aspect-ratio:16/9;overflow:hidden;background:#111}.rs-video{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.2)}.rs-video-tile span{position:absolute;left:12px;bottom:10px;font-family:var(--headline-family);font-size:42px}.rs-floating{position:fixed;z-index:80;right:22px;bottom:22px;border:1px solid var(--orange);background:#000;color:#fff;padding:15px 22px;border-radius:999px;font-family:var(--headline-family);font-size:19px;letter-spacing:.08em;opacity:0;transform:translateY(24px);transition:opacity .35s,transform .35s;cursor:pointer}.rs-floating.show{opacity:1;transform:none}.rs-modal,.rs-reservation{position:fixed;z-index:130;inset:0;background:rgba(0,0,0,.82);display:grid;place-items:center;padding:20px;opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}.rs-modal.open,.rs-reservation.open{opacity:1;visibility:visible}.rs-modal-card{position:relative;width:min(900px,96vw);max-height:88vh;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:24px;background:#111;border:1px solid var(--orange);padding:22px}.rs-modal-card #rsClose,.rs-reservation-card #rsReservationClose{position:absolute;right:12px;top:10px;background:none;border:1px solid var(--line);color:#fff;width:38px;height:38px;cursor:pointer}.rs-modal-card img{width:100%;height:100%;max-height:520px;object-fit:cover}.rs-modal-card h2{font-family:var(--headline-family);font-size:54px;line-height:.9;margin:12px 0}.rs-modal-card p{line-height:1.55;color:rgba(255,255,255,.72)}#rsModalPriceRow{display:flex;align-items:baseline;gap:10px;margin:16px 0}#rsModalPriceRow strong{color:var(--orange);font-family:"Space Mono";font-size:20px}#rsModalPriceRow s{color:rgba(255,255,255,.4);font-family:"Space Mono";font-size:14px}.rs-modal-meta{display:block;color:rgba(255,255,255,.55);font-family:"Space Mono";font-size:11px;letter-spacing:.06em}.rs-product-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}.rs-product-options label{display:grid;gap:6px}.rs-product-options select{width:100%;background:#050505;color:#fff;border:1px solid var(--line);padding:10px;font:inherit}.rs-modal-actions{display:flex;gap:10px;flex-wrap:wrap}.rs-modal-actions button{background:var(--orange);color:#050505;border:0;padding:13px 17px;font-family:var(--headline-family);font-size:16px;letter-spacing:.04em;cursor:pointer}.rs-modal-actions .rs-reserve-link{background:none;border:1px solid var(--orange);color:var(--orange)}.rs-modal-actions button[disabled]{opacity:.4;cursor:not-allowed}.rs-commerce-panel{position:fixed;z-index:140;right:0;top:0;width:min(420px,100%);height:100dvh;background:#0a0a0a;border-left:1px solid var(--orange);box-shadow:-28px 0 70px rgba(0,0,0,.45);transform:translateX(105%);transition:transform .28s;display:grid;grid-template-rows:auto 1fr auto;color:#fff}.rs-commerce-panel.open{transform:none}.rs-commerce-panel header,.rs-commerce-panel footer{padding:20px;border-bottom:1px solid var(--line)}.rs-commerce-panel footer{border-top:1px solid var(--line);border-bottom:0;display:grid;gap:8px}.rs-commerce-panel h2{font-family:var(--headline-family);font-size:42px;line-height:.9;margin:0}.rs-commerce-panel header{display:flex;justify-content:space-between;align-items:start}.rs-commerce-panel header button,.rs-commerce-remove,.rs-commerce-qty button{background:none;border:1px solid var(--line);color:#fff;cursor:pointer}.rs-commerce-panel header button{width:38px;height:38px}.rs-commerce-items{overflow:auto;padding:10px 20px}.rs-commerce-empty{color:rgba(255,255,255,.66);font-family:"Space Mono";font-size:12px}.rs-commerce-item{display:grid;grid-template-columns:1fr auto;gap:10px;padding:16px 0;border-bottom:1px solid var(--line)}.rs-commerce-item h3{font-family:var(--headline-family);font-size:26px;margin:0;line-height:.9}.rs-commerce-meta{color:rgba(255,255,255,.62);font-family:"Space Mono";font-size:11px}.rs-commerce-qty{display:flex;align-items:center;gap:8px}.rs-commerce-qty button{width:28px;height:28px}.rs-commerce-remove{padding:7px 9px;font-size:11px}.rs-commerce-panel footer strong{color:var(--orange);font-family:"Space Mono";font-size:20px}.rs-reservation-card{position:relative;width:min(480px,94vw);background:#111;border:1px solid var(--orange);padding:26px;display:grid;gap:14px}.rs-reservation-card h2{font-family:var(--headline-family);font-size:36px;margin:0}.rs-reservation-item{font-family:"Space Mono";font-size:12px;color:var(--orange)}.rs-reservation-card label{display:grid;gap:6px;font-family:"Space Mono";font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.7)}.rs-reservation-card input{background:#050505;border:1px solid var(--line);color:#fff;padding:10px;font:inherit}.rs-reservation-card button[type="submit"]{background:var(--orange);color:#050505;border:0;padding:13px;font-family:var(--headline-family);font-size:18px;cursor:pointer}.rs-reservation-error{color:#ff8a5c;font-size:12px}.rs-reservation-confirm p{line-height:1.5}.rs-reservation-external{display:inline-block;margin-top:8px;background:var(--orange);color:#050505;padding:10px 16px;text-decoration:none;font-family:var(--headline-family)}@media(max-width:1024px){:root{--hero-min:'+pxPercent(responsive.tablet.minHeight,60,120,92)+'vh;--hero-align:'+alignValue(responsive.tablet.contentAlign)+';--hero-title-scale:'+clamp(responsive.tablet.titleScale,.45,1.4,.82)+';--hero-video-position:'+attr(responsive.tablet.videoPosition)+';--hero-overlay:'+clamp(responsive.tablet.overlayStrength,0,100,82)/100+'}.rs-look,.rs-look-image-right{grid-template-columns:1fr;direction:ltr}}@media(max-width:820px){:root{--hero-min:'+pxPercent(responsive.mobile.minHeight,60,120,86)+'vh;--hero-align:'+alignValue(responsive.mobile.contentAlign)+';--hero-title-scale:'+clamp(responsive.mobile.titleScale,.45,1.4,.58)+';--hero-video-position:'+attr(responsive.mobile.videoPosition)+';--hero-overlay:'+clamp(responsive.mobile.overlayStrength,0,100,88)/100+'}.rs-nav{height:auto;min-height:66px;padding:10px 18px}.rs-nav-links{display:none}.rs-menu{display:flex}.rs-nav strong{font-size:21px}.rs-nav a{padding:8px 10px}.rs-page[data-mobile-navigation="inline"] .rs-nav-links{display:flex;width:100%;order:5}.rs-page[data-mobile-navigation="inline"] .rs-menu{display:none}.rs-lookbook-head{display:block}.rs-view-toggle{margin-top:16px}.rs-card{width:82vw}.rs-video-grid,.rs-modal-card{grid-template-columns:1fr}.rs-hero-copy p{letter-spacing:.12em}.rs-floating{left:16px;right:16px;border-radius:0}.rs-cursor{display:none}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.rs-card-img,.rs-glitch-char,.rs-floating,.rs-teaser,.rs-preloader,.rs-nav-panel,.rs-nav,.rs-teaser-line,.rs-teaser-logo,.rs-teaser-volume,.rs-teaser-spark,.rs-preloader strong{transition:none;animation:none}.rs-hero-video,.rs-video,.rs-grain,.rs-scanner,.rs-film-burn{animation:none}.rs-cursor{display:none}}';
}

function runtimeScript(o){
  var teaserMs=clamp(o.teaserDuration,0,5000,2000),runwayMs=clamp(o.runwayInterval,1200,9000,2500),preloader=String(o.preloaderText||'RUBIK SOTA');
  return `(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c]})}
function elx(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
var data=JSON.parse($("#rsData").textContent),products=data.products,looks=data.looks||[],modal=$("#rsModal"),runway=$("#rsRunway"),floating=$("#rsFloating"),progress=$("#rsProgress"),page=$(".rs-page"),menu=$("#rsMenu"),panel=$("#rsNavPanel"),panelClose=$("#rsPanelClose"),audio=$("#rsAudio"),cursor=$("#rsCursor"),trackShell=$("#rsTrackShell"),commercePanel=$("#rsCommercePanel"),commerceTitle=$("#rsCommerceTitle"),commerceItems=$("#rsCommerceItems"),commerceSubtotal=$("#rsCommerceSubtotal"),cartOpen=$("#rsCartOpen"),wishlistOpen=$("#rsWishlistOpen"),cartCount=$("#rsCartCount"),wishlistCount=$("#rsWishlistCount"),commerceClose=$("#rsCommerceClose"),reservation=$("#rsReservation"),reservationClose=$("#rsReservationClose"),reservationForm=$("#rsReservationForm"),viewToggle=$("#rsViewToggle"),runwayIndicator=$("#rsRunwayIndicator"),runwayTimer=null,runwayIndex=0,dragging=false,dragArmed=false,dragPointerId=0,dragStartX=0,dragStartScroll=0,wheelSnapTimer=0,raf=0,cursorRaf=0,timers=[],activeProduct=null,activeVariant=null,activePanel="cart",reservationContext=null;
function byIndex(list,id){return list.filter(function(x){return x.id===id})[0]||null}
function productById(id){return byIndex(products,id)}
function lookById(id){return byIndex(looks,id)}
function later(fn,ms){var id=setTimeout(fn,ms);timers.push(id);return id}
function money(v){try{return new Intl.NumberFormat(data.priceLocale||"es-ES",{style:"currency",currency:data.currency||"EUR"}).format(Number(v)||0)}catch(e){return (data.currency||"EUR")+" "+v}}
function reduced(){return document.body.classList.contains("motion-reduced")||(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)}
function state(next){if(page)page.dataset.state=next}

var projectId=String(data.projectId||"default-project"),presetId=String(data.presetId||"default");
var storageScope="ep:fashion-commerce:"+projectId+":"+presetId+":",cartKey=storageScope+"cart",wishlistKey=storageScope+"wishlist",teaserKey=storageScope+"teaserShown",visitedKey=storageScope+"visited";
(function migrateLegacyStorage(){
  var legacyScope="ep:fashion-commerce:"+presetId+":",legacyCart=legacyScope+"cart",legacyWishlist=legacyScope+"wishlist";
  if(localStorage.getItem(cartKey)==null&&localStorage.getItem(legacyCart)!=null)localStorage.setItem(cartKey,localStorage.getItem(legacyCart));
  if(localStorage.getItem(wishlistKey)==null&&localStorage.getItem(legacyWishlist)!=null)localStorage.setItem(wishlistKey,localStorage.getItem(legacyWishlist));
  localStorage.removeItem("ep:fashion-commerce:language");localStorage.removeItem("ep:fashion-commerce:language:user");
})();
function readList(key){try{var parsed=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(parsed)?parsed:[]}catch(e){return []}}
var wishlist=readList(wishlistKey),cart=readList(cartKey);
function saveCommerce(){localStorage.setItem(cartKey,JSON.stringify(cart));localStorage.setItem(wishlistKey,JSON.stringify(wishlist));updateCommerce();syncWishlistUI()}

/* ---- overlay manager: only one primary overlay open at a time, with focus trap + restore ---- */
var currentOverlay=null;
function focusablesIn(container){return $$('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',container).filter(function(el){return !el.disabled&&el.offsetParent!==null})}
function lockScroll(lock){document.documentElement.classList.toggle("rs-scroll-lock",lock)}
function openOverlay(name,container,onOpen,onClose){
  if(currentOverlay&&currentOverlay.name!==name)closeOverlay();
  var trigger=document.activeElement;
  currentOverlay={name:name,container:container,restore:trigger,onClose:onClose};
  lockScroll(true);
  if(onOpen)onOpen();
  later(function(){var list=focusablesIn(container);(list[0]||container).focus()},50);
}
function closeOverlay(name){
  if(!currentOverlay)return;
  if(name&&currentOverlay.name!==name)return;
  var o=currentOverlay;currentOverlay=null;
  lockScroll(false);
  if(o.onClose)o.onClose();
  if(o.restore&&document.contains(o.restore)&&typeof o.restore.focus==="function")o.restore.focus();
}
document.addEventListener("keydown",function(e){
  if(!currentOverlay)return;
  if(e.key==="Escape"){e.preventDefault();closeOverlay();return}
  if(e.key!=="Tab")return;
  var list=focusablesIn(currentOverlay.container);
  if(!list.length)return;
  var first=list[0],last=list[list.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});

function scrollToId(id){var el=document.getElementById(id);if(el)el.scrollIntoView({behavior:reduced()?"auto":"smooth"})}
function closeMenu(){if(!page)return;page.classList.remove("nav-open");if(panel)panel.setAttribute("aria-hidden","true");if(menu)menu.setAttribute("aria-expanded","false");closeOverlay("menu")}
function openMenu(){if(!page)return;page.classList.add("nav-open");if(panel)panel.setAttribute("aria-hidden","false");if(menu)menu.setAttribute("aria-expanded","true");openOverlay("menu",panel,null,function(){page.classList.remove("nav-open");if(panel)panel.setAttribute("aria-hidden","true");if(menu)menu.setAttribute("aria-expanded","false")})}
function toggleMenu(){currentOverlay&&currentOverlay.name==="menu"?closeMenu():openMenu()}
$$('[data-scroll]').forEach(function(b){b.addEventListener('click',function(){closeOverlay();scrollToId(b.dataset.scroll)})});
if(menu)menu.addEventListener('click',toggleMenu);if(panelClose)panelClose.addEventListener('click',closeMenu);
function setActive(){var sections=["section0","section1","section2","section3"],active=sections[0];sections.forEach(function(id){var el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<innerHeight*.45)active=id});$$('[data-nav-target]').forEach(function(item){item.classList.toggle('active',item.dataset.navTarget===active)})}

/* ---- variant-aware product modal ---- */
function fillSelect(select,items,placeholder){select.innerHTML="";if(!items.length){var opt=document.createElement("option");opt.textContent=placeholder;select.appendChild(opt);select.disabled=true;return}select.disabled=false;items.forEach(function(item){var opt=document.createElement("option");opt.value=typeof item==="object"?item.name:item;opt.textContent=typeof item==="object"?item.name:item;select.appendChild(opt)})}
function openProduct(i){
  var p=products[i];if(!p)return;
  activeProduct=p;stopRunway();
  var card=$$('[data-product-index]')[i],img=card&&card.querySelector('img');
  var mediaHost=$("#rsModalMedia");mediaHost.innerHTML="";if(img){var clone=document.createElement("img");clone.src=img.src;clone.alt=p.name;mediaHost.appendChild(clone)}
  $("#rsModalEyebrow").textContent=p.eyebrow||p.category||"";
  $("#rsModalTitle").textContent=p.name;
  $("#rsModalDescription").textContent=p.description||"";
  $("#rsModalPrice").textContent=money(p.price);
  var compareAt=$("#rsModalCompareAt");if(p.compareAtPrice>p.price){compareAt.textContent=money(p.compareAtPrice);compareAt.hidden=false}else{compareAt.textContent="";compareAt.hidden=true}
  var stockNote=p.stockMode==="sold-out"?" · AGOTADO":(p.stockMode==="low-stock"?" · ÚLTIMAS UNIDADES":"");
  var meta=$("#rsModalMeta");if(meta)meta.textContent="REF: "+(p.reference||("RS-00"+(i+1)))+" · "+(p.material||"")+stockNote;
  fillSelect($("#rsSize"),p.sizes||[],"Talla única");
  fillSelect($("#rsColor"),p.colors||[],"Color único");
  if(img)img.classList.add("color-pop");
  var cartBtn=$("#rsCart"),wishBtn=$("#rsWishlist"),reserveBtn=$("#rsReserve");
  if(cartBtn){cartBtn.disabled=!p.cartEnabled||p.stockMode==="sold-out";cartBtn.hidden=!p.cartEnabled}
  if(wishBtn){wishBtn.hidden=!p.wishlistEnabled;updateWishlistButton(wishBtn,p.id)}
  if(reserveBtn)reserveBtn.hidden=!p.reservationEnabled;
  modal.classList.add("open");modal.setAttribute("aria-hidden","false");
  openOverlay("modal",$(".rs-modal-card",modal),null,function(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");$$('.rs-card-img').forEach(function(im){im.classList.remove("color-pop")})});
}
function closeProduct(){closeOverlay("modal")}
function currentVariant(){var sizeSel=$("#rsSize"),colorSel=$("#rsColor");return {size:sizeSel&&!sizeSel.disabled?sizeSel.value:"",color:colorSel&&!colorSel.disabled?colorSel.value:""}}
function variantKey(id,size,color){return id+"__"+(size||"")+"__"+(color||"")}
function updateWishlistButton(btn,id){if(!btn)return;var on=wishlist.indexOf(id)!==-1;btn.setAttribute("aria-pressed",String(on));btn.textContent=on?"En deseos ✓":(data.products.length?"Deseos":"Deseos")}
function syncWishlistUI(){$$('[data-wishlist-toggle]').forEach(function(btn){updateWishlistButton(btn,btn.getAttribute("data-wishlist-toggle"))});var modalWish=$("#rsWishlist");if(modalWish&&activeProduct)updateWishlistButton(modalWish,activeProduct.id);$$('[data-product-index]').forEach(function(card,i){var p=products[i];card.classList.toggle("wishlisted",Boolean(p&&wishlist.indexOf(p.id)!==-1))})}
function toggleWishlist(id){var idx=wishlist.indexOf(id);if(idx===-1){wishlist.push(id);toast("Añadido a deseos")}else{wishlist.splice(idx,1);toast("Eliminado de deseos")}saveCommerce();renderCommerce(activePanel==="wishlist"?"wishlist":activePanel)}
function addCart(product,variant){if(!product)return;var key=variantKey(product.id,variant.size,variant.color);var line=cart.filter(function(row){return row.key===key})[0];if(line)line.qty+=1;else cart.push({key:key,id:product.id,size:variant.size,color:variant.color,qty:1});saveCommerce();toast("Añadido al carrito demo")}
function updateQty(key,delta){cart=cart.map(function(item){return item.key===key?Object.assign({},item,{qty:Math.max(0,(Number(item.qty)||0)+delta)}):item}).filter(function(item){return item.qty>0});saveCommerce();renderCommerce("cart")}
function removeItem(mode,key){if(mode==="wishlist")wishlist=wishlist.filter(function(id){return id!==key});else cart=cart.filter(function(item){return item.key!==key});saveCommerce();renderCommerce(mode)}
function cartUnits(){return cart.reduce(function(total,item){return total+(Number(item.qty)||0)},0)}
function updateCommerce(){if(cartCount)cartCount.textContent=String(cartUnits());if(wishlistCount)wishlistCount.textContent=String(wishlist.length)}
function renderCommerce(mode){
  if(!commercePanel||!commerceItems)return;activePanel=mode||activePanel;
  var rows=activePanel==="wishlist"
    ?wishlist.map(function(id){return {product:productById(id),key:id}}).filter(function(r){return r.product})
    :cart.map(function(item){return {product:productById(item.id),key:item.key,size:item.size,color:item.color,qty:item.qty}}).filter(function(r){return r.product});
  if(commerceTitle)commerceTitle.textContent=activePanel==="wishlist"?"Lista de deseos":"Carrito demo";
  commerceItems.innerHTML="";
  if(!rows.length){commerceItems.appendChild(elx("p","rs-commerce-empty",activePanel==="wishlist"?"Tu wishlist está vacía.":"Tu carrito demo está vacío."))}
  else{rows.forEach(function(row){
    var product=row.product,qty=row.qty||1,total=(Number(product.price)||0)*qty;
    var art=elx("article","rs-commerce-item");art.setAttribute("data-commerce-key",row.key);
    var left=document.createElement("div");
    left.appendChild(elx("h3",null,product.name));
    var metaParts=[product.eyebrow||product.category||""];
    if(row.size)metaParts.push("Talla "+row.size);
    if(row.color)metaParts.push(row.color);
    metaParts.push(money(product.price));
    left.appendChild(elx("p","rs-commerce-meta",metaParts.filter(Boolean).join(" · ")));
    if(activePanel==="cart"){
      var qtyRow=elx("div","rs-commerce-qty");qtyRow.setAttribute("aria-label","Cantidad");
      var dec=elx("button",null,"-");dec.type="button";dec.onclick=function(){updateQty(row.key,-1)};
      var span=elx("span",null,String(qty));
      var inc=elx("button",null,"+");inc.type="button";inc.onclick=function(){updateQty(row.key,1)};
      qtyRow.appendChild(dec);qtyRow.appendChild(span);qtyRow.appendChild(inc);left.appendChild(qtyRow);
    }
    var right=document.createElement("div");
    right.appendChild(elx("strong",null,money(activePanel==="cart"?total:product.price)));
    var removeBtn=elx("button","rs-commerce-remove","Eliminar");removeBtn.type="button";
    removeBtn.onclick=function(){removeItem(activePanel,row.key)};
    right.appendChild(removeBtn);
    art.appendChild(left);art.appendChild(right);commerceItems.appendChild(art);
  })}
  if(commerceSubtotal)commerceSubtotal.textContent=money(activePanel==="cart"?cart.reduce(function(total,item){var product=productById(item.id);return total+(product?(Number(product.price)||0)*(Number(item.qty)||0):0)},0):0);
}
function openCommerce(mode){renderCommerce(mode);if(commercePanel){commercePanel.classList.add('open');commercePanel.setAttribute('aria-hidden','false');openOverlay(mode,commercePanel,null,function(){commercePanel.classList.remove('open');commercePanel.setAttribute('aria-hidden','true')})}}
function closeCommerce(){closeOverlay(activePanel)}
$$('[data-open-product]').forEach(function(b){b.addEventListener('click',function(){openProduct(Number(b.dataset.openProduct))})});
if($("#rsClose"))$("#rsClose").addEventListener('click',closeProduct);
if(modal)modal.addEventListener('click',function(e){if(e.target===modal)closeProduct()});
if($("#rsWishlist"))$("#rsWishlist").addEventListener('click',function(){if(activeProduct)toggleWishlist(activeProduct.id)});
if($("#rsCart"))$("#rsCart").addEventListener('click',function(){addCart(activeProduct,currentVariant())});
if($("#rsReserve"))$("#rsReserve").addEventListener('click',function(){if(activeProduct)openReservation({product:activeProduct,variant:currentVariant()})});
if(cartOpen)cartOpen.addEventListener('click',function(){openCommerce('cart')});
if(wishlistOpen)wishlistOpen.addEventListener('click',function(){openCommerce('wishlist')});
if(commerceClose)commerceClose.addEventListener('click',closeCommerce);

/* ---- reservation demo ---- */
function openReservation(ctx){
  reservationContext=ctx;
  var label=ctx.look?ctx.look.title:(ctx.product?ctx.product.name:"");
  var extra=[];if(ctx.variant&&ctx.variant.size)extra.push("Talla "+ctx.variant.size);if(ctx.variant&&ctx.variant.color)extra.push(ctx.variant.color);
  $("#rsReservationItem").textContent=label+(extra.length?" · "+extra.join(" · "):"");
  $("#rsReservationForm").hidden=false;$("#rsReservationConfirm").hidden=true;$("#rsReservationError").hidden=true;
  $("#rsReservationName").value="";$("#rsReservationEmail").value="";
  reservation.classList.add("open");reservation.setAttribute("aria-hidden","false");
  openOverlay("reservation",$(".rs-reservation-card",reservation),null,function(){reservation.classList.remove("open");reservation.setAttribute("aria-hidden","true")});
}
function closeReservation(){closeOverlay("reservation")}
if(reservationClose)reservationClose.addEventListener('click',closeReservation);
if(reservation)reservation.addEventListener('click',function(e){if(e.target===reservation)closeReservation()});
if(reservationForm)reservationForm.addEventListener('submit',function(e){
  e.preventDefault();
  var name=$("#rsReservationName").value.trim();
  if(!name){$("#rsReservationError").hidden=false;$("#rsReservationName").focus();return}
  $("#rsReservationError").hidden=true;$("#rsReservationForm").hidden=true;
  var confirmBox=$("#rsReservationConfirm");confirmBox.hidden=false;
  var externalLink=$("#rsReservationExternal");
  if(data.reservationExternalUrl){externalLink.href=data.reservationExternalUrl;externalLink.textContent=data.reservationCtaLabel||"Continuar";externalLink.hidden=false}else{externalLink.hidden=true}
});

/* ---- lookbook shop view ---- */
function renderLookShop(lookId){
  var host=$('[data-look-shop="'+lookId+'"]');if(!host)return;
  var look=lookById(lookId);if(!look)return;
  host.innerHTML="";
  (look.productIds||[]).forEach(function(pid){
    var product=productById(pid);if(!product)return;
    var item=elx("article","rs-look-shop-item");
    item.appendChild(elx("h4",null,product.name));
    item.appendChild(elx("p","rs-look-shop-price",money(product.price)+(product.stockMode==="sold-out"?" · Agotado":"")));
    var actions=elx("div","rs-look-shop-actions");
    var sizeSel=document.createElement("select");fillSelect(sizeSel,product.sizes||[],"Talla única");
    var colorSel=document.createElement("select");fillSelect(colorSel,product.colors||[],"Color único");
    var wishBtn=elx("button",null,"");wishBtn.type="button";wishBtn.setAttribute("data-wishlist-toggle",product.id);
    wishBtn.onclick=function(){toggleWishlist(product.id)};updateWishlistButton(wishBtn,product.id);
    var cartBtn=elx("button",null,"Añadir");cartBtn.type="button";cartBtn.disabled=product.stockMode==="sold-out";
    cartBtn.onclick=function(){addCart(product,{size:sizeSel.value,color:colorSel.value})};
    var reserveBtn=elx("button",null,"Reservar");reserveBtn.type="button";
    reserveBtn.onclick=function(){openReservation({product:product,variant:{size:sizeSel.value,color:colorSel.value}})};
    actions.appendChild(sizeSel);actions.appendChild(colorSel);actions.appendChild(wishBtn);actions.appendChild(cartBtn);actions.appendChild(reserveBtn);
    item.appendChild(actions);host.appendChild(item);
  });
}
$$('[data-toggle-shop]').forEach(function(btn){btn.addEventListener('click',function(){var id=btn.getAttribute('data-toggle-shop');var host=$('[data-look-shop="'+id+'"]');if(!host)return;var showing=!host.hidden;if(showing){host.hidden=true}else{renderLookShop(id);host.hidden=false}})});
if(viewToggle)viewToggle.addEventListener('click',function(){
  var shop=viewToggle.getAttribute("aria-pressed")==="true";
  viewToggle.setAttribute("aria-pressed",String(!shop));
  viewToggle.textContent=shop?"VISTA TIENDA":"VISTA EDITORIAL";
  page.classList.toggle("shop-view",!shop);
  $$('[data-look-shop]').forEach(function(host){var id=host.getAttribute('data-look-shop');if(!shop){renderLookShop(id);host.hidden=false}else{host.hidden=true}});
});

/* ---- gallery: drag / wheel / keyboard / runway (verified fixes kept) ---- */
function clampScroll(value){if(!trackShell)return 0;return Math.max(0,Math.min(trackShell.scrollWidth-trackShell.clientWidth,value))}
function scrollTrack(delta){if(!trackShell)return;trackShell.scrollTo({left:clampScroll(trackShell.scrollLeft+delta),behavior:reduced()?"auto":"smooth"})}
function setRunway(i){var cards=$$('[data-product-index]');runwayIndex=(i+products.length)%products.length;cards.forEach(function(card,n){card.classList.toggle('runway-active',n===runwayIndex)});if(page)page.style.setProperty('--runway-progress',String(((runwayIndex+1)/products.length*100).toFixed(2)));if(runwayIndicator)runwayIndicator.textContent=(runwayIndex+1)+"/"+products.length;if(cards[runwayIndex])cards[runwayIndex].scrollIntoView({behavior:reduced()?"auto":"smooth",inline:"center",block:"nearest"})}
function stopRunway(){clearInterval(runwayTimer);runwayTimer=null;if(page)page.classList.remove('runway-on');if(runway){runway.textContent=data.runwayLabel;runway.classList.remove('active')}if(runwayIndicator)runwayIndicator.textContent=""}
function startRunway(){stopRunway();if(page)page.classList.add('runway-on');runway.textContent=data.runwayStopLabel;runway.classList.add('active');setRunway(runwayIndex);if(reduced())return;runwayTimer=setInterval(function(){setRunway(runwayIndex+1)},${runwayMs})}
if(runway)runway.addEventListener('click',function(){runwayTimer||(page&&page.classList.contains('runway-on'))?stopRunway():startRunway()});
if(trackShell){
  trackShell.addEventListener('keydown',function(e){if(e.key==="ArrowRight"){e.preventDefault();scrollTrack(Math.max(260,innerWidth*.4))}if(e.key==="ArrowLeft"){e.preventDefault();scrollTrack(-Math.max(260,innerWidth*.4))}});
  trackShell.addEventListener('pointerdown',function(e){dragArmed=true;dragging=false;dragStartX=e.clientX;dragStartScroll=trackShell.scrollLeft;dragPointerId=e.pointerId});
  trackShell.addEventListener('pointermove',function(e){if(!dragArmed)return;var dx=e.clientX-dragStartX;if(!dragging&&Math.abs(dx)>6){dragging=true;trackShell.classList.add('dragging');trackShell.style.scrollSnapType='none';trackShell.setPointerCapture&&trackShell.setPointerCapture(dragPointerId)}if(dragging)trackShell.scrollLeft=clampScroll(dragStartScroll-dx)});
  ["pointerup","pointercancel","pointerleave"].forEach(function(type){trackShell.addEventListener(type,function(){dragArmed=false;dragging=false;trackShell.classList.remove('dragging');trackShell.style.scrollSnapType=''})});
  trackShell.addEventListener('wheel',function(e){var max=trackShell.scrollWidth-trackShell.clientWidth;if((trackShell.scrollLeft<=0&&e.deltaY<0)||(trackShell.scrollLeft>=max&&e.deltaY>0))return;e.preventDefault();trackShell.style.scrollSnapType='none';clearTimeout(wheelSnapTimer);wheelSnapTimer=later(function(){trackShell.style.scrollSnapType=''},150);trackShell.scrollLeft=clampScroll(trackShell.scrollLeft+e.deltaY*2);stopRunway()},{passive:false});
}
function draw(){raf=0;var max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?Math.min(100,scrollY/max*100):0)+"%";floating.classList.toggle('show',scrollY>innerHeight*.7);setActive()}
function requestDraw(){if(!raf)raf=requestAnimationFrame(draw)}
function moveCursor(e){if(!cursor||reduced())return;var over=trackShell&&trackShell.contains(e.target);cursor.classList.toggle('drag',over);if(!cursorRaf)cursorRaf=requestAnimationFrame(function(){cursorRaf=0;cursor.style.left=e.clientX+"px";cursor.style.top=e.clientY+"px"})}
function wireGlitch(){$$('.rs-glitch-char').forEach(function(span){span.onmouseenter=function(){if(reduced())return;span.style.transform="translate("+((Math.random()-0.5)*8)+"px,"+((Math.random()-0.5)*6)+"px) skew("+((Math.random()-0.5)*10)+"deg)";span.style.color="var(--orange)"};span.onmouseleave=function(){span.style.transform="";span.style.color=""}})}
function setupMagnet(){if(reduced())return;$$('.rs-nav-cta,.rs-floating,.rs-look-cta,.rs-commerce-trigger').forEach(function(el){el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)*.16,y=(e.clientY-r.top-r.height/2)*.16;el.style.transform="translate("+x+"px,"+y+"px)"});el.addEventListener('pointerleave',function(){el.style.transform=""})})}
window.addEventListener('scroll',requestDraw,{passive:true});window.addEventListener('resize',requestDraw);window.addEventListener('pointermove',moveCursor,{passive:true});
if(floating)floating.addEventListener('click',function(){scrollToId('section1')});
if(audio)audio.addEventListener('click',function(){var on=audio.getAttribute('aria-pressed')!=="true";audio.setAttribute('aria-pressed',String(on));audio.textContent=on?"SOUND":"MUTE";page.classList.toggle('audio-on',on)});
function toast(text){var el=document.createElement('div');el.textContent=text;el.style.cssText="position:fixed;z-index:220;left:50%;bottom:26px;transform:translateX(-50%);background:#ff5c00;color:#050505;padding:12px 18px;font-family:Space Mono,monospace;font-size:12px";document.body.appendChild(el);later(function(){el.remove()},1800)}
function runIntro(){var teaser=$("#rsTeaser"),pre=$("#rsPreloader"),preText=$("#rsPreloaderText"),word="${esc(preloader)}",i=0;if(reduced()||(!teaser&&!pre)){state('skipped');later(function(){state('ready')},0);return}var teaserSeen=sessionStorage.getItem(teaserKey);if(!teaserSeen){sessionStorage.setItem(teaserKey,'true');if(teaser){state('teaser');later(function(){teaser.classList.add('hide')},${teaserMs})}}else if(teaser)teaser.style.display='none';var visited=sessionStorage.getItem(visitedKey);if(!visited){sessionStorage.setItem(visitedKey,'true');if(!teaserSeen&&teaser)later(showPreloader,2200);else showPreloader()}else{if(pre)pre.style.display='none';state('ready')}function showPreloader(){if(!pre){state('ready');return}state('preloader');type()}function type(){if(!preText){state('ready');return}if(i<=word.length){preText.textContent=word.slice(0,i++);later(type,110)}else{pre.classList.add('hide');state('ready')}}}
function resetIntro(){sessionStorage.removeItem(teaserKey);sessionStorage.removeItem(visitedKey);var teaser=$("#rsTeaser"),pre=$("#rsPreloader"),preText=$("#rsPreloaderText");if(teaser){teaser.classList.remove('hide');teaser.style.display=''}if(pre){pre.classList.remove('hide');pre.style.display=''}if(preText)preText.textContent='';state('boot');runIntro()}
var replayIntro=$("#rsReplayIntro");if(replayIntro&&window.self!==window.top){replayIntro.hidden=false;replayIntro.addEventListener('click',resetIntro)}
window.addEventListener('pagehide',cleanup);window.addEventListener('beforeunload',cleanup);function cleanup(){stopRunway();if(raf)cancelAnimationFrame(raf);if(cursorRaf)cancelAnimationFrame(cursorRaf);timers.forEach(clearTimeout);window.removeEventListener('scroll',requestDraw);window.removeEventListener('resize',requestDraw);window.removeEventListener('pointermove',moveCursor)}
document.documentElement.lang="es";setupMagnet();updateCommerce();syncWishlistUI();wireGlitch();requestDraw();runIntro()})();`;
}

var DEFAULTS={
  presetId:'rubik-sota-disruption',
  projectId:'default-project',
  brand:'RUBIK SOTA',
  collectionName:'Volumen 01',
  volumeLabel:'VOLUMEN 01',
  season:'INVIERNO 2025',
  currency:'EUR',
  priceLocale:'es-ES',
  heroEyebrow:'COLECCIÓN / VOLUMEN 01',
  heroTitle:'DISRUPCIÓN',
  heroSubtitle:'VOLUMEN 01',
  heroCtaLabel:'Ver la colección',
  heroCtaUrl:'#section1',
  runwayLabel:'▶ MODO PASARELA',
  runwayStopLabel:'DETENER PASARELA',
  runwayInterval:2500,
  productCtaLabel:'Ver prenda',
  lookbookTitle:'Lookbook editorial',
  lookbookIntro:'Una secuencia de looks, materiales y actitud urbana que conserva el pulso brutalista de la fuente.',
  floatingCtaLabel:'CONSIGUE LA COLECCIÓN',
  wishlistLabel:'Deseos',
  cartLabel:'Añadir al carrito',
  reservationCtaLabel:'Reservar',
  reservationExternalUrl:'',
  demoDisclaimer:'Demostración local. No procesa pagos, stock ni reservas reales.',
  teaserEnabled:true,
  teaserDuration:2000,
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
    {id:'jacket-industrial',name:'CHAQUETA INDUSTRIAL',category:'Outerwear',eyebrow:'DROP 01',description:'Chaqueta de volumen técnico con presencia de campaña.',price:189,compareAtPrice:219,reference:'RS-001',material:'Sarga técnica reforzada',badge:'NUEVO',sizes:['S','M','L','XL'],colors:[{name:'Negro',hex:'#111111'},{name:'Verde militar',hex:'#4b5320'}],stockMode:'in-stock',ctaLabel:'Ver prenda',reservationEnabled:true,wishlistEnabled:true,cartEnabled:true,lookIds:['look-industrial','look-street']},
    {id:'pantalon-cargo',name:'PANTALÓN CARGO',category:'Pants',eyebrow:'DROP 01',description:'Pantalón cargo urbano con estructura amplia y bolsillos protagonistas.',price:129,compareAtPrice:0,reference:'RS-002',material:'Algodón ripstop',badge:'',sizes:['S','M','L','XL'],colors:[{name:'Negro',hex:'#111111'},{name:'Caqui',hex:'#8a7752'}],stockMode:'low-stock',ctaLabel:'Ver prenda',reservationEnabled:true,wishlistEnabled:true,cartEnabled:true,lookIds:['look-industrial']},
    {id:'camiseta-oversized',name:'CAMISETA OVERSIZED',category:'Top',eyebrow:'BASE',description:'Camiseta amplia con corte editorial y caída pesada.',price:79,compareAtPrice:0,reference:'RS-003',material:'Algodón pesado 260gsm',badge:'',sizes:['S','M','L','XL'],colors:[{name:'Blanco',hex:'#f5f5f5'},{name:'Negro',hex:'#111111'}],stockMode:'in-stock',ctaLabel:'Ver prenda',reservationEnabled:true,wishlistEnabled:true,cartEnabled:true,lookIds:['look-street']},
    {id:'sudadera',name:'SUDADERA',category:'Top',eyebrow:'VOLUMEN',description:'Sudadera de silueta limpia para capas de invierno.',price:149,compareAtPrice:0,reference:'RS-004',material:'Felpa perchada',badge:'',sizes:['S','M','L','XL'],colors:[{name:'Gris jaspeado',hex:'#8a8a8a'},{name:'Negro',hex:'#111111'}],stockMode:'in-stock',ctaLabel:'Ver prenda',reservationEnabled:true,wishlistEnabled:true,cartEnabled:true,lookIds:['look-street','look-invierno']},
    {id:'abrigo-largo',name:'ABRIGO LARGO',category:'Coat',eyebrow:'HERO PIECE',description:'Abrigo largo con peso visual y contraste brutalista.',price:249,compareAtPrice:289,reference:'RS-005',material:'Lana mezcla',badge:'DROP LIMITADO',sizes:['S','M','L'],colors:[{name:'Negro',hex:'#111111'}],stockMode:'low-stock',ctaLabel:'Ver prenda',reservationEnabled:true,wishlistEnabled:true,cartEnabled:true,lookIds:['look-invierno']},
    {id:'jeans-rotos',name:'JEANS ROTOS',category:'Denim',eyebrow:'STREET',description:'Denim roto con actitud de backstage y corte recto.',price:109,compareAtPrice:0,reference:'RS-006',material:'Denim rígido',badge:'',sizes:['S','M','L','XL'],colors:[{name:'Azul crudo',hex:'#2b3a55'}],stockMode:'in-stock',ctaLabel:'Ver prenda',reservationEnabled:true,wishlistEnabled:true,cartEnabled:true,lookIds:['look-street']},
    {id:'chaleco-tecnico',name:'CHALECO TÉCNICO',category:'Vest',eyebrow:'UTILITY',description:'Chaleco técnico con bolsillos y lenguaje funcional.',price:159,compareAtPrice:0,reference:'RS-007',material:'Nylon técnico',badge:'',sizes:['S','M','L','XL'],colors:[{name:'Negro',hex:'#111111'},{name:'Naranja señal',hex:'#ff5c00'}],stockMode:'in-stock',ctaLabel:'Ver prenda',reservationEnabled:true,wishlistEnabled:true,cartEnabled:true,lookIds:['look-industrial']},
    {id:'camisa-blanca',name:'CAMISA BLANCA',category:'Shirt',eyebrow:'ESSENTIAL',description:'Camisa blanca de contraste para equilibrar la colección.',price:99,compareAtPrice:0,reference:'RS-008',material:'Popelín de algodón',badge:'',sizes:['S','M','L','XL'],colors:[{name:'Blanco',hex:'#f5f5f5'}],stockMode:'in-stock',ctaLabel:'Ver prenda',reservationEnabled:true,wishlistEnabled:true,cartEnabled:true,lookIds:['look-invierno']},
    {id:'parka-urbana',name:'PARKA URBANA',category:'Outerwear',eyebrow:'WINTER',description:'Parka urbana para cerrar la secuencia de abrigo y volumen.',price:219,compareAtPrice:259,reference:'RS-009',material:'Poliéster acolchado',badge:'ÚLTIMAS UNIDADES',sizes:['S','M','L'],colors:[{name:'Negro',hex:'#111111'}],stockMode:'sold-out',ctaLabel:'Ver prenda',reservationEnabled:true,wishlistEnabled:true,cartEnabled:false,lookIds:['look-invierno']},
    {id:'bermuda-cargo',name:'BERMUDA CARGO',category:'Utility',eyebrow:'DROP 02',description:'Bermuda cargo de contraste táctico para estilismos de transición.',price:89,compareAtPrice:0,reference:'RS-010',material:'Algodón cargo',badge:'',sizes:['S','M','L','XL'],colors:[{name:'Caqui',hex:'#8a7752'}],stockMode:'in-stock',ctaLabel:'Ver prenda',reservationEnabled:true,wishlistEnabled:true,cartEnabled:true,lookIds:['look-street']}
  ],
  looks:[
    {id:'look-industrial',title:'INDUSTRIAL DROP',description:'Volumen técnico y utilidad de fábrica: la chaqueta industrial se combina con cargo y chaleco para una silueta de trabajo reinterpretada en clave urbana.',model:'Look 01 — Alicante',credit:'Foto: Estudio RUBIK SOTA',layout:'image-left',productIds:['jacket-industrial','pantalon-cargo','chaleco-tecnico'],ctaLabel:'Ver productos del look',reservationEnabled:true},
    {id:'look-street',title:'CALLE Y CONTRASTE',description:'Base oversized, denim roto y bermuda cargo. Un look pensado para el asfalto, con el pulso brutalista de la colección VOLUMEN 01.',model:'Look 02 — Puerto',credit:'Foto: Estudio RUBIK SOTA',layout:'image-right',productIds:['camiseta-oversized','jeans-rotos','sudadera','bermuda-cargo'],ctaLabel:'Ver productos del look',reservationEnabled:true},
    {id:'look-invierno',title:'VOLUMEN DE INVIERNO',description:'Capas de abrigo con peso visual: parka, abrigo largo y camisa blanca de contraste para cerrar la narrativa de la colección.',model:'Look 03 — Muelle',credit:'Foto: Estudio RUBIK SOTA',layout:'image-left',productIds:['abrigo-largo','parka-urbana','camisa-blanca','sudadera'],ctaLabel:'Ver productos del look',reservationEnabled:true}
  ]
};

function field(key,type,label,def,extra){return Object.assign({key:key,type:type,label:label,default:def,group:'Contenido'},extra||{});}
build.id='fashion-commerce-pro';
build.schema=[
  field('presetId','text','Preset id',DEFAULTS.presetId,{visible:false,group:'Identidad'}),
  field('projectId','text','Project id',DEFAULTS.projectId,{visible:false,group:'Identidad'}),
  field('brand','text','Marca',DEFAULTS.brand,{required:true,group:'Identidad'}),
  field('collectionName','text','Colección',DEFAULTS.collectionName,{group:'Identidad'}),
  field('volumeLabel','text','Volumen',DEFAULTS.volumeLabel,{group:'Identidad'}),
  field('season','text','Temporada',DEFAULTS.season,{group:'Identidad'}),
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
  field('runwayLabel','text','Pasarela label',DEFAULTS.runwayLabel,{group:'Galería'}),
  field('runwayStopLabel','text','Pasarela detener',DEFAULTS.runwayStopLabel,{group:'Galería'}),
  field('runwayInterval','range','Pasarela intervalo',DEFAULTS.runwayInterval,{min:1200,max:9000,step:100,suffix:' ms',group:'Galería'}),
  field('products','repeater','Productos',DEFAULTS.products,{minItems:4,maxItems:10,group:'Productos',itemFields:[
    {key:'id',label:'ID',type:'text'},
    {key:'name',label:'Nombre',type:'text'},
    {key:'category',label:'Categoría',type:'text'},
    {key:'eyebrow',label:'Eyebrow',type:'text'},
    {key:'description',label:'Descripción',type:'text'},
    {key:'price',label:'Precio',type:'number'},
    {key:'compareAtPrice',label:'Precio antes (0 = sin descuento)',type:'number'},
    {key:'reference',label:'Referencia',type:'text'},
    {key:'material',label:'Material',type:'text'},
    {key:'badge',label:'Badge',type:'text'},
    {key:'sizes',label:'Tallas (separadas por coma)',type:'text'},
    {key:'colors',label:'Colores (nombre:hex, separados por coma)',type:'text'},
    {key:'stockMode',label:'Stock (in-stock, low-stock, sold-out)',type:'text'},
    {key:'ctaLabel',label:'CTA label',type:'text'},
    {key:'reservationEnabled',label:'Permite reserva (true/false)',type:'text'},
    {key:'wishlistEnabled',label:'Permite wishlist (true/false)',type:'text'},
    {key:'cartEnabled',label:'Permite carrito (true/false)',type:'text'},
    {key:'lookIds',label:'Looks asociados (ids separados por coma)',type:'text'}
  ]}),
  field('productCtaLabel','text','CTA producto fallback',DEFAULTS.productCtaLabel,{group:'Productos'}),
  field('lookbookTitle','text','Lookbook título',DEFAULTS.lookbookTitle,{group:'Lookbook'}),
  field('lookbookIntro','textarea','Lookbook intro',DEFAULTS.lookbookIntro,{group:'Lookbook'}),
  field('looks','repeater','Looks editoriales',DEFAULTS.looks,{minItems:1,maxItems:8,group:'Lookbook',itemFields:[
    {key:'id',label:'ID',type:'text'},
    {key:'title',label:'Título',type:'text'},
    {key:'description',label:'Descripción',type:'text'},
    {key:'model',label:'Modelo',type:'text'},
    {key:'credit',label:'Crédito',type:'text'},
    {key:'layout',label:'Layout (image-left, image-right)',type:'text'},
    {key:'productIds',label:'Productos del look (ids separados por coma)',type:'text'},
    {key:'ctaLabel',label:'CTA label',type:'text'},
    {key:'reservationEnabled',label:'Permite reserva (true/false)',type:'text'}
  ]}),
  field('floatingCtaLabel','text','CTA flotante label',DEFAULTS.floatingCtaLabel,{group:'CTA'}),
  field('wishlistLabel','text','Wishlist label',DEFAULTS.wishlistLabel,{group:'Comercio demo'}),
  field('cartLabel','text','Carrito label',DEFAULTS.cartLabel,{group:'Comercio demo'}),
  field('reservationCtaLabel','text','Reserva CTA label',DEFAULTS.reservationCtaLabel,{group:'Reserva'}),
  field('reservationExternalUrl','url','Reserva CTA URL externa',DEFAULTS.reservationExternalUrl,{group:'Reserva'}),
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
    description:'RUBIK SOTA — DISRUPCIÓN Custom PRO beta with teaser, video hero, full-bleed hotspot gallery, editorial lookbook and runway mode under Core Fidelity V1 review.',
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
