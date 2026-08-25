window.LuxuryRealEstateStore = (function(){
  var DB_NAME = 'luxury-real-estate-studio-pro';
  var DB_VERSION = 1;
  var PROJECT_KEY = 'default';
  var dbPromise = null;
  function clone(obj){ return JSON.parse(JSON.stringify(obj || {})); }
  function openDb(){
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function(resolve,reject){
      if (!('indexedDB' in window)) return resolve(null);
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(){ var db=req.result; if(!db.objectStoreNames.contains('projects')) db.createObjectStore('projects',{keyPath:'id'}); if(!db.objectStoreNames.contains('media')) db.createObjectStore('media',{keyPath:'slot'}); };
      req.onsuccess = function(){ resolve(req.result); };
      req.onerror = function(){ reject(req.error); };
    });
    return dbPromise;
  }
  function tx(db, store, mode){ return db.transaction(store, mode).objectStore(store); }
  async function loadProject(defaults){
    var db = await openDb();
    if (!db) {
      try { return JSON.parse(localStorage.getItem(DB_NAME + ':project')) || clone(defaults); } catch(e){ return clone(defaults); }
    }
    return new Promise(function(resolve){
      var req = tx(db,'projects','readonly').get(PROJECT_KEY);
      req.onsuccess = function(){ resolve(req.result && req.result.data ? req.result.data : clone(defaults)); };
      req.onerror = function(){ resolve(clone(defaults)); };
    });
  }
  async function saveProject(data){
    var db = await openDb();
    if (!db) { localStorage.setItem(DB_NAME + ':project', JSON.stringify(data)); return; }
    return new Promise(function(resolve,reject){
      var req = tx(db,'projects','readwrite').put({ id: PROJECT_KEY, data: clone(data), updatedAt: new Date().toISOString() });
      req.onsuccess = function(){ resolve(); };
      req.onerror = function(){ reject(req.error); };
    });
  }
  async function saveMedia(slot, file){
    var db = await openDb();
    if (!db) return null;
    var record = { slot: slot, file: file, name: file.name, type: file.type, updatedAt: new Date().toISOString() };
    return new Promise(function(resolve,reject){
      var req = tx(db,'media','readwrite').put(record);
      req.onsuccess = function(){ resolve(record); };
      req.onerror = function(){ reject(req.error); };
    });
  }
  async function loadMedia(){
    var db = await openDb();
    if (!db) return {};
    return new Promise(function(resolve){
      var out = {};
      var req = tx(db,'media','readonly').openCursor();
      req.onsuccess = function(){ var cur=req.result; if(cur){ out[cur.value.slot]=cur.value; cur.continue(); } else resolve(out); };
      req.onerror = function(){ resolve(out); };
    });
  }
  async function reset(){
    var db = await openDb();
    localStorage.removeItem(DB_NAME + ':project');
    if (!db) return;
    await new Promise(function(resolve){ var req=tx(db,'projects','readwrite').delete(PROJECT_KEY); req.onsuccess=req.onerror=resolve; });
    await new Promise(function(resolve){ var req=tx(db,'media','readwrite').clear(); req.onsuccess=req.onerror=resolve; });
  }
  return { loadProject: loadProject, saveProject: saveProject, saveMedia: saveMedia, loadMedia: loadMedia, reset: reset, clone: clone };
})();
