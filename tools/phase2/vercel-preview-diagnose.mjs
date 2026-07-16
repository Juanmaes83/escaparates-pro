import { mkdirSync, writeFileSync } from 'node:fs';

const base = String(process.env.VERCEL_BASE_URL || '').replace(/\/+$/, '');
if (!base) throw new Error('VERCEL_BASE_URL is required');

const paths = [
  '/studio.html',
  '/js/projects/studio-r2-bridge.js',
  '/js/projects/project-client.js'
];
const results = [];

for (const path of paths) {
  try {
    const response = await fetch(base + path, { redirect: 'follow', cache: 'no-store' });
    const text = await response.text();
    results.push({
      path,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get('content-type'),
      server: response.headers.get('server'),
      vercelId: response.headers.get('x-vercel-id'),
      length: text.length,
      hasStudio: text.includes('Customization Studio'),
      hasBridge: text.includes('StudioR2Bridge'),
      hasApi: text.includes('escaparates-pro-api-phase2-staging-phase2-cloud.up.railway.app'),
      sample: text.slice(0, 120).replace(/\s+/g, ' ')
    });
  } catch (error) {
    results.push({ path, error: error.message });
  }
}

mkdirSync('tests/diagnostics', { recursive: true });
writeFileSync('tests/diagnostics/vercel-preview.json', JSON.stringify({ base, results }, null, 2));
console.log(JSON.stringify({ base, results }));
