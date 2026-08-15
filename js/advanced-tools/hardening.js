(function(){
'use strict';
window.EP=window.EP||{};
function tool(){return EP.AdvancedTools&&EP.AdvancedTools.get&&EP.AdvancedTools.get('infinite-display-studio-pro')}
async function gitBlobSha(text){
  if(!window.crypto||!crypto.subtle)return null;
  var body=new TextEncoder().encode(text),header=new TextEncoder().encode('blob '+body.length+'\0'),bytes=new Uint8Array(header.length+body.length);bytes.set(header);bytes.set(body,header.length);
  var digest=await crypto.subtle.digest('SHA-1',bytes);return Array.from(new Uint8Array(digest)).map(function(b){return b.toString(16).padStart(2,'0')}).join('');
}
var nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  var response=await nativeFetch(input,init),def=tool(),url=typeof input==='string'?input:(input&&input.url)||'';
  if(!def||url!==def.source.url)return response;
  var actual=await gitBlobSha(await response.clone().text());
  if(actual&&actual!==def.source.blob)throw new Error('Type B source integrity failed: '+actual+' != '+def.source.blob);
  window.__EP_TYPE_B_SOURCE_INTEGRITY__={status:actual?'verified':'unavailable',actual:actual,expected:def.source.blob,commit:def.source.commit};
  return response;
};
function findControl(field){
  var def=tool();if(!def||!field)return null;var label=field.querySelector('label span:first-child'),text=label&&label.textContent;return (def.controls||[]).concat(def.brandingControls||[]).find(function(c){return (c.label||c.key)===text})||null;
}
function sanitize(event){
  var input=event.target;if(!input||!input.closest)return;var field=input.closest('.at-field');if(!field||(!field.closest('#at-controls')&&!field.closest('#at-branding')))return;
  var ctrl=findControl(field);if(!ctrl||!EP.ControlSchema||!EP.ControlSchema.validateValue)return;
  var raw=ctrl.type==='boolean'?input.checked:ctrl.type==='range'?Number(input.value):input.value;
  var value=EP.ControlSchema.validateValue({controlsDef:[ctrl]},ctrl.key,raw);
  if(ctrl.type==='boolean')input.checked=Boolean(value);else if(String(input.value)!==String(value))input.value=value;
}
document.addEventListener('input',sanitize,true);document.addEventListener('change',sanitize,true);
EP.AdvancedToolHardening={gitBlobSha:gitBlobSha,sanitize:sanitize};
})();
