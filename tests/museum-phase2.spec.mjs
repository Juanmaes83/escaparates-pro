import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const BASE='/labs/immersive-worlds/index.html';
const evidence='tests/test-results/museum-phase2/evidence';
const rail=(page,id)=>page.locator(`button.st-dom[data-domain="${id}"]`);
async function ready(page){
  const errors=[];page.on('pageerror',(e)=>errors.push(String(e)));page.on('console',(m)=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`${BASE}?portalVariant=D&authoring=1`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.iwReady==='true',null,{timeout:60000});
  await page.waitForFunction(()=>document.documentElement.dataset.museumPhase2==='ready'&&document.documentElement.dataset.museumPhase2Hardening==='ready',null,{timeout:20000});
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});
  return errors;
}
async function settle(page){await page.waitForFunction(()=>document.documentElement.dataset.iwReady==='true'&&document.documentElement.dataset.museumPhase2==='ready'&&document.documentElement.dataset.museumPhase2Hardening==='ready',null,{timeout:60000});}
async function shot(page,name){const client=await page.context().newCDPSession(page);try{const s=await client.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});await fs.writeFile(`${evidence}/${name}`,Buffer.from(s.data,'base64'));}finally{await client.detach();}}
async function noHorizontalOverflow(page, selector){return page.locator(selector).evaluate((el)=>({client:el.clientWidth,scroll:el.scrollWidth,ok:el.scrollWidth<=el.clientWidth+2}));}
test.beforeAll(async()=>fs.mkdir(evidence,{recursive:true}));

test('Museum Phase 2 closure — integration, UX hardening and reversible runtime',async({page})=>{
  await page.setViewportSize({width:1600,height:1000});const errors=await ready(page);

  // VISITOR COMPACT MODE: capability summary first, details on demand.
  await rail(page,'visitor').click();
  for(const id of ['P2-MEMORY','P2-RESOURCES','P2-LANG','P2-SHOP','P2-SUPPORT']){
    const card=page.locator(`[data-capability="${id}"]`);await expect(card).toBeVisible();await expect(card.locator('.p1-cap__body')).toBeHidden();
  }
  await page.locator('[data-capability="P2-MEMORY"] [data-p2h-toggle]').click();
  await expect(page.locator('[data-capability="P2-MEMORY"] .p1-cap__body')).toBeVisible();
  await shot(page,'01-visitor-compact-capabilities.png');

  // ORIENTATION ENTER → USE → EXIT → RESUME.
  const mapPreview=page.getByRole('button',{name:'Previsualizar mapa',exact:true});await expect(mapPreview).toBeVisible();await mapPreview.click();
  await expect(page.locator('#p2-previewbar')).toContainText('ORIENTACIÓN');await expect(page.locator('#st')).toBeHidden();
  await page.locator('[data-p2-return]').click();await expect(page.locator('#st')).toBeVisible();await expect(rail(page,'visitor')).toHaveClass(/is-on/);

  // CONTENT WORKSPACE V2: authoring measure is usable and cannot overflow horizontally.
  await rail(page,'content').click();
  for(const id of ['P2-ARTISTS','P2-DOCS','P2-LANG-MODEL'])await expect(page.locator(`[data-capability="${id}"]`)).toBeVisible();
  let overflow=await noHorizontalOverflow(page,'.p2-unified-workspace');expect(overflow.ok,`content overflow ${overflow.scroll}/${overflow.client}`).toBeTruthy();
  await page.locator('[data-p2-add-artist]').click();
  await page.locator('[data-p2-add-doc]').click();
  const artistRow=page.locator('[data-capability="P2-ARTISTS"] .p2-row').first();
  const docRow=page.locator('[data-capability="P2-DOCS"] .p2-row').first();
  await artistRow.locator('[data-p2-path$=".name"]').fill('Elena Marín');
  await artistRow.locator('[data-p2-path$=".nationality"]').fill('Española');
  await artistRow.locator('textarea').fill('Artista dedicada a paisaje, materia y memoria mediterránea.');
  await artistRow.locator('[data-p2h-portrait]').fill('https://example.com/elena-marin.jpg');
  await artistRow.locator('[data-p2-path$=".website"]').fill('https://example.com/elena');
  await docRow.locator('[data-p2-path$=".title"]').fill('Catálogo de Horizontes');
  await docRow.locator('[data-p2-path$=".type"]').fill('CATALOGUE');
  await docRow.locator('[data-p2-path$=".url"]').fill('https://example.com/catalogo.pdf');
  await expect(page.locator('.p2h-lang-matrix')).toBeVisible();
  overflow=await noHorizontalOverflow(page,'.p2-unified-workspace');expect(overflow.ok,`content post-edit overflow ${overflow.scroll}/${overflow.client}`).toBeTruthy();
  await shot(page,'02-content-workspace-v2.png');

  // BUILDER: room accessibility provides declared, non-assumptive route semantics.
  await rail(page,'build').click();
  const roomButton=page.locator('[data-node]').filter({hasText:'Galería A'}).first();await roomButton.click();
  await expect(page.getByText('Accesibilidad de la sala')).toBeVisible();
  await page.locator('[data-p2h-room-stepfree]').selectOption('true');
  const seat=page.locator('[data-p2h-room-a11y="seating"]');if(!(await seat.isChecked()))await seat.check();
  const quiet=page.locator('[data-p2h-room-a11y="quiet"]');if(!(await quiet.isChecked()))await quiet.check();

  // ARTIST → ARTWORK and DOCUMENT → ENTITY connections through the real contextual editor.
  await page.getByRole('button',{name:'Horizonte interrumpido Obra',exact:true}).click();
  await expect(page.getByText('Presentación física')).toBeVisible();await expect(page.getByText('Autor y documentación')).toBeVisible();
  await page.locator('[data-p2-artist-link]').selectOption({index:1});
  const docLink=page.locator('[data-p2-doc-link]').first();if(!(await docLink.isChecked()))await docLink.check();
  await shot(page,'03-builder-semantic-links.png');

  // EXPERIENCE WORKSPACE V2: no clipping and route actually consumes room semantics.
  await rail(page,'experience').click();
  await expect(page.locator('[data-capability="P2-ACCESSIBLE-ROUTE"]')).toBeVisible();await expect(page.locator('[data-capability="P2-PERSONALIZE"]')).toBeVisible();
  overflow=await noHorizontalOverflow(page,'.p2-unified-workspace');expect(overflow.ok,`experience overflow ${overflow.scroll}/${overflow.client}`).toBeTruthy();
  const requireSeating=page.locator('[data-p2-check="experience.accessibleRoute.requireSeating"]');if(!(await requireSeating.isChecked()))await requireSeating.check();
  await page.locator('[data-p2-calc-route]').click();await expect(page.locator('.p2-route')).toBeVisible();await expect(page.locator('.p2-route')).toContainText('Galería A');
  await shot(page,'04-experience-workspace-v2.png');

  // VISITOR PREVIEW: linked artist + document are visible to the visitor; favorite is truly clickable.
  await rail(page,'visitor').click();
  await page.getByRole('button',{name:'Probar como visitante',exact:true}).click();await expect(page.locator('#p2-previewbar')).toContainText('VISITANTE');
  await page.evaluate(()=>{
    const studio=window.__IW_STUDIO,runtime=window.__IW.runtime;
    const id=Object.entries(studio.config.entities).find(([,e])=>e.artistId)?.[0];
    const work=runtime.store.entities.find((e)=>e.id===id);
    if(work){if(work.spaceId!==runtime.state.activeSpaceId)runtime.state.enterSpace(work.spaceId);runtime.state.setFocus(work.id);window.__IW.hud.update();window.__IW.hud._showDetail?.(work.id);}
  });
  await expect(page.locator('.iw-p2h-context')).toContainText('Elena Marín');
  await expect(page.locator('.iw-p2h-context')).toContainText('Catálogo de Horizontes');
  const favorite=page.locator('[data-p2-favorite]');await expect(favorite).toBeVisible();await expect(favorite).toHaveAttribute('data-p2h-ready','true');await favorite.click({timeout:15000});
  const favoriteCount=await page.evaluate(()=>JSON.parse(localStorage.getItem('iw.museum.visitor.memory.v1')||'{}').favorites?.length||0);expect(favoriteCount).toBeGreaterThan(0);
  await page.locator('[data-p2-return]').click();await expect(page.locator('#st')).toBeVisible();await expect(rail(page,'visitor')).toHaveClass(/is-on/);

  // Cross-session memory survives reload and remains separate from authored project data.
  await page.reload({waitUntil:'domcontentloaded'});await settle(page);
  const persistedFavoriteCount=await page.evaluate(()=>JSON.parse(localStorage.getItem('iw.museum.visitor.memory.v1')||'{}').favorites?.length||0);expect(persistedFavoriteCount).toBe(favoriteCount);

  // PUBLISH: canonical schema and round-trip remain intact after the hardening pass.
  await rail(page,'publish').click();await expect(page.getByRole('heading',{name:'Publicar',exact:true})).toBeVisible();
  await page.locator('[data-p2-roundtrip]').click();await expect(page.locator('[data-p2-roundtrip-status]')).toContainText('Round-trip correcto');
  expect(await page.evaluate(()=>window.__IW_STUDIO.config.schemaVersion)).toBe(3);
  await shot(page,'05-publish-roundtrip-closure.png');

  expect(errors.filter((x)=>!x.includes('favicon')&&!x.includes('api.qrserver.com')&&!x.includes('example.com/elena-marin.jpg'))).toEqual([]);
});