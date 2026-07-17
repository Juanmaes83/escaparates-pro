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
  var gallery=list.map(function(product,index){
    var image=mediaFor(media,'product'+(index+1)+'Primary',RUBIK_MEDIA['product'+(index+1)],'image');
    return '<article class="rs-card" data-product-index="'+index+'"><button class="rs-media-button" type="button" data-open-product="'+index+'">'+mediaImage(image,'rs-card-img',product.name)+'<span class="rs-card-number">'+String(index+1).padStart(2,'0')+'</span></button><div class="rs-card-copy"><span>'+esc(product.eyebrow||product.category)+'</span><h3>'+esc(product.name)+'</h3><strong>'+esc(money(product.price,o.currency,o.priceLocale))+'</strong><button type="button" data-open-product="'+index+'">'+esc(product.ctaLabel||o.productCtaLabel)+'</button></div></article>';
  }).join('');
  var navItems=[['section0',o.navHero],['section1',o.navGallery],['section2',o.navLookbook],['section3',o.navVideos]];
  var nav=navItems.map(function(item){return '<button type="button" class="rs-nav-link" data-scroll="'+item[0]+'">'+esc(item[1])+'</button>';}).join('');
  var glitch=String(o.heroTitle||'DISRUPCIÓN').split('').map(function(char){return '<span class="rs-glitch-char">'+esc(char)+'</span>';}).join('');
  var videos=['campaignVideo1','campaignVideo2','campaignVideo3','campaignVideo4'].map(function(slot,index){
    return '<article class="rs-video-tile">'+mediaVideo(mediaFor(media,slot,RUBIK_MEDIA[slot],'video'),'rs-video','')+'<span>0'+(index+1)+'</span></article>';
  }).join('');
  var heroSubtitle=[o.heroSubtitle,o.season].filter(Boolean).join(' · ');
  var brandMark=logo.url?'<img class="rs-logo" src="'+attr(logo.url)+'" alt="'+attr(o.brand)+' logo">':'<strong>'+esc(o.brand)+'</strong>';
  var m=objectValue(o.motionProfile,{intensity:70,duration:650,reducedMotion:false});
  var dataJson=JSON.stringify({
    products:list,
    currency:o.currency,
    priceLocale:o.priceLocale,
    language:lang,
    labels:{wishlist:o.wishlistLabel,cart:o.cartLabel,wishlistToast:lang==='en'?'Added to wishlist: ':'Añadido a deseos: ',cartToast:lang==='en'?'Added to demo cart: ':'Añadido al carrito demo: '},
    mediaSlots:MEDIA_SLOTS.map(function(slot){return slot.id;})
  }).replace(/</g,'\\u003c');
  return '<!doctype html><html lang="'+attr(lang)+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(o.brand)+' | '+esc(o.collectionName)+'</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;700;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"><style>'+css(o)+'</style></head><body class="'+(m.reducedMotion?'motion-reduced':'')+'"><div class="rs-page" data-template="fashion-commerce-pro" data-preset="'+attr(o.presetId)+'" data-state="boot" data-language="'+attr(lang)+'" data-responsive-desktop="'+attr(o.responsiveHero&&o.responsiveHero.desktop)+'" data-responsive-tablet="'+attr(o.responsiveHero&&o.responsiveHero.tablet)+'" data-responsive-mobile="'+attr(o.responsiveHero&&o.responsiveHero.mobile)+'"><div class="rs-progress" id="rsProgress"></div>'+(bool(o.teaserEnabled,true)?'<section class="rs-teaser" id="rsTeaser" aria-label="Teaser"><div><span></span><h1>'+esc(o.brand)+'</h1><span></span><p>'+esc(o.volumeLabel)+'</p></div></section>':'')+(bool(o.preloaderEnabled,true)?'<section class="rs-preloader" id="rsPreloader"><strong id="rsPreloaderText"></strong></section>':'')+'<nav class="rs-nav">'+brandMark+'<div>'+nav+'</div><button type="button" class="rs-lang" id="rsLanguage" aria-label="Language">'+esc(lang.toUpperCase())+'</button><a href="'+attr(safeUrl(o.heroCtaUrl,'#section1'))+'">'+esc(o.heroCtaLabel)+'</a></nav><main><section class="rs-hero" id="section0">'+mediaVideo(heroVideo,'rs-hero-video',heroPoster.url)+'<div class="rs-hero-overlay"></div><div class="rs-hero-copy"><span>'+esc(o.heroEyebrow)+'</span><h1 class="rs-glitch" aria-label="'+attr(o.heroTitle)+'">'+glitch+'</h1><p>'+esc(heroSubtitle)+'</p></div></section><section class="rs-gallery" id="section1"><div class="rs-gallery-head"><div><span>01 / '+esc(o.galleryEyebrow)+'</span><h2>'+esc(o.galleryTitle)+'</h2></div><button type="button" id="rsRunway">'+esc(o.runwayLabel)+'</button></div><div class="rs-track-shell"><div class="rs-track" id="rsTrack">'+gallery+'</div></div></section><section class="rs-lookbook" id="section2"><span>02 / LOOKBOOK</span><h2>'+esc(o.lookbookTitle)+'</h2><p>'+esc(o.lookbookIntro)+'</p><button type="button" data-scroll="section1">'+esc(o.lookbookCtaLabel)+'</button></section><section class="rs-videos" id="section3"><span>03 / CAMPAIGN FILMS</span><div class="rs-video-grid">'+videos+'</div></section></main><button class="rs-floating" type="button" id="rsFloating">'+esc(o.floatingCtaLabel)+'</button><section class="rs-modal" id="rsModal" aria-hidden="true" role="dialog" aria-modal="true"><div class="rs-modal-card"><button type="button" id="rsClose" aria-label="Cerrar">×</button><div id="rsModalMedia"></div><div><span id="rsModalEyebrow"></span><h2 id="rsModalTitle"></h2><p id="rsModalDescription"></p><strong id="rsModalPrice"></strong><div class="rs-modal-actions"><button type="button" id="rsWishlist">'+esc(o.wishlistLabel)+'</button><button type="button" id="rsCart">'+esc(o.cartLabel)+'</button></div><small>'+esc(o.demoDisclaimer)+'</small></div></div></section><script type="application/json" id="rsData">'+dataJson+'</script><script>'+runtimeScript(o)+'</script></div></body></html>';
}

function css(o){
  var m=objectValue(o.motionProfile,{intensity:70,duration:650,reducedMotion:false});
  var headline=objectValue(o.headlineTypography,{family:'Bebas Neue',weight:'400',size:160});
  var body=objectValue(o.bodyTypography,{family:'Inter',weight:'400',size:16});
  var intensity=clamp(m.intensity,0,100,70)/100;
  return ':root{--orange:'+attr(o.accentColor)+';--black:'+attr(o.backgroundColor)+';--white:'+attr(o.textColor)+';--gray:#151515;--line:rgba(255,255,255,.18);--dur:'+clamp(m.duration,0,5000,650)+'ms;--motion:'+intensity+';--headline-family:"'+attr(headline.family)+'",Impact,sans-serif;--headline-weight:'+attr(headline.weight)+';--headline-size:'+clamp(headline.size,36,220,160)+'px;--body-family:"'+attr(body.family)+'",Arial,sans-serif;--body-weight:'+attr(body.weight)+';--body-size:'+clamp(body.size,12,28,16)+'px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--black);color:var(--white);font-family:var(--body-family);font-weight:var(--body-weight);font-size:var(--body-size);overflow-x:hidden}body.motion-reduced,body.motion-reduced *{scroll-behavior:auto!important;animation:none!important;transition:none!important}button,a{font:inherit}.rs-page{background:var(--black);min-height:100vh}.rs-progress{position:fixed;z-index:200;left:0;top:0;height:3px;width:0;background:var(--orange)}.rs-teaser,.rs-preloader{position:fixed;z-index:180;inset:0;background:#000;display:grid;place-items:center;text-align:center;transition:opacity .55s,visibility .55s}.rs-page[data-state="ready"] .rs-teaser,.rs-page[data-state="ready"] .rs-preloader,.rs-teaser.hide,.rs-preloader.hide{opacity:0;visibility:hidden;pointer-events:none}.rs-teaser h1,.rs-preloader strong{font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:clamp(48px,9vw,112px);letter-spacing:.18em;margin:0}.rs-teaser span{display:block;height:2px;width:min(420px,70vw);background:var(--orange);margin:12px auto}.rs-teaser p,.rs-hero-copy span,.rs-gallery-head span,.rs-lookbook span,.rs-videos span,.rs-card-copy span,.rs-modal-card span{font-family:"Space Mono",monospace;text-transform:uppercase;letter-spacing:.22em;font-size:11px;color:var(--orange)}.rs-preloader strong{border-right:3px solid var(--orange);padding-right:12px}.rs-nav{position:fixed;z-index:90;top:0;left:0;right:0;height:72px;display:flex;align-items:center;gap:18px;padding:0 28px;background:rgba(0,0,0,.62);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}.rs-nav strong{font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:26px;letter-spacing:.1em;margin-right:auto}.rs-logo{width:42px;height:42px;object-fit:contain;margin-right:auto}.rs-nav div{display:flex;gap:8px;flex-wrap:wrap}.rs-nav-link,.rs-nav a,.rs-lang{background:none;border:0;color:rgba(255,255,255,.75);text-decoration:none;text-transform:uppercase;font-family:"Space Mono";font-size:11px;letter-spacing:.12em;cursor:pointer}.rs-nav a{border:1px solid var(--orange);padding:10px 14px;color:#fff}.rs-lang{border:1px solid var(--line);width:42px;height:36px;color:#fff}.rs-hero{height:100vh;position:relative;display:grid;place-items:center;overflow:hidden;text-align:center}.rs-hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.32)}.rs-hero-overlay{position:absolute;inset:0;background:radial-gradient(circle at center,rgba(255,92,0,.06),rgba(0,0,0,.78) 72%)}.rs-hero-copy{position:relative;z-index:2;padding:0 18px}.rs-glitch{display:flex;justify-content:center;flex-wrap:wrap;font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:clamp(68px,15vw,var(--headline-size));line-height:.78;letter-spacing:.01em;margin:18px 0;text-shadow:4px 4px 0 rgba(0,0,0,.82)}.rs-glitch-char{display:inline-block;transition:transform .18s,color .18s}.rs-glitch-char:hover{color:var(--orange);transform:translate(calc(6px * var(--motion)),calc(-6px * var(--motion))) skew(calc(-12deg * var(--motion)))}.rs-hero-copy p{font-family:"Space Mono";font-size:clamp(12px,1.5vw,18px);letter-spacing:.28em}.rs-gallery{min-height:100vh;padding:104px 0;background:#030303}.rs-gallery-head{display:flex;align-items:end;justify-content:space-between;padding:0 5vw 28px;gap:24px}.rs-gallery-head h2,.rs-lookbook h2{font-family:var(--headline-family);font-weight:var(--headline-weight);font-size:clamp(52px,8vw,132px);line-height:.82;margin:12px 0 0}.rs-gallery-head button,.rs-lookbook button,.rs-card-copy button,.rs-modal-actions button{background:var(--orange);color:#050505;border:0;padding:13px 17px;font-family:var(--headline-family);font-size:18px;letter-spacing:.06em;cursor:pointer}.rs-track-shell{overflow:auto;padding:0 5vw 28px;scrollbar-color:var(--orange) #222}.rs-track{display:flex;gap:18px;width:max-content}.rs-card{width:min(390px,82vw);background:#111;border:1px solid var(--line)}.rs-media-button{position:relative;display:block;width:100%;aspect-ratio:3/4;border:0;padding:0;overflow:hidden;background:#222;cursor:pointer}.rs-card-img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.18);transition:filter var(--dur),transform var(--dur)}.rs-card:hover .rs-card-img,.rs-card.runway-active .rs-card-img{filter:grayscale(0) contrast(1);transform:scale(calc(1 + (.045 * var(--motion))))}.rs-card-number{position:absolute;left:14px;top:12px;font-family:var(--headline-family);font-size:54px;color:#fff;text-shadow:2px 2px #000}.rs-card-copy{padding:18px;display:grid;gap:8px}.rs-card-copy h3{font-family:var(--headline-family);font-size:38px;line-height:.9;margin:0}.rs-card-copy strong{color:var(--orange);font-family:"Space Mono"}.rs-lookbook{min-height:70vh;padding:110px 8vw;background:#171717;display:grid;align-content:center;justify-items:start}.rs-lookbook p{max-width:620px;line-height:1.65;color:rgba(255,255,255,.7)}.rs-videos{min-height:100vh;padding:100px 5vw;background:#000}.rs-video-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin-top:24px}.rs-video-tile{position:relative;aspect-ratio:16/9;overflow:hidden;background:#111}.rs-video{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.2)}.rs-video-tile span{position:absolute;left:12px;bottom:10px;font-family:var(--headline-family);font-size:42px}.rs-floating{position:fixed;z-index:80;right:22px;bottom:22px;border:1px solid var(--orange);background:#000;color:#fff;padding:15px 22px;border-radius:999px;font-family:var(--headline-family);font-size:19px;letter-spacing:.08em;opacity:0;transform:translateY(24px);transition:opacity .35s,transform .35s;cursor:pointer}.rs-floating.show{opacity:1;transform:none}.rs-modal{position:fixed;z-index:130;inset:0;background:rgba(0,0,0,.82);display:grid;place-items:center;padding:20px;opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}.rs-modal.open{opacity:1;visibility:visible}.rs-modal-card{position:relative;width:min(900px,96vw);max-height:88vh;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:24px;background:#111;border:1px solid var(--orange);padding:22px}.rs-modal-card #rsClose{position:absolute;right:12px;top:10px;background:none;border:1px solid var(--line);color:#fff;width:38px;height:38px;cursor:pointer}.rs-modal-card img{width:100%;height:100%;max-height:520px;object-fit:cover}.rs-modal-card h2{font-family:var(--headline-family);font-size:54px;line-height:.9;margin:12px 0}.rs-modal-card p{line-height:1.55;color:rgba(255,255,255,.72)}.rs-modal-card strong{display:block;color:var(--orange);font-family:"Space Mono";font-size:20px;margin:16px 0}.rs-modal-actions{display:flex;gap:10px;flex-wrap:wrap}@media(max-width:820px){.rs-nav{height:auto;min-height:66px;padding:10px 18px}.rs-nav div{display:none}.rs-nav strong{font-size:21px}.rs-nav a{padding:8px 10px}.rs-gallery-head{display:block}.rs-video-grid,.rs-modal-card{grid-template-columns:1fr}.rs-hero-copy p{letter-spacing:.12em}.rs-card{width:78vw}.rs-floating{left:16px;right:16px;border-radius:0}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.rs-card-img,.rs-glitch-char,.rs-floating,.rs-teaser,.rs-preloader{transition:none}.rs-hero-video,.rs-video{animation:none}}';
}

function runtimeScript(o){
  var teaserMs=clamp(o.teaserDuration,0,5000,1200),runwayMs=clamp(o.runwayInterval,1200,9000,2500),preloader=String(o.preloaderText||'RUBIK SOTA'),runwayLabel=esc(o.runwayLabel),runwayStop=esc(o.runwayStopLabel);
  return '(function(){var $=function(s){return document.querySelector(s)},$$=function(s){return [].slice.call(document.querySelectorAll(s))};var data=JSON.parse($("#rsData").textContent),products=data.products,modal=$("#rsModal"),runway=$("#rsRunway"),floating=$("#rsFloating"),progress=$("#rsProgress"),page=$(".rs-page"),runwayTimer=null,runwayIndex=0,wishlist=JSON.parse(localStorage.getItem("rsWishlist")||"[]"),cart=JSON.parse(localStorage.getItem("rsCart")||"[]"),raf=0,scrollDirty=true,timers=[];function later(fn,ms){var id=setTimeout(fn,ms);timers.push(id);return id}function money(v){try{return new Intl.NumberFormat(data.priceLocale||"es-ES",{style:"currency",currency:data.currency||"EUR"}).format(Number(v)||0)}catch(e){return (data.currency||"EUR")+" "+v}}function reduced(){return document.body.classList.contains("motion-reduced")||(matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)}function state(next){if(page)page.dataset.state=next}function scrollToId(id){var el=document.getElementById(id);if(el)el.scrollIntoView({behavior:reduced()?"auto":"smooth"})}$$("[data-scroll]").forEach(function(b){b.addEventListener("click",function(){scrollToId(b.dataset.scroll)})});function openProduct(i){var p=products[i];if(!p)return;var card=$$("[data-product-index]")[i],img=card&&card.querySelector("img");$("#rsModalMedia").innerHTML=img?\'<img src="\'+img.src+\'" alt="\'+p.name.replace(/"/g,"&quot;")+\'">\':"";$("#rsModalEyebrow").textContent=p.eyebrow||p.category||"";$("#rsModalTitle").textContent=p.name;$("#rsModalDescription").textContent=p.description||"";$("#rsModalPrice").textContent=money(p.price);$("#rsWishlist").onclick=function(){wishlist.push(p.id);localStorage.setItem("rsWishlist",JSON.stringify(wishlist));toast(data.labels.wishlistToast+p.name)};$("#rsCart").onclick=function(){cart.push(p.id);localStorage.setItem("rsCart",JSON.stringify(cart));toast(data.labels.cartToast+p.name)};modal.classList.add("open");modal.setAttribute("aria-hidden","false");$("#rsClose").focus()}function closeProduct(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}$$("[data-open-product]").forEach(function(b){b.addEventListener("click",function(){openProduct(Number(b.dataset.openProduct))})});$("#rsClose").addEventListener("click",closeProduct);modal.addEventListener("click",function(e){if(e.target===modal)closeProduct()});document.addEventListener("keydown",function(e){if(e.key==="Escape")closeProduct()});function setRunway(i){var cards=$$("[data-product-index]");cards.forEach(function(card,n){card.classList.toggle("runway-active",n===i)});if(cards[i])cards[i].scrollIntoView({behavior:reduced()?"auto":"smooth",inline:"center",block:"nearest"})}function stopRunway(){clearInterval(runwayTimer);runwayTimer=null;runway.textContent="'+runwayLabel+'"}function startRunway(){stopRunway();runway.textContent="'+runwayStop+'";setRunway(runwayIndex);runwayTimer=setInterval(function(){runwayIndex=(runwayIndex+1)%products.length;setRunway(runwayIndex)},'+runwayMs+')}runway.addEventListener("click",function(){runwayTimer?stopRunway():startRunway()});function draw(){raf=0;scrollDirty=false;var max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?Math.min(100,scrollY/max*100):0)+"%";floating.classList.toggle("show",scrollY>innerHeight*.7)}function requestDraw(){scrollDirty=true;if(!raf)raf=requestAnimationFrame(draw)}window.addEventListener("scroll",requestDraw,{passive:true});window.addEventListener("resize",requestDraw);floating.addEventListener("click",function(){scrollToId("section1")});function toast(text){var el=document.createElement("div");el.textContent=text;el.style.cssText="position:fixed;z-index:220;left:50%;bottom:26px;transform:translateX(-50%);background:#ff5c00;color:#050505;padding:12px 18px;font-family:Space Mono,monospace;font-size:12px";document.body.appendChild(el);later(function(){el.remove()},1800)}function runIntro(){var teaser=$("#rsTeaser"),pre=$("#rsPreloader"),preText=$("#rsPreloaderText"),word="'+esc(preloader)+'",i=0;if(reduced()||(!teaser&&!pre)){state("skipped");later(function(){state("ready")},0);return}if(teaser){state("teaser");later(function(){teaser.classList.add("hide");showPreloader()},'+teaserMs+')}else showPreloader();function showPreloader(){if(!pre){state("ready");return}state("preloader");type()}function type(){if(!preText){state("ready");return}if(i<=word.length){preText.textContent=word.slice(0,i++);later(type,70)}else later(function(){pre.classList.add("hide");state("ready")},450)}}$("#rsLanguage").addEventListener("click",function(){document.documentElement.lang=document.documentElement.lang==="es"?"en":"es";page.dataset.language=document.documentElement.lang;this.textContent=document.documentElement.lang.toUpperCase()});window.addEventListener("pagehide",cleanup);window.addEventListener("beforeunload",cleanup);function cleanup(){stopRunway();if(raf)cancelAnimationFrame(raf);timers.forEach(clearTimeout);window.removeEventListener("scroll",requestDraw);window.removeEventListener("resize",requestDraw)}requestDraw();runIntro()})();';
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
  responsiveHero:{desktop:'Fullscreen video hero',tablet:'Fullscreen with compact nav',mobile:'Stacked nav and centered hero'},
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
