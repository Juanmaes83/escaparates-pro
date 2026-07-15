import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173';
const url=`${base}/review/premium-storytelling-phase1-studio.html`;
const browser=await chromium.launch({headless:true});
const failures=[];
function check(value,message){if(!value)failures.push(message)}
async function desktop(){
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#viewportInfo');
 await page.waitForFunction(()=>document.querySelector('#previewLoading')?.classList.contains('hidden'));
 const panel=await page.locator('#editorScroll').evaluate(el=>({scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,overflowY:getComputedStyle(el).overflowY}));
 check(panel.scrollHeight>panel.clientHeight,'El panel no genera scroll vertical.');
 check(['auto','scroll'].includes(panel.overflowY),'El panel no tiene overflow vertical.');
 await page.locator('#editorScroll').evaluate(el=>{el.scrollTop=el.scrollHeight});
 check(await page.locator('#editorScroll').evaluate(el=>el.scrollTop>0),'No se puede desplazar el panel.');
 const view=await page.locator('#frameShell').evaluate(el=>({w:el.style.width,h:el.style.height,t:el.style.transform}));
 check(view.w==='1440px'&&view.h==='900px','Desktop no usa 1440 × 900.');
 check(view.t.includes('scale('),'Ajustar no aplica escala.');
 let inner=await page.locator('#preview').evaluate(f=>({body:f.contentDocument.body.scrollHeight,view:f.contentWindow.innerHeight}));
 check(inner.body>inner.view,'La landing inicial no tiene scroll interno.');
 await page.locator('#preview').evaluate(f=>f.contentWindow.scrollTo(0,600));
 check(await page.locator('#preview').evaluate(f=>f.contentWindow.scrollY>0),'La landing inicial no se desplaza.');
 await page.getByRole('button',{name:'Product Storytelling'}).click();
 await page.waitForFunction(()=>document.querySelector('#previewLoading')?.classList.contains('hidden'));
 check(await page.locator('#preview').evaluate(f=>f.contentDocument.querySelector('meta[name="ep-template-id"]')?.content==='product-storytelling-custom-pro'),'Product no confirma identidad.');
 await page.getByRole('button',{name:'Luxury Real Estate'}).click();
 await page.waitForFunction(()=>document.querySelector('#previewLoading')?.classList.contains('hidden'));
 check(await page.locator('#preview').evaluate(f=>f.contentDocument.querySelector('meta[name="ep-template-id"]')?.content==='luxury-real-estate-custom-pro'),'Luxury no reemplaza Product.');
 check(await page.locator('#media').getByText('Propiedad 1',{exact:false}).count()>0,'Luxury conserva slots de Product.');
 check(await page.locator('#fields textarea').count()>0,'Luxury no renderiza textarea.');
 inner=await page.locator('#preview').evaluate(f=>({body:f.contentDocument.body.scrollHeight,view:f.contentWindow.innerHeight}));
 check(inner.body>inner.view,'Luxury no tiene scroll interno.');
 await page.getByRole('button',{name:'Tablet'}).click();
 check(await page.locator('#frameShell').evaluate(el=>el.style.width)==='834px','Tablet no usa 834 px.');
 await page.getByRole('button',{name:'Móvil'}).click();
 check(await page.locator('#frameShell').evaluate(el=>el.style.width)==='390px','Móvil no usa 390 px.');
 await page.screenshot({path:'artifacts/phase1-desktop.png',fullPage:true});
 check(errors.length===0,`Errores JavaScript desktop: ${errors.join(' | ')}`);
 await page.close();
}
async function mobile(){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.mobile-mode');
 check(await page.locator('.mobile-mode').isVisible(),'No aparece Editar/Vista previa en móvil.');
 await page.getByRole('button',{name:'Vista previa'}).click();
 check(await page.locator('.app').evaluate(el=>el.classList.contains('mobile-preview')),'No se activa Vista previa móvil.');
 check(await page.locator('#previewPanel').isVisible(),'La preview queda oculta en móvil.');
 await page.getByRole('button',{name:'Editar'}).click();
 check(await page.locator('.app').evaluate(el=>el.classList.contains('mobile-edit')),'No se activa Editar móvil.');
 check(await page.locator('#editorPanel').isVisible(),'El editor queda oculto en móvil.');
 await page.screenshot({path:'artifacts/phase1-mobile.png',fullPage:true});
 check(errors.length===0,`Errores JavaScript móvil: ${errors.join(' | ')}`);
 await page.close();
}
await fs.mkdir('artifacts',{recursive:true});
try{await desktop();await mobile()}finally{await browser.close()}
if(failures.length){console.error('QA FAILED');failures.forEach((f,i)=>console.error(`${i+1}. ${f}`));process.exit(1)}
console.log('QA PASSED: Phase 1 Studio desktop and mobile checks completed.');