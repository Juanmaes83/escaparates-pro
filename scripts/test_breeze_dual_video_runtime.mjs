const CDP = 'http://127.0.0.1:9222';
const PAGE = 'http://127.0.0.1:8765/index.html';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${CDP}/json/version`);
      if (r.ok) return;
    } catch (_) {}
    await sleep(250);
  }
  throw new Error('Chrome DevTools endpoint did not start');
}

await waitForChrome();

let pages = await (await fetch(`${CDP}/json`)).json();
let page = pages.find(p => p.type === 'page');
if (!page) throw new Error('No Chrome page target');

const ws = new WebSocket(page.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
ws.onmessage = e => {
  const msg = JSON.parse(e.data);
  if (!msg.id) return;
  const p = pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
};
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: PAGE });
await sleep(8000);

const expression = String.raw`
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const deadline = Date.now() + 20000;
  while (!window.__BREEZE_STUDIO_PRO__ && Date.now() < deadline) await sleep(250);
  if (!window.__BREEZE_STUDIO_PRO__) return { status: 'FAIL', reason: 'Breeze API not mounted' };
  if (!navigator.gpu) return { status: 'SKIP_NO_WEBGPU', reason: 'navigator.gpu unavailable in CI Chrome' };

  const { app } = window.__BREEZE_STUDIO_PRO__;
  const makeFile = async (url, name) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error('fixture fetch failed: ' + url);
    const blob = await r.blob();
    return new File([blob], name, { type: blob.type || 'video/webm', lastModified: Date.now() });
  };

  try {
    const bgFile = await makeFile('/bg.webm', 'dual-bg.webm');
    const clothFile = await makeFile('/cloth.webm', 'dual-cloth.webm');
    await app.setAppliedBackgroundFile(bgFile);
    await app.applyClothFile(clothFile);

    const bg = app.backgroundVideo;
    const cloth = app.clothGeometry?.userMediaVideo;
    if (!bg || !cloth) return { status: 'FAIL', reason: 'Both video elements were not created' };

    let bgUpdates = 0, clothUpdates = 0, frames = 0;
    bg.addEventListener('timeupdate', () => bgUpdates++);
    cloth.addEventListener('timeupdate', () => clothUpdates++);
    let alive = true;
    const beat = () => { if (!alive) return; frames++; requestAnimationFrame(beat); };
    requestAnimationFrame(beat);

    // Run long enough for the 3-second fixtures to loop several times.
    await sleep(24000);
    alive = false;

    const result = {
      status: 'PASS',
      bgUpdates,
      clothUpdates,
      frames,
      bgPaused: bg.paused,
      clothPaused: cloth.paused,
      bgReadyState: bg.readyState,
      clothReadyState: cloth.readyState,
      bgTime: bg.currentTime,
      clothTime: cloth.currentTime,
      clothFrameLoopActive: !!app.clothGeometry?.userMediaFrameLoopActive
    };
    if (bg.paused || cloth.paused) result.status = 'FAIL';
    if (bg.readyState < 2 || cloth.readyState < 2) result.status = 'FAIL';
    if (bgUpdates < 8 || clothUpdates < 8) result.status = 'FAIL';
    if (frames < 120) result.status = 'FAIL';
    if (!result.clothFrameLoopActive) result.status = 'FAIL';
    return result;
  } catch (err) {
    return { status: 'FAIL', reason: String(err?.stack || err) };
  }
})()
`;

const evaluated = await send('Runtime.evaluate', {
  expression,
  awaitPromise: true,
  returnByValue: true,
  timeout: 40000
});
const value = evaluated?.result?.value;
console.log('BREEZE_DUAL_VIDEO_RESULT=' + JSON.stringify(value));
ws.close();

if (!value) process.exit(2);
if (value.status === 'SKIP_NO_WEBGPU') process.exit(3);
if (value.status !== 'PASS') process.exit(1);
