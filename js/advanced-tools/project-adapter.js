(function(){
  'use strict';
  window.EP=window.EP||{};
  function make(tool,state,existing){
    var now=new Date().toISOString();
    var base=existing||{};
    var name=(state&&state.name)||base.name||tool.name+' Project';
    return Object.assign({},base,{
      name:name,projectName:name,
      templateId:'advanced-tool/'+tool.id,
      templateKind:'scroll',
      templateVersion:tool.version,
      schemaVersion:tool.projectSchemaVersion||1,
      source:'advanced-tool',
      config:{advancedTool:{
        moduleId:tool.id,
        moduleVersion:tool.version,
        schemaVersion:tool.projectSchemaVersion||1,
        config:(state&&state.config)||{},
        branding:(state&&state.branding)||{},
        presentation:(state&&state.presentation)||{},
        media:(state&&state.media)||[],
        output:(state&&state.output)||{},
        metadata:Object.assign({sourceCommit:tool.source.commit,updatedAt:now},(state&&state.metadata)||{})
      }},
      media:(state&&state.media)||[],
      persistenceMode:base.cloudId?'cloud':'local',
      updatedAt:now
    });
  }
  function read(tool,project){
    var payload=project&&project.config&&project.config.advancedTool;
    if(!payload||payload.moduleId!==tool.id)return null;
    return {name:project.name,config:payload.config||{},branding:payload.branding||{},presentation:payload.presentation||{},media:payload.media||project.media||[],output:payload.output||{},metadata:payload.metadata||{}};
  }
  EP.AdvancedToolProjectAdapter={make:make,read:read};
})();
