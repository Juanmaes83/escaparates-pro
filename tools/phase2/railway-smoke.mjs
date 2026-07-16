#!/usr/bin/env node

const base = String(process.argv[2] || process.env.API_BASE_URL || '').replace(/\/+$/, '');
if (!/^https:\/\//i.test(base)) {
  console.error('Usage: node tools/phase2/railway-smoke.mjs https://api.example.com');
  process.exit(2);
}

const checks = [
  { path: '/health', validate: (body) => body && (body.status === 'ok' || body.status === 'healthy') },
  { path: '/ready', validate: (body) => body && body.status === 'ready' && body.database === 'connected' },
  { path: '/v1', validate: (body) => body && body.status === 'ok' && body.version === '1.0.0' },
];

let failed = false;
for (const check of checks) {
  const url = base + check.path;
  const started = Date.now();
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'escaparates-pro-phase2-smoke/1.0' },
      redirect: 'follow',
    });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = null; }
    const ok = response.status === 200 && check.validate(body);
    console.log(JSON.stringify({
      url,
      status: response.status,
      contentType: response.headers.get('content-type'),
      durationMs: Date.now() - started,
      ok,
      body: body ?? text,
    }, null, 2));
    if (!ok) failed = true;
  } catch (error) {
    failed = true;
    console.error(JSON.stringify({ url, ok: false, error: error.message }, null, 2));
  }
}

process.exit(failed ? 1 : 0);
