import * as THREE from "https://esm.sh/three@0.172.0";

// V1.2.2 is an additive production/art-direction layer. It does not alter the
// proven portal transition sequence. It captures the existing renderer only so
// APPLY EXPERIENCE can warm the exact scenes/render targets before first use.
const originalRender=THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__iwV122Capture){
  THREE.WebGLRenderer.prototype.__iwV122Capture=true;
  THREE.WebGLRenderer.prototype.render=function(...args){window.__IW_RENDERER__=this;return originalRender.apply(this,args);};
}

let manager=null,roles=null,renderer=null,warm=false,lastMaps=new Map();
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const sleepFrame=()=>new Promise(r=>requestAnimationFrame(()=>r()));

function currentWorld(){return(document.getElementById('worldName')?.textContent||'').includes('LIVING')?'nature':'city';}
function addBox(parent,size,pos,material){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);parent.add(m);return m;}
function pbr(color,rough=.8,metal=.04){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function childBoxes(group){return group.children.filter(x=>x.isMesh&&x.geometry?.type==='BoxGeometry');}
function classify(world,holder){
  const gs=holder.children.filter(g=>g.isGroup&&g.userData?.media);
  if(world==='city')return{
    video:gs.find(g=>g.position.x<0&&g.position.y<4),
    image:gs.find(g=>g.position.x>0&&g.position.y<4),
    logo:gs.find(g=>g.position.y>8),
    text:gs.find(g=>g.position.x>0&&g.position.y>=4&&g.position.y<8)
  };
  return{
    video:gs.find(g=>g.position.x<0&&g.position.y>-3),
    image:gs.find(g=>g.position.x>0&&g.position.y>-3),
    logo:gs.find(g=>g.position.x>0&&g.position.y<-3),
    text:gs.find(g=>g.position.x<0&&g.position.y<-3)
  };
}

function clearImmediateNatureZones(holder){
  // Clear only immediate procedural meshes. Brand groups/portal architecture are untouched.
  const zones=[[-18,-7,3,16],[7,18,3,16],[-11,-2,10,22],[2,11,10,22]];
  for(const o of holder.children){
    if(!o.isMesh||o.name==='portal')continue;
    const type=o.geometry?.type||'';
    if(!/Icosahedron|Cylinder|Sphere/.test(type))continue;
    const {x,z}=o.position;
    if(zones.some(([x1,x2,z1,z2])=>x>=x1&&x<=x2&&z>=z1&&z<=z2))o.visible=false;
  }
}

function artDirectCity(r){
  const {video,image,logo,text}=r;
  if(video){
    video.position.set(-15.2,2.25,5.25);video.rotation.y=.13;
    addBox(video,[14.4,11.6,.72],[0,-3.05,-.62],pbr(0x10161a,.48,.32));
    addBox(video,[14.8,.38,1.25],[0,3.85,-.25],pbr(0x293239,.40,.42));
    addBox(video,[14.8,.28,1.05],[0,-3.78,-.18],pbr(0x293239,.55,.28));
  }
  if(image){
    image.position.set(14.25,1.25,5.0);image.rotation.y=-.12;
    addBox(image,[7.1,12.0,.68],[0,-2.65,-.58],pbr(0x1b2125,.52,.27));
    addBox(image,[7.45,.26,.85],[0,3.55,-.18],pbr(0x394148,.44,.35));
  }
  if(logo){
    logo.position.set(0,10.55,2.05);
    const boxes=childBoxes(logo);boxes.forEach((b,i)=>{b.material=pbr(i?0x22282c:0x13181c,.38,.42);});
    addBox(logo,[10.2,.22,.9],[0,-1.55,-.18],pbr(0x8f999f,.30,.64));
  }
  if(text){
    text.position.set(15.4,7.1,4.65);text.rotation.y=-.115;text.scale.set(1.22,1.22,1.22);
    addBox(text,[10.0,8.3,.5],[0,-.45,-.34],pbr(0x20272c,.72,.08));
  }
}

function artDirectNature(r,holder){
  clearImmediateNatureZones(holder);
  const {video,image,logo,text}=r;
  if(video){
    video.position.set(-13.1,-.15,9.2);video.rotation.y=.13;
    addBox(video,[13.6,8.7,.82],[0,-1.55,-.72],pbr(0x514f43,.96,.01));
    addBox(video,[14.2,.55,2.2],[0,-4.05,-.25],pbr(0x777463,.98,.01));
    addBox(video,[.55,8.3,1.45],[-6.6,-1.4,-.18],pbr(0x777463,.97,.01));
    addBox(video,[.55,8.3,1.45],[6.6,-1.4,-.18],pbr(0x777463,.97,.01));
    addBox(video,[14.1,.42,1.5],[0,3.05,-.20],pbr(0x706d5d,.95,.01));
  }
  if(image){
    image.position.set(12.2,.45,10.0);image.rotation.y=-.14;
    addBox(image,[6.7,9.4,.72],[0,-1.45,-.64],pbr(0x7b735f,.96,.01));
    addBox(image,[7.4,.52,1.7],[0,-4.45,-.18],pbr(0x98917b,.98,.01));
  }
  if(logo){
    logo.position.set(6.4,-6.35,15.4);logo.rotation.y=-.10;
    const boxes=childBoxes(logo);boxes.forEach((b,i)=>{b.material=pbr(i?0xa29d87:0x827e6c,.98,.01);});
  }
  if(text){
    text.position.set(-7.2,-6.15,14.4);text.rotation.y=.07;text.scale.set(1.22,1.22,1.22);
    addBox(text,[8.4,.34,1.8],[0,-2.05,-.30],pbr(0xaaa38c,.98,.01));
  }
}

function sourceSize(map){
  const s=map?.image||map?.source?.data;if(!s)return null;
  const w=s.videoWidth||s.naturalWidth||s.width,h=s.videoHeight||s.naturalHeight||s.height;
  return w&&h?{w,h}:null;
}
function fitInside(aspect,maxW,maxH,minW=0,minH=0){
  let w=maxW,h=w/aspect;
  if(h>maxH){h=maxH;w=h*aspect;}
  if(w<minW){w=minW;h=w/aspect;}
  if(h<minH){h=minH;w=h*aspect;}
  if(w>maxW){w=maxW;h=w/aspect;}
  if(h>maxH){h=maxH;w=h*aspect;}
  return{w,h};
}
function setBoxXY(box,sx,sy){box.scale.x=sx;box.scale.y=sy;}
function adaptMedia(world,type,role){
  const media=role?.userData?.media,map=media?.material?.map;if(!media||!map)return;
  const key=`${world}:${type}`,uuid=map.uuid;if(lastMaps.get(key)===uuid)return;lastMaps.set(key,uuid);
  const size=sourceSize(map);if(!size)return;const aspect=size.w/size.h;
  map.repeat?.set(1,1);map.offset?.set(0,0);map.needsUpdate=true;
  if(type==='video'){
    const base=world==='city'?{w:11.2,h:6.3,maxW:15.4,maxH:8.0}:{w:9.3,h:5.25,maxW:13.2,maxH:7.2};
    const d=fitInside(aspect,base.maxW,base.maxH,8.5,4.5);media.scale.set(d.w/base.w,d.h/base.h,1);
    const boxes=childBoxes(role);for(const b of boxes.slice(0,2))setBoxXY(b,d.w/base.w,d.h/base.h);
  }else if(type==='image'){
    const base=world==='city'?{w:4.7,h:6.0,maxW:7.3,maxH:9.0}:{w:4.55,h:5.75,maxW:6.8,maxH:8.4};
    const d=fitInside(aspect,base.maxW,base.maxH,3.8,4.8);media.scale.set(d.w/base.w,d.h/base.h,1);
    const boxes=childBoxes(role);for(const b of boxes.slice(0,2))setBoxXY(b,d.w/base.w,d.h/base.h);
  }else if(type==='logo'){
    // The logo support hugs the actual identity instead of leaving a mostly empty rectangle.
    const sx=clamp(media.scale.x,0.34,1),sy=clamp(media.scale.y,0.32,1);
    const boxes=childBoxes(role);
    if(world==='city'){
      boxes.slice(0,2).forEach(b=>{b.scale.x=clamp(sx*1.12,.42,1.06);b.scale.y=clamp(sy*1.42,.48,1);});
    }else{
      boxes.slice(0,2).forEach(b=>{b.scale.x=clamp(sx*1.35,.55,1.05);b.scale.y=clamp(sy*1.65,.50,1);});
    }
  }
}
function adaptiveLoop(){
  if(roles){for(const w of['city','nature'])for(const t of['video','image','logo'])adaptMedia(w,t,roles[w][t]);}
  contextualPortal();requestAnimationFrame(adaptiveLoop);
}
function contextualPortal(){
  if(!manager)return;const cur=currentWorld(),portal=manager.worlds[cur]?.portal,u=portal?.plane?.material?.uniforms;if(!u)return;
  const target=cur==='city'?0xa9efb4:0x91b7ca;u.tint?.value?.setHex(target);if(u.tintAmount)u.tintAmount.value=Math.max(u.tintAmount.value||0,.16);
}

async function warmExperience(){
  renderer=window.__IW_RENDERER__;for(let i=0;!renderer&&i<120;i++){await sleepFrame();renderer=window.__IW_RENDERER__;}
  if(!renderer||!manager)throw new Error('Renderer warm-up unavailable.');
  const worlds=[manager.worlds.city,manager.worlds.nature];
  worlds.forEach(w=>{w.holder.updateMatrixWorld(true);w.scene.updateMatrixWorld(true);w.camera.updateMatrixWorld(true);w.portal.updateCorners();});
  // Force all active videos to advance before the first traversal.
  for(const w of worlds)w.holder.traverse(o=>{const v=o.material?.map?.isVideoTexture?o.material.map.image:null;if(v&&!v.paused)v.play().catch(()=>{});});
  if(renderer.compileAsync){await Promise.all(worlds.map(w=>renderer.compileAsync(w.scene,w.camera).catch(()=>{})));}
  else worlds.forEach(w=>renderer.compile?.(w.scene,w.camera));
  const previous=renderer.getRenderTarget();const temp=new THREE.WebGLRenderTarget(96,96);
  try{
    for(let pass=0;pass<3;pass++){
      for(const w of worlds){renderer.setRenderTarget(temp);renderer.render(w.scene,w.camera);}
      renderer.setRenderTarget(manager.worlds.city.portal.renderTarget);renderer.render(manager.worlds.nature.scene,manager.worlds.nature.camera);
      renderer.setRenderTarget(manager.worlds.nature.portal.renderTarget);renderer.render(manager.worlds.city.scene,manager.worlds.city.camera);
      await sleepFrame();
    }
  }finally{renderer.setRenderTarget(previous);temp.dispose();}
  await sleepFrame();await sleepFrame();warm=true;
}

function wrapAuthoring(){
  const find=()=>{const apply=document.getElementById('applyExperience'),start=document.getElementById('startExperience'),status=document.getElementById('expressionGlobal');if(!apply||!start||!apply.onclick)return requestAnimationFrame(find);
    if(apply.dataset.v122Warm)return;apply.dataset.v122Warm='1';const baseApply=apply.onclick;
    apply.onclick=async function(ev){start.disabled=true;const result=await baseApply.call(this,ev);if(start.disabled)return result;
      start.disabled=true;apply.disabled=true;apply.textContent='PREPARING FIRST CROSS…';if(status){status.dataset.state='saved';status.querySelector('strong').textContent='PREPARING EXPERIENCE';status.querySelector('p').textContent='Warming both worlds, media, materials and portal render targets.';}
      try{await warmExperience();apply.textContent='READY ✓';start.disabled=false;if(status){status.dataset.state='applied';status.querySelector('strong').textContent='EXPERIENCE READY';status.querySelector('p').textContent='Both worlds are warmed. First traversal is prepared to match subsequent crossings.';}}
      catch(e){console.error('[V1.2.2 warmup]',e);apply.textContent='APPLIED · WARMUP RETRY';apply.disabled=false;start.disabled=false;if(status){status.dataset.state='error';status.querySelector('strong').textContent='WARM-UP INCOMPLETE';status.querySelector('p').textContent='Media is applied, but preflight could not complete. You can retry Apply.';}}
      return result;
    };
  };find();
}

function boot(m){
  if(manager)return;manager=m;
  roles={city:classify('city',m.worlds.city.holder),nature:classify('nature',m.worlds.nature.holder)};
  artDirectCity(roles.city);artDirectNature(roles.nature,m.worlds.nature.holder);
  wrapAuthoring();requestAnimationFrame(adaptiveLoop);
}
window.addEventListener('iw:brand-ready',e=>boot(e.detail.manager),{once:true});
if(window.__IW_BRAND_MANAGER__)boot(window.__IW_BRAND_MANAGER__);
