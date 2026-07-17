import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.argv[2] || 4173);
const root = path.resolve(process.cwd(), process.argv[3] || '.');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4'
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const resolved = path.resolve(root, decoded || 'index.html');
  return resolved.startsWith(root) ? resolved : null;
}

const server = http.createServer(async (req, res) => {
  try {
    let file = safePath(req.url || '/');
    if (!file) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const stat = await fs.stat(file).catch(() => null);
    if (stat?.isDirectory()) file = path.join(file, 'index.html');
    const body = await fs.readFile(file);
    res.writeHead(200, {
      'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Static test server listening on http://127.0.0.1:${port}`);
});
