(function(){
  'use strict';
  window.EP=window.EP||{};
  function slug(v){return String(v||'project').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'project';}
  function injectSeo(html,project){var seo=project.seo||{},title=seo.title||project.name||'Escaparates Pro',description=seo.description||'',favicon=seo.faviconUrl||'',og=seo.ogImageUrl||'';html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+String(title).replace(/[&<>]/g,'')+'</title>');var tags='';if(description)tags+='<meta name="description" content="'+String(description).replace(/"/g,'&quot;')+'">';if(favicon)tags+='<link rel="icon" href="'+favicon+'">';if(og)tags+='<meta property="og:image" content="'+og+'">';tags+='<meta name="generator" content="Escaparates Pro"><meta name="ep-template-id" content="'+project.templateId+'"><meta name="ep-template-version" content="'+(project.templateVersion||'2.2.0')+'">';return html.replace('</head>',tags+'</head>');}
  function build(project,html){var report=EP.ExportValidator.validate(project,html);if(!report.ok){var e=new Error('El proyecto no está listo para exportar.');e.report=report;throw e;}html=injectSeo(html,project);html=html.replace(/\sdata-ep-private="[^"]*"/g,'').replace(/Authorization:\s*Bearer\s+[^'"\s<]+/gi,'');return {filename:slug(project.name)+'.html',html:html,report:report};}
  function download(result){var blob=new Blob([result.html],{type:'text/html;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=result.filename;a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);}
  EP.HtmlExport={build:build,download:download,slug:slug};
})();
