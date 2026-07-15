(function(){
  'use strict';
  window.EP=window.EP||{};
  var DB='escaparates-pro-versions',STORE='versions',dbp;
  function open(){if(dbp)return dbp;dbp=new Promise(function(resolve,reject){var r=indexedDB.open(DB,1);r.onupgradeneeded=function(){var db=r.result;if(!db.objectStoreNames.contains(STORE)){var s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('projectId','projectId');s.createIndex('createdAt','createdAt');}};r.onsuccess=function(){resolve(r.result)};r.onerror=function(){reject(r.error)};});return dbp;}
  function tx(mode,fn){return open().then(function(db){return new Promise(function(resolve,reject){var t=db.transaction(STORE,mode),s=t.objectStore(STORE),r=fn(s);t.oncomplete=function(){resolve(r&&r.result!==undefined?r.result:r)};t.onerror=function(){reject(t.error)}});});}
  function uid(){return 'ver_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
  function snapshot(project,label,reason){return {id:uid(),projectId:project.cloudId||project.id,label:label||'Versión',reason:reason||'manual',createdAt:new Date().toISOString(),revision:project.revision||0,data:JSON.parse(JSON.stringify(project))};}
  function createLocal(project,label,reason){var v=snapshot(project,label,reason);return tx('readwrite',function(s){return s.put(v)}).then(function(){return v});}
  function listLocal(projectId){return open().then(function(db){return new Promise(function(resolve,reject){var r=db.transaction(STORE,'readonly').objectStore(STORE).index('projectId').getAll(projectId);r.onsuccess=function(){resolve((r.result||[]).sort(function(a,b){return String(b.createdAt).localeCompare(String(a.createdAt))}))};r.onerror=function(){reject(r.error)}});});}
  async function create(project,label,reason){var local=await createLocal(project,label,reason);if(project.cloudId&&EP.ProjectClient.hasSession()&&navigator.onLine){try{var remote=await EP.ProjectClient.api.createVersion(project.cloudId,{label:label,reason:reason,snapshot:project});local.cloud=remote.version||remote;}catch(e){local.cloudError={message:e.message,status:e.status};}}return local;}
  async function list(project){var local=await listLocal(project.cloudId||project.id);if(project.cloudId&&EP.ProjectClient.hasSession()&&navigator.onLine){try{var remote=await EP.ProjectClient.api.versions(project.cloudId);return {local:local,cloud:remote.versions||remote};}catch(e){return {local:local,cloud:[],error:e};}}return {local:local,cloud:[]};}
  async function restore(project,version){if(version.cloud&&project.cloudId)return EP.ProjectClient.api.restoreVersion(project.cloudId,version.cloud.id||version.id);var restored=JSON.parse(JSON.stringify(version.data));restored.id=project.id;restored.cloudId=project.cloudId;restored.revision=project.revision;restored.name=project.name;return EP.ProjectStoreLocal.save(restored);}
  EP.ProjectVersioning={create:create,list:list,restore:restore,createLocal:createLocal,listLocal:listLocal};
})();
