(function(){
  'use strict';
  if(!window.EP||!EP.ProjectManager||!EP.ProjectManager.Manager)return;
  var original=EP.ProjectManager.Manager.prototype.publish;
  EP.ProjectManager.Manager.prototype.publish=async function(project,payload){
    payload=Object.assign({},payload||{});
    if(payload.html&&!payload.snapshot){payload.snapshot=Object.assign({},project,{html:payload.html,published:null});delete payload.html;}
    var saved=await original.call(this,project,payload);
    if(saved&&saved.published&&saved.published.url&&/^\//.test(saved.published.url)){
      saved.published.url=new URL(saved.published.url,location.origin).href;
      if(EP.ProjectStoreLocal&&EP.ProjectStoreLocal.save)saved=await EP.ProjectStoreLocal.save(saved);
    }
    return saved;
  };
})();