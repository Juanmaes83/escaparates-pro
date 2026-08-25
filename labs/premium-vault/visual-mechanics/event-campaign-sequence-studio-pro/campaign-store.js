(function(){
  var KEY = 'ep:event-campaign-sequence-studio-pro';
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function load(){
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : clone(window.EventCampaignConfig);
    } catch(e) { return clone(window.EventCampaignConfig); }
  }
  function save(state){
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e) {}
  }
  function reset(){
    try { localStorage.removeItem(KEY); } catch(e) {}
    return clone(window.EventCampaignConfig);
  }
  function download(state){
    var blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'event-campaign-sequence-project.json';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
  }
  function importFile(file, cb){
    var reader = new FileReader();
    reader.onload = function(){
      try { cb(JSON.parse(reader.result)); } catch(e) { alert('JSON no válido'); }
    };
    reader.readAsText(file);
  }
  window.EventCampaignStore = { load:load, save:save, reset:reset, download:download, importFile:importFile, clone:clone };
})();
