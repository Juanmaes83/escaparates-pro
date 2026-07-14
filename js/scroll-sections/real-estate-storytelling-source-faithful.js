(function(){
  function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function build(mediaList,opts){
    opts=opts||{};
    var media=EP.ScrollSections.normalizeMedia(mediaList||[]);
    var cfg={brand:opts.brand||'Escaparates Pro',headline:opts.headline||'',productName:opts.productName||'',cta:opts.cta||'',media1:media[0]?media[0].url:''};
    var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(cfg))));
    var url=new URL('labs/source-experiences/real-estate-storytelling-source-faithful/index.html',window.location.href).href+'#'+encoded;
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Real Estate Storytelling — Source Faithful PRO</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#050505;overflow:hidden}iframe{width:100%;height:100%;border:0;display:block;background:#050505}</style></head><body><iframe src="'+esc(url)+'" title="Real Estate Storytelling — Source Faithful PRO" allow="autoplay; fullscreen" loading="eager"></iframe></body></html>';
  }
  EP.ScrollSections.register({id:'real-estate-storytelling-source-faithful',name:'Real Estate Storytelling — Source Faithful PRO',icon:'RF',description:'Adaptación fiel del repositorio original: vídeo real, narrativa bidireccional, cuatro fases, tipografía y coreografía preservadas.',build:build});
})();
