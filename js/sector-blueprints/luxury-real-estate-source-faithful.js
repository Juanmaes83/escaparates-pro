(function(){
  function esc(v){return String(v||'').replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]})}
  function builder(mediaList,opts){
    opts=opts||{};var media=(mediaList||[]).filter(Boolean);var first=media[0];var media1=first?(first.url||(first.element&&(first.element.currentSrc||first.element.src))||''):'';
    var cfg={brand:opts.brand||'Escaparates Pro',headline:opts.headline||'Vive Sin',cta:opts.cta||'Solicitar visita',media1:media1};
    var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(cfg))));
    var url=new URL('labs/source-experiences/luxury-real-estate-source-faithful/index.html',window.location.href).href+'#'+encoded;
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Luxury Real Estate — Source Faithful PRO</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#050505;overflow:hidden}iframe{width:100%;height:100%;border:0;display:block}</style></head><body><iframe src="'+esc(url)+'" title="Luxury Real Estate Source Faithful" allow="autoplay; fullscreen" loading="eager"></iframe></body></html>';
  }
  builder.id='luxury-real-estate-source-faithful';
  builder.schema=[
    {key:'brand',label:'Marca',type:'text',default:'Escaparates Pro'},
    {key:'headline',label:'Titular hero',type:'text',default:'Vive Sin'},
    {key:'cta',label:'CTA',type:'text',default:'Solicitar visita'}
  ];
  if(EP.SectorBlueprints&&EP.SectorBlueprints.register)EP.SectorBlueprints.register(builder);
})();
