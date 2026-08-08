const { chromium } = require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1720,height:980}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/labs/interactive-boards-source/casebook-pro-v3-fashion-lab/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#esShell',{timeout:30000});
  await page.waitForFunction(()=>window.CasebookFashionStability?.getState?.().author?.mode==='author',{timeout:30000});
  await page.waitForTimeout(1800);
  const before=await page.evaluate(()=>window.CasebookFashionStability.getState());
  if(!before.author || before.author.z<185) throw new Error('Author camera did not fit scene: '+JSON.stringify(before));
  const frame=page.frames().find(f=>f!==page.mainFrame()); if(!frame) throw new Error('Casebook iframe missing');
  const legacy=await frame.evaluate(()=>({
    rail:getComputedStyle(document.getElementById('rail')).display,
    inspector:getComputedStyle(document.getElementById('inspector')).display,
    hud:!!document.getElementById('pearlCameraHud'),
    zones:typeof __v2!=='undefined'?__v2.zones.filter(z=>z.__mesh&&z.__mesh.visible).length:-1
  }));
  if(legacy.rail!=='none'||legacy.inspector!=='none'||legacy.zones>0||!legacy.hud) throw new Error('Legacy chrome isolation failed: '+JSON.stringify(legacy));
  const z1=before.author.z;
  await frame.locator('canvas').hover();
  await page.mouse.wheel(0,520);
  await page.waitForTimeout(350);
  const z2=(await page.evaluate(()=>window.CasebookFashionStability.getState())).author.z;
  if(!(z2>z1+20)) throw new Error(`Zoom-out failed z1=${z1} z2=${z2}`);
  await page.evaluate(()=>window.CasebookFashionStability.fitScene());
  await page.waitForTimeout(300);
  const z3=(await page.evaluate(()=>window.CasebookFashionStability.getState())).author.z;
  if(!(z3<z2 && z3>=185 && z3<=350)) throw new Error(`Fit Scene failed z2=${z2} z3=${z3}`);
  await page.screenshot({path:'qa-authoring/01-pearl-fit-scene.png',fullPage:true});
  await page.click('#esAddSpace'); await page.waitForTimeout(900);
  const chapters=await page.locator('[data-es-chapter]').count(); if(chapters<2) throw new Error('Add Space failed');
  await page.locator('[data-es-chapter]').last().click(); await page.waitForTimeout(1200);
  const after=await page.evaluate(()=>window.CasebookFashionStability.getState());
  const legacyAfter=await frame.evaluate(()=>({rail:getComputedStyle(document.getElementById('rail')).display,inspector:getComputedStyle(document.getElementById('inspector')).display,zones:typeof __v2!=='undefined'?__v2.zones.filter(z=>z.__mesh&&z.__mesh.visible).length:-1}));
  if(after.author?.mode!=='author'||legacyAfter.rail!=='none'||legacyAfter.inspector!=='none'||legacyAfter.zones>0) throw new Error('Chapter-switch regression: '+JSON.stringify({after,legacyAfter}));
  await page.screenshot({path:'qa-authoring/02-pearl-after-chapter-switch.png',fullPage:true});
  if(errors.length) throw new Error('Page errors: '+errors.join(' | '));
  console.log(JSON.stringify({ok:true,before,legacy,z1,z2,z3,after,legacyAfter},null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});