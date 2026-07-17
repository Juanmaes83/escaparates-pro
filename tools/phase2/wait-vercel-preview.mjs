import { mkdirSync, writeFileSync } from 'node:fs';

const base = String(process.env.VERCEL_BASE_URL || '').replace(/\/+$/, '');
const sha = process.env.PR_HEAD_SHA || process.env.GITHUB_SHA || '';
if (!base) throw new Error('VERCEL_BASE_URL is required');

async function fetchText(path) {
  const response = await fetch(base + path, { redirect: 'follow', cache: 'no-store' });
  return { status: response.status, text: await response.text() };
}

for (let attempt = 1; attempt <= 60; attempt += 1) {
  try {
    const [studio, bridge, client] = await Promise.all([
      fetchText('/studio.html'),
      fetchText('/js/projects/studio-r2-bridge.js'),
      fetchText('/js/projects/project-client.js')
    ]);
    const ready = studio.status === 200 && bridge.status === 200 && client.status === 200
      && bridge.text.includes('StudioR2Bridge')
      && client.text.includes('escaparates-pro-api-phase2-staging-phase2-cloud.up.railway.app');
    if (ready) {
      mkdirSync('tests/diagnostics', { recursive: true });
      writeFileSync('tests/diagnostics/vercel-preview-ready.json', JSON.stringify({ ok: true, attempt, base, sha }, null, 2));
      console.log(JSON.stringify({ ok: true, attempt, base, sha }));
      process.exit(0);
    }
    console.log(JSON.stringify({ ok: false, attempt, studio: studio.status, bridge: bridge.status, client: client.status }));
  } catch (error) {
    console.log(JSON.stringify({ ok: false, attempt, error: error.message }));
  }
  await new Promise(resolve => setTimeout(resolve, 10000));
}

throw new Error('Vercel preview did not publish the current Phase 2 files in time');
