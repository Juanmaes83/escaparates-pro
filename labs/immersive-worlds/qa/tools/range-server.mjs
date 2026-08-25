// Chromium's media stack needs byte-range requests; python's http.server has none.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = '/home/user/escaparates-pro';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json',
  '.css':'text/css', '.jpg':'image/jpeg', '.png':'image/png', '.webm':'video/webm' };
http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  let stat; try { stat = fs.statSync(file); } catch { res.writeHead(404); return res.end('nf'); }
  if (stat.isDirectory()) { res.writeHead(404); return res.end('dir'); }
  const type = MIME[path.extname(file)] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m[1] ? parseInt(m[1], 10) : 0;
    const end = m[2] ? parseInt(m[2], 10) : stat.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': stat.size });
  fs.createReadStream(file).pipe(res);
}).listen(4190, '127.0.0.1', () => console.log('range server on 4190'));
