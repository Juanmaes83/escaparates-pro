import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const BASE='/labs/immersive-worlds/index.html';
const evidence='tests/test-results/museum-phase2/evidence';
async function ready(page){
  const errors=[];page.on('pageerror',(e)=>errors.push(String(e)));page.on('console',(m)=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`${BASE}?portalVariant=D&authoring=1`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.iwReady==='true',null,{timeout:60000});
  await page.waitForFunction(()=>document.documentElement.dataset.museumPhase2==='ready',null,{timeout:15000});
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});
  return errors;
}
async function shot(page,name){const client=await page.context().newCDPSession(page);try{const s=await client.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});await fs.writeFile(`${evidence}/${name}`,Buffer.from(s.data,'base64'));}finally{await client.detach();}}
test.beforeAll(async()=>fs.mkdir(evidence,{recursive:true}));

test('Museum Phase 2 — navigation contract, schema 3 and six capability systems',async({page})=>{
  await page.setViewportSize({width:1600,height:1000});const errors=await ready(page);

  // Visitor capability system.
  await page.locator('[data-domain="visitor"]').click();
  for(const id of ['P2-MEMORY','P2-RESOURCES','P2-LANG','P2-SHOP','P2-SUPPORT'])await expect(page.locator(`[data-capability="${id}"]`)).toBeVisible();
  await shot(page,'01-visitor-capability-systems.png');

  // Preview is reversible and resumes exact authoring context.
  await page.locator('[data-p1-action="preview-visit"]').click();
  await expect(page.locator('#p2-previewbar')).toBeVisible();
  await expect(page.locator('#st')).toBeHidden();
  await expect(page.locator('[data-p2-return]')).toBeVisible();
  await page.locator('[data-p2-return]').click();
  await expect(page.locator('#st')).toBeVisible();
  await expect(page.locator('[data-domain="visitor"]')).toHaveClass(/is-on/);
  await expect(page.locator('[data-capability="P2-MEMORY"]')).toBeVisible();

  // Content system: artists, documents, multilingual model.
  await page.locator('[data-domain="content"]').click();
  for(const id of ['P2-ARTISTS','P2-DOCS','P2-LANG-MODEL'])await expect(page.locator(`[data-capability="${id}"]`)).toBeVisible();
  await page.locator('[data-p2-add-artist]').click();
  await page.locator('[data-p2-add-doc]').click();
  await expect(page.locator('[data-p2-remove-artist]')).toHaveCount(1);
  await expect(page.locator('[data-p2-remove-doc]')).toHaveCount(1);
  await shot(page,'02-content-artists-documents-languages.png');

  // Builder: presentation physical + canonical artist/document links remain contextual to artwork.
  await page.locator('[data-domain="build"]').click();
  await page.getByRole('button',{name:'Horizonte interrumpido Obra',exact:true}).click();
  await expect(page.getByText('Medidas físicas')).toBeVisible();
  await expect(page.getByText('Presentación física')).toBeVisible();
  await expect(page.getByText('Autor y documentación')).toBeVisible();
  await shot(page,'03-builder-physical-presentation.png');

  // Experience system: accessible routes + recommendation foundation.
  await page.locator('[data-domain="experience"]').click();
  await expect(page.locator('[data-capability="P2-ACCESSIBLE-ROUTE"]')).toBeVisible();
  await expect(page.locator('[data-capability="P2-PERSONALIZE"]')).toBeVisible();
  await page.locator('[data-p2-calc-route]').click();
  await expect(page.locator('.p2-route')).toBeVisible();

  // Publish is now an active capability/readiness workspace, including round-trip proof.
  await page.locator('[data-domain="publish"]').click();
  await expect(page.getByRole('heading',{name:'Publicar',exact:true})).toBeVisible();
  await expect(page.getByText('Export / Publish')).toBeVisible();
  await page.locator('[data-p2-roundtrip]').click();
  await expect(page.locator('[data-p2-roundtrip-status]')).toContainText('Round-trip correcto');
  const schema=await page.evaluate(()=>window.__IW_STUDIO.config.schemaVersion);
  expect(schema).toBe(3);
  await shot(page,'04-publish-readiness-roundtrip.png');

  expect(errors.filter((x)=>!x.includes('favicon')&&!x.includes('api.qrserver.com'))).toEqual([]);
});