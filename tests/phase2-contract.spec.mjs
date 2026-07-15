import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function load(path, context){vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:path});}
const context=vm.createContext({window:{},navigator:{clipboard:null},localStorage:{getItem(){return null}},URL,URLSearchParams,Blob,console,setTimeout,clearTimeout,fetch:async()=>({ok:true,blob:async()=>new Blob(['x'])})});
context.window=context;context.EP={};
load('js/export/export-validator.js',context);
load('js/export/html-export.js',context);
load('js/export/embed-export.js',context);
const base={name:'Villa Alicante',templateId:'luxury-real-estate-custom-pro',templateVersion:'2.2.0',config:{heroCtaUrl:'https://example.com'},media:[{name:'hero.mp4',url:'https://cdn.example.com/hero.mp4',status:'ready'}],seo:{title:'Villa Alicante'}};
assert.equal(context.EP.ExportValidator.validate(base,'<!doctype html>').ok,true);
assert.equal(context.EP.ExportValidator.validate({...base,media:[{url:'blob:https://x'}]},'').ok,false);
assert.equal(context.EP.ExportValidator.validate({...base,templateId:'luxury-real-estate-source-faithful'},'').ok,false);
const html=context.EP.HtmlExport.build(base,'<!doctype html><html><head><title>X</title></head><body></body></html>');
assert.match(html.html,/Villa Alicante/);
assert.doesNotMatch(html.html,/blob:/);
assert.match(context.EP.EmbedExport.iframe('https://escaparates.pro/p/villa'),/allowfullscreen/);

for(const file of ['labs/source-experiences/real-estate-storytelling-source-faithful/index.html','labs/source-experiences/product-storytelling-source-faithful/index.html','labs/source-experiences/luxury-real-estate-source-faithful/index.html'])assert.equal(fs.existsSync(file),true,file+' missing');
for(const file of ['projects.html','studio.html','publication.html','vercel.json','js/projects/product-integration.js','js/projects/project-library-page.js','js/projects/studio-route.js','js/projects/publication-page.js'])assert.equal(fs.existsSync(file),true,file+' missing');
const integration=fs.readFileSync('js/projects/product-integration.js','utf8');
assert.match(integration,/real-estate-storytelling-custom-pro/);
assert.match(integration,/product-storytelling-custom-pro/);
assert.match(integration,/luxury-real-estate-custom-pro/);
assert.doesNotMatch(integration,/source-faithful/);
const routes=JSON.parse(fs.readFileSync('vercel.json','utf8'));
assert.equal(routes.rewrites.some((r)=>r.source==='/p/:slug'),true);

const publishContext=vm.createContext({window:{},console});
publishContext.window=publishContext;
let captured=null;
function Manager(){}
Manager.prototype.publish=async function(project,payload){captured={project,payload};return project;};
publishContext.EP={ProjectManager:{Manager}};
load('js/projects/publish-snapshot-compat.js',publishContext);
const manager=new publishContext.EP.ProjectManager.Manager();
await manager.publish({name:'Villa',templateId:'luxury-real-estate-custom-pro'},{html:'<!doctype html><html></html>',slug:'villa'});
assert.equal(captured.payload.snapshot.html,'<!doctype html><html></html>');
assert.equal(captured.payload.html,undefined);
console.log('Phase 2 contracts OK');