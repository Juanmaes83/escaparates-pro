from pathlib import Path
import json

HTML = Path('labs/interactive-boards-source/casebook-pro-v3/index.html')
RUNTIME = Path('labs/interactive-boards-source/casebook-pro-v3/v3-spatial-worlds-p0.js')

s = HTML.read_text(encoding='utf-8')
old_render = 'frame.srcdoc=patchSource(originalSource,boot);'
assert s.count(old_render) == 1, f'expected one render source assignment, got {s.count(old_render)}'
assert 'function patchV3AnchorBridge(source)' not in s

bridge_js = r'''function __v3AnchorAt(cx,cy){
  raycaster.setFromCamera({x:(cx/innerWidth)*2-1,y:-(cy/innerHeight)*2+1},camera);
  const hits=raycaster.intersectObjects(hitMeshes,false);
  for(const h of hits){
    const it=h.object&&h.object.userData&&h.object.userData.item;
    if(it&&it.grp&&it.grp.visible){
      it.grp.updateWorldMatrix(true,false);
      const local=it.grp.worldToLocal(h.point.clone());
      return {type:"item3d",itemId:String(it.id),local:[local.x,local.y,local.z],uv:h.uv?[h.uv.x,h.uv.y]:null};
    }
  }
  const p=screenToBoard(cx,cy,0);
  return p?{type:"world3d",world:[p.x,p.y,p.z]}:null;
}
function __v3ProjectAnchor(a){
  if(!a)return null;
  let p=null;
  if(a.type==="item3d"&&a.itemId&&Array.isArray(a.local)){
    const it=items.find(q=>String(q.id)===String(a.itemId));
    if(!it||!it.grp)return null;
    it.grp.updateWorldMatrix(true,false);
    p=it.grp.localToWorld(new THREE.Vector3(Number(a.local[0])||0,Number(a.local[1])||0,Number(a.local[2])||0));
  }else if(a.type==="world3d"&&Array.isArray(a.world)){
    p=new THREE.Vector3(Number(a.world[0])||0,Number(a.world[1])||0,Number(a.world[2])||0);
  }
  if(!p)return null;
  const sp=worldToScreen(p);
  return {x:sp.x,y:sp.y,visible:Number.isFinite(sp.x)&&Number.isFinite(sp.y)};
}
function __v3AnchorFromScreenPercent(xPct,yPct){
  return __v3AnchorAt(clamp(Number(xPct)||0,0,100)/100*innerWidth,clamp(Number(yPct)||0,0,100)/100*innerHeight);
}
'''

outer = '''\nfunction patchV3AnchorBridge(source){\n  const marker='window.CasebookPro={';\n  if(!String(source).includes(marker)) throw new Error("V3 anchor bridge: CasebookPro marker not found");\n  const bridge=''' + json.dumps(bridge_js) + ''';\n  let out=String(source).replace(marker,bridge+"\\n"+marker);\n  const apiMarker='capturePNG:__capturePNG,center:';\n  if(!out.includes(apiMarker)) throw new Error("V3 anchor bridge: API marker not found");\n  out=out.replace(apiMarker,'v3AnchorAt:__v3AnchorAt,v3ProjectAnchor:__v3ProjectAnchor,v3AnchorFromScreenPercent:__v3AnchorFromScreenPercent,'+apiMarker);\n  return out;\n}\n'''

render_marker = 'async function renderEditor(loadTemplate=true){'
assert s.count(render_marker) == 1
s = s.replace(render_marker, outer + '\n' + render_marker, 1)
s = s.replace(old_render, 'frame.srcdoc=patchV3AnchorBridge(patchSource(originalSource,boot));', 1)
HTML.write_text(s, encoding='utf-8')

r = RUNTIME.read_text(encoding='utf-8')
old_place = "function placementFromEvent(e){const anchor=findItemAnchorFromClient(e.clientX,e.clientY)||sceneAnchorFromClient(e.clientX,e.clientY);return{x:anchor.x*100,y:anchor.y*100,anchor}}"
new_place = '''function placementFromEvent(e){
  const fr=preview(),rr=fr?.getBoundingClientRect(),a=boardApi();
  if(rr&&a?.v3AnchorAt){
    try{
      const anchor=a.v3AnchorAt(e.clientX-rr.left,e.clientY-rr.top);
      if(anchor)return{x:clamp((e.clientX-rr.left)/rr.width*100,0,100),y:clamp((e.clientY-rr.top)/rr.height*100,0,100),anchor};
    }catch(err){console.warn('V3 3D anchor fallback',err)}
  }
  const anchor=findItemAnchorFromClient(e.clientX,e.clientY)||sceneAnchorFromClient(e.clientX,e.clientY);
  return{x:anchor.x*100,y:anchor.y*100,anchor};
}'''
assert r.count(old_place) == 1
r = r.replace(old_place, new_place, 1)

old_proj = "function projectAnchor(anchor){\n  const st=stage(),sr=st?.getBoundingClientRect(),fr=preview(),rr=fr?.getBoundingClientRect();if(!sr||!rr||!anchor)return null;\n  let cx,cy;"
new_proj = "function projectAnchor(anchor){\n  const st=stage(),sr=st?.getBoundingClientRect(),fr=preview(),rr=fr?.getBoundingClientRect();if(!sr||!rr||!anchor)return null;\n  const a=boardApi();\n  if(a?.v3ProjectAnchor&&(anchor.type==='item3d'||anchor.type==='world3d')){\n    try{\n      const p=a.v3ProjectAnchor(anchor);\n      if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))return{x:clamp((rr.left+p.x-sr.left)/sr.width*100,0,100),y:clamp((rr.top+p.y-sr.top)/sr.height*100,0,100)};\n    }catch(err){console.warn('V3 3D projection fallback',err)}\n  }\n  let cx,cy;"
assert r.count(old_proj) == 1
r = r.replace(old_proj, new_proj, 1)

old_commit = "h.x=clamp(Number(q('#v3HsX').value)||0,0,100);h.y=clamp(Number(q('#v3HsY').value)||0,0,100);h.anchor=h.anchor||{type:'scene'};h.anchor.x=h.x/100;h.anchor.y=h.y/100;h.targetChapterId"
new_commit = "h.x=clamp(Number(q('#v3HsX').value)||0,0,100);h.y=clamp(Number(q('#v3HsY').value)||0,0,100);if(h.anchor?.type==='item3d'||h.anchor?.type==='world3d'){try{h.anchor=boardApi()?.v3AnchorFromScreenPercent?.(h.x,h.y)||h.anchor}catch(_){}}else{h.anchor=h.anchor||{type:'scene'};h.anchor.x=h.x/100;h.anchor.y=h.y/100;}h.targetChapterId"
assert r.count(old_commit) == 1
r = r.replace(old_commit, new_commit, 1)

old_anchor = "const anchor=h.anchor?.type==='item'?`ITEM · ${h.anchor.itemId}`:'SCENE';"
new_anchor = "const anchor=h.anchor?.type==='item3d'?`ITEM 3D · ${h.anchor.itemId}`:h.anchor?.type==='world3d'?'WORLD 3D':h.anchor?.type==='item'?`ITEM · ${h.anchor.itemId}`:'SCENE';"
assert r.count(old_anchor) == 1
r = r.replace(old_anchor, new_anchor, 1)

RUNTIME.write_text(r, encoding='utf-8')
print('PATCH_OK')
