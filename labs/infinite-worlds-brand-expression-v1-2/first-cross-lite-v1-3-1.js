import * as THREE from "https://esm.sh/three@0.172.0";

// V1.3.1 — lightweight first-cross preparation.
// Keeps Nature pavilion/gallery art direction from V1.2.2, but removes compileAsync
// and the 12-render warm-up. Portal/camera/GSAP mechanics remain untouched.
const originalRender=THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__iwV131Capture){
 THREE.WebGLRenderer.prototype.__iwV131Capture=true;
 THREE.WebGLRenderer.prototype.render=function(...args){window.__IW_RENDERER__=this;return originalRender.apply(this,args);};
}
let manager=null,roles=null,renderer=null,engineWarm=false;
const frame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
const pbr=(color,rough=.8,metal=.04)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
function addBox(parent,size,pos,material){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);parent.add(m);return m;}
function groups(holder){return holder.children.filter(g=>g.isGroup&&g.userData?.media);}
function classify(world,holder){const gs=groups(holder);if(world==='city')return{video:gs.find(g=>g.position.x<0&&g.position.y<4),image:gs.find(g=>g.position.x>0&&g.position.y<4),logo:gs.find(g=>g.position.y>8),text:gs.find(g=>g.position.x>0&&g.position.y>=4&&g.position.y<9)};return{video:gs.find(g=>g.position.x<0&&g.position.y>-3),image:gs.find(g=>g.position.x>0&&g.position.y>-3),logo:gs.find(g=>g.position.x>0&&g.position.y<-3),text:gs.find(g=>g.position.x<0&&g.position.y<-3)};}
function clearNature(holder){const zones=[[-18,-7,3,16],[7,18,3,16],[-11,-2,10,22],[2,11,10,22]];for(const o of holder.children){if(!o.isMesh||o.name==='portal')continue;const t=o.geometry?.type||'';if(!/Icosahedron|Cylinder|Sphere/.test(t))continue;const{x,z}=o.position;if(zones.some(([x1,x2,z1,z2])=>x>=x1&&x<=x2&&z>=z1&&z<=z2))o.visible=false;}}
function artDirectNature(r,holder){clearNature(holder);const{video,image,logo,text}=r;if(video){video.position.set(-13.1,-.15,9.2);video.rotation.y=.13;addBox(video,[13.6,8.7,.82],[0,-1.55,-.72],pbr(0x514f43,.96,.01));addBox(video,[14.2,.55,2.2],[0,-4.05,-.25],pbr(0x777463,.98,.01));addBox(video,[.55,8.3,1.45],[-6.6,-1.4,-.18],pbr(0x777463,.97,.01));addBox(video,[.55,8.3,1.45],[6.6,-1.4,-.18],pbr(0x777463,.97,.01));addBox(video,[14.1,.42,1.5],[0,3.05,-.20],pbr(0x706d5d,.95,.01));}if(image){image.position.set(12.2,.45,10);image.rotation.y=-.14;addBox(image,[6.7,9.4,.72],[0,-1.45,-.64],pbr(0x7b735f,.96,.01));addBox(image,[7.4,.52,1.7],[0,-4.45,-.18],pbr(0x98917b,.98,.01));}if(logo){logo.position.set(6.4,-6.35,15.4);logo.rotation.y=-.10;}if(text){text.position.set(-7.2,-6.15,14.4);text.rotation.y=.07;text.scale.set(1.22,1.22,1.22);addBox(text,[8.4,.34,1.8],[0,-2.05,-.30],pbr(0xaaa38c,.98,.01));}}

async function lightWarm(){
 renderer=window.__IW_RENDERER__;for(let i=0;!renderer&&i<60;i++){await frame();renderer=window.__IW_RENDERER__;}
 if(!renderer||!manager)throw new Error('Renderer preflight unavailable.');
 if(engineWarm){await frame();return;}
 const city=manager.worlds.city,nature=manager.worlds.nature;
 for(const w of[city,nature]){w.holder.updateMatrixWorld(true);w.scene.updateMatrixWorld(true);w.camera.updateMatrixWorld(true);w.portal.updateCorners();w.holder.traverse(o=>{const v=o.material?.map?.isVideoTexture?o.material.map.image:null;if(v&&v.paused)v.play().catch(()=>{});});}
 const previous=renderer.getRenderTarget();
 try{
  renderer.setRenderTarget(city.portal.renderTarget);renderer.render(nature.scene,nature.camera);
  renderer.setRenderTarget(nature.portal.renderTarget);renderer.render(city.scene,city.camera);
 }finally{renderer.setRenderTarget(previous);}
 await frame();await frame();engineWarm=true;
}
function wrapAuthoring(){const find=()=>{const apply=document.getElementById('applyExperience'),start=document.getElementById('startExperience'),status=document.getElementById('expressionGlobal');if(!apply||!start||!apply.onclick)return requestAnimationFrame(find);if(apply.dataset.v131Warm)return;apply.dataset.v131Warm='1';const base=apply.onclick;apply.onclick=async function(ev){start.disabled=true;const result=await base.call(this,ev);if(start.disabled)return result;start.disabled=true;apply.disabled=true;apply.textContent='PREPARING FIRST CROSS…';if(status){status.dataset.state='saved';status.querySelector('strong').textContent='PREPARING EXPERIENCE';status.querySelector('p').textContent=engineWarm?'Refreshing media…':'Priming both portal views once…';}try{await lightWarm();apply.textContent='READY ✓';start.disabled=false;if(status){status.dataset.state='applied';status.querySelector('strong').textContent='EXPERIENCE READY';status.querySelector('p').textContent='Media is ready and the first traversal is primed.';}}catch(e){console.error('[V1.3.1 preflight]',e);apply.textContent='APPLIED · PREVIEW READY';start.disabled=false;if(status){status.dataset.state='error';status.querySelector('strong').textContent='PREFLIGHT SKIPPED';status.querySelector('p').textContent='Media is applied. You can start the experience.';}}return result;};};find();}
function boot(m){if(manager)return;manager=m;roles={city:classify('city',m.worlds.city.holder),nature:classify('nature',m.worlds.nature.holder)};artDirectNature(roles.nature,m.worlds.nature.holder);wrapAuthoring();}
window.addEventListener('iw:brand-ready',e=>boot(e.detail.manager),{once:true});
if(window.__IW_BRAND_MANAGER__)boot(window.__IW_BRAND_MANAGER__);
