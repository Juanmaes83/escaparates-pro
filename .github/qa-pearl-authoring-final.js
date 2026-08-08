const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1720,height:980}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('http://127.0.0.1:4173/labs/interactive-boards-source/casebook-pro-v3-fashion-lab/index.html',{waitUntil:'domcontentloaded',timeout:30000});
 await p.waitForSelector('#esShell',{timeout:30000});
 await p.waitForFunction(()=>window.CasebookFashionStability?.getState?.().author?.mode==='author',{timeout:30000});
 await p.waitForTimeout(1200);
 const f=p.frames().find(x=>x!==p.mainFrame()); if(!f)throw new Error('iframe missing');
 const before=await p.evaluate(()=>window.CasebookFashionStability.getState());
 const legacy=await f.evaluate(()=>({rail:getComputedStyle(document.getElementById('rail')).display,inspector:getComputedStyle(document.getElementById('inspector')).display,hud:!!document.getElementById('pearlCameraHud')}));
 if(before.author.z<185||legacy.rail!=='none'||legacy.inspector!=='none'||!legacy.hud)throw new Error('author baseline failed '+JSON.stringify({before,legacy}));
 const z1=before.author.z;await f.locator('canvas').hover();await p.mouse.wheel(0,520);await p.waitForTimeout(350);const z2=(await p.evaluate(()=>window.CasebookFashionStability.getState())).author.z;if(!(z2>z1+20))throw new Error(`zoom-out failed ${z1}->${z2}`);
 await p.evaluate(()=>window.CasebookFashionStability.fitScene());await p.waitForTimeout(250);const z3=(await p.evaluate(()=>window.CasebookFashionStability.getState())).author.z;if(!(z3<z2&&z3>=185&&z3<=350))throw new Error(`fit failed ${z2}->${z3}`);
 await p.screenshot({path:'qa-authoring-final/01-fit.png',fullPage:true});
 await p.click('#esAddSpace');await p.waitForTimeout(900);if(await p.locator('[data-es-chapter]').count()<2)throw new Error('add space failed');await p.locator('[data-es-chapter]').last().click();await p.waitForTimeout(1200);
 const after=await p.evaluate(()=>window.CasebookFashionStability.getState());const legacy2=await f.evaluate(()=>({rail:getComputedStyle(document.getElementById('rail')).display,inspector:getComputedStyle(document.getElementById('inspector')).display}));if(after.author?.mode!=='author'||legacy2.rail!=='none'||legacy2.inspector!=='none')throw new Error('switch regression '+JSON.stringify({after,legacy2}));
 await p.screenshot({path:'qa-authoring-final/02-switch.png',fullPage:true});if(errs.length)throw new Error('page errors '+errs.join(' | '));console.log(JSON.stringify({ok:true,z1,z2,z3,legacy,after},null,2));await b.close();
})().catch(e=>{console.error(e);process.exit(1)});