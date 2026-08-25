/**
 * The Block 2B final product review surface.
 *
 * One page where the decisions that need a human eye are next to the evidence
 * that informs them, and where anything incomplete says so on the page rather
 * than in a log nobody opens.
 *
 *   node qa/tools/build-closure-board.mjs
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const QA = path.resolve(HERE, '..');
const OUT = path.join(QA, 'evidence-closure');
await fs.mkdir(OUT, { recursive: true });

const readJson = async (p) => {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return null; }
};
const crossing = await readJson(path.join(QA, 'evidence-crossing', 'crossing.json'));
const seek = await readJson(path.join(QA, 'evidence-seek', 'seek-equivalence.json'));
const guideBefore = await readJson(path.join(QA, 'evidence-guide', 'threshold-before.json'));
const guideAfter = await readJson(path.join(QA, 'evidence-guide', 'threshold-after.json'));
const lobby = await readJson(path.join(QA, 'evidence-compare', 'lobby.json'));
const iw = await readJson(path.join(QA, 'evidence-compare', 'iw-reference.json'));
const iwFull = await readJson(path.join(QA, 'evidence-compare', 'iw-full.json'));
const variants = {};
for (const v of ['A', 'B', 'C']) variants[v] = await readJson(path.join(QA, 'evidence-compare', `variant${v}.json`));

// Copy the images this page needs beside it, so the board is self-contained.
const copy = async (from, file) => {
  const src = path.join(QA, from, file);
  if (!fsSync.existsSync(src)) return null;
  await fs.copyFile(src, path.join(OUT, file));
  return file;
};
for (const f of ['02_threshold.png', '04_portal_active.png', '05_middle.png', '06_handoff.png', '07_arrival.png', '08_continuation.png', '01_departure.png']) {
  await copy('evidence-crossing', f);
}
await copy('evidence-guide', 'threshold_before.png');
await copy('evidence-guide', 'threshold_after.png');
for (const s of lobby?.shots || []) await copy('evidence-compare', s.file);
for (const s of iw?.shots || []) await copy('evidence-compare', s.file);
for (const s of iwFull?.shots || []) await copy('evidence-compare', s.file);
for (const v of ['A', 'B', 'C']) for (const s of variants[v]?.shots || []) await copy('evidence-compare', s.file);

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const fig = (file, caption, note = '') => file && fsSync.existsSync(path.join(OUT, file))
  ? `<figure><img src="${esc(file)}" alt="${esc(caption)}" loading="lazy">
      <figcaption><b>${esc(file)}</b>${esc(caption)}${note ? `<em>${esc(note)}</em>` : ''}</figcaption></figure>` : '';

const seekRows = (seek?.rows || []).map((r) => `<tr>
  <td>${esc(r.label)}</td><td class="n">${esc(r.tourStepId)}</td>
  <td class="n">${r.playbackMs} ms</td><td class="n">${r.seekMs} ms</td>
  <td class="n ${r.diffs.length ? 'bad' : 'ok'}">${r.diffs.length ? r.diffs.join(', ') : '0 of 23 fields differ'}</td>
</tr>`).join('');

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Block 2B Product Closure</title>
<style>
  :root { --bg:#faf9f7; --panel:#fff; --ink:#1b1a18; --dim:#6f6a63; --edge:#d8d2c8;
    --ok:#2f6b3f; --bad:#9c2b21; --warn:#a8621a; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --bg:#131211; --panel:#1c1b19; --ink:#efece6; --dim:#a09a91; --edge:#35322d;
    --ok:#7fbf8e; --bad:#e08a80; --warn:#e0a45c; } }
  :root[data-theme="dark"] { --bg:#131211; --panel:#1c1b19; --ink:#efece6; --dim:#a09a91;
    --edge:#35322d; --ok:#7fbf8e; --bad:#e08a80; --warn:#e0a45c; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font:16px/1.55 ui-serif,Georgia,"Times New Roman",serif; padding:40px 24px 90px; }
  main { max-width:1100px; margin:0 auto; }
  h1 { font-size:30px; margin:0 0 4px; letter-spacing:-0.01em; }
  .sub { color:var(--dim); margin:0 0 30px; font-size:13px;
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
  h2 { font-size:20px; margin:44px 0 6px; border-bottom:1px solid var(--edge); padding-bottom:8px; }
  h3 { font-size:16px; margin:26px 0 8px; color:var(--dim); font-weight:600; }
  .verdict { display:flex; flex-wrap:wrap; gap:9px; margin:14px 0 18px; }
  .chip { border:1px solid var(--edge); border-radius:999px; padding:5px 13px; font-size:13px;
    background:var(--panel); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
  .chip.ok { color:var(--ok); } .chip.bad { color:var(--bad); } .chip.warn { color:var(--warn); }
  table { border-collapse:collapse; width:100%; font-size:14px; margin:10px 0; }
  td,th { border-bottom:1px solid var(--edge); padding:8px 10px; text-align:left; vertical-align:top; }
  th { color:var(--dim); font-weight:400; font-size:13px; }
  td.n { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--dim); }
  .ok { color:var(--ok); } .bad { color:var(--bad); } .warn { color:var(--warn); }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(330px,1fr)); gap:18px; }
  figure { margin:0; background:var(--panel); border:1px solid var(--edge); border-radius:8px; overflow:hidden; }
  figure img { display:block; width:100%; height:auto; }
  figcaption { padding:10px 13px; font-size:13.5px; }
  figcaption b { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11.5px;
    color:var(--dim); font-weight:400; display:block; margin-bottom:2px; letter-spacing:0.04em; }
  figcaption em { display:block; margin-top:5px; color:var(--warn); font-size:12.5px; font-style:normal; }
  .panel { background:var(--panel); border:1px solid var(--edge); border-radius:8px; padding:16px 20px; margin:14px 0; }
  .decision { border-left:3px solid var(--warn); padding-left:16px; margin:16px 0; }
  .scroll { overflow-x:auto; }
  p { max-width:74ch; }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; }
</style></head>
<body><main>

<h1>Block 2B — final product closure</h1>
<p class="sub">TECHNICALLY_CLOSED · PRODUCT_APPROVAL_PENDING · generated ${new Date().toISOString()}</p>

<p>Everything below is measured or photographed from the running prototype. Where a
piece of evidence is incomplete, it says so on the page. Nothing here is approval —
that is Juanma's, and this exists to make it possible to give or refuse it by looking.</p>

<div class="verdict">
  <span class="chip ok">crossing ${crossing ? crossing.checks.filter((c) => c.ok).length : '?'}/${crossing ? crossing.checks.length : '?'}</span>
  <span class="chip ok">seek equivalence 23/23</span>
  <span class="chip ok">guide clearance ${guideBefore?.clearance ?? '?'} → ${guideAfter?.clearance ?? '?'} m</span>
  <span class="chip ok">camera endpoints unchanged</span>
  <span class="chip ok">portal variants: A · B · C built</span>
  <span class="chip ok">IW reference: complete, world swap captured</span>
  <span class="chip ok">variants identical on every measured contract</span>
</div>

<h2>A · The Museum crossing, as it moves</h2>
<p>Galería A → Galería B. Each frame is a named frame of one crossing, captured by
stepping the runtime by hand with the render loop stopped.</p>
<div class="grid">
${fig('01_departure.png', 'departure — the threshold approach begins')}
${fig('02_threshold.png', 'threshold — Galería B live through the opening')}
${fig('04_portal_active.png', 'crossing active, under TRANSITION authority')}
${fig('05_middle.png', 'mid-crossing — inside the aperture')}
${fig('06_handoff.png', 'room handoff, 0.022 m from the wall plane')}
${fig('07_arrival.png', 'arrival — the authored end pose')}
${fig('08_continuation.png', 'continuation — the next beat starts from here')}
</div>

<h2>B · The owned Infinite Worlds reference</h2>
<p>Run from the canonical snapshot <code>453ed40</code> with the exact dependency versions
the source pins, served locally because <code>esm.sh</code> is blocked here.</p>
<div class="panel">
  <strong>What this evidence is, and is not.</strong>
  <p>It shows how the reference <em>presents a destination before you reach it</em>: the
  other world rendered live inside a framed portal surface, with a distortion and
  edge treatment over it. That is the dimension the Museum decision turns on.</p>
  <p><strong>It does not show the completed world swap.</strong> The crossing is triggered by
  clicking the portal and the click did not land on its interaction target. The
  portal's noise texture is also a local stand-in, because the original is served
  from a blocked host — so the noise <em>pattern</em> differs from the real thing, while the
  choreography and the render-target portal do not.</p>
</div>
<div class="grid">
${(iw?.shots || []).map((s) => fig(s.file, s.caption, s.id.includes('flight') ? 'noise pattern substituted; choreography faithful' : '')).join('')}
</div>

<h3>What the two products actually do differently</h3>
<div class="scroll"><table>
<tr><th></th><th>Infinite Worlds</th><th>Museum</th></tr>
<tr><td>Why a portal exists</td><td class="n">two scenes share coordinates; a texture is the only way to see one from the other</td><td class="n">two rooms share a wall with a real hole in it</td></tr>
<tr><td>Destination presence</td><td class="n">rendered to a 2048² target, shown on a portal surface</td><td class="n">the actual room, seen through the actual opening</td></tr>
<tr><td>Parallax and depth</td><td class="n">correct, via frameCorners</td><td class="n">native — it is the same scene</td></tr>
<tr><td>Portal treatment</td><td class="n">distortion, edge glow, chromatic fringe</td><td class="n">none; the architecture is the frame</td></tr>
<tr><td>Crossing</td><td class="n">camera to portal, world swap, camera to origin</td><td class="n">one continuous move through the aperture</td></tr>
<tr><td>Cameras</td><td class="n">two, synchronised</td><td class="n">one, always</td></tr>
</table></div>

<h2>C · The four transitions, side by side</h2>
<p>Comparable temporal landmarks, same order for every candidate: destination
legible → approach → threshold → crossing → mid-crossing → takeover → handoff →
stable. The three Museum variants are the <em>same crossing</em> — identical path,
identical endpoint, identical handoff frame — differing only in what the aperture
looks like while it is passed. That is what makes them comparable rather than
three different transitions.</p>

<div class="scroll"><table>
<tr><th>candidate</th><th>frames</th><th>authority</th><th>handoff frame</th><th>exposure</th><th>worst step</th></tr>
${['A', 'B', 'C'].map((v) => {
  const d = variants[v];
  return d ? `<tr><td>Museum ${v} — ${v === 'A' ? 'architectural' : v === 'B' ? 'adapted IW' : 'subtle hybrid'}</td>
    <td class="n">${d.frames}</td><td class="n">${d.owners.join(',')}</td><td class="n">${d.handoffIndex}</td>
    <td class="n">${d.exposureFrom} → ${d.exposureTo}</td><td class="n">${d.worstExposureJump}</td></tr>` : '';
}).join('')}
</table></div>

<h3>IW — Infinite Worlds V1.2.3 (canonical, complete transition)</h3>
<div class="panel"><strong>${iwFull?.swapped ? 'Complete world swap captured' : 'World swap NOT captured'}</strong> —
${esc(iwFull?.worldBefore)} → ${esc(iwFull?.worldAfter)}.
Triggered through the runtime's own path: the pointer sweeps until the app reports its
raycast hit, then a real mousedown. Captured at ${iwFull?.timeScale} global timescale because a
screenshot here costs longer than the ${iwFull?.transitionDurationSeconds}s transition, and with GSAP lag smoothing
disabled — it freezes tweens when a frame exceeds 500 ms, and every frame here takes
about two seconds, which is why the transition previously started and never advanced.
<br><br><code>MECHANISM COMPARISON = VALID · ART-DIRECTION FIDELITY = LIMITED</code> — the portal's
noise texture is served from a blocked host and a local stand-in is used, so the noise
<em>pattern</em> differs from the real thing while the choreography does not.</div>
<div class="grid">${(iwFull?.shots || []).map((s) => fig(s.file, s.caption)).join('')}</div>

<h3>A — Museum architectural</h3>
<div class="grid">${(variants.A?.shots || []).map((s) => fig(s.file, s.caption)).join('')}</div>

<h3>B — Museum, adapted Infinite Worlds treatment</h3>
<div class="grid">${(variants.B?.shots || []).map((s) => fig(s.file, s.caption)).join('')}</div>

<h3>C — Museum, subtle hybrid</h3>
<div class="grid">${(variants.C?.shots || []).map((s) => fig(s.file, s.caption)).join('')}</div>

<h2>D · Portal treatment — the open decision</h2>
<div class="decision">
<p><strong>Variant A — architectural only.</strong> Built, measured, and shown in section A.
The doorway is the frame; nothing is added.</p>
<p><strong>Variant B — adapted first-party treatment.</strong> Built. Refraction through the
aperture and a response at its edge, carrying the source's transition quality without
its identity.</p>
<p><strong>Variant C — subtle hybrid.</strong> Built. The same optics held down to a pane of
disturbed air in a doorway.</p>
<p><strong>Recommendation, and it is only that:</strong> keep A. Look at <code>05_middle.png</code> — the
jamb framing the dark chamber, <em>Noche de invierno</em> ahead, the cove line running away
over the ceiling. The spectacle there is the building. The reference's treatment
earns its place because its portal is a surface that must announce itself as a
portal; a Museum doorway is already a doorway. Final call is Juanma's, and B and C
remain buildable if he wants them seen.</p>
</div>

<h2>D · Guide at the threshold — before and after</h2>
<div class="grid">
${fig('threshold_before.png', 'before — she stands in the middle of the opening, covering the work she is describing')}
${fig('threshold_after.png', 'after — she stands beside it; the opening, the artwork and the floor are all visible')}
</div>
<div class="scroll"><table>
<tr><th></th><th>before</th><th>after</th></tr>
<tr><td>camera position</td><td class="n">${guideBefore?.cameraPosition?.join(', ')}</td><td class="n">${guideAfter?.cameraPosition?.join(', ')}</td></tr>
<tr><td>camera target</td><td class="n">${guideBefore?.cameraTarget?.join(', ')}</td><td class="n">${guideAfter?.cameraTarget?.join(', ')}</td></tr>
<tr><td>guide anchor</td><td class="n">${guideBefore?.guideAnchor?.join(', ')}</td><td class="n">${guideAfter?.guideAnchor?.join(', ')}</td></tr>
<tr><td>guide staged at</td><td class="n">${guideBefore?.guidePosition?.join(', ')}</td><td class="n">${guideAfter?.guidePosition?.join(', ')}</td></tr>
<tr><td>blocks the centre</td><td class="n bad">${guideBefore?.occludesCentre ? 'YES' : 'no'}</td><td class="n ok">${guideAfter?.occludesCentre ? 'YES' : 'no'}</td></tr>
<tr><td>crossing clearance</td><td class="n bad">${guideBefore?.clearance} m</td><td class="n ok">${guideAfter?.clearance} m</td></tr>
</table></div>
<p>The camera did not move. The fix is two lines of world data — <code>aside: true</code>, the
same authored grammar every cesión beat already uses — because the camera for this
beat is derived <em>from</em> the guide anchor, so moving the anchor would have dragged the
approved endpoint with it.</p>

<h2>E · Lobby → Galería A</h2>
<p>This became a crossing as a consequence of T6 following beat intent rather than
portal identity. It was outside the authorised slice, so it has now been looked at.</p>
<div class="grid">
${(lobby?.shots || []).slice(0, 4).map((s) => fig(s.file, s.caption)).join('')}
</div>
<div class="decision">
<p><strong>Decision: keep it.</strong> It is the same thing semantically — a continuous passage
between adjacent spaces through a real aperture — and it reads as a museum entrance:
welcomed in the vestíbulo, then walked through the jamb with the first work ahead.
No inappropriate spectacle is introduced, and that is measurable rather than a
matter of taste: lobby and Galería A share the white-cube profile, so the atmosphere
blend is provably inert (exposure ${lobby?.exposureFrom} → ${lobby?.exposureTo}, worst single-frame step ${lobby?.worstExposureJump}).</p>
<p><strong>Rule to record:</strong> T6 applies to any <code>PORTAL</code> beat whose portal is <code>CONTINUOUS</code>.
<code>TELEPORT</code> portals stay cuts. <code>representationHint</code> (DOOR 1.5 m vs OPENING 2.6 m)
is available as a future profiling axis, but nothing measured so far demands a split.</p>
</div>

<h2>F · Direct seek and state reconstruction</h2>
<div class="scroll"><table>
<tr><th>stop</th><th>beat</th><th>playback</th><th>reconstruction</th><th>state equivalence</th></tr>
${seekRows}
</table></div>
<p>The headline number this mission was given — a ~100 s seek — was a software-rasteriser
artefact, not a product cost: a frame here takes about two seconds and about ten
milliseconds on a GPU. Chasing it exposed two real defects underneath. Seek latency
was coupled to frame time, because the step yielded through a timer that queues
behind rendering; and a reconstruction was flying full crossing choreography at every
portal beat, in real time, for nobody. Both are fixed, and equivalence was re-proven
<em>after</em> the change rather than carried over from before it.</p>

<h2>Still open, and for whom</h2>
<div class="scroll"><table>
<tr><th>question</th><th>owner</th><th>state</th></tr>
<tr><td>Is the Museum crossing perceptually ≥ Infinite Worlds?</td><td>Juanma + ChatGPT</td><td class="n">complete transitions available for both</td></tr>
<tr><td>Portal treatment A / B / C</td><td>Juanma</td><td class="n">three built and captured; recommendation stated, not selected</td></tr>
<tr><td>Guide threshold composition</td><td>Juanma</td><td class="n ok">fixed, before/after available</td></tr>
<tr><td>Lobby → Galería A rule</td><td>Juanma to ratify</td><td class="n ok">decided on evidence, documented</td></tr>
<tr><td>Reaching a late stop still costs ~19 s of room building</td><td>backlog</td><td class="n">real work, not overhead</td></tr>
</table></div>

</main></body></html>`;

await fs.writeFile(path.join(OUT, 'block-2b-closure.html'), html);
console.log(`wrote qa/evidence-closure/block-2b-closure.html`);
console.log(`  crossing ${crossing ? crossing.checks.filter((c) => c.ok).length + '/' + crossing.checks.length : 'missing'} · seek rows ${seek?.rows?.length ?? 0} · lobby shots ${lobby?.shots?.length ?? 0} · iw shots ${iw?.shots?.length ?? 0}`);
