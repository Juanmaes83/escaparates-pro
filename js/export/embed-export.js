(function(){
  'use strict';
  window.EP=window.EP||{};
  function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function iframe(url,options){options=options||{};if(!/^https:\/\//i.test(String(url||'')))throw new Error('La URL publicada debe usar HTTPS.');var title=esc(options.title||'Escaparates Pro experience'),height=Math.max(480,Math.min(4000,Number(options.height)||1000));return '<iframe src="'+esc(url)+'" title="'+title+'" width="100%" height="'+height+'" loading="lazy" allow="autoplay; fullscreen" allowfullscreen style="border:0;display:block;width:100%;"></iframe>';}
  function responsive(url,options){var code=iframe(url,Object.assign({},options,{height:1000}));return '<div style="position:relative;width:100%;min-height:600px;overflow:hidden"><style>.ep-embed iframe{width:100%;height:min(1000px,100vh);min-height:600px}@media(max-width:640px){.ep-embed iframe{min-height:760px}}</style><div class="ep-embed">'+code+'</div></div>';}
  async function copy(text){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;}}catch(_e){}try{var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();var ok=document.execCommand('copy');ta.remove();return ok;}catch(_e){return false;}}
  EP.EmbedExport={iframe:iframe,responsive:responsive,copy:copy};
})();
