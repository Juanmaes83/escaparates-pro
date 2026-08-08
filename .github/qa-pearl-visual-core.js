const {chromium}=require('playwright');
const fs=require('fs');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1720,height:980}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:4173/labs/interactive-boards-source/casebook-pro-v3-fashion-lab/index.html';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000}); await page.evaluate(()=>localStorage.clear()); await page.reload({waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.CasebookFashionStability&&window.CasebookProV3&&document.querySelector('.stage iframe')?.contentWindow?.CasebookPro?.fashion,{timeout:20000});
 await page.waitForTimeout(4500);
 const snap=()=>page.evaluate(()=>{const shell=getComputedStyle(document.querySelector('#esShell'));const a=document.querySelector('.stage iframe')?.contentWindow?.CasebookPro;return {shellBg:shell.backgroundColor,shellImage:shell.backgroundImage,stability:window.CasebookFashionStability?.getState?.(),stats:a?.fashion?.stats?.(),world:window.CasebookProV3?.getWorld?.(),itemCount:a?.exportState?.()?.items?.length||0}});
 const first=await snap();
 assert(first.stability,'stability API missing'); assert.equal(first.stability.legacyDirectorStopped,true,'legacy director still running'); assert(first.shellBg==='rgba(0, 0, 0, 0)'||first.shellBg==='transparent','shell covers canvas: '+first.shellBg); assert.equal(first.shellImage,'none'); assert(first.stats?.meshes>20,'Pearl scene not rendered');
 await page.screenshot({path:process.env.GITHUB_WORKSPACE+'/qa-stability/01-visible-4s.png',animations:'disabled'});
 await page.waitForTimeout(5500);
 const second=await snap(); assert(second.stats?.meshes>20,'Pearl scene disappeared after 10s'); assert(second.shellBg==='rgba(0, 0, 0, 0)'||second.shellBg==='transparent','shell became opaque');
 await page.screenshot({path:process.env.GITHUB_WORKSPACE+'/qa-stability/02-visible-10s.png',animations:'disabled'});
 await page.click('#esAddSpace'); await page.waitForTimeout(1400); const afterAdd=await snap(); assert(afterAdd.world?.chapters?.length>=2,'Add Space failed'); assert(afterAdd.stats?.meshes>20,'Pearl scene disappeared after Add Space');
 const chapters=page.locator('[data-es-chapter]'); if((await chapters.count())>=2){await chapters.first().click(); await page.waitForTimeout(1400)}
 const afterSwitch=await snap(); assert(afterSwitch.stats?.meshes>20,'Pearl scene disappeared after Chapter switch');
 await page.screenshot({path:process.env.GITHUB_WORKSPACE+'/qa-stability/03-visible-after-switch.png',animations:'disabled'});
 fs.writeFileSync(process.env.GITHUB_WORKSPACE+'/qa-stability/state.json',JSON.stringify({first,second,afterAdd,afterSwitch,errors},null,2)); assert.equal(errors.length,0,errors.join(' | ')); await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});