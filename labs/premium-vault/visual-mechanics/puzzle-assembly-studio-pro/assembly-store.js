(function(){
  'use strict';

  var KEY = 'EP_ARMOR_REVEAL_SCROLL_STUDIO_PRO_V2';
  var LEGACY_KEYS = [
    'EP_PUZZLE_ASSEMBLY_STUDIO_PRO_V1'
  ];

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function defaults(){ return clone(window.AssemblyConfig); }
  function isObject(v){ return v && typeof v === 'object' && !Array.isArray(v); }
  function merge(base, saved){
    if (!isObject(saved)) return base;
    var out = clone(base);
    Object.keys(saved).forEach(function(k){
      if (isObject(saved[k]) && isObject(out[k])) out[k] = merge(out[k], saved[k]);
      else if (k in out) out[k] = saved[k];
    });
    return out;
  }
  function isCompatible(state){
    return !!(
      state &&
      state.meta &&
      state.meta.id === 'armor-reveal-scroll-studio-pro' &&
      state.motion &&
      Array.isArray(state.pieces) &&
      state.assets &&
      state.assets.baseUrl
    );
  }
  function load(){
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        LEGACY_KEYS.forEach(function(k){ localStorage.removeItem(k); });
        return defaults();
      }
      var parsed = JSON.parse(raw);
      if (!isCompatible(parsed)) return defaults();
      return merge(defaults(), parsed);
    } catch (e) {
      return defaults();
    }
  }
  function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function reset(){
    localStorage.removeItem(KEY);
    LEGACY_KEYS.forEach(function(k){ localStorage.removeItem(k); });
    return defaults();
  }
  function download(state){
    var blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'armor-reveal-scroll-studio-pro.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 500);
  }
  function readFile(file){
    return new Promise(function(resolve,reject){
      var reader = new FileReader();
      reader.onload = function(){ resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  window.AssemblyStore = { load:load, save:save, reset:reset, download:download, readFile:readFile };
})();
