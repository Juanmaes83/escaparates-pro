(function(){
  'use strict';
  var KEY = 'EP_PUZZLE_ASSEMBLY_STUDIO_PRO_V1';

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function defaults(){ return clone(window.AssemblyConfig); }
  function load(){
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      return Object.assign(defaults(), JSON.parse(raw));
    } catch (e) {
      return defaults();
    }
  }
  function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function reset(){ localStorage.removeItem(KEY); return defaults(); }
  function download(state){
    var blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'puzzle-assembly-studio-pro.json';
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
