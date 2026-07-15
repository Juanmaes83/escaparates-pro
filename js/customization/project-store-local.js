(function(){
  'use strict';
  window.EP=window.EP||{};
  var DB_NAME='escaparates-pro-projects';var DB_VERSION=1;var STORE='projects';var dbPromise=null;
  function open(){if(dbPromise)return dbPromise;dbPromise=new Promise(function(resolve,reject){var req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains(STORE)){var s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('updatedAt','updatedAt');s.createIndex('templateId','templateId');}};req.onsuccess=function(){resolve(req.result)};req.onerror=function(){reject(req.error)};});return dbPromise;}
  function tx(mode,fn){return open().then(function(db){return new Promise(function(resolve,reject){var t=db.transaction(STORE,mode),s=t.objectStore(STORE),result;try{result=fn(s);}catch(e){reject(e);return;}t.oncomplete=function(){resolve(result&&result.result!==undefined?result.result:result)};t.onerror=function(){reject(t.error)};t.onabort=function(){reject(t.error||new Error('Transacción cancelada'))};});});}
  function uid(){return 'ep_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
  function cleanMedia(media){return (media||[]).map(function(m){return {type:m.type||'image',url:m.url||'',name:m.name||'',source:m.source||'user',size:m.size||0,width:m.width||0,height:m.height||0,duration:m.duration||0};});}
  function normalize(p){var now=new Date().toISOString();return {id:p.id||uid(),name:String(p.name||'Proyecto sin título').slice(0,120),templateId:String(p.templateId||''),templateKind:p.templateKind==='blueprint'?'blueprint':'scroll',templateVersion:p.templateVersion||'2.2.0-phase1',config:p.config||{},media:cleanMedia(p.media),responsive:p.responsive||{},seo:p.seo||{},createdAt:p.createdAt||now,updatedAt:now,lastOpenedAt:p.lastOpenedAt||now,thumbnail:p.thumbnail||'',status:p.status||'draft'};}
  function save(project){var p=normalize(project);return tx('readwrite',function(s){return s.put(p)}).then(function(){return p});}
  function get(id){return tx('readonly',function(s){return s.get(id)});}
  function list(){return open().then(function(db){return new Promise(function(resolve,reject){var t=db.transaction(STORE,'readonly'),s=t.objectStore(STORE),r=s.getAll();r.onsuccess=function(){resolve((r.result||[]).sort(function(a,b){return String(b.updatedAt).localeCompare(String(a.updatedAt))}))};r.onerror=function(){reject(r.error)}});});}
  function remove(id){return tx('readwrite',function(s){return s.delete(id)});}
  function duplicate(id,name){return get(id).then(function(p){if(!p)throw new Error('Proyecto no encontrado');delete p.id;p.name=name||p.name+' — copia';p.createdAt=null;p.updatedAt=null;return save(p)});}
  function exportJSON(id){return get(id).then(function(p){if(!p)throw new Error('Proyecto no encontrado');return JSON.stringify(p,null,2)});}
  function importJSON(text){var p=JSON.parse(text);delete p.id;p.name=(p.name||'Proyecto importado')+' — importado';return save(p);}
  function Autosave(options){this.delay=(options&&options.delay)||800;this.onStatus=(options&&options.onStatus)||function(){};this.timer=null;this.project=null;}
  Autosave.prototype.setProject=function(p){this.project=p;};
  Autosave.prototype.schedule=function(p){var self=this;this.project=p||this.project;if(!this.project)return;clearTimeout(this.timer);this.onStatus('pending');this.timer=setTimeout(function(){self.onStatus('saving');save(self.project).then(function(saved){self.project=saved;self.onStatus('saved',saved)}).catch(function(e){self.onStatus('error',e)});},this.delay);};
  Autosave.prototype.flush=function(){clearTimeout(this.timer);if(!this.project)return Promise.resolve(null);this.onStatus('saving');var self=this;return save(this.project).then(function(saved){self.project=saved;self.onStatus('saved',saved);return saved}).catch(function(e){self.onStatus('error',e);throw e});};
  EP.ProjectStoreLocal={open:open,save:save,get:get,list:list,remove:remove,duplicate:duplicate,exportJSON:exportJSON,importJSON:importJSON,Autosave:Autosave,normalize:normalize};
})();
