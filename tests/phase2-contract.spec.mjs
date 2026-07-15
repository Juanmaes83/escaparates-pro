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
console.log('Phase 2 contracts OK');
