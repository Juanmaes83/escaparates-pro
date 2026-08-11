import * as THREE from "https://esm.sh/three@0.172.0";
import { OrbitControls } from "https://esm.sh/three@0.172.0/examples/jsm/controls/OrbitControls.js";
import * as CameraUtils from "https://esm.sh/three@0.172.0/examples/jsm/utils/CameraUtils.js";
import { gsap, Power4 } from "https://esm.sh/gsap@3.12.5";
import { EventEmitter } from "https://esm.sh/events";

// Fidelity rule: the portal/camera/world-swap mechanics below intentionally track
// Karim Maaloul's Infinite Portals reference. The major change is art direction:
// a polluted blue-grey city versus a lush living natural world.
const FILES = { noiseFile: "https://assets.codepen.io/264161/noise_1.jpg" };
const ASSETS = {};

const COLORS = {
  citySky: 0x23313c, cityFog: 0x44535d, concrete: 0x5b6267, asphalt: 0x252b30,
  steel: 0x74808a, window: 0x223746, smog: 0x7e878b,
  natureSky: 0xa9d9ff, natureFog: 0xc8ead8, grass: 0x5d9b4d, darkGrass: 0x2f6837,
  leaf: 0x4c8d3e, leafLight: 0x79b95b, bark: 0x755039, rock: 0x87917d, water: 0x4ba7c7,
  flowerA: 0xf0c84b, flowerB: 0xd77cae, flowerC: 0xf5eee0
};

function mat(color, roughness=.72, metalness=.05){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function addMesh(parent, geometry, material, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1], name=""){
  const mesh=new THREE.Mesh(geometry,material); mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.scale.set(...scale); if(name)mesh.name=name; parent.add(mesh); return mesh;
}
function rand(a,b){return a+Math.random()*(b-a)}

function makeWindowFrame(holder, city=true){
  const frameMat=mat(city?0x343a40:0x746f5c,.9,.08);
  const stone=mat(city?0x4a5054:0x7f8067,.95,.02);
  const w=12.4,h=16.2,t=.62;
  addMesh(holder,new THREE.BoxGeometry(w+t,t,1.2),frameMat,[0,h/2,0]);
  addMesh(holder,new THREE.BoxGeometry(w+t,t,1.2),frameMat,[0,-h/2,0]);
  addMesh(holder,new THREE.BoxGeometry(t,h,1.2),frameMat,[-w/2,0,0]);
  addMesh(holder,new THREE.BoxGeometry(t,h,1.2),frameMat,[w/2,0,0]);
  if(city){
    addMesh(holder,new THREE.BoxGeometry(17,1.2,3.2),stone,[0,-8.6,-.8]);
    addMesh(holder,new THREE.BoxGeometry(17,1.1,2.8),stone,[0,8.6,-.8]);
  } else {
    for(let i=0;i<16;i++){
      const side=i<8?-1:1, y=-7+i%8*2;
      addMesh(holder,new THREE.IcosahedronGeometry(rand(.65,1.15),1),stone,[side*(6.4+rand(-.35,.35)),y,rand(-.7,.2)],[rand(-.4,.4),rand(-.5,.5),0],[1,rand(.7,1.4),1]);
    }
    for(let i=0;i<9;i++) addMesh(holder,new THREE.IcosahedronGeometry(rand(.65,1.25),1),stone,[-5.3+i*1.3,8.2+Math.sin(i)*.5,rand(-.7,.15)]);
  }
}

function createPortalRig(holder, scene, city){
  const portal = addMesh(holder,new THREE.PlaneGeometry(11.5,15.2),new THREE.MeshBasicMaterial({color:0x000000}),[0,0,0], [0,0,0],[1,1,1],"portal");
  portal.geometry.computeBoundingBox();
  makeWindowFrame(holder,city);

  const start=new THREE.Object3D(); start.name="portalWorldStart"; start.position.set(0,0,-9); start.scale.set(.78,.78,.78); scene.add(start);
  const end=new THREE.Object3D(); end.name="portalWorldEnd"; end.position.set(0,0,0); end.scale.set(1,1,1); scene.add(end);
  return portal;
}

function cityScene(){
  const scene=new THREE.Scene(); scene.name="The Grey City"; scene.background=new THREE.Color(COLORS.citySky); scene.fog=new THREE.FogExp2(COLORS.cityFog,.018);
  const holder=new THREE.Group(); holder.name="holder"; scene.add(holder);
  scene.add(new THREE.HemisphereLight(0x879aaa,0x25292c,1.25));
  const sun=new THREE.DirectionalLight(0xa8bdc7,2.1); sun.position.set(-9,18,14); scene.add(sun);
  const roadMat=mat(COLORS.asphalt,.97,.02), concrete=mat(COLORS.concrete,.9,.02), buildingMats=[mat(0x515a61,.82,.08),mat(0x3f4a52,.78,.12),mat(0x697278,.9,.03),mat(0x343f47,.83,.14)];
  addMesh(holder,new THREE.PlaneGeometry(180,180),roadMat,[0,-8,-24],[-Math.PI/2,0,0]);
  addMesh(holder,new THREE.PlaneGeometry(17,115),mat(0x1c2226,.98),[0,-7.96,-40],[-Math.PI/2,0,0]);
  const lineMat=new THREE.MeshBasicMaterial({color:0xb3a86f});
  for(let z=-84;z<22;z+=11){addMesh(holder,new THREE.PlaneGeometry(.18,5),lineMat,[-2.5,-7.9,z],[-Math.PI/2,0,0]);addMesh(holder,new THREE.PlaneGeometry(.18,5),lineMat,[2.5,-7.9,z],[-Math.PI/2,0,0]);}

  const windowMat=new THREE.MeshBasicMaterial({color:0x8da7b3,transparent:true,opacity:.43});
  for(const side of [-1,1]){
    for(let row=0;row<9;row++){
      const z=14-row*13+rand(-2,2), width=rand(8,15), depth=rand(8,14), height=rand(18,48), x=side*(14+rand(0,8));
      addMesh(holder,new THREE.BoxGeometry(width,height,depth),buildingMats[row%buildingMats.length],[x,-8+height/2,z]);
      if(row<6){
        for(let wy=-5;wy<height-5;wy+=4.2) for(let wx=-width*.32;wx<=width*.32;wx+=3.2){
          const frontZ=z+depth/2+.03; addMesh(holder,new THREE.PlaneGeometry(1.1,1.4),windowMat,[x+wx,-6+wy,frontZ]);
        }
      }
      if(row%3===0){addMesh(holder,new THREE.BoxGeometry(width*.25,1.2,depth*.4),mat(0x2f3539,.75,.3),[x,-8+height+.6,z]);}
    }
  }
  addMesh(holder,new THREE.BoxGeometry(23,22,2.6),concrete,[0,0,-1.5]);
  createPortalRig(holder,scene,true);

  const cars=[];
  for(let i=0;i<18;i++){
    const lane=i%2===0?-4.2:4.2, z=rand(-90,28), car=new THREE.Group();
    addMesh(car,new THREE.BoxGeometry(2.1,.75,4.2),mat(i%3===0?0x252a2e:i%3===1?0x676d71:0x8a8d8f,.55,.25),[0,0,0]);
    const lightColor=i%2===0?0xffe6b4:0xe84b3c; addMesh(car,new THREE.BoxGeometry(1.4,.16,.05),new THREE.MeshBasicMaterial({color:lightColor}),[0,.05,i%2===0?2.13:-2.13]);
    car.position.set(lane,-7.2,z); holder.add(car); cars.push({obj:car,speed:rand(5,10)*(i%2===0?1:-1)});
  }
  for(const side of [-1,1]) for(let z=-75;z<25;z+=14){
    addMesh(holder,new THREE.CylinderGeometry(.12,.16,6,8),mat(COLORS.steel,.55,.45),[side*7.8,-5,z]);
    const lamp=addMesh(holder,new THREE.SphereGeometry(.22,10,8),new THREE.MeshBasicMaterial({color:0xffd89a}),[side*7.8,-2,z]);
    const p=new THREE.PointLight(0xffc26d,.65,8,2); p.position.copy(lamp.position); holder.add(p);
  }
  const smog=[]; const smokeMat=new THREE.MeshBasicMaterial({color:COLORS.smog,transparent:true,opacity:.08,depthWrite:false});
  for(let i=0;i<28;i++){const s=addMesh(holder,new THREE.SphereGeometry(rand(2.5,6),12,8),smokeMat.clone(),[rand(-35,35),rand(-2,22),rand(-80,18)],[0,0,0],[rand(1.5,3),rand(.6,1.2),rand(1.5,3)]); smog.push({obj:s,phase:rand(0,Math.PI*2),speed:rand(.08,.18)});}

  scene.userData.update=(dt,t)=>{
    cars.forEach(c=>{c.obj.position.z+=c.speed*dt;if(c.speed>0&&c.obj.position.z>34)c.obj.position.z=-92;if(c.speed<0&&c.obj.position.z<-94)c.obj.position.z=32;});
    smog.forEach(s=>{s.obj.position.x+=s.speed*dt;s.obj.position.y+=Math.sin(t*.2+s.phase)*.003;if(s.obj.position.x>40)s.obj.position.x=-40;});
  };
  return scene;
}

function makeTree(parent,x,z,s=1,leafColor=COLORS.leaf){
  addMesh(parent,new THREE.CylinderGeometry(.32*s,.5*s,4.2*s,9),mat(COLORS.bark,.95),[x,-5.9+2.1*s,z]);
  const crownMat=mat(leafColor,.88,.01); for(let i=0;i<4;i++) addMesh(parent,new THREE.IcosahedronGeometry((1.7-i*.12)*s,2),crownMat,[x+rand(-.7,.7)*s,-3.1*s+i*.75*s,z+rand(-.55,.55)*s],[0,rand(-1,1),0],[1,rand(.85,1.2),1]);
}

function natureScene(){
  const scene=new THREE.Scene(); scene.name="The Living Valley"; scene.background=new THREE.Color(COLORS.natureSky); scene.fog=new THREE.FogExp2(COLORS.natureFog,.009);
  const holder=new THREE.Group(); holder.name="holder"; scene.add(holder);
  scene.add(new THREE.HemisphereLight(0xdff5ff,0x4f7038,2.2));
  const sun=new THREE.DirectionalLight(0xfff2c9,3.3); sun.position.set(-12,25,18); scene.add(sun);
  const grass=mat(COLORS.grass,.98), darkGrass=mat(COLORS.darkGrass,.96), rock=mat(COLORS.rock,.94);
  addMesh(holder,new THREE.PlaneGeometry(180,180),grass,[0,-8,-24],[-Math.PI/2,0,0]);
  for(const side of [-1,1]) for(let i=0;i<9;i++){
    const x=side*(14+i*7+rand(-2,2)), z=rand(-72,18), s=rand(6,14);
    addMesh(holder,new THREE.IcosahedronGeometry(s,2),i%2?darkGrass:grass,[x,-8+s*.45,z],[rand(-.15,.15),rand(-1,1),0],[1.45,.55,1]);
  }
  const waterMat=new THREE.MeshPhysicalMaterial({color:COLORS.water,roughness:.18,metalness:.05,transmission:.12,transparent:true,opacity:.88});
  const river=addMesh(holder,new THREE.PlaneGeometry(12,125,1,20),waterMat,[0,-7.78,-39],[-Math.PI/2,0,0]);
  for(const side of [-1,1]) for(let z=-82;z<24;z+=7) addMesh(holder,new THREE.IcosahedronGeometry(rand(.45,1.5),1),rock,[side*rand(5.8,8),-7.1,z+rand(-2,2)],[rand(-1,1),rand(-1,1),0]);

  for(let i=0;i<72;i++){
    const side=i%2===0?-1:1, x=side*rand(8,34), z=rand(-78,24), s=rand(.6,1.45);
    makeTree(holder,x,z,s,i%3===0?COLORS.leafLight:COLORS.leaf);
  }
  const flowerColors=[COLORS.flowerA,COLORS.flowerB,COLORS.flowerC];
  for(let i=0;i<180;i++){
    const side=i%2===0?-1:1, x=side*rand(7.2,21), z=rand(-70,20), stemH=rand(.22,.65);
    addMesh(holder,new THREE.CylinderGeometry(.025,.035,stemH,5),mat(0x3f7b37,.9),[x,-8+stemH/2,z]);
    addMesh(holder,new THREE.SphereGeometry(rand(.08,.15),6,5),new THREE.MeshBasicMaterial({color:flowerColors[i%3]}),[x,-8+stemH,z]);
  }
  createPortalRig(holder,scene,false);

  const falls=new THREE.MeshBasicMaterial({color:0xc7eff8,transparent:true,opacity:.76,depthWrite:false});
  addMesh(holder,new THREE.PlaneGeometry(5,14),falls,[0,3,-58]);
  addMesh(holder,new THREE.IcosahedronGeometry(12,2),rock,[0,0,-65],[0,0,0],[1.8,1.2,1]);

  const birds=[]; const birdMat=new THREE.MeshBasicMaterial({color:0x22362b,side:THREE.DoubleSide});
  for(let i=0;i<14;i++){const b=new THREE.Group();addMesh(b,new THREE.ConeGeometry(.16,.45,3),birdMat,[0,0,0],[Math.PI/2,0,0]);b.position.set(rand(-16,16),rand(4,14),rand(-55,-5));holder.add(b);birds.push({obj:b,r:rand(5,16),phase:rand(0,Math.PI*2),speed:rand(.18,.42)});}
  const fireflyCount=160, geo=new THREE.BufferGeometry(), pos=new Float32Array(fireflyCount*3);for(let i=0;i<fireflyCount;i++){pos[i*3]=rand(-24,24);pos[i*3+1]=rand(-6,8);pos[i*3+2]=rand(-60,14);}geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const points=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffef9a,size:.12,transparent:true,opacity:.68,depthWrite:false}));holder.add(points);

  scene.userData.update=(dt,t)=>{
    river.material.color.offsetHSL(Math.sin(t*.55)*.0002,0,0);
    birds.forEach((b,i)=>{const a=t*b.speed+b.phase;b.obj.position.x=Math.cos(a)*b.r;b.obj.position.z=-22+Math.sin(a)*b.r*1.5;b.obj.position.y=5+Math.sin(a*2+i)*2;b.obj.rotation.z=Math.sin(a*3)*.2;});
    points.rotation.y=t*.008; points.material.opacity=.55+Math.sin(t*1.7)*.13;
  };
  return scene;
}

document.addEventListener("DOMContentLoaded",()=>new App());

class App {
  constructor(){
    this.winWidth=window.innerWidth; this.winHeight=window.innerHeight; this.raycaster=new THREE.Raycaster(); this.mouse=new THREE.Vector2(); this.clock=new THREE.Clock(); this.time=0; this.deltaTime=0; this.isInTransition=false; this.portalHover=false; this.loadAssets();
  }
  async loadAssets(){ASSETS.noiseMap=await this.loadTexture(FILES.noiseFile);this.initApp();}
  loadTexture(file){const loader=new THREE.TextureLoader();return new Promise((resolve,reject)=>loader.load(file,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;resolve(t);},undefined,reject));}
  initApp(){this.createWorlds();this.createRenderer();this.createControls();this.createListeners();this.onWindowResize();document.getElementById('loading').classList.add('done');this.loop();}
  createWorlds(){
    this.cityWorld=new World(cityScene(),"city"); this.natureWorld=new World(natureScene(),"nature");
    this.cityWorld.addListener("moveToPortalComplete",()=>this.onMoveToPortalComplete()); this.natureWorld.addListener("moveToPortalComplete",()=>this.onMoveToPortalComplete());
    this.cityWorld.addListener("moveToOriginComplete",()=>this.onMoveToOriginComplete()); this.natureWorld.addListener("moveToOriginComplete",()=>this.onMoveToOriginComplete());
    this.currentWorld=this.cityWorld; this.otherWorld=this.natureWorld;
    this.natureWorld.setTransitionTransforms(this.cityWorld.portalWorldStart,this.cityWorld.portalWorldEnd);
    this.cityWorld.setTransitionTransforms(this.natureWorld.portalWorldStart,this.natureWorld.portalWorldEnd);
    this.otherWorld.placeToStart(); this.currentWorld.reset(); this.updateHud();
  }
  switchWorlds(){const w=this.otherWorld;this.otherWorld=this.currentWorld;this.currentWorld=w;this.otherWorld.placeToStart();this.currentWorld.reset();this.onWindowResize();this.updateHud();}
  moveCameraToPortal(){this.isInTransition=true;this.controls.enabled=false;document.getElementById('portalHint').classList.remove('show');this.currentWorld.moveCameraToPortal();this.otherWorld.moveWorldToEnd();}
  onMoveToPortalComplete(){this.switchWorlds();this.currentWorld.moveWorldAndCameraToOrigin();}
  onMoveToOriginComplete(){this.controls.object=this.currentWorld.camera;this.controls.target=this.currentWorld.cameraTarget.position;this.isInTransition=false;this.controls.enabled=true;}
  createRenderer(){const canvas=document.querySelector('canvas.webgl');this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(window.devicePixelRatio);this.renderer.setSize(window.innerWidth,window.innerHeight);this.renderer.toneMapping=THREE.CineonToneMapping;this.renderer.toneMappingExposure=1.15;this.renderer.localClippingEnabled=true;this.renderer.outputColorSpace=THREE.SRGBColorSpace;}
  createControls(){this.controls=new OrbitControls(this.currentWorld.camera,this.renderer.domElement);this.controls.minDistance=0;this.controls.maxDistance=50;this.controls.maxPolarAngle=Math.PI/2+.1;this.controls.enableDamping=true;this.controls.dampingFactor=.045;this.controls.target=this.currentWorld.cameraTarget.position;this.controls.enabled=true;}
  createListeners(){window.addEventListener('resize',this.onWindowResize.bind(this));document.addEventListener('mousemove',this.onMouseMove.bind(this),false);document.addEventListener('touchmove',this.onTouchMove.bind(this),{passive:false});document.addEventListener('mousedown',this.onMouseDown.bind(this),false);}
  loop(){this.deltaTime=this.clock.getDelta();this.time+=this.deltaTime;this.currentWorld.portal.loop(this.deltaTime);this.currentWorld.update(this.deltaTime,this.time);this.otherWorld.update(this.deltaTime,this.time);this.render();if(this.controls&&this.controls.enabled)this.controls.update();this.syncCameras();window.requestAnimationFrame(this.loop.bind(this));}
  render(){this.currentWorld.portal.updateCorners();const{bottomLeft,bottomRight,topLeft}=this.currentWorld.portal.corners;CameraUtils.frameCorners(this.otherWorld.camera,bottomLeft,bottomRight,topLeft,false);const currentRenderTarget=this.renderer.getRenderTarget();this.renderer.setRenderTarget(this.currentWorld.portal.renderTarget);this.renderer.render(this.otherWorld.scene,this.otherWorld.camera);this.renderer.setRenderTarget(currentRenderTarget);this.renderer.render(this.currentWorld.scene,this.currentWorld.camera);}
  syncCameras(){this.otherWorld.camera.position.copy(this.currentWorld.camera.position);this.otherWorld.camera.quaternion.copy(this.currentWorld.camera.quaternion);this.otherWorld.cameraTarget.position.copy(this.currentWorld.cameraTarget.position);}
  raycast(){this.raycaster.setFromCamera(this.mouse,this.currentWorld.camera);const intersects=this.raycaster.intersectObjects([this.currentWorld.portalPlane]);if(intersects.length>0){this.currentWorld.portal.effectMultiplier=2;this.portalHover=true;document.getElementById('portalHint').classList.add('show');}else{this.currentWorld.portal.effectMultiplier=1;this.portalHover=false;document.getElementById('portalHint').classList.remove('show');}}
  onWindowResize(){this.winWidth=window.innerWidth;this.winHeight=window.innerHeight;this.renderer.setSize(this.winWidth,this.winHeight);this.currentWorld.camera.aspect=this.winWidth/this.winHeight;this.currentWorld.camera.updateProjectionMatrix();}
  onMouseDown(){if(this.portalHover&&!this.isInTransition)this.moveCameraToPortal();}
  onMouseMove(event){const x=event.clientX/this.winWidth*2-1;const y=-(event.clientY/this.winHeight*2-1);this.updateMouse(x,y);this.raycast();}
  onTouchMove(event){if(event.touches.length===1){event.preventDefault();const x=event.touches[0].pageX/this.winWidth*2-1;const y=-(event.touches[0].pageY/this.winHeight*2-1);this.updateMouse(x,y);this.raycast();}}
  updateMouse(x,y){this.mouse.x=x;this.mouse.y=y;}
  updateHud(){const el=document.getElementById('worldName');const chip=document.querySelector('.world-chip');if(this.currentWorld.name==='nature'){el.textContent='THE LIVING VALLEY';chip.classList.add('nature');}else{el.textContent='THE GREY CITY';chip.classList.remove('nature');}}
}

class World extends EventEmitter {
  constructor(scene,name){super();this.scene=scene;this.name=name;this.camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,.1,150);this.camera.position.set(0,0,40);this.scene.add(this.camera);this.transitionDuration=1.5;this.processModel();}
  processModel(){this.holder=this.scene.getObjectByName('holder');this.portalPlane=this.scene.getObjectByName('portal');this.portal=new Portal(this.portalPlane);this.portalWorldStart=this.scene.getObjectByName('portalWorldStart');this.portalWorldEnd=this.scene.getObjectByName('portalWorldEnd');this.cameraTarget=new THREE.Object3D();}
  setTransitionTransforms(startObject,endObject){this.startPosition=startObject.position.clone();this.startScale=startObject.scale.clone();this.startQuaternion=startObject.quaternion.clone();this.endPosition=endObject.position.clone();this.endScale=endObject.scale.clone();this.endQuaternion=endObject.quaternion.clone();}
  reset(){this.holder.position.set(0,0,0);this.holder.scale.set(1,1,1);this.holder.quaternion.identity();}
  placeToStart(){this.holder.position.copy(this.startPosition);this.holder.scale.copy(this.startScale);this.holder.quaternion.copy(this.startQuaternion);}
  moveWorldToEnd(){const duration=this.transitionDuration,ease=Power4.easeIn;gsap.to(this.holder.position,{duration,ease,x:this.endPosition.x,y:this.endPosition.y,z:this.endPosition.z});gsap.to(this.holder.scale,{duration,ease,x:this.endScale.x,y:this.endScale.y,z:this.endScale.z});gsap.to(this.holder.quaternion,{duration,ease,x:this.endQuaternion.x,y:this.endQuaternion.y,z:this.endQuaternion.z,w:this.endQuaternion.w});}
  moveWorldAndCameraToOrigin(){const duration=this.transitionDuration,ease=Power4.easeOut;gsap.to(this.holder.position,{duration,ease,x:0,y:0,z:0});gsap.to(this.holder.scale,{duration,ease,x:1,y:1,z:1});gsap.to(this.holder.quaternion,{duration,ease,x:0,y:0,z:0,w:1});gsap.to(this.cameraTarget.position,{duration,ease,x:0,y:0,z:0});gsap.to(this.camera.position,{duration,ease,x:0,y:0,z:40,onUpdate:()=>this.camera.lookAt(this.cameraTarget.position),onComplete:()=>this.emit('moveToOriginComplete')});}
  moveCameraToPortal(){const duration=this.transitionDuration,ease=Power4.easeIn;const dir=new THREE.Vector3();this.portalPlane.getWorldDirection(dir);const worldPos=new THREE.Vector3();this.portalPlane.getWorldPosition(worldPos);const pos=worldPos.clone().add(dir.multiplyScalar(3));gsap.to(this.cameraTarget.position,{duration,ease,x:this.portalWorldEnd.position.x,y:this.portalWorldEnd.position.y,z:this.portalWorldEnd.position.z});gsap.to(this.camera.position,{duration,ease,x:pos.x,y:pos.y,z:pos.z,onUpdate:()=>this.camera.lookAt(this.cameraTarget.position),onComplete:()=>this.emit('moveToPortalComplete')});gsap.to(this.portal,{duration,ease:Power4.easeIn,effectIntensity:0,onComplete:()=>{this.portal.effectIntensity=1;}});}
  update(dt,t){this.scene.userData.update?.(dt,t);}
}

class Portal {
  constructor(plane){this.plane=plane;this._effectIntensity=1;this._effectMultiplier=1;this.time=0;const fragmentShader=document.getElementById('fragmentShader').textContent;const vertexShader=document.getElementById('vertexShader').textContent;this.renderTarget=new THREE.WebGLRenderTarget(2048,2048,{type:THREE.HalfFloatType});this.plane.material=new THREE.ShaderMaterial({uniforms:{map:{value:this.renderTarget.texture},noiseMap:{value:ASSETS.noiseMap},time:{value:0},effectIntensity:{value:this.effectIntensity},effectMultiplier:{value:this.effectMultiplier}},vertexShader,fragmentShader});if(!this.plane.geometry.boundingBox)this.plane.geometry.computeBoundingBox();this.corners={bottomLeft:new THREE.Vector3(),bottomRight:new THREE.Vector3(),topLeft:new THREE.Vector3()};}
  updateCorners(){const{min,max}=this.plane.geometry.boundingBox;this.plane.localToWorld(this.corners.bottomLeft.set(min.x,min.y,0));this.plane.localToWorld(this.corners.bottomRight.set(max.x,min.y,0));this.plane.localToWorld(this.corners.topLeft.set(min.x,max.y,0));}
  set effectIntensity(v){this._effectIntensity=v;if(this.plane?.material?.uniforms)this.plane.material.uniforms.effectIntensity.value=v;}
  get effectIntensity(){return this._effectIntensity;}
  set effectMultiplier(v){if(v===this._effectMultiplier)return;this._effectMultiplier=v;if(this.plane?.material?.uniforms)gsap.to(this.plane.material.uniforms.effectMultiplier,{duration:1,ease:Power4.easeOut,value:v});}
  get effectMultiplier(){return this._effectMultiplier;}
  loop(deltaTime){this.time+=deltaTime*this.effectMultiplier;this.plane.material.uniforms.time.value=this.time;}
}
