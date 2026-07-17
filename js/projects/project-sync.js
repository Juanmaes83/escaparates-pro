(function(){
  'use strict';
  window.EP=window.EP||{};
  var DB='escaparates-pro-sync';var VERSION=1;var STORE='queue';var dbp;
  function open(){if(dbp)return dbp;dbp=new Promise(function(resolve,reject){var r=indexedDB.open(DB,VERSION);r.onupgradeneeded=function(){var db=r.result;if(!db.objectStoreNames.contains(STORE)){var s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('createdAt','createdAt');}};r.onsuccess=function(){resolve(r.result)};r.onerror=function(){reject(r.error)};});return dbp;}
  function all(){return open().then(function(db){return new Promise(function(resolve,reject){var r=db.transaction(STORE,'readonly').objectStore(STORE).getAll();r.onsuccess=function(){resolve((r.result||[]).sort(function(a,b){return a.createdAt-b.createdAt}) )};r.onerror=function(){reject(r.error)}});});}
  function put(item){return open().then(function(db){return new Promise(function(resolve,reject){var t=db.transaction(STORE,'readwrite');t.objectStore(STORE).put(item);t.oncomplete=function(){resolve(item)};t.onerror=function(){reject(t.error)}});});}
  function del(id){return open().then(function(db){return new Promise(function(resolve,reject){var t=db.transaction(STORE,'readwrite');t.objectStore(STORE).delete(id);t.oncomplete=resolve;t.onerror=function(){reject(t.error)}});});}
  function uid(){return 'sync_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
  function Sync(options){options=options||{};this.onStatus=options.onStatus||function(){};this.running=false;this.online=navigator.onLine;this.boundOnline=this.flush.bind(this);this.boundOffline=this.handleOffline.bind(this);addEventListener('online',this.boundOnline);addEventListener('offline',this.boundOffline);}
  Sync.prototype.handleOffline=function(){this.online=false;this.onStatus('offline')};
  Sync.prototype.enqueue=function(operation){var item={id:uid(),operation:operation,createdAt:Date.now(),attempts:0};var self=this;return put(item).then(function(){self.onStatus('pending');if(navigator.onLine)self.flush();return item});};
  Sync.prototype.execute=async function(item){var op=item.operation,api=EP.ProjectClient.api;if(op.type==='create')return api.create(op.payload);if(op.type==='update')return api.update(op.projectId,op.payload,op.revision);if(op.type==='delete')return api.remove(op.projectId);if(op.type==='publish')return api.publish(op.projectId,op.payload);if(op.type==='unpublish')return api.unpublish(op.projectId);throw new Error('Operación de sincronización desconocida: '+op.type);};
  Sync.prototype.flush=async function(){if(this.running||!navigator.onLine||!EP.ProjectClient.hasSession())return;this.running=true;this.online=true;this.onStatus('syncing');try{var items=await all();for(var i=0;i<items.length;i++){var item=items[i];try{var result=await this.execute(item);await del(item.id);this.onStatus('synced',result,item.operation);}catch(err){item.attempts=(item.attempts||0)+1;item.lastError={message:err.message,status:err.status,code:err.code,at:Date.now()};await put(item);if(err.status===409||err.status===412){this.onStatus('conflict',err,item.operation);break;}if(!navigator.onLine||err.status===0){this.onStatus('offline',err);break;}if(item.attempts>=5){this.onStatus('error',err,item.operation);break;}}}if((await all()).length===0)this.onStatus('synced');else if(navigator.onLine)this.onStatus('pending');}finally{this.running=false;}};
  Sync.prototype.pending=all;
  Sync.prototype.destroy=function(){removeEventListener('online',this.boundOnline);removeEventListener('offline',this.boundOffline)};
  EP.ProjectSync={Sync:Sync,all:all};
})();
