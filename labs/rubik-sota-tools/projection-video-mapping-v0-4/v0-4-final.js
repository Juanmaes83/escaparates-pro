(() => {
'use strict';
const frame=document.getElementById('baselineFrame');if(!frame)return;
const TEXT_KEY='projection-v0-4-text';
let bgData=null,mediaData=null,mediaMime='';

function boot(){setTimeout(init,0)}
function init(){
 const d=frame.contentDocument;if(!d)return;const $=id=>d.getElementById(id),panel=d.querySelector('.panel');if(!panel)return;
 const word=$('projectionWord');if(!word)return;
 d.title='Projection / Video Mapping Experience — V0.4 Final';
 const v=d.querySelector('.brand span');if(v)v.textContent='· V0.4';
 const st=d.querySelector('.topbar .status');if(st)st.innerHTML='<span class="dot"></span>final polish · background light + projection text';
 enhanceBackground(d,$);
 injectTextControls(d,$,panel,word);
 captureAssets($);
 hookSaveRestore(d,$,word);
 hookOutputs(d,$,word);
}

function enhanceBackground(d,$){
 const bg=$('bgBrightness');if(!bg)return;
 bg.min='0.05';bg.max='2.50';bg.step='0.01';
 const field=bg.closest('.field');
 const label=field&&field.querySelector('label');if(label){const value=label.querySelector('.value');label.childNodes[0].textContent='Background light ';if(value)value.id='bgVal';}
 const helper=d.createElement('div');helper.className='tiny';helper.textContent='0.05 = almost black · 1.00 = original exposure · 2.50 = strongly lifted background';field.appendChild(helper);
 const row=d.createElement('div');row.className='v03-row';row.style.marginTop='7px';row.innerHTML='<button class="btn" id="v04BgDark">Darker</button><button class="btn" id="v04BgBright">Brighter</button>';
 field.appendChild(row);
 $('v04BgDark').onclick=()=>nudge(-0.15);$('v04BgBright').onclick=()=>nudge(0.15);
 function nudge(delta){bg.value=Math.max(+bg.min,Math.min(+bg.max,+bg.value+delta)).toFixed(2);bg.dispatchEvent(new Event('input',{bubbles:true}))}
}

function injectTextControls(d,$,panel,word){
 const projectSection=$('v03ResetTransform')?.closest('.section')||panel.querySelector('.footer');
 const sec=d.createElement('div');sec.className='section';sec.id='v04TextSection';
 sec.innerHTML='<div class="section-title"><span>Projection text</span><span>10</span></div><label class="v03-check"><input id="v04TextOn" type="checkbox" checked> Show text over projection</label><div class="field"><label>Text</label><input id="v04Text" type="text" maxlength="180" value="'+escapeAttr(word.textContent.trim())+'"></div><div class="field"><label>Size <span class="value" id="v04TextSizeV">54px</span></label><input id="v04TextSize" type="range" min="12" max="140" step="1" value="54"></div><div class="field"><label>Opacity <span class="value" id="v04TextOpacityV">1.00</span></label><input id="v04TextOpacity" type="range" min="0" max="1" step="0.01" value="1"></div><div class="field"><label>Color</label><input id="v04TextColor" type="color" value="#ffffff" style="width:100%;height:34px;background:#090909;border:1px solid #34322a;border-radius:5px"></div><div class="tiny">Text remains inside the same transformed projection plane, so it inherits the exact Rubik perspective.</div>';
 projectSection.insertAdjacentElement('beforebegin',sec);
 const apply=()=>{
   const on=$('v04TextOn').checked,text=$('v04Text').value.trim();
   word.textContent=text||' ';
   word.style.fontSize=$('v04TextSize').value+'px';
   word.style.opacity=$('v04TextOpacity').value;
   word.style.color=$('v04TextColor').value;
   word.classList.toggle('hidden',!on);
   $('v04TextSizeV').textContent=$('v04TextSize').value+'px';
   $('v04TextOpacityV').textContent=(+$('v04TextOpacity').value).toFixed(2);
 };
 ['v04Text','v04TextSize','v04TextOpacity','v04TextColor'].forEach(id=>$(id).addEventListener('input',apply));$('v04TextOn').addEventListener('change',apply);
 const med=$('uploadMedia');if(med)med.addEventListener('change',()=>setTimeout(apply,30));
 const mode=$('mediaMode');if(mode)mode.addEventListener('change',()=>setTimeout(apply,30));
 apply();
}

function captureAssets($){
 const bg=$('uploadBg');if(bg)bg.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>bgData=r.result;r.readAsDataURL(f)});
 const med=$('uploadMedia');if(med)med.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;mediaMime=f.type;const r=new FileReader();r.onload=()=>mediaData=r.result;r.readAsDataURL(f)});
}

function textState($){return{on:$('v04TextOn').checked,text:$('v04Text').value,size:$('v04TextSize').value,opacity:$('v04TextOpacity').value,color:$('v04TextColor').value}}
function applyText($,word,s){if(!s)return;$('v04TextOn').checked=!!s.on;$('v04Text').value=s.text||'';$('v04TextSize').value=s.size||54;$('v04TextOpacity').value=s.opacity??1;$('v04TextColor').value=s.color||'#ffffff';$('v04Text').dispatchEvent(new Event('input',{bubbles:true}))}
function hookSaveRestore(d,$,word){
 const save=$('v03Save'),restore=$('v03Restore');
 if(save){const old=save.onclick;save.onclick=e=>{if(old)old.call(save,e);localStorage.setItem(TEXT_KEY,JSON.stringify(textState($)));toast(d,'✓ Settings + projection text saved')}}
 if(restore){const old=restore.onclick;restore.onclick=e=>{if(old)old.call(restore,e);try{applyText($,word,JSON.parse(localStorage.getItem(TEXT_KEY)||'null'));toast(d,'✓ Settings + projection text restored')}catch{}}}
}

function hookOutputs(d,$,word){
 const html=$('v03Html');if(html)html.onclick=()=>{download(new Blob([standalone($,word)],{type:'text/html'}),'projection-experience-v0-4.html');$('v03Output').textContent='✓ Standalone HTML downloaded';toast(d,'✓ Final HTML downloaded')};
 const embed=$('v03Embed');if(embed)embed.onclick=async()=>{const u=URL.createObjectURL(new Blob([standalone($,word)],{type:'text/html'}));const code='<iframe src="'+u+'" style="width:100%;aspect-ratio:16/9;border:0" allow="autoplay;fullscreen"></iframe>';try{await navigator.clipboard.writeText(code);$('v03Output').textContent='✓ Temporary embed copied';toast(d,'✓ Embed copied')}catch{toast(d,'Clipboard blocked')}};
}

function collect($){const ids=['opacity','brightness','contrast','blend','spill','reflection','bgBrightness','scale','offsetX','offsetY','rotate','v03Fit','v03FlipX','v03FlipY','v03BeamOn','v03Ox','v03Oy','v03Bi','v03Bs','v03DustOn','v03Da','v03Ds','v03Dz','v03Do'];const o={};ids.forEach(id=>{const e=$(id);if(e)o[id]=e.type==='checkbox'?e.checked:e.value});o.text=textState($);return o}
function standalone($,word){
 const M='matrix3d(0.614952,0.147049,0,0.000199706,-0.0178567,0.487847,0,-0.0000312429,0,0,1,0,137,29,0,1)';
 const bg=bgData||$('sceneBg').src;let mt='youtube',ms=$('ytMedia').src;if(!$('videoMedia').classList.contains('hidden')){mt='video';ms=mediaData||$('videoMedia').src}else if(!$('imageMedia').classList.contains('hidden')){mt='image';ms=mediaData||$('imageMedia').src}
 const S={bg,mt,ms,a:collect($)};const safe=JSON.stringify(S).replace(/</g,'\\u003c');
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Projection Experience</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}.s{position:fixed;inset:0;overflow:hidden}.bg,.m{position:absolute;inset:0;width:100%;height:100%}.bg{object-fit:cover}.box{position:absolute;inset:0;transform-origin:0 0;pointer-events:none}.m{border:0;background:#000}.txt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:900;line-height:1.05;text-transform:uppercase;text-shadow:0 2px 18px rgba(0,0,0,.6);padding:5%;box-sizing:border-box}.beam{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;background:linear-gradient(90deg,rgba(214,228,255,.015),rgba(214,230,255,.055),rgba(236,242,255,.14));filter:blur(20px)}</style></head><body><div class="s"><img class="bg" id="bg"><div class="beam" id="beam"></div><div class="box" id="box"></div></div><script>const S=${safe},A=S.a,M='${M}';bg.src=S.bg;bg.style.filter='brightness('+A.bgBrightness+') contrast(1.3)';box.style.transform=M+' translate('+A.offsetX+'px,'+A.offsetY+'px) scale('+A.scale+') rotate('+A.rotate+'deg)';let m=S.mt==='video'?document.createElement('video'):S.mt==='image'?document.createElement('img'):document.createElement('iframe');m.src=S.ms;m.className='m';m.style.opacity=A.opacity;m.style.filter='brightness('+A.brightness+') contrast('+A.contrast+')';m.style.mixBlendMode=A.blend;m.style.objectFit=A.v03Fit;m.style.transform='scale('+(A.v03FlipX?-1:1)+','+(A.v03FlipY?-1:1)+')';if(S.mt==='video'){m.autoplay=true;m.loop=true;m.muted=true;m.playsInline=true}box.appendChild(m);if(A.text&&A.text.on){const t=document.createElement('div');t.className='txt';t.textContent=A.text.text;t.style.fontSize=A.text.size+'px';t.style.opacity=A.text.opacity;t.style.color=A.text.color;box.appendChild(t)}beam.style.display=A.v03BeamOn?'block':'none';beam.style.opacity=A.v03Bi;beam.style.clipPath='polygon('+A.v03Ox+'% '+A.v03Oy+'%,12% 5%,75% 25%,74% 75%,12% 54%)';<\/script></body></html>`;
}
function download(blob,name){const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
function toast(d,t){const e=d.getElementById('v03Toast');if(!e)return;e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),2200)}
function escapeAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
frame.addEventListener('load',boot,{once:true});
})();