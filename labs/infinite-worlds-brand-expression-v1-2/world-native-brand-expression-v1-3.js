import * as THREE from "https://esm.sh/three@0.172.0";

// V1.3 — World-Native Brand Expression
// Additive layer over V1.2.2. Portal mechanics, cameras, world swap and first-cross
// warm-up remain untouched. This layer only changes brand art direction/support fit.

let manager=null, roles=null;
const seen=new Map();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pbr=(color,rough=.7,metal=.08)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});

function currentWorld(){return(document.getElementById('worldName')?.textContent||'').includes('LIVING')?'nature':'city';}
function box(parent,size,pos,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.position.set(...pos);parent.add(m);return m;}
function childBoxes(group){return group.children.filter(x=>x.isMesh&&x.geometry?.type==='BoxGeometry');}
function groups(holder){return holder.children.filter(g=>g.isGroup&&g.userData?.media);}
function classify(world,holder){
 const gs=groups(holder);
 if(world==='city')return{
  video:gs.find(g=>g.position.x<0&&g.position.y<4),
  image:gs.find(g=>g.position.x>0&&g.position.y<4),
  logo:gs.find(g=>g.position.y>8),
  text:gs.find(g=>g.position.x>0&&g.position.y>=4&&g.position.y<9)
 };
 return{
  video:gs.find(g=>g.position.x<0&&g.position.y>-3),
  image:gs.find(g=>g.position.x>0&&g.position.y>-3),
  logo:gs.find(g=>g.position.x>0&&g.position.y<-3),
  text:gs.find(g=>g.position.x<0&&g.position.y<-3)
 };
}

function hideLegacyBoxes(role){
 if(!role)return;
 // V1.2.2 added heavy architectural boxes around City media. City V1.3 uses the
 // existing world architecture instead, so all old boxes become invisible.
 childBoxes(role).forEach(b=>b.visible=false);
}

function nativePlate(role,color=0x0b0f12){
 const plate=box(role,[1,1,.16],[0,0,.12],pbr(color,.42,.22));
 plate.name='v13-native-plate';
 const lip=box(role,[1,1,.08],[0,-.02,.23],pbr(0x20272c,.3,.42));
 lip.name='v13-native-lip';
 role.userData.v13Plate=plate;role.userData.v13Lip=lip;
 return{plate,lip};
}

function cityArtDirection(r){
 const {video,image,logo,text}=r;
 if(video){
  hideLegacyBoxes(video);
  video.position.set(-10.15,2.15,2.45);video.rotation.set(0,.055,0);video.scale.set(1,1,1);
  nativePlate(video,0x0b0f12);
  video.userData.media.renderOrder=20;
 }
 if(image){
  hideLegacyBoxes(image);
  image.position.set(10.45,.85,2.5);image.rotation.set(0,-.06,0);image.scale.set(1,1,1);
  nativePlate(image,0x11161a);
  image.userData.media.renderOrder=20;
 }
 if(logo){
  hideLegacyBoxes(logo);
  logo.position.set(0,9.7,1.78);logo.rotation.set(0,0,0);logo.scale.set(1,1,1);
  // No rectangle behind the logo. Only a thin architectural rail tied to the façade.
  const rail=box(logo,[9.6,.16,.32],[0,-1.18,-.02],pbr(0x727c83,.28,.62));rail.name='v13-logo-rail';
  logo.userData.media.renderOrder=24;
 }
 if(text){
  hideLegacyBoxes(text);
  text.position.set(8.65,6.55,2.2);text.rotation.set(0,-.045,0);text.scale.set(1.36,1.36,1.36);
  text.userData.media.renderOrder=23;
 }
}

function naturePolish(r){
 const {video,image,logo,text}=r;
 if(video){video.position.set(-12.1,-.15,9.6);video.rotation.y=.10;}
 if(image){image.position.set(11.5,.35,10.2);image.rotation.y=-.10;}
 if(logo){
  logo.position.set(6.7,-6.35,14.6);logo.rotation.y=-.08;
  // Monolith remains physical, but its visible face will resize around the brand mark.
  const b=childBoxes(logo);b.forEach(x=>x.visible=true);
 }
 if(text){text.position.set(-7.2,-6.05,14.5);text.rotation.y=.055;text.scale.set(1.28,1.28,1.28);}
}

function sourceSize(map){
 const s=map?.image||map?.source?.data;if(!s)return null;
 const w=s.videoWidth||s.naturalWidth||s.width,h=s.videoHeight||s.naturalHeight||s.height;
 return w&&h?{w,h,source:s}:null;
}
function contain(aspect,maxW,maxH,minW=0,minH=0){
 let w=maxW,h=w/aspect;if(h>maxH){h=maxH;w=h*aspect;}
 if(w<minW){w=minW;h=w/aspect;}if(h<minH){h=minH;w=h*aspect;}
 if(w>maxW){w=maxW;h=w/aspect;}if(h>maxH){h=maxH;w=h*aspect;}
 return{w,h};
}
function resizePlate(role,w,h,pad=.22){
 const p=role.userData.v13Plate,l=role.userData.v13Lip;if(!p||!l)return;
 p.scale.set(w+pad*2,h+pad*2,1);l.scale.set(w+pad*.6,h+pad*.6,1);
}

function visibleAlphaBounds(img){
 try{
  const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(!w||!h)return null;
  const scale=Math.min(1,512/Math.max(w,h)),cw=Math.max(1,Math.round(w*scale)),ch=Math.max(1,Math.round(h*scale));
  const c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,cw,ch);
  const d=x.getImageData(0,0,cw,ch).data;let minX=cw,minY=ch,maxX=-1,maxY=-1,transparent=0;
  for(let yy=0;yy<ch;yy++)for(let xx=0;xx<cw;xx++){const a=d[(yy*cw+xx)*4+3];if(a<245)transparent++;if(a>18){if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;if(yy<minY)minY=yy;if(yy>maxY)maxY=yy;}}
  if(maxX<minX||maxY<minY)return null;
  return{minX,minY,maxX,maxY,cw,ch,transparentRatio:transparent/(cw*ch)};
 }catch{return null;}
}

function cropLogoToVisible(media,map,size){
 if(map.userData?.v13LogoProcessed)return;
 const img=size?.source;if(!img||img.tagName!=='IMG'){map.userData.v13LogoProcessed=true;return;}
 const b=visibleAlphaBounds(img);map.userData.v13LogoProcessed=true;if(!b||b.transparentRatio<.03)return;
 const padX=Math.max(2,Math.round((b.maxX-b.minX+1)*.06)),padY=Math.max(2,Math.round((b.maxY-b.minY+1)*.10));
 const x1=clamp(b.minX-padX,0,b.cw-1),y1=clamp(b.minY-padY,0,b.ch-1),x2=clamp(b.maxX+padX,1,b.cw-1),y2=clamp(b.maxY+padY,1,b.ch-1);
 const rw=(x2-x1+1)/b.cw,rh=(y2-y1+1)/b.ch;
 map.repeat.set(rw,rh);map.offset.set(x1/b.cw,1-(y2+1)/b.ch);map.needsUpdate=true;
 media.userData.v13VisibleAspect=((x2-x1+1)/(y2-y1+1));
}

function fitCityMedia(type,role){
 const media=role?.userData?.media,map=media?.material?.map;if(!media||!map)return;
 const size=sourceSize(map);if(!size)return;
 const key=`city:${type}`,sig=`${map.uuid}:${size.w}x${size.h}`;if(seen.get(key)===sig)return;seen.set(key,sig);
 const aspect=size.w/size.h;
 if(type==='video'){
  const d=contain(aspect,10.2,6.2,7.8,4.1);media.scale.set(d.w/11.2,d.h/6.3,1);resizePlate(role,d.w,d.h,.14);
 }else if(type==='image'){
  const d=contain(aspect,5.3,7.0,3.2,4.2);media.scale.set(d.w/4.7,d.h/6.0,1);resizePlate(role,d.w,d.h,.11);
 }else if(type==='logo'){
  cropLogoToVisible(media,map,size);const a=media.userData.v13VisibleAspect||aspect;const d=contain(a,8.8,2.25,3.4,.72);media.scale.set(d.w/8.2,d.h/2.1,1);
 }else if(type==='text'){
  // Text is intentionally large and wall-native; no support is added.
  media.scale.set(1.12,1.12,1);
 }
}

function fitNatureMedia(type,role){
 const media=role?.userData?.media,map=media?.material?.map;if(!media||!map)return;
 const size=sourceSize(map);if(!size)return;
 const key=`nature:${type}`,sig=`${map.uuid}:${size.w}x${size.h}`;if(seen.get(key)===sig)return;seen.set(key,sig);
 const aspect=size.w/size.h;
 if(type==='video'){
  const d=contain(aspect,11.2,6.4,8.4,4.6);media.scale.set(d.w/9.3,d.h/5.25,1);
 }else if(type==='image'){
  const d=contain(aspect,5.4,7.0,3.4,4.5);media.scale.set(d.w/4.55,d.h/5.75,1);
 }else if(type==='logo'){
  cropLogoToVisible(media,map,size);const a=media.userData.v13VisibleAspect||aspect;const d=contain(a,4.05,1.95,1.8,.68);media.scale.set(d.w/3.25,d.h/1.55,1);
  // Resize the two monolith bodies around the real mark instead of leaving an empty slab.
  const bs=childBoxes(role).filter(b=>b.visible);if(bs.length){const sx=clamp(d.w/3.25*.86,.55,1.05),sy=clamp(d.h/1.55*.82,.48,1.0);bs.slice(0,2).forEach((b,i)=>{b.scale.x=sx*(i?1.05:1.12);b.scale.y=sy*(i?1.18:1.28);});}
 }
}

function attention(){
 if(!roles||!manager){requestAnimationFrame(attention);return;}
 for(const t of['video','image','logo','text'])fitCityMedia(t,roles.city[t]);
 for(const t of['video','image','logo'])fitNatureMedia(t,roles.nature[t]);
 // Keep the target world fully readable through the portal. Current-world media gets
 // only light emphasis, never opacity changes.
 const cur=currentWorld();
 for(const w of['city','nature'])for(const t of['video','image']){
  const r=roles[w][t],l=r?.userData?.light;if(!r?.visible||!l)continue;
  if(w!==cur){l.intensity=r.userData.attentionHero||.4;continue;}
  const cam=manager.worlds[w].camera,forward=new THREE.Vector3();cam.getWorldDirection(forward);const p=new THREE.Vector3();r.getWorldPosition(p);
  const dot=forward.dot(p.sub(cam.position).normalize()),k=THREE.MathUtils.smoothstep(dot,.70,.93);
  l.intensity=THREE.MathUtils.lerp((r.userData.attentionBase||.08)*.8,(r.userData.attentionHero||.5)*1.05,k);
 }
 requestAnimationFrame(attention);
}

function improvePortalReadability(){
 const loop=()=>{if(manager){const cur=currentWorld(),u=manager.worlds[cur]?.portal?.plane?.material?.uniforms;if(u){const target=cur==='city'?0x9fd9ad:0x8faabd;u.tint?.value?.setHex(target);if(u.tintAmount)u.tintAmount.value=.20;if(u.fringe)u.fringe.value=Math.min(u.fringe.value,.42);}}
 requestAnimationFrame(loop)};loop();
}

function updateAuthoringCopy(){
 const replacements={
  city:{video:'Architectural Media Takeover · left façade',image:'Editorial Campaign Wall · right façade',logo:'Architectural Signature · portal crown',text:'Façade Typography · right architectural field'},
  nature:{video:'Landscape Cinema Pavilion · left clearing',image:'Scenic Gallery · right clearing',logo:'Travertine Brand Monolith · foreground',text:'Land-art Typography · foreground left'}
 };
 const obs=new MutationObserver(()=>{
  const city=(document.querySelector('.world-tab.active')?.dataset.world||'city');
  const cards=[...document.querySelectorAll('.expression-card')];
  for(const card of cards){const type=card.querySelector('h5')?.textContent?.toLowerCase();const rows=[...card.querySelectorAll('.expression-meta p')];if(type&&replacements[city]?.[type]&&rows[0]){const b=rows[0].querySelector('b');rows[0].innerHTML='';if(b)rows[0].appendChild(b);rows[0].append(replacements[city][type]);}}
 });
 const host=document.getElementById('expressionWorldHost');if(host)obs.observe(host,{childList:true,subtree:true});
}

function boot(m){
 if(manager)return;manager=m;roles={city:classify('city',m.worlds.city.holder),nature:classify('nature',m.worlds.nature.holder)};
 cityArtDirection(roles.city);naturePolish(roles.nature);updateAuthoringCopy();requestAnimationFrame(attention);improvePortalReadability();
}
window.addEventListener('iw:brand-ready',e=>boot(e.detail.manager),{once:true});
if(window.__IW_BRAND_MANAGER__)boot(window.__IW_BRAND_MANAGER__);
