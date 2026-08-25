(function(){
  'use strict';
  window.EP=window.EP||{};

  var additions=[
    {
      id:'luxury-beauty-product-pro-explicit',icon:'LB',name:'Luxury Beauty Product PRO',
      version:'Custom PRO',sector:'Beauty / Product Journey',status:'CONNECTED',
      description:'Implementación Escaparates Pro personalizable de beauty/fragrance con producto protagonista, escenas, contenidos, colección, media y journey configurable.',
      open:function(){openModeAndFind('mode-btn-sector-blueprints','Luxury Beauty Product');}
    },
    {
      id:'real-estate-bidirectional-story-pro',icon:'BD',name:'Real Estate Bidirectional Story PRO',
      version:'Bidirectional Evolution',sector:'Real Estate / Scroll Story',status:'CONNECTED',
      description:'Evolución bidireccional del storytelling inmobiliario. Se conserva además de Source Faithful y Custom PRO.',
      open:function(){openModeAndFind('mode-btn-scroll-sections','Real Estate Bidirectional');}
    },
    {
      id:'product-scroll-storytelling-pro',icon:'PS',name:'Product Scroll Storytelling PRO',
      version:'Product Scroll Evolution',sector:'Product / Scroll Story',status:'CONNECTED',
      description:'Storytelling de producto sincronizado al scroll, preservado como capacidad independiente aunque comparta ADN con ELORIA.',
      open:function(){openModeAndFind('mode-btn-scroll-sections','Product Scroll Storytelling');}
    }
  ];

  function openModeAndFind(modeId,label){
    var vault=document.getElementById('premium-vault-overlay');
    if(vault)vault.classList.remove('active');
    var vb=document.getElementById('mode-btn-premium-vault');if(vb)vb.classList.remove('active');
    var mode=document.getElementById(modeId);if(mode)mode.click();
    setTimeout(function(){
      var cards=document.querySelectorAll('.ss-template-card');
      for(var i=0;i<cards.length;i++){
        if((cards[i].textContent||'').toLowerCase().indexOf(label.toLowerCase())!==-1){cards[i].click();return;}
      }
    },120);
  }

  function renderCard(item){
    var box=document.getElementById('premium-vault-catalog');if(!box)return;
    if(box.querySelector('[data-vault="'+item.id+'"]'))return;
    var card=document.createElement('article');
    card.className='pv-card';card.dataset.vault=item.id;
    card.innerHTML='<span class="pv-icon">'+item.icon+'</span><div><h3>'+item.name+'</h3><div class="pv-meta">'+item.sector+' · '+item.version+'</div><span class="pv-status '+item.status+'">'+item.status+'</span></div>';
    card.onclick=function(){
      document.querySelectorAll('.pv-card').forEach(function(c){c.classList.toggle('active',c.dataset.vault===item.id);});
      var frame=document.getElementById('premium-vault-frame'),empty=document.getElementById('premium-vault-empty');
      if(frame){frame.style.display='none';frame.removeAttribute('src');}
      if(empty){empty.style.display='grid';empty.innerHTML='<div><strong>'+item.name+'</strong>'+item.description+'</div>';}
      var panel=document.getElementById('premium-vault-panel');if(!panel)return;
      panel.innerHTML='<small style="color:#8f8f97;text-transform:uppercase;letter-spacing:.12em">'+item.sector+'</small><h2 style="margin:8px 0 4px">'+item.name+'</h2><div class="pv-panel-status">PANEL · '+item.status+'</div><p class="pv-panel-copy">'+item.description+'</p>';
      var open=document.createElement('button');open.className='pv-action primary';open.textContent='Abrir panel personalizable conectado';open.onclick=item.open;panel.appendChild(open);
      var note=document.createElement('p');note.className='pv-panel-copy';note.style.marginTop='16px';note.textContent='Entrada restaurada de forma aditiva. No sustituye ni elimina ninguna versión existente.';panel.appendChild(note);
    };
    box.appendChild(card);
  }

  function init(){
    additions.forEach(renderCard);
    if(EP.PremiumExperiencesVault&&EP.PremiumExperiencesVault.getAll){
      var original=EP.PremiumExperiencesVault.getAll;
      EP.PremiumExperiencesVault.getAll=function(){return original().concat(additions.map(function(x){return Object.assign({},x);}));};
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(init,250);});
  else setTimeout(init,250);
})();