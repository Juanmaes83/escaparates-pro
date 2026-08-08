const {chromium}=require('playwright');
const fs=require('fs');
const assert=require('assert');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1720,height:980}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/labs/interactive-boards-source/casebook-pro-v3-fashion-lab/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.CasebookFashionStability&&window.CasebookProV3&&document.querySelector('.stage iframe')?.contentWindow?.CasebookPro?.fashion,{timeout:20000});
  await page.waitForTimeout(4500);
  const first=await page.evaluate(()=>{
    const shell=getComputedStyle(document.querySelector('#esShell'));
    const a=document.querySelector('.stage iframe')?.contentWindow?.CasebookPro;
    return {
      shellBg:shell.backgroundColor,
      shellImage:shell.backgroundImage,
      stability:window.CasebookFashionStability?.getState?.(),
      fashion:a?.fashion?.getState?.(),
      stats:a?.fashion?.stats?.(),
      world:window.CasebookProV3?.getWorld?.(),
      itemCount:a?.exportState?.()?.items?.length||0
    };
  });
  assert(first.stability,'stability API missing');
  assert.equal(first.stability.legacyDirectorStopped,true,'legacy director still running');
  assert(first.shellBg==='rgba(0, 0, 0, 0)'||first.shellBg==='transparent','shell is not transparent: '+first.shellBg);
  assert.equal(first.shellImage,'none','shell has background image: '+first.shellImage);
  assert(first.stats?.meshes>20,'scene meshes missing');
  assert(first.itemCount>=8,'starter did not populate initial Fashion dataset');
  assert.equal(first.world?.name,'AFTER DARK / FW26','world starter name not persisted');
  await page.screenshot({path:process.env.GITHUB_WORKSPACE+'/qa-stability/01-after-4s.png',animations:'disabled'});
  await page.waitForTimeout(5000);
  const second=await page.evaluate(()=>{
    const shell=getComputedStyle(document.querySelector('#esShell'));
    const a=document.querySelector('.stage iframe')?.contentWindow?.CasebookPro;
    return {shellBg:shell.backgroundColor,stats:a?.fashion?.stats?.(),items:a?.exportState?.()?.items?.length||0,world:window.CasebookProV3?.getWorld?.(),stability:window.CasebookFashionStability?.getState?.()};
  });
  assert(second.stats?.meshes>20,'scene disappeared after stability window');
  assert(second.items>=8,'items disappeared after stability window');
  assert.equal(second.world?.name,'AFTER DARK / FW26');
  assert(second.shellBg==='rgba(0, 0, 0, 0)'||second.shellBg==='transparent');
  await page.screenshot({path:process.env.GITHUB_WORKSPACE+'/qa-stability/02-after-9s.png',animations:'disabled'});
  await page.click('#esAddSpace');
  await page.waitForTimeout(1000);
  const afterAdd=await page.evaluate(()=>({world:window.CasebookProV3?.getWorld?.(),stats:document.querySelector('.stage iframe')?.contentWindow?.CasebookPro?.fashion?.stats?.()}));
  assert(afterAdd.world?.chapters?.length>=2,'Add Space failed');
  assert(afterAdd.stats?.meshes>20,'Pearl scene not reconciled after Add Space');
  await page.click('[data-es-chapter]');
  await page.waitForTimeout(1000);
  const afterSwitch=await page.evaluate(()=>({world:window.CasebookProV3?.getWorld?.(),stats:document.querySelector('.stage iframe')?.contentWindow?.CasebookPro?.fashion?.stats?.()}));
  assert(afterSwitch.stats?.meshes>20,'Pearl scene not reconciled after Chapter switch');
  fs.writeFileSync(process.env.GITHUB_WORKSPACE+'/qa-stability/state.json',JSON.stringify({first,second,afterAdd,afterSwitch,errors},null,2));
  assert.equal(errors.length,0,errors.join(' | '));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});