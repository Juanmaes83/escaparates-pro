// CASEBOOK PRO V3 — PEARL FASHION CINEMATIC LAYER
// Isolated to the Phase 3 Fashion clone. Wraps the existing Fashion bridge before iframe boot.
(function(){
'use strict';
const VERSION='3F.4-pearl-cinematic-alpha';
const base=window.patchFashionSceneBridge;
if(typeof base!=='function') throw new Error('Pearl Fashion: base Fashion bridge unavailable');

const pearlRuntime=String.raw`
function __pClamp(v,a=0,b=1){return Math.max(a,Math.min(b,v))}
function __pSmooth(a,b,t){t=__pClamp((t-a)/(b-a));return t*t*(3-2*t)}
function __pRoundedShape(w,h,r){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/2,h/2);
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function __pExtrudedPanel(w,h,r=.55,depth=.24,color=0xe7e4dc,rough=.72,metal=.02){
  const g=new THREE.ExtrudeGeometry(__pRoundedShape(w,h,r),{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.09,bevelThickness:.07,curveSegments:8});
  g.center();const m=new THREE.Mesh(g,__fMat(color,rough,metal));m.castShadow=true;m.receiveShadow=true;return m;
}
function __pGradientCyclorama(){
  const W=252,H=154,nx=34,ny=26,pos=[],col=[],idx=[];
  const c1=new THREE.Color(0xd8d5cf),c2=new THREE.Color(0xf1efe9),c3=new THREE.Color(0xc4c5c5);
  for(let iy=0;iy<=ny;iy++)for(let ix=0;ix<=nx;ix++){
    const u=ix/nx,v=iy/ny,x=(u-.5)*W,y=(v-.5)*H;
    const edge=Math.pow(Math.abs(u-.5)*2,1.6),floor=Math.max(0,.29-v);
    const z=-4.5 + 2.9*edge*edge + 3.2*floor*floor;
    pos.push(x,y,z);
    const cc=v<.48?c1.clone().lerp(c2,v/.48):c2.clone().lerp(c3,(v-.48)/.52);
    cc.multiplyScalar(.96-edge*.055);col.push(cc.r,cc.g,cc.b);
  }
  for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){
    const a=iy*(nx+1)+ix,b=a+1,c=a+(nx+1),d=c+1;idx.push(a,c,b,b,c,d);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,metalness:0,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;return mesh;
}
function __pRibbon(points,width=5,color=0xcac8c3,metal=.42,rough=.34,opacity=.96){
  const curve=new THREE.CatmullRomCurve3(points);const steps=72,verts=[],uv=[],idx=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps,p=curve.getPoint(t),tan=curve.getTangent(t).normalize();
    const n=new THREE.Vector3(-tan.y,tan.x,0).normalize().multiplyScalar(width*.5*(.82+.18*Math.sin(Math.PI*t)));
    verts.push(p.x+n.x,p.y+n.y,p.z+n.z,p.x-n.x,p.y-n.y,p.z-n.z);uv.push(t,0,t,1);
    if(i<steps){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const m=__fMat(color,rough,metal,{side:THREE.DoubleSide,transparent:opacity<1,opacity});const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function __pPearlArchitecture(){
  const g=__fashionState.group;scene.add(g);__fashionState.group.name='CASEBOOK_FASHION_PEARL_RUNWAY';
  const cyc=__pGradientCyclorama();g.add(cyc);
  // Broad satin runway with a shallow perspective cue; intentionally low contrast so shadows carry depth.
  const runway=__pExtrudedPanel(70,126,3.4,.34,0xd4d1ca,.64,.06);runway.position.set(0,-5,-2.38);g.add(runway);
  const inset=__pExtrudedPanel(30,118,2.2,.18,0xe9e6df,.48,.03);inset.position.set(0,-4.5,-2.02);g.add(inset);
  // Scenographic ribbons: one family, three scales. They establish flow instead of generic columns.
  const left=__pRibbon([new THREE.Vector3(-108,-49,-1.8),new THREE.Vector3(-93,-8,-.7),new THREE.Vector3(-103,38,-.1),new THREE.Vector3(-72,65,-.9)],9,0xbdbab3,.48,.31,.96);g.add(left);
  const right=__pRibbon([new THREE.Vector3(108,-54,-1.6),new THREE.Vector3(91,-13,-.5),new THREE.Vector3(103,31,-.2),new THREE.Vector3(70,63,-.8)],7.5,0xe7e4dd,.18,.42,.94);g.add(right);
  const sweep=__pRibbon([new THREE.Vector3(-54,58,-.8),new THREE.Vector3(-17,67,-.2),new THREE.Vector3(27,61,-.25),new THREE.Vector3(61,46,-.9)],4.2,0xd0d2d3,.62,.24,.93);g.add(sweep);
  // Hero halo: a crafted spatial device to frame product/talent, not decoration.
  const haloMat=__fMat(0xd7d5d0,.23,.78,{emissive:0xf3f0e7,emissiveIntensity:.045});
  const halo=new THREE.Mesh(new THREE.TorusGeometry(23,.48,20,128),haloMat);halo.position.set(0,10,-.62);halo.scale.y=1.28;halo.castShadow=true;g.add(halo);
  const halo2=new THREE.Mesh(new THREE.TorusGeometry(28,.13,12,128),__fMat(0xf2f0ea,.42,.24));halo2.position.set(0,10,-.9);halo2.scale.y=1.28;g.add(halo2);
  // Floating frosted scrims create foreground/midground depth and catch light during camera movement.
  const glass=new THREE.MeshPhysicalMaterial({color:0xf4f2ed,roughness:.26,metalness:0,transparent:true,opacity:.18,transmission:.38,thickness:.22,side:THREE.DoubleSide,depthWrite:false});
  const scrimL=new THREE.Mesh(new THREE.PlaneGeometry(38,72),glass.clone());scrimL.position.set(-60,3,.2);scrimL.rotation.z=-.055;g.add(scrimL);
  const scrimR=new THREE.Mesh(new THREE.PlaneGeometry(30,62),glass.clone());scrimR.position.set(62,-2,.35);scrimR.rotation.z=.045;g.add(scrimR);
  // A single brushed-metal plinth; ellipse reads as a designed stage rather than a generic box.
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(18,20,2.1,96),__fMat(0xb6b4af,.28,.68));plinth.rotation.x=Math.PI/2;plinth.position.set(0,-25,-.3);plinth.castShadow=true;plinth.receiveShadow=true;g.add(plinth);
  const title=__fTextPlane(['PEARL RUNWAY','FASHION SPATIAL EDITION'],46,10,'hero');title.position.set(-71,50,.1);g.add(title);
  const index=__fTextPlane(['AFTER DARK / FW26','SCENE 01  —  PEARL'],36,6,'label');index.position.set(68,-52,.18);g.add(index);
}
function __pPearlLights(){
  renderer.shadowMap.enabled=true;try{renderer.outputEncoding=THREE.sRGBEncoding}catch(_){ }
  if('ACESFilmicToneMapping' in THREE)renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=__fashionState.diagnostic ? .88 : 1.08;
  const add=(l,t)=>{scene.add(l);__fashionState.lights.push(l);if(t){scene.add(t);l.target=t;__fashionState.lights.push(t)}};
  const target=new THREE.Object3D();target.position.set(0,2,0);
  const key=new THREE.SpotLight(0xfff7eb,__fashionState.diagnostic?1.0:2.05,280,Math.PI*.24,.72,1.2);key.position.set(-72,72,76);key.castShadow=!__fashionState.diagnostic;key.shadow.mapSize.set(1536,1536);add(key,target);
  const softTarget=new THREE.Object3D();softTarget.position.set(8,-8,-1);
  const soft=new THREE.SpotLight(0xdde4ea,__fashionState.diagnostic ? .5 : 1.05,260,Math.PI*.30,.9,1.5);soft.position.set(88,22,62);add(soft,softTarget);
  const grazeTarget=new THREE.Object3D();grazeTarget.position.set(-5,14,0);
  const graze=new THREE.SpotLight(0xf4e7d2,__fashionState.diagnostic ? .4 : .95,240,Math.PI*.18,.65,1.8);graze.position.set(-108,-20,42);add(graze,grazeTarget);
  const fill=new THREE.HemisphereLight(0xf6f2eb,0x8f9294,__fashionState.diagnostic ? .42 : .72);scene.add(fill);__fashionState.lights.push(fill);
}
function __pPearlDecorateItem(it,index){
  if(!it?.grp||__fashionState.decorByItem.has(it))return;
  const b=__fBounds(it.grp),w=Math.min(43,Math.max(13,b.w+2.5)),h=Math.min(39,Math.max(10,b.h+2.4));
  const type=__fSemanticType(it,index);if(!it.pro)it.pro={};it.pro.fashionType=type;
  const g=new THREE.Group();g.name='PEARL_OBJECT_'+String(it.id||index);g.userData={fashionOwned:true,semanticType:type};
  // Real editorial mount: rounded extruded pearl board + shadow gap + brushed registration rail.
  const mount=__pExtrudedPanel(w,h,.65,.28,type==='material'?0xd1cbc1:0xeeeae2,type==='material' ? .76 : .62,type==='material' ? .02 : .06);mount.position.z=-.38;g.add(mount);
  const shadow=__pExtrudedPanel(w*.96,h*.95,.5,.08,0x8f8c87,.92,0);shadow.position.set(.55,-.58,-.62);shadow.material.transparent=true;shadow.material.opacity=.24;g.add(shadow);
  const rail=__pExtrudedPanel(.42,h*.78,.2,.18,index%5===0?0x8d1021:0xa9a8a4,.36,index%5===0 ? .16 : .66);rail.position.set(-w/2-.58,0,.1);g.add(rail);
  const label=__fTextPlane([String(index+1).padStart(2,'0')+' / '+type,String(it.title||it.name||'UNTITLED').slice(0,28)],Math.min(w,25),3.8,'label');label.position.set(-Math.max(0,w/2-12),-h/2-2.15,.34);g.add(label);
  g.position.z=.34+(index%4)*.16;g.rotation.z=(index%3-1)*.006;it.grp.add(g);__fashionState.decorByItem.set(it,g);
  it.grp.traverse(n=>{if(n.material&&!n.userData?.fashionOwned){const mats=Array.isArray(n.material)?n.material:[n.material];mats.forEach(m=>{if(m.userData.__fashionOriginalOpacity==null){m.userData.__fashionOriginalOpacity=m.opacity;m.userData.__fashionOriginalTransparent=m.transparent}if('roughness' in m)m.roughness=Math.max(.48,Math.min(.82,m.roughness??.58));if('metalness' in m)m.metalness=Math.min(.14,m.metalness??0);if('emissiveIntensity' in m)m.emissiveIntensity=Math.min(.05,m.emissiveIntensity??0)})}});
}
function __pPearlRelationships(){
  ropes.forEach((r,i)=>{if(!r.meta)r.meta={};if(!r.meta.smart)r.meta.smart={};r.meta.smart.fashionType=r.meta.smart.fashionType||RELATION_TYPES[i%RELATION_TYPES.length];r.meta.smart.style='minimal';r.meta.smart.width=.45;r.meta.smart.animated=false;try{r.color=i%7===0?0x8d1021:0xa9a8a3;r.thick=.028}catch(_){}});
}
function __pPearlSurface(){
  __fRemember();scene.background=new THREE.Color(__fashionState.diagnostic?0xbab8b4:0xd9d6d0);scene.fog=__fashionState.diagnostic?null:new THREE.FogExp2(0xd6d3cd,.0028);
  if(typeof __surface!=='undefined'){if(__surface.board)__surface.board.visible=false;if(__surface.boardMedia)__surface.boardMedia.visible=false;if(__surface.wall)__surface.wall.visible=false;}
}
function __pPearlApply(){__fashionState.enabled=true;__fClear();__pPearlSurface();__pPearlArchitecture();__pPearlLights();items.forEach(__pPearlDecorateItem);__pPearlRelationships();__fashionState.structure&&__fSetStructure(true);}
function __pPearlProgress(p){
  p=__pClamp(Number(p)||0);__fashionState.pearlProgress=p;
  const a=__pSmooth(0,.18,p),b=__pSmooth(.18,.48,p),c=__pSmooth(.48,.78,p),d=__pSmooth(.78,1,p);
  // Cinematic camera choreography: arrival → hero → craft/detail → portal/exit.
  rig.tx=(-21*(1-a)) + (-5*a) + 7*b - 4*c + 18*d;
  rig.ty=6*(1-a) + 1.2*a + 4*b - 3*c + 5*d;
  rig.tz=Z_HOME*(1.28-.46*a-.16*b+.12*c+.33*d);
  const halo=__fashionState.group.children.find(o=>o.geometry?.type==='TorusGeometry');if(halo){halo.rotation.z=p*.22;halo.scale.set(1+Math.sin(p*Math.PI)*.045,1.28+Math.sin(p*Math.PI)*.055,1);}
  // Scenography breathes subtly; no theme-park motion.
  __fashionState.group.children.forEach((o,i)=>{if(o.name?.startsWith('PEARL_OBJECT'))return;if(o.material?.transparent)o.material.opacity=Math.max(.08,Math.min(.28,.12+.12*Math.sin((p+i*.07)*Math.PI)))});
  return {progress:p,camera:{x:rig.tx,y:rig.ty,z:rig.tz}};
}
`;

function replaceFn(source,name,nextName){
  const rx=new RegExp('function '+name+'\\([^]*?(?=\\nfunction |\\nconst __fashionApi)','m');
  const m=source.match(rx);if(!m)throw new Error('Pearl Fashion: cannot locate '+name);
  return source.replace(m[0],'function '+name+'(){return '+nextName+'(...arguments)}\n');
}

window.patchFashionSceneBridge=function(source){
  let out=base(source);
  out=out.replace("sceneId:'black-runway'","sceneId:'pearl-runway'")
         .replace("palette:{void:0x030303,black:0x090909,paper:0xedeae2,silver:0x999999,acid:0xe8ff3f}","palette:{void:0xd9d6d0,black:0x171717,paper:0xf1efe9,silver:0xb7b7b4,acid:0x8d1021}")
         .replace("__fashionState.group.name='CASEBOOK_FASHION_BLACK_RUNWAY'","__fashionState.group.name='CASEBOOK_FASHION_PEARL_RUNWAY'");
  const injectionPoint='function __fDisposeObject(o){';
  if(!out.includes(injectionPoint))throw new Error('Pearl Fashion: runtime injection point missing');
  out=out.replace(injectionPoint,pearlRuntime+'\n'+injectionPoint);
  out=replaceFn(out,'__fRunwayArchitecture','__pPearlArchitecture');
  out=replaceFn(out,'__fLights','__pPearlLights');
  out=replaceFn(out,'__fDecorateItem','__pPearlDecorateItem');
  out=replaceFn(out,'__fRelationships','__pPearlRelationships');
  out=replaceFn(out,'__fSurface','__pPearlSurface');
  out=out.replace('function __fApply(){return __pPearlApply(...arguments)}','function __fApply(){return __pPearlApply(...arguments)}');
  out=out.replace("if(id!=='black-runway')return {ok:false,reason:'Scene family intentionally locked until Black Runway approval',sceneId:__fashionState.sceneId};","if(id!=='pearl-runway')return {ok:false,reason:'Scene family intentionally locked until Pearl Runway approval',sceneId:__fashionState.sceneId};");
  out=out.replace("stats:__fStats,refresh:","stats:__fStats,setProgress:__pPearlProgress,refresh:");
  return out;
};

function hostApi(){try{return window.__CasebookV3Host?.api?.()||null}catch(_){return null}}
function renameUi(){
  document.body.classList.add('v3-fashion-pearl');
  document.querySelectorAll('.flSceneBtn').forEach((b,i)=>{if(i===0){b.dataset.flScene='pearl-runway';const t=b.querySelector('b'),s=b.querySelector('small');if(t)t.textContent='Pearl Runway';if(s)s.textContent='Pearl cyclorama / couture spatial scene';b.classList.add('active')}});
  const bottom=document.querySelector('.esBottomLeft');if(bottom)bottom.dataset.pearl='PEARL RUNWAY';
  const q=document.querySelector('#flQuality');if(q)q.innerHTML='<b>PEARL RUNWAY / QUALITY GATE</b><br>Shadow, depth, material response and cinematography carry the scene. No decorative noise.';
  const starter=document.querySelector('#flStarter');if(starter)starter.textContent='Reload Pearl Fashion Starter';
}
function bindCinematic(){
  const stage=document.querySelector('.stage');if(!stage||stage.dataset.pearlDirector)return;stage.dataset.pearlDirector='1';
  let p=.06,target=.06,raf=0;
  const tick=()=>{p+=(target-p)*.085;hostApi()?.fashion?.setProgress?.(p);raf=requestAnimationFrame(tick)};tick();
  stage.addEventListener('wheel',e=>{if(!document.body.classList.contains('v3-fashion-pearl'))return;target=Math.max(0,Math.min(1,target+e.deltaY*.00055));},{passive:true});
  window.CasebookPearlDirector={version:VERSION,get progress(){return p},setProgress(v){target=Math.max(0,Math.min(1,Number(v)||0));return target},destroy(){cancelAnimationFrame(raf)}};
}
const obs=new MutationObserver(()=>{renameUi();bindCinematic()});
function boot(){renameUi();bindCinematic();obs.observe(document.documentElement,{subtree:true,childList:true});setInterval(()=>{renameUi();bindCinematic()},800);window.CasebookFashionPearl={version:VERSION};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();