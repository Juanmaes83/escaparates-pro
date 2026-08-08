// CASEBOOK PRO V3 — PEARL COUTURE V2
// Additive/reversible scene-composer layer. Fashion clone only.
(function(){
'use strict';
const VERSION='3F.8-pearl-couture-authoring';
const previous=window.patchFashionSceneBridge;
if(typeof previous!=='function') throw new Error('Pearl Couture V2: Pearl bridge unavailable');

const runtime=String.raw`
/* __CASEBOOK_PEARL_COUTURE_V2__ */
const __pcState={version:'${VERSION}',center:new THREE.Vector3(-6,4,5),size:new THREE.Vector3(104,56,8),legacyLights:[],applied:false,mode:'author',minZ:92,maxZ:440};
window.__PearlAuthoringHardeningInstalled=true;
function __pcBounds(){
  const b=new THREE.Box3();let any=false;
  items.forEach(it=>{if(it&&it.grp){it.grp.updateWorldMatrix(true,true);b.expandByObject(it.grp);any=true;}});
  if(any&&!b.isEmpty()){b.getCenter(__pcState.center);b.getSize(__pcState.size);}
  return {center:__pcState.center.clone(),size:__pcState.size.clone()};
}
function __pcHideElement(el){if(!el||el.id==='pearlCameraHud')return;el.style.setProperty('display','none','important');}
function __pcHideTopbar(){
  let n=document.getElementById('menuBtn');if(!n)return;
  for(let i=0;i<6&&n.parentElement;i++){
    n=n.parentElement;const r=n.getBoundingClientRect();
    if(r.width>innerWidth*.66&&r.height>24&&r.height<110){__pcHideElement(n);break;}
  }
}
function __pcHideBottomZoom(){
  Array.from(document.querySelectorAll('body *')).forEach(el=>{
    const txt=String(el.textContent||'').trim();
    if(/^\d{1,3}%$/.test(txt)){
      let n=el;
      for(let i=0;i<4&&n.parentElement;i++){
        n=n.parentElement;const r=n.getBoundingClientRect();
        if(r.bottom>innerHeight-90&&r.height<90&&r.width>140&&r.width<520){__pcHideElement(n);break;}
      }
    }
    if(txt.toLowerCase().includes('drag the board to pan')&&txt.length<120)__pcHideElement(el);
  });
}
function __pcHideLegacy(){
  items.forEach(it=>{if(!it?.grp)return;if(it.grp.userData.__pcVisible==null)it.grp.userData.__pcVisible=it.grp.visible;it.grp.visible=false;});
  ropes.forEach(r=>{try{if(!r.meta)r.meta={};if(!r.meta.smart)r.meta.smart={};r.meta.smart.style='physical';r.meta.smart.direction='none';r.meta.smart.animated=false;r.__v2FocusFactor=0;r.opacity=0;if(r.mat){r.mat.transparent=true;r.mat.opacity=0;}}catch(_){}});
  if(typeof __surface!=='undefined'){if(__surface.board)__surface.board.visible=false;if(__surface.boardMedia)__surface.boardMedia.visible=false;if(__surface.wall)__surface.wall.visible=false;}
  setTimeout(()=>{try{if(Array.isArray(__v2.zones))__v2.zones.forEach(z=>{if(z.__mesh)z.__mesh.visible=false})}catch(_){}},0);
  ['rail','inspector','avatars','bellBtn','kebabBtn','undoBtn','redoBtn','filtersBtn','timelineBtn','minimap'].forEach(id=>__pcHideElement(document.getElementById(id)));
  document.querySelectorAll('.v2Modebar,.v2StoryRail,.v2Hud').forEach(__pcHideElement);
  __pcHideTopbar();__pcHideBottomZoom();
}
function __pcSilenceLegacyLights(){
  if(__pcState.legacyLights.length)return;
  scene.traverse(o=>{if(o.isLight&&!__fashionState.lights.includes(o)){__pcState.legacyLights.push([o,o.intensity]);o.intensity*=.10;}});
}
function __pcDress(){
  const sy=58,sa=112,pos=[],uv=[],idx=[],cx=__pcState.center.x,baseY=-15;
  for(let iy=0;iy<=sy;iy++){
    const v=iy/sy,y=baseY+v*60;
    const taper=Math.pow(1-v,1.36),r0=3.4+17.2*taper;
    for(let ia=0;ia<=sa;ia++){
      const u=ia/sa,th=u*Math.PI*2;
      const pleat=1+.105*Math.sin(th*10+v*5.4)+.038*Math.sin(th*19-v*7.2);
      const asym=1+.075*Math.sin(th+v*2.4);
      const r=r0*pleat*asym,twist=.34*v+.065*Math.sin(v*Math.PI*2);
      const x=cx+Math.cos(th+twist)*r*.66;
      const z=7.2+Math.sin(th+twist)*r*.31+1.55*Math.sin(v*Math.PI)*Math.cos(th*2);
      pos.push(x,y,z);uv.push(u,v);
      if(iy<sy&&ia<sa){const a=iy*(sa+1)+ia,b=a+1,c=a+sa+1,d=c+1;idx.push(a,c,b,b,c,d);}
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const mat=new THREE.MeshPhysicalMaterial({color:0xeee8de,roughness:.46,metalness:.015,clearcoat:.10,clearcoatRoughness:.62,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,mat);mesh.name='PEARL_COUTURE_HERO';mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function __pcText(lines,w=30,h=6,hero=false){const c=document.createElement('canvas');c.width=1200;c.height=300;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.fillStyle='#232220';x.textBaseline='top';x.font=hero?'600 74px Georgia,Times New Roman,serif':'600 28px Arial,Helvetica,sans-serif';(Array.isArray(lines)?lines:[lines]).slice(0,3).forEach((t,i)=>x.fillText(String(t||'').toUpperCase(),26,22+i*(hero?88:52),1140));const tx=new THREE.CanvasTexture(c);tx.needsUpdate=true;const m=new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,side:THREE.DoubleSide});const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.renderOrder=30;return o;}
function __pcArchitecture(){
  const g=__fashionState.group;g.name='CASEBOOK_FASHION_PEARL_COUTURE_V2';scene.add(g);
  const cyc=__pGradientCyclorama();cyc.material.roughness=.98;cyc.material.color.set(0xbab6b0);g.add(cyc);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(84,160),__fMat(0xa9a6a1,.63,.07));floor.scale.y=.47;floor.position.set(__pcState.center.x,-19,-1.15);floor.receiveShadow=true;g.add(floor);
  const inner=new THREE.Mesh(new THREE.CircleGeometry(47,144),__fMat(0xc4c0b9,.44,.10));inner.scale.y=.34;inner.position.set(__pcState.center.x,-14,-.76);inner.receiveShadow=true;g.add(inner);
  const dress=__pcDress();g.add(dress);
  const cx=__pcState.center.x;
  const collar=new THREE.Mesh(new THREE.TorusGeometry(4.25,.31,22,112),__fMat(0x8f8d89,.20,.86));collar.position.set(cx,45.3,7.2);collar.scale.y=.70;collar.castShadow=true;g.add(collar);
  const spine=__pRibbon([new THREE.Vector3(cx-1,-10,7.5),new THREE.Vector3(cx+3,3,8.6),new THREE.Vector3(cx-2,19,9),new THREE.Vector3(cx+1,42,7.8)],1.05,0x8f8d89,.76,.17,.72);g.add(spine);
  const left=__pRibbon([new THREE.Vector3(-77,-37,.4),new THREE.Vector3(-62,-4,1.3),new THREE.Vector3(-73,34,1.9),new THREE.Vector3(-49,59,.9)],9.7,0xaaa6a0,.03,.66,.94);g.add(left);
  const right=__pRibbon([new THREE.Vector3(65,-40,.8),new THREE.Vector3(52,-10,1.8),new THREE.Vector3(66,27,2.5),new THREE.Vector3(44,57,1.2)],7.3,0x656361,.72,.24,.91);g.add(right);
  const sweep=__pRibbon([new THREE.Vector3(-49,58,2),new THREE.Vector3(-20,66,2.8),new THREE.Vector3(18,62,2.7),new THREE.Vector3(47,49,1.8)],3.6,0xc6c3bd,.42,.26,.90);g.add(sweep);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(29,.38,22,176),__fMat(0x9d9c99,.24,.78));halo.name='PEARL_PORTAL_HALO';halo.position.set(cx,14,2.0);halo.scale.y=1.15;halo.castShadow=true;g.add(halo);
  const halo2=new THREE.Mesh(new THREE.TorusGeometry(34,.10,12,176),__fMat(0xe2ded7,.42,.19));halo2.position.set(cx,14,1.45);halo2.scale.y=1.15;g.add(halo2);
  const glass=new THREE.MeshPhysicalMaterial({color:0xe0ddd6,roughness:.22,metalness:0,transparent:true,opacity:.18,transmission:.22,thickness:.34,side:THREE.DoubleSide,depthWrite:false});
  const scrimL=new THREE.Mesh(new THREE.PlaneGeometry(27,64),glass.clone());scrimL.position.set(-43,5,4);scrimL.rotation.z=-.10;g.add(scrimL);
  const scrimR=new THREE.Mesh(new THREE.PlaneGeometry(25,58),glass.clone());scrimR.position.set(34,0,4.5);scrimR.rotation.z=.075;g.add(scrimR);
  const names=items.slice(0,3).map((it,i)=>String(it?.title||it?.name||['LOOK 01','MATERIAL','TALENT'][i]).toUpperCase());
  const title=__pcText(['AFTER DARK / FW26','PEARL COUTURE STUDY'],48,10,true);title.name='PEARL_COPY_HERO';title.position.set(-57,43,8.2);g.add(title);
  const look=__pcText(['01 / SILHOUETTE',names[0]||'LOOK 01'],28,5.2,false);look.position.set(39,34,7.8);g.add(look);
  const material=__pcText(['02 / MATERIAL',names[1]||'PEARL SATIN'],27,5,false);material.position.set(40,-31,7.7);g.add(material);
  const index=__pcText(['CASEBOOK PRO V4 / FASHION','SCENE 01 — PEARL RUNWAY'],34,5.4,false);index.position.set(-50,-43,7.5);g.add(index);
  const burgundy=new THREE.Mesh(new THREE.CylinderGeometry(2.9,2.9,.72,72),__fMat(0x6f1723,.34,.26));burgundy.rotation.x=Math.PI/2;burgundy.position.set(41,-22,7.2);burgundy.castShadow=true;g.add(burgundy);
  const chrome=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,18,72),__fMat(0x969590,.17,.88));chrome.position.set(46,-5,6.9);chrome.castShadow=true;g.add(chrome);
}
function __pcLights(){
  renderer.shadowMap.enabled=true;if('ACESFilmicToneMapping' in THREE)renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.77;
  __pcSilenceLegacyLights();
  const add=(l,t)=>{scene.add(l);__fashionState.lights.push(l);if(t){scene.add(t);l.target=t;__fashionState.lights.push(t);}};
  const hero=new THREE.Object3D();hero.position.set(__pcState.center.x,12,6);
  const key=new THREE.SpotLight(0xfff3e5,1.30,280,Math.PI*.19,.78,1.5);key.position.set(-58,65,86);key.castShadow=true;key.shadow.mapSize.set(1536,1536);add(key,hero);
  const rt=new THREE.Object3D();rt.position.set(__pcState.center.x,12,7);const rim=new THREE.SpotLight(0xd7e2ea,.70,260,Math.PI*.18,.70,1.8);rim.position.set(62,38,60);add(rim,rt);
  const gt=new THREE.Object3D();gt.position.set(-12,-6,2);const graze=new THREE.SpotLight(0xe3cfb9,.55,240,Math.PI*.22,.84,1.9);graze.position.set(-80,-28,40);add(graze,gt);
  const fill=new THREE.HemisphereLight(0xe5e1da,0x686a6b,.30);scene.add(fill);__fashionState.lights.push(fill);
}
function __pcCamera(x,y,z,lx=__pcState.center.x,ly=9,lz=5){
  rig.tx=x;rig.ty=y;rig.tz=z;camera.position.set(x,y,z);camera.lookAt(lx,ly,lz);camera.updateMatrixWorld();camera.updateProjectionMatrix();
}
function __pcFitScene(){
  const aspect=Math.max(.6,camera.aspect||1),vfov=Math.max(.2,(camera.fov||30)*Math.PI/180),hfov=2*Math.atan(Math.tan(vfov/2)*aspect);
  const compositionW=166,compositionH=116;
  const dv=(compositionH*.5)/Math.tan(vfov/2),dh=(compositionW*.5)/Math.tan(hfov/2);
  const z=Math.max(190,Math.min(340,Math.max(dv,dh)*1.13+10));
  __pcCamera(__pcState.center.x,8,z,__pcState.center.x,9,5);renderer.render(scene,camera);rig.wake?.();return {x:rig.tx,y:rig.ty,z:rig.tz};
}
function __pcZoomBy(delta){
  if(__pcState.mode!=='author')return {x:rig.tx,y:rig.ty,z:rig.tz};
  const z=Math.max(__pcState.minZ,Math.min(__pcState.maxZ,(Number(rig.tz)||240)+delta));
  __pcCamera(Number(rig.tx)||__pcState.center.x,Number(rig.ty)||8,z,__pcState.center.x,9,5);renderer.render(scene,camera);rig.wake?.();return {x:rig.tx,y:rig.ty,z:rig.tz};
}
function __pcBuildHud(){
  if(document.getElementById('pearlCameraHud'))return;
  const d=document.createElement('div');d.id='pearlCameraHud';d.style.cssText='position:fixed;right:18px;bottom:18px;z-index:9999;display:flex;gap:6px;align-items:center;padding:6px;background:rgba(31,30,28,.76);border:1px solid rgba(255,255,255,.22);border-radius:999px;backdrop-filter:blur(12px);font:600 10px/1 Arial;color:#f6f3ed;letter-spacing:.08em';
  d.innerHTML='<button data-pcam="fit">FIT SCENE</button><button data-pcam="out">−</button><button data-pcam="in">＋</button><span>FREE CAMERA</span>';
  d.querySelectorAll('button').forEach(b=>b.style.cssText='border:0;border-radius:999px;background:rgba(255,255,255,.12);color:#fff;padding:7px 10px;cursor:pointer;font:700 9px Arial;letter-spacing:.08em');
  d.onclick=e=>{const a=e.target.closest('[data-pcam]')?.dataset.pcam;if(a==='fit')__pcFitScene();if(a==='out')__pcZoomBy(32);if(a==='in')__pcZoomBy(-32);};document.body.appendChild(d);
}
function __pcSetMode(mode){
  __pcState.mode=mode==='experience'?'experience':'author';__pcHideLegacy();__pcBuildHud();const h=document.getElementById('pearlCameraHud');if(h)h.style.display=__pcState.mode==='author'?'flex':'none';if(__pcState.mode==='author')__pcFitScene();return __pcState.mode;
}
function __pcApply(){
  __fashionState.enabled=true;__fClear();__pcBounds();
  scene.background=new THREE.Color(0xb8b5b0);scene.fog=new THREE.FogExp2(0xb8b5b0,.00115);
  __pcHideLegacy();__pcArchitecture();__pcLights();
  if(__pcState.mode==='author')__pcFitScene();else __pcCamera(__pcState.center.x,7,165,__pcState.center.x,9,5);
  __pcBuildHud();renderer.render(scene,camera);__pcState.applied=true;
  return __fashionApi.stats();
}
function __pcProgress(p){
  p=Math.max(0,Math.min(1,Number(p)||0));
  if(__pcState.mode!=='experience')return {progress:p,authorCamera:true,camera:{x:rig.tx,y:rig.ty,z:rig.tz}};
  const a=__pSmooth(0,.22,p),b=__pSmooth(.20,.52,p),c=__pSmooth(.50,.79,p),d=__pSmooth(.77,1,p),cx=__pcState.center.x;
  const x=cx+4*b-8*c+11*d,y=7-2*a+5*b-3*c+3*d,z=165-35*a-9*b+7*c+18*d;
  __pcCamera(x,y,z,cx+(4*b-3*c),10+4*b-2*c,6);
  const dress=__fashionState.group.getObjectByName('PEARL_COUTURE_HERO');if(dress){dress.rotation.y=-.10+.28*b-.20*c+.14*d;dress.rotation.z=.012*Math.sin(p*Math.PI*2);}
  const halo=__fashionState.group.getObjectByName('PEARL_PORTAL_HALO');if(halo){halo.rotation.z=.05+p*.24;}
  const copy=__fashionState.group.getObjectByName('PEARL_COPY_HERO');if(copy){copy.material.opacity=Math.max(.18,1-b*.70+c*.10);copy.material.transparent=true;}
  renderer.render(scene,camera);return {progress:p,camera:{x,y,z}};
}
__fashionApi.version='${VERSION}';
__fashionApi.apply=__pcApply;
__fashionApi.refresh=__pcApply;
__fashionApi.setProgress=__pcProgress;
__fashionApi.setAuthorMode=__pcSetMode;
__fashionApi.fitScene=__pcFitScene;
__fashionApi.zoomOut=()=>__pcZoomBy(32);
__fashionApi.zoomIn=()=>__pcZoomBy(-32);
__fashionApi.getAuthorState=()=>({mode:__pcState.mode,z:rig.tz,minZ:__pcState.minZ,maxZ:__pcState.maxZ,version:__pcState.version});
__fashionApi.setScene=function(id){if(id!=='pearl-runway')return {ok:false,reason:'Pearl Couture candidate locked to Scene 01',sceneId:'pearl-runway'};__fashionState.sceneId=id;__pcApply();return {ok:true,sceneId:id};};
__fashionApi.getState=()=>({sceneId:'pearl-runway',enabled:true,diagnostic:__fashionState.diagnostic,structure:false,shot:__fashionState.shot,version:'${VERSION}',mode:__pcState.mode});
document.addEventListener('wheel',e=>{if(__pcState.mode!=='author'||e.target.closest?.('#pearlCameraHud'))return;e.preventDefault();e.stopImmediatePropagation();__pcZoomBy(e.deltaY*.28);},{capture:true,passive:false});
const __pcObserver=new MutationObserver(()=>__pcHideLegacy());__pcObserver.observe(document.body,{childList:true,subtree:true});
__pcApply();
`;

window.patchFashionSceneBridge=function(source){
  let out=previous(source);
  const marker='window.CasebookPro={';
  if(!out.includes(marker))throw new Error('Pearl Couture V2: CasebookPro marker not found');
  if(out.includes('__CASEBOOK_PEARL_COUTURE_V2__'))return out;
  return out.replace(marker,runtime+'\n'+marker);
};
})();
