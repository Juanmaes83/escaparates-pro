import * as THREE from "https://esm.sh/three@0.172.0";

// VISUAL FINAL PASS — additive/reversible layer over the stable V1.2.1 production pass.
// It must never own media loading, Apply/Start, portal, cameras, transitions or world switching.

let manager = null;
let roles = null;
const processed = new Map();

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const groups = holder => holder.children.filter(g=>g.isGroup && g.userData?.media);
const boxes = group => group.children.filter(o=>o.isMesh && o.geometry?.type === 'BoxGeometry');

function classify(world, holder){
  const gs = groups(holder);
  if(world === 'city'){
    return {
      video: gs.find(g=>g.position.x < -2 && g.position.y < 4),
      image: gs.find(g=>g.position.x > 2 && g.position.y < 4),
      logo: gs.find(g=>g.position.y > 8),
      text: gs.find(g=>g.position.x > 2 && g.position.y >= 4 && g.position.y < 8)
    };
  }
  return {
    video: gs.find(g=>g.position.x < -2 && g.position.y > -3),
    image: gs.find(g=>g.position.x > 2 && g.position.y > -3),
    logo: gs.find(g=>g.position.x > 0 && g.position.y < -3),
    text: gs.find(g=>g.position.x < 0 && g.position.y < -3)
  };
}

function tuneFrame(group, world, kind){
  if(!group) return;
  const bs = boxes(group);
  if(kind === 'video' || kind === 'image'){
    if(bs[0]){
      bs[0].material.color.setHex(world==='city' ? 0x11171c : 0x777463);
      bs[0].material.roughness = world==='city' ? .46 : .93;
      bs[0].material.metalness = world==='city' ? .32 : .02;
      bs[0].scale.z = .48;
    }
    if(bs[1]){
      bs[1].material.color.setHex(world==='city' ? 0x050708 : 0x3c3b32);
      bs[1].material.roughness = world==='city' ? .34 : .86;
      bs[1].material.metalness = world==='city' ? .42 : .04;
      bs[1].scale.z = .42;
    }
    const light = group.userData.light;
    if(light){
      light.distance = world==='city' ? 13 : 11;
      light.decay = 2;
      light.intensity *= world==='city' ? .72 : .62;
    }
  }
}

function artDirectCity(r){
  if(r.video){
    r.video.position.set(-8.25,1.55,3.15);
    r.video.rotation.set(0,.055,0);
    r.video.scale.set(1,1,1);
    tuneFrame(r.video,'city','video');
  }
  if(r.image){
    r.image.position.set(7.75,.75,3.10);
    r.image.rotation.set(0,-.055,0);
    r.image.scale.set(1,1,1);
    tuneFrame(r.image,'city','image');
  }
  if(r.logo){
    r.logo.position.set(0,8.65,2.42);
    r.logo.rotation.set(0,0,0);
    r.logo.scale.set(1,1,1);
    const bs=boxes(r.logo);
    if(bs[0]){
      bs[0].material.color.setHex(0x171d21);
      bs[0].material.roughness=.38;
      bs[0].material.metalness=.40;
      bs[0].scale.z=.55;
    }
  }
  if(r.text){
    // Editorial copy occupies the upper-right architectural field, paired with the campaign image below.
    r.text.position.set(7.35,5.45,3.15);
    r.text.rotation.set(0,-.045,0);
    r.text.scale.set(1.04,1.04,1.04);
  }
}

function artDirectNature(r){
  if(r.video){
    r.video.position.set(-8.35,-.25,6.35);
    r.video.rotation.set(0,.075,0);
    r.video.scale.set(1,1,1);
    tuneFrame(r.video,'nature','video');
  }
  if(r.image){
    r.image.position.set(7.65,.15,6.75);
    r.image.rotation.set(0,-.075,0);
    r.image.scale.set(1,1,1);
    tuneFrame(r.image,'nature','image');
  }
  if(r.logo){
    r.logo.position.set(5.35,-5.85,9.35);
    r.logo.rotation.set(0,-.07,0);
    const bs=boxes(r.logo);
    bs.forEach((b,i)=>{
      b.material.color.setHex(i===0?0x777867:0x9c9984);
      b.material.roughness=.96;
      b.material.metalness=.01;
    });
  }
  if(r.text){
    r.text.position.set(-5.75,-5.45,9.55);
    r.text.rotation.set(0,.045,0);
    r.text.scale.set(1.10,1.10,1.10);
  }
}

function sourceSize(map){
  const s=map?.image || map?.source?.data;
  if(!s) return null;
  const w=s.videoWidth||s.naturalWidth||s.width;
  const h=s.videoHeight||s.naturalHeight||s.height;
  return w&&h ? {w,h,source:s} : null;
}

function contain(aspect,maxW,maxH,minW=0,minH=0){
  let w=maxW,h=w/aspect;
  if(h>maxH){h=maxH;w=h*aspect;}
  if(w<minW){w=minW;h=w/aspect;}
  if(h<minH){h=minH;w=h*aspect;}
  if(w>maxW){w=maxW;h=w/aspect;}
  if(h>maxH){h=maxH;w=h*aspect;}
  return {w,h};
}

function resetTextureWindow(map){
  if(!map?.repeat || !map?.offset) return;
  map.repeat.set(1,1);
  map.offset.set(0,0);
  map.needsUpdate=true;
}

function visibleAlphaBounds(img){
  try{
    const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
    if(!w||!h) return null;
    const sc=Math.min(1,384/Math.max(w,h));
    const cw=Math.max(1,Math.round(w*sc)),ch=Math.max(1,Math.round(h*sc));
    const c=document.createElement('canvas');c.width=cw;c.height=ch;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,cw,ch);
    const d=x.getImageData(0,0,cw,ch).data;
    let minX=cw,minY=ch,maxX=-1,maxY=-1,transparent=0;
    for(let yy=0;yy<ch;yy++)for(let xx=0;xx<cw;xx++){
      const a=d[(yy*cw+xx)*4+3];
      if(a<245) transparent++;
      if(a>20){minX=Math.min(minX,xx);maxX=Math.max(maxX,xx);minY=Math.min(minY,yy);maxY=Math.max(maxY,yy);}
    }
    if(maxX<minX||maxY<minY) return null;
    return {minX,minY,maxX,maxY,cw,ch,transparentRatio:transparent/(cw*ch)};
  }catch{return null;}
}

function cropLogoWhitespace(media,map,size){
  if(map.userData?.visualFinalLogoProcessed) return null;
  map.userData.visualFinalLogoProcessed=true;
  const img=size?.source;
  if(!img || img.tagName!=='IMG') return null;
  const b=visibleAlphaBounds(img);
  if(!b || b.transparentRatio < .025) return null;
  const px=Math.max(2,Math.round((b.maxX-b.minX+1)*.055));
  const py=Math.max(2,Math.round((b.maxY-b.minY+1)*.08));
  const x1=clamp(b.minX-px,0,b.cw-1),x2=clamp(b.maxX+px,1,b.cw-1);
  const y1=clamp(b.minY-py,0,b.ch-1),y2=clamp(b.maxY+py,1,b.ch-1);
  const rw=(x2-x1+1)/b.cw,rh=(y2-y1+1)/b.ch;
  map.repeat.set(rw,rh);
  map.offset.set(x1/b.cw,1-(y2+1)/b.ch);
  map.needsUpdate=true;
  const a=(x2-x1+1)/(y2-y1+1);
  media.userData.visualFinalAspect=a;
  return a;
}

function fitFrame(role,kind,world){
  const media=role?.userData?.media,map=media?.material?.map;
  if(!media||!map) return;
  const size=sourceSize(map);if(!size) return;
  const key=`${world}:${kind}`;
  const sig=`${map.uuid}:${size.w}x${size.h}`;
  if(processed.get(key)===sig) return;
  processed.set(key,sig);

  if(kind==='video'||kind==='image') resetTextureWindow(map);
  const aspect=size.w/size.h;
  let dims;
  if(world==='city'&&kind==='video') dims=contain(aspect,10.8,6.15,7.6,4.0);
  if(world==='city'&&kind==='image') dims=contain(aspect,6.35,5.7,3.7,3.0);
  if(world==='nature'&&kind==='video') dims=contain(aspect,9.8,5.65,7.2,3.9);
  if(world==='nature'&&kind==='image') dims=contain(aspect,5.6,6.0,3.3,3.3);
  if(!dims) return;

  const base = world==='city'
    ? (kind==='video'?{w:11.2,h:6.3}:{w:4.7,h:6.0})
    : (kind==='video'?{w:9.3,h:5.25}:{w:4.55,h:5.75});
  media.scale.set(dims.w/base.w,dims.h/base.h,1);
  const bs=boxes(role);
  if(bs[0]) bs[0].scale.set((dims.w+.38)/(base.w+.55),(dims.h+.38)/(base.h+.55),.48);
  if(bs[1]) bs[1].scale.set((dims.w+.10)/(base.w+.08),(dims.h+.10)/(base.h+.08),.42);
}

function fitLogo(role,world){
  const media=role?.userData?.media,map=media?.material?.map;
  if(!media||!map) return;
  const size=sourceSize(map);if(!size) return;
  const key=`${world}:logo`,sig=`${map.uuid}:${size.w}x${size.h}`;
  if(processed.get(key)===sig) return;
  processed.set(key,sig);

  resetTextureWindow(map);
  const cropped=cropLogoWhitespace(media,map,size);
  const aspect=cropped||size.w/size.h;
  const dims=world==='city'?contain(aspect,7.3,1.95,2.5,.62):contain(aspect,3.75,1.65,1.55,.58);
  const base=world==='city'?{w:8.2,h:2.1}:{w:3.25,h:1.55};
  media.scale.set(dims.w/base.w,dims.h/base.h,1);

  const bs=boxes(role);
  if(world==='city'&&bs[0]){
    bs[0].scale.x=clamp((dims.w+.8)/9.2,.38,.94);
    bs[0].scale.y=clamp((dims.h+.55)/2.7,.42,.95);
  }
  if(world==='nature'){
    const sx=clamp((dims.w+.7)/4.7,.52,1),sy=clamp((dims.h+.65)/3.1,.48,.92);
    if(bs[0]){bs[0].scale.x=sx;bs[0].scale.y=sy;}
    if(bs[1]){bs[1].scale.x=clamp(sx*1.02,.54,1);bs[1].scale.y=clamp(sy*1.06,.50,.96);}
  }
}

function fitLoop(){
  if(roles){
    for(const w of ['city','nature']){
      fitFrame(roles[w].video,'video',w);
      fitFrame(roles[w].image,'image',w);
      fitLogo(roles[w].logo,w);
    }
  }
  requestAnimationFrame(fitLoop);
}

function polishPanelCopy(){
  const host=document.getElementById('expressionWorldHost');
  if(!host) return;
  const labels={
    city:{video:'Architectural Media Façade · left of portal',image:'Editorial Campaign Lightbox · right of portal',logo:'Architectural Brand Signature · portal crown',text:'Editorial Façade Copy · upper-right field'},
    nature:{video:'Landscape Cinema · left clearing',image:'Scenic Gallery Frame · right clearing',logo:'Stone Brand Monolith · foreground right',text:'Land-art Editorial Copy · foreground left'}
  };
  const update=()=>{
    const world=document.querySelector('.world-tab.active')?.dataset.world||'city';
    [...host.querySelectorAll('.expression-card')].forEach(card=>{
      const type=card.querySelector('h5')?.textContent?.trim().toLowerCase();
      const row=card.querySelector('.expression-meta p');
      if(!type||!row||!labels[world]?.[type]) return;
      const b=row.querySelector('b');row.innerHTML='';if(b)row.appendChild(b);row.append(labels[world][type]);
    });
  };
  new MutationObserver(update).observe(host,{subtree:true,childList:true});update();
}

function boot(m){
  if(manager) return;
  manager=m;
  roles={city:classify('city',m.worlds.city.holder),nature:classify('nature',m.worlds.nature.holder)};
  artDirectCity(roles.city);
  artDirectNature(roles.nature);
  polishPanelCopy();
  requestAnimationFrame(fitLoop);
}

window.addEventListener('iw:brand-ready',e=>boot(e.detail.manager),{once:true});
if(window.__IW_BRAND_MANAGER__) boot(window.__IW_BRAND_MANAGER__);
