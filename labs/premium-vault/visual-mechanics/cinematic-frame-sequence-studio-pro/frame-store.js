window.CinematicFrameStore = (function(){
  var KEY = 'ep.cinematic.frame.sequence.v1';
  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function load(){
    try { return JSON.parse(localStorage.getItem(KEY)) || clone(window.CinematicFrameSequenceDefault); }
    catch(e){ return clone(window.CinematicFrameSequenceDefault); }
  }
  function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function reset(){ localStorage.removeItem(KEY); return clone(window.CinematicFrameSequenceDefault); }
  function download(state){
    var blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cinematic-frame-sequence-project.json';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 500);
  }
  function importFile(file, cb){
    var reader = new FileReader();
    reader.onload = function(){
      try { cb(JSON.parse(reader.result)); }
      catch(e){ alert('El JSON no es válido. Revisa el archivo exportado desde este Studio.'); }
    };
    reader.readAsText(file);
  }
  return { load:load, save:save, reset:reset, download:download, importFile:importFile };
})();
