import { mkdirSync, writeFileSync } from 'node:fs';

const repository = process.env.GITHUB_REPOSITORY || '';
const token = process.env.GITHUB_TOKEN || '';
const sha = process.env.PR_HEAD_SHA || process.env.GITHUB_SHA || '';
const explicit = String(process.env.VERCEL_BASE_URL || '').replace(/\/+$/, '');

if (!repository) throw new Error('GITHUB_REPOSITORY is required');
if (!sha) throw new Error('PR_HEAD_SHA or GITHUB_SHA is required');

const [owner, repo] = repository.split('/');
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'escaparates-pro-phase2-qa'
};
if (token) headers.Authorization = `Bearer ${token}`;

function vercelOrigin(value) {
  const match = String(value || '').match(/https:\/\/[a-z0-9.-]+\.vercel\.app(?:\/[^\s"'<>)]*)?/i);
  if (!match) return '';
  return new URL(match[0]).origin;
}

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`GitHub API ${response.status} for ${path}: ${text.slice(0, 200)}`);
  }
  return response.json();
}

async function candidatesFromGitHub() {
  const urls = [];
  const add = (url, source) => {
    const origin = vercelOrigin(url);
    if (origin && !urls.some(item => item.base === origin)) urls.push({ base: origin, source });
  };

  const statuses = await github(`/repos/${owner}/${repo}/commits/${sha}/statuses?per_page=100`).catch(() => []);
  for (const status of statuses) add(status.target_url, `status:${status.context || 'unknown'}`);

  const checks = await github(`/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`).catch(() => ({ check_runs: [] }));
  for (const check of checks.check_runs || []) {
    add(check.details_url, `check:${check.name || 'details'}`);
    add(check.html_url, `check:${check.name || 'html'}`);
  }

  const deployments = await github(`/repos/${owner}/${repo}/deployments?sha=${encodeURIComponent(sha)}&per_page=100`).catch(() => []);
  for (const deployment of deployments) {
    add(deployment.environment_url, `deployment:${deployment.id}`);
    add(deployment.url, `deployment:${deployment.id}`);
    const statusesForDeployment = await github(`/repos/${owner}/${repo}/deployments/${deployment.id}/statuses?per_page=20`).catch(() => []);
    for (const status of statusesForDeployment) {
      add(status.environment_url, `deployment-status:${deployment.id}`);
      add(status.target_url, `deployment-status:${deployment.id}`);
      add(status.log_url, `deployment-status:${deployment.id}`);
    }
  }

  return urls;
}

async function probe(base) {
  const paths = ['/studio.html', '/js/projects/studio-r2-bridge.js', '/js/projects/project-client.js'];
  const results = [];
  for (const path of paths) {
    const response = await fetch(base + path, { redirect: 'follow', cache: 'no-store' });
    const text = await response.text();
    results.push({
      path,
      status: response.status,
      finalUrl: response.url,
      hasStudio: text.includes('Studio'),
      hasBridge: text.includes('StudioR2Bridge'),
      hasApi: text.includes('escaparates-pro-api-phase2-staging-phase2-cloud.up.railway.app')
    });
  }
  return {
    ok: results[0].status === 200 && results[1].status === 200 && results[1].hasBridge && results[2].status === 200 && results[2].hasApi,
    results
  };
}

let selected = null;
const attempts = [];
const maxAttempts = explicit ? 1 : Number(process.env.VERCEL_RESOLVE_ATTEMPTS || 30);

for (let attempt = 1; attempt <= maxAttempts && !selected; attempt += 1) {
  const candidates = explicit ? [{ base: explicit, source: 'env:VERCEL_BASE_URL' }] : await candidatesFromGitHub();
  if (!candidates.length) attempts.push({ attempt, ok: false, error: 'no-candidates-yet' });

  for (const candidate of candidates) {
    try {
      const check = await probe(candidate.base);
      attempts.push({ attempt, ...candidate, ...check });
      if (check.ok) {
        selected = candidate;
        break;
      }
    } catch (error) {
      attempts.push({ attempt, ...candidate, ok: false, error: error.message });
    }
  }

  if (!selected && attempt < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

mkdirSync('tests/diagnostics', { recursive: true });
const matrix = {
  ok: Boolean(selected),
  sha,
  repository,
  previewUrl: selected ? selected.base : '',
  source: selected ? selected.source : '',
  candidates: attempts,
  matrix: {
    catalogLinks: true,
    directRoutes: true,
    duplication: true,
    unknownTemplate: true,
    nestedSchema: true,
    mediaByType: true,
    templateSwitchingIsolation: true,
    localModeCloudButtons: true,
    viewports: ['desktop', 'tablet', 'mobile']
  }
};
writeFileSync('tests/diagnostics/matrix.json', JSON.stringify(matrix, null, 2));

if (!selected) {
  console.error(JSON.stringify(matrix, null, 2));
  throw new Error(`No Vercel preview found for ${sha}`);
}

if (process.env.GITHUB_ENV) {
  await import('node:fs').then(fs => fs.appendFileSync(process.env.GITHUB_ENV, `VERCEL_BASE_URL=${selected.base}\n`));
}
console.log(JSON.stringify({ ok: true, sha, url: selected.base, source: selected.source }));
