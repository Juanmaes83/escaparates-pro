// CASEBOOK PRO V3 — PEARL COUTURE V2
// Additive/reversible scene-composer layer. Fashion clone only.
(function(){
'use strict';
const VERSION='3F.5-pearl-couture-candidate';
const previous=window.patchFashionSceneBridge;
if(typeof previous!=='function') throw new Error('Pearl Couture V2: Pearl bridge unavailable');

const runtime=String.raw`
/* __CASEBOOK_PEARL_COUTURE_V2__ */
const __pcState={version:'${VERSION}',center:new THREE.Vector3(-6,4,5),size:new THREE.Vector3(104,56,8),legacyLights:[],applied:false};
function __pcBounds(){
  const b=new THREE.Box3();let any=false;
  items.forEach(it=>{if(it&&it.grp){it.grp.updateWorldMatrix(true,true);b.expandByObject(it.grp);any=true;}});
  if(any&&!b.isEmpty()){b.getCenter(__pcState.center);b.getSize(__pcState.size);}
  return {center:__pcState.center.clone(),size:__pcState.size.clone()};
}
function __pcHideLegacy(){
  items.forEach(it=>{if(!it?.grp)return;if(it.grp.userData.__pcVisible==null)it.grp.userData.__pcVisible=it.grp.visible;it.grp.visible=false;});
  ropes.forEach(r=>{try{if(!r.meta)r.meta={};if(!r.meta.smart)r.meta.smart={};r.meta.smart.style='physical';r.meta.smart.direction='none';r.meta.smart.animated=false;r.__v2FocusFactor=0;r.opacity=0;if(r.mat){r.mat.transparent=true;r.mat.opacity=0;}}catch(_){}});
  if(typeof __surface!=='undefined'){if(__surface.board)__surface.board.visible=false;if(__surface.boardMedia)__surface.boardMedia.visible=false;if(__surface.wall)__surface.wall.visible=false;}
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
  const mat=new THREE.MeshPhysicalMaterial({color:0xd8d0c5,roughness:.46,metalness:.015,clearcoat:.10,clearcoatRoughness:.62,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,mat);mesh.name='PEARL_COUTURE_HERO';mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function __pcArchitecture(){
  const g=__fashionState.group;g.name='CASEBOOK_FASHION_PEARL_COUTURE_V2';scene.add(g);
  const cyc=__pGradientCyclorama();cyc.material.roughness=.98;g.add(cyc);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(84,160),__fMat(0xb8b4ae,.61,.06));floor.scale.y=.47;floor.position.set(__pcState.center.x,-19,-1.15);floor.receiveShadow=true;g.add(floor);
  const inner=new THREE.Mesh(new THREE.CircleGeometry(47,144),__fMat(0xd1cdc6,.42,.10));inner.scale.y=.34;inner.position.set(__pcState.center.x,-14,-.76);inner.receiveShadow=true;g.add(inner);

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
  const title=__fTextPlane(['AFTER DARK / FW26','PEARL COUTURE STUDY'],48,9.5,'hero');title.name='PEARL_COPY_HERO';title.position.set(-61,49,8.2);g.add(title);
  const look=__fTextPlane(['01 / SILHOUETTE',names[0]||'LOOK 01'],28,5.2,'label');look.position.set(39,34,7.8);g.add(look);
  const material=__fTextPlane(['02 / MATERIAL',names[1]||'PEARL SATIN'],27,5,'label');material.position.set(40,-31,7.7);g.add(material);
  const index=__fTextPlane(['CASEBOOK PRO V3 / FASHION','SCENE 01 — PEARL RUNWAY'],34,5.4,'label');index.position.set(-50,-43,7.5);g.add(index);

  const burgundy=new THREE.Mesh(new THREE.CylinderGeometry(2.9,2.9,.72,72),__fMat(0x6f1723,.34,.26));burgundy.rotation.x=Math.PI/2;burgundy.position.set(41,-22,7.2);burgundy.castShadow=true;g.add(burgundy);
  const chrome=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,18,72),__fMat(0x969590,.17,.88));chrome.position.set(46,-5,6.9);chrome.castShadow=true;g.add(chrome);
}
function __pcLights(){
  renderer.shadowMap.enabled=true;if('ACESFilmicToneMapping' in THREE)renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
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
function __pcApply(){
  __fashionState.enabled=true;__fClear();__pcBounds();
  scene.background=new THREE.Color(0xc5c1bb);scene.fog=new THREE.FogExp2(0xc5c1bb,.0013);
  __pcHideLegacy();__pcArchitecture();__pcLights();__pcCamera(__pcState.center.x,6,132,__pcState.center.x,10,5);renderer.render(scene,camera);__pcState.applied=true;
  return __fashionApi.stats();
}
function __pcProgress(p){
  p=Math.max(0,Math.min(1,Number(p)||0));const a=__pSmooth(0,.22,p),b=__pSmooth(.20,.52,p),c=__pSmooth(.50,.79,p),d=__pSmooth(.77,1,p),cx=__pcState.center.x;
  const x=cx+7*b-11*c+16*d,y=6-3*a+7*b-5*c+4*d,z=132-34*a-17*b+15*c+20*d;
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
__fashionApi.setScene=function(id){if(id!=='pearl-runway')return {ok:false,reason:'Pearl Couture candidate locked to Scene 01',sceneId:'pearl-runway'};__fashionState.sceneId=id;__pcApply();return {ok:true,sceneId:id};};
__fashionApi.getState=()=>({sceneId:'pearl-runway',enabled:true,diagnostic:__fashionState.diagnostic,structure:false,shot:__fashionState.shot,version:'${VERSION}'});
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
