import * as THREE from "https://esm.sh/three@0.172.0";
import { gsap } from "https://esm.sh/gsap@3.12.5";

export const VISUAL_PROFILES={
  city:{
    original:{exposure:1.15,overlay:'rgba(0,0,0,0)',overlayOpacity:.05,fog:0x44535d,fogDensity:.018,hemi:1.25,sun:2.1},
    industrial:{exposure:1.04,overlay:'linear-gradient(135deg,#16334d,#72879a)',overlayOpacity:.19,fog:0x3a4d59,fogDensity:.020,hemi:1.08,sun:1.78},
    noir:{exposure:.86,overlay:'linear-gradient(145deg,#09131d,#4b5962)',overlayOpacity:.28,fog:0x2b343a,fogDensity:.025,hemi:.80,sun:1.35},
    cold:{exposure:1.0,overlay:'linear-gradient(145deg,#35627d,#8799a8)',overlayOpacity:.17,fog:0x51636e,fogDensity:.017,hemi:1.15,sun:1.75}
  },
  nature:{
    original:{exposure:1.15,overlay:'rgba(0,0,0,0)',overlayOpacity:.05,fog:0xc8ead8,fogDensity:.009,hemi:2.2,sun:3.3},
    living:{exposure:1.22,overlay:'linear-gradient(145deg,#2f7d42,#f6d58d)',overlayOpacity:.15,fog:0xc9ead5,fogDensity:.008,hemi:2.30,sun:3.45},
    golden:{exposure:1.30,overlay:'linear-gradient(145deg,#cf8a3b,#f8e5a4)',overlayOpacity:.19,fog:0xe2d9b8,fogDensity:.008,hemi:2.15,sun:3.85},
    emerald:{exposure:1.12,overlay:'linear-gradient(145deg,#0a5d47,#77c876)',overlayOpacity:.20,fog:0xb8e0cd,fogDensity:.010,hemi:2.08,sun:3.0}
  }
};

export class VisualDirector{
  constructor(renderer,overlay){this.renderer=renderer;this.overlay=overlay;this.selections={city:'industrial',nature:'living'};}
  apply(world){const p=VISUAL_PROFILES[world.name][this.selections[world.name]];if(!p)return;this.renderer.toneMappingExposure=p.exposure;this.overlay.style.background=p.overlay;this.overlay.style.opacity=p.overlayOpacity;world.scene.fog.color.setHex(p.fog);world.scene.fog.density=p.fogDensity;if(world.hemi)world.hemi.intensity=p.hemi;if(world.sun)world.sun.intensity=p.sun;}
  set(worldName,preset,currentWorld){this.selections[worldName]=preset;if(currentWorld?.name===worldName)this.apply(currentWorld);}
}

export class CinematicDirector{
  constructor(){this.timeline=null;this.done=false;}
  play(world,controls,preset='hero',onDone=()=>{}){
    if(preset==='off'){this.done=true;onDone();return;}
    controls.enabled=false;
    const base=world.camera.position.clone();
    const target=world.cameraTarget.position.clone();
    const start=preset==='subtle'?new THREE.Vector3(base.x+2.5,base.y+1.1,base.z+5):new THREE.Vector3(base.x+7.5,base.y+3.5,base.z+12);
    world.camera.position.copy(start);world.camera.lookAt(target);
    const curtain=document.getElementById('introCurtain');curtain.classList.add('show');
    this.timeline=gsap.timeline({onComplete:()=>{curtain.classList.remove('show');controls.enabled=true;this.done=true;onDone();}});
    this.timeline.to({}, {duration:.8});
    this.timeline.to(curtain,{opacity:0,duration:.8,ease:'power2.out'},.35);
    this.timeline.to(world.camera.position,{x:base.x,y:base.y,z:base.z,duration:preset==='subtle'?1.7:2.6,ease:'power3.out',onUpdate:()=>world.camera.lookAt(target)},.45);
  }
  skip(world,controls){this.timeline?.kill();document.getElementById('introCurtain')?.classList.remove('show');world.camera.position.set(0,0,40);world.camera.lookAt(world.cameraTarget.position);controls.enabled=true;this.done=true;}
}

function createNoiseBuffer(ctx,duration=4,brown=false){
  const length=Math.floor(ctx.sampleRate*duration),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
  for(let i=0;i<length;i++){const w=Math.random()*2-1;if(brown){last=(last+.02*w)/1.02;data[i]=last*3.2}else data[i]=w*.55;}return buffer;
}
function loopBuffer(ctx,buffer,gainValue,filterType='lowpass',frequency=1200){
  const src=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();src.buffer=buffer;src.loop=true;gain.gain.value=gainValue;filter.type=filterType;filter.frequency.value=frequency;src.connect(filter).connect(gain);src.start();return{src,gain,filter};
}

export class AudioDirector{
  constructor(){this.ctx=null;this.master=null;this.cityBus=null;this.natureBus=null;this.portalBus=null;this.started=false;this.enabled=false;this.masterValue=.7;this.spatialEnabled=true;this.portalLeakEnabled=true;this.sources=[];}
  start(){if(this.started){this.ctx?.resume();return;}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.masterValue;this.master.connect(this.ctx.destination);this.cityBus=this.ctx.createGain();this.natureBus=this.ctx.createGain();this.portalBus=this.ctx.createGain();this.cityBus.connect(this.master);this.natureBus.connect(this.master);this.portalBus.connect(this.master);this.cityBus.gain.value=1;this.natureBus.gain.value=0;this.portalBus.gain.value=.18;
    const white=createNoiseBuffer(this.ctx,5,false),brown=createNoiseBuffer(this.ctx,5,true);
    const traffic=loopBuffer(this.ctx,brown,.16,'lowpass',700);traffic.gain.connect(this.cityBus);const urbanAir=loopBuffer(this.ctx,white,.035,'bandpass',380);urbanAir.gain.connect(this.cityBus);
    const river=loopBuffer(this.ctx,white,.10,'bandpass',1600);river.gain.connect(this.natureBus);const leaves=loopBuffer(this.ctx,brown,.075,'highpass',500);leaves.gain.connect(this.natureBus);
    const hum=this.ctx.createOscillator(),humGain=this.ctx.createGain();hum.type='sine';hum.frequency.value=52;humGain.gain.value=.025;hum.connect(humGain).connect(this.cityBus);hum.start();
    const birds=this.ctx.createOscillator(),birdGain=this.ctx.createGain();birds.type='sine';birds.frequency.value=1200;birdGain.gain.value=.008;birds.connect(birdGain).connect(this.natureBus);birds.start();
    const portalOsc=this.ctx.createOscillator(),portalGain=this.ctx.createGain();portalOsc.type='sine';portalOsc.frequency.value=96;portalGain.gain.value=.035;portalOsc.connect(portalGain).connect(this.portalBus);portalOsc.start();
    this.sources.push(traffic,urbanAir,river,leaves,{src:hum,gain:humGain},{src:birds,gain:birdGain},{src:portalOsc,gain:portalGain});this.started=true;this.enabled=true;
  }
  setEnabled(on){this.start();this.enabled=on;if(this.master)this.master.gain.setTargetAtTime(on?this.masterValue:0,this.ctx.currentTime,.05);}
  setMaster(v){this.masterValue=v;if(this.master&&this.enabled)this.master.gain.setTargetAtTime(v,this.ctx.currentTime,.05);}
  setSpatial(on){this.spatialEnabled=on;}
  setPortalLeak(on){this.portalLeakEnabled=on;if(this.portalBus)this.portalBus.gain.setTargetAtTime(on?.18:0,this.ctx.currentTime,.08);}
  setWorld(name,immediate=false){if(!this.started)return;const t=this.ctx.currentTime,c= name==='city'?1:0,n=name==='nature'?1:0;if(immediate){this.cityBus.gain.value=c;this.natureBus.gain.value=n;}else{this.cityBus.gain.cancelScheduledValues(t);this.natureBus.gain.cancelScheduledValues(t);this.cityBus.gain.linearRampToValueAtTime(c,t+1.1);this.natureBus.gain.linearRampToValueAtTime(n,t+1.1);}}
  beginPortalCross(from,to){if(!this.started)return;const t=this.ctx.currentTime;const fromBus=from==='city'?this.cityBus:this.natureBus,toBus=to==='city'?this.cityBus:this.natureBus;fromBus.gain.cancelScheduledValues(t);toBus.gain.cancelScheduledValues(t);fromBus.gain.linearRampToValueAtTime(.55,t+.75);toBus.gain.linearRampToValueAtTime(.45,t+.75);this.portalBus.gain.linearRampToValueAtTime(this.portalLeakEnabled?.36:0,t+.55);}
  finishPortalCross(name){if(!this.started)return;this.setWorld(name,false);const t=this.ctx.currentTime;this.portalBus.gain.cancelScheduledValues(t);this.portalBus.gain.linearRampToValueAtTime(this.portalLeakEnabled?.18:0,t+.7);}
  update(camera,portalWorldPos,targetWorld){if(!this.started||!this.spatialEnabled||!this.portalLeakEnabled)return;const listener=this.ctx.listener,p=camera.position,q=camera.quaternion;const forward=new THREE.Vector3(0,0,-1).applyQuaternion(q),up=new THREE.Vector3(0,1,0).applyQuaternion(q);if(listener.positionX){listener.positionX.value=p.x;listener.positionY.value=p.y;listener.positionZ.value=p.z;listener.forwardX.value=forward.x;listener.forwardY.value=forward.y;listener.forwardZ.value=forward.z;listener.upX.value=up.x;listener.upY.value=up.y;listener.upZ.value=up.z;}const dist=Math.max(1,p.distanceTo(portalWorldPos));const leak=Math.min(.33,.65/dist)*(targetWorld==='nature'?1.15:.9);this.portalBus.gain.setTargetAtTime(leak,this.ctx.currentTime,.08);}
}

function fitPlane(mesh,ratio){const baseH=4.8,baseW=baseH*ratio;mesh.scale.set(baseW/8,baseH/4.5,1);}
function makeCanvasTexture(title,subtitle,accent='#dbe9e0'){
  const c=document.createElement('canvas');c.width=1400;c.height=800;const x=c.getContext('2d');x.fillStyle='#0d1115';x.fillRect(0,0,c.width,c.height);x.fillStyle=accent;x.fillRect(70,72,8,650);x.fillStyle='#ffffff';x.font='800 86px Inter,Arial';x.textBaseline='top';wrapText(x,title||'YOUR STORY',120,150,1160,98);x.fillStyle='rgba(255,255,255,.66)';x.font='600 34px Inter,Arial';wrapText(x,subtitle||'Cross the threshold.',120,530,1120,48);return new THREE.CanvasTexture(c);
}
function wrapText(ctx,text,x,y,maxWidth,lineHeight){const words=(text||'').split(' ');let line='';for(let i=0;i<words.length;i++){const test=line+words[i]+' ';if(ctx.measureText(test).width>maxWidth&&i>0){ctx.fillText(line,x,y);line=words[i]+' ';y+=lineHeight}else line=test;}ctx.fillText(line,x,y);}

export class BrandMediaManager{
  constructor(worlds){this.worlds=worlds;this.urls=[];this.videos=[];}
  getSlot(worldName){return this.worlds[worldName].brandSlot;}
  clearMaterial(slot){if(slot.material.map){slot.material.map.dispose?.();slot.material.map=null;}slot.material.color.setHex(0x10151a);slot.material.needsUpdate=true;}
  reset(worldName){const slot=this.getSlot(worldName);this.clearMaterial(slot);slot.material.map=makeCanvasTexture(worldName==='city'?'YOUR CAMPAIGN':'YOUR STORY',worldName==='city'?'A message inside the city.':'A message inside the landscape.',worldName==='city'?'#9fb3c1':'#b9df9f');slot.material.needsUpdate=true;slot.visible=true;}
  applyText(worldName,title,subtitle){const slot=this.getSlot(worldName);this.clearMaterial(slot);slot.material.map=makeCanvasTexture(title,subtitle,worldName==='city'?'#a8c8d8':'#b7e59c');slot.material.needsUpdate=true;slot.visible=true;}
  async applyImage(worldName,file){const url=URL.createObjectURL(file);this.urls.push(url);const img=new Image();img.src=url;await img.decode();const tex=new THREE.Texture(img);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;const slot=this.getSlot(worldName);this.clearMaterial(slot);slot.material.map=tex;slot.material.color.setHex(0xffffff);slot.material.needsUpdate=true;fitPlane(slot,img.naturalWidth/img.naturalHeight);slot.visible=true;}
  applyVideo(worldName,file){const url=URL.createObjectURL(file);this.urls.push(url);const video=document.createElement('video');video.src=url;video.loop=true;video.muted=true;video.playsInline=true;video.autoplay=true;video.play().catch(()=>{});this.videos.push(video);const tex=new THREE.VideoTexture(video);tex.colorSpace=THREE.SRGBColorSpace;const slot=this.getSlot(worldName);this.clearMaterial(slot);slot.material.map=tex;slot.material.color.setHex(0xffffff);slot.material.needsUpdate=true;slot.visible=true;video.addEventListener('loadedmetadata',()=>fitPlane(slot,(video.videoWidth||16)/(video.videoHeight||9)),{once:true});}
}

export const PORTAL_PRESETS={
  original:{distortion:1,waveCount:5,edgeGlow:1,portalSpeed:1,tint:0xffffff,tintAmount:0,fringe:1},
  glass:{distortion:.18,waveCount:3,edgeGlow:.45,portalSpeed:.55,tint:0xdff8ff,tintAmount:.12,fringe:.15},
  liquid:{distortion:1.38,waveCount:7,edgeGlow:.8,portalSpeed:.72,tint:0x8bd7ff,tintAmount:.25,fringe:.35},
  energy:{distortion:1.15,waveCount:9,edgeGlow:1.7,portalSpeed:1.55,tint:0x9ffff1,tintAmount:.32,fringe:.65},
  dream:{distortion:.72,waveCount:4,edgeGlow:1.25,portalSpeed:.42,tint:0xd8b8ff,tintAmount:.34,fringe:.22},
  organic:{distortion:.88,waveCount:6,edgeGlow:.92,portalSpeed:.62,tint:0xb3ef9d,tintAmount:.30,fringe:.20}
};

export class PortalAppearance{
  constructor(portals){this.portals=portals;this.current='original';}
  apply(name){this.current=name;const p=PORTAL_PRESETS[name]||PORTAL_PRESETS.original;this.portals.forEach(portal=>portal.setAppearance(p));}
  setParam(key,value){this.portals.forEach(portal=>portal.setAppearanceParam(key,value));}
}
