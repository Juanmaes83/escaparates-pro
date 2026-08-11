import * as THREE from "https://esm.sh/three@0.172.0";

// V1.2.3 VISUAL CLOSURE
// Pure art-direction overlay on the proven V1.2.2 branch.
// NO media loading, authoring, Apply/Start, warmup, portal, camera or transition logic.

let done = false;

const pbr = (color, roughness=.72, metalness=.08) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const groups = holder => holder.children.filter(g => g.isGroup && g.userData?.media);
const boxes = group => group?.children?.filter(o => o.isMesh && o.geometry?.type === 'BoxGeometry') || [];

function classify(world, holder){
  const gs = groups(holder);
  if(world === 'city'){
    return {
      video: gs.find(g => g.position.x < 0 && g.position.y < 4),
      image: gs.find(g => g.position.x > 0 && g.position.y < 4),
      logo: gs.find(g => g.position.y > 8),
      text: gs.find(g => g.position.x > 0 && g.position.y >= 4 && g.position.y < 9)
    };
  }
  return {
    video: gs.find(g => g.position.x < 0 && g.position.y > -3),
    image: gs.find(g => g.position.x > 0 && g.position.y > -3),
    logo: gs.find(g => g.position.x > 0 && g.position.y < -3),
    text: gs.find(g => g.position.x < 0 && g.position.y < -3)
  };
}

function styleCityFrame(group, kind){
  const b = boxes(group);
  if(!b.length) return;
  if(b[0]) b[0].material = pbr(0x11171b,.42,.34);
  if(b[1]) b[1].material = pbr(0x050708,.30,.46);
  // V1.2.2 added architectural volumes after the original two frame boxes.
  // Keep them, but make them read as a restrained façade rather than a giant prop.
  b.slice(2).forEach((m,i)=>{
    m.material = pbr(i===0 ? 0x1a2227 : 0x283138,.48,.30);
    m.scale.z = .62;
  });
  const light = group.userData.light;
  if(light){
    light.intensity = kind === 'video' ? .42 : .20;
    light.distance = 12;
  }
}

function styleNatureFrame(group){
  const b = boxes(group);
  if(!b.length) return;
  if(b[0]) b[0].material = pbr(0x595648,.93,.015);
  if(b[1]) b[1].material = pbr(0x35342d,.88,.025);
  b.slice(2).forEach((m,i)=>{
    m.material = pbr(i%2 ? 0x817c69 : 0x6d6959,.96,.01);
  });
  const light = group.userData.light;
  if(light){light.intensity *= .82; light.distance = 11;}
}

function city(r){
  // Keep all campaign roles inside a comfortable editorial cone around the portal.
  // The visitor sees a hint on arrival and discovers the full campaign with a short turn.
  if(r.video){
    r.video.position.set(-9.25,1.75,3.55);
    r.video.rotation.set(0,.065,0);
    styleCityFrame(r.video,'video');
    const b=boxes(r.video);
    // Final micro-fix: keep the proven hero-media placement untouched and only
    // pull back the added left architectural mass so it frames rather than occludes.
    if(b[2]){b[2].scale.set(.68,.70,.64); b[2].position.set(-1.15,-2.25,-.62);}
    if(b[3]){b[3].scale.set(.72,.78,.66); b[3].position.set(-.65,3.55,-.22);}
    if(b[4]){b[4].scale.set(.72,.78,.66); b[4].position.set(-.65,-3.50,-.18);}
  }
  if(r.image){
    r.image.position.set(8.55,.95,3.65);
    r.image.rotation.set(0,-.06,0);
    styleCityFrame(r.image,'image');
    const b=boxes(r.image);
    if(b[2]){b[2].scale.set(.82,.76,.64); b[2].position.set(0,-2.15,-.58);}
    if(b[3]){b[3].scale.set(.82,.82,.66); b[3].position.set(0,3.35,-.18);}
  }
  if(r.logo){
    r.logo.position.set(0,9.45,2.35);
    r.logo.rotation.set(0,0,0);
    r.logo.scale.set(1.08,1.08,1.08);
    const b=boxes(r.logo);
    b.forEach((m,i)=>m.material=pbr(i===0?0x151b1f:0x2c353a,.34,.46));
    if(b[2]){b[2].material=pbr(0xa5afb4,.26,.62);b[2].scale.x=.82;}
  }
  if(r.text){
    // Pair narrative with the right-hand image instead of isolating it at the edge of the world.
    r.text.position.set(7.15,5.75,3.85);
    r.text.rotation.set(0,-.055,0);
    r.text.scale.set(1.13,1.13,1.13);
    const b=boxes(r.text);
    if(b[0]){
      b[0].material=pbr(0x1a2227,.62,.10);
      b[0].scale.set(.76,.72,.70);
    }
  }
}

function nature(r){
  // Nature was already the stronger world in V1.2.2: refine, do not redesign.
  if(r.video){
    r.video.position.set(-11.55,-.10,8.75);
    r.video.rotation.set(0,.105,0);
    styleNatureFrame(r.video);
  }
  if(r.image){
    r.image.position.set(10.65,.35,9.15);
    r.image.rotation.set(0,-.11,0);
    styleNatureFrame(r.image);
  }
  if(r.logo){
    r.logo.position.set(6.15,-6.20,13.25);
    r.logo.rotation.set(0,-.085,0);
    const b=boxes(r.logo);
    b.forEach((m,i)=>m.material=pbr(i===0?0x7d7968:0xa19b84,.97,.01));
  }
  if(r.text){
    r.text.position.set(-6.65,-5.95,12.85);
    r.text.rotation.set(0,.055,0);
    r.text.scale.set(1.18,1.18,1.18);
    const b=boxes(r.text);
    if(b[0]){b[0].material=pbr(0xa8a087,.97,.01);b[0].scale.x=.90;}
  }
}

function apply(manager){
  if(done || !manager?.worlds?.city?.holder || !manager?.worlds?.nature?.holder) return;
  done = true;
  const roles = {
    city: classify('city',manager.worlds.city.holder),
    nature: classify('nature',manager.worlds.nature.holder)
  };
  // Run one frame after V1.2.2's synchronous art-direction listener has finished.
  requestAnimationFrame(()=>{
    city(roles.city);
    nature(roles.nature);
    console.info('[Infinite Worlds] V1.2.3 visual closure applied — visual transforms only.');
  });
}

window.addEventListener('iw:brand-ready',e=>apply(e.detail.manager),{once:true});
if(window.__IW_BRAND_MANAGER__) apply(window.__IW_BRAND_MANAGER__);
