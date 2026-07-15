(function(){
  'use strict';
  window.EP=window.EP||{};
  var DEFAULT_API='https://escaparates-pro-api-staging-staging.up.railway.app';
  function validBase(value){try{var u=new URL(String(value||''));return u.protocol==='https:'||u.hostname==='localhost'||u.hostname==='127.0.0.1';}catch(_e){return false;}}
  function runtimeBase(){
    var params=new URLSearchParams(location.search||'');
    var fromQuery=params.get('api');
    if(fromQuery&&validBase(fromQuery)){localStorage.setItem('ep.apiBaseUrl',fromQuery.replace(/\/+$/,''));}
    var configured=(window.EP_API_BASE_URL||localStorage.getItem('ep.apiBaseUrl')||DEFAULT_API);
    return validBase(configured)?configured.replace(/\/+$/,''):DEFAULT_API;
  }
  function apiBase(){return runtimeBase();}
  function setApiBase(value){if(!validBase(value))throw new Error('La URL de la API debe ser HTTPS.');localStorage.setItem('ep.apiBaseUrl',String(value).replace(/\/+$/,''));return apiBase();}
  function token(){return localStorage.getItem('ep.refreshToken')||'';}
  async function request(path,options){
    options=options||{};
    var headers=Object.assign({'Content-Type':'application/json'},options.headers||{});
    if(token())headers.Authorization='Bearer '+token();
    var res=await fetch(apiBase()+path,Object.assign({},options,{headers:headers}));
    var body=null;try{body=await res.json();}catch(_e){}
    if(!res.ok){var err=new Error((body&&body.error&&body.error.message)||('HTTP '+res.status));err.status=res.status;err.code=body&&body.error&&body.error.code;err.payload=body;throw err;}
    return body;
  }
  function qs(params){var s=new URLSearchParams();Object.keys(params||{}).forEach(function(k){if(params[k]!==undefined&&params[k]!==null&&params[k]!=='')s.set(k,params[k]);});var q=s.toString();return q?'?'+q:'';}
  var api={
    list:function(params){return request('/v1/projects'+qs(params),{method:'GET'});},
    get:function(id){return request('/v1/projects/'+encodeURIComponent(id),{method:'GET'});},
    create:function(data){return request('/v1/projects',{method:'POST',body:JSON.stringify(data)});},
    update:function(id,data,revision){return request('/v1/projects/'+encodeURIComponent(id),{method:'PATCH',headers:revision!==undefined?{'If-Match':String(revision)}:{},body:JSON.stringify(data)});},
    remove:function(id){return request('/v1/projects/'+encodeURIComponent(id),{method:'DELETE'});},
    duplicate:function(id,data){return request('/v1/projects/'+encodeURIComponent(id)+'/duplicate',{method:'POST',body:JSON.stringify(data||{})});},
    archive:function(id,archived){return request('/v1/projects/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({archived:Boolean(archived)})});},
    versions:function(id){return request('/v1/projects/'+encodeURIComponent(id)+'/versions',{method:'GET'});},
    createVersion:function(id,data){return request('/v1/projects/'+encodeURIComponent(id)+'/versions',{method:'POST',body:JSON.stringify(data||{})});},
    restoreVersion:function(id,versionId){return request('/v1/projects/'+encodeURIComponent(id)+'/versions/'+encodeURIComponent(versionId)+'/restore',{method:'POST'});},
    publish:function(id,data){return request('/v1/projects/'+encodeURIComponent(id)+'/publish',{method:'POST',body:JSON.stringify(data||{})});},
    unpublish:function(id){return request('/v1/projects/'+encodeURIComponent(id)+'/publish',{method:'DELETE'});},
    getUpload:function(id,data){return request('/v1/projects/'+encodeURIComponent(id)+'/assets',{method:'POST',body:JSON.stringify(data)});},
    completeAsset:function(id,assetId,data){return request('/v1/projects/'+encodeURIComponent(id)+'/assets/'+encodeURIComponent(assetId)+'/complete',{method:'POST',body:JSON.stringify(data||{})});},
    deleteAsset:function(id,assetId){return request('/v1/projects/'+encodeURIComponent(id)+'/assets/'+encodeURIComponent(assetId),{method:'DELETE'});}
  };
  EP.ProjectClient={request:request,apiBase:apiBase,setApiBase:setApiBase,hasSession:function(){return Boolean(token());},api:api};
})();
