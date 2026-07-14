(function(){
  function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function build(mediaList,opts){
    opts=opts||{};
    var media=EP.ScrollSections.normalizeMedia(mediaList||[]);
    var cfg={brand:opts.brand||'Escaparates Pro',headline:opts.headline||'',productName:opts.productName||'',cta:opts.cta||'',media1:media[0]?media[0].url:''};
    var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(cfg))));
    var url=new URL('labs/source-experiences/product-storytelling-source-faithful/index.html',window.location.href).href+'#'+encoded;
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Product Storytelling — Source Faithful PRO</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#050505;overflow:hidden}iframe{width:100%;height:100%;border:0;display:block;background:#050505}</style></head><body><iframe src="'+esc(url)+'" title="Product Storytelling — Source Faithful PRO" allow="autoplay; fullscreen" loading="eager"></iframe></body></html>';
  }
  EP.ScrollSections.register({id:'product-storytelling-source-faithful',name:'Product Storytelling — Source Faithful PRO',icon:'PF',description:'Patrón premium de producto preservado desde la referencia original, neutralizado como AURA X y conectado al slot 1.',build:build});
})();
